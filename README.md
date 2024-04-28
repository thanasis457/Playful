# <img src="icons/app.png" align="left" width="114"/> Playful for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

## Screenshots
![](https://i.imgur.com/fIKt0BV.png)
![Imgur](https://i.imgur.com/mLmM4ad.png)

## Installing

The easiest way to get running is to head to [Releases](https://github.com/thanasis457/Playful/releases) and download the package for your platform.

### For reference:

MacOS Intel (x64): Playful-darwin-x64-[version].zip  
MacOS Apple Silicon (arm64): Playful-darwin-arm64-[version].zip (ARM no longer supported since I do no longer own an ARM equipped Mac. You can build your own distributable, though, using the instructions provided)

## Running from source

The app provides two ways to access Spotify playback info. Either through your local Spotify player or through the official Spotify Web Api (using Spotify Connect). For the first option no additional steps are needed and you can go straight to "Steps to run from source". <b>To set up the Web API you need to do the following</b>

You need to provide your own app credentials. All the details can be found in Spotify's [official docs](https://developer.spotify.com/documentation/web-api/) but here are all the steps to get you started.

### Steps to set up everything you need

1. Head to [Spotify's Dev Dashboard](https://developer.spotify.com/dashboard)

2. Create a new Spotify App and add any other info you want to include (such as name and description)

3. Open the App and click on "Edit Setting"

4. Add http://localhost:8080/ as a Redirect URI

5. Copy and paste the client_id and client_secret (found on the top left of the dashboard) into `sensitive.json`

Done!  
Now time to run the app

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

- Support for Linux/Windows: This app is actually ready to build for Linux and Windows environments. However, neither provide an easy way to access the system's menu bar/tray and set text (to show the current song). They only allow the showing of icons. Should I find any way to go around this I'll update the project.
