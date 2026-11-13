import {useCallback, useRef, useState} from "react";
import {KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, View} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, field} from "../components/FieldKit";
import {Copy, LocalizedTextInput} from "../components/Locale";
import {API, ApiError, api} from "../lib/api";
import {getSession, setSession} from "../lib/session";

type User = {id: string; onboardingCompleted: boolean};
const destination = (user: User) => user.onboardingCompleted ? "/(tabs)" : "/onboarding";

export default function Login() {
  const [register, setRegister] = useState(false);
  const [checking, setChecking] = useState(true);
  const [resume, setResume] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const check = useCallback(async (isActive: () => boolean = () => true) => {
    setChecking(true); setError("");
    try {
      const token = await getSession();
      if (!token) { if (isActive()) setResume(false); return; }
      const result = await api<{user: User}>("/api/auth/me");
      if ((await getSession()) !== token || !isActive()) return;
      await setSession(token, result.user.id);
      if (isActive()) router.replace(destination(result.user));
    } catch (e) {
      if (!isActive()) return;
      if (e instanceof ApiError && e.status === 401) setResume(false);
      else { setResume(true); setError("Deine Sitzung konnte nicht geprüft werden. Prüfe deine Verbindung."); }
    } finally { if (isActive()) setChecking(false); }
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    void check(() => active);
    return () => { active = false; };
  }, [check]));

  async function submit() {
    if (pending.current || !email.trim() || !password) return;
    if (register && (name.trim().length < 2 || password.length < 10)) {
      setError("Gib deinen Namen und ein Passwort mit mindestens 10 Zeichen ein."); return;
    }
    pending.current = true; setBusy(true); setError("");
    try {
      const result = await api<{sessionToken: string; user: Partial<User> & {id: string}}>(
        register ? "/api/auth/register" : "/api/auth/login", {
          method: "POST", body: JSON.stringify({email: email.trim(), password, ...(register && {name: name.trim()})}),
        });
      await setSession(result.sessionToken, result.user.id);
      if (register) router.replace("/onboarding");
      else if (typeof result.user.onboardingCompleted === "boolean") router.replace(result.user.onboardingCompleted ? "/(tabs)" : "/onboarding");
      else await check();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Anmelden fehlgeschlagen. Bitte versuche es erneut."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <KeyboardAvoidingView style={s.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <FieldPage>
      <FieldMast section=""/>
      <FieldState loading={checking}/>
      {!checking && <View style={s.body}>
        <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text="BUILD YOUR ATHLETE."/></Text>
        {resume ? <FieldState error={error} retry={() => void check()}/> : <>
          <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={field.heading}><Copy text={register ? "Konto erstellen" : "Anmelden"}/></Text>
          {register && <LocalizedTextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Name" accessibilityLabel="Name" autoComplete="name" editable={!busy}/>}
          <LocalizedTextInput style={s.input} value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false}
            keyboardType="email-address" placeholder="Deine E-Mail-Adresse" accessibilityLabel="E-Mail" autoComplete="email" editable={!busy}/>
          <LocalizedTextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="Passwort"
            accessibilityLabel="Passwort" onSubmitEditing={() => void submit()} returnKeyType="go"
            autoComplete={register ? "new-password" : "current-password"} editable={!busy}/>
          {error ? <Text accessibilityRole="alert" style={s.error}><Copy text={error}/></Text> : null}
          <FieldAction label={busy ? "Einen Moment …" : register ? "Konto erstellen" : "Anmelden"} onPress={() => void submit()}
            disabled={busy || !email.trim() || !password}/>
          {!busy && <FieldLink label={register ? "Ich habe schon ein Konto" : "Neues Konto erstellen"}
            onPress={() => {setRegister(!register); setError("");}}/>}
          {!register && !busy && <FieldLink label="Passwort vergessen?" onPress={() => {
            void Linking.openURL(API + "/forgot-password").catch(() => setError("Die Seite konnte nicht geöffnet werden."));
          }}/>}
        </>}
      </View>}
    </FieldPage>
  </KeyboardAvoidingView>;
}

const s = StyleSheet.create({
  screen: {flex: 1, backgroundColor: F.bg},
  body: {marginHorizontal: 20, marginTop: 28, gap: 12},
  title: {fontFamily: "Archivo", fontSize: 48, lineHeight: 50, letterSpacing: -2.2, color: F.chalk, marginBottom: 10},
  input: {minHeight: 54, color: F.chalk, fontSize: 16, borderRadius: 3},
  error: {...field.body, color: F.red},
});
