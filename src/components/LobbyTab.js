import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet
} from "react-native";

export const PRESET_CASES = [
  {
    id: "4829",
    title: "The Shared Netflix Password",
    stakes: "Loser pays for next month's subscription + snacks",
    plaintiff: "Aarav",
    defendant: "Riya",
    judge: "Judge Kabir"
  },
  {
    id: "7104",
    title: "The Midnight Leftover Biryani",
    stakes: "Loser orders a fresh family pack this weekend",
    plaintiff: "Zoya",
    defendant: "Dev",
    judge: "Judge Meera"
  },
  {
    id: "9032",
    title: "Group Goa Trip Cab Split",
    stakes: "Settling ₹900 airport cab difference fairly",
    plaintiff: "Rohan",
    defendant: "Vikram",
    judge: "Judge Ananya"
  }
];

export default function LobbyTab({
  currentRoomId,
  currentRole,
  onJoinRoom,
  onSwitchRole,
  onCreateCustomCase
}) {
  const [inputRoomId, setInputRoomId] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customStakes, setCustomStakes] = useState("");
  const [customP, setCustomP] = useState("");
  const [customJ, setCustomJ] = useState("");
  const [customD, setCustomD] = useState("");

  const handleCreate = () => {
    onCreateCustomCase(
      customTitle || "Everyday Friendship Dispute",
      customStakes || "Loser treats winner to dinner/coffee",
      customP || "Plaintiff",
      customD || "Defendant",
      customJ || "Judge"
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 1. Direct Room Join */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>1. JOIN COURTROOM ROOM</Text>
        <Text style={styles.cardSubtext}>Enter the 4-digit room code from your friend:</Text>
        <View style={styles.joinRow}>
          <TextInput
            style={styles.roomInput}
            value={inputRoomId}
            onChangeText={setInputRoomId}
            placeholder="e.g. 7104"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            maxLength={4}
          />
          <TouchableOpacity
            style={[styles.joinBtn, !inputRoomId.trim() && styles.joinBtnDisabled]}
            disabled={!inputRoomId.trim()}
            onPress={() => onJoinRoom(inputRoomId.trim())}
          >
            <Text style={styles.joinBtnText}>Join Room</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Custom Case Creator */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>2. FILE A NEW DISPUTE</Text>
        <Text style={styles.cardSubtext}>Create a fresh courtroom case with custom stakes:</Text>
        <TextInput
          style={styles.textInput}
          value={customTitle}
          onChangeText={setCustomTitle}
          placeholder="Dispute Title (e.g. Who left the AC on all day?)"
          placeholderTextColor="#94a3b8"
        />
        <TextInput
          style={styles.textInput}
          value={customStakes}
          onChangeText={setCustomStakes}
          placeholder="Agreed Stakes / Penalty (e.g. Loser buys Starbucks)"
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.playersRow}>
          <TextInput
            style={[styles.playerInput, { borderColor: "#bfdbfe" }]}
            value={customP}
            onChangeText={setCustomP}
            placeholder="Plaintiff Name"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={[styles.playerInput, { borderColor: "#fde68a" }]}
            value={customJ}
            onChangeText={setCustomJ}
            placeholder="Judge Name"
            placeholderTextColor="#94a3b8"
          />
          <TextInput
            style={[styles.playerInput, { borderColor: "#fecdd3" }]}
            value={customD}
            onChangeText={setCustomD}
            placeholder="Defendant Name"
            placeholderTextColor="#94a3b8"
          />
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>⚖️ File Dispute & Enter Lobby</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Role Switcher */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>3. ACTIVE PLAYER ROLE</Text>
        <Text style={styles.cardSubtext}>Switch your role in this courtroom:</Text>
        <View style={styles.roleGrid}>
          {["plaintiff", "defendant", "judge"].map((r) => {
            const isActive = currentRole === r;
            const activeStyle =
              r === "plaintiff" ? styles.roleP : r === "defendant" ? styles.roleD : styles.roleJ;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, isActive && activeStyle]}
                onPress={() => onSwitchRole(r)}
              >
                <Text style={[styles.roleText, isActive && styles.roleTextActive]}>
                  {r.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. Dispute Presets */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>4. SAMPLE DISPUTE PRESETS (QUICK DEMO)</Text>
        <View style={styles.presetsCol}>
          {PRESET_CASES.map((preset) => {
            const isCurrent = preset.id === currentRoomId;
            return (
              <View key={preset.id} style={[styles.presetItem, isCurrent && styles.presetItemActive]}>
                <View style={styles.presetLeft}>
                  <Text style={styles.presetTitle} numberOfLines={1}>{preset.title}</Text>
                  <Text style={styles.presetStakes} numberOfLines={1}>Stakes: {preset.stakes}</Text>
                  <Text style={styles.presetMeta}>
                    🔵 {preset.plaintiff} vs 🔴 {preset.defendant} • ⚖️ {preset.judge}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.loadBtn, isCurrent ? styles.loadBtnActive : styles.loadBtnIdle]}
                  onPress={() => onJoinRoom(preset.id)}
                >
                  <Text style={[styles.loadBtnText, isCurrent && styles.loadBtnTextActive]}>
                    {isCurrent ? "Active" : "Load"}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  content: {
    padding: 12,
    gap: 12
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 4
  },
  cardSubtext: {
    fontSize: 11,
    color: "#64748b",
    marginBottom: 8
  },
  joinRow: {
    flexDirection: "row",
    gap: 8
  },
  roomInput: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#0f172a"
  },
  joinBtn: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center"
  },
  joinBtnDisabled: {
    backgroundColor: "#94a3b8"
  },
  joinBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800"
  },
  roleGrid: {
    flexDirection: "row",
    gap: 6
  },
  roleBtn: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  roleP: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  roleD: { backgroundColor: "#dc2626", borderColor: "#dc2626" },
  roleJ: { backgroundColor: "#f59e0b", borderColor: "#f59e0b" },
  roleText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748b"
  },
  roleTextActive: {
    color: "#ffffff"
  },
  presetsCol: {
    gap: 8
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    backgroundColor: "#f8fafc"
  },
  presetItemActive: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb"
  },
  presetLeft: {
    flex: 1,
    marginRight: 8
  },
  presetTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0f172a"
  },
  presetStakes: {
    fontSize: 9,
    color: "#64748b"
  },
  presetMeta: {
    fontSize: 8,
    color: "#94a3b8",
    marginTop: 2
  },
  loadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  loadBtnIdle: {
    backgroundColor: "#0f172a"
  },
  loadBtnActive: {
    backgroundColor: "#f59e0b"
  },
  loadBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff"
  },
  loadBtnTextActive: {
    color: "#0f172a"
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11,
    color: "#0f172a",
    marginBottom: 8
  },
  playersRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10
  },
  playerInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 10,
    color: "#0f172a"
  },
  createBtn: {
    backgroundColor: "#0f172a",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  createBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800"
  }
});
