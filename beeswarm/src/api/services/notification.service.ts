import { apiRequest } from "../client";

export interface RegisterPushTokenRequest {
  token: string;
  deviceId: string;
  platform: "ios" | "android" | "web";
}

export async function registerPushToken(data: RegisterPushTokenRequest) {
  return await apiRequest("/notifications/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendTestNotification(alertId?: string) {
  return await apiRequest("/notifications/test", {
    method: "POST",
    body: JSON.stringify({ alertId }),
  });
}
