export class Timeline {
    constructor(maxFrames = 60) {
        this.currentFrame = 0;
        this.maxFrames = maxFrames;
        this.frames = new Array(maxFrames + 1).fill(null);
        this.undoStack = [];
        this.clipboard = null;
        this.isPlaying = false;
    }

    setDuration(newMax) {
        const oldMax = this.maxFrames;
        this.maxFrames = newMax;

        if (newMax > oldMax) {
            const extra = new Array(newMax - oldMax).fill(null);
            this.frames = [...this.frames, ...extra];
        } else {
            this.frames = this.frames.slice(0, newMax + 1);
            if (this.currentFrame > newMax) {
                this.currentFrame = newMax;
            }
        }
    }

    recordState() {
        const frameData = this.frames[this.currentFrame];
        const state = {
            index: this.currentFrame,
            data: frameData ? new ImageData(new Uint8ClampedArray(frameData.data), frameData.width, frameData.height) : null
        };
        this.undoStack.push(state);
        if (this.undoStack.length > 50) this.undoStack.shift();
    }

    undo(canvas) {
        if (this.undoStack.length === 0) return;
        const lastAction = this.undoStack.pop();
        this.frames[lastAction.index] = lastAction.data;
        this.gotoFrame(lastAction.index, canvas);
    }

    saveFrame(canvas) {
        this.frames[this.currentFrame] = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    }

    gotoFrame(index, canvas) {
        if (index < 0 || index > this.maxFrames) return;
        this.currentFrame = index;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.frames[this.currentFrame]) {
            ctx.putImageData(this.frames[this.currentFrame], 0, 0);
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
            this.recordState();
            this.frames[this.currentFrame] = new ImageData(new Uint8ClampedArray(this.clipboard.data), this.clipboard.width, this.clipboard.height);
            this.gotoFrame(this.currentFrame, canvas);
        }
    }

    clearFrame(canvas) {
        this.recordState();
        this.frames[this.currentFrame] = null;
        this.gotoFrame(this.currentFrame, canvas);
    }

    nextFrame(canvas, shouldLoop = true) {
        let next = this.currentFrame + 1;
        if (next > this.maxFrames) {
            if (shouldLoop) {
                next = 0;
            } else {
                return false;
            }
        }
        this.gotoFrame(next, canvas);
        return true;
    }
}