// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu, nativeImage } = require("electron");
const sensitive = require("./sensitive.json");
const Store = require("electron-store");
const https = require("https");
const axios = require("axios");
const path = require("path");
const url = require("url");
const client_id = sensitive.client_id;
const client_secret = sensitive.client_secret;
const redirect_uri = sensitive.redirect_uri;
const uri_port = sensitive.uri_port;

const scope = [
  "user-read-currently-playing",
  "user-read-playback-state",
  "user-modify-playback-state",
];
const store = new Store();

let spot_instance = null;
let auth_instance = null;

let timer = null;
let refresh_token = null;

let code = null;
let access_token = null;
let mounted = false;

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
    if (!mounted) {
      mounted = true;
      getCode(mainWindow);
    }
  }
};

app.on("window-all-closed", async () => {
  app.dock.hide();
  await getAccessToken();
  getCurrentSong();
});

let tray = null;

app.whenReady().then(() => {
  // console.log("Stored is ", store.get("refresh_token"));
  if (store.get("refresh_token")) {
    refresh_token = store.get("refresh_token");
    getRefreshToken()
      .then(() => {
        getCurrentSongOnce();
        getCurrentSong();
        app.dock.hide();
      })
      .catch((e) => {
        console.log("Saved refresh token thew error");
        createWindow();
      });
  } else {
    createWindow();
  }

  app.on("activate", () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  var iconPath = path.join(__dirname, "icons/spotify.png"); // your png tray icon
  let trayIcon = nativeImage.createFromPath(iconPath);
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
      label: "Refresh",
      type: "normal",
      click() {
        getCurrentSongOnce();
      },
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
});

async function startServer() {
  return new Promise((resolve) => {
    const express = require("express");
    const server = express();
    const port = uri_port;
    let instance = null;

    server.get("/", (req, res) => {
      code = req.query.code;
      // res.send(req.query.code);
      res.send("All set! Close this window");
      instance.close();
    });

    instance = server.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
      resolve();
    });
  });
}

async function getCode(mainWindow) {
  await startServer();
  mainWindow.loadURL(
    `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope.join(
      ","
    )}`
  );
}

async function getAccessToken() {
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

async function getRefreshToken() {
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

async function getCurrentSong() {
  console.log("In current song");
  const interval = setInterval(() => {
    spot_instance
      .get("me/player", {})
      .then((res) => {
        // console.log(res);
        // console.log(res.data.item);
        tray.setTitle(
          (res.data.item?.name.length > 14
            ? res.data.item?.name.substr(0, 12) + ".. - "
            : res.data.item?.name + " - ") +
            (res.data.item?.artists[0].name.length > 9
              ? res.data.item?.artists[0].name.substr(0, 7) + ".."
              : res.data.item?.artists[0].name)
        );
      })
      .catch((err) => {
        console.log("Spotify threw error");
        console.log(err);
      });
  }, 2500);
}

async function getCurrentSongOnce() {
  return new Promise((resolve, reject) => {
    spot_instance
      .get("me/player", {})
      .then((res) => {
        // console.log(res);
        tray.setTitle(
          (res.data.item.name.length > 15
            ? res.data.item.name.substr(0, 13) + ".. - "
            : res.data.item.name + " - ") +
            (res.data.item.artists[0].name.length > 10
              ? res.data.item.artists[0].name.substr(0, 8) + ".."
              : res.data.item.artists[0].name)
        );
        resolve();
      })
      .catch((err) => {
        console.log("Spotify threw error");
        console.log(err.response);
        reject(err);
      });
  });
}

async function togglePlay() {
  return new Promise((resolve, reject) => {
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
  });
}

async function playNext() {
  return new Promise((resolve, reject) => {
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
  });
}

async function playPrevious() {
  return new Promise((resolve, reject) => {
    console.log("Playing Previous");
    const spot_instance = axios.create({
      baseURL: "https://api.spotify.com/v1/",
      headers: {
        Authorization: "Bearer " + access_token,
      },
    });
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
  });
}
