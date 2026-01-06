import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:playful_dart/media_controller.dart';
import 'package:playful_dart/media_listener.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:system_tray/system_tray.dart';
import 'package:window_manager/window_manager.dart';
import 'package:flutter_platform_alert/flutter_platform_alert.dart';
import 'package:playful_dart/my_aptabase.dart';

enum SongLength { long, short }

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await windowManager.ensureInitialized();
  // Hide the initial window
  windowManager.close();
  await MyAptabase.init("A-US-0996094887");

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
  static SongLength songLength =
      (store.getString('length') ?? 'short') == 'short'
      ? SongLength.short
      : SongLength.long;
  static late final SharedPreferences store;
  static late final PackageInfo packageInfo;

  /// Builds the menu bar options
  MenuBarManager() {
    Future.wait<dynamic>([
      SharedPreferences.getInstance(),
      PackageInfo.fromPlatform(),
    ]).then((result) {
      // Fetch results from futures above
      store = result[0] as SharedPreferences;
      packageInfo = result[1] as PackageInfo;

      // Init anonymous tracking
      MyAptabase.instance.trackEvent('app_started');
      // Init the menu bar
      initMenuBar();
      // Init app alive timer
      Timer.periodic(const Duration(minutes: 45), (timer) {
        MyAptabase.instance.trackEvent('app_alive', {
          'time_alive': '${timer.tick * 45}mins',
          'song':
              '${MediaListener.currentSong.name}, ${MediaListener.currentSong.artist}',
        });
      });
    });
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
      SubMenu(
        label: 'Options',
        children: [
          SubMenu(
            label: "Text Length",
            children: [
              MenuItemCheckbox(
                label: "Short",
                name: "short_length",
                checked: (store.getString("length") ?? "short") == "short",
                onClicked: (item) async {
                  await store.setString('length', 'short');
                  songLength = SongLength.short;
                  setTitle(MediaListener.currentSong);
                  item.setCheck(true);
                  (menu.findItemByName('long_length') as MenuItemCheckbox)
                      .setCheck(false);
                  MyAptabase.instance.trackEvent('text length', {
                    'length': 'short',
                  });
                },
              ),
              MenuItemCheckbox(
                label: "Long",
                name: "long_length",
                checked: (store.getString("length") ?? "short") == "long",
                onClicked: (item) async {
                  await store.setString('length', 'long');
                  songLength = SongLength.long;
                  setTitle(MediaListener.currentSong);
                  item.setCheck(true);
                  (menu.findItemByName('short_length') as MenuItemCheckbox)
                      .setCheck(false);
                  MyAptabase.instance.trackEvent('text length', {
                    'length': 'long',
                  });
                },
              ),
            ],
          ),
          MenuItemCheckbox(
            label: 'Launch at Login',
            name: "launch",
            checked: store.getBool('launch') ?? false,
            onClicked: (item) async {
              if ((store.getBool('launch') ?? false) == false) {
                try {
                  await enableLaunch(
                    Platform.resolvedExecutable.replaceFirstMapped(
                      RegExp(r'(.*?[^/]+?\.app)(\/.*)'),
                      (match) => match.group(1)!,
                    ),
                  );
                  await store.setBool('launch', true);
                  item.setCheck(true);
                  MyAptabase.instance.trackEvent('auto_launch', {
                    'enabled': 'True',
                  });
                } catch (e) {
                  await store.setBool('launch', false);
                  item.setCheck(false);
                  MyAptabase.instance.trackEvent('auto_launch', {
                    'enabled': 'Crashed enabling',
                  });
                }
              } else {
                try {
                  await disableLaunch();
                  MyAptabase.instance.trackEvent('auto_launch', {
                    'enabled': 'False',
                  });
                } catch (e) {
                  MyAptabase.instance.trackEvent('auto_launch', {
                    'enabled': 'Crashed disabling',
                  });
                } finally {
                  await store.setBool('launch', false);
                  item.setCheck(false);
                }
              }
            },
          ),
          MenuItemLabel(
            label: "About",
            onClicked: (item) async {
              await FlutterPlatformAlert.showAlert(
                windowTitle: 'Playful Information',
                text:
                    '''Dart: ${FlutterVersion.dartVersion}
                    Flutter: ${FlutterVersion.version}
                    Playful Version: ${packageInfo.version}-alpha
                    Author: Athanasios Taprantzis''',
                alertStyle: AlertButtonStyle.ok,
                iconStyle: IconStyle.information,
              );
            },
          ),
        ],
      ),
      MenuItemLabel(
        label: 'Quit',
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
