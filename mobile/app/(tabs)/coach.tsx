import {useCallback, useMemo, useRef, useState} from "react";
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {Mic, Radio, Video} from "lucide-react-native";
import {AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder} from "expo-audio";
import * as ImagePicker from "expo-image-picker";
import {useVideoPlayer, VideoView} from "expo-video";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, field, useFieldLocale} from "../../components/FieldKit";
import {Copy, LocalizedTextInput} from "../../components/Locale";
import {API, ApiError, api} from "../../lib/api";
import type {CoachBrief, DailyCoach} from "../../lib/field-data";
import {getSession} from "../../lib/session";

type Message = {
  id: string; senderId: string; athleteId: string; kind: "TEXT" | "VOICE" | "VIDEO";
  mediaId: string | null; text: string | null; createdAt: string;
};
type MessagePage = {items: Message[]; nextCursor?: string | null};
type Attachment = {
  kind: "VOICE" | "VIDEO"; uri: string; name: string; type: string; durationSec?: number; uploadedId?: string;
};
const messagesPath = "/api/messages?recent=1";
const maxVideoSize = 100 * 1024 * 1024;

function Voice({mediaId, token}: {mediaId: string; token: string}) {
  const source = useMemo(() => ({uri: API + "/api/media/" + mediaId, headers: {Authorization: "Bearer " + token}}), [mediaId, token]);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);
  return <FieldLink label={status.playing ? "Pausieren" : "Sprachnachricht abspielen"} onPress={() => {
    if (status.playing) player.pause();
    else if (status.didJustFinish) void player.seekTo(0).then(() => player.play()).catch(() => undefined);
    else player.play();
  }}/>;
}

function Clip({mediaId, token}: {mediaId: string; token: string}) {
  const source = useMemo(() => ({uri: API + "/api/media/" + mediaId, headers: {Authorization: "Bearer " + token}}), [mediaId, token]);
  const player = useVideoPlayer(source);
  return <VideoView style={s.video} player={player} nativeControls contentFit="contain"/>;
}

export default function Coach() {
  const locale = useFieldLocale();
  const [pane, setPane] = useState<"feedback" | "messages">("feedback");
  const [daily, setDaily] = useState<DailyCoach | null>(null);
  const [brief, setBrief] = useState<CoachBrief | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [older, setOlder] = useState(false);
  const [token, setToken] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [activeMedia, setActiveMedia] = useState<string | null>(null);
  const [access, setAccess] = useState<"loading" | "open" | "locked" | "failed">("loading");
  const [feedbackError, setFeedbackError] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const pending = useRef(false);
  const recordStarted = useRef(0);
  const clientId = useRef<string | null>(null);
  const screenActive = useRef(false);
  const messageScroll = useRef<ScrollView>(null);
  const jumpToNewest = useRef(true);
  const paged = useRef(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const loadMessages = useCallback(async () => {
    try {
      const [result, session] = await Promise.all([api<MessagePage>(messagesPath), getSession()]);
      if (!screenActive.current) return;
      setMessages(old => {
        const currentIds = new Set(result.items.map(item => item.id));
        return [...old.filter(item => !currentIds.has(item.id)), ...result.items].sort((a,b) =>
          Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
      });
      if (!paged.current) setCursor(result.nextCursor ?? null);
      setToken(session ?? "");
      setAccess("open");
    } catch (e) {
      if (!screenActive.current) return;
      setAccess(e instanceof ApiError && e.status === 403 ? "locked" : "failed");
    }
  }, []);
  const loadFeedback = useCallback(async () => {
    const [day, note] = await Promise.allSettled([
      process.env.EXPO_PUBLIC_JOURNEY_DAILY_ENABLED === "false"
        ? Promise.resolve(null)
        : api<DailyCoach>("/api/journey/daily"),
      api<{item: CoachBrief | null}>("/api/coach-brief"),
    ]);
    if (!screenActive.current) return;
    if (day.status === "fulfilled") setDaily(day.value);
    if (note.status === "fulfilled") setBrief(note.value.item);
    setFeedbackError(day.status === "rejected" && note.status === "rejected" ? "Das Feedback konnte nicht geladen werden." : "");
  }, []);
  useFocusEffect(useCallback(() => {
    screenActive.current = true;
    void loadFeedback();
    return () => {
      screenActive.current = false;
      setActiveMedia(null);
      if (recordStarted.current) {
        recordStarted.current = 0;
        void recorder.stop().catch(() => undefined).finally(() => {
          void setAudioModeAsync({allowsRecording: false}).catch(() => undefined);
        });
        setRecording(false);
      }
    };
  }, [loadFeedback, recorder]));
  useFocusEffect(useCallback(() => {
    if (pane === "messages") { jumpToNewest.current = true; void loadMessages(); }
  }, [loadMessages, pane]));

  async function loadOlder() {
    if (!cursor || older) return;
    setOlder(true); setError("");
    try {
      const result = await api<MessagePage>(messagesPath + "&before=" + encodeURIComponent(cursor));
      setMessages(old => {
        const ids = new Set(old.map(item => item.id));
        return [...result.items.filter(item => !ids.has(item.id)), ...old];
      });
      paged.current = true;
      setCursor(result.nextCursor ?? null);
    } catch { setError("Ältere Nachrichten konnten nicht geladen werden."); }
    finally { setOlder(false); }
  }

  async function send() {
    const content = text.trim();
    if (pending.current || recording || (!content && !attachment)) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    const id = clientId.current ?? (Date.now().toString(36) + "-" + Math.random().toString(36).slice(2));
    clientId.current = id;
    try {
      let mediaId = attachment?.uploadedId;
      if (attachment && !mediaId) {
        const form = new FormData();
        form.append("kind", attachment.kind === "VOICE" ? "VOICE_MESSAGE" : "TECHNIQUE_VIDEO");
        form.append("file", {uri: attachment.uri, name: attachment.name, type: attachment.type} as unknown as Blob);
        const uploaded = await api<{asset: {id: string}}>("/api/media", {method: "POST", body: form});
        mediaId = uploaded.asset.id;
        setAttachment({...attachment, uploadedId: mediaId});
      }
      const result = await api<{message: Message}>("/api/messages", {
        method: "POST", body: JSON.stringify({clientId: id, ...(content && {text: content}), mediaId,
          kind: attachment?.kind ?? "TEXT", durationSec: attachment?.durationSec}),
      });
      jumpToNewest.current = true;
      setMessages(old => old.some(item => item.id === result.message.id) ? old : [...old, result.message]);
      clientId.current = null;
      setAttachment(null); setText(""); setNotice("Nachricht gesendet.");
    } catch (e) { setError(e instanceof ApiError ? e.message : "Senden fehlgeschlagen. Dein Entwurf ist noch da."); }
    finally { pending.current = false; setBusy(false); }
  }

  async function toggleVoice() {
    if (pending.current || attachment) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      if (recording) {
        const durationSec = Math.min(3600, Math.max(1, Math.round((Date.now() - recordStarted.current) / 1000)));
        recordStarted.current = 0; setRecording(false);
        await recorder.stop();
        if (!recorder.uri) throw new Error("Die Aufnahme konnte nicht gespeichert werden.");
        clientId.current = null;
        setAttachment({kind: "VOICE", uri: recorder.uri, name: "sprachnachricht.m4a", type: "audio/mp4", durationSec});
      } else {
        const permission = await AudioModule.requestRecordingPermissionsAsync();
        if (!permission.granted) throw new Error("Erlaube den Mikrofonzugriff, um Sprache aufzunehmen.");
        if (!screenActive.current) return;
        await setAudioModeAsync({allowsRecording: true, playsInSilentMode: true});
        await recorder.prepareToRecordAsync();
        if (!screenActive.current) return;
        recorder.record();
        recordStarted.current = Date.now();
        setActiveMedia(null);
        setRecording(true);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Die Aufnahme ist fehlgeschlagen."); }
    finally {
      if (!recordStarted.current) await setAudioModeAsync({allowsRecording: false}).catch(() => undefined);
      pending.current = false; setBusy(false);
    }
  }

  async function pickVideo() {
    if (pending.current || recording || attachment) return;
    pending.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({mediaTypes: ["videos"], quality: .8, videoMaxDuration: 120});
      if (result.canceled || !result.assets[0]) return;
      const clip = result.assets[0];
      if ((clip.duration ?? 0) > 120_000 || (clip.fileSize ?? 0) > maxVideoSize) {
        setError("Wähle ein Video mit höchstens 2 Minuten und 100 MB."); return;
      }
      const mime = clip.mimeType ?? (/\.mov$/i.test(clip.fileName ?? clip.uri) ? "video/quicktime" : "video/mp4");
      if (!["video/mp4", "video/quicktime", "video/webm"].includes(mime)) {
        setError("Wähle ein Video im Format MP4, MOV oder WebM."); return;
      }
      clientId.current = null;
      setAttachment({kind: "VIDEO", uri: clip.uri, name: clip.fileName || "technikvideo.mp4", type: mime});
    } catch { setError("Deine Mediathek konnte nicht geöffnet werden."); }
    finally { pending.current = false; setBusy(false); }
  }

  const note = daily?.coach.brief ?? brief;
  const latest = daily?.coach.feedback.find(item => item.coachNote || item.nextSession?.advice);
  const instruction = daily?.coach.adjustments[0];
  const next = daily?.actual.workout ?? daily?.actual.nextWorkout;
  const title = instruction?.title || latest?.nextSession?.focus || note?.title || "Dein nächster Impuls";
  const guidance = instruction?.action || latest?.nextSession?.advice || latest?.coachNote || note?.body;
  const hasPersonalFeedback = Boolean(instruction || latest);
  return <FieldPage scroll={false}>
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FieldMast section="COACH"/>
      <View accessibilityRole="tablist" style={s.switch}>
        {(["feedback", "messages"] as const).map(value => <Pressable key={value} accessibilityRole="tab"
          accessibilityState={{selected: pane === value, disabled: recording}} disabled={recording} onPress={() => {setPane(value); setActiveMedia(null);}}
          style={[s.switchItem, pane === value && s.switchOn]}>
          <Text style={[s.switchLabel, pane === value && s.onText]}><Copy text={value === "feedback" ? "Feedback" : "Nachrichten"}/></Text>
        </Pressable>)}
      </View>
      {pane === "feedback" ? <ScrollView contentContainerStyle={s.guidance} keyboardShouldPersistTaps="handled">
        <View style={s.sideline}>
          <View style={s.signalRow}>
            <Radio color={F.signal} size={25} strokeWidth={1.8}/>
            <Text style={s.signalLabel}><Copy text={daily?.coach.name || "DEIN COACH"}/></Text>
          </View>
          <Text accessibilityRole="header" style={s.heroTitle}><Copy text="An deiner Seite."/></Text>
          {next && <Text style={field.sub}><Copy text="Nächste Einheit"/> · <Copy text={next.title}/></Text>}
        </View>
        <FieldState error={feedbackError} retry={() => void loadFeedback()}/>
        <View style={s.dispatch}>
          <Text style={s.dispatchLabel}><Copy text={hasPersonalFeedback ? "PERSÖNLICHES FEEDBACK" : note ? "COACH-BRIEFING" : "DEIN FOKUS"}/></Text>
          <Text style={s.dispatchTitle}><Copy text={title}/></Text>
          <Text style={s.dispatchCopy}><Copy text={guidance || "Halte im Tagescheck fest, wie du dich fühlst und was du im Training brauchst."}/></Text>
          {hasPersonalFeedback && latest?.coachNote && latest.coachNote !== guidance &&
            <Text style={s.dispatchCopy}>{latest.coachNote}</Text>}
        </View>
        <View style={s.links}>
          {note && <FieldLink label="Coach-Briefing öffnen" onPress={() => router.push("/coach-brief")}/>}
          {daily && <FieldLink label="Tagesplan & Technikfeedback" onPress={() => router.push("/journey-today")}/>}
          <FieldLink label="Tagescheck öffnen" onPress={() => router.push("/lifestyle")}/>
          <FieldAction label="Nachrichten öffnen" onPress={() => setPane("messages")}/>
        </View>
      </ScrollView> : <>
        <ScrollView ref={messageScroll} contentContainerStyle={s.transcript} keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag" onContentSizeChange={() => {
            if (access === "open" && jumpToNewest.current) {
              messageScroll.current?.scrollToEnd({animated: false});
              jumpToNewest.current = false;
            }
          }}>
          <FieldState loading={access === "loading"} error={access === "failed" ? "Die Nachrichten konnten nicht geladen werden." : null}
            retry={() => void loadMessages()}/>
          {access === "locked" && <View style={s.locked}>
            <Text style={field.heading}><Copy text="Persönlicher Austausch"/></Text>
            <Text style={field.sub}><Copy text="Nachrichten, Sprache und Technikvideos sind mit PRO verfügbar."/></Text>
            <FieldLink label="Mitgliedschaft ansehen" onPress={() => router.push("/membership")}/>
          </View>}
          {access === "open" && <>
            {cursor && <FieldAction label={older ? "Wird geladen …" : "Ältere Nachrichten laden"} disabled={older} onPress={() => void loadOlder()} tone="quiet"/>}
            {messages.length === 0 && <Text style={field.sub}><Copy text="Hier ist Platz für deine Fragen und Antworten vom Coach."/></Text>}
            {messages.map(item => {
              const mine = item.senderId === item.athleteId;
              return <View key={item.id} style={[s.entry, !mine && s.fromCoach]}>
                <View style={s.entryHead}>
                  <Text style={[field.type, !mine && s.signalLabel]}><Copy text={mine ? "DU" : daily?.coach.name || "COACH"}/></Text>
                  <Text style={s.time}>{new Date(item.createdAt).toLocaleString(locale, {day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"})}</Text>
                </View>
                {!!item.text && <Text style={field.body}>{item.text}</Text>}
                {item.mediaId && item.kind !== "TEXT" && token ? (activeMedia === item.id ?
                  item.kind === "VOICE" ? <Voice mediaId={item.mediaId} token={token}/> : <Clip mediaId={item.mediaId} token={token}/>
                  : <FieldLink label={item.kind === "VOICE" ? "Sprachnachricht öffnen" : "Technikvideo ansehen"} onPress={() => setActiveMedia(item.id)}/>) : null}
              </View>;
            })}
          </>}
        </ScrollView>
        {access === "open" && <View style={s.composer}>
          {attachment && <View style={s.attachment}>
            <Text style={field.sub}><Copy text={attachment.kind === "VOICE" ? "Sprachnachricht bereit" : "Technikvideo bereit"}/></Text>
            {!busy && <FieldLink label="Entfernen" onPress={() => {clientId.current = null; setAttachment(null); setError("");}}/>}
          </View>}
          <View style={s.composeRow}>
            <LocalizedTextInput value={text} onChangeText={value => {clientId.current = null; setText(value);}} editable={!busy && !recording}
              placeholder="Frage an deinen Coach" accessibilityLabel="Nachricht" placeholderTextColor={F.muted}
              multiline maxLength={4000} style={s.input}/>
            <FieldAction label="Senden" disabled={busy || recording || (!text.trim() && !attachment)} onPress={() => void send()}/>
          </View>
          <View style={s.attachments}>
            <Pressable accessibilityRole="button" accessibilityLabel={recording ? "Aufnahme beenden" : "Sprache aufnehmen"} disabled={busy || !!attachment}
              onPress={() => void toggleVoice()} style={s.mediaButton}>
              <Mic color={recording ? F.red : F.muted} size={17}/>
              <Text style={[s.mediaLabel, recording && s.recording]}><Copy text={recording ? "Aufnahme beenden" : "Sprache"}/></Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Technikvideo auswählen" disabled={busy || recording || !!attachment}
              onPress={() => void pickVideo()} style={s.mediaButton}>
              <Video color={F.muted} size={17}/><Text style={s.mediaLabel}><Copy text="Technikvideo"/></Text>
            </Pressable>
          </View>
          {error || notice || busy ? <Text accessibilityLiveRegion="polite" style={[s.mediaLabel, !!error && s.recording]}>
            <Copy text={error || notice || "Einen Moment …"}/>
          </Text> : null}
        </View>}
      </>}
    </KeyboardAvoidingView>
  </FieldPage>;
}

const s = StyleSheet.create({
  flex: {flex: 1},
  switch: {marginHorizontal: 20, flexDirection: "row", borderBottomWidth: 1, borderColor: F.line, marginTop: 6},
  switchItem: {flex: 1, minHeight: 48, justifyContent: "center", alignItems: "center", borderBottomWidth: 2, borderColor: "transparent"},
  switchOn: {borderColor: F.signal},
  switchLabel: {...field.sub, fontFamily: "ManropeSemiBold", fontSize: 15},
  onText: {color: F.chalk},
  guidance: {paddingHorizontal: 20, paddingBottom: 22},
  sideline: {paddingTop: 27, paddingBottom: 21, gap: 8},
  signalRow: {flexDirection: "row", alignItems: "center", gap: 9},
  signalLabel: {...field.type, color: F.signal},
  heroTitle: {fontFamily: "Archivo", color: F.chalk, fontSize: 43, letterSpacing: -1.9, lineHeight: 48},
  dispatch: {backgroundColor: "#232820", padding: 18, borderLeftWidth: 3, borderColor: F.signal, gap: 9},
  dispatchLabel: {...field.type, color: "#BECB9C"},
  dispatchTitle: {...field.heading, fontSize: 25},
  dispatchCopy: {...field.body, color: "#E2E5D6"},
  links: {marginTop: 14, gap: 2},
  transcript: {paddingHorizontal: 20, paddingTop: 18, paddingBottom: 16, gap: 9},
  locked: {gap: 12, paddingVertical: 20},
  entry: {borderLeftWidth: 2, borderColor: F.line, padding: 12, gap: 5, backgroundColor: F.surface},
  fromCoach: {borderColor: F.signal, backgroundColor: "#20251E"},
  entryHead: {flexDirection: "row", justifyContent: "space-between", gap: 10},
  time: {...field.sub, fontSize: 11},
  video: {width: "100%", height: 210, backgroundColor: F.bg},
  composer: {borderTopWidth: 1, borderColor: F.line, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 4, gap: 2},
  composeRow: {flexDirection: "row", alignItems: "flex-end", gap: 8},
  input: {flex: 1, minHeight: 50, maxHeight: 103, color: F.chalk, fontFamily: "Manrope", fontSize: 15, borderRadius: 4},
  attachments: {flexDirection: "row", flexWrap: "wrap", gap: 12},
  mediaButton: {flexDirection: "row", alignItems: "center", gap: 6, minHeight: 45, paddingHorizontal: 3},
  mediaLabel: {...field.sub, fontFamily: "ManropeSemiBold"},
  recording: {color: F.red},
  attachment: {flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap"},
});
