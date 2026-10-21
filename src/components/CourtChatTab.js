import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet
} from "react-native";

export default function CourtChatTab({
  role,
  messages,
  floorSpeaker,
  crowdVotes,
  canSpeak,
  allPresent,
  bothApprovedJudge,
  isSealed,
  currentSpeakerName,
  onSendMessage,
  onSetFloorSpeaker,
  onVoteCrowd,
  onPickProof,
  onRaiseObjection,
  onSummonWitness,
  onJudgeOrder,
  onSwitchToVerdict,
  onInspectExhibit
}) {
  const [inputText, setInputText] = useState("");

  const isJudge = role === "judge";
  const isLitigant = role === "plaintiff" || role === "defendant";
  const isSpectator = role === "spectator";

  const handleSend = () => {
    if (!inputText.trim() || !canSpeak) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCrowdVoting = () => {
    if (isLitigant) {
      Alert.alert("Conflict of Interest", "Litigants cannot vote in their own spectator jury poll!");
      return;
    }
    onVoteCrowd();
  };

  const pVotes = crowdVotes?.plaintiff || 1;
  const dVotes = crowdVotes?.defendant || 1;
  const totalVotes = pVotes + dVotes;
  const pPct = Math.round((pVotes / totalVotes) * 100);
  const dPct = 100 - pPct;

  const getPlaceholderText = () => {
    if (isSpectator) return "👀 Spectator Mode: Live audio & chat are read-only";
    if (isSealed) return "🔒 Case Closed — Final Verdict Sealed";
    if (!allPresent) return "⏸️ Court Paused: Waiting for all 3 players...";
    if (!bothApprovedJudge) return "🤝 Waiting for both parties to approve Judge...";
    if (!canSpeak) return `🎙️ Mic Floor locked: Only ${floorSpeaker} can speak`;
    return `Speak as ${currentSpeakerName}...`;
  };

  const renderMessageItem = ({ item }) => {
    if (item.type === "system_order" || item.type === "verdict_announcement") {
      return (
        <View style={styles.systemBubble}>
          <Text style={styles.systemSender}>⚖️ {item.senderName} • Court Order</Text>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }

    if (item.type === "evidence_notice") {
      return (
        <View style={styles.evidenceBubble}>
          <View style={styles.evidenceLeft}>
            <Text style={styles.evidenceIcon}>📎</Text>
            <View style={styles.evidenceTextCol}>
              <Text style={styles.evidenceMeta}>{item.senderName} filed evidence</Text>
              <Text style={styles.evidenceTitle} numberOfLines={1}>{item.text}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => onInspectExhibit(item.exhibitId)}
          >
            <Text style={styles.inspectBtnText}>Inspect</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item.type === "objection_notice") {
      return (
        <View style={styles.objectionMsgBubble}>
          <Text style={styles.objectionMsgText}>{item.text}</Text>
        </View>
      );
    }

    const isMe = item.senderRole === role;
    const isMsgJudge = item.senderRole === "judge";
    const isMsgPlaintiff = item.senderRole === "plaintiff";

    const badgeColor = isMsgJudge ? "#b45309" : isMsgPlaintiff ? "#2563eb" : "#dc2626";

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowRight : styles.msgRowLeft]}>
        <View style={styles.senderMetaRow}>
          <View style={[styles.roleTag, { borderColor: badgeColor }]}>
            <Text style={[styles.roleTagText, { color: badgeColor }]}>
              {item.senderRole?.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.senderNameText}>{item.senderName}</Text>
        </View>
        <View style={[styles.bubble, isMsgJudge ? styles.judgeBubble : isMe ? styles.meBubble : styles.otherBubble]}>
          <Text style={[styles.bubbleText, isMe && !isMsgJudge ? styles.meBubbleText : styles.otherBubbleText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Mic Floor Bar + Spectator Jury */}
      <View style={styles.floorControlBar}>
        <View style={styles.floorLeft}>
          <Text style={styles.floorTitle}>🎙️ Mic Floor:</Text>
          {isJudge ? (
            /* Judge controls floor */
            ["BOTH", "PLAINTIFF", "DEFENDANT"].map((mode) => {
              const isActive = floorSpeaker === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.floorChip, isActive && styles.floorChipActive]}
                  onPress={() => onSetFloorSpeaker(mode)}
                >
                  <Text style={[styles.floorChipText, isActive && styles.floorChipTextActive]}>
                    {mode === "BOTH" ? "Both" : mode === "PLAINTIFF" ? "P Only" : "D Only"}
                  </Text>
                </TouchableOpacity>
              );
            })
          ) : (
            /* Litigants see indicator */
            <View style={styles.floorIndicator}>
              <Text style={styles.floorIndicatorText}>{floorSpeaker}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.juryPill} onPress={handleCrowdVoting}>
          <Text style={styles.juryPillText}>
            👥 Jury: <Text style={styles.juryBold}>{pPct}% P / {dPct}% D</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Messages Stream */}
      <FlatList
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        data={messages}
        keyExtractor={(item, index) => item.id || String(index)}
        renderItem={renderMessageItem}
      />

      {/* Action Chips Bar (STRICT ROLE PERMISSIONS) */}
      <View style={styles.actionsBar}>
        {/* Upload Proof: Litigants ONLY */}
        {isLitigant && (
          <TouchableOpacity style={[styles.actionChip, styles.proofChip]} onPress={onPickProof}>
            <Text style={[styles.actionChipText, { color: "#4338ca" }]}>📎 + Upload Proof</Text>
          </TouchableOpacity>
        )}

        {/* Objection: Litigants ONLY */}
        {isLitigant && (
          <TouchableOpacity style={[styles.actionChip, styles.objectionChip]} onPress={onRaiseObjection}>
            <Text style={[styles.actionChipText, { color: "#b91c1c" }]}>⚡ Objection!</Text>
          </TouchableOpacity>
        )}

        {/* Witness Pass: Litigants ONLY */}
        {isLitigant && (
          <TouchableOpacity style={[styles.actionChip, styles.witnessChip]} onPress={onSummonWitness}>
            <Text style={[styles.actionChipText, { color: "#6b21a8" }]}>🕵️ + Witness Pass</Text>
          </TouchableOpacity>
        )}

        {/* Order in Court: Judge ONLY */}
        {isJudge && (
          <TouchableOpacity style={[styles.actionChip, styles.orderChip]} onPress={onJudgeOrder}>
            <Text style={[styles.actionChipText, { color: "#92400e" }]}>🔨 Order in Court</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[styles.actionChip, styles.verdictChip]} onPress={onSwitchToVerdict}>
          <Text style={[styles.actionChipText, { color: "#065f46" }]}>⚖️ Verdict</Text>
        </TouchableOpacity>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          editable={Boolean(canSpeak)}
          placeholder={getPlaceholderText()}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity
          style={[styles.sendButton, !canSpeak && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSpeak}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  floorControlBar: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0"
  },
  floorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  floorTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    marginRight: 2
  },
  floorIndicator: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  floorIndicatorText: {
    color: "#fbbf24",
    fontSize: 8,
    fontWeight: "800"
  },
  floorChip: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  floorChipActive: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a"
  },
  floorChipText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#475569"
  },
  floorChipTextActive: {
    color: "#ffffff"
  },
  juryPill: {
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99
  },
  juryPillText: {
    fontSize: 9,
    color: "#4338ca",
    fontWeight: "600"
  },
  juryBold: {
    fontWeight: "800"
  },
  messagesList: {
    flex: 1,
    paddingHorizontal: 10
  },
  messagesContent: {
    paddingVertical: 10,
    gap: 8
  },
  systemBubble: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 12,
    padding: 10,
    alignItems: "center"
  },
  systemSender: {
    fontSize: 9,
    fontWeight: "900",
    color: "#92400e",
    textTransform: "uppercase",
    marginBottom: 2
  },
  systemText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center"
  },
  evidenceBubble: {
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    borderRadius: 12,
    padding: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  evidenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
  },
  evidenceIcon: {
    fontSize: 16
  },
  evidenceTextCol: {
    flex: 1
  },
  evidenceMeta: {
    fontSize: 8,
    fontWeight: "800",
    color: "#4338ca",
    textTransform: "uppercase"
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a"
  },
  inspectBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  inspectBtnText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800"
  },
  objectionMsgBubble: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#f59e0b",
    borderRadius: 8,
    padding: 6,
    alignItems: "center"
  },
  objectionMsgText: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "800"
  },
  msgRow: {
    maxWidth: "85%"
  },
  msgRowRight: {
    alignSelf: "flex-end",
    alignItems: "flex-end"
  },
  msgRowLeft: {
    alignSelf: "flex-start",
    alignItems: "flex-start"
  },
  senderMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2
  },
  roleTag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: "#ffffff"
  },
  roleTagText: {
    fontSize: 8,
    fontWeight: "800"
  },
  senderNameText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748b"
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1
  },
  meBubble: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a"
  },
  otherBubble: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0"
  },
  judgeBubble: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a"
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 16
  },
  meBubbleText: {
    color: "#ffffff"
  },
  otherBubbleText: {
    color: "#0f172a"
  },
  actionsBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    gap: 6
  },
  actionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1
  },
  proofChip: { backgroundColor: "#eef2ff", borderColor: "#c7d2fe" },
  objectionChip: { backgroundColor: "#fee2e2", borderColor: "#fecdd3" },
  witnessChip: { backgroundColor: "#faf5ff", borderColor: "#f3e8ff" },
  orderChip: { backgroundColor: "#fef3c7", borderColor: "#fde68a" },
  verdictChip: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" },
  actionChipText: {
    fontSize: 10,
    fontWeight: "800"
  },
  inputBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    gap: 8
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: "#0f172a"
  },
  sendButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonDisabled: {
    backgroundColor: "#94a3b8"
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800"
  }
});
