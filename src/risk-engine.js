/**
 * EcoTrack AI — Risk Engine
 * Transparent, rule-based heat and rain risk assessment.
 *
 * Heat risk is derived from an approximated Heat Index (Rothfusz regression / Steadman).
 * Rain risk is derived from expected rainfall amount, amplified by wind shear factor.
 * Overall readiness level = the worse of the two individual risks.
 */

// ── Risk level thresholds ──────────────────────────────────────────────

export const HEAT_THRESHOLDS = [
  { max: 27, level: 'Low',      score: 1, label: 'Normal / Caution' },
  { max: 33, level: 'Moderate',  score: 2, label: 'Extreme Caution' },
  { max: 41, level: 'High',      score: 3, label: 'Danger (Heat Exhaustion likely)' },
  { max: Infinity, level: 'Severe', score: 4, label: 'Extreme Danger (Heatstroke imminent)' },
];

export const RAIN_THRESHOLDS = [
  { max: 15,  level: 'Low',      score: 1, label: 'Light / Manageable' },
  { max: 64,  level: 'Moderate',  score: 2, label: 'Moderate / Ponding risk' },
  { max: 115, level: 'High',      score: 3, label: 'Heavy / Localized flooding' },
  { max: Infinity, level: 'Severe', score: 4, label: 'Severe / Flash flood alert' },
];

export const LEVEL_ORDER = ['Low', 'Moderate', 'High', 'Severe'];

// ── Simplified Heat Index approximation (Steadman / Rothfusz) ─────────

export function approximateHeatIndex(tempC, humidityPct) {
  // Only meaningful when temp >= 27 °C; below that, apparent temp ≈ actual
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

export function effectiveRainfall(rainfallMm, windKmh) {
  // Wind above 20 km/h pushes runoff into drains faster and causes wind-driven ingress
  const windFactor = 1 + Math.min(Math.max(windKmh - 10, 0), 100) / 180;
  return rainfallMm * windFactor;
}

// ── Classify a value against thresholds ────────────────────────────────

export function classify(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return { level: t.level, score: t.score, label: t.label };
  }
  return { level: 'Severe', score: 4, label: thresholds[thresholds.length - 1].label };
}

export function worstLevel(a, b) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

// ── Action catalogue ───────────────────────────────────────────────────

export const ACTIONS = {
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

export function getActions(heatLevel, rainLevel) {
  const heatScore = LEVEL_ORDER.indexOf(heatLevel);
  const rainScore = LEVEL_ORDER.indexOf(rainLevel);

  if (heatScore > rainScore) {
    return ACTIONS.heat[heatLevel];
  } else if (rainScore > heatScore) {
    return ACTIONS.rain[rainLevel];
  }

  // Equal risk levels: blend actions for comprehensive coverage
  return [
    ACTIONS.heat[heatLevel][0],
    ACTIONS.rain[rainLevel][0],
    ACTIONS.heat[heatLevel][1] || ACTIONS.rain[rainLevel][1],
    ACTIONS.rain[rainLevel][2] || ACTIONS.heat[heatLevel][2],
  ].filter(Boolean).slice(0, 4);
}

// ── Main assessment function ───────────────────────────────────────────

export function assessRisk({ temperature, humidity, rainfall, wind }) {
  const temp = Number(temperature);
  const hum = Number(humidity);
  const rainAmount = Number(rainfall);
  const windSpeed = Number(wind);

  const heatIndex = approximateHeatIndex(temp, hum);
  const effRain   = effectiveRainfall(rainAmount, windSpeed);

  const heatClass = classify(heatIndex, HEAT_THRESHOLDS);
  const rainClass = classify(effRain, RAIN_THRESHOLDS);

  const overall = worstLevel(heatClass.level, rainClass.level);
  const overallScore = Math.max(heatClass.score, rainClass.score);
  const actions = getActions(heatClass.level, rainClass.level);

  return {
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
      `Readiness Verdict: Dominated by ${overall} classification (${Math.max(heatClass.score, rainClass.score)}/4 severity score).`
    ],
    timestamp: new Date().toISOString(),
  };
}

// ── Expanded City Catalogue & Coordinates (for Live Weather API) ─────

export const CITY_CATALOG = [
  { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.2090, defaults: { temperature: 41.5, humidity: 38, rainfall: 4, wind: 16 } },
  { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lon: 72.8777, defaults: { temperature: 33.2, humidity: 86, rainfall: 78, wind: 32 } },
  { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707, defaults: { temperature: 37.8, humidity: 76, rainfall: 42, wind: 22 } },
  { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, defaults: { temperature: 28.5, humidity: 62, rainfall: 28, wind: 14 } },
  { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639, defaults: { temperature: 36.0, humidity: 82, rainfall: 55, wind: 24 } },
  { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lon: 78.4867, defaults: { temperature: 38.0, humidity: 48, rainfall: 15, wind: 18 } },
  { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714, defaults: { temperature: 43.0, humidity: 30, rainfall: 2, wind: 15 } },
  { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567, defaults: { temperature: 31.0, humidity: 70, rainfall: 35, wind: 18 } },
  { id: 'kochi', name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673, defaults: { temperature: 31.5, humidity: 88, rainfall: 92, wind: 26 } },
  { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, defaults: { temperature: 42.0, humidity: 25, rainfall: 0, wind: 14 } },
];

export const SAMPLE_CONDITIONS = Object.fromEntries(
  CITY_CATALOG.map((c) => [c.id, c.defaults])
);
