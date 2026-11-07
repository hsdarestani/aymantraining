import {useCallback, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, field} from "../components/FieldKit";
import {Copy} from "../components/Locale";
import {api} from "../lib/api";

export default function Membership() {
  const [tier, setTier] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await api<{tier: string}>("/api/entitlements");
      setTier(result.tier); setError("");
    } catch { setError("Dein Kontostatus konnte nicht geladen werden."); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  async function refresh() {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const result = await api<{tier: string}>("/api/subscription/sync", {method: "POST", body: "{}"});
      setTier(result.tier); setNotice("Kontostatus aktualisiert.");
    } catch { setError("Dein Kontostatus konnte nicht aktualisiert werden."); }
    finally { setBusy(false); }
  }
  return <FieldPage>
    <FieldMast section="KONTO"/>
    <View style={s.content}>
      <FieldLink label="Zurück" onPress={() => router.canGoBack() ? router.back() : router.replace("/(tabs)/athlete")}/>
      <Text accessibilityRole="header" style={field.heading}><Copy text="Mitgliedschaft"/></Text>
      <FieldState loading={loading} error={error} retry={!tier ? () => void load() : undefined}/>
      {tier && <View style={s.status}>
        <Text style={field.type}><Copy text="AKTUELLER ZUGANG"/></Text>
        <Text style={s.tier}>{tier === "FREE" ? "STANDARD" : tier}</Text>
        <Text style={field.body}><Copy text={tier === "FREE" ? "Der Kauf von PRO ist in der App derzeit nicht verfügbar."
          : "Dein erweiterter Zugang ist aktiv."}/></Text>
        <FieldAction label={busy ? "Wird aktualisiert …" : "Kontostatus aktualisieren"} onPress={() => void refresh()} disabled={busy} tone="quiet"/>
        {notice ? <Text accessibilityLiveRegion="polite" style={field.sub}><Copy text={notice}/></Text> : null}
      </View>}
    </View>
  </FieldPage>;
}
const s = StyleSheet.create({
  content: {paddingHorizontal: 20, gap: 12},
  status: {gap: 12, padding: 16, backgroundColor: F.surface, borderLeftWidth: 2, borderColor: F.signal},
  tier: {fontFamily: "Archivo", color: F.chalk, fontSize: 35},
});
