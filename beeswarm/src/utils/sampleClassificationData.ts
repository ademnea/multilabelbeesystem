import { AlertSeverity } from "../api";

export interface ClassificationAlert {
  id: string;
  hiveId: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  classification: string;
}

// Sample classification types from model
export const CLASSIFICATION_TYPES = {
  PRESSWARM: "pre-swarm",
  SWARM: "swarm",
  DISEASE: "disease",
  MITE_INFESTATION: "mite_infestation",
  QUEEN_LOSS: "queen_loss",
  HEALTHY: "healthy",
} as const;

// Map classifications to alert details
const classificationAlertMap: Record<
  string,
  { title: string; severity: AlertSeverity; message: string }
> = {
  [CLASSIFICATION_TYPES.PRESSWARM]: {
    title: "Pre-swarm Activity Detected",
    severity: "Warning",
    message:
      "Model detected pre-swarm behavior patterns. Monitor closely for swarm preparations.",
  },
  [CLASSIFICATION_TYPES.SWARM]: {
    title: "Swarm Alert",
    severity: "Critical",
    message: "Swarm activity detected! Immediate action may be required.",
  },
  [CLASSIFICATION_TYPES.DISEASE]: {
    title: "Potential Disease",
    severity: "Critical",
    message:
      "Model detected signs of disease. Check for symptoms and consider treatment.",
  },
  [CLASSIFICATION_TYPES.MITE_INFESTATION]: {
    title: "Mite Infestation Detected",
    severity: "Warning",
    message: "Model detected high mite levels. Consider treatment options.",
  },
  [CLASSIFICATION_TYPES.QUEEN_LOSS]: {
    title: "Queen Loss Suspected",
    severity: "Critical",
    message: "Pattern suggests queen loss. Verify and plan requeening if needed.",
  },
  [CLASSIFICATION_TYPES.HEALTHY]: {
    title: "Hive Status Normal",
    severity: "Info",
    message: "Hive is operating normally with no issues detected.",
  },
};

// Generate a sample classification alert
export function generateSampleClassification(
  hiveId: string,
  classificationOverride?: string
): ClassificationAlert {
  const classifications = Object.values(CLASSIFICATION_TYPES);
  const randomClassification =
    classificationOverride ||
    classifications[Math.floor(Math.random() * classifications.length)];

  const alertDetails = classificationAlertMap[randomClassification];

  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hiveId,
    severity: alertDetails.severity,
    title: alertDetails.title,
    message: alertDetails.message,
    timestamp: new Date(),
    classification: randomClassification,
  };
}

// Generate multiple sample classifications for testing
export function generateBatchSampleClassifications(
  hiveIds: string[],
  count: number = hiveIds.length
): ClassificationAlert[] {
  const alerts: ClassificationAlert[] = [];
  for (let i = 0; i < count; i++) {
    const hiveId = hiveIds[i % hiveIds.length];
    alerts.push(generateSampleClassification(hiveId));
  }
  return alerts;
}
