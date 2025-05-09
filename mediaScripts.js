const { exec } = require("child_process");
const path = require("path");

function getCurrentSongOnce() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/running.scpt").then((res) => {
      if (res === "running") {
        runAppleScript("compiledFunctions/currentTrack.scpt").then((res) => {
          res = res.split("+").slice(0, 2);
          res.push(null);
          resolve(res);
        });
      } else {
        resolve(["Open Spotify", "", null])
      }
    })
      .catch((err) => {
        reject(err);
      })
  });
}

function getAlbumCoverArt() {
  // Get source through Spotify App
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/getAlbumCoverArt.scpt").then((res) => {
      resolve(res)
    })
  });
}

function togglePlay() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/state.scpt").then((res) => {
      console.log("received res", res);
      if (res === "paused") {
        console.log("Playing");
        runAppleScript("compiledFunctions/play.scpt").then(() => resolve());
      } else {
        console.log("Pausing");
        runAppleScript("compiledFunctions/pause.scpt").then(() => resolve());
      }
    });
  });
}

function playNext() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/next.scpt").then(() => resolve());
  });
}

function playPrevious() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/previous.scpt").then(() => resolve());
  });
}

function openSpotify() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/openSpotify.scpt")
      .then(() => {
        resolve();
      })
      .catch(() => {
        console.debug("Spotify cannot open. Possibly not installed");
        dialog.showErrorBox(
          "Spotify could not be opened",
          "Spotify is possibly not installed or there is an issue with launching it"
        );
        reject();
      });
  });
}

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    // console.log(process.resourcesPath);
    // console.log(process.env);
    if (process.env.NODE_ENV === "development") {
      exec("osascript " + script, (err, stdout, stderr) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          // console.log(stdout);
          resolve(stdout.trim());
        }
      });
    } else {
      exec(
        "osascript " + path.join(process.resourcesPath, script),
        (err, stdout, stderr) => {
          if (err) {
            // console.log(err);
            reject(err);
          } else {
            // console.log(stdout);
            resolve(stdout.trim());
          }
        }
      );
    }
  });
}

function getState() {
  return new Promise((resolve, reject) => {
    runAppleScript("compiledFunctions/state.scpt")
      .then((res) => {
        if (res === "paused") {
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch((err) => {
        console.log("received err", err);
        reject(err);
      });
  });
}


module.exports = {
  togglePlay,
  playNext,
  playPrevious,
  openSpotify,
  getCurrentSongOnce,
  getState,
  getAlbumCoverArt,
};
