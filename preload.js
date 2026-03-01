const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('AnimaAPI', {
    saveProject: (data) => ipcRenderer.send('save-project', data),
    onOpenProject: (callback) => ipcRenderer.on('open-project', callback)
});