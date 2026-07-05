/**
 * BSADS API Client
 * Main entry point for all API operations
 * 
 * Usage:
 *   import { login, fetchHives, fetchDashboard } from './api';
 */

// Export types
export type {
  HiveStatus,
  AlertSeverity,
  BeekeeperProfile,
  AuthResponse,
  Hive,
  HiveDetailData,
  AlertItem,
  AlertDetailData,
  AudioRecording,
  Advisory,
  AdvisoryAction,
  DashboardData,
  AmbientWeather,
  WeatherData,
} from "./types";

// Export client utilities
export {
  BASE_URL,
  getAuthToken,
  setAuthToken,
  getServerUrl,
  setServerUrl,
  setUnauthorizedHandler,
  pingApi,
  initializeApiClient,
  initServerUrlFromStorage,
} from "./client";

// Export auth service
export {
  initAuthFromStorage,
  login,
  register,
  logout,
  fetchProfile,
  updateProfile,
  changePassword,
} from "./services/auth.service";

// Export hive service
export {
  fetchHives,
  fetchHiveDetail,
  createHive,
  acknowledgeHiveAlert,
  deleteHive,
  updateHive,
  enrichHivesWithCoordinates,
} from "./services/hive.service";

// Export alert service
export {
  fetchHiveAlerts,
  fetchAlerts,
  fetchAlertDetail,
  acknowledgeAlert,
  fetchAdvisory,
} from "./services/alert.service";

// Export dashboard service
export {
  fetchDashboard,
  fetchFleetMetricsFromHives,
} from "./services/dashboard.service";

// Export weather service
export {
  fetchAmbientWeather,
} from "./services/weather.service";

// Export notification service
export {
  registerPushToken,
  sendTestNotification,
} from "./services/notification.service";

// Export system monitoring service
export {
  // fetchRecordingsToday,
  // fetchSilentHives,
  fetchLowConfidenceInferences,
} from "./services/system.service";

// Export types from system service
export type {
  RecordingDetail,
  SilentHiveDetail,
  LowConfidenceInference,
} from "./services/system.service";

// Export utility functions (for advanced use cases)
export {
  validateServerUrl,
} from "./utils/normalizers";
