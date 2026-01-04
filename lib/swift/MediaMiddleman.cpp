#include <string.h>
#include <cstdlib>

using namespace std;

extern "C" void callbackFunction(char *, char *, char *, bool);
extern "C" void startSubscriber(void (*)(char *, char *, char *, bool));
extern "C" void subscribe(void (*)(char *, char *, char *, bool));

void (*dartCallback)(char *, char *, char *, bool) = nullptr;

struct Song {
    char* name;
    char* artist;
    char* trackID;
    bool playing;
};

void callbackHandler(Song song) {
    dartCallback(song.name, song.artist, song.trackID, song.playing);
}

void callbackFunction(char* name, char* artist, char* trackID, bool playing) {
    char* nameM = (char*) malloc(strlen(name) + 1);
    strcpy(nameM, name);
    char* artistM = (char*) malloc(strlen(artist) + 1);
    strcpy(artistM, artist);
    char* trackIDM = (char*) malloc(strlen(trackID) + 1);
    strcpy(trackIDM, trackID);
    
    Song song;
    song.name = nameM;
    song.artist = artistM;
    song.trackID = trackIDM;
    song.playing = playing;

    callbackHandler(song);
}

void subscribe(void (*callback)(char *, char *, char *, bool)) {
    dartCallback = callback;
    startSubscriber(callbackFunction);
}
