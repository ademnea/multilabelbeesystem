import Toast from "react-native-toast-message";
import { AlertSeverity } from "../api";
import { ClassificationAlert } from "./sampleClassificationData";

export interface ToastOptions {
  duration?: number;
  position?: "top" | "bottom";
}

type ToastType = "success" | "error" | "info" | "warning";

function getSeverityColor(severity: AlertSeverity): string {
  switch (severity) {
    case "Critical":
      return "#D45353"; // Red
    case "Warning":
      return "#F2A93B"; // Orange
    case "Info":
      return "#49B25C"; // Green
    default:
      return "#666A73"; // Gray
  }
}

function getSeverityIcon(severity: AlertSeverity): string {
  switch (severity) {
    case "Critical":
      return "🚨";
    case "Warning":
      return "⚠️";
    case "Info":
      return "ℹ️";
    default:
      return "📌";
  }
}

export function showClassificationAlert(
  alert: ClassificationAlert,
  options: ToastOptions = {}
) {
  const { duration = 5000, position = "top" } = options;
  const icon = getSeverityIcon(alert.severity);

  Toast.show({
    type: alert.severity.toLowerCase() === "critical" ? "error" : "info",
    text1: `${icon} ${alert.title}`,
    text2: alert.message,
    visibilityTime: duration,
    position,
    topOffset: 40,
  });
}

export function showAlert(
  title: string,
  message: string,
  severity: AlertSeverity = "Info",
  options: ToastOptions = {}
) {
  const { duration = 4000, position = "top" } = options;
  const icon = getSeverityIcon(severity);
  const toastType: ToastType =
    severity === "Critical" ? "error" : severity === "Warning" ? "warning" : "info";

  Toast.show({
    type: toastType,
    text1: `${icon} ${title}`,
    text2: message,
    visibilityTime: duration,
    position,
    topOffset: 40,
  });
}

export function showSuccessAlert(
  title: string,
  message: string,
  options: ToastOptions = {}
) {
  const { duration = 3000, position = "bottom" } = options;

  Toast.show({
    type: "success",
    text1: `✅ ${title}`,
    text2: message,
    visibilityTime: duration,
    position,
  });
}

export function dismissAlert() {
  Toast.hide();
}
