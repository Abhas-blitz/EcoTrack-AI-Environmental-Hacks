# 🌍 EcoTrack AI — Neighbourhood Heat & Rain Readiness

> A simple, transparent web app that helps people understand local heat and heavy-rain risk, then gives clear safety actions.

**Built for [Environmental Hacks 2026](https://www.wemakedevs.org/aws/env) · Track: Heat & Water**

---

## ✨ Features

- **City selector** — Delhi, Mumbai, Chennai, Bengaluru
- **Manual weather input** — temperature, humidity, expected rainfall, wind speed
- **One-click risk check** — clear Low / Moderate / High / Severe result
- **Heat risk score** using approximated Heat Index (Steadman 1979)
- **Rain risk score** using effective rainfall (adjusted for wind)
- **3 practical action cards** per assessment
- **Transparent calculation** — every value used is shown on screen
- **Local history** — last 5 checks saved in browser localStorage
- **Disclaimer** — clearly states this is a decision-support tool, not an official warning

## 🛠 Tech Stack

| Layer | Tool |
|-------|------|
| Frontend | Vite + Vanilla JS + CSS |
| Backend | AWS SAM CLI (local Lambda) |
| Storage | Browser localStorage |
| Cost | ₹0 — no cloud deployment required |

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Docker](https://www.docker.com/) (required by SAM CLI for local invoke)

### 1. Install & run the frontend

```bash
npm install
npm run dev
```

Open the `Local:` link printed in the terminal (usually http://localhost:5173).

### 2. Run the AWS SAM API locally

```bash
sam build
sam local start-api
```

The API will be available at `http://127.0.0.1:3000/assess`.

### 3. Test the API

```bash
curl -X POST http://127.0.0.1:3000/assess \
  -H "Content-Type: application/json" \
  -d '{"temperature":42,"humidity":35,"rainfall":5,"wind":15}'
```

## 📂 Project Structure

```
EcoTrack-AI/
├── src/
│   ├── main.js          # App logic, DOM, history
│   ├── style.css         # All styles
│   └── risk-engine.js    # Risk calculation (client-side)
├── lambda/
│   └── risk.mjs          # Lambda handler (server-side)
├── public/
│   └── favicon.svg
├── template.yaml         # AWS SAM template
├── index.html            # Entry HTML
├── package.json
└── README.md
```

## 🧮 How Risk Is Calculated

### Heat Risk
1. Compute an approximated **Heat Index** from temperature and humidity (Rothfusz regression).
2. Classify: ≤27°C = Low, ≤33°C = Moderate, ≤41°C = High, >41°C = Severe.

### Rain Risk
1. Compute **Effective Rainfall** = rainfall × wind amplification factor.
2. Classify: ≤15mm = Low, ≤64mm = Moderate, ≤115mm = High, >115mm = Severe.

### Overall
The **higher** of the two risk levels determines the overall readiness level.

## 🎬 Demo Story

> "EcoTrack AI helps neighbourhoods act before dangerous heat or heavy rain. A user enters local conditions, receives an understandable readiness score, and gets immediate safety actions. The calculation runs through an AWS SAM local serverless API, so the project is built with AWS tooling without requiring paid cloud resources."

## ⚠️ Disclaimer

**This is a decision-support tool, not an official weather warning.** Always follow guidance from your local meteorological department and disaster management authority.

## 📄 License

MIT
