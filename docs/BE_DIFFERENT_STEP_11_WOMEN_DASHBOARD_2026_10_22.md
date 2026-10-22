# BE DIFFERENT — Step 11: freiwillige Frauenansicht

22.10.2026. Implementierung im Web und in Expo, private Einstellungen und eigene Tests.

- Bereits bei der Neuanmeldung freiwillig gewählte Frauenansicht wird als initialer Wert übernommen.
- Neue und bestehende Athleten können jederzeit zwischen allgemeiner Ansicht und Frauenansicht wechseln, unabhängig von Geschlecht oder Vertrag. Der Wert wird getrennt vom Journey gespeichert, und Änderungen löschen oder ändern keine Ziele, Pläne, Tests, Trainingsdaten oder freigegebenen Kapitel.
- Die Frauenansicht zeigt dieselben echten Trainingsdaten und Score-Daten mit eigenem Layout: heutige Einheiten, Check-in, Schlaf, bestätigte Stufe, kombinierte Ziele. Keine erfundene Tagesform, keine erzwungene Sportart, kein Gender-Stereotyp.
- Optional werden bereits verfügbare und autorisierte Medien mit markierter Trainerin zuerst dargestellt, ohne die Berechtigungen für PRO/FREE oder gesperrte Kapitel zu verändern. Echte Videos und Nutzungsrechte sind externe Eingaben.
- Zyklusfunktionen, Beschwerden, Einwilligung, Coach-Freigabe, Löschung und Kalender gehören zu Schritt 12. Die Wahl des Layouts aktiviert nichts davon und erhebt keine sensiblen Details.
- API mit Login, ATHLETE-Rolle, Ursprungsprüfung, striktem Eingabeschema, per-Nutzer-Speicherung und privatem No-Store. Tabellenverhältnis mit Cascade zum Konto.

**Rollout:** Schema ist additiv. Erst Datenbank mit Backup auf die erweiterte Struktur bringen, dann WOMEN_DASHBOARD_ENABLED=true setzen. Ohne das Flag bleibt die allgemeine Ansicht erhalten und es erfolgt kein Zugriff auf die neue Datenbanktabelle. Die bisherige gemeinsame Esthetic-Server-Umgebung wird durch diesen Commit nicht geändert. Web, Android und iOS benötigen nach Freigabe noch Builds und technische Store-Tests.

**Tests:** isolierte Datenbank, TypeScript Web/Native, Production Build, Wechsel zwischen Ansichten, Speichern der Trainerinpräferenz, Isolierung zweier Benutzer, ungültige Requests, kein Zyklus-Autostart. Tests sind keine Aussage über reale, lizenzierte Videos oder Veröffentlichung in Produktion.
