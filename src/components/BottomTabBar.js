import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function BottomTabBar({ activeTab, evidenceCount, onSelectTab }) {
  const tabs = [
    { key: "chat", label: "Court Chat", icon: "💬" },
    { key: "evidence", label: `Proof (${evidenceCount || 0})`, icon: "📁" },
    { key: "verdict", label: "Verdict", icon: "⚖️" },
    { key: "lobby", label: "Lobby", icon: "🏛️" }
  ];

  return (
    <View style={styles.bar}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, isActive && styles.tabBtnActive]}
            onPress={() => onSelectTab(tab.key)}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    gap: 6
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: "#0f172a"
  },
  icon: {
    fontSize: 14
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748b",
    marginTop: 2
  },
  labelActive: {
    color: "#ffffff"
  }
});
