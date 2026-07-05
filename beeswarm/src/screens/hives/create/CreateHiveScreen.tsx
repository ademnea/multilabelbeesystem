import React, { useState, useMemo } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { createHive, BeekeeperProfile } from "../../../api";
import { HivesStackParamList } from "../../../navigation/types";
import { createHiveStyles } from "./CreateHiveScreen.styles";
import { useTheme } from "../../../hooks/useTheme";
import { CalendarPicker } from "../../../components/CalendarPicker";

type Props = NativeStackScreenProps<HivesStackParamList, "CreateHive"> & {
  currentUser: BeekeeperProfile | null;
};

export function CreateHiveScreen({ navigation, route, currentUser }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createHiveStyles(theme), [theme]);

  // Check if user has api_key and server_url
  const hasRequiredCredentials = currentUser?.api_key && currentUser?.server_url;

  // Debug logging
  const [hiveName, setHiveName] = useState("");
  const [hiveLocation, setHiveLocation] = useState("");
  const [hiveType, setHiveType] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [createdHiveName, setCreatedHiveName] = useState("");

  // Helper to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const setToday = () => {
    setInstallationDate(formatDate(new Date()));
    if (errors.installationDate) setErrors({ ...errors, installationDate: "" });
  };

  const setTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setInstallationDate(formatDate(tomorrow));
    if (errors.installationDate) setErrors({ ...errors, installationDate: "" });
  };

  /**
   * Geocode a place name → lat/lng using OpenStreetMap Nominatim (free, no key).
   * Called when the user finishes typing in the Location field.
   */
  const geocodeLocation = async (place: string): Promise<{ lat: string; lng: string } | null> => {
    const trimmed = place.trim();
    if (!trimmed || trimmed.length < 3) return null;
    // Don't re-geocode if coords already filled manually
    if (latitude && longitude) return { lat: latitude, lng: longitude };

    setGeocoding(true);
    try {
      const encoded = encodeURIComponent(trimmed);
      const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "beeswarm-app" },
      });
      const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
      if (data.length > 0) {
        const { lat, lon } = data[0];
        const latStr = parseFloat(lat).toFixed(6);
        const lngStr = parseFloat(lon).toFixed(6);
        setLatitude(latStr);
        setLongitude(lngStr);
        setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
        return { lat: latStr, lng: lngStr };
      }
      return null;
    } catch {
      // Geocoding failure is silent — user can still enter coords manually
      return null;
    } finally {
      setGeocoding(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      // For web platform, use browser's Geolocation API
      if (Platform.OS === "web") {
        if (!navigator.geolocation) {
          Alert.alert(
            "Not Supported",
            "Geolocation is not supported by your browser. Please enter coordinates manually."
          );
          setLoadingLocation(false);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude.toFixed(6));
            setLongitude(position.coords.longitude.toFixed(6));
            setErrors({
              ...errors,
              latitude: "",
              longitude: "",
            });
            Alert.alert(
              "Location Retrieved",
              `Latitude: ${position.coords.latitude.toFixed(6)}\nLongitude: ${position.coords.longitude.toFixed(6)}`
            );
            setLoadingLocation(false);
          },
          (error) => {
            let message = "Failed to get your location. ";
            if (error.code === error.PERMISSION_DENIED) {
              message += "Location permission was denied. Please enable location access in your browser settings.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              message += "Location information is unavailable.";
            } else if (error.code === error.TIMEOUT) {
              message += "The request to get your location timed out.";
            }
            Alert.alert("Location Error", message);
            setLoadingLocation(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
        return;
      }

      // For mobile platforms, use expo-location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current coordinates. Please enable it in your device settings."
        );
        setLoadingLocation(false);
        return;
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Set the coordinates
      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));

      // Clear any previous errors
      setErrors({
        ...errors,
        latitude: "",
        longitude: "",
      });

      Alert.alert(
        "Location Retrieved",
        `Latitude: ${location.coords.latitude.toFixed(6)}\nLongitude: ${location.coords.longitude.toFixed(6)}`
      );
    } catch (err) {
      Alert.alert(
        "Location Error",
        err instanceof Error
          ? err.message
          : "Failed to get your location. Please enter coordinates manually or try again."
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!hiveName.trim()) newErrors.hiveName = "Hive name is required";
    if (!hiveLocation.trim()) newErrors.hiveLocation = "Location is required";
    if (!hiveType.trim()) newErrors.hiveType = "Hive type is required";
    if (!installationDate.trim())
      newErrors.installationDate = "Installation date is required";

    // Validate date format (YYYY-MM-DD)
    if (installationDate && !/^\d{4}-\d{2}-\d{2}$/.test(installationDate)) {
      newErrors.installationDate = "Use format YYYY-MM-DD (e.g., 2026-06-04)";
    }

    // Validate latitude/longitude
    const lat = parseFloat(latitude || "0");
    const lng = parseFloat(longitude || "0");
    if (latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }
    if (longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    // Check if user is logged in
    if (!currentUser?.id) {
      Alert.alert("Error", "You must be logged in to create a hive");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !currentUser?.id) return;

    // If no coordinates were captured yet (GPS skipped, manual entry skipped,
    // geocoding hadn't finished), try once more before falling back — saving
    // (0,0) silently makes the hive permanently invisible on the Map screen,
    // since (0,0) is treated as "no location" there.
    let lat = latitude;
    let lng = longitude;
    if (!lat || !lng) {
      const geocoded = await geocodeLocation(hiveLocation);
      if (geocoded) {
        lat = geocoded.lat;
        lng = geocoded.lng;
      }
    }

    if (!lat || !lng) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "No map location set",
          "We couldn't determine GPS coordinates for this hive, so it won't appear on the Map screen. You can add coordinates later by editing the hive.",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Create Anyway", onPress: () => resolve(true) },
          ],
        );
      });
      if (!proceed) return;
    }

    setLoading(true);
    try {
      await createHive({
        hive_name: hiveName.trim(),
        hive_location: hiveLocation.trim(),
        hive_type: hiveType.trim(),
        installation_date: installationDate.trim(),
        latitude: lat ? parseFloat(lat) : 0,
        longitude: lng ? parseFloat(lng) : 0,
        owner_id: currentUser.id,
      });

      // Show success popup
      setCreatedHiveName(hiveName.trim());
      setSuccessVisible(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to create hive",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.page }}
        contentContainerStyle={styles.container}
      >
        {!currentUser ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>
              You must be logged in to create a hive. Please log in and try again.
            </Text>
            <Pressable
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </Pressable>
          </View>
        ) : !hasRequiredCredentials ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>
              You cannot create a hive. Please contact your admin to get your API key and server URL.
            </Text>
            <Pressable
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Go Back</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Hive</Text>
            <Text style={styles.cardSubtitle}>
              Fill in the details to add a new hive to your apiary
            </Text>

            {/* Hive Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Hive Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.hiveName && styles.inputError]}
                placeholder="e.g., Hive 02"
                placeholderTextColor={theme.placeholder}
                value={hiveName}
                onChangeText={(text) => {
                  setHiveName(text);
                  if (errors.hiveName) setErrors({ ...errors, hiveName: "" });
                }}
              />
              {errors.hiveName && (
                <Text style={styles.errorText}>{errors.hiveName}</Text>
              )}
            </View>

            {/* Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Location <Text style={styles.required}>*</Text>
              </Text>
              <View style={{ position: "relative" }}>
                <TextInput
                  style={[styles.input, errors.hiveLocation && styles.inputError]}
                  placeholder="e.g., Makerere Western Gate, Kampala"
                  placeholderTextColor={theme.placeholder}
                  value={hiveLocation}
                  onChangeText={(text) => {
                    setHiveLocation(text);
                    // Clear coords when location text changes so they get re-geocoded
                    setLatitude("");
                    setLongitude("");
                    if (errors.hiveLocation)
                      setErrors({ ...errors, hiveLocation: "" });
                  }}
                  onBlur={() => void geocodeLocation(hiveLocation)}
                  returnKeyType="done"
                  onSubmitEditing={() => void geocodeLocation(hiveLocation)}
                />
                {geocoding && (
                  <ActivityIndicator
                    size="small"
                    color={theme.accent}
                    style={{ position: "absolute", right: 12, top: 13 }}
                  />
                )}
              </View>
              {errors.hiveLocation && (
                <Text style={styles.errorText}>{errors.hiveLocation}</Text>
              )}
              {!geocoding && latitude && longitude && (
                <Text style={{ fontSize: 11, color: "#16A34A", marginTop: 4, fontWeight: "600" }}>
                  📍 {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                </Text>
              )}
            </View>

            {/* Hive Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Hive Type <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.hiveType && styles.inputError]}
                placeholder="e.g., Langstroth"
                placeholderTextColor={theme.placeholder}
                value={hiveType}
                onChangeText={(text) => {
                  setHiveType(text);
                  if (errors.hiveType) setErrors({ ...errors, hiveType: "" });
                }}
              />
              {errors.hiveType && (
                <Text style={styles.errorText}>{errors.hiveType}</Text>
              )}
            </View>

            {/* Installation Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Installation Date <Text style={styles.required}>*</Text>
              </Text>
              {/* Quick-select: Today / Tomorrow */}
              <View style={styles.dateButtonRow}>
                <Pressable style={styles.dateButton} onPress={setToday}>
                  <Ionicons
                    name="today-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={styles.dateButtonText}>Today</Text>
                </Pressable>
                <Pressable style={styles.dateButton} onPress={setTomorrow}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={theme.primary}
                  />
                  <Text style={styles.dateButtonText}>Tomorrow</Text>
                </Pressable>
              </View>
              {/* Calendar picker button */}
              <Pressable
                style={[styles.calendarButton, errors.installationDate ? { borderColor: "#EF4444" } : {}]}
                onPress={() => setCalendarVisible(true)}
              >
                <Ionicons name="calendar" size={16} color={theme.accent} />
                {/* <Text style={styles.calendarButtonText}>Pick a date  </Text> */}
                {installationDate ? (
                  <Text style={styles.calendarButtonValue}>{installationDate}</Text>
                ) : (
                  <Text style={{ color: theme.placeholder, fontSize: 14 }}>YYYY-MM-DD</Text>
                )}
              </Pressable>
              {errors.installationDate && (
                <Text style={styles.errorText}>{errors.installationDate}</Text>
              )}
            </View>

            {/* Coordinates Section */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Coordinates (GPS Location)</Text>

              {/* Get Current Location Button */}
              <Pressable
                style={[
                  styles.locationButton,
                  loadingLocation && styles.locationButtonDisabled,
                ]}
                onPress={getCurrentLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <Text style={styles.locationButtonText}>
                      Use My Current Location
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Latitude and Longitude Inputs */}
              <View style={styles.coordinatesRow}>
                <View style={styles.coordinateInput}>
                  <Text style={[styles.label, { marginBottom: 6 }]}>Latitude</Text>
                  <TextInput
                    style={[styles.input, errors.latitude && styles.inputError]}
                    placeholder="0.0000"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={latitude}
                    onChangeText={(text) => {
                      setLatitude(text);
                      if (errors.latitude) setErrors({ ...errors, latitude: "" });
                    }}
                  />
                  {errors.latitude && (
                    <Text style={styles.errorText}>{errors.latitude}</Text>
                  )}
                </View>

                <View style={styles.coordinateInput}>
                  <Text style={[styles.label, { marginBottom: 6 }]}>Longitude</Text>
                  <TextInput
                    style={[styles.input, errors.longitude && styles.inputError]}
                    placeholder="0.0000"
                    placeholderTextColor={theme.placeholder}
                    keyboardType="numeric"
                    value={longitude}
                    onChangeText={(text) => {
                      setLongitude(text);
                      if (errors.longitude) setErrors({ ...errors, longitude: "" });
                    }}
                  />
                  {errors.longitude && (
                    <Text style={styles.errorText}>{errors.longitude}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitButtonText}>Create Hive</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ── Calendar Picker Modal ── */}
      <CalendarPicker
        visible={calendarVisible}
        value={installationDate}
        minDate={new Date().toISOString().slice(0, 10)}
        onConfirm={(date) => {
          setInstallationDate(date);
          setCalendarVisible(false);
          if (errors.installationDate) setErrors({ ...errors, installationDate: "" });
        }}
        onCancel={() => setCalendarVisible(false)}
      />

      {/* ── Success Popup ── */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setSuccessVisible(false);
          navigation.navigate("HiveList", { refresh: Date.now() });
        }}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalBox}>
            <View style={styles.successModalIcon}>
              <Ionicons name="checkmark-circle" size={34} color="#16A34A" />
            </View>
            <Text style={styles.successModalTitle}>
              Hive Created!
            </Text>
            <Text style={styles.successModalBody}>
              "{createdHiveName}" has been successfully added to your apiary.
            </Text>
            <Pressable
              style={styles.successModalBtn}
              onPress={() => {
                setSuccessVisible(false);
                navigation.navigate("HiveList", { refresh: Date.now() });
              }}
            >
              <Text style={styles.successModalBtnText}>View Hives</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
