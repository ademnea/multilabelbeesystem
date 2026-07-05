import { StyleSheet } from "react-native";
import { Theme } from "../../../theme";

export const createAlertsListStyles = (theme: Theme) => StyleSheet.create({
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    color: theme.textMuted,
    fontWeight: "600",
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: theme.primary,
  },
  errorBody: {
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  primaryButtonSmall: {
    marginTop: 12,
    backgroundColor: theme.accent,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  primaryButtonText: {
    color: theme.primary,
    fontWeight: "800",
    fontSize: 15,
  },
  appPage: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
  },
  hiveSummaryStrip: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  hiveSummaryPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.surface,
  },
  hiveSummaryPillActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  hiveSummaryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.textMuted,
  },
  hiveSummaryPillTextActive: {
    color: "#FFFFFF",
  },
  hiveSummaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  hiveListCount: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.textMuted,
    marginBottom: 10,
  },
  inlineState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  stateTextSmall: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: "600",
  },
  alertCard: {
    flexDirection: "row",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  alertCardBody: { flex: 1, padding: 14, gap: 8 },
  alertCardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  alertCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceSoft,
  },
  alertCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.primary,
    marginBottom: 3,
  },
  alertCardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  alertCardMetaText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: "500",
  },
  alertCardMetaDot: { color: theme.textMuted, fontSize: 11 },
  alertCardSummary: { fontSize: 12, color: theme.textMuted, lineHeight: 17 },
  pressedRow: {
    opacity: 0.85,
  },
  hiveAlertGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 14,
    marginBottom: 10,
    padding: 14,
    gap: 12,
  },
  hiveAlertGroupIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.surfaceSoft,
  },
  hiveAlertGroupInfo: { flex: 1, gap: 2 },
  hiveAlertGroupName: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.primary,
  },
  hiveAlertGroupMetaText: {
    fontSize: 11,
    color: theme.textMuted,
    fontWeight: "500",
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F97316",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  rowBetween: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

// ── Dashboard alert card ──
dashboardAlertsCard: {
  backgroundColor: theme.surface,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 14,
  padding: 14,
  marginBottom: 14,
},

dashboardAlertsTopRow: {
  flexDirection: "row",
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: 10,
},

dashboardAlertsTitleWrap: {
  flex: 1,
},

dashboardAlertsTitle: {
  fontSize: 15,
  fontWeight: "800",
  color: theme.primary,
},

dashboardAlertsSubTitle: {
  fontSize: 11,
  color: theme.textMuted,
  fontWeight: "600",
  marginTop: 2,
},

hiveAlertCountBadge: {
  backgroundColor: theme.surfaceSoft,
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 3,
  borderWidth: 1,
  borderColor: theme.line,
},

hiveAlertCountText: {
  fontSize: 11,
  fontWeight: "700",
  color: theme.textMuted,
},

dashboardAlertMenuRow: {
  flexDirection: "row",
  gap: 8,
  marginBottom: 8,
},

dashboardAlertMenuChip: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 999,
  paddingHorizontal: 10,
  paddingVertical: 6,
  backgroundColor: theme.surface,
},

dashboardAlertMenuChipActive: {
  backgroundColor: theme.primary,
  borderColor: theme.primary,
},

dashboardAlertMenuChipText: {
  fontSize: 12,
  fontWeight: "700",
  color: theme.primary,
},

dashboardAlertMenuChipTextActive: {
  color: "#FFFFFF",
},

dashboardAlertSubMenu: {
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 12,
  backgroundColor: theme.surface,
  padding: 10,
  marginBottom: 8,
  gap: 8,
},

dashboardAlertSubMenuHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

dashboardAlertSubMenuTitle: {
  fontSize: 12,
  fontWeight: "800",
  color: theme.primary,
},

dashboardAlertSubMenuCloseBtn: {
  padding: 4,
  borderRadius: 999,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: theme.surface,
  borderWidth: 1,
  borderColor: theme.line,
},

dashboardAlertSubMenuDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
},

dashboardAlertSubMenuList: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 8,
},

dashboardAlertSubMenuItem: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 999,
  backgroundColor: theme.surface,
  paddingHorizontal: 10,
  paddingVertical: 7,
},

dashboardAlertSubMenuItemActive: {
  borderColor: theme.primary,
  backgroundColor: theme.surfaceSoft,
},

dashboardAlertSubMenuItemText: {
  fontSize: 11,
  fontWeight: "700",
  color: theme.primary,
  maxWidth: 160,
},

dashboardAlertSubMenuItemTextActive: {
  color: theme.primary,
},

dashboardAlertSubMenuEmpty: {
  fontSize: 11,
  color: theme.textMuted,
  fontWeight: "600",
},

dashboardAlertsInlineError: {
  marginTop: 8,
  fontSize: 11,
  color: "#B91C1C",
  fontWeight: "600",
},

dashboardAlertScroller: {
  marginTop: 10,
  gap: 8,
  paddingRight: 4,
},

dashboardAlertCompactCard: {
  width: 165,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 12,
  backgroundColor: theme.surface,
  padding: 10,
  gap: 5,
},

dashboardAlertCompactCardActive: {
  borderColor: theme.primary,
  backgroundColor: theme.surfaceSoft,
},

dashboardAlertCompactTopRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 5,
},

dashboardAlertCompactDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
},

dashboardAlertCompactHive: {
  fontSize: 10,
  fontWeight: "700",
  color: theme.textMuted,
},

dashboardAlertCompactTitle: {
  fontSize: 12,
  fontWeight: "800",
  color: theme.primary,
},

dashboardAlertCompactDate: {
  fontSize: 10,
  color: theme.textMuted,
  fontWeight: "600",
},

dashboardAlertsEmptyState: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  borderWidth: 1,
  borderColor: "#BBF7D0",
  backgroundColor: theme.isDark ? "#064E3B" : "#F0FDF4",
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
},

dashboardAlertsEmptyStateText: {
  fontSize: 11,
  color: theme.isDark ? "#22C55E" : "#166534",
  fontWeight: "700",
},

dashboardAlertDetailsCard: {
  marginTop: 10,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 12,
  backgroundColor: theme.surface,
  padding: 12,
  gap: 5,
},

dashboardAlertDetailsTitle: {
  flex: 1,
  marginRight: 8,
  fontSize: 14,
  fontWeight: "800",
  color: theme.primary,
},

dashboardAlertDetailsSeverity: {
  borderRadius: 999,
  paddingHorizontal: 9,
  paddingVertical: 4,
},

dashboardAlertDetailsSeverityText: {
  fontSize: 11,
  fontWeight: "800",
},

dashboardAlertDetailsMeta: {
  fontSize: 11,
  fontWeight: "600",
  color: theme.textMuted,
},

dashboardAlertDetailsSummary: {
  fontSize: 12,
  lineHeight: 18,
  color: theme.textMuted,
},

dashboardAlertDetailsLink: {
  marginTop: 4,
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  gap: 2,
  borderWidth: 1,
  borderColor: theme.line,
  borderRadius: 999,
  backgroundColor: theme.surfaceSoft,
  paddingHorizontal: 10,
  paddingVertical: 7,
},

dashboardAlertDetailsLinkText: {
  fontSize: 11,
  fontWeight: "800",
  color: theme.primary,
},

  
});
