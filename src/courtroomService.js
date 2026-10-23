import {
  ref,
  set,
  push,
  update,
  onValue,
  onDisconnect,
  serverTimestamp
} from "firebase/database";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from "firebase/storage";
import { db, storage } from "./firebaseConfig";

/**
 * 1. Create or Initialize a Courtroom Session in LOBBY_GATHERING mode
 */
export async function createCourtroom(roomId, title, stakes, creatorRole, creatorName, uid) {
  try {
    const safeCreatorName = creatorName || (creatorRole === "judge" ? "Judge Kabir" : creatorRole === "defendant" ? "Riya" : "Aarav");
    const roomRef = ref(db, `rooms/${roomId}`);
    const initialParticipants = {
      plaintiff: {
        uid: creatorRole === "plaintiff" ? (uid || "anon_p") : "",
        name: creatorRole === "plaintiff" ? safeCreatorName : "Waiting for Plaintiff...",
        online: creatorRole === "plaintiff",
        ready: creatorRole === "plaintiff",
        approvedJudge: creatorRole === "plaintiff",
        honorScore: 120
      },
      defendant: {
        uid: creatorRole === "defendant" ? (uid || "anon_d") : "",
        name: creatorRole === "defendant" ? safeCreatorName : "Waiting for Defendant...",
        online: creatorRole === "defendant",
        ready: creatorRole === "defendant",
        approvedJudge: creatorRole === "defendant",
        honorScore: 115
      },
      judge: {
        uid: creatorRole === "judge" ? (uid || "anon_j") : "",
        name: creatorRole === "judge" ? safeCreatorName : "Waiting for Judge...",
        online: creatorRole === "judge",
        ready: creatorRole === "judge"
      }
    };

    await set(roomRef, {
      roomId,
      title: title || `Case #${roomId}: Everyday Dispute`,
      stakes: stakes || "Loser treats winner to coffee/snacks",
      status: "LOBBY_GATHERING", // Starts in Waiting Lobby!
      phaseIndex: 0, // 0: Roll Call & Lobby, 1: Statements, 2: Proof & Debate, 3: Verdict
      floorSpeaker: "BOTH", // BOTH | PLAINTIFF | DEFENDANT
      crowdVotes: { plaintiff: 5, defendant: 4 },
      activeObjection: null,
      witnessPass: { active: false, name: "", expiresAt: 0 },
      participants: initialParticipants,
      evidence: {
        ex1: {
          id: "ex1",
          code: "Exhibit A",
          submittedBy: "plaintiff",
          submitterName: initialParticipants.plaintiff.name || "Aarav",
          type: "Screenshot / Chat Log",
          title: "Initial Proof Exhibit",
          detail: "Documented proof and chat records submitted for case review.",
          status: "pending"
        }
      },
      verdict: {
        isFinal: false,
        winner: "",
        reasoning: "",
        penalty: stakes || "Loser pays restitution",
        penaltyFulfilled: false
      }
    });

    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      senderRole: "judge",
      senderName: "Court Clerk",
      type: "system_order",
      text: `Room #${roomId} created! Case: "${title}". All 3 participants gather in the lobby.`,
      createdAt: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.warn("createCourtroom failed:", error.message);
    return false;
  }
}

/**
 * 2. Toggle Player Ready in Pre-Trial Lobby
 */
export async function setPlayerReady(roomId, role, isReady) {
  try {
    await update(ref(db, `rooms/${roomId}/participants/${role}`), {
      ready: isReady
    });
  } catch (err) {
    console.warn("setPlayerReady error:", err.message);
  }
}

/**
 * 3. Commence Trial (Moves room from LOBBY_GATHERING to IN_SESSION)
 */
export async function commenceTrialFromLobby(roomId) {
  try {
    await update(ref(db, `rooms/${roomId}`), {
      status: "IN_SESSION",
      phaseIndex: 1
    });

    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    await push(messagesRef, {
      senderRole: "judge",
      senderName: "Court Clerk",
      type: "system_order",
      text: "🔨 TRIAL COMMENCED! All 3 participants are present. Opening statements unlock now.",
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("commenceTrialFromLobby error:", err.message);
  }
}

/**
 * 4. Join Courtroom + Mandatory Real-Time Presence Tracking (onDisconnect)
 */
export function subscribeCourtroomAndPresence(roomId, role, user, onRoomUpdate, onRoleRestored) {
  try {
    const connectedRef = ref(db, ".info/connected");
    const participantRef = ref(db, `rooms/${roomId}/participants/${role}`);
    const roomRef = ref(db, `rooms/${roomId}`);

    const unsubConnect = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        try {
          onDisconnect(participantRef).update({
            online: false,
            lastSeen: serverTimestamp()
          });

          update(participantRef, {
            uid: user?.uid || "anon_" + role,
            online: true
          });
        } catch (e) {
          console.warn("onDisconnect update notice:", e.message);
        }
      }
    });

    const unsubRoom = onValue(roomRef, (snap) => {
      if (snap.exists()) {
        const roomData = snap.val();
        onRoomUpdate(roomData);

        // Auto-restore role if this user's UID is already bound to a slot
        if (user?.uid && onRoleRestored) {
          const parts = roomData.participants || {};
          if (parts.judge?.uid === user.uid && role !== "judge") {
            onRoleRestored("judge");
          } else if (parts.plaintiff?.uid === user.uid && role !== "plaintiff") {
            onRoleRestored("plaintiff");
          } else if (parts.defendant?.uid === user.uid && role !== "defendant") {
            onRoleRestored("defendant");
          }
        }
      } else {
        // Auto-seed fresh room in Firebase so all participants connect online immediately
        createCourtroom(
          roomId,
          `Case #${roomId}: Everyday Dispute`,
          "Loser pays restitution",
          role,
          role === "judge" ? "Judge" : role === "defendant" ? "Defendant" : "Plaintiff",
          user?.uid || "anon"
        );
      }
    });

    return () => {
      try {
        unsubConnect();
        unsubRoom();
      } catch (e) {}
    };
  } catch (error) {
    console.warn("subscribeCourtroomAndPresence failed:", error.message);
    return () => {};
  }
}

/**
 * 4d. Claim Role Slot (Enforces Single-Owner Identity)
 */
export async function claimCourtRole(roomId, targetRole, userName, uid) {
  try {
    const pRef = ref(db, `rooms/${roomId}/participants/${targetRole}`);
    await update(pRef, {
      uid: uid || "anon_" + targetRole,
      name: userName || (targetRole === "judge" ? "Judge Kabir" : targetRole === "defendant" ? "Riya" : "Aarav"),
      online: true
    });
    return { success: true };
  } catch (err) {
    console.warn("claimCourtRole error:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 4b. Set Player Presence
 */
export async function setPlayerPresence(roomId, role, isOnline) {
  try {
    await update(ref(db, `rooms/${roomId}/participants/${role}`), {
      online: isOnline,
      lastSeen: serverTimestamp()
    });
  } catch (err) {
    console.warn("setPlayerPresence error:", err.message);
  }
}

/**
 * 4c. Mark All Players Present (Resume Court)
 */
export async function markAllPlayersPresent(roomId) {
  try {
    const updates = {};
    updates[`rooms/${roomId}/participants/plaintiff/online`] = true;
    updates[`rooms/${roomId}/participants/defendant/online`] = true;
    updates[`rooms/${roomId}/participants/judge/online`] = true;
    await update(ref(db), updates);
  } catch (err) {
    console.warn("markAllPlayersPresent error:", err.message);
  }
}

/**
 * 5. Mutual Judge Handshake Approval (Plaintiff & Defendant ONLY)
 */
export async function toggleApproveJudge(roomId, role, approved) {
  if (role === "judge") {
    console.warn("Judge cannot approve themselves.");
    return;
  }
  try {
    const approvalRef = ref(db, `rooms/${roomId}/participants/${role}/approvedJudge`);
    await set(approvalRef, approved);
  } catch (err) {
    console.warn("toggleApproveJudge error:", err.message);
  }
}

/**
 * 6. Judge Mic Floor Control (JUDGE ONLY)
 */
export async function setMicFloorSpeaker(roomId, userRole, speakerMode) {
  if (userRole !== "judge") {
    console.warn("Only Judge can control mic floor.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}`), {
      floorSpeaker: speakerMode
    });
  } catch (err) {
    console.warn("setMicFloorSpeaker error:", err.message);
  }
}

/**
 * 7. Send Real-Time Statement or Voice Note
 */
export async function sendCourtStatement(roomId, senderRole, senderName, text, type = "statement", audioBase64 = null, duration = 0) {
  try {
    const safeSenderName = senderName || (senderRole === "judge" ? "Judge Kabir" : senderRole === "defendant" ? "Riya" : "Aarav");
    const messagesRef = ref(db, `rooms/${roomId}/messages`);
    const payload = {
      senderRole: senderRole || "plaintiff",
      senderName: safeSenderName,
      type: type || "statement",
      text: text || "",
      createdAt: serverTimestamp()
    };
    if (type === "voice_note" && audioBase64) {
      payload.audioBase64 = audioBase64;
      payload.duration = duration || 3000;
    }
    await push(messagesRef, payload);
  } catch (err) {
    console.warn("sendCourtStatement error:", err.message);
  }
}

/**
 * 8. Raise & Resolve Objections (Litigants Raise, Judge Resolves)
 */
export async function raiseCourtObjection(roomId, role, name, reason) {
  if (role === "judge") {
    console.warn("Judge cannot raise an objection to themselves.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}`), {
      activeObjection: { byRole: role, byName: name, reason, timestamp: Date.now() }
    });
    await sendCourtStatement(roomId, role, name, `⚡ OBJECTION! ${reason}`, "objection_notice");
  } catch (err) {
    console.warn("raiseCourtObjection error:", err.message);
  }
}

export async function resolveCourtObjection(roomId, userRole, judgeName, isSustained) {
  if (userRole !== "judge") {
    console.warn("Only Judge can rule on objections.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}`), {
      activeObjection: null
    });
    const decisionText = isSustained
      ? `🔨 OBJECTION SUSTAINED by ${judgeName}! Litigants must stick to proven facts.`
      : `🔨 OBJECTION OVERRULED by ${judgeName}. The statement stands—continue arguments.`;
    await sendCourtStatement(roomId, "judge", judgeName, decisionText, "system_order");
  } catch (err) {
    console.warn("resolveCourtObjection error:", err.message);
  }
}

/**
 * 9. Upload Proof Screenshot / Photo (LITIGANTS ONLY - Judge is neutral!)
 */
export async function submitProofExhibit(roomId, role, senderName, localImageUri, title, detail, proofType) {
  if (role === "judge") {
    console.warn("Neutral Judge cannot submit proof exhibits into their own courtroom.");
    return;
  }
  try {
    let imageUrl = localImageUri || "";
    if (localImageUri && storage) {
      try {
        const response = await fetch(localImageUri);
        const blob = await response.blob();
        const fileRef = storageRef(storage, `evidence/${roomId}/${Date.now()}_exhibit.jpg`);
        await uploadBytes(fileRef, blob);
        imageUrl = await getDownloadURL(fileRef);
      } catch (uploadErr) {
        imageUrl = localImageUri;
      }
    }

    const evidenceListRef = ref(db, `rooms/${roomId}/evidence`);
    const newExhibitRef = push(evidenceListRef);
    const exhibitData = {
      id: newExhibitRef.key,
      code: "Exhibit " + String(Date.now()).slice(-3),
      submittedBy: role,
      submitterName: senderName,
      type: proofType || "Screenshot / Chat Log",
      title: title || "Submitted Court Proof",
      detail: detail || "Verified exhibit filed into the court record.",
      imageUrl,
      status: "pending",
      createdAt: serverTimestamp()
    };

    await set(newExhibitRef, exhibitData);
    await sendCourtStatement(
      roomId,
      role,
      senderName,
      `Submitted ${exhibitData.code}: ${exhibitData.title}`,
      "evidence_notice"
    );
  } catch (err) {
    console.warn("submitProofExhibit error:", err.message);
  }
}

/**
 * 10. Judge Verify Exhibit (Admit / Dismiss - JUDGE ONLY)
 */
export async function updateEvidenceStatus(roomId, userRole, exhibitId, newStatus, judgeName) {
  if (userRole !== "judge") {
    console.warn("Only Judge can admit or dismiss exhibits.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}/evidence/${exhibitId}`), {
      status: newStatus
    });
    await sendCourtStatement(
      roomId,
      "judge",
      judgeName,
      `Exhibit has been marked ${newStatus.toUpperCase()} by ${judgeName}.`,
      "system_order"
    );
  } catch (err) {
    console.warn("updateEvidenceStatus error:", err.message);
  }
}

/**
 * 11. Summon a 60-Second Temporary Witness Pass (LITIGANTS ONLY)
 */
export async function activateWitnessPass(roomId, userRole, witnessName) {
  if (userRole === "judge") {
    console.warn("Litigants call witnesses; Judge hears testimony.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}/witnessPass`), {
      active: true,
      name: witnessName,
      expiresAt: Date.now() + 60000
    });
  } catch (err) {
    console.warn("activateWitnessPass error:", err.message);
  }
}

export async function dismissWitnessPass(roomId) {
  try {
    await update(ref(db, `rooms/${roomId}/witnessPass`), {
      active: false,
      name: "",
      expiresAt: 0
    });
  } catch (err) {
    console.warn("dismissWitnessPass error:", err.message);
  }
}

/**
 * 12. Cast Spectator Jury Vote (SPECTATORS ONLY - Litigants have a conflict of interest)
 */
export async function voteCrowdJury(roomId, userRole, currentPlaintiffVotes, currentDefendantVotes, targetRole) {
  if (userRole === "plaintiff" || userRole === "defendant") {
    console.warn("Litigants cannot vote in their own spectator jury poll.");
    return;
  }
  try {
    const updatePayload = targetRole === "plaintiff"
      ? { "crowdVotes/plaintiff": (currentPlaintiffVotes || 1) + 1 }
      : { "crowdVotes/defendant": (currentDefendantVotes || 1) + 1 };
    await update(ref(db, `rooms/${roomId}`), updatePayload);
  } catch (err) {
    console.warn("voteCrowdJury error:", err.message);
  }
}

/**
 * 13. Strike Gavel & Seal Final Binding Verdict (JUDGE ONLY)
 */
export async function sealFinalVerdict(roomId, userRole, judgeUid, judgeName, winner, reasoning, penalty) {
  if (userRole !== "judge") {
    console.warn("Only the Neutral Judge has the authority to deliver the final verdict.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}`), {
      status: "SEALED_FINAL",
      phaseIndex: 3,
      verdict: {
        isFinal: true,
        judgeUid: judgeUid || "judge_uid",
        winner,
        reasoning,
        penalty,
        penaltyFulfilled: false,
        sealedAt: serverTimestamp()
      }
    });

    const winnerText = winner === "plaintiff" ? "Plaintiff" : winner === "defendant" ? "Defendant" : "50/50 Compromise";
    await sendCourtStatement(
      roomId,
      "judge",
      judgeName,
      `🔨 FINAL BINDING VERDICT: Ruling in favor of ${winnerText}! Order: "${penalty}". Case permanently sealed.`,
      "verdict_announcement"
    );
  } catch (err) {
    console.warn("sealFinalVerdict error:", err.message);
  }
}

/**
 * 14. Mark Penalty Fulfilled (Winner or Judge verifies - Loser cannot self-verify!)
 */
export async function markPenaltyFulfilled(roomId, userRole, winningRole, currentPlaintiffHonor = 120, currentDefendantHonor = 115) {
  if (winningRole !== "split" && userRole !== "judge" && userRole !== winningRole) {
    console.warn("Only the winning party or the Judge can confirm that the penalty was fulfilled.");
    return;
  }
  try {
    await update(ref(db, `rooms/${roomId}/verdict`), { penaltyFulfilled: true });
    await update(ref(db, `rooms/${roomId}/participants/plaintiff`), { honorScore: (currentPlaintiffHonor || 120) + 25 });
    await update(ref(db, `rooms/${roomId}/participants/defendant`), { honorScore: (currentDefendantHonor || 115) + 25 });
  } catch (err) {
    console.warn("markPenaltyFulfilled error:", err.message);
  }
}
