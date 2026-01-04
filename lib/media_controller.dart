import 'dart:io';

Future<void> togglePlay() async {
  final String state = await runAppleScript('compiledFunctions/state.scpt');
  if (state == 'paused') {
    await runAppleScript('compiledFunctions/play.scpt');
  } else {
    await runAppleScript('compiledFunctions/pause.scpt');
  }
}

Future<String> runAppleScript(String script) async {
  final result = await Process.run('osascript', [script]);
  return result.stdout.toString().trim();
}
