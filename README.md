# Tyloop AI 🌀

> **Autonomous Multi-Modal Desktop AI Platform**  
> *Don't just read theory. Visualize, interact, and master concepts.*

---

## 🌟 Overview

**Tyloop AI** is an advanced multimodal desktop workstation designed to transform human-AI interaction from static, text-only chat into an immersive, multi-dimensional visual and spatial experience. 

Powered by a **Dual Inference Engine** (Google Gemini Cloud API + 100% Offline Local Ollama), Tyloop AI pairs high-velocity reasoning with an interactive **3D Talking Avatar**, **2D/3D Smart Boards**, **AI Slide Deck Studio**, **AI Assessment Quiz Engine**, and a **Split-Screen Mock Technical Interviewer**.

---

## ✨ Core Pillars & Features

### 1. 🤖 Embodied 3D Avatar & Real-Time Lip-Sync
- **Frequency-to-Viseme Mapping**: Uses real-time audio frequency analysis to drive accurate mouth visemes (`A`, `E`, `I`, `O`, `U`, consonants).
- **Smooth Morph Target Blending**: 60 FPS interpolated animations with natural eye-blinking and ambient head physics.
- **In-App Avatar Customizer Studio**: Customize skin tones, hair colors, eye colors, apparel shaders, and lighting setups (Crisp Studio, Cyber Glow, Warm Amber).
- **Voice-to-Voice Conversation**: Natural, hands-free turn-taking with native Speech-to-Text and low-latency chunked Text-to-Speech.

### 2. 📐 Multi-Dimensional Smart Board (2D & 3D)
- **2D Vector Engine (Mermaid & KaTeX)**: Generate dynamic flowcharts, architecture topologies, sequence diagrams, class trees, state machines, and mathematical formulas with 3000% zoom vector rendering.
- **3D Spatial Studio (WebGL & Three.js)**: Generate real-time procedural 3D simulations (planetary motion, neural network layers, molecular lattices, physics mechanics) with full `OrbitControls` (rotate, pan, zoom).
- **Hardware-Accelerated Split Screen**: Flexible draggable divider allowing concurrent visualization, chat reasoning, and 3D presence.

### 3. 🎯 AI Assessment & Document/PDF Quiz Studio
- **Document & PDF Ingestion**: Ingest textbook chapters, lecture slides, code files, or markdown notes.
- **Dynamic Assessment Generator**: Generates rigorous multi-question technical assessments with randomized distractor analysis.
- **Interactive Evaluation**: Real-time scoring percentages, instant rationales, text-to-speech question reading, and revision tracking.

### 4. 📊 AI Slide Deck Studio
- **Automated Presentation Synthesis**: Generate complete, multi-slide technical presentations from any topic, prompt, or codebase.
- **Presenter Mode**: High-resolution presentation view with keyboard controls, timer tracking, and embedded slide co-pilot.
- **One-Click Export**: Export decks directly to Markdown or formatted presentation artifacts.

### 5. 💼 Mock Technical Interview Simulator
- **Dual Video Call Interface**: Side-by-side video stage featuring the 3D AI Interviewer alongside the candidate's live webcam video feed.
- **Role-Tailored Scenarios**: Simulates rigorous interviews for Software Engineering, System Architecture, Algorithms, Machine Learning, and DevOps.
- **Real-Time Assessment**: Live transcription, conversational turn-taking, and detailed evaluation scorecards.

### 6. ⚡ Dual Inference Engine (Cloud + 100% Offline Local)
- **Google GenAI (Gemini Cloud API)**: Ultra-fast multimodal processing with `@google/genai` (`gemini-3.5-flash-lite`), streaming responses, and structured 2D/3D code synthesis.
- **Ollama Local Engine (100% Offline)**: Direct HTTP streaming to `localhost:11434`. Pull and execute open-weights models (e.g. Qwen 2.5 Coder, Llama 3.2, DeepSeek, Mistral) with zero network requirements and absolute data privacy.

---

## 🛠️ Technology Stack

| Domain | Technologies |
|---|---|
| **Desktop Runtime** | Electron 31 (Native OS integration, cross-platform) |
| **Frontend Core** | React 19, Vite 8, Tailwind CSS v4, Lucide Icons |
| **3D & Graphics** | Three.js, React Three Fiber (`@react-three/fiber`), Drei, WebGL |
| **Lip-Sync & Audio** | `wawa-lipsync`, Web Audio API frequency analysis, Web Speech API |
| **Cloud Inference** | Google GenAI SDK (`@google/genai`) |
| **Local Inference** | Ollama Native HTTP API (`/api/chat`, `/api/pull`) |
| **Diagrams & Math** | Mermaid.js, KaTeX, Remark-GFM, Rehype-KaTeX |
| **State & Store** | Zustand with localStorage persistence and Supabase integration |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0 or higher
- **Package Manager**: npm or yarn
- *(Optional)* **Ollama**: For 100% offline local inference ([ollama.com](https://ollama.com))
- *(Optional)* **Google Gemini API Key**: Free at [Google AI Studio](https://aistudio.google.com/app/apikey)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/TYLOOPAI.git
cd TYLOOPAI

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite Development Server
npm run dev

# Start Electron Desktop App
npm run electron:dev

# Production Build
npm run build
```

---

## 🧭 Navigation & Workflow

- **Visualize & Learn**: Launch interactive 2D diagramming or 3D spatial simulation sessions.
- **2D Vector Visualizer**: Focus on Mermaid flowcharts, architecture diagrams, and mathematical models.
- **3D Spatial Studio**: Explore procedural Three.js simulations generated dynamically by AI.
- **AI Assessment & Quiz**: Test your mastery of concepts from notes, PDFs, or generated topics.
- **AI Slide Deck Studio**: Create and present multi-slide decks with live presenter co-pilot.
- **Mock Interview**: Practice technical and job interviews with webcam and audio interaction.
- **Settings**: Configure Google Gemini API keys, manage local Ollama models with live progress bars, and customize your 3D avatar.

---

## 🔒 Privacy & Architecture

Tyloop AI gives users total control over their data:
- When using **Local AI (Ollama)**, all prompt completions and embeddings remain strictly on your local machine.
- All session chat history and avatar customization preferences are stored locally in your browser storage or private backend.
