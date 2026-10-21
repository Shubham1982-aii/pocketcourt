import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function RecessBanner({ missingPlayerNames, onMarkAllPresent }) {
  return (
    <View style={styles.banner}>
      <View style={styles.textRow}>
        <Text style={styles.icon}>⏸️</Text>
        <Text style={styles.message}>
          Court Paused: Waiting for {missingPlayerNames || "all 3 participants"}. All 3 must be present!
        </Text>
      </View>
      <TouchableOpacity style={styles.resumeBtn} onPress={onMarkAllPresent}>
        <Text style={styles.resumeBtnText}>Mark All Present</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#e11d48",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8
  },
  textRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  icon: {
    fontSize: 14
  },
  message: {
    flex: 1,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700"
  },
  resumeBtn: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  resumeBtnText: {
    color: "#be123c",
    fontSize: 9,
    fontWeight: "900"
  }
});
