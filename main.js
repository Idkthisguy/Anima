const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1300,
        height: 900,
        title: "Anima - Animation Engine",
        backgroundColor: '#121212',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadFile('src/index.html');

    const template = [
        {
            label: 'File',
            submenu: [
                { label: 'New', accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send('menu-new') },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => win.webContents.send('menu-undo') },
                { type: 'separator' },
                { label: 'Copy Frame', accelerator: 'CmdOrCtrl+C', click: () => win.webContents.send('menu-copy') },
                { label: 'Paste Frame', accelerator: 'CmdOrCtrl+V', click: () => win.webContents.send('menu-paste') },
                { label: 'Clear', accelerator: 'CmdOrCtrl+Delete', click: () => win.webContents.send('menu-clear') }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'Reset View', accelerator: 'CmdOrCtrl+0', click: () => win.webContents.send('menu-reset-view') }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });