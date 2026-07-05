import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "../../theme";
import { RootStackParamList } from "../../navigation/types";
import { welcomeStyles as styles } from "./WelcomeScreen.styles";

const beeLogo = require("../../../assets/images/bee.png");

type Props = NativeStackScreenProps<RootStackParamList, "Welcome">;

export function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.welcomeShell}>
      <View style={styles.backgroundOrbOne} />
      <View style={styles.backgroundOrbTwo} />
      <View style={styles.backgroundOrbThree} />

      <View style={styles.welcomeLogoWrap}>
        <View style={styles.welcomeLogoRing}>
          <Image
            source={beeLogo}
            style={styles.welcomeLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeAppName}>BSADS</Text>
        <Text style={styles.welcomeAppSub}>
          Bee Swarm & Abscondment Detection
        </Text>
      </View>

      <View style={styles.welcomeBottomCard}>
        <Text style={styles.welcomeHeadline}>
          Smart Beekeeping,{"\n"}Healthier Hives.
        </Text>
        <Text style={styles.welcomeSubtitle}>
          Monitor your hives in real-time. Get instant alerts before swarms
          happen.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.welcomePrimaryBtn,
            pressed && styles.pressed,
          ]}
          onPress={() => navigation.navigate("Login")}
        >
          <Ionicons name="log-in-outline" size={18} color={THEME.primary} />
          <Text style={styles.welcomePrimaryBtnText}>Get Started</Text>
        </Pressable>
      </View>
    </View>
  );
}
