import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function WitnessBanner({ witnessPass, onDropTestimony, onDismiss }) {
  if (!witnessPass?.active) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.infoCol}>
        <Text style={styles.title} numberOfLines={1}>
          🕵️ Witness Summoned: {witnessPass.name} (60s Pass)
        </Text>
        <Text style={styles.subtitle}>
          Neutral witness can give 1 official testimony statement.
        </Text>
      </View>
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.testimonyBtn} onPress={onDropTestimony}>
          <Text style={styles.testimonyBtnText}>Post Testimony</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
          <Text style={styles.dismissBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#581c87",
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  infoCol: {
    flex: 1
  },
  title: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800"
  },
  subtitle: {
    color: "#e9d5ff",
    fontSize: 9
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  testimonyBtn: {
    backgroundColor: "#fbbf24",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  testimonyBtnText: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "900"
  },
  dismissBtn: {
    backgroundColor: "#3b0764",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6
  },
  dismissBtnText: {
    color: "#e9d5ff",
    fontSize: 9,
    fontWeight: "800"
  }
});
