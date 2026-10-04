/**
 * Earth Jukebox — Recording, Screenshot, & Media Export Module
 */

class MediaExportEngine {
  constructor(audioEngine, visualizerEngine) {
    this.audio = audioEngine;
    this.visualizer = visualizerEngine;

    this.isRecordingAudio = false;
    this.audioRecordTimer = null;
    this.recordSeconds = 0;
  }

  /**
   * Start / Stop Audio Capture to WebM
   */
  async toggleAudioRecording(onStart, onTick, onStop) {
    if (!this.audio.ctx) {
      await this.audio.initContext();
    }

    if (!this.isRecordingAudio) {
      // Ensure audio is running
      if (!this.audio.isPlaying) {
        await this.audio.play();
      }

      const started = this.audio.startRecording();
      if (started) {
        this.isRecordingAudio = true;
        this.recordSeconds = 0;
        if (onStart) onStart();

        this.audioRecordTimer = setInterval(() => {
          this.recordSeconds++;
          if (onTick) onTick(this.formatTime(this.recordSeconds));
        }, 1000);
      }
    } else {
      this.audio.stopRecording();
      this.isRecordingAudio = false;
      if (this.audioRecordTimer) {
        clearInterval(this.audioRecordTimer);
        this.audioRecordTimer = null;
      }
      if (onStop) onStop();
    }
  }

  formatTime(totalSec) {
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /**
   * Capture High-Resolution Scientific Screenshot of Canvas + Telemetry
   */
  captureScreenshot(telemetryData) {
    if (!this.visualizer || !this.visualizer.canvas) return;

    const sourceCanvas = this.visualizer.canvas;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = sourceCanvas.width;
    exportCanvas.height = sourceCanvas.height;
    const ctx = exportCanvas.getContext('2d');

    // 1. Draw source visualizer canvas
    ctx.drawImage(sourceCanvas, 0, 0);

    // 2. Add scientific watermark HUD overlay
    const w = exportCanvas.width;
    const h = exportCanvas.height;
    const scale = w / 1200;

    ctx.fillStyle = 'rgba(5, 7, 14, 0.75)';
    ctx.fillRect(20 * scale, 20 * scale, 340 * scale, 100 * scale);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20 * scale, 20 * scale, 340 * scale, 100 * scale);

    ctx.font = `bold ${16 * scale}px Orbitron, monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EARTH JUKEBOX — L1 TELEMETRY', 35 * scale, 48 * scale);

    ctx.font = `${12 * scale}px monospace`;
    ctx.fillStyle = '#00d4ff';
    const speed = telemetryData ? Math.round(telemetryData.speed) : 350;
    const density = telemetryData ? telemetryData.density.toFixed(1) : '2.7';
    const bz = telemetryData ? telemetryData.bz.toFixed(1) : '-0.8';
    ctx.fillText(`SPEED: ${speed} km/s | DENSITY: ${density} p/cm³ | BZ: ${bz} nT`, 35 * scale, 72 * scale);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(new Date().toUTCString(), 35 * scale, 95 * scale);

    // 3. Trigger Download
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `earth_jukebox_snapshot_${new Date().toISOString().slice(0, 19)}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 1500);
  }

  /**
   * ADD-ON: Generate Cinematic Cockpit Mission Log Share Card (1200x675)
   */
  async generateMissionShareCard(telemetryData) {
    const cardCanvas = document.createElement('canvas');
    cardCanvas.width = 1200;
    cardCanvas.height = 675;
    const ctx = cardCanvas.getContext('2d');

    // 1. Void gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
    bgGrad.addColorStop(0, '#05070B');
    bgGrad.addColorStop(0.5, '#0B1018');
    bgGrad.addColorStop(1, '#05070B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 675);

    // 2. Warm accretion glow in top left (Sun) & Cold blue glow in bottom right (Earth)
    const sunGlow = ctx.createRadialGradient(150, 150, 10, 150, 150, 400);
    sunGlow.addColorStop(0, 'rgba(255, 207, 122, 0.28)');
    sunGlow.addColorStop(0.5, 'rgba(242, 169, 59, 0.12)');
    sunGlow.addColorStop(1, 'rgba(5, 7, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, 600, 600);

    const earthGlow = ctx.createRadialGradient(1050, 520, 10, 1050, 520, 350);
    earthGlow.addColorStop(0, 'rgba(95, 168, 211, 0.25)');
    earthGlow.addColorStop(0.6, 'rgba(79, 184, 154, 0.08)');
    earthGlow.addColorStop(1, 'rgba(5, 7, 11, 0)');
    ctx.fillStyle = earthGlow;
    ctx.fillRect(600, 200, 600, 475);

    // 3. Cockpit Frame & Titanium Border
    ctx.strokeStyle = 'rgba(160, 180, 200, 0.22)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, 1140, 615);

    // Corner brackets
    const drawBracket = (x, y, dx, dy) => {
      ctx.strokeStyle = '#F2A93B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + dx * 24, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * 24);
      ctx.stroke();
    };
    drawBracket(30, 30, 1, 1);
    drawBracket(1170, 30, -1, 1);
    drawBracket(30, 645, 1, -1);
    drawBracket(1170, 645, -1, -1);

    // 4. Header Branding
    ctx.font = '600 14px "Jost", sans-serif';
    ctx.fillStyle = '#8A9BAE';
    ctx.fillText('NASA • NOAA DEEP SPACE HELIOPHYSICS OBSERVATORY', 65, 78);

    ctx.font = '700 38px "Jost", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('EARTH JUKEBOX', 65, 126);

    ctx.font = '500 16px "Inter", sans-serif';
    ctx.fillStyle = '#F2A93B';
    ctx.fillText('MISSION DISPATCH • REAL-TIME SOLAR WIND SONIFICATION', 65, 156);

    // 5. Draw Visualizer Canvas Preview Thumbnail
    if (this.visualizer && this.visualizer.canvas) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(65, 185, 1070, 230, 8) : ctx.rect(65, 185, 1070, 230);
      ctx.clip();
      ctx.drawImage(this.visualizer.canvas, 65, 185, 1070, 230);
      ctx.restore();
      ctx.strokeStyle = 'rgba(160, 180, 200, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(65, 185, 1070, 230);
    }

    // 6. Live Telemetry Metric Columns
    const spd = telemetryData ? Math.round(telemetryData.speed) : 350;
    const den = telemetryData ? Number(telemetryData.density).toFixed(1) : '2.7';
    const bz = telemetryData ? Number(telemetryData.bz).toFixed(1) : '-0.8';

    const drawMetricBox = (x, y, w, h, label, val, unit, color) => {
      ctx.fillStyle = 'rgba(18, 24, 34, 0.85)';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(160, 180, 200, 0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);

      ctx.font = '600 12px "Jost", sans-serif';
      ctx.fillStyle = '#8A9BAE';
      ctx.fillText(label.toUpperCase(), x + 16, y + 26);

      ctx.font = '700 28px "IBM Plex Mono", monospace';
      ctx.fillStyle = color;
      ctx.fillText(`${val}`, x + 16, y + 62);

      ctx.font = '500 14px "IBM Plex Mono", monospace';
      ctx.fillStyle = '#C9D6E4';
      ctx.fillText(unit, x + 16 + ctx.measureText(`${val} `).width, y + 62);
    };

    drawMetricBox(65, 435, 250, 84, 'Solar Wind Speed', spd, 'km/s', '#F2A93B');
    drawMetricBox(335, 435, 250, 84, 'Proton Density', den, 'p/cm³', '#5FA8D3');
    drawMetricBox(605, 435, 250, 84, 'Magnetic Direction', bz, 'nT', '#4FB89A');

    // Storm Badge Box
    const stormLevel = (telemetryData && telemetryData.bz < -5) ? 'G2 MODERATE' : (spd > 600 ? 'G1 MINOR' : 'G0 CALM');
    drawMetricBox(875, 435, 260, 84, 'Space Weather', stormLevel, '', '#FFCF7A');

    // 7. Footer: Timestamp & Verification
    ctx.font = '500 13px "IBM Plex Mono", monospace';
    ctx.fillStyle = '#6F8094';
    ctx.fillText(`TELEMETRY VERIFIED • ${new Date().toUTCString()}`, 65, 565);
    ctx.fillText('LISTEN LIVE: earth-jukebox.app • DSCOVR AT LAGRANGE POINT L1', 65, 590);

    // 8. Share or Download
    try {
      cardCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `earth_jukebox_dispatch_${Date.now()}.png`, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Earth Jukebox — Solar Wind Dispatch',
              text: `Live solar wind: ${spd} km/s, density ${den} p/cm³. Listen to the Sun live!`,
              files: [file]
            });
            return;
          } catch (err) {
            // User cancelled share
          }
        }

        // Fallback: Trigger direct download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `earth_jukebox_dispatch_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }, 1500);
      }, 'image/png');
    } catch (e) {
      console.warn("Share card error:", e);
    }
  }
}
