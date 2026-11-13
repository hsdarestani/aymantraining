import {useCallback, useState} from "react";
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {router, useFocusEffect} from "expo-router";
import Svg, {Circle, Line, Path} from "react-native-svg";
import {F, FieldLink, FieldMast, FieldPage, FieldState, dateLabel, field, useFieldLocale} from "../../components/FieldKit";
import {Copy} from "../../components/Locale";
import {api, ApiError} from "../../lib/api";
import type {Dashboard} from "../../lib/field-data";

type Snapshot = {date: string; total: number; completeness?: number};
type Body = {id: string; date: string; weightKg: number | null};
type Test = {id: string; name: string; completedAt: string | null; results: {value: number; unit: string}[]};
type Award = {id: string; title: string; achievedAt: string};
type Milestones = {enabled: boolean; streak?: number; awards?: Award[]};
type Timeline = {scores: Snapshot[]};
const days = [30, 90, 365];
const dayMs = 86_400_000;
const sections = [
  ["Kraft", "strength"], ["Ausdauer", "endurance"], ["Athletik", "athleticism"], ["Beweglichkeit", "mobility"],
  ["Regeneration", "recovery"], ["Ernährung", "fuel"], ["Konstanz", "consistency"],
] as const;

function Trace({points}: {points: Snapshot[]}) {
  const width = 320, height = 108, inset = 7;
  const first = Date.parse(points[0].date);
  const span = Math.max(1, Date.parse(points[points.length - 1].date) - first);
  const plot = points.map(p => ({
    x: points.length === 1 ? width - inset : inset + ((Date.parse(p.date) - first) / span) * (width - inset * 2),
    y: height - inset - (Math.min(100, Math.max(0, p.total)) / 100) * (height - inset * 2),
  }));
  const path = plot.map(({x, y}, index) => (index ? "L" : "M") + x + " " + y).join(" ");
  const last = plot[plot.length - 1];
  return <Svg viewBox="0 0 320 108" width="100%" height={108} preserveAspectRatio="none" accessible={false}>
    {[0, 25, 50, 75, 100].map(value => {
      const y = height - inset - (value / 100) * (height - inset * 2);
      return <Line key={value} x1={0} x2={width} y1={y} y2={y} stroke="#C6C7BA" strokeWidth={1}/>;
    })}
    {plot.length > 1 && <>
      <Path d={path + "L" + last.x + " " + (height - inset) + "H" + inset + "Z"} fill="#DDEAA3"/>
      <Path d={path} fill="none" stroke="#394521" strokeWidth={2.5} strokeLinejoin="round"/>
    </>}
    <Circle cx={last.x} cy={last.y} r={4.5} fill="#394521"/>
  </Svg>;
}

export default function Progress() {
  const locale = useFieldLocale();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [body, setBody] = useState<Body[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [milestones, setMilestones] = useState<Milestones | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[] | null>(null);
  const [timelineLocked, setTimelineLocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    const [dashboard, measurements, results, awards, timeline] = await Promise.allSettled([
      api<Dashboard>("/api/mobile/dashboard"), api<{items: Body[]}>("/api/body-metrics"),
      api<{items: Test[]}>("/api/performance-tests"), api<Milestones>("/api/milestones"),
      api<Timeline>("/api/performance-timeline"),
    ]);
    if (!isActive()) return;
    if (dashboard.status === "fulfilled") { setDash(dashboard.value); setError(""); }
    else setError("Dein BD Score konnte nicht geladen werden.");
    if (measurements.status === "fulfilled") setBody(measurements.value.items);
    if (results.status === "fulfilled") setTests(results.value.items);
    if (awards.status === "fulfilled") setMilestones(awards.value);
    if (timeline.status === "fulfilled") {
      setSnapshots(timeline.value.scores);
      setTimelineLocked(false);
    } else if (timeline.reason instanceof ApiError && timeline.reason.status === 403) {
      setSnapshots(null);
      setTimelineLocked(true);
    }
    setUnavailable([measurements, results, awards].some(result => result.status === "rejected") ||
      (timeline.status === "rejected" && !(timeline.reason instanceof ApiError && timeline.reason.status === 403)));
    setLoading(false);
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [load]));

  const profile = dash?.dailyProfile?.profile;
  const score = profile?.value;
  const points = (snapshots ?? []).filter(item => Number.isFinite(item.total) && item.completeness !== 0 &&
    Date.parse(item.date) >= Date.now() - period * dayMs).sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  const measurement = body.find(item => item.weightKg != null);
  const log = [
    ...(milestones?.awards ?? []).map(item => ({id: item.id, title: item.title, date: item.achievedAt, type: "MEILENSTEIN", value: ""})),
    ...tests.flatMap(item => item.completedAt ? [{id: item.id, title: item.name, date: item.completedAt, type: "LEISTUNGSTEST",
      value: item.results[0] ? item.results[0].value.toLocaleString(locale) + " " + item.results[0].unit : ""}] : []),
    ...(measurement ? [{id: measurement.id, title: "Körpergewicht", date: measurement.date, type: "MESSUNG",
      value: measurement.weightKg!.toLocaleString(locale) + " kg"}] : []),
  ].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 8);
  return <FieldPage>
    <FieldMast section="FORTSCHRITT"/>
    <FieldState loading={loading} error={error} retry={() => void load()}/>
    {!loading && <>
      {dash && <View style={s.wall}>
        <View style={s.wallHeader}>
          <View style={s.scoreGroup}>
            <Text accessibilityRole="header" style={s.darkLabel}><Copy text="BD SCORE"/></Text>
            <View style={s.figure}>
              <Text style={[s.score, compact && s.scoreCompact]}>{score == null ? "—" : Math.round(score)}</Text>
              {score != null && <Text style={s.scale}>/ 100</Text>}
            </View>
          </View>
          <View style={[s.stamp, compact && s.stampCompact]}>
            <Text style={s.darkLabel}><Copy text="MESSSTAND"/></Text>
            <Text style={s.stampDate}>{profile?.recordedDate ? dateLabel(profile.recordedDate, locale, {day: "2-digit", month: "short"}) : "—"}</Text>
            {score != null && <Text style={s.darkSmall}>{profile?.completeness ?? 0}% <Copy text="erfasst"/></Text>}
          </View>
        </View>
        {snapshots && <View accessibilityRole="tablist" style={s.periods}>
          {days.map(value => <Pressable key={value} onPress={() => setPeriod(value)} accessibilityRole="tab"
            accessibilityState={{selected: value === period}} style={[s.period, value === period && s.periodOn]}>
            <Text style={[s.darkSmall, value === period && s.periodTextOn]}>{value} <Copy text="Tage"/></Text>
          </Pressable>)}
        </View>}
        {points.length > 1 ? <>
          <Trace points={points}/>
          <View style={s.axis}>
            <Text style={s.darkSmall}>{dateLabel(points[0].date, locale, {day: "numeric", month: "short"})}</Text>
            <Text style={s.darkSmall}>{dateLabel(points[points.length - 1].date, locale, {day: "numeric", month: "short"})}</Text>
          </View>
        </> : points.length === 1 ? <View style={s.singlePoint}>
          <View style={s.singleMarker}/>
          <View style={s.singleCopy}>
            <Text style={s.singleValue}>{Math.round(points[0].total)} / 100</Text>
            <Text style={s.darkSmall}><Copy text="Ein Messpunkt"/> · {dateLabel(points[0].date, locale, {day: "numeric", month: "short"})}</Text>
          </View>
        </View> : <View style={s.noPlot}>
          <Text style={s.darkSmall}><Copy text={timelineLocked ? "Der Score-Verlauf ist mit PRO verfügbar."
            : snapshots ? "Keine Messpunkte in diesem Zeitraum." : "Der Score-Verlauf ist gerade nicht verfügbar."}/></Text>
        </View>}
      </View>}
      {unavailable && <View style={s.partialNotice}>
        <Text style={field.sub}><Copy text="Einige Fortschrittsdaten konnten nicht geladen werden."/></Text>
        <FieldLink label="Erneut laden" onPress={() => void load()}/>
      </View>}
      <View style={s.records}>
        <View style={s.recordsHead}>
          <View style={s.scoreGroup}>
            <Text style={s.logLabel}><Copy text="DEIN LEISTUNGSARCHIV"/></Text>
            <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={field.heading}><Copy text="Deine Spuren"/></Text>
          </View>
          {milestones?.enabled && <View style={s.streak}>
            <Text style={s.streakValue}>{milestones.streak ?? 0}</Text>
            <Text style={field.sub}><Copy text="Tage in Folge"/></Text>
          </View>}
        </View>
        {log.length === 0 && !unavailable && <Text style={field.sub}><Copy text="Deine ersten Messungen und Meilensteine erscheinen hier."/></Text>}
        {log.map(item => <View key={item.type + item.id} style={s.record}>
          <View style={s.rail}>
            <View style={[s.tick, item.type === "MEILENSTEIN" && s.award]}/>
            <Text style={s.recordDate}>{dateLabel(item.date, locale, {day: "2-digit", month: "short"})}</Text>
          </View>
          <View style={s.recordText}>
            <Text style={field.type}><Copy text={item.type}/></Text>
            <Text style={field.body}><Copy text={item.title}/></Text>
          </View>
          {item.value ? <Text style={s.recordValue}>{item.value}</Text> : null}
        </View>)}
        <View style={s.recordLinks}>
          {milestones?.enabled && <FieldLink label="Alle Meilensteine" onPress={() => router.push("/milestones")}/>}
          <FieldLink label="Leistungstests" onPress={() => router.push("/tests")}/>
        </View>
      </View>
      <View style={s.disciplines}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={field.heading}><Copy text="Leistungsprofil"/></Text>
        {dash?.scoreDetailsLocked ? <Text style={field.sub}><Copy text="Einzelwerte sind mit PRO verfügbar."/></Text>
          : sections.map(([label, key]) => {
            const value = dash?.pillarPreview?.[key];
            return <View key={key} style={s.discipline}>
              <Text style={s.disciplineLabel}><Copy text={label}/></Text>
              <View style={s.meter}>{value != null && <View style={[s.meterFill, {width: Math.max(0, Math.min(value, 100)) + "%" as `${number}%`}]}/>}</View>
              <Text style={s.disciplineValue}>{value == null ? "—" : Math.round(value)}</Text>
            </View>;
          })}
        {!timelineLocked && <FieldLink label="Leistungsverlauf öffnen" onPress={() => router.push("/performance-timeline")}/>}
        <FieldLink label="Fortschrittsfotos" onPress={() => router.push("/progress-photos")}/>
        <FieldLink label="Wochenbericht" onPress={() => router.push("/report")}/>
      </View>
    </>}
  </FieldPage>;
}

const s = StyleSheet.create({
  wall: {backgroundColor: F.chalk, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 14, borderTopWidth: 3, borderColor: F.signal},
  wallHeader: {flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10},
  scoreGroup: {flex: 1, minWidth: 0},
  darkLabel: {...field.type, color: F.darkMuted},
  figure: {flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 5},
  score: {color: F.ink, fontFamily: "Archivo", fontSize: 82, lineHeight: 86, letterSpacing: -4, fontVariant: ["tabular-nums"]},
  scoreCompact: {fontSize: 66, lineHeight: 71, letterSpacing: -3},
  scale: {color: F.darkMuted, fontFamily: "ManropeSemiBold", fontSize: 17},
  stamp: {borderLeftWidth: 1, borderColor: "#A7AA9F", paddingLeft: 10, gap: 3, marginTop: 3, maxWidth: "48%", flexShrink: 1},
  stampCompact: {paddingLeft: 7},
  stampDate: {color: F.ink, fontFamily: "Archivo", fontSize: 18},
  darkSmall: {color: F.darkMuted, fontFamily: "ManropeSemiBold", fontSize: 12},
  periods: {flexDirection: "row", marginTop: 5, marginBottom: 8, borderBottomWidth: 1, borderColor: "#B9BBB0"},
  period: {minHeight: 44, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 3, borderBottomWidth: 2, borderColor: "transparent"},
  periodOn: {borderColor: "#394521"},
  periodTextOn: {color: F.ink},
  axis: {flexDirection: "row", justifyContent: "space-between", paddingTop: 4},
  noPlot: {minHeight: 54, justifyContent: "center", borderTopWidth: 1, borderColor: "#C6C7BA"},
  singlePoint: {minHeight: 72, flexDirection: "row", alignItems: "center", gap: 13, borderTopWidth: 1, borderColor: "#C6C7BA", paddingVertical: 12},
  singleMarker: {height: 13, width: 13, borderRadius: 7, backgroundColor: "#394521"},
  singleCopy: {flex: 1, minWidth: 0, gap: 2},
  singleValue: {color: F.ink, fontFamily: "Archivo", fontSize: 20},
  partialNotice: {marginHorizontal: 20, marginTop: 16, paddingLeft: 11, borderLeftWidth: 2, borderColor: F.red, gap: 2},
  records: {marginHorizontal: 20, marginTop: 25, gap: 5},
  recordsHead: {flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 13, marginBottom: 10},
  logLabel: {...field.type, color: F.signal, marginBottom: 4},
  streak: {alignItems: "flex-end", paddingBottom: 1},
  streakValue: {color: F.signal, fontFamily: "Archivo", fontSize: 25},
  record: {flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderColor: F.line, minHeight: 63, gap: 10, paddingVertical: 8},
  rail: {width: 63, flexDirection: "row", alignItems: "center", gap: 6},
  tick: {width: 4, height: 20, backgroundColor: "#6B7269"},
  award: {backgroundColor: F.signal},
  recordDate: {color: F.muted, fontFamily: "ManropeSemiBold", fontSize: 11, flexShrink: 1},
  recordText: {flex: 1, minWidth: 0, gap: 2},
  recordValue: {color: F.chalk, fontFamily: "Archivo", fontSize: 14, maxWidth: "28%", textAlign: "right", flexShrink: 1},
  recordLinks: {flexDirection: "row", flexWrap: "wrap", columnGap: 17},
  disciplines: {marginHorizontal: 20, borderTopWidth: 1, borderColor: F.line, paddingTop: 18, marginTop: 8, gap: 5},
  discipline: {flexDirection: "row", gap: 10, minHeight: 38, alignItems: "center"},
  disciplineLabel: {...field.body, flexBasis: "36%", flexShrink: 1, minWidth: 0},
  meter: {height: 3, flex: 1, backgroundColor: F.line},
  meterFill: {height: 3, backgroundColor: F.signal},
  disciplineValue: {...field.body, minWidth: 27, textAlign: "right", fontVariant: ["tabular-nums"]},
});
