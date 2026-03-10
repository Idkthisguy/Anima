import { Timeline } from "../../src/timeline.js";
let MediaModule;
import('@capacitor-community/media').then(m => MediaModule = m.Media);

const isElectron = typeof navigator !== 'undefined' && navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
const { ipcRenderer } = (isElectron && window.electron) ? window.electron : { ipcRenderer: null };

window.focus();

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const wrapper = document.getElementById('canvas-wrapper');
const stage = document.getElementById('stage-container');
const timeline = new Timeline(60);

const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameSlider = document.getElementById('frameSlider');
const frameStrip = document.getElementById('frame-strip');
const playBtn = document.getElementById('playBtn');
const fpsInput = document.getElementById('fpsInput');
const frameCounter = document.getElementById('frameCounter');
const loopToggle = document.getElementById('loopToggle');

const onionCanvas = document.getElementById('onionCanvas');
const onionCtx = onionCanvas.getContext('2d');

const tempOnionCanvas = document.createElement('canvas');
const tempOnionCtx = tempOnionCanvas.getContext('2d');

const drawingCanvas = document.getElementById('drawingCanvas');
drawingCanvas.width = canvas.width;
drawingCanvas.height = canvas.height;
drawingCanvas.style.touchAction = 'none';
const drawingCtx = drawingCanvas.getContext('2d');

const frameCtxMenu = document.getElementById('frame-context-menu');
let menuTargetFrame = null;

const durationInput = document.getElementById('durationInput');
durationInput.onchange = () => {
    let newMax = parseInt(durationInput.value);
    if (isNaN(newMax) || newMax < 0) newMax = 1;
    if (newMax > 999) newMax = 999;

    timeline.setDuration(newMax);
    frameSlider.max = newMax;

    syncUI();
};

let currentPath = [];

let smoothing = 0.5;
let smoothedX = 0;
let smoothedY = 0;

let scale = 0.5;
let offsetX = 100, offsetY = 100;
let isPanning = false;
let isDrawing = false;
let currentTool = 'brush';
let startX, startY;
let animationId = null;

let currentFilePath = null;

let initialPinchDistance = 0;
let initialScale = 0;
let lastTouchMidX = 0;
let lastTouchMidY = 0;
let isPinching = false;

let lastTapTime = 0;

const toolSettings = {
    brush: { size: 5, opacity: 1, color: '#000000' },
    erase: { size: 20, opacity: 1 },
    bucket: { tolerance: 40 }
};

const opacitySlider = document.getElementById('brushOpacity');

function init() {
    const stageW = stage.clientWidth || window.innerWidth;
    const stageH = stage.clientHeight || window.innerHeight;

    offsetX = (stageW - (canvas.width * scale)) / 2;
    offsetY = (stageH - (canvas.height * scale)) / 2;

    updateView();
    syncUI();
}

function syncUI() {
    frameSlider.value = timeline.currentFrame;
    frameCounter.innerText = `Frame: ${timeline.currentFrame + 1}`;

    const thumbs = frameStrip.querySelectorAll('.thumb');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === timeline.currentFrame);
    });

    updateOnionSkin();
}

const exportTmp = document.createElement('canvas');
exportTmp.width = canvas.width;
exportTmp.height = canvas.height;
const exportTmpCtx = exportTmp.getContext('2d');

function getProjectData() {
    return JSON.stringify({
        appName: "Anima",
        version: "1.0-beta",
        fps: fpsInput.value,
        maxFrames: timeline.maxFrames,
        frames: timeline.frames.map(imgData => {
            if (!imgData) return null;
            exportTmpCtx.clearRect(0, 0, canvas.width, canvas.height);
            exportTmpCtx.putImageData(imgData, 0, 0);
            return exportTmp.toDataURL('image/webp', 0.5);
        })
    });
}


function updateThumbnails() {
    frameStrip.innerHTML = '';
    timeline.frames.forEach((frame, i) => {
        const t = document.createElement('div');
        t.className = `thumb ${i === timeline.currentFrame ? 'active' : ''} ${frame ? 'has-data' : ''}`;
        t.innerText = i + 1;

        t.onclick = () => {
            stopPlayback();
            timeline.gotoFrame(i, canvas);
            syncUI();
        };

        t.oncontextmenu = (e) => {
            e.preventDefault();
            menuTargetFrame = i;

            frameCtxMenu.style.display = 'block';
            frameCtxMenu.style.left = e.clientX + 'px';
            frameCtxMenu.style.top = e.clientY + 'px';
        };

        frameStrip.appendChild(t);
    });
}

document.getElementById('loopToggle').addEventListener('click', (e) => {
    e.target.blur();
});

function setTool(toolId, toolName) {
    currentTool = toolName;

    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(toolId);
    if (activeBtn) activeBtn.classList.add('active');

    if (toolSettings[currentTool]) {
        brushSize.value = toolSettings[currentTool].size;
        opacitySlider.value = toolSettings[currentTool].opacity * 100;
        if (currentTool === 'brush') {
            colorPicker.value = toolSettings.brush.color;
        }
    }

    setupContext(ctx);
    setupContext(drawingCtx);
}

brushSize.oninput = () => {
    if (toolSettings[currentTool]) toolSettings[currentTool].size = brushSize.value;
};

opacitySlider.oninput = () => {
    if (toolSettings[currentTool]) toolSettings[currentTool].opacity = opacitySlider.value / 100;
};

colorPicker.oninput = () => {
    if (currentTool === 'brush') toolSettings.brush.color = colorPicker.value;
};

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    const isCmd = e.ctrlKey || e.metaKey;

    console.log(`Key pressed: ${key} | Ctrl: ${isCmd}`);

    if (isCmd) {
        if (key === 'z') {
            e.preventDefault();
            timeline.undo(canvas);
            syncUI();
            return;
        }
        if (key === 'c') {
            e.preventDefault();
            timeline.copyFrame();
            return;
        }
        if (key === 'v') {
            e.preventDefault();
            timeline.pasteFrame(canvas);
            syncUI();
            return;
        }
        return;
    }
    switch (key) {
        case 'b':
            e.preventDefault();
            setTool('brushTool', 'brush');
            break;
        case 'e':
            e.preventDefault();
            setTool('eraseTool', 'erase');
            break;
        case 'g':
            e.preventDefault();
            setTool('bucketTool', 'bucket');
            break;
        case '[':
            brushSize.value = Math.max(1, parseInt(brushSize.value) - 2);
            brushSize.dispatchEvent(new Event('input'));
            updateCursor();
            break;
        case ']':
            brushSize.value = Math.min(100, parseInt(brushSize.value) + 2);
            brushSize.dispatchEvent(new Event('input'));
            updateCursor();
            break;
        case ' ':
            e.preventDefault();
            playBtn.click();
            break;
        case 'f':
            e.preventDefault();
            stopPlayback();
            timeline.nextFrame(canvas, loopToggle.checked);
            syncUI();
            break;

        case 'd':
            e.preventDefault();
            stopPlayback();
            let prev = timeline.currentFrame - 1;
            if (prev < 0) prev = timeline.maxFrames;
            timeline.gotoFrame(prev, canvas);
            syncUI();
            break;

        case '=':
        case '+':
            scale = Math.min(scale * 1.1, 10);
            updateView();
            break;
        case '-':
        case '_':
            scale = Math.max(scale * 0.9, 0.05);
            updateView();
            break;

        case 'delete':
        case 'backspace':
            if (!isCmd) {
                timeline.clearFrame(canvas);
                syncUI();
            }
            break;
        case 'space':
            e.preventDefault();
            play();
            break;
    }
}, true);

if (isElectron) {
    ipcRenderer.on('menu-undo', () => { timeline.undo(canvas); syncUI(); });
    ipcRenderer.on('menu-copy', () => timeline.copyFrame());
    ipcRenderer.on('menu-paste', () => { timeline.pasteFrame(canvas); syncUI(); });
    ipcRenderer.on('menu-clear', () => { timeline.clearFrame(canvas); syncUI(); });
    ipcRenderer.on('menu-save', () => {
        if (currentFilePath) {
            try {
                fs.writeFileSync(currentFilePath, getProjectData());
                console.log("Saved to:", currentFilePath);
                alert("Project Saved!");
            } catch (err) {
                alert("Save failed: " + err.message);
            }
        } else {
            ipcRenderer.send('request-save-as-dialog');
        }
    });

    ipcRenderer.on('menu-save-as', (event, filePath) => {
        if (!filePath) return;

        currentFilePath = filePath;
        try {
            fs.writeFileSync(currentFilePath, getProjectData());
            alert("Project Saved!");
        } catch (err) {
            alert("Save As failed: " + err.message);
        }
    });

    ipcRenderer.on('menu-open', async (event, filePath) => {
        if (!filePath) return;

        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            const data = JSON.parse(rawData);

            currentFilePath = filePath;
            fpsInput.value = data.fps;

            for (let i = 0; i < data.frames.length; i++) {
                if (data.frames[i]) {
                    const img = new Image();
                    img.src = data.frames[i];
                    await img.decode();
                    const tc = document.createElement('canvas');
                    tc.width = canvas.width;
                    tc.height = canvas.height;
                    const tctx = tc.getContext('2d');
                    tctx.drawImage(img, 0, 0);
                    timeline.frames[i] = tctx.getImageData(0, 0, canvas.width, canvas.height);
                } else {
                    timeline.frames[i] = null;
                }
            }
            durationInput.value = data.maxFrames || 60;
            frameSlider.max = data.maxFrames || 60;
            timeline.setDuration(parseInt(durationInput.value));
            timeline.gotoFrame(0, canvas);
            syncUI();
            console.log("Loaded:", currentFilePath);
        } catch (err) {
            alert("Failed to open file: " + err.message);
        }
    });

    window.addEventListener('click', () => {
        frameCtxMenu.style.display = 'none';
    });

    ipcRenderer.on('menu-new', () => {
        if (confirm("Create new project? This will wipe your current canvas.")) {
            timeline.frames = new Array(timeline.maxFrames + 1).fill(null);
            timeline.undoStack = [];
            timeline.gotoFrame(0, canvas);
            syncUI();
        }
    });

    ipcRenderer.on('menu-reset-view', () => {
        scale = 0.5;
        offsetX = (stage.clientWidth - (canvas.width * scale)) / 2;
        offsetY = (stage.clientHeight - (canvas.height * scale)) / 2;
        updateView();
    });


    const exportOverlay = document.getElementById('export-overlay');
    const exportFill = document.getElementById('export-bar-fill');
    const exportStatus = document.getElementById('export-status');

    ipcRenderer.on('menu-export', (e, fmt) => handleExport(fmt));

    ipcRenderer.on('export-progress', (event, percent) => {
        exportFill.style.width = `${percent}%`;
        exportStatus.innerText = `Converting to MP4: ${percent}%`;
    });

    ipcRenderer.on('export-done', () => {
        exportOverlay.style.display = 'none';
    });

}

frameSlider.oninput = (e) => {
    stopPlayback();
    const frameIndex = parseInt(e.target.value);
    timeline.gotoFrame(frameIndex, canvas);
    syncUI();
};

function play() {
    const fps = parseInt(fpsInput.value) || 12;
    const isLooping = loopToggle.checked;

    const moved = timeline.nextFrame(canvas, isLooping);

    if (!moved) {
        stopPlayback();
        return;
    }

    syncUI();

    animationId = setTimeout(() => {
        if (timeline.isPlaying) play();
    }, 1000 / fps);
}

function stopPlayback() {
    timeline.isPlaying = false;
    clearTimeout(animationId);
    playBtn.innerText = "▶ Play";
    playBtn.style.background = "var(--accent)";
}

playBtn.onclick = () => {
    if (timeline.isPlaying) {
        stopPlayback();
    } else {
        if (!loopToggle.checked && timeline.currentFrame >= timeline.maxFrames) {
            timeline.gotoFrame(0, canvas);
            syncUI();
        }

        timeline.isPlaying = true;
        playBtn.innerText = "⏸ Pause";
        playBtn.style.background = "#cc3333";
        play();
    }
};

const endDrawing = () => {
    if (isDrawing) {
        if (currentTool === 'brush') ctx.drawImage(drawingCanvas, 0, 0);

        timeline.saveFrame(canvas);
        updateSingleThumbnail(timeline.currentFrame);
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // Clear the temp
    }
    isDrawing = false;
    isPanning = false;
    stage.style.cursor = 'default';
};

window.addEventListener('touchend', (e) => {
    if (e.touches.length === 0 && e.changedTouches.length === 2) {
        const now = Date.now();
        if (now - lastTapTime < 300) {
            timeline.undo(canvas);
            syncUI();
        }
        lastTapTime = now;
    }

    if (isDrawing) {
        timeline.saveFrame(canvas);
        updateSingleThumbnail(timeline.currentFrame);
    }
    isDrawing = false;
    isPanning = false;
    isPinching = false;
}, { passive: false });

stage.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const oldScale = scale;
        scale = Math.min(Math.max(scale * delta, 0.05), 10);
        const rect = stage.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        offsetX = mouseX - (mouseX - offsetX) * (scale / oldScale);
        offsetY = mouseY - (mouseY - offsetY) * (scale / oldScale);
        updateView();
    }
}, { passive: false });

stage.addEventListener('mousedown', (e) => {
    if (e.button === 1) {
        isPanning = true;
        startX = e.clientX - offsetX;
        startY = e.clientY - offsetY;
        stage.style.cursor = 'grabbing';
    }
});

drawingCanvas.addEventListener('mousedown', onStartDrawing);
drawingCanvas.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    onStartDrawing(e);
}, { passive: false });

window.addEventListener('mousemove', onMoveDrawing);
drawingCanvas.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();
    onMoveDrawing(e);
}, { passive: false })

window.addEventListener('mouseup', endDrawing);
window.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        isPinching = false;
    }
    if (isDrawing) {
        timeline.saveFrame(canvas);
        updateSingleThumbnail(timeline.currentFrame);
    }
    isDrawing = false;
    isPanning = false;
}, { passive: false });

document.getElementById('ctx-clear').onclick = () => {
    if (menuTargetFrame === null) return;
    timeline.frames[menuTargetFrame] = null;
    if (menuTargetFrame === timeline.currentFrame) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    syncUI();
};

document.getElementById('ctx-delete').onclick = () => {
    if (menuTargetFrame === null || timeline.frames.length <= 1) return;

    timeline.frames.splice(menuTargetFrame, 1);

    let newLen = parseInt(durationInput.value) - 1;
    durationInput.value = newLen;
    timeline.maxFrames = newLen;
    frameSlider.max = newLen;

    if (timeline.currentFrame >= timeline.frames.length) {
        timeline.currentFrame = timeline.frames.length - 1;
    }

    timeline.gotoFrame(timeline.currentFrame, canvas);
    syncUI();
};




function floodFill(ctx, x, y, fillColor) {
    const width = canvas.width;
    const height = canvas.height;
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const startPixelTarget = getPixelColor(data, x, y, width);
    const fillRGB = hexToRgb(fillColor);

    if (startPixelTarget[0] === fillRGB.r &&
        startPixelTarget[1] === fillRGB.g &&
        startPixelTarget[2] === fillRGB.b &&
        startPixelTarget[3] === 255) return;

    const stack = [[x, y]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
        const [curX, curY] = stack.pop();
        const idx = curY * width + curX;

        if (curX < 0 || curX >= width || curY < 0 || curY >= height || visited[idx]) continue;

        const currentColor = getPixelColor(data, curX, curY, width);

        if (isSameColor(currentColor, startPixelTarget, 40)) {
            setPixelColor(data, curX, curY, width, fillRGB);
            visited[idx] = 1;

            stack.push([curX + 1, curY]);
            stack.push([curX - 1, curY]);
            stack.push([curX, curY + 1]);
            stack.push([curX, curY - 1]);
        }
    }
    ctx.putImageData(imageData, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    ctx.restore();

    timeline.saveFrame(canvas);
}

function colorsMatch(c1, rgb, tolerance = 30) {
    return Math.abs(c1[0] - rgb.r) <= tolerance &&
        Math.abs(c1[1] - rgb.g) <= tolerance &&
        Math.abs(c1[2] - rgb.b) <= tolerance;
}

function isSameColor(c1, c2, tolerance = 30) {
    if (c2[3] < 10) {
        return c1[3] < 50;
    }

    const rDiff = Math.abs(c1[0] - c2[0]);
    const gDiff = Math.abs(c1[1] - c2[1]);
    const bDiff = Math.abs(c1[2] - c2[2]);
    const aDiff = Math.abs(c1[3] - c2[3]);

    return (rDiff + gDiff + bDiff + aDiff) < tolerance;
}

function getPixelColor(data, x, y, width) {
    const i = (y * width + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

function setPixelColor(data, x, y, width, rgb) {
    const i = (y * width + x) * 4;
    data[i] = rgb.r;
    data[i + 1] = rgb.g;
    data[i + 2] = rgb.b;
    data[i + 3] = 255;
}

function updateCursor(e) {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    if (e) {
        cursor.style.display = 'block';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    const size = toolSettings[currentTool]?.size || 5;
    const displaySize = size * scale;
    cursor.style.width = displaySize + 'px';
    cursor.style.height = displaySize + 'px';
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateOnionSkin() {
    onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);
    if (timeline.isPlaying) return;

    const framesToSee = 2;

    for (let i = 1; i <= framesToSee; i++) {
        const targetIdx = timeline.currentFrame - i;
        if (targetIdx >= 0 && timeline.frames[targetIdx]) {
            tempOnionCanvas.width = onionCanvas.width;
            tempOnionCanvas.height = onionCanvas.height;
            tempOnionCtx.putImageData(timeline.frames[targetIdx], 0, 0);

            onionCtx.save();
            onionCtx.globalAlpha = 0.3 / i;

            onionCtx.globalCompositeOperation = 'source-atop';
            onionCtx.fillStyle = 'rgba(0, 122, 204, 0.5)';
            onionCtx.drawImage(tempOnionCanvas, 0, 0);

            onionCtx.globalCompositeOperation = 'destination-over';
            onionCtx.drawImage(tempOnionCanvas, 0, 0);
            onionCtx.restore();
        }
    }
}

function getCanvasCoords(e) {
    const rect = drawingCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = (clientX - rect.left) * (drawingCanvas.width / rect.width);
    const y = (clientY - rect.top) * (drawingCanvas.height / rect.height);

    return { x, y };
}

const settingsTrigger = document.getElementById('settings-trigger');
const settingsMenu = document.getElementById('settings-menu');
settingsTrigger.onclick = () => {
    settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('smoothingSlider').oninput = (e) => {
    smoothing = parseFloat(e.target.value);
};

function setupContext(targetCtx = ctx) {
    const settings = toolSettings[currentTool];
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    targetCtx.lineWidth = settings.size || brushSize.value || 5;
    targetCtx.globalAlpha = settings.opacity || (opacitySlider.value / 100) || 1;

    if (currentTool === 'erase') {
        targetCtx.globalCompositeOperation = 'destination-out';
        targetCtx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
        targetCtx.globalCompositeOperation = 'source-over';
        targetCtx.strokeStyle = colorPicker.value || '#000000';
    }
}
function updateView() {
    wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

const tools = [
    { id: 'brushTool', name: 'brush' },
    { id: 'eraseTool', name: 'erase' },
    { id: 'bucketTool', name: 'bucket' }
];

tools.forEach(tool => {
    const btn = document.getElementById(tool.id);
    if (btn) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault(); // Stop ghost clicks
            console.log("Switching to:", tool.name);
            setTool(tool.id, tool.name);
        });
    }
});

document.getElementById('brushTool').onclick = () => setTool('brushTool', 'brush');
document.getElementById('eraseTool').onclick = () => setTool('eraseTool', 'erase');
//document.getElementById('rectTool').onclick = () => setTool('rectTool', 'rect');
document.getElementById('bucketTool').onclick = () => setTool('bucketTool', 'bucket');

function updateToolUI(id) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function updateCounter(current, total) {
    document.getElementById('frameCounter').innerText =
        `${String(current).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
}

function updateSingleThumbnail(index) {
    const thumbs = frameStrip.querySelectorAll('.thumb');
    const target = thumbs[index];
    if (target) {
        if (timeline.frames[index]) {
            target.classList.add('has-data');
        } else {
            target.classList.remove('has-data');
        }
    }
}

function getTouchDist(t1, t2) {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
}

function getTouchMid(t1, t2) {
    return {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2
    };
}

function onStartDrawing(e) {
    if (timeline.isPlaying) return;

    if (e.touches && e.touches.length >= 2) {
        isDrawing = false;
        isPinching = true;
        initialPinchDistance = getTouchDist(e.touches[0], e.touches[1]);
        initialScale = scale;
        const mid = getTouchMid(e.touches[0], e.touches[1]);
        lastTouchMidX = mid.x;
        lastTouchMidY = mid.y;
        return;
    }

    if (e.type === 'mousedown' && e.button !== 0) return;

    isDrawing = true;
    timeline.recordState();
    const pos = getCanvasCoords(e);
    smoothedX = pos.x;
    smoothedY = pos.y;
    currentPath = [{ x: smoothedX, y: smoothedY }];

    if (currentTool === 'bucket') {
        floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), colorPicker.value);
        isDrawing = false;
    } else {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        setupContext(drawingCtx);
    }
}

function onMoveDrawing(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isPanning) {
        offsetX = clientX - startX;
        offsetY = clientY - startY;
        updateView();
        return;
    }

    if (isPinching && e.touches.length === 2) {
        const currentDist = getTouchDist(e.touches[0], e.touches[1]);
        const mid = getTouchMid(e.touches[0], e.touches[1]);

        const zoomFactor = currentDist / initialPinchDistance;
        const newScale = Math.min(Math.max(initialScale * zoomFactor, 0.05), 10);

        offsetX -= (mid.x - offsetX) * (newScale / scale - 1);
        offsetY -= (mid.y - offsetY) * (newScale / scale - 1);

        scale = newScale;

        offsetX += (mid.x - lastTouchMidX);
        offsetY += (mid.y - lastTouchMidY);

        lastTouchMidX = mid.x;
        lastTouchMidY = mid.y;

        updateView();
        return;
    }

    if (!isDrawing) return;

    const pos = getCanvasCoords(e);
    smoothedX += (pos.x - smoothedX) * (1 - smoothing);
    smoothedY += (pos.y - smoothedY) * (1 - smoothing);

    if (currentTool === 'brush') {
        currentPath.push({ x: smoothedX, y: smoothedY });

        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCtx.beginPath();
        drawingCtx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            drawingCtx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        drawingCtx.stroke();
    } else if (currentTool === 'erase') {
        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = toolSettings.erase.size;
        const lastPos = currentPath[currentPath.length - 1] || pos;
        ctx.moveTo(lastPos.x, lastPos.y);
        ctx.lineTo(smoothedX, smoothedY);
        ctx.stroke();
        currentPath.push({ x: smoothedX, y: smoothedY });
    }
}

async function handleExport(format) {
    const exportOverlay = document.getElementById('export-overlay');
    const exportFill = document.getElementById('export-bar-fill');

    stopPlayback();
    exportOverlay.style.display = 'flex';

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    const stream = exportCanvas.captureStream(0);
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
    const chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'video/webm' });

        if (isElectron) {
            const arrayBuffer = await blob.arrayBuffer();
            ipcRenderer.send('save-exported-file', { BufferData: arrayBuffer, requestedFormat: format, fps: parseInt(fpsInput.value) || 12 });
        } else {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                try {
                    await Media.saveVideo({ path: reader.result });
                    alert("Saved to Photos!");
                } catch (err) {
                    console.error("Gallery save failed:", err);
                    alert("Could not save to photos. Check permissions.");
                }
                exportOverlay.style.display = 'none';
            };
        }
    };

    recorder.start();
    for (let i = 0; i <= timeline.maxFrames; i++) {
        exportCtx.fillStyle = "#FFFFFF";
        exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        if (timeline.frames[i]) {
            const temp = document.createElement('canvas');
            temp.width = canvas.width; temp.height = canvas.height;
            temp.getContext('2d').putImageData(timeline.frames[i], 0, 0);
            exportCtx.drawImage(temp, 0, 0);
        }
        stream.getVideoTracks()[0].requestFrame();
        await new Promise(r => setTimeout(r, 1000 / (parseInt(fpsInput.value) || 12)));
        exportFill.style.width = `${(i / timeline.maxFrames) * 100}%`;
    }
    recorder.stop();
}

window.addEventListener('load', () => {
    setTimeout(() => {
        init();
        updateThumbnails();
    }, 50);
});