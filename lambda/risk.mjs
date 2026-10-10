/**
 * EcoTrack AI — AWS Lambda Risk Endpoint
 * Receives weather inputs and returns risk assessment.
 * Runs locally via AWS SAM CLI (`sam local start-api`).
 */

const HEAT_THRESHOLDS = [
  { max: 27, level: 'Low', score: 1, label: 'Normal / Caution' },
  { max: 33, level: 'Moderate', score: 2, label: 'Extreme Caution' },
  { max: 41, level: 'High', score: 3, label: 'Danger (Heat Exhaustion likely)' },
  { max: Infinity, level: 'Severe', score: 4, label: 'Extreme Danger (Heatstroke imminent)' },
];

const RAIN_THRESHOLDS = [
  { max: 15, level: 'Low', score: 1, label: 'Light / Manageable' },
  { max: 64, level: 'Moderate', score: 2, label: 'Moderate / Ponding risk' },
  { max: 115, level: 'High', score: 3, label: 'Heavy / Localized flooding' },
  { max: Infinity, level: 'Severe', score: 4, label: 'Severe / Flash flood alert' },
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
  const windFactor = 1 + Math.min(Math.max(windKmh - 10, 0), 100) / 180;
  return rainfallMm * windFactor;
}

function classify(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return { level: t.level, score: t.score, label: t.label };
  }
  return { level: 'Severe', score: 4, label: thresholds[thresholds.length - 1].label };
}

function worstLevel(a, b) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

const ACTIONS = {
  heat: {
    Low: [
      { id: 'h-low-1', icon: '💧', title: 'Maintain routine hydration', body: 'Drink at least 2–2.5L water today even without intense thirst.', tag: 'Hydration', priority: 'Low' },
      { id: 'h-low-2', icon: '🧴', title: 'Sun protection', body: 'Apply SPF 30+ sunscreen and wear UV-rated sunglasses if out in peak sunlight.', tag: 'Outdoor', priority: 'Low' },
      { id: 'h-low-3', icon: '🧢', title: 'Breathable attire', body: 'Choose lightweight, light-colored, loose cotton clothing.', tag: 'Attire', priority: 'Low' },
    ],
    Moderate: [
      { id: 'h-mod-1', icon: '💧', title: 'Pre-hydrate before stepping out', body: 'Keep an electrolyte/ORAL hydration pack handy; target 3L fluids.', tag: 'Hydration', priority: 'Medium' },
      { id: 'h-mod-2', icon: '🏠', title: 'Restrict peak-sun activities', body: 'Avoid heavy outdoor labor or jogging between 11:30 AM and 3:30 PM.', tag: 'Activity', priority: 'Medium' },
      { id: 'h-mod-3', icon: '👶', title: 'Check vulnerable family & pets', body: 'Ensure elderly members, toddlers, and pets remain in well-ventilated shade.', tag: 'Community', priority: 'Medium' },
    ],
    High: [
      { id: 'h-high-1', icon: '🚫', title: 'Postpone outdoor strenuous activity', body: 'Reschedule all field tasks to early morning (before 9 AM) or post sunset.', tag: 'Safety', priority: 'High' },
      { id: 'h-high-2', icon: '🧊', title: 'Active cooling protocol', body: 'Use damp washcloths, cold misting, or cold showers if core temperature rises.', tag: 'Health', priority: 'High' },
      { id: 'h-high-3', icon: '📞', title: 'Check isolated neighbours', body: 'Contact elderly neighbours living alone to confirm fan/cooler operation.', tag: 'Community', priority: 'High' },
    ],
    Severe: [
      { id: 'h-sev-1', icon: '🆘', title: 'Heat emergency protocol active', body: 'Extreme heat risk. Immediately rest in air-conditioned or chilled refuge rooms.', tag: 'Emergency', priority: 'Critical' },
      { id: 'h-sev-2', icon: '🚫', title: 'Zero direct sun exposure', body: 'Cancel all outdoor deliveries, construction, and pedestrian transit.', tag: 'Mandate', priority: 'Critical' },
      { id: 'h-sev-3', icon: '🏥', title: 'Identify nearest medical cooler facility', body: 'Watch for disorientation, cessation of sweating, or vomiting (heatstroke). Call 112/108.', tag: 'Medical', priority: 'Critical' },
    ],
  },
  rain: {
    Low: [
      { id: 'r-low-1', icon: '☂️', title: 'Carry waterproof gear', body: 'Keep a compact umbrella or rain poncho accessible when traveling.', tag: 'Commute', priority: 'Low' },
      { id: 'r-low-2', icon: '🚗', title: 'Wet pavement caution', body: 'Increase following distance while driving; tires take 40% longer to brake on damp asphalt.', tag: 'Driving', priority: 'Low' },
      { id: 'r-low-3', icon: '🏠', title: 'Close open balconies & windows', body: 'Inspect window sills and bring drying clothes inside before leaving.', tag: 'Home', priority: 'Low' },
    ],
    Moderate: [
      { id: 'r-mod-1', icon: '🕳️', title: 'Inspect local stormwater grates', body: 'Clear leaves, plastic debris, and silt from driveway drains and neighbourhood culverts.', tag: 'Drainage', priority: 'Medium' },
      { id: 'r-mod-2', icon: '🚗', title: 'Reposition low-lying vehicles', body: 'Relocate two-wheelers and cars out of basement ramps or depression parking.', tag: 'Assets', priority: 'Medium' },
      { id: 'r-mod-3', icon: '🔋', title: 'Charge backup power sources', body: 'Charge portable power banks, torches, and radios in anticipation of feeder trips.', tag: 'Preparedness', priority: 'Medium' },
    ],
    High: [
      { id: 'r-high-1', icon: '⚠️', title: 'Avoid waterlogged underpasses', body: 'Do not cross flooded subway roads or stagnant water (risk of hidden manholes & electrocution).', tag: 'Danger', priority: 'High' },
      { id: 'r-high-2', icon: '📦', title: 'Elevate ground-floor valuables', body: 'Move electronic appliances, documents, and surge protectors at least 1 meter above floor.', tag: 'Protection', priority: 'High' },
      { id: 'r-high-3', icon: '📻', title: 'Monitor disaster management alerts', body: 'Tune to local municipal radio or state disaster management authority (SDMA) bulletins.', tag: 'Updates', priority: 'High' },
    ],
    Severe: [
      { id: 'r-sev-1', icon: '🆘', title: 'Flash flood alert: move to upper floors', body: 'Severe runoff imminent. Relocate essential medication, infants, and elderly to higher floors.', tag: 'Emergency', priority: 'Critical' },
      { id: 'r-sev-2', icon: '⚡', title: 'Isolate main circuit breaker if submerged', body: 'Do not touch switches while standing in water. Report sparking transformers to 1912 immediately.', tag: 'Electrical', priority: 'Critical' },
      { id: 'r-sev-3', icon: '📞', title: 'Keep NDRF & emergency lines ready', body: 'National Emergency: 112 | NDRF Helpline: 1078 | Disaster Control: 1070.', tag: 'Rescue', priority: 'Critical' },
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
    ACTIONS.rain[rainLevel][2] || ACTIONS.heat[heatLevel][2],
  ].filter(Boolean).slice(0, 4);
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { temperature, humidity, rainfall, wind } = body;

    if ([temperature, humidity, rainfall, wind].some((v) => v == null || isNaN(Number(v)))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing or invalid fields: temperature, humidity, rainfall, wind' }),
      };
    }

    const temp = Number(temperature);
    const hum = Number(humidity);
    const rainAmount = Number(rainfall);
    const windSpeed = Number(wind);

    const heatIndex = approximateHeatIndex(temp, hum);
    const effRain = effectiveRainfall(rainAmount, windSpeed);
    const heatClass = classify(heatIndex, HEAT_THRESHOLDS);
    const rainClass = classify(effRain, RAIN_THRESHOLDS);
    const overall = worstLevel(heatClass.level, rainClass.level);
    const overallScore = Math.max(heatClass.score, rainClass.score);
    const actions = getActions(heatClass.level, rainClass.level);

    const result = {
      overall,
      overallScore,
      heat: {
        level: heatClass.level,
        score: heatClass.score,
        heatIndex: Math.round(heatIndex * 10) / 10,
        rawTemp: temp,
        rawHumidity: hum,
        label: heatClass.label,
      },
      rain: {
        level: rainClass.level,
        score: rainClass.score,
        effectiveRainfall: Math.round(effRain * 10) / 10,
        rawRainfall: rainAmount,
        rawWind: windSpeed,
        label: rainClass.label,
      },
      actions,
      explanation: [
        `Heat Metric: Temperature ${temp}°C + Humidity ${hum}% yields an Apparent Heat Index of ${Math.round(heatIndex * 10) / 10}°C (${heatClass.level} Risk).`,
        `Rain Metric: Rainfall ${rainAmount}mm amplified by ${windSpeed} km/h wind shear produces Effective Precipitation of ${Math.round(effRain * 10) / 10}mm (${rainClass.level} Risk).`,
        `Readiness Verdict: Dominated by ${overall} classification (${overallScore}/4 severity score).`
      ],
      engine: 'AWS SAM Local Lambda (Node.js 20.x)',
      timestamp: new Date().toISOString(),
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
