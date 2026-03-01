export class Timeline {
    constructor(maxFrames = 60) {
        this.currentFrame = 0;
        this.maxFrames = maxFrames;
        this.frames = new Array(maxFrames + 1).fill(null);
        this.undoStack = [];
        this.clipboard = null;
        this.tempCanvas = document.createElement('canvas');
    }

    recordState() {
        const state = this.frames.map(f => f ? new ImageData(new Uint8ClampedArray(f.data), f.width, f.height) : null);
        this.undoStack.push(state);
        if (this.undoStack.length > 30) this.undoStack.shift();
    }

    undo(canvas) {
        if (this.undoStack.length === 0) return;
        this.frames = this.undoStack.pop();
        this.gotoFrame(this.currentFrame, canvas);
    }

    saveFrame(canvas) {
        this.frames[this.currentFrame] = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    }

    recordState() {
        const state = this.frames.map(f => f ? new ImageData(new Uint8ClampedArray(f.data), f.width, f.height) : null);
        this.undoStack.push(state);
        if (this.undoStack.length > 100) this.undoStack.shift(); // Keep last 50 actions
    }

    gotoFrame(index, canvas) {
        this.currentFrame = index;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.frames[this.currentFrame]) {
            ctx.putImageData(this.frames[this.currentFrame], 0, 0);
        }
    }

    renderOnionSkin(ctx, canvas) {
        if (this.isPlaying) return;

        this.tempCanvas.width = canvas.width;
        this.tempCanvas.height = canvas.height;
        const tempCtx = this.tempCanvas.getContext('2d');

        if (this.currentFrame > 0 && this.frames[this.currentFrame - 1]) {
            ctx.save();
            ctx.globalAlpha = 0.2;
            tempCtx.clearRect(0, 0, canvas.width, canvas.height);
            tempCtx.putImageData(this.frames[this.currentFrame - 1], 0, 0);
            ctx.drawImage(this.tempCanvas, 0, 0);
            ctx.restore();
        }
    }

    copyFrame() {
        const currentData = this.frames[this.currentFrame];
        if (currentData) {
            this.clipboard = new ImageData(new Uint8ClampedArray(currentData.data), currentData.width, currentData.height);
        }
    }

    pasteFrame(canvas) {
        if (this.clipboard) {
            this.recordState(); // Save state before pasting so we can undo it
            this.frames[this.currentFrame] = new ImageData(new Uint8ClampedArray(this.clipboard.data), this.clipboard.width, this.clipboard.height);
            this.gotoFrame(this.currentFrame, canvas);
        }
    }

    clearFrame(canvas) {
        this.recordState();
        this.frames[this.currentFrame] = null;
        this.gotoFrame(this.currentFrame, canvas);
    }

    nextFrame(canvas) {
        let next = this.currentFrame + 1;
        if (next > this.maxFrames) next = 0;
        this.gotoFrame(next, canvas);
    }
}