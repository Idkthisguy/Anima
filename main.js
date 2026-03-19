const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStatic);

let win;

if (process.env.NODE_ENV === "development") {
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true
        });
    } catch (err) {
        console.error("FAILED TO AUTO RELOAD: ", err);
    }
}

function createWindow() {
    if (win) return;
    win = new BrowserWindow({
        width: 1300,
        height: 900,
        title: "Anima",
        backgroundColor: '#121212',
        icon: path.join(__dirname, 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
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
                        if (!result.canceled) {
                            const content = fs.readFileSync(result.filePaths[0], 'utf-8');
                            win.webContents.send('menu-open', JSON.parse(content));
                        }
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
                        },
                        {
                            label: 'Export as Sprite Sheet (.png)',
                            accelerator: 'CmdOrCtrl+Shift+E',
                            click: () => win.webContents.send('menu-export', 'spritesheet')
                        },
                        {
                            label: 'Export as GIF',
                            click: () => win.webContents.send('menu-export', 'gif')
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
                { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => win.webContents.send('menu-redo') },
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

    win.webContents.on('render-process-gone', (event, details) => {
        const reason = details.reason;
        console.error(`Renderer process gone: ${reason}`);

        dialog.showErrorBox(
            'Anima System Failure',
            `The drawing engine crashed (${reason}).\n\nIf this keeps happening, please check your desktop for a crash log or report this on GitHub.`
        );
    });

    win.on('unresponsive', () => {
        dialog.showMessageBox(win, {
            type: 'warning',
            title: 'Anima is Frozen',
            message: 'Anima isn\'t responding. Do you want to wait or restart?',
            buttons: ['Wait', 'Restart']
        }).then(({ response }) => {
            if (response === 1) win.reload();
        });
    });

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

ipcMain.on('request-save-as-dialog', async () => {
    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Anima Project', extensions: ['anima'] }]
    });
    if (!result.canceled) win.webContents.send('menu-save-as', result.filePath);
});

ipcMain.on('save-sprite-sheet', async (event, base64Data) => {
    const result = await dialog.showSaveDialog(win, {
        title: 'Export Sprite Sheet',
        defaultPath: 'anima_spritesheet.png',
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
    });

    if (!result.canceled && result.filePath) {
        const imageBuffer = Buffer.from(base64Data, 'base64');

        fs.writeFile(result.filePath, imageBuffer, (err) => {
            if (err) {
                dialog.showErrorBox('SAVE ERROR', 'Could not save the sprite sheet.');
            } else {
                dialog.showMessageBox(win, {
                    type: 'info',
                    title: 'Success',
                    message: 'Sprite sheet exported!'
                });
            }
        });
    }
});

/*ipcMain.on('save-exported-file', async (event, { BufferData, requestedFormat, fps }) => {
    const finalExtension = requestedFormat || 'mp4';
    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Video File', extensions: [finalExtension] }]
    });

    if (result.canceled) return;

    const buffer = Buffer.from(Object.values(BufferData));
    const tempDir = app.getPath('userData');
    const tempWebmPath = path.join(tempDir, `export_temp_${Date.now()}.webm`);
    const currentFPS = parseInt(fps) || 12;

    fs.writeFile(tempWebmPath, buffer, (err) => {
        if (err) {
            dialog.showErrorBox('Write Error', `Failed to write temp file: ${err.message}`);
            return;
        }

        if (finalExtension === 'webm') {
            fs.copyFileSync(tempWebmPath, result.filePath);
            fs.unlinkSync(tempWebmPath);
            dialog.showMessageBox(win, { type: 'info', title: 'Success', message: 'WebM saved!' });
            return;
        }

        // UNIVERSAL MP4 SETTINGS
        ffmpeg(tempWebmPath)
            .inputOptions([
                '-fflags +genpts',
                `-r ${currentFPS}`
            ])
            .inputFPS(currentFPS)
            .outputOptions([
                '-c:v libx264',
                '-pix_fmt yuv420p',
                '-profile:v high',
                '-level 4.0',
                '-crf 18',
                '-preset slow',
                '-movflags +faststart',
                '-vf', `fps=${currentFPS},scale=trunc(iw/2)*2:trunc(ih/2)*2`
            ])
            .on('start', (cmd) => console.log('FFmpeg Command:', cmd))
            .on('progress', (progress) => {
                win.webContents.send('export-progress', Math.round(progress.percent || 0));
            })
            .on('end', () => {
                if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                win.webContents.send('export-progress', 100);
                setTimeout(() => {
                    win.webContents.send('export-done');
                    dialog.showMessageBox(win, { type: 'info', title: 'Export Complete', message: 'Your video is ready and compatible with all players!' });
                }, 500);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('FFmpeg Stderr:', stderr);
                if (fs.existsSync(tempWebmPath)) fs.unlinkSync(tempWebmPath);
                win.webContents.send('export-done');
                dialog.showErrorBox('Export Failed', `FFmpeg Error: ${err.message}`);
            })
            .save(result.filePath);
    });
});*/ //keep it as this for now, whoever is reading this


ipcMain.on('export-frames', async (event, { frames, format, fps }) => {
    const result = await dialog.showSaveDialog(win, {
        filters: [{ name: 'Video', extensions: [format] }]
    });
    if (result.canceled) {
        win.webContents.send('export-done');
        return;
    }

    const tempDir = app.getPath('userData');
    const framesDir = path.join(tempDir, `frames_${Date.now()}`);
    fs.mkdirSync(framesDir);

    for (let i = 0; i < frames.length; i++) {
        const framePath = path.join(framesDir, `frame${String(i).padStart(5, '0')}.png`);
        fs.writeFileSync(framePath, Buffer.from(frames[i], 'base64'));
        win.webContents.send('export-progress', Math.round((i / frames.length) * 40));
    }

    const inputPattern = path.join(framesDir, 'frame%05d.png');

    ffmpeg()
        .input(inputPattern)
        .inputFPS(fps)
        .outputOptions([
            '-c:v libx264',
            '-pix_fmt yuv420p',
            '-profile:v high',
            '-crf 18',
            '-preset medium',
            '-movflags +faststart'
        ])
        .on('progress', (p) => {
            win.webContents.send('export-progress', 40 + Math.round((p.percent || 0) * 0.6));
        })
        .on('end', () => {
            fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
            fs.rmdirSync(framesDir);
            win.webContents.send('export-progress', 100);
            setTimeout(() => {
                win.webContents.send('export-done');
                dialog.showMessageBox(win, { type: 'info', title: 'Done!', message: 'Export complete!' });
            }, 300);
        })
        .on('error', (err) => {
            fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
            fs.rmdirSync(framesDir);
            win.webContents.send('export-done');
            dialog.showErrorBox('Export Failed', err.message);
        })
        .save(result.filePath);
});

ipcMain.on('report-crash', (event, report) => {
    const logPath = path.join(os.homedir(), 'Desktop', 'anima-crash-log.txt');
    fs.writeFileSync(logPath, report);

    dialog.showErrorBox("ANIMA HAS CRASHED", `Log saved to: ${logPath}`);
});

ipcMain.on('save-project', async (event, projectData) => {
    const { filePath } = await dialog.showSaveDialog({
        title: 'Save Anima project',
        filters: [{ name: 'Anima Project File', extensions: ['anima'] }]
    });

    if (filePath) {
        fs.writeFileSync(filePath, JSON.stringify(projectData));
        dialog.showMessageBox(win, { type: 'info', title: 'Saved!', message: `Project saved!` });
    }
});

ipcMain.on('open-project', async (event) => {
    const { filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Anima Project File', extensions: ['anima'] }]
    });

    if (filePaths.length > 0) {
        const content = fs.readFileSync(filePaths[0], 'utf-8');

        event.reply('project-loaded', JSON.parse(content));
    }
});

ipcMain.on('save-gif', async (event, bufferData) => {
    const result = await dialog.showSaveDialog(win, {
        defaultPath: 'anima.gif',
        filters: [{ name: 'GIF Image', extensions: ['gif'] }]
    });
    if (!result.canceled) {
        fs.writeFile(result.filePath, Buffer.from(bufferData), (err) => {
            if (err) dialog.showErrorBox('Save Error', err.message);
            else dialog.showMessageBox(win, { type: 'info', title: 'Done!', message: 'GIF exported!' });
        });
    }
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });