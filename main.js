const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1300,
        height: 900,
        title: "Anima",
        backgroundColor: '#121212',
        icon: path.join(__dirname, 'icon.ico'),
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
                {
                    label: 'Open',
                    accelerator: 'CmdOrCtrl+O',
                    click: async () => {
                        const result = await dialog.showOpenDialog(win, {
                            properties: ['openFile'],
                            filters: [{ name: 'Anima Project', extensions: ['anima'] }]
                        });
                        if (!result.canceled) win.webContents.send('menu-open', result.filePaths[0]);
                    }
                },
                { label: 'Save', accelerator: 'CmdOrCtrl+S', click: () => win.webContents.send('menu-save') },
                {
                    label: 'Save As',
                    accelerator: 'CmdOrCtrl+Alt+S',
                    click: async () => {
                        const result = await dialog.showSaveDialog(win, {
                            filters: [{ name: 'Anima Project', extensions: ['anima'] }]
                        });
                        if (!result.canceled) win.webContents.send('menu-save-as', result.filePath);
                    }
                },
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

// Communication Bridge: When renderer needs a "Save As" dialog because it has no path
ipcMain.on('request-save-as-dialog', async () => {
    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Anima Project', extensions: ['anima'] }]
    });
    if (!result.canceled) win.webContents.send('menu-save-as', result.filePath);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });