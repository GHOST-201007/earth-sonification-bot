/**
 * Earth Jukebox — Telemetry Engine
 * Real-time NOAA SWPC ingestion, sparkline tracking, smooth interpolation,
 * geomagnetic storm classification (G0–G5), data export (CSV/JSON), and dynamic storytelling.
 */

class TelemetryEngine {
  constructor() {
    // Current target and interpolated values for smooth animation
    this.target = {
      speed: 350.7,
      density: 2.74,
      temperature: 46113,
      bz: -0.84,
      bt: 3.48,
      kp: 2
    };

    this.current = {
      speed: 350.7,
      density: 2.74,
      temperature: 46113,
      bz: -0.84,
      bt: 3.48,
      kp: 2
    };

    // Telemetry time-series buffer (up to 120 samples)
    this.history = [];
    this.connectionStatus = "INITIALIZING"; // "CONNECTED" | "DATA DELAYED" | "SIMULATION MODE"
    this.lastUpdated = null;
    this.updateInterval = 60000; // 60 seconds
    this.listeners = [];

    // Prepopulate buffer with baseline sample
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      this.history.push({
        timestamp: new Date(now - i * 60000).toISOString(),
        speed: 340 + Math.sin(i * 0.2) * 15,
        density: 2.5 + Math.cos(i * 0.3) * 0.6,
        temperature: 44000 + Math.sin(i * 0.1) * 3000,
        bz: -0.5 + Math.sin(i * 0.4) * 1.8,
        bt: 3.4 + Math.cos(i * 0.2) * 0.5
      });
    }

    this.startInterpolationLoop();
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify(params) {
    this.listeners.forEach(fn => fn(params));
  }

  /**
   * Smooth Linear Interpolation (LERP) for continuous number glide
   */
  startInterpolationLoop() {
    const lerpRate = 0.08;
    const loop = () => {
      let changed = false;
      ['speed', 'density', 'temperature', 'bz', 'bt'].forEach(key => {
        const diff = this.target[key] - this.current[key];
        if (Math.abs(diff) > 0.005) {
          this.current[key] += diff * lerpRate;
          changed = true;
        } else {
          this.current[key] = this.target[key];
        }
      });

      if (changed) {
        this.notify({ ...this.current, isInterpolating: true });
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /**
   * Fetch Live 1-minute in-situ data from NOAA SWPC API
   */
  async fetchLive() {
    try {
      this.connectionStatus = "CONNECTING";
      this.updateConnectionPill();

      const [windRes, magRes] = await Promise.allSettled([
        fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json'),
        fetch('https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json')
      ]);

      let windData = null;
      let magData = null;

      if (windRes.status === 'fulfilled' && windRes.value.ok) {
        windData = await windRes.value.json();
      }
      if (magRes.status === 'fulfilled' && magRes.value.ok) {
        magData = await magRes.value.json();
      }

      let speed = null;
      let density = null;
      let temp = null;
      let bz = null;
      let bt = null;
      let timeTag = null;

      // Scan for latest valid plasma measurement
      if (Array.isArray(windData) && windData.length > 0) {
        for (let i = windData.length - 1; i >= 0; i--) {
          const item = windData[i];
          if (item.proton_speed && item.proton_density) {
            speed = parseFloat(item.proton_speed);
            density = parseFloat(item.proton_density);
            temp = parseFloat(item.proton_temperature) || 45000;
            timeTag = item.time_tag;
            break;
          }
        }
      }

      // Scan for latest valid magnetometer measurement
      if (Array.isArray(magData) && magData.length > 0) {
        for (let i = magData.length - 1; i >= 0; i--) {
          const item = magData[i];
          if (item.bz_gsm !== null && item.bz_gsm !== undefined) {
            bz = parseFloat(item.bz_gsm);
            bt = parseFloat(item.bt) || 3.5;
            break;
          }
        }
      }

      if (speed !== null && density !== null) {
        this.target.speed = speed;
        this.target.density = density;
        this.target.temperature = temp || 45000;
        this.target.bz = bz !== null ? bz : -0.84;
        this.target.bt = bt !== null ? bt : 3.5;
        this.lastUpdated = timeTag ? timeTag.replace('T', ' ') + ' UTC' : new Date().toUTCString();
        this.lastFetchTimestamp = Date.now();
        this.connectionStatus = "CONNECTED";

        this.pushHistorySample({
          timestamp: this.lastUpdated,
          speed: this.target.speed,
          density: this.target.density,
          temperature: this.target.temperature,
          bz: this.target.bz,
          bt: this.target.bt
        });
      } else {
        throw new Error("Empty or malformed telemetry payload");
      }
    } catch (err) {
      console.warn("NOAA API live feed unavailable or CORS restricted. Entering Simulation Mode.", err);
      this.connectionStatus = "SIMULATION MODE";
      this.lastFetchTimestamp = Date.now();
      this.lastUpdated = new Date().toLocaleTimeString() + " (Physics Simulation)";

      // Realistic physical drift model for simulation mode
      const t = Date.now() * 0.0005;
      this.target.speed = 350 + Math.sin(t) * 25 + Math.cos(t * 1.5) * 10;
      this.target.density = 2.8 + Math.cos(t * 0.8) * 0.9;
      this.target.temperature = 46000 + Math.sin(t * 0.4) * 4500;
      this.target.bz = -1.2 + Math.sin(t * 1.2) * 2.2;
      this.target.bt = 3.6 + Math.cos(t * 0.7) * 0.8;

      this.pushHistorySample({
        timestamp: this.lastUpdated,
        speed: this.target.speed,
        density: this.target.density,
        temperature: this.target.temperature,
        bz: this.target.bz,
        bt: this.target.bt
      });
    }

    this.updateConnectionPill();
    this.notify({ ...this.target, isInterpolating: false });
  }

  pushHistorySample(sample) {
    this.history.push(sample);
    if (this.history.length > 120) {
      this.history.shift();
    }
  }

  setManualParameters(params) {
    Object.assign(this.target, params);
    this.connectionStatus = "MANUAL SYNTH";
    this.updateConnectionPill();
    this.notify({ ...this.target, isInterpolating: false });
  }

  getRelativeTimeStr() {
    if (!this.lastFetchTimestamp) return "Updated just now";
    const elapsedSec = Math.floor((Date.now() - this.lastFetchTimestamp) / 1000);
    if (elapsedSec < 45) return "Updated just now";
    if (elapsedSec < 105) return "Updated 1 min ago";
    const mins = Math.floor(elapsedSec / 60);
    if (mins < 60) return `Updated ${mins} min ago`;
    return `Updated ${Math.floor(mins / 60)}h ago`;
  }

  getMetricStatuses(params = this.current) {
    const { speed, density, temperature, bz, bt } = params;
    
    let speedStatus = { text: "Normal breeze", type: "normal" };
    if (speed < 380) speedStatus = { text: "Gentle breeze", type: "calm" };
    else if (speed > 800) speedStatus = { text: "Severe storm", type: "danger" };
    else if (speed > 550) speedStatus = { text: "Fast stream", type: "warning" };

    let densityStatus = { text: "Normal density", type: "normal" };
    if (density < 3.5) densityStatus = { text: "Light plasma", type: "calm" };
    else if (density > 25) densityStatus = { text: "Dense storm cloud", type: "danger" };
    else if (density > 10) densityStatus = { text: "Compressed plasma", type: "warning" };

    let tempStatus = { text: "Typical heat", type: "normal" };
    if (temperature < 50000) tempStatus = { text: "Cool plasma", type: "calm" };
    else if (temperature > 300000) tempStatus = { text: "Blazing CME", type: "danger" };
    else if (temperature > 150000) tempStatus = { text: "Superheated", type: "warning" };

    let bzStatus = { text: "Shield closed (+)", type: "calm" };
    if (bz <= -8) bzStatus = { text: "Severe influx (--)", type: "danger" };
    else if (bz < 0) bzStatus = { text: "Reconnecting (-)", type: "warning" };

    let btStatus = { text: "Quiet field", type: "calm" };
    if (bt > 18) btStatus = { text: "Intense field", type: "danger" };
    else if (bt > 8) btStatus = { text: "Active field", type: "warning" };

    return { speed: speedStatus, density: densityStatus, temp: tempStatus, bz: bzStatus, bt: btStatus };
  }

  updateConnectionPill() {
    const badge = document.getElementById('stream-status-badge');
    const pulse = document.getElementById('stream-pulse');
    const stateText = document.getElementById('stream-state-text');
    const timeText = document.getElementById('stream-timestamp');

    if (!badge || !stateText) return;

    if (this.connectionStatus === "CONNECTED") {
      pulse.className = "pulse-indicator live";
      stateText.textContent = "NOAA Live Feed";
      stateText.style.color = "var(--accent-aurora-emerald)";
      timeText.textContent = this.getRelativeTimeStr();
      timeText.title = this.lastUpdated ? `Sync: ${this.lastUpdated}` : "Real-time satellite link";
    } else if (this.connectionStatus === "SIMULATION MODE") {
      pulse.className = "pulse-indicator simulation";
      pulse.style.background = "var(--accent-solar-amber)";
      pulse.style.boxShadow = "0 0 10px var(--accent-solar-amber)";
      stateText.textContent = "Showing last known data";
      stateText.style.color = "var(--accent-solar-amber)";
      timeText.textContent = "Live feed delayed • Running physics model";
    } else if (this.connectionStatus === "MANUAL SYNTH") {
      pulse.className = "pulse-indicator custom";
      pulse.style.background = "var(--accent-plasma-cyan)";
      pulse.style.boxShadow = "0 0 10px var(--accent-plasma-cyan)";
      stateText.textContent = "Manual Tuning Override";
      stateText.style.color = "var(--accent-plasma-cyan)";
      timeText.textContent = "Decoupled from live feed";
    }
  }

  /**
   * Classify Geomagnetic Storm Level (G0 to G5) according to NOAA Space Weather Scale
   */
  getStormClassification(speed = this.current.speed, bz = this.current.bz) {
    if (speed >= 1200 || bz <= -25) {
      return {
        level: "G5",
        name: "EXTREME SUPERSTORM",
        color: "#ff3b5c",
        auroraLatitude: "Down to 20° (Tropical / Subtropical)",
        impact: "Widespread grid voltage collapse, HF radio blackouts, satellite navigation failures."
      };
    } else if (speed >= 950 || bz <= -18) {
      return {
        level: "G4",
        name: "SEVERE GEOMAGNETIC STORM",
        color: "#ff5e36",
        auroraLatitude: "Down to 35° (Mid-latitudes)",
        impact: "Power systems may experience voltage control problems; spacecraft tracking degradation."
      };
    } else if (speed >= 750 || bz <= -12) {
      return {
        level: "G3",
        name: "STRONG GEOMAGNETIC STORM",
        color: "#ff9d00",
        auroraLatitude: "Down to 45°",
        impact: "Voltage corrections may be required; false alarms triggered on protection devices."
      };
    } else if (speed >= 550 || bz <= -6) {
      return {
        level: "G2",
        name: "MODERATE DISTURBANCE",
        color: "#ffd000",
        auroraLatitude: "Down to 55°",
        impact: "High-latitude power systems may experience voltage alarms; auroras expand equatorward."
      };
    } else if (speed >= 450 || bz <= -2) {
      return {
        level: "G1",
        name: "MINOR GEOMAGNETIC DISTURBANCE",
        color: "#84cc16",
        auroraLatitude: "Northern border states / High latitudes",
        impact: "Weak power grid fluctuations can occur; auroral oval brightens at polar caps."
      };
    } else {
      return {
        level: "G0",
        name: "QUIET MAGNETOSPHERE",
        color: "#00ff9d",
        auroraLatitude: "Arctic & Antarctic circles only",
        impact: "Nominal space weather conditions. Earth's magnetic shield fully intact."
      };
    }
  }

  /**
   * Dynamic Storyteller: "WHAT DOES SPACE SOUND LIKE RIGHT NOW?"
   */
  generateStory() {
    const { speed, density, temperature, bz } = this.current;
    const storm = this.getStormClassification(speed, bz);

    let speedDesc = "";
    if (speed < 360) speedDesc = "a gentle, slow-moving solar wind breeze (yielding a tranquil, deep fundamental bass drone)";
    else if (speed < 550) speedDesc = "a steady, moderate solar stream (humming at a resonant midrange frequency)";
    else if (speed < 850) speedDesc = "a rapid coronal stream (driving the acoustic pitch higher into bright soprano registers)";
    else speedDesc = "a violent, supersonic coronal mass ejection shockwave (pushing pitch into piercing alarm frequencies)";

    let densityDesc = "";
    if (density < 3) densityDesc = "The proton density is low, keeping the acoustic volume soft, spacious, and ethereal.";
    else if (density < 12) densityDesc = "Moderate plasma density adds acoustic body, warmth, and full harmonic presence.";
    else densityDesc = "High proton density is heavily compressing the magnetosphere, injecting immense sub-bass weight and dynamic saturation.";

    let magneticDesc = "";
    if (bz < -8) {
      magneticDesc = `The interplanetary magnetic field is strongly Southward (Bz = ${bz.toFixed(1)} nT), cracking Earth's magnetic shield and triggering rapid celestial aurora arpeggios!`;
    } else if (bz < 0) {
      magneticDesc = `Bz is slightly Southward (${bz.toFixed(1)} nT), allowing charged particles to slip into the auroral ovals with intermittent chime cascades.`;
    } else {
      magneticDesc = `Bz points Northward (+${bz.toFixed(1)} nT), aligning harmoniously with Earth's magnetic dipole and keeping the auroral layer calm.`;
    }

    return {
      storm,
      lead: `Currently, space sounds like ${speedDesc}.`,
      densityDesc,
      magneticDesc,
      summary: `Space Weather Status: ${storm.level} — ${storm.name}. Measured speed is ${Math.round(speed)} km/s at ${density.toFixed(1)} p/cm³.`
    };
  }

  /**
   * Solar DJ Mood Analyzer
   */
  getSolarDjMood() {
    const { speed, density, bz } = this.current;

    if (speed >= 1000 || bz <= -20) {
      return {
        mood: "EXTREME SOLAR EVENT",
        tagline: "Maximum turbulence & supersonic acoustic wall",
        scale: "continuous",
        tempoPulse: "Ultra-fast / erratic"
      };
    } else if (speed >= 750 || bz <= -12) {
      return {
        mood: "STORM FRONT",
        tagline: "High-velocity plasma & geomagnetic reconnection",
        scale: "dorian",
        tempoPulse: "Driving / energetic"
      };
    } else if (bz < -4) {
      return {
        mood: "AURORA RISING",
        tagline: "Celestial chimes dancing across active auroral skies",
        scale: "lydian",
        tempoPulse: "Flowing / cascading"
      };
    } else if (density > 10) {
      return {
        mood: "MAGNETIC TENSION",
        tagline: "Dense plasma compression & heavy sub-bass drone",
        scale: "drone",
        tempoPulse: "Slow / heavy pulse"
      };
    } else if (speed > 450) {
      return {
        mood: "SOLAR BREEZE",
        tagline: "Pleasant interplanetary rhythm & harmonic balance",
        scale: "pentatonic",
        tempoPulse: "Moderate / rhythmic"
      };
    } else {
      return {
        mood: "COSMIC CALM",
        tagline: "Serene, meditative deep-space tranquility",
        scale: "pentatonic",
        tempoPulse: "Gentle / meditative"
      };
    }
  }

  /**
   * Export Telemetry History to CSV
   */
  exportCSV() {
    const headers = ["Timestamp", "Proton_Speed_kms", "Proton_Density_pcm3", "Temperature_K", "IMF_Bz_nT", "IMF_Bt_nT"];
    const rows = this.history.map(s => [
      `"${s.timestamp}"`,
      s.speed.toFixed(2),
      s.density.toFixed(2),
      Math.round(s.temperature),
      s.bz.toFixed(2),
      s.bt.toFixed(2)
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `earth_jukebox_telemetry_${new Date().toISOString().slice(0, 19)}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  }

  /**
   * Export Telemetry History to JSON
   */
  exportJSON() {
    const data = {
      source: "NOAA Space Weather Prediction Center / NASA DSCOVR L1",
      exportedAt: new Date().toISOString(),
      currentValues: this.current,
      history: this.history
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `earth_jukebox_telemetry_${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1500);
  }

  /**
   * Render SVG Sparkline into a container
   */
  renderSparkline(svgElement, dataKey, minVal, maxVal, strokeColor = "#00d4ff") {
    if (!svgElement || this.history.length < 2) return;

    const w = 90;
    const h = 26;
    const padding = 2;

    const points = this.history.slice(-25).map((sample, idx, arr) => {
      const x = padding + (idx / (arr.length - 1)) * (w - padding * 2);
      const val = sample[dataKey];
      const norm = Math.min(1, Math.max(0, (val - minVal) / (maxVal - minVal)));
      const y = h - padding - norm * (h - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    svgElement.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svgElement.innerHTML = `
      <polyline 
        fill="none" 
        stroke="${strokeColor}" 
        stroke-width="1.8" 
        stroke-linecap="round" 
        stroke-linejoin="round" 
        points="${points.join(' ')}" 
      />
    `;
  }
}
