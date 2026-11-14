# Besucher und Bewertungen

## Zähler

Vorhandenes Redis (`REDIS_URL`), Namespace `website:metrics:v1`. Keine Datenbankmigration.
Der Gesamtzähler beginnt mit einem ausdrücklich vorgegebenen Startwert von 77, nicht mit historischen Messdaten. CV und Kontaktklicks beginnen mit 0.
Besucher = Browser innerhalb von 24 Stunden, keine eindeutig identifizierten Personen. Alle Routen zählen zur Gesamtsumme. CV-Aufrufe zählen zusätzlich separat. E-Mail-Links zählen als Kontakt-CTA, schnelle Doppelklicks werden innerhalb von 2 Sekunden zusammengefasst.
Ein zufälliges HttpOnly-Cookie läuft nach 24 Stunden ab. Die zugehörigen Redis-Schlüssel laufen ebenfalls ab. Keine IP-Adressen werden in der Statistik gespeichert. Cookie-Löschen, blockiertes JavaScript und Bots können die Zahlen beeinflussen. Redis muss persistent betrieben werden, damit aggregierte Zähler erhalten bleiben.
Bei Ausfall wird „—“ angezeigt, kein erfundener Messwert. Lokale Tests ausschliesslich mit separatem Redis.

## Google Forms / Sheets

Die produktive Anbindung liest das Antwortblatt serverseitig als CSV, mit fünf Minuten Cache:

- [Formular](https://forms.gle/8kT9yds33rNTKFd37)
- [Tabelle](https://docs.google.com/spreadsheets/d/1S6rMKluhRY-s-TmeMcKtjos6eAhIVPkWpqcSsZkTGRs/edit?gid=2061172240)

Kein Apps Script und keine zusätzlichen Umgebungsvariablen erforderlich. Die Tabelle muss für den Server lesbar bleiben. Spalten werden anhand der Fragenüberschriften zugeordnet, nicht anhand ihrer Position.

- Sterne: Mittelwert aller gültigen Antworten (ganze Zahlen 1 bis 6) auf „Wie zufrieden waren Sie insgesamt …“.
- Weiterempfehlung: Anzahl „Ja“ / Anzahl aller gültigen Bewertungen, auf ganze Prozent gerundet. „Vielleicht“, „Nein“ und fehlende Angaben zählen nicht als Empfehlung. Einstellige Werte erhalten eine führende Null; 100 % bleibt 100 %.
- Name-Freigabe: Initialen aus Vorname/Nachname, Unternehmen, Position, Sterne und positiver Feedbacktext.
- Anonyme Freigabe: „Anonym“, Sterne und Feedback; weder Unternehmen noch Position.
- Nein, leere oder unbekannte Freigabe: ausschliesslich aggregierte Statistik, kein Karusselleintrag und kein Feedbacktext im Browser.
- Verbesserungsvorschläge und Zeitstempel werden nicht veröffentlicht.

Der Server übergibt nur aggregierte Zahlen und erlaubte öffentliche Felder an die Client-Komponente. Bei leerer Tabelle erscheinen keine Beispieldaten; bei Lesefehlern erscheint ein Verfügbarkeitshinweis. Lange Texte sind gekürzt, per Hover lesbar und per Klick/Touch aufklappbar. Das Karussell lässt sich wischen oder mit Pfeilen bedienen.

Tests: `pnpm test` prüft CSV-Escaping, Sterne, Weiterempfehlung und alle Freigabefälle.
