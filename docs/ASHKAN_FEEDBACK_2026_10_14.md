# BE DIFFERENT · Feedback von Ashkan · 14.10.2026

## Umsetzung in diesem Branch

- **BE FOCUSED (Web):** responsive Premium-Ansicht statt generischer Website-Karte, 120-Sekunden-Timer mit driftresistenter Deadline, Atemphasen, Pause/Reset und optionale deutsche System-Sprachausgabe über Browser-TTS.
- **BE FOCUSED (Native):** neue mobile Atem-Experience, animierte Atembewegung und Ringfortschritt, driftresistente 120-Sekunden-Session, vorlesbare kurze Hinweise und opt-in Sprachschalter (expo-speech 13.1.7).
- **Wichtige Einschränkung:** Das ist eine *Systemstimme*, **keine** synthetisierte Ashkan-Stimme. Für eine personalisierte Trainerstimme benötigen wir eine einwilligungsbasierte Sprachaufnahme und Freigabe. Niemals ohne Zustimmung als seine Stimme ausgeben.
- **ATHLET / START:** START = persönlicher Tagesüberblick; ATHLET = Übersicht aller Athleten-Module. BE AWAKE und BE FUEL sind prominente Direktzugänge.
- **DIGITAL TWIN:** Die bereits vorhandene schematische Animation ist jetzt auch bei API-/PRO-Fehlern sichtbar. Es gibt **keinen personalisierten 3D-Körperscan**; persönliche Leistungsdaten bleiben echte Messwerte.
- **TRAINING:** Einstiege zu vorhandenen Trainingsplänen und Übungsbibliothek jetzt direkt im Training-Tab.
- **WEARABLES:** Apple Health / Apple Watch via HealthKit sowie Android Health Connect waren bereits integriert. Der Screen bietet nun Testanleitung und zeigt nach erneutem Öffnen vorhandene Messwerte aus dem Dashboard. Der optionale Kopplungscode für eine native Uhren-App ist **nicht** dasselbe wie die Health-Daten-Synchronisation.

## Manuelle Akzeptanztests

1. Web nach Login \`/focus\` auf Desktop und Mobil öffnen; responsive Layout prüfen; Start, Pause, Fortsetzen, Reset, 2-Minuten-Ende.
2. Web: Stimme einschalten und testen; falls der Browser TTS nicht unterstützt, muss der Schalter deaktiviert sein. Gesprochene Hinweise dürfen beim Pausieren nicht weiterlaufen.
3. iOS- und Android-Dev-Build **neu erstellen**, weil \`expo-speech\` ein neues natives Modul ist; auf echtem Telefon Fokus starten und Sprachschalter testen (auch Silent-Modus, Hintergrundwechsel, Anrufe).
4. START öffnen und zu ATHLET, BE AWAKE, BE FUEL und BE FOCUSED navigieren; alle Module müssen erreichbar sein.
5. ATHLET > DIGITAL TWIN: Sichtbare Animation auch ohne gültige personalisierte Daten; Hinweise zum schematischen Charakter prüfen.
6. TRAINING > PLÄNE / ÜBUNGEN: beide existierenden Screens aufrufen und echte Datensätze laden.
7. **Mit Ashkans echter Uhr:** Apple Watch im iPhone synchronisieren und Schritte/Schlaf in Apple Health verifizieren, danach in der App Freigabe und Import durchführen. Android entsprechend Hersteller-App > Health Connect > BE DIFFERENT. Vergleiche angezeigte Werte mit dem Quellsystem; keine simulierten Werte.
8. Die optionale Companion-Pairing-Funktion erst nach Bestätigung einer installierten Uhr-App separat testen.
9. Vor Merge: \`cd mobile && npm ci && npm run typecheck\` und im Projektroot \`npm ci && npm run check\` in CI/Entwicklungsumgebung ausführen. Prüfen, dass die laufende Store-Review-Version unverändert bleibt.

## Offene Inputs / Grenzen

- Autorisierte Sprachaufnahme von Ashkan und ausdrückliche Zustimmung zur Nutzung/KI-Erzeugung seiner Stimme.
- Der in WhatsApp erwähnte **„folgende Satz“** wurde nicht mitgesendet; Textänderung ausstehend.
- Das mit **„siehe Bild“** erwähnte zusätzliche Screenshot-Feedback muss der konkreten Seite zugeordnet werden.
- Eine erfolgreiche echte Wearable-Kopplung, eine Live-Deployment-Validierung und eine signierte Store-Build-Abnahme können nicht allein aus Quellcode abgeleitet werden.
- Keine automatische Veröffentlichung oder Änderung der bestehenden 1.2.0-iOS-Review-Submission in diesem Branch.
