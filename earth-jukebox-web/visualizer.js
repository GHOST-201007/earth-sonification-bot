/**
 * Earth Jukebox — Advanced Visualizer & Particle Simulation Suite
 * 
 * Visualization Modes:
 *  1. 'heliosphere': Sun -> Solar Wind Stream -> Earth Magnetosphere & Auroras
 *  2. 'spectrum': FFT Spectrum Bars + Oscilloscope Wave + Spectrogram Waterfall + Meters
 *  3. 'shield': Dedicated Magnetic Shield Compression simulation with interactive drag slider
 *  4. 'aurora-planetarium': Fullscreen planetarium experience
 */

class SolarVisualizer {
  constructor(audioEngine) {
    this.audio = audioEngine;
    this.canvas = document.getElementById('magnetosphere-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.viewMode = 'heliosphere'; // 'heliosphere' | 'spectrum' | 'shield' | 'aurora-planetarium'

    // Starfield Background Canvas
    this.starCanvas = document.getElementById('starfield-bg');
    this.starCtx = this.starCanvas.getContext('2d');
    this.stars = [];
    this.nebulaOrbs = [];

    // Particle Stream
    this.particles = [];
    this.maxParticles = 400;

    // Spectrogram Buffer (Waterfall history)
    this.spectrogramHistory = [];
    this.spectrogramMaxRows = 60;

    // Simulation loop
    this.tick = 0;

    // Physical state
    this.speed = 350;
    this.density = 2.7;
    this.temperature = 46000;
    this.bz = -0.8;
    this.bt = 3.5;

    // Shield Drag Interactive override
    this.shieldDragIntensity = 1.0;

    // CME Shockwave Simulation
    this.cmeActive = false;
    this.cmeProgress = 0;
    this.cmeIntensity = 0;

    this.initCanvasSize();
    this.initStarfield();
    this.initParticles();
    this.attachEvents();
    this.startLoop();
  }

  initCanvasSize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width || 800;
    this.height = rect.height || 480;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform ? this.ctx.resetTransform() : this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);

    if (this.starCanvas) {
      this.starCanvas.width = window.innerWidth * dpr;
      this.starCanvas.height = window.innerHeight * dpr;
      this.starCtx.resetTransform ? this.starCtx.resetTransform() : this.starCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.starCtx.scale(dpr, dpr);
    }
  }

  initStarfield() {
    this.stars = [];
    const count = 220;
    const w = window.innerWidth;
    const h = window.innerHeight;

    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 1.6 + 0.4,
        baseAlpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.03 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    this.nebulaOrbs = [
      { x: w * 0.2, y: h * 0.3, r: w * 0.3, color: 'rgba(0, 114, 255, 0.035)' },
      { x: w * 0.8, y: h * 0.7, r: w * 0.35, color: 'rgba(168, 85, 247, 0.03)' },
      { x: w * 0.5, y: h * 0.1, r: w * 0.25, color: 'rgba(0, 255, 157, 0.02)' }
    ];
  }

  initParticles() {
    this.particles = [];
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  createParticle(randomX = false) {
    const sunX = this.width * 0.10;
    const sunY = this.height * 0.5;

    return {
      x: randomX ? sunX + Math.random() * (this.width - sunX) : sunX + (Math.random() * 20 - 10),
      y: sunY + (Math.random() * this.height * 0.85 - this.height * 0.425),
      vx: (this.speed / 280) * (2.0 + Math.random() * 1.4),
      vy: (Math.random() * 0.8 - 0.4),
      size: Math.random() * 2.4 + 1.1,
      alpha: Math.random() * 0.65 + 0.3,
      deflected: false,
      colorVariant: Math.random()
    };
  }

  attachEvents() {
    window.addEventListener('resize', () => {
      this.initCanvasSize();
      this.initStarfield();
    });

    const tabHelio = document.getElementById('view-heliosphere');
    const tabSpec = document.getElementById('view-spectrum');
    const tabShield = document.getElementById('view-shield');

    if (tabHelio) {
      tabHelio.addEventListener('click', () => this.setViewMode('heliosphere'));
    }
    if (tabSpec) {
      tabSpec.addEventListener('click', () => this.setViewMode('spectrum'));
    }
    if (tabShield) {
      tabShield.addEventListener('click', () => this.setViewMode('shield'));
    }
  }

  setViewMode(mode) {
    this.viewMode = mode;
    ['view-heliosphere', 'view-spectrum', 'view-shield'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('active', id === `view-${mode}`);
    });
  }

  updatePhysics(params) {
    if (params.speed !== undefined) this.speed = params.speed;
    if (params.density !== undefined) this.density = params.density;
    if (params.temperature !== undefined) this.temperature = params.temperature;
    if (params.bz !== undefined) this.bz = params.bz;
    if (params.bt !== undefined) this.bt = params.bt;

    const targetCount = Math.min(480, Math.floor(100 + this.density * 10 * this.shieldDragIntensity));
    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle(true));
    }
    while (this.particles.length > targetCount) {
      this.particles.pop();
    }
  }

  startLoop() {
    const loop = () => {
      this.tick++;
      this.renderStarfield();

      if (this.viewMode === 'heliosphere') {
        this.renderHeliosphere();
      } else if (this.viewMode === 'spectrum') {
        this.renderSpectrumSuite();
      } else if (this.viewMode === 'shield') {
        this.renderDedicatedShieldView();
      } else if (this.viewMode === 'aurora-planetarium') {
        this.renderPlanetarium();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  renderStarfield() {
    const ctx = this.starCtx;
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    const isLight = document.body.classList.contains('theme-light');

    // Deep void cosmic background (Light: soft cool daylight slate, Dark: cosmic void)
    ctx.fillStyle = isLight ? '#f1f5f9' : '#05070B';
    ctx.fillRect(0, 0, w, h);

    // Subtle accretion nebula glow
    this.nebulaOrbs.forEach(orb => {
      const grad = ctx.createRadialGradient(orb.x, orb.y, 10, orb.x, orb.y, orb.r);
      grad.addColorStop(0, isLight ? 'rgba(2, 132, 199, 0.04)' : orb.color);
      grad.addColorStop(1, isLight ? 'rgba(241, 245, 249, 0)' : 'rgba(5, 7, 11, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    // Faint stars with slow parallax drift
    for (const star of this.stars) {
      star.x = (star.x - 0.08 * star.radius + w) % w;
      const alpha = star.baseAlpha + Math.sin(this.tick * star.twinkleSpeed + star.twinklePhase) * 0.25;
      ctx.fillStyle = isLight 
        ? `rgba(71, 85, 105, ${Math.max(0.12, alpha * 0.45)})`
        : `rgba(201, 214, 228, ${Math.max(0.08, alpha)})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------------- Mode 1: Heliosphere & Magnetosphere ---------------- */
  renderHeliosphere() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const isLight = document.body.classList.contains('theme-light');
    const isMobile = w < 540;
    const sunX = isMobile ? w * 0.12 : w * 0.10;
    const sunY = h * 0.5;
    const sunRadius = Math.max(22, Math.min(w, h) * (isMobile ? 0.13 : 0.11));

    const earthX = isMobile ? w * 0.86 : w * 0.82;
    const earthY = h * 0.5;
    const earthRadius = Math.max(10, Math.min(w, h) * (isMobile ? 0.055 : 0.046));

    let audioPulse = 0;
    if (this.audio && this.audio.analyser && this.audio.isPlaying) {
      const freqData = new Uint8Array(16);
      this.audio.analyser.getByteFrequencyData(freqData);
      let sum = 0;
      for (let i = 0; i < 16; i++) sum += freqData[i];
      audioPulse = (sum / (16 * 255));
    }

    // 1. Cockpit HUD Telemetry Baseline & Markers
    ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.25)' : 'rgba(160, 180, 200, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(sunX + sunRadius * 1.5, sunY);
    ctx.lineTo(earthX - earthRadius * 3.5, earthY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Distance HUD text
    const midX = (sunX + earthX) / 2;
    ctx.font = '500 11px "IBM Plex Mono", monospace';
    ctx.fillStyle = isLight ? 'rgba(30, 41, 59, 0.75)' : 'rgba(138, 155, 174, 0.55)';
    ctx.textAlign = 'center';
    const distText = isMobile ? '1.0 AU • 150M KM' : '1.0 AU (149.6M KM) • HELIOSPHERIC AXIS';
    ctx.fillText(distText, midX, sunY - 14);

    // L1 Position Marker
    const l1X = earthX - (earthX - sunX) * 0.11;
    ctx.strokeStyle = isLight ? 'rgba(217, 119, 6, 0.75)' : 'rgba(242, 169, 59, 0.45)';
    ctx.beginPath();
    ctx.arc(l1X, earthY, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = isLight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(138, 155, 174, 0.55)';
    ctx.fillText('L1 [DSCOVR]', l1X, earthY + 22);

    // Crosshairs
    const drawCross = (cx, cy) => {
      ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.35)' : 'rgba(160, 180, 200, 0.22)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8);
      ctx.stroke();
    };
    drawCross(sunX, sunY);
    drawCross(earthX, earthY);

    this.drawSun(ctx, sunX, sunY, sunRadius, audioPulse);
    this.drawParticles(ctx, sunX, sunY, earthX, earthY, earthRadius);
    this.drawMagnetosphere(ctx, earthX, earthY, earthRadius, audioPulse);
    this.drawEarth(ctx, earthX, earthY, earthRadius);
    this.drawAuroras(ctx, earthX, earthY, earthRadius, audioPulse);
    this.drawCmeShockwave(ctx, sunX, sunY, earthX, earthY, earthRadius);
  }

  /**
   * ADD-ON: Trigger Coronal Mass Ejection (CME) Solar Flare Shockwave
   */
  triggerCme() {
    this.cmeActive = true;
    this.cmeProgress = 0;
    this.cmeIntensity = 1.0;
  }

  drawCmeShockwave(ctx, sunX, sunY, earthX, earthY, earthRadius) {
    if (!this.cmeActive) return;

    this.cmeProgress += 0.008; // crosses 1 AU in ~4.5 seconds
    if (this.cmeProgress > 1.15) {
      this.cmeActive = false;
      this.cmeProgress = 0;
      return;
    }

    const shockX = sunX + (earthX - sunX) * this.cmeProgress;
    const arcRadius = 40 + this.cmeProgress * 180;
    const alpha = Math.max(0, 1 - Math.pow(this.cmeProgress, 1.8));

    ctx.save();
    
    // 1. Expanding Fiery Coronal Wavefront Arc
    ctx.strokeStyle = `rgba(255, 207, 122, ${alpha * 0.9})`;
    ctx.lineWidth = 4 + (1 - this.cmeProgress) * 5;
    ctx.beginPath();
    ctx.arc(shockX, sunY, arcRadius, -Math.PI * 0.45, Math.PI * 0.45, false);
    ctx.stroke();

    // 2. Trailing ember envelope
    ctx.strokeStyle = `rgba(224, 102, 43, ${alpha * 0.6})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(shockX - 18, sunY, arcRadius * 0.88, -Math.PI * 0.42, Math.PI * 0.42, false);
    ctx.stroke();

    // 3. Shockwave glow fill
    const shockGrad = ctx.createRadialGradient(shockX, sunY, 10, shockX, sunY, arcRadius);
    shockGrad.addColorStop(0, `rgba(255, 207, 122, ${alpha * 0.35})`);
    shockGrad.addColorStop(0.7, `rgba(242, 169, 59, ${alpha * 0.15})`);
    shockGrad.addColorStop(1, 'rgba(5, 7, 11, 0)');
    ctx.fillStyle = shockGrad;
    ctx.beginPath();
    ctx.arc(shockX, sunY, arcRadius, -Math.PI * 0.45, Math.PI * 0.45, false);
    ctx.fill();

    // 4. Collision with Earth's Bow Shock
    if (this.cmeProgress >= 0.78 && this.cmeProgress <= 1.08) {
      const hitIntensity = Math.sin((this.cmeProgress - 0.78) / 0.30 * Math.PI);
      ctx.strokeStyle = `rgba(0, 212, 255, ${hitIntensity * 0.95})`;
      ctx.lineWidth = 3 + hitIntensity * 5;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius * (2.8 - hitIntensity * 0.9), Math.PI * 0.45, Math.PI * 1.55, false);
      ctx.stroke();

      // Golden flare flash overlay on Earth
      ctx.fillStyle = `rgba(255, 207, 122, ${hitIntensity * 0.3})`;
      ctx.beginPath();
      ctx.arc(earthX, earthY, earthRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawSun(ctx, x, y, r, audioPulse) {
    // 1. Vast Accretion-disc / Corona Glow
    const coronaR = r * (2.8 + Math.sin(this.tick * 0.02) * 0.12 + audioPulse * 0.4);
    const coronaGrad = ctx.createRadialGradient(x, y, r * 0.6, x, y, coronaR);
    coronaGrad.addColorStop(0, 'rgba(255, 207, 122, 0.45)');  // gold glow
    coronaGrad.addColorStop(0.3, 'rgba(242, 169, 59, 0.22)'); // amber
    coronaGrad.addColorStop(0.65, 'rgba(224, 102, 43, 0.08)'); // ember
    coronaGrad.addColorStop(1, 'rgba(5, 7, 11, 0)');

    ctx.fillStyle = coronaGrad;
    ctx.beginPath();
    ctx.arc(x, y, coronaR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Gravitational Warped Accretion Arc Belt
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.22);
    
    // Outer accretion ring
    const ringGrad = ctx.createLinearGradient(-r * 2.2, 0, r * 2.2, 0);
    ringGrad.addColorStop(0, 'rgba(242, 169, 59, 0)');
    ringGrad.addColorStop(0.3, 'rgba(255, 207, 122, 0.35)');
    ringGrad.addColorStop(0.5, 'rgba(255, 240, 200, 0.6)');
    ringGrad.addColorStop(0.7, 'rgba(242, 169, 59, 0.35)');
    ringGrad.addColorStop(1, 'rgba(242, 169, 59, 0)');
    
    ctx.strokeStyle = ringGrad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.9 + audioPulse * 8, r * 0.55 + audioPulse * 2, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Secondary inner ring
    ctx.strokeStyle = 'rgba(224, 102, 43, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 2.4, r * 0.7, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Subtle Anamorphic Lens Flare Streak (Horizontal gold beam)
    const flareLen = r * 3.8;
    const flareGrad = ctx.createLinearGradient(x - flareLen, y, x + flareLen, y);
    flareGrad.addColorStop(0, 'rgba(255, 207, 122, 0)');
    flareGrad.addColorStop(0.4, 'rgba(255, 207, 122, 0.15)');
    flareGrad.addColorStop(0.5, 'rgba(255, 245, 220, 0.35)');
    flareGrad.addColorStop(0.6, 'rgba(255, 207, 122, 0.15)');
    flareGrad.addColorStop(1, 'rgba(255, 207, 122, 0)');
    ctx.fillStyle = flareGrad;
    ctx.fillRect(x - flareLen, y - 1.5, flareLen * 2, 3);

    // 4. Solar Core Disc
    const sunGrad = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.05, x, y, r);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.35, '#FFCF7A');
    sunGrad.addColorStop(0.7, '#F2A93B');
    sunGrad.addColorStop(0.95, '#E0662B');
    sunGrad.addColorStop(1, '#8A2B0E');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // 5. Cockpit Instrument Label
    const sunLabel = 'THE SUN';
    ctx.font = '600 12px "Jost", "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sunMetrics = ctx.measureText(sunLabel);
    const sunPillY = y + r + 24;
    const sunPillW = sunMetrics.width + 20;
    const sunPillH = 22;
    
    ctx.fillStyle = 'rgba(11, 16, 24, 0.85)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - sunPillW / 2, sunPillY - sunPillH / 2, sunPillW, sunPillH, 6);
    } else {
      ctx.rect(x - sunPillW / 2, sunPillY - sunPillH / 2, sunPillW, sunPillH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(242, 169, 59, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#FFCF7A';
    ctx.fillText(sunLabel, x, sunPillY);
  }

  drawParticles(ctx, sunX, sunY, earthX, earthY, earthR) {
    const bowShockX = earthX - earthR * 3.8;
    const speedRatio = (this.speed / 300) * this.shieldDragIntensity;

    for (const p of this.particles) {
      p.x += p.vx * speedRatio;
      p.y += p.vy;

      const dx = p.x - earthX;
      const dy = p.y - earthY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bowDist = earthR * 3.6;

      if (!p.deflected && p.x > bowShockX && dist < bowDist * 1.2) {
        p.deflected = true;

        if (this.bz < 0 && Math.abs(dy) < earthR * 1.5 && Math.random() < 0.45) {
          p.vy = dy > 0 ? 2.5 : -2.5;
          p.vx *= 0.4;
        } else {
          p.vy = dy >= 0 ? Math.max(1.8, Math.abs(p.vy) * 2.2) : -Math.max(1.8, Math.abs(p.vy) * 2.2);
          p.vx *= 0.85;
        }
      }

      if (p.x > this.width + 20 || p.y < -30 || p.y > this.height + 30) {
        Object.assign(p, this.createParticle(false));
      }

      let r = 242, g = 169, b = 59; // Amber
      if (this.temperature > 150000) {
        r = 255; g = 207; b = 122; // Gold glow
      } else if (p.colorVariant > 0.7) {
        r = 224; g = 102; b = 43; // Ember
      }

      // Render particle with warm amber motion-blur trail
      const trailLength = Math.max(5, p.vx * 3.8);
      const grad = ctx.createLinearGradient(p.x - trailLength, p.y, p.x, p.y);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      grad.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${p.alpha})`);
      
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1.2, p.size * 0.9);
      ctx.beginPath();
      ctx.moveTo(p.x - trailLength, p.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Bright head particle
      ctx.fillStyle = `rgba(255, 245, 210, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.65, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawMagnetosphere(ctx, x, y, r, audioPulse) {
    const compression = Math.min(r * 1.2, ((this.density * this.shieldDragIntensity) / 25) * r * 0.8);
    const bowShockDist = Math.max(r * 2.0, r * 3.8 - compression);

    // Bow Shock wavefront
    ctx.strokeStyle = this.bz < 0 ? 'rgba(0, 255, 157, 0.65)' : 'rgba(0, 212, 255, 0.45)';
    ctx.lineWidth = 2 + audioPulse * 3;
    ctx.beginPath();
    ctx.arc(x, y, bowShockDist + 6, Math.PI * 0.6, Math.PI * 1.4);
    ctx.stroke();

    // Dipole magnetic field lines
    const fieldLineRadii = [r * 1.6, r * 2.4, r * 3.2];
    for (let i = 0; i < fieldLineRadii.length; i++) {
      const flr = fieldLineRadii[i];
      ctx.strokeStyle = this.bz < 0 
        ? `rgba(0, 255, 157, ${0.18 + i * 0.08})` 
        : `rgba(0, 212, 255, ${0.15 + i * 0.06})`;
      ctx.lineWidth = 1.5;

      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.ellipse(0, 0, flr * 0.85, flr * 1.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Magnetotail extending into deep space
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2.2);
    ctx.bezierCurveTo(x + r * 3, y - r * 3, x + r * 6, y - r * 1.8, this.width, y - r * 1.2);
    ctx.moveTo(x, y + r * 2.2);
    ctx.bezierCurveTo(x + r * 3, y + r * 3, x + r * 6, y + r * 1.8, this.width, y + r * 1.2);
    ctx.stroke();
  }

  drawEarth(ctx, x, y, r) {
    // 1. Atmosphere Cold Blue Glow
    const atmoR = r * 1.55;
    const atmoGrad = ctx.createRadialGradient(x, y, r * 0.8, x, y, atmoR);
    atmoGrad.addColorStop(0, 'rgba(95, 168, 211, 0.35)');
    atmoGrad.addColorStop(0.5, 'rgba(95, 168, 211, 0.12)');
    atmoGrad.addColorStop(1, 'rgba(5, 7, 11, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(x, y, atmoR, 0, Math.PI * 2);
    ctx.fill();

    // 2. Earth Sphere
    const earthGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    earthGrad.addColorStop(0, '#5FA8D3');
    earthGrad.addColorStop(0.4, '#1E4E79');
    earthGrad.addColorStop(0.8, '#0B2545');
    earthGrad.addColorStop(1, '#051329');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Continents / Atmospheric swirls
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.strokeStyle = 'rgba(201, 214, 228, 0.28)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.7, 0.2, Math.PI * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + r * 0.1, y + r * 0.3, r * 0.6, Math.PI * 0.3, Math.PI * 0.9);
    ctx.stroke();
    ctx.restore();

    // 3. Cockpit Instrument Label
    const earthLabel = 'EARTH';
    ctx.font = '600 12px "Jost", "IBM Plex Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const earthMetrics = ctx.measureText(earthLabel);
    const earthPillY = y + r + 24;
    const earthPillW = earthMetrics.width + 20;
    const earthPillH = 22;

    ctx.fillStyle = 'rgba(11, 16, 24, 0.85)';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - earthPillW / 2, earthPillY - earthPillH / 2, earthPillW, earthPillH, 6);
    } else {
      ctx.rect(x - earthPillW / 2, earthPillY - earthPillH / 2, earthPillW, earthPillH);
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(95, 168, 211, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#C9D6E4';
    ctx.fillText(earthLabel, x, earthPillY);
  }

  drawAuroras(ctx, x, y, r, audioPulse) {
    const isReconnecting = this.bz < 0;
    const intensity = isReconnecting ? Math.min(1.0, Math.abs(this.bz) / 15) : 0.08;

    const northY = y - r * 0.85;
    const southY = y + r * 0.85;
    const ovalWidth = r * 0.95 + audioPulse * 16;
    const ovalHeight = r * 0.32 + audioPulse * 7;

    const auroraGradN = ctx.createRadialGradient(x, northY, 2, x, northY, ovalWidth);
    auroraGradN.addColorStop(0, `rgba(0, 255, 157, ${0.45 * intensity + audioPulse * 0.4})`);
    auroraGradN.addColorStop(0.6, `rgba(168, 85, 247, ${0.32 * intensity})`);
    auroraGradN.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auroraGradN;
    ctx.beginPath();
    ctx.ellipse(x, northY, ovalWidth, ovalHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    const auroraGradS = ctx.createRadialGradient(x, southY, 2, x, southY, ovalWidth);
    auroraGradS.addColorStop(0, `rgba(0, 255, 157, ${0.45 * intensity + audioPulse * 0.4})`);
    auroraGradS.addColorStop(0.6, `rgba(168, 85, 247, ${0.32 * intensity})`);
    auroraGradS.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auroraGradS;
    ctx.beginPath();
    ctx.ellipse(x, southY, ovalWidth, ovalHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isReconnecting) {
      ctx.strokeStyle = `rgba(0, 255, 157, ${0.35 + audioPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) {
        const rx = x + i * (ovalWidth * 0.35);
        const rayH = 14 + Math.sin(this.tick * 0.1 + i) * 8 + audioPulse * 20;
        ctx.beginPath();
        ctx.moveTo(rx, northY);
        ctx.lineTo(rx, northY - rayH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx, southY);
        ctx.lineTo(rx, southY + rayH);
        ctx.stroke();
      }
    }
  }

  /* ---------------- Mode 2: Audio Spectrum & Waveform Suite ---------------- */
  renderSpectrumSuite() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.audio || !this.audio.analyser) {
      ctx.font = '14px Orbitron, monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('AUDIO ENGINE OFFLINE — CLICK PLAY TO ACTIVATE', w / 2, h / 2);
      return;
    }

    const bufferLength = this.audio.analyser.frequencyBinCount;
    const freqArray = new Uint8Array(bufferLength);
    const timeArray = new Uint8Array(bufferLength);

    this.audio.analyser.getByteFrequencyData(freqArray);
    this.audio.analyser.getByteTimeDomainData(timeArray);

    // 1. FFT Spectrum Bars
    const barCount = 72;
    const barWidth = (w - (barCount * 3)) / barCount;
    const spectrumHeight = h * 0.65;

    for (let i = 0; i < barCount; i++) {
      const idx = Math.floor((i / barCount) * (bufferLength * 0.45));
      const val = freqArray[idx] || 0;
      const barHeight = (val / 255) * spectrumHeight;
      const x = i * (barWidth + 3) + 10;
      const y = h - barHeight - 40;

      const grad = ctx.createLinearGradient(0, y, 0, h - 40);
      grad.addColorStop(0, '#00d4ff');
      grad.addColorStop(0.5, '#ffd000');
      grad.addColorStop(1, '#ff7b00');

      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // 2. Oscilloscope Waveform overlay
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#00ff9d';
    ctx.shadowColor = '#00ff9d';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    const sliceWidth = w / bufferLength;
    let xPos = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = timeArray[i] / 128.0;
      const yPos = (v * h * 0.28) + (h * 0.12);

      if (i === 0) ctx.moveTo(xPos, yPos);
      else ctx.lineTo(xPos, yPos);

      xPos += sliceWidth;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // 3. Sub-bass & Aurora Energy Meters
    let subBassSum = 0;
    for (let i = 0; i < 8; i++) subBassSum += freqArray[i];
    const subBassNorm = subBassSum / (8 * 255);

    let auroraSum = 0;
    for (let i = 20; i < 40; i++) auroraSum += freqArray[i];
    const auroraNorm = auroraSum / (20 * 255);

    // Sub-bass meter pill
    ctx.fillStyle = 'rgba(10, 18, 38, 0.75)';
    ctx.fillRect(20, h - 30, 160, 18);
    ctx.fillStyle = '#00d4ff';
    ctx.fillRect(22, h - 28, 156 * subBassNorm, 14);
    ctx.font = '10px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SUB-BASS: ${Math.round(subBassNorm * 100)}%`, 26, h - 17);

    // Aurora energy meter pill
    ctx.fillStyle = 'rgba(10, 18, 38, 0.75)';
    ctx.fillRect(195, h - 30, 160, 18);
    ctx.fillStyle = '#00ff9d';
    ctx.fillRect(197, h - 28, 156 * auroraNorm, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`AURORA ENERGY: ${Math.round(auroraNorm * 100)}%`, 201, h - 17);

    ctx.font = '600 12px Orbitron, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`PITCH: ${this.audio.targetPitch.toFixed(1)} Hz | SPEED: ${this.speed.toFixed(0)} km/s`, 20, 30);
  }

  /* ---------------- Mode 3: Dedicated Magnetic Shield View ---------------- */
  renderDedicatedShieldView() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const earthX = w * 0.65;
    const earthY = h * 0.5;
    const earthR = Math.min(w, h) * 0.08;

    const streamSpeed = (this.speed / 300) * this.shieldDragIntensity;
    const dynamicDensity = this.density * this.shieldDragIntensity;

    // Draw particle stream from left
    for (const p of this.particles) {
      p.x += p.vx * streamSpeed;
      p.y += p.vy;

      const dx = p.x - earthX;
      const dy = p.y - earthY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bowDist = earthR * 2.8;

      if (!p.deflected && p.x > earthX - bowDist * 1.3 && dist < bowDist * 1.1) {
        p.deflected = true;
        p.vy = dy >= 0 ? Math.max(2.2, Math.abs(p.vy) * 2.5) : -Math.max(2.2, Math.abs(p.vy) * 2.5);
        p.vx *= 0.7;
      }

      if (p.x > w + 20 || p.y < -30 || p.y > h + 30) {
        Object.assign(p, this.createParticle(false));
      }

      ctx.fillStyle = 'rgba(255, 170, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dynamic Compressed Bow Shock
    const bowCompression = Math.min(earthR * 1.5, (dynamicDensity / 25) * earthR * 1.1);
    const bowDist = Math.max(earthR * 1.4, earthR * 3.2 - bowCompression);

    ctx.strokeStyle = this.bz < 0 ? '#00ff9d' : '#00d4ff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(earthX, earthY, bowDist, Math.PI * 0.55, Math.PI * 1.45);
    ctx.stroke();

    // Magnetic field lines
    for (let rFactor = 1.3; rFactor <= 2.6; rFactor += 0.5) {
      ctx.strokeStyle = `rgba(0, 212, 255, ${0.35 - (rFactor - 1.3) * 0.1})`;
      ctx.lineWidth = 2;
      ctx.save();
      ctx.translate(earthX, earthY);
      ctx.beginPath();
      ctx.ellipse(0, 0, earthR * rFactor * 0.8, earthR * rFactor * 1.3, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Earth
    this.drawEarth(ctx, earthX, earthY, earthR);
    this.drawAuroras(ctx, earthX, earthY, earthR, 0.3);

    // Shield Readout HUD
    ctx.fillStyle = 'rgba(6, 10, 22, 0.85)';
    ctx.fillRect(20, 20, 240, 110);
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.strokeRect(20, 20, 240, 110);

    ctx.font = 'bold 12px Orbitron, monospace';
    ctx.fillStyle = '#00d4ff';
    ctx.fillText('MAGNETOSPHERIC SHIELD', 30, 42);

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Bow Shock Stand-off: ${(bowDist / earthR).toFixed(1)} Earth Radii`, 30, 66);
    ctx.fillText(`Plasma Pressure: ${(dynamicDensity * streamSpeed).toFixed(1)} nPa`, 30, 86);
    ctx.fillText(`Reconnection: ${this.bz < 0 ? 'ACTIVE (Bz < 0)' : 'CLOSED (Bz > 0)'}`, 30, 106);
  }

  /* ---------------- Mode 4: Aurora Planetarium ---------------- */
  renderPlanetarium() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    const earthX = w * 0.5;
    const earthY = h * 0.58;
    const earthR = Math.min(w, h) * 0.28;

    this.drawEarth(ctx, earthX, earthY, earthR);
    this.drawAuroras(ctx, earthX, earthY, earthR, 0.5);

    // Planetarium overlay label
    ctx.font = '12px Orbitron, monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'center';
    ctx.fillText(`EARTH JUKEBOX — AURORA PLANETARIUM | SPEED: ${Math.round(this.speed)} km/s | BZ: ${this.bz.toFixed(1)} nT`, w / 2, 40);
  }
}
