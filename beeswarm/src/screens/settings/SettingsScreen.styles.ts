import { StyleSheet } from "react-native";
import { THEME } from "../../theme";

type ThemeSnapshot = typeof THEME;

export function createSettingsStyles(t: ThemeSnapshot) {
  return StyleSheet.create({
  settingsPage: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 26,
    backgroundColor: t.page,
    gap: 12,
  },
settingsSection: {
    backgroundColor: t.surface,
    borderWidth: 1,
    borderColor: t.line,
    borderRadius: 12,
    padding: 12,
  },
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: t.primary,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  settingsAccountCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: t.surfaceSoft,
    borderWidth: 1,
    borderColor: t.line,
  },
  settingsAccountName: {
    fontSize: 14,
    fontWeight: "700",
    color: t.text,
  },
  settingsAccountEmail: {
    marginTop: 2,
    fontSize: 12,
    color: t.textMuted,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsRowColumn: {
    gap: 10,
  },
  settingsRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: t.text,
  },
  settingsRowHint: {
    marginTop: 2,
    fontSize: 12,
    color: t.textMuted,
    lineHeight: 18,
  },
  settingsDivider: {
    marginVertical: 10,
    height: 1,
    backgroundColor: t.line,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: t.surfaceSoft,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.line,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 8,
  },
  segmentButtonActive: {
    backgroundColor: t.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: t.textMuted,
  },
  segmentTextActive: {
    color: t.surface,
  },
  settingsActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
settingsSecondaryButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: t.line,
    backgroundColor: t.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  settingsSecondaryButtonText: {
    color: t.text,
    fontWeight: "700",
    fontSize: 13,
  },
  settingsPrimaryButton: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: t.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  settingsPrimaryButtonText: {
    color: t.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  });
}

export const settingsStyles = createSettingsStyles(THEME);