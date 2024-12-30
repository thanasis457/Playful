# <img src="icons/app.png" align="left" width="114"/> Playful for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

## Screenshots
![](https://i.imgur.com/BdrgnC2.png)
![](https://i.imgur.com/gKByqAQ.jpeg)
![Imgur](https://i.imgur.com/mLmM4ad.png)

The Desktop widget is an added feature that shows the currently playing song, has basic media controls, and stays on top of any application you are using.
**Disabled by default**.

## Installing

The easiest way to get running is to head to [Releases](https://github.com/thanasis457/Playful/releases) and download the package for your platform.

### For reference:

MacOS Intel (x64): Playful-darwin-x64-[version].zip  
MacOS Apple Silicon (arm64): Playful-darwin-arm64-[version].zip (ARM no longer supported since I do no longer own an ARM equipped Mac. You can build your own distributable, though, using the instructions provided)

## Building from source

The app provides access Spotify playback info through the native MacOS APIs. However, a song's album cover is obtained either through your local Spotify player or through the official Spotify Web Api (using Spotify Connect). For the first option no additional steps are needed and you can go straight to "Steps to run from source". <b>To set up the Web API you need to do the following:</b>

You need to provide your own app credentials. All the details can be found in Spotify's [official docs](https://developer.spotify.com/documentation/web-api/) but here are all the steps to get you started.

### Steps to set up everything you need

1. Head to [Spotify's Dev Dashboard](https://developer.spotify.com/dashboard)

2. Create a new Spotify App and add any other info you want to include (such as name and description)

3. Open the App and click on "Edit Setting"

4. Add http://localhost:8080/ as a Redirect URI

5. Copy and paste the client_id (found on the top left of the dashboard) into `sensitive.json`

Done!  
Now time to run the app

### Pre-Requirements:

You need to have installed on your system:
1. The `swift compiler` (through xcode's dev tools)
2. `CMake` (and be accessible from the terminal)

### Steps to run from source:

1. `git clone https://github.com/thanasis457/Playful`
2. `cd Playful`
3. `npm i`
4. `npm start`


### Buidling a distributable

If you want to make your own distributable version of the app (.dmg files), run:
`npm run make`  
This will create a folder named `out`. At the path `out/make/zip/darwin/` you will find a zip file. This is your distributable.

### Notes

- Running from source requires you to set up your own Spotify App for security reasons.
Installing from the prepackaged releases, however, works fully out-of-the-box.

- The App icons are not mine. They are provided by Icons8 and can be found [here](https://icons8.com/icon/116726/spotify)

- Support for Linux/Windows: Every platform has its own internal media playback system. Since Electron does not offer this integration, I would have to redo all the work for new platforms. It was a already a big challenge to get the MacOS playback information. Maybe in the future I might consider expanding to other OSes.

## [Playful-Connect](https://github.com/thanasis457/Playful-Connect)

Playful now has an Android companion app. See your currently playing Spotify song on a lightweight and minimal app, designed to make your phone into an elegant mini-canvas.

Download Playful-Connect [here](https://github.com/thanasis457/Playful-Connect)
