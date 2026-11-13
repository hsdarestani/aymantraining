import {useCallback, useState} from "react";
import {Platform, Pressable, StyleSheet, Text, View, useWindowDimensions} from "react-native";
import {router, useFocusEffect} from "expo-router";
import {Crosshair, Moon, Sunrise, Utensils, Watch} from "lucide-react-native";
import AthleteTwin, {type TwinFocus} from "../../components/AthleteTwin";
import {F, FieldLink, FieldMast, FieldPage, FieldState, dateLabel, field, useFieldLocale} from "../../components/FieldKit";
import {Copy} from "../../components/Locale";
import {api} from "../../lib/api";
import {levelLabel, type Dashboard} from "../../lib/field-data";
import {signOut} from "../../lib/logout";

const disciplines: {key: TwinFocus; label: string}[] = [
  {key: "strength", label: "Kraft"}, {key: "athleticism", label: "Athletik"}, {key: "recovery", label: "Erholung"},
];
const extraLinks = [
  ["Profil bearbeiten", "/profile"], ["Einstellungen & Datenschutz", "/settings"], ["Mitgliedschaft", "/membership"],
  ["Trainingskontext", "/context"], ["Smartwatch & Widgets", "/watch"], ["DIFFERENT AI", "/different-ai"],
  ["Termine & Videoanrufe", "/events"], ["Herausforderungen", "/community"], ["Freunde einladen", "/referral"], ["Wochencheck", "/checkin"],
] as const;

export default function Athlete() {
  const locale = useFieldLocale();
  const {width} = useWindowDimensions();
  const compact = width < 390;
  const narrow = width < 350;
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [focus, setFocus] = useState<TwinFocus>("athleticism");
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (isActive: () => boolean = () => true) => {
    try {
      const value = await api<Dashboard>("/api/mobile/dashboard");
      if (isActive()) { setDash(value); setError(""); }
    } catch {
      if (isActive()) setError("Dein Profil konnte nicht geladen werden.");
    } finally {
      if (isActive()) setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    let active = true;
    void load(() => active);
    return () => { active = false; };
  }, [load]));

  const score = dash?.pillarPreview?.[focus];
  const level = dash?.dailyProfile?.journey.confirmedLevel;
  const sleep = dash?.dailyProfile?.today.sleepHours;
  const protein = dash?.activity?.proteinG;
  const currentWearable = dash?.wearable;
  const metrics = [
    currentWearable?.steps == null ? null : currentWearable.steps.toLocaleString(locale) + (locale === "en-GB" ? " steps" : " Schritte"),
    currentWearable?.sleepMinutes == null ? null : (currentWearable.sleepMinutes / 60).toLocaleString(locale, {maximumFractionDigits: 1}) + " h",
  ].filter(Boolean).join(" · ");
  const routines = [
    {title: "BE AWAKE", detail: "Morgenroutine", href: "/awake", Icon: Sunrise},
    {title: "BE FUEL", detail: protein == null ? "Ernährung" : Math.round(protein) + " g Protein", href: "/fuel", Icon: Utensils},
    {title: "BE RESTED", detail: sleep == null ? "Schlaf & Erholung" : sleep.toLocaleString(locale) + (locale === "en-GB" ? " h sleep" : " h Schlaf"), href: "/lifestyle", Icon: Moon},
    {title: "BE FOCUSED", detail: "2 Min. Atemübung", href: "/focus", Icon: Crosshair},
  ] as const;
  return <FieldPage>
    <FieldMast section="ATHLET"/>
    <FieldState loading={loading} error={error} retry={() => void load()}/>
    {!loading && <>
      <View style={s.identity}>
        <View style={[s.pass, compact && s.passCompact]}>
          <View style={s.passCopy}>
            <Text style={s.darkLabel}><Copy text="DEIN PROFIL"/></Text>
            <Text accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.75}
              style={[s.name, compact && s.nameCompact]}>{dash?.user.name?.trim() || <Copy text="Athlet"/>}</Text>
            <Text style={s.level}><Copy text={level ? levelLabel(level) : "Einstufung offen"}/></Text>
            <View style={s.data}>
              <Text style={s.darkLabel}><Copy text={disciplines.find(item => item.key === focus)!.label.toUpperCase()}/></Text>
              <Text style={s.value}>{score == null ? "—" : Math.round(score)}{score != null && <Text style={s.unit}> / 100</Text>}</Text>
              {score == null && <Text style={s.caption}><Copy text={dash?.scoreDetailsLocked ? "Einzelwerte mit PRO" : "Noch kein Messwert"}/></Text>}
            </View>
          </View>
          <View style={[s.figure, compact && s.figureCompact, narrow && s.figureNarrow]}><AthleteTwin compact light focus={focus}/></View>
        </View>
        <View accessibilityRole="tablist" style={s.lenses}>
          {disciplines.map(item => <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{selected: focus === item.key}}
            onPress={() => setFocus(item.key)} style={[s.lens, focus === item.key && s.lensSelected]}>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}
              style={[s.lensLabel, narrow && s.lensLabelNarrow]}><Copy text={item.label}/></Text>
          </Pressable>)}
        </View>
      </View>
      <View style={s.twinLink}>
        <FieldLink label="Digital Twin öffnen" onPress={() => router.push("/digital-twin")}/>
        <Text style={s.figureCaption}><Copy text="Illustration"/></Text>
      </View>
      <View style={s.routines}>
        <Text accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72} style={field.heading}><Copy text="Deine Routinen"/></Text>
        {routines.map(({title, detail, href, Icon}, index) => <Pressable key={href} accessibilityRole="button"
          onPress={() => router.push(href)} style={({pressed}) => [s.routine, index === 1 && s.fuel, pressed && s.pressed]}>
          <Text style={[s.routineIndex, index === 1 && s.fuelMuted]}>0{index + 1}</Text>
          {compact ? <View style={s.routineStack}>
            <Text style={[s.routineTitle, index === 1 && s.fuelText]}>{title}</Text>
            <Text style={[s.routineSub, s.routineSubStack, index === 1 && s.fuelMuted]}><Copy text={detail}/></Text>
          </View> : <>
            <Text style={[s.routineTitle, index === 1 && s.fuelText]}>{title}</Text>
            <View style={s.routineDetail}>
              <Text style={[s.routineSub, index === 1 && s.fuelMuted]}><Copy text={detail}/></Text>
            </View>
          </>}
          <Icon size={19} color={index === 1 ? F.ink : F.muted} strokeWidth={1.7}/>
        </Pressable>)}
      </View>
      <Pressable accessibilityRole="button" onPress={() => router.push("/wearables")} style={({pressed}) => [s.device, pressed && s.pressed]}>
        <Watch size={25} color={F.signal} strokeWidth={1.6}/>
        <View style={s.deviceBody}>
          <Text style={field.type}><Copy text="WEARABLES"/></Text>
          <Text style={s.deviceTitle}>{Platform.OS === "ios" ? "Apple Health" : "Health Connect"}</Text>
          <Text style={field.sub}>{metrics || <Copy text="Noch keine Gerätedaten"/>}
            {metrics && currentWearable?.date ? " · " + dateLabel(currentWearable.date.slice(0, 10), locale, {day: "numeric", month: "short"}) : ""}
          </Text>
        </View>
        <Text style={s.manage}><Copy text="Verwalten"/></Text>
      </Pressable>
      <View style={s.account}>
        <Pressable accessibilityRole="button" accessibilityState={{expanded: more}} onPress={() => setMore(!more)} style={s.accountToggle}>
          <Text style={s.routineTitle}><Copy text="Konto & weitere Bereiche"/></Text>
          <Text style={s.routineTitle}>{more ? "−" : "+"}</Text>
        </Pressable>
        {more && <>
          {extraLinks.map(([label, href]) => <FieldLink key={href} label={label} onPress={() => router.push(href)}/>)}
          <FieldLink label="Abmelden" onPress={() => { void signOut().catch(() => setError("Abmelden fehlgeschlagen. Bitte erneut versuchen.")); }}/>
        </>}
      </View>
    </>}
  </FieldPage>;
}

const s = StyleSheet.create({
  identity: {backgroundColor: "#E4E5D6", paddingHorizontal: 20, paddingTop: 20},
  pass: {flexDirection: "row", alignItems: "center", minHeight: 210, gap: 4},
  passCompact: {minHeight: 194},
  passCopy: {flex: 1, minWidth: 0, gap: 6, zIndex: 1, paddingBottom: 10},
  darkLabel: {...field.type, color: F.darkMuted},
  name: {color: F.ink, fontFamily: "Archivo", fontSize: 36, lineHeight: 39, letterSpacing: -1.5},
  nameCompact: {fontSize: 30, lineHeight: 34, letterSpacing: -.9},
  level: {color: F.darkMuted, fontFamily: "ManropeSemiBold", fontSize: 13},
  figure: {width: "46%", maxWidth: 225, flexShrink: 0},
  figureCompact: {width: "41%"},
  figureNarrow: {width: "37%"},
  data: {marginTop: 12},
  value: {color: F.ink, fontFamily: "Archivo", fontSize: 42, lineHeight: 46, letterSpacing: -1.25},
  unit: {fontSize: 14, color: F.darkMuted, letterSpacing: 0},
  caption: {fontFamily: "Manrope", fontSize: 12, color: F.darkMuted},
  lenses: {flexDirection: "row", borderTopWidth: 1, borderColor: "#A6AA9C"},
  lens: {flex: 1, minHeight: 47, paddingHorizontal: 4, justifyContent: "center", alignItems: "center", borderBottomWidth: 3, borderColor: "transparent"},
  lensSelected: {borderBottomColor: "#536129", backgroundColor: "#D8DEBD"},
  lensLabel: {color: F.ink, fontFamily: "ManropeSemiBold", fontSize: 13, textAlign: "center"},
  lensLabelNarrow: {fontSize: 11},
  twinLink: {marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8},
  figureCaption: {...field.sub, textAlign: "right"},
  routines: {marginHorizontal: 20, marginTop: 16, gap: 1},
  routine: {minHeight: 64, flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 1, borderColor: F.line, paddingVertical: 10, paddingHorizontal: 3},
  routineStack: {flex: 1, minWidth: 0, gap: 3},
  routineSubStack: {textAlign: "left"},
  routineIndex: {color: F.muted, fontFamily: "ManropeSemiBold", fontSize: 10, paddingRight: 3},
  routineTitle: {color: F.chalk, fontFamily: "Archivo", fontSize: 17, flexShrink: 1},
  routineDetail: {flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8},
  routineSub: {...field.sub, fontSize: 12, textAlign: "right", flexShrink: 1},
  fuel: {backgroundColor: "#2B3121", borderBottomColor: "#575F40"},
  fuelText: {color: "#E2F4A4"},
  fuelMuted: {color: "#CDD3B8"},
  pressed: {opacity: .65},
  device: {marginHorizontal: 20, paddingVertical: 17, marginTop: 16, gap: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderColor: F.line},
  deviceBody: {flex: 1, minWidth: 0, gap: 2},
  deviceTitle: {...field.heading, fontSize: 18},
  manage: {color: F.chalk, fontFamily: "ManropeSemiBold", textDecorationLine: "underline", fontSize: 12},
  account: {marginHorizontal: 20, marginTop: 6},
  accountToggle: {minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8},
});
