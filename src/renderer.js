import { Timeline } from "./timeline.js";
const { ipcRenderer } = require('electron');

window.focus();

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

const onionCanvas = document.getElementById('onionCanvas');
const onionCtx = onionCanvas.getContext('2d');

const tempOnionCanvas = document.createElement('canvas');
const tempOnionCtx = tempOnionCanvas.getContext('2d');

const drawingCanvas = document.createElement('canvas');
drawingCanvas.width = canvas.width;
drawingCanvas.height = canvas.height;
const drawingCtx = drawingCanvas.getContext('2d');

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

const toolSettings = {
    brush: { size: 5, opacity: 1, color: '#000000' },
    erase: { size: 20, opacity: 1 },
    bucket: { tolerance: 40 }
};

const opacitySlider = document.getElementById('brushOpacity');

function init() {
    // Set initial position
    offsetX = (stage.clientWidth - (canvas.width * scale)) / 2;
    offsetY = (stage.clientHeight - (canvas.height * scale)) / 2;

    updateView();
    syncUI();
}

function setTool(toolId, toolName) {
    currentTool = toolName;

    // UI Update
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(toolId).classList.add('active');

    // SYNC SLIDERS TO THE TOOL'S MEMORY
    if (toolSettings[currentTool]) {
        brushSize.value = toolSettings[currentTool].size;
        opacitySlider.value = toolSettings[currentTool].opacity * 100;

        if (currentTool === 'brush') {
            colorPicker.value = toolSettings[currentTool].color;
        }
    }
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

    console.log(`Key pressed: ${key} | Ctrl: ${isCmd}`); // DEBUG LINE

    // 1. Handle Undo/Copy/Paste first
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

    // 2. Handle Tools and Navigation
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
        // Bracket keys for Brush Size
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
        // Space for Play/Pause
        case ' ':
            e.preventDefault();
            playBtn.click();
            break;
        // Navigation
        case 'arrowright':
            stopPlayback();
            timeline.nextFrame(canvas, loopToggle.checked);
            syncUI();
            break;
        case 'arrowleft':
            stopPlayback();
            let prev = timeline.currentFrame - 1;
            if (prev < 0) prev = timeline.maxFrames;
            timeline.gotoFrame(prev, canvas);
            syncUI();
            break;
    }
}, true);

ipcRenderer.on('menu-undo', () => { timeline.undo(canvas); syncUI(); });
ipcRenderer.on('menu-copy', () => timeline.copyFrame());
ipcRenderer.on('menu-paste', () => { timeline.pasteFrame(canvas); syncUI(); });
ipcRenderer.on('menu-clear', () => { timeline.clearFrame(canvas); syncUI(); });

function syncUI() {
    frameSlider.value = timeline.currentFrame;
    frameCounter.innerText = `Frame: ${timeline.currentFrame}`;
    updateOnionSkin();
    updateThumbnails();
}

function updateThumbnails() {
    frameStrip.innerHTML = '';
    timeline.frames.forEach((frame, i) => {
        const t = document.createElement('div');
        t.className = `thumb ${i === timeline.currentFrame ? 'active' : ''} ${frame ? 'has-data' : ''}`;
        t.innerText = i;
        t.onclick = () => {
            stopPlayback();
            timeline.gotoFrame(i, canvas);
            syncUI();
        };
        frameStrip.appendChild(t);
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

    // Check if we can move to the next frame
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
        timeline.isPlaying = true;
        playBtn.innerText = "⏸ Pause";
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
    }
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || timeline.isPlaying) return;
    isDrawing = true;
    timeline.recordState();

    const pos = getCanvasCoords(e);
    smoothedX = pos.x; // Initialize smoothing at click point
    smoothedY = pos.y;

    // Start a new path history
    currentPath = [{ x: smoothedX, y: smoothedY }];

    if (currentTool === 'bucket') {
        floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), colorPicker.value);
        isDrawing = false;
    } else {
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        setupContext(drawingCtx);
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateView();
        return;
    }

    // 1. Get current mouse position FIRST
    const pos = getCanvasCoords(e);

    // 2. Standard Cursor Logic (Visual only)
    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';

    updateCursor(e);

    // 3. Apply Smoothing Math
    // This "pulls" the smoothed point toward the actual mouse position
    smoothedX += (pos.x - smoothedX) * (1 - smoothing);
    smoothedY += (pos.y - smoothedY) * (1 - smoothing);

    if (!isDrawing) return;

    if (currentTool === 'brush') {
        // BRUSH MODE: Use temp canvas for smooth performance
        currentPath.push({ x: smoothedX, y: smoothedY });
        drawingCtx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
        drawingCtx.beginPath();
        drawingCtx.moveTo(currentPath[0].x, currentPath[0].y);
        for (let i = 1; i < currentPath.length; i++) {
            drawingCtx.lineTo(currentPath[i].x, currentPath[i].y);
        }
        drawingCtx.stroke();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (timeline.frames[timeline.currentFrame]) {
            ctx.putImageData(timeline.frames[timeline.currentFrame], 0, 0);
        }
        ctx.drawImage(drawingCanvas, 0, 0);
    }
    else if (currentTool === 'erase') {
        // ERASER MODE: Direct to main canvas
        // We use smoothed coords for a nice clean wipe
        ctx.beginPath();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = toolSettings.erase.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Connect from last point to current smoothed point
        const lastPoint = currentPath[currentPath.length - 1];
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(smoothedX, smoothedY);
        ctx.stroke();

        currentPath.push({ x: smoothedX, y: smoothedY });
    }
});

window.addEventListener('mouseup', () => {
    if (isDrawing) {
        timeline.saveFrame(canvas);
        updateThumbnails();
    }
    isDrawing = false;
    isPanning = false;
});


function floodFill(ctx, x, y, fillColor) {
    const width = canvas.width;
    const height = canvas.height;
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const startPixelTarget = getPixelColor(data, x, y, width);
    const fillRGB = hexToRgb(fillColor);

    // Stop if clicking same color
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

        // Lowered tolerance to 40 - it's the "Safe Zone"
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
    ctx.globalCompositeOperation = 'destination-over'; // Draws BEHIND your lines
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 2; // This is your "Expansion" amount
    ctx.lineJoin = 'round';

    ctx.restore();

    timeline.saveFrame(canvas);
}

// Helper 1: Compares canvas pixel vs Color Picker (Tolerance)
function colorsMatch(c1, rgb, tolerance = 30) {
    return Math.abs(c1[0] - rgb.r) <= tolerance &&
        Math.abs(c1[1] - rgb.g) <= tolerance &&
        Math.abs(c1[2] - rgb.b) <= tolerance;
}

// Helper 2: Compares two canvas pixels [r,g,b,a] to see if they are basically the same
function isSameColor(c1, c2, tolerance = 30) {
    // Match transparency
    if (c2[3] < 10) {
        return c1[3] < 50; // Only match if the current pixel is also very transparent
    }

    // If we're looking at a solid color
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

    // 1. Position it (if we have mouse coordinates)
    if (e) {
        cursor.style.display = 'block';
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    }

    // 2. Resize it based on current tool and scale
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

    const framesToSee = 2; // Look 2 frames back

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
    settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
};

document.getElementById('smoothingSlider').oninput = (e) => {
    smoothing = parseFloat(e.target.value);
};

function setupContext(targetCtx = ctx) { // Default to main ctx
    const settings = toolSettings[currentTool];
    targetCtx.lineCap = 'round';
    targetCtx.lineJoin = 'round';
    targetCtx.lineWidth = settings.size;
    targetCtx.globalCompositeOperation = currentTool === 'erase' ? 'destination-out' : 'source-over';
    targetCtx.globalAlpha = settings.opacity;
    targetCtx.strokeStyle = currentTool === 'erase' ? 'rgba(0,0,0,1)' : colorPicker.value;
}
function updateView() {
    wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

document.getElementById('brushTool').onclick = () => setTool('brushTool', 'brush');
document.getElementById('eraseTool').onclick = () => setTool('eraseTool', 'erase');
document.getElementById('rectTool').onclick = () => setTool('rectTool', 'rect');
document.getElementById('bucketTool').onclick = () => setTool('bucketTool', 'bucket');

function updateToolUI(id) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

init();