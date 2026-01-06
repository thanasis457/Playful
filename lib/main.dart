import 'package:flutter/material.dart';
import 'package:playful_dart/media_controller.dart';
import 'package:playful_dart/media_listener.dart';
import 'package:system_tray/system_tray.dart';
import 'package:window_manager/window_manager.dart';

enum SongLength { long, short }

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();
  // Hide the initial window
  windowManager.close();

  MenuBarManager();
  runApp(const Playful());

  // Start listening
  MediaListener.listen();
}

class Playful extends StatelessWidget {
  const Playful({super.key});
  @override
  Widget build(BuildContext context) {
    return SizedBox.shrink();
  }
}

/// Manages the menu bar
class MenuBarManager {
  static final AppWindow appWindow = AppWindow();
  static final SystemTray systemTray = SystemTray();
  static final songLength = SongLength.short;

  /// Builds the menu bar options
  MenuBarManager() {
    initMenuBar();
  }

  Future<void> initMenuBar() async {
    String path = './assets/spotify.png';

    await systemTray.initSystemTray(
      title: MediaListener.currentSong.name,
      iconPath: path,
    );

    // create context menu
    final Menu menu = Menu();
    await menu.buildFrom([
      MenuItemLabel(
        label: 'Play / Pause',
        onClicked: (menuItem) => togglePlay(),
      ),
      MenuItemLabel(label: 'Next', onClicked: (menuItem) => playNext()),
      MenuItemLabel(label: 'Previous', onClicked: (menuItem) => playPrevious()),
      MenuSeparator(),
      MenuItemLabel(
        label: 'Open Spotify',
        onClicked: (menuItem) => openSpotify(),
      ),
      MenuItemLabel(
        label: 'Exit',
        onClicked: (menuItem) async => await windowManager.destroy(),
      ),
    ]);

    await systemTray.setContextMenu(menu);

    systemTray.registerSystemTrayEventHandler((eventName) {
      if (eventName == kSystemTrayEventClick) {
        systemTray.popUpContextMenu();
      }
    });
  }

  /// Sets the title of the menu bar
  static void setTitle(Song song) {
    if (songLength == SongLength.long) {
      String songEdited = song.name;
      String artistEdited = song.artist;
      if (song.name.length + song.artist.length > 40) {
        if (song.artist.length > 16 && song.name.length > 24) {
          artistEdited = "${song.artist.substring(0, 14)}..";
          songEdited = "${song.name.substring(0, 22)}..";
        } else if (song.artist.length > 16) {
          artistEdited =
              "${song.artist.substring(0, 40 - song.name.length - 2)}..";
        } else {
          songEdited =
              "${song.name.substring(0, 40 - song.artist.length - 2)}..";
        }
      }
      if (artistEdited == "") {
        systemTray.setTitle(songEdited);
        return;
      }
      systemTray.setTitle("$songEdited - $artistEdited");
      return;
    } else {
      String songEdited = song.name;
      String artistEdited = song.artist;
      if (song.name.length + song.artist.length > 26) {
        if (song.artist.length > 10 && song.name.length > 16) {
          artistEdited = "${song.artist.substring(0, 8)}..";
          songEdited = "${song.name.substring(0, 14)}..";
        } else if (song.artist.length > 10) {
          artistEdited =
              "${song.artist.substring(0, 26 - song.name.length - 2)}..";
        } else {
          songEdited =
              "${song.name.substring(0, 26 - song.artist.length - 2)}..";
        }
      }
      if (artistEdited == "") {
        systemTray.setTitle(songEdited);
        return;
      }
      systemTray.setTitle("$songEdited - $artistEdited");
      return;
    }
  }
}
