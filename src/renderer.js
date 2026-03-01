import { Timeline } from "./timeline.js";
const { ipcRenderer } = require('electron');

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

const onionCanvas = document.getElementById('onionCanvas');
const onionCtx = onionCanvas.getContext('2d');

const tempOnionCanvas = document.createElement('canvas');
const tempOnionCtx = tempOnionCanvas.getContext('2d');

let scale = 0.5;
let offsetX = 100, offsetY = 100;
let isPanning = false;
let isDrawing = false;
let currentTool = 'brush';
let startX, startY;
let animationId = null;

function init() {
    // Set initial position
    offsetX = (stage.clientWidth - (canvas.width * scale)) / 2;
    offsetY = (stage.clientHeight - (canvas.height * scale)) / 2;

    updateView();
    syncUI();
}

function setTool(toolId, toolName) {
    currentTool = toolName;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(toolId).classList.add('active');
}

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
            case 'z':
                e.preventDefault();
                timeline.undo(canvas);
                syncUI();
                break;
            case 'c':
                e.preventDefault();
                timeline.copyFrame();
                break;
            case 'v':
                e.preventDefault();
                timeline.pasteFrame(canvas);
                syncUI();
                break;
        }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
        timeline.clearFrame(canvas);
        syncUI();
    }
});

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
    timeline.nextFrame(canvas);
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
    startX = pos.x;
    startY = pos.y;

    if (currentTool === 'bucket') {
        const fillColor = colorPicker.value;
        // We use Math.floor because pixels must be whole numbers
        floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), fillColor);
        isDrawing = false; // Don't "drag" the bucket
    } else if (currentTool === 'brush' || currentTool === 'erase') {
        setupContext();
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
});

window.addEventListener('mousemove', (e) => {
    if (isPanning) {
        offsetX = e.clientX - startX;
        offsetY = e.clientY - startY;
        updateView();
        return;
    }
    const cursor = document.getElementById('cursor');
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';

    if (!isDrawing) return;
    const pos = getCanvasCoords(e);
    if (currentTool === 'brush' || currentTool === 'erase') {
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
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

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function updateOnionSkin() {
    // Clear the ghost layer completely
    onionCtx.clearRect(0, 0, onionCanvas.width, onionCanvas.height);

    if (timeline.currentFrame > 0 && !timeline.isPlaying) {
        const prevFrame = timeline.frames[timeline.currentFrame - 1];
        if (prevFrame) {
            tempOnionCanvas.width = onionCanvas.width;
            tempOnionCanvas.height = onionCanvas.height;

            // Use the temp canvas to handle the ghost transparency
            tempOnionCtx.putImageData(prevFrame, 0, 0);

            onionCtx.save();
            onionCtx.globalAlpha = 0.2; // This makes it a "ghost"
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

function setupContext() {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize.value;
    ctx.globalCompositeOperation = currentTool === 'erase' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = colorPicker.value;
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