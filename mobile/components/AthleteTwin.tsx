import {StyleSheet, View} from "react-native";
import Svg, {Circle, Path} from "react-native-svg";
import {F} from "./FieldKit";

export type TwinFocus = "strength" | "athleticism" | "recovery";
const points = {strength: [102, 79], athleticism: [112, 159], recovery: [134, 96]} as const;

export default function AthleteTwin({compact = false, light = false, focus = "athleticism"}: {
  compact?: boolean; light?: boolean; focus?: TwinFocus;
}) {
  const [x, y] = points[focus];
  const contour = light ? "#232721" : "#B9C0AB";
  const facet = light ? "#717667" : "#464D41";
  const grid = light ? "#B9BCAC" : "#393F35";
  const marker = light ? "#465821" : F.signal;
  return <View accessible={false} importantForAccessibility="no" style={compact ? s.compact : s.full}>
    <Svg width="100%" height="100%" viewBox="0 0 196 236">
      <Path d="M15 209H181M15 168H181M15 127H181M15 86H181M15 45H181M55 222V22M98 222V22M141 222V22"
        fill="none" stroke={grid} strokeWidth={.7} strokeDasharray="2 4"/>
      <Path d="M15 37V22H30M166 22H181V37M15 207V222H30M166 222H181V207" fill="none" stroke={grid} strokeWidth={1.2}/>
      <Path d="M153 27L167 28L175 38L169 57L157 65L144 55L143 43Z" fill={contour}/>
      <Path d="M135 55L153 63L158 76L145 91L131 106L108 132L86 135L72 121L81 96L111 69Z" fill={contour}/>
      <Path d="M135 55L143 70L119 83L93 111L84 131L72 121L81 96L111 69Z" fill={facet}/>
      <Path d="M109 73L118 85L97 114L65 119L44 106L49 96L70 102L89 85Z" fill={contour}/>
      <Path d="M147 68L164 82L174 77L181 66L190 69L186 83L168 102L145 95L138 85Z" fill={facet}/>
      <Path d="M88 124L107 126L137 130L149 146L141 163L117 178L110 207L99 217L90 216L96 199L98 174L120 148L84 144Z" fill={contour}/>
      <Path d="M74 118L99 134L84 155L62 171L51 197L35 209L18 207L19 201L33 195L45 165L60 145Z" fill={contour}/>
      <Path d="M81 133L92 143L64 169L53 177L61 154ZM110 131L137 130L149 146L139 158L135 143Z" fill={facet}/>
      <Path d="M144 43L157 50L170 39M119 83L134 96L108 132M62 171L48 177M118 176L105 180"
        fill="none" stroke={light ? "#C5C8B8" : "#131711"} strokeWidth={1.2}/>
      <Circle cx={x} cy={y} r={13} fill="none" stroke={marker} strokeWidth={1.2}/>
      <Circle cx={x} cy={y} r={5} fill={F.signal} stroke={marker} strokeWidth={1.5}/>
    </Svg>
  </View>;
}

const s = StyleSheet.create({
  full: {width: 245, height: 298, maxWidth: "100%"},
  compact: {width: "100%", height: 205},
});
