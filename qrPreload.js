const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('api', {
    getIp: () => ipcRenderer.invoke('get-ip'),
    setTunnelInfo: (domain, authtoken) => ipcRenderer.send('set-tunnel-info', domain, authtoken),
    getTunnelInfo: () => ipcRenderer.invoke('get-tunnel-info'),
})
