// Forwarding shim — all imports of mockPredictionApi still resolve.
export {
  getPrediction,
  getHivePredictions,
  getHiveInferenceHistory as getPredictionForClassification,
  setMockApiEnabled,
  isMockApiEnabled,
  updateApiConfig,
  getApiConfig,
} from "./predictionApi";
