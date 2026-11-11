# Kanalwache

Ein eigener Twitch-Viewer für Windows: dein Kanal und deine Lieblingskanäle an einem Ort. Sobald einer live geht, meldet sich Kanalwache – und öffnet den Stream auf Wunsch automatisch mit deinem Twitch-Account, sodass du ganz normal als Zuschauer zählst, chatten kannst und Kanalpunkte sammelst.

## Funktionen

- **Mein Kanal** und **Lieblingskanäle** in der Seitenleiste, live zuerst (nach Zuschauerzahl sortiert), mit Spiel, Zuschauern und Laufzeit
- **Kanalliste verstellbar**: am rechten Rand der Liste ziehen macht sie breiter oder schmaler (Doppelklick: Standardbreite); der Pfeil oben neben „Kanalwache“ – oder ganz schmal ziehen – klappt sie auf die Kanalbilder ein. Breite und Zustand werden gemerkt.
- **Kanal-Einstellungen unter dem Kanal**: fährst du mit der Maus über einen Kanal, erscheinen seine Knöpfe (Glocke, Stern, Auge, Mod-Ansicht, Reihenfolge, Entfernen) in einer eigenen Zeile darunter – Name und Spiel bleiben sichtbar. Eingeschaltete Glocke, Auge und Mod-Ansicht zeigt die Zeile als kleine Symbole an (bei schmaler Liste nur beim Drüberfahren).
- **Übersicht** mit Vorschaubildern aller Kanäle, die gerade live sind
- **Streams in Tabs** – nur Player und Chat nebeneinander (Chat-Breite verstellbar, Chat ausblendbar), mehrere Kanäle gleichzeitig; wahlweise die ganze Twitch-Seite
- **Einmal anmelden**, Login bleibt gespeichert
- Pro Kanal zwei Schalter:
  - 🔔 **Benachrichtigen**, wenn der Kanal live geht (Klick auf die Benachrichtigung öffnet den Stream)
  - 👁 **Automatisch zuschauen**: Stream öffnet sich von selbst, wenn der Kanal live geht – auch beim Start der App, wenn er schon läuft
- Automatisch geöffnete Streams starten stumm (abschaltbar) und schließen sich, wenn der Stream endet (abschaltbar)
- Läuft im **Infobereich** weiter, wenn das Fenster geschlossen wird; Tray-Menü zeigt, wer gerade live ist
- Optional **Autostart mit Windows** (startet versteckt im Infobereich)
- **Giveaway-Helfer**: erkennt Giveaways in deinen Lieblingskanälen und lässt dich mit einem Klick teilnehmen, mit selbst festlegbaren Erkennungswörtern (siehe unten)
- **Kanalpunkte**: zeigt den Kontostand und einen **Bonus abholen**-Knopf, sobald der Bonus bereitsteht (siehe unten)
- **Favoriten** ★ in einer eigenen Leiste unter den Tabs, mit Alt+1–9 und Alt+←/→ schnell durchschalten (siehe unten)
- **Gefolgte Kanäle übernehmen**: alle Kanäle, denen du folgst, mit einem Klick in die Liste – auf Wunsch laufend abgeglichen (siehe unten)
- **Aufnahme**: Streams als Video aufnehmen – nur in Kanälen, in denen du Mod bist (siehe unten)
- **Raids**: Raidet ein Kanal am Streamende, fragt Kanalwache mit einer Karte nach: mitraiden oder nicht (siehe unten)
- **Zuschauerserie**: 🔥 mit Zahl am Kanal = so viele Streams hast du dort in Folge geschaut (Twitchs „Watch Streak“). Wird alle 20 Minuten bei Twitch abgefragt; abschaltbar unter Einstellungen → *Zuschauerserie*. Twitch dokumentiert diese Angabe nicht – fehlt das 🔥, obwohl du eine Serie hast, liefert Twitch sie gerade nicht.
- **Drops**: zeigt dein Drop-Inventar, meldet fertige Drops und bietet einen **Drop abholen**-Knopf (siehe unten)
- **Twitch-Benachrichtigungen**: die Meldungen aus Twitchs Glocke direkt in Kanalwache (siehe unten)
- **Moderation**: erkennt, wo du Mod bist, und öffnet dort mit einem Klick Twitchs Mod-Ansicht – für deinen eigenen Kanal den Stream-Manager (siehe unten)

## Giveaway-Helfer

Solange einer deiner Lieblingskanäle live ist, liest Kanalwache dessen Chat mit (dein eigener Kanal wird nicht mitgelesen).

- **Erkennung**: Ein Giveaway gilt als gestartet, wenn der Streamer, ein Mod oder ein bekannter Bot (StreamElements, Nightbot, Moobot, Fossabot, …) eine Verlosung ankündigt und dabei einen Befehl wie `!join` nennt – oder wenn mehrere Zuschauer kurz hintereinander denselben Teilnahme-Befehl schreiben (`!join`, `!enter`, `!ticket`, `!gw`, `!mitmachen`, …). Befehle wie `!lurk` oder `!discord` lösen nichts aus.
- **Benachrichtigung** bei jedem neuen Giveaway; Klick öffnet den Tab *Giveaways*. Laufende Giveaways sind außerdem in der Seitenleiste (🎁 am Kanalbild), in der Übersicht und im Tray-Menü markiert.
- **Teilnehmen** schreibt den Befehl mit deinem Twitch-Account in den Chat. Der Befehl kann vorher angepasst werden (z. B. `!ticket 5`); erlaubt sind nur `!befehl` plus bis zu zwei kurze Wörter. Kanalwache wartet auf Twitchs Bestätigung und zeigt an, wenn die Nachricht abgelehnt wurde (z. B. Follower-only, Slow-Mode, Timeout).
- **Gewinner-Alarm**: Nennen Streamer, Mod oder Bot deinen Namen zusammen mit „Gewinner“, „gewonnen“, „congrats“ o. Ä., meldet sich Kanalwache sofort, holt das Fenster nach vorn und öffnet den Stream – damit du dich rechtzeitig im Chat meldest.
- **Gewinner anzeigen**: Sagen Streamer, Mod oder Bot den Gewinner im Chat an („Der Gewinner ist …“, „Congrats @…“, „… hat gewonnen“), steht er auf der Giveaway-Karte – samt der Ansage. Kanalwache gleicht die Namen mit den Leuten ab, die beim Giveaway mitgemacht haben, damit kein falsches Wort als Name durchgeht. Auch eine Ansage kurz nach dem Teilnahmeschluss wird noch zugeordnet. Hast du mitgemacht und jemand anderes gewinnt, gibt es eine leise Benachrichtigung. Giveaways mit Gewinner bleiben 2 Stunden im Bereich *Vorbei* stehen.
- Kanalwache nimmt **nie von selbst** teil – das bleibt deine Entscheidung, so wie es die Regeln der meisten Giveaways verlangen.

Ein- und ausschalten lässt sich der Helfer (und die Benachrichtigung) in den Einstellungen.

### Erkennungswörter selbst festlegen

Im Tab *Giveaways* (oder in den Einstellungen) über **Erkennungswörter bearbeiten** lassen sich alle Listen anpassen:

| Liste | Wirkung |
|---|---|
| Giveaway-Wörter | Schreibt Streamer, Mod oder Bot eins davon zusammen mit einem Befehl, startet ein Giveaway |
| Teilnahme-Befehle | Werden in Ankündigungen bevorzugt; schreiben viele Zuschauer einen davon, wird ein Giveaway auch ohne Ankündigung erkannt |
| Ignorierte Befehle | Gelten nie als Teilnahme-Befehl |
| Ende-Wörter | Beenden ein laufendes Giveaway |
| Gewinner-Wörter | Lösen zusammen mit deinem Namen den Gewinner-Alarm aus |
| Bots | Accounts, die wie Streamer und Mods Giveaways ankündigen dürfen |

Dazu die Zahl, ab wie vielen Leuten (innerhalb von 30 Sekunden) ein Giveaway ohne Ankündigung erkannt wird.

- Groß-/Kleinschreibung ist egal, es zählen nur ganze Wörter. Wortgruppen wie `free key` gehen auch.
- `*` steht für beliebige weitere Buchstaben: `verlos*` findet „verlost“, „Verlosung“, „verlosen“.
- Befehle gehen mit oder ohne `!`. Mehrere Einträge auf einmal mit Komma trennen; Rücktaste im leeren Feld entfernt den letzten Eintrag.
- **Standard** setzt eine Liste auf die mitgelieferten Werte zurück.
- Im Feld **Testen** eine echte Chat-Nachricht einfügen – Kanalwache zeigt sofort, was sie daraus erkennen würde, auch erkannte Gewinner-Namen.

## Kanalpunkte

In jedem offenen Stream-Tab schaut Kanalwache alle 15 Sekunden nach, ob der Bonus bereitsteht. Ist er da, erscheint über der Schnellleiste (Ton, Chat-Befehle) eine **Abhol-Leiste** mit einem Knopf **Bonus: Kanalname** – ein Klick, fertig. Die Leiste zeigt in jedem Stream die Boni **aller** offenen Streams (der gerade angezeigte zuerst, die anderen etwas blasser), du musst also nicht durch die Tabs klicken. Die Leiste ist nur zu sehen, wenn es etwas abzuholen gibt. Der aktuelle Kontostand steht im Tab (🪙); wurde in dieser Sitzung schon ein Bonus abgeholt, ist die Zahl farbig, der Tooltip zeigt wie oft.

- Funktioniert nur, wenn du angemeldet bist. Der Bonus wird im Chat neben dem Player abgeholt – auch wenn der Chat ausgeblendet ist.
- Punkte gibt es nur für Streams, die in Kanalwache offen sind – am einfachsten mit dem Augen-Symbol (automatisch zuschauen). Dein eigener Kanal wird übersprungen.
- **Automatisch abholen** gibt es weiterhin (Einstellungen → *Kanalpunkte*), ist aber **standardmäßig aus** – und wurde beim Update auf 0.0.11 einmalig ausgeschaltet.
- **Warum aus?** Twitchs Nutzungsbedingungen verbieten, den Dienst „automatisiert“ zu nutzen („robot … or other automated means“). Automatisches Abholen von Bonus oder Drops fällt darunter. Bekannte Sperrwellen dafür gab es bisher nicht, erlaubt ist es trotzdem nicht – auf dem Spiel stünde dein Twitch-Konto. Der Abholen-Knopf (du klickst selbst) ist dagegen ganz normales Zuschauen.

### Kontostand und Belohnungen

Rechts in der zweiten Leiste steht dein **Kanalpunkte-Kontostand** im aktiven Kanal (🪙), ebenso im Tab. Belohnungen löst du über Twitchs eigenen Kanalpunkte-Knopf im Chat ein.

## Favoriten

Mit dem **Stern ☆** machst du einen Kanal zum Favoriten: in der Kanalliste beim Drüberfahren, per Rechtsklick auf einen Tab oder mit **Strg+D** im gerade offenen Stream. Favoriten haben in der Liste einen kleinen gelben Stern.

Alle Favoriten stehen in der **Favoritenleiste** – der zweiten Leiste direkt unter den Tabs –, nummeriert und mit Live-Punkt:

- **Klick** öffnet den Stream bzw. wechselt zum Tab, **Mittelklick** schließt den offenen Tab.
- **Ziehen** ändert die Reihenfolge (und damit die Nummern), **Rechtsklick**: nach links/rechts, Tab schließen, aus den Favoriten entfernen.
- **Alt+1 … Alt+9** springt direkt zum Favoriten Nr. 1–9 (öffnet ihn auch, wenn er offline ist).
- **Alt+→ / Alt+←** schaltet nur zwischen den Favoriten durch, die gerade live sind oder schon als Tab offen sind.
- Vorne steht, wie viele Favoriten gerade live sind.
- Ausblenden lässt sich die Leiste in den Einstellungen (*Favoritenleiste unter den Tabs anzeigen*).

Rechts in derselben Leiste stehen die Werkzeuge des aktiven Tabs (Zuschauer/Mod-Ansicht, Kanalpunkte-Kontostand, Chat ein/aus, Aufnehmen, neu laden, im Browser öffnen) – so bleibt die Tab-Leiste oben ganz für die Tabs frei. Bei schmalerem Fenster werden sie zu Symbolen.

## Drops

Nach der Anmeldung gibt es oben neben *Giveaways* den Tab **Drops**. Er zeigt Twitchs Drop-Inventar (twitch.tv/drops/inventory) mit dem Fortschritt deiner laufenden Kampagnen.

- Kanalwache prüft das Inventar im Hintergrund jede Minute (und lädt es alle 10 Minuten neu). Ist ein Drop fertig, steht die Zahl am Tab, oben in der Leiste steht, welcher es ist, und es kommt eine Meldung.
- Ist ein Drop fertig, erscheint in jedem offenen Stream über der Schnellleiste der Knopf **Drop abholen: …** – ein Klick holt ihn ab. Alternativ im Tab *Drops* mit Twitchs eigenem **Abholen**-Knopf.
- **Automatisch abholen** (Standard: aus, gegen Twitchs Regeln – siehe *Kanalpunkte*) klickt fertige Drops selbst ab.
- Fortschritt sammelst du wie auf Twitch: Stream eines Kanals mit aktiven Drops in Kanalwache schauen (angemeldet, Player läuft). Ob ein Spiel/Kampagne mit dem Konto verknüpft sein muss, siehst du im Inventar.
- Einstellungen → *Drops*: Prüfung, automatisches Abholen und Windows-Meldungen einzeln abschaltbar.

## Twitch-Benachrichtigungen

Nach der Anmeldung holt Kanalwache alle 2 Minuten die Benachrichtigungen deines Twitch-Kontos – dieselben, die auf twitch.tv unter der Glocke oben rechts stehen (Live-Meldungen, Clips, Abos, Hinweise von Twitch …).

- Die **Glocke** oben rechts neben der Tab-Liste (oder **Strg+B**) öffnet die Liste; die rote Zahl zeigt, wie viele neu sind. Neue sind farbig hinterlegt und haben einen Punkt – nach dem Öffnen gelten sie als gesehen.
- **Klick** auf eine Benachrichtigung: Geht es um einen Kanal, öffnet sich sein Stream in Kanalwache; alles andere (z. B. ein Clip) öffnet sich im Browser.
- Neue Benachrichtigungen stehen auch im Tray-Menü.
- Einstellungen → *Twitch-Benachrichtigungen*: Abruf ein/aus und, wenn du willst, neue zusätzlich als **Windows-Meldung** (standardmäßig aus, weil Kanalwache bei Live-Gängen schon selbst meldet).
- Twitch dokumentiert diese Schnittstelle nicht. Ändert Twitch etwas daran, steht in der Liste ein Hinweis – über **Auf twitch.tv** siehst du die Benachrichtigungen dann im Browser.

## Chat-Verlauf

Was du im Chat schreibst, merkt sich Kanalwache (die letzten 50 Nachrichten, über alle Kanäle). So schreibst du etwas nochmal, ohne es neu zu tippen:

- **↑** im leeren Eingabefeld des Chats – oder der kleine **↺**-Knopf oben rechts am Eingabefeld – öffnet die Liste, die neueste Nachricht steht oben.
- **Klick** auf eine Nachricht (oder **↑/↓** und **Enter**) sendet sie sofort nochmal in diesen Chat.
- **✎** (oder **Tab**/**→**) übernimmt sie ins Eingabefeld, damit du sie vorher ändern kannst. **Esc** schließt die Liste.
- **Leeren** löscht den Verlauf. Nachrichten über die Schnellleiste landen ebenfalls im Verlauf.
- Gilt für die Stream-Ansicht (Player + Chat). Der Verlauf liegt nur auf deinem PC.

## Schnellleiste unter dem Player

Unter jedem Stream (in der Ansicht „nur Player und Chat“) liegt eine Leiste mit:

- **Ton an / Stumm** – wie Strg+M, schaltet sofort um; bei „Ton nur aus einem Tab“ holt der Knopf an einem stummen Tab den Ton hierher.
- **Folgen / Gefolgt** – folgt dem Kanal mit einem Klick; steht dort „Gefolgt“, entfolgt ein Klick (mit Rückfrage). Lehnt Twitch das direkte Folgen ab, drückt Kanalwache unsichtbar den Folgen-Knopf auf der Kanalseite.
- **Abonnieren** – öffnet Twitchs Abo-Seite des Kanals in einem Fenster in Kanalwache (angemeldet): Abo abschließen, verlängern oder verschenken; bezahlt wird direkt bei Twitch. Hast du schon ein Abo, steht dort „Abonniert (Stufe …)“. Bei deinem eigenen Kanal fehlen beide Knöpfe.
- **Lautstärkeregler** – eine gemeinsame Lautstärke für alle Streams, die gemerkt wird. Kanalwache hält sie in jedem Player gleich, auch wenn Twitch die Lautstärke nach Werbung oder beim Neuladen zurücksetzt. Bewegst du im aktiven Stream Twitchs eigenen Regler, wird das die neue gemeinsame Lautstärke; Twitchs Stumm-Knopf schaltet wie Strg+M um.
- **Schnellnachrichten** – ein Klick schreibt die Nachricht mit deinem Account in den Chat des Kanals. Der Knopf wird kurz grün, wenn Twitch die Nachricht angenommen hat; lehnt Twitch ab (z. B. Follower-only, Slow-Mode, Timeout), steht der Grund in der Meldung.
- **Stift** – Schnellnachrichten bearbeiten (auch unter Einstellungen → *Schnellleiste*): Beschriftung und Text, Reihenfolge, bis zu 20 Stück. Platzhalter: `{kanal}` = Name des Kanals, `{ich}` = dein Name. Befehle wie `!lurk` gehen, Twitch-Befehle mit `/` nicht.

Wird das Fenster schmaler, rutschen die Schnellnachrichten in eine zweite Zeile statt aus dem Bild; bei sehr schmalem Player zeigt der Ton-Knopf nur noch das Symbol.

Für die Schnellnachrichten verbindet sich Kanalwache mit dem Chat jedes offenen Stream-Tabs (unabhängig vom Giveaway-Helfer).

## Tabs bedienen

Übersicht und Giveaways sind links fest angeheftet, daneben liegen die offenen Streams.

- **Viele Tabs:** Die Tabs werden schmaler, bis sie nicht mehr passen – dann mit dem **Mausrad** über der Leiste oder den Pfeilen **‹ ›** seitwärts scrollen. Der aktive Tab wird immer ins Bild geholt.
- **Liste aller Tabs:** Das Listen-Symbol rechts (mit Anzahl) oder **Strg+K** öffnet eine Liste aller offenen Tabs mit Suche. Mit ↑↓ wählen, **Enter** öffnen, **Entf** schließen; unten „Alle Tabs schließen“.
- **Umsortieren:** Tabs mit der Maus an eine andere Stelle ziehen.
- **Rechtsklick** auf einen Tab: neu laden, stumm schalten, im Browser öffnen, nach ganz links/rechts, schließen, andere schließen, rechts davon schließen, Offline-Streams schließen, alle schließen.
- **Mittelklick** schließt einen Tab.

### Ton nur aus einem Tab

Es ist immer nur **ein** Stream zu hören – der, den du gerade ansiehst. Alle anderen laufen stumm weiter (du zählst dort trotzdem als Zuschauer und sammelst Kanalpunkte).

- Wechselst du zu einem anderen Stream-Tab, wandert der Ton mit.
- Auf *Übersicht* oder *Giveaways* läuft der Ton des zuletzt angesehenen Streams weiter.
- Der hörbare Tab hat ein lila **Lautsprecher-Symbol** und ist unterstrichen. **Strg+M** schaltet ihn stumm; beim nächsten Tab-Wechsel ist der Ton wieder da.
- Lautsprecher an einem anderen Tab (beim Drüberfahren) oder Rechtsklick → **Ton hierher holen**: Ton kommt aus diesem Tab, ohne dass du hinwechselst.
- Abschaltbar in den Einstellungen (*Ton nur aus einem Tab*) – dann hat wieder jeder Tab seinen eigenen Stumm-Schalter.

| Kürzel | Wirkung |
|---|---|
| Strg+Tab / Strg+Bild↓ | nächster Tab |
| Strg+Umschalt+Tab / Strg+Bild↑ | vorheriger Tab |
| Strg+1 … Strg+8 | Tab Nr. 1–8 (1 = Übersicht, 2 = Giveaways) |
| Strg+9 | letzter Tab |
| Strg+W | Tab schließen |
| Strg+Umschalt+T | zuletzt geschlossenen Tab wieder öffnen (an alter Stelle) |
| Strg+M | aktiven Stream stumm / laut (bzw. Ton hierher holen) |
| Strg+R / F5 | aktiven Tab neu laden |
| Strg+K / Strg+Umschalt+A | Liste aller Tabs |
| Strg+B | Twitch-Benachrichtigungen |
| Alt+1 … Alt+9 | Favorit Nr. 1–9 |
| Alt+→ / Alt+← | nächster / vorheriger Favorit (live oder offen) |
| Strg+D | aktiven Stream zum Favoriten machen / entfernen |
| Strg+Umschalt+R | Aufnahme starten / beenden (nur Mod-Kanäle) |

Die Kürzel funktionieren auch, wenn gerade der Player oder Chat angeklickt ist.

## Stream-Ansicht

Ein Stream-Tab zeigt nur den **Twitch-Player** und rechts daneben den **Twitch-Chat** – ohne Menüs, Empfehlungen und Kanalinfos.

- Die Chat-Breite lässt sich am Trenner zwischen Player und Chat verstellen (Doppelklick: Standardbreite); sie gilt für alle Tabs.
- Das Sprechblasen-Symbol rechts in der zweiten Leiste blendet den Chat aus und wieder ein. Kanalpunkte werden auch bei ausgeblendetem Chat weiter abgeholt.
- Wer lieber die vollständige Twitch-Seite hat: Einstellungen → *Ganze Twitch-Seite zeigen statt nur Stream und Chat*.
- Mod-Ansicht und Stream-Manager zeigen weiterhin die jeweilige Twitch-Seite.
- Chat und alle Twitch-Seiten in Kanalwache erscheinen immer im **Dark Mode**.
- **Als Zuschauer gezählt** wirst du, solange der Player läuft – er ist Twitchs eigener Popout-Player, angemeldet mit deinem Account. Stummschalten oder ein Tab im Hintergrund ändern daran nichts. Ist der Player pausiert, zeigt der Tab statt des roten Live-Punkts ein orangefarbenes **⏸**; ein Klick darauf setzt die Wiedergabe fort.

## Aufnahme (nur Mod-Kanäle)

In Kanälen, in denen du **Moderator** bist, gibt es rechts in der zweiten Leiste den Knopf **● Aufnehmen**. In allen anderen Kanälen (und in deinem eigenen) gibt es ihn nicht – Kanalwache prüft den Mod-Status auch beim Start der Aufnahme noch einmal.

- Aufgenommen werden Bild und Ton des Players (bis 1080p, 30 Bilder/s) als **MP4 (H.264)**. Die Datei wird laufend geschrieben, auch sehr lange Aufnahmen belegen keinen Arbeitsspeicher.
- Während der Aufnahme zeigt der Knopf Laufzeit und Dateigröße, der Tab ein rotes **REC**. Ein Klick (oder **Strg+Umschalt+R**, oder Rechtsklick → *Aufnahme beenden*) beendet und speichert; die Meldung danach hat einen Knopf **Im Ordner zeigen**.
- Die Aufnahme läuft weiter, wenn du andere Tabs ansiehst, der Tab stumm ist (Ton kommt trotzdem mit) oder das Fenster im Infobereich liegt.
- Sie endet automatisch und wird gespeichert, wenn der Stream offline geht, du den Tab schließt (mit Rückfrage), in die Mod-Ansicht wechselst oder Kanalwache beendest.
- Mehrere Kanäle gleichzeitig aufnehmen geht – kostet aber entsprechend Rechenleistung und Platz.
- **Einstellungen → Aufnahmen**: Zielordner (Standard: `Videos\Kanalwache`) und Qualität (Hoch 8 Mbit/s ≈ 3,6 GB/Std., Mittel 5 Mbit/s, Niedrig 2,5 Mbit/s).
- Dateiname: `kanal_JJJJ-MM-TT_hh-mm-ss.mp4`.
- Aufgenommen wird, was im Player zu sehen ist – also auch eingeblendete Player-Bedienelemente, wenn die Maus gerade darüber ist.
- Die Inhalte gehören dem Streamer: Aufnahmen nur mit seinem Einverständnis nutzen oder veröffentlichen.

## Gefolgte Kanäle

Nach der Anmeldung holt **Gefolgte Kanäle übernehmen …** (unter der Kanalliste, im Willkommensbildschirm oder in den Einstellungen) die Liste aller Kanäle, denen du auf Twitch folgst.

- Alle neuen Kanäle sind vorausgewählt; mit Suche, **Alle** und **Keine** stellst du die Auswahl zusammen. Kanäle, die schon in deiner Liste sind, bleiben unverändert.
- Für die übernommenen Kanäle legst du fest, ob du benachrichtigt wirst (Standard: ja) und ob automatisch zugeschaut wird (Standard: nein – sonst gehen bei vielen Follows sehr viele Tabs auf). Pro Kanal lässt sich das danach wie gewohnt mit Glocke und Auge ändern.
- **Automatisch abgleichen** (Standard: an): Alle 10 Minuten kommen neue Follows dazu, und Kanäle, denen du nicht mehr folgst, verschwinden wieder – aber nur die, die über den Abgleich gekommen sind. Selbst hinzugefügte Kanäle bleiben immer.
- Kanäle, die du beim Übernehmen abwählst oder später entfernst, merkt sich der Abgleich und fügt sie nicht wieder hinzu. Fügst du so einen Kanal von Hand hinzu, ist er wieder normal dabei.
- Bei vielen Kanälen erscheint über der Liste ein **Filterfeld**, und die Offline-Kanäle lassen sich mit **Offline · N** einklappen. In der Übersicht werden zuerst 30 Offline-Kanäle gezeigt.

## Raids

Raidet einer deiner Kanäle am Streamende einen anderen, blendet Kanalwache unten rechts eine **Raid-Karte** ein – „PixelPaula raidet KanalEins“ – mit zwei Knöpfen:

- **Mitraiden**: Kanalwache sagt Twitch Bescheid (Knopf im Raid-Banner) und **wartet, bis der Raid durch ist**: Erst wenn im Chat des raidenden Kanals Twitchs Abschluss-Zeile kommt („… hat … geraidet“ / „… weitergeleitet“), öffnet sich der geraidete Kanal als neuer Tab (mit Ton) und der Tab des Raiders schließt sich. Bis dahin steht auf der Karte „Mitraiden zugesagt“ mit **Jetzt wechseln** und **Abbrechen**. Wird der Abschluss nicht erkannt, wechselt Kanalwache spätestens nach 2½ Minuten oder sobald der Tab des Raiders zugeht. Ist der Raid beim Klick schon durch (Karte *Raid abgeschlossen*), wird sofort gewechselt.
- **Nicht mitraiden**: Karte schließen; gibt es im Raid-Banner einen „Verlassen“-Knopf, wird er gedrückt.

Die Karte bleibt **3 Minuten** stehen (beim Drüberfahren hält der Balken an) – ist das Fenster gerade nicht im Vordergrund, kommt zusätzlich eine Windows-Benachrichtigung.

Erkannt wird ein Raid auf drei Wegen:

1. **Raid-Banner im Chat** eines offenen Streams: Twitch zeigt beim Raid ein Banner mit Zielkanal und Countdown – Kanalwache schaut alle 2,5 Sekunden danach.
2. **Abschluss-Zeile im Chat**: Ist der Raid durch, schreibt Twitch eine Zeile in den Chatverlauf („PixelPaula hat KanalEins mit 87 Zuschauern geraidet“, „… has raided …“, „Ihr werdet zu … weitergeleitet“). Dann erscheint die Karte als *Raid abgeschlossen*. Twitchs Ansage „PixelPaula raidet jetzt KanalEins …“ zählt dagegen noch nicht als Abschluss – dann kommt die normale Raid-Karte. Berücksichtigt werden nur Systemzeilen von Twitch ohne Absender – schreibt ein Zuschauer „Raid zu X“, passiert nichts; eingehende Raids („NachtEule raidet mit 12 Zuschauern“) werden ebenfalls ignoriert.
3. **Ansage im Chat**: Schreiben Streamer, Mod oder Bot etwa „Wir raiden jetzt @kanal“ und geht der Kanal danach offline, erscheint die Karte als *Raid (vermutlich)*. Das funktioniert auch für Lieblingskanäle ohne offenen Tab, solange der Giveaway-Helfer den Chat mitliest. Danksagungen für eingehende Raids („Danke für den Raid!“) werden ignoriert.

Abschalten lässt sich das in den Einstellungen unter *Raids*.

## Moderation

Kanalwache erkennt automatisch, auf welchen deiner Kanäle du Moderator bist – über deinen Twitch-Login und zusätzlich über den Chat, sobald der Kanal live ist.

- In der Seitenleiste steht bei diesen Kanälen ein grünes **🛡 Mod**, in der Übersicht hat die Live-Karte einen **Mod**-Knopf.
- Rechts in der zweiten Leiste schaltet **Zuschauer | Mod-Ansicht** um. Die Mod-Ansicht ist Twitchs eigene Moderator-Oberfläche mit Chat, Mod-Aktionen, Nutzer-Infos, AutoMod-Warteschlange und Aktivitäts-Feed – alle Moderations-Werkzeuge, die Twitch bietet.
- Mit dem **Schild-Symbol** am Kanal (erscheint beim Drüberfahren) legst du fest, dass der Kanal beim Live-Gehen gleich in der Mod-Ansicht geöffnet wird – zusammen mit dem Augen-Symbol.
- Für deinen **eigenen Kanal** (wenn du mit diesem Account angemeldet bist) gibt es statt der Mod-Ansicht **Zuschauer | Stream-Manager**.
- Wird ein Mod-Status nicht erkannt, hilft es meist, den Kanal einmal zu öffnen, während er live ist.

## Benutzung

1. Unter [Releases](https://github.com/areadox/Kanalwache/releases) die neueste Version herunterladen: `Kanalwache-x.y.z-portable.exe` einfach starten (keine Installation nötig) oder `Kanalwache-Setup-x.y.z.exe` installieren.
2. Oben links **Bei Twitch anmelden**.
3. Unter *Mein Kanal* deinen Kanalnamen festlegen, darunter Lieblingskanäle hinzufügen – Name, `@Name` oder `twitch.tv/…`-Link funktionieren – oder mit **Gefolgte Kanäle übernehmen …** alle Follows auf einmal holen.
4. Beim Auge-Symbol festlegen, bei welchen Kanälen du automatisch zuschauen willst.

Einstellungen und Login liegen unter `%APPDATA%\Kanalwache`.

## Updates

Kanalwache sucht beim Start und danach alle 6 Stunden auf GitHub nach einer neuen Version (abschaltbar unter Einstellungen → *Updates*, dort auch **Jetzt nach Updates suchen** und die aktuelle Versionsnummer).

- **Installierte Version** (`Kanalwache-Setup-x.y.z.exe`): Das Update wird im Hintergrund geladen; links unten erscheint **„Update x.y.z ist bereit – Jetzt neu starten“**. Ohne Klick wird es beim nächsten Beenden installiert. Im Infobereich-Menü gibt es dafür ebenfalls einen Eintrag.
- **Portable Version**: Eine laufende `.exe` kann sich nicht selbst ersetzen. Links unten erscheint **„Kanalwache x.y.z ist da – Herunterladen“**; der Knopf lädt die neue portable `.exe` über den Browser.
- **Was ist neu?** öffnet die Release-Seite mit allen Änderungen.

Die Update-Funktion gibt es ab Version 0.0.8 – ältere Versionen müssen einmal von Hand aktualisiert werden.

## Hinweise

- Der Live-Status kommt über dieselbe Schnittstelle, die auch twitch.tv selbst nutzt – dafür ist kein eigener API-Schlüssel nötig. Fällt sie aus, wertet Kanalwache die Kanalseite direkt aus.
- Jeder Kanal wird von dir genau einmal mit deinem echten Account angeschaut. Kanalwache erzeugt keine zusätzlichen Zuschauer.
- Für den Chat nutzt Kanalwache deinen Twitch-Login aus der App. Wird er dafür nicht angenommen, liest Kanalwache anonym weiter mit; Teilnehmen geht dann erst nach Ab- und wieder Anmelden.
- „Mit Google anmelden“ blockiert Google in eingebetteten Fenstern oft. Melde dich dann mit Twitch-Benutzername und Passwort an.

## Releases

Releases entstehen nur auf Ansage: Der Workflow `.github/workflows/release.yml` läuft, wenn `main` auf den Branch `release` übernommen wird (oder von Hand über **Actions → Release → Run workflow**). Er prüft, ob die Version aus `package.json` schon als Tag existiert; ist sie neu, baut GitHub Actions unter Windows den Installer und die portable `.exe` und veröffentlicht sie als Release `vX.Y.Z` (dazu `latest.yml` und `.blockmap` für die Update-Funktion der installierten Version) – mit der Commit-Nachricht als Beschreibung. Normale Pushes auf `main` veröffentlichen nichts.

### Release-Meldung an Discord

Nach jedem neuen Release postet der Workflow eine Meldung in einen Discord-Kanal: Version, Änderungen (aus der Commit-Nachricht) und direkte Download-Links für die portable `.exe` und den Installer.

Einrichten (einmalig):

1. In Discord: **Servereinstellungen → Integrationen → Webhooks → Neuer Webhook**, Kanal wählen, **Webhook-URL kopieren**.
2. Auf GitHub im Repo: **Settings → Secrets and variables → Actions → New repository secret**, Name `DISCORD_WEBHOOK_URL`, als Wert die kopierte URL.

Ohne dieses Secret wird einfach keine Meldung gesendet. Zum Ausprobieren oder um eine Meldung erneut zu schicken: **Actions → Release → Run workflow**, Haken bei *Nur die Discord-Meldung für die aktuelle Version (erneut) senden*.

## Selbst bauen

Voraussetzung: Node.js 20 oder neuer.

```bash
npm install
npm start          # kompilieren und starten
npm run dist:win   # Installer + portable .exe nach release/ (unter Windows)
```

Aufbau:

| Datei | Inhalt |
|---|---|
| `src/main.ts` | Hauptprozess: Fenster, Tray, Abfrage-Schleife, Benachrichtigungen, Login-Erkennung |
| `src/twitch.ts` | Live-Status, Mod-Status und gefolgte Kanäle abfragen |
| `src/chat.ts` | Twitch-Chat (IRC über WebSocket): mitlesen, schreiben, Rückmeldungen |
| `src/giveaway.ts` | Giveaway-Erkennung (Start, Teilnehmer, Ende, Gewinner) |
| `src/raid.ts` | Raid-Ansagen im Chat erkennen |
| `src/rules.ts` | Erkennungswörter: Standardlisten, Prüfung, Umwandlung in Suchmuster |
| `src/updater.ts` | Update-Funktion (Installer: electron-updater, portabel: Prüfen + Download-Link) |
| `src/recorder.ts` | Aufnahmen stückweise auf die Platte schreiben |
| `src/notifications.ts` | Twitch-Benachrichtigungen (Glocke) abrufen |
| `src/store.ts` | Einstellungen und Kanalliste (JSON) |
| `src/preload.ts` | Brücke zwischen Oberfläche und Hauptprozess |
| `src/renderer/` | Oberfläche (Seitenleiste, Übersicht, Giveaways, Erkennungswörter, Tabs mit Mod-Ansicht, Kanalpunkte, Einstellungen) |

## Lizenz

Copyright © 2026 areadox

Kanalwache ist freie Software: Du kannst sie unter den Bedingungen der **GNU General Public License, Version 3** oder (nach deiner Wahl) jeder späteren Version, wie von der Free Software Foundation veröffentlicht, weitergeben und/oder verändern. Wer eine veränderte Version weitergibt, muss sie ebenfalls unter der GPL samt Quellcode weitergeben.

Kanalwache wird in der Hoffnung verbreitet, dass es nützlich ist, aber **ohne jede Gewährleistung** – sogar ohne die implizite Gewährleistung der Marktfähigkeit oder Eignung für einen bestimmten Zweck. Den vollständigen Lizenztext findest du in der Datei [`LICENSE`](LICENSE).

Kanalwache ist ein privates Projekt und steht in keiner Verbindung zu Twitch; „Twitch“ ist eine Marke von Twitch Interactive, Inc.
