// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  Notification,
} = require("electron");
const { exec } = require("child_process");
const sensitive = require("./sensitive.json");
const Store = require("electron-store");
const axios = require("axios");
const path = require("path");
const url = require("url");
const { createBrotliCompress } = require("zlib");
const client_id = sensitive.client_id;
const client_secret = sensitive.client_secret;
const redirect_uri = sensitive.redirect_uri;
const uri_port = sensitive.uri_port;

const scope = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
];

// Store will be like:
// {
//   'refresh_token': ...,
//   'length': 'Short' | 'Long',
//   'source': 'spotify' | 'connect' | 'none'
//   'send_notification' = false | true
// }
const store = new Store();

let spot_instance = axios.create({});
let auth_instance = null;
let server_instance = null;

let timer = null;
let refresh_token = null;

let code = null;
let access_token = null;

const createWindow = () => {
  // Create the browser window.
  if (process.platform === "linux") {
    const mainWindow = new BrowserWindow({
      icon: "icons/app.png",
      width: 800,
      height: 600,
    });
    if (!mounted) {
      mounted = true;
      getCode(mainWindow);
    }
  } else {
    const mainWindow = new BrowserWindow({
      icon: "icons/app.png",
      width: 800,
      height: 600,
    });
    return getCode(mainWindow);
  }
};

app.on("window-all-closed", async () => {
  app.dock.hide();
  try {
    await getAccessToken();
  } catch (e) {
    console.log("Could not get access token");
  }
});

async function handleSignIn() {
  return new Promise((resolve, reject) => {
    try {
      if (store.get("refresh_token")) {
        refresh_token = store.get("refresh_token");
        console.log("Got refresh");
        getRefreshToken()
          .then(() => {
            resolve();
          })
          .catch((e) => {
            console.log("Saved refresh token threw error");
            createWindow()
              .then(() => {
                resolve();
              })
              .catch((e) => {
                reject(e);
              });
          });
      } else {
        createWindow()
          .then(() => {
            resolve();
          })
          .catch((e) => {
            reject(e);
          });
      }
    } catch (e) {
      new Notification({
        title: "Error Connecting",
      }).show();
      reject(e);
    }
  });
}

let tray = null;

app.whenReady().then(() => {
  // console.log("Stored is ", store.get("refresh_token"));

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  app.dock.hide();
  var iconPath = path.join(__dirname, "icons/spotify.png"); // your png tray icon
  let trayIcon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 20, height: 20 });
  tray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Play / Pause",
      type: "normal",
      click() {
        togglePlay();
      },
    },
    {
      label: "Next",
      type: "normal",
      click() {
        playNext().then(() => getCurrentSongOnce());
      },
    },
    {
      label: "Previous",
      type: "normal",
      click() {
        playPrevious().then(() => getCurrentSongOnce());
      },
    },
    {
      type: "separator",
    },
    {
      label: "Options",
      type: "submenu",
      submenu: [
        {
          label: "Text Length",
          type: "submenu",
          submenu: [
            {
              label: "Short",
              type: "radio",
              click() {
                store.set("length", "short");
              },
              checked: store.get("length", "short") == "short",
            },
            {
              label: "Long",
              type: "radio",
              click() {
                store.set("length", "long");
              },
              checked: store.get("length", "short") == "long",
            },
          ],
        },
        {
          label: "Source",
          type: "submenu",
          submenu: [
            {
              label: "Spotify App",
              type: "radio",
              click() {
                store.set("source", "spotify");
              },
              checked: store.get("source", "spotify") == "spotify",
            },
            {
              label: "Spotify Connect (Experimental)",
              type: "radio",
              click() {
                handleSignIn()
                  .then(() => {
                    console.log("Signed in");
                    store.set("source", "connect");
                  })
                  .catch(() => {
                    console.log("Signed Out");
                    store.set("source", "connect");
                    new Notification({
                      title: "Sign In Error",
                    }).show();
                  });
              },
              checked: store.get("source", "spotify") == "connect",
            },
          ],
        },
        {
          label: "Send Notification On Change",
          type: "submenu",
          submenu: [
            {
              label: "Off",
              type: "radio",
              click() {
                store.set("send_notification", "off");
              },
              checked: store.get("send_notification", "off") == "off",
            },
            {
              label: "On",
              type: "radio",
              click() {
                store.set("send_notification", "on");
              },
              checked: store.get("send_notification", "off") == "on",
            },
          ],
        },
      ],
    },
    {
      label: "Quit",
      type: "radio",
      role: "quit",
      click() {
        app.quit();
      },
    },
  ]);
  tray.setTitle("Now Playing");
  tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);
  if (store.get("source") === "connect") {
    store.set("source", "none");
    handleSignIn()
      .then(() => {
        store.set("source", "connect");
      })
      .catch(() => {
        store.set("source", "connect");
        new Notification({
          title: "Sign In Error",
        }).show();
      });
  }
  getCurrentSong();
});

async function startServer() {
  return new Promise((resolve) => {
    const express = require("express");
    const server = express();
    const port = uri_port;

    server.get("/", (req, res) => {
      code = req.query.code;
      // res.send(req.query.code);
      res.send("All set! Close this window");
      server_instance.close();
    });
    server.get("/death", (req, res) => {
      // res.send(req.query.code);
      res.send("Shutting server down");
      server_instance.close();
    });

    server_instance = server.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
      resolve();
    });
  });
}

async function getCode(mainWindow) {
  await startServer();
  setTimeout(() => server_instance.close(), 60000);
  try {
    await mainWindow.loadURL(
      `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope.join(
        ","
      )}`
    );
  } catch (e) {
    console.log("Failed to load window");
    mainWindow.close();
    server_instance.close();
    throw new Error(e);
  }
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    auth_instance = axios.create({
      baseURL: "https://accounts.spotify.com/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
    });
    const params = new url.URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
    });
    auth_instance
      .post("api/token", params.toString())
      .then((res) => {
        console.log(res.data);
        access_token = res.data.access_token;
        refresh_token = res.data.refresh_token;
        store.set("refresh_token", res.data.refresh_token);
        timer = res.data.expires_in;
        console.log("Set timeout at, ", timer);
        setTimeout(() => {
          getRefreshToken();
        }, timer * 1000);
        console.log("resolving");
        spot_instance = axios.create({
          baseURL: "https://api.spotify.com/v1/",
          headers: {
            Authorization: "Bearer " + access_token,
          },
        });
        resolve();
      })
      .catch((err) => {
        console.log(err.response);
        reject(err);
      });
  });
}

function getRefreshToken() {
  return new Promise((resolve, reject) => {
    auth_instance = axios.create({
      baseURL: "https://accounts.spotify.com/",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
    });
    const params = new url.URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    });
    auth_instance
      .post("api/token", params.toString())
      .then((res) => {
        access_token = res.data.access_token;
        timer = res.data.expires_in;
        console.log("Set timeout at, ", timer);
        setTimeout(() => {
          getRefreshToken();
        }, timer * 1000);
        console.log("resolving");
        spot_instance = axios.create({
          baseURL: "https://api.spotify.com/v1/",
          headers: {
            Authorization: "Bearer " + access_token,
          },
        });
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function format_track(song, artist) {
  if (store.get("length", "short") == "long") {
    let song_edited = song;
    let artist_edited = artist;
    if (song.length + artist.length > 40) {
      if (artist.length > 16 && song.length > 24) {
        artist_edited = artist.substr(0, 14) + "..";
        song_edited = song.substr(0, 22) + "..";
      } else if (artist.length > 16) {
        artist_edited = artist.substr(0, 40 - song.length - 2) + "..";
      } else {
        song_edited = song.substr(0, 40 - artist.length - 2) + "..";
      }
    }
    if (artist_edited == "") {
      return song_edited;
    }
    return song_edited + " - " + artist_edited;
  } else {
    song_edited = song;
    artist_edited = artist;
    if (song.length + artist.length > 26) {
      if (artist.length > 10 && song.length > 16) {
        artist_edited = artist.substr(0, 8) + "..";
        song_edited = song.substr(0, 14) + "..";
      } else if (artist.length > 10) {
        artist_edited = artist.substr(0, 26 - song.length - 2) + "..";
      } else {
        song_edited = song.substr(0, 26 - artist.length - 2) + "..";
      }
    }
    if (artist_edited == "") {
      return song_edited;
    }
    return song_edited + " - " + artist_edited;
  }
}

async function getCurrentSong() {
  let current_song = ["", ""];
  const interval = setInterval(() => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/running.scpt").then((res) => {
        if (res === "running") {
          runAppleScript("compiledFunctions/currentTrack.scpt").then((res) => {
            res = res.split("+");
            if (res[0] !== current_song[0] || res[1] !== current_song[1]) {
              current_song[0] = res[0];
              current_song[1] = res[1];
              if (store.get("send_notification", "off") === "on") {
                new Notification({
                  title: current_song[0],
                  body: current_song[1],
                  silent: true,
                }).show();
              }
            }
            tray.setTitle(format_track(res[0], res[1]));
          });
        } else {
          tray.setTitle("Open Spotify");
        }
      });
    } else if (store.get("source", "spotify") == "connect") {
      spot_instance
        .get("me/player", {})
        .then((res) => {
          // console.log([res.data.item.name,res.data.item.artists[0].name]);
          // console.log(res);
          if (res.status === 204) {
            tray.setTitle("No Song Playing");
            current_song[0] = "No Song Playing";
            current_song[1] = "";
            return;
          }
          if (
            res.data.item.name !== current_song[0] ||
            res.data.item.artists[0].name !== current_song[1]
          ) {
            current_song[0] = res.data.item.name;
            current_song[1] = res.data.item.artists[0].name;
            if (store.get("send_notification", "off") === "on") {
              new Notification({
                title: current_song[0],
                body: current_song[1],
                silent: true,
              }).show();
            }
          }
          tray.setTitle(
            format_track(res.data.item.name, res.data.item.artists[0].name)
          );
        })
        .catch((err) => {
          console.log("Spotify threw error");
          // console.log(err);
          tray.setTitle("Connection Error");
        });
    }
  }, 2500);
}

function getCurrentSongOnce() {
  return new Promise((resolve, reject) => {
    if (store.get("source", "spotify") == "spotify") {
      runAppleScript("compiledFunctions/currentTrack.scpt").then((res) => {
        res = res.split("+");
        console.log(res[0]);
        console.log(res[1]);
        tray.setTitle(format_track(res[0], res[1]));
        resolve();
      });
    } else if (store.get("source", "spotify") == "connect") {
      spot_instance
        .get("me/player", {})
        .then((res) => {
          // console.log(res);
          tray.setTitle(
            format_track(res.data.item.name, res.data.item.artists[0].name)
          );
          resolve();
        })
        .catch((err) => {
          console.log("Spotify threw error");
          console.log(err.response);
          reject(err);
        });
    }
  });
}

function togglePlay() {
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

function playNext() {
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
          console.log(err);
          reject(err.response.data);
        });
    }
  });
}

function playPrevious() {
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

function runAppleScript(script) {
  return new Promise((resolve, reject) => {
    exec("osascript " + script, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        reject();
      } else {
        // console.log(stdout);
        resolve(stdout.trim());
      }
    });
  });
}
