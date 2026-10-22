import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  Share,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { ensureSignedIn } from "./src/firebaseConfig";
import {
  subscribeCourtroomAndPresence,
  createCourtroom,
  setPlayerReady,
  commenceTrialFromLobby,
  sendCourtStatement,
  submitProofExhibit,
  updateEvidenceStatus,
  setMicFloorSpeaker,
  raiseCourtObjection,
  resolveCourtObjection,
  activateWitnessPass,
  dismissWitnessPass,
  voteCrowdJury,
  sealFinalVerdict,
  markPenaltyFulfilled,
  toggleApproveJudge,
  setPlayerPresence,
  markAllPlayersPresent
} from "./src/courtroomService";

import PreTrialLobby from "./src/components/PreTrialLobby";
import CourtHeader from "./src/components/CourtHeader";
import RecessBanner from "./src/components/RecessBanner";
import ObjectionBanner from "./src/components/ObjectionBanner";
import WitnessBanner from "./src/components/WitnessBanner";
import CourtChatTab from "./src/components/CourtChatTab";
import EvidenceLockerTab from "./src/components/EvidenceLockerTab";
import VerdictTab from "./src/components/VerdictTab";
import LobbyTab, { PRESET_CASES } from "./src/components/LobbyTab";
import BottomTabBar from "./src/components/BottomTabBar";

export default function App() {
  return (
    <SafeAreaProvider>
      <CourtroomScreen />
    </SafeAreaProvider>
  );
}

function CourtroomScreen() {
  const [roomId, setRoomId] = useState("4829");
  const [role, setRole] = useState("plaintiff"); // 'plaintiff' | 'defendant' | 'judge' | 'spectator'
  const [activeTab, setActiveTab] = useState("chat");
  const [room, setRoom] = useState(null);

  const defaultPreset = PRESET_CASES[0];
  const [fallbackState, setFallbackState] = useState({
    title: `Case #${roomId}: ${defaultPreset.title}`,
    stakes: defaultPreset.stakes,
    status: "IN_SESSION", // 'LOBBY_GATHERING' | 'IN_SESSION' | 'SEALED_FINAL'
    floorSpeaker: "BOTH",
    crowdVotes: { plaintiff: 5, defendant: 4 },
    activeObjection: null,
    witnessPass: { active: false, name: "Sneha", secondsLeft: 60 },
    participants: {
      plaintiff: { name: defaultPreset.plaintiff, online: true, ready: true, approvedJudge: true, honorScore: 120 },
      defendant: { name: defaultPreset.defendant, online: true, ready: true, approvedJudge: true, honorScore: 115 },
      judge: { name: defaultPreset.judge, online: true, ready: true }
    },
    messages: [
      {
        id: "m1",
        senderRole: "judge",
        senderName: defaultPreset.judge,
        type: "system_order",
        text: "Court is now in session. All 3 participants are present. State your opening arguments."
      },
      {
        id: "m2",
        senderRole: "plaintiff",
        senderName: defaultPreset.plaintiff,
        type: "statement",
        text: "Your Honor, we split the Netflix account 50/50. Last night I was kicked out mid-movie because 4 screens were active!"
      },
      {
        id: "m3",
        senderRole: "defendant",
        senderName: defaultPreset.defendant,
        type: "statement",
        text: "I only logged in on my phone and TV! How do you know your own brother didn't use your profile?"
      }
    ],
    evidence: [
      {
        id: "ex1",
        code: "Exhibit A",
        submittedBy: "plaintiff",
        submitterName: defaultPreset.plaintiff,
        type: "Screenshot / Chat Log",
        title: "Device Manager Screenshot",
        detail: "Shows 3 active streams from Hostel Block B at 9:48 PM during the match.",
        status: "admitted"
      }
    ],
    verdict: {
      isFinal: false,
      winner: "",
      reasoning: "Based on Exhibit A, unauthorized device logins were established.",
      penalty: defaultPreset.stakes,
      penaltyFulfilled: false
    }
  });

  useEffect(() => {
    let unsubscribe = null;
    ensureSignedIn()
      .then((user) => {
        unsubscribe = subscribeCourtroomAndPresence(roomId, role, user, (liveRoom) => {
          if (liveRoom) {
            setRoom(liveRoom);
          }
        });
      })
      .catch((err) => {
        console.warn("Using offline demo state mode:", err.message);
      });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [roomId, role]);

  const activeRoom = room || fallbackState;
  const isGatheringLobby = activeRoom.status === "LOBBY_GATHERING";
  const participants = activeRoom.participants || fallbackState.participants;
  const verdict = activeRoom.verdict || fallbackState.verdict;
  const messages = activeRoom.messages
    ? Array.isArray(activeRoom.messages)
      ? activeRoom.messages
      : Object.values(activeRoom.messages)
    : fallbackState.messages;
  const evidence = activeRoom.evidence
    ? Array.isArray(activeRoom.evidence)
      ? activeRoom.evidence
      : Object.values(activeRoom.evidence)
    : fallbackState.evidence;

  const allPresent =
    Boolean(participants?.plaintiff?.online) &&
    Boolean(participants?.defendant?.online) &&
    Boolean(participants?.judge?.online);

  const bothApprovedJudge =
    Boolean(participants?.plaintiff?.approvedJudge) &&
    Boolean(participants?.defendant?.approvedJudge);

  const floorSpeaker = activeRoom.floorSpeaker || "BOTH";
  const isJudge = role === "judge";
  const canSpeak =
    allPresent &&
    bothApprovedJudge &&
    !verdict?.isFinal &&
    (isJudge || floorSpeaker === "BOTH" || floorSpeaker === role.toUpperCase());

  const currentSpeakerName =
    participants?.[role]?.name ||
    (role === "judge" ? "Judge Kabir" : role === "defendant" ? "Riya" : role === "plaintiff" ? "Aarav" : "Spectator");

  // Handlers
  const handleTogglePresence = (targetRole) => {
    const isCurrentOnline = participants?.[targetRole]?.online;
    const nextState = !isCurrentOnline;
    setPlayerPresence(roomId, targetRole, nextState);
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: {
          ...prev.participants,
          [targetRole]: {
            ...prev.participants?.[targetRole],
            online: nextState
          }
        }
      };
    });
    setFallbackState((prev) => ({
      ...prev,
      participants: {
        ...prev.participants,
        [targetRole]: {
          ...prev.participants[targetRole],
          online: nextState
        }
      }
    }));
  };

  const handleMarkAllPresent = () => {
    markAllPlayersPresent(roomId);
    setRoom((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        participants: {
          ...prev.participants,
          plaintiff: { ...prev.participants?.plaintiff, online: true },
          defendant: { ...prev.participants?.defendant, online: true },
          judge: { ...prev.participants?.judge, online: true }
        }
      };
    });
    setFallbackState((prev) => ({
      ...prev,
      participants: {
        plaintiff: { ...prev.participants.plaintiff, online: true },
        defendant: { ...prev.participants.defendant, online: true },
        judge: { ...prev.participants.judge, online: true }
      }
    }));
  };

  const handleToggleApproveJudge = (targetRole) => {
    if (role === "judge") {
      Alert.alert("Conflict of Interest", "A Judge cannot approve themselves!");
      return;
    }
    const current = participants?.[targetRole]?.approvedJudge;
    toggleApproveJudge(roomId, targetRole, !current);
    setFallbackState((prev) => ({
      ...prev,
      participants: {
        ...prev.participants,
        [targetRole]: {
          ...prev.participants[targetRole],
          approvedJudge: !current
        }
      }
    }));
  };

  const handleSendMessage = (text) => {
    sendCourtStatement(roomId, role, currentSpeakerName, text);
    setFallbackState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: "m_" + Date.now(),
          senderRole: role,
          senderName: currentSpeakerName,
          type: "statement",
          text
        }
      ]
    }));
  };

  const handlePickProof = async () => {
    if (isJudge) {
      Alert.alert("Judicial Neutrality", "Neutral Judge cannot submit proof exhibits into their own courtroom!");
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const uri = result.assets[0].uri;
        submitProofExhibit(
          roomId,
          role,
          currentSpeakerName,
          uri,
          "Uploaded Mobile Proof",
          "Timestamped screenshot submitted from camera roll.",
          "Screenshot / Chat Log"
        );

        setFallbackState((prev) => {
          const exCount = prev.evidence.length;
          const letter = String.fromCharCode(65 + exCount);
          return {
            ...prev,
            evidence: [
              ...prev.evidence,
              {
                id: "ex_" + Date.now(),
                code: "Exhibit " + letter,
                submittedBy: role,
                submitterName: currentSpeakerName,
                type: "Screenshot / Chat Log",
                title: "Uploaded Mobile Proof",
                detail: "Timestamped screenshot submitted from camera roll.",
                imageUrl: uri,
                status: "pending"
              }
            ],
            messages: [
              ...prev.messages,
              {
                id: "em_" + Date.now(),
                senderRole: role,
                senderName: currentSpeakerName,
                type: "evidence_notice",
                text: `Submitted Exhibit ${letter}: Uploaded Mobile Proof`
              }
            ]
          };
        });
      }
    } catch (err) {
      console.warn("Image picker error:", err.message);
    }
  };

  const handleRaiseObjection = () => {
    if (isJudge) {
      Alert.alert("Judicial Rule", "Judge rules on objections; only Litigants raise them!");
      return;
    }
    const reasons = [
      "Speculation without proof!",
      "Unverified screenshot!",
      "Irrelevant to the agreed stakes!"
    ];
    const reason = reasons[Math.floor(Math.random() * reasons.length)];
    raiseCourtObjection(roomId, role, currentSpeakerName, reason);
    setFallbackState((prev) => ({
      ...prev,
      activeObjection: { byRole: role, byName: currentSpeakerName, reason },
      messages: [
        ...prev.messages,
        {
          id: "obj_" + Date.now(),
          senderRole: role,
          senderName: currentSpeakerName,
          type: "objection_notice",
          text: `⚡ OBJECTION by ${currentSpeakerName}: "${reason}"`
        }
      ]
    }));
  };

  const handleResolveObjection = (isSustained) => {
    if (!isJudge) {
      Alert.alert("Authority Violation", "Only the Judge can rule on objections!");
      return;
    }
    const judgeName = participants?.judge?.name || "Judge";
    resolveCourtObjection(roomId, role, judgeName, isSustained);
    setFallbackState((prev) => ({
      ...prev,
      activeObjection: null,
      messages: [
        ...prev.messages,
        {
          id: "obj_res_" + Date.now(),
          senderRole: "judge",
          senderName: judgeName,
          type: "system_order",
          text: isSustained
            ? `🔨 OBJECTION SUSTAINED by ${judgeName}! Stick to proven facts.`
            : `🔨 OBJECTION OVERRULED by ${judgeName}. The statement stands.`
        }
      ]
    }));
  };

  const handleSummonWitness = () => {
    if (isJudge) {
      Alert.alert("Judicial Rule", "Litigants call witnesses; Judge examines testimony.");
      return;
    }
    const witnesses = ["Sneha (Roommate)", "Arjun (Flatmate)", "Karan (Admin)"];
    const chosen = witnesses[Math.floor(Math.random() * witnesses.length)];
    activateWitnessPass(roomId, role, chosen);
    setFallbackState((prev) => ({
      ...prev,
      witnessPass: { active: true, name: chosen, secondsLeft: 60 }
    }));
  };

  const handleDropWitnessTestimony = () => {
    const witName = activeRoom.witnessPass?.name || "Sneha";
    dismissWitnessPass(roomId);
    setFallbackState((prev) => ({
      ...prev,
      witnessPass: { active: false, name: "", secondsLeft: 0 },
      messages: [
        ...prev.messages,
        {
          id: "wit_" + Date.now(),
          senderRole: "judge",
          senderName: `🕵️ Witness: ${witName}`,
          type: "system_order",
          text: `"I was present in the room and witnessed the incident firsthand. Exhibit A is completely accurate!"`
        }
      ]
    }));
  };

  const handleJudgeOrder = () => {
    if (!isJudge) {
      Alert.alert("Authority Violation", "Only the Judge can call Order in Court!");
      return;
    }
    const jName = participants?.judge?.name || "Judge";
    sendCourtStatement(
      roomId,
      "judge",
      jName,
      `🔨 ORDER IN THE COURT! ${jName} demands calm and direct answers.`,
      "system_order"
    );
    setFallbackState((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        {
          id: "ord_" + Date.now(),
          senderRole: "judge",
          senderName: jName,
          type: "system_order",
          text: `🔨 ORDER IN THE COURT! ${jName} demands calm and direct answers.`
        }
      ]
    }));
  };

  const handleVoteCrowd = () => {
    voteCrowdJury(
      roomId,
      role,
      activeRoom.crowdVotes?.plaintiff,
      activeRoom.crowdVotes?.defendant,
      "plaintiff"
    );
    setFallbackState((prev) => ({
      ...prev,
      crowdVotes: {
        plaintiff: (prev.crowdVotes?.plaintiff || 1) + 1,
        defendant: prev.crowdVotes?.defendant || 1
      }
    }));
  };

  const handleUpdateEvidenceStatus = (exhibitId, newStatus) => {
    if (!isJudge) {
      Alert.alert("Authority Violation", "Only the Neutral Judge has the authority to admit or dismiss proof!");
      return;
    }
    const jName = participants?.judge?.name || "Judge";
    updateEvidenceStatus(roomId, role, exhibitId, newStatus, jName);
    setFallbackState((prev) => ({
      ...prev,
      evidence: prev.evidence.map((e) => (e.id === exhibitId ? { ...e, status: newStatus } : e)),
      messages: [
        ...prev.messages,
        {
          id: "ev_up_" + Date.now(),
          senderRole: "judge",
          senderName: jName,
          type: "system_order",
          text: `Exhibit has been marked ${newStatus.toUpperCase()} by ${jName}.`
        }
      ]
    }));
  };

  const handleCiteExhibit = (item) => {
    setActiveTab("chat");
    handleSendMessage(`Looking at ${item.code} (${item.title}), it clearly verifies my grievance!`);
  };

  const handleSealVerdict = (winner, reasoningText, penaltyText) => {
    if (!isJudge) {
      Alert.alert("Authority Violation", "Only the Neutral Judge has the authority to seal the verdict!");
      return;
    }
    const jName = participants?.judge?.name || "Judge";
    sealFinalVerdict(roomId, role, "judge_uid", jName, winner, reasoningText, penaltyText);
    setFallbackState((prev) => ({
      ...prev,
      verdict: {
        isFinal: true,
        winner,
        reasoning: reasoningText,
        penalty: penaltyText,
        penaltyFulfilled: false
      },
      messages: [
        ...prev.messages,
        {
          id: "v_seal_" + Date.now(),
          senderRole: "judge",
          senderName: jName,
          type: "verdict_announcement",
          text: `🔨 FINAL VERDICT SEALED: Ruling in favor of ${winner.toUpperCase()}! Order: "${penaltyText}". Case is closed.`
        }
      ]
    }));
  };

  const handleMarkPenaltyFulfilled = () => {
    markPenaltyFulfilled(roomId, role, verdict.winner);
    setFallbackState((prev) => ({
      ...prev,
      verdict: { ...prev.verdict, penaltyFulfilled: true },
      participants: {
        ...prev.participants,
        plaintiff: { ...prev.participants.plaintiff, honorScore: (prev.participants.plaintiff.honorScore || 120) + 25 },
        defendant: { ...prev.participants.defendant, honorScore: (prev.participants.defendant.honorScore || 115) + 25 }
      }
    }));
  };

  const handleCopyReceipt = async () => {
    const winnerLabel =
      verdict.winner === "plaintiff" ? "Plaintiff" : verdict.winner === "defendant" ? "Defendant" : "Split";
    const receiptText = `⚖️ POCKETCOURT FINAL VERDICT\nCase #${roomId}: ${activeRoom.title}\nOutcome: ${winnerLabel} Wins\nReasoning: ${verdict.reasoning}\nOrder: ${verdict.penalty}\nStatus: SEALED & BINDING`;

    try {
      await Share.share({ message: receiptText, title: "PocketCourt Verdict" });
    } catch (err) {
      Alert.alert("Verdict Receipt", receiptText);
    }
  };

  // Lobby Handlers
  const handleToggleReady = (targetRole) => {
    const current = participants?.[targetRole]?.ready;
    setPlayerReady(roomId, targetRole, !current);
    setFallbackState((prev) => ({
      ...prev,
      participants: {
        ...prev.participants,
        [targetRole]: {
          ...prev.participants[targetRole],
          ready: !current
        }
      }
    }));
  };

  const handleCommenceTrial = () => {
    commenceTrialFromLobby(roomId);
    setRoom((prev) => (prev ? { ...prev, status: "IN_SESSION" } : prev));
    setFallbackState((prev) => ({
      ...prev,
      status: "IN_SESSION"
    }));
    setActiveTab("chat");
  };

  const handleCreateCustomCase = (customTitle, customStakes, pName, dName, jName) => {
    const newCode = String(Math.floor(1000 + Math.random() * 9000));
    setRoomId(newCode);
    const safePName = pName || "Aarav";
    const safeDName = dName || "Riya";
    const safeJName = jName || "Judge Kabir";
    setFallbackState({
      title: `Case #${newCode}: ${customTitle}`,
      stakes: customStakes,
      status: "LOBBY_GATHERING", // Opens in Pre-Trial Lobby!
      floorSpeaker: "BOTH",
      crowdVotes: { plaintiff: 1, defendant: 1 },
      activeObjection: null,
      witnessPass: { active: false, name: "", secondsLeft: 0 },
      participants: {
        plaintiff: { name: safePName, online: true, ready: true, approvedJudge: true, honorScore: 120 },
        defendant: { name: safeDName, online: true, ready: true, approvedJudge: true, honorScore: 115 },
        judge: { name: safeJName, online: true, ready: true }
      },
      messages: [
        {
          id: "m_init",
          senderRole: "judge",
          senderName: safeJName,
          type: "system_order",
          text: `Courtroom #${newCode} initialized! Case: "${customTitle}". All participants gather in lobby.`
        }
      ],
      evidence: [],
      verdict: {
        isFinal: false,
        winner: "",
        reasoning: "",
        penalty: customStakes,
        penaltyFulfilled: false
      }
    });
    createCourtroom(newCode, customTitle, customStakes, role, currentSpeakerName, "uid_user");
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" backgroundColor="#0f172a" />
      {/* If in Pre-Trial Gathering Lobby Mode */}
      {isGatheringLobby ? (
        <PreTrialLobby
          roomId={roomId}
          title={activeRoom.title}
          stakes={activeRoom.stakes}
          role={role}
          participants={participants}
          onClaimRole={(newRole) => setRole(newRole)}
          onToggleReady={handleToggleReady}
          onCommenceTrial={handleCommenceTrial}
        />
      ) : (
        <>
          {/* 1. Header & 3-Player Presence */}
          <CourtHeader
            roomId={roomId}
            title={activeRoom.title}
            stakes={activeRoom.stakes}
            role={role}
            participants={participants}
            allPresent={allPresent}
            onTogglePresence={handleTogglePresence}
            onToggleApproveJudge={handleToggleApproveJudge}
          />

          {/* 2. Recess Banner if AFK */}
          {!allPresent && (
            <RecessBanner
              missingPlayerNames={["plaintiff", "defendant", "judge"]
                .filter((r) => !participants?.[r]?.online)
                .map((r) => participants?.[r]?.name || r)
                .join(", ")}
              onMarkAllPresent={handleMarkAllPresent}
            />
          )}

          {/* 3. Objection Banner */}
          <ObjectionBanner
            objection={activeRoom.activeObjection}
            isJudge={role === "judge"}
            onSustain={() => handleResolveObjection(true)}
            onOverrule={() => handleResolveObjection(false)}
          />

          {/* 4. Witness Pass Banner */}
          <WitnessBanner
            witnessPass={activeRoom.witnessPass}
            onDropTestimony={handleDropWitnessTestimony}
            onDismiss={() => dismissWitnessPass(roomId)}
          />

          {/* 5. Main Tab Content */}
          <View style={styles.tabContent}>
            {activeTab === "chat" && (
              <CourtChatTab
                role={role}
                messages={messages}
                floorSpeaker={floorSpeaker}
                crowdVotes={activeRoom.crowdVotes}
                canSpeak={canSpeak}
                allPresent={allPresent}
                bothApprovedJudge={bothApprovedJudge}
                isSealed={verdict?.isFinal}
                currentSpeakerName={currentSpeakerName}
                onSendMessage={handleSendMessage}
                onSetFloorSpeaker={(mode) => setMicFloorSpeaker(roomId, role, mode)}
                onVoteCrowd={handleVoteCrowd}
                onPickProof={handlePickProof}
                onRaiseObjection={handleRaiseObjection}
                onSummonWitness={handleSummonWitness}
                onJudgeOrder={handleJudgeOrder}
                onSwitchToVerdict={() => setActiveTab("verdict")}
                onInspectExhibit={() => setActiveTab("evidence")}
              />
            )}

            {activeTab === "evidence" && (
              <EvidenceLockerTab
                evidence={evidence}
                role={role}
                onPickProof={handlePickProof}
                onUpdateEvidenceStatus={handleUpdateEvidenceStatus}
                onCiteExhibit={handleCiteExhibit}
                onInspectImage={(uri, title) => Alert.alert(title, uri)}
              />
            )}

            {activeTab === "verdict" && (
              <VerdictTab
                verdict={verdict}
                role={role}
                title={activeRoom.title}
                judgeName={participants?.judge?.name || "Judge"}
                plaintiffName={participants?.plaintiff?.name || "Plaintiff"}
                defendantName={participants?.defendant?.name || "Defendant"}
                onSealVerdict={handleSealVerdict}
                onMarkPenaltyFulfilled={handleMarkPenaltyFulfilled}
                onCopyReceipt={handleCopyReceipt}
              />
            )}

            {activeTab === "lobby" && (
              <LobbyTab
                currentRoomId={roomId}
                currentRole={role}
                onJoinRoom={(newId) => {
                  setRoomId(newId);
                  setActiveTab("chat");
                }}
                onSwitchRole={(newRole) => setRole(newRole)}
                onCreateCustomCase={handleCreateCustomCase}
              />
            )}
          </View>

          {/* 6. Clean Bottom Navigation Bar */}
          <BottomTabBar
            activeTab={activeTab}
            evidenceCount={evidence?.length || 0}
            onSelectTab={setActiveTab}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingTop: Platform.OS === "android" ? Math.max(RNStatusBar.currentHeight || 0, 10) : 0
  },
  tabContent: {
    flex: 1,
    backgroundColor: "#f8fafc"
  }
});
