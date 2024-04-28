const { exec } = require("child_process");

function getCurrentSongOnce({store, spot_instance}) {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/running.scpt").then((res) => {
        if (res === "running") {
          runAppleScript("compiledFunctions/currentTrack.scpt").then((res) => {
            res = res.split("+").slice(0, 2);
            console.log(res[0]);
            console.log(res[1]);
            res.push(null);
            resolve(res);
          });
        } else {
          resolve(["Open Spotify", "", null])
        }
      })
    } else if (store.get("source", "spotify") == "connect") {
      spot_instance
        .get("me/player", {})
        .then((res) => {
          if (res.status === 204) {
            resolve("No Song Playing", "");
          }
          resolve([res.data.item.name, res.data.item.artists[0].name, res.data.item.album.images[0].url]);
        })
        .catch((err) => {
          console.log("Spotify threw error");
          console.log(err.response);
          reject(err);
        });
    }
  });
}

function getAlbumCoverArt() {
  // Assume source is spotify
  return new Promise((resolve, reject) => {
      runAppleScript("compiledFunctions/getAlbumCoverArt.scpt").then((res) => {
        resolve(res)
      })
    });
}

function togglePlay({store, spot_instance}) {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
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
    } else {
      console.log("Toggling Play/Pause");
      spot_instance
        .get("me/player", {})
        .then((res) => {
          console.log(res.data.is_playing);
          if (res.data.is_playing) {
            spot_instance
              .put("me/player/pause", {})
              .then((res) => {
                console.log("Toggled");
                // console.log(res.data.item);
                resolve();
              })
              .catch((err) => {
                console.log("Spotify threw error");
                console.log(err.response.data);
                reject(err);
              });
          } else {
            spot_instance
              .put("me/player/play", {})
              .then((res) => {
                console.log("Toggled");
                // console.log(res.data.item);
                resolve();
              })
              .catch((err) => {
                console.log("Spotify threw error");
                console.log(err.response.data);
                reject(err);
              });
          }
        })
        .catch((err) => {
          console.log("Spotify threw error");
          console.log(err.response.data);
          reject(err);
        });
    }
  });
}

function playNext({store, spot_instance}) {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/next.scpt").then(() => resolve());
    } else {
      console.log("Playing Next");
      spot_instance
        .post("me/player/next", {})
        .then((res) => {
          console.log("Skipped to next");
          resolve();
        })
        .catch((err) => {
          console.log("Spotify threw error");
          console.log(err.response.data);
          reject(err.response.data);
        });
    }
  });
}

function playPrevious({store, spot_instance}) {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/previous.scpt").then(() => resolve());
    } else {
      spot_instance
        .post("me/player/previous", {})
        .then((res) => {
          console.log("Skipped to previous");
          resolve();
        })
        .catch((err) => {
          console.log("Spotify threw error");
          console.log(err.response.data);
          reject(err);
        });
    }
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
          reject();
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
            reject();
          } else {
            // console.log(stdout);
            resolve(stdout.trim());
          }
        }
      );
    }
  });
}

function getState({store}) {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/state.scpt").then((res) => {
        console.log("received res", res);
        if (res === "paused") {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    }
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
