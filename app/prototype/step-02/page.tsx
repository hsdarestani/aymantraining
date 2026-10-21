"use client";

import {useState} from "react";
import "./prototype.css";

type Screen = "goals" | "assessment" | "placement" | "home" | "path" | "exercise" | "exam" | "coach" | "women" | "cycle" | "milestones" | "scope";
type Level = "READY" | "AWAKE" | "DIFFERENT" | "BE DIFFERENT" | "TRULY DIFFERENT";
type Moment = "recovery" | "thirty" | "chapter" | "level" | null;
type Sex = "female" | "male" | "diverse";

const levels: {name: Level; short: string; description: string}[] = [
  {name:"READY",short:"01",description:"Du startest gerade oder steigst wieder ein. Du baust Grundlagen auf und findest Schritt für Schritt in eine Routine."},
  {name:"AWAKE",short:"02",description:"Du hast erste Trainingserfahrung, kennst grundlegende Übungen und möchtest regelmäßig und strukturiert trainieren."},
  {name:"DIFFERENT",short:"03",description:"Du trainierst regelmäßig und beherrschst die Grundlagen. Jetzt arbeitest du gezielt an deinen ausgewählten Zielen."},
  {name:"BE DIFFERENT",short:"04",description:"Du trainierst fortgeschritten und strukturiert und möchtest anspruchsvollere Inhalte für deine Leistung nutzen."},
  {name:"TRULY DIFFERENT",short:"05",description:"Du bringst umfangreiche Erfahrung mit und verfeinerst deine Leistung durch besondere Herausforderungen."}
];
const goals = ["Fußball","Athletik","Muskelaufbau","Fettabbau","Calisthenics","Gesundheit"];
const chapters = [
  ["Bewegungsbasis und Technik","Stabilität und Belastung"],
  ["Struktur und Kontrolle","Kraft und Tempo"],
  ["Leistungsaufbau","Spezifische Athletik"],
  ["Fortgeschrittene Leistung","Komplexe Kombinationen"],
  ["Feinschliff","Dein höchstes Niveau"]
];
const nav: {id: Screen; title: string; section: string}[] = [
  {id:"goals",title:"Zielkombination",section:"EINSTIEG"},
  {id:"assessment",title:"Selbsteinschätzung",section:"EINSTIEG"},
  {id:"placement",title:"Einstieg bestätigen",section:"EINSTIEG"},
  {id:"home",title:"Mein heutiger Schritt",section:"COACHING"},
  {id:"path",title:"Mein Trainingsweg",section:"COACHING"},
  {id:"exercise",title:"Übung & FREE / PRO",section:"COACHING"},
  {id:"exam",title:"Kapiteltest",section:"COACHING"},
  {id:"coach",title:"Coach-Reaktion",section:"COACHING"},
  {id:"women",title:"Frauen-Dashboard",section:"PERSÖNLICH"},
  {id:"cycle",title:"Zyklus optional",section:"PERSÖNLICH"},
  {id:"milestones",title:"Erfolgsmomente",section:"PERSÖNLICH"},
  {id:"scope",title:"Umfang & Material",section:"PROJEKT"}
];

const noData = "Beispieldaten für die Demo, keine Messwerte oder Coach-Nachricht eines echten Nutzers.";
function Tag({children,kind="neutral"}:{children:React.ReactNode;kind?:"neutral"|"existing"|"new"|"optional"|"warning"}){
  return <span className={"bdp-tag bdp-tag-"+kind}>{children}</span>;
}
function Steps({title,step,detail}:{title:string;step:string;detail:string}){
  return <div className="bdp-eyeline"><span>{step}</span><span className="bdp-line"/><span>{title}</span><small>{detail}</small></div>;
}
function Action({children,onClick,secondary=false,disabled=false}:{children:React.ReactNode;onClick:()=>void;secondary?:boolean;disabled?:boolean}){
  return <button type="button" disabled={disabled} onClick={onClick} className={"bdp-button"+(secondary?" bdp-button-secondary":"")}>{children}<span aria-hidden="true">↗</span></button>;
}
export default function Step02Prototype(){
  const [screen,setScreen] = useState<Screen>("goals");
  const [chosen,setChosen] = useState<string[]>(["Fußball","Athletik","Muskelaufbau"]);
  const [sex,setSex] = useState<Sex>("male");
  const [womenView,setWomenView] = useState(false);
  const [womenAccent,setWomenAccent] = useState<"volt"|"coral"|"ice">("coral");
  const [selfLevel,setSelfLevel] = useState<Level>("READY");
  const [placementMode,setPlacementMode] = useState<"test"|"coach">("test");
  const [confirmed,setConfirmed] = useState(false);
  const [levelIndex,setLevelIndex] = useState(0);
  const [chapterIndex,setChapterIndex] = useState(0);
  const [lessonDone,setLessonDone] = useState(false);
  const [tier,setTier] = useState<"FREE"|"PRO">("FREE");
  const [pushups,setPushups] = useState(14);
  const [plank,setPlank] = useState(30);
  const [examOutcome,setExamOutcome] = useState<"idle"|"fail"|"pass">("idle");
  const [submittedVideo,setSubmittedVideo] = useState(false);
  const [coachReplied,setCoachReplied] = useState(false);
  const [cycleEnabled,setCycleEnabled] = useState(false);
  const [shareWithCoach,setShareWithCoach] = useState(false);
  const [cycleDay,setCycleDay] = useState(12);
  const [periodStart,setPeriodStart] = useState("");
  const [periodEnd,setPeriodEnd] = useState("");
  const [energy,setEnergy] = useState("mittel");
  const [symptom,setSymptom] = useState("keine");
  const [cycleAction,setCycleAction] = useState("Leichtere Einheit");
  const [moment,setMoment] = useState<Moment>(null);
  const [levelReveal,setLevelReveal] = useState<{from:Level;to:Level}>({from:"READY",to:"AWAKE"});
  const [quietMotion,setQuietMotion] = useState(false);
  const [soundOn,setSoundOn] = useState(false);
  const [recoveryDone,setRecoveryDone] = useState(false);

  const currentLevel = levels[levelIndex].name;
  const title = chapters[levelIndex][chapterIndex];
  const route = chosen.length ? chosen.join(" + ") : "Noch keine Ziele ausgewählt";
  const unlocked = confirmed;
  const accent = womenView && sex==="female" ? womenAccent : "volt";

  function chooseGoal(goal:string){
    setChosen(old=>old.includes(goal)?old.filter(x=>x!==goal):[...old,goal]);
  }
  function navigate(to:Screen){
    setScreen(to);
    setMoment(null);
  }
  function confirm(){
    // The coach/test approval itself is a demo action: a self-selected level never unlocks on selection.
    setConfirmed(true);
    setLevelIndex(levels.findIndex(item=>item.name===selfLevel));
    setChapterIndex(0);
    setLessonDone(false);
    setExamOutcome("idle");
    navigate("home");
  }
  function runExam(){
    if(!lessonDone)return;
    if(pushups>=20&&plank>=45){
      setExamOutcome("pass");
      setLessonDone(false);
      if(chapterIndex===1){
        if(levelIndex<levels.length-1){
          setLevelReveal({from:currentLevel,to:levels[levelIndex+1].name});
          setLevelIndex(levelIndex+1);
          setChapterIndex(0);
          setMoment("level");
        }else{
          setMoment("chapter");
        }
      }else{
        setChapterIndex(1);
        setMoment("chapter");
      }
      setScreen("path");
    }else{
      setExamOutcome("fail");
    }
  }
  function resetCycle(){
    setCycleEnabled(false);
    setShareWithCoach(false);
    setCycleDay(12);
    setPeriodStart("");
    setPeriodEnd("");
    setEnergy("mittel");
    setSymptom("keine");
    setCycleAction("Leichtere Einheit");
  }
  const chapterNumber = chapterIndex+1;
  const goalMatch = chosen.length===3&&chosen.includes("Fußball")&&chosen.includes("Athletik")&&chosen.includes("Muskelaufbau");

  return <main className={"bdp-root bdp-theme-"+accent}>
    <div className="bdp-ambient" aria-hidden="true"/>
    <header className="bdp-header">
      <div className="bdp-mark" aria-label="BE DIFFERENT"><span>BE</span><b>DIFFERENT<span className="bdp-dot">.</span></b></div>
      <div className="bdp-header-right"><Tag kind="warning">KLICKBARER PROTOTYP · NUR DEMO</Tag><button className="bdp-close" onClick={()=>navigate("scope")}>UMFANG ANSEHEN</button></div>
    </header>
    <div className="bdp-subheader"><span>ENTWICKLUNGSREISE / VORSCHAU 02</span><span>KEINE DATENBANKÄNDERUNGEN · KEINE ECHTEN FREISCHALTUNGEN</span></div>

    <div className="bdp-layout">
      <aside className="bdp-sidebar" aria-label="Prototype navigation">
        <div className="bdp-sidebar-label">PROTOTYP NAVIGIEREN</div>
        {nav.map((item,i)=><div key={item.id}>
          {(i===0||nav[i-1].section!==item.section)&&<div className="bdp-nav-section">{item.section}</div>}
          <button type="button" className={"bdp-nav-item"+(screen===item.id?" is-active":"")} onClick={()=>navigate(item.id)}>
            <span className="bdp-nav-num">{String(i+1).padStart(2,"0")}</span>
            <span>{item.title}</span>
            {screen===item.id&&<span aria-hidden="true" className="bdp-nav-active-dot"/>}
          </button>
        </div>)}
        <p className="bdp-side-foot">Die Navigation ist frei. Die eigentliche Kapitel-Freischaltung wird separat simuliert und kann nicht durch die Bildschirmnavigation umgangen werden.</p>
      </aside>

      <section className="bdp-workspace">
        <nav className="bdp-mobile-nav" aria-label="Prototype quick navigation">
          <select aria-label="Ansicht auswählen" value={screen} onChange={e=>navigate(e.target.value as Screen)}>
            {nav.map(item=><option value={item.id} key={item.id}>{item.title}</option>)}
          </select>
        </nav>
        <div className="bdp-status-row"><span><i className="bdp-status-dot"/> INTERAKTIVE DESIGNVORSCHAU</span><span>{confirmed?currentLevel+" · KAPITEL "+chapterNumber:"EINSTIEG UNBESTÄTIGT"}</span></div>

        {screen==="goals"&&<div className="bdp-screen">
          <Steps title="DEIN START" step="01 / 03" detail="Onboarding"/>
          <h1>Nicht drei Pläne.<br/><em>Dein Weg.</em></h1>
          <p className="bdp-lead">Wähle alle Ziele, die zu dir passen. Daraus entsteht ein zusammenhängender Trainingsweg. Inhalte, Trainingstests und Kombinationen werden vom Coach erstellt.</p>
          <div className="bdp-field-label">WAS MÖCHTEST DU ERREICHEN? <span>MEHRFACHAUSWAHL</span></div>
          <div className="bdp-goal-grid">{goals.map(goal=><button type="button" aria-pressed={chosen.includes(goal)} onClick={()=>chooseGoal(goal)} key={goal} className={"bdp-goal"+(chosen.includes(goal)?" selected":"")}>
            <span>{goal}</span><b>{chosen.includes(goal)?"✓":"+"}</b>
          </button>)}</div>
          <div className="bdp-panel bdp-combination"><Tag kind="new">NEUE ZIELKOMBINATION</Tag><small>DEIN ZUSAMMENGESTELLTER WEG</small><h3>{route}</h3><p>{goalMatch?"Demo-Vorlage: Fußball-Fitness + funktioneller Kraftaufbau + Athletik. Ein Weg, ein Kalender, aufeinander abgestimmte Kapitel.":"Eine passende, vom Coach freigegebene Kombination wird für diese Auswahl benötigt. Ohne hinterlegte Vorlage zeigt die App keine erfundene Empfehlung."}</p></div>
          <div className="bdp-field-label">PERSÖNLICHER ZUGANG</div>
          <div className="bdp-choice-row">{([["male","Männlich"],["female","Weiblich"],["diverse","Divers"]] as const).map(([id,label])=><button key={id} aria-pressed={sex===id} onClick={()=>{setSex(id);if(id!=="female")setWomenView(false)}} className={"bdp-segment"+(sex===id?" active":"")}>{label}</button>)}</div>
          {sex==="female"&&<div className="bdp-info bdp-info-positive">Optional: Das Frauen-Dashboard kann als Startansicht gewählt und jederzeit gewechselt werden. Alle Sportarten bleiben verfügbar. <button onClick={()=>{setWomenView(true);navigate("women")}}>FRAUENANSICHT VORSCHAUEN ↗</button></div>}
          <div className="bdp-actions"><Action disabled={!chosen.length} onClick={()=>navigate("assessment")}>WEITER ZUR SELBSTEINSCHÄTZUNG</Action></div>
        </div>}

        {screen==="assessment"&&<div className="bdp-screen">
          <Steps step="02 / 03" title="LEVEL AUSWÄHLEN" detail="Selbsteinschätzung"/>
          <h1>Wo stehst <em>du?</em></h1><p className="bdp-lead">Deine Erfahrung gilt immer für den ausgewählten Trainingsweg. Erfahrung im Muskelaufbau bedeutet nicht automatisch dasselbe Level im Sprinttraining.</p>
          <div className="bdp-route-mini">AKTIVER WEG <strong>{route}</strong></div>
          <div className="bdp-level-list">{levels.map((entry,i)=><button key={entry.name} onClick={()=>setSelfLevel(entry.name)} aria-pressed={selfLevel===entry.name} className={"bdp-level-select"+(selfLevel===entry.name?" selected":"")}><span className="bdp-level-number">{entry.short}</span><span><b>{entry.name}</b><small>{entry.description}</small></span><span className="bdp-level-radio">{selfLevel===entry.name?"✓":""}</span></button>)}</div>
          <div className="bdp-info"><b>Wichtig:</b> Die Selbsteinschätzung allein schaltet keine Inhalte frei. Für den tatsächlichen Einstieg ist ein Einstufungstest oder eine Coach-Freigabe nötig.</div>
          <div className="bdp-actions"><Action onClick={()=>navigate("placement")}>EINSTIEG PRÜFEN</Action><Action secondary onClick={()=>navigate("goals")}>ZURÜCK</Action></div>
        </div>}

        {screen==="placement"&&<div className="bdp-screen">
          <Steps step="03 / 03" title="EINSTIEGSLEVEL" detail="Sicherung"/>
          <h1>Dein Einstieg.<br/><em>Bestätigt.</em></h1>
          <p className="bdp-lead">Du hast <strong>{selfLevel}</strong> gewählt. Das ist bislang nur deine eigene Einschätzung und gewährt keinen Zugang zu gesperrten Trainingsinhalten.</p>
          <div className="bdp-panel"><div className="bdp-card-top"><Tag kind="new">LEVEL-GATE</Tag><strong>{confirmed?"BESTÄTIGT":"AUSSTEHEND"}</strong></div><h3>Wie bestätigen wir deinen Start?</h3>
            <div className="bdp-choice-row">
              <button className={"bdp-segment"+(placementMode==="test"?" active":"")} onClick={()=>setPlacementMode("test")}>EINSTUFUNGSTEST</button>
              <button className={"bdp-segment"+(placementMode==="coach"?" active":"")} onClick={()=>setPlacementMode("coach")}>COACH-FREIGABE</button>
            </div>
            <p>{placementMode==="test"?"Die Übungen und Grenzwerte legt der Coach pro Trainingsweg fest. Die folgende Freigabe simuliert einen erfolgreich geprüften Einstufungstest.":"In der echten App prüft und bestätigt der zuständige Coach den Einstieg. Hier ist die Bestätigung nur eine Simulation."}</p>
            <div className="bdp-gate-preview"><span>SELBSTEINSCHÄTZUNG <b>{selfLevel}</b></span><span>AKTUELL FREIGESCHALTET <b>{confirmed?currentLevel:"KEIN LEVEL"}</b></span></div>
          </div>
          <div className="bdp-actions"><Action onClick={confirm}>{placementMode==="test"?"DEMO-TEST BESTEHEN UND START BESTÄTIGEN":"DEMO-COACH-FREIGABE ERTEILEN"}</Action><Action secondary onClick={()=>navigate("assessment")}>EINSTUFUNG ÄNDERN</Action></div>
          <p className="bdp-fine">Demo-Aktion ohne echte Bewertung, Identitätsprüfung oder Speicherung. Die konkreten Prüfregeln müssen vor der produktiven Umsetzung fachlich freigegeben werden.</p>
        </div>}

        {screen==="home"&&<div className="bdp-screen">
          <Steps step="DEIN TAG" title={womenView&&sex==="female"?"FRAUEN-DASHBOARD":"MEIN DASHBOARD"} detail="Tagesführung"/>
          <h1>Ein Schritt.<br/><em>Heute.</em></h1>
          <div className="bdp-panel bdp-day-hero"><Tag kind="existing">VORHANDENE COACHING-GRUNDLAGE</Tag><p className="bdp-day-overline">DEMO-COACH-HINWEIS / FREIGEGEBENER BEISPIELPLAN</p><h2>Heute ist Regeneration eingeplant.</h2><p>Dein Demo-Plan enthält eine Erholungseinheit. Wähle die passende Routine. Dein nächster Trainingsabschnitt folgt anschließend.</p>
            <div className="bdp-day-actions"><Action onClick={()=>{setRecoveryDone(true);setMoment("recovery")}}>REGENERATION DOKUMENTIEREN</Action><Action secondary onClick={()=>navigate("path")}>TRAININGSWEG ANSEHEN</Action></div>
            {recoveryDone&&<div className="bdp-success-line">✓ Der Demo-Regenerationstag wurde für diese Vorschau markiert.</div>}
          </div>
          <div className="bdp-metrics"><div><small>ENTWICKLUNGS-SCORE</small><strong>35 <em>/ 100</em></strong><span>Langfristiges Profil · DEMO</span></div><div><small>HEUTIGER ZUSTAND</small><strong>68 <em>/ 100</em></strong><span>Separates Tagesbeispiel</span></div><div><small>PLAN HEUTE</small><strong>ERHOLUNG</strong><span>Coach-geplanter Tag</span></div></div>
          <div className="bdp-panel bdp-inline"><div><Tag kind="new">NÄCHSTER SCHRITT</Tag><h3>{confirmed?currentLevel+" · "+title:"Einstiegslevel bestätigen"}</h3><p>{confirmed?"Arbeite dein aktuelles Kapitel durch. Danach erwartet dich ein passender Test.":"Bestätige zuerst dein gewähltes Einstiegslevel. Erst dann werden Kapitel freigeschaltet."}</p></div><Action onClick={()=>navigate(confirmed?"path":"placement")}>WEITER</Action></div>
          <div className="bdp-info">Fehlende Gesundheitsdaten werden in der produktiven Version als fehlend angezeigt. Die Zahlen oben sind ausdrücklich Beispielwerte und werden hier nicht aus Nutzerdaten berechnet.</div>
        </div>}

        {screen==="path"&&<div className="bdp-screen">
          <Steps step="DEINE REISE" title="TRAININGSWEG" detail="Freischaltung"/>
          <h1>Dein Fortschritt.<br/><em>Verdient.</em></h1><p className="bdp-lead">Du siehst den ganzen Weg. Nutzbar ist nur, was durch bestätigten Einstieg und bestandene Kapiteltests wirklich freigeschaltet wurde.</p>
          <div className="bdp-route-mini">ZIELKOMBINATION <strong>{route}</strong></div>
          <div className="bdp-timeline">{levels.map((level,i)=>{
            const available=unlocked&&i<=levelIndex;
            const isCurrent=available&&i===levelIndex;
            return <div className={"bdp-timeline-row"+(isCurrent?" current":"")} key={level.name}><div className="bdp-track-index">{available?"✓":"○"}</div><div className="bdp-track-body"><div className="bdp-track-title"><strong>{level.name}</strong><span>{isCurrent?"AKTUELL":available?"BESTÄTIGTER EINSTIEG":"GESPERRT"}</span></div>
            {isCurrent?<><h3>{title}</h3><p>Kapitel {chapterNumber} von 2 · Beispielcurriculum des Coaches</p><div className="bdp-chapter-progress"><span style={{width:lessonDone?"80%":"24%"}}/></div><div className="bdp-track-actions"><Action onClick={()=>navigate("exercise")}>KAPITEL ÖFFNEN</Action><Action secondary onClick={()=>navigate("exam")}>ABSCHLUSSTEST</Action></div></>:<p>{available?"Dieser Einstieg wurde für die Demo bestätigt.":"Zwei Trainingskapitel mit Coach-Inhalten und passenden Abschlussprüfungen warten auf dich."}</p>}
            </div></div>;
          })}</div>
          {!confirmed&&<div className="bdp-info bdp-info-warning">Dein Einstieg ist noch nicht bestätigt. Die Kapitel bleiben gesperrt. <button onClick={()=>navigate("placement")}>EINSTIEG BESTÄTIGEN ↗</button></div>}
          {confirmed&&<div className="bdp-info">Kapitelabschlüsse und Level-Aufstiege werden ausschließlich durch Prüfentscheidungen freigeschaltet. Der Tages-Score und ein PRO-Abo ändern daran nichts.</div>}
          {examOutcome==="pass"&&<div className="bdp-success-line">✓ Demo-Test bestanden. Der nächste Trainingsabschnitt ist jetzt freigeschaltet.</div>}
        </div>}

        {screen==="exercise"&&<div className="bdp-screen">
          <Steps step="DEIN TRAINING" title="TECHNIK LERNEN" detail="Medien"/>
          <h1>Weniger suchen.<br/><em>Besser trainieren.</em></h1><p className="bdp-lead">Gleiche Trainingsqualität, gleicher Weg. In PRO kommen persönliche 8–12 Sekunden Coach-Videos hinzu.</p>
          <div className="bdp-tier-control"><span>DEMO-ABO</span><button aria-pressed={tier==="FREE"} className={tier==="FREE"?"active":""} onClick={()=>setTier("FREE")}>FREE</button><button aria-pressed={tier==="PRO"} className={tier==="PRO"?"active":""} onClick={()=>setTier("PRO")}>PRO</button></div>
          {!confirmed?<div className="bdp-locked"><b>INHALT GESPERRT</b><p>Der Inhalt wird erst nach bestätigtem Einstieg freigeschaltet. PRO kann diese Bedingung nicht überspringen.</p><Action onClick={()=>navigate("placement")}>EINSTIEG BESTÄTIGEN</Action></div>:<div className="bdp-panel">
            <div className="bdp-card-top"><Tag kind="existing">ÜBUNGSKARTE · NEU ARRANGIERT</Tag><strong>{currentLevel} · {chapterNumber}/2</strong></div>
            <h2>Bulgarian Split Squat</h2><p className="bdp-subline">Kraft · Beine · Technikfokus</p>
            <div className="bdp-frames">{["START","MITTE","ENDE"].map((label,i)=><div className="bdp-exercise-frame" key={label}><div aria-hidden="true" className={"bdp-athlete-shape bdp-pose-"+i}><span/><i/><b/></div><small>{label}</small></div>)}</div>
            <p className="bdp-fine">{sex==="female"&&womenView?"Schematische Trainerinnen-Platzhalter in FREE und PRO.":"Schematische Trainer-Platzhalter in FREE und PRO."} Echte Aufnahmen müssen vor Veröffentlichung hochgeladen werden.</p>
            <div className="bdp-instructions"><h3>SO FÜHRST DU DIE ÜBUNG AUS</h3><p>Vorderes Knie bleibt kontrolliert über dem Fuß. Oberkörper leicht nach vorn neigen. Langsam absenken, stabil wieder aufrichten.</p>{coachReplied&&<div className="bdp-personal-tip"><b>NEUER HINWEIS VON DEINEM COACH</b><p>Halte das Becken gerade und kontrolliere die Knieachse. Dieser Hinweis stammt aus dem simulierten Technikfeedback.</p></div>}</div>
            {tier==="PRO"?<div className="bdp-video-preview"><Tag kind="new">PRO · 8–12 SEKUNDEN</Tag><div className="bdp-play">▶</div><strong>{sex==="female"&&womenView?"ERKLÄRVIDEO DER TRAINERIN":"DEIN COACH ZEIGT DIE TECHNIK"}</strong><p>Video-Position im Prototyp. Echte Traineraufnahme ist noch nicht hinterlegt.</p></div>:<div className="bdp-video-locked"><span>▶</span><div><b>COACH-VIDEO IN PRO</b><p>Mit FREE bleiben die Bilder und sämtliche Anleitungen für das freigeschaltete Kapitel nutzbar.</p></div></div>}
            <div className="bdp-actions"><Action onClick={()=>{setLessonDone(true);navigate("path")}}>TRAININGSABSCHNITT ABSCHLIESSEN</Action><Action secondary onClick={()=>navigate("coach")}>TECHNIKFEEDBACK ANSEHEN</Action></div>
          </div>}
        </div>}

        {screen==="exam"&&<div className="bdp-screen">
          <Steps step="ABSCHLUSS" title="DEIN KAPITELTEST" detail="Prüfung"/>
          <h1>Ein Level.<br/><em>Kein Shortcut.</em></h1><p className="bdp-lead">Die folgenden Testwerte sind nur Demo-Kriterien, keine fachlich freigegebenen Standards. Im echten Produkt werden sie je Zielkombination, Kapitel und Level vom Coach definiert.</p>
          {!confirmed?<div className="bdp-locked"><b>TEST GESPERRT</b><p>Bestätige zuerst dein Einstiegslevel.</p><Action onClick={()=>navigate("placement")}>ZUR BESTÄTIGUNG</Action></div>:<div className="bdp-panel">
            <div className="bdp-card-top"><Tag kind="new">PFLICHTTEST IN FREE UND PRO</Tag><strong>{currentLevel} · KAPITEL {chapterNumber}</strong></div><h2>Teste deinen Fortschritt.</h2>
            <div className="bdp-test-grid"><label>Saubere Liegestütze <small>DEMO-ZIEL: MINDESTENS 20 WDH.</small><input type="number" value={pushups} min={0} max={500} onChange={e=>setPushups(Number(e.target.value))}/></label><label>Unterarmstütz <small>DEMO-ZIEL: MINDESTENS 45 SEK.</small><input type="number" value={plank} min={0} max={3600} onChange={e=>setPlank(Number(e.target.value))}/></label></div>
            {!lessonDone&&<div className="bdp-info bdp-info-warning">Voraussetzung fehlt: Schließe zuerst den Trainingsabschnitt ab. <button onClick={()=>navigate("exercise")}>ÜBUNG ÖFFNEN ↗</button></div>}
            {examOutcome==="fail"&&<div className="bdp-fail"><b>NOCH NICHT BESTANDEN</b><p>{pushups<20?"Arbeite weiter an kontrollierten Liegestützen. ":""}{plank<45?"Stärke deine Rumpfstabilität für den Unterarmstütz. ":""}Deine bereits erarbeiteten Inhalte bleiben verfügbar.</p><small>DEMO: NÄCHSTER TEST NACH 3 WEITEREN ÜBUNGSEINHEITEN</small><button onClick={()=>{setPushups(24);setPlank(50);setExamOutcome("idle")}}>VERBESSERTE DEMO-WERTE EINSETZEN ↗</button></div>}
            <div className="bdp-actions"><Action disabled={!lessonDone} onClick={runExam}>TEST PRÜFEN UND ERGEBNIS ANZEIGEN</Action><Action secondary onClick={()=>navigate("path")}>WEG ANSEHEN</Action></div>
            <p className="bdp-fine">Dies ist ein interaktiver Prototyp. Es werden keine echten Tests gespeichert oder fachlich ausgewertet.</p>
          </div>}
        </div>}

        {screen==="coach"&&<div className="bdp-screen">
          <Steps step="PERSÖNLICH" title="COACH-FEEDBACK" detail="Der Mensch im System"/>
          <h1>Ein Coach.<br/><em>Der mitdenkt.</em></h1><p className="bdp-lead">Vom Training zum Feedback und zurück in die nächste passende Einheit. Nicht nur eine Nachricht, die im Chat verschwindet.</p>
          <div className="bdp-panel"><div className="bdp-card-top"><Tag kind="existing">TECHNIKVIDEO & CHAT ALS BASIS</Tag><Tag kind="new">KONTEXT IM NÄCHSTEN TRAINING</Tag></div>
            <div className="bdp-chat">
              <div className="bdp-chat-message bdp-chat-system"><small>DEMO / NUTZER</small><p>Mein Bulgarian Split Squat fühlt sich noch instabil an.</p></div>
              {submittedVideo&&<div className="bdp-chat-message bdp-chat-system"><small>SIMULIERTER VIDEO-UPLOAD</small><p>Technikvideo · 00:12 · Keine Datei übertragen</p></div>}
              {coachReplied&&<div className="bdp-chat-message bdp-chat-coach"><small>SIMULIERTE COACH-ANTWORT</small><p>Halte das Becken gerade und kontrolliere die Knieachse. Achte beim nächsten Training darauf.</p></div>}
            </div>
            <div className="bdp-actions">{!submittedVideo?<Action onClick={()=>setSubmittedVideo(true)}>TECHNIKVIDEO SIMULIEREN</Action>:!coachReplied?<Action onClick={()=>setCoachReplied(true)}>COACH-ANTWORT SIMULIEREN</Action>:<Action onClick={()=>navigate("exercise")}>HINWEIS IN ÜBUNG ANSEHEN</Action>}</div>
          </div>
          <div className="bdp-panel bdp-signature"><Tag kind="optional">SIGNATURE-IDEE · ZUSATZAUFWAND</Tag><h3>Vom Coach geführtes Workout</h3><p>Eine optional aufgenommene Stimme führt durch Aufwärmen, Sätze und Pausen. Das ist ein separates Konzept, noch kein aktivierter Player oder echter Sprachclip.</p></div>
        </div>}

        {screen==="women"&&<div className="bdp-screen">
          <Steps step="GLEICHWERTIG" title="FRAUEN-DASHBOARD" detail="Wählbar und wechselbar"/>
          <h1>Deine Ziele.<br/><em>Dein Einstieg.</em></h1><p className="bdp-lead">Ein persönlicher Frauenbereich, aber dieselbe BE DIFFERENT Welt und derselbe Trainingsweg. Kein Sport und kein Level wird aufgrund des Geschlechts ausgeschlossen.</p>
          <div className="bdp-panel"><div className="bdp-card-top"><Tag kind="new">ZUSÄTZLICHE STARTANSICHT</Tag><span>OPT-IN</span></div>
            <div className="bdp-choice-row"><button className={"bdp-segment"+(womenView?" active":"")} onClick={()=>{setSex("female");setWomenView(true)}}>FRAUEN-DASHBOARD</button><button className={"bdp-segment"+(!womenView?" active":"")} onClick={()=>setWomenView(false)}>ALLGEMEINES DASHBOARD</button></div>
            <p>Diese Einstellung wird für die Demo nur im Browserzustand gehalten. Ein späterer Wechsel ist hier jederzeit möglich.</p>
            <div className="bdp-field-label">OPTIONALE AKZENTFARBE</div><div className="bdp-swatches">{([["coral","KORALLE"],["ice","EISBLAU"],["volt","BD VOLT"]] as const).map(([value,label])=><button key={value} onClick={()=>setWomenAccent(value)} aria-pressed={womenAccent===value} className={"bdp-swatch bdp-swatch-"+value+(womenAccent===value?" chosen":"")}>{label}</button>)}</div>
          </div>
          <div className="bdp-women-grid"><div className="bdp-panel"><small>MEIN HEUTIGER FOKUS</small><h2>Stark in deinem Tempo.</h2><p>Heute zeigt die App deinen freigegebenen Plan, deinen Fortschritt und den nächsten sinnvollen Schritt.</p><Action onClick={()=>navigate("home")}>ZUR STARTSEITE</Action></div><div className="bdp-panel"><small>GEMEINSAMER ENTWICKLUNGSWEG</small><h2>{route}</h2><p>Alle ausgewählten Ziele werden im gleichen Weg kombiniert. Technikvideos können von der Trainerin stammen.</p><Action secondary onClick={()=>navigate("exercise")}>ÜBUNGSKARTE ANSEHEN</Action></div></div>
          <div className="bdp-panel bdp-inline"><div><Tag kind="optional">ZUSÄTZLICH · KEINE PFLICHT</Tag><h3>Zyklus & Befinden</h3><p>Ein eigener privater Kalender kann freiwillig aktiviert werden. Ohne diese Daten bleibt der gesamte Frauenbereich nutzbar.</p></div><Action secondary onClick={()=>navigate("cycle")}>OPTIONALES MODUL</Action></div>
        </div>}

        {screen==="cycle"&&<div className="bdp-screen">
          <Steps step="FREIWILLIG" title="ZYKLUS & BEFINDEN" detail="Getrenntes Modul"/>
          <h1>Dein Körper.<br/><em>Deine Entscheidung.</em></h1><p className="bdp-lead">Diese Demo zeigt die Datenschutz- und Wahlmöglichkeiten. Es erfolgt keine medizinische Bewertung und es werden keine Zyklusdaten an einen Server gesendet.</p>
          <div className="bdp-panel"><div className="bdp-card-top"><Tag kind="optional">SPÄTERER AUSBAU · GESONDERT FREIZUGEBEN</Tag><b>{cycleEnabled?"DEMO EIN":"DEMO AUS"}</b></div>
            <label className="bdp-check"><input type="checkbox" checked={cycleEnabled} onChange={e=>{if(e.target.checked){setCycleEnabled(true)}else resetCycle()}}/><span>Ich möchte freiwillig Zyklusinformationen in diesem Prototyp eingeben. Die Angaben bleiben ausschließlich im lokalen, temporären Demo-Zustand.</span></label>
            {cycleEnabled&&<><div className="bdp-test-grid"><label>Beginn der Periode <input type="date" value={periodStart} onChange={e=>setPeriodStart(e.target.value)}/></label><label>Ende der Periode <input type="date" min={periodStart||undefined} value={periodEnd} onChange={e=>setPeriodEnd(e.target.value)}/></label></div><div className="bdp-calendar-header"><h3>Beispielkalender</h3><small>AKTIVER DEMOTAG: {cycleDay}</small></div><div className="bdp-calendar">{Array.from({length:28},(_,i)=><button key={i} className={cycleDay===i+1?"selected":""} onClick={()=>setCycleDay(i+1)}>{i+1}</button>)}</div>
              <div className="bdp-test-grid"><label>Energie <select value={energy} onChange={e=>setEnergy(e.target.value)}><option value="niedrig">Niedrig</option><option value="mittel">Mittel</option><option value="hoch">Hoch</option></select></label><label>Befinden <select value={symptom} onChange={e=>setSymptom(e.target.value)}><option value="keine">Keine Beschwerden angegeben</option><option value="krämpfe">Krämpfe</option><option value="müdigkeit">Müdigkeit</option><option value="andere">Anderes</option></select></label></div>
              <div className="bdp-field-label">WAS MÖCHTEST DU HEUTE MACHEN?</div><div className="bdp-choice-row">{["Geplantes Training","Leichtere Einheit","Erholung"].map(item=><button key={item} aria-pressed={cycleAction===item} className={"bdp-segment"+(cycleAction===item?" active":"")} onClick={()=>setCycleAction(item)}>{item}</button>)}</div>
              <div className="bdp-info">Deine Auswahl: <b>{cycleAction}</b>. Die App darf Training nicht automatisch allein wegen eines Kalendertages reduzieren. Schätzungen sind kein Verhütungsinstrument.</div>
              <label className="bdp-check"><input type="checkbox" checked={shareWithCoach} onChange={e=>setShareWithCoach(e.target.checked)}/><span>Diese Demo-Angaben ausdrücklich mit meinem Coach teilen (nur Simulation, keine Übertragung).</span></label>
              <div className="bdp-actions"><Action secondary onClick={resetCycle}>EINTRÄGE LÖSCHEN UND MODUL DEAKTIVIEREN</Action></div>
            </>}
          </div><p className="bdp-fine">Produktiv wären Periodenbeginn/-ende, Historie, Löschung/Export, gesonderte Einwilligung, Verschlüsselung, transparente Vorhersage und fachliche Prüfung zusätzlich erforderlich. Zyklusangaben sind nie Level-Voraussetzung.</p>
        </div>}

        {screen==="milestones"&&<div className="bdp-screen">
          <Steps step="DEIN EINSATZ" title="MOMENTE DES ERFOLGS" detail="Emotional & persönlich"/>
          <h1>Wir sehen<br/><em>deinen Fortschritt.</em></h1><p className="bdp-lead">Drei bewusst unterschiedliche Intensitäten. Die Vorschauen sind interaktiv, überspringbar und enthalten keine echten Coach-Aufnahmen.</p>
          <div className="bdp-milestone-grid">
            <button onClick={()=>setMoment("recovery")}><Tag kind="existing">KLEINER MOMENT</Tag><strong>✓</strong><h3>Regeneration geschafft</h3><p>Deine geplante Erholung zählt. Eine ruhige Bestätigung ohne Unterbrechung.</p><span>BEISPIEL ÖFFNEN ↗</span></button>
            <button onClick={()=>setMoment("thirty")}><Tag kind="new">GROSSER MOMENT</Tag><strong>30</strong><h3>30 Tage drangeblieben</h3><p>Sportliche Inszenierung mit freigestelltem Coach-Clip-Platzhalter.</p><span>ANIMATION ÖFFNEN ↗</span></button>
            <button onClick={()=>{setLevelReveal({from:"READY",to:"AWAKE"});setMoment("level")}}><Tag kind="new">LEVELAUFSTIEG</Tag><strong>02</strong><h3>READY → AWAKE</h3><p>Das neue Level wird nach einem bestandenen Test gefeiert, nie nur wegen eines Streaks.</p><span>ANIMATION ÖFFNEN ↗</span></button>
          </div>
          <div className="bdp-panel"><h3>Kontrolle für Nutzer</h3><div className="bdp-toggles"><label className="bdp-check"><input type="checkbox" checked={quietMotion} onChange={e=>setQuietMotion(e.target.checked)}/>Ruhige Ansicht ohne große Bewegung</label><label className="bdp-check"><input type="checkbox" checked={soundOn} onChange={e=>setSoundOn(e.target.checked)}/>Ton in der zukünftigen Coach-Aufnahme erlauben</label></div><p className="bdp-fine">Es sind noch keine Audiodateien vorhanden. Die Toneinstellung beeinflusst daher nur die Demo-Beschriftung und spielt keinen Ton ab.</p></div>
        </div>}

        {screen==="scope"&&<div className="bdp-screen">
          <Steps step="ENTWICKLUNG" title="UMFANG & FREIGABE" detail="Prototyp vs. Produktion"/>
          <h1>Ein Kern.<br/><em>Klare Prioritäten.</em></h1><p className="bdp-lead">Diese Ansicht unterscheidet wiederverwendbare Teile des ursprünglichen Konzepts von ausdrücklichen Logikänderungen und gesondert zu schätzenden Erweiterungen.</p>
          <div className="bdp-scope-table"><div><b>Vorhandene technische Basis</b><Tag kind="existing">BESTEHEND</Tag><p>Coach-Panel, Pläne, Übungen, Bilder, Video-Uploads, Performance-Tests, Score, Chat, Wearables und Abos.</p></div><div><b>Neue Kernlogik</b><Tag kind="new">ÄNDERUNG</Tag><p>Zielkombinationen, Curriculum, fünf unabhängige Levels, Einstiegsgate, Kapiteltests, Freischaltmotor und zentraler FREE/PRO-Zugriff.</p></div><div><b>Neue Experience</b><Tag kind="new">AUSBAU</Tag><p>Persönliche Tagesführung, kontextbezogenes Coach-Feedback, verständliche getrennte Kennzahlen und Meilenstein-Engine.</p></div><div><b>Frauenbereich</b><Tag kind="new">ZUSATZAUFWAND</Tag><p>Gleichwertiges wählbares Dashboard, eigene Bildsprache, Trainerinnenmedien und zielkombinierte Wege ohne Ausschlüsse.</p></div><div><b>Zyklus & Voice Workout</b><Tag kind="optional">SEPARATE FREIGABE</Tag><p>Datenschutzsensibles optionales Zyklusmodul und geführte Workouts mit echten Coach-Aufnahmen getrennt kalkulieren.</p></div></div>
          <div className="bdp-panel"><h3>Unverbindliche Größenordnung der Zusatzumsetzung</h3><p>Die Schätzung bezieht sich nicht auf diesen klickbaren Prototyp. Sie dient nur zur gemeinsamen Planung der späteren produktiven Entwicklung und ist kein Festpreis.</p><div className="bdp-estimate"><div><b>4–8 Wochen</b><span>Kern: Lernwege, Prüf- und Freischaltmotor, Rechte, Migration, Coach-CMS</span></div><div><b>2–4 Wochen</b><span>Persönlicher Coach-Kontext, Dashboard, Women MVP, FREE/PRO Medien</span></div><div><b>1–3 Wochen</b><span>Meilensteine, Motion, Qualitäts- und Regressionstests</span></div><div><b>+2–4 Wochen</b><span>Optionales Zyklusmodul nach Datenschutz- und Fachfreigabe</span></div></div><p className="bdp-fine">Stark überschneidbare Arbeiten, keine addierbare Termin- oder Lieferzusage; abhängig von vorhandener Teamkapazität, Technikprüfung und Medienlieferung.</p></div>
          <div className="bdp-panel"><h3>Material, das vom Coach / der Trainerin benötigt wird</h3><p>Für echte Übungskarten: pro Übung drei Aufnahmen oder Videostandbilder plus 8–12 Sekunden Erklärvideo, eindeutige Übungs-ID, Beschreibungen und Coaching-Hinweise. Für Success-Momente: freigestellte High-Five-/Applaus-Clips, kurze Sprachsätze und Nutzungsfreigaben. Für den Frauenbereich: dieselbe Aufnahmequalität der Trainerin und gegebenenfalls eine freigegebene alternative Bildwelt.</p></div>
          <Action onClick={()=>navigate("goals")}>DEMO ERNEUT STARTEN</Action>
        </div>}
      </section>

      <aside className="bdp-coach-rail"><div className="bdp-rail-card"><div className="bdp-rail-head"><span className="bdp-avatar">BD</span><span><b>DEIN COACH</b><small>BE DIFFERENT / SIMULATION</small></span></div><div className="bdp-coach-quote">„Der nächste sinnvolle Schritt zählt. Nicht wie viele Menüs du öffnen kannst.“</div><p>Im echten Produkt erscheint hier eine zum Plan passende, von echten Daten und freigegebenem Coach-Inhalt gestützte Empfehlung.</p><div className="bdp-rail-divider"/><small>DEIN WEG</small><strong>{route}</strong><div className="bdp-rail-divider"/><small>LEVEL</small><strong>{confirmed?currentLevel:"NICHT BESTÄTIGT"}</strong><div className="bdp-rail-divider"/><small>ABO-VORSCHAU</small><div className="bdp-rail-tier"><button onClick={()=>setTier("FREE")} aria-pressed={tier==="FREE"} className={tier==="FREE"?"current":""}>FREE</button><button onClick={()=>setTier("PRO")} aria-pressed={tier==="PRO"} className={tier==="PRO"?"current":""}>PRO</button></div><p className="bdp-fine">{noData}</p></div>
      </aside>
    </div>

    {moment&&<div className={"bdp-overlay"+(quietMotion?" bdp-still":"")} role="dialog" aria-modal="true" aria-labelledby="bdp-celebration-title">
      <div className={"bdp-celebration bdp-celebration-"+moment}>
        <div className="bdp-celebration-top"><span>BE DIFFERENT / DEIN MOMENT</span><button onClick={()=>setMoment(null)}>ÜBERSPRINGEN ✕</button></div>
        {moment==="recovery"?<><div className="bdp-celebration-symbol">✓</div><h2 id="bdp-celebration-title">Erholung zählt.</h2><p>Du bist drangeblieben. Regeneration ist Teil deines Weges.</p></>:moment==="chapter"?<><div className="bdp-celebration-symbol">✓</div><h2 id="bdp-celebration-title">Kapitel geschafft.</h2><p>Dein Test wurde in der Demo bestanden. Das nächste Kapitel ist frei, ohne dass sich dein Level automatisch ändern muss.</p></>:moment==="thirty"?<><div className="bdp-celebration-number">30</div><div className="bdp-coach-cutout"><b>COACH-CLIP</b><span>Freigestellte Originalaufnahme wird benötigt</span></div><h2 id="bdp-celebration-title">30 Tage. Richtig stark!</h2><p>Dein Einsatz verdient diesen Moment. Wir gehen gemeinsam weiter.</p></>:<><div className="bdp-celebration-old">{levelReveal.from}</div><div className="bdp-celebration-arrow">↓</div><div className="bdp-celebration-new">{levelReveal.to}</div><h2 id="bdp-celebration-title">Dein nächster Schritt ist frei.</h2><p>Demo eines bestandenen Kapiteltests. Auszeichnungen ersetzen nie die Prüfbedingungen.</p></>}
        <div className="bdp-celebration-controls"><span>{quietMotion?"REDUZIERTE BEWEGUNG":"ANIMATION"} · {soundOn?"TON GEWÜNSCHT, DATEI FEHLT":"STUMM"}</span><button onClick={()=>setMoment(null)}>WEITER →</button></div>
      </div>
    </div>}
    <footer className="bdp-footer">BE DIFFERENT · PRODUKTDEMO 21.10.2026 · Keine echten Messwerte, Uploads, Prüfentscheidungen oder Käufe</footer>
  </main>;
}
