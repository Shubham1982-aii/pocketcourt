import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function CourtHeader({
  roomId,
  title,
  stakes,
  role,
  participants,
  allPresent,
  onTogglePresence,
  onToggleApproveJudge
}) {
  const plaintiff = participants?.plaintiff || { name: "Aarav", online: true, honorScore: 120 };
  const defendant = participants?.defendant || { name: "Riya", online: true, honorScore: 115 };
  const judge = participants?.judge || { name: "Judge Kabir", online: true };

  const roleThemeColor =
    role === "plaintiff" ? "#2563eb" : role === "defendant" ? "#dc2626" : role === "judge" ? "#d97706" : "#7c3aed";

  return (
    <View style={styles.container}>
      {/* Top Bar: Room Code & Status */}
      <View style={styles.topBar}>
        <View style={styles.roomTag}>
          <Text style={styles.roomText}>⚖️ POCKETCOURT #{roomId}</Text>
        </View>
        <View style={[styles.presencePill, allPresent ? styles.presenceOnline : styles.presencePaused]}>
          <View style={[styles.presenceDot, { backgroundColor: allPresent ? "#10b981" : "#ef4444" }]} />
          <Text style={[styles.presenceText, { color: allPresent ? "#10b981" : "#ef4444" }]}>
            {allPresent ? "3/3 Present" : "Paused (AFK)"}
          </Text>
        </View>
      </View>

      {/* Case Title & Stakes */}
      <View style={styles.caseInfo}>
        <View style={styles.titleRow}>
          <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
          <View style={[styles.roleBadge, { borderColor: roleThemeColor }]}>
            <Text style={[styles.roleBadgeText, { color: roleThemeColor }]}>
              You: {role.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={styles.stakesText} numberOfLines={1}>Stakes: {stakes}</Text>
      </View>

      {/* 3-Player Presence Gate Cards */}
      <View style={styles.presenceGrid}>
        {/* Plaintiff */}
        <View style={[styles.participantCard, styles.pCardBorder]}>
          <View style={styles.pInfo}>
            <View style={[styles.avatarBadge, { backgroundColor: "#2563eb" }]}>
              <Text style={styles.avatarLetter}>P</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.playerName} numberOfLines={1}>{plaintiff.name}</Text>
              <Text style={[styles.roleLabel, { color: "#2563eb" }]}>Plaintiff</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, plaintiff.online ? styles.statusHere : styles.statusAfk]}
            onPress={() => onTogglePresence("plaintiff")}
          >
            <Text style={[styles.statusBtnText, { color: plaintiff.online ? "#047857" : "#b91c1c" }]}>
              {plaintiff.online ? "HERE" : "AFK"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Judge */}
        <View style={[styles.participantCard, styles.jCardBorder]}>
          <View style={styles.pInfo}>
            <View style={[styles.avatarBadge, { backgroundColor: "#f59e0b" }]}>
              <Text style={styles.avatarLetter}>⚖️</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.playerName} numberOfLines={1}>{judge.name}</Text>
              <Text style={[styles.roleLabel, { color: "#b45309" }]}>Judge</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, judge.online ? styles.statusHere : styles.statusAfk]}
            onPress={() => onTogglePresence("judge")}
          >
            <Text style={[styles.statusBtnText, { color: judge.online ? "#047857" : "#b91c1c" }]}>
              {judge.online ? "HERE" : "AFK"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Defendant */}
        <View style={[styles.participantCard, styles.dCardBorder]}>
          <View style={styles.pInfo}>
            <View style={[styles.avatarBadge, { backgroundColor: "#dc2626" }]}>
              <Text style={styles.avatarLetter}>D</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.playerName} numberOfLines={1}>{defendant.name}</Text>
              <Text style={[styles.roleLabel, { color: "#dc2626" }]}>Defendant</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.statusBtn, defendant.online ? styles.statusHere : styles.statusAfk]}
            onPress={() => onTogglePresence("defendant")}
          >
            <Text style={[styles.statusBtnText, { color: defendant.online ? "#047857" : "#b91c1c" }]}>
              {defendant.online ? "HERE" : "AFK"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mutual Judge Handshake (Plaintiff and Defendant only - Judge cannot approve self) */}
      <View style={styles.handshakeBar}>
        <View style={styles.handshakeLeft}>
          <Text style={styles.handshakeLabel}>🤝 Judge Approval:</Text>
          <TouchableOpacity
            style={[styles.handshakeChip, plaintiff.approvedJudge ? styles.chipApproved : styles.chipPending]}
            onPress={() => onToggleApproveJudge("plaintiff")}
            disabled={role === "judge"}
          >
            <Text style={styles.handshakeChipText}>
              {plaintiff.approvedJudge ? "✓ P Approved" : "⏳ P Approve?"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.handshakeChip, defendant.approvedJudge ? styles.chipApproved : styles.chipPending]}
            onPress={() => onToggleApproveJudge("defendant")}
            disabled={role === "judge"}
          >
            <Text style={styles.handshakeChipText}>
              {defendant.approvedJudge ? "✓ D Approved" : "⏳ D Approve?"}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.honorText}>
          🏅 Honor: <Text style={styles.honorScores}>P:{plaintiff.honorScore || 120} • D:{defendant.honorScore || 115}</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0"
  },
  topBar: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  roomTag: {
    flexDirection: "row",
    alignItems: "center"
  },
  roomText: {
    color: "#fbbf24",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5
  },
  presencePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 5
  },
  presenceOnline: {
    backgroundColor: "rgba(16, 185, 129, 0.15)"
  },
  presencePaused: {
    backgroundColor: "rgba(239, 68, 68, 0.15)"
  },
  presenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  presenceText: {
    fontSize: 10,
    fontWeight: "700"
  },
  caseInfo: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  titleText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a"
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    borderWidth: 1,
    backgroundColor: "#f8fafc"
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800"
  },
  stakesText: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2
  },
  presenceGrid: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6
  },
  participantCard: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 6,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  pCardBorder: { borderColor: "#bfdbfe" },
  jCardBorder: { borderColor: "#fde68a" },
  dCardBorder: { borderColor: "#fecdd3" },
  pInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    minWidth: 0
  },
  avatarBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarLetter: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900"
  },
  nameCol: {
    flex: 1,
    minWidth: 0
  },
  playerName: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1e293b"
  },
  roleLabel: {
    fontSize: 8,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  statusBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5
  },
  statusHere: {
    backgroundColor: "#d1fae5"
  },
  statusAfk: {
    backgroundColor: "#fee2e2"
  },
  statusBtnText: {
    fontSize: 8,
    fontWeight: "900"
  },
  handshakeBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: "#f1f5f9"
  },
  handshakeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  handshakeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b"
  },
  handshakeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  chipApproved: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0"
  },
  chipPending: {
    backgroundColor: "#fffbeb",
    borderColor: "#fde68a"
  },
  handshakeChipText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#065f46"
  },
  honorText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748b"
  },
  honorScores: {
    fontWeight: "800",
    color: "#b45309"
  }
});
