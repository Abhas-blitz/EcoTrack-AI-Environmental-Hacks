/**
 * EcoTrack AI — Advanced Risk & Meteorology Engine
 * Transparent, rule-based heat and rain risk assessment.
 *
 * Includes:
 * 1. Heat Index via Rothfusz regression (Steadman formulation)
 * 2. Wet-Bulb Temperature (Tw) via Stull (2011) formulation
 * 3. Wind shear precipitation amplification
 * 4. Multi-domain categorized action protocols
 * 5. Emergency Go-Bag checklist definitions
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

// ── Apparent Heat Index approximation (Steadman / Rothfusz) ───────────

export function approximateHeatIndex(tempC, humidityPct) {
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

// ── Wet-Bulb Temperature (Tw) via Stull (2011) ─────────────────────────

export function calculateWetBulb(tempC, humidityPct) {
  const T = tempC;
  const H = humidityPct;

  const Tw =
    T * Math.atan(0.151977 * Math.sqrt(H + 8.313659)) +
    Math.atan(T + H) -
    Math.atan(H - 1.676331) +
    0.00391838 * Math.pow(H, 1.5) * Math.atan(0.023101 * H) -
    4.686035;

  return Math.round(Tw * 10) / 10;
}

export function classifyWetBulb(wetBulbC) {
  if (wetBulbC < 26) return { status: 'Normal', note: 'Standard thermal dissipation' };
  if (wetBulbC < 29) return { status: 'Elevated Stress', note: 'Increased cardiac strain during exertion' };
  if (wetBulbC < 32) return { status: 'High Danger', note: 'Impaired sweat evaporation; short work cycles' };
  return { status: 'Critical Physiological Limit', note: 'Extreme hazard: core temperature escalation within hours' };
}

// ── Effective Rainfall (wind shear factor) ─────────────────────────────

export function effectiveRainfall(rainfallMm, windKmh) {
  const windFactor = 1 + Math.min(Math.max(windKmh - 10, 0), 100) / 180;
  return rainfallMm * windFactor;
}

// ── Classification Helpers ─────────────────────────────────────────────

export function classify(value, thresholds) {
  for (const t of thresholds) {
    if (value <= t.max) return { level: t.level, score: t.score, label: t.label };
  }
  return { level: 'Severe', score: 4, label: thresholds[thresholds.length - 1].label };
}

export function worstLevel(a, b) {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

// ── Multi-domain Categorized Action Catalogue ──────────────────────────

export const ACTIONS = {
  heat: {
    Low: [
      { id: 'h-low-1', category: 'Health', icon: '💧', title: 'Maintain baseline hydration', body: 'Drink 2.5–3L water today; encourage hydration among outdoor workers and students.', tag: 'Hydration', priority: 'Low' },
      { id: 'h-low-2', category: 'Household', icon: '🧢', title: 'Sunshade and breathable clothing', body: 'Use broad-brim hats, UV umbrellas, and light-colored cotton attire.', tag: 'Attire', priority: 'Low' },
      { id: 'h-low-3', category: 'Community', icon: '🌳', title: 'Utilize neighborhood shade corridors', body: 'Map shaded pedestrian walkways and plant trees along building setbacks.', tag: 'Outdoor', priority: 'Low' },
    ],
    Moderate: [
      { id: 'h-mod-1', category: 'Health', icon: '💧', title: 'Oral Rehydration & Electrolyte Packs', body: 'Stock ORS packets and coconut water; keep drinking at 20-minute intervals outdoors.', tag: 'Hydration', priority: 'Medium' },
      { id: 'h-mod-2', category: 'Household', icon: '🏠', title: 'Limit peak-solar exposure (11:30–15:30)', body: 'Keep westward curtains closed; ventilate home using cross-breeze during evening.', tag: 'Cooling', priority: 'Medium' },
      { id: 'h-mod-3', category: 'Community', icon: '👶', title: 'Monitor vulnerable seniors & pets', body: 'Check on elderly building residents living alone; ensure outdoor pets have fresh water.', tag: 'Care', priority: 'Medium' },
    ],
    High: [
      { id: 'h-high-1', category: 'Health', icon: '🚫', title: 'Mandatory halt on heavy midday labor', body: 'Reschedule construction, deliveries, and outdoor physical drills to cooler dawn hours.', tag: 'Safety', priority: 'High' },
      { id: 'h-high-2', category: 'Household', icon: '🧊', title: 'Active cooling stations', body: 'Keep ice packs, cool towels, and emergency pedestal fans powered in a cool designated room.', tag: 'Refuge', priority: 'High' },
      { id: 'h-high-3', category: 'Community', icon: '📞', title: 'Establish neighborhood check-in ring', body: 'Coordinate building WhatsApp tree to verify that every floor has functional fans or cooling.', tag: 'Community', priority: 'High' },
    ],
    Severe: [
      { id: 'h-sev-1', category: 'Health', icon: '🆘', title: 'Heat emergency protocol: Cool rooms only', body: 'Extreme ambient hazard. Relocate vulnerable residents immediately to cooled community centres.', tag: 'Emergency', priority: 'Critical' },
      { id: 'h-sev-2', category: 'Household', icon: '🚫', title: 'Zero direct sun exposure mandate', body: 'Cancel all outdoor transit; keep doors and thermal blinds tightly sealed against dry hot wind.', tag: 'Lockdown', priority: 'Critical' },
      { id: 'h-sev-3', category: 'Community', icon: '🏥', title: 'Identify nearest heat-treatment clinic', body: 'Watch for confusion, hot dry skin, or rapid pulse. Immediately call 112 / 108 for ambulance.', tag: 'Medical', priority: 'Critical' },
    ],
  },
  rain: {
    Low: [
      { id: 'r-low-1', category: 'Household', icon: '☂️', title: 'Inspect rooftop gutters & drains', body: 'Check that terrace drain outlets are free of fallen leaves or dust blockages.', tag: 'Drainage', priority: 'Low' },
      { id: 'r-low-2', category: 'Infrastructure', icon: '🚗', title: 'Safe driving following distance', body: 'Double stopping distance on damp asphalt; avoid sudden braking near road puddles.', tag: 'Commute', priority: 'Low' },
      { id: 'r-low-3', category: 'Community', icon: '🏠', title: 'Secure loose balcony items', body: 'Bring in lightweight flower pots and drying racks that could be blown off balconies.', tag: 'Assets', priority: 'Low' },
    ],
    Moderate: [
      { id: 'r-mod-1', category: 'Infrastructure', icon: '🕳️', title: 'Clear storm drain grates & culverts', body: 'Check municipal stormwater inlets near your gate; report standing water to local ward office.', tag: 'Drainage', priority: 'Medium' },
      { id: 'r-mod-2', category: 'Household', icon: '🚗', title: 'Relocate basement parked vehicles', body: 'Move cars and two-wheelers up from underground ramps or flood-susceptible basement floors.', tag: 'Vehicles', priority: 'Medium' },
      { id: 'r-mod-3', category: 'Health', icon: '🔋', title: 'Charge backup power & battery packs', body: 'Full charge on phones, inverters, power banks, and flashlights for feeder trip events.', tag: 'Preparedness', priority: 'Medium' },
    ],
    High: [
      { id: 'r-high-1', category: 'Infrastructure', icon: '⚠️', title: 'Avoid flooded underpasses & subways', body: 'Never drive through standing water of unknown depth; submerged manholes and electrical leaks present severe danger.', tag: 'Hazard', priority: 'High' },
      { id: 'r-high-2', category: 'Household', icon: '📦', title: 'Elevate ground-floor valuables & wiring', body: 'Raise computers, appliances, and legal documents at least 1.2m above finished floor.', tag: 'Protection', priority: 'High' },
      { id: 'r-high-3', category: 'Community', icon: '📻', title: 'Tune into municipal disaster radio', body: 'Monitor SDMA and IMD radar feeds; establish sandbag barriers at driveway gates.', tag: 'Advisory', priority: 'High' },
    ],
    Severe: [
      { id: 'r-sev-1', category: 'Infrastructure', icon: '🆘', title: 'Flash flood alert: Stage to upper floors', body: 'Torrential runoff occurring. Move infants, elders, and pets to floor 2 or above immediately.', tag: 'Evacuation', priority: 'Critical' },
      { id: 'r-sev-2', category: 'Household', icon: '⚡', title: 'Isolate main electrical circuit breakers', body: 'Switch off main power if water approaches wall outlets. Do not touch electrical boxes while in standing water.', tag: 'Electrical', priority: 'Critical' },
      { id: 'r-sev-3', category: 'Community', icon: '📞', title: 'Contact NDRF & Emergency Disaster Control', body: 'National Emergency: 112 | NDRF: 1078 | District Flood Control: 1077 | Power Grid Fault: 1912.', tag: 'Rescue', priority: 'Critical' },
    ],
  },
};

// Emergency Go-Bag Checklist
export const GO_BAG_ITEMS = [
  { id: 'gobag-1', icon: '💧', title: 'Potable Drinking Water (3L per person in sealed bottles)', category: 'Essential' },
  { id: 'gobag-2', icon: '🥫', title: 'Non-perishable energy bars / dry rations (48-hour supply)', category: 'Essential' },
  { id: 'gobag-3', icon: '💊', title: 'Essential prescription medicines + First Aid kit & ORS', category: 'Medical' },
  { id: 'gobag-4', icon: '🔦', title: 'High-lumen waterproof LED torch + extra batteries', category: 'Utility' },
  { id: 'gobag-5', icon: '🔋', title: '20,000mAh Power Bank with multiple charging cables', category: 'Utility' },
  { id: 'gobag-6', icon: '📄', title: 'Aadhaar / ID cards, insurance policies in waterproof zip pouch', category: 'Documents' },
  { id: 'gobag-7', icon: '📻', title: 'Battery-powered AM/FM emergency radio', category: 'Communications' },
  { id: 'gobag-8', icon: '📢', title: 'High-decibel emergency whistle for rescue signaling', category: 'Rescue' },
];

export function getActions(heatLevel, rainLevel) {
  const heatScore = LEVEL_ORDER.indexOf(heatLevel);
  const rainScore = LEVEL_ORDER.indexOf(rainLevel);

  if (heatScore > rainScore) {
    return ACTIONS.heat[heatLevel];
  } else if (rainScore > heatScore) {
    return ACTIONS.rain[rainLevel];
  }

  return [
    ACTIONS.heat[heatLevel][0],
    ACTIONS.rain[rainLevel][0],
    ACTIONS.heat[heatLevel][1] || ACTIONS.rain[rainLevel][1],
    ACTIONS.rain[rainLevel][2] || ACTIONS.heat[heatLevel][2],
  ].filter(Boolean);
}

// ── Main Assessment Function ───────────────────────────────────────────

export function assessRisk({ temperature, humidity, rainfall, wind }) {
  const temp = Number(temperature);
  const hum = Number(humidity);
  const rainAmount = Number(rainfall);
  const windSpeed = Number(wind);

  const heatIndex = approximateHeatIndex(temp, hum);
  const wetBulb = calculateWetBulb(temp, hum);
  const wetBulbInfo = classifyWetBulb(wetBulb);
  const effRain = effectiveRainfall(rainAmount, windSpeed);

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
      wetBulb,
      wetBulbStatus: wetBulbInfo.status,
      wetBulbNote: wetBulbInfo.note,
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
      `Thermal Metric: Ambient ${temp}°C + Humidity ${hum}% generates an Apparent Heat Index of ${Math.round(heatIndex * 10) / 10}°C (${heatClass.level} Risk).`,
      `Wet-Bulb Stress: Calculated Wet-Bulb temperature is ${wetBulb}°C (${wetBulbInfo.status}).`,
      `Hydrological Runoff: Precipitation ${rainAmount}mm adjusted by ${windSpeed} km/h wind shear produces Effective Runoff Volume of ${Math.round(effRain * 10) / 10}mm (${rainClass.level} Risk).`,
      `Readiness Verdict: Overall classification is governed by ${overall} hazard (${overallScore}/4 severity scale).`
    ],
    timestamp: new Date().toISOString(),
  };
}

// ── Expanded City Catalog with Coordinates ─────────────────────────────

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
