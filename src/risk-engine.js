/**
 * EcoTrack AI — Risk Engine
 * Transparent, rule-based heat and rain risk assessment.
 *
 * Heat risk is derived from an approximated Heat Index (temperature + humidity).
 * Rain risk is derived from expected rainfall amount, amplified by wind speed.
 * Overall readiness level = the worse of the two individual risks.
 */

// ── Risk level thresholds ──────────────────────────────────────────────

const HEAT_THRESHOLDS = [
  { max: 27, level: 'Low',      score: 1 },
  { max: 33, level: 'Moderate',  score: 2 },
  { max: 41, level: 'High',      score: 3 },
  { max: Infinity, level: 'Severe', score: 4 },
];

const RAIN_THRESHOLDS = [
  { max: 15,  level: 'Low',      score: 1 },
  { max: 64,  level: 'Moderate',  score: 2 },
  { max: 115, level: 'High',      score: 3 },
  { max: Infinity, level: 'Severe', score: 4 },
];

// ── Simplified Heat Index approximation (Steadman 1979) ────────────────

function approximateHeatIndex(tempC, humidityPct) {
  // Only meaningful when temp >= 27 °C; below that, feels-like ≈ actual
  if (tempC < 27) return tempC;

  const T = tempC;
  const H = humidityPct;

  // Rothfusz regression (converted to °C)
  let HI =
    -8.7847 +
    1.6114 * T +
    2.3385 * H * 0.01 * T -
    0.1461 * (H * 0.01) * (H * 0.01) * T -
    0.0123 * T * T +
    0.0164 * (H * 0.01) * T * T +
    0.2199 * (H * 0.01) * (H * 0.01) * T -
    0.0063 * T * T * (H * 0.01) * (H * 0.01) -
    0.0003 * T * T * T;

  // Clamp so it is never below the actual temperature
  return Math.max(HI, tempC);
}

// ── Effective rainfall (amplified by wind) ─────────────────────────────

function effectiveRainfall(rainfallMm, windKmh) {
  // Wind above 30 km/h increases effective impact by up to 50 %
  const windFactor = 1 + Math.min(windKmh, 100) / 200;
  return rainfallMm * windFactor;
}

// ── Classify a value against thresholds ────────────────────────────────

function classify(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return { level: t.level, score: t.score };
  }
  return { level: 'Severe', score: 4 };
}

// ── Level helpers ──────────────────────────────────────────────────────

const LEVEL_ORDER = ['Low', 'Moderate', 'High', 'Severe'];

function worstLevel(a, b) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

// ── Action catalogue ───────────────────────────────────────────────────

const ACTIONS = {
  heat: {
    Low: [
      { icon: '💧', title: 'Stay hydrated', body: 'Drink water regularly even if you don\'t feel thirsty.' },
      { icon: '🧴', title: 'Use sunscreen', body: 'Apply SPF 30+ before going outdoors.' },
      { icon: '🌳', title: 'Seek shade', body: 'Take breaks in shaded or air-conditioned areas.' },
    ],
    Moderate: [
      { icon: '💧', title: 'Increase water intake', body: 'Aim for at least 3 litres of water throughout the day.' },
      { icon: '🏠', title: 'Limit outdoor work', body: 'Avoid strenuous outdoor activity between 11 AM and 4 PM.' },
      { icon: '👶', title: 'Protect vulnerable groups', body: 'Ensure children and elderly stay indoors during peak heat.' },
    ],
    High: [
      { icon: '🚫', title: 'Avoid outdoor activity', body: 'Stay indoors. Postpone non-essential travel and exercise.' },
      { icon: '🧊', title: 'Cool down actively', body: 'Use wet towels, fans, or cold showers to lower body temperature.' },
      { icon: '📞', title: 'Check on neighbours', body: 'Call or visit elderly or unwell neighbours to make sure they\'re safe.' },
    ],
    Severe: [
      { icon: '🆘', title: 'Heat emergency alert', body: 'Dangerously high heat index. Stay in cooled spaces. Call emergency services if anyone shows signs of heatstroke.' },
      { icon: '🚫', title: 'No outdoor exposure', body: 'All outdoor work and travel should stop immediately.' },
      { icon: '🏥', title: 'Know your nearest hospital', body: 'Be ready to seek medical help for heat exhaustion or heatstroke.' },
    ],
  },
  rain: {
    Low: [
      { icon: '☂️', title: 'Carry an umbrella', body: 'Light rain possible — keep rain gear handy.' },
      { icon: '🚗', title: 'Drive carefully', body: 'Roads may be slippery. Reduce speed and keep headlights on.' },
      { icon: '🏠', title: 'Check windows', body: 'Close windows and bring laundry indoors if rain is expected.' },
    ],
    Moderate: [
      { icon: '🕳️', title: 'Check drainage', body: 'Clear leaves and debris from drains near your home to prevent clogging.' },
      { icon: '🚗', title: 'Move vehicles', body: 'Park vehicles away from low-lying or flood-prone areas.' },
      { icon: '🔋', title: 'Charge devices', body: 'Charge phones and power banks in case of power cuts.' },
    ],
    High: [
      { icon: '⚠️', title: 'Avoid waterlogged roads', body: 'Do not walk or drive through flooded streets. Turn around, don\'t drown.' },
      { icon: '📦', title: 'Secure valuables', body: 'Move important documents and electronics to higher ground inside your home.' },
      { icon: '📻', title: 'Monitor alerts', body: 'Keep checking local weather updates and disaster management advisories.' },
    ],
    Severe: [
      { icon: '🆘', title: 'Flooding likely', body: 'Severe rainfall expected. Move to higher ground if in a flood-prone area. Follow evacuation orders.' },
      { icon: '⚡', title: 'Electrical safety', body: 'Stay away from downed power lines and electrical equipment in water.' },
      { icon: '📞', title: 'Emergency contacts ready', body: 'Keep local emergency numbers (NDRF, fire, ambulance) accessible.' },
    ],
  },
};

function getActions(heatLevel, rainLevel) {
  // Pick actions from the dominant risk; if equal, mix both
  const heatScore = LEVEL_ORDER.indexOf(heatLevel);
  const rainScore = LEVEL_ORDER.indexOf(rainLevel);

  if (heatScore > rainScore) {
    return ACTIONS.heat[heatLevel];
  } else if (rainScore > heatScore) {
    return ACTIONS.rain[rainLevel];
  }
  // Equal — pick top 2 heat + top 1 rain (or vice versa for rain-heavy)
  const mixed = [
    ACTIONS.heat[heatLevel][0],
    ACTIONS.rain[rainLevel][0],
    ACTIONS.heat[heatLevel][1] || ACTIONS.rain[rainLevel][1],
  ];
  return mixed;
}

// ── Main assessment function ───────────────────────────────────────────

export function assessRisk({ temperature, humidity, rainfall, wind }) {
  const heatIndex = approximateHeatIndex(temperature, humidity);
  const effRain   = effectiveRainfall(rainfall, wind);

  const heat = classify(heatIndex, HEAT_THRESHOLDS);
  const rain = classify(effRain, RAIN_THRESHOLDS);

  const overall = worstLevel(heat.level, rain.level);
  const actions  = getActions(heat.level, rain.level);

  return {
    overall,
    heat: { level: heat.level, score: heat.score, heatIndex: Math.round(heatIndex * 10) / 10 },
    rain: { level: rain.level, score: rain.score, effectiveRainfall: Math.round(effRain * 10) / 10 },
    actions,
    explanation: buildExplanation({ temperature, humidity, rainfall, wind, heatIndex, effRain, heat, rain }),
  };
}

function buildExplanation({ temperature, humidity, rainfall, wind, heatIndex, effRain, heat, rain }) {
  return [
    `Temp ${temperature} °C + Humidity ${humidity}% → Heat Index ≈ ${Math.round(heatIndex * 10) / 10} °C → ${heat.level} heat risk.`,
    `Rainfall ${rainfall} mm × Wind factor (${wind} km/h) → Effective rain ≈ ${Math.round(effRain * 10) / 10} mm → ${rain.level} rain risk.`,
  ];
}

// ── Sample city data ───────────────────────────────────────────────────

export const SAMPLE_CONDITIONS = {
  delhi:      { temperature: 42, humidity: 35, rainfall: 5,  wind: 15 },
  mumbai:     { temperature: 33, humidity: 85, rainfall: 80, wind: 30 },
  chennai:    { temperature: 37, humidity: 75, rainfall: 40, wind: 20 },
  bengaluru:  { temperature: 29, humidity: 60, rainfall: 25, wind: 12 },
};
