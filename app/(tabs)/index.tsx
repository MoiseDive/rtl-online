import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router } from "expo-router";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import Colors from "@/constants/colors";
import type Hls from "hls.js";

const logo = require("@/assets/images/rtl-logo.png");

// ─── Web audio hook (uses hls.js for HLS streams) ─────────────────────────
function useWebAudio(streamUrl: string | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const hasAutoPlayed = useRef(false);

  const isHls = streamUrl?.includes(".m3u8") || streamUrl?.includes("m3u8");

  useEffect(() => {
    if (Platform.OS !== "web" || !streamUrl) return;

    const audio = new Audio();
    audio.preload = "none";

    audio.addEventListener("playing", () => { setPlaying(true); setLoading(false); setError(false); });
    audio.addEventListener("pause", () => setPlaying(false));
    audio.addEventListener("waiting", () => setLoading(true));
    audio.addEventListener("canplay", () => setLoading(false));
    audio.addEventListener("error", () => { setError(true); setLoading(false); setPlaying(false); });
    audio.addEventListener("ended", () => setPlaying(false));

    audioRef.current = audio;

    // Set up HLS.js if needed
    const setupHls = async () => {
      if (!isHls) {
        audio.src = streamUrl;
        return;
      }
      try {
        const HlsModule = await import("hls.js");
        const HlsClass = HlsModule.default;
        if (HlsClass.isSupported()) {
          const hls = new HlsClass({ enableWorker: false });
          hls.loadSource(streamUrl);
          hls.attachMedia(audio);
          hlsRef.current = hls as unknown as Hls;
        } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          // Safari native HLS
          audio.src = streamUrl;
        }
      } catch {
        audio.src = streamUrl;
      }
    };

    setupHls();

    return () => {
      audio.pause();
      if (hlsRef.current) {
        try { (hlsRef.current as any).destroy(); } catch {}
        hlsRef.current = null;
      }
      audio.src = "";
      audioRef.current = null;
    };
  }, [streamUrl]);

  // Auto-play on load
  useEffect(() => {
    if (Platform.OS !== "web" || !streamUrl || hasAutoPlayed.current || !audioRef.current) return;
    hasAutoPlayed.current = true;
    setTimeout(() => {
      if (!audioRef.current) return;
      audioRef.current.play().catch(() => { /* autoplay policy — user must tap */ });
    }, 800);
  }, [streamUrl, playing]); // re-check when playing changes (HLS might take a moment to attach)

  const play = useCallback(() => {
    if (!audioRef.current || !streamUrl) return;
    setError(false);
    setLoading(true);
    audioRef.current.play().catch(() => { setLoading(false); setError(true); });
  }, [streamUrl]);

  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  }, []);

  return { playing, loading, error, play, pause };
}

// ─── Native audio hook ─────────────────────────────────────────────────────
function useNativeAudio(streamUrl: string | undefined) {
  const isNative = Platform.OS !== "web";
  const player = useAudioPlayer(
    isNative && streamUrl ? { uri: streamUrl } : null
  );
  const status = useAudioPlayerStatus(player);
  const hasAutoPlayed = useRef(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    if (streamUrl && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      setTimeout(() => { try { player.play(); } catch {} }, 700);
    }
  }, [streamUrl, isNative]);

  useEffect(() => {
    if (loading && (status.playing || status.error)) setLoading(false);
  }, [status.playing, status.error]);

  const play = useCallback(() => {
    if (!isNative) return;
    setLoading(true);
    try { player.play(); } catch { setLoading(false); }
  }, [player, isNative]);

  const pause = useCallback(() => {
    if (!isNative) return;
    try { player.pause(); } catch {}
  }, [player, isNative]);

  return { playing: isNative ? status.playing : false, loading: isNative ? loading : false, error: isNative ? !!status.error : false, play, pause };
}

// ─── Home screen ───────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const { data: streamConfig } = useQuery<{
    id: string;
    streamUrl: string;
    streamType: string;
    title: string;
    isLive: boolean;
  }>({
    queryKey: ["/api/stream"],
  });

  const streamUrl = streamConfig?.streamUrl;

  const web = useWebAudio(Platform.OS === "web" ? streamUrl : undefined);
  const native = useNativeAudio(Platform.OS !== "web" ? streamUrl : undefined);

  const isPlaying = Platform.OS === "web" ? web.playing : native.playing;
  const isLoading = Platform.OS === "web" ? web.loading : native.loading;
  const hasError = Platform.OS === "web" ? web.error : native.error;

  const handlePlayPause = () => {
    if (isPlaying) {
      Platform.OS === "web" ? web.pause() : native.pause();
    } else {
      Platform.OS === "web" ? web.play() : native.play();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primaryDark, Colors.background, "#030814"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.glowCircle} />

      {/* Admin button */}
      <Pressable
        onPress={() => router.push("/admin")}
        style={[
          styles.adminButton,
          { top: Math.max(insets.top, webTopInset) + 12, right: 16 },
        ]}
      >
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </Pressable>

      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, webTopInset) + 24,
            paddingBottom: Math.max(insets.bottom, webBottomInset) + 100,
          },
        ]}
      >
        {/* Logo */}
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        {/* Station info */}
        <View style={styles.stationInfo}>
          <Text style={styles.stationName}>Radio Tabernacle de Likasi</Text>
          <View style={styles.frequencyBadge}>
            <Text style={styles.frequencyText}>FM 90.2 MHz</Text>
          </View>
        </View>

        {/* Visualizer */}
        <View style={styles.visualizerContainer}>
          <View style={styles.waveRow}>
            {Array.from({ length: 20 }).map((_, i) => (
              <WaveBar key={i} index={i} isPlaying={isPlaying} />
            ))}
          </View>
        </View>

        {/* Status pill */}
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: hasError
                ? "rgba(229,57,53,0.12)"
                : isPlaying
                ? "rgba(76,175,80,0.15)"
                : "rgba(90,112,153,0.12)",
              borderColor: hasError
                ? "rgba(229,57,53,0.3)"
                : isPlaying
                ? "rgba(76,175,80,0.35)"
                : "rgba(90,112,153,0.25)",
            },
          ]}
        >
          <LiveDot isPlaying={isPlaying} hasError={hasError} />
          <Text
            style={[
              styles.statusText,
              {
                color: hasError
                  ? Colors.danger
                  : isPlaying
                  ? Colors.success
                  : Colors.textMuted,
              },
            ]}
          >
            {hasError
              ? "ERREUR DE CONNEXION"
              : isPlaying
              ? "EN DIRECT"
              : "HORS LIGNE"}
          </Text>
        </View>

        {/* Play button */}
        <PlayButton
          isPlaying={isPlaying}
          isLoading={isLoading}
          hasError={hasError}
          disabled={!streamUrl}
          onPress={handlePlayPause}
        />

        <Text style={styles.hint}>
          {!streamUrl
            ? "Aucun flux configuré"
            : hasError
            ? "Vérifiez la connexion et réessayez"
            : isPlaying
            ? "Appuyez pour mettre en pause"
            : "Appuyez pour écouter en direct"}
        </Text>
      </View>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────
function LiveDot({ isPlaying, hasError }: { isPlaying: boolean; hasError: boolean }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
    } else {
      opacity.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const color = hasError ? Colors.danger : isPlaying ? Colors.success : Colors.textMuted;

  return (
    <Animated.View
      style={[styles.dot, { backgroundColor: color }, style]}
    />
  );
}

function PlayButton({
  isPlaying,
  isLoading,
  hasError,
  disabled,
  onPress,
}: {
  isPlaying: boolean;
  isLoading: boolean;
  hasError: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    if (isPlaying) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(0, { duration: 1200 })
        ),
        -1,
        false
      );
      ringScale.value = withRepeat(
        withTiming(1.4, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
      ringOpacity.value = withTiming(0, { duration: 300 });
      ringScale.value = withTiming(1, { duration: 300 });
    }
  }, [isPlaying]);

  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const gradientColors: [string, string] = hasError
    ? [Colors.danger, "#B71C1C"]
    : isPlaying
    ? [Colors.accentLight, Colors.accentDark]
    : [Colors.primaryLight, Colors.primary];

  return (
    <View style={styles.playButtonWrap}>
      <Animated.View style={[styles.playRing, ringStyle]} />
      <Animated.View style={btnStyle}>
        <Pressable
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [{ opacity: pressed ? 0.82 : disabled ? 0.4 : 1 }]}
        >
          <LinearGradient colors={gradientColors} style={styles.playButtonGradient}>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <Ionicons
                name={hasError ? "refresh" : isPlaying ? "pause" : "play"}
                size={44}
                color={isPlaying && !hasError ? Colors.primaryDark : Colors.accent}
                style={!isPlaying && !hasError ? { marginLeft: 5 } : undefined}
              />
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function LoadingSpinner() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name="reload" size={32} color={Colors.accent} />
    </Animated.View>
  );
}

function WaveBar({ index, isPlaying }: { index: number; isPlaying: boolean }) {
  const height = useSharedValue(4);
  const delay = (index * 60) % 400;

  useEffect(() => {
    if (isPlaying) {
      const min = 4 + (index % 3) * 3;
      const max = 18 + (index % 5) * 10;
      height.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(max, { duration: 350 + (index % 4) * 90, easing: Easing.inOut(Easing.ease) }),
            withTiming(min, { duration: 300 + (index % 3) * 70, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(4, { duration: 500 });
    }
  }, [isPlaying]);

  const animStyle = useAnimatedStyle(() => ({ height: height.value }));

  const barColor =
    index < 5 ? Colors.accent : index < 12 ? Colors.accentLight : Colors.accentDark;

  return (
    <Animated.View
      style={[
        styles.waveBar,
        animStyle,
        { backgroundColor: barColor, opacity: isPlaying ? 1 : 0.2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowCircle: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(245,197,24,0.04)",
    alignSelf: "center",
    top: "25%",
  },
  adminButton: {
    position: "absolute",
    zIndex: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 18,
  },
  logo: { width: 150, height: 150 },
  stationInfo: { alignItems: "center", gap: 8 },
  stationName: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  frequencyBadge: {
    backgroundColor: "rgba(245,197,24,0.1)",
    borderWidth: 1,
    borderColor: "rgba(245,197,24,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
  },
  frequencyText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.accent,
    letterSpacing: 2,
  },
  visualizerContainer: { width: "100%", alignItems: "center", marginVertical: 4 },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 3, height: 64 },
  waveBar: { width: 4, borderRadius: 2, minHeight: 4 },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "700" as const, letterSpacing: 2 },
  playButtonWrap: { alignItems: "center", justifyContent: "center", marginVertical: 6 },
  playRing: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  playButtonGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: { fontSize: 13, color: Colors.textMuted, textAlign: "center" },
});
