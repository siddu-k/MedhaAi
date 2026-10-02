import { streamChat } from './aiService';

/**
 * Clean and extract JSON array or object from LLM response
 */
export function parseSlideDeckJSON(rawText, fallbackTopic = 'Concept Presentation') {
    if (!rawText) return null;

    // Try direct JSON block match
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    let candidate = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

    try {
        const parsed = JSON.parse(candidate);
        if (parsed.slides && Array.isArray(parsed.slides)) {
            return parsed;
        }
    } catch (e) {
        // Continue to fallback parser
    }

    // Try finding outer { ... }
    const firstBrace = candidate.indexOf('{');
    const lastBrace = candidate.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
            const sliced = candidate.substring(firstBrace, lastBrace + 1);
            const parsed = JSON.parse(sliced);
            if (parsed.slides && Array.isArray(parsed.slides)) {
                return parsed;
            }
        } catch (e) {
            // Continue to markdown heuristic parser
        }
    }

    // Fallback: Parse markdown slide sections (# Slide X or --- delimiters)
    const slideBlocks = rawText.split(/(?:^|\n)(?:#+\s*Slide\s*\d+|---+)\s*/i).filter(b => b.trim().length > 20);
    if (slideBlocks.length > 0) {
        const slides = slideBlocks.map((block, idx) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            const title = lines[0]?.replace(/^#+\s*/, '') || `Slide ${idx + 1}`;
            const points = lines.filter(l => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))
                                .map(l => l.replace(/^[-*]|\d+\.\s*/, '').trim());
            
            // Extract mermaid if present
            const mMatch = block.match(/```(?:mermaid)?\s*([\s\S]*?)\s*```/i);
            const diagram = mMatch ? mMatch[1].trim() : '';

            return {
                slideNumber: idx + 1,
                layout: diagram ? 'diagram_split' : 'dense_grid',
                title: title.substring(0, 70),
                subtitle: lines[1] && !lines[1].startsWith('-') ? lines[1].substring(0, 100) : '',
                points: points.length > 0 ? points.slice(0, 5) : [
                    'Detailed technical breakdown and operational mechanics',
                    'Key parameters, constraints, and optimization strategies',
                    'Practical implementation and architectural considerations'
                ],
                technicalDetails: 'Comprehensive concept specifications and mathematical foundations.',
                diagram,
                callout: 'Core operational takeaway and performance characteristics.',
                speakerNotes: `Explaining ${title} with focus on technical foundations and functional mechanics.`
            };
        });

        return {
            title: fallbackTopic,
            subtitle: 'Technical Concept Breakdown',
            slides
        };
    }

    return null;
}

/**
 * Generate a Complete AI Slide Deck via Ollama
 */
export async function generatePptDeck({
    topic,
    slideCount = 5,
    theme = 'cyberpunk',
    audience = 'Technical & Educational',
    model = null,
    onProgress
}) {
    const prompt = `You are a Principal Software Architect & Senior Technical Educator.
Create a complete, dense, high-substance ${slideCount}-slide technical presentation deck on: "${topic}".
Target Depth: ${audience}.

CRITICAL CONTENT GUIDELINES:
1. ONLY INCLUDE HIGHLY SPECIFIC, RELEVANT TECHNICAL CONTENT FOR THE TOPIC.
2. NO GENERIC DECORATIVE TEXT, NO VAGUE INTRODUCTORY FLUFF (e.g. avoid phrases like "Unlocking future possibilities", "Welcome everyone", or "In today's fast world").
3. USE PRECISE TECHNICAL TERMINOLOGY: Include exact equations, time/space complexities, network packet flags, circuit values, data structures, pointer positions, and concrete trade-offs.
4. FILL EACH SLIDE EFFICIENTLY: Provide 3 to 5 substantial, informative bullet points that explain the internal mechanics and logic.
5. MERMAID DIAGRAMS: For at least 2 architectural/workflow/algorithmic slides, provide a valid, complete Mermaid diagram (using 'graph TD', 'graph LR', 'sequenceDiagram', or 'stateDiagram-v2') in the "diagram" field.
6. OUTPUT MUST BE STRICTLY A VALID JSON OBJECT without any surrounding text outside the \`\`\`json block.

JSON SCHEMA:
\`\`\`json
{
  "title": "Precise Technical Deck Title",
  "subtitle": "Core Architecture and Mechanics Breakdown",
  "topic": "${topic}",
  "theme": "${theme}",
  "slideCount": ${slideCount},
  "slides": [
    {
      "slideNumber": 1,
      "layout": "dense_grid",
      "title": "Fundamental Principles and Architecture",
      "subtitle": "Core Mechanics & Formal Definition",
      "points": [
        "First exact technical principle: internal mathematical/logical formulation",
        "Second architectural foundation: state representations and invariant constraints",
        "Third operational detail: input/output boundaries and processing pipeline",
        "Fourth key metric: complexity analysis and scaling bottlenecks"
      ],
      "technicalDetails": "Complexity: O(N log N) | Memory Footprint: O(N) | Invariant: Monotonic state transitions",
      "diagram": "",
      "callout": "Directly resolves high latency by decoupling asynchronous worker pipelines.",
      "speakerNotes": "This slide establishes the mathematical and structural formulation of the system."
    },
    {
      "slideNumber": 2,
      "layout": "diagram_split",
      "title": "Execution Pipeline & State Flow",
      "subtitle": "Step-by-Step Component Interactions",
      "points": [
        "Step 1: Ingestion and validation across ingress gateway nodes",
        "Step 2: Partitioning, hashing, and parallel execution across compute shards",
        "Step 3: Aggregation, consistency reconciliation, and persistence"
      ],
      "technicalDetails": "Throughput: 50,000 req/s | End-to-End Latency: < 12ms p99",
      "diagram": "graph LR\\n    Ingress[\\"Ingress Gateway (TLS Term)\\\"] --> Queue[\\"Ordered Partition Queue\\\"]\\n    Queue --> Worker[\\"Stateless Worker Nodes\\\"]\\n    Worker --> DB[(\\"Distributed Storage\\")]",
      "callout": "Minimizes contention using lock-free ring buffers.",
      "speakerNotes": "Notice the direct flow from ingress termination through the lock-free partition buffer."
    }
  ]
}
\`\`\``;

    const messages = [
        { role: 'user', content: prompt }
    ];

    let fullRaw = '';
    const abortController = new AbortController();

    await streamChat(
        messages,
        (token) => {
            fullRaw = token;
            onProgress?.(token);
        },
        abortController.signal,
        model
    );

    const parsed = parseSlideDeckJSON(fullRaw, topic);
    if (!parsed || !parsed.slides || parsed.slides.length === 0) {
        throw new Error('Failed to generate slide deck format. Please try again.');
    }

    return {
        ...parsed,
        topic: topic,
        theme: theme,
        slideCount: parsed.slides.length,
        createdAt: new Date().toISOString()
    };
}

/**
 * Export Deck as Print / PDF formatted HTML
 */
export function exportDeckToPrint(deck) {
    if (!deck) return;
    window.print();
}
