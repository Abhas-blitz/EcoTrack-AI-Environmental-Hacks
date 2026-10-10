/**
 * EcoTrack AI — AWS Lambda Risk Endpoint
 * Receives weather inputs and returns risk assessment.
 * Runs locally via AWS SAM CLI.
 */

// ── Risk thresholds (mirrored from frontend risk-engine.js) ──────────

const HEAT_THRESHOLDS = [
  { max: 27, level: 'Low', score: 1 },
  { max: 33, level: 'Moderate', score: 2 },
  { max: 41, level: 'High', score: 3 },
  { max: Infinity, level: 'Severe', score: 4 },
];

const RAIN_THRESHOLDS = [
  { max: 15, level: 'Low', score: 1 },
  { max: 64, level: 'Moderate', score: 2 },
  { max: 115, level: 'High', score: 3 },
  { max: Infinity, level: 'Severe', score: 4 },
];

const LEVEL_ORDER = ['Low', 'Moderate', 'High', 'Severe'];

function approximateHeatIndex(tempC, humidityPct) {
  if (tempC < 27) return tempC;
  const T = tempC;
  const H = humidityPct;
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
  return Math.max(HI, tempC);
}

function effectiveRainfall(rainfallMm, windKmh) {
  const windFactor = 1 + Math.min(windKmh, 100) / 200;
  return rainfallMm * windFactor;
}

function classify(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return { level: t.level, score: t.score };
  }
  return { level: 'Severe', score: 4 };
}

function worstLevel(a, b) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

// ── Actions ──────────────────────────────────────────────────────────

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
  const heatScore = LEVEL_ORDER.indexOf(heatLevel);
  const rainScore = LEVEL_ORDER.indexOf(rainLevel);
  if (heatScore > rainScore) return ACTIONS.heat[heatLevel];
  if (rainScore > heatScore) return ACTIONS.rain[rainLevel];
  return [
    ACTIONS.heat[heatLevel][0],
    ACTIONS.rain[rainLevel][0],
    ACTIONS.heat[heatLevel][1] || ACTIONS.rain[rainLevel][1],
  ];
}

// ── Lambda handler ───────────────────────────────────────────────────

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { temperature, humidity, rainfall, wind } = body;

    if ([temperature, humidity, rainfall, wind].some((v) => v == null || isNaN(v))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid fields: temperature, humidity, rainfall, wind' }),
      };
    }

    const heatIndex = approximateHeatIndex(temperature, humidity);
    const effRain = effectiveRainfall(rainfall, wind);
    const heat = classify(heatIndex, HEAT_THRESHOLDS);
    const rain = classify(effRain, RAIN_THRESHOLDS);
    const overall = worstLevel(heat.level, rain.level);
    const actions = getActions(heat.level, rain.level);

    const result = {
      overall,
      heat: { level: heat.level, score: heat.score, heatIndex: Math.round(heatIndex * 10) / 10 },
      rain: { level: rain.level, score: rain.score, effectiveRainfall: Math.round(effRain * 10) / 10 },
      actions,
      explanation: [
        `Temp ${temperature} °C + Humidity ${humidity}% → Heat Index ≈ ${Math.round(heatIndex * 10) / 10} °C → ${heat.level} heat risk.`,
        `Rainfall ${rainfall} mm × Wind factor (${wind} km/h) → Effective rain ≈ ${Math.round(effRain * 10) / 10} mm → ${rain.level} rain risk.`,
      ],
    };

    return { statusCode: 200, headers, body: JSON.stringify(result) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', message: err.message }),
    };
  }
};
