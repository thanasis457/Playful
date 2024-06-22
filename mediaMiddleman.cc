#include <chrono>
#include <thread>
#include <napi.h>
#include <string.h>
using namespace Napi;

std::thread nativeThread;
ThreadSafeFunction tsfn;

extern "C" void callbackFunction(char *, char *, char *);
extern "C" void startSubscriber(void (*)(char *, char *, char *));

struct Song {
    char* name;
    char* artist;
    char* trackID;
};

void jsCallbackHandler(Napi::Env env, Function jsCallback, Song *song) {
    // Transform native data into JS data, passing it to the provided
    // `jsCallback` -- the TSFN's JavaScript function.
    jsCallback.Call({Napi::String::New(env, song->name),
                     Napi::String::New(env, song->artist),
                     Napi::String::New(env, song->trackID)});
    free(song->name);
    free(song->artist);
    free(song->trackID);
    free(song);
}

void callbackFunction(char* name, char* artist, char* trackID) {
    int count = 1;
    // auto callback = [](Napi::Env env, Function jsCallback, Song* song)
    // {
    //     // We're finished with the data.
    // };

    // Create new data
    // Perform a blocking call
    char* nameM = (char*)std::malloc(strlen(name) + 1);
    strcpy(nameM, name);
    char* artistM = (char*)std::malloc(strlen(artist) + 1);
    strcpy(artistM, artist);
    char* trackIDM = (char*)std::malloc(strlen(trackID) + 1);
    strcpy(trackIDM, trackID);
    Song* song = (Song*)malloc(sizeof(Song));
    song->name = nameM;
    song->artist = artistM;
    song->trackID = trackIDM;
    napi_status status = tsfn.BlockingCall(song, jsCallbackHandler);

    // Release the thread-safe function
}

Value subscribe(const CallbackInfo &info) {
    Napi::Env env = info.Env();

    // Create a ThreadSafeFunction
    tsfn = ThreadSafeFunction::New(
        env,
        info[0].As<Function>(), // JavaScript function called asynchronously
        "Resource Name",        // Name
        0,                      // Unlimited queue
        1,                      // Only one thread will use this initially
        [](Napi::Env) {         // Finalizer used to clean threads up
            nativeThread.join();
        });

    // Create a native thread
    nativeThread = std::thread(startSubscriber, callbackFunction);
    // threadEx();

    return Boolean::New(env, true);
}

Napi::Object Init(Napi::Env env, Object exports) {
    exports.Set("subscribe", Function::New(env, subscribe));
    return exports;
}

NODE_API_MODULE(MediaSubscriber, Init)
