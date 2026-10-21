import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet
} from "react-native";

export default function EvidenceLockerTab({
  evidence,
  role,
  onPickProof,
  onUpdateEvidenceStatus,
  onCiteExhibit,
  onInspectImage
}) {
  const [filter, setFilter] = useState("all");

  const isJudge = role === "judge";
  const isLitigant = role === "plaintiff" || role === "defendant";

  const filtered = (evidence || []).filter((item) => {
    if (filter === "all") return true;
    return item.submittedBy === filter;
  });

  const renderExhibitCard = ({ item }) => {
    const isAdmitted = item.status === "admitted";
    const isDismissed = item.status === "dismissed";
    const isPlaintiff = item.submittedBy === "plaintiff";

    return (
      <View style={styles.card}>
        {/* Top Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{item.code || "Exhibit"}</Text>
            </View>
            <View style={[styles.submitterBadge, isPlaintiff ? styles.pBadge : styles.dBadge]}>
              <Text style={[styles.submitterText, { color: isPlaintiff ? "#2563eb" : "#dc2626" }]}>
                {item.submitterName || item.submittedBy}
              </Text>
            </View>
          </View>

          {/* Stamp Status */}
          <View style={[styles.stampPill, isAdmitted ? styles.stampAdmitted : isDismissed ? styles.stampDismissed : styles.stampPending]}>
            <Text style={[styles.stampText, { color: isAdmitted ? "#047857" : isDismissed ? "#b91c1c" : "#b45309" }]}>
              {isAdmitted ? "✓ ADMITTED" : isDismissed ? "✕ DISMISSED" : "⏳ PENDING"}
            </Text>
          </View>
        </View>

        {/* Content */}
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.typeText}>{item.type || "Official Exhibit"}</Text>
        <Text style={styles.detailText}>{item.detail}</Text>

        {/* Thumbnail Preview */}
        {item.imageUrl ? (
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={() => onInspectImage && onInspectImage(item.imageUrl, item.title)}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.zoomTag}>
              <Text style={styles.zoomText}>🔍 Tap to View</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Actions Row (STRICT ROLES) */}
        <View style={styles.cardFooter}>
          <TouchableOpacity style={styles.citeBtn} onPress={() => onCiteExhibit(item)}>
            <Text style={styles.citeBtnText}>💬 Cite in Court Chat</Text>
          </TouchableOpacity>

          {/* Review Buttons: Judge ONLY */}
          {isJudge ? (
            <View style={styles.judgeActions}>
              <TouchableOpacity
                style={[styles.judgeBtn, styles.admitBtn]}
                onPress={() => onUpdateEvidenceStatus(item.id, "admitted")}
              >
                <Text style={styles.admitBtnText}>✓ Admit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.judgeBtn, styles.dismissBtn]}
                onPress={() => onUpdateEvidenceStatus(item.id, "dismissed")}
              >
                <Text style={styles.dismissBtnText}>✕ Dismiss</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.nonJudgeNotice}>Judge reviews admissibility</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header & Filter Bar */}
      <View style={styles.topSection}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.heading}>📁 Evidence Locker</Text>
            <Text style={styles.subheading}>
              {isJudge
                ? "You are Neutral Judge: Evaluate and Admit or Dismiss proof"
                : "Submit exhibits and cite them in your arguments"}
            </Text>
          </View>
          {/* Add Proof: Litigants ONLY */}
          {isLitigant && (
            <TouchableOpacity style={styles.addProofBtn} onPress={onPickProof}>
              <Text style={styles.addProofBtnText}>+ Add Proof</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filterRow}>
          {[
            { key: "all", label: "All Exhibits" },
            { key: "plaintiff", label: "Plaintiff" },
            { key: "defendant", label: "Defendant" }
          ].map((f) => {
            const isActive = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List */}
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={filtered}
        keyExtractor={(item) => item.id || String(Math.random())}
        renderItem={renderExhibitCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>No exhibits found</Text>
            <Text style={styles.emptyText}>
              {isLitigant ? 'Tap "+ Add Proof" to submit evidence.' : "Waiting for litigants to file exhibits."}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc"
  },
  topSection: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#e2e8f0"
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  heading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a"
  },
  subheading: {
    fontSize: 10,
    color: "#64748b"
  },
  addProofBtn: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  addProofBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "800"
  },
  filterRow: {
    flexDirection: "row",
    gap: 6
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f1f5f9"
  },
  filterChipActive: {
    backgroundColor: "#0f172a"
  },
  filterText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#475569"
  },
  filterTextActive: {
    color: "#ffffff"
  },
  list: {
    flex: 1,
    paddingHorizontal: 12
  },
  listContent: {
    paddingVertical: 12,
    gap: 10
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  codeBadge: {
    backgroundColor: "#0f172a",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  codeText: {
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: "900"
  },
  submitterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  pBadge: { backgroundColor: "#eff6ff", borderColor: "#bfdbfe" },
  dBadge: { backgroundColor: "#fef2f2", borderColor: "#fecdd3" },
  submitterText: {
    fontSize: 9,
    fontWeight: "800"
  },
  stampPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99
  },
  stampAdmitted: { backgroundColor: "#d1fae5" },
  stampDismissed: { backgroundColor: "#fee2e2" },
  stampPending: { backgroundColor: "#fef3c7" },
  stampText: {
    fontSize: 9,
    fontWeight: "900"
  },
  titleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0f172a"
  },
  typeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#4f46e5",
    marginBottom: 4
  },
  detailText: {
    fontSize: 11,
    color: "#334155",
    backgroundColor: "#f8fafc",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8
  },
  imageContainer: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 8,
    position: "relative"
  },
  thumbnail: {
    width: "100%",
    height: 140,
    borderRadius: 10
  },
  zoomTag: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  zoomText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700"
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: "#f1f5f9"
  },
  citeBtn: {
    paddingVertical: 4
  },
  citeBtnText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#4f46e5"
  },
  judgeActions: {
    flexDirection: "row",
    gap: 4
  },
  judgeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  admitBtn: { backgroundColor: "#d1fae5" },
  dismissBtn: { backgroundColor: "#fee2e2" },
  admitBtnText: { color: "#047857", fontSize: 9, fontWeight: "800" },
  dismissBtnText: { color: "#b91c1c", fontSize: 9, fontWeight: "800" },
  nonJudgeNotice: {
    fontSize: 9,
    color: "#94a3b8",
    fontStyle: "italic"
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center"
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2
  },
  emptyText: {
    fontSize: 11,
    color: "#64748b",
    textAlign: "center"
  }
});
