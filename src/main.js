import './style.css';
import {
  assessRisk,
  CITY_CATALOG,
  SAMPLE_CONDITIONS,
  LEVEL_ORDER
} from './risk-engine.js';

// ── DOM Element Selectors ──────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Theme Elements
const themeToggleBtn = $('#theme-toggle');
const themeIcon = themeToggleBtn.querySelector('.theme-icon');
const themeText = themeToggleBtn.querySelector('.theme-text');

// Backend Execution Elements
const backendToggle = $('#backend-toggle');
const currentEngineLabel = $('#current-engine-label');
const pingSamBtn = $('#ping-sam-btn');
const awsStatusChip = $('#aws-status-chip');

// Input Controls
const citySelect = $('#city');
const tempInput = $('#temperature');
const humInput = $('#humidity');
const rainInput = $('#rainfall');
const windInput = $('#wind');

const tempSlider = $('#temp-slider');
const humSlider = $('#hum-slider');
const rainSlider = $('#rain-slider');
const windSlider = $('#wind-slider');

const checkBtn = $('#check-btn');
const gpsBtn = $('#gps-btn');
const fetchLiveBtn = $('#fetch-live-btn');
const liveWeatherSpinner = $('#live-weather-spinner');
const dataSourceStatus = $('#data-source-status');
const dataSourceText = $('#data-source-text');

// Result Elements
const resultSection = $('#result-section');
const resultBadge = $('#result-badge');
const engineRunBadge = $('#engine-run-badge');
const resultTitle = $('#result-title');
const resultSummaryText = $('#result-summary-text');
const resultCityName = $('#result-city-name');
const resultTimestamp = $('#result-timestamp');

// Gauge Elements
const gaugeArc = $('#gauge-arc');
const gaugeNeedleGroup = $('#gauge-needle-group');
const gaugeScoreNum = $('#gauge-score-num');

// Metrics Breakdown Elements
const heatLevelTag = $('#heat-level-tag');
const heatScore = $('#heat-score');
const heatBar = $('#heat-bar');
const heatNarrative = $('#heat-narrative');

const rainLevelTag = $('#rain-level-tag');
const rainScore = $('#rain-score');
const rainBar = $('#rain-bar');
const rainNarrative = $('#rain-narrative');

const calcExplain = $('#calc-explanation');

// Checklist Elements
const actionCards = $('#action-cards');
const checklistProgressText = $('#checklist-progress-text');
const checklistProgressFill = $('#checklist-progress-fill');
const resetChecklistBtn = $('#reset-checklist-btn');

// Share & Export Elements
const copyAlertBtn = $('#copy-alert-btn');
const exportJsonBtn = $('#export-json-btn');

// History Elements
const historyList = $('#history-list');
const clearHistoryBtn = $('#clear-history');
const exportHistoryCsvBtn = $('#export-history-csv');

// Toast Container
const toastContainer = $('#toast-container');

// ── State Variables ────────────────────────────────────────────────────

const STORAGE_KEY_HISTORY = 'ecotrack_history_v2';
const STORAGE_KEY_THEME = 'ecotrack_theme';
const SAM_ENDPOINT = 'http://127.0.0.1:3000/assess';

let currentAssessment = null;
let completedActionIds = new Set();
let isSamMode = false;

const LEVEL_PALETTES = {
  Low: {
    bg: 'var(--risk-low-bg)',
    fg: 'var(--risk-low-fg)',
    bar: '#10b981',
    needleAngle: -60,
    dashOffset: 188.4,
    emoji: '✅',
    summary: 'Conditions within manageable safety margins. Maintain standard hydration and commute caution.'
  },
  Moderate: {
    bg: 'var(--risk-mod-bg)',
    fg: 'var(--risk-mod-fg)',
    bar: '#f59e0b',
    needleAngle: -15,
    dashOffset: 125.6,
    emoji: '⚠️',
    summary: 'Elevated neighbourhood stress. Begin preventive measures: inspect storm drains and limit peak outdoor exertion.'
  },
  High: {
    bg: 'var(--risk-high-bg)',
    fg: 'var(--risk-high-fg)',
    bar: '#f97316',
    needleAngle: 25,
    dashOffset: 62.8,
    emoji: '🟠',
    summary: 'Significant environmental hazard detected. Restrict non-essential outdoor travel and safeguard low-lying assets.'
  },
  Severe: {
    bg: 'var(--risk-sev-bg)',
    fg: 'var(--risk-sev-fg)',
    bar: '#ef4444',
    needleAngle: 65,
    dashOffset: 0,
    emoji: '🚨',
    summary: 'CRITICAL ENVIRONMENTAL ALERT. Potential heat injury or localized flash flooding. Enact immediate safety protocols.'
  }
};

// ── Theme Manager ──────────────────────────────────────────────────────

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
  applyTheme(initialTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light';
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Toast Notifications ────────────────────────────────────────────────

function showToast(message, icon = 'ℹ️') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3200);
}

// ── Dual Slider ⇄ Input Synchronizer ───────────────────────────────────

function syncInputs(numberEl, sliderEl) {
  numberEl.addEventListener('input', () => {
    sliderEl.value = numberEl.value;
  });
  sliderEl.addEventListener('input', () => {
    numberEl.value = sliderEl.value;
  });
}

syncInputs(tempInput, tempSlider);
syncInputs(humInput, humSlider);
syncInputs(rainInput, rainSlider);
syncInputs(windInput, windSlider);

function setFormValues(t, h, r, w) {
  tempInput.value = t; tempSlider.value = t;
  humInput.value = h; humSlider.value = h;
  rainInput.value = r; rainSlider.value = r;
  windInput.value = w; windSlider.value = w;
}

// ── City & Preset Handling ─────────────────────────────────────────────

citySelect.addEventListener('change', () => {
  const cityId = citySelect.value;
  const defaults = SAMPLE_CONDITIONS[cityId];
  if (defaults) {
    setFormValues(defaults.temperature, defaults.humidity, defaults.rainfall, defaults.wind);
    setDataSourceStatus('idle', `Preset (${citySelect.options[citySelect.selectedIndex].text.split(' ')[0]})`);
  }
});

// Preset buttons
$$('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset;
    switch (preset) {
      case 'severe-heat':
        setFormValues(43, 32, 0, 18);
        citySelect.value = 'delhi';
        showToast('Loaded Severe Heatwave Scenario (43°C)', '☀️');
        break;
      case 'monsoon-flood':
        setFormValues(31, 88, 85, 35);
        citySelect.value = 'mumbai';
        showToast('Loaded Monsoon Cloudburst Scenario (85mm Rain)', '🌧️');
        break;
      case 'cyclone-squall':
        setFormValues(29, 92, 70, 75);
        citySelect.value = 'chennai';
        showToast('Loaded Coastal Squall Scenario (75 km/h Wind)', '🌀');
        break;
      case 'mild-spring':
        setFormValues(27.5, 52, 10, 12);
        citySelect.value = 'bengaluru';
        showToast('Loaded Mild Weather Scenario (Low Risk)', '⛅');
        break;
    }
    setDataSourceStatus('live', 'Scenario Preset');
    triggerRiskCheck();
  });
});

function setDataSourceStatus(type, label) {
  const dot = dataSourceStatus.querySelector('.status-dot');
  if (type === 'live') {
    dot.className = 'status-dot dot-live';
  } else {
    dot.className = 'status-dot dot-idle';
  }
  dataSourceText.textContent = label;
}

// ── Live Weather Fetching (Free Open-Meteo API) ────────────────────────

async function fetchLiveWeatherForCity(cityId) {
  const cityData = CITY_CATALOG.find((c) => c.id === cityId);
  if (!cityData) return;
  await fetchLiveWeatherFromCoords(cityData.lat, cityData.lon, cityData.name);
}

async function fetchLiveWeatherFromCoords(lat, lon, label) {
  try {
    liveWeatherSpinner.textContent = '⏳';
    fetchLiveBtn.disabled = true;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Live weather service unavailable');

    const data = await res.json();
    const current = data.current;

    const t = Math.round(current.temperature_2m * 10) / 10;
    const h = Math.round(current.relative_humidity_2m);
    const r = Math.round(current.precipitation * 10) / 10;
    const w = Math.round(current.wind_speed_10m * 10) / 10;

    setFormValues(t, h, r, w);
    setDataSourceStatus('live', `Live Open-Meteo (${label})`);
    showToast(`Live weather retrieved for ${label}: ${t}°C, ${h}% hum, ${r}mm rain`, '🛰️');

    // Automatically trigger assessment
    triggerRiskCheck();
  } catch (err) {
    showToast('Failed to retrieve live weather. Check internet connection.', '⚠️');
    console.error(err);
  } finally {
    liveWeatherSpinner.textContent = '⚡';
    fetchLiveBtn.disabled = false;
  }
}

fetchLiveBtn.addEventListener('click', () => {
  fetchLiveWeatherForCity(citySelect.value);
});

// GPS Location
gpsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', '⚠️');
    return;
  }

  showToast('Requesting GPS coordinates...', '🎯');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchLiveWeatherFromCoords(latitude, longitude, `GPS (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
    },
    (err) => {
      showToast(`GPS location failed: ${err.message}`, '⚠️');
    },
    { timeout: 10000 }
  );
});

// ── Backend Execution Engine & AWS SAM Integration ─────────────────────

backendToggle.addEventListener('change', () => {
  isSamMode = backendToggle.checked;
  if (isSamMode) {
    currentEngineLabel.textContent = 'AWS SAM Local API (:3000)';
    currentEngineLabel.style.color = '#d97706';
    currentEngineLabel.style.background = 'rgba(255, 153, 0, 0.15)';
    showToast('Switched to AWS SAM Local API mode. Checking local endpoint...', '☁️');
    pingSamApi(false);
  } else {
    currentEngineLabel.textContent = 'Local Client Risk Engine';
    currentEngineLabel.style.color = 'var(--primary)';
    currentEngineLabel.style.background = 'var(--primary-subtle)';
    showToast('Switched to Client Risk Engine.', '💻');
  }
});

async function pingSamApi(showSuccessToast = true) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(SAM_ENDPOINT, {
      method: 'OPTIONS',
      signal: controller.signal
    });
    clearTimeout(timer);

    if (res.ok || res.status === 200 || res.status === 204) {
      awsStatusChip.innerHTML = '<span class="status-dot dot-live"></span> AWS SAM Local API Online (200 OK)';
      awsStatusChip.style.borderColor = '#10b981';
      if (showSuccessToast) showToast('AWS SAM Local API is responding on http://127.0.0.1:3000/assess', '✅');
      return true;
    }
  } catch (e) {
    awsStatusChip.innerHTML = '<span class="status-dot pulse-sam"></span> AWS SAM Local Inactive';
    awsStatusChip.style.borderColor = 'rgba(255, 153, 0, 0.3)';
    if (showSuccessToast) {
      showToast('AWS SAM local server not detected. Start with: `sam local start-api`', '⚠️');
    }
    return false;
  }
  return false;
}

pingSamBtn.addEventListener('click', () => {
  pingSamApi(true);
});

// ── Assessment Engine Controller ───────────────────────────────────────

checkBtn.addEventListener('click', () => {
  triggerRiskCheck();
});

async function triggerRiskCheck() {
  const temperature = parseFloat(tempInput.value);
  const humidity = parseFloat(humInput.value);
  const rainfall = parseFloat(rainInput.value);
  const wind = parseFloat(windInput.value);

  if ([temperature, humidity, rainfall, wind].some(Number.isNaN)) {
    checkBtn.classList.add('shake');
    setTimeout(() => checkBtn.classList.remove('shake'), 400);
    showToast('Please provide valid numbers for all weather parameters.', '⚠️');
    return;
  }

  const selectedCityText = citySelect.options[citySelect.selectedIndex].text;
  let result = null;
  let executionSource = 'Client Risk Engine';
  const startTime = performance.now();

  if (isSamMode) {
    try {
      showToast('Dispatching request to AWS SAM Local endpoint...', '☁️');
      const response = await fetch(SAM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, humidity, rainfall, wind }),
      });

      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      result = await response.json();
      const elapsed = Math.round(performance.now() - startTime);
      executionSource = `AWS SAM Local Lambda (${elapsed}ms)`;
      showToast(`Evaluated via AWS SAM Lambda in ${elapsed}ms`, '⚡');
    } catch (err) {
      console.warn('SAM invoke failed, gracefully falling back to Client Engine:', err);
      result = assessRisk({ temperature, humidity, rainfall, wind });
      executionSource = 'Client Engine (SAM Offline Fallback)';
      showToast('SAM API offline; seamlessly processed via client risk engine.', '🔄');
    }
  } else {
    result = assessRisk({ temperature, humidity, rainfall, wind });
    const elapsed = Math.max(1, Math.round(performance.now() - startTime));
    executionSource = `Client Risk Engine (${elapsed}ms)`;
  }

  currentAssessment = {
    ...result,
    city: selectedCityText,
    executionSource,
    inputs: { temperature, humidity, rainfall, wind }
  };

  completedActionIds.clear();

  renderAssessment(currentAssessment);
  saveToHistory(currentAssessment);
  renderHistory();

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Render Assessment Results ──────────────────────────────────────────

function renderAssessment(data) {
  const palette = LEVEL_PALETTES[data.overall] || LEVEL_PALETTES.Low;

  // Header & Verdict
  resultBadge.textContent = `${palette.emoji} ${data.overall} Readiness`;
  resultBadge.style.background = palette.bg;
  resultBadge.style.color = palette.fg;

  resultTitle.textContent = `${data.overall} Hazard Level · ${data.overallScore}/4 Severity`;
  resultSummaryText.textContent = palette.summary;
  engineRunBadge.textContent = data.executionSource;

  resultCityName.textContent = data.city;
  resultTimestamp.textContent = new Date().toLocaleTimeString();

  // Speedometer Gauge Animation
  gaugeScoreNum.textContent = data.overallScore;
  gaugeNeedleGroup.style.transform = `rotate(${palette.needleAngle}deg)`;
  gaugeArc.style.stroke = palette.bar;
  gaugeArc.style.strokeDashoffset = palette.dashOffset;

  // Heat Breakdown
  const heatPalette = LEVEL_PALETTES[data.heat.level];
  heatLevelTag.textContent = `${heatPalette.emoji} ${data.heat.level}`;
  heatLevelTag.style.background = heatPalette.bg;
  heatLevelTag.style.color = heatPalette.fg;
  heatScore.textContent = data.heat.heatIndex;
  heatBar.style.width = `${(data.heat.score / 4) * 100}%`;
  heatBar.style.backgroundColor = heatPalette.bar;
  heatNarrative.textContent = `At ${data.heat.rawTemp}°C with ${data.heat.rawHumidity}% humidity, human evaporative cooling is impaired. ${data.heat.label}.`;

  // Rain Breakdown
  const rainPalette = LEVEL_PALETTES[data.rain.level];
  rainLevelTag.textContent = `${rainPalette.emoji} ${data.rain.level}`;
  rainLevelTag.style.background = rainPalette.bg;
  rainLevelTag.style.color = rainPalette.fg;
  rainScore.textContent = data.rain.effectiveRainfall;
  rainBar.style.width = `${(data.rain.score / 4) * 100}%`;
  rainBar.style.backgroundColor = rainPalette.bar;
  rainNarrative.textContent = `Expected precipitation of ${data.rain.rawRainfall}mm with ${data.rain.rawWind} km/h wind gusts accelerates runoff accumulation. ${data.rain.label}.`;

  // Transparent Formula Body
  calcExplain.innerHTML = data.explanation
    .map((line) => `<div class="explain-line"><span>📐</span><span>${line}</span></div>`)
    .join('');

  // Actions Checklist
  renderChecklist(data.actions);
}

// ── Action Checklist Manager ───────────────────────────────────────────

function renderChecklist(actions) {
  actionCards.innerHTML = actions
    .map((act) => {
      const isChecked = completedActionIds.has(act.id);
      return `
      <div class="action-card ${isChecked ? 'checked' : ''}" data-action-id="${act.id}">
        <input type="checkbox" class="action-checkbox" ${isChecked ? 'checked' : ''} aria-label="Mark action complete" />
        <span class="action-icon">${act.icon}</span>
        <div class="action-content">
          <div class="action-title-row">
            <span class="action-title">${act.title}</span>
            <span class="action-tag">${act.tag || 'Safety'}</span>
          </div>
          <p class="action-body">${act.body}</p>
        </div>
      </div>`;
    })
    .join('');

  // Bind checkbox events
  actionCards.querySelectorAll('.action-card').forEach((card) => {
    const actionId = card.dataset.actionId;
    const checkbox = card.querySelector('.action-checkbox');

    const toggle = (e) => {
      if (e.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
      }
      if (checkbox.checked) {
        completedActionIds.add(actionId);
        card.classList.add('checked');
      } else {
        completedActionIds.delete(actionId);
        card.classList.remove('checked');
      }
      updateChecklistProgress(actions.length);
    };

    card.addEventListener('click', toggle);
  });

  updateChecklistProgress(actions.length);
}

function updateChecklistProgress(total) {
  const completed = completedActionIds.size;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  checklistProgressText.textContent = `${completed} of ${total} Completed (${pct}%)`;
  checklistProgressFill.style.width = `${pct}%`;
}

resetChecklistBtn.addEventListener('click', () => {
  completedActionIds.clear();
  if (currentAssessment) {
    renderChecklist(currentAssessment.actions);
    showToast('Checklist progress reset.', '🔄');
  }
});

// ── What-If Simulation Sandbox ─────────────────────────────────────────

$$('.sim-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    const simType = btn.dataset.sim;
    let t = parseFloat(tempInput.value) || 30;
    let h = parseFloat(humInput.value) || 50;
    let r = parseFloat(rainInput.value) || 0;
    let w = parseFloat(windInput.value) || 10;

    switch (simType) {
      case 'heat-spike':
        t = Math.min(55, Math.round((t + 4) * 10) / 10);
        showToast('Simulated +4°C heat spike', '🔥');
        break;
      case 'rain-cloudburst':
        r = Math.round((r + 50) * 10) / 10;
        h = Math.min(100, h + 15);
        showToast('Simulated +50mm cloudburst surge', '⛈️');
        break;
      case 'wind-gusts':
        w = Math.min(150, Math.round((w + 35) * 10) / 10);
        showToast('Simulated +35 km/h storm squall', '💨');
        break;
      case 'cool-down':
        t = Math.max(16, Math.round((t - 6) * 10) / 10);
        showToast('Simulated -6°C cooling evening relief', '🍃');
        break;
    }

    setFormValues(t, h, r, w);
    setDataSourceStatus('live', 'Simulation Sandbox');
    triggerRiskCheck();
  });
});

// ── Share & Export Tools ───────────────────────────────────────────────

copyAlertBtn.addEventListener('click', async () => {
  if (!currentAssessment) return;
  const a = currentAssessment;
  const actionsList = a.actions.map((act) => `• ${act.icon} ${act.title}: ${act.body}`).join('\n');

  const alertText =
`🚨 ECOTRACK AI — NEIGHBOURHOOD READINESS ALERT
📍 Municipality: ${a.city}
⚠️ Readiness Status: ${a.overall.toUpperCase()} RISK (${a.overallScore}/4)
🌡️ Thermal Stress (Heat Index): ${a.heat.heatIndex}°C
🌧️ Precipitation Runoff: ${a.rain.effectiveRainfall}mm (Wind: ${a.inputs.wind} km/h)

🛡️ RECOMMENDED NEIGHBOURHOOD ACTIONS:
${actionsList}

⚠️ Decision-support advisory only. Follow instructions from local SDMA/IMD.
Built for Environmental Hacks 2026.`;

  try {
    await navigator.clipboard.writeText(alertText);
    showToast('Alert text copied to clipboard! Ready to share on WhatsApp.', '📋');
  } catch (e) {
    showToast('Failed to copy. Please manually copy the results.', '⚠️');
  }
});

exportJsonBtn.addEventListener('click', () => {
  if (!currentAssessment) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAssessment, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `EcoTrack-${currentAssessment.overall}-${Date.now()}.json`);
  dlAnchor.click();
  showToast('Assessment report exported as JSON.', '📥');
});

// ── History Management ─────────────────────────────────────────────────

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(assessment) {
  const history = getHistory();
  history.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    city: assessment.city,
    overall: assessment.overall,
    overallScore: assessment.overallScore,
    inputs: assessment.inputs,
    heatIndex: assessment.heat.heatIndex,
    effectiveRainfall: assessment.rain.effectiveRainfall
  });
  if (history.length > 5) history.length = 5;
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyList.innerHTML = '<p class="history-empty">No checks recorded yet. Fill conditions above and click "Analyze Neighbourhood Risk".</p>';
    return;
  }

  historyList.innerHTML = history
    .map((h) => {
      const p = LEVEL_PALETTES[h.overall] || LEVEL_PALETTES.Low;
      const timeStr = new Date(h.timestamp).toLocaleString();
      return `
      <div class="history-item">
        <div class="history-item-left">
          <div class="history-badge" style="background:${p.bg};color:${p.fg}">
            ${p.emoji} ${h.overall}
          </div>
          <div class="history-details">
            <strong>${h.city}</strong> — ${h.inputs.temperature}°C, ${h.inputs.humidity}%, ${h.inputs.rainfall}mm, ${h.inputs.wind}km/h
            <span class="history-time">${timeStr}</span>
          </div>
        </div>
        <button class="history-reload-btn" data-hist-id="${h.id}">Reload</button>
      </div>`;
    })
    .join('');

  historyList.querySelectorAll('.history-reload-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const histId = Number(btn.dataset.histId);
      const item = history.find((x) => x.id === histId);
      if (item) {
        setFormValues(item.inputs.temperature, item.inputs.humidity, item.inputs.rainfall, item.inputs.wind);
        showToast(`Reloaded check for ${item.city}`, '🔄');
        triggerRiskCheck();
      }
    });
  });
}

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY_HISTORY);
  renderHistory();
  showToast('Assessment history cleared.', '🗑️');
});

exportHistoryCsvBtn.addEventListener('click', () => {
  const history = getHistory();
  if (history.length === 0) {
    showToast('No history available to export.', 'ℹ️');
    return;
  }
  const headers = ['Timestamp', 'City', 'Overall Risk', 'Score', 'Temp (C)', 'Humidity (%)', 'Rainfall (mm)', 'Wind (km/h)', 'Heat Index (C)', 'Effective Rain (mm)'];
  const rows = history.map((h) => [
    `"${h.timestamp}"`,
    `"${h.city}"`,
    `"${h.overall}"`,
    h.overallScore,
    h.inputs.temperature,
    h.inputs.humidity,
    h.inputs.rainfall,
    h.inputs.wind,
    h.heatIndex,
    h.effectiveRainfall
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', encodeURI(csvContent));
  dlAnchor.setAttribute('download', `ecotrack-history-${Date.now()}.csv`);
  dlAnchor.click();
  showToast('Exported history as CSV file.', '📊');
});

// ── Application Initialization ─────────────────────────────────────────

initTheme();
renderHistory();

// Set initial defaults from selected city
const initialCity = citySelect.value;
if (SAMPLE_CONDITIONS[initialCity]) {
  const d = SAMPLE_CONDITIONS[initialCity];
  setFormValues(d.temperature, d.humidity, d.rainfall, d.wind);
}

// Check initial SAM connection quietly
pingSamApi(false);
