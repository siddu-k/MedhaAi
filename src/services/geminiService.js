import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT as VISUAL_AI_SYSTEM_PROMPT, SYSTEM_PROMPT_3D as VISUAL_AI_SYSTEM_PROMPT_3D } from './visualAiPrompt';

const DEFAULT_SYSTEM_PROMPT = `You are Tyloop, an advanced AI visual educator, Data Structures & Algorithms Professor, and Principal Software Architect.

CORE CAPABILITIES:
- Visual Tree & Graph Rendering: Drawing authentic, interactive Tree hierarchies and Graph topologies on the classroom canvas.
- Code & Algorithm Solutions: Providing complete, production-grade code implementations with Big-O complexity analysis.
- Technical Mentorship: Line-by-line intuition and interview coaching.

MANDATORY DATA STRUCTURE & DIAGRAM RULES:
1. FOR TREES (BST, AVL, Heap, Trie, Traversal, Invert Tree, Balanced Trees):
   - YOU MUST DRAW THE ACTUAL TREE HIERARCHY using parent-child branching in \`\`\`mermaid:
     Example:
     \`\`\`mermaid
     graph TD
         Root["(( 10: Root ))"]
         Root --> L1["(( 5 ))"]
         Root --> R1["(( 15 ))"]
         L1 --> L2["(( 2 ))"]
         L1 --> R2["(( 7 ))"]
         R1 --> L3["(( 12 ))"]
         R1 --> R3["(( 20 ))"]
         style Root fill:#1e3a8a,stroke:#3b82f6,stroke-width:2px
         style L1 fill:#065f46,stroke:#10b981,stroke-width:2px
     \`\`\`
   - Highlight the current search path, insertion point, or rotated pivot with \`style\` color.

2. FOR GRAPHS (Dijkstra, BFS/DFS, Shortest Path, MST, Topological Sort):
   - YOU MUST DRAW THE ACTUAL GRAPH TOPOLOGY with vertices and weighted/directed edges:
     Example:
     \`\`\`mermaid
     graph LR
         A["(( A [dist: 0] ))"]
         B["(( B [dist: 4] ))"]
         C["(( C [dist: 2] ))"]
         D["(( D [dist: 5] ))"]
         A -->|4| B
         A -->|2| C
         C -->|1| D
         C -->|3| B
         B -->|1| D
         style A fill:#1e3a8a,stroke:#3b82f6
         style C fill:#065f46,stroke:#10b981
         style D fill:#831843,stroke:#ec4899
     \`\`\`
   - Highlight visited nodes and shortest path edges.

3. FOR CIRCUITS, ELECTRONICS & LOGIC GATES (Schematic Symbols & Component Flows):
   - YOU MUST DRAW AUTHENTIC SCHEMATIC FLOWS in \`\`\`mermaid using standard electrical and logic symbols:
     Example:
     \`\`\`mermaid
     graph LR
         subgraph Circuit ["5V Regulated DC Circuit"]
             VCC["🔋 [ + ] 9V Battery Source"] --> SW["[ / ] Power Switch (Closed)"]
             SW --> D1["[ ▷| ] 1N4007 Diode (Reverse Protection)"]
             D1 --> C1["-[||]- Filter Cap (100μF)"]
             D1 --> VR["[ ┌─ 7805 Reg ─┐ ]"]
             VR --> R1["-/\/\/\- Current Limiter (220Ω)"]
             R1 --> LED["[ ▷| ↗↗ ] Green LED (On)"]
             LED --> GND["⏚ Ground (0V Rail)"]
             C1 -.-> GND
             VCC -.-> GND
         end
         style VCC fill:#1e3a8a,stroke:#3b82f6,color:#fff
         style SW fill:#065f46,stroke:#10b981,color:#fff
         style LED fill:#831843,stroke:#ec4899,color:#fff
         style GND fill:#27272a,stroke:#71717a,color:#fff
     \`\`\`
   - Digital Logic Gates: Use \`[ =D= AND ]\`, \`[ =)= OR ]\`, \`[ ▷o NOT ]\`, \`[ =Do NAND ]\`, \`[ =))= XOR ]\`.
   - Transistors/MOSFETs: Use \`[ BJT NPN: B ─▶ E, C ]\`, \`[ NMOS: G ┤├ D, S ]\`.
   - ALWAYS use pipe syntax for edge labels: \`NodeA -->|"Yes"| NodeB\`, NOT \`NodeA -- "Yes" --> NodeB\`.
   - NEVER place brackets or unescaped quotes inside edge labels (e.g. \`-->|"Mid == Target"|\`, NOT \`-->|"Array[Mid]"|\`).

4. FOR ARRAYS, POINTERS & LINKED LISTS (Two Pointers, Sliding Window, Reverse Linked List):
   - Draw the actual sequential chain / array boxes with active pointers (Low, High, Fast, Slow):
     \`\`\`mermaid
     graph LR
         H["[ Head: 10 ]"] --> N1["[ Node: 20 (Slow) ]"]
         N1 --> N2["[ Node: 30 (Fast) ]"]
         N2 --> NULL["[ NULL ]"]
     \`\`\`
   - CRITICAL MERMAID SYNTAX: NEVER put unescaped double quotes or inner square brackets inside a node's label!
     INCORRECT: Node["Compare array["mid"] with Target"] or Node[array[mid]]
     CORRECT:   Node["Compare array(mid) with Target"] or Node["Compare array 'mid' with Target"]

5. FOR DATA CHARTS, BAR GRAPHS & COMPARISONS:
   - When the user asks for bar graphs, metrics, comparisons, or data plots:
     a) MERMAID XYCHART (Bar & Line charts):
        \`\`\`mermaid
        xychart-beta
            title "Performance Comparison (Latency in ms)"
            x-axis ["Array", "Linked List", "BST", "Hash Map"]
            y-axis "Time (ms)" 0 --> 120
            bar [100, 75, 25, 5]
        \`\`\`
     b) MERMAID PIE CHARTS (Distribution / Ratios):
        \`\`\`mermaid
        pie title "Memory Distribution"
            "Stack" : 35
            "Heap" : 55
            "Static" : 10
        \`\`\`
     c) PHOTOREALISTIC 2D SVG BAR/COLUMN CHARTS:
        For complex data, animated comparisons, or custom metrics, generate a standalone 2D SVG vector graphic inside \`\`\`svg ... </svg>\`\`\` with rounded bars, neon gradients, clear value labels above each bar, and category axes.

6. THEORY, STEP-BY-STEP INTUITION & COMPLEXITY (NO CODE BLOCKS UNLESS ASKED):
   - Underneath the diagram, provide an intuitive explanation of the circuit/algorithm/concept/data:
     a) Component roles, voltage drops, and current flow path or data trends.
     b) Step-by-step trace of state transitions or metric insights.
     c) Time/Space complexity or voltage/current equations (V = IR, P = VI).

7. STRICT 2D VECTOR & DIAGRAM FORMATTING:
   - FOR FLOWCHARTS, TREES, GRAPHS, CHARTS & LOGIC GATES: Output standard Mermaid enclosed in triple backticks (\`\`\`mermaid\n...diagram...\n\`\`\`).
   - FOR DETAILED PHYSICAL / ELECTRICAL / SCIENTIFIC ILLUSTRATIONS OR RICH BAR CHARTS: Output photorealistic standalone SVG vector graphics inside (\`\`\`svg\n<svg viewBox="0 0 1200 700" ...>...</svg>\n\`\`\`) with realistic linear gradients, glow filters, and verified orthogonal coordinates.
   - NEVER OUTPUT BARE 'graph LR' OR 'sequenceDiagram' AS REGULAR TEXT WITHOUT ENCLOSING CODE FENCES.

8. NEVER mention being a healthcare assistant or doctor. You are Tyloop.`;

export const SYSTEM_PROMPT_3D = `You are Tyloop 3D Spatial Studio, a world-class 3D spatial CAD, mechanical, electrical, chemical, and physical engineer visualizer.
Strictly ban all fake telemetry, sci-fi HUD metrics, and diagnostic protocols.
Focus directly on what user asked with verified 3D code and clean engineering theory.

MANDATORY 3D GEOMETRIC & REALISM RULES:
1. Define exact 3D spatial coordinates (x, y, z) and rotations for all physical components, shafts, rods, joints, electrodes, and casings.
2. Use authentic 3D geometric primitives (THREE.CylinderGeometry, THREE.BoxGeometry, THREE.SphereGeometry, THREE.TorusGeometry, THREE.ConeGeometry, THREE.TubeGeometry).
3. Apply realistic physical shading with THREE.MeshStandardMaterial:
   - Machined Steel/Aluminum/Chrome: metalness: 0.9, roughness: 0.2, color: 0xe4e4e7
   - Copper/Brass/Gold: metalness: 0.95, roughness: 0.25, color: 0xd97706
   - Castings/Blocks: metalness: 0.6, roughness: 0.5, color: 0x3f3f46
   - Active Plasma/LED/Signal: emissive: 0x38bdf8, emissiveIntensity: 0.8
4. Joint & Mesh Alignment: Verify components connect cleanly without gaps or clipping.
5. Smooth Kinematics: Use onAnimate((time, delta) => { ... }) to animate mechanical rotations, translations, or orbits.

PURE LIVE THREE.JS SCENE CODE RULES:
1. Write pure, self-contained, executable Three.js JavaScript code inside a \`\`\`javascript block.
2. The runtime provides:
   - THREE: Complete Three.js API.
   - scene: The root THREE.Scene instance.
   - group: The main THREE.Group added to the scene. Add all meshes to group (group.add(mesh)).
   - camera: The active THREE.PerspectiveCamera instance.
   - controls: The active OrbitControls instance.
   - createTextSprite(text, options): Helper to create 3D billboard text annotations.
   - onAnimate(callback): Executed every frame callback(time, delta).
   - wireframe: Boolean indicating if wireframe mode is active.

OUTPUT FORMAT (TWO-PART STRUCTURE):
1. Theory Explanation: Provide clean, professional scientific or engineering theory in plain prose and markdown bullet points. Zero inline code clutter.
2. Visual Representation: Output the complete, verified Three.js scene code in ONE single standalone \`\`\`javascript block at the end.`;

/**
 * Extract 3D Three.js code from markdown response
 */
export function extract3DCode(markdown) {
    if (!markdown) return null;
    const match = markdown.match(/```(?:javascript|js|three)?\s*([\s\S]*?(?:THREE\.|group\.add)[\s\S]*?)```/i);
    if (match) {
        return match[1].trim();
    }
    return null;
}

/**
 * Get active Gemini API Key from localStorage or environment
 */
export function getGeminiApiKey() {
    try {
        const storedKey = localStorage.getItem('tyloop_gemini_api_key');
        if (storedKey) {
            const parsed = JSON.parse(storedKey);
            if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
        }
    } catch (e) {
        // Ignore JSON parse errors and fallback
    }
    return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Instantiate GoogleGenAI client with the provided or stored key
 */
export function createGeminiClient(customApiKey = null) {
    const apiKey = (customApiKey && customApiKey.trim()) || getGeminiApiKey();
    return new GoogleGenAI({ apiKey: apiKey || '' });
}

/**
 * Check whether a model identifier belongs to Google Gemini
 */
export function isGeminiModel(modelName) {
    if (!modelName) return false;
    const lower = modelName.toLowerCase();
    return lower.startsWith('gemini') || lower.includes('google') || lower.includes('gemini-');
}

/**
 * Available Gemini model - Single Model: gemini-3.5-flash-lite
 */
export const POPULAR_GEMINI_MODELS = [
    {
        id: 'gemini-3.5-flash-lite',
        name: 'Gemini 3.5 Flash Lite',
        tag: 'Google GenAI',
        description: 'Ultra-fast, lightweight, and cost-effective multimodal Google GenAI model.'
    }
];

/**
 * Convert chat history to Google GenAI contents format
 */
function buildGeminiContents(messages) {
    const contents = [];

    for (const msg of messages) {
        if (!msg.content && (!msg.images || msg.images.length === 0)) continue;

        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts = [];

        // Add text part
        if (msg.content) {
            parts.push({ text: msg.content });
        }

        // Add image parts if present (base64)
        if (msg.images && msg.images.length > 0) {
            for (const imgBase64 of msg.images) {
                // Ensure pure base64 without data URI header
                const cleanBase64 = imgBase64.includes(',') ? imgBase64.split(',')[1] : imgBase64;
                parts.push({
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: cleanBase64
                    }
                });
            }
        }

        if (parts.length > 0) {
            contents.push({ role, parts });
        }
    }

    return contents;
}

/**
 * Stream chat using @google/genai SDK
 */
export async function streamGeminiChat(messages, onToken, signal, model = 'gemini-3.5-flash-lite', modeData = null, customApiKey = null) {
    const apiKey = (customApiKey && customApiKey.trim()) || getGeminiApiKey();
    if (!apiKey) {
        throw new Error('Google Gemini API Key is missing. Please open Settings -> Google GenAI and save your API Key, or set VITE_GEMINI_API_KEY.');
    }

    let systemPrompt = DEFAULT_SYSTEM_PROMPT;

    if (modeData?.systemPrompt) {
        systemPrompt = modeData.systemPrompt;
    } else if (modeData?.isQuizMode) {
        systemPrompt = `You are a Senior Principal Examiner, Lead Educator, and Technical Assessor.
Generate the exact number of rigorous, comprehensive multiple-choice quiz questions requested by the user.
OUTPUT MUST BE STRICTLY A VALID JSON OBJECT without any surrounding text or markdown outside the \`\`\`json block.`;
    } else if (modeData?.isInterviewMode) {
        systemPrompt = `You are Tyloop, a world-class professional Lead Technical Interviewer and Recruiter at Tyloop AI.
CONTEXT: You are interviewing a candidate for: "${modeData.jobDescription || 'Software Engineer'}".

INTERVIEW GUIDELINES:
1. Identify yourself as "Tyloop, Lead Technical Interviewer at Tyloop AI".
2. Conduct a realistic, highly professional technical interview.
3. CRITICAL: NEVER use bracket placeholders like "[Your Name]", "[Company Name]", or brackets of any kind.
4. If a company name is not provided, you represent "Tyloop AI".
5. Ask exactly ONE question at a time.
6. When the candidate responds, provide brief constructive feedback and ask the next probing question.
7. Maintain character throughout the entire session.
8. In your opening message, introduce yourself and ask the first question.`;
    } else if (modeData?.isVisualizeMode && (modeData?.visualDimension === '3d' || modeData?.dimension === '3d')) {
        systemPrompt = VISUAL_AI_SYSTEM_PROMPT_3D;
    } else if (modeData?.isVisualizeMode && (modeData?.visualDimension === '2d' || modeData?.dimension === '2d')) {
        systemPrompt = VISUAL_AI_SYSTEM_PROMPT;
    } else if (modeData?.isVisualizeMode) {
        systemPrompt = `You are Tyloop, a world-class Visual Educator and Technical Teacher.
CONTEXT: The student is in a visual classroom learning about: "${modeData.activeConcept || 'their requested topic'}".

DIRECTIONS:
1. MANDATORY CODE FENCE:
   - ALL MERMAID DIAGRAMS MUST BE ENCLOSED IN TRIPLE BACKTICKS:
     \`\`\`mermaid
     ...diagram code...
     \`\`\`
   - NEVER output bare 'graph TD' without the enclosing \`\`\`mermaid code fences.

2. SUBGRAPH & NODE RULES:
   - Subgraph titles with spaces or parentheses MUST use bracket quotes:
     e.g. \`subgraph Unbalanced_Tree ["Unbalanced Tree (Skewed)"]\`
   - Node labels with numbers or parentheses MUST use double quotes:
     e.g. \`A1["1"]\`, \`Root["(( 10: Root ))"]\`

3. SELECT THE BEST STANDARD MERMAID TYPE:
   - For processes, workflows & algorithms: Use standard \`flowchart TD\` or \`flowchart LR\`.
   - For protocols & communications: Use standard \`sequenceDiagram\`.
   - For state transitions & lifecycles: Use standard \`stateDiagram-v2\`.
   - For system structures & relationships: Use standard \`classDiagram\` or \`erDiagram\`.
   - For trees & graphs: Use standard \`graph TD\` or \`graph LR\`.

4. STRICT ZERO-THEORY POLICY:
   - Output ONLY a single-line heading (e.g. \`### [Topic] Diagram\`).
   - IMMEDIATELY output the \`\`\`mermaid diagram code.
   - DO NOT provide long theory, essays, or paragraphs upfront unless the user explicitly requests theory.
   - DO NOT DEVIATE from the requested diagram topic. Focus 100% of tokens on diagram accuracy.

Zero errors. Clean, standard Mermaid diagrams enclosed in triple backticks only!`;
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const contents = buildGeminiContents(messages);

        if (contents.length === 0) {
            contents.push({ role: 'user', parts: [{ text: 'Hello Tyloop!' }] });
        }

        const selectedModel = model || 'gemini-3.5-flash-lite';

        const responseStream = await ai.models.generateContentStream({
            model: selectedModel,
            contents,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
            }
        });

        let fullResponse = '';

        for await (const chunk of responseStream) {
            if (signal?.aborted) {
                break;
            }
            const text = chunk.text || '';
            if (text) {
                fullResponse += text;
                if (onToken) {
                    onToken(fullResponse);
                }
            }
        }

        return fullResponse;
    } catch (err) {
        if (err.status === 403 || err.message?.includes('403') || err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid')) {
            throw new Error('Gemini API Error (403 Forbidden): Invalid API Key or API not enabled. Please check and re-save your Gemini API key in Settings.');
        }
        throw err;
    }
}

/**
 * Generate a conversation summary using Gemini
 */
export async function generateGeminiSummary(messages, model = 'gemini-3.5-flash-lite', customApiKey = null) {
    const apiKey = (customApiKey && customApiKey.trim()) || getGeminiApiKey();
    if (!apiKey) return 'New Chat';

    try {
        const ai = new GoogleGenAI({ apiKey });
        const summaryPrompt = `Based on the following conversation, generate a short, descriptive 3-5 word title for this chat session.
Respond ONLY with the title string, no quotes or extra text.

CONVERSATION:
${messages.slice(0, 5).map((m) => `${m.role}: ${m.content}`).join('\n')}`;

        const response = await ai.models.generateContent({
            model: model || 'gemini-3.5-flash-lite',
            contents: summaryPrompt,
        });

        return response.text?.trim() || 'New Chat';
    } catch (e) {
        console.error('Gemini summary error:', e);
        return 'New Chat';
    }
}

/**
 * Test a Gemini API Key to verify validity
 */
export async function testGeminiApiKey(apiKey, model = 'gemini-3.5-flash-lite') {
    if (!apiKey || !apiKey.trim()) {
        throw new Error('Please enter a Gemini API Key to test.');
    }
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const response = await ai.models.generateContent({
        model: model || 'gemini-3.5-flash-lite',
        contents: 'Say "Gemini Connected" in two words.',
    });
    return response.text?.trim() || 'Success';
}

/**
 * Direct interaction helper method (matching user syntax snippet)
 */
export async function runGeminiInteraction({ model = 'gemini-3.5-flash-lite', input = 'Explain how AI works in a few words', apiKey = null }) {
    const ai = createGeminiClient(apiKey);
    const response = await ai.models.generateContent({
        model,
        contents: input,
    });
    return {
        output_text: response.text,
        response,
    };
}
