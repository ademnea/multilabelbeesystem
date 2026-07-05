import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { BeekeeperProfile, login } from "../../api";
import { THEME } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { loginStyles as styles } from "./LoginScreen.styles";

const beeLogo = require("../../../assets/images/bee.png");

type Props = NativeStackScreenProps<RootStackParamList, "Login"> & {
  onAuthSuccess: (user: BeekeeperProfile) => void;
};

export function LoginScreen({ navigation, onAuthSuccess }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [apiError, setApiError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setApiError("");

    if (!email.trim()) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!EMAIL_RE.test(email.trim())) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    }

    if (!valid) return;

    setSubmitting(true);
    try {
      const { beekeeper } = await login(email.trim(), password);
      onAuthSuccess(beekeeper);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Login failed. Check your credentials and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.authShell}>
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />

      <View style={styles.formCard}>
        <View style={styles.brandMark}>
          <Image
            source={beeLogo}
            style={styles.brandLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.brandText}>BSADS</Text>
        <Text style={styles.heading}>Welcome</Text>

        <TextInput
          id="login-email"
          placeholder="Email"
          placeholderTextColor={THEME.placeholder}
          style={[styles.input, !!emailError && styles.inputError]}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setEmailError("");
          }}
        />
        {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

        <TextInput
          id="login-password"
          placeholder="Password"
          placeholderTextColor={THEME.placeholder}
          secureTextEntry
          style={[styles.input, !!passwordError && styles.inputError]}
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setPasswordError("");
          }}
        />
        {!!passwordError && (
          <Text style={styles.fieldError}>{passwordError}</Text>
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
          onPress={() => void handleLogin()}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Login</Text>
          )}
        </Pressable>

        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>or</Text>
          <View style={styles.separatorLine} />
        </View>
        <Text style={styles.authTextPrompt}>Don't have an account? </Text>
        <Pressable onPress={() => navigation.navigate("Signup")}>
          <Text style={styles.linkAction}>Create an Account</Text>
        </Pressable>
      </View>
    </View>
  );
}
