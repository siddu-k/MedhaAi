import { SYSTEM_PROMPT as VISUAL_AI_SYSTEM_PROMPT, SYSTEM_PROMPT_3D as VISUAL_AI_SYSTEM_PROMPT_3D } from './visualAiPrompt';

const OLLAMA_URL = import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434';

const SYSTEM_PROMPT = `You are Tyloop, an advanced AI visual educator, Data Structures & Algorithms Professor, and Principal Software Architect.

CORE TEACHING & ALGORITHM RULES:
1. ALGORITHMS & DATA STRUCTURES:
   - Provide authentic visual tree/graph/array diagrams in a valid \`\`\`mermaid block.
   - Underneath the diagram, provide conceptual intuition, step-by-step trace of the node/pointer transitions, and Big-O Time/Space complexity.
   - DO NOT output programming code blocks unless explicitly requested by the user. Focus on the visual diagram and conceptual teaching.
2. Speak naturally and helpfully like a knowledgeable mentor.
3. NEVER mention being a doctor or a healthcare assistant. You are Tyloop.`;

/**
 * Extract Mermaid diagram code from markdown response if present (completed or in-progress stream)
 */
export function extractMermaidDiagram(markdown) {
    if (!markdown) return null;

    // 0. Completed SVG vector block (2D Vector Engine)
    const svgMatch = markdown.match(/```(?:svg|xml)?\s*(<svg[\s\S]*?<\/svg>)\s*```/i);
    if (svgMatch) {
        return svgMatch[1].trim();
    }

    // 0b. Standalone completed raw SVG block without code fences
    const rawSvgMatch = markdown.match(/<svg[\s\S]*?<\/svg>/i);
    if (rawSvgMatch) {
        return rawSvgMatch[0].trim();
    }

    // 0c. In-progress STREAMING SVG — has <svg opening but no </svg> closing yet
    // Truncate at last valid tag boundary and close it so the board can render progressively
    if (markdown.includes('<svg') && !markdown.includes('</svg>')) {
        const svgStart = markdown.indexOf('<svg');
        if (svgStart !== -1) {
            let partialSvg = markdown.substring(svgStart);
            // Need at least the opening <svg...> tag to be complete
            const openTagEnd = partialSvg.indexOf('>');
            if (openTagEnd > 0 && partialSvg.length > openTagEnd + 20) {
                // Truncate at the last complete tag boundary
                const lastCloseTag = partialSvg.lastIndexOf('>');
                if (lastCloseTag > openTagEnd) {
                    partialSvg = partialSvg.substring(0, lastCloseTag + 1);
                }
                // Close the SVG
                partialSvg += '\n</svg>';
                return partialSvg;
            }
        }
    }

    // 1. Completed mermaid block
    const match = markdown.match(/```(?:mermaid)\s*([\s\S]*?)```/i);
    if (match) {
        const candidate = match[1].trim();
        if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart)/i.test(candidate)) {
            return candidate;
        }
    }

    // 2. In-progress streamed block (before trailing ``` is written)
    const streamMatch = markdown.match(/```(?:mermaid)\s*([\s\S]*)$/i);
    if (streamMatch) {
        const candidate = streamMatch[1].trim();
        if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart)/i.test(candidate) && candidate.split('\n').length >= 3) {
            return candidate;
        }
    }

    // 3. Fallback: Raw mermaid block printed without backticks
    const rawMatch = markdown.match(/(?:^|\n)((?:graph\s+(?:TD|TB|LR|RL|BT)|flowchart\s+(?:TD|TB|LR|RL|BT)|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart)[\s\S]*?)(?=\n(?:[A-Z0-9#*-]|Teacher Breakdown|Step-by-Step Trace|Key Takeaways|Intuition|Big-O|Complexity|Explanation|\n\n\n|$))/i);
    if (rawMatch) {
        const candidate = rawMatch[1].trim();
        if (candidate.split('\n').length >= 2) {
            return candidate;
        }
    }

    return null;
}

/**
 * Send a message to Ollama and stream the response
 */
export async function streamChat(messages, onToken, signal, model = null, modeData = null) {
    let systemPrompt = SYSTEM_PROMPT;

    if (modeData?.systemPrompt) {
        systemPrompt = modeData.systemPrompt;
    } else if (modeData?.isQuizMode) {
        systemPrompt = `You are a Senior Principal Examiner and Lead Assessor.
Generate the exact number of multiple-choice quiz questions requested by the user.
OUTPUT MUST BE STRICTLY A VALID JSON OBJECT without any surrounding text or markdown outside the \`\`\`json block.`;
    } else if (modeData?.isInterviewMode) {
        systemPrompt = `You are Tyloop, a world-class professional Lead Interviewer at Tyloop AI.
        CONTEXT: You are interviewing a candidate for the following role/description: ${modeData.jobDescription}
        
        DIRECTIONS:
        1. Identify yourself as "Tyloop, Lead Recruiter at Tyloop AI".
        2. Conduct a realistic, high-pressure yet professional interview.
        3. CRITICAL: NEVER use placeholders like "[Your Name]", "[Company Name]", or brackets of any kind. 
        4. If a company name is not in the description, you represent "Tyloop AI". 
        5. Ask exactly ONE question at a time.
        6. Do not break character. Wait for the candidate's response.
        7. In your first message, introduce yourself professionally as Tyloop and ask the first opening question.
        8. Use a sophisticated, corporate tone.`;
    } else if (modeData?.isVisualizeMode && (modeData?.visualDimension === '3d' || modeData?.dimension === '3d')) {
        systemPrompt = VISUAL_AI_SYSTEM_PROMPT_3D;
    } else if (modeData?.isVisualizeMode && (modeData?.visualDimension === '2d' || modeData?.dimension === '2d')) {
        systemPrompt = VISUAL_AI_SYSTEM_PROMPT;
    } else if (modeData?.isVisualizeMode) {
        systemPrompt = `You are Tyloop, a world-class Visual Educator and Technical Teacher.
CONTEXT: The student is in a visual classroom learning about: ${modeData.activeConcept || 'their requested topic'}.

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

    const ollamaMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((msg) => {
            const ollamaMsg = { role: msg.role, content: msg.content };
            if (msg.images && msg.images.length > 0) {
                ollamaMsg.images = msg.images;
            }
            return ollamaMsg;
        }),
    ];

    // Use requested model or fallback to image-capable one if needed
    let selectedModel = model;
    if (!selectedModel) {
        const hasImage = messages.some(msg => msg.images && msg.images.length > 0);
        selectedModel = hasImage ? 'qwen3-vl:4b' : 'qwen2.5-coder:7b';
    }

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: selectedModel,
            messages: ollamaMessages,
            stream: true,
            options: {
                temperature: 0.7
            }
        }),
        signal,
    });

    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    let lineBuffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        lineBuffer += chunk;
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop();

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                if (json.message?.content) {
                    fullResponse += json.message.content;
                    onToken(fullResponse);
                }
            } catch (e) {
                console.warn('Malformed JSON chunk:', line);
            }
        }
    }

    return fullResponse;
}

/**
 * Generate a summary of the conversation
 */
export async function generateSummary(messages) {
    const summaryPrompt = `Based on the following conversation, generate a short, descriptive title for this chat session.
Respond ONLY with the title string, no quotes or extra text.

CONVERSATION:
${messages.slice(0, 5).map((m) => `${m.role}: ${m.content}`).join('\n')}
`;

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'qwen2.5-coder:7b',
            messages: [{ role: 'user', content: summaryPrompt }],
            stream: false,
        }),
    });

    const data = await response.json();
    return data.message?.content?.trim() || 'New Chat';
}

/**
 * List locally downloaded models
 */
export async function listLocalModels() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const response = await fetch(`${OLLAMA_URL}/api/tags`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return [];
        const data = await response.json();
        return data.models || [];
    } catch {
        // Ollama local service is offline or not installed; return empty array cleanly
        return [];
    }
}

/**
 * Pull (download) a new model from Ollama
 */
export async function pullModel(modelName, onProgress) {
    const response = await fetch(`${OLLAMA_URL}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.status} ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (!line.trim()) continue;
            try {
                const json = JSON.parse(line);
                if (onProgress) onProgress(json);
            } catch (e) {
                console.warn('Malformed JSON chunk in pull:', line);
            }
        }
    }
}

export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
