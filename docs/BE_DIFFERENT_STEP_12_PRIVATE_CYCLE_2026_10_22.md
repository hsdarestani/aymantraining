# BE DIFFERENT — Step 12: Privater Zykluskalender

Datum: 22.10.2026. Ein sensibler privater Fitness-Kontext, keine medizinische Beratung oder Verhütungsmethode.

## Funktionen
- Eigenständige Einwilligung zum privaten Zykluskalender; freiwillig und standardmäßig **aus**, unabhängig von Geschlecht, Frauenansicht, Abo, Training und Level.
- Eigener Datenschutzbereich für Blutung (optional), Beschwerden, Energie, Stimmung, Schmerzen, ausdrücklich gewählte leichtere Einheit oder gewünschten Ruhetag. Keine automatische Änderung des Trainingsplans und keine automatische Freischaltung/Abwertung einer Stufe.
- Optionaler letzter Beginn und ungefähre Intervalldauer (20 bis 45 Tage). Datumsangaben sind grobe Schätzungen. Bei alten Aufzeichnungen (>90 Tage) wird die Schätzung unterdrückt. Es werden weder Eisprung- noch Fruchtbarkeitstage ausgegeben. Nicht zur Verhütung oder Schwangerschaftsplanung nutzen.
- Dezente Hinweise **nur innerhalb des privaten Bereichs**, separat abschaltbar. Keine vertraulichen Inhalte in Push-Benachrichtigungen.
- Separate, ausdrücklich bestätigte Trainerfreigabe: Ein zugeordneter Trainer sieht höchstens die letzten 14 Tage mit Belastungswunsch, Energie und Belastungsempfinden. Keine Blutung, Symptome, Zykluslänge oder Vorhersagen. Ohne Freigabe 403, auch für Administratoren. Andere Nutzer haben keinen Zugang.
- Vollständiger Export über den bestehenden benutzereigenen Download. Einzelne Tage löschen, Trainerfreigabe zurückziehen, oder den Kalender einschließlich Aufzeichnungen, Freigaben und Einstellungen deaktivieren und löschen. Kontolöschung löscht über DB-Kaskade ebenfalls beide neuen Tabellen.
- Altes AthleteContext-Tracking ist deaktiviert und wird bei Änderung, Zustimmung oder Löschung bereinigt. Frühere pauschale Zyklusphasen-Empfehlungen sind aus der globalen Coaching-Engine entfernt und werden in Home-Endpunkten nicht mehr angezeigt.

## Datenhaltung und Sicherheit
- Private Datensätze CyclePrivacy/CycleJournalEntry, nur am User verknüpft. Alle Besitzerabfragen sind an die authentifizierte Nutzer-ID gebunden, keine Benutzer-ID in Write-Payloads. Die Coach-Ansicht prüft Rolle, Trainer-Zuordnung **und** gesonderte Zustimmung.
- API antwortet mit Cache-Control private, no-store. POST/PUT/DELETE prüfen Login, Athletenrolle, Same-Origin/Mobile-Token und JSON-Schema inklusive gültigem Datum und erlaubten Werten.
- Neue Tabellen werden bei CYCLE_JOURNAL_ENABLED=false nicht gelesen. Keine neuen Berechtigungen aus der Frauen-Dashboard-Auswahl ableiten.

## Rollout und Abnahme
1. CI Step12 mit isolierter PostgreSQL-Datenbank: reiner Kalender-Test, Typecheck Web, Next.js Build, Expo Typecheck, Browser-Tests zu Zustimmung, Eigentümer-Isolation, Trainerfreigabe, Export und Löschen.
2. Vor Aktivierung auf gemeinsamem Esthetic-VPS: bekannte Prisma-Migrator-Abhängigkeit (jiti) beheben, nur für BE DIFFERENT Sicherung von Datenbank/Medien/Env und additiven Schema-Abgleich auf bedifferent_temp durchführen. Keinesfalls die Esthetic-Datenbanken oder Dienste migrieren.
3. Erst nach erfolgreichem Smoke-Test CYCLE_JOURNAL_ENABLED=true setzen; auf echtem Server Routen und Deaktivierung nochmal testen.
4. Neue Android- und iOS-Builds erstellen, Gerätetests und Store-Einreichung gesondert bestätigen.

Nicht behaupten, dass die Änderungen ohne geprüften Produktions-Rollout bereits live sind. Es gibt keine externen Trainer-Medien für diesen Schritt.
