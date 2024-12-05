// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  NativeImage,
  Notification,
  dialog,
  ipcMain,
} = require("electron");
const sensitive = require("./sensitive.json");
const Store = require("electron-store");
const axios = require("axios");
const path = require("path");
const crypto = require("crypto");
const config = require(path.join(__dirname, "./config.json"))
const url = require("url");
const MediaSubscriber = require("bindings")("MediaSubscriber.node")
const client_id = sensitive.client_id;
const redirect_uri = sensitive.redirect_uri;
const uri_port = sensitive.uri_port;
const {
  togglePlay,
  playNext,
  playPrevious,
  openSpotify,
  getCurrentSongOnce,
  getState
} = require("./mediaScripts.js");

// Do not change the order of the three. Necessary for cyclic dependency.
// Store will be like:
// {
//   'refresh_token': ...,
//   'widget': 'hide' | 'show',
//   'length': 'short' | 'long',
//   'source': 'spotify' | 'connect' | 'none'
//   'send_notification' = false | true
// }

/* Store MUST be declared and initialised beforehand so that the functions below have access to the right reference */
const store = new Store();
module.exports.store = store;
const { format_track, format_trackID } = require("./utils.js")
const { ngrokSetup, ngrokShutdown, webSocketSetup, webSocketShutdown, getClients, notify, fetchIp } = require("./connect.js");

const scope = [
  "user-read-currently-playing",
  "user-read-playback-state",
  // "user-modify-playback-state",
];

let widgetWindow = null;
function widget() {
  widgetWindow = new BrowserWindow({
    width: config.properties.width,
    height: config.properties.height,
    frame: false,
    transparent: config.properties.transparent,
    resizable: false,
    show: false,
    focusable: true,
    type: "panel",
    alwaysOnTop: true,
    opacity: 1,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      sandbox: false
    },
    skipTaskbar: true,
  })
  widgetWindow.setPosition(config.properties.x, config.properties.y)
  widgetWindow.setVisibleOnAllWorkspaces(true);
  // widgetWindow.setIgnoreMouseEvents(true, { forward: true });
  widgetWindow.once("ready-to-show", () => {
    widgetWindow.show();
    app.dock.hide();
    startUpFetch();
  })
  widgetWindow.loadFile(config.index)
  widgetWindow.on("closed", () => {
    app.dock.hide();
    widgetWindow = null;
  })
  // main.openDevTools();
}


let spot_instance = axios.create({});
let auth_instance = null;
let server_instance = null;

let timer = null;
let refresh_token = null;

let code = null;
let codeVerifier = null;
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
    mainWindow.on("closed", async () => {
      app.dock.hide();
      try {
        await getAccessToken();
      } catch (e) {
        console.log("Could not get access token");
      }
    })
    return getCode(mainWindow);
  }
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

function handleSignIn() {
  return new Promise((resolve, reject) => {
    try {
      if (store.get("refresh_token")) {
        refresh_token = store.get("refresh_token");
        console.log("Got refresh", refresh_token);
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
  // store.openInEditor()
  // app.on("activate", () => {
  //   // On macOS it's common to re-create a window in the app when the
  //   // dock icon is clicked and there are no other windows open.
  //   if (BrowserWindow.getAllWindows().length === 0) widget();
  // });
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
        togglePlay({ store, spot_instance });
      },
    },
    {
      label: "Next",
      type: "normal",
      click() {
        playNext({ store, spot_instance });
      },
    },
    {
      label: "Previous",
      type: "normal",
      click() {
        playPrevious({ store, spot_instance });
      },
    },
    {
      type: "separator",
    },
    {
      label: "Open Spotify",
      type: "normal",
      click() {
        openSpotify();
      },
    },
    {
      label: "Options",
      type: "submenu",
      submenu: [
        {
          label: "Floating Widget",
          type: "submenu",
          submenu: [
            {
              label: "Hide",
              type: "radio",
              click() {
                store.set("widget", "hide");
                if (widgetWindow) {
                  widgetWindow.close();
                }
              },
              checked: store.get("widget", "hide") === "hide",
            },
            {
              label: "Show",
              type: "radio",
              click() {
                if (!widgetWindow) {
                  widget();
                }
                store.set("widget", "show");
              },
              checked: store.get("widget", "hide") === "show",
            },
          ],
        },
        {
          label: "Text Length",
          type: "submenu",
          submenu: [
            {
              label: "Short",
              type: "radio",
              click() {
                store.set("length", "short");
                tray.setTitle(format_track(current_song.name, current_song.artist));
              },
              checked: store.get("length", "short") === "short",
            },
            {
              label: "Long",
              type: "radio",
              click() {
                store.set("length", "long");
                tray.setTitle(format_track(current_song.name, current_song.artist));
              },
              checked: store.get("length", "short") === "long",
            },
          ],
        },
        {
          label: "Album Cover Source",
          type: "submenu",
          submenu: [
            {
              label: "Spotify App",
              type: "radio",
              click() {
                store.set("source", "spotify");
              },
              checked: store.get("source", "spotify") === "spotify",
            },
            {
              label: "Spotify Connect (Experimental)",
              type: "radio",
              click() {
                store.set("source", "connect");
                handleSignIn()
                  .then(() => {
                    console.log("Signed In");
                  })
                  .catch(() => {
                    console.log("Signed Out");
                    new Notification({
                      title: "Sign In Error",
                    }).show();
                  });
              },
              checked: store.get("source", "spotify") === "connect",
            },
          ],
        },
        {
          label: "Spotify Connect - App",
          type: "submenu",
          submenu: [
            {
              label: "Enable",
              type: "checkbox",
              click() {
                if (store.get("connect", "false") === "false") {
                  store.set("connect", "true");
                  handleWebSocketSetUp();
                  contextMenu.getMenuItemById('qr').enabled = true;
                } else {
                  store.set("connect", "false");
                  contextMenu.getMenuItemById('qr').enabled = false;
                  handleWebSocketShutdown();
                }
              },
              checked: store.get("connect", "false") === "true",
            },
            {
              label: "Show QR",
              id: "qr",
              type: "normal",
              enabled: store.get("connect", "false") === "true",
              click() {
                qrWindow();
              },
            },
          ],
        },
        // {
        //   label: "Send Notification On Change",
        //   type: "submenu",
        //   submenu: [
        //     {
        //       label: "Off",
        //       type: "radio",
        //       click() {
        //         store.set("send_notification", "off");
        //       },
        //       checked: store.get("send_notification", "off") === "off",
        //     },
        //     {
        //       label: "On",
        //       type: "radio",
        //       click() {
        //         store.set("send_notification", "on");
        //       },
        //       checked: store.get("send_notification", "off") === "on",
        //     },
        //   ],
        // },
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

  /* Start subscriber process */
  getCurrentSong();

  /*
  Handle SetUp according to saved preferences:
  -- Handle Spotify Sign In for album cover
  -- Handle widget window creation
  -- Handle WebSocket server creation
  */

  tray.setTitle("Now Playing");
  tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);
  if (store.get("source") === "connect") {
    handleSignIn()
      .then(() => {
        console.log("Signed in");
      })
      .catch(() => {
        console.log("Signed out");
        new Notification({
          title: "Sign In Error",
        }).show();
      });
  }

  if (store.get('widget', 'hide') === 'show') widget();

  if (store.get('connect', 'false') === 'true') handleWebSocketSetUp();
});

async function handleWebSocketSetUp() {
  await ngrokSetup();
  webSocketSetup(current_song, spot_instance);
  console.log("Setup successful")
}

async function handleWebSocketShutdown() {
  await ngrokShutdown();
  webSocketShutdown();
  console.log("Shutdown successful")
}

function qrWindow() {
  // QR Window
  const qrWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "qrPreload.js")
    },
  });
  qrWindow.loadFile("./qrcode/index.html");
  qrWindow.webContents.openDevTools();
  qrWindow.on("closed", () => {
    app.dock.hide();
  });
}

function startServer() {
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
  console.log("In code")
  const generateRandomString = (length) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
  }

  codeVerifier = generateRandomString(64);
  const sha256 = async (plain) => {
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return crypto.subtle.digest('SHA-256', data)
  }
  const base64encode = (input) => {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
  const hashed = await sha256(codeVerifier)
  const codeChallenge = base64encode(hashed);
  await startServer();
  setTimeout(() => server_instance.close(), 60000);
  try {
    await mainWindow.loadURL(
      `https://accounts.spotify.com/authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=${scope.join(
        ","
      )}&code_challenge_method=S256&code_challenge=${codeChallenge}`
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
      },
    });
    const params = new url.URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirect_uri,
      client_id: client_id,
      code_verifier: codeVerifier,
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
      },
    });
    const params = new url.URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh_token,
      client_id: client_id,
    });
    auth_instance
      .post("api/token", params.toString())
      .then((res) => {
        access_token = res.data.access_token;
        refresh_token = res.data.refresh_token;
        timer = res.data.expires_in;
        console.log("Set timeout at, ", timer);
        store.set("refresh_token", res.data.refresh_token);
        setTimeout(() => {
          getRefreshToken();
        }, timer * 1000);
        console.log("resolving token refresh");
        spot_instance = axios.create({
          baseURL: "https://api.spotify.com/v1/",
          headers: {
            Authorization: "Bearer " + access_token,
          },
        });
        resolve();
      })
      .catch((err) => {
        console.log("Error on refreshing the token:", err);
        reject(err);
      });
  });
}

async function sendNotification(current_song) {
  try {
    const albumUrl = current_song.cover;
    let albumRaw = await axios.get(albumUrl, {
      responseType: "arraybuffer",
    });
    let img = nativeImage.createFromBuffer(albumRaw.data);
    let songPlayingNotification = new Notification({
      title: current_song[0],
      body: current_song[1],
      icon: img,
      silent: true,
    });
    songPlayingNotification.show();
    songPlayingNotification.on("click", () => {
      openSpotify();
    });
  } catch (e) {
    console.debug("Notification did not show on change: " + e);
    return Promise.reject(new Error("Album cover could not be retrieved"));
  }
}

let current_song = {
  name: "",
  artist: "",
  trackID: "",
  album: "",
  playing: false,
  setUp: false, //Whether the current_song has been populated
}; //song, artist, album-cover

// First time set-up (no event has been triggered)
function startUpFetch() {
  //Check if song is already loaded
  if (current_song.setUp) {
    if (widgetWindow) {
      widgetWindow.webContents.send('update-song', current_song);
      widgetWindow.webContents.send('update-player-state', current_song);
    }
    return;
  }
  Promise.all([getCurrentSongOnce({ store, spot_instance }), getState({ store })]).then(([res, playing]) => {
    current_song.name = res[0];
    current_song.artist = res[1];
    current_song.playing = playing;
    tray.setTitle(format_track(res[0], res[1]));
    current_song.setUp = true;
    if (widgetWindow) {
      widgetWindow.webContents.send('update-song', current_song);
      widgetWindow.webContents.send('update-player-state', current_song);
    }
    if (getClients().size > 0) {
      format_trackID(trackID, spot_instance, 1).then((data) => {
        notify({ ...current_song, album: data });
      })
    }
  }).catch((err) => {
    console.debug(err)
  })
}
async function getCurrentSong() {
  function updateSong(name, artist, trackID, playing) {
    if (name !== current_song.name || artist !== current_song.artist || trackID !== current_song.trackID) {
      current_song.name = name;
      current_song.artist = artist;
      current_song.trackID = trackID;
      tray.setTitle(format_track(name, artist));
      if (widgetWindow) widgetWindow.webContents.send('update-song', current_song);
      if (getClients().size > 0) {
        format_trackID(trackID, spot_instance, 1).then((data) => {
          notify({ ...current_song, album: data });
        })
      }
    }
    if (playing !== current_song.playing) {
      current_song.playing = playing;
      if (widgetWindow) widgetWindow.webContents.send('update-player-state', current_song)
    }
  }

  startUpFetch();
  MediaSubscriber.subscribe(updateSong)
}

// Main process
ipcMain.handle('get-song', async (event, args) => {
  return current_song;
})

ipcMain.on('play-previous', (event, args) => {
  playPrevious({ store, spot_instance });
})

// Return false on failure
ipcMain.handle('toggle-play', async (event, args) => {
  try {
    await togglePlay({ store, spot_instance });
    return true;
  } catch {
    return false;
  }
})

ipcMain.on('play-next', (event, args) => {
  playNext({ store, spot_instance })
})

ipcMain.handle('get-state', async (event, args) => {
  return await getState({ store });
})

ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win.setIgnoreMouseEvents(ignore, options)
})

ipcMain.handle('get-cover', async (event, trackID, args) => {
  return await format_trackID(trackID, spot_instance);
})

ipcMain.handle('get-ip', async (args) => {
  return fetchIp();
})
