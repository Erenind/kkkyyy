const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readCodeTime: () => ipcRenderer.invoke('read-code-time'),
  startSession: () => ipcRenderer.invoke('start-session'),
  endSession: () => ipcRenderer.invoke('end-session'),
  onAutoEndSession: (callback) => {
    ipcRenderer.on('auto-end-session', callback)
  }
})
