import 'package:ffi/ffi.dart';
import 'package:flutter/foundation.dart';
import 'dart:ffi' as ffi;
import 'dart:io';
import 'package:path/path.dart' as path;
import 'package:playful_dart/main.dart';
import 'package:playful_dart/media_controller.dart';

typedef DartCallback =
    ffi.Void Function(
      ffi.Pointer<ffi.Char>,
      ffi.Pointer<ffi.Char>,
      ffi.Pointer<ffi.Char>,
      ffi.Bool,
    );

typedef SubscribeFunc =
    ffi.Void Function(ffi.Pointer<ffi.NativeFunction<DartCallback>>);

typedef Subscribe =
    void Function(ffi.Pointer<ffi.NativeFunction<DartCallback>>);

/// Class for the info of a song
class Song {
  String name;
  String artist;
  String trackID;

  Song(this.name, this.artist, this.trackID);

  /// Default display when no song is playing
  Song.empty() : name = "Now Playing", artist = "", trackID = "";
}

/// Handles the media listening service
class MediaListener {
  static Song currentSong = Song.empty();

  /// Loads the library and starts listening for song changes
  Subscribe _getNativeSubscribe() {
    // Gets shared library
    final String libraryPath;
    if (kDebugMode) {
      libraryPath = path.join(
        Directory.current.path,
        'lib',
        'swift',
        'libMediaMiddleman.dylib',
      );
    } else {
      libraryPath = path.join('libMediaMiddleman.dylib');
    }

    // Load the library
    final dylib = ffi.DynamicLibrary.open(libraryPath);

    // Opens the library and looks up the 'subscribe' function
    final Subscribe subscribe = dylib
        .lookup<ffi.NativeFunction<SubscribeFunc>>('subscribe')
        .asFunction();

    return subscribe;
  }

  MediaListener.listen() {
    isRunning().then((running) {
      if (running) {
        getCurrentSongOnce().then((Song song) {
          currentSong = song;
          MenuBarManager.setTitle(song);
        });
      } else {
        MenuBarManager.setTitle(Song("Open Spotify", '', ''));
      }
    });
    final Subscribe subscribe = _getNativeSubscribe();
    // Calls the native function
    subscribe(
      ffi.NativeCallable<DartCallback>.listener(dartCallback).nativeFunction,
    );
  }

  /// Callback that gets called on song change.
  void dartCallback(
    ffi.Pointer<ffi.Char> name,
    ffi.Pointer<ffi.Char> artist,
    ffi.Pointer<ffi.Char> trackID,
    bool playing,
  ) {
    if (kDebugMode) {
      print(name.cast<Utf8>().toDartString());
      print(trackID.cast<Utf8>().toDartString());
    }
    if (trackID.cast<Utf8>().toDartString() != currentSong.trackID) {
      // Creates and mallocs song data into dart's memory space.
      currentSong = Song(
        name.cast<Utf8>().toDartString(),
        artist.cast<Utf8>().toDartString(),
        trackID.cast<Utf8>().toDartString(),
      );
      MenuBarManager.setTitle(currentSong);
    }

    // Free the C malloced data
    malloc.free(name);
    malloc.free(artist);
    malloc.free(trackID);
  }
}
