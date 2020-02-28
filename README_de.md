![Logo](admin/mihome-vacuum.png)

ioBroker mihome-vacuum adapter
=================

[![NPM version](http://img.shields.io/npm/v/iobroker.mihome-vacuum.svg)](https://www.npmjs.com/package/iobroker.mihome-vacuum)
[![Downloads](https://img.shields.io/npm/dm/iobroker.mihome-vacuum.svg)](https://www.npmjs.com/package/iobroker.mihome-vacuum)
[![Tests](https://travis-ci.org/ioBroker/ioBroker.mihome-vacuum.svg?branch=master)](https://travis-ci.org/ioBroker/ioBroker.mihome-vacuum)

[![NPM](https://nodei.co/npm/iobroker.mihome-vacuum.png?downloads=true)](https://nodei.co/npm/iobroker.mihome-vacuum/)

This adapter allows you control the Xiaomi vacuum cleaner.

## Inhalt
- [Einrichtung](#konfiguration)
    - [mit Android](#bei-android)
    - [mit iOS](#bei-ios)
    - [Adapter konfigurieren](#adapterkonfiguration)
        - [Steuerung über Alexa](#steuerung-über-alexa)
        - [Zweiter Roboter](#zweiter-roboter)
- [Funtionen](#funktionen)
    - [S50 Kommandos](#Komandos-des-S50)
	        - [GoTo](#GoTo)
			- [zoneClean](#zoneClean)
    - [Eigene Kommandos](#sende-eigene-kommandos)
    - [sendTo-Hook](#eigene-kommandos-per-sendto-schicken)
- [Widget](#widget)
- [Bugs](#bugs)
- [Changelog](#changelog)

## Konfiguration
Derzeit stellt das Ermitteln des Tokens das größte Problem.
Folgende Vorgehensweisen können genutzt werden:

### Bei Android
Vorbereitung:
Benötigt wird ein Android Smartphone mit fertig eingerichteter MiHome App. Der Sauger muss in dieser hinzugefügt und eingerichtet sein.

- Das [MiToolkit](https://github.com/ultrara1n/MiToolkit/releases) herunterladen, entpacken und die MiToolkit.exe starten.
- USB-Degugging in den Smartphone-Einstellungen einschalten ([video](https://www.youtube.com/watch?v=aw7D6bNgI1U))
- Das Smartphone über ein USB-Kabel mit dem PC verbinden.
- Im MiToolkit auf "Verbindung prüfen" klicken und ggf. die Java Installation testen, beide Tests sollten fehlerfrei verlaufen.
- Auf "Token auslesen" klicken und die Meldung auf dem Smartphone bestätigen (KEIN Passwort vergeben!).

Auf dem Smartphone sollte nun die MiHome App geöffnet werden (automatisch) und ein Backup auf den PC gezogen werden (sollte ein paar Sekunden dauern), das Programm liest dann den Token aus der MiHome Datenbank (miio2.db) aus.
Nun nur in dem geöffneten Fenster nach rockrobo.vacuum suchen und den 32 Stelligen Token kopieren und in dem Konfigurationsfenster eingeben.


### Bei iOS

Mit Jailbreak:
- Findet man den Token unter /var/mobile/Containers/Data/Application/514106F3-C854-45E9-A45C-119CB4FFC235/Documents/USERID_mihome.sqlite

Ohne Jailbreak:
-	Zuerst muss der benötigte Token (über iPhone backup) ausgelesen werden
-	Hierzu zuerst den xiaomi auf dem iPhone einrichten
-	Backup mit iTunes oder 3utools erstellen
-	Anschließend den [iphonebackupviewer](http://www.imactools.com/iphonebackupviewer/) installieren
-	in den Tree View (oben rechts) gehen
-	in den Pfad AppDomain-com.xiaomi.mihome\Documents\ gehen
-	die Datei xxxxxxxxxx_mihome.sqlite herunterladen
-	Sollte die Datei / der Ordner nicht zu finden sein, Backup mit iTunes statt mit 3utools machen
-	Diese mit [DB Browser for SQLite](https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.10.1/SQLiteDatabaseBrowserPortable_3.10.1_English.paf.exe) öffnen
-	Der 96-Stellige Hex Key befindet sich unter Browse Data  Table ZDEVICE  in der Spalte ganz Rechts ZTOKEN
-	Der 96-Stellige Hex Key muss nun in ein 32-Stelligen Key umgewandelt werden 
-	Über den [link](http://aes.online-domain-tools.com/) hier folgendes eintragen (Nur copy/paste, zwischenspeichern kann das Ergenis verfälschen)
-	Input type: Text
-	Input text: der 96-stellige Key
-	Hex
-	Autodetect: ON
-	Function: AES
-	Mode: ECB (electronic codebook)
-	Key: 00000000000000000000000000000000 *muss 32-stellig sein
-	Hex
-	Nun auf Decrypt klicken und den 32-stelligen Key aus dem Decrypted Text ganz rechts entnehmen

### Adapterkonfiguration
- Bei IP-Adresse muss die IP-Adresse des Roboters eingegeben werden im Format "192.168.178.XX"
- Port des Roboters ist Standardmäßig auf "54321" eingestellt, dies sollte nicht verändert werden
- Eigener Port, sollte nur bei zweiten Roboter geändert werden
- Abfrageintervall Ist die Zeit in ms in der die Statuswerte des Roboters abgerufen werden (sollte nicht <10000 sein)

#### Steuerung über Alexa
In der Konfig add Alexa state aktivieren, ist hier ein Hacken gesetzt wird ein zusätzlicher State erzeugt "clean_home" es ist ein Schalter der bei "true" den Sauger startet und bei "false" fährt er nach Hause, es wird automatisch ein Smartgerät im Cloud Adapter erzeugt mit dem Namen "Staubsauger", dieser kann im Cloud Adapter geändert werden.

#### Zonenreinigung nach pausierung fortsetzen
Wenn diese Option aktiviert ist, wird die Zonenreinigung durch senden des "start" Kommandos automatisch fortzgesetzt.
Wenn die Option deaktiviert ist, wird durch senden von "start" eine neue Komplettreinigung gestartet, auch wenn der Sauger während einer Zonenreinigung pausiert wurde.

- Experimental: Über den Haken bei "Sende eigene Komandos" werden Objekte angelegt, über die man eigene Kommandos an den Roboter senden und empfangen kann.

#### Zweiter Roboter
Sollen zwei Roboter über ioBroker gesteuert werden, müssen zwei Instanzen angelegt werden. Dabei muss bei dem zweiten Roboter der eigene Port (Default: 53421) geändert werden, damit beide Roboter unterschiedliche Ports besitzen.

## Funktionen

### Komandos des S50 (second Generation)
Die die Kartengröße immer 52000mm x 52000mm somit sind Werte von 0 bis 51999mm möglich.
Leider kann die Position und die und die Lage der Karte nciht abgefragt werden, dieses kann sich von Saugvorgang zu Saugvorgang ändern. Genutzt als basis wird immer die letzte Saugkarte, wie auch in der App.
Saugt der Roboter nur ein Bereich und baut die Karte immer gleich auf, kann man ihn zuverlässig zu Orten schicken oder Bereich eSaugen lassen.

#### GoTo
Um dem Staubsauger zu einem Punkt fahren zu lassen muss das Objekt "goTo" wie folgt befüllt werden:
```
xVal,yVal
```
Die Werte müssen den oben genannten Gültigkeitsbereich erfüllen und geben die x und y Koordinate auf der Karte an.

Beispiel:
```
24850,26500
```


#### zoneClean
Zum Saugen einer Zone muss ZoneClean wie folgt befüllt werden:
```
[x1,y1,x2,x2,count]
```
Wobei x und y die Koordinaten des Rechteckigen Bereiches sind und "count" die Reinigunsvorgänge.
Man kann auch mehrere Bereiche auf einmal saugen lassen:

```
[x1,y1,x2,x2,count],[x3,y3,x4,x4,count2]
```

Beispiel:
```
[24117,26005,25767,27205,1],[24320,24693,25970,25843,1]
```

### Sende eigene Kommandos
HINWEIS: Diese Funktion sollte nur von Experten genutzt werden, da durch falsche Kommandos der sauger zu Schaden kommen könnte

Der Roboter unterscheidet bei den Kommandos in Methoden (method) und Parameter(params) die zur spezifizierung der Methoden dienen.
Under dem Object "mihome-vacuum.X.control.X_send_command" können eigene Kommandos an den Roboter gesendet werden.
Der Objektaufbau muss dabei wiefolgt aussehen: method;[params]

Unter dem Objekt "mihome-vacuum.X.control.X_get_response" wird nach dem Absenden die Antwort vom Roboter eingetragen. Wurden Parameter abgefragt erscheinen sie hier im JSON Format, wurde nur ein Befehl gesendet, antwortet der Roboter nur mit "0".

Folgende Methoden und Parameter werden unterstützt:

| method          | params                                                              | Beschreibung                                                                                           |
|-----------      |-------                                                              |-------------------                                                                                     |
| get_timer       |                                                                     |       liefert den eingestellten Timer zurück                                                           |
| set_timer       | [["ZEIT_IN_MS",["30 12 * * 1,2,3,4,5",["start_clean",""]]]]         |     Einstellen der Saugzeiten BSp. 12 Uhr 30 an 5 Tagen                                                |
| upd_timer       | ["1481997713308","on/off"]                                          |     Timer aktivieren an/aussehen                                                                       |
|                 |                                                                     |                                                                                                        |
| get_dnd_timer   |                                                                     |       Lifert die Zeiten des Do Not Distrube zurück                                                     |
| close_dnd_timer |                                                                     |       DND Zeiten löschen                                                                               |
| set_dnd_timer   |   [22,0,8,0]                                                        |       DND Einstellen h,min,h,min                                                                       |
|                 |                                                                     |                                                                                                        |
|app_rc_start     |                                                                     | Romote Control starten                                                                                 |
|app_rc_end       |                                                                     | Romote Control beenden                                                                                 |
|app_rc_move      |[{"seqnum":'0-1000',"velocity":WERT1,"omega":WERT2,"duration":WERT3}]| Bewegung. Sequenznummer muss fortlaufend sein, WERT1(Geschw.) = -0.3 - 0.3, WERT2(Drehung) = -3.1 - 3.1, WERT3(Dauer)|

Mehr Mehtoden und Parameter können sie hier finden ([Link](https://github.com/MeisterTR/XiaomiRobotVacuumProtocol)).

### Eigene Kommandos per sendTo schicken
Es ist auch möglich, per `sendTo` eigene Kommandos aus anderen Adaptern zu senden. Die Benutzung ist wie folgt:
```
sendTo("mihome-vacuum.0", "sendCustomCommand", 
    {method: "method_id", params: [...] /* optional*/}, 
    function (response) { /* Ergebnis auswerten */}
);
```
mit `method_id` und `params` nach obiger Definition.

Das `response` Objekt hat zwei Eigenschaften: `error` und (sofern kein Fehler aufgetreten ist) `result`.

Eine handvoll vordefinierter Kommandos kann auch folgendermaßen abgesetzt werden:
```
sendTo("mihome-vacuum.0", 
    commandName, 
    {param1: value1, param2: value2, ...}, 
    function (response) { /* do something with the result */}
);
```
Die unterstützten Kommandos sind:

| Beschreibung | `commandName` | Erforderliche Parameter | Anmerkungen |
|---|---|---|---|
| Saugprozess starten | `startVacuuming` | - keine - |  |
| Saugprozess beenden | `stopVacuuming` | - keine - |  |
| Saugprozess pausieren | `pause` | - keine - |  |
| Einen kleinen bereich um den Roboter saugen | `cleanSpot` | - keine - |  |
| Zurück zur Ladestation | `charge` | - keine - |  |
| "Hi, I'm over here!" sagen | `findMe` | - keine - |  |
| Status der Verbrauchsmaterialien prüfen (Bürste, etc.) | `getConsumableStatus` | - keine - |  |
| Status der Verbrauchsmaterialien zurücksetzen (Bürste, etc.) | `resetConsumables` | - keine - | Aufrufsignatur unbekannt |
| Eine Zusammenfassung aller vorheriger Saugvorgänge abrufen | `getCleaningSummary` | - keine - |  |
| Eine detaillierte Zusammenfassung eines Saugvorgangs abrufen | `getCleaningRecord` | `recordId` |  |
| Karte auslesen | `getMap` | - keine - | Unbekannt, was mit dem Ergebnis getan werden kann |
| Aktuellen Status des Roboters auslesen | `getStatus` | - keine - |  |
| Seriennummer des Roboters auslesen | `getSerialNumber` | - keine - |  |
| Detaillierte Geräteinfos auslesen | `getDeviceDetails` | - keine - |  |
| *Nicht-stören*-Timer abrufen | `getDNDTimer` | - keine - |  |
| Neuen *Nicht-stören*-Timer festlegen | `setDNDTimer` | `startHour`, `startMinute`, `endHour`, `endMinute` |  |
| *Nicht-stören*-Timer löschen | `deleteDNDTimer` | - keine - |  |
| Saugstufe abrufen | `getFanSpeed` | - keine - |  |
| Saugstufe festlegen | `setFanSpeed` | `fanSpeed` | `fanSpeed` ist eine Zahl zwischen 1 und 100 |
| Fernsteuerungsfunktion starten | `startRemoteControl` | - keine - |  |
| Bewegungskommando für Fernsteuerung absetzen | `move` | `velocity`, `angularVelocity`, `duration`, `sequenceNumber` | sequenceNumber muss sequentiell sein, Dauer ist in ms |
| Fernsteuerungsfunktion beenden | `stopRemoteControl` | - keine - |  |

## Widget
Zur Zeit leider noch nicht fertig.
![Widget](widgets/mihome-vacuum/img/previewControl.png)

## Bugs
- gelegentliche Verbindungsabbrüche dies liegt jedoch nicht am Adapter sondern meistens am eigenen Netzwerke
- Widget zur Zeit ohne Funktion

## Changelog
### 1.1.5 (2018-09-02)
* (BuZZy1337) Beschreibung für Status 16 and 17 hinzugefügt (goTo und zonecleaning).
* (BuZZy1337) Einstellung für automatische Fortsetzung einer pausierten Zonenreinigung hinzugefügt.

### 1.1.4 (2018-08-24)
* (BuZZy1337) Funktion zum Fortsetzen einer vorher pausierten Zonenreinigung hinzugefügt. (State: mihome-vacuum.X.control.resumeZoneClean)

### 1.1.3 (2018-07-11)
* (BuZZy1337) Fehler im ZoneCleanup state behoben (Roboter fuhr nur kurz von der Ladestation, meldete "Zonecleanup Finished" und fuhr sofort wieder zurück zur Ladestation)

### 1.1.2 (2018-07-05)
* (BuZZy1337) Fehler in Erkennung von neuer Firmware / zweiter Generation Roboter behoben

### 1.1.1 (2018-04-17)
* (MeisterTR) Fehler abgefangen, Objekte für neue fw hinzugefügt

### 1.0.1 (2018-01-26)
* (MeisterTR) ready for admin3
* (MeisterTR) support SpotClean and voice level (v1)
* (MeisterTR) support second generation (S50)
* (MeisterTR) Speed up data requests

### 0.6.0 (2017-11-17)
* (MeisterTR) use 96 char token from Ios Backup
* (MeisterTR) faster connection on first use

### 0.5.9 (2017-09-18)
* (MeisterTR) fix communication error without i-net
* (AlCalzone) add selection of predefined power levels

### 0.5.7 (2017-08-17)
* (MeisterTR) compare system time and Robot time (fix no connection if system time is different)
* (MeisterTR) update values if robot start by cloud

### 0.5.6 (2017-07-23)
* (MeisterTR) add option for crate switch for Alexa control

### 0.5.5 (2017-06-30)
* (MeisterTR) add states, fetures, fix communication errors

### 0.3.2 (2017-06-07)
* (MeisterTR) fix no communication after softwareupdate(Vers. 3.3.9)

### 0.3.1 (2017-04-10)
* (MeisterTR) fix setting the fan power
* (bluefox) catch error if port is occupied

### 0.3.0 (2017-04-08)
* (MeisterTR) add more states

### 0.0.2 (2017-04-02)
* (steinwedel) implement better decoding of packets

### 0.0.1 (2017-01-16)
* (bluefox) initial commit
