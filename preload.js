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

window.addEventListener('DOMContentLoaded', () => {
  const interactiveElements = 
  document.querySelectorAll('.focusable');

  interactiveElements.forEach((element) => {
      element.addEventListener('mouseenter', () => {
          ipcRenderer.send('set-ignore-mouse-events', false);
      });

      element.addEventListener('mouseleave', () => {
          ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
      });
  });
})
