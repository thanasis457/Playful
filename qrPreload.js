const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
    getIp: () => ipcRenderer.invoke('get-ip'),
})
