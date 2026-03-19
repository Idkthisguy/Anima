import { Timeline } from "./timeline.js";

window.focus();

// --- CRASH LOG SYSTEM ---
function handleCrash(message, source, lineno, colno, error) {
    const report = `--- ANIMA CRASH REPORT (${new Date().toLocaleString()}) ---
Look, I'm building this solo and I clearly missed something. Sorry about that!

ERROR: ${message}
FILE: ${source}
LINE: ${lineno}:${colno}
STACK: ${error ? error.stack : 'N/A'}

------------------------------------------`;

    window.AnimaAPI.sendCrashReport(report);
}


window.onerror = (m, s, l, c, e) => { handleCrash(m, s, l, c, e); return false; };
window.onunhandledrejection = (e) => { handleCrash(e.reason, 'Async/Promise', 0, 0, e.reason); };
// --- END CRASH SYSTEM ---

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const wrapper = document.getElementById('canvas-wrapper');
const stage = document.getElementById('stage-container');
const timeline = new Timeline(60);

const bucketBtn = document.getElementById('bucketTool');
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameSlider = document.getElementById('frameSlider');
const frameStrip = document.getElementById('frame-strip');
const playBtn = document.getElementById('playBtn');
const fpsInput = document.getElementById('fpsInput');
const frameCounter = document.getElementById('frameCounter');
const loopToggle = document.getElementById('loopToggle');

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

undoBtn.addEventListener('click', () => {
    timeline.undo(canvas);
    syncUI();
});

redoBtn.addEventListener('click', () => {
    timeline.redo(canvas);
    syncUI();
});


const onionCanvas = document.getElementById('onionCanvas');
const onionCtx = onionCanvas.getContext('2d');

const tempOnionCanvas = document.createElement('canvas');
const tempOnionCtx = tempOnionCanvas.getContext('2d');

const drawingCanvas = document.createElement('canvas');
drawingCanvas.width = canvas.width;
drawingCanvas.height = canvas.height;
const drawingCtx = drawingCanvas.getContext('2d');

const frameCtxMenu = document.getElementById('frame-context-menu');
let menuTargetFrame = null;

let activePointers = new Map();
let initialPinchDistance = 0;
let initialScale = 1;

canvas.style.touchAction = 'none';

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

const copyBtn = document.getElementById("copyBtn");
const pasteBtn = document.getElementById("pasteBtn");

copyBtn.addEventListener('click', () => {
    timeline.copyFrame();
});

pasteBtn.addEventListener('click', () => {
    timeline.pasteFrame(canvas);
    syncUI();
});

let currentFilePath = null;

let brushPreviewTimeout = null;

const toolSettings = {
    brush: { size: 5, opacity: 1, color: '#000000' },
    erase: { size: 20, opacity: 1 },
    bucket: { tolerance: 40 }
};

const opacitySlider = document.getElementById('brushOpacity');

function init() {
    offsetX = (stage.clientWidth - (canvas.width * scale)) / 2;
    offsetY = (stage.clientHeight - (canvas.height * scale)) / 2;

    updateView();
    syncUI();
}

document.getElementById('loopToggle').addEventListener('click', (e) => {
    e.target.blur();
});

function setTool(toolId, toolName) {
    currentTool = toolName;

    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(toolId).classList.add('active');

    if (toolSettings[currentTool]) {
        brushSize.value = toolSettings[currentTool].size;
        opacitySlider.value = toolSettings[currentTool].opacity * 100;

        if (currentTool === 'brush') {
            colorPicker.value = toolSettings[currentTool].color;
        }
    }

    setupContext(drawingCtx);
    setupContext(ctx);
}

brushSize.oninput = () => {
    if (toolSettings[currentTool]) toolSettings[currentTool].size = brushSize.value;

    const brushPreview = document.getElementById('brush-preview');
    if (brushPreview) {
        brushPreview.style.opacity = '1';
        updateCursor();

        clearTimeout(brushPreviewTimeout);
        brushPreviewTimeout = setTimeout(() => {
            if (!isDrawing) brushPreview.style.opacity = '0';
        }, 1000);
    }
};

opacitySlider.oninput = () => {
    if (toolSettings[currentTool]) toolSettings[currentTool].opacity = opacitySlider.value / 100;
};

colorPicker.oninput = () => {
    const newColor = colorPicker.value;
    if (currentTool === 'brush') toolSettings.brush.color = colorPicker.value;

    document.querySelector('.color-picker-wrapper').style.background = colorPicker.value;
};

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    const isCmd = e.ctrlKey || e.metaKey;

    console.log(`Key pressed: ${key} | Ctrl: ${isCmd}`);

    if (isCmd) {
        if (key === 'z' && !e.shiftKey) {
            e.preventDefault();
            timeline.undo(canvas);
            syncUI();
            return;
        }
        if (key === 'y' || (key === 'z' && e.shiftKey)) {
            e.preventDefault();
            timeline.redo(canvas);
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
        /*if (isCmd && key === 'k') {
            process.crash();
        }*/  // DANGER!!!!!!!
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

function getProjectData() {
    return JSON.stringify({
        appName: "Anima",
        version: "1.0-beta",
        fps: fpsInput.value,
        maxFrames: timeline.maxFrames,
        frames: timeline.frames.map(imgData => {
            if (!imgData) return null;
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            tempCanvas.getContext('2d').putImageData(imgData, 0, 0);
            return tempCanvas.toDataURL();
        })
    });
}

function syncUI() {
    frameSlider.value = timeline.currentFrame;
    frameCounter.innerText = `Frame: ${timeline.currentFrame}`;
    updateOnionSkin();
    updateThumbnails();
}

function updateThumbnails() {
    frameStrip.innerHTML = '';
    for (let i = 0; i < timeline.maxFrames; i++) {
        const frameData = timeline.frames[i];

        const thumb = document.createElement('div');
        thumb.className = `thumb ${i === timeline.currentFrame ? 'active' : ''}`;

        if (frameData) thumb.classList.add('has-data');

        thumb.innerText = i + 1;
        thumb.onclick = () => {
            stopPlayback();
            timeline.saveFrame(canvas);
            timeline.gotoFrame(i, canvas);
            syncUI();
        };

        frameStrip.appendChild(thumb);
    }
}

window.addEventListener('click', () => {
    frameCtxMenu.style.display = 'none';
});

frameSlider.oninput = (e) => {
    stopPlayback();
    timeline.saveFrame(canvas);
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
    playBtn.querySelector('.btn-icon').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-icon lucide-play"><path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"/></svg>`;
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
        playBtn.querySelector('.btn-icon').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause-icon lucide-pause"><rect x="14" y="3" width="5" height="18" rx="1"/><rect x="5" y="3" width="5" height="18" rx="1"/></svg>`;
        playBtn.style.background = "#cc3333";
        play();
    }
};

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

canvas.addEventListener('pointerdown', (e) => {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (timeline.isPlaying) return;

    const brushPreview = document.getElementById('brush-preview');
    if (brushPreview) brushPreview.style.opacity = '1';

    if (activePointers.size === 1) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;

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
        canvas.setPointerCapture(e.pointerId);
    }
    else if (activePointers.size === 2) {
        isDrawing = false;
        isPanning = true;

        const pts = Array.from(activePointers.values());
        initialPinchDistance = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        initialScale = scale;

        startX = ((pts[0].x + pts[1].x) / 2) - offsetX;
        startY = ((pts[0].y + pts[1].y) / 2) - offsetY;
    }
});

window.addEventListener('pointermove', (e) => {
    // 1. Update the pointer position in our map
    if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    updateCursor(e);

    if (isPanning && e.pointerType === 'mouse') {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateView();
        return; // Don't draw while panning
    }

    // 2. PINCH / ZOOM / PAN LOGIC (Multi-finger or multi-input)
    if (activePointers.size >= 2) {
        const pts = Array.from(activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

        const zoomFactor = currentDist / initialPinchDistance;
        scale = Math.min(Math.max(initialScale * zoomFactor, 0.05), 10);

        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        offsetX = midX - startX;
        offsetY = midY - startY;

        updateView();
        return; // Stop here so we don't draw while zooming
    }

    // 3. DRAWING LOGIC (Single input)
    if (isDrawing && activePointers.size === 1) {
        const pos = getCanvasCoords(e);

        // Apply smoothing (Like a car's steering wheel having a little weight)
        smoothedX += (pos.x - smoothedX) * (1 - smoothing);
        smoothedY += (pos.y - smoothedY) * (1 - smoothing);

        if (currentTool === 'brush') {
            currentPath.push({ x: smoothedX, y: smoothedY });
            drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Draw the smooth path
            drawingCtx.beginPath();
            drawingCtx.moveTo(currentPath[0].x, currentPath[0].y);
            for (let i = 1; i < currentPath.length; i++) {
                drawingCtx.lineTo(currentPath[i].x, currentPath[i].y);
            }
            drawingCtx.stroke();

            // Refresh main canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (timeline.frames[timeline.currentFrame]) {
                ctx.putImageData(timeline.frames[timeline.currentFrame], 0, 0);
            }
            ctx.drawImage(drawingCanvas, 0, 0);

        } else if (currentTool === 'erase') {
            setupContext(ctx);
            ctx.beginPath();
            const lastPoint = currentPath[currentPath.length - 1];
            ctx.moveTo(lastPoint.x, lastPoint.y);
            ctx.lineTo(smoothedX, smoothedY);
            ctx.stroke();
            currentPath.push({ x: smoothedX, y: smoothedY });
        }
    }
});

window.addEventListener('pointerup', (e) => {
    // Save the frame if we were drawing
    if (isDrawing && activePointers.size === 1) {
        timeline.saveFrame(canvas);
        updateSingleThumbnail(timeline.currentFrame);
        canvas.releasePointerCapture(e.pointerId);
    }

    // Clean up the map
    activePointers.delete(e.pointerId);

    // Reset states based on what's left
    if (activePointers.size < 2) {
        isPanning = false;
        stage.style.cursor = 'default';
    }

    if (activePointers.size === 0) {
        isDrawing = false;
        const brushPreview = document.getElementById('brush-preview');
        if (brushPreview) brushPreview.style.opacity = '0';
    }

    if (e.button === 1) { // Middle mouse
        isPanning = false;
        stage.style.cursor = 'default';
    }
});
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
    const crosshair = document.getElementById('crosshair');
    const brushPreview = document.getElementById('brush-preview');
    if (!crosshair || !brushPreview) return;

    // Toggle crosshair visibility based on drawing state
    crosshair.style.opacity = isDrawing ? '0' : '1';

    if (e) {
        const x = e.clientX + 'px';
        const y = e.clientY + 'px';

        crosshair.style.left = x;
        crosshair.style.top = y;

        brushPreview.style.left = x;
        brushPreview.style.top = y;
    }

    const size = toolSettings[currentTool]?.size || 5;
    const displaySize = size * scale;
    brushPreview.style.width = displaySize + 'px';
    brushPreview.style.height = displaySize + 'px';
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
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) / scale,
        y: (e.clientY - rect.top) / scale
    };
}

const settingsTrigger = document.getElementById('settings-trigger');
const settingsMenu = document.getElementById('settings-menu');
settingsTrigger.onclick = () => {
    settingsTrigger.classList.toggle('active');

    settingsMenu.classList.toggle('visible');

    settingsMenu.style.display = settingsMenu.classList.contains('visible') ? 'block' : 'none';
};

document.getElementById('smoothingSlider').oninput = (e) => {
    smoothing = parseFloat(e.target.value);
};

function setupContext(targetCtx = ctx) {
    const settings = toolSettings[currentTool];
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';

    targetCtx.lineWidth = settings.size || brushSize.value || 5;

    if (currentTool === 'erase') {
        targetCtx.globalCompositeOperation = 'destination-out';
        targetCtx.globalAlpha = settings.opacity || 1;
    } else {
        targetCtx.globalCompositeOperation = 'source-over';
        targetCtx.strokeStyle = colorPicker.value || '#000000';
        targetCtx.globalAlpha = settings.opacity || (opacitySlider.value / 100) || 1;
    }
}
function updateView() {
    wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

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

function checkValidFrames() {  // Checks for empty frames for spritesheet and filters thems
    const validFrames = []
    console.log(`Checking ${timeline.frames.length} total timeline slots...`);

    for (let i = 0; i < timeline.frames.length; i++) {
        const frameData = timeline.frames[i];

        if (!frameData) {
            console.log(`Frame ${i} is literally null.`);
            continue;
        }

        let isBlank = true;
        const pixels = frameData.data;


        for (let p = 3; p < pixels.length; p += 4) {
            if (pixels[p] > 0) {
                isBlank = false;
                break;
            }
        }

        if (!isBlank) {
            validFrames.push(frameData)
        }
    }
    return validFrames;
}

async function buildAndExportSpritesheet() {
    stopPlayback();

    timeline.saveFrame(canvas);

    const currentImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    timeline.frames[timeline.currentFrame] = currentImageData;

    console.log(`Forced sync of Frame ${timeline.currentFrame} before export.`);

    const framesToExport = checkValidFrames();

    if (framesToExport.length === 0) {
        alert("THE TIMELINE IS EMPTY!");
        return;
    }

    const columns = 8;
    const totalFrames = timeline.maxFrames;
    const rows = Math.ceil(framesToExport.length / columns);

    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = canvas.width * columns;
    sheetCanvas.height = canvas.height * rows;
    const sheetCtx = sheetCanvas.getContext('2d');


    for (let i = 0; i < totalFrames; i++) {
        const frameData = timeline.frames[i];
        if (!frameData) continue;

        const currentCol = i % columns;
        const currentRow = Math.floor(i / columns);

        const stampX = currentCol * canvas.width;
        const stampY = currentRow * canvas.height;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').putImageData(frameData, 0, 0);

        sheetCtx.drawImage(tempCanvas, stampX, stampY);
    }

    const dataUrl = sheetCanvas.toDataURL('image/png');
    const base64Data = dataUrl.split(';base64,').pop();
    window.AnimaAPI.sendSpriteSheet(base64Data);
}

function packProject() {
    const savedFrames = timeline.frames.map(frame => {
        if (!frame) return null;
        const tmp = document.createElement('canvas');
        tmp.width = frame.width;
        tmp.height = frame.height;
        tmp.getContext('2d').putImageData(frame, 0, 0);
        return tmp.toDataURL('image/png');
    });

    return {
        version: "1.3",
        maxFrames: timeline.maxFrames,
        fps: parseInt(fpsInput.value) || 12,
        frames: savedFrames
    };
}

async function exportVideo(format) {
    stopPlayback();
    timeline.saveFrame(canvas);

    const validFrames = checkValidFrames();
    if (validFrames.length === 0) {
        alert("Nothing to export, draw something first :/");
        return;
    }

    const overlay = document.getElementById('export-overlay');
    const barFill = document.getElementById('export-bar-fill');
    const status = document.getElementById('export-status');
    overlay.style.display = 'flex';
    barFill.style.width = '0%';
    status.innerText = 'Preparing frames...';

    const fps = parseInt(fpsInput.value) || 12;

    const frameDataUrls = [];
    const tmp = document.createElement('canvas');
    tmp.width = canvas.width;
    tmp.height = canvas.height;
    const tmpCtx = tmp.getContext('2d');

    for (let i = 0; i < validFrames.length; i++) {
        tmpCtx.fillStyle = '#ffffff';
        tmpCtx.fillRect(0, 0, tmp.width, tmp.height);

        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = tmp.width;
        frameCanvas.height = tmp.height;
        frameCanvas.getContext('2d').putImageData(validFrames[i], 0, 0);
        tmpCtx.drawImage(frameCanvas, 0, 0);

        frameDataUrls.push(tmp.toDataURL('image/png').split(',')[1]);
        barFill.style.width = Math.round((i / validFrames.length) * 50) + '%';
        status.innerText = `Packing frame ${i + 1} / ${validFrames.length}...`;
        await new Promise(r => setTimeout(r, 0));
    }

    status.innerText = 'Sending to encoder...';
    barFill.style.width = '55%';

    window.AnimaAPI.exportFrames({ frames: frameDataUrls, format, fps });
}

function exportGif() {
    stopPlayback();
    timeline.saveFrame(canvas);

    const validFrames = checkValidFrames();
    if (validFrames.length === 0) { alert("Nothing to export!"); return; }

    const overlay = document.getElementById('export-overlay');
    const barFill = document.getElementById('export-bar-fill');
    const status = document.getElementById('export-status');
    overlay.style.display = 'flex';
    status.innerText = 'Building GIF...';

    const fps = parseInt(fpsInput.value) || 12;
    const delay = Math.round(1000 / fps);

    const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: './gif.worker.js',
        transparent: 0xFF00FF
    });

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    validFrames.forEach((frame, i) => {
        const pixels = new Uint8ClampedArray(frame.data);

        for (let p = 0; p < pixels.length; p += 4) {
            if (pixels[p + 3] < 128) {
                pixels[p] = 255;
                pixels[p + 1] = 0;
                pixels[p + 2] = 255;
                pixels[p + 3] = 255;
            }
        }

        const keyed = new ImageData(pixels, frame.width, frame.height);
        gif.addFrame(keyed, { delay });
        barFill.style.width = Math.round((i / validFrames.length) * 60) + '%';
    });

    gif.on('progress', (p) => {
        barFill.style.width = (60 + Math.round(p * 40)) + '%';
        status.innerText = `Encoding... ${Math.round(p * 100)}%`;
    });

    gif.on('finished', (blob) => {
        blob.arrayBuffer().then((buf) => {
            window.AnimaAPI.saveGif(Array.from(new Uint8Array(buf)));
            overlay.style.display = 'none';
        });
    });

    gif.render();
}

window.AnimaAPI.onMenuAction('save', () => { window.AnimaAPI.saveProject(packProject()) })
window.AnimaAPI.onMenuAction('open', (projectData) => {
    timeline.frames = new Array(projectData.maxFrames).fill(null);
    timeline.setDuration(projectData.maxFrames);
    durationInput.value = projectData.maxFrames;
    frameSlider.max = projectData.maxFrames;
    if (projectData.fps) fpsInput.value = projectData.fps;

    let loaded = 0;
    const total = projectData.frames.filter(f => f !== null).length;

    if (total === 0) {
        timeline.gotoFrame(0, canvas);
        syncUI();
        return;
    }

    projectData.frames.forEach((frameDataUrl, i) => {
        if (!frameDataUrl) return;

        const img = new Image();
        img.onload = () => {
            const tmp = document.createElement('canvas');
            tmp.width = canvas.width;
            tmp.height = canvas.height;
            tmp.getContext('2d').drawImage(img, 0, 0);
            timeline.frames[i] = tmp.getContext('2d').getImageData(0, 0, tmp.width, tmp.height);

            loaded++;
            if (loaded === total) {
                timeline.gotoFrame(0, canvas);
                syncUI();
            }
        };
        img.src = frameDataUrl;
    });
});

window.AnimaAPI.onMenuAction('export', async (format) => {
    if (format === 'spritesheet') { buildAndExportSpritesheet(); return; }
    if (format === 'gif') { exportGif(); return; }
    exportVideo(format);
});

window.AnimaAPI.onEvent('export-done', () => {
    document.getElementById('export-overlay').style.display = 'none';
});
window.AnimaAPI.onEvent('export-progress', (pct) => {
    document.getElementById('export-bar-fill').style.width = pct + '%';
    document.getElementById('export-status').innerText = pct + '%';
});

init();