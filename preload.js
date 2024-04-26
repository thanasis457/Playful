const { contextBridge, ipcRenderer } = require('electron')
const { playPrevious, togglePlay, playNext, getState } = require('./mediaScripts')
console.log("Hey")
contextBridge.exposeInMainWorld('api', {
  getSong: async () => ipcRenderer.invoke('get-song'),
  playPrevious: () => ipcRenderer.send('play-previous'),
  playNext: () => ipcRenderer.send('play-next'),
  togglePlay: () => ipcRenderer.send('toggle-play'),
  getState: () => ipcRenderer.invoke('get-state'),
})
