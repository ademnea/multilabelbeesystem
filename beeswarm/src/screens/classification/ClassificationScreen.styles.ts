import { StyleSheet } from "react-native";
import { THEME } from "../../theme";

export const classificationStyles = StyleSheet.create({
  appPage: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: THEME.primary,
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 11,
    color: "#9AA6B5",
    marginTop: 6,
  },
});
