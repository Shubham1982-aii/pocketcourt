import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function ObjectionBanner({
  objection,
  isJudge,
  onSustain,
  onOverrule
}) {
  if (!objection) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.contentRow}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.objectionText} numberOfLines={2}>
          OBJECTION by {objection.byName}: "{objection.reason}"
        </Text>
      </View>

      {isJudge && (
        <View style={styles.btnRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.sustainBtn]} onPress={onSustain}>
            <Text style={styles.sustainBtnText}>Sustain</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.overruleBtn]} onPress={onOverrule}>
            <Text style={styles.overruleBtnText}>Overrule</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    borderBottomWidth: 1,
    borderColor: "#d97706"
  },
  contentRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  icon: {
    fontSize: 14
  },
  objectionText: {
    flex: 1,
    color: "#0f172a",
    fontSize: 10,
    fontWeight: "900"
  },
  btnRow: {
    flexDirection: "row",
    gap: 5
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  sustainBtn: {
    backgroundColor: "#0f172a"
  },
  sustainBtnText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800"
  },
  overruleBtn: {
    backgroundColor: "#ffffff"
  },
  overruleBtnText: {
    color: "#0f172a",
    fontSize: 9,
    fontWeight: "800"
  }
});
