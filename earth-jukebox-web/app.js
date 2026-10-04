/**
 * Earth Jukebox — Master Application Controller
 * Coordinates audio synthesis, canvas visualizers, telemetry streaming,
 * the Solar Time Machine, Solar Synth Lab, and interactive exploration.
 * Restyled with Endurance Cockpit aesthetic, Interstellar mood, and seamless telemetry.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Engines
  const audio = new SolarAudioEngine();
  const visualizer = new SolarVisualizer(audio);
  const telemetry = new TelemetryEngine();
  const synthLab = new SolarSynthLab(audio, telemetry);
  const mediaExporter = new MediaExportEngine(audio, visualizer);

  let currentTrackIndex = 0;
  let isLiveStreamActive = true;
  let currentPlaylistFilter = 'all';

  // DOM Elements - Shell & Views
  const landingScreen = document.getElementById('landing-screen');
  const appShell = document.getElementById('app-shell');
  const btnEnterJukebox = document.getElementById('btn-enter-jukebox');
  const btnExploreScience = document.getElementById('btn-explore-science');
  const headerBrandHome = document.getElementById('header-brand-home');

  // Cinematic Intro Elements
  const cinematicIntro = document.getElementById('cinematic-intro');
  const btnSkipIntro = document.getElementById('btn-skip-intro');

  // View Panels
  const viewPanels = {
    jukebox: document.getElementById('view-panel-jukebox'),
    timemachine: document.getElementById('view-panel-timemachine'),
    synthlab: document.getElementById('view-panel-synthlab'),
    'aurora-view': document.getElementById('view-panel-aurora')
  };

  // Nav Tabs
  const desktopNavTabs = document.querySelectorAll('.desktop-nav-tabs .nav-tab');
  const mobileNavTabs = document.querySelectorAll('.mobile-bottom-nav .mob-tab');

  // Master Transport Elements
  const btnMasterPlay = document.getElementById('btn-master-play');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const btnPrevTrack = document.getElementById('btn-prev-track');
  const btnNextTrack = document.getElementById('btn-next-track');
  const vinylDisc = document.getElementById('vinyl-disc');
  const nowPlayingTitle = document.getElementById('now-playing-title');
  const playbackModeBadge = document.getElementById('playback-mode-badge');
  const audioWaveformStrip = document.getElementById('audio-waveform-strip');

  // Knobs & Selectors
  const masterVolumeSlider = document.getElementById('master-volume-slider');
  const spaceReverbSlider = document.getElementById('space-reverb-slider');
  const volumeValDisplay = document.getElementById('volume-val-display');
  const reverbValDisplay = document.getElementById('reverb-val-display');
  const musicalScaleSelect = document.getElementById('musical-scale-select');

  // Telemetry DOM
  const valSpeed = document.getElementById('val-speed');
  const valDensity = document.getElementById('val-density');
  const valTemp = document.getElementById('val-temp');
  const valBz = document.getElementById('val-bz');
  const valBt = document.getElementById('val-bt');

  const barSpeed = document.getElementById('bar-speed');
  const barDensity = document.getElementById('bar-density');
  const barTemp = document.getElementById('bar-temp');
  const barBz = document.getElementById('bar-bz');
  const barBt = document.getElementById('bar-bt');

  const sliderSpeed = document.getElementById('slider-speed');
  const sliderDensity = document.getElementById('slider-density');
  const sliderTemp = document.getElementById('slider-temp');
  const sliderBz = document.getElementById('slider-bz');

  // Sparklines
  const sparkSpeed = document.getElementById('spark-speed');
  const sparkDensity = document.getElementById('spark-density');
  const sparkTemp = document.getElementById('spark-temp');
  const sparkBz = document.getElementById('spark-bz');
  const sparkBt = document.getElementById('spark-bt');

  // Canvas Overlays
  const overlayPitchVal = document.getElementById('overlay-pitch-val');
  const overlayGainVal = document.getElementById('overlay-gain-val');
  const overlayAuroraVal = document.getElementById('overlay-aurora-val');

  // Storm Badge
  const geomagStormPill = document.getElementById('geomag-storm-pill');
  const stormLevelText = document.getElementById('storm-level-text');

  // Solar DJ & Stories
  const djMoodText = document.getElementById('dj-mood-text');
  const djTaglineText = document.getElementById('dj-tagline-text');
  const btnGenerateDjMix = document.getElementById('btn-generate-dj-mix');

  const dynamicStoryLead = document.getElementById('dynamic-story-lead');
  const dynamicStoryDensity = document.getElementById('dynamic-story-density');
  const dynamicStoryMagnetic = document.getElementById('dynamic-story-magnetic');
  const storySummaryText = document.getElementById('story-summary-text');
  const btnStoryExpand = document.getElementById('btn-story-expand');
  const storyExtraDetails = document.getElementById('story-extra-details');

  // Shield Drag Slider
  const shieldDragBar = document.getElementById('shield-drag-bar');
  const shieldDragSlider = document.getElementById('shield-drag-slider');
  const shieldIntensityLabel = document.getElementById('shield-intensity-label');

  // Modals & Actions
  const btnDiscover = document.getElementById('btn-discover');
  const discoverModal = document.getElementById('discover-modal');
  const btnCloseDiscover = document.getElementById('btn-close-discover');
  const btnDiscoverListen = document.getElementById('btn-discover-listen');
  const discoverTitle = document.getElementById('discover-title');
  const discoverBody = document.getElementById('discover-body');

  const btnScreenshot = document.getElementById('btn-screenshot');
  const btnRecordAudio = document.getElementById('btn-record-audio');
  const recordText = document.getElementById('record-text');
  const recordTimer = document.getElementById('record-timer');

  const btnExportCsv = document.getElementById('btn-export-csv');
  const btnExportJson = document.getElementById('btn-export-json');

  const btnModeMusic = document.getElementById('btn-mode-music');
  const btnModeScience = document.getElementById('btn-mode-science');
  const btnAccessibility = document.getElementById('btn-accessibility');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  const scienceModal = document.getElementById('science-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnCloseModalBottom = document.getElementById('btn-close-modal-bottom');

  // Simple vs Advanced Mode Elements
  const btnModeSimple = document.getElementById('btn-mode-simple');
  const btnModeAdvanced = document.getElementById('btn-mode-advanced');
  const btnLinkAdvanced = document.getElementById('btn-link-advanced');
  const telemetryPanel = document.getElementById('telemetry-panel');
  const simpleSummaryCard = document.getElementById('simple-summary-card');
  const simpleSummaryText = document.getElementById('simple-summary-text');
  const advancedElements = document.querySelectorAll('.advanced-metric, .advanced-only');
  const btnResetTelemetryLive = document.getElementById('btn-reset-telemetry-live');

  // Legend Card
  const btnToggleLegend = document.getElementById('btn-toggle-legend');
  const legendChevron = document.getElementById('legend-chevron');
  const legendContent = document.getElementById('legend-content');

  // Tour Helper Banner Elements
  const tourBanner = document.getElementById('user-tour-banner');
  const btnDismissTour = document.getElementById('btn-dismiss-tour');
  const btnTakeTour = document.getElementById('btn-take-tour');
  const btnTourPrev = document.getElementById('btn-tour-prev');
  const btnTourNext = document.getElementById('btn-tour-next');
  const tourStepIcon = document.getElementById('tour-step-icon');
  const tourStepIndicator = document.getElementById('tour-step-indicator');
  const tourStepTitle = document.getElementById('tour-step-title');
  const tourStepText = document.getElementById('tour-step-text');
  const tourDots = document.querySelectorAll('.tour-dots .tour-dot');

  // Canvas Hotspots
  const hotspotSun = document.getElementById('hotspot-sun');
  const hotspotShield = document.getElementById('hotspot-shield');
  const hotspotAurora = document.getElementById('hotspot-aurora');

  /**
   * Global Toast Notification
   */
  window.showToastNotification = function(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => {
        if (container.contains(toast)) container.removeChild(toast);
      }, 300);
    }, 3500);
  };

  /**
   * 0. Cinematic Intro Dismissal (Endurance Initializer)
   */
  function dismissCinematicIntro() {
    if (!cinematicIntro || cinematicIntro.classList.contains('hidden')) return;
    cinematicIntro.classList.add('fade-out');
    setTimeout(() => {
      cinematicIntro.classList.add('hidden');
      sessionStorage.setItem('earth_jukebox_intro_seen', 'true');
    }, 450);
  }

  if (cinematicIntro) {
    if (sessionStorage.getItem('earth_jukebox_intro_seen') === 'true') {
      cinematicIntro.classList.add('hidden');
    } else {
      const introTimer = setTimeout(dismissCinematicIntro, 3000);
      if (btnSkipIntro) {
        btnSkipIntro.addEventListener('click', () => {
          clearTimeout(introTimer);
          dismissCinematicIntro();
        });
      }
    }
  }

  /**
   * Theme Initialization & Toggle (Cockpit Dark default, Light optional)
   */
  const savedTheme = localStorage.getItem('earth_jukebox_theme');
  if (savedTheme === 'theme-light') {
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('theme-light');
      localStorage.setItem('earth_jukebox_theme', isLight ? 'theme-light' : 'theme-endurance');
      window.showToastNotification(isLight ? "Daylight Cockpit Theme Enabled" : "Endurance Dark Void Theme Enabled");
    });
  }

  /**
   * 3-Step Guided Tour Logic
   */
  const tourSteps = [
    {
      icon: '🎵',
      indicator: 'Step 1 of 3 • Quick Start',
      title: '1. Press Play to Hear the Sun',
      text: 'Click the large amber <strong>Play</strong> button below (or hit Spacebar). Solar wind speed sets the musical pitch, and plasma density fuels volume and sub-bass thunder!'
    },
    {
      icon: '⚡',
      indicator: 'Step 2 of 3 • Historic Storms',
      title: '2. Pick a Storm from the Playlist',
      text: 'Browse the mission playlist on the left. Select <strong>Carrington (1859)</strong> or <strong>May 2024</strong> to hear extreme solar storms when coronal mass ejections hit Earth.'
    },
    {
      icon: '🌍',
      indicator: 'Step 3 of 3 • Celestial Reaction',
      title: '3. Watch Sun & Earth React',
      text: 'Observe the golden solar accretion halo flare, streaming plasma wind, and Earth\'s blue magnetic shield compressing in real time as storms collide.'
    }
  ];

  let currentTourStep = 0;

  function updateTourUI() {
    if (!tourBanner) return;
    const s = tourSteps[currentTourStep];
    if (tourStepIcon) tourStepIcon.textContent = s.icon;
    if (tourStepIndicator) tourStepIndicator.textContent = s.indicator;
    if (tourStepTitle) tourStepTitle.textContent = s.title;
    if (tourStepText) tourStepText.innerHTML = s.text;

    if (btnTourPrev) {
      btnTourPrev.classList.toggle('hidden', currentTourStep === 0);
    }
    if (btnTourNext) {
      btnTourNext.innerHTML = currentTourStep === tourSteps.length - 1 
        ? 'Finish Tour &check;' 
        : 'Next Step &rarr;';
    }

    tourDots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentTourStep);
    });
  }

  function dismissTour() {
    if (tourBanner) {
      tourBanner.classList.add('hidden');
      localStorage.setItem('earth_jukebox_tour_dismissed', 'true');
    }
  }

  if (tourBanner) {
    if (localStorage.getItem('earth_jukebox_tour_dismissed') === 'true') {
      tourBanner.classList.add('hidden');
    } else {
      updateTourUI();
    }

    if (btnDismissTour) {
      btnDismissTour.addEventListener('click', dismissTour);
    }

    if (btnTourNext) {
      btnTourNext.addEventListener('click', () => {
        if (currentTourStep < tourSteps.length - 1) {
          currentTourStep++;
          updateTourUI();
        } else {
          dismissTour();
          window.showToastNotification("Tour complete — Enjoy the solar wind symphony!");
        }
      });
    }

    if (btnTourPrev) {
      btnTourPrev.addEventListener('click', () => {
        if (currentTourStep > 0) {
          currentTourStep--;
          updateTourUI();
        }
      });
    }

    tourDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const stepNum = parseInt(dot.dataset.step, 10);
        if (!isNaN(stepNum)) {
          currentTourStep = stepNum;
          updateTourUI();
        }
      });
    });
  }

  if (btnTakeTour) {
    btnTakeTour.addEventListener('click', () => {
      if (tourBanner) {
        tourBanner.classList.remove('hidden');
        currentTourStep = 0;
        updateTourUI();
        tourBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  /**
   * Enter Application from Landing Screen
   */
  function enterJukebox(directToScience = false) {
    landingScreen.classList.add('fade-out');
    setTimeout(() => {
      landingScreen.classList.add('hidden');
      appShell.classList.remove('hidden');
      visualizer.initCanvasSize();
      if (directToScience) {
        scienceModal.classList.remove('hidden');
      }
    }, 400);
  }

  btnEnterJukebox.addEventListener('click', () => {
    enterJukebox(false);
    togglePlay(); // Auto-start audio on intentional entry
  });

  btnExploreScience.addEventListener('click', () => {
    enterJukebox(true);
  });

  headerBrandHome.addEventListener('click', () => {
    landingScreen.classList.remove('hidden');
    landingScreen.classList.remove('fade-out');
    appShell.classList.add('hidden');
  });

  /**
   * View Switching (Jukebox | Time Machine | Synth Lab | Aurora Planetarium)
   */
  function switchView(viewName) {
    Object.keys(viewPanels).forEach(key => {
      if (viewPanels[key]) {
        viewPanels[key].classList.toggle('active', key === viewName);
        viewPanels[key].classList.toggle('hidden', key !== viewName);
      }
    });

    desktopNavTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
      tab.setAttribute('aria-selected', tab.dataset.view === viewName ? 'true' : 'false');
    });

    mobileNavTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.view === viewName);
    });

    if (viewName === 'aurora-view') {
      visualizer.setViewMode('aurora-planetarium');
    } else if (visualizer.viewMode === 'aurora-planetarium') {
      visualizer.setViewMode('heliosphere');
    }

    if (shieldDragBar) {
      shieldDragBar.classList.toggle('hidden', visualizer.viewMode !== 'shield');
    }

    visualizer.initCanvasSize();
  }

  desktopNavTabs.forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  mobileNavTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.id === 'mob-science-btn') {
        scienceModal.classList.remove('hidden');
        return;
      }
      
      const view = tab.dataset.view;
      if (view) {
        switchView(view);
      }

      const target = tab.dataset.target;
      if (target) {
        const el = document.getElementById(target) || document.querySelector(`.${target}`);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }

      mobileNavTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  const btnExitPlanetarium = document.getElementById('btn-exit-planetarium');
  if (btnExitPlanetarium) {
    btnExitPlanetarium.addEventListener('click', () => switchView('jukebox'));
  }

  /**
   * Viewport Sub-tabs (Heliosphere & Shield | Spectrum | Shield Lab)
   */
  const viewHeliosphereBtn = document.getElementById('view-heliosphere');
  const viewSpectrumBtn = document.getElementById('view-spectrum');
  const viewShieldBtn = document.getElementById('view-shield');

  function setCanvasSubMode(mode) {
    visualizer.setViewMode(mode);
    if (viewHeliosphereBtn) viewHeliosphereBtn.classList.toggle('active', mode === 'heliosphere');
    if (viewSpectrumBtn) viewSpectrumBtn.classList.toggle('active', mode === 'spectrum');
    if (viewShieldBtn) viewShieldBtn.classList.toggle('active', mode === 'shield');
    if (shieldDragBar) shieldDragBar.classList.toggle('hidden', mode !== 'shield');
  }

  if (viewHeliosphereBtn) viewHeliosphereBtn.addEventListener('click', () => setCanvasSubMode('heliosphere'));
  if (viewSpectrumBtn) viewSpectrumBtn.addEventListener('click', () => setCanvasSubMode('spectrum'));
  if (viewShieldBtn) viewShieldBtn.addEventListener('click', () => setCanvasSubMode('shield'));

  /**
   * Render Track List in Jukebox Rack with Filters, Section Headings & Severity Stripes
   */
  function renderJukeboxTracks(filter = currentPlaylistFilter) {
    currentPlaylistFilter = filter;
    const list = document.getElementById('jukebox-track-list');
    if (!list) return;

    list.innerHTML = '';

    // Update filter chip UI active state
    document.querySelectorAll('.playlist-filter-row .filter-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    const matchesFilter = (item) => {
      if (filter === 'all') return true;
      const scale = (item.stormScale || '').toUpperCase();
      const isCalm = item.id === 'live' || scale.includes('G0') || scale.includes('G1') || scale.includes('DYNAMIC');
      if (filter === 'calm') return isCalm;
      if (filter === 'storm') return !isCalm || scale.includes('G2') || scale.includes('G3') || scale.includes('G4') || scale.includes('G5');
      return true;
    };

    const liveItems = HISTORICAL_EVENTS.filter(e => e.id === 'live' && matchesFilter(e));
    const historicItems = HISTORICAL_EVENTS.filter(e => e.id !== 'live' && matchesFilter(e));

    const createCard = (item, originalIdx, displayIdx) => {
      const card = document.createElement('div');
      const isActive = originalIdx === currentTrackIndex;
      card.className = `track-card ${isActive ? 'active' : ''}`;
      card.dataset.index = originalIdx;
      card.dataset.id = item.id;
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
      card.tabIndex = 0;

      // Severity level for left border stripe
      let stormLevel = 'live';
      const scale = (item.stormScale || '').toUpperCase();
      if (item.id === 'live') {
        stormLevel = 'live';
      } else if (scale.includes('G5')) stormLevel = 'g5';
      else if (scale.includes('G4')) stormLevel = 'g4';
      else if (scale.includes('G3')) stormLevel = 'g3';
      else if (scale.includes('G2')) stormLevel = 'g2';
      else if (scale.includes('G1')) stormLevel = 'g1';
      else stormLevel = 'g0';

      card.dataset.stormLevel = stormLevel;

      const badgeClass = stormLevel === 'g5' || stormLevel === 'g4' 
        ? 'storm-tag' 
        : item.id === 'live' ? 'live-tag' : 'tag';

      const indexDisplay = item.id === 'live' ? 'LIVE' : (displayIdx < 10 ? '0' + displayIdx : displayIdx);

      card.innerHTML = `
        <div class="track-number">${indexDisplay}</div>
        <div class="track-info">
          <h3 class="track-title">${item.title}</h3>
          <p class="track-desc">${item.description.slice(0, 75)}...</p>
          <div class="track-tags">
            <span class="tag ${badgeClass}">${item.stormScale}</span>
            <span class="tag">${Math.round(item.speed)} km/s</span>
          </div>
        </div>
        <div class="track-wave-anim" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
        </div>
      `;

      card.addEventListener('click', () => loadTrackByIndex(originalIdx));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          loadTrackByIndex(originalIdx);
        }
      });
      return card;
    };

    if (liveItems.length > 0) {
      const liveHeader = document.createElement('div');
      liveHeader.className = 'playlist-section-header';
      liveHeader.textContent = 'Live now';
      list.appendChild(liveHeader);

      liveItems.forEach(item => {
        const origIdx = HISTORICAL_EVENTS.findIndex(e => e.id === item.id);
        list.appendChild(createCard(item, origIdx, 0));
      });
    }

    if (historicItems.length > 0) {
      const histHeader = document.createElement('div');
      histHeader.className = 'playlist-section-header';
      histHeader.textContent = 'Historic storms';
      list.appendChild(histHeader);

      let histCounter = 1;
      historicItems.forEach(item => {
        const origIdx = HISTORICAL_EVENTS.findIndex(e => e.id === item.id);
        list.appendChild(createCard(item, origIdx, histCounter++));
      });
    }
  }

  // Playlist Filter Button Handlers
  document.querySelectorAll('.playlist-filter-row .filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter || 'all';
      renderJukeboxTracks(f);
    });
  });

  /**
   * Render Time Machine Historical Events Grid
   */
  function renderTimeMachineGrid() {
    const container = document.getElementById('tm-events-container');
    if (!container) return;

    container.innerHTML = '';
    HISTORICAL_EVENTS.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'tm-card';

      let scaleClass = 'scale-g0';
      if (item.stormScale.includes('G5')) scaleClass = 'scale-g5';
      else if (item.stormScale.includes('G4')) scaleClass = 'scale-g4';
      else if (item.stormScale.includes('G3')) scaleClass = 'scale-g3';
      else if (item.stormScale.includes('G2')) scaleClass = 'scale-g2';
      else if (item.stormScale.includes('G1')) scaleClass = 'scale-g1';

      card.innerHTML = `
        <div class="tm-card-header">
          <span class="tm-year">${item.year}</span>
          <span class="tm-storm-scale ${scaleClass}">${item.stormScale}</span>
        </div>
        <h3 class="tm-title">${item.title}</h3>
        <p class="tm-subtitle">${item.subtitle}</p>
        <div class="tm-metrics-row">
          <span>Speed: <strong>${Math.round(item.speed)} km/s</strong></span>
          <span>Density: <strong>${item.density.toFixed(1)} p/cm³</strong></span>
          <span>Bz: <strong>${item.bz.toFixed(1)} nT</strong></span>
        </div>
        <p class="tm-desc">${item.description}</p>
        <button class="btn-tm-play" data-index="${idx}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          LISTEN TO THIS STORM
        </button>
      `;

      const playBtn = card.querySelector('.btn-tm-play');
      playBtn.addEventListener('click', () => {
        loadTrackByIndex(idx);
        switchView('jukebox');
      });

      container.appendChild(card);
    });
  }

  /**
   * Load Track by Index
   */
  function loadTrackByIndex(idx) {
    if (idx < 0) idx = HISTORICAL_EVENTS.length - 1;
    if (idx >= HISTORICAL_EVENTS.length) idx = 0;

    currentTrackIndex = idx;
    const event = HISTORICAL_EVENTS[idx];
    isLiveStreamActive = (event.id === 'live');

    // Update Jukebox Track Cards
    document.querySelectorAll('.track-card').forEach((card) => {
      const cardIdx = parseInt(card.dataset.index, 10);
      const isActive = cardIdx === idx;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });

    nowPlayingTitle.textContent = event.title;
    playbackModeBadge.textContent = event.historyBadge;

    if (btnResetTelemetryLive) {
      btnResetTelemetryLive.classList.toggle('hidden', isLiveStreamActive);
    }

    // Apply parameters to engines
    applyTelemetry({
      speed: event.speed,
      density: event.density,
      temperature: event.temperature,
      bz: event.bz,
      bt: event.bt
    });

    window.showToastNotification(`Loaded: ${event.title}`);
  }

  /**
   * Apply Telemetry to UI, Audio, and Canvas
   */
  function applyTelemetry(params) {
    // 1. Audio update
    audio.updateParameters(params);

    // 2. Visualizer update
    visualizer.updatePhysics(params);

    // 3. UI Values & Cockpit Instrument Gauges
    if (params.speed !== undefined) {
      valSpeed.textContent = params.speed.toFixed(1);
      sliderSpeed.value = params.speed;
      const speedPct = Math.min(100, Math.max(0, ((params.speed - 250) / 1250) * 100));
      barSpeed.style.width = `${speedPct}%`;

      const landingSpeed = document.getElementById('landing-val-speed');
      if (landingSpeed) landingSpeed.textContent = `${Math.round(params.speed)} km/s`;

      const plSpeed = document.getElementById('pl-speed');
      if (plSpeed) plSpeed.textContent = `${Math.round(params.speed)} km/s`;

      const labSpeed = document.getElementById('lab-speed-val');
      if (labSpeed) labSpeed.textContent = `${Math.round(params.speed)} km/s`;
    }

    if (params.density !== undefined) {
      valDensity.textContent = params.density.toFixed(2);
      sliderDensity.value = params.density;
      const densityPct = Math.min(100, Math.max(0, (params.density / 60) * 100));
      barDensity.style.width = `${densityPct}%`;

      const landingDensity = document.getElementById('landing-val-density');
      if (landingDensity) landingDensity.textContent = `${params.density.toFixed(1)} p/cm³`;

      const labDensity = document.getElementById('lab-density-val');
      if (labDensity) labDensity.textContent = `${params.density.toFixed(1)} p/cm³`;
    }

    if (params.temperature !== undefined) {
      valTemp.textContent = Math.round(params.temperature).toLocaleString();
      sliderTemp.value = params.temperature;
      const tempPct = Math.min(100, Math.max(0, ((params.temperature - 10000) / 590000) * 100));
      barTemp.style.width = `${tempPct}%`;

      const labTemp = document.getElementById('lab-temp-val');
      if (labTemp) labTemp.textContent = `${Math.round(params.temperature).toLocaleString()} K`;
    }

    if (params.bz !== undefined) {
      valBz.textContent = params.bz.toFixed(2);
      sliderBz.value = params.bz;
      const bzNorm = Math.min(1, Math.max(-1, params.bz / 30));
      barBz.style.width = `${50 + bzNorm * 50}%`;

      const landingBz = document.getElementById('landing-val-bz');
      if (landingBz) landingBz.textContent = `${params.bz.toFixed(1)} nT`;

      const plBz = document.getElementById('pl-bz');
      if (plBz) plBz.textContent = `${params.bz.toFixed(1)} nT`;

      const plRecon = document.getElementById('pl-recon');
      if (plRecon) plRecon.textContent = params.bz < 0 ? 'ACTIVE RECONNECTION' : 'CLOSED SHIELD';

      const labBz = document.getElementById('lab-bz-val');
      if (labBz) labBz.textContent = `${params.bz.toFixed(1)} nT`;
    }

    if (params.bt !== undefined) {
      valBt.textContent = params.bt.toFixed(2);
      barBt.style.width = `${Math.min(100, (params.bt / 50) * 100)}%`;
    }

    // 4. Update Storm Classification & Badges with plain English explanation
    const storm = telemetry.getStormClassification(params.speed, params.bz);
    const friendlyStormNames = {
      'G0': 'Calm space weather (G0) — Quiet solar breeze',
      'G1': 'Minor disturbance (G1) — High-latitude aurora possible',
      'G2': 'Moderate storm (G2) — Auroras visible in northern skies',
      'G3': 'Strong storm (G3) — Voltage alarms & auroras mid-latitude',
      'G4': 'Severe storm (G4) — Widespread voltage control & deep auroras',
      'G5': 'Extreme superstorm (G5) — Global electrical grid hazard'
    };
    const friendlyText = friendlyStormNames[storm.level] || `${storm.level}: ${storm.name}`;
    geomagStormPill.className = `storm-indicator-pill storm-${storm.level.toLowerCase()}`;
    stormLevelText.textContent = friendlyText;

    const landingStorm = document.getElementById('landing-val-storm');
    if (landingStorm) {
      landingStorm.textContent = `${storm.level} ${storm.name.split(' ')[0]}`;
      landingStorm.style.color = storm.color;
    }

    // 5. Update Status Badges on Telemetry Cards
    if (telemetry.getMetricStatuses) {
      const statuses = telemetry.getMetricStatuses(params);
      const updateBadge = (id, st) => {
        const el = document.getElementById(id);
        if (el && st) {
          el.className = `metric-status-badge status-${st.level}`;
          const txt = el.querySelector('.txt');
          if (txt) txt.textContent = st.text;
        }
      };
      updateBadge('status-badge-speed', statuses.speed);
      updateBadge('status-badge-density', statuses.density);
      updateBadge('status-badge-temp', statuses.temp);
      updateBadge('status-badge-bz', statuses.bz);
      updateBadge('status-badge-bt', statuses.bt);
    }

    // 6. Update Canvas Overlay Readouts
    if (audio.targetPitch) {
      overlayPitchVal.textContent = `${audio.targetPitch.toFixed(1)} Hz (${getNoteName(audio.targetPitch)})`;
    }
    const dB = Math.round(20 * Math.log10(Math.max(0.01, audio.targetGain)));
    overlayGainVal.textContent = `${dB} dB`;
    overlayAuroraVal.textContent = params.bz < 0 ? `Reconnecting (${params.bz.toFixed(1)} nT)` : `Resting (+${params.bz.toFixed(1)} nT)`;

    // 7. Update Space Weather Story and Simple Summary
    const story = telemetry.generateStory();
    dynamicStoryLead.textContent = story.lead;
    dynamicStoryDensity.textContent = story.densityDesc;
    dynamicStoryMagnetic.textContent = story.magneticDesc;

    if (storySummaryText) {
      storySummaryText.textContent = `Lagrange L1 telemetry reports solar wind speed at ${Math.round(params.speed || 350)} km/s and proton density ${((params.density || 2.7)).toFixed(1)} p/cm³. Earth's bow shock is positioned at approximately 10 Earth radii. Power grids, aviation communications, and GPS satellites operate nominally.`;
    }

    if (simpleSummaryText) {
      const spd = Math.round(params.speed || 350);
      const den = ((params.density || 2.7)).toFixed(1);
      const bzVal = ((params.bz || 0)).toFixed(1);
      const bzDesc = params.bz < 0 
        ? `B_z is Southward (${bzVal} nT), triggering celestial aurora chimes` 
        : `Earth's shield is closed (+${bzVal} nT), sustaining a peaceful drone`;
      simpleSummaryText.textContent = `Solar wind is streaming at ${spd} km/s with proton density ${den} p/cm³. ${bzDesc}.`;
    }

    const dj = telemetry.getSolarDjMood();
    djMoodText.textContent = dj.mood;
    djTaglineText.textContent = dj.tagline;

    // 8. Relative Timestamp in Header
    const streamTimestamp = document.getElementById('stream-timestamp');
    if (streamTimestamp && telemetry.getRelativeTimeStr) {
      streamTimestamp.textContent = telemetry.getRelativeTimeStr();
    }

    // 9. Render Sparklines
    telemetry.renderSparkline(sparkSpeed, 'speed', 250, 1200, '#F2A93B');
    telemetry.renderSparkline(sparkDensity, 'density', 0.5, 50, '#5FA8D3');
    telemetry.renderSparkline(sparkTemp, 'temperature', 10000, 500000, '#FFCF7A');
    telemetry.renderSparkline(sparkBz, 'bz', -30, 30, '#4FB89A');
    telemetry.renderSparkline(sparkBt, 'bt', 1, 40, '#8A9BAE');
  }

  function getNoteName(freq) {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const midi = Math.round(69 + 12 * Math.log2(freq / 440));
    const note = notes[midi % 12];
    const octave = Math.floor(midi / 12) - 1;
    return `${note}${octave}`;
  }

  // Hook telemetry engine updates
  telemetry.onUpdate(params => {
    if (isLiveStreamActive) {
      applyTelemetry(params);
    }
  });

  /**
   * Transport Play/Pause (Spacebar & Master Amber Button)
   */
  async function togglePlay() {
    if (!audio.isPlaying) {
      await audio.play();
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
      vinylDisc.classList.add('spinning');
      if (audioWaveformStrip) audioWaveformStrip.classList.add('active');
      window.showToastNotification("Earth Jukebox Sonification Active");
    } else {
      audio.pause();
      pauseIcon.classList.add('hidden');
      playIcon.classList.remove('hidden');
      vinylDisc.classList.remove('spinning');
      if (audioWaveformStrip) audioWaveformStrip.classList.remove('active');
    }
  }

  btnMasterPlay.addEventListener('click', togglePlay);
  btnPrevTrack.addEventListener('click', () => loadTrackByIndex(currentTrackIndex - 1));
  btnNextTrack.addEventListener('click', () => loadTrackByIndex(currentTrackIndex + 1));

  /**
   * Single-line Mixer Volume & Reverb Sliders
   */
  masterVolumeSlider.addEventListener('input', (e) => {
    audio.setMasterVolume(e.target.value);
    volumeValDisplay.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  spaceReverbSlider.addEventListener('input', (e) => {
    audio.setReverbLevel(e.target.value);
    reverbValDisplay.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  musicalScaleSelect.addEventListener('change', (e) => {
    audio.state.scale = e.target.value;
    audio.updateAcoustics();
    window.showToastNotification(`Harmonic Tuning: ${musicalScaleSelect.options[musicalScaleSelect.selectedIndex].text}`);
  });

  /**
   * Solar DJ "GENERATE LIVE MIX"
   */
  btnGenerateDjMix.addEventListener('click', () => {
    const dj = telemetry.getSolarDjMood();
    musicalScaleSelect.value = dj.scale;
    audio.state.scale = dj.scale;
    audio.updateAcoustics();
    window.showToastNotification(`Solar DJ: Applied '${dj.mood}' preset`);
  });

  /**
   * "DRAG SOLAR WIND" Intensity Slider
   */
  if (shieldDragSlider) {
    shieldDragSlider.addEventListener('input', (e) => {
      const factor = parseFloat(e.target.value);
      visualizer.shieldDragIntensity = factor;
      shieldIntensityLabel.textContent = `${factor.toFixed(1)}x Normal`;
    });
  }

  /**
   * Telemetry Manual Sliders (Decouples to Synth Lab mode)
   */
  [sliderSpeed, sliderDensity, sliderTemp, sliderBz].forEach(slider => {
    if (slider) {
      slider.addEventListener('input', () => {
        isLiveStreamActive = false;
        playbackModeBadge.textContent = "CUSTOM LAB";
        if (btnResetTelemetryLive) btnResetTelemetryLive.classList.remove('hidden');
        applyTelemetry({
          speed: parseFloat(sliderSpeed.value),
          density: parseFloat(sliderDensity.value),
          temperature: parseFloat(sliderTemp.value),
          bz: parseFloat(sliderBz.value)
        });
      });
    }
  });

  /**
   * Reset Manual Tuning Sliders to Live Telemetry
   */
  function restoreLiveTelemetry() {
    isLiveStreamActive = true;
    playbackModeBadge.textContent = "Live feed";
    if (btnResetTelemetryLive) btnResetTelemetryLive.classList.add('hidden');
    const liveIdx = HISTORICAL_EVENTS.findIndex(e => e.id === 'live');
    if (liveIdx !== -1) {
      loadTrackByIndex(liveIdx);
    } else {
      telemetry.fetchLive();
    }
    window.showToastNotification("Restored Live NOAA Telemetry Feed");
  }

  if (btnResetTelemetryLive) {
    btnResetTelemetryLive.addEventListener('click', restoreLiveTelemetry);
  }

  /**
   * "Tune Manually" Drawer Toggle
   */
  const btnToggleTuning = document.getElementById('btn-toggle-tuning');
  const sliderDrawers = document.querySelectorAll('.slider-drawer');

  if (btnToggleTuning) {
    btnToggleTuning.addEventListener('click', () => {
      const areOpen = btnToggleTuning.classList.toggle('active');
      btnToggleTuning.textContent = areOpen ? "Hide tuning" : "Tune manually";
      sliderDrawers.forEach(drawer => {
        drawer.classList.toggle('hidden', !areOpen);
      });
      window.showToastNotification(areOpen ? "Manual parameter sliders revealed" : "Manual parameter sliders hidden");
    });
  }

  /**
   * Simple vs Advanced Telemetry Complexity Switch
   */
  function setTelemetryMode(mode) {
    const isAdv = (mode === 'advanced');
    if (btnModeSimple) btnModeSimple.classList.toggle('active', !isAdv);
    if (btnModeAdvanced) btnModeAdvanced.classList.toggle('active', isAdv);

    if (telemetryPanel) {
      telemetryPanel.classList.toggle('mode-simple', !isAdv);
      telemetryPanel.classList.toggle('mode-advanced', isAdv);
    }

    if (simpleSummaryCard) {
      simpleSummaryCard.classList.toggle('hidden', isAdv);
    }

    advancedElements.forEach(el => {
      el.classList.toggle('hidden', !isAdv);
    });

    if (!isAdv && btnToggleTuning) {
      btnToggleTuning.classList.remove('active');
      btnToggleTuning.textContent = "Tune manually";
      sliderDrawers.forEach(drawer => drawer.classList.add('hidden'));
    }

    window.showToastNotification(isAdv ? "Advanced Telemetry Mode (All 5 Metrics)" : "Simple Telemetry Mode (Speed & Density)");
  }

  if (btnModeSimple) btnModeSimple.addEventListener('click', () => setTelemetryMode('simple'));
  if (btnModeAdvanced) btnModeAdvanced.addEventListener('click', () => setTelemetryMode('advanced'));
  if (btnLinkAdvanced) btnLinkAdvanced.addEventListener('click', () => setTelemetryMode('advanced'));

  /**
   * Collapsible Legend Card
   */
  if (btnToggleLegend && legendContent) {
    btnToggleLegend.addEventListener('click', () => {
      const isHidden = legendContent.classList.toggle('hidden');
      const isExpanded = !isHidden;
      btnToggleLegend.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      if (legendChevron) {
        legendChevron.textContent = isExpanded ? '▾' : '▸';
      }
    });
  }

  /**
   * Collapsible Space Story Narrative
   */
  if (btnStoryExpand && storyExtraDetails) {
    btnStoryExpand.addEventListener('click', () => {
      const isHidden = storyExtraDetails.classList.toggle('hidden');
      const isExpanded = !isHidden;
      btnStoryExpand.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
      const span = btnStoryExpand.querySelector('span');
      if (span) {
        span.textContent = isExpanded ? 'Hide scientific narrative' : 'Read scientific narrative telemetry';
      }
    });
  }

  /**
   * Canvas Hotspots
   */
  function pulseCard(cardId) {
    const card = document.getElementById(cardId);
    if (card) {
      card.classList.add('highlight-pulse');
      setTimeout(() => card.classList.remove('highlight-pulse'), 1200);
    }
  }

  if (hotspotSun) {
    hotspotSun.addEventListener('click', () => {
      pulseCard('card-param-speed');
      window.showToastNotification("☀️ The Sun: Driver of solar wind speed & sound pitch");
    });
  }
  if (hotspotShield) {
    hotspotShield.addEventListener('click', () => {
      pulseCard('card-param-bz');
      window.showToastNotification("🛡️ Magnetic Shield: Earth's bow shock defending against solar wind gusts");
    });
  }
  if (hotspotAurora) {
    hotspotAurora.addEventListener('click', () => {
      pulseCard('card-param-bz');
      window.showToastNotification("✨ Auroras: Triggered when Southward magnetic field links with Earth");
    });
  }

  /**
   * "DISCOVER SOMETHING" Feature
   */
  btnDiscover.addEventListener('click', () => {
    const randomEvent = HISTORICAL_EVENTS[Math.floor(Math.random() * HISTORICAL_EVENTS.length)];
    discoverTitle.textContent = randomEvent.title;
    discoverBody.innerHTML = `
      <div class="m-card">
        <strong>${randomEvent.subtitle} (${randomEvent.year})</strong>
        <p>${randomEvent.description}</p>
      </div>
      <div class="matrix-cards-grid mt-10">
        <div class="m-card">
          <strong class="color-amber">Solar Conditions</strong>
          <span>Speed: ${Math.round(randomEvent.speed)} km/s • Density: ${randomEvent.density.toFixed(1)} p/cm³ • Bz: ${randomEvent.bz.toFixed(1)} nT</span>
        </div>
        <div class="m-card">
          <strong class="color-cyan">Soundscape Profile</strong>
          <span>${randomEvent.soundCharacteristics}</span>
        </div>
      </div>
      <div class="m-card mt-10">
        <strong class="color-emerald">Scientific Takeaway</strong>
        <span>${randomEvent.scientificContext}</span>
      </div>
    `;

    discoverModal.classList.remove('hidden');

    btnDiscoverListen.onclick = () => {
      discoverModal.classList.add('hidden');
      const idx = HISTORICAL_EVENTS.findIndex(e => e.id === randomEvent.id);
      loadTrackByIndex(idx);
    };
  });

  btnCloseDiscover.addEventListener('click', () => discoverModal.classList.add('hidden'));

  /**
   * Audio Recording Functionality
   */
  btnRecordAudio.addEventListener('click', () => {
    mediaExporter.toggleAudioRecording(
      () => {
        btnRecordAudio.classList.add('recording');
        recordText.textContent = "Stop & Save";
        recordTimer.classList.remove('hidden');
        window.showToastNotification("Recording solar wind audio stream...");
      },
      (timeStr) => {
        recordTimer.textContent = timeStr;
      },
      () => {
        btnRecordAudio.classList.remove('recording');
        recordText.textContent = "Record Audio";
        recordTimer.classList.add('hidden');
        window.showToastNotification("Recording finished. Downloading WebM file!");
      }
    );
  });

  /**
   * Screenshot Capture
   */
  btnScreenshot.addEventListener('click', () => {
    mediaExporter.captureScreenshot(telemetry.current);
    window.showToastNotification("Captured scientific snapshot!");
  });

  /**
   * ADD-ON: Coronal Mass Ejection (CME) Solar Flare Trigger Button
   */
  const btnTriggerCme = document.getElementById('btn-trigger-cme');
  if (btnTriggerCme) {
    btnTriggerCme.addEventListener('click', async () => {
      // Ensure audio is initialized and playing
      if (!audio.isPlaying) {
        await togglePlay();
      }

      btnTriggerCme.classList.add('active');
      visualizer.triggerCme();
      audio.triggerCmeBurst();

      window.showToastNotification("💥 Solar Flare Erupted! Plasma CME shockwave inbound at 1,250 km/s!");

      setTimeout(() => {
        btnTriggerCme.classList.remove('active');
      }, 5500);
    });
  }

  /**
   * ADD-ON: 3D Binaural Spatial Audio Toggle
   */
  const btnSpatialAudio = document.getElementById('btn-spatial-audio');
  const spatialAudioLabel = document.getElementById('spatial-audio-label');
  if (btnSpatialAudio) {
    btnSpatialAudio.addEventListener('click', async () => {
      if (!audio.ctx) await audio.initContext();
      const isSpatial = audio.toggleSpatialBinaural(!audio.spatialAudioEnabled);
      btnSpatialAudio.classList.toggle('active', isSpatial);
      if (spatialAudioLabel) {
        spatialAudioLabel.textContent = isSpatial ? "3D Active" : "3D Space";
      }
      window.showToastNotification(isSpatial 
        ? "🎧 3D Binaural Spatial Audio ON (Sun on Left, Earth on Right)" 
        : "Standard Stereo Audio Restored");
    });
  }

  /**
   * ADD-ON: Deep Space Focus & Sleep Timer (Off -> 15m -> 30m -> 60m -> Off)
   */
  const btnSleepTimer = document.getElementById('btn-sleep-timer');
  const sleepTimerLabel = document.getElementById('sleep-timer-label');
  const sleepDurations = [0, 15, 30, 60];
  let sleepTimerIndex = 0;

  if (btnSleepTimer) {
    btnSleepTimer.addEventListener('click', () => {
      sleepTimerIndex = (sleepTimerIndex + 1) % sleepDurations.length;
      const minutes = sleepDurations[sleepTimerIndex];

      if (minutes > 0) {
        btnSleepTimer.classList.add('active');
        if (sleepTimerLabel) sleepTimerLabel.textContent = `${minutes}m`;
        audio.setSleepFocusTimer(
          minutes,
          (timeStr) => {
            if (sleepTimerLabel) sleepTimerLabel.textContent = timeStr;
          },
          () => {
            btnSleepTimer.classList.remove('active');
            if (sleepTimerLabel) sleepTimerLabel.textContent = "Timer";
            sleepTimerIndex = 0;
            window.showToastNotification("🌙 Sleep timer ended — Goodnight cosmic traveler!");
          }
        );
        window.showToastNotification(`🌙 Deep Space Timer set: ${minutes} minutes with soft fadeout`);
      } else {
        audio.clearSleepTimer();
        btnSleepTimer.classList.remove('active');
        if (sleepTimerLabel) sleepTimerLabel.textContent = "Timer";
        window.showToastNotification("Sleep / Focus Timer cancelled");
      }
    });
  }

  /**
   * ADD-ON: Share Cinematic Mission Dispatch Card
   */
  const btnShareCard = document.getElementById('btn-share-card');
  if (btnShareCard) {
    btnShareCard.addEventListener('click', async () => {
      window.showToastNotification("🎴 Generating Cinematic Mission Dispatch Card...");
      await mediaExporter.generateMissionShareCard(telemetry.current);
    });
  }

  /**
   * CSV & JSON Data Export
   */
  btnExportCsv.addEventListener('click', () => {
    telemetry.exportCSV();
    window.showToastNotification("Exported telemetry CSV");
  });

  btnExportJson.addEventListener('click', () => {
    telemetry.exportJSON();
    window.showToastNotification("Exported telemetry JSON");
  });

  /**
   * Science Mode vs Music Mode Toggle
   */
  btnModeMusic.addEventListener('click', () => {
    document.body.classList.remove('mode-science');
    document.body.classList.add('mode-music');
    btnModeMusic.classList.add('active');
    btnModeScience.classList.remove('active');
    window.showToastNotification("Music Immersion Mode Enabled");
  });

  btnModeScience.addEventListener('click', () => {
    document.body.classList.remove('mode-music');
    document.body.classList.add('mode-science');
    btnModeScience.classList.add('active');
    btnModeMusic.classList.remove('active');
    window.showToastNotification("Science Telemetry Mode Enabled");
  });

  /**
   * Accessibility Mode Toggle
   */
  btnAccessibility.addEventListener('click', () => {
    document.body.classList.toggle('mode-accessibility');
    const isAccess = document.body.classList.contains('mode-accessibility');
    window.showToastNotification(isAccess ? "Accessibility High-Contrast Mode ON" : "Normal Cosmic Theme ON");
  });

  /**
   * Science Guide Modal
   */
  const openScienceModal = () => scienceModal.classList.remove('hidden');
  const closeScienceModal = () => scienceModal.classList.add('hidden');

  const btnOpenScienceNav = document.getElementById('btn-open-science');
  if (btnOpenScienceNav) btnOpenScienceNav.addEventListener('click', openScienceModal);
  btnCloseModal.addEventListener('click', closeScienceModal);
  btnCloseModalBottom.addEventListener('click', closeScienceModal);

  scienceModal.addEventListener('click', (e) => {
    if (e.target === scienceModal) closeScienceModal();
  });

  /**
   * Global Keyboard Shortcuts
   * Space: Play/Pause or Dismiss Intro
   * Left / Right Arrows: Previous / Next Track
   * M: Toggle Music / Science Mode
   * T: Toggle Cockpit Dark / Light Theme
   * Escape: Close Modals
   */
  document.addEventListener('keydown', (e) => {
    // If intro overlay is visible, Space or Enter dismisses it
    if (cinematicIntro && !cinematicIntro.classList.contains('hidden')) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        dismissCinematicIntro();
        return;
      }
    }

    if (e.key === 'Escape') {
      closeScienceModal();
      discoverModal.classList.add('hidden');
      return;
    }

    // Ignore single key shortcuts if user is inside an input, textarea or select
    const activeEl = document.activeElement;
    const activeTag = activeEl ? activeEl.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return;
    }

    if (e.key === ' ') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      loadTrackByIndex(currentTrackIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      loadTrackByIndex(currentTrackIndex + 1);
    } else if (e.key === 'm' || e.key === 'M') {
      if (document.body.classList.contains('mode-music')) {
        btnModeScience.click();
      } else {
        btnModeMusic.click();
      }
    } else if (e.key === 't' || e.key === 'T') {
      if (btnThemeToggle) btnThemeToggle.click();
    }
  });

  // Telemetry refresh button
  const refreshBtn = document.getElementById('refresh-telemetry-btn');
  if (refreshBtn) refreshBtn.addEventListener('click', () => telemetry.fetchLive());

  // Render initial track list, time machine grid, and initiate live feed
  renderJukeboxTracks('all');
  renderTimeMachineGrid();
  telemetry.fetchLive();
  setInterval(() => {
    if (isLiveStreamActive) telemetry.fetchLive();
  }, 60000);
});
