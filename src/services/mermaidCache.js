import mermaid from 'mermaid';

/**
 * Clean and auto-repair raw mermaid code with comprehensive edge/node label quoting
 * NO CACHING — always renders fresh
 */
export function cleanMermaidCode(raw) {
    if (!raw) return '';
    let cleaned = raw
        .replace(/^```(?:mermaid)?/i, '')
        .replace(/```$/, '')
        .trim();

    // Decode any escaped HTML entities
    cleaned = cleaned
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"');

    // If there is preceding text before the diagram header, isolate the diagram
    const headerMatch = cleaned.match(/(?:^|\n)((?:graph\s+(?:TD|TB|LR|RL|BT)|flowchart\s+(?:TD|TB|LR|RL|BT)|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart(?:-beta)?|sankey(?:-beta)?|gitGraph)[\s\S]*)/i);
    if (headerMatch) {
        cleaned = headerMatch[1].trim();
    }

    // If there is trailing explanation text, isolate just the diagram block
    const trailingTextMatch = cleaned.match(/^([\s\S]*?)(?=\n(?:Teacher Breakdown|Step-by-Step|The Problem|Key Takeaways|Intuition|Big-O|Complexity|Explanation|Look at the|To understand))/i);
    if (trailingTextMatch) {
        cleaned = trailingTextMatch[1].trim();
    }

    // 1. Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');

    // If this is an xychart / pie chart / sankey, don't run flowchart node transformation regexes on array data [10, 20, 30]
    const isDataChart = /^(?:xychart|pie|sankey)/i.test(cleaned.trim());
    if (isDataChart) {
        return cleaned.trim();
    }

    // 2. Convert raw literal '\n' within labels into <br/>
    cleaned = cleaned.replace(/\\n/g, '<br/>');

    // 3. Convert '-- "some text" -->' or '-- some text -->' edge syntax to safe pipe syntax '-->|"some text"|'
    // This fixes Mermaid lexer errors where quotes or brackets inside '-- "..." -->' fail with expecting 'LINK', 'UNICODE_TEXT', got 'STR'
    cleaned = cleaned.replace(/--\s*(?:"([^"\r\n]+)"|([^-–—>\r\n]+?))\s*-->/g, (match, quotedText, rawText) => {
        let text = (quotedText || rawText || '').trim();
        // Replace square brackets and quotes inside edge text with parens/single quotes
        text = text.replace(/\[/g, '(').replace(/\]/g, ')').replace(/["']/g, '');
        return `-->|"${text}"|`;
    });

    // 4. Fix unquoted subgraph titles:
    cleaned = cleaned.replace(/subgraph\s+([^\n\[\]]+)/gi, (match, title) => {
        const trimmed = title.trim();
        if (trimmed.includes('["') || trimmed.includes("['") || /^[a-zA-Z0-9_]+$/.test(trimmed)) {
            return match;
        }
        const safeId = trimmed.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '') || 'sub';
        const cleanTitle = trimmed.replace(/["']/g, '');
        return `subgraph ${safeId} ["${cleanTitle}"]`;
    });

    // 5. Auto-quote and sanitize pipe edge labels: e.g. -->|Array[Mid] == Target| => -->|"Array(Mid) == Target"|
    cleaned = cleaned.replace(/\|([^|\r\n]+)\|/g, (match, inner) => {
        let trimmed = inner.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
            trimmed = trimmed.slice(1, -1);
        }
        trimmed = trimmed.replace(/\[/g, '(').replace(/\]/g, ')').replace(/["']/g, '');
        return `|"${trimmed}"|`;
    });

    // 6. Auto-quote square bracket node labels: e.g. Node[Some text] or Node["Some text"]
    // Avoid matching stadium nodes like ([ ... ]) or subgraphs
    cleaned = cleaned.replace(/(?<!\()([a-zA-Z0-9_-]+)\[([^\]\r\n]+)\](?!\))/g, (match, nodeId, inner) => {
        let text = inner.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }
        text = text.replace(/"/g, "'");
        return `${nodeId}["${text}"]`;
    });

    // 7. Auto-quote stadium shaped nodes: e.g. Node(["Start: Array"]) or Node([Start: Array])
    cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\(\[([^\r\n]+?)\]\)/g, (match, nodeId, inner) => {
        let text = inner.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }
        text = text.replace(/"/g, "'");
        return `${nodeId}(["${text}"])`;
    });

    // 8. Auto-quote rhombus/decision nodes: e.g. Node{Is Low <= High?}
    cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\{([^}\r\n]+)\}/g, (match, nodeId, inner) => {
        let text = inner.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }
        text = text.replace(/"/g, "'");
        return `${nodeId}{"${text}"}`;
    });

    // 9. Auto-quote circle/double-circle nodes: e.g. Node((Root))
    cleaned = cleaned.replace(/([a-zA-Z0-9_-]+)\(\(\s*([^()\r\n]+?)\s*\)\)/g, (match, nodeId, inner) => {
        let text = inner.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
            text = text.slice(1, -1);
        }
        text = text.replace(/"/g, "'");
        return `${nodeId}(("${text}"))`;
    });

    // Auto-fix if diagram starts with a node directly instead of diagram header
    const validHeaderRegex = /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|quadrantChart|xychart|sankey|gitGraph)/i;
    if (!validHeaderRegex.test(cleaned.trim())) {
        if (cleaned.includes('-->') || cleaned.includes('---') || cleaned.includes('subgraph') || cleaned.includes('==>')) {
            cleaned = `flowchart TD\n${cleaned}`;
        }
    }

    return cleaned.trim();
}

/**
 * Render mermaid diagram code FRESH every time — no caching
 */
export async function renderMermaidFresh(code, prefix = 'mermaid') {
    const clean = cleanMermaidCode(code);
    if (!clean) return { svg: '', error: null };

    // Attempt 1: Standard render
    try {
        await mermaid.parse(clean, { suppressErrors: true });
        const uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const { svg } = await mermaid.render(uniqueId, clean);
        return { svg, error: null };
    } catch (err) {
        // Attempt 2: Strip problematic quotes on arrow edge text and node names
        try {
            let fallbackCode = clean
                .replace(/--\s*"([^"]+)"\s*-->/g, '-- "$1" -->')
                .replace(/--\s*([^-\s][^->\n]*?)\s*-->/g, '-- "$1" -->')
                .replace(/\|([^|\r\n]+)\|/g, (m, inner) => `|"${inner.replace(/["']/g, '').trim()}"|`)
                .replace(/\{([^}\r\n]+)\}/g, (m, inner) => `{"${inner.replace(/["'{}]/g, ' ').trim()}"}`);

            await mermaid.parse(fallbackCode, { suppressErrors: true });
            const uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            const { svg } = await mermaid.render(uniqueId, fallbackCode);
            return { svg, error: null };
        } catch (e2) {
            // Attempt 3: Ultimate alphanumeric sanitize fallback
            try {
                let stripCode = clean
                    .replace(/\\n/g, ' ')
                    .replace(/--\s*"*([^"\n]+?)"*\s*-->/g, '-- $1 -->')
                    .replace(/\|([^|\r\n]+)\|/g, (m, inner) => `|"${inner.replace(/[^a-zA-Z0-9 _=><\-+]/g, ' ').trim()}"|`);

                await mermaid.parse(stripCode, { suppressErrors: true });
                const uniqueId = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                const { svg } = await mermaid.render(uniqueId, stripCode);
                return { svg, error: null };
            } catch (e3) {
                return { svg: '', error: err.message || 'Diagram syntax error' };
            }
        }
    }
}

// Legacy exports for backward compatibility — renderCachedMermaid now just calls renderMermaidFresh
export const renderCachedMermaid = renderMermaidFresh;
// Empty dummy cache that's never used — keeps old imports working without errors
export const mermaidSvgCache = { has: () => false, get: () => undefined, set: () => {}, delete: () => {} };
