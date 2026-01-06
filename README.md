# <img src="assets/app.png" align="left" width="114"/> Playful for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

**This branch is a reimplementation of the Playful app using [Flutter](https://flutter.dev/).** This version is currently **experimental**. The app size and the memory footprint is **substantially reduced** compared to the main app(app size is down to 10% of original annd memory size down to 50%) but will remain experimental until all features are complete and tested.

## Screenshots
<p align="center">
  <img src="https://i.imgur.com/mLmM4ad.png" width="900"/>
</p>

## Installing

The easiest way to get running is to head to [Releases](https://github.com/thanasis457/Playful/releases) and download the **alpha** version of the package for your platform.

## Building from source

### Pre-Requirements:

You need to have installed on your system:
1. The `swift compiler` (through xcode's dev tools)

### Steps to run from source:

1. `git clone https://github.com/thanasis457/Playful`
2. `git checkout -b Playful-Flutter`
3. `flutter pub get`
4. `./run.sh`

### Buidling a distributable

If you want to make your own distributable version of the app (.app), run `./build.sh`. If you encounter issues with the app not finding the shared libraries first follow the [instructions](https://docs.flutter.dev/platform-integration/macos/c-interop) on bundling dynamic libraries for Flutter apps. You should use the generated libraries found at `lib/swift`.

The path to the compiled app will be shown at the end of the compilation.

### Testing
Currently no automated testing is setup.

### Notes

- The App icons are not mine. They are provided by Icons8 and can be found [here](https://icons8.com/icon/116726/spotify)

- Support for Linux/Windows: Every platform has its own internal media playback system. Since Flutter does not offer this integration, I would have to redo all the work for new platforms. It was a already a big challenge to get the MacOS playback information. Maybe in the future I might consider expanding to other OSes.

## Support my work

[<img src="https://www.ko-fi.com/img/githubbutton_sm.svg" target="_blank"/>](https://ko-fi.com/thanasis457)

I am a student that likes to work on projects like these on my free time. If you like what I do please consider supporting me! Any donation is appreciated!

Should enough donations be reached, I will be able to publish Playful on the App Store and enable Auto-Updates. Donate if that sounds like something you would want!
