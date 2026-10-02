# Tyloop AI — Implementation Roadmap & Architecture Plan

This roadmap provides the chronological engineering breakdown for building and expanding the **Tyloop AI** multi-modal platform.

---

### **Phase 1: Environment & Foundation**
**Goal**: Set up development pipelines, desktop runtime, and design foundations.
1. **Project Initialization**:
   - Configure Electron + Vite + React 19 architecture.
   - Install core dependencies: `three`, `@react-three/fiber`, `@react-three/drei`, `zustand`, `wawa-lipsync`, `@google/genai`, `mermaid`, `katex`.
2. **Tailwind 4 Setup**:
   - Establish Zinc Dark Theme system tokens in `index.css`.
   - Setup glassmorphic surface styles and responsive layouts.
3. **Electron Main Process**:
   - Implement `electron/main.js` for native OS window handling, display configurations, and IPC communication.

---

### **Phase 2: Data Store & Dual Inference Engine**
**Goal**: Connect local offline models and cloud inference channels.
1. **Zustand State Store (`appStore.js`)**:
   - Implement local persistence for user preferences, active sessions, audio calibrations, and avatar styling.
2. **Inference Dispatchers**:
   - **Google Gemini (`geminiService.js`)**: Web Streams streaming parser for multimodal reasoning and code synthesis.
   - **Ollama Engine (`ollamaService.js`)**: Direct HTTP client to `localhost:11434` with model pulling stream parser and model downloader progress bars.

---

### **Phase 3: Embodied 3D Avatar & Audio Lip-Sync**
**Goal**: Build the hardware-accelerated interactive 3D presence.
1. **GLTF Avatar Loading**:
   - Load optimized GLTF avatar mesh and animation clips via `@react-three/drei`.
2. **Lighting & Material Customization**:
   - Studio lighting rigs (Crisp Studio, Cyber Glow, Warm Amber).
   - Dynamic shader material recoloring for hair, skin, eyes, and clothing.
3. **Real-time Viseme Lip-Sync**:
   - Integrate `wawa-lipsync` audio analyzer mapping speech frequencies to facial blendshapes with smooth lerping.
4. **Voice Service**:
   - Speech-to-Text (STT) via Web Speech API and sentence-chunked low-latency Text-to-Speech (TTS).

---

### **Phase 4: Multi-Dimensional Smart Board (2D & 3D)**
**Goal**: Real-time visual and spatial concept synthesis.
1. **2D Vector Blackboard (`MermaidBoard.jsx`)**:
   - Render Mermaid diagrams (flowcharts, sequence, class, state) and KaTeX math formulas with pan/zoom navigation.
2. **3D Spatial Studio (`CanvasEngine3D.jsx`)**:
   - Three.js procedural WebGL stage with `OrbitControls` for interactive spatial simulations generated dynamically by AI.
3. **Draggable Split-Screen**:
   - Responsive multi-column layout allowing simultaneous viewing of visual canvases, chat reasoning, and the 3D avatar.

---

### **Phase 5: Generative Slide Deck & Quiz Studios**
**Goal**: Automated presentations and autonomous evaluation.
1. **AI Slide Deck Studio (`PptDeckViewer.jsx`)**:
   - Automated presentation deck generator with full-screen presentation mode, slide co-pilot, and markdown export.
2. **Assessment Quiz Mode (`QuizViewer.jsx`)**:
   - PDF and document ingestion with dynamic multiple-choice question generation, automatic grading, and detailed explanations.

---

### **Phase 6: Mock Technical Interviewer**
**Goal**: Real-time career and technical interview practice.
1. **Split-Screen Video Call Interface**:
   - Side-by-side layout displaying the candidate's webcam feed alongside the 3D AI interviewer avatar.
2. **Role-Tailored Prompts & Evaluation**:
   - Adaptive questioning with live voice loop, automated transcripts, and candidate evaluation scorecards.

---

### **Phase 7: Polishing, Packaging & Verification**
**Goal**: Optimization and production readiness.
1. **Performance**: 60 FPS Three.js rendering loops, memory leak prevention, and model unloading.
2. **Desktop Packaging**: Verification of Electron build packaging and offline operation.
