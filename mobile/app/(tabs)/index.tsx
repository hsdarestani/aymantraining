import {useCallback, useRef, useState} from "react";
import {RefreshControl, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {Radio} from "lucide-react-native";
import Svg, {Circle, Path} from "react-native-svg";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, dateLabel, field, useFieldLocale} from "../../components/FieldKit";
import {Copy} from "../../components/Locale";
import MilestoneCelebration from "../../components/MilestoneCelebration";
import RhythmHorizon from "../../components/RhythmHorizon";
import {api} from "../../lib/api";
import type {CoachBrief, Dashboard, JourneyOverview} from "../../lib/field-data";
import {levelLabel} from "../../lib/field-data";
import {registerPush} from "../../lib/push";
import {syncHomeWidget} from "../../lib/widget-sync";

const goalNames: Record<string, string> = {
  muscle_building: "Muskelaufbau", fat_loss: "Fettabbau", athleticism: "Athletik",
  football: "Fußball", calisthenics: "Calisthenics", health: "Gesundheit",
};

function TrackMark() {
  return <View pointerEvents="none" accessible={false} style={s.track}>
    <Svg width="100%" height="100%" viewBox="0 0 420 240" preserveAspectRatio="xMaxYMid slice">
      <Path d="M182 240L378 0M218 240L414 0M254 240L450 0M290 240L486 0M326 240L522 0M362 240L558 0"
        stroke="#393D34" strokeWidth={1} fill="none"/>
      <Path d="M235 219L400 17M258 233L423 31" stroke="#5A6541" strokeWidth={1.4} fill="none"/>
      <Path d="M283 208L321 162M289 215L327 169M295 222L333 176" stroke={F.signal} strokeWidth={2.5} fill="none"/>
      <Circle cx={322} cy={162} r={4} fill={F.signal}/>
    </Svg>
  </View>;
}

export default function Home() {
  const locale = useFieldLocale();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const narrow = width < 350;
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [journey, setJourney] = useState<JourneyOverview | null>(null);
  const [brief, setBrief] = useState<CoachBrief | null>(null);
  const [selected, setSelected] = useState<-1 | 0 | 1>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const lastSubscriptionSync = useRef(0);
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    setError("");
    const pending = [
      process.env.EXPO_PUBLIC_JOURNEY_OVERVIEW_ENABLED !== "false"
        ? api<JourneyOverview>("/api/journey/overview").then(value => { if (isActive()) setJourney(value); })
        : Promise.resolve(),
      api<{item: CoachBrief | null}>("/api/coach-brief").then(value => { if (isActive()) setBrief(value.item); }),
    ];
    void Promise.allSettled(pending);
    try {
      const value = await api<Dashboard>("/api/mobile/dashboard");
      if (!isActive()) return;
      setDashboard(value);
      void syncHomeWidget(value).catch(() => undefined);
      void registerPush().catch(() => undefined);
      if (Date.now() - lastSubscriptionSync.current > 15 * 60_000) {
        lastSubscriptionSync.current = Date.now();
        void api("/api/subscription/sync", {method: "POST", body: "{}"}).catch(() => { lastSubscriptionSync.current = 0; });
      }
    } catch {
      if (isActive()) setError("Dein Tagesplan konnte nicht geladen werden.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [load]));
  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const today = dashboard?.dailyProfile;
  const days = dashboard?.dayStrip ?? [];
  const chosen = days.find(day => day.offset === selected);
  const workouts = chosen?.workouts ?? [];
  const next = workouts.find(workout => !workout.completed) ?? workouts[0];
  const activeWorkout = next;
  const name = dashboard?.user.name?.trim().split(/\s+/)[0];
  const level = today?.journey.confirmedLevel;
  const goals = journey?.intake?.goals ?? journey?.legacy.activeGoals ?? dashboard?.goals ?? dashboard?.womenGoals ?? [];
  const goal = goals[0];
  const goalText = goal ? (journey?.goals.find(item => item.slug === goal)?.label ?? goalNames[goal] ?? goal) : null;
  const priority = dashboard?.recommendations?.find(item => item.severity !== "locked");
  const nextAction = activeWorkout ? (activeWorkout.completed ? "Einheit ansehen" : selected === 0 ? "Einheit starten" : "Einheit ansehen")
    : selected === 0 && !today?.today.hasCheckIn ? "Tagescheck öffnen" : "Trainingsplan öffnen";
  const openNext = () => {
    if (activeWorkout) router.push({pathname: "/workout/[id]", params: {id: activeWorkout.id}});
    else router.push(selected === 0 && !today?.today.hasCheckIn ? "/lifestyle" : "/(tabs)/training");
  };
  const title = activeWorkout?.title ?? (chosen || today ? "Keine Einheit geplant" : "Dein Trainingsplan");
  // Keep the week number together instead of leaving a lone digit on a new line.
  const weekTitle = title.match(/^(.*?)\s*[·•]\s*((?:Woche|Week)\s+\d+)$/i);
  const nextDate = activeWorkout?.scheduledAt
    ? new Date(activeWorkout.scheduledAt).toLocaleTimeString(locale, {hour: "2-digit", minute: "2-digit", timeZone: today?.timeZone})
    : null;
  return <FieldPage refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={F.signal}/>}>
    <MilestoneCelebration/>
    <FieldMast section="START" language/>
    <FieldState loading={loading} error={error} retry={() => void load()}/>
    {dashboard && <>
      <View style={s.cockpit}>
        <TrackMark/>
        <Text style={s.stamp}>
          {today?.date ? dateLabel(today.date, locale, {weekday: "long", day: "numeric", month: "short"}).toLocaleUpperCase(locale) : "START"}
        </Text>
        <Text accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}
          style={[s.greeting, compact && s.greetingCompact]}>
          <Copy text="Hi,"/> {name || <Copy text="willkommen"/>}
        </Text>
        <View style={s.identity}>
          <View style={s.identityPart}>
            <Text style={field.type}><Copy text="DEIN STAND"/></Text>
            <Text style={s.identityValue}><Copy text={level ? levelLabel(level) : "Einstufung offen"}/></Text>
          </View>
          <View style={s.identityPart}>
            <Text style={field.type}><Copy text="DEIN ZIEL"/></Text>
            <Text style={s.identityValue}><Copy text={goalText ?? "Ziel festlegen"}/></Text>
          </View>
        </View>
        <RhythmHorizon days={days} selected={selected} onSelect={setSelected}/>
      </View>
      <View style={s.session} accessibilityLiveRegion="polite">
        <View style={s.sessionMeta}>
          <Text style={s.darkLabel}><Copy text={selected < 0 ? "RÜCKBLICK" : selected > 0 ? "AUSBLICK" : "DEIN NÄCHSTER SCHRITT"}/></Text>
          <Text style={s.darkLabel}>
            {activeWorkout?.completed ? <Copy text="ERLEDIGT"/> : nextDate}
          </Text>
        </View>
        {weekTitle ? <View accessible accessibilityRole="header" accessibilityLabel={title} style={s.sessionTitleGroup}>
          <Text style={[s.sessionTitle, compact && s.sessionTitleCompact, narrow && s.sessionTitleNarrow]}>{weekTitle[1]}</Text>
          <Text style={s.weekTag}>{weekTitle[2]}</Text>
        </View> : <Text accessibilityRole="header" style={[s.sessionTitle, compact && s.sessionTitleCompact, narrow && s.sessionTitleNarrow]}><Copy text={title}/></Text>}
        {workouts.length > 1 && <Text style={s.sessionNote}>{workouts.length} <Copy text="Einheiten an diesem Tag"/></Text>}
        {!activeWorkout && selected === 0 && dashboard.nextWorkout?.scheduledAt && today &&
          <Text style={s.sessionNote}><Copy text="Nächster Termin"/> · {dateLabel(dashboard.nextWorkout.scheduledAt, locale,
            {weekday: "short", day: "numeric", month: "short"}, today.timeZone)}</Text>}
        <FieldAction label={nextAction} onPress={openNext} tone="ink"/>
      </View>
      <View style={s.coach}>
        <View style={s.coachMark}><Radio size={23} strokeWidth={1.65} color={F.signal}/></View>
        <View style={s.coachContent}>
          <Text style={[field.type, priority?.severity === "critical" && {color: F.red}]}>
            <Copy text={brief ? "VOM COACH" : "HEUTE IM FOKUS"}/>
          </Text>
          <Text style={s.coachTitle}><Copy text={brief?.title ?? priority?.title ?? "Dein Tagescheck"}/></Text>
          <Text numberOfLines={3} style={field.sub}>
            <Copy text={brief?.body || priority?.action || "Halte fest, wie du dich heute fühlst."}/>
          </Text>
          <FieldLink label="Coach öffnen" onPress={() => router.push("/(tabs)/coach")}/>
        </View>
      </View>
      <View style={s.foot}>
        {!goalText && <FieldLink label="Ziel festlegen" onPress={() => router.push(journey ? "/journey" : "/settings")}/>}
        {dashboard.dashboardPreference?.mode === "WOMEN" && dashboard.dashboardPreference.enabled &&
          <Text style={field.sub}><Copy text="Energie"/> · {today?.today.energy ?? "—"} / 5</Text>}
        {dashboard.cycleJournalEnabled && <FieldLink label="Privater Zykluskalender" onPress={() => router.push("/cycle")}/>}
      </View>
    </>}
  </FieldPage>;
}

const s = StyleSheet.create({
  cockpit: {paddingHorizontal: 20, paddingTop: 26, overflow: "hidden"},
  track: {position: "absolute", width: "100%", height: 230, right: 0, top: 0, opacity: .72},
  stamp: {...field.type, color: F.signal, marginBottom: 8},
  greeting: {fontFamily: "Archivo", color: F.chalk, fontSize: 55, lineHeight: 57, letterSpacing: -2.7},
  greetingCompact: {fontSize: 45, lineHeight: 49, letterSpacing: -1.9},
  identity: {flexDirection: "row", gap: 12, marginTop: 22, marginBottom: 22},
  identityPart: {flex: 1, minWidth: 0, borderLeftWidth: 1, borderColor: "#53584D", paddingLeft: 10, gap: 4},
  identityValue: {color: F.chalk, fontFamily: "ManropeSemiBold", fontSize: 15},
  session: {marginTop: 1, backgroundColor: F.chalk, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 19, gap: 12},
  sessionMeta: {flexDirection: "row", justifyContent: "space-between", gap: 10},
  darkLabel: {...field.type, color: F.darkMuted},
  sessionTitle: {color: F.ink, fontFamily: "Archivo", fontSize: 34, lineHeight: 37, letterSpacing: -1.1, flexShrink: 1},
  sessionTitleCompact: {fontSize: 30, lineHeight: 33, letterSpacing: -.85},
  sessionTitleNarrow: {fontSize: 27, lineHeight: 30},
  sessionTitleGroup: {gap: 5, alignItems: "flex-start"},
  weekTag: {color: F.ink, fontFamily: "ManropeSemiBold", fontSize: 15, lineHeight: 23, backgroundColor: "#DADCCE", paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden"},
  sessionNote: {color: F.darkMuted, fontFamily: "ManropeSemiBold", fontSize: 13},
  coach: {marginHorizontal: 20, marginTop: 24, flexDirection: "row", gap: 13},
  coachMark: {width: 47, height: 47, borderWidth: 1, borderColor: "#555D3C", justifyContent: "center", alignItems: "center"},
  coachContent: {flex: 1, gap: 4},
  coachTitle: {...field.heading, fontSize: 23, flexShrink: 1},
  foot: {marginHorizontal: 20, paddingTop: 4},
});
