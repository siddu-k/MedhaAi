# 🧠 Tyloop AI — Full Application Features & Functional Overview

**Tyloop AI** is an **autonomous multi-modal desktop AI workstation and interactive visual learning platform** designed to transform abstract technical concepts into rich, interactive, and spatial learning experiences.

The application integrates real-time conversational AI, an embodied 3D avatar with speech viseme synchronization, 2D vector diagrams, 3D spatial WebGL coordinate simulations, automated presentation deck synthesis, dynamic PDF/document assessment quizzes, and an interactive split-screen mock technical interview simulator.

---

## 🎭 1. Embodied 3D Avatar & Real-Time Viseme Lip Sync

- **Viseme Lip-Sync Architecture**: Incorporates real-time audio frequency analysis to drive facial morph targets (mouth shapes corresponding to vowels and consonants) with smooth lerping.
- **Natural Micro-Animations**: Includes ambient breathing, idle torso motion, and randomized eye-blinking loops.
- **Avatar Customizer Studio**: In-app studio modal allowing users to customize hair color, skin tone, eye glow, clothing shaders, and dynamic lighting rigs (Crisp Studio, Cyber Glow, Warm Amber).
- **Voice-to-Voice Loop**: Hands-free conversation through browser Speech-to-Text (STT) and sentence-chunked Text-to-Speech (TTS).

---

## 📐 2. Multi-Dimensional Smart Board (2D Vector & 3D Spatial)

- **2D Vector Engine (Mermaid.js + KaTeX)**:
  - Generates interactive flowcharts, architecture diagrams, sequence diagrams, class models, and state machine graphs.
  - Supports LaTeX / KaTeX mathematical formula rendering.
  - Vector clarity with up to 3000% zoom and panning navigation.
- **3D Spatial Studio (Three.js WebGL + OrbitControls)**:
  - Procedural 3D scene engine executing dynamic AI-generated Three.js simulation code in real time.
  - Renders 3-axis coordinate models, planetary orbital mechanics, neural network synaptic layers, molecular geometry, and physics wave simulations.
  - Full user manipulation via 3-axis rotation, panning, and zoom.
- **Draggable Multi-Pane Layout**:
  - Flexible split-stage environment allowing concurrent viewing of visual canvases, chat reasoning, and the 3D avatar.

---

## 📊 3. AI Slide Deck Studio (Presentation Mode)

- **Automated Deck Synthesis**: Ingests prompts, research notes, or codebases to generate structured, multi-slide technical presentations.
- **Interactive Presentation Controls**:
  - Fullscreen presentation mode with keyboard arrow navigation.
  - Progress bar and slide indicator.
  - Formatted bullet points, key complexity takeaways, and architecture diagrams.
- **Embedded Presenter Co-Pilot**:
  - Integrated chat assistant for contextual slide Q&A and on-the-fly revisions.
  - One-click export to Markdown or presentation artifacts.

---

## 🎯 4. AI Assessment & Document/PDF Quiz Mode

- **Document & PDF Ingestion**: Parses lecture notes, textbook chapters, documentation, and source code files directly in the browser.
- **Dynamic Assessment Generator**: Formulates rigorous multiple-choice questions with randomized distractor analysis and conceptual problem-solving.
- **Interactive Evaluation Studio**:
  - Instant grading percentages and mechanical rationales for each option.
  - Audio question readouts.
  - Quiz archive integrated into chat session history for continuous revision and testing.

---

## 💼 5. AI Mock Technical Interview Simulator

- **Dual Video Call Stage**:
  - Split-screen video interface displaying the 3D AI Interviewer alongside the candidate's live webcam video feed.
- **Role-Tailored Scenarios**:
  - Simulates high-pressure technical interviews for Software Engineering, System Architecture, Algorithms, DevOps, and Machine Learning.
- **Real-Time Conversational Loop**:
  - Voice-driven turn-taking with live transcripts.
  - Post-interview candidate scorecard assessing communication clarity, architectural depth, and algorithmic correctness.

---

## ⚡ 6. Dual Inference Engine (Cloud + 100% Offline Local)

- **Google GenAI (Gemini Cloud API)**:
  - High-throughput multimodal processing with `@google/genai` (`gemini-3.5-flash-lite`).
  - Sub-second streaming token decoder via Web Streams API.
  - Structured output generation for 2D Mermaid specs and Three.js 3D scripts.
- **Ollama Local Engine (100% Offline)**:
  - Direct HTTP streaming to local Ollama daemon (`http://localhost:11434`).
  - In-app model manager with streaming download percentage progress.
  - Support for open-weight models (Qwen 2.5 Coder, Llama 3.2, DeepSeek, Mistral) with zero network requirement and absolute privacy.

---

## 🔒 7. Privacy, Data Sovereignty & Offline Autonomy

- Zero cloud tracking or data lock-in when operating with local Ollama models.
- All session chat history, custom avatar configurations, and quiz records are preserved locally on the user's workstation.
- Private Supabase synchronization can be enabled for multi-device workflows.

---

## ⚙️ 8. Technology Stack Summary

- **Desktop Framework**: Electron 31
- **Frontend Architecture**: React 19, Vite 8, Tailwind CSS v4, Lucide Icons
- **3D Graphics & Spatial Mechanics**: Three.js, React Three Fiber, Drei, WebGL
- **Audio & Visemes**: `wawa-lipsync`, Web Audio API, Web Speech API
- **Inference**: Google GenAI SDK + Native Ollama HTTP API
- **State Store**: Zustand with localStorage serialization
