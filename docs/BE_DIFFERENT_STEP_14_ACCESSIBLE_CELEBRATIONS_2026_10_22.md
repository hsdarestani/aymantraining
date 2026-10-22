# BE DIFFERENT — Step 14: echte, zugängliche Erfolgsmomente

22. Oktober 2026. Vereinbarte Abgrenzung: Nur von Schritt 13 verifizierte und in MilestoneAward gespeicherte Leistungen erhalten Animationen. Dieses Feature erfindet weder Erfolge, BD Scores noch Journey Stufen.

## Umsetzung
- Erfolgsdarstellung für SMALL, MEDIUM und FULL, mit angepasster emotionaler Intensität und persönlichem Meilensteintext.
- Web: fokussierter Dialog mit sichtbarer Schaltfläche WEITER, Escape Behandlung, Escape bestätigt die Meldung, lesbarer statischer Rückfall und Unterstützung für prefers-reduced-motion.
- Mobil: modale, per Taste schließbare Ansicht. React Native AccessibilityInfo erfasst Änderungen der Systemeinstellung auch während die App geöffnet bleibt; animiert wird nur das Symbol, nicht der Trainingsinhalt.
- Nur sichere Oberflächen: Startbildschirm und persönliche Meilensteinübersicht; **keine** Unterbrechung laufender Sätze, Timer, Uploads oder Tests.
- Neue Auszeichnungen werden aus verifizierten Meilensteinen gewonnen. Maximal drei ungesehene, höchstens 14 Tage alte Erfolge werden in zeitlicher Reihenfolge angeboten. Keine Dauerloops und kein automatisches Schließen.
- Auszeichnung wird erst beim bestätigten Fortsetzen als gesehen gespeichert. (userId,id) ist Eigentumsgrenze; fremde Kennung wird mit 404 abgewiesen; Wiederholung der Bestätigung ist idempotent.
- Zwei persistente, personenbezogene Einstellungen: automatische Erfolgsanzeige und reduzierte Bewegung. Die Einstellung zur Bewegung des Betriebssystems hat immer Vorrang.
- Erfolge selbst bleiben bestehen, auch wenn Darstellungen abgeschaltet werden. Keine Cycle Daten, Gesundheitsattribute oder persönliche Score Ableitungen im visuellen Payload.

## Datenbank und Release
- Rein additive Tabelle CelebrationPreference mit Fremdschlüssel auf User und Cascade beim Kontolöschen.
- CELEBRATIONS_ENABLED ist standardmäßig false und setzt die aktive MILESTONES_ENABLED Funktion voraus.
- Serverseitig nur nach isoliertem BE DIFFERENT Schema Preflight und vollständigem Datenbank, Medien und Konfigurationsbackup einschalten.
- Web und Backend können getrennt von den App Store Updates aktiviert werden. Native Oberfläche benötigt neuen Android und iOS Build sowie QA in Schritt 15.
- Alle vorhandenen A+ Esthetic und Book Dienste dürfen weder umgestellt noch neu gestartet werden.

## Akzeptanz
Unit: vertrauenswürdige Quelle, Darstellungsklassen, System und Nutzer Reduktionsregeln, strikte API Eingabe, 14 Tage Begrenzung.
Isoliertes PostgreSQL und Browser: echte verdiente Auszeichnung, kein Zugriff auf fremde Ereignisse, Dialog inklusive Tastatur, Abschalten und Reaktivieren, reduzierte Bewegung, wiederholte Bestätigung, BD Score und trainierte Stufen bleiben unverändert.
Web TypeScript, Release Build und Expo TypeScript müssen bestanden werden, bevor auf den gemeinsamen VPS ausgerollt wird.
