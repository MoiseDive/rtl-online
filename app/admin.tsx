import { StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import Colors from "@/constants/colors";
import { queryClient, apiRequest } from "@/lib/query-client";

type Section = "dashboard" | "programs" | "emissions" | "contact" | "stream";

interface Program {
  id: string;
  title: string;
  description: string | null;
  day: string;
  startTime: string;
  endTime: string;
  host: string | null;
}

interface Emission {
  id: string;
  title: string;
  description: string | null;
  audioUrl: string;
  duration: string | null;
  category: string | null;
}

interface ContactData {
  id: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  website: string | null;
  aboutText: string | null;
}

interface StreamData {
  id: string;
  streamUrl: string;
  title: string;
  isLive: boolean;
}

export default function AdminScreen() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const handleLogin = async () => {
    setLoginError("");
    setLoginLoading(true);
    try {
      const res = await apiRequest("POST", "/api/admin/login", { password });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
      } else {
        setLoginError("Mot de passe incorrect");
      }
    } catch {
      setLoginError("Mot de passe incorrect");
    } finally {
      setLoginLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={StyleSheet.absoluteFill} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.loginContainer}
        >
          <View style={[styles.loginContent, { paddingTop: (insets.top || webTopInset) + 20 }]}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </Pressable>

            <View style={styles.loginCard}>
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={32} color={Colors.accent} />
              </View>
              <Text style={styles.loginTitle}>Administration</Text>
              <Text style={styles.loginSubtitle}>Entrez le mot de passe</Text>

              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={Colors.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={handleLogin}
                autoCapitalize="none"
              />

              {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

              <Pressable
                onPress={handleLogin}
                disabled={loginLoading || !password}
                style={({ pressed }) => [
                  styles.loginButton,
                  { opacity: pressed || loginLoading || !password ? 0.7 : 1 },
                ]}
              >
                <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.loginButtonGradient}>
                  {loginLoading ? (
                    <ActivityIndicator color={Colors.primaryDark} />
                  ) : (
                    <Text style={styles.loginButtonText}>Connexion</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [section, setSection] = useState<Section>("dashboard");
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;

  const menuItems: { key: Section; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { key: "programs", icon: "calendar", label: "Programmes" },
    { key: "emissions", icon: "headset", label: "Emissions" },
    { key: "contact", icon: "mail", label: "Contact" },
    { key: "stream", icon: "radio", label: "Flux Radio" },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primaryDark, Colors.background]} style={StyleSheet.absoluteFill} />

      <View style={[styles.adminHeader, { paddingTop: (insets.top || webTopInset) + 12 }]}>
        <Pressable onPress={() => section === "dashboard" ? router.back() : setSection("dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </Pressable>
        <Text style={styles.adminTitle}>
          {section === "dashboard" ? "Administration" : menuItems.find(m => m.key === section)?.label}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {section === "dashboard" ? (
        <ScrollView
          contentContainerStyle={[styles.dashContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {menuItems.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setSection(item.key)}
              style={({ pressed }) => [styles.menuCard, { opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] }]}
            >
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={26} color={Colors.accent} />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      ) : section === "programs" ? (
        <ProgramsAdmin />
      ) : section === "emissions" ? (
        <EmissionsAdmin />
      ) : section === "contact" ? (
        <ContactAdmin />
      ) : (
        <StreamAdmin />
      )}
    </View>
  );
}

function ProgramsAdmin() {
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Program | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [day, setDay] = useState("Lundi");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [host, setHost] = useState("");

  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

  const { data: programs, isLoading } = useQuery<Program[]>({ queryKey: ["/api/programs"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/programs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/programs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/programs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditItem(null);
    setTitle("");
    setDescription("");
    setDay("Lundi");
    setStartTime("");
    setEndTime("");
    setHost("");
  };

  const openEdit = (p: Program) => {
    setEditItem(p);
    setTitle(p.title);
    setDescription(p.description || "");
    setDay(p.day);
    setStartTime(p.startTime);
    setEndTime(p.endTime);
    setHost(p.host || "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title || !startTime || !endTime) return;
    const data = { title, description: description || null, day, startTime, endTime, host: host || null };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === "web") {
      if (confirm("Supprimer ce programme ?")) deleteMutation.mutate(id);
    } else {
      Alert.alert("Supprimer", "Supprimer ce programme ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]);
    }
  };

  if (showForm) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.formLabel}>Titre *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Titre du programme" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.formLabel}>Jour</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            <View style={styles.dayRow}>
              {DAYS.map((d) => (
                <Pressable key={d} onPress={() => setDay(d)} style={[styles.dayChip, day === d && styles.dayChipActive]}>
                  <Text style={[styles.dayChipText, day === d && styles.dayChipTextActive]}>{d.substring(0, 3)}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.formLabel}>Début *</Text>
              <TextInput style={styles.input} value={startTime} onChangeText={setStartTime} placeholder="06:00" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.timeField}>
              <Text style={styles.formLabel}>Fin *</Text>
              <TextInput style={styles.input} value={endTime} onChangeText={setEndTime} placeholder="07:00" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>

          <Text style={styles.formLabel}>Animateur</Text>
          <TextInput style={styles.input} value={host} onChangeText={setHost} placeholder="Nom de l'animateur" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

          <View style={styles.formActions}>
            <Pressable onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}>
              <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.saveGradient}>
                <Text style={styles.saveText}>{editItem ? "Modifier" : "Ajouter"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setShowForm(true)} style={styles.addButton}>
        <Ionicons name="add-circle" size={22} color={Colors.primaryDark} />
        <Text style={styles.addButtonText}>Ajouter</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
          {programs?.map((p) => (
            <View key={p.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{p.title}</Text>
                  <Text style={styles.itemSub}>{p.day} | {p.startTime} - {p.endTime}</Text>
                  {p.host ? <Text style={styles.itemSub}>{p.host}</Text> : null}
                </View>
                <View style={styles.itemActions}>
                  <Pressable onPress={() => openEdit(p)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color={Colors.accent} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(p.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          {(!programs || programs.length === 0) && <Text style={styles.emptyText}>Aucun programme</Text>}
        </ScrollView>
      )}
    </View>
  );
}

function EmissionsAdmin() {
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Emission | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [duration, setDuration] = useState("");
  const [category, setCategory] = useState("");

  const { data: emissionsList, isLoading } = useQuery<Emission[]>({ queryKey: ["/api/emissions"] });

  const createMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("POST", "/api/emissions", data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/emissions"] }); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => { await apiRequest("PUT", `/api/emissions/${id}`, data); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/emissions"] }); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/emissions/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/emissions"] }); },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditItem(null);
    setTitle("");
    setDescription("");
    setAudioUrl("");
    setDuration("");
    setCategory("");
  };

  const openEdit = (e: Emission) => {
    setEditItem(e);
    setTitle(e.title);
    setDescription(e.description || "");
    setAudioUrl(e.audioUrl);
    setDuration(e.duration || "");
    setCategory(e.category || "");
    setShowForm(true);
  };

  const handleSave = () => {
    if (!title || !audioUrl) return;
    const data = { title, description: description || null, audioUrl, duration: duration || null, category: category || null, imageUrl: null };
    if (editItem) {
      updateMutation.mutate({ id: editItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS === "web") {
      if (confirm("Supprimer cette émission ?")) deleteMutation.mutate(id);
    } else {
      Alert.alert("Supprimer", "Supprimer cette émission ?", [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => deleteMutation.mutate(id) },
      ]);
    }
  };

  if (showForm) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.formLabel}>Titre *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Titre de l'émission" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.formLabel}>URL Audio *</Text>
          <TextInput style={styles.input} value={audioUrl} onChangeText={setAudioUrl} placeholder="https://..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="url" />

          <Text style={styles.formLabel}>Durée</Text>
          <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="Ex: 45min" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.formLabel}>Catégorie</Text>
          <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Ex: Prédication" placeholderTextColor={Colors.textMuted} />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor={Colors.textMuted} multiline numberOfLines={3} />

          <View style={styles.formActions}>
            <Pressable onPress={resetForm} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Annuler</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, { opacity: pressed ? 0.8 : 1 }]}>
              <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.saveGradient}>
                <Text style={styles.saveText}>{editItem ? "Modifier" : "Ajouter"}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable onPress={() => setShowForm(true)} style={styles.addButton}>
        <Ionicons name="add-circle" size={22} color={Colors.primaryDark} />
        <Text style={styles.addButtonText}>Ajouter</Text>
      </Pressable>

      {isLoading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.listContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
          {emissionsList?.map((e) => (
            <View key={e.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{e.title}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>{e.audioUrl}</Text>
                  {e.category ? <Text style={styles.itemSub}>{e.category}</Text> : null}
                </View>
                <View style={styles.itemActions}>
                  <Pressable onPress={() => openEdit(e)} style={styles.iconBtn}>
                    <Ionicons name="create-outline" size={20} color={Colors.accent} />
                  </Pressable>
                  <Pressable onPress={() => handleDelete(e.id)} style={styles.iconBtn}>
                    <Ionicons name="trash-outline" size={20} color={Colors.danger} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
          {(!emissionsList || emissionsList.length === 0) && <Text style={styles.emptyText}>Aucune émission</Text>}
        </ScrollView>
      )}
    </View>
  );
}

function ContactAdmin() {
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [facebook, setFacebook] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [aboutText, setAboutText] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: contactData } = useQuery<ContactData>({
    queryKey: ["/api/contact"],
  });

  if (contactData && !loaded) {
    setPhone(contactData.phone || "");
    setEmail(contactData.email || "");
    setAddress(contactData.address || "");
    setFacebook(contactData.facebook || "");
    setWhatsapp(contactData.whatsapp || "");
    setWebsite(contactData.website || "");
    setAboutText(contactData.aboutText || "");
    setLoaded(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("PUT", "/api/contact", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact"] });
      if (Platform.OS === "web") {
        alert("Contact mis à jour");
      } else {
        Alert.alert("Succès", "Contact mis à jour");
      }
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      phone: phone || null,
      email: email || null,
      address: address || null,
      facebook: facebook || null,
      whatsapp: whatsapp || null,
      website: website || null,
      aboutText: aboutText || null,
    });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.formLabel}>Téléphone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+243..." placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

        <Text style={styles.formLabel}>WhatsApp</Text>
        <TextInput style={styles.input} value={whatsapp} onChangeText={setWhatsapp} placeholder="+243..." placeholderTextColor={Colors.textMuted} keyboardType="phone-pad" />

        <Text style={styles.formLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@exemple.com" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.formLabel}>Facebook</Text>
        <TextInput style={styles.input} value={facebook} onChangeText={setFacebook} placeholder="Nom de la page" placeholderTextColor={Colors.textMuted} autoCapitalize="none" />

        <Text style={styles.formLabel}>Site Web</Text>
        <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://..." placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="url" />

        <Text style={styles.formLabel}>Adresse</Text>
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Adresse physique" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.formLabel}>A Propos</Text>
        <TextInput style={[styles.input, styles.textArea]} value={aboutText} onChangeText={setAboutText} placeholder="Description de la radio..." placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} />

        <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, styles.fullSaveButton, { opacity: pressed ? 0.8 : 1 }]}>
          <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.saveGradient}>
            <Text style={styles.saveText}>Enregistrer</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StreamAdmin() {
  const insets = useSafeAreaInsets();
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const [streamUrl, setStreamUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loaded, setLoaded] = useState(false);

  const { data: streamData } = useQuery<StreamData>({ queryKey: ["/api/stream"] });

  if (streamData && !loaded) {
    setStreamUrl(streamData.streamUrl || "");
    setTitle(streamData.title || "");
    setLoaded(true);
  }

  const updateMutation = useMutation({
    mutationFn: async (data: any) => { await apiRequest("PUT", "/api/stream", data); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stream"] });
      if (Platform.OS === "web") {
        alert("Flux mis à jour");
      } else {
        Alert.alert("Succès", "Flux radio mis à jour");
      }
    },
  });

  const handleSave = () => {
    if (!streamUrl) return;
    updateMutation.mutate({ streamUrl, title: title || "En Direct", isLive: true, streamType: "audio" });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContent, { paddingBottom: (insets.bottom || webBottomInset) + 40 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.formLabel}>URL du flux audio *</Text>
        <TextInput style={styles.input} value={streamUrl} onChangeText={setStreamUrl} placeholder="https://stream.example.com/live" placeholderTextColor={Colors.textMuted} autoCapitalize="none" keyboardType="url" />

        <Text style={styles.formLabel}>Titre</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="En Direct" placeholderTextColor={Colors.textMuted} />

        <Pressable onPress={handleSave} style={({ pressed }) => [styles.saveButton, styles.fullSaveButton, { opacity: pressed ? 0.8 : 1 }]}>
          <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.saveGradient}>
            <Text style={styles.saveText}>Enregistrer</Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loginContainer: {
    flex: 1,
  },
  loginContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loginCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(245, 197, 24, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  loginTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  loginSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    fontSize: 13,
    color: Colors.danger,
  },
  loginButton: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 4,
  },
  loginButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.primaryDark,
  },
  adminHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  adminTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center",
  },
  dashContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  menuCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 16,
  },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(245, 197, 24, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primaryDark,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  itemSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    gap: 6,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 40,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 10,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  dayScroll: {
    maxHeight: 44,
  },
  dayRow: {
    flexDirection: "row",
    gap: 8,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  dayChipActive: {
    backgroundColor: Colors.accent,
  },
  dayChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: Colors.primaryDark,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  formActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  fullSaveButton: {
    marginTop: 12,
  },
  saveGradient: {
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
  },
  saveText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primaryDark,
  },
});
