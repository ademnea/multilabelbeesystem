/**
 * TypeScript type definitions for BSADS API
 */

export type HiveStatus = 
  | "active" 
  | "inactive_hive" 
  | "swarming" 
  | "Abscondment" 
  | "external_noise" 
  | "quacking_queens" 
  | "pests" 
  | "queenless"
  | "unknown";

export type AlertSeverity = "Critical" | "Warning" | "Info";

export type BeekeeperProfile = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string;
  address: string | null;
  profile_photo_url: string | null;
  api_key: string | null;
  server_url: string | null;
};

export type AuthResponse = {
  token: string;
  beekeeper: BeekeeperProfile;
};

export type Hive = {
  id: string;
  name: string;
  location: string;
  type: string;
  installationDate: string;
  status: HiveStatus;
  latitude?: number;
  longitude?: number;
  stateSince?: string;
  lastInferenceAt?: string | null;
};

export type WeatherData = {
  temperature: number;
  humidity: number;
  timestamp: string;
  weatherDescription?: string;
};

export type HiveDetailData = {
  id: string;
  name: string;
  location: string;
  status: HiveStatus;
  stateSince?: string;
  alertTitle: string;
  alertMessage: string;
  metrics: number[];
  metricSeries: Array<{
    timeLabel: string;
    temperatureC: number;
    humidityPercent: number;
  }>;
  mapLabel: string;
  acknowledged: boolean;
  lastInferenceAt?: string | null;
  confidenceScore?: number | null;
  predictionDetails?: {
    predicted_class: string;
    confidence: number;
    top_predictions: Array<{ class: string; confidence: number }>;
  } | null;
  weather?: WeatherData;
  lastAnalysisTime?: string | null;
  latitude?: number;
  longitude?: number;
  type?: string;
  installationDate?: string;
};

export type AlertItem = {
  id: string;
  hiveId: string;
  severity: AlertSeverity;
  title: string;
  date: string;
  summary: string;
  alertStatus: string;
  hiveName: string;
  viewedAt?: string | null;  // set when farmer has opened the alert
};

export type AudioRecording = {
  id: string;
  file_path: string;
  duration_seconds: number;
  recorded_at: string;
};

export type AlertDetailData = {
  id: string;
  hiveId: string;
  hiveName: string;
  severity: AlertSeverity;
  title: string;
  time: string;
  createdAt?: string;
  details: string;
  acknowledged: boolean;
  audioRecording?: AudioRecording | null; 
  advisory?: Advisory | null;
  predictionDetails?: {
    predicted_class: string;
    confidence: number;
    top_predictions: Array<{ class: string; confidence: number }>;
  } | null;
};

export type AdvisoryAction = {
  id: string;
  title?: string;
  description: string;
  priority: "High" | "Medium" | "Low";
};

export type Advisory = {
  id: string;
  alertId: string;
  type: "Preventive" | "Reactive";
  summary: string;
  actions: AdvisoryAction[];
};

export type DashboardData = {
  totalHives: number;
  activeHives: number;
  statusCounts: Record<HiveStatus, number>;
  keyMetrics: {
    temperatureC: number;
    humidityPercent: number;
    populationKBees: number;
    nectarFlowKgPerDay: number;
  };
  pendingAlerts: number;
  acknowledgedAlerts: number;
  preSwarmTrend: Array<{ day: string; count: number; statusBreakdown?: Partial<Record<HiveStatus, number>> }>;
  /** Per-time-point status counts derived from hive state history — used for Hive Status Trend chart */
  statusTrend: Array<{ timeLabel: string; recordedAt?: string; counts: Partial<Record<HiveStatus, number>> }>;
  recordingsToday: number;
  recordingsTodayDetails?: Array<{ 
    id: string;
    hiveId: string;
    hiveName?: string;
    durationSeconds: number;
    recordedAt: string;
  }>;
  silentHives: Array<{ 
    hiveId: string; 
    lastSeenHoursAgo: number;
    hiveName?: string;
    lastInferenceAt?: string | null;
  }>;
  
  highTempPreSwarmHives: Array<{ 
    hiveId: string; 
    temperatureC: number;
    hiveName?: string;
  }>;

  allHives: Array<{
    hiveId: string;
    hiveName: string;
    temperatureC: number;
    humidityPercent: number;
    status?: HiveStatus;
  }>;

  allHivesHistory: Array<{
    hiveId: string;
    hiveName?: string;
    history: Array<{
      timeLabel: string;
      temperatureC: number;
      humidityPercent: number
    }>;
  }>;
  pendingAdvisoryActions: number;
  lowConfidenceInferences: number;
  lowConfidenceInferencesDetails?: Array<{
    hiveId: string;
    hiveName?: string;
    inferenceScore: number;
    time: string;
  }>;
};

export type AmbientWeather = {
  temperatureC: number;
  humidityPercent: number;
  observedAt: string;
  source: "open-meteo";
};