# BE DIFFERENT — Schritt 12: Privates Zyklustagebuch und Einwilligung
22. Oktober 2026. Implementiert für Web und Expo; Codebereitstellung ist keine Freischaltung auf dem gemeinsamen Esthetic-Server.

## Fertiger Umfang
- Optionales, eigenes Tagebuch. Keine automatische Einwilligung aus Geschlecht, Frauenansicht, allgemeiner Gesundheitszustimmung oder älteren App-Versionen.
- Getrennte ausdrückliche Zustimmung vor jedem Eintrag; eigene bestätigungspflichtige Trainerfreigabe; Widerruf sofort möglich.
- Datumsbasierte Aufzeichnungen: Blutungsstärke, Beschwerden, Energie, Stimmung, empfundene Belastung und persönlicher Wunsch nach leichterem Training oder Ruhe.
- Letzter vom Nutzer beobachteter Periodenbeginn und optionale übliche Länge 20–45 Tage. Nur grobe Termine; bei fehlenden/veralteten Angaben keine Vorhersage, kein Fertilitäts- oder Empfängnisverhütungsdienst.
- Persönlicher Wunsch hat *keine* automatische Wirkung auf Trainingsplan, Testbestehen, Scores, Level, Abzeichen oder Freischaltung; Trainer müssen Trainingsänderungen separat prüfen.
- Erinnerung nur privat **innerhalb** des Tagebuchs, keine Push-Nachricht, die sensible Daten offenlegen könnte.
- Speichern/Löschen einzelner Tage, Export aller privaten Einträge per eigenem Konto und **vollständige Löschung aller Zyklusdaten und Freigaben bei Widerruf**.
- Der Coach-Endpoint ist nur für den zugewiesenen, aktuell berechtigten Trainer oder Admin nach separater ausdrücklicher Freigabe zugänglich. Er liefert nur Trainingswunsch, Energie und empfundenes Unwohlsein aus den letzten 14 Tagen, **keine** Blutungsstärke, Symptomsammlung, Zyklustage oder Prognose.
- Alte allgemeine AthleteContext-Zyklusfelder werden nicht mehr aktiviert und in GET neutralisiert. Alte Versionen dürfen ohne eigene Zustimmung keine neuen Zyklusdaten speichern.
- Früher erzeugte Cycle-Kontextempfehlungen werden bei Bewertung entfernt und nicht mehr auf dem Haupt-Dashboard ausgeliefert.

## Schema und sichere Freischaltung
Zwei neue rein personenbezogene Prisma-Modelle CyclePrivacy/CycleJournalEntry mit Cascade und eindeutiger userId/date-Beziehung. Das Flag `CYCLE_JOURNAL_ENABLED` ist standardmäßig *aus*. Erst vollständige Backups und isoliertes Preflight auf dem gemeinsam genutzten VPS durchführen, additive Schemaänderungen vorsichtig ausrollen, und **erst dann** das Flag aktivieren. Niemals eine ungeprüfte `prisma db push` gegen den Produktivserver ausführen. Bei nicht aktivierter Funktion greift die App nicht auf diese neuen Tabellen zu.
Kein live VPS-Deployment, keine Store-Builds, keine Lizenzen oder klinische Freigabe durch den Code-Commit.

## Akzeptanz und Grenzen
CI: Datenbanktest in isoliertem PostgreSQL, Schema/TypeScript, Next-Build, Expo-Typecheck, browserbasierter ausdrücklicher Opt-in, Schreibsperre ohne Zustimmung, per-User-Isolation, eigene Rechte für Coach, minimaler Share-Scope, Export, Löschung/Widerruf, alte API gesperrt und unveränderte Journey-Berechtigungen. Bei ungewöhnlich starker Blutung, starken Schmerzen oder auffälligen Beschwerden weist die UI nicht auf automatische medizinische Empfehlungen hin; gesundheitliche Fragen sollen durch medizinisches Personal geklärt werden.
