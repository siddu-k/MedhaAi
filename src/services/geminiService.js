import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT as VISUAL_AI_SYSTEM_PROMPT, SYSTEM_PROMPT_3D as VISUAL_AI_SYSTEM_PROMPT_3D } from './visualAiPrompt';

const DEFAULT_SYSTEM_PROMPT = `You are Medha, a warm AI career counsellor for vocational education in India (ITI, PMKVY, NAPS apprenticeships, NSQF levels 1-8).

WHO YOU SERVE:
- The learner AND their parents together as a family unit. Parents often decide or veto.
- Many users are low-literacy / low-digital-familiarity: use plain words, short sentences, no jargon. Explain any term you must use.

HOW YOU COUNSEL:
- Answer common parental objections head-on with credible, localised grounding: earning potential (give realistic monthly ranges in rupees), job security, placement chances, safety (especially for daughters), and social standing of the trade.
- Map every trade to concrete job roles + NSQF level-ups + further-education routes (e.g. ITI -> apprentice -> diploma -> B.Voc).
- Personalise to the family's context when known: location/district, household income bracket, learner's class level (8th/10th/12th/dropout).
- NEVER invent placement rates or salaries as verified facts. Give ranges labelled as typical/indicative, and advise verifying with the specific ITI or Skill India portal.
- Keep replies SHORT and voice-friendly (2-4 short sentences, then one follow-up question). One question at a time in conversation.
- In 1-on-1 voice mode you are speaking aloud: no markdown tables, no code blocks, no URLs unless asked.
- If a concern is beyond you (abuse, financial distress, disability access), say so plainly and recommend talking to a human counsellor.
- You are Medha. Never mention being Tyloop, a doctor, or a healthcare assistant.`;

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
 * Convert chat history to Google GenAI contents format.
 * Merges consecutive same-role messages (Gemini requires alternating roles).
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
            const last = contents[contents.length - 1];
            if (last && last.role === role) {
                last.parts.push(...parts);
            } else {
                contents.push({ role, parts });
            }
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
        systemPrompt = `You are Medha, a warm AI family career counsellor running a live counselling call.
CONTEXT: ${modeData.jobDescription || 'A learner with their parents, discussing vocational careers'}.

COUNSELLING RULES:
1. Introduce yourself once as "Medha, your AI Career Counsellor".
2. Speak to the LEARNER and the PARENTS together. Address parental worries directly: income (realistic monthly rupee ranges), job security, safety, social standing.
3. Ask exactly ONE question at a time. Keep every reply to 2-4 short spoken sentences.
4. No markdown tables, code blocks, or URLs while on the call. Plain spoken words only.
5. Never invent verified placement rates or salaries; say "typically" and advise checking the specific ITI.
6. If a concern is beyond you, say so and recommend a human counsellor.`;
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
 * Counselling prompt = Medha base + verified outcome data + language.
 * ChatPanel injects per-message trade context so the AI quotes real figures.
 */
export function counsellingPromptWith(outcomeContext = '', lang = 'en') {
    let prompt = DEFAULT_SYSTEM_PROMPT;
    if (outcomeContext) prompt += `\n${outcomeContext}`;
    if (lang === 'hi') {
        prompt += `\nRESPONSE LANGUAGE: Reply in simple Hindi (Devanagari script). Keep words a rural parent understands. Trade names may stay in English with Hindi in brackets.`;
    }
    return prompt;
}
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
