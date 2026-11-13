import {useCallback, useState} from "react";
import {Pressable, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {Check, Circle, LockKeyhole} from "lucide-react-native";
import {F, FieldAction, FieldLink, FieldMast, FieldPage, FieldState, dateLabel, field, useFieldLocale} from "../../components/FieldKit";
import {Copy} from "../../components/Locale";
import {api} from "../../lib/api";
import type {ChapterPreview, DayWorkout, JourneyOverview, LevelPreview} from "../../lib/field-data";
import {levelLabel} from "../../lib/field-data";
import {preloadCurrentPlanMedia} from "../../lib/media-cache";

type Workout = DayWorkout & {completedAt: string | null; exercises: unknown[]; rpe: number | null};
const levelCodes = ["READY", "AWAKE", "DIFFERENT", "BE_DIFFERENT", "TRULY_DIFFERENT"];
const levelNotes = [
  "Grundlagen und Trainingsroutine.", "Technik und Struktur.", "Gezielt an deinen Zielen arbeiten.",
  "Anspruchsvoller und strukturierter trainieren.", "Deine Leistung weiter verfeinern.",
];

function goToChapter(enrollmentId: string, chapterId: string) {
  router.push({pathname: "/journey", params: {enrollmentId, chapterId}});
}

function ChapterRow({chapter, enrollmentId}: {chapter: ChapterPreview; enrollmentId: string}) {
  const Icon = chapter.finished ? Check : chapter.unlocked ? Circle : LockKeyhole;
  return <Pressable accessibilityRole="button" accessibilityState={{disabled: !chapter.unlocked}} disabled={!chapter.unlocked}
    onPress={() => goToChapter(enrollmentId, chapter.id)} style={({pressed}) => [s.chapter, pressed && s.pressed]}>
    <Icon size={17} color={chapter.unlocked ? F.signal : F.muted} strokeWidth={1.8}/>
    <View style={s.flex}>
      <Text style={s.chapterTitle}><Copy text={chapter.titleDe}/></Text>
      <Text style={field.sub}>
        {chapter.finished ? <Copy text="Abgeschlossen"/> : chapter.unlocked ? <>
          {chapter.mandatoryDone}/{chapter.mandatoryTotal} <Copy text="Pflichtinhalte"/>
        </> : <Copy text="Gesperrt"/>}
      </Text>
    </View>
  </Pressable>;
}

export default function Training() {
  const locale = useFieldLocale();
  const {width} = useWindowDimensions();
  const compact = width < 380;
  const [overview, setOverview] = useState<JourneyOverview | null>(null);
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [selection, setSelection] = useState<string | null>(null);
  const [enrollmentSelection, setEnrollmentSelection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [overviewError, setOverviewError] = useState("");
  const [workoutError, setWorkoutError] = useState("");
  const enabled = process.env.EXPO_PUBLIC_JOURNEY_OVERVIEW_ENABLED !== "false";
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    const workoutsTask = api<{workouts: Workout[]}>("/api/workouts?history=1").then(value => {
      if (!isActive()) return;
      setWorkouts(value.workouts);
      setWorkoutError("");
      void preloadCurrentPlanMedia().catch(() => undefined);
    }).catch(() => { if (isActive()) setWorkoutError("Dein Trainingsplan konnte nicht geladen werden."); });
    const overviewTask = enabled ? api<JourneyOverview>("/api/journey/overview").then(value => {
      if (isActive()) { setOverview(value); setOverviewError(""); }
    }).catch(() => { if (isActive()) setOverviewError("Dein Trainingsweg ist gerade nicht verfügbar."); }) : Promise.resolve();
    await Promise.all([workoutsTask, overviewTask]);
    if (isActive()) setLoading(false);
  }, [enabled]);
  useFocusEffect(useCallback(() => {
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [load]));

  const enrollments = overview?.enrollments ?? [];
  const enrollment = enrollments.find(item => item.id === enrollmentSelection) ?? enrollments[0];
  const nextLevel = enrollment?.levels.find(item => item.chapters.some(chapter => chapter.unlocked && !chapter.finished));
  const level = selection ?? nextLevel?.code ?? enrollment?.confirmedLevel ?? levelCodes[0];
  const nextChapter = nextLevel?.chapters.find(chapter => chapter.id === enrollment?.nextChapterId)
    ?? nextLevel?.chapters.find(chapter => chapter.unlocked && !chapter.finished);
  const currentLevel = enrollment?.confirmedLevel ?? nextLevel?.code;
  const available = (workouts ?? []).filter(workout => !workout.completedAt).reverse();
  const completed = (workouts ?? []).filter(workout => workout.completedAt).slice(0, 10);
  const nextWorkout = available[0];
  const testsEnabled = overview?.testsEnabled && process.env.EXPO_PUBLIC_JOURNEY_TESTS_ENABLED !== "false";
  const needsPlacement = enrollment?.state === "PENDING" && testsEnabled;
  const chapterReadyForTest = Boolean(testsEnabled && nextChapter?.testAvailable && nextChapter.mandatoryTotal != null &&
    nextChapter.mandatoryDone === nextChapter.mandatoryTotal);
  const title = needsPlacement ? "Deine Einstufung" : nextChapter?.titleDe ?? nextWorkout?.title ?? "Dein Trainingsweg";
  const weekTitle = title.match(/^(.*?)\s*[·•]\s*((?:Woche|Week)\s+\d+)$/i);
  const nextLabel = needsPlacement ? "Einstufungstest öffnen" : chapterReadyForTest ? "Kapiteltest öffnen" :
    nextChapter ? "Kapitel öffnen" : nextWorkout ? "Einheit öffnen" : "Trainingspläne ansehen";
  function openNext() {
    if (enrollment && (needsPlacement || chapterReadyForTest)) {
      router.push({pathname: "/journey-tests", params: {enrollmentId: enrollment.id, ...(nextChapter && {chapterId: nextChapter.id})}});
    } else if (nextChapter && enrollment) goToChapter(enrollment.id, nextChapter.id);
    else if (nextWorkout) router.push({pathname: "/workout/[id]", params: {id: nextWorkout.id}});
    else router.push("/plans");
  }
  function preview(code: string): LevelPreview | undefined {
    return enrollment?.levels.find(item => item.code === code);
  }
  return <FieldPage>
    <FieldMast section="TRAINING"/>
    <View style={s.intro}>
      <Text style={s.label}><Copy text="5 LEVEL · DEIN WEG"/></Text>
      <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68} style={s.title}><Copy text="Dein Trainingsweg"/></Text>
      {enrollment && <Text style={field.sub}><Copy text={enrollment.pathway}/> · {enrollment.completedChapters}/{enrollment.totalChapters} <Copy text="Kapitel"/></Text>}
    </View>
    <FieldState loading={loading} error={!overview && !workouts ? overviewError || workoutError : ""} retry={() => void load()}/>
    {!loading && <>
      {(overviewError || workoutError) && (overview || workouts) && <View style={s.partialNotice}>
        <Text style={s.partialText}><Copy text={overviewError || workoutError}/></Text>
        <FieldLink label="Erneut laden" onPress={() => void load()}/>
      </View>}
      <View style={s.next}>
        <Text style={s.nextLabel}><Copy text="NÄCHSTER SCHRITT"/></Text>
        {weekTitle ? <View accessible accessibilityRole="header" accessibilityLabel={title} style={s.nextHeading}>
          <Text style={[s.nextTitle, compact && s.nextTitleCompact]}><Copy text={weekTitle[1]}/></Text>
          <Text style={s.nextWeek}>{weekTitle[2]}</Text>
        </View> : <Text accessibilityRole="header" style={[s.nextTitle, compact && s.nextTitleCompact]}><Copy text={title}/></Text>}
        <FieldAction label={nextLabel} onPress={openNext} tone="ink"/>
      </View>
      {enrollments.length > 1 && <View style={s.enrollment}>
        {enrollments.map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityState={{selected: item.id === enrollment?.id}}
          onPress={() => { setEnrollmentSelection(item.id); setSelection(null); }} style={s.enrollmentChoice}>
          <Text style={[field.body, item.id === enrollment?.id && s.accent]}>{item.pathway}</Text>
        </Pressable>)}
      </View>}
      <View style={s.track}>
        <View pointerEvents="none" style={s.lane}/>
        {levelCodes.map((code, index) => {
          const entry = preview(code);
          const selected = code === level;
          const unlocked = Boolean(entry?.chapters.some(chapter => chapter.unlocked));
          const state = entry?.earned ? "Erreicht" : code === currentLevel ? "Aktuell" : unlocked ? "Freigeschaltet" : "Ausstehend";
          return <View key={code}>
            <Pressable accessibilityRole="button" accessibilityState={{expanded: selected}} onPress={() => setSelection(code)}
              testID={"level-" + code} style={({pressed}) => [s.level, pressed && s.pressed]}>
              <View style={[s.numberWrap, selected && s.selectedNumber]}>
                <Text style={[s.number, selected && s.selectedText]}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <Text style={[s.levelName, compact && s.levelNameCompact, selected && s.accent]}>{levelLabel(code)}</Text>
              <Text style={[s.levelState, compact && s.levelStateCompact]}><Copy text={state}/></Text>
            </Pressable>
            {selected && <View style={s.expansion}>
              <Text style={field.sub}><Copy text={entry?.description || levelNotes[index]}/></Text>
              {entry?.chapters.map(chapter => <ChapterRow key={chapter.id} chapter={chapter} enrollmentId={enrollment.id}/>)}
              {testsEnabled && enrollment && (entry?.chapters.some(chapter => chapter.unlocked) || needsPlacement) &&
                <FieldLink label="Tests & Trainerfeedback" onPress={() => router.push({pathname: "/journey-tests", params: {enrollmentId: enrollment.id}})}/>}
            </View>}
          </View>;
        })}
      </View>
      {enabled && !enrollment && overview && <View style={s.links}>
        <Text style={field.sub}><Copy text={overview.intake ? "Dein Trainingsweg wird vorbereitet." : "Wähle dein Ziel, um deinen Trainingsweg zu beginnen."}/></Text>
        <FieldLink label={overview.legacy.transitionAvailable ? "Trainingsweg einrichten" : "Trainingsweg ansehen"} onPress={() => router.push("/journey")}/>
      </View>}
      <View style={s.links}>
        <Text accessibilityRole="header" style={field.heading}><Copy text="Deine Einheiten"/></Text>
        {available.length === 0 && workouts && <Text style={field.sub}><Copy text="Keine offene Einheit."/></Text>}
        {available.map(workout => <Pressable key={workout.id} accessibilityRole="button"
          onPress={() => router.push({pathname: "/workout/[id]", params: {id: workout.id}})} style={s.workout}>
          <Text style={s.chapterTitle}><Copy text={workout.title}/></Text>
          <Text style={field.sub}>
            {workout.scheduledAt ? dateLabel(workout.scheduledAt, locale, {weekday: "short", day: "numeric", month: "short"}) : <Copy text="Ohne Termin"/>}
            {" · "}{workout.exercises.length} <Copy text="Übungen"/>
          </Text>
        </Pressable>)}
        <Pressable accessibilityRole="button" accessibilityState={{expanded: historyOpen}} onPress={() => setHistoryOpen(!historyOpen)} style={s.workout}>
          <Text style={s.chapterTitle}><Copy text="Letzte Abschlüsse"/> {historyOpen ? "−" : "+"}</Text>
        </Pressable>
        {historyOpen && completed.map(workout => <Pressable key={workout.id} accessibilityRole="button"
          onPress={() => router.push({pathname: "/workout/[id]", params: {id: workout.id}})} style={s.workout}>
          <Text style={s.chapterTitle}><Copy text={workout.title}/></Text>
          <Text style={field.sub}>{dateLabel(workout.completedAt!, locale, {day: "numeric", month: "long"})}</Text>
        </Pressable>)}
        {historyOpen && completed.length === 0 && <Text style={field.sub}><Copy text="Noch keine abgeschlossene Einheit."/></Text>}
        <View style={s.tools}>
          <FieldLink label="Trainingspläne" onPress={() => router.push("/plans")}/>
          <FieldLink label="Übungsbibliothek" onPress={() => router.push("/library")}/>
        </View>
      </View>
    </>}
  </FieldPage>;
}

const s = StyleSheet.create({
  intro: {paddingHorizontal: 20, paddingTop: 23, paddingBottom: 18, gap: 4},
  partialNotice: {marginHorizontal: 20, marginBottom: 14, borderLeftWidth: 2, borderColor: F.red, paddingLeft: 10, gap: 2},
  partialText: {...field.sub, color: F.muted},
  label: {...field.type, color: F.signal},
  title: {fontFamily: "Archivo", fontSize: 36, lineHeight: 40, letterSpacing: -1.5, color: F.chalk},
  next: {backgroundColor: F.signal, marginHorizontal: 20, padding: 15, gap: 8, borderLeftWidth: 4, borderColor: "#9EBE00"},
  nextLabel: {...field.type, color: F.ink},
  nextTitle: {fontFamily: "Archivo", fontSize: 26, lineHeight: 31, color: F.ink, flexShrink: 1},
  nextTitleCompact: {fontSize: 23, lineHeight: 27},
  nextHeading: {alignItems: "flex-start", gap: 3},
  nextWeek: {color: F.ink, fontFamily: "ManropeSemiBold", fontSize: 14, lineHeight: 20, backgroundColor: "#D6EB56", paddingVertical: 3, paddingHorizontal: 8},
  enrollment: {paddingHorizontal: 20, marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 10},
  enrollmentChoice: {minHeight: 44, borderBottomWidth: 1, borderColor: F.line, justifyContent: "center"},
  track: {marginHorizontal: 20, marginTop: 22, position: "relative"},
  lane: {position: "absolute", left: 23, top: 15, bottom: 22, width: 1, backgroundColor: "#555B49"},
  level: {minHeight: 52, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 4},
  numberWrap: {width: 47, minHeight: 39, backgroundColor: F.bg, borderWidth: 1, borderColor: "#424641",
    justifyContent: "center", alignItems: "center"},
  selectedNumber: {backgroundColor: F.chalk, borderColor: F.chalk},
  number: {fontFamily: "Archivo", fontSize: 21, color: F.muted, fontVariant: ["tabular-nums"]},
  selectedText: {color: F.ink},
  levelName: {fontFamily: "Archivo", fontSize: 17, color: F.chalk, flex: 1, minWidth: 0, letterSpacing: -.35},
  levelNameCompact: {fontSize: 15},
  levelState: {color: F.muted, fontFamily: "ManropeSemiBold", fontSize: 11, maxWidth: "33%", textAlign: "right", flexShrink: 1},
  levelStateCompact: {fontSize: 10, maxWidth: "28%"},
  accent: {color: F.signal},
  expansion: {marginLeft: 57, paddingTop: 4, paddingBottom: 11, gap: 6},
  chapter: {minHeight: 49, paddingVertical: 7, borderTopWidth: 1, borderColor: F.line, flexDirection: "row", alignItems: "center", gap: 9},
  chapterTitle: {color: F.chalk, fontFamily: "ManropeSemiBold", fontSize: 15},
  flex: {flex: 1},
  pressed: {opacity: .68},
  links: {marginHorizontal: 20, marginTop: 24, gap: 8},
  workout: {minHeight: 49, borderBottomWidth: 1, borderColor: F.line, justifyContent: "center", paddingVertical: 8},
  tools: {flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12},
});
