from sre_parse import State
from time import sleep
import rumps
import threading
from multiprocessing import Process, Queue
from functions import *
import configparser
from flask import Flask, request
import webbrowser
import requests
import base64


config = configparser.ConfigParser()
config.read('PlayfulPy.ini')
client_id = config['PlayfulPy']['client_id']
client_secret = config['PlayfulPy']['client_secret']
redirect_uri = config['PlayfulPy']['redirect_uri']
uri_port = config['PlayfulPy']['uri_port']
refresh_token = config['PlayfulPy']['refresh_token'] if 'refresh_token' in config['PlayfulPy'] else None
server_instance = None
code=None
spot_instance = None
auth_instance = None
access_token = None
timer_thread = None

scope = [
    "user-read-currently-playing",
    "user-read-playback-state",
    "user-modify-playback-state",
];
    
def formatTitle(song, artist, length):
    if(length=='Long'):    
        song_edited=song
        artist_edited=artist
        if(len(song)+len(artist)>40):
            if(len(artist)>16 and len(song)>24):
                artist_edited = artist[0:14]+'..'
                song_edited=song[0:22]+'..'
            elif(len(artist)>16):
                artist_edited = artist[0:(40-len(song)-2)]+'..'
            else:
                song_edited = song[0:(40-len(artist)-2)]+'..'
        return song_edited + " - " + artist_edited
    else:
        song_edited=song
        artist_edited=artist
        if(len(song)+len(artist)>26):
            if(len(artist)>10 and len(song)>16):
                artist_edited = artist[0:8]+'..'
                song_edited=song[0:14]+'..'
            elif(len(artist)>10):
                artist_edited = artist[0:(26-len(song)-2)]+'..'
            else:
                song_edited = song[0:(26-len(artist)-2)]+'..'
        return song_edited + " - " + artist_edited

def Server(q):
        app = Flask("MyServer")
        
        @app.route("/health")
        def checkHealth():
            return "<p>Everything is running</p>"
        
        @app.route("/")
        def getCode():
            global code
            code = request.args['code']
            q.put(code)
            return "<p>Everything is set up! You can now close your window.</p>"
        app.run(host='localhost', port=config['PlayfulPy']['uri_port'])

def getAccessToken():
    # print("Getting access token")
    res = requests.post("https://accounts.spotify.com/api/token", headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
        "Basic " +
        base64.b64encode((client_id + ":" + client_secret).encode("ascii")).decode('ascii'),
    },
    params={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri
    })
    res = res.json()
    global access_token
    global refresh_token
    global timer        
    access_token=res['access_token']
    refresh_token=res['refresh_token']
    global timer_thread
    timer_thread = threading.Timer(res['expires_in'], getRefreshToken)
    timer_thread.start()

def getRefreshToken():
    # print("Getting refresh token")
    global timer_thread
    if(timer_thread != None):
        try:
            timer_thread.cancel()
            # print("Cancelled thread")
        except Exception as e:
            print(e)
    res = requests.post("https://accounts.spotify.com/api/token", headers={
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization":
        "Basic " +
        base64.b64encode((client_id + ":" + client_secret).encode("ascii")).decode('ascii'),
    },
    params={
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
    })
    res = res.json()
    global access_token
    global timer
    access_token=res['access_token']
    timer_thread = threading.Timer(res['expires_in'], getRefreshToken)
    timer_thread.start()

def getCode():
    q = Queue()
    p = Process(target=Server, args = (q,))
    try:
        p.start()
        cnt=0
        while(True):
            cnt+=1
            if(cnt>11):
                raise TimeoutError()
            try:
                r = requests.get(redirect_uri+'health')
                r.raise_for_status()  # Raises a HTTPError if the status is 4xx, 5xxx
            except (requests.exceptions.ConnectionError, requests.exceptions.Timeout):
                print("Down")
                sleep(0.5)
            except requests.exceptions.HTTPError:
                print("4xx, 5xx")
                sleep(0.5)
            else:
                break
        webbrowser.open(('''https://accounts.spotify.com/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}''').format(client_id=client_id, redirect_uri=redirect_uri, scope=",".join(scope)))
        
        global code
        code = q.get(block=True)
        p.terminate()
    except Exception as e:
        p.terminate()
        raise e

def handleSignIn():
    try:
        if(refresh_token==None):
            print("handling server")
            getCode()
            getAccessToken()
        else:
            try:
                getRefreshToken()
            except Exception as e:
                print(e)
                print("handling server")
                getCode()
                getAccessToken()
        PlayfulPy.source = 'connect'
        # global timer_thread
        # timer_thread = threading.Thread(timer, target=getRefreshToken)
        # timer_thread.start()
    except Exception as e:
        print('Error while signing in')
        print(e)
        raise e

class PlayfulPy(rumps.App):
    length = 'Short'
    current_song=["",""]
    send_notification = False
    source = 'spotify'  # spotify | connect

    def __init__(self):
        super(PlayfulPy, self).__init__(
            name="Playful",
            title="Now Playing",
            icon="icons/spotify.png",
            menu=[
                'Play / Pause',
                'Next',
                'Previous',
                None,
                {'Options':
                    [{
                        'Text Length':['Short', 'Long'],
                        'Source': ['Spotify App', 'Spotify Connect (Experimental)'],
                        'Send Notification On Change' : ['On', 'Off']
                    }]
                }
            ],
            quit_button=None
        )
        
        try:
            if('send_notification' in config['PlayfulPy']):
                PlayfulPy.send_notification = config['PlayfulPy']['send_notification']=='True'
                self.menu.get('Options').get('Send Notification On Change').get('On' if (PlayfulPy.send_notification == True) else 'Off').state = 1
            else:
                self.menu.get('Options').get('Send Notification On Change').get('Off').state = 1
            if('length' in config['PlayfulPy']):
                PlayfulPy.length = config['PlayfulPy']['length']
                self.menu.get('Options').get('Text Length').get('Short' if (PlayfulPy.length == 'Short') else 'Long').state = 1
            else:
                self.menu.get('Options').get('Text Length').get('Short').state = 1
            if('source' in config['PlayfulPy']):
                PlayfulPy.source = config['PlayfulPy']['source']
                if(PlayfulPy.source=='connect'):
                    # Same as self.spotify_connect()
                    try:
                        handleSignIn()
                        self.icon='icons/spotify_connect.png'
                        self.menu.get('Options').get('Source').get('Spotify Connect (Experimental)').state = 1
                    except:
                        PlayfulPy.source = 'spotify'
                        self.menu.get('Options').get('Source').get('Spotify App').state = 1
                else:
                    self.menu.get('Options').get('Source').get('Spotify App').state = 1
        except:
            pass
    
    @rumps.timer(2)
    def refresh_title(self, _):
        # print(PlayfulPy.source)
        # print(PlayfulPy.current_song)
        if(PlayfulPy.source=='spotify'):
            if(isRunning() == 'running'):
                try:
                    track = getCurrentTrack()
                    # print(track)
                    # print(" and ")
                    # print(self.current_song)
                    if(track[0]!=PlayfulPy.current_song[0] or track[1]!=PlayfulPy.current_song[1]):
                        # print("copying"x)
                        if(PlayfulPy.send_notification==True):
                            rumps.notification(title=track[0], message=track[1], subtitle="", sound = False)
                        PlayfulPy.current_song=track.copy()
                        self.title = formatTitle(track[0], track[1], PlayfulPy.length)
                        
                except Exception as e:
                    PlayfulPy.current_song = ['', '']
                    self.title = "Error"
                    # print(e)
            else:
                PlayfulPy.current_song = ['', '']
                self.title = "Open Spotify"
        else:
            try:
                track = getCurrentTrack(access_token)
                if(track[0]!=PlayfulPy.current_song[0] or track[1]!=PlayfulPy.current_song[1]):
                    if(PlayfulPy.send_notification==True):
                        rumps.notification(title=track[0], message=track[1], subtitle="", sound = False)
                    PlayfulPy.current_song=track.copy()
                    self.title = formatTitle(track[0], track[1], PlayfulPy.length)

            except Exception as e:
                PlayfulPy.current_song = ['', '']
                self.title = "Error"
                print(e)

    @rumps.clicked("Play / Pause")
    def toggle(self, _):
        if(PlayfulPy.source=='spotify'):
            if(getState()=="playing"):
                pause()
            else:
                play()
        else:
            if(getState(access_token)=='playing'):
                pause(access_token)
            else:
                play(access_token)

    @rumps.clicked("Next")
    def skip_next(self, _):
        if(PlayfulPy.source=='spotify'):
            next()
        else:
            next(access_token)
        self.refresh_title_once()

    @rumps.clicked("Previous")
    def skip_prev(self, _):
        if(PlayfulPy.source=='spotify'):
            previous()
        else:
            previous(access_token)
        self.refresh_title_once()

    @rumps.clicked("Options", "Text Length", 'Short')
    def format_length_short(self, sender):
        PlayfulPy.length='Short'
        sender.state = 1
        self.menu.get('Options').get('Text Length').get('Long').state = 0
        self.refresh_title_once()

    @rumps.clicked("Options", "Text Length", 'Long')
    def format_length_long(self, sender):
        PlayfulPy.length='Long'
        sender.state = 1
        self.menu.get('Options').get('Text Length').get('Short').state = 0
        self.refresh_title_once()

    @rumps.clicked("Options", "Source", "Spotify App")
    def spotify_app(self, sender):
        PlayfulPy.source="spotify"
        self.icon='icons/spotify.png'
        sender.state = 1
        self.menu.get('Options').get('Source').get('Spotify Connect (Experimental)').state = 0

    @rumps.clicked("Options", "Source", "Spotify Connect (Experimental)")
    def spotify_connect(self, sender):
        try:
            handleSignIn()
            self.icon='icons/spotify_connect.png'
            sender.state = 1
            self.menu.get('Options').get('Source').get('Spotify App').state = 0
        except:
            PlayfulPy.source = 'spotify'
            sender.state = 0
            self.menu.get('Options').get('Source').get('Spotify App').state = 1
    
    @rumps.clicked("Options", "Send Notification On Change", "On")
    def send_notification_on(self, sender):
        PlayfulPy.send_notification = True
        sender.state = 1
        self.menu.get('Options').get('Send Notification On Change').get('Off').state = 0
    
    @rumps.clicked("Options", "Send Notification On Change", "Off")
    def send_notification_off(self, sender):
        PlayfulPy.send_notification = False
        sender.state = 1
        self.menu.get('Options').get('Send Notification On Change').get('On').state = 0

    @rumps.clicked('Quit')
    def save_on_quit(self, _):
        config['PlayfulPy']['length'] = PlayfulPy.length
        config['PlayfulPy']['send_notification'] = str(PlayfulPy.send_notification)
        config['PlayfulPy']['source'] = PlayfulPy.source
        if(refresh_token!=None):
            config['PlayfulPy']['refresh_token'] = refresh_token
        with open('PlayfulPy.ini', 'w+') as configfile:
            config.write(configfile)
        rumps.quit_application()
    
    def refresh_title_once(self):
        if(PlayfulPy.source=='spotify'):
            try:
                track = getCurrentTrack()
                PlayfulPy.current_song=track.copy()
                self.title = formatTitle(track[0], track[1], PlayfulPy.length)
            except:
                pass
        else:
            try:
                track = getCurrentTrack(access_token)
                PlayfulPy.current_song=track.copy()
                self.title = formatTitle(track[0], track[1], PlayfulPy.length)
            except:
                pass
            
    
if __name__ == "__main__":
    PlayfulPy().run()
