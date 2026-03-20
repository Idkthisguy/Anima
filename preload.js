const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('AnimaAPI', {
    saveProject: (data) => ipcRenderer.send('save-project', data),
    openProject: (callback) => ipcRenderer.send('open-project'),
    saveExportedFile: (data) => ipcRenderer.send('save-exported-file', data),
    sendCrashReport: (report) => ipcRenderer.send('report-crash', report),
    sendSpriteSheet: (data) => ipcRenderer.send('save-sprite-sheet', data),
    saveGif: (data) => ipcRenderer.send('save-gif', data),
    exportFrames: (data) => ipcRenderer.send('export-frames', data),
    saveProjectTo: (filePath, data) => ipcRenderer.send('save-project-to', filePath, data),

    onProjectLoaded: (callback) => {
        ipcRenderer.on('project-loaded', (event, rawData) => callback(rawData));
    },

    onMenuAction: (actionType, callback) => {
        ipcRenderer.removeAllListeners(`menu-${actionType}`);
        ipcRenderer.on(`menu-${actionType}`, (event, ...args) => callback(...args));
    },

    onEvent: (channel, callback) => {
        ipcRenderer.removeAllListeners(channel);
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
});