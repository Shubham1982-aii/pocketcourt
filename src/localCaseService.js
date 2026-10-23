import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

/**
 * 1. Cache Case State locally to device storage on every update
 */
export async function saveCaseLocally(roomId, roomData) {
  if (!roomId || !roomData) return;
  try {
    const serialized = JSON.stringify(roomData);
    await AsyncStorage.setItem(`pocketcourt_case_${roomId}`, serialized);

    // Keep an index of visited / stored cases
    const historyRaw = await AsyncStorage.getItem("pocketcourt_case_history");
    let history = historyRaw ? JSON.parse(historyRaw) : [];
    if (!history.includes(roomId)) {
      history.unshift(roomId);
      if (history.length > 20) history = history.slice(0, 20);
      await AsyncStorage.setItem("pocketcourt_case_history", JSON.stringify(history));
    }
  } catch (err) {
    console.warn("saveCaseLocally error:", err.message);
  }
}

/**
 * 2. Load cached case state if offline or restarting app
 */
export async function loadCaseLocally(roomId) {
  if (!roomId) return null;
  try {
    const raw = await AsyncStorage.getItem(`pocketcourt_case_${roomId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn("loadCaseLocally error:", err.message);
    return null;
  }
}

/**
 * 3. Cache Voice Note Audio locally to device filesystem (0 Server Storage)
 */
export async function saveAudioLocally(messageId, base64Audio) {
  try {
    if (!base64Audio) return null;
    const localUri = `${FileSystem.cacheDirectory}vn_${messageId}.m4a`;
    const fileInfo = await FileSystem.getInfoAsync(localUri);
    if (!fileInfo.exists) {
      await FileSystem.writeAsStringAsync(localUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64
      });
    }
    return localUri;
  } catch (err) {
    console.warn("saveAudioLocally error:", err.message);
    return null;
  }
}

/**
 * 4. Generate & Download / Export Complete Case Dossier
 */
export async function exportCaseDossier(room) {
  try {
    if (!room) throw new Error("No case data available to export");

    const roomId = room.roomId || "Docket";
    const title = room.title || "Everyday Dispute";
    const stakes = room.stakes || "Loser pays restitution";
    const verdict = room.verdict || {};
    const participants = room.participants || {};
    const pName = participants.plaintiff?.name || "Plaintiff";
    const dName = participants.defendant?.name || "Defendant";
    const jName = participants.judge?.name || "Judge Kabir";

    const winnerLabel =
      verdict.winner === "plaintiff"
        ? `Plaintiff (${pName})`
        : verdict.winner === "defendant"
        ? `Defendant (${dName})`
        : "50/50 Mutual Compromise";

    const messages = room.messages
      ? Array.isArray(room.messages)
        ? room.messages
        : Object.values(room.messages)
      : [];

    const evidence = room.evidence
      ? Array.isArray(room.evidence)
        ? room.evidence
        : Object.values(room.evidence)
      : [];

    let dossier = `=====================================================
          ⚖️ POCKETCOURT OFFICIAL CASE DOSSIER ⚖️
=====================================================
CASE DOCKET ID: #${roomId}
TITLE: ${title}
AGREED STAKES: ${stakes}
DATE EXPORTED: ${new Date().toLocaleString()}

=====================================================
                  COURT PERSONNEL
=====================================================
PRESIDING NEUTRAL JUDGE:
  - ${jName} (Approved by both litigants)

LITIGANTS:
  - Plaintiff: ${pName} [Karma: ${participants.plaintiff?.honorScore || 120}]
  - Defendant: ${dName} [Karma: ${participants.defendant?.honorScore || 115}]

=====================================================
              FINAL BINDING RULING & VERDICT
=====================================================
OFFICIAL OUTCOME: ${winnerLabel}
STATUS: ${verdict.isFinal ? "SEALED & PERMANENTLY BINDING" : "TRIAL IN PROGRESS"}

JUDICIAL REASONING & FINDINGS:
${verdict.reasoning || "Deliberated based on submitted evidence exhibits and witness testimony."}

MANDATORY RESTITUTION / PENALTY:
${verdict.penalty || stakes}

COMPLIANCE & RESTITUTION:
${verdict.penaltyFulfilled ? "✅ VERIFIED FULFILLED (+25 Karma Awarded)" : "⏳ Pending proof of restitution fulfillment"}

=====================================================
                EVIDENCE LOCKER EXHIBITS
=====================================================
`;

    if (evidence.length === 0) {
      dossier += "No formal exhibits filed in evidence locker.\n";
    } else {
      evidence.forEach((ex, idx) => {
        dossier += `[${ex.code || `Exhibit ${idx + 1}`}] ${ex.title || "Exhibit"}
  Submitted By: ${ex.submitterName || ex.submittedBy}
  Type: ${ex.type || "Documented Proof"}
  Status: ${(ex.status || "admitted").toUpperCase()}
  Detail: ${ex.detail || "Verified court proof"}
-----------------------------------------------------\n`;
      });
    }

    dossier += `
=====================================================
             OFFICIAL COURT RECORD / TRANSCRIPT
=====================================================
`;

    if (messages.length === 0) {
      dossier += "No recorded statements in courtroom transcript.\n";
    } else {
      messages.forEach((m) => {
        const role = (m.senderRole || "court").toUpperCase();
        const sender = m.senderName || role;
        if (m.type === "voice_note") {
          dossier += `[${role}] ${sender} (🎙️ Voice Note - ${m.duration ? Math.round(m.duration / 1000) + 's' : 'Audio'}): [Voice Note Transmitted]\n`;
        } else if (m.type === "objection_notice") {
          dossier += `⚡ ${sender}: ${m.text}\n`;
        } else if (m.type === "system_order" || m.type === "verdict_announcement") {
          dossier += `⚖️ [ORDER] ${sender}: ${m.text}\n`;
        } else {
          dossier += `[${role}] ${sender}: ${m.text}\n`;
        }
      });
    }

    dossier += `
=====================================================
CERTIFICATION OF FINALITY:
This document serves as the binding electronic record
of Case #${roomId} adjudicated under PocketCourt dispute rules.
=====================================================
`;

    const fileName = `PocketCourt_Case_${roomId}_Dossier.txt`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, dossier, {
      encoding: FileSystem.EncodingType.UTF8
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(filePath, {
        mimeType: "text/plain",
        dialogTitle: `Download PocketCourt Case #${roomId} Dossier`,
        UTI: "public.plain-text"
      });
      return { success: true, path: filePath };
    } else {
      return { success: true, path: filePath, content: dossier };
    }
  } catch (err) {
    console.warn("exportCaseDossier error:", err.message);
    throw err;
  }
}
