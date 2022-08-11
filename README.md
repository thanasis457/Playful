# <img src="icons/app.png" align="left" width="114"/> Playful for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

## Screenshots
![](https://i.imgur.com/3NfLPaD.png)
![Imgur](https://i.imgur.com/THuPqgc.png)

### Playful-Py is a lighter reimplementation you might want to check out
Playful is an ElectronJS app, not the fastest or lightest of the bunch. Playful-Py is a complete rewrite of the app written in Python and with focus on efficiency. If interested head to https://github.com/thanasis457/PlayfulPy

## Installing

The easiest way to get running is to head to Releases and download the package for your platform.

### For reference:

MacOS Intel (x64): Playful-darwin-x64-[version].zip  
MacOS Apple Silicon (arm64): Playful-darwin-arm64-[version].zip (ARM no longer supported since I do not longer own an ARM equipped Mac. You can build your own distributable though using the instructions provided)

## Running from source

To run from the source code you need to provide your own app credentials. All the details can be found in Spotify's [official docs](https://developer.spotify.com/documentation/web-api/) but here are all the steps to get you started.

### Steps to set up everything you need

1. Head to [Spotify's Dev Dashboard](https://developer.spotify.com/dashboard)

2. Create a new Spotify App and add any other info you want to include (such name and description)

3. Open the App an click on "Edit Setting"

4. Add http://localhost:8080/ as a Redirect URI

5. Copy and paste the client_id and client_secret (found on the top left of the dashboard) into `sensitive.json`

Done!  
Now time to run the app

### Steps to run from source (with edited `sensitive.json`):

1. `git clone https://github.com/thanasis457/Playful`
2. `cd Playful`
3. `npm i`
4. `npm start`

### Notes

- Running from source requires you to set up your own Spotify App for security reasons.
Installing from the prepackaged releases, however, works fully out-of-the-box.

- The App icons are not mine. They are provided by Icons8 and can be found [here](https://icons8.com/icon/116726/spotify)

- Support for Linux/Windows: This app is actually ready to build for Linux and Windows environments. However, neither provide an easy way to access the system's menu bar/tray and set text (to show the current song). They only allow the showing of icons. Should I find any way to go around this I'll update the project.
