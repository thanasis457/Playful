# <img src="icons/app.png" align="left" width="114"/> Playful for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

## Screenshots
<p align="center">
  <img src="https://i.imgur.com/BdrgnC2.png" width="800"/>
  <img src="https://i.imgur.com/gKByqAQ.jpeg" width="800"/>
  <img src="https://i.imgur.com/mLmM4ad.png" width="900"/>
</p>



The Desktop widget is an added feature that shows the currently playing song, has basic media controls, and stays on top of any application you are using.
**Disabled by default**.

## Installing

The easiest way to get running is to head to [Releases](https://github.com/thanasis457/Playful/releases) and download the package for your platform.

## Building from source

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

- The App icons are not mine. They are provided by Icons8 and can be found [here](https://icons8.com/icon/116726/spotify)

- Support for Linux/Windows: Every platform has its own internal media playback system. Since Electron does not offer this integration, I would have to redo all the work for new platforms. It was a already a big challenge to get the MacOS playback information. Maybe in the future I might consider expanding to other OSes.

## [Playful-Connect](https://github.com/thanasis457/Playful-Connect)

Playful now has an Android companion app. See your currently playing Spotify song on a lightweight and minimal app, designed to make your phone into an elegant mini-canvas.

Download Playful-Connect [here](https://github.com/thanasis457/Playful-Connect)

## Support my work

[<img src="https://www.ko-fi.com/img/githubbutton_sm.svg" target="_blank"/>](https://ko-fi.com/thanasis457)

I am a student that likes to work on projects like these on my free time. If you like what I do please consider supporting me! Any donation is appreciated!

Should enough donations be reached, I will be able to publish Playful on the App Store and enable Auto-Updates. Donate if that sounds like something you would want!
