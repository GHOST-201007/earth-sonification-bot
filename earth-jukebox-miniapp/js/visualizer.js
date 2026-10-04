/**
 * Canvas Waveform Visualizer for Earth Jukebox.
 * 60fps smooth audio reactive wave canvas.
 */

class WaveformVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.isPlaying = false;
        this.phase = 0;
        this.amplitude = 10;
        this.resize();
        this.startLoop();
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = this.canvas.offsetWidth || 300;
        this.canvas.height = this.canvas.offsetHeight || 120;
    }

    setPlaying(isPlaying, amplitude = 25) {
        this.isPlaying = isPlaying;
        this.amplitude = isPlaying ? amplitude : 8;
    }

    startLoop() {
        const render = () => {
            requestAnimationFrame(render);
            if (!this.ctx || !this.canvas) return;

            const width = this.canvas.width;
            const height = this.canvas.height;
            const centerY = height / 2;

            this.ctx.clearRect(0, 0, width, height);

            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();

            for (let x = 0; x < width; x++) {
                const y = centerY + Math.sin(x * 0.03 + this.phase) * this.amplitude * Math.sin((x / width) * Math.PI);
                if (x === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            }

            const gradient = this.ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, '#ff4757');
            gradient.addColorStop(0.5, '#00d2d3');
            gradient.addColorStop(1, '#54a0ff');
            this.ctx.strokeStyle = gradient;
            this.ctx.stroke();

            this.phase += this.isPlaying ? 0.08 : 0.02;
        };

        render();
    }
}
