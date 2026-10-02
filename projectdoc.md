# Tyloop Project Architecture & Specification Document

This document is the definitive technical blueprint and specification for the **Tyloop AI** application. It contains every technical specification, architecture detail, and core code snippet required for the system.

---

## 1. Project Overview
Tyloop is an Electron-based multi-modal AI desktop platform and interactive learning workstation featuring an embodied 3D avatar with real-time lip-syncing, voice-to-voice interaction, 2D/3D visual learning engines, generative slide deck studio, assessment quiz generator, mock technical interview simulator, and dual inference management (Cloud Gemini + Offline Ollama).

---

## 2. Technical Stack
- **Frontend**: React 19, Vite 8, Tailwind CSS 4.
- **Desktop**: Electron 31 (Main/Renderer architecture).
- **State**: Zustand (Session, Voice, Visualization, Quiz, PPT, and Model states).
- **3D/Graphics**: Three.js, React Three Fiber (R3F), Drei, WebGL OrbitControls.
- **Lip Sync & Audio**: `wawa-lipsync` (Audio-to-Viseme mapping), Web Audio API, Web Speech STT/TTS.
- **Diagrams & Math**: Mermaid.js, KaTeX, React-Markdown.
- **Backend & Persistence**: Supabase (PostgreSQL, Storage) + LocalStorage.
- **Inference Engines**: Google GenAI SDK (`@google/genai`) and Local Ollama (HTTP streaming via fetch API).

---

## 3. UI/UX Design System (Zinc Dark)
- **Theme**: Shadcn-inspired Zinc 950 Dark.
- **Background**: `#09090b`
- **Surface/Card**: `#18181b` (Zinc 900)
- **Primary Accent**: `#fafafa` (Zinc 50)
- **Borders**: `#27272a` (Zinc 800)
- **Status Accents**: Emerald (`#10b981`), Cyan (`#06b6d4`), Amber (`#f59e0b`), Indigo (`#6366f1`)
- **Glassmorphism**: 
  ```css
  .glass-panel {
    background-color: rgba(9, 9, 11, 0.8);
    backdrop-filter: blur(12px);
    border: 1px solid #27272a;
  }
  ```

---

## 4. Core Services Logic

### A. Dual AI Management
Tyloop provides a unified interface for both cloud and local models:

1. **Google Gemini (`geminiService.js`)**:
   - Uses `@google/genai` with `gemini-3.5-flash-lite`.
   - Streams responses via the Web Streams API for instant visual and token output.
   - Generates structured code blocks for Mermaid diagrams and procedural Three.js 3D scenes.

2. **Local Ollama (`ollamaService.js`)**:
   - Interacts directly with local Ollama daemon (`http://localhost:11434`).
   - Stream chat via `/api/chat` with `stream: true`.
   - Live model pulling via `/api/pull` with streaming progress byte calculation:
     ```javascript
     const response = await fetch('http://localhost:11434/api/pull', {
         method: 'POST',
         body: JSON.stringify({ name: modelName, stream: true })
     });
     const reader = response.body.getReader();
     // Parses chunks: { status: "downloading", completed: 123, total: 456 }
     ```

### B. Voice-to-Voice Stack (`voiceService.js`)
- **STT**: Native browser `SpeechRecognition` / `webkitSpeechRecognition` API.
- **TTS**: High-quality audio via chunked sentence proxy or Web Speech synthesis:
  - **Chunking**: Text is segmented by punctuation (`.?!`) and processed sequentially for zero perceived latency.
- **Lip Sync Integration**: Each `Audio` instance connects to `lipsyncManager.connectAudio(currentAudio)` before playback.

---

## 5. 3D Avatar & Lip Sync Implementation

### 3D Avatar Core (`DoctorAvatar.jsx` / `AvatarScene.jsx`)
Handles 3D model loading, custom material shaders, and viseme morph target interpolation:

```javascript
import { useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { lipsyncManager } from '../../services/lipsyncService';

export function DoctorAvatar(props) {
    const { nodes, scene } = useGLTF('/models/avatar.glb');
    const group = useRef();

    useFrame(() => {
        // Real-time lip sync mapping from audio spectrum
        lipsyncManager.processAudio();
        const { viseme } = lipsyncManager;

        scene.traverse((child) => {
            if (child.isSkinnedMesh && child.morphTargetDictionary) {
                const index = child.morphTargetDictionary[viseme];
                if (index !== undefined) {
                    child.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                        child.morphTargetInfluences[index], 1, 0.3
                    );
                }
                // Interpolate non-active visemes back to zero
                Object.keys(child.morphTargetDictionary).forEach(key => {
                    if (key !== viseme) {
                        const idx = child.morphTargetDictionary[key];
                        child.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                            child.morphTargetInfluences[idx], 0, 0.1
                        );
                    }
                });
            }
        });
    });

    return <primitive object={nodes.Hips} ref={group} />;
}
```

---

## 6. Functional Page & Feature Map

### 1. Dashboard (`DashboardPage.jsx`)
- **Interactive Multi-Pane Layout**: Draggable dividers between the smart board / 3D spatial canvas, synchronized AI chat panel, and 3D avatar scene.
- **Visualize Mode**: Toggles between 2D Mermaid Blackboard and 3D Three.js Spatial Studio.
- **Ppt Mode**: Embeds the full-screen AI Slide Deck Viewer with presenter navigation.
- **Quiz Mode**: Embeds the interactive assessment studio with real-time scoring.

### 2. Smart Board & Spatial Studio
- **2D Vector Visualizer (`MermaidBoard.jsx`)**: Renders architecture diagrams, flowcharts, and KaTeX equations with high-resolution pan/zoom.
- **3D Spatial Studio (`CanvasEngine3D.jsx`)**: Procedural WebGL runtime with camera `OrbitControls` executing dynamic AI-generated Three.js simulations.

### 3. AI Slide Deck Studio (`PptDeckViewer.jsx`, `PptSetupModal.jsx`)
- Generates structured, multi-slide presentation decks from topics or documents.
- Includes slide navigation, presentation counter, full-screen mode, and slide co-pilot.

### 4. Assessment Quiz Mode (`QuizViewer.jsx`, `QuizSetupModal.jsx`)
- Ingests PDFs, documents, or custom topics.
- Generates comprehensive multiple-choice questions with automated scoring, question audio readouts, and detailed rationales.

### 5. Mock Interview (`InterviewSetup.jsx`, `UserVideo.jsx`)
- Dual video interface featuring user webcam video and the AI interviewer avatar.
- Role-tailored question generation with hands-free voice question-and-answer loop.

### 6. Settings (`SettingsPage.jsx`)
- **Google GenAI Tab**: Manage API keys, test connection, and toggle model presets.
- **Local AI Tab**: Real-time Ollama model downloading, progress monitoring, and active model selection.
- **Avatar Customizer Modal**: Customize hair color, skin tone, eye glow, clothing shaders, and studio lighting presets.

---

## 7. Database Schema (Supabase)
- `profiles`: User information, display name, educational level, study preferences, and avatar configurations.
- `chat_sessions`: Session metadata, active model, title, and session mode (chat, visualize, ppt, quiz, interview).
- `chat_messages`: Full message history with support for markdown, attachments, diagrams, and code snippets.
- `quizzes`: Saved quizzes, questions, options, rationales, and user scores.
- `ppt_decks`: Saved slide decks, slide JSON schemas, and presentation themes.
- `visual_boards`: Saved 2D vector diagrams and 3D simulation source scripts.

---

*This document is the definitive source of truth for the Tyloop AI architecture.*
