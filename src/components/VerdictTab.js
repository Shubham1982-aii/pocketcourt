import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet
} from "react-native";

export default function VerdictTab({
  verdict,
  role,
  title,
  judgeName,
  plaintiffName,
  defendantName,
  onSealVerdict,
  onMarkPenaltyFulfilled,
  onCopyReceipt,
  onDownloadDossier
}) {
  const isSealed = verdict?.isFinal;
  const isJudge = role === "judge";

  const [selectedWinner, setSelectedWinner] = useState(verdict?.winner || "plaintiff");
  const [reasoning, setReasoning] = useState(
    verdict?.reasoning ||
      "Based on submitted evidence exhibits and witness testimony, the court establishes unauthorized usage and grants restitution."
  );
  const [penalty, setPenalty] = useState(
    verdict?.penalty || "Defendant must pay for next month's subscription and snacks."
  );

  const handleSeal = () => {
    if (!isJudge) {
      Alert.alert("Authority Violation", "Only the Neutral Judge has the authority to deliver the final verdict!");
      return;
    }
    onSealVerdict(selectedWinner, reasoning, penalty);
  };

  const handleFulfillVerification = () => {
    const winningRole = verdict.winner;
    if (winningRole !== "split" && !isJudge && role !== winningRole) {
      Alert.alert(
        "Authority Violation",
        `Only the winning party (${winningRole.toUpperCase()}) or the Judge can confirm that the penalty was fulfilled!`
      );
      return;
    }
    onMarkPenaltyFulfilled();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner */}
      <View style={styles.noticeBox}>
        <Text style={styles.noticeIcon}>⚖️</Text>
        <View style={styles.noticeTextCol}>
          <Text style={styles.noticeTitle}>
            {isJudge ? "Neutral Judge's Verdict Console" : "Court Verdict Chamber"}
          </Text>
          <Text style={styles.noticeText}>
            {isSealed
              ? "This case is permanently sealed and non-appealable."
              : isJudge
              ? "Review all proof and statements. Striking the gavel seals the case permanently."
              : "Awaiting the Neutral Judge's official deliberation and final ruling."}
          </Text>
        </View>
      </View>

      {!isSealed ? (
        /* If UNSEALED: Check if current role is Judge */
        isJudge ? (
          /* Judge Deliberation Form */
          <View style={styles.formCard}>
            {/* 1. Winner Selection */}
            <Text style={styles.sectionLabel}>1. SELECT FINAL RULING</Text>
            <View style={styles.winnerGrid}>
              <TouchableOpacity
                style={[styles.winnerBtn, selectedWinner === "plaintiff" && styles.winnerBtnActiveP]}
                onPress={() => setSelectedWinner("plaintiff")}
              >
                <Text style={[styles.winnerText, selectedWinner === "plaintiff" && styles.winnerTextActive]}>
                  Plaintiff Wins
                </Text>
                <Text style={styles.winnerSubtext}>{plaintiffName || "Aarav"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.winnerBtn, selectedWinner === "defendant" && styles.winnerBtnActiveD]}
                onPress={() => setSelectedWinner("defendant")}
              >
                <Text style={[styles.winnerText, selectedWinner === "defendant" && styles.winnerTextActive]}>
                  Defendant Wins
                </Text>
                <Text style={styles.winnerSubtext}>{defendantName || "Riya"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.winnerBtn, selectedWinner === "split" && styles.winnerBtnActiveSplit]}
                onPress={() => setSelectedWinner("split")}
              >
                <Text style={[styles.winnerText, selectedWinner === "split" && styles.winnerTextActive]}>
                  50/50 Split
                </Text>
                <Text style={styles.winnerSubtext}>Compromise</Text>
              </TouchableOpacity>
            </View>

            {/* 2. Reasoning */}
            <Text style={styles.sectionLabel}>2. COURT FINDINGS & REASONING</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={3}
              value={reasoning}
              onChangeText={setReasoning}
              placeholder="Explain why this decision was reached..."
              placeholderTextColor="#94a3b8"
            />

            {/* 3. Restitution Penalty */}
            <Text style={styles.sectionLabel}>3. BINDING RESTITUTION / PENALTY</Text>
            <TextInput
              style={styles.textInput}
              value={penalty}
              onChangeText={setPenalty}
              placeholder="e.g. Defendant pays for next dinner..."
              placeholderTextColor="#94a3b8"
            />

            {/* Seal Gavel Button */}
            <TouchableOpacity style={styles.gavelBtn} onPress={handleSeal}>
              <Text style={styles.gavelBtnIcon}>🔨</Text>
              <Text style={styles.gavelBtnText}>Strike Gavel & Seal Final Verdict</Text>
            </TouchableOpacity>

            <Text style={styles.gavelHint}>
              Only the agreed Neutral Judge can strike the final gavel.
            </Text>
          </View>
        ) : (
          /* Litigant Waiting Card */
          <View style={styles.waitingCard}>
            <Text style={styles.waitingIcon}>⏳</Text>
            <Text style={styles.waitingTitle}>Awaiting Judge's Deliberation</Text>
            <Text style={styles.waitingText}>
              Only {judgeName} has the legal authority to rule on this case. Once the gavel strikes, the final judgment and receipt will unlock here.
            </Text>
          </View>
        )
      ) : (
        /* Sealed Certificate */
        <View style={styles.certificateCard}>
          <View style={styles.certHeader}>
            <View style={styles.certTitleRow}>
              <Text style={styles.certGavelIcon}>⚖️</Text>
              <View>
                <Text style={styles.certEyebrow}>OFFICIAL BINDING JUDGMENT</Text>
                <Text style={styles.certCaseTitle} numberOfLines={1}>{title}</Text>
              </View>
            </View>
            <View style={styles.finalBadge}>
              <Text style={styles.finalBadgeText}>SEALED</Text>
            </View>
          </View>

          {/* Winner Outcome */}
          <View style={styles.certOutcomeBox}>
            <Text style={styles.certOutcomeLabel}>RULING OUTCOME</Text>
            <Text style={styles.certOutcomeText}>
              🏆{" "}
              {verdict.winner === "plaintiff"
                ? `Plaintiff Wins (${plaintiffName})`
                : verdict.winner === "defendant"
                ? `Defendant Wins (${defendantName})`
                : "50/50 Mutual Compromise"}
            </Text>
          </View>

          {/* Reasoning */}
          <View style={styles.certSection}>
            <Text style={styles.certSectionLabel}>FINDINGS & PROOF CITED</Text>
            <Text style={styles.certSectionContent}>{verdict.reasoning}</Text>
          </View>

          {/* Penalty */}
          <View style={styles.certSection}>
            <Text style={styles.certSectionLabel}>MANDATORY RESTITUTION / PENALTY</Text>
            <Text style={styles.certPenaltyContent}>👉 {verdict.penalty}</Text>
          </View>

          {/* Compliance & Honor Tracker */}
          <View style={styles.complianceBox}>
            <View style={styles.compLeft}>
              <Text style={styles.compLabel}>🏅 KARMA & COMPLIANCE TRACKER</Text>
              <Text style={[styles.compStatus, verdict.penaltyFulfilled && styles.compFulfilled]}>
                {verdict.penaltyFulfilled
                  ? "✅ Restitution Fulfilled (+25 Honor Awarded)"
                  : "⏳ Pending Proof of Restitution"}
              </Text>
            </View>
            {!verdict.penaltyFulfilled && (
              <TouchableOpacity style={styles.fulfillBtn} onPress={handleFulfillVerification}>
                <Text style={styles.fulfillBtnText}>✓ Confirm Fulfilled (+25)</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Signoff */}
          <View style={styles.signoffRow}>
            <Text style={styles.signoffText}>Presiding: {judgeName}</Text>
            <Text style={styles.signoffText}>Status: Final & Non-Appealable</Text>
          </View>

          {/* Action Buttons: Export Dossier & Copy Receipt */}
          <View style={styles.certActionsCol}>
            <TouchableOpacity style={styles.downloadDossierBtn} onPress={onDownloadDossier}>
              <Text style={styles.downloadDossierBtnText}>📥 Download / Export Case Dossier</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.receiptBtn} onPress={onCopyReceipt}>
              <Text style={styles.receiptBtnText}>📋 Copy Formatted Verdict Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  noticeBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 14,
    padding: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  noticeIcon: {
    fontSize: 22
  },
  noticeTextCol: {
    flex: 1
  },
  noticeTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a"
  },
  noticeText: {
    fontSize: 10,
    color: "#475569"
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 10
  },
  waitingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    gap: 6
  },
  waitingIcon: {
    fontSize: 32
  },
  waitingTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a"
  },
  waitingText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 16
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748b",
    letterSpacing: 0.5
  },
  winnerGrid: {
    flexDirection: "row",
    gap: 6
  },
  winnerBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    alignItems: "center"
  },
  winnerBtnActiveP: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff"
  },
  winnerBtnActiveD: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2"
  },
  winnerBtnActiveSplit: {
    borderColor: "#f59e0b",
    backgroundColor: "#fffbeb"
  },
  winnerText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#475569"
  },
  winnerTextActive: {
    color: "#0f172a"
  },
  winnerSubtext: {
    fontSize: 9,
    color: "#94a3b8",
    marginTop: 2
  },
  textArea: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 10,
    fontSize: 11,
    color: "#0f172a",
    minHeight: 70
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 11,
    color: "#0f172a"
  },
  gavelBtn: {
    backgroundColor: "#f59e0b",
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4
  },
  gavelBtnIcon: {
    fontSize: 16
  },
  gavelBtnText: {
    color: "#0f172a",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  gavelHint: {
    fontSize: 9,
    color: "#94a3b8",
    textAlign: "center"
  },
  certificateCard: {
    backgroundColor: "#020617",
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: "#f59e0b",
    gap: 10
  },
  certHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#1e293b",
    paddingBottom: 8
  },
  certTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1
  },
  certGavelIcon: {
    fontSize: 24
  },
  certEyebrow: {
    fontSize: 8,
    fontWeight: "900",
    color: "#fbbf24",
    letterSpacing: 1
  },
  certCaseTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#ffffff"
  },
  finalBadge: {
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    borderWidth: 1,
    borderColor: "#fbbf24",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99
  },
  finalBadgeText: {
    color: "#fbbf24",
    fontSize: 8,
    fontWeight: "900"
  },
  certOutcomeBox: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b"
  },
  certOutcomeLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94a3b8"
  },
  certOutcomeText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fbbf24",
    marginTop: 2
  },
  certSection: {
    gap: 2
  },
  certSectionLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.5
  },
  certSectionContent: {
    fontSize: 11,
    color: "#e2e8f0",
    backgroundColor: "#0f172a",
    padding: 8,
    borderRadius: 8,
    lineHeight: 15
  },
  certPenaltyContent: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6ee7b7",
    backgroundColor: "rgba(6, 78, 59, 0.3)",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)"
  },
  complianceBox: {
    backgroundColor: "#0f172a",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8
  },
  compLeft: {
    flex: 1
  },
  compLabel: {
    fontSize: 8,
    fontWeight: "800",
    color: "#fbbf24"
  },
  compStatus: {
    fontSize: 10,
    fontWeight: "700",
    color: "#cbd5e1",
    marginTop: 2
  },
  compFulfilled: {
    color: "#34d399"
  },
  fulfillBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  fulfillBtnText: {
    color: "#020617",
    fontSize: 9,
    fontWeight: "900"
  },
  signoffRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#1e293b"
  },
  signoffText: {
    fontSize: 9,
    color: "#64748b"
  },
  certActionsCol: {
    gap: 8,
    marginTop: 4
  },
  downloadDossierBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: "center"
  },
  downloadDossierBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  receiptBtn: {
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center"
  },
  receiptBtnText: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800"
  }
});
