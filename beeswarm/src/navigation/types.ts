import { NavigatorScreenParams } from "@react-navigation/native";
import { HiveStatus } from "../api";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Hives: NavigatorScreenParams<HivesStackParamList>;
  Alerts: NavigatorScreenParams<AlertsStackParamList>;
  Map: undefined;
  Profile: undefined;
};

export type HivesStackParamList = {
  HiveList: { refresh?: number; statusFilter?: HiveStatus; hiveIds?: string[] } | undefined;
  HiveDetails: { hiveId: string, lastAnalysisTime?: string | null };
  CreateHive: undefined;
  EditHive: { hiveId: string };
};

export type AlertsStackParamList = {
  AlertsList: { onAlertOpened?: () => void } | undefined;
  AlertDetails: { alertId: string; onAlertOpened?: () => void };
};
