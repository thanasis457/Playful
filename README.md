# <img src="icons/app.icns" align="left" width="114"/> Playful-Py for Spotify

A simple, clean, MacOS application that displays the current song on the Menu Bar. Works only with Spotify.

## Screenshots
![](https://i.imgur.com/fIKt0BV.png)
![Imgur](https://i.imgur.com/mLmM4ad.png)

## What is Playful-Py?

This branch is for the parallel and independent development of a Python implementation of Playful. (It used to be its [own project](https://github.com/thanasis457/PlayfulPy)) Hopefully, in the future, this version will be stable and fast enough to replace the current Playful app which is made with Electron.
Currently, Playful-Py has UI stutter issues in specific cases and is not as efficient when idle.

## Running the app

Playful allows two ways to get song information and control the Spotify player, using your locally installed Spotify instance and the Spotify Web API.

For use of the local Spotify player no setup is needed.

As for the Spotify Web API, you need to provide your own app credentials. All the details regarding the Web API can be found in Spotify's [official docs](https://developer.spotify.com/documentation/web-api/) but here are all the steps you need to get started.

### Steps to set up everything you need

1. Head to [Spotify's Dev Dashboard](https://developer.spotify.com/dashboard)

2. Create a new Spotify App and add any other info you want to include (such name and description)

3. Open the App an click on "Edit Setting"

4. Add http://localhost:8080/ as a Redirect URI

5. Copy and paste the client_id, client_secret (found on the top left of the dashboard) and redirect_uri into `PlayfulPy.ini`

Done!  
Now time to run the app

### Steps to run from source:

1. `git clone -b PlayfulPy https://github.com/thanasis457/Playful` PlayfulPy
2. `cd Playful`
3. `pip install -r requirements.txt`
4. `python PlayfulPy.py` to run

Done!  
The app should now be running.

### Packaging the application
To make a distributable version of the app yourself you will need to follow a couple more steps. We will be using py2app.

From inside the project folder run:
1. `pip install py2app`
2. `python setup.py py2app`

There should now be two folders in the project folder named `build` and `dist`. Inside `dist` you will find your distributable.

## Extra information

### Caution

- Due to a change in the `collections` interface in Python 3.10, any version since 3.10 is not able to run `rumps`(project dependency) properly, so make sure you run the project on any version of Python earlier than that.
- Do not use the python binary that comes prepackaged with MacOS for building a distributable. py2app is known to have issues with that version. Use Homebrew, Conda, or your choice of installing Python.

### Notes

- Running from source requires you to set up your own Spotify App for security reasons.
Installing from the prepackaged releases, however, works fully out-of-the-box.

- The App icons are not mine. They are provided by Icons8 and can be found [here](https://icons8.com/icon/116726/spotify)

- Support for Linux/Windows: Accessing Spotify playback status is a different challenge for every platform. Should I port the app, there would be
a whole lot more problems to solve. In addition, neither platform provides an easy way to access the system's menu bar/tray and set text (to show the current song).
They only allow the showing of icons. Thus, supporting these platforms seems highly unlikely (at least for now).
