# 🌍 EcoTrack AI — Neighbourhood Heat & Rain Readiness Workstation

> A community decision-support platform that evaluates hyper-local heat stress and heavy-rain flood vulnerabilities, renders transparent biometeorological analytics, provides interactive disaster protocols, and features an on-device local AI environmental assistant.

**Built for [Environmental Hacks 2026](https://www.wemakedevs.org/aws/env) · Track: Heat & Water**  
*Requirement: Demonstrates AWS open-source serverless tooling (AWS SAM CLI local API) with zero paid cloud resources.*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://abhas-blitz.github.io/EcoTrack-AI-Environmental-Hacks/)
[![AWS SAM](https://img.shields.io/badge/Powered%20By-AWS%20SAM%20CLI%20(Local)-FF9900?style=for-the-badge&logo=amazon-aws)](https://docs.aws.amazon.com/serverless-application-model/)
[![Local AI](https://img.shields.io/badge/Local%20AI-Ollama%20%2B%20Strands-blueviolet?style=for-the-badge&logo=ollama)](https://ollama.ai/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

🔗 **Live Hosted Dashboard:** [https://abhas-blitz.github.io/EcoTrack-AI-Environmental-Hacks/](https://abhas-blitz.github.io/EcoTrack-AI-Environmental-Hacks/)  
📦 **Public Repository:** [https://github.com/Abhas-blitz/EcoTrack-AI-Environmental-Hacks](https://github.com/Abhas-blitz/EcoTrack-AI-Environmental-Hacks)

---

## 💡 Overview & Problem Statement

Urban neighbourhoods face twin climate risks: sudden extreme **heat waves** and torrential **monsoon cloudbursts**. Citizens and local community leaders often lack transparent, actionable tools to understand their immediate risk levels and coordinate household protections.

**EcoTrack AI** addresses this gap by combining:
1. **Deterministic Biometeorology**: Transparent calculations for Apparent Heat Index, Wet-Bulb stress, and wind-amplified runoff.
2. **Actionable Neighbourhood Preparedness**: Dynamic checklists, Go-Bag tracking, and one-click WhatsApp community bulletins.
3. **Local Privacy-Preserving AI Assistant**: An on-device assistant (powered by Strands Agents + Ollama `llama3.2:3b`) answering environmental and waste management queries without sending personal data to the cloud.
4. **AWS Serverless Architecture (₹0 Cost)**: An AWS SAM local Lambda API delivering serverless computing without paid cloud infrastructure.

---

## ✨ Key Features

### 1. 📊 Cockpit & Overview (Desktop Workstation)
- **Executive Telemetry Strip**: Real-time readings for **Thermal Stress Feels-Like (°C)**, **Effective Runoff (mm)**, **Wet-Bulb Limit ($T_w$)**, and **Readiness Severity (1–4)**.
- **Dynamic Speedometer Gauge**: Animated SVG gauge indicating hazard tiers (*Low, Moderate, High, Severe*).
- **Dual Meteorological Input Controls**: Synchronized numeric inputs & range sliders across 10 Indian metropolitan hubs (Delhi, Mumbai, Chennai, Bengaluru, Kolkata, Hyderabad, Ahmedabad, Pune, Kochi, Jaipur).
- **Satellite & GPS Telemetry**: Real-time satellite weather fetching via the open-source Open-Meteo API, plus browser GPS coordinate auto-detection.

### 2. 🌱 "Ask EcoTrack AI" Local Assistant
- **On-Device Environmental Intelligence**: Powered by **Strands Agents** connected to a local **Ollama** server running `llama3.2:3b`.
- **Context-Aware Responses**: Automatically injects current dashboard temperature, rainfall, and hazard levels into the prompt context for hyper-relevant guidance.
- **100% Free & Private**: Runs entirely on `127.0.0.1:8000` and `127.0.0.1:11434`; no cloud token costs, no subscriptions, no data exfiltration.

### 3. 🛡️ Safety Protocols & Action Hub
- **Prioritized Action Cards**: Tailored guidelines for household protection, storm drainage, and vulnerable populations.
- **72-Hour Emergency Go-Bag Checklist**: Interactive packing checklist (water, ORS, torch, power bank, documents, radio) with persistent storage.
- **Community Broadcast Builder**: One-click emoji-formatted WhatsApp and Telegram alerts ready to share with apartment and neighbourhood groups.

### 4. 🔮 Meteorology Lab & "What-If" Sandbox
- **3-Hour Escalation Simulator**: Instant scenario triggers for *+4°C Heatwave Spike*, *+50mm Cloudburst Surge*, *+35 km/h Squall*, and *-6°C Evening Cool-down*.
- **Wet-Bulb Temperature ($T_w$) Calculator**: Computes physiological evaporative limits using the empirical **Stull (2011)** formulation.
- **Full Equation Transparency**: Complete formula breakdown displaying Rothfusz polynomials and runoff velocity vectors.

### 5. 🚨 Emergency Helplines & Field First-Aid
- **Direct Indian Emergency Numbers**: One-click copy for `112` (National Emergency), `1078` (NDRF), `1070` (SDMA), `108` (Ambulance), `1912` (Power Safety), and `1077` (District Flood Control).
- **Heat Exhaustion vs. Heatstroke Clinical Matrix**: Rapid diagnostic symptoms and cooling protocols.

### 6. 📋 History & Analytics
- Complete local audit table with timestamps, metrics, and instant **"Replay"** buttons to reload previous assessments.
- One-click **CSV Data Export** for logging and municipal reporting.

### 7. ☁️ AWS SAM Local Serverless Console
- Built-in API inspector testing `POST http://127.0.0.1:3000/assess`.
- Live latency probe, request payload editor, and response viewer demonstrating local AWS Lambda execution.

---

## 🛠 Tech Stack & Architecture

| Layer | Component | Description |
| :--- | :--- | :--- |
| **Frontend** | Vite + Vanilla JS + CSS3 | Desktop workstation with light/dark modes and multi-page routing |
| **Serverless API** | AWS SAM CLI + Node.js 20.x | Local Lambda endpoint (`lambda/risk.mjs` and `template.yaml`) |
| **Local AI Backend** | FastAPI + Python 3.12 | REST API handling chat and prompt orchestration (`backend.py`) |
| **AI Agent** | Strands Agents | Local agent framework interfacing with LLM |
| **LLM Inference** | Ollama (`llama3.2:3b`) | On-device 3-billion parameter model running on port `11434` |
| **Weather Telemetry** | Open-Meteo API | Free, open-source real-time satellite and station feeds |
| **Hosting & CI/CD** | GitHub Pages + GitHub Actions | Automated build and deployment pipeline |
| **Cost** | ₹0 / $0 | Completely free using local compute and open-source tooling |

### System Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Vite Desktop Dashboard                    │
│                  (http://localhost:5173)                    │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
     HTTP POST │                    HTTP POST │
   (Weather)   │                 (AI Prompt)  │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      AWS SAM Local API       │ │      FastAPI Backend       │
│      (Port 3000 / Lambda)    │ │        (Port 8000)         │
├──────────────────────────────┤ ├────────────────────────────┤
│ • Rothfusz Heat Index        │ │ • Strands Agent Framework  │
│ • Stull Wet-Bulb Equation    │ │ • Dashboard Context Inject │
│ • Wind-Shear Runoff Vector   │ └──────────────┬─────────────┘
└──────────────────────────────┘                │ HTTP (Ollama)
                                                ▼
                                 ┌────────────────────────────┐
                                 │     Ollama Local LLM       │
                                 │       (Port 11434)         │
                                 │     Model: llama3.2:3b     │
                                 └────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **Python**: 3.10+
- **Ollama**: Installed and running ([ollama.ai](https://ollama.ai/))

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Abhas-blitz/EcoTrack-AI-Environmental-Hacks.git
cd EcoTrack-AI-Environmental-Hacks
```

---

### Step 2: Start the Local AI Assistant
1. Ensure Ollama is running and the model is downloaded:
   ```bash
   ollama pull llama3.2:3b
   ```
2. Activate your Python environment and install backend dependencies:
   ```bash
   pip install fastapi uvicorn pydantic strands-agents
   ```
3. Run the FastAPI assistant service:
   ```bash
   python -m uvicorn backend:app --port 8000
   ```

---

### Step 3: Run the AWS SAM Local Serverless Runner
To test the AWS Lambda endpoint locally without paid cloud infrastructure:
```bash
npm run lambda:local
```
*(Or use native AWS SAM CLI if Docker is installed: `sam build && sam local start-api`)*

---

### Step 4: Launch the Frontend
In a new terminal window:
```bash
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧮 Mathematical & Meteorological Formulations

### 1. Apparent Heat Index ($HI$) — Rothfusz Polynomial
For ambient temperature $T \ge 27^\circ\text{C}$ and relative humidity $H$:
$$HI = -8.7847 + 1.6114T + 2.3385(0.01H)T - 0.1461(0.01H)^2T - 0.0123T^2 + 0.0164(0.01H)T^2 + \dots$$
- **Low**: $\le 27^\circ\text{C}$ (Normal / Caution)
- **Moderate**: $28 - 33^\circ\text{C}$ (Extreme Caution)
- **High**: $34 - 41^\circ\text{C}$ (Danger / Heat Exhaustion likely)
- **Severe**: $> 41^\circ\text{C}$ (Extreme Danger / Heatstroke risk)

### 2. Wet-Bulb Temperature ($T_w$) — Stull (2011) Formulation
$$T_w = T \cdot \text{atan}\left(0.151977\sqrt{H + 8.313659}\right) + \text{atan}(T + H) - \text{atan}(H - 1.676331) + 0.00391838 \cdot H^{1.5} \cdot \text{atan}(0.023101H) - 4.686035$$
Indicates human evaporative cooling thresholds. Values exceeding **$31^\circ\text{C}$** denote severe thermal danger where natural sweating cooling breaks down.

### 3. Effective Precipitation Runoff ($R_{\text{eff}}$)
$$R_{\text{eff}} = R \times \left(1 + \frac{\min(\max(W - 10, 0), 100)}{180}\right)$$
Adjusts precipitation ($R$) for wind shear ($W$), accounting for horizontal roof interception and drainage inlet velocity.

---

## 🎬 3-Minute Hackathon Demo Narrative

> *"EcoTrack AI is a neighbourhood environmental decision-support workstation created for Environmental Hacks 2026. A user selects their city or taps 'GPS' to stream live satellite weather. The dashboard evaluates heat index, wet-bulb thresholds, and storm runoff across an animated speedometer gauge and interactive action cards. For hyper-local guidance, the 'Ask EcoTrack AI' chat uses Strands Agents and a local Ollama llama3.2:3b model to advise on safe waste disposal and storm recovery. The entire assessment runs through an AWS SAM serverless Lambda endpoint on port 3000, demonstrating AWS tooling with zero cloud cost."*

---

## ⚠️ Disclaimer

**Decision-support tool only.** EcoTrack AI provides advisory insights based on standard meteorological models. It does not replace official statutory alerts from the India Meteorological Department (IMD) or State/National Disaster Management Authorities.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
