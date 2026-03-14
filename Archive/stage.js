export class Stage {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.paths = [];
        this.isDrawing = false;
    }

    startPath(x, y, color) {
        this.isDrawing = true;
        this.paths.push({
            color: color,
            points: [{ x, y }]
        });
    }

    addPoint(x, y) {
        if (!this.isDrawing) return;
        const currentPath = this.paths[this.paths.length - 1];
        currentPath.points.push({ x, y });
        this.render();
    }

    endPath() {
        this.isDrawing = false;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.paths.forEach(path => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = path.color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            this.ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                this.ctx.lineTo(path.points[i].x, path.points[i].y);
            }
            this.ctx.stroke();
        });
    }
}