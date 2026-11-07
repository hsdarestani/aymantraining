import type {ReactNode, Ref} from "react";
import {ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View} from "react-native";
import type {RefreshControlProps} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import Svg, {Path} from "react-native-svg";
import {Copy, LanguagePicker} from "./Locale";
import {useLocale} from "../lib/i18n/locale";

export const F = {
  bg: "#0D0F10",
  surface: "#181B1C",
  line: "#343838",
  chalk: "#EFEEE6",
  ink: "#151711",
  muted: "#AEB2AE",
  darkMuted: "#50544C",
  signal: "#D4FF00",
  red: "#FF756E",
};

export function FieldPage({children, scroll = true, scrollRef, refreshControl}: {
  children: ReactNode;
  scroll?: boolean;
  scrollRef?: Ref<ScrollView>;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safe}>
      {scroll ? (
        <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} refreshControl={refreshControl}
          keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.width}>{children}</View>
        </ScrollView>
      ) : <View style={[styles.width, styles.fill]}>{children}</View>}
    </SafeAreaView>
  );
}

export function FieldMast({section, language = false}: {section: string; language?: boolean}) {
  return (
    <View style={styles.mast}>
      <View style={styles.brand}>
        <Svg width={23} height={21} viewBox="0 0 23 21" accessible={false}>
          <Path d="M0 20L7 1H11L4 20ZM6 20L13 1H17L10 20ZM12 20L19 1H23L16 20Z" fill={F.signal}/>
        </Svg>
        <Text style={styles.wordmark}>BE DIFFERENT</Text>
      </View>
      {language ? <LanguagePicker inline/> : <Text style={field.type}><Copy text={section}/></Text>}
    </View>
  );
}

export function FieldAction({label, onPress, tone = "signal", disabled = false, testID}: {
  label: string; onPress: () => void; tone?: "signal" | "quiet" | "ink"; disabled?: boolean; testID?: string;
}) {
  const quiet = tone === "quiet";
  return (
    <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} testID={testID}
      android_ripple={{color: quiet || tone === "ink" ? "#FFFFFF24" : "#00000022"}}
      style={({pressed}) => [styles.action, quiet && styles.quiet, tone === "ink" && styles.ink, (pressed || disabled) && styles.pressed]}>
      <Text style={[styles.actionText, tone !== "signal" && styles.lightText]}><Copy text={label}/></Text>
    </Pressable>
  );
}

export function FieldState({loading, error, retry}: {loading?: boolean; error?: string | null; retry?: () => void}) {
  if (loading) return <View style={styles.state}><ActivityIndicator color={F.signal}/></View>;
  if (!error) return null;
  return (
    <View style={styles.error}>
      <Text accessibilityRole="alert" style={field.body}><Copy text={error}/></Text>
      {retry && <FieldAction label="Erneut laden" onPress={retry} tone="quiet"/>}
    </View>
  );
}

export function FieldLink({label, onPress}: {label: string; onPress: () => void}) {
  return <Pressable accessibilityRole="button" style={({pressed}) => [styles.link, pressed && styles.pressed]} onPress={onPress}>
    <Text style={styles.linkText}><Copy text={label}/></Text>
  </Pressable>;
}

export function useFieldLocale() {
  return useLocale() === "en" ? "en-GB" : "de-DE";
}

export function dateLabel(date: string, locale: string, options: Intl.DateTimeFormatOptions, zone?: string) {
  const calendar = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const value = new Date(calendar ? date + "T00:00:00Z" : date);
  if (!Number.isFinite(value.getTime())) return "—";
  return value.toLocaleDateString(locale, {...options, timeZone: calendar ? "UTC" : zone});
}

export const field = StyleSheet.create({
  type: {color: F.muted, fontFamily: "ManropeSemiBold", fontSize: 11, letterSpacing: 1.4},
  heading: {color: F.chalk, fontFamily: "Archivo", fontSize: 28, letterSpacing: -.75},
  body: {color: F.chalk, fontFamily: "Manrope", fontSize: 15, lineHeight: 22},
  sub: {color: F.muted, fontFamily: "Manrope", fontSize: 13, lineHeight: 20},
  group: {marginHorizontal: 20},
});

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: F.bg},
  width: {width: "100%", maxWidth: 640, alignSelf: "center"},
  fill: {flex: 1},
  scroll: {paddingBottom: 26},
  mast: {minHeight: 62, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: F.line,
    paddingHorizontal: 20, paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10},
  brand: {flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1},
  wordmark: {color: F.chalk, fontFamily: "Archivo", fontSize: 17, letterSpacing: -.65, flexShrink: 1},
  action: {minHeight: 50, paddingHorizontal: 16, paddingVertical: 11, backgroundColor: F.signal,
    justifyContent: "center", alignItems: "center", borderRadius: 3},
  quiet: {backgroundColor: "transparent", borderWidth: 1, borderColor: F.line},
  ink: {backgroundColor: F.ink},
  actionText: {color: F.ink, fontFamily: "ManropeSemiBold", fontSize: 15, textAlign: "center"},
  lightText: {color: F.chalk},
  pressed: {opacity: .68},
  state: {paddingVertical: 48, alignItems: "center"},
  error: {margin: 20, gap: 12, alignItems: "flex-start", borderLeftWidth: 2, borderColor: F.red, paddingLeft: 12},
  link: {alignSelf: "flex-start", minHeight: Platform.OS === "ios" ? 44 : 48, justifyContent: "center", paddingVertical: 8},
  linkText: {color: F.chalk, fontFamily: "ManropeSemiBold", fontSize: 14, textDecorationLine: "underline"},
});
