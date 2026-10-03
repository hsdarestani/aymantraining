import {SafeAreaView,ScrollView,StyleSheet,Text,View} from "react-native";

const pillars=[["STRENGTH",86],["ENDURANCE",74],["ATHLETICISM",79],["MOBILITY",72],["RECOVERY",68],["CONSISTENCY",91]] as const;

export default function Home(){
  return <SafeAreaView style={s.safe}>
    <ScrollView contentContainerStyle={s.container}>
      <Text style={s.brand}>BE <Text style={s.volt}>DIFFERENT</Text></Text>
      <Text style={s.eyebrow}>GOOD MORNING, AYMAN</Text>
      <Text style={s.title}>BUILD YOUR{"\n"}ATHLETE.</Text>

      <View style={s.scoreCard}>
        <Text style={s.eyebrow}>BE DIFFERENT SCORE</Text>
        <Text style={s.score}>81%</Text>
        <Text style={s.level}>BE DIFFERENT</Text>
      </View>

      <View style={s.card}>
        <Text style={s.eyebrow}>COACH RADAR</Text>
        <Text style={s.cardTitle}>Heute kein Maximaltraining.</Text>
        <Text style={s.copy}>Recovery 68. Fokus auf Mobility und leichtes Conditioning.</Text>
      </View>

      <View style={s.card}>
        <Text style={s.eyebrow}>TODAY'S WORKOUT</Text>
        <Text style={s.cardTitle}>Chest & Shoulders</Text>
        <Text style={s.copy}>7 Übungen · 52 Minuten · RPE Ziel 8</Text>
      </View>

      <Text style={s.section}>YOUR ATHLETE</Text>
      {pillars.map(([name,value])=><View style={s.pillar} key={name}>
        <Text style={s.pillarName}>{name}</Text>
        <View style={s.track}><View style={[s.fill,{width:value+"%"}]}/></View>
        <Text style={s.pillarValue}>{value}</Text>
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}

const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:"#0A0A0B"},
  container:{padding:22,gap:14},
  brand:{color:"#fff",fontSize:22,fontWeight:"900",marginBottom:18},
  volt:{color:"#D4FF00"},
  eyebrow:{color:"#9A9CA3",fontSize:10,letterSpacing:2,fontWeight:"800"},
  title:{color:"#fff",fontSize:48,lineHeight:43,letterSpacing:-2.5,fontWeight:"900",marginBottom:10},
  scoreCard:{backgroundColor:"#16171A",borderRadius:24,padding:28,alignItems:"center",marginVertical:10},
  score:{color:"#fff",fontSize:82,fontWeight:"900",letterSpacing:-6,marginTop:8},
  level:{color:"#D4FF00",fontSize:11,letterSpacing:2,fontWeight:"900"},
  card:{backgroundColor:"#16171A",borderRadius:18,padding:20},
  cardTitle:{color:"#fff",fontSize:24,fontWeight:"800",marginTop:6},
  copy:{color:"#9A9CA3",fontSize:14,lineHeight:21,marginTop:8},
  section:{color:"#fff",fontSize:22,fontWeight:"900",marginTop:18},
  pillar:{backgroundColor:"#16171A",borderRadius:14,padding:15},
  pillarName:{color:"#9A9CA3",fontSize:10,letterSpacing:1.5,fontWeight:"800"},
  track:{height:4,backgroundColor:"#23252A",marginVertical:10},
  fill:{height:4,backgroundColor:"#D4FF00"},
  pillarValue:{color:"#fff",fontSize:18,fontWeight:"800"}
});
