const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

let win;

function createWindow() {
    if (win) return;
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
                {
                    label: 'Export',
                    submenu: [
                        {
                            label: 'Export as MP4',
                            accelerator: 'CmdOrCtrl+E',
                            click: () => win.webContents.send('menu-export', 'mp4')
                        },
                        {
                            label: 'Export as WebM',
                            click: () => win.webContents.send('menu-export', 'webm')
                        }
                    ]
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

ipcMain.on('request-save-as-dialog', async () => {
    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Anima Project', extensions: ['anima'] }]
    });
    if (!result.canceled) win.webContents.send('menu-save-as', result.filePath);
});

ipcMain.on('save-exported-file', async (event, { BufferData, extension, requestedFormat, fps }) => {
    const finalExtension = requestedFormat || extension;

    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Video File', extensions: [finalExtension] }]
    });

    if (result.canceled) return;

    const buffer = Buffer.from(BufferData);

    if (finalExtension === 'webm') {
        fs.writeFileSync(result.filePath, buffer);
        dialog.showMessageBox(win, { type: 'info', title: 'Export Complete', message: 'WebM saved successfully!' });
    }
    else if (finalExtension === 'mp4') {
        const tempWebmPath = path.join(os.tmpdir(), `anima_temp_${Date.now()}.webm`);
        const currentFPS = fps || 12;

        try {
            fs.writeFileSync(tempWebmPath, buffer);

            setTimeout(() => {
                if (!fs.existsSync(tempWebmPath) || fs.statSync(tempWebmPath).size === 0) {
                    dialog.showErrorBox('Export Error', 'Temp file was not created correctly.');
                    return;
                }

                ffmpeg()
                    .input(tempWebmPath)
                    .inputFPS(currentFPS)
                    .outputOptions([
                        '-c:v libx264',
                        '-pix_fmt yuv420p',
                        '-crf 17',
                        '-movflags +faststart',
                        '-vf', `fps=${currentFPS}`
                    ])
                    .on('start', (commandLine) => {
                        console.log('Spawned FFmpeg with command: ' + commandLine);
                    })
                    .on('end', () => {
                        if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                        dialog.showMessageBox(win, { type: 'info', title: 'Export Complete', message: 'MP4 saved successfully!' });
                    })
                    .on('error', (err) => {
                        console.error('FFmpeg Error:', err);
                        if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                        dialog.showErrorBox('Export Failed', `FFmpeg Error: ${err.message}`);
                    })
                    .save(result.filePath);
            }, 200);

        } catch (e) {
            dialog.showErrorBox('Write Error', `Failed to write temp file: ${e.message}`);
        }
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });