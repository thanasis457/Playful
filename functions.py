from os import access
import subprocess
import requests

def play(access_token=None):
    if(access_token==None):
        subprocess.run(["osascript", 'compiledFunctions/play.scpt'])
    else:
        requests.put(
            url="https://api.spotify.com/v1/me/player/play",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        )

def pause(access_token=None):
    if(access_token==None):
        subprocess.run(["osascript", 'compiledFunctions/pause.scpt'])
    else:
        requests.put(
            url="https://api.spotify.com/v1/me/player/pause",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        )
    
def next(access_token=None):
    if(access_token==None):
        subprocess.run(["osascript", 'compiledFunctions/next.scpt'])
    else:
        requests.post(
            url="https://api.spotify.com/v1/me/player/next",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        )
    
def previous(access_token=None):
    if(access_token==None):
        subprocess.run(["osascript", 'compiledFunctions/previous.scpt'])
    else:
        requests.post(
            url="https://api.spotify.com/v1/me/player/previous",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        )

def getState(access_token=None):
    if(access_token==None):
        result = subprocess.run(
            ["osascript",'compiledFunctions/state.scpt'],
            capture_output=True,
            encoding="utf-8",
        )
        info = list(map(str.strip, result.stdout.split("+")))
        return info[0]
    else:
        res = requests.get(
            url="https://api.spotify.com/v1/me/player",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        ).json()
        if(res['is_playing']):
            return 'playing'
        else:
            return 'paused'

def getCurrentTrack(access_token=None):
    if(access_token==None):
        result = subprocess.run(
            ["osascript", 'compiledFunctions/currentTrack.scpt'],
            capture_output=True,
            encoding="utf-8",
        )
        info = list(map(str.strip, result.stdout.split("+")))
        return info
    else:
        res = requests.get(
            url="https://api.spotify.com/v1/me/player",
            headers= {
                "Authorization": "Bearer " + access_token,
            }
        )
        if(res.status_code == 204):
            return ['No Song Playing', '']
        res=res.json()
        return [res['item']['name'], res['item']['artists'][0]['name']]

def isRunning():
    result = subprocess.run(
        ["osascript", 'compiledFunctions/running.scpt'],
        capture_output=True,
        encoding="utf-8",
    )
    info = list(map(str.strip, result.stdout.split("+")))
    return info[0]