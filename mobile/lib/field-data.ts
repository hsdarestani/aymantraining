export type DayWorkout = {id: string; title: string; scheduledAt: string | null; completed?: boolean};
export type RhythmDay = {offset: number; date: string; workouts: DayWorkout[]};

export type Dashboard = {
  user: {id: string; name: string | null; tier: string; onboardingCompleted: boolean};
  dailyProfile?: {
    date: string; timeZone: string;
    profile: {value: number | null; completeness: number; recordedDate: string | null};
    today: {energy: number | null; sleepHours: number | null; hasCheckIn: boolean};
    journey: {confirmedLevel: string | null};
  };
  score?: Record<string, number | null> | null;
  pillarPreview?: Record<string, number | null> | null;
  scoreDetailsLocked?: boolean;
  dayStrip?: RhythmDay[];
  nextWorkout?: DayWorkout | null;
  heroPhotoId?: string | null;
  dashboardPreference?: {enabled: boolean; mode: string};
  goals?: string[];
  womenGoals?: string[];
  cycleJournalEnabled?: boolean;
  activity?: {steps: number | null; proteinG: number | null; sleepHours: number | null};
  wearable?: {date: string; source?: string; steps: number | null; sleepMinutes: number | null; hrv?: number | null} | null;
  differentLine?: string;
  recommendations?: {title: string; action: string; severity: string}[];
};

export type ChapterPreview = {
  id: string; titleDe: string; position: number; unlocked: boolean; finished: boolean;
  testAvailable?: boolean;
  mandatoryDone: number | null; mandatoryTotal: number | null;
};
export type LevelPreview = {code: string; description: string; earned: boolean; chapters: ChapterPreview[]};
export type JourneyOverview = {
  goals: {slug: string; label: string}[];
  levels: {code: string; description: string}[];
  testsEnabled: boolean;
  intake: {goals: string[]; status: string} | null;
  legacy: {activeGoals?: string[]; transitionAvailable: boolean};
  enrollments: {id: string; pathway: string; state: string; confirmedLevel: string | null; levels: LevelPreview[];
    totalChapters: number; completedChapters: number; nextChapterId?: string | null}[];
};

export type CoachBrief = {id?: string; title: string; body: string | null; mediaId?: string | null};
export type DailyCoach = {
  actual: {workout: DayWorkout | null; nextWorkout: DayWorkout | null};
  recovery: {note: string; needsCheckIn?: boolean};
  coach: {
    assigned: boolean; name?: string | null; brief: CoachBrief | null; openVideos: number;
    adjustments: {title: string; action: string; date: string}[];
    feedback: {id: string; coachNote: string; reviewedAt: string | null; nextSession: {focus?: string; advice?: string} | null}[];
  };
};

export function levelLabel(code: string) {
  return code.replaceAll("_", " ");
}

export function parseDecimal(input: string) {
  const value = input.trim();
  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(value)) return NaN;
  return Number(value.replace(",", "."));
}
