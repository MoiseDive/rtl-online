import { StyleSheet, Text, View, ScrollView, Pressable, Linking, Platform, ActivityIndicator, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import React from "react";
import Colors from "@/constants/colors";

const logo = require("@/assets/images/rtl-logo.png");

interface ContactInfoData {
  id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  website: string | null;
  aboutText: string | null;
}

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: contactData, isLoading } = useQuery<ContactInfoData>({
    queryKey: ["/api/contact"],
  });

  const handleAction = async (type: string, value: string) => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }

    let url = "";
    switch (type) {
      case "phone":
        url = `tel:${value}`;
        break;
      case "email":
        url = `mailto:${value}`;
        break;
      case "whatsapp":
        url = `https://wa.me/${value.replace(/[^0-9]/g, "")}`;
        break;
      case "facebook":
        url = `https://facebook.com/${value}`;
        break;
      case "website":
        url = value.startsWith("http") ? value : `https://${value}`;
        break;
      case "address":
        url = `https://maps.google.com/?q=${encodeURIComponent(value)}`;
        break;
    }

    if (url) {
      try {
        await Linking.openURL(url);
      } catch (e) {
        console.error("Cannot open URL:", url);
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: (insets.top || webTopInset) + 16,
            paddingBottom: (insets.bottom || webBottomInset) + 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Contact</Text>
        <Text style={styles.screenSubtitle}>Restez en contact avec RTL</Text>

        {contactData?.aboutText ? (
          <View style={styles.aboutCard}>
            <LinearGradient
              colors={["rgba(245, 197, 24, 0.1)", "rgba(245, 197, 24, 0.03)"]}
              style={styles.aboutGradient}
            >
              <Ionicons name="information-circle" size={22} color={Colors.accent} />
              <Text style={styles.aboutTitle}>A Propos</Text>
              <Text style={styles.aboutText}>{contactData.aboutText}</Text>
            </LinearGradient>
          </View>
        ) : null}

        <View style={styles.contactCards}>
          {contactData?.phone ? (
            <ContactCard
              icon="call"
              label="Téléphone"
              value={contactData.phone}
              color="#4CAF50"
              onPress={() => handleAction("phone", contactData.phone!)}
            />
          ) : null}

          {contactData?.whatsapp ? (
            <ContactCard
              icon="logo-whatsapp"
              label="WhatsApp"
              value={contactData.whatsapp}
              color="#25D366"
              onPress={() => handleAction("whatsapp", contactData.whatsapp!)}
            />
          ) : null}

          {contactData?.email ? (
            <ContactCard
              icon="mail"
              label="Email"
              value={contactData.email}
              color="#4A90D9"
              onPress={() => handleAction("email", contactData.email!)}
            />
          ) : null}

          {contactData?.facebook ? (
            <ContactCard
              icon="logo-facebook"
              label="Facebook"
              value={contactData.facebook}
              color="#1877F2"
              onPress={() => handleAction("facebook", contactData.facebook!)}
            />
          ) : null}

          {contactData?.address ? (
            <ContactCard
              icon="location"
              label="Adresse"
              value={contactData.address}
              color={Colors.accent}
              onPress={() => handleAction("address", contactData.address!)}
            />
          ) : null}

          {contactData?.website ? (
            <ContactCard
              icon="globe"
              label="Site Web"
              value={contactData.website}
              color="#6B48D6"
              onPress={() => handleAction("website", contactData.website!)}
            />
          ) : null}
        </View>

        <View style={styles.frequencyCard}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            style={styles.frequencyGradient}
          >
            <Image source={logo} style={styles.frequencyLogo} resizeMode="contain" />
            <Text style={styles.frequencyValue}>FM 90.2 MHz</Text>
            <Text style={styles.frequencyLocation}>Likasi, Haut-Katanga, RDC</Text>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

function ContactCard({
  icon,
  label,
  value,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.contactCard,
        { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.contactIcon, { backgroundColor: color + "18" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.contactCardContent}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactValue} numberOfLines={1}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.white,
  },
  screenSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  aboutCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(245, 197, 24, 0.15)",
  },
  aboutGradient: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  aboutTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  aboutText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  contactCards: {
    gap: 10,
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    gap: 14,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactCardContent: {
    flex: 1,
    gap: 2,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  contactValue: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  frequencyCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  frequencyGradient: {
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  frequencyLogo: {
    width: 80,
    height: 80,
    marginBottom: 4,
  },
  frequencyValue: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.primaryDark,
    letterSpacing: 2,
  },
  frequencyLocation: {
    fontSize: 13,
    color: "rgba(15, 29, 53, 0.7)",
  },
});
