# Playful for Spotify

A simple, clean, cross-platform application that displays the current song on the Menu Bar. Works only with Spotify.

## Installing
The easiest way to get running it to head to Releases and download the package for your platform.

### For reference:
MacOS Intel (x64): Playful-darwin-x64-[version].zip  
MacOS Apple Silicon (arm64): Playful-darwin-arm64-[version].zip  
Windows: Playful-windows-x64-[version]  
Linux (RPM): Playful-linux-x64-[version].rpm  
Linux (DEB): Playful-linux-x64-[version].deb  

## Running from source
To run from the source code you need to provide your own app credentials. More details can be found in Spotify's [official docs](https://developer.spotify.com/documentation/web-api/)  
You should add your credentials in `sensitive.json`.

Steps to run from source (with edited `sensitive.json`):
1. `git clone https://github.com/thanasis457/Playful`
2. `cd Playful`
3. `npm i`
4. `npm start`
