import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Share,
  StyleSheet
} from "react-native";

export default function PreTrialLobby({
  roomId,
  title,
  stakes,
  role,
  participants,
  currentUserUid,
  onClaimRole,
  onToggleReady,
  onCommenceTrial
}) {
  const p = participants?.plaintiff || { name: "Aarav", ready: true };
  const j = participants?.judge || { name: "Judge Kabir", ready: true };
  const d = participants?.defendant || { name: "Riya", ready: true };

  const readyCount = (p.ready ? 1 : 0) + (j.ready ? 1 : 0) + (d.ready ? 1 : 0);
  const allReady = readyCount === 3;

  const handleShareInvite = async () => {
    const inviteText = `⚖️ POCKETCOURT INVITE: Join the Pre-Trial Lobby for Case #${roomId} ("${title}"). Claim your slot: https://pocketcourt.app/room/${roomId}`;
    try {
      await Share.share({ message: inviteText, title: "PocketCourt Invite" });
    } catch (e) {}
  };

  const renderSlotActions = (slotKey, slotData) => {
    const isCurrent = role === slotKey;
    const isOwnedByOther =
      slotData.uid &&
      currentUserUid &&
      slotData.uid !== currentUserUid &&
      slotData.name &&
      !slotData.name.includes("Waiting");

    return (
      <View style={styles.slotActions}>
        <TouchableOpacity
          style={[
            styles.readyBtn,
            slotData.ready ? styles.readyBtnActive : styles.readyBtnIdle,
            !isCurrent && styles.readyBtnDisabled
          ]}
          onPress={() => isCurrent && onToggleReady(slotKey)}
          disabled={!isCurrent}
        >
          <Text
            style={[
              styles.readyBtnText,
              slotData.ready ? styles.readyTextActive : styles.readyTextIdle
            ]}
          >
            {slotData.ready ? "✓ Ready" : isCurrent ? "⏳ Tap if Ready" : "⏳ Waiting"}
          </Text>
        </TouchableOpacity>

        {isCurrent ? (
          <View style={styles.myRoleBadge}>
            <Text style={styles.myRoleBadgeText}>YOU</Text>
          </View>
        ) : isOwnedByOther ? (
          <View style={styles.lockedBadge}>
            <Text style={styles.lockedBadgeText}>🔒 Taken</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => onClaimRole(slotKey)}
          >
            <Text style={styles.claimText}>✋ Claim</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.docketTag}>
          <Text style={styles.docketTagText}>PRE-TRIAL GATHERING LOBBY</Text>
        </View>
        <Text style={styles.caseTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.stakesText} numberOfLines={2}>Stakes: {stakes}</Text>
      </View>

      {/* 3-Player Slot Roster */}
      <View style={styles.rosterCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.rosterTitle}>Courtroom Roster</Text>
          <Text style={styles.rosterCounter}>{readyCount}/3 Ready</Text>
        </View>

        {/* Plaintiff Slot */}
        <View style={[styles.slotRow, styles.pSlotBorder]}>
          <View style={styles.slotLeft}>
            <View style={[styles.avatar, { backgroundColor: "#2563eb" }]}>
              <Text style={styles.avatarText}>P</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.slotName} numberOfLines={1}>{p.name}</Text>
              <Text style={[styles.slotRole, { color: "#2563eb" }]}>Plaintiff</Text>
            </View>
          </View>
          {renderSlotActions("plaintiff", p)}
        </View>

        {/* Judge Slot */}
        <View style={[styles.slotRow, styles.jSlotBorder]}>
          <View style={styles.slotLeft}>
            <View style={[styles.avatar, { backgroundColor: "#f59e0b" }]}>
              <Text style={styles.avatarText}>⚖️</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.slotName} numberOfLines={1}>{j.name}</Text>
              <Text style={[styles.slotRole, { color: "#b45309" }]}>Neutral Judge</Text>
            </View>
          </View>
          {renderSlotActions("judge", j)}
        </View>

        {/* Defendant Slot */}
        <View style={[styles.slotRow, styles.dSlotBorder]}>
          <View style={styles.slotLeft}>
            <View style={[styles.avatar, { backgroundColor: "#dc2626" }]}>
              <Text style={styles.avatarText}>D</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.slotName} numberOfLines={1}>{d.name}</Text>
              <Text style={[styles.slotRole, { color: "#dc2626" }]}>Defendant</Text>
            </View>
          </View>
          {renderSlotActions("defendant", d)}
        </View>
      </View>

      {/* Share Invite & Launch Trial Card */}
      <View style={styles.actionCard}>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleShareInvite}>
          <Text style={styles.inviteBtnText}>📲 Share Room Invite (WhatsApp / Chat)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.commenceBtn, !allReady && styles.commenceBtnDisabled]}
          onPress={onCommenceTrial}
          disabled={!allReady}
        >
          <Text style={[styles.commenceBtnText, !allReady && styles.commenceBtnTextDisabled]}>
            {allReady ? "🔨 All 3 Ready — Commence Trial!" : `Waiting for all 3 players to be Ready (${readyCount}/3)`}
          </Text>
        </TouchableOpacity>

        {role === "judge" && !allReady && (
          <TouchableOpacity
            style={styles.soloTestBtn}
            onPress={() => {
              onToggleReady("plaintiff");
              onToggleReady("defendant");
              onToggleReady("judge");
            }}
          >
            <Text style={styles.soloTestBtnText}>⚡ Judge Override: Mark All 3 Ready</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.hintText}>
          Trial only starts once Plaintiff, Defendant, and Neutral Judge all confirm they are ready.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
    justifyContent: "center",
    gap: 14
  },
  header: {
    alignItems: "center",
    gap: 4
  },
  docketTag: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "#fbbf24",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
    marginBottom: 4
  },
  docketTagText: {
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1
  },
  caseTitle: {
    fontSize: 15,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center"
  },
  stakesText: {
    fontSize: 11,
    color: "#94a3b8",
    textAlign: "center"
  },
  rosterCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 8
  },
  rosterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#1e293b",
    paddingBottom: 6
  },
  rosterTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#cbd5e1"
  },
  rosterCounter: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fbbf24"
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#020617",
    padding: 8,
    borderRadius: 12,
    borderWidth: 1
  },
  pSlotBorder: { borderColor: "#1e3a8a" },
  jSlotBorder: { borderColor: "#78350f" },
  dSlotBorder: { borderColor: "#881337" },
  slotLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900"
  },
  nameCol: {
    flex: 1
  },
  slotName: {
    fontSize: 11,
    fontWeight: "800",
    color: "#ffffff"
  },
  slotRole: {
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  slotActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  readyBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1
  },
  readyBtnActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    borderColor: "#10b981"
  },
  readyBtnIdle: {
    backgroundColor: "rgba(148, 163, 184, 0.1)",
    borderColor: "#475569"
  },
  readyBtnDisabled: {
    opacity: 0.5
  },
  readyBtnText: {
    fontSize: 9,
    fontWeight: "800"
  },
  readyTextActive: {
    color: "#34d399"
  },
  readyTextIdle: {
    color: "#94a3b8"
  },
  myRoleBadge: {
    backgroundColor: "#166534",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6
  },
  myRoleBadgeText: {
    color: "#86efac",
    fontSize: 9,
    fontWeight: "900"
  },
  lockedBadge: {
    backgroundColor: "#1e293b",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  lockedBadgeText: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: "700"
  },
  claimButton: {
    backgroundColor: "rgba(37, 99, 235, 0.2)",
    borderWidth: 1,
    borderColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  claimText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#60a5fa"
  },
  actionCard: {
    backgroundColor: "#0f172a",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
    gap: 8
  },
  inviteBtn: {
    backgroundColor: "#312e81",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  inviteBtnText: {
    color: "#c7d2fe",
    fontSize: 11,
    fontWeight: "800"
  },
  commenceBtn: {
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center"
  },
  commenceBtnDisabled: {
    backgroundColor: "#1e293b"
  },
  commenceBtnText: {
    color: "#0f172a",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  commenceBtnTextDisabled: {
    color: "#64748b"
  },
  hintText: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center"
  },
  soloTestBtn: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderWidth: 1,
    borderColor: "#f59e0b",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center"
  },
  soloTestBtnText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "800"
  }
});
