import { StyleSheet, Text, View, FlatList, Pressable, Platform, ActivityIndicator, Alert, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Haptics from "expo-haptics";
import React, { useState, useCallback } from "react";
import Colors from "@/constants/colors";

interface Emission {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  duration: string | null;
  category: string | null;
  imageUrl: string | null;
  createdAt: string | null;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function EmissionItem({
  item,
  isActive,
  onPlay,
  onDownload,
}: {
  item: Emission;
  isActive: boolean;
  onPlay: () => void;
  onDownload: () => void;
}) {
  return (
    <View style={[styles.emissionCard, isActive && styles.emissionCardActive]}>
      <View style={styles.emissionHeader}>
        <View style={styles.emissionIconWrap}>
          <Ionicons name="musical-notes" size={22} color={Colors.accent} />
        </View>
        <View style={styles.emissionInfo}>
          <Text style={styles.emissionTitle} numberOfLines={1}>{item.title}</Text>
          {item.createdAt ? (
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          ) : null}
        </View>
        {item.duration ? (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration}</Text>
          </View>
        ) : null}
      </View>

      {item.description ? (
        <Text style={styles.emissionDesc} numberOfLines={3}>{item.description}</Text>
      ) : null}

      {item.category ? (
        <View style={styles.categoryRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Pressable
          onPress={onPlay}
          style={({ pressed }) => [
            styles.actionButton,
            styles.playActionButton,
            isActive && styles.playActionButtonActive,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons
            name={isActive ? "pause" : "play"}
            size={18}
            color={isActive ? Colors.primaryDark : Colors.accent}
          />
          <Text style={[styles.actionText, isActive && styles.actionTextActive]}>
            {isActive ? "Pause" : "Lire"}
          </Text>
        </Pressable>

        <Pressable
          onPress={onDownload}
          style={({ pressed }) => [
            styles.actionButton,
            styles.downloadActionButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Ionicons name="download-outline" size={18} color={Colors.textSecondary} />
          <Text style={styles.downloadText}>Télécharger</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function EmissionsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [activeEmission, setActiveEmission] = useState<Emission | null>(null);

  const player = useAudioPlayer(
    activeEmission ? { uri: activeEmission.audioUrl } : null
  );
  const status = useAudioPlayerStatus(player);

  const { data: emissionsList, isLoading, refetch } = useQuery<Emission[]>({
    queryKey: ["/api/emissions"],
  });

  const handlePlay = useCallback(async (emission: Emission) => {
    if (Platform.OS !== "web") {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    }

    if (activeEmission?.id === emission.id) {
      if (status.playing) {
        player.pause();
      } else {
        player.play();
      }
    } else {
      setActiveEmission(emission);
      setTimeout(() => {
        player.play();
      }, 100);
    }
  }, [activeEmission, status.playing, player]);

  const handleDownload = useCallback(async (emission: Emission) => {
    if (Platform.OS !== "web") {
      try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
    }

    try {
      await Linking.openURL(emission.audioUrl);
    } catch {
      if (Platform.OS === "web") {
        window.open(emission.audioUrl, "_blank");
      }
    }
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.headerArea, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <Text style={styles.screenTitle}>Emissions</Text>
        <Text style={styles.screenSubtitle}>Ecoutez et téléchargez nos émissions</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : !emissionsList || emissionsList.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.emptyIcon}>
            <Ionicons name="headset-outline" size={40} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Aucune émission disponible</Text>
          <Text style={styles.emptySubtext}>Les émissions seront ajoutées par l'administrateur</Text>
        </View>
      ) : (
        <FlatList
          data={emissionsList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (insets.bottom || webBottomInset) + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <EmissionItem
              item={item}
              isActive={activeEmission?.id === item.id && !!status.playing}
              onPlay={() => handlePlay(item)}
              onDownload={() => handleDownload(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  emissionCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  emissionCardActive: {
    borderColor: Colors.accent,
    backgroundColor: "rgba(245, 197, 24, 0.06)",
  },
  emissionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  emissionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  emissionInfo: {
    flex: 1,
    gap: 3,
  },
  emissionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  durationBadge: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "600" as const,
  },
  emissionDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    paddingLeft: 56,
  },
  categoryRow: {
    paddingLeft: 56,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(245, 197, 24, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: Colors.accent,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  playActionButton: {
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 197, 24, 0.25)",
  },
  playActionButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.accent,
  },
  actionTextActive: {
    color: Colors.primaryDark,
  },
  downloadActionButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  downloadText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
});
