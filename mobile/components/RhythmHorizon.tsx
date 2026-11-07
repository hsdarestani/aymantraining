import {Pressable, StyleSheet, Text, View} from "react-native";
import {Check} from "lucide-react-native";
import {F, dateLabel, field, useFieldLocale} from "./FieldKit";
import {Copy} from "./Locale";
import {translate} from "../lib/i18n/locale";
import type {RhythmDay} from "../lib/field-data";

const daysOfInterest = [-1, 0, 1] as const;
type Offset = typeof daysOfInterest[number];
const captions = {"-1": "Gestern", "0": "Heute", "1": "Morgen"};

export default function RhythmHorizon({days, selected, onSelect}: {
  days: RhythmDay[];
  selected: Offset;
  onSelect: (offset: Offset) => void;
}) {
  const locale = useFieldLocale();
  if (!days.length) return null;
  return (
    <View accessibilityRole="tablist" style={styles.timeline}>
      <View style={styles.rail} pointerEvents="none"/>
      {daysOfInterest.map(offset => {
        const day = days.find(item => item.offset === offset);
        const active = selected === offset;
        const done = Boolean(day?.workouts.length && day.workouts.every(workout => workout.completed));
        return (
          <Pressable key={offset} accessibilityRole="tab"
            accessibilityLabel={translate(captions[offset]) + (day ? ", " + dateLabel(day.date, locale, {day: "numeric", month: "long"}) : "")}
            accessibilityState={{selected: active, disabled: !day}} onPress={() => onSelect(offset)} disabled={!day}
            style={styles.stop} testID={"rhythm-" + offset}>
            <Text style={[styles.day, active && styles.activeText]}><Copy text={captions[offset]}/></Text>
            <View style={[styles.dot, Boolean(day?.workouts.length) && styles.plannedDot, active && styles.activeDot]}>
              {done && <Check size={12} color={active ? F.ink : F.chalk} strokeWidth={2.5}/>}
            </View>
            <Text style={[styles.date, active && styles.activeText]}>
              {day ? dateLabel(day.date, locale, {day: "2-digit", month: "short"}) : "—"}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  timeline: {flexDirection: "row", position: "relative", marginHorizontal: -7},
  rail: {height: 1, backgroundColor: "#545A50", left: "16.66%", right: "16.66%", top: 35, position: "absolute"},
  stop: {flex: 1, minHeight: 72, alignItems: "center", paddingTop: 5, gap: 5},
  day: {...field.type, fontSize: 12, color: F.muted, letterSpacing: .4, lineHeight: 17},
  dot: {height: 17, width: 17, borderWidth: 1, borderColor: "#787E73", borderRadius: 9, backgroundColor: F.bg,
    alignItems: "center", justifyContent: "center"},
  plannedDot: {borderColor: F.chalk},
  activeDot: {backgroundColor: F.signal, borderColor: F.signal},
  date: {fontFamily: "Manrope", color: F.muted, fontSize: 12},
  activeText: {color: F.signal},
});
