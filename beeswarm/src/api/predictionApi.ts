import {
  ClassificationAlert,
  generateSampleClassification,
} from "../utils/sampleClassificationData";

export async function getPrediction(hiveId: string): Promise<ClassificationAlert> {
  return generateSampleClassification(hiveId);
}

export async function getHivePredictions(
  hiveIds: string[]
): Promise<ClassificationAlert[]> {
  return hiveIds.map((id) => generateSampleClassification(id));
}

export async function getHiveInferenceHistory(
  hiveId: string,
  _limit = 10
): Promise<ClassificationAlert[]> {
  return [generateSampleClassification(hiveId)];
}

export async function getPredictionForClassification(
  hiveId: string,
  classification: string
): Promise<ClassificationAlert> {
  return generateSampleClassification(hiveId, classification);
}

export function setMockApiEnabled(_enabled: boolean): void {}
export function isMockApiEnabled(): boolean { return false; }
export function updateApiConfig(_config: object): void {}
export function getApiConfig() { return { enabled: false, baseUrl: "", delayMs: 0 }; }
