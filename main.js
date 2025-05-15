// Modules to control application life and create native browser window
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  shell,
  Notification,
  ipcMain,
} = require("electron");
const Store = process.env.NODE_ENV == "test" ?
  require('./test/electron-store.mock.js') :
  require("electron-store");
const axios = require("axios");
const path = require("path");
const config = require(path.join(__dirname, "./config.json"))
const MediaSubscriber = require("bindings")("MediaSubscriber.node")
const {
  togglePlay,
  playNext,
  playPrevious,
  openSpotify,
  getCurrentSongOnce,
  getState
} = require("./mediaScripts.js");

// Logging Setup
const { initialize, trackEvent } = require("@aptabase/electron/main");
initialize("A-US-0996094887");
// Do not change the order of the three. Necessary for cyclic dependency.
// Store will be like:
const schema = {
    refresh_token: {
      type: "string"
    },
    widget: {
      enum: ['hide', 'show']
    },
    length: {
      enum: ['short', 'long']
    },
    // source: {
    //   enum: ['spotify', 'connect', 'none']
    // },
    connect: {
      type: "boolean"
    },
    connect_tunnel: {
      type: "object",
      properties: {
        domain: { type: "string" },
        authtoken: { type: "string" }
      }
    },
};

/* Store MUST be declared and initialised beforehand so that the functions below have access to the right reference */
const store = new Store(schema);
module.exports.store = store;
const { format_track, format_trackID } = require("./utils.js")
const { ngrokSetup, ngrokShutdown, webSocketSetup, webSocketShutdown, getClients, notify, fetchIp } = require("./connect.js");

let widgetWindow = null;
let qrWindow = null;
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', (event) => {
  app.quit()
})
let tray = null;

app.whenReady().then(() => {
  registerHandlers();
  trackEvent("app_started");
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
        playNext();
      },
    },
    {
      label: "Previous",
      type: "normal",
      click() {
        playPrevious();
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
                  trackEvent("widget", { shown: "False" });
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
                  trackEvent("widget", { shown: "True" });
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
                trackEvent("text length", { length: "short" });
              },
              checked: store.get("length", "short") === "short",
            },
            {
              label: "Long",
              type: "radio",
              click() {
                store.set("length", "long");
                tray.setTitle(format_track(current_song.name, current_song.artist));
                trackEvent("text length", { length: "long" });
              },
              checked: store.get("length", "short") === "long",
            },
          ],
        },
        {
          label: "Spotify Connect - App",
          type: "submenu",
          submenu: [
            {
              label: "Enable",
              id: "connect",
              type: "checkbox",
              click() {
                if (store.get("connect", false) === false) {
                  handleWebSocketSetUp().then(()=>{
                    store.set("connect", true);
                    contextMenu.getMenuItemById('qr').enabled = true;
                  }).catch((e) => {
                    contextMenu.getMenuItemById('connect').checked = false;
                    handleWebSocketShutdown();
                  });
                } else {
                  handleWebSocketShutdown().then(()=>{
                    store.set("connect", false);
                    contextMenu.getMenuItemById('qr').enabled = false;
                    if(qrWindow && !qrWindow.isDestroyed()) qrWindow.close();
                  });
                }
              },
              checked: store.get("connect", false) === true,
            },
            {
              label: "Show QR",
              id: "qr",
              type: "normal",
              enabled: store.get("connect", false) === true,
              click() {
                if (qrWindow && !qrWindow.isDestroyed()) {
                  qrWindow.close();
                }
                QR();
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
  -- Handle Spotify Sign In for album cover (deprecated)
  -- Handle widget window creation
  -- Handle WebSocket server creation
  */

  tray.setTitle("Now Playing");
  tray.setToolTip("This is my application.");
  tray.setContextMenu(contextMenu);

  if (store.get('widget', 'hide') === 'show') widget();

  if (store.get('connect', false) === true) {
    // Disable both until setup is finished
    contextMenu.getMenuItemById('connect').enabled = false;
    contextMenu.getMenuItemById('qr').enabled = false;
    handleWebSocketSetUp().then(() => {
      contextMenu.getMenuItemById('connect').enabled = true;
      contextMenu.getMenuItemById('qr').enabled = true;
    }).catch((e) => {
      store.set("connect", false);
      contextMenu.getMenuItemById('connect').enabled = true;
      contextMenu.getMenuItemById('connect').checked = false;
      handleWebSocketShutdown();
    });
  }
});

// Throws error on failure
async function handleWebSocketSetUp() {
  const tunnel = store.get('connect_tunnel', { domain: '', authtoken: '' })
  if (tunnel.domain !== '')
    await ngrokSetup(tunnel.domain, tunnel.authtoken);
  webSocketSetup(current_song);
  console.debug("Setup successful")
}

// Guaranteed to run without errors
async function handleWebSocketShutdown() {
  await ngrokShutdown();
  webSocketShutdown();
  console.debug("Shutdown successful")
}

function QR() {
  // QR Window
  qrWindow = new BrowserWindow({
    width: 340,
    height: 410,
    webPreferences: {
      preload: path.join(__dirname, "qrPreload.js")
    },
  });
  qrWindow.loadFile("./qrcode/index.html");
  // qrWindow.webContents.openDevTools();
  qrWindow.on("closed", () => {
    app.dock.hide();
    
    /* Do NOT set the window to null.
      If the user closes the window then we can set it to null.
      However, if the window is being reopened (eg. click on
      "Show QR" while the window is still open) the window reference
      might have changed to the new window by the time the
      close event is emitted. This means we would null out the
      reference to the new window and upon another reopening we
      would not be able to close it.
    */
  });
  
  // Open url's on browser (careful with Electron's versions. Some solutions are deprecated)
  qrWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' }
  })
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
  Promise.all([getCurrentSongOnce(), getState()]).then(([res, playing]) => {
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
      format_trackID("", 1).then((data) => {
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
        format_trackID(trackID, 1).then((data) => {
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
function registerHandlers() {
  ipcMain.handle('get-song', async (event, args) => {
    return current_song;
  })

  ipcMain.on('play-previous', (event, args) => {
    playPrevious();
  })

  // Return false on failure
  ipcMain.handle('toggle-play', async (event, args) => {
    try {
      await togglePlay();
      return true;
    } catch {
      return false;
    }
  })

  ipcMain.on('play-next', (event, args) => {
    playNext()
  })

  ipcMain.handle('get-state', async (event, args) => {
    return await getState();
  })

  ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win.setIgnoreMouseEvents(ignore, options)
  })

  ipcMain.handle('get-cover', async (event, trackID, args) => {
    return await format_trackID(trackID);
  })

  ipcMain.handle('get-ip', async (args) => {
    return fetchIp();
  })

  ipcMain.on('set-tunnel-info', (event, domain, authtoken) => {
    console.log("Fetched: ", domain, authtoken)
    if (domain === '' || authtoken === '') {
      store.set('connect_tunnel', { domain: '', authtoken: '' });
    }
    else {
      store.set('connect_tunnel', { domain, authtoken });
    }
  })

  ipcMain.handle('get-tunnel-info', async (args) => {
    return store.get('connect_tunnel', { domain: '', authtoken: '' });
  })
  
  // Testing functions
  if (process.env.NODE_ENV === 'test') {
    QR();
  }
};
