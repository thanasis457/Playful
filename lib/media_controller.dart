import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:playful_dart/media_listener.dart';

String getResourcePath(String path) {
  if (kDebugMode) {
    return path;
  }
  return join(
    Directory(Platform.resolvedExecutable).parent.parent.path,
    "Resources",
    path,
  );
}

Future<bool> isRunning() async {
  final String running = await runAppleScript('compiledFunctions/running.scpt');
  return running == 'running';
}

Future<Song> getCurrentSongOnce() async {
  String songArtist = await runAppleScript(
    'compiledFunctions/currentTrack.scpt',
  );
  Song song = Song(songArtist.split('+')[0], songArtist.split('+')[1], '');
  return song;
}

Future<String> getAlbumCoverArt() async {
  return await runAppleScript('compiledFunctions/getAlbumCoverArt.scpt');
}

Future<void> togglePlay() async {
  final String state = await getState();
  if (state == 'paused') {
    await runAppleScript('compiledFunctions/play.scpt');
  } else {
    await runAppleScript('compiledFunctions/pause.scpt');
  }
}

Future<void> playNext() async {
  await runAppleScript('compiledFunctions/next.scpt');
}

Future<void> playPrevious() async {
  await runAppleScript('compiledFunctions/previous.scpt');
}

Future<void> openSpotify() async {
  await runAppleScript('compiledFunctions/openSpotify.scpt');
}

Future<String> getState() async {
  return await runAppleScript('compiledFunctions/state.scpt');
}

Future<void> enableLaunch(String appPath) async {
  try {
    await runAppleScript('compiledFunctions/launch.scpt "$appPath"');
  } catch (e) {
    print(e);
  }
}

Future<void> disableLaunch() async {
  try {
    await runAppleScript('compiledFunctions/remove_launch.scpt');
  } catch (e) {
    print(e);
  }
}

Future<String> runAppleScript(String script) async {
  final scriptPath = getResourcePath(script);
  final result = await Process.run('osascript', [scriptPath]);
  final exitCode = result.exitCode;
  if (exitCode != 0) {
    throw Exception("Could not run AppleScript: ${result.stderr}");
  }
  return result.stdout.toString().trim();
}
