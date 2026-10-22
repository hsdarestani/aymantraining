# BE DIFFERENT — Schritt 13: verifizierte Serien und Meilensteine
22. Oktober 2026. Implementiert für Web und Expo. Die Freischaltung auf dem gemeinsam genutzten VPS erfolgt ausschließlich über eine gesonderte, rückrollbare Aktivierung.

## Fachliche Regel
- Eine lokale Trainingseinheit zählt am tatsächlichen Abschlussdatum; Synchronisierung nachträglich zählt nicht am Importdatum.
- Ein Tagescheck zählt ausschließlich, wenn wirklich mindestens ein subjektiver Wert erfasst ist.
- Eine bestätigte Journey-Aktivität zählt am tatsächlichen Abschlussdatum, wenn Journey produktiv aktiviert ist.
- Ein geplanter Erholungstag zählt nur, wenn ein derzeit zuständiger Trainer den Eintrag **vor diesem Tag** vorgenommen hat und am gleichen lokalen Kalendertag kein Training geplant ist. Ein leerer Kalender ist kein Ruhetag.
- App-Öffnen, Login, passive Benachrichtigung und unbekannte Aktivität zählen nicht. Mehrere Ereignisse am Tag zählen einmal. Zeitzonen und 120-Tage-Verlauf werden berücksichtigt; wenn heute noch nichts geschehen ist, zählt die gestrige Serie weiterhin.
- Die Meilensteine 7 und 30 Tage, erste absolvierte Einheit sowie zusätzliche coachkonfigurierbare Regeln werden nur aus überprüften Ereignissen freigeschaltet. Eindeutiger Schlüssel userId/key verhindert Mehrfachvergabe unter parallelen Abfragen und Replays.
- Coach legt eigene Kriterien (Serie, echte Einheiten, nach Coachtest tatsächlich verliehene Level), Titel, Text, Intensitätsstufe (SMALL/MEDIUM/FULL für Schritt 14) fest und kann Regeln deaktivieren. Kein Beitrag zu BD Score oder automatisch verliehenen Journey-Stufen.
- Bereits gespeicherte Abzeichen bleiben erhalten; neue verifizierte Meilenstein-IDs sind getrennt von alten, möglicherweise aus App-Öffnungen entstandenen Legacy-Badges.
- API ausschließlich mit Login, Eigentum bzw. derzeit gültiger Trainerzuordnung, striktem Schema und privatem No-Store. Andere Trainer können weder einstellen noch Erholung buchen.
- Die Oberfläche zeigt aktuellen/besten Verlauf und erreichte/nächste Meilensteine. Keine automatisch abgespielten Animationen; das ist separat Schritt 14. Erfolgsdarstellung stört keine Timer und sendet keine sensiblen Zyklusangaben.

## Sichere Live-Schaltung
Neue, additive Datenbankmodelle `PlannedRecoveryDay`, `MilestoneRule`, `MilestoneAward`; `MILESTONES_ENABLED` standardmäßig **false**. Neue Tabellen müssen auf dem isolierten BE-DIFFERENT-System nach Backup per vorab auf destruktive SQL geprüfter Migration angelegt werden. Nicht den A+ Esthetic-/Booking-/Postgres-Dienst neu starten. Ohne Flag ist der neue Meilensteinpfad abgeschaltet und die bisherigen Seiten bleiben kompatibel.

## Akzeptanz
- Isolierte PostgreSQL-Datenbank, Prisma validate/generate, TypeScript Web und Expo, Production Build.
- Rechenfälle: Nullaktivität, lokale Tagesgrenze, Grace für heute, Lücke, zwei Ereignisse nur ein Tag, echte im Voraus geplante Erholung, Erholung bei vorhandenem Training nicht gültig, 35 Tage, zukünftiger Tag ignoriert, Replay/Idempotenz, ungültiger Regelschlüssel und ungültige Datumsangabe.
- Browser: Login/Ownership, App-Aufruf allein verleiht nichts, echter Workout-Erfolg, einmalige Auszeichnung auch bei zweimaliger Abfrage, individuelle Trainerregeln, fremde Trainer abgewiesen, zukünftige Erholung anlegen/entfernen, keine rückwirkende Erholung.

CI/PR-Zusammenführung bedeutet nicht automatisch Live-Deployment oder veröffentlichte App Builds.