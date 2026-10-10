import './style.css';
import { assessRisk, SAMPLE_CONDITIONS } from './risk-engine.js';

// ── DOM references ─────────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);

const citySelect   = $('#city');
const tempInput    = $('#temperature');
const humInput     = $('#humidity');
const rainInput    = $('#rainfall');
const windInput    = $('#wind');
const checkBtn     = $('#check-btn');
const loadSample   = $('#load-sample');
const resultSection = $('#result-section');
const resultBadge  = $('#result-badge');
const resultTitle  = $('#result-title');
const heatScore    = $('#heat-score');
const rainScore    = $('#rain-score');
const heatBar      = $('#heat-bar');
const rainBar      = $('#rain-bar');
const calcExplain  = $('#calc-explanation');
const actionCards  = $('#action-cards');
const historyList  = $('#history-list');
const clearHistory = $('#clear-history');

// ── Constants ──────────────────────────────────────────────────────────

const STORAGE_KEY  = 'ecotrack_history';
const MAX_HISTORY  = 5;

const LEVEL_COLORS = {
  Low:      { bg: '#d1fae5', fg: '#065f46', bar: '#34d399' },
  Moderate: { bg: '#fef3c7', fg: '#92400e', bar: '#fbbf24' },
  High:     { bg: '#fee2e2', fg: '#991b1b', bar: '#f87171' },
  Severe:   { bg: '#fce4ec', fg: '#880e4f', bar: '#e91e63' },
};

const LEVEL_EMOJI = { Low: '✅', Moderate: '⚠️', High: '🔴', Severe: '🆘' };

// ── Load sample data ───────────────────────────────────────────────────

loadSample.addEventListener('click', () => {
  const city = citySelect.value;
  const data = SAMPLE_CONDITIONS[city];
  if (!data) return;
  tempInput.value = data.temperature;
  humInput.value  = data.humidity;
  rainInput.value = data.rainfall;
  windInput.value = data.wind;
  animateBtn(loadSample, 'Loaded ✓');
});

// ── Check risk ─────────────────────────────────────────────────────────

checkBtn.addEventListener('click', () => {
  const temperature = parseFloat(tempInput.value);
  const humidity    = parseFloat(humInput.value);
  const rainfall    = parseFloat(rainInput.value);
  const wind        = parseFloat(windInput.value);

  // Validation
  if ([temperature, humidity, rainfall, wind].some(Number.isNaN)) {
    shakeElement(checkBtn);
    return;
  }

  const city = citySelect.options[citySelect.selectedIndex].text;
  const result = assessRisk({ temperature, humidity, rainfall, wind });

  renderResult(result);
  saveToHistory({ city, temperature, humidity, rainfall, wind, result });
  renderHistory();

  resultSection.classList.remove('hidden');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// ── Render result ──────────────────────────────────────────────────────

function renderResult(result) {
  const colors = LEVEL_COLORS[result.overall];
  const emoji  = LEVEL_EMOJI[result.overall];

  // Badge
  resultBadge.textContent = `${emoji} ${result.overall}`;
  resultBadge.style.background = colors.bg;
  resultBadge.style.color = colors.fg;

  resultTitle.textContent = `Overall Readiness: ${result.overall}`;

  // Scores
  heatScore.textContent = `${result.heat.level} (HI ${result.heat.heatIndex} °C)`;
  rainScore.textContent = `${result.rain.level} (Eff. ${result.rain.effectiveRainfall} mm)`;

  const heatPct = (result.heat.score / 4) * 100;
  const rainPct = (result.rain.score / 4) * 100;
  heatBar.style.width = `${heatPct}%`;
  heatBar.style.background = LEVEL_COLORS[result.heat.level].bar;
  rainBar.style.width = `${rainPct}%`;
  rainBar.style.background = LEVEL_COLORS[result.rain.level].bar;

  // Explanation
  calcExplain.innerHTML = result.explanation
    .map((line) => `<p class="explain-line">📐 ${line}</p>`)
    .join('');

  // Action cards
  actionCards.innerHTML = result.actions
    .map(
      (a) => `
    <div class="action-card">
      <span class="action-icon">${a.icon}</span>
      <div>
        <strong>${a.title}</strong>
        <p>${a.body}</p>
      </div>
    </div>`
    )
    .join('');
}

// ── History ────────────────────────────────────────────────────────────

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveToHistory(entry) {
  const history = getHistory();
  history.unshift({ ...entry, timestamp: new Date().toISOString() });
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function renderHistory() {
  const history = getHistory();
  if (history.length === 0) {
    historyList.innerHTML =
      '<p class="history-empty">No checks yet. Enter conditions above and click "Check My Risk".</p>';
    return;
  }

  historyList.innerHTML = history
    .map((h) => {
      const colors = LEVEL_COLORS[h.result.overall];
      const time = new Date(h.timestamp).toLocaleString();
      return `
      <div class="history-item">
        <div class="history-badge" style="background:${colors.bg};color:${colors.fg}">
          ${LEVEL_EMOJI[h.result.overall]} ${h.result.overall}
        </div>
        <div class="history-details">
          <strong>${h.city}</strong> — ${h.temperature}°C, ${h.humidity}% hum, ${h.rainfall}mm rain, ${h.wind}km/h wind
          <br><small>${time}</small>
        </div>
      </div>`;
    })
    .join('');
}

clearHistory.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

// ── Helpers ────────────────────────────────────────────────────────────

function shakeElement(el) {
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 500);
}

function animateBtn(el, text) {
  const orig = el.textContent;
  el.textContent = text;
  setTimeout(() => (el.textContent = orig), 1200);
}

// ── Init ───────────────────────────────────────────────────────────────

renderHistory();
