import React, { useState, useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import { Theme } from "../theme";

type HeaderOverflowMenuProps = {
  onOpenSettings?: () => void;
  onLogout: () => void;
};

function createHeaderOverflowMenuStyles(theme: Theme) {
  return StyleSheet.create({
    trigger: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor: theme.accent,
    },
    pressed: {
      opacity: 0.75,
    },
    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.1)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
    },
    menu: {
      marginTop: 90,
      marginRight: 12,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.line,
      minWidth: 140,
      paddingVertical: 6,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    menuItemPressed: {
      backgroundColor: theme.surfaceSoft,
    },
    menuItemText: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "600",
    },
  });
}

export function HeaderOverflowMenu({
  onOpenSettings,
  onLogout,
}: HeaderOverflowMenuProps) {
  const theme = useTheme();
  const styles = useMemo(() => createHeaderOverflowMenuStyles(theme), [theme]);
  const [visible, setVisible] = useState(false);

  const closeMenu = () => setVisible(false);
  const handleOpenSettings = () => {
    closeMenu();
    onOpenSettings?.();
  };
  const handleLogout = () => {
    closeMenu();
    onLogout();
  };

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open menu"
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="ellipsis-vertical" size={18} color={theme.primary} />
      </Pressable>

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.backdrop} onPress={closeMenu}>
          <View style={styles.menu}>
            <Pressable
              accessibilityRole="menuitem"
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleOpenSettings}
            >
              <Ionicons name="settings-outline" size={16} color={theme.primary} />
              <Text style={styles.menuItemText}>Settings</Text>
            </Pressable>
            <Pressable
              accessibilityRole="menuitem"
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={16} color={theme.primary} />
              <Text style={styles.menuItemText}>Logout</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
