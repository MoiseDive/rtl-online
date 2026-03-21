import { StyleSheet, Text, View, Image, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import Colors from "@/constants/colors";

const logo = require("@/assets/images/rtl-logo.png");

export default function WelcomeScreen() {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const welcomeOpacity = useSharedValue(0);
  const frequencyOpacity = useSharedValue(0);
  const screenOpacity = useSharedValue(1);

  const navigateToTabs = () => {
    router.replace("/(tabs)");
  };

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.back(1.3)) });

    welcomeOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    frequencyOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));

    screenOpacity.value = withDelay(
      4500,
      withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(navigateToTabs)();
        }
      })
    );
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const welcomeAnimStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));

  const frequencyAnimStyle = useAnimatedStyle(() => ({
    opacity: frequencyOpacity.value,
  }));

  const screenAnimStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, screenAnimStyle]}>
      <LinearGradient
        colors={["#0F1D35", Colors.background, "#050A18"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
          <Image source={logo} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>

        <Animated.Text style={[styles.welcomeText, welcomeAnimStyle]}>
          Bienvenue sur l'application officielle de la RTL{"\n"}Radio Tabernacle de Likasi
        </Animated.Text>

        <Animated.View style={[styles.frequencyBadge, frequencyAnimStyle]}>
          <Text style={styles.frequencyText}>FM 90.2 MHz</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  logoWrap: {
    alignItems: "center",
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "500" as const,
  },
  frequencyBadge: {
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 197, 24, 0.25)",
  },
  frequencyText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.accent,
    letterSpacing: 3,
  },
});
