import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet
} from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { saveAudioLocally } from "../localCaseService";

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
  onSendVoiceNote,
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [playingMsgId, setPlayingMsgId] = useState(null);

  const recordingRef = useRef(null);
  const timerRef = useRef(null);
  const soundRef = useRef(null);

  const isJudge = role === "judge";
  const isLitigant = role === "plaintiff" || role === "defendant";
  const isSpectator = role === "spectator";

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, []);

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

  // Push-To-Talk Voice Recording Handlers
  const handleStartRecording = async () => {
    if (!canSpeak) {
      Alert.alert("Mic Floor Locked", `Only ${floorSpeaker} has permission to speak right now.`);
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Microphone Permission", "PocketCourt needs microphone access to record courtroom voice notes.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 24000
        },
        ios: {
          extension: ".m4a",
          audioQuality: Audio.IOSAudioQuality.LOW,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 24000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false
        },
        web: {}
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("handleStartRecording error:", err.message);
      Alert.alert("Recording Error", "Unable to initialize audio recorder: " + err.message);
    }
  };

  const handleStopAndSendRecording = async () => {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const rec = recordingRef.current;
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      const status = await rec.getStatusAsync();
      const durationMillis = status.durationMillis || recordSeconds * 1000 || 3000;

      setIsRecording(false);
      recordingRef.current = null;
      setRecordSeconds(0);

      if (durationMillis < 600) {
        Alert.alert("Note too short", "Voice note was under 1 second and was discarded.");
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      if (onSendVoiceNote && base64Audio) {
        onSendVoiceNote(base64Audio, durationMillis);
      }
    } catch (err) {
      console.warn("handleStopAndSendRecording error:", err.message);
      setIsRecording(false);
      recordingRef.current = null;
    }
  };

  const handleCancelRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      recordingRef.current = null;
    }
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const handleTogglePlayAudio = async (msgId, base64Audio) => {
    try {
      if (playingMsgId === msgId && soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        setPlayingMsgId(null);
        return;
      }

      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }

      const localUri = await saveAudioLocally(msgId, base64Audio);
      if (!localUri) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setPlayingMsgId(msgId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingMsgId(null);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      });
    } catch (err) {
      console.warn("handleTogglePlayAudio error:", err.message);
      setPlayingMsgId(null);
    }
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

    if (item.type === "voice_note") {
      const isPlaying = playingMsgId === item.id;
      const durationSec = Math.max(1, Math.round((item.duration || 3000) / 1000));

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

          <View style={[styles.voiceBubble, isMe ? styles.voiceBubbleMe : styles.voiceBubbleOther]}>
            <TouchableOpacity
              style={[styles.voicePlayBtn, isPlaying && styles.voicePlayBtnActive]}
              onPress={() => handleTogglePlayAudio(item.id, item.audioBase64)}
            >
              <Text style={styles.voicePlayIcon}>{isPlaying ? "⏹️" : "▶️"}</Text>
            </TouchableOpacity>

            <View style={styles.voiceWaveCol}>
              <View style={styles.waveRow}>
                <View style={[styles.waveBar, { height: 8 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 16 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 12 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 20 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 14 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 18 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 10 }, isPlaying && styles.waveBarActive]} />
                <View style={[styles.waveBar, { height: 15 }, isPlaying && styles.waveBarActive]} />
              </View>
              <Text style={[styles.voiceDurationText, isMe && styles.voiceDurationMe]}>
                {isPlaying ? "Playing audio..." : `🎙️ Voice Note (${durationSec}s)`}
              </Text>
            </View>
          </View>
        </View>
      );
    }

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
            <Text style={[styles.actionChipText, { color: "#4338ca" }]}>📎 + Proof</Text>
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
            <Text style={[styles.actionChipText, { color: "#6b21a8" }]}>🕵️ Witness</Text>
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

      {/* Push-to-Talk Recording Bar OR Normal Input Bar */}
      {isRecording ? (
        <View style={styles.recordingBar}>
          <View style={styles.recordingStatus}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              Recording Voice Note: 0:{recordSeconds < 10 ? "0" + recordSeconds : recordSeconds}
            </Text>
          </View>
          <View style={styles.recordingActions}>
            <TouchableOpacity style={styles.cancelRecBtn} onPress={handleCancelRecording}>
              <Text style={styles.cancelRecText}>✕ Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sendRecBtn} onPress={handleStopAndSendRecording}>
              <Text style={styles.sendRecText}>✓ Send Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
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
            style={[styles.micBtn, !canSpeak && styles.micBtnDisabled]}
            onPress={handleStartRecording}
            disabled={!canSpeak}
          >
            <Text style={styles.micBtnText}>🎙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendButton, !canSpeak && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!canSpeak}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontWeight: "800",
    color: "#3730a3"
  },
  messagesList: {
    flex: 1
  },
  messagesContent: {
    padding: 12,
    gap: 10
  },
  systemBubble: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
    padding: 8,
    borderRadius: 8,
    alignSelf: "stretch"
  },
  systemSender: {
    fontSize: 9,
    fontWeight: "800",
    color: "#92400e",
    marginBottom: 2
  },
  systemText: {
    fontSize: 11,
    color: "#78350f",
    lineHeight: 15
  },
  evidenceBubble: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
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
    fontWeight: "700",
    color: "#64748b"
  },
  evidenceTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0f172a"
  },
  inspectBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  inspectBtnText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700"
  },
  objectionMsgBubble: {
    backgroundColor: "#fee2e2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    padding: 8,
    borderRadius: 8,
    alignSelf: "stretch"
  },
  objectionMsgText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "800"
  },
  msgRow: {
    maxWidth: "82%"
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
  voiceBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    minWidth: 180
  },
  voiceBubbleMe: {
    backgroundColor: "#0f172a",
    borderColor: "#0f172a"
  },
  voiceBubbleOther: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0"
  },
  voicePlayBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center"
  },
  voicePlayBtnActive: {
    backgroundColor: "#ef4444"
  },
  voicePlayIcon: {
    fontSize: 14,
    color: "#ffffff"
  },
  voiceWaveCol: {
    flex: 1,
    gap: 3
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 20
  },
  waveBar: {
    width: 3,
    backgroundColor: "#94a3b8",
    borderRadius: 2
  },
  waveBarActive: {
    backgroundColor: "#38bdf8"
  },
  voiceDurationText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b"
  },
  voiceDurationMe: {
    color: "#94a3b8"
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
    alignItems: "center",
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
  micBtn: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  micBtnDisabled: {
    opacity: 0.4
  },
  micBtnText: {
    fontSize: 16
  },
  sendButton: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    height: 38,
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
  },
  recordingBar: {
    backgroundColor: "#fee2e2",
    borderTopWidth: 1,
    borderColor: "#fca5a5",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  recordingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ef4444"
  },
  recordingText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "800"
  },
  recordingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  cancelRecBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#fca5a5"
  },
  cancelRecText: {
    color: "#b91c1c",
    fontSize: 10,
    fontWeight: "800"
  },
  sendRecBtn: {
    backgroundColor: "#166534",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  sendRecText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900"
  }
});
