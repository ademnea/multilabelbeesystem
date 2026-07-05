import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import { updateHive, fetchHiveDetail } from "../../../api";
import { HivesStackParamList } from "../../../navigation/types";
import { createEditHiveStyles } from "./EditHiveScreen.styles";
import { useTheme } from "../../../hooks/useTheme";

type Props = NativeStackScreenProps<HivesStackParamList, "EditHive">;

export function EditHiveScreen({ route, navigation }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createEditHiveStyles(theme), [theme]);
  const { hiveId } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hiveName, setHiveName] = useState("");
  const [hiveLocation, setHiveLocation] = useState("");
  const [hiveType, setHiveType] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successVisible, setSuccessVisible] = useState(false);
  const [updatedHiveName, setUpdatedHiveName] = useState("");

  const loadHive = useCallback(async () => {
    setLoading(true);
    try {
      const detail = await fetchHiveDetail(hiveId);
      setHiveName(detail.name);
      setHiveLocation(detail.location);
      setHiveType(detail.type ?? "");
      setInstallationDate(detail.installationDate ?? "");
      setLatitude(detail.latitude?.toString() ?? "");
      setLongitude(detail.longitude?.toString() ?? "");
    } catch (err) {
      Alert.alert("Error", "Could not load hive details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [hiveId, navigation]);

  useEffect(() => {
    void loadHive();
  }, [loadHive]);

  const geocodeLocation = async (place: string) => {
    const trimmed = place.trim();
    if (!trimmed || trimmed.length < 3) return;
    if (latitude && longitude) return;

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
        setLatitude(parseFloat(lat).toFixed(6));
        setLongitude(parseFloat(lon).toFixed(6));
        setErrors((prev) => ({ ...prev, latitude: "", longitude: "" }));
      }
    } catch {
      // Geocoding failure is silent
    } finally {
      setGeocoding(false);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
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

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to get your current coordinates. Please enable it in your device settings."
        );
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude.toFixed(6));
      setLongitude(location.coords.longitude.toFixed(6));

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

    const lat = parseFloat(latitude || "0");
    const lng = parseFloat(longitude || "0");
    if (latitude && (isNaN(lat) || lat < -90 || lat > 90)) {
      newErrors.latitude = "Latitude must be between -90 and 90";
    }
    if (longitude && (isNaN(lng) || lng < -180 || lng > 180)) {
      newErrors.longitude = "Longitude must be between -180 and 180";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const updateData: any = {
        hive_name: hiveName.trim(),
        hive_location: hiveLocation.trim(),
      };

      if (hiveType.trim()) {
        updateData.hive_type = hiveType.trim();
      }

      if (latitude && longitude) {
        updateData.latitude = parseFloat(latitude);
        updateData.longitude = parseFloat(longitude);
      }

      await updateHive(hiveId, updateData);

      setUpdatedHiveName(hiveName.trim());
      setSuccessVisible(true);
    } catch (err) {
      Alert.alert(
        "Error",
        err instanceof Error ? err.message : "Failed to update hive",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={{ marginTop: 12, color: theme.textMuted }}>Loading hive...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: theme.page }}
        contentContainerStyle={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Edit Hive</Text>
          <Text style={styles.cardSubtitle}>
            Update hive details (installation date cannot be changed)
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

          {/* Hive Type (Optional) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Hive Type
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

          {/* Installation Date (Disabled) */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Installation Date
            </Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Cannot be changed"
              placeholderTextColor={theme.textMuted}
              value={installationDate}
              editable={false}
              selectTextOnFocus={false}
            />
          </View>

          {/* Coordinates Section */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Coordinates (GPS Location)</Text>
            
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
              submitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={styles.submitButtonText}>Update Hive</Text>
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
      </ScrollView>

      {/* Success Modal */}
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
              Hive Updated!
            </Text>
            <Text style={styles.successModalBody}>
              "{updatedHiveName}" has been successfully updated.
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
