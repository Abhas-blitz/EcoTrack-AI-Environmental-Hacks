import './style.css';
import {
  assessRisk,
  CITY_CATALOG,
  SAMPLE_CONDITIONS,
  GO_BAG_ITEMS,
  LEVEL_ORDER
} from './risk-engine.js';

// ── DOM Element Selectors ──────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Navigation & Pages
const navItems = $$('.sidebar-nav .nav-item');
const pageViews = $$('.page-view');
const currentPageTitle = $('#current-page-title');
const navOverallBadge = $('#nav-overall-badge');
const navActionsCount = $('#nav-actions-count');
const navHistoryCount = $('#nav-history-count');
const sidebarSamDot = $('#sidebar-sam-dot');
const jumpToProtocolsBtn = $('#jump-to-protocols-btn');

// Theme & Backend Toggle
const themeToggleBtn = $('#theme-toggle');
const themeIcon = themeToggleBtn.querySelector('.theme-icon');
const themeText = themeToggleBtn.querySelector('.theme-text');
const backendToggle = $('#backend-toggle');
const sidebarEnginePill = $('#sidebar-engine-pill');
const topAwsIndicator = $('#top-aws-indicator');
const awsStatusDot = $('#aws-status-dot');
const awsStatusLabel = $('#aws-status-label');

// Top Command Bar
const headerCityName = $('#header-city-name');
const gpsBtn = $('#gps-btn');
const fetchLiveBtn = $('#fetch-live-btn');
const liveWeatherSpinner = $('#live-weather-spinner');
const globalAnalyzeBtn = $('#global-analyze-btn');

// Inputs & Presets
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
const dataSourceText = $('#data-source-text');
const sourceDot = $('#source-dot');

// Telemetry Strip
const teleHeatVal = $('#tele-heat-val');
const teleHeatStatus = $('#tele-heat-status');
const teleRainVal = $('#tele-rain-val');
const teleRainStatus = $('#tele-rain-status');
const teleWetbulbVal = $('#tele-wetbulb-val');
const teleWetbulbStatus = $('#tele-wetbulb-status');
const teleOverallScore = $('#tele-overall-score');
const teleOverallLabel = $('#tele-overall-label');

// Cockpit Verdict & Gauge
const gaugeArc = $('#gauge-arc');
const gaugeNeedleGroup = $('#gauge-needle-group');
const gaugeScoreNum = $('#gauge-score-num');
const resultBadge = $('#result-badge');
const engineRunBadge = $('#engine-run-badge');
const resultTitle = $('#result-title');
const resultSummaryText = $('#result-summary-text');
const resultCityName = $('#result-city-name');
const resultTimestamp = $('#result-timestamp');

// Hazard Diagnostic Cards
const heatLevelTag = $('#heat-level-tag');
const heatScore = $('#heat-score');
const heatBar = $('#heat-bar');
const heatNarrative = $('#heat-narrative');

const rainLevelTag = $('#rain-level-tag');
const rainScore = $('#rain-score');
const rainBar = $('#rain-bar');
const rainNarrative = $('#rain-narrative');

const cockpitActionsPreview = $('#cockpit-actions-preview');

// Protocols Page
const checklistProgressText = $('#checklist-progress-text');
const checklistProgressFill = $('#checklist-progress-fill');
const resetChecklistBtn = $('#reset-checklist-btn');
const actionCardsGrid = $('#action-cards');
const copyAlertBtn = $('#copy-alert-btn');
const exportJsonBtn = $('#export-json-btn');
const gobagList = $('#gobag-list');
const gobagCountText = $('#gobag-count-text');
const resetGobagBtn = $('#reset-gobag-btn');
const filterPills = $$('.filter-pill');

// Meteorology Lab Page
const labWbVal = $('#lab-wb-val');
const labWbStatus = $('#lab-wb-status');
const labWbNote = $('#lab-wb-note');
const calcExplain = $('#calc-explanation');

// Emergency Page
const btnCopyNums = $$('.btn-copy-num');

// History Page
const kpiTotalScans = $('#kpi-total-scans');
const kpiPeakHeat = $('#kpi-peak-heat');
const kpiMaxRain = $('#kpi-max-rain');
const kpiDominantRisk = $('#kpi-dominant-risk');
const historyTableBody = $('#history-table-body');
const clearHistoryBtn = $('#clear-history');
const exportHistoryCsvBtn = $('#export-history-csv');

// AWS SAM Console Page
const testSamEndpointBtn = $('#test-sam-endpoint-btn');
const samLatencyPill = $('#sam-latency-pill');
const samReqPreview = $('#sam-req-preview');
const samResPreview = $('#sam-res-preview');
const btnCopyCmds = $$('.btn-copy-cmd');

// Toast Container
const toastContainer = $('#toast-container');

// Local EcoTrack AI Assistant
const aiAssistantForm = $('#ai-assistant-form');
const aiQuestionInput = $('#ai-question');
const aiChatLog = $('#ai-chat-log');
const aiSendBtn = $('#ai-send-btn');
const aiAssistantStatus = $('#ai-assistant-status');

// ── State Variables ────────────────────────────────────────────────────

const STORAGE_KEY_HISTORY = 'ecotrack_history_v3';
const STORAGE_KEY_THEME = 'ecotrack_theme';
const STORAGE_KEY_GOBAG = 'ecotrack_gobag';
const SAM_ENDPOINT = 'http://127.0.0.1:3000/assess';
const AI_ASSISTANT_ENDPOINT = 'http://127.0.0.1:8000/ask';

let currentAssessment = null;
let completedActionIds = new Set();
let packedGoBagIds = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY_GOBAG) || '[]'));
let activeCategoryFilter = 'all';
let isSamMode = false;

const PAGE_TITLES = {
  'page-overview': 'Cockpit & Overview',
  'page-protocols': 'Safety Protocols & Action Hub',
  'page-meteorology': 'Meteorology Lab & "What-If" Sandbox',
  'page-emergency': 'Emergency Helplines & First-Aid',
  'page-history': 'History & Analytics Logs',
  'page-aws': 'AWS SAM Serverless Console'
};

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

// ── Multi-Page Navigation System ───────────────────────────────────────

function switchPage(pageId) {
  navItems.forEach((item) => {
    item.classList.toggle('active', item.dataset.page === pageId);
  });

  pageViews.forEach((view) => {
    view.classList.toggle('active', view.id === pageId);
  });

  currentPageTitle.textContent = PAGE_TITLES[pageId] || 'Command Center';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach((btn) => {
  btn.addEventListener('click', () => switchPage(btn.dataset.page));
});

if (jumpToProtocolsBtn) {
  jumpToProtocolsBtn.addEventListener('click', () => switchPage('page-protocols'));
}

// ── Theme Manager ──────────────────────────────────────────────────────

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_KEY_THEME, theme);
  if (theme === 'dark') {
    themeIcon.textContent = '☀️';
    themeText.textContent = 'Light Mode';
  } else {
    themeIcon.textContent = '🌙';
    themeText.textContent = 'Dark Mode';
  }
}

themeToggleBtn.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

// ── Floating Toast Manager ─────────────────────────────────────────────

function showToast(message, icon = 'ℹ️') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ── Local Strands / Ollama Assistant ───────────────────────────────────

function appendAssistantMessage(role, text) {
  const message = document.createElement('article');
  message.className = `ai-message ai-message-${role}`;

  const label = document.createElement('span');
  label.className = 'ai-message-label';
  label.textContent = role === 'user' ? 'You' : 'EcoTrack AI';

  const body = document.createElement('p');
  body.textContent = text;

  message.append(label, body);
  aiChatLog.appendChild(message);
  aiChatLog.scrollTop = aiChatLog.scrollHeight;
  return message;
}

function setAssistantBusy(isBusy) {
  aiQuestionInput.disabled = isBusy;
  aiSendBtn.disabled = isBusy;
  aiSendBtn.textContent = isBusy ? 'Thinking locally…' : 'Ask local AI';
  aiAssistantStatus.textContent = isBusy ? '● Ollama is thinking' : '● Local assistant';
  aiAssistantStatus.classList.toggle('is-busy', isBusy);
}

function getAssistantContext() {
  const city = citySelect.options[citySelect.selectedIndex]?.text.split('(')[0].trim() || 'the selected city';
  const conditions = `City: ${city}. Temperature: ${tempInput.value}°C; humidity: ${humInput.value}%; rainfall: ${rainInput.value}mm/24h; wind: ${windInput.value} km/h.`;
  const assessment = currentAssessment
    ? ` Current risk assessment: ${currentAssessment.overall} (${currentAssessment.overallScore}/4).`
    : '';
  return `${conditions}${assessment}`;
}

if (aiAssistantForm) {
  aiAssistantForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const question = aiQuestionInput.value.trim();
    if (!question) return;

    appendAssistantMessage('user', question);
    aiQuestionInput.value = '';
    setAssistantBusy(true);

    try {
      const response = await fetch(AI_ASSISTANT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: `${question}\n\nDashboard context (use only when relevant): ${getAssistantContext()}` }),
      });

      if (!response.ok) {
        throw new Error(`Local assistant returned HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (!payload.answer || typeof payload.answer !== 'string') {
        throw new Error('Local assistant returned no answer');
      }

      appendAssistantMessage('assistant', payload.answer);
    } catch (error) {
      console.error('Local assistant request failed:', error);
      appendAssistantMessage('assistant', 'I could not reach the local assistant. Start Ollama, then run `python -m uvicorn backend:app --reload --port 8000` and try again.');
      showToast('Local AI assistant is unavailable.', '⚠️');
    } finally {
      setAssistantBusy(false);
      aiQuestionInput.focus();
    }
  });
}

// ── Dual Slider ⇄ Input Synchronizer ───────────────────────────────────

function syncInputs(numberEl, sliderEl) {
  numberEl.addEventListener('input', () => { sliderEl.value = numberEl.value; });
  sliderEl.addEventListener('input', () => { numberEl.value = sliderEl.value; });
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

// ── City & Scenario Presets ────────────────────────────────────────────

citySelect.addEventListener('change', () => {
  const cityId = citySelect.value;
  const defaults = SAMPLE_CONDITIONS[cityId];
  const cityObj = CITY_CATALOG.find((c) => c.id === cityId);
  if (cityObj) headerCityName.textContent = cityObj.name;

  if (defaults) {
    setFormValues(defaults.temperature, defaults.humidity, defaults.rainfall, defaults.wind);
    setDataSourceStatus('idle', `Preset (${cityObj ? cityObj.name : cityId})`);
  }
});

$$('.preset-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.preset;
    switch (preset) {
      case 'severe-heat':
        setFormValues(43, 32, 0, 18);
        citySelect.value = 'delhi';
        headerCityName.textContent = 'Delhi NCR';
        showToast('Loaded Severe Heatwave Scenario (43°C)', '☀️');
        break;
      case 'monsoon-flood':
        setFormValues(31, 88, 85, 35);
        citySelect.value = 'mumbai';
        headerCityName.textContent = 'Mumbai';
        showToast('Loaded Monsoon Cloudburst Scenario (85mm Rain)', '🌧️');
        break;
      case 'cyclone-squall':
        setFormValues(29, 92, 70, 75);
        citySelect.value = 'chennai';
        headerCityName.textContent = 'Chennai';
        showToast('Loaded Coastal Squall Scenario (75 km/h Wind)', '🌀');
        break;
      case 'mild-spring':
        setFormValues(27.5, 52, 10, 12);
        citySelect.value = 'bengaluru';
        headerCityName.textContent = 'Bengaluru';
        showToast('Loaded Mild Weather Scenario (Low Risk)', '⛅');
        break;
    }
    setDataSourceStatus('live', 'Scenario Preset');
    triggerRiskCheck();
  });
});

function setDataSourceStatus(type, label) {
  if (type === 'live') {
    sourceDot.className = 'status-dot dot-live';
  } else {
    sourceDot.className = 'status-dot dot-idle';
  }
  dataSourceText.textContent = label;
}

// ── Live Weather Fetching (Open-Meteo API) ─────────────────────────────

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
    headerCityName.textContent = label;
    showToast(`Live weather loaded for ${label}: ${t}°C, ${h}% hum, ${r}mm rain`, '🛰️');

    triggerRiskCheck();
  } catch (err) {
    showToast('Failed to retrieve live weather. Check internet connection.', '⚠️');
    console.error(err);
  } finally {
    liveWeatherSpinner.textContent = '⚡';
    fetchLiveBtn.disabled = false;
  }
}

fetchLiveBtn.addEventListener('click', () => fetchLiveWeatherForCity(citySelect.value));

gpsBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', '⚠️');
    return;
  }
  showToast('Acquiring GPS coordinates...', '🎯');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      fetchLiveWeatherFromCoords(latitude, longitude, `GPS (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`);
    },
    (err) => showToast(`GPS location failed: ${err.message}`, '⚠️'),
    { timeout: 10000 }
  );
});

// ── Backend Execution Engine & AWS SAM Integration ─────────────────────

backendToggle.addEventListener('change', () => {
  isSamMode = backendToggle.checked;
  if (isSamMode) {
    sidebarEnginePill.textContent = 'SAM :3000';
    sidebarEnginePill.style.color = '#d97706';
    sidebarEnginePill.style.background = 'rgba(255, 153, 0, 0.15)';
    showToast('Switched to AWS SAM Local API mode (:3000)', '☁️');
    pingSamApi(false);
  } else {
    sidebarEnginePill.textContent = 'Client';
    sidebarEnginePill.style.color = 'var(--primary)';
    sidebarEnginePill.style.background = 'var(--primary-subtle)';
    showToast('Switched to Client Risk Engine.', '💻');
  }
});

async function pingSamApi(showSuccessToast = true) {
  const startTime = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(SAM_ENDPOINT, {
      method: 'OPTIONS',
      signal: controller.signal
    });
    clearTimeout(timer);

    const latency = Math.round(performance.now() - startTime);

    if (res.ok || res.status === 200 || res.status === 204) {
      awsStatusDot.className = 'status-dot dot-live';
      awsStatusLabel.textContent = `SAM Ready (${latency}ms)`;
      sidebarSamDot.className = 'nav-status-dot dot-live';
      samLatencyPill.textContent = `Latency: ${latency} ms (200 OK)`;

      if (showSuccessToast) showToast(`AWS SAM Local API is responding on :3000 (${latency}ms)`, '✅');
      return true;
    }
  } catch (e) {
    awsStatusDot.className = 'status-dot pulse-sam';
    awsStatusLabel.textContent = 'SAM Inactive';
    sidebarSamDot.className = 'nav-status-dot pulse-sam';
    samLatencyPill.textContent = 'Status: Disconnected (:3000 offline)';
    if (showSuccessToast) {
      showToast('AWS SAM local server not detected. Start with: `sam local start-api`', '⚠️');
    }
    return false;
  }
  return false;
}

if (testSamEndpointBtn) {
  testSamEndpointBtn.addEventListener('click', async () => {
    const isOnline = await pingSamApi(true);
    if (isOnline) {
      const payload = {
        temperature: parseFloat(tempInput.value) || 38,
        humidity: parseFloat(humInput.value) || 70,
        rainfall: parseFloat(rainInput.value) || 45,
        wind: parseFloat(windInput.value) || 28
      };
      samReqPreview.textContent = JSON.stringify(payload, null, 2);
      try {
        const res = await fetch(SAM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        samResPreview.textContent = JSON.stringify(json, null, 2);
      } catch (err) {
        samResPreview.textContent = `// Error: ${err.message}`;
      }
    }
  });
}

// ── Assessment Execution Controller ────────────────────────────────────

if (checkBtn) checkBtn.addEventListener('click', triggerRiskCheck);
if (globalAnalyzeBtn) globalAnalyzeBtn.addEventListener('click', triggerRiskCheck);

async function triggerRiskCheck() {
  const temperature = parseFloat(tempInput.value);
  const humidity = parseFloat(humInput.value);
  const rainfall = parseFloat(rainInput.value);
  const wind = parseFloat(windInput.value);

  if ([temperature, humidity, rainfall, wind].some(Number.isNaN)) {
    showToast('Please enter valid numeric values for all parameters.', '⚠️');
    return;
  }

  const selectedCityText = citySelect.options[citySelect.selectedIndex].text.split('(')[0].trim();
  let result = null;
  let executionSource = 'Client Risk Engine';
  const startTime = performance.now();

  if (isSamMode) {
    try {
      showToast('Querying AWS SAM Local Lambda (:3000)...', '☁️');
      const response = await fetch(SAM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature, humidity, rainfall, wind }),
      });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      result = await response.json();
      const elapsed = Math.round(performance.now() - startTime);
      executionSource = `AWS SAM Local Lambda (${elapsed}ms)`;
      showToast(`Computed via AWS SAM Lambda in ${elapsed}ms`, '⚡');
    } catch (err) {
      console.warn('SAM invoke failed, falling back to client:', err);
      result = assessRisk({ temperature, humidity, rainfall, wind });
      executionSource = 'Client Engine (SAM Offline)';
      showToast('SAM API unreachable; rendered via Client Risk Engine.', '🔄');
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
}

// ── Render Assessment Results to Cockpit & All Pages ───────────────────

function renderAssessment(data) {
  const palette = LEVEL_PALETTES[data.overall] || LEVEL_PALETTES.Low;

  // 1. Telemetry Strip Updates
  teleHeatVal.textContent = data.heat.heatIndex;
  teleHeatStatus.textContent = `${data.heat.level} Heat Stress`;
  teleRainVal.textContent = data.rain.effectiveRainfall;
  teleRainStatus.textContent = `${data.rain.level} Runoff Inflow`;
  teleWetbulbVal.textContent = data.heat.wetBulb;
  teleWetbulbStatus.textContent = data.heat.wetBulbStatus;
  teleOverallScore.textContent = data.overallScore;
  teleOverallLabel.textContent = `${data.overall} Hazard`;

  // 2. Sidebar Badges
  navOverallBadge.textContent = data.overall;
  navOverallBadge.className = `nav-badge badge-${data.overall.toLowerCase().slice(0, 3)}`;
  navActionsCount.textContent = data.actions.length;

  // 3. Verdict & Gauge Animation
  resultBadge.textContent = `${palette.emoji} ${data.overall} Readiness`;
  resultBadge.className = `risk-badge badge-${data.overall.toLowerCase().slice(0, 3)}`;
  resultTitle.textContent = `${data.overall} Environmental Hazard (Score ${data.overallScore}/4)`;
  resultSummaryText.textContent = palette.summary;
  engineRunBadge.textContent = data.executionSource;
  resultCityName.textContent = data.city;
  resultTimestamp.textContent = new Date().toLocaleTimeString();

  gaugeScoreNum.textContent = data.overallScore;
  gaugeNeedleGroup.style.transform = `rotate(${palette.needleAngle}deg)`;
  gaugeArc.style.stroke = palette.bar;
  gaugeArc.style.strokeDashoffset = palette.dashOffset;

  // 4. Hazard Diagnostic Cards
  heatLevelTag.textContent = data.heat.level;
  heatLevelTag.className = `hazard-badge badge-${data.heat.level.toLowerCase().slice(0, 3)}`;
  heatScore.textContent = data.heat.heatIndex;
  heatBar.style.width = `${(data.heat.score / 4) * 100}%`;
  heatBar.style.backgroundColor = LEVEL_PALETTES[data.heat.level].bar;
  heatNarrative.textContent = `At ${data.heat.rawTemp}°C with ${data.heat.rawHumidity}% humidity, feels like ${data.heat.heatIndex}°C. ${data.heat.label}.`;

  rainLevelTag.textContent = data.rain.level;
  rainLevelTag.className = `hazard-badge badge-${data.rain.level.toLowerCase().slice(0, 3)}`;
  rainScore.textContent = data.rain.effectiveRainfall;
  rainBar.style.width = `${(data.rain.score / 4) * 100}%`;
  rainBar.style.backgroundColor = LEVEL_PALETTES[data.rain.level].bar;
  rainNarrative.textContent = `Rainfall ${data.rain.rawRainfall}mm adjusted for ${data.rain.rawWind} km/h wind gusts gives effective runoff of ${data.rain.effectiveRainfall}mm. ${data.rain.label}.`;

  // 5. Cockpit Action Highlights Strip
  if (cockpitActionsPreview) {
    cockpitActionsPreview.innerHTML = data.actions
      .slice(0, 3)
      .map((a) => `
        <div class="cockpit-action-item">
          <span>${a.icon}</span>
          <div>
            <strong>${a.title}</strong>
            <span class="qa-sub"> — ${a.body.slice(0, 75)}...</span>
          </div>
        </div>
      `)
      .join('');
  }

  // 6. Meteorology Lab Details
  labWbVal.textContent = data.heat.wetBulb;
  labWbStatus.textContent = data.heat.wetBulbStatus;
  labWbNote.textContent = data.heat.wetBulbNote;
  calcExplain.innerHTML = data.explanation
    .map((line) => `<div class="explain-line"><span>📐</span><span>${line}</span></div>`)
    .join('');

  // 7. Protocols Page Checklist
  renderChecklist(data.actions);
}

// ── Protocols Page & Go-Bag Manager ────────────────────────────────────

function renderChecklist(actions) {
  const filtered = activeCategoryFilter === 'all'
    ? actions
    : actions.filter((a) => a.category === activeCategoryFilter);

  actionCardsGrid.innerHTML = filtered
    .map((act) => {
      const isChecked = completedActionIds.has(act.id);
      return `
      <div class="action-card ${isChecked ? 'checked' : ''}" data-action-id="${act.id}">
        <input type="checkbox" class="action-checkbox" ${isChecked ? 'checked' : ''} aria-label="Mark action complete" />
        <span class="action-icon">${act.icon}</span>
        <div class="action-content">
          <div class="action-title-row">
            <span class="action-title">${act.title}</span>
            <span class="action-tag ${act.priority === 'Critical' ? 'action-priority-crit' : act.priority === 'High' ? 'action-priority-high' : ''}">${act.tag || act.category}</span>
          </div>
          <p class="action-body">${act.body}</p>
        </div>
      </div>`;
    })
    .join('');

  actionCardsGrid.querySelectorAll('.action-card').forEach((card) => {
    const actionId = card.dataset.actionId;
    const checkbox = card.querySelector('.action-checkbox');

    const toggle = (e) => {
      if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
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
  checklistProgressText.textContent = `${completed} of ${total} Actions Verified (${pct}%)`;
  checklistProgressFill.style.width = `${pct}%`;
}

filterPills.forEach((pill) => {
  pill.addEventListener('click', () => {
    filterPills.forEach((p) => p.classList.remove('active'));
    pill.classList.add('active');
    activeCategoryFilter = pill.dataset.category;
    if (currentAssessment) renderChecklist(currentAssessment.actions);
  });
});

resetChecklistBtn.addEventListener('click', () => {
  completedActionIds.clear();
  if (currentAssessment) {
    renderChecklist(currentAssessment.actions);
    showToast('Checklist reset.', '🔄');
  }
});

// Go-Bag Manager
function renderGoBag() {
  gobagList.innerHTML = GO_BAG_ITEMS
    .map((item) => {
      const isPacked = packedGoBagIds.has(item.id);
      return `
      <div class="gobag-item ${isPacked ? 'checked' : ''}" data-bag-id="${item.id}">
        <input type="checkbox" class="action-checkbox" ${isPacked ? 'checked' : ''} aria-label="Mark packed" />
        <span>${item.icon}</span>
        <div style="flex:1;">
          <strong>${item.title}</strong>
        </div>
      </div>`;
    })
    .join('');

  gobagList.querySelectorAll('.gobag-item').forEach((row) => {
    const bagId = row.dataset.bagId;
    const checkbox = row.querySelector('.action-checkbox');

    row.addEventListener('click', (e) => {
      if (e.target !== checkbox) checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        packedGoBagIds.add(bagId);
        row.classList.add('checked');
      } else {
        packedGoBagIds.delete(bagId);
        row.classList.remove('checked');
      }
      localStorage.setItem(STORAGE_KEY_GOBAG, JSON.stringify([...packedGoBagIds]));
      updateGoBagProgress();
    });
  });

  updateGoBagProgress();
}

function updateGoBagProgress() {
  gobagCountText.textContent = `${packedGoBagIds.size} of ${GO_BAG_ITEMS.length} items packed`;
}

resetGobagBtn.addEventListener('click', () => {
  packedGoBagIds.clear();
  localStorage.removeItem(STORAGE_KEY_GOBAG);
  renderGoBag();
  showToast('Go-Bag checklist reset.', '🔄');
});

// ── What-If Simulation Sandbox ─────────────────────────────────────────

$$('.sim-action-btn').forEach((btn) => {
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

// ── Share & Export Utilities ───────────────────────────────────────────

copyAlertBtn.addEventListener('click', async () => {
  if (!currentAssessment) return;
  const a = currentAssessment;
  const actionsList = a.actions.map((act) => `• ${act.icon} [${act.category}] ${act.title}: ${act.body}`).join('\n');

  const alertText =
`🚨 ECOTRACK AI — NEIGHBOURHOOD READINESS BULLETIN
📍 Location: ${a.city}
⚠️ Status: ${a.overall.toUpperCase()} HAZARD (${a.overallScore}/4 Severity)
🌡️ Thermal Load (Heat Index): ${a.heat.heatIndex}°C (Wet-Bulb: ${a.heat.wetBulb}°C)
🌧️ Effective Runoff: ${a.rain.effectiveRainfall}mm (Wind Shear: ${a.inputs.wind} km/h)

🛡️ IMMEDIATE SAFETY ACTIONS:
${actionsList}

⚠️ Decision-support advisory only. Follow official IMD and local SDMA instructions.
Built for Environmental Hacks 2026.`;

  try {
    await navigator.clipboard.writeText(alertText);
    showToast('Alert bulletin copied! Ready to share on WhatsApp.', '📋');
  } catch (e) {
    showToast('Copy failed. Please manually copy the results.', '⚠️');
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

// Emergency Number Copy Buttons
btnCopyNums.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const num = btn.dataset.num;
    await navigator.clipboard.writeText(num);
    showToast(`Copied emergency helpline: ${num}`, '📞');
  });
});

// Terminal Command Copy
btnCopyCmds.forEach((btn) => {
  btn.addEventListener('click', async () => {
    const cmd = btn.dataset.cmd;
    await navigator.clipboard.writeText(cmd);
    showToast(`Command copied: ${cmd}`, '💻');
  });
});

// ── History & Analytics Manager ────────────────────────────────────────

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
  if (history.length > 25) history.length = 25;
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  navHistoryCount.textContent = history.length;
  kpiTotalScans.textContent = history.length;

  if (history.length === 0) {
    kpiPeakHeat.textContent = '0.0';
    kpiMaxRain.textContent = '0.0';
    kpiDominantRisk.textContent = 'None';
    historyTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">No assessments recorded yet. Run a risk assessment in Cockpit.</td></tr>`;
    return;
  }

  // Calculate KPIs
  let peakHeat = 0;
  let maxRain = 0;
  const riskCounts = { Low: 0, Moderate: 0, High: 0, Severe: 0 };

  history.forEach((h) => {
    if (h.heatIndex > peakHeat) peakHeat = h.heatIndex;
    if (h.effectiveRainfall > maxRain) maxRain = h.effectiveRainfall;
    if (riskCounts[h.overall] !== undefined) riskCounts[h.overall]++;
  });

  kpiPeakHeat.textContent = peakHeat.toFixed(1);
  kpiMaxRain.textContent = maxRain.toFixed(1);

  const dominant = Object.keys(riskCounts).reduce((a, b) => riskCounts[a] >= riskCounts[b] ? a : b);
  kpiDominantRisk.textContent = dominant;

  // Render Table Rows
  historyTableBody.innerHTML = history
    .map((h) => {
      const dateStr = new Date(h.timestamp).toLocaleString();
      return `
      <tr>
        <td><strong>${dateStr}</strong></td>
        <td>${h.city}</td>
        <td><span class="risk-badge badge-${h.overall.toLowerCase().slice(0, 3)}">${h.overall} (${h.overallScore}/4)</span></td>
        <td>${h.inputs.temperature}°C / ${h.inputs.humidity}%</td>
        <td>${h.inputs.rainfall}mm / ${h.inputs.wind} km/h</td>
        <td><strong>${h.heatIndex}°C</strong></td>
        <td><strong>${h.effectiveRainfall}mm</strong></td>
        <td>
          <button class="btn-mini-replay" data-hist-id="${h.id}">Replay</button>
        </td>
      </tr>`;
    })
    .join('');

  historyTableBody.querySelectorAll('.btn-mini-replay').forEach((btn) => {
    btn.addEventListener('click', () => {
      const histId = Number(btn.dataset.histId);
      const item = history.find((x) => x.id === histId);
      if (item) {
        setFormValues(item.inputs.temperature, item.inputs.humidity, item.inputs.rainfall, item.inputs.wind);
        showToast(`Reloaded assessment for ${item.city}`, '🔄');
        switchPage('page-overview');
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
renderGoBag();
renderHistory();

// Set default values from selected city
const initialCity = citySelect.value;
if (SAMPLE_CONDITIONS[initialCity]) {
  const d = SAMPLE_CONDITIONS[initialCity];
  setFormValues(d.temperature, d.humidity, d.rainfall, d.wind);
}

// Initial calculation on load
triggerRiskCheck();

// Ping SAM in background
pingSamApi(false);
