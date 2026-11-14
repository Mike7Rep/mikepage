# Besucher und Bewertungen

## Zähler

Vorhandenes Redis (`REDIS_URL`), Namespace `website:metrics:v1`. Keine Datenbankmigration.
Der Gesamtzähler beginnt mit einem ausdrücklich vorgegebenen Startwert von 77, nicht mit historischen Messdaten. CV und Kontaktklicks beginnen mit 0.
Besucher = Browser innerhalb von 24 Stunden, keine eindeutig identifizierten Personen. Alle Routen zählen zur Gesamtsumme. CV-Aufrufe zählen zusätzlich separat. E-Mail-Links zählen als Kontakt-CTA, schnelle Doppelklicks werden innerhalb von 2 Sekunden zusammengefasst.
Ein zufälliges HttpOnly-Cookie läuft nach 24 Stunden ab. Die zugehörigen Redis-Schlüssel laufen ebenfalls ab. Keine IP-Adressen werden in der Statistik gespeichert. Cookie-Löschen, blockiertes JavaScript und Bots können die Zahlen beeinflussen. Redis muss persistent betrieben werden, damit aggregierte Zähler erhalten bleiben.
Bei Ausfall wird „—“ angezeigt, kein erfundener Messwert. Lokale Tests ausschliesslich mit separatem Redis.

## Google Forms / Sheets vorbereiten

1. Google Form mit Feldern `Vorname`, `Nachname`, `Bewertung` (lineare Skala 1–6) und Einverständnis zur Veröffentlichung von Kürzel und Bewertung erstellen.
2. Antworten mit einem Google Sheet verbinden. Im Antwortblatt zusätzlich eine Checkbox-Spalte `Freigegeben` anlegen. Nur Einträge mit Einverständnis freigeben.
3. Unter Erweiterungen → Apps Script das folgende Script einfügen. Tabellen-ID und Blattname einsetzen.
4. Als Web-App bereitstellen: Ausführen als Eigentümer, Zugriff „Jeder“. Nur der JSON-Export wird veröffentlicht, das Sheet selbst bleibt privat.
5. In Railway setzen:
   - `GOOGLE_REVIEWS_JSON_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec`
   - `GOOGLE_REVIEWS_FORM_URL=https://forms.gle/FORM_ID`
6. Änderungen werden innerhalb von fünf Minuten neu geladen. Ohne Konfiguration bleibt der Bewertungsbereich ehrlich leer; der Formularlink erscheint erst nach Konfiguration.

```javascript
function doGet() {
  const sheet = SpreadsheetApp.openById('TABELLEN_ID').getSheetByName('Formularantworten 1');
  const [headers, ...rows] = sheet.getDataRange().getValues();
  const index = name => headers.indexOf(name);
  const required = ['Vorname', 'Nachname', 'Bewertung', 'Freigegeben'];
  if (required.some(name => index(name) < 0)) throw new Error('Spalten prüfen');
  const ratings = rows.filter(row => row[index('Freigegeben')] === true).map(row => ({
    initials: [row[index('Vorname')], row[index('Nachname')]]
      .map(name => Array.from(String(name).trim())[0] || '').join('').toLocaleUpperCase('de-CH'),
    rating: Number(row[index('Bewertung')])
  })).filter(row => /^[\p{L}]{1,4}$/u.test(row.initials) && Number.isInteger(row.rating) && row.rating >= 1 && row.rating <= 6);
  return ContentService.createTextOutput(JSON.stringify(ratings)).setMimeType(ContentService.MimeType.JSON);
}
```

Nur Kürzel und Bewertung werden ausgegeben. Namen, E-Mail-Adressen und Zeitstempel verlassen das Sheet nicht über diesen Export.

Offizielle Anleitungen: [Apps Script Web-Apps](https://developers.google.com/apps-script/guides/web), [JSON Content Service](https://developers.google.com/apps-script/guides/content).
