import { Timeline } from "./timeline.js";
const { ipcRenderer } = require('electron');

const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const wrapper = document.getElementById('canvas-wrapper');
const stage = document.getElementById('stage-container');
const timeline = new Timeline(60);

// UI Refs
const colorPicker = document.getElementById('colorPicker');
const brushSize = document.getElementById('brushSize');
const frameSlider = document.getElementById('frameSlider');
const frameStrip = document.getElementById('frame-strip');
const playBtn = document.getElementById('playBtn');
const fpsInput = document.getElementById('fpsInput');
const frameCounter = document.getElementById('frameCounter');


// State
let scale = 0.5;
let offsetX = 100, offsetY = 100;
let isPanning = false;
let isDrawing = false;
let currentTool = 'brush';
let startX, startY;
let animationId = null;

// --- Initialization ---
function init() {
    // Set initial position
    offsetX = (stage.clientWidth - (canvas.width * scale)) / 2;
    offsetY = (stage.clientHeight - (canvas.height * scale)) / 2;

    updateView();
    syncUI();
}

window.addEventListener('keydown', (e) => {
    // Prevent triggering shortcuts if the user is typing in a number/text input
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

// 2. Fallback for the Top Application Menu (from main.js)
ipcRenderer.on('menu-undo', () => { timeline.undo(canvas); syncUI(); });
ipcRenderer.on('menu-copy', () => timeline.copyFrame());
ipcRenderer.on('menu-paste', () => { timeline.pasteFrame(canvas); syncUI(); });
ipcRenderer.on('menu-clear', () => { timeline.clearFrame(canvas); syncUI(); });

// --- Navigation & Sync ---
function syncUI() {
    // Update Slider
    frameSlider.value = timeline.currentFrame;
    // Update Text
    frameCounter.innerText = `Frame: ${timeline.currentFrame}`;
    // Update Thumbnails
    updateThumbnails();
}

function updateThumbnails() {
    frameStrip.innerHTML = '';
    timeline.frames.forEach((frame, i) => {
        const t = document.createElement('div');
        // Add "active" class if it's the current frame
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

// --- Frame Switching Logic ---
frameSlider.oninput = (e) => {
    stopPlayback();
    const frameIndex = parseInt(e.target.value);
    timeline.gotoFrame(frameIndex, canvas);
    syncUI();
};

// --- Playback Engine ---
function play() {
    const fps = parseInt(fpsInput.value) || 12;
    timeline.nextFrame(canvas); // We'll add this to timeline.js
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

// --- View Controls (Zoom/Pan) ---
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

// --- Drawing Logic ---
canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || timeline.isPlaying) return;
    isDrawing = true;
    timeline.recordState();
    const pos = getCanvasCoords(e);
    startX = pos.x;
    startY = pos.y;
    if (currentTool !== 'rect') {
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

// --- Helpers ---
function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / scale, y: (e.clientY - rect.top) / scale };
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

// Tool Switching
document.getElementById('brushTool').onclick = () => { currentTool = 'brush'; updateToolUI('brushTool'); };
document.getElementById('eraseTool').onclick = () => { currentTool = 'erase'; updateToolUI('eraseTool'); };
document.getElementById('rectTool').onclick = () => { currentTool = 'rect'; updateToolUI('rectTool'); };

function updateToolUI(id) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

init();