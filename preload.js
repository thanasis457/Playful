const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
  getSong: async () => ipcRenderer.invoke('get-song'),
  playPrevious: () => ipcRenderer.send('play-previous'),
  playNext: () => ipcRenderer.send('play-next'),
  togglePlay: () => ipcRenderer.invoke('toggle-play'),
  getState: () => ipcRenderer.invoke('get-state'),
  getCover: (trackID) => ipcRenderer.invoke('get-cover', trackID),
  onMediaChange: (callback) => ipcRenderer.on('update-song', (_event, value) => callback(value)),
  onPlayerStateChange: (callback) => ipcRenderer.on('update-player-state', (_event, value) => callback(value)),
})

// window.addEventListener('DOMContentLoaded', () => {
//   const interactiveElements = 
//   document.querySelectorAll('.focusable');

//   interactiveElements.forEach((element) => {
//       element.addEventListener('mouseenter', () => {
//           ipcRenderer.send('set-ignore-mouse-events', false);
//       });

//       element.addEventListener('mouseleave', () => {
//           ipcRenderer.send('set-ignore-mouse-events', true, { forward: true });
//       });
//   });
// })
