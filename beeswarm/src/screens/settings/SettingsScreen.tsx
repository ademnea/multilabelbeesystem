import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../../theme";
import { useTheme } from "../../hooks/useTheme";
import { RootStackParamList } from "../../navigation/types";
import { createSettingsStyles } from "./SettingsScreen.styles";
import { PREF_SATELLITE_MAP, notifySatelliteChange } from "../../hooks/useMapStyle";
import { PREF_TEMP_UNIT, notifyTempUnitChange } from "../../hooks/useTemperatureUnit";

const PREF_PUSH = "@bsads/push_notifications";
const PREF_CRITICAL = "@bsads/critical_alerts_only";

type Props = NativeStackScreenProps<RootStackParamList, "Settings"> & {
  darkModeEnabled: boolean;
  onDarkModeChange: (value: boolean) => void | Promise<void>;
};

export function SettingsScreen({
  navigation,
  route,
  darkModeEnabled,
  onDarkModeChange,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createSettingsStyles(theme), [theme]);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [criticalAlertsOnly, setCriticalAlertsOnly] = useState(false);
  const [satelliteMapEnabled, setSatelliteMapEnabled] = useState(false);
  const [biometricLoginEnabled, setBiometricLoginEnabled] = useState(false);
  const [temperatureUnit, setTemperatureUnit] = useState<"C" | "F">("C");

  useEffect(() => {
    void (async () => {
      try {
        const [push, critical, satellite, tempUnit] = await Promise.all([
          AsyncStorage.getItem(PREF_PUSH),
          AsyncStorage.getItem(PREF_CRITICAL),
          AsyncStorage.getItem(PREF_SATELLITE_MAP),
          AsyncStorage.getItem(PREF_TEMP_UNIT),
        ]);
        if (push !== null) setPushNotificationsEnabled(push === "true");
        if (critical !== null) setCriticalAlertsOnly(critical === "true");
        if (satellite !== null) setSatelliteMapEnabled(satellite === "true");
        if (tempUnit === "C" || tempUnit === "F") {
          setTemperatureUnit(tempUnit);
          notifyTempUnitChange(tempUnit);
        }
      } catch {
        // use defaults if storage unavailable
      }
    })();
  }, []);

  const togglePush = async (value: boolean) => {
    setPushNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(PREF_PUSH, String(value));
    } catch {}
  };

  const toggleCritical = async (value: boolean) => {
    setCriticalAlertsOnly(value);
    try {
      await AsyncStorage.setItem(PREF_CRITICAL, String(value));
    } catch {}
  };

  const closeSettings = () => navigation.goBack();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.page }}
      contentContainerStyle={[styles.settingsPage, { backgroundColor: theme.page }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.settingsSection, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={styles.settingsSectionTitle}>Account</Text>
        <View style={styles.settingsAccountCard}>
          <View style={styles.settingsAvatar}>
            <Ionicons name="person" size={20} color={THEME.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsAccountName}>Beekeeper</Text>
            <Text style={styles.settingsAccountEmail}>beekeeper@bsads.app</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>Notifications</Text>
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Push Notifications</Text>
            <Text style={styles.settingsRowHint}>
              Receive hive status updates and alerts
            </Text>
          </View>
          <Switch
            value={pushNotificationsEnabled}
            onValueChange={(v) => void togglePush(v)}
            trackColor={{ false: "#D0D5DD", true: THEME.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        {/* <View style={styles.settingsDivider} />
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Critical Alerts Only</Text>
            <Text style={styles.settingsRowHint}>
              Reduce noise and notify only high-risk events
            </Text>
          </View>
          <Switch
            value={criticalAlertsOnly}
            onValueChange={(v) => void toggleCritical(v)}
            trackColor={{ false: "#D0D5DD", true: THEME.accent }}
            thumbColor="#FFFFFF"
          />
        </View> */}
      </View>

      <View style={styles.settingsSection}>
        <Text style={styles.settingsSectionTitle}>App Preferences</Text>
       
        <View style={styles.settingsDivider} />
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Satellite Map View</Text>
            <Text style={styles.settingsRowHint}>
              Default to satellite style in the map tab
            </Text>
          </View>
          <Switch
            value={satelliteMapEnabled}
            onValueChange={async (v) => {
              setSatelliteMapEnabled(v);
              notifySatelliteChange(v);
              try {
                await AsyncStorage.setItem(PREF_SATELLITE_MAP, String(v));
              } catch {}
            }}
            trackColor={{ false: "#D0D5DD", true: THEME.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.settingsDivider} />
        <View style={styles.settingsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingsRowLabel}>Dark Mode</Text>
            <Text style={styles.settingsRowHint}>
              Use a darker color scheme across the app
            </Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={(v) => void onDarkModeChange(v)}
            trackColor={{ false: "#D0D5DD", true: THEME.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
        <View style={styles.settingsDivider} />
        <View style={styles.settingsRowColumn}>
          <Text style={styles.settingsRowLabel}>Temperature Unit</Text>
          <View style={styles.segmentedControl}>
            {(["C", "F"] as const).map((u) => (
              <Pressable
                key={u}
                style={[
                  styles.segmentButton,
                  temperatureUnit === u && styles.segmentButtonActive,
                ]}
                onPress={async () => {
                  setTemperatureUnit(u);
                  notifyTempUnitChange(u);
                  try { await AsyncStorage.setItem(PREF_TEMP_UNIT, u); } catch {}
                }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    temperatureUnit === u && styles.segmentTextActive,
                  ]}
                >
                  {u === "C" ? "Celsius" : "Fahrenheit"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.settingsActionsRow}>
        <Pressable
          style={styles.settingsSecondaryButton}
          onPress={closeSettings}
        >
          <Text style={styles.settingsSecondaryButtonText}>Back</Text>
        </Pressable>
        <Pressable style={styles.settingsPrimaryButton} onPress={closeSettings}>
          <Text style={styles.settingsPrimaryButtonText}>Save Preferences</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}