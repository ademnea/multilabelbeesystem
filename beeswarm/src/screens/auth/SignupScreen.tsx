import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BeekeeperProfile, register } from "../../api";
import { THEME } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { signupStyles as styles } from "./SignupScreen.styles";

const beeLogo = require("../../../assets/images/bee.png");

type Props = NativeStackScreenProps<RootStackParamList, "Signup"> & {
  onAuthSuccess: (user: BeekeeperProfile) => void;
};

export function SignupScreen({ navigation, onAuthSuccess }: Props) {
  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [phone,           setPhone]           = useState("");
  const [apiKey,          setApiKey]          = useState("");
  const [hiveServerUrl, setHiveServerUrl] = useState("");
  const [address, setAddress] = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [errors,          setErrors]          = useState<Record<string, string>>({});
  const [apiError,        setApiError]        = useState("");
  const [submitting,      setSubmitting]      = useState(false);

  const EMAIL_RE  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const URL_RE    = /^https?:\/\/.+/;

  const handleSignup = async () => {
    const next: Record<string, string> = {};

    if (!name.trim())  next.name = "Full name is required.";
    if (!email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_RE.test(email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!phone.trim()) next.phone = "Phone number is required.";
    if (hiveServerUrl.trim() && !URL_RE.test(hiveServerUrl.trim())) {
      next.serverUrl = "Server URL must start with http:// or https://";
    }
    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (confirmPassword !== password) {
      next.confirmPassword = "Passwords do not match.";
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    setApiError("");
    try {
      const { beekeeper } = await register(
        name.trim(),
        email.trim(),
        phone.trim(),
        password,
        address.trim(),
        apiKey.trim(),
        hiveServerUrl.trim(),
      );

      onAuthSuccess(beekeeper);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearError = (key: string) =>
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: THEME.page }}
      contentContainerStyle={styles.authShell}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <View style={styles.formCard}>
        <View style={styles.brandMark}>
          <Image source={beeLogo} style={styles.brandLogo} resizeMode="contain" />
        </View>
        <Text style={styles.brandText}>BSADS</Text>
        <Text style={styles.heading}>Create Your Account</Text>

        {/* Full Name */}
        <TextInput
          placeholder="Full Name"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!errors.name && styles.inputError]}
          value={name}
          onChangeText={(t) => { setName(t); clearError("name"); }}
        />
        {!!errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!errors.email && styles.inputError]}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(t) => { setEmail(t); clearError("email"); }}
        />
        {!!errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}

        {/* Phone */}
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!errors.phone && styles.inputError]}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={(t) => { setPhone(t); clearError("phone"); }}
        />
        {!!errors.phone && <Text style={styles.fieldError}>{errors.phone}</Text>}

        {/* Address */}
        <TextInput
          placeholder="Address"
          placeholderTextColor={THEME.placeholder}
          style={styles.input}
          value={address}
          onChangeText={setAddress}
        />
        
        {/* Divider */}
        {/* <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>API Configuration</Text> */}

        {/* API Key */}
        {/* <TextInput
          placeholder="API Key (optional)"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!errors.apiKey && styles.inputError]}
          autoCapitalize="none"
          autoCorrect={false}
          value={apiKey}
          onChangeText={(t) => { setApiKey(t); clearError("apiKey"); }}
        />
        {!!errors.apiKey && <Text style={styles.fieldError}>{errors.apiKey}</Text>}
        <Text style={styles.hintText}>
          Your sensor API key for connecting hive devices.
        </Text> */}

        {/* Hive recording server URL (farmer's ngrok / external server) */}
        {/* <TextInput
          placeholder="Hive Server URL (optional, e.g. ngrok)"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!errors.serverUrl && styles.inputError]}
          autoCapitalize="none"
          autoCorrect={false}
          value={hiveServerUrl}
          onChangeText={(t) => { setHiveServerUrl(t); clearError("serverUrl"); }}
        /> */}
        {/* {!!errors.serverUrl && <Text style={styles.fieldError}>{errors.serverUrl}</Text>}
        <Text style={styles.hintText}>
          URL of your hive audio recording server. You can add this later in Profile.
        </Text> */}

        {/* Divider */}
        <View style={styles.sectionDivider} />
        <Text style={styles.sectionLabel}>Security</Text>

        {/* Password */}
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password (min 8 characters)"
            placeholderTextColor={THEME.placeholder}
            secureTextEntry={!showPassword}
            style={[styles.input, styles.passwordInput, !!errors.password && styles.inputError]}
            value={password}
            onChangeText={(t) => { setPassword(t); clearError("password"); }}
          />
          <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            <Text style={styles.eyeBtnText}>{showPassword ? "Hide" : "Show"}</Text>
          </Pressable>
        </View>
        {!!errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}

        {/* Confirm Password */}
        <TextInput
          placeholder="Confirm Password"
          placeholderTextColor={THEME.placeholder}
          secureTextEntry={!showPassword}
          style={[styles.input, !!errors.confirmPassword && styles.inputError]}
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); clearError("confirmPassword"); }}
        />
        {!!errors.confirmPassword && (
          <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
        )}

        {!!apiError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBody}>{apiError}</Text>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            styles.primaryButtonWide,
            (pressed || submitting) && styles.pressed,
          ]}
          onPress={() => void handleSignup()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </Pressable>

        <Text style={styles.footerPrompt}>
          Already have an account?{" "}
          <Text style={styles.footerLink} onPress={() => navigation.navigate("Login")}>
            Login
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
