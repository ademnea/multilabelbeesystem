import { StyleSheet } from "react-native";
import { THEME } from "../../theme";

export const mapStyles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: THEME.page,
  },
  
  floatingHeader: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.primary,
    marginBottom: 2,
  },
  
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textMuted,
    marginTop: 2,
  },
  
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  refreshButtonText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(248, 249, 251, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    zIndex: 5,
  },
  
  loadingText: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: "600",
  },
  
  emptyState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: THEME.page,
  },
  
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: THEME.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  
  emptyStateText: {
    fontSize: 14,
    color: THEME.textMuted,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
  },
  
  errorOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  
  errorText: {
    color: "#B42318",
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  
  retryButton: {
    backgroundColor: "#DC2626",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  
  floatingLegend: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  legendText: {
    fontSize: 13,
    color: THEME.primary,
    fontWeight: "600",
  },

  unmappedBanner: {
    position: "absolute",
    top: 96,
    left: 16,
    right: 16,
    zIndex: 9,
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },

  unmappedBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 6,
  },

  unmappedHiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  unmappedHiveName: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.text,
  },

  unmappedHiveAction: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563EB",
  },
});