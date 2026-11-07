import {useCallback, useRef, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {router, useFocusEffect, useLocalSearchParams} from "expo-router";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, field, useFieldLocale} from "../components/FieldKit";
import {Copy, LocalizedTextInput} from "../components/Locale";
import {api} from "../lib/api";
import {levelLabel, parseDecimal} from "../lib/field-data";

type Metric = {key: string; unit: string; min?: number; max?: number};
type Attempt = {id: string; verdict: "PENDING" | "PASSED" | "FAILED";
  feedback?: {missing?: string[]; failed?: {key: string; actual: number | null}[]; coachFeedbackDe?: string}};
type Exam = {id: string; titleDe: string; metrics: Metric[]; attempts: Attempt[]; canSubmit: boolean; guidanceDe: string; nextRetestAt: string | null};
type Chapter = {id: string; titleDe: string; level: string; unlocked: boolean; finished: boolean; mandatoryTotal: number; mandatoryDone: number;
  items: {id: string; titleDe: string; description: string; mandatory: boolean; done: boolean}[]; assessment: Exam | null};
type Journey = {id: string; state: string; pathway: string; confirmedLevel: string | null; placement: Exam | null; chapters: Chapter[]};

const metricNames: Record<string, string> = {pushups: "Liegestütze", plank: "Unterarmstütz", plank_seconds: "Unterarmstütz", "5k_time": "5-km-Lauf"};
const unitNames: Record<string, string> = {reps: "Wdh.", seconds: "s", minutes: "min"};
const metricName = (key: string) => metricNames[key] ?? key.replaceAll("_", " ");

function range(metric: Metric, locale: string) {
  const unit = unitNames[metric.unit] ?? metric.unit;
  if (metric.min != null && metric.max != null) return metric.min.toLocaleString(locale) + "–" + metric.max.toLocaleString(locale) + " " + unit;
  if (metric.min != null) return "≥ " + metric.min.toLocaleString(locale) + " " + unit;
  if (metric.max != null) return "≤ " + metric.max.toLocaleString(locale) + " " + unit;
  return unit;
}

function ExamResult({exam, enrollmentId, ready, placement, reload}: {
  exam: Exam; enrollmentId: string; ready: boolean; placement?: boolean; reload: () => Promise<void>;
}) {
  const locale = useFieldLocale();
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentAttempt, setSentAttempt] = useState<string | null>(null);
  const key = useRef<string | null>(null);
  const pending = useRef(false);
  const waiting = !!sentAttempt && !exam.attempts.some(attempt => attempt.id === sentAttempt);
  const latest = waiting ? undefined : exam.attempts[0];
  const canSubmit = ready && exam.canSubmit && !waiting;
  const failed = latest?.verdict === "FAILED";
  async function submit() {
    if (pending.current || !canSubmit) return;
    const results = exam.metrics.map(metric => ({key: metric.key, unit: metric.unit, value: parseDecimal(values[metric.key] ?? "")}));
    if (results.some(result => !Number.isFinite(result.value))) {
      setError("Trage alle Messwerte als Zahl ein."); return;
    }
    pending.current = true; setBusy(true); setError("");
    key.current ??= "journey-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    try {
      const result = await api<{attempt: {id: string}}>("/api/journey/tests/attempts", {method: "POST",
        body: JSON.stringify({assessmentId: exam.id, enrollmentId, idempotencyKey: key.current, results})});
      key.current = null;
      setValues({}); setSentAttempt(result.attempt.id);
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : "Dein Test konnte nicht gespeichert werden."); }
    finally { pending.current = false; setBusy(false); }
  }
  return <View style={s.exam}>
    <Text style={s.title}><Copy text={exam.titleDe}/></Text>
    {(latest || waiting) && <View style={[s.result, failed && s.failed]}>
      <Text style={[s.accent, failed && s.alert]}><Copy text={failed ? "NOCH NICHT BESTANDEN" :
        latest?.verdict === "PASSED" ? "BESTANDEN" : "COACH PRÜFT"}/></Text>
      {latest?.verdict === "PASSED" && <Text style={field.body}><Copy text={placement
        ? "Dein Coach bestätigt jetzt deine Einstufung." : "Dein Kapitel ist abgeschlossen."}/></Text>}
      {failed && <>
        <Text style={s.improve}><Copy text="Daran kannst du arbeiten"/></Text>
        {latest?.feedback?.missing?.map(metric => <Text key={metric} style={field.body}><Copy text="Fehlender Messwert"/> · <Copy text={metricName(metric)}/></Text>)}
        {latest?.feedback?.failed?.map(result => {
          const metric = exam.metrics.find(value => value.key === result.key);
          return <View key={result.key} style={s.threshold}>
            <Text style={s.improve}><Copy text={metricName(result.key)}/></Text>
            <Text style={field.sub}><Copy text="Dein Wert"/> {result.actual?.toLocaleString(locale) ?? "—"}
              {metric ? <> · <Copy text="Ziel"/> {range(metric, locale)}</> : null}</Text>
          </View>;
        })}
        <Text style={field.body}><Copy text={latest?.feedback?.coachFeedbackDe || exam.guidanceDe ||
          "Wiederhole die Übungen im Kapitel und arbeite zuerst an den Messwerten, die das Ziel noch nicht erreicht haben."}/></Text>
      </>}
      {!failed && !!latest?.feedback?.coachFeedbackDe && <Text style={field.body}>{latest.feedback.coachFeedbackDe}</Text>}
    </View>}
    {!canSubmit && exam.nextRetestAt && Date.parse(exam.nextRetestAt) > Date.now() &&
      <Text style={field.sub}><Copy text="Nächster Versuch ab"/> {new Date(exam.nextRetestAt).toLocaleString(locale)}</Text>}
    {canSubmit && <>
      {exam.metrics.map(metric => <View key={metric.key} style={s.metric}>
        <Text style={field.body}><Copy text={metricName(metric.key)}/></Text>
        <Text style={field.sub}><Copy text="Ziel"/> {range(metric, locale)}</Text>
        <LocalizedTextInput style={s.input} keyboardType="decimal-pad" placeholder="Messwert" accessibilityLabel={metricName(metric.key)}
          editable={!busy} value={values[metric.key] ?? ""} onChangeText={value => {
            key.current = null; setValues(old => ({...old, [metric.key]: value}));
          }}/>
      </View>)}
      <FieldAction label={busy ? "Wird gespeichert …" : "Test einreichen"} disabled={busy} onPress={() => void submit()}/>
    </>}
    <FieldState error={error}/>
  </View>;
}

export default function JourneyTests() {
  const {enrollmentId, chapterId} = useLocalSearchParams<{enrollmentId?: string; chapterId?: string}>();
  const [data, setData] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const enabled = process.env.EXPO_PUBLIC_JOURNEY_TESTS_ENABLED !== "false";
  const refresh = useCallback(async () => {
    if (!enabled) { setLoading(false); return; }
    try {
      const value = await api<{enrollments: Journey[]}>("/api/journey/tests");
      setData(value.enrollments); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Deine Tests konnten nicht geladen werden."); }
    finally { setLoading(false); }
  }, [enabled]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  async function finish(id: string, itemId: string) {
    if (pending.current) return;
    pending.current = true; setBusy(itemId); setError("");
    try {
      await api("/api/journey/tests/items", {method: "POST", body: JSON.stringify({enrollmentId: id, itemId})});
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Der Inhalt konnte nicht gespeichert werden."); }
    finally { pending.current = false; setBusy(""); }
  }
  const enrollments = data.filter(item => !enrollmentId || item.id === enrollmentId);
  return <FieldPage>
    <FieldMast section="TRAINING"/>
    <View style={s.content}>
      <FieldLink label="Zurück" onPress={() => router.back()}/>
      <Text accessibilityRole="header" style={field.heading}><Copy text={chapterId ? "Dein Kapiteltest" : "Tests & Trainerfeedback"}/></Text>
      <FieldState loading={loading} error={error} retry={() => void refresh()}/>
      {!enabled && <Text style={field.sub}><Copy text="Die Kapiteltests werden vorbereitet."/></Text>}
      {enabled && !loading && !error && enrollments.length === 0 && <Text style={field.sub}><Copy text="Dein Trainingsweg wird noch zugeordnet."/></Text>}
      {enrollments.map(enrollment => {
        const chapters = enrollment.chapters.filter(chapter => chapterId ? chapter.id === chapterId : chapter.unlocked);
        return <View key={enrollment.id} style={s.group}>
          <Text style={field.type}>{enrollment.pathway}</Text>
          {enrollment.state === "PENDING" && !chapterId && (enrollment.placement ?
            <ExamResult key={enrollment.placement.id} exam={enrollment.placement} enrollmentId={enrollment.id} ready placement reload={refresh}/>
            : <Text style={field.body}><Copy text="Dein Coach bestätigt deine Einstufung."/></Text>)}
          {chapters.map(chapter => <View key={chapter.id} style={s.group}>
            <Text style={s.accent}>{levelLabel(chapter.level)}</Text>
            <Text style={s.title}><Copy text={chapter.titleDe}/></Text>
            {chapter.unlocked ? <>
              <Text style={field.sub}>{chapter.mandatoryDone}/{chapter.mandatoryTotal} <Copy text="Pflichtinhalte abgeschlossen"/></Text>
              {chapter.items.filter(item => !item.done && !chapter.finished).map(item => <View key={item.id} style={s.item}>
                <Text style={field.body}><Copy text={item.titleDe}/></Text>
                {item.description ? <Text style={field.sub}><Copy text={item.description}/></Text> : null}
                <FieldAction label={busy === item.id ? "Wird gespeichert …" : "Als erledigt markieren"} tone="quiet" disabled={!!busy}
                  onPress={() => void finish(enrollment.id, item.id)}/>
              </View>)}
              {chapter.assessment ? <ExamResult key={chapter.assessment.id} exam={chapter.assessment} enrollmentId={enrollment.id}
                ready={!chapter.finished && chapter.mandatoryDone === chapter.mandatoryTotal} reload={refresh}/>
                : <Text style={field.sub}><Copy text="Für dieses Kapitel ist noch kein Test freigegeben."/></Text>}
              <FieldLink label="Kapitel öffnen" onPress={() => router.push({pathname: "/journey", params: {chapterId: chapter.id, enrollmentId: enrollment.id}})}/>
            </> : <Text style={field.sub}><Copy text="Schließe zuerst die vorherigen Kapitel ab."/></Text>}
          </View>)}
        </View>;
      })}
    </View>
  </FieldPage>;
}

const s = StyleSheet.create({
  content: {marginHorizontal: 20, gap: 12},
  group: {gap: 7, marginTop: 6},
  title: {...field.heading, fontSize: 21},
  exam: {borderTopWidth: 1, borderColor: F.line, paddingTop: 13, paddingBottom: 13, gap: 10},
  result: {borderLeftWidth: 2, borderColor: F.signal, padding: 13, gap: 7, backgroundColor: F.surface},
  failed: {borderColor: F.red},
  threshold: {borderTopWidth: 1, borderColor: F.line, paddingTop: 6},
  improve: {...field.body, fontFamily: "ManropeSemiBold"},
  accent: {...field.type, color: F.signal},
  alert: {color: F.red},
  item: {gap: 5, borderTopWidth: 1, borderColor: F.line, paddingVertical: 8},
  metric: {gap: 4},
  input: {minHeight: 50, color: F.chalk, fontSize: 16},
});
