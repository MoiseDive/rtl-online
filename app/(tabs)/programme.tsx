import { StyleSheet, Text, View, FlatList, Pressable, Platform, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useMemo } from "react";
import Colors from "@/constants/colors";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

interface Program {
  id: string;
  title: string;
  description: string | null;
  day: string;
  startTime: string;
  endTime: string;
  host: string | null;
  createdAt: string | null;
}

function ProgramItem({ item }: { item: Program }) {
  return (
    <View style={styles.programCard}>
      <View style={styles.timeColumn}>
        <Text style={styles.timeText}>{item.startTime}</Text>
        <View style={styles.timeLine} />
        <Text style={styles.timeText}>{item.endTime}</Text>
      </View>
      <View style={styles.programContent}>
        <Text style={styles.programTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.programDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        {item.host ? (
          <View style={styles.hostRow}>
            <Ionicons name="person-circle-outline" size={14} color={Colors.accent} />
            <Text style={styles.hostText}>{item.host}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export default function ProgrammeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [selectedDay, setSelectedDay] = useState(DAYS[0]);

  const { data: programs, isLoading } = useQuery<Program[]>({
    queryKey: ["/api/programs"],
  });

  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    return programs
      .filter((p) => p.day === selectedDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [programs, selectedDay]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.headerArea, { paddingTop: (insets.top || webTopInset) + 16 }]}>
        <Text style={styles.screenTitle}>Programme</Text>
        <Text style={styles.screenSubtitle}>Grille des programmes RTL</Text>
      </View>

      <View style={styles.daySelector}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={DAYS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.daySelectorContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedDay(item)}
              style={[
                styles.dayChip,
                selectedDay === item && styles.dayChipActive,
              ]}
            >
              <Text
                style={[
                  styles.dayChipText,
                  selectedDay === item && styles.dayChipTextActive,
                ]}
              >
                {item.substring(0, 3)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : filteredPrograms.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.emptyIcon}>
            <Ionicons name="calendar-outline" size={36} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyText}>Aucun programme pour {selectedDay}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrograms}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: (insets.bottom || webBottomInset) + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ProgramItem item={item} />}
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
    paddingBottom: 12,
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
  daySelector: {
    marginBottom: 8,
  },
  daySelectorContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: Colors.primaryDark,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
  },
  programCard: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  timeColumn: {
    alignItems: "center",
    width: 50,
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.accent,
  },
  timeLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    borderRadius: 1,
    minHeight: 12,
  },
  programContent: {
    flex: 1,
    gap: 6,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  programDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  hostText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: "500" as const,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
