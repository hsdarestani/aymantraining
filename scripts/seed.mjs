import { PrismaClient } from "@prisma/client";
const prisma=new PrismaClient();

const exercises=[
  {id:"BD-STR-001",nameDe:"Schrägbankdrücken mit Kurzhanteln",nameEn:"Incline Dumbbell Press",category:"Kraft",equipment:"Kurzhanteln, Schrägbank",primaryMuscles:"Brust",secondaryMuscles:"Schulter, Trizeps",level:2,coachCue1:"Schulterblätter hinten halten",coachCue2:"Kontrolliert absenken",coachCue3:"Explosiv nach oben",commonMistakes:["Schultern hochziehen","Zu steiler Bankwinkel"],trackingType:"WEIGHT_REPS",freeAccess:true},
  {id:"BD-STR-002",nameDe:"Liegestütz",nameEn:"Push Up",category:"Kraft",equipment:"Keine",primaryMuscles:"Brust, Trizeps",secondaryMuscles:"Schulter, Rumpf",level:1,coachCue1:"Körper bleibt eine Linie",coachCue2:"Brust kontrolliert absenken",coachCue3:"Boden aktiv wegdrücken",commonMistakes:["Hüfte hängt durch","Ellbogen zu weit außen"],trackingType:"REPS",freeAccess:true},
  {id:"BD-LEG-012",nameDe:"Bulgarische Kniebeuge",nameEn:"Bulgarian Split Squat",category:"Kraft",equipment:"Kurzhanteln, Bank",primaryMuscles:"Quadrizeps, Gesäß",secondaryMuscles:"Beinbeuger, Rumpf",level:2,coachCue1:"Knie über dem Fuß",coachCue2:"Oberkörper leicht vor",coachCue3:"Langsam runter, explosiv hoch",commonMistakes:["Knie fällt nach innen","Schritt zu kurz"],trackingType:"WEIGHT_REPS",freeAccess:true},
  {id:"BD-LEG-013",nameDe:"Kniebeuge",nameEn:"Bodyweight Squat",category:"Kraft",equipment:"Keine",primaryMuscles:"Beine, Gesäß",secondaryMuscles:"Rumpf",level:1,coachCue1:"Füße fest im Boden",coachCue2:"Knie folgen den Zehen",coachCue3:"Brust bleibt stabil",commonMistakes:["Knie fallen innen","Fersen heben ab"],trackingType:"REPS",freeAccess:true},
  {id:"BD-MOB-008",nameDe:"90 90 Hüftwechsel",nameEn:"90/90 Hip Switch",category:"Beweglichkeit",equipment:"Keine",primaryMuscles:"Hüfte",secondaryMuscles:"Rumpf",level:1,coachCue1:"Brust bleibt hoch",coachCue2:"Langsam rotieren",coachCue3:"Ohne Schwung arbeiten",commonMistakes:["Rücken rund","Zu schnell"],trackingType:"TIME",freeAccess:true},
  {id:"BD-MOB-009",nameDe:"Ausfallschritt mit Rotation",nameEn:"Worlds Greatest Stretch",category:"Beweglichkeit",equipment:"Keine",primaryMuscles:"Hüfte, Brustwirbelsäule",secondaryMuscles:"Beinbeuger",level:1,coachCue1:"Langer Ausfallschritt",coachCue2:"Ruhig rotieren",coachCue3:"Atmung fließen lassen",commonMistakes:["Bewegung erzwingen","Rücken einknicken"],trackingType:"TIME",freeAccess:true},
  {id:"BD-CORE-001",nameDe:"Unterarmstütz",nameEn:"Plank",category:"Rumpf",equipment:"Keine",primaryMuscles:"Rumpf",secondaryMuscles:"Schulter, Gesäß",level:1,coachCue1:"Rippen nach unten",coachCue2:"Gesäß aktiv anspannen",coachCue3:"Ruhig weiteratmen",commonMistakes:["Hohlkreuz","Hüfte zu hoch"],trackingType:"TIME",freeAccess:true},
  {id:"BD-CORE-002",nameDe:"Käferübung",nameEn:"Dead Bug",category:"Rumpf",equipment:"Keine",primaryMuscles:"Rumpf",secondaryMuscles:"Hüftbeuger",level:1,coachCue1:"Rücken bleibt am Boden",coachCue2:"Langsam diagonal strecken",coachCue3:"Ausatmen beim Strecken",commonMistakes:["Rücken hebt ab","Zu schnell"],trackingType:"REPS",freeAccess:true},
  {id:"BD-ATH-014",nameDe:"Kastensprung",nameEn:"Box Jump",category:"Explosivität",equipment:"Kasten",primaryMuscles:"Beine",secondaryMuscles:"Rumpf",level:2,coachCue1:"Explosiv abspringen",coachCue2:"Leise landen",coachCue3:"Knie stabil halten",commonMistakes:["Zu hohe Box","Instabile Landung"],trackingType:"REPS",freeAccess:false},
  {id:"BD-ATH-015",nameDe:"Sprunggelenksprünge",nameEn:"Pogo Jumps",category:"Explosivität",equipment:"Keine",primaryMuscles:"Wade, Fuß",secondaryMuscles:"Beine",level:2,coachCue1:"Kurz am Boden",coachCue2:"Sprunggelenk aktiv",coachCue3:"Körper bleibt aufrecht",commonMistakes:["Zu tief landen","Lange Bodenkontaktzeit"],trackingType:"REPS",freeAccess:false}
];
for(const item of exercises)await prisma.exercise.upsert({where:{id:item.id},update:{},create:item});

const plans=[
  {id:"starter-athlete-base",name:"ATHLETEN BASIS 01",description:"Kraft, Beweglichkeit und Rumpfstabilität für einen sauberen Einstieg.",proOnly:false,items:[
    ["BD-STR-001",0,0,4,"8 bis 10",8,120],["BD-CORE-001",0,1,3,"45 Sek.",7,45],
    ["BD-LEG-012",2,0,3,"8/Seite",8,120],["BD-CORE-002",2,1,3,"10/Seite",7,45],
    ["BD-MOB-008",4,0,3,"45 Sek.",6,45],["BD-MOB-009",4,1,2,"60 Sek.",5,30]
  ]},
  {id:"starter-bodyweight",name:"KÖRPERGEWICHT BASIS",description:"Einfacher Plan ohne Studio für konsequentes Training und Grundlagen.",proOnly:false,items:[
    ["BD-STR-002",0,0,4,"8 bis 15",8,75],["BD-LEG-013",0,1,4,"12 bis 20",8,75],["BD-CORE-001",0,2,3,"45 Sek.",7,45],
    ["BD-MOB-009",2,0,3,"60 Sek.",5,30],["BD-CORE-002",2,1,3,"10/Seite",7,45],
    ["BD-STR-002",4,0,3,"max sauber",8,75],["BD-LEG-013",4,1,4,"15",8,75]
  ]},
  {id:"starter-mobility",name:"BEWEGLICHKEIT NEUSTART",description:"Kurze Einheiten für Beweglichkeit und Rumpfstabilität an aktiven Erholungstagen.",proOnly:false,items:[
    ["BD-MOB-008",0,0,3,"60 Sek.",5,30],["BD-MOB-009",0,1,3,"60 Sek.",5,30],["BD-CORE-002",0,2,3,"8/Seite",6,30],
    ["BD-MOB-008",3,0,3,"60 Sek.",5,30],["BD-CORE-001",3,1,3,"30 Sek.",6,30]
  ]},
  {id:"pro-explosive-base",name:"EXPLOSIVER ATHLET",description:"Explosivität und Athletik für PRO mit Anpassung durch den Trainer.",proOnly:true,items:[
    ["BD-ATH-014",0,0,5,"3",7,120],["BD-LEG-012",0,1,4,"6/Seite",8,120],["BD-CORE-001",0,2,3,"45 Sek.",7,45],
    ["BD-ATH-015",2,0,5,"12",7,90],["BD-MOB-009",2,1,3,"60 Sek.",5,30]
  ]},
  {id:"pro-performance-mix",name:"LEISTUNGS MIX",description:"Kraft, Beweglichkeit und Explosivität in einer PRO Vorlage.",proOnly:true,items:[
    ["BD-STR-001",0,0,4,"6 bis 8",8,150],["BD-ATH-014",0,1,4,"3",7,120],
    ["BD-LEG-012",2,0,4,"8/Seite",8,120],["BD-CORE-002",2,1,3,"10/Seite",7,45],
    ["BD-MOB-008",4,0,3,"60 Sek.",5,30],["BD-ATH-015",4,1,4,"12",7,90]
  ]},
  {id:"pro-travel-hotel",name:"REISE UND HOTEL",description:"Kurze Einheiten ohne Geräte für Reisen und Hotelzimmer.",proOnly:true,items:[
    ["BD-STR-002",0,0,4,"10 bis 20",7,60],["BD-LEG-013",0,1,4,"15 bis 25",7,60],["BD-CORE-001",0,2,3,"45 Sek.",7,35],
    ["BD-MOB-008",2,0,3,"60 Sek.",5,30],["BD-MOB-009",2,1,3,"60 Sek.",5,30],["BD-CORE-002",2,2,3,"10 je Seite",6,30],
    ["BD-STR-002",4,0,5,"8 bis 15",8,60],["BD-LEG-013",4,1,5,"12 bis 20",8,60],["BD-CORE-001",4,2,3,"60 Sek.",7,35]
  ]}
];
for(const p of plans){
  const existing=await prisma.trainingPlan.findUnique({where:{id:p.id}});
  const plan=await prisma.trainingPlan.upsert({where:{id:p.id},update:{},create:{id:p.id,name:p.name,description:p.description,isTemplate:true,active:true,proOnly:p.proOnly}});
  if(existing)continue;
  for(const [exerciseId,dayIndex,orderIndex,targetSets,targetReps,targetRpe,restSeconds] of p.items)await prisma.trainingPlanItem.create({data:{planId:plan.id,exerciseId,dayIndex,orderIndex,targetSets,targetReps,targetRpe,restSeconds}});
}

const rules=[
  ["sleep_low_3_of_5","Schlaf kritisch",80,{sleepHours:{lt:6,count:3,window:5}},{severity:"warning",type:"moderate_training",title:"Schlaf unter deinem Ziel",action:"Training moderat halten und heute früher schlafen."}],
  ["hrv_rhr_recovery","Erholung niedrig",30,{hrvVsBaseline:{lt:-12},restingHrVsBaseline:{gt:5}},{severity:"critical",type:"recovery_day",title:"Erholungssignale niedrig",action:"Erholungstag prüfen. Trainer entscheidet final über Planänderungen."}],
  ["missed_workouts","Trainingseinheiten verpasst",70,{missedWorkouts:{gte:2,windowDays:7}},{severity:"info",type:"coach_alert",title:"Zwei Einheiten verpasst",action:"Wochenplan realistisch neu abstimmen."}],
  ["protein_low","Protein niedrig",100,{proteinGPerKg:{lt:1.6,count:4,window:7,goal:"Muskelaufbau"}},{severity:"info",type:"nutrition",title:"Protein Ziel mehrfach verfehlt",action:"Heute proteinreiche Mahlzeiten priorisieren."}],
  ["water_low","Wasser niedrig",110,{waterMl:{lt:2200,count:2,window:3}},{severity:"info",type:"hydration",title:"Trinkmenge niedrig",action:"Wasser über den Tag nachholen."}],
  ["acute_chronic_load","Trainingslast erhöht",40,{acuteChronicRatio:{gt:1.5}},{severity:"warning",type:"deload",title:"Trainingslast deutlich erhöht",action:"Belastung als Signal prüfen und Erholung priorisieren."}],
  ["personal_record","Neuer Rekord",10,{prDetected:{eq:true}},{severity:"good",type:"celebrate",title:"Neuer Rekord",action:"Du bist anders."}]
];
for(const [key,title,priority,conditions,action] of rules)await prisma.coachingRule.upsert({where:{key},update:{},create:{key,title,priority,conditions,action,enabled:true}});

const settings={
  score_weights:{strength:20,endurance:15,athleticism:15,mobility:10,recovery:15,fuel:10,consistency:15},
  score_formula:{sleepTargetHours:8,proteinTargetGPerKg:1.6,waterTargetMl:2500,checkinsPerWeek:5,performanceChangeMultiplier:125},
  radar_thresholds:{green:80,amber:60},
  notification_limits:{dailyMax:3},
  different_lines:[
    "Heute zählt die nächste saubere Entscheidung.",
    "Regeneration ist Teil deiner Entwicklung.",
    "Beständigkeit schlägt einen perfekten einzelnen Tag.",
    "Trainiere klar. Erhole dich bewusst.",
    "Baue den Athleten Schritt für Schritt."
  ]
};
for(const [key,value] of Object.entries(settings))await prisma.systemSetting.upsert({where:{key},update:{},create:{key,value}});

const flags={
  workout_tracking:[true,true,true],exercise_library_full:[false,true,true],unlimited_history:[false,true,true],wearable_advanced:[false,true,true],
  progress_photos_unlimited:[false,true,true],score_details:[false,true,true],coach_radar_full:[false,true,true],recovery_warnings:[false,true,true],
  sleep_advanced:[false,true,true],nutrition_fuel:[false,true,true],performance_tests_unlimited:[false,true,true],coach_chat:[false,true,true],
  video_feedback:[false,true,true],weekly_checkin:[false,true,true],weekly_report_full:[false,true,true],performance_timeline:[false,true,true],different_ai:[false,true,true],elite_video_calls:[false,false,true],
  digital_twin:[false,true,true],pro_challenges:[false,true,true]
};
for(const [key,[free,pro,elite]] of Object.entries(flags))await prisma.featureFlag.upsert({where:{key},update:{},create:{key,free,pro,elite}});

const now=new Date(),end=new Date(Date.now()+30*86400000);
for(const c of [
  {id:"challenge-30-different",title:"30 Tage anders",description:"Erfülle deinen Tagesplan. Training oder Erholung zählt.",proOnly:false},
  {id:"challenge-pushups",title:"100 Liegestütze",description:"Baue kontrolliert Volumen auf und erfasse deinen Fortschritt.",proOnly:false},
  {id:"challenge-recovery-pro",title:"Erholungsmeister",description:"PRO Herausforderung für sieben starke Erholungstage.",proOnly:true}
])await prisma.challenge.upsert({where:{id:c.id},update:{},create:{...c,startsAt:now,endsAt:end}});

console.log("BE DIFFERENT seed complete");
await prisma.$disconnect();
