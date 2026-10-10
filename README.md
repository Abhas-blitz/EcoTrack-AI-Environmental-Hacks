# 🌍 EcoTrack AI — Neighbourhood Heat & Rain Readiness

> A community decision-support system that assesses local heat stress and heavy-rain flood risks, displays transparent meteorological calculations, and provides interactive neighborhood safety protocols.

**Built for [Environmental Hacks 2026](https://www.wemakedevs.org/aws/env) · Track: Heat & Water**  
*Requirement: Utilizes an AWS open-source tool (AWS SAM CLI) running locally for ₹0 cloud cost.*

---

## ✨ Key Features & Capabilities

- **Modern Glassmorphic UI with Dark / Light Mode** — Responsive dashboard with real-time theme persistence.
- **Dual Meteorological Input Modes** — Synchronized numeric inputs & range sliders for:
  - 🌡️ Temperature (°C)
  - 💧 Relative Humidity (%)
  - 🌧️ Expected Rainfall (mm/24h)
  - 💨 Wind Speed / Gusts (km/h)
- **Live Weather Integration (Open-Meteo API)** — Real-time satellite & station weather fetch across 10 major Indian municipal hubs (Delhi, Mumbai, Chennai, Bengaluru, Kolkata, Hyderabad, Ahmedabad, Pune, Kochi, Jaipur).
- **GPS Auto-Location Detection** — One-click geolocation fetching live local conditions for your exact coordinates.
- **Instant Preset Scenarios** — One-click test scenarios:
  - ☀️ 43°C Heatwave (Severe Heat)
  - 🌧️ 85mm Cloudburst (Severe Flooding)
  - 🌀 Coastal Squall (High Wind + Heavy Rain)
  - ⛅ 28°C Mild Spring (Low Risk)
- **Interactive SVG Speedometer Gauge** — Animated multi-level needle visualizing risk severity: `Low (1/4)`, `Moderate (2/4)`, `High (3/4)`, and `Severe (4/4)`.
- **Transparent Mathematical Engine** —
  - **Heat Index (HI)**: Evaluated via Rothfusz polynomial regression (Steadman formulation).
  - **Effective Precipitation**: Accounts for wind shear runoff acceleration.
  - Step-by-step formula breakdown visible on every check.
- **Interactive Action Checklist** —
  - Household and building actions with priority tags (`[Drainage]`, `[Hydration]`, `[Electrical]`, `[Assets]`).
  - Interactive checkboxes with live completion progress bar.
- **"What-If" 3-Hour Trend Simulator** — Sandbox buttons to simulate sudden weather escalations (`+4°C heat spike`, `+50mm cloudburst`, `+35km/h squall`).
- **Emergency Helplines Directory** — Quick-reference card for Indian disaster helplines: 112 (National Emergency), 1078 (NDRF), 1070 (SDMA), 108 (Ambulance), 1912 (Electrical Safety).
- **Share & Export Utilities** —
  - 📋 **Copy WhatsApp Alert**: Formats an instant community alert ready for apartment or neighborhood groups.
  - 📥 **Export JSON**: Downloads full machine-readable assessment report.
  - 📊 **Export CSV**: Exports full device history log.
- **Hybrid Execution Engine (AWS SAM Local API ⇄ Client Engine)** —
  - Built with **AWS Serverless Application Model (SAM)** (`template.yaml` and `lambda/risk.mjs`).
  - Toggle between client-side computation and local serverless API with connection status pinging.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vite, Vanilla JavaScript (ES Modules), Modern CSS3 (Variables, Glassmorphism, Flex/Grid) |
| **Backend & Serverless** | AWS SAM CLI, AWS Lambda (`nodejs20.x`), API Gateway |
| **External APIs** | Open-Meteo Free Weather API (No API key required) |
| **Storage** | Browser `localStorage` (History & Theme) |
| **Cost** | ₹0 / $0 — 100% free local execution |

---

## 🚀 Quick Start Guide

### 1. Install & Launch the Frontend

```bash
npm install
npm run dev
```

Open the printed URL in your browser (default: `http://localhost:5173`).

---

### 2. Testing the AWS Serverless Backend

You have two simple options to test the Lambda backend:

#### Option A: Native AWS SAM CLI (Docker required)
```bash
sam build
sam local start-api
```
The serverless API will start on `http://127.0.0.1:3000/assess`.

#### Option B: Lightweight Local Lambda Runner (No Docker needed)
```bash
npm run lambda:local
```
This runs the exact `lambda/risk.mjs` handler over HTTP at `http://127.0.0.1:3000/assess` for instant testing.

---

### 3. Verify via cURL / PowerShell

```bash
curl -X POST http://127.0.0.1:3000/assess \
  -H "Content-Type: application/json" \
  -d '{"temperature":42,"humidity":35,"rainfall":5,"wind":15}'
```

In the web app, toggle **"Use AWS SAM API (Local)"** and click **"Ping SAM"** to confirm live connectivity!

---

## 📂 Project Structure

```
EcoTrack-AI/
├── lambda/
│   ├── risk.mjs            # AWS Lambda serverless handler
│   └── local-runner.mjs    # Lightweight local HTTP runner for testing
├── public/
│   └── favicon.svg         # SVG favicon
├── src/
│   ├── main.js             # UI controller, events, live weather, checklist
│   ├── risk-engine.js      # Core meteorological logic & city catalog
│   └── style.css           # Design system (light/dark themes, gauge, cards)
├── template.yaml           # AWS SAM CloudFormation template
├── index.html              # Main application dashboard
├── package.json            # Scripts & dependencies
└── README.md               # Documentation & submission brief
```

---

## 🧮 Mathematical Formulations

### 1. Apparent Heat Index (Steadman / Rothfusz)
For temperatures $T \ge 27^\circ\text{C}$ and relative humidity $H$:
$$HI = -8.7847 + 1.6114T + 2.3385(0.01H)T - 0.1461(0.01H)^2T - 0.0123T^2 + \dots$$
- **Low**: $\le 27^\circ\text{C}$ (Normal / Caution)
- **Moderate**: $28 - 33^\circ\text{C}$ (Extreme Caution)
- **High**: $34 - 41^\circ\text{C}$ (Danger / Heat Exhaustion likely)
- **Severe**: $> 41^\circ\text{C}$ (Extreme Danger / Heatstroke risk)

### 2. Effective Rainfall & Wind Shear
$$R_{\text{effective}} = R \times \left(1 + \frac{\min(\max(W - 10, 0), 100)}{180}\right)$$
Wind gusts accelerate storm sewer inflow and structural water penetration.
- **Low**: $\le 15\text{ mm}$
- **Moderate**: $16 - 64\text{ mm}$
- **High**: $65 - 115\text{ mm}$
- **Severe**: $> 115\text{ mm}$ (Flash flood alert)

---

## 🎬 3-Minute Video Demo Narrative

> *"EcoTrack AI is a neighbourhood decision-support tool created for Environmental Hacks 2026. Community members can select their city or tap 'My GPS Location' to pull real-time weather via satellite feed. The app calculates localized heat stress and flood vulnerability using transparent meteorological formulations. It renders an animated speedometer gauge, detailed hazard breakdown, and a practical interactive safety checklist. The assessment can be powered directly by an AWS SAM local serverless API (Node.js 20 Lambda), demonstrating AWS open-source tooling with ₹0 cloud spend."*

---

## ⚠️ Disclaimer

**Decision-support tool only.** EcoTrack AI is an open advisory instrument and does not substitute official statutory alerts issued by national meteorological departments or disaster response authorities.
