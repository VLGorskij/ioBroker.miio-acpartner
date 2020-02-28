![Logo](admin/mihome-vacuum.png)
# ioBroker mihome-vacuum adapter
=================

[![NPM version](http://img.shields.io/npm/v/iobroker.mihome-vacuum.svg)](https://www.npmjs.com/package/iobroker.mihome-vacuum)
[![Downloads](https://img.shields.io/npm/dm/iobroker.mihome-vacuum.svg)](https://www.npmjs.com/package/iobroker.mihome-vacuum)
[![Tests](https://travis-ci.org/ioBroker/ioBroker.mihome-vacuum.svg?branch=master)](https://travis-ci.org/ioBroker/ioBroker.mihome-vacuum)

[![NPM](https://nodei.co/npm/iobroker.mihome-vacuum.png?downloads=true)](https://nodei.co/npm/iobroker.mihome-vacuum/)

[Deutsche beschreibung hier](README_de.md)

This adapter allows you control the Xiaomi vacuum cleaner.

## Content
- [Setup](#configuration)
    - [with Android](#on-android)
    - [with iOS](#for-ios)
    - [Configure Adapter](#adapter-configuration)
        - [Control via Alexa](#control-over-alexa)
        - [Second robot](#second-robot)
- [Functions](#functions)
    - [S50 Commands](#commands-of-the-s50)
    	- [Go To](#goto)
	- [zone Clean](#zoneclean)
    - [Own Commands](#send-your-own-commands)
    - [sendTo hook](#send-custom-commands-with-sendto)
- [widget](#widget)
- [bugs](#bugs)
- [Changelog](#changelog)
 
## Configuration
Currently, finding the token is the biggest problem.
The following procedures can be used:

### Easy token discovery on Android
Just uninstall official MiHome App and install this one from [this page(russian)](http://www.kapiba.ru/2017/11/mi-home.html): 
- [Link APK](https://cloud.mail.ru/public/55AA/RF3DYidFf/MiHome_5.1.30_vevs.apk) or [Mirror](https://drive.google.com/open?id=1IyjvIWiGaeD7iLWWtBlb6jSEHTLg9XGj)

After installation and login with the same settings as by officiall app, you will find the token in the "Network information" for the device.

### On Android
Preparation:
An Android smartphone with ready-made MiHome app is required. The teat must be added and fitted in it.

Non-Rooted Android Phones
- Download and unzip the [MiToolkit](https://github.com/ultrara1n/MiToolkit/releases) and start MiToolkit.exe.
- Enable USB debugging in the smartphone settings ([video](https://www.youtube.com/watch?v=aw7D6bNgI1U))
- Connect the smartphone to the PC using a USB cable.
- In the MiToolkit click on "Check connection" and if necessary test the Java installation, both tests should run fault-free.
- Click on "Read token" and confirm the message on the smartphone (NO give password!).

On the smartphone the MiHome app should be opened (automatically) and a backup to the PC should be taken (should take a few seconds), the program then reads the token from the MiHome database (miio2.db).
Now look for the rockrobo.vacuum in the open window and copy the 32-digit token and enter it in the configuration window.

Rooted Android Phones
- You must use MiHome app 4.xx-5.029. Higher versions of the Mihome application do not contain a token in database.
- Install [aSQLiteManager](https://play.google.com/store/apps/details?id=dk.andsen.asqlitemanager) on your phone with MiHome app
- Made copy /data/data/com.xiaomi.smarthome/databases/miio2.db
- Open copy of miio2.db with aSQLiteManager and execute the query "select token from devicerecord where localIP is '192.168.89.100'" where you replace the IP address 192.168.89.100 with the IP address of the Xiaomi vacuum cleaner. Copy the 32-digit token and enter it in the configuration window.

### For iOS

With Jailbreak:
- If the token is found at /var/mobile/Containers/Data/Application/514106F3-C854-45E9-A45C-119CB4FFC235/Documents/USERID_mihome.sqlite

Without Jailbreak:
- First read the required token via iPhone backup
- To do this, first set up the xiaomi on your  iPhone
- Create a backup with iTunes or 3utools
- Then install the [iphonebackupviewer](http://www.imactools.com/iphonebackupviewer/)
- go to the Tree View (top right)
- go to the path AppDomain-com.xiaomi.mihome\Documents\
- download the file xxxxxxxxxx_mihome.sqlite
-If the file / folder is not found, backup with iTunes instead of using 3utools
- Open these with [DB Browser for SQLite](https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.10.1/SQLiteDatabaseBrowserPortable_3.10.1_English.paf.exe)
- The 96-digit hex key can be found under Browse Data  Table ZDEVICE  in the right-most column ZTOKEN
- The 96-digit Hex Key must now be converted to a 32-digit key
- Enter the following via the [link](http://aes.online-domain-tools.com/) here
- Input type: Text
- Input text: the 96-digit key
- Hex
- Autodetect: ON
- Function: AES
- Mode: ECB (electronic codebook)
- Key: 00000000000000000000000000000000 * must be 32 digits
- Hex
- Now click on Decrypt and remove the 32-digit key from the decrypted text at the far right


### Adapter Configuration
- For IP address, the IP address of the robot must be entered in the format "192.168.178.XX"
- The port of the robot is set to "54321" by default, this should not be changed
- Own port, should only be changed with second robot
- Query Interval The time in ms in which the robot's status values are retrieved (should not be <10000)

#### Control over Alexa
In the config add alexa state is activated here is a hack is set an additional state "clean_home" it is a switch which starts at "true" the sucker and at "false" it goes home, it becomes automatically a smart device in the cloud Adapter created with the name "vacuum cleaner", which can be changed in the cloud adapter.

#### Resume paused zonecleaning with start button
With this option enabled, the Vacuum will resume the zonecleaning when setting the "start" state to true if it was paused during a running zoneclean.
If this option is disabled, the vacuum will start a new "normal cleaning" when you send the start command, even if it was paused during a running zoneclean.


- Experimental: Using the checkbox "Send your own commands" objects are created, via which you can send and receive your own commands to the robot.

#### Second robot
If two robots are to be controlled via ioBroker, two instances must be created. The second robot must change its own port (default: 53421) so that both robots have different ports.

## Functions
### Commands of the S50 (second generation)
The card size is always 52000mm x 52000mm thus values ​​from 0 to 51999mm are possible.
Unfortunately, the position and location of the card can not be queried, this can change from suction to suction. Used as a basis is always the last suction card, as well as in the app.
If the robot only picks up one area and always builds the map the same way, you can reliably send it to places or have the area vacuumed.

#### GoTo
In order to drive the vacuum cleaner to a point, the "goTo" object must be filled as follows:
```
xVal, yval
```
The values ​​must satisfy the above scope and indicate the x and y coordinates on the map.

Example:
```
24,850.26500
```


#### zoneClean
To vacuum a zone, ZoneClean must be filled as follows:
```
[X1, y1, x2, x2, count]
```
Where x and y are the coordinates of the rectangular area and "count" the cleaning operations.
You can also let several areas suck at once:

```
[X1, y1, x2, x2, count], [x3, y3, x4, x4, count2]
```

Example:
```
[24117,26005,25767,27205,1], [24320,24693,25970,25843,1]
```
 
### Send your own commands
NOTE: This function should only be used by experts, as the sucker might be damaged by wrong commands

The robot distinguishes between the commands in methods (methods) and parameters (params) which serve to specify the methods.
Under the object "mihome-vacuum.X.control.X_send_command" you can send your own commands to the robot.
The object structure must look as follows: method; [params]

Under the object "mihome-vacuum.X.control.X_get_response", the response is entered by the robot after sending. If parameters were queried, they appear here in the JSON format. If only one command was sent, the robot responds only with "0".

The following methods and parameters are supported:

| method          | params                                                              | Beschreibung                                                                                           |
|-----------      |-------                                                              |-------------------                                                                                     |
| get_timer       |                                                                     | Returns the set timerSetting the suction times BSp. 12 o'clock 30 in 5 days                            |
| set_timer       | [["TIME_IN_MS",["30 12 * * 1,2,3,4,5",["start_clean",""]]]]         | Enable / disable timer                                                                                 |
| upd_timer       | ["1481997713308","on/off"]                                          |                                                                                                        |
|                 |                                                                     | Rescues the times of the Do Not Distrube                                                               |
| get_dnd_timer   |                                                                     | Delete DND times                                                                                       |
| close_dnd_timer |                                                                     | DND Setting h, min, h, min                                                                             |
| set_dnd_timer   | [22,0,8,0]                                                          |                                                                                                        |
|                 |                                                                     |                                                                                                        |
| app_rc_start    |                                                                     | Start Romote Control                                                                                   |
| app_rc_end      |                                                                     | Finish Remote Control                                                                                  |
| app_rc_move     |[{"seqnum":'0-1000',"velocity":VALUE1,"omega":VALUE2,"duration":VALUE3}]| Move. Sequence number must be continuous, VALUE1 (speed) = -0.3-0.3, VALUE2 (rotation) = -3.1-3.1, VALUE3 (duration)


more methods and parameters you can find here ([Link](https://github.com/MeisterTR/XiaomiRobotVacuumProtocol)).

### Send custom commands with sendTo
You can also send those custom commands from other adapters with `sendTo`. Usage with `method_id` and `params` as defined above:
```
sendTo("mihome-vacuum.0", "sendCustomCommand", 
    {method: "method_id", params: [...] /* optional*/}, 
    function (response) { /* do something with the result */}
);
```
The `response` object has two properties: `error` and (if there was no error) `result`.

A couple of predefined commands can also be issued this way:
```
sendTo("mihome-vacuum.0", 
    commandName, 
    {param1: value1, param2: value2, ...}, 
    function (response) { /* do something with the result */}
);
```
The supported commands are:

| Description | `commandName` | Required params | Remarks |
|---|---|---|---|
| Start the cleaning process | `startVacuuming` | - none - |  |
| Stop the cleaning process | `stopVacuuming` | - none - |  |
| Pause the cleaning process | `pause` | - none - |  |
| Clean a small area around the robot | `cleanSpot` | - none - |  |
| Go back to the base | `charge` | - none - |  |
| Say "Hi, I'm over here!" | `findMe` | - none - |  |
| Check status of consumables (brush, etc.) | `getConsumableStatus` | - none - |  |
| Reset status of consumables (brush, etc.) | `resetConsumables` | - none - | Call signature unknown |
| Get a summary of all previous cleaning processes | `getCleaningSummary` | - none - |  |
| Get a detailed summary of a previous cleaning process | `getCleaningRecord` | `recordId` |  |
| Get a map | `getMap` | - none - | Unknown what to do with the result |
| Get the current status of the robot | `getStatus` | - none - |  |
| Retrieve the robot's serial number | `getSerialNumber` | - none - |  |
| Get detailed device information | `getDeviceDetails` | - none - |  |
| Retrieve the *do not disturb* timer | `getDNDTimer` | - none - |  |
| Set a new *do not disturb* timer | `setDNDTimer` | `startHour`, `startMinute`, `endHour`, `endMinute` |  |
| Delete the *do not disturb* timer | `deleteDNDTimer` | - none - |  |
| Retrieve the current fan speed | `getFanSpeed` | - none - |  |
| Set a new fan speed | `setFanSpeed` | `fanSpeed` | `fanSpeed` is a number between 1 and 100 |
| Start the remote control function | `startRemoteControl` | - none - |  |
| Issue a move command for remote control | `move` | `velocity`, `angularVelocity`, `duration`, `sequenceNumber` | Sequence number must be sequentially, Duration is in ms |
| End the remote control function | `stopRemoteControl` | - none - |  |

## Widget
Sorry, not yet finished.
![Widget](widgets/mihome-vacuum/img/previewControl.png)

## Bugs
- occasional disconnections, however, this is not due to the adapter but mostly on its own networks
- Widget at the time without function

## Changelog
### 1.1.5 (2018-09-02)
* (BuZZy1337) Added description for Status 16 and 17 (goTo and zonecleaning).
* (BuZZy1337) Added setting for automatic resume of paused zonecleaning.

### 1.1.4 (2018-08-24)
* (BuZZy1337) Added possibility to resume a paused zoneclean (State: mihome-vacuum.X.control.resumeZoneClean)

### 1.1.3 (2018-07-11)
* (BuZZy1337) fixed zoneCleanup state not working (vacuum was only leaving the dock, saying "Finished ZoneCleanup", and returned immediately back to the dock)

### 1.1.2 (2018-07-05)
* (BuZZy1337) fixed detection of new Firmware / Second generation Vacuum

### 1.1.1 (2018-04-17)
* (MeisterTR) error catched , added states for new fw

### 1.1.0 (2018-04-10)
* (mswiege) Finished the widget

### 1.0.1 (2018-01-26)
* (MeisterTR) ready for admin3
* (MeisterTR) support SpotClean and voice level (v1)
* (MeisterTR) support second generation (S50)
* (MeisterTR) Speed up data requests

### 0.6.0 (2017-11-17)
* (MeisterTR) use 96 char token from Ios Backup
* (MeisterTR) faster connection on first use

### 0.5.9 (2017-11-03)
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
