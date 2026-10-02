import { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import useAppStore from '../../stores/appStore';
import { renderMermaidFresh, cleanMermaidCode } from '../../services/mermaidCache';
import { speak, stopSpeaking } from '../../services/voiceService';

// Initialize mermaid with dark chalkboard configuration and suppressed error DOM injection
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
    suppressErrorRendering: true,
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: 12,
    flowchart: {
        htmlLabels: true,
        padding: 24,
        nodeSpacing: 50,
        rankSpacing: 55,
        curve: 'basis',
        useMaxWidth: false
    },
    sequence: {
        useMaxWidth: false,
        actorMargin: 50,
        boxMargin: 15,
        boxTextMargin: 8,
        noteMargin: 15,
        messageMargin: 40
    },
    themeVariables: {
        fontSize: '12px',
        fontFamily: 'Inter, -apple-system, sans-serif',
        darkMode: true,
        background: 'transparent',
        mainBkg: '#18181b',
        nodeBorder: '#3f3f46',
        clusterBkg: '#09090b',
        titleColor: '#fafafa',
        edgeLabelBackground: '#18181b',
        lineColor: '#e4e4e7',
        textColor: '#fafafa',
        primaryColor: '#27272a',
        primaryTextColor: '#fafafa',
        primaryBorderColor: '#71717a',
        secondaryColor: '#18181b',
        tertiaryColor: '#09090b'
    }
});

// Helper: walk up DOM to find the nearest semantic node/cluster/shape, safely crossing foreignObject boundaries
function findSelectableNode(startEl, svgRoot) {
    if (!startEl || startEl === svgRoot || startEl === document.body) return null;

    let curr = startEl;
    let candidate = null;

    while (curr && curr !== svgRoot && curr !== document.body) {
        const tag = curr.tagName ? curr.tagName.toLowerCase() : '';

        // Stop if hitting a full-canvas background rect
        if (tag === 'rect') {
            const w = curr.getAttribute('width');
            const h = curr.getAttribute('height');
            if ((w === '100%' || Number(w) >= 1200) && (h === '100%' || Number(h) >= 700)) {
                return null;
            }
        }

        // Check if curr is a Mermaid node, cluster, or edge
        const classList = curr.classList;
        if (classList && (classList.contains('node') || classList.contains('cluster') || classList.contains('edgePath') || classList.contains('edgeLabel'))) {
            return curr;
        }

        // Check if curr is a named SVG group or container with an identifiable semantic label
        if (tag === 'g' && (
            (curr.id && curr.id !== 'svg-root' && curr.id !== 'root' && !curr.id.startsWith('mermaid-')) ||
            curr.getAttribute('data-name') ||
            curr.getAttribute('data-label') ||
            curr.querySelector('text, .nodeLabel')
        )) {
            return curr;
        }

        // Record first valid graphic element if no group found yet
        if (!candidate && (tag === 'rect' || tag === 'circle' || tag === 'path' || tag === 'polygon' || tag === 'text' || tag === 'line' || tag === 'g')) {
            candidate = curr;
        }

        // Walk up (parentElement or parentNode crosses foreignObject safely)
        curr = curr.parentElement || curr.parentNode;
    }

    return candidate || null;
}

// Helper: find nearest text element to an element using Euclidean distance
function findClosestTextToElement(targetEl, svgRoot, maxDistance = 160) {
    if (!targetEl || !svgRoot) return null;
    try {
        const allTexts = svgRoot.querySelectorAll('text, tspan');
        if (!allTexts || allTexts.length === 0) return null;

        const tRect = targetEl.getBoundingClientRect();
        const tCenterX = tRect.left + tRect.width / 2;
        const tCenterY = tRect.top + tRect.height / 2;

        let closestText = null;
        let minDistance = maxDistance;

        allTexts.forEach(textEl => {
            const content = textEl.textContent?.trim();
            if (!content || content.length < 2) return;
            const r = textEl.getBoundingClientRect();
            const centerX = r.left + r.width / 2;
            const centerY = r.top + r.height / 2;
            const dist = Math.hypot(centerX - tCenterX, centerY - tCenterY);
            if (dist < minDistance) {
                minDistance = dist;
                closestText = content;
            }
        });

        return closestText;
    } catch {
        return null;
    }
}

// Helper: extract clean text label from a node with semantic awareness
function extractLabelFromNode(node, svgRoot = null) {
    if (!node) return 'Component';

    // 1. Explicit data attributes
    const explicitLabel = node.getAttribute?.('data-label') || node.getAttribute?.('data-name') || node.getAttribute?.('aria-label');
    if (explicitLabel?.trim()) {
        return explicitLabel.trim().replace(/\s+/g, ' ');
    }

    // 2. Mermaid node label class
    const nodeLabelEl = node.querySelector?.('.nodeLabel, span.nodeLabel, .label span, .label div');
    if (nodeLabelEl?.textContent?.trim()) {
        return nodeLabelEl.textContent.trim().replace(/\s+/g, ' ');
    }

    // 3. SVG title element
    const titleEl = node.querySelector?.('title');
    if (titleEl?.textContent?.trim()) {
        return titleEl.textContent.trim().replace(/\s+/g, ' ');
    }

    // 4. SVG text / tspan elements inside node
    const textEls = node.querySelectorAll?.('text, tspan');
    if (textEls && textEls.length > 0) {
        const parts = [];
        textEls.forEach(t => {
            const val = t.textContent?.trim();
            if (val && !parts.includes(val)) parts.push(val);
        });
        if (parts.length > 0) return parts.join(' • ').replace(/\s+/g, ' ');
    }

    // 5. Any direct text inside node (up to 60 chars)
    const rawText = node.textContent?.trim()?.replace(/\s+/g, ' ');
    if (rawText && rawText.length > 0 && rawText.length <= 60) {
        return rawText;
    }

    // 6. Semantic Proximity Search for Paths / Connectors / Geometric Shapes
    const tag = node.tagName ? node.tagName.toLowerCase() : '';
    const isConnector = tag === 'path' || tag === 'line' || node.classList?.contains('edgePath') || node.classList?.contains('flow-arrow');

    if (svgRoot) {
        const nearbyText = findClosestTextToElement(node, svgRoot, isConnector ? 160 : 120);
        if (nearbyText) {
            if (isConnector) {
                return `Flow Vector (${nearbyText})`;
            }
            return `${nearbyText} (${tag.charAt(0).toUpperCase() + tag.slice(1)})`;
        }
    }

    // 7. Meaningful Class Name inspection
    const classNameStr = typeof node.className === 'string' ? node.className : (node.className?.baseVal || '');
    if (classNameStr) {
        const meaningfulClasses = classNameStr
            .split(/\s+/)
            .filter(c => c && !['st0', 'cls-1', 'cls-2', 'selected', 'active', 'flow', 'svg', 'icon'].includes(c.toLowerCase()));
        if (meaningfulClasses.length > 0) {
            const formatted = meaningfulClasses[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return isConnector ? `Flow Vector (${formatted})` : formatted;
        }
    }

    // 8. Meaningful ID
    if (node.id && !node.id.startsWith('mermaid-') && node.id !== 'svg-root') {
        const cleanId = node.id.replace(/^flowchart-/, '').replace(/[-_]/g, ' ').trim();
        if (cleanId) {
            return cleanId.replace(/\b\w/g, l => l.toUpperCase());
        }
    }

    // 9. Graceful semantic fallback (avoid raw "PATH Component")
    if (isConnector) return 'Dynamic Flow Vector';
    if (tag === 'circle') return 'Radial Node';
    if (tag === 'rect') return 'System Block';
    if (tag === 'polygon') return 'Geometric Shape';
    return `${tag ? tag.toUpperCase() : 'Node'} Component`;
}

// Helper: find all elements within marquee rectangle
function getElementsInMarquee(marqueeBounds, svgRoot) {
    if (!svgRoot) return [];
    const candidates = svgRoot.querySelectorAll('.node, .cluster, text, g[id], rect, circle, path');
    const matched = [];

    candidates.forEach(el => {
        const tag = el.tagName ? el.tagName.toLowerCase() : '';
        if (tag === 'rect') {
            const w = el.getAttribute('width');
            if (w === '100%' || Number(w) >= 1200) return;
        }

        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) return;

        // Check intersection with marquee
        const overlaps = !(
            r.right < marqueeBounds.left ||
            r.left > marqueeBounds.right ||
            r.bottom < marqueeBounds.top ||
            r.top > marqueeBounds.bottom
        );

        if (overlaps) {
            const node = findSelectableNode(el, svgRoot);
            if (node) {
                const label = extractLabelFromNode(node);
                if (label && !matched.some(m => m.label === label)) {
                    matched.push({
                        element: node,
                        label,
                        role: node.classList?.contains('node') ? 'Node' : 'Component'
                    });
                }
            }
        }
    });

    return matched;
}

export default function MermaidBoard() {
    const { activeBoardDiagram, activeBoardTitle, activeConcept, isAiTyping, setPendingUserPrompt } = useAppStore();
    const containerRef = useRef(null);
    const svgWrapperRef = useRef(null);
    const [svgContent, setSvgContent] = useState('');
    const [renderError, setRenderError] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const [copied, setCopied] = useState(false);
    const [boardTheme, setBoardTheme] = useState('chalkboard'); // chalkboard | obsidian | white
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isReplaying, setIsReplaying] = useState(false);
    const [streamedSvg, setStreamedSvg] = useState(null);

    // ─── Canvas Tool Mode & Selection State ───
    const [canvasMode, setCanvasMode] = useState('pan'); // 'pan' | 'select'
    const [selectedPart, setSelectedPart] = useState(null);
    const [selectionMarquee, setSelectionMarquee] = useState(null); // { startX, startY, currentX, currentY }
    const [hoveredInfo, setHoveredInfo] = useState(null);
    const [questionInput, setQuestionInput] = useState('');
    const [sentSuccess, setSentSuccess] = useState(false);
    const [isCardCollapsed, setIsCardCollapsed] = useState(false);
    const [isSpeakingComponent, setIsSpeakingComponent] = useState(false);
    const [copiedContext, setCopiedContext] = useState(false);

    const isSelectingRef = useRef(false);
    const selectStartPosRef = useRef(null);

    // Clear selection & reset audio when diagram updates
    useEffect(() => {
        setSelectedPart(null);
        setHoveredInfo(null);
        setSelectionMarquee(null);
        setIsCardCollapsed(false);
        stopSpeaking();
        setIsSpeakingComponent(false);
    }, [activeBoardDiagram]);

    // Track last successfully rendered code to avoid redundant renders
    const lastRenderedCodeRef = useRef('');
    const renderTimeoutRef = useRef(null);
    const isRenderingRef = useRef(false);
    const pendingCodeRef = useRef(null);

    const handleReplay = () => {
        if (isReplaying || !svgContent) return;
        setIsReplaying(true);

        const cleanSvg = svgContent.trim();
        const startTagEnd = cleanSvg.indexOf('>');
        let currentLength = startTagEnd !== -1 ? startTagEnd + 1 : 20;
        const totalLength = cleanSvg.length;
        const totalDuration = 2400;
        const frameInterval = 25;
        const totalSteps = totalDuration / frameInterval;
        const chunkSize = Math.max(15, Math.ceil(totalLength / totalSteps));

        const timer = setInterval(() => {
            currentLength += chunkSize;
            if (currentLength >= totalLength) {
                setStreamedSvg(null);
                setIsReplaying(false);
                clearInterval(timer);
            } else {
                let chunk = cleanSvg.slice(0, currentLength);
                const lastCloseTag = chunk.lastIndexOf('>');
                if (lastCloseTag > 0) {
                    chunk = chunk.slice(0, lastCloseTag + 1);
                }
                if (chunk.includes('<svg') && !chunk.includes('</svg>')) {
                    chunk += '\n</svg>';
                }
                try {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(chunk, 'image/svg+xml');
                    if (!doc.querySelector('parsererror')) {
                        setStreamedSvg(chunk);
                    }
                } catch (e) {
                    // Ignore transient parsing errors during streaming animation
                }
            }
        }, frameInterval);
    };

    // Core render function — renders fresh on change
    const doRender = useCallback(async (diagramCode, isMountedFn) => {
        if (isRenderingRef.current) {
            pendingCodeRef.current = diagramCode;
            return;
        }
        isRenderingRef.current = true;
        pendingCodeRef.current = null;

        try {
            const trimmed = diagramCode.trim();

            // If SVG vector illustration
            if (trimmed.startsWith('<svg') || (trimmed.includes('<svg') && trimmed.includes('</svg>'))) {
                const svgOnly = trimmed.match(/<svg[\s\S]*?<\/svg>/i);
                if (isMountedFn()) {
                    setSvgContent(svgOnly ? svgOnly[0] : trimmed);
                    setRenderError(null);
                    lastRenderedCodeRef.current = diagramCode;
                }
                return;
            }

            const cleanCode = cleanMermaidCode(diagramCode);
            if (!cleanCode) {
                if (isMountedFn()) {
                    if (!isAiTyping) {
                        setSvgContent('');
                    }
                    setRenderError(null);
                }
                return;
            }

            if (cleanCode === lastRenderedCodeRef.current) return;

            const { svg, error } = await renderMermaidFresh(cleanCode, 'mermaid-board');
            if (isMountedFn()) {
                if (svg) {
                    setSvgContent(svg);
                    setRenderError(null);
                    lastRenderedCodeRef.current = cleanCode;
                } else if (error) {
                    if (!isAiTyping) {
                        setRenderError(error);
                    }
                }
            }
        } finally {
            isRenderingRef.current = false;
            if (pendingCodeRef.current && isMountedFn()) {
                const nextCode = pendingCodeRef.current;
                pendingCodeRef.current = null;
                doRender(nextCode, isMountedFn);
            }
        }
    }, [isAiTyping]);

    const latestDiagramRef = useRef(activeBoardDiagram);
    latestDiagramRef.current = activeBoardDiagram;

    useEffect(() => {
        let isMounted = true;
        const isMountedFn = () => isMounted;

        if (!activeBoardDiagram) {
            setSvgContent('');
            setRenderError(null);
            lastRenderedCodeRef.current = '';
            return () => { isMounted = false; };
        }

        const isSvg = activeBoardDiagram.trim().startsWith('<svg') ||
            (activeBoardDiagram.includes('<svg') && activeBoardDiagram.includes('</svg>'));

        if (isSvg) {
            doRender(activeBoardDiagram, isMountedFn);
        } else if (isAiTyping) {
            if (!renderTimeoutRef.current) {
                renderTimeoutRef.current = setTimeout(() => {
                    renderTimeoutRef.current = null;
                    if (isMounted) {
                        doRender(latestDiagramRef.current, isMountedFn);
                    }
                }, 600);
            }
        } else {
            if (renderTimeoutRef.current) {
                clearTimeout(renderTimeoutRef.current);
                renderTimeoutRef.current = null;
            }
            doRender(activeBoardDiagram, isMountedFn);
        }

        return () => {
            isMounted = false;
        };
    }, [activeBoardDiagram, isAiTyping, doRender]);

    // Handle Canvas Mouse Down
    const handleMouseDown = (e) => {
        if (e.button !== 0) return; // Left click only

        if (canvasMode === 'pan') {
            setIsDragging(true);
            dragStartRef.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        } else {
            // Select Mode
            isSelectingRef.current = true;
            selectStartPosRef.current = {
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            };
        }
    };

    const handleMouseMove = (e) => {
        if (canvasMode === 'pan') {
            if (!isDragging) return;
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        } else {
            // Select Mode
            if (isSelectingRef.current && selectStartPosRef.current) {
                const dx = e.clientX - selectStartPosRef.current.x;
                const dy = e.clientY - selectStartPosRef.current.y;
                if (Math.hypot(dx, dy) > 5) {
                    setSelectionMarquee({
                        startX: selectStartPosRef.current.x,
                        startY: selectStartPosRef.current.y,
                        currentX: e.clientX,
                        currentY: e.clientY
                    });
                }
            } else {
                // Hover Inspection in Select Mode
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                const svgEl = svgWrapperRef.current?.querySelector('svg');
                if (hit && svgEl && !hit.closest('.selection-card-ui')) {
                    const node = findSelectableNode(hit, svgEl);
                    if (node && node !== svgEl) {
                        const label = extractLabelFromNode(node, svgEl);
                        const r = node.getBoundingClientRect();
                        setHoveredInfo({ element: node, label, rect: r });
                        return;
                    }
                }
                setHoveredInfo(null);
            }
        }
    };

    const handleMouseUp = (e) => {
        if (canvasMode === 'pan') {
            setIsDragging(false);
        } else {
            // Select Mode
            const wasSelecting = isSelectingRef.current;
            isSelectingRef.current = false;

            if (selectionMarquee) {
                // Drag Marquee Box Selection
                const minX = Math.min(selectionMarquee.startX, selectionMarquee.currentX);
                const minY = Math.min(selectionMarquee.startY, selectionMarquee.currentY);
                const maxX = Math.max(selectionMarquee.startX, selectionMarquee.currentX);
                const maxY = Math.max(selectionMarquee.startY, selectionMarquee.currentY);
                const width = maxX - minX;
                const height = maxY - minY;

                setSelectionMarquee(null);

                if (width > 12 && height > 12) {
                    const svgEl = svgWrapperRef.current?.querySelector('svg');
                    const marqueeBounds = { left: minX, top: minY, right: maxX, bottom: maxY, width, height };
                    const items = getElementsInMarquee(marqueeBounds, svgEl);

                    if (items.length > 0) {
                        const labelSummary = items.map(it => it.label).slice(0, 3).join(', ') + (items.length > 3 ? ` (+${items.length - 3} more)` : '');
                        const detailsList = items.map(it => `• ${it.label}`).join('\n');
                        setSelectedPart({
                            type: 'area',
                            label: labelSummary,
                            details: detailsList,
                            role: `${items.length} Diagram Elements`,
                            count: items.length,
                            rect: marqueeBounds,
                            element: null
                        });
                    } else {
                        setSelectedPart({
                            type: 'area',
                            label: 'Selected Diagram Region',
                            details: `Custom selection area (${Math.round(width)}×${Math.round(height)}px)`,
                            role: 'Area Selection',
                            count: 1,
                            rect: marqueeBounds,
                            element: null
                        });
                    }
                }
            } else if (wasSelecting) {
                // Single Click Selection: use elementFromPoint to hit exact SVG element
                const hit = document.elementFromPoint(e.clientX, e.clientY);
                if (hit?.closest?.('.selection-card-ui')) return;

                const svgEl = svgWrapperRef.current?.querySelector('svg');
                if (svgEl) {
                    const node = findSelectableNode(hit, svgEl);
                    if (node && node !== svgEl) {
                        const label = extractLabelFromNode(node, svgEl);
                        const r = node.getBoundingClientRect();

                        let role = 'Component';
                        const tag = node.tagName?.toLowerCase() || '';
                        const isConnector = tag === 'path' || tag === 'line' || node.classList?.contains('edgePath') || node.classList?.contains('flow-arrow');
                        const lower = (label + ' ' + (node.className?.baseVal || node.className || '')).toLowerCase();

                        if (isConnector) role = 'Dynamic Flow Pathway';
                        else if (node.classList?.contains('node')) role = 'Diagram Node';
                        else if (node.classList?.contains('cluster')) role = 'System Cluster';
                        else if (lower.includes('sun') || lower.includes('cloud') || lower.includes('rain') || lower.includes('water') || lower.includes('ocean') || lower.includes('vapor') || lower.includes('cycle')) role = 'Environmental Element';
                        else if (lower.includes('db') || lower.includes('database') || lower.includes('storage') || lower.includes('reservoir')) role = 'Storage Reservoir';
                        else if (lower.includes('api') || lower.includes('service') || lower.includes('server') || lower.includes('client')) role = 'System Service';

                        setSelectedPart({
                            element: node,
                            label,
                            fullText: label,
                            role,
                            id: node.id || '',
                            tag,
                            rect: {
                                left: r.left,
                                top: r.top,
                                width: r.width,
                                height: r.height,
                                right: r.right,
                                bottom: r.bottom
                            }
                        });
                    } else {
                        setSelectedPart(null);
                    }
                }
            }
        }
    };

    // Calculate screen-relative bounding box for active selection
    const getOverlayBounds = () => {
        if (!containerRef.current || !selectedPart) return null;
        const cRect = containerRef.current.getBoundingClientRect();

        if (selectedPart.element && document.body.contains(selectedPart.element)) {
            const elRect = selectedPart.element.getBoundingClientRect();
            return {
                left: elRect.left - cRect.left,
                top: elRect.top - cRect.top,
                width: Math.max(elRect.width, 14),
                height: Math.max(elRect.height, 14)
            };
        } else if (selectedPart.rect) {
            return {
                left: selectedPart.rect.left - cRect.left,
                top: selectedPart.rect.top - cRect.top,
                width: selectedPart.rect.width,
                height: selectedPart.rect.height
            };
        }
        return null;
    };

    const getHoverOverlayBounds = () => {
        if (!containerRef.current || !hoveredInfo?.element || !document.body.contains(hoveredInfo.element)) return null;
        const cRect = containerRef.current.getBoundingClientRect();
        const elRect = hoveredInfo.element.getBoundingClientRect();
        return {
            left: elRect.left - cRect.left,
            top: elRect.top - cRect.top,
            width: elRect.width,
            height: elRect.height
        };
    };

    // Trigger AI Question for the selected part
    const handleAskQuestion = (question) => {
        if (!question || !question.trim() || !selectedPart) return;
        const trimmed = question.trim();

        // Get accurate diagram topic
        const currentTopic = activeBoardTitle || activeConcept || '';

        const fullPrompt = `Regarding "${selectedPart.label}" in the diagram:
${trimmed}

[Context:
- Selected Component: "${selectedPart.label}"
- Component Type: ${selectedPart.role || selectedPart.type || 'visual component'}
${selectedPart.details && selectedPart.details !== selectedPart.label ? `- Details: ${selectedPart.details}` : ''}
${currentTopic ? `- Current Diagram Topic: ${currentTopic}` : ''}
]`;

        setPendingUserPrompt({
            prompt: fullPrompt,
            autoSend: true
        });

        setQuestionInput('');
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 4000);
    };

    const handleInsertInChat = (question) => {
        const prompt = question?.trim()
            ? `Regarding "${selectedPart.label}": ${question.trim()}`
            : `Regarding "${selectedPart.label}": `;
        setPendingUserPrompt({
            prompt,
            autoSend: false
        });
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 3000);
    };

    // Handle Non-Passive Mouse Wheel Zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleNonPassiveWheel = (e) => {
            e.preventDefault();
            const factor = e.deltaY < 0 ? 1.18 : 0.85;
            setZoom(currentZoom => Math.min(30.0, Math.max(0.05, Number((currentZoom * factor).toFixed(2)))));
        };

        container.addEventListener('wheel', handleNonPassiveWheel, { passive: false });
        return () => {
            container.removeEventListener('wheel', handleNonPassiveWheel);
        };
    }, []);

    const handleResetView = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleZoomIn = () => {
        setZoom(z => Math.min(30.0, Number((z * 1.35).toFixed(2))));
    };

    const handleZoomOut = () => {
        setZoom(z => Math.max(0.05, Number((z * 0.75).toFixed(2))));
    };

    const handleFitView = () => {
        setZoom(0.85);
        setPosition({ x: 0, y: 0 });
    };

    const handleCopy = () => {
        if (activeBoardDiagram) {
            navigator.clipboard.writeText(activeBoardDiagram);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // Production Action: Request Complete Scientific Theory for Active Diagram
    const handleRequestDiagramTheory = useCallback(() => {
        if (!activeBoardDiagram || isAiTyping) return;
        const currentTopic = activeBoardTitle || activeConcept || 'this diagram';
        const cleanSnippet = activeBoardDiagram.trim().slice(0, 2500);
        const prompt = `Please provide a thorough scientific theory and step-by-step technical breakdown for "${currentTopic}" based on this exact diagram:

\`\`\`
${cleanSnippet}
\`\`\`

IMPORTANT INSTRUCTIONS:
- Explain in detail using clear technical prose, bullet points, and equations.
- Do NOT output or repeat any diagram code, SVG code, or Three.js code blocks in your reply. Provide ONLY the scientific theory:
1. Core Theory & Fundamental Governing Principles
2. Step-by-Step Breakdown of each component and its physical/systemic role
3. Dynamic Energy/Mass/Data Transfer mechanisms
4. Key Equations / Physical Laws and Real-World Applications`;

        setPendingUserPrompt({
            prompt,
            autoSend: true
        });
    }, [activeBoardDiagram, isAiTyping, activeBoardTitle, activeConcept, setPendingUserPrompt]);

    // Production Action: Focus & Center View on Active Selection
    const handleFocusSelection = useCallback(() => {
        if (!selectedPart || !containerRef.current) return;
        const container = containerRef.current;
        const cRect = container.getBoundingClientRect();

        let targetCenterX = 0;
        let targetCenterY = 0;

        if (selectedPart.element && document.body.contains(selectedPart.element)) {
            const elRect = selectedPart.element.getBoundingClientRect();
            targetCenterX = elRect.left + elRect.width / 2;
            targetCenterY = elRect.top + elRect.height / 2;
        } else if (selectedPart.rect) {
            targetCenterX = selectedPart.rect.left + selectedPart.rect.width / 2;
            targetCenterY = selectedPart.rect.top + selectedPart.rect.height / 2;
        } else {
            return;
        }

        const containerCenterX = cRect.left + cRect.width / 2;
        const containerCenterY = cRect.top + cRect.height / 2;

        const deltaX = containerCenterX - targetCenterX;
        const deltaY = containerCenterY - targetCenterY;

        setPosition(prev => ({
            x: Math.round(prev.x + deltaX),
            y: Math.round(prev.y + deltaY)
        }));
    }, [selectedPart]);

    // Production Action: Audio Read Aloud for Selected Component
    const handleReadAloud = useCallback(() => {
        if (isSpeakingComponent) {
            stopSpeaking();
            setIsSpeakingComponent(false);
            return;
        }
        if (!selectedPart) return;
        const currentTopic = activeBoardTitle || activeConcept || '';
        const textToSpeak = `${selectedPart.label}. Component type: ${selectedPart.role || 'visual element'}. ${selectedPart.details ? `Details: ${selectedPart.details}.` : ''} In the context of ${currentTopic || 'this diagram'}, this component represents an essential part of the system architecture and flow.`;
        setIsSpeakingComponent(true);
        speak(
            textToSpeak,
            () => setIsSpeakingComponent(true),
            () => setIsSpeakingComponent(false)
        );
    }, [selectedPart, isSpeakingComponent, activeBoardTitle, activeConcept]);

    // Production Action: One-Click Copy Component Context
    const handleCopyContext = useCallback(() => {
        if (!selectedPart) return;
        const currentTopic = activeBoardTitle || activeConcept || 'Diagram';
        const text = `Component: "${selectedPart.label}"\nType: ${selectedPart.role || 'Component'}\nDiagram: ${currentTopic}${selectedPart.id ? `\nID: #${selectedPart.id}` : ''}${selectedPart.details ? `\nDetails: ${selectedPart.details}` : ''}`;
        navigator.clipboard.writeText(text);
        setCopiedContext(true);
        setTimeout(() => setCopiedContext(false), 2000);
    }, [selectedPart, activeBoardTitle, activeConcept]);

    // Production Action: Cycle to Next/Previous Node with Tab / Shift+Tab
    const cycleNextNode = useCallback((reverse = false) => {
        const svgEl = svgWrapperRef.current?.querySelector('svg');
        if (!svgEl) return;
        const candidates = Array.from(svgEl.querySelectorAll('.node, .cluster, text, g[id]:not([id^="mermaid-"]), path.flow-arrow, path[marker-end]'))
            .map(el => findSelectableNode(el, svgEl))
            .filter((node, idx, arr) => node && arr.indexOf(node) === idx);

        if (candidates.length === 0) return;

        let nextIdx = 0;
        if (selectedPart?.element) {
            const currIdx = candidates.indexOf(selectedPart.element);
            if (currIdx !== -1) {
                nextIdx = reverse ? (currIdx - 1 + candidates.length) % candidates.length : (currIdx + 1) % candidates.length;
            }
        }

        const nextNode = candidates[nextIdx];
        if (nextNode) {
            const label = extractLabelFromNode(nextNode, svgEl);
            const r = nextNode.getBoundingClientRect();
            setSelectedPart({
                element: nextNode,
                label,
                fullText: label,
                role: nextNode.tagName?.toLowerCase() === 'path' ? 'Dynamic Flow Pathway' : 'Diagram Node',
                id: nextNode.id || '',
                tag: nextNode.tagName?.toLowerCase() || 'g',
                rect: { left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom }
            });
        }
    }, [selectedPart]);

    // Keyboard Shortcuts: Escape, V (pan), S (select), F (focus), Tab (cycle nodes)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Escape') {
                if (selectedPart) {
                    setSelectedPart(null);
                    stopSpeaking();
                    setIsSpeakingComponent(false);
                    return;
                }
                if (isFullscreen) {
                    setIsFullscreen(false);
                    if (document.fullscreenElement) {
                        document.exitFullscreen().catch(() => {});
                    }
                }
            } else if (e.key === 'v' || e.key === 'V') {
                setCanvasMode('pan');
            } else if (e.key === 's' || e.key === 'S') {
                setCanvasMode('select');
            } else if (e.key === 'f' || e.key === 'F') {
                if (selectedPart) {
                    e.preventDefault();
                    handleFocusSelection();
                }
            } else if (e.key === 'Tab') {
                if (canvasMode === 'select' || selectedPart) {
                    e.preventDefault();
                    cycleNextNode(e.shiftKey);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullscreen, selectedPart, canvasMode, handleFocusSelection, cycleNextNode]);

    const toggleFullscreen = () => {
        const next = !isFullscreen;
        setIsFullscreen(next);
        if (next) {
            if (containerRef.current?.parentElement && !document.fullscreenElement) {
                containerRef.current.parentElement.requestFullscreen?.().catch(() => {});
            }
        } else {
            if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
            }
        }
    };

    const themeStyles = {
        chalkboard: 'bg-[#0e1310] border-emerald-900/40 text-emerald-100',
        obsidian: 'bg-[#09090b] border-zinc-800 text-zinc-100',
        white: 'bg-white border-zinc-300 text-zinc-900'
    };

    return (
        <div className={`relative flex flex-col h-full w-full rounded-3xl overflow-hidden border shadow-2xl transition-all duration-300 ${themeStyles[boardTheme]} ${isFullscreen ? '!fixed !inset-0 !z-[9999] !w-screen !h-screen !rounded-none !border-none' : ''}`}>
            {/* Whiteboard Top Toolbar */}
            <header className={`px-4 py-2 flex items-center justify-between border-b transition-colors ${boardTheme === 'white' ? 'border-zinc-200 bg-zinc-50/90' : 'border-white/10 bg-black/30'} backdrop-blur-md z-10 flex-shrink-0 gap-2`}>
                {/* Left Side: Pan vs Select Tool Switcher */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-0.5 shadow-sm">
                        <button
                            onClick={() => { setCanvasMode('pan'); }}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                canvasMode === 'pan'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Pan Canvas (Drag to navigate, key: V)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>
                            <span>Pan</span>
                        </button>
                        <button
                            onClick={() => { setCanvasMode('select'); }}
                            className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                                canvasMode === 'select'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                            title="Select & Ask Questions on Any Part (Click node or drag box, key: S)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            <span>Select & Ask</span>
                        </button>
                    </div>

                    {/* Active Selection Badge in Header */}
                    {selectedPart && (
                        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 shadow-sm animate-in fade-in">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="font-bold max-w-[150px] truncate">{selectedPart.label}</span>
                            <button
                                onClick={() => setSelectedPart(null)}
                                className="text-zinc-400 hover:text-white ml-1 p-0.5"
                                title="Clear Selection (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Side Controls: Theme, Zoom, Replay, Code, Fullscreen */}
                <div className="flex items-center gap-2">
                    {/* Theme Selector */}
                    <div className={`hidden sm:flex items-center rounded-xl p-0.5 border ${boardTheme === 'white' ? 'bg-zinc-200/70 border-zinc-300' : 'bg-black/40 border-white/10'}`}>
                        <button
                            onClick={() => setBoardTheme('chalkboard')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${boardTheme === 'chalkboard' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50' : boardTheme === 'white' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Chalk
                        </button>
                        <button
                            onClick={() => setBoardTheme('obsidian')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${boardTheme === 'obsidian' ? 'bg-zinc-800 text-white' : boardTheme === 'white' ? 'text-zinc-600 hover:text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                            Dark
                        </button>
                        <button
                            onClick={() => setBoardTheme('white')}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all ${boardTheme === 'white' ? 'bg-white text-zinc-950 font-extrabold shadow-sm border border-zinc-300' : 'text-zinc-400 hover:text-white'}`}
                        >
                            White
                        </button>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-0.5">
                        <button
                            onClick={handleZoomOut}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Zoom Out (Min 5%)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                        </button>
                        <button
                            onClick={handleResetView}
                            className="px-2.5 py-0.5 text-[11px] font-mono font-bold text-zinc-300 hover:text-emerald-300 hover:bg-white/5 rounded transition-colors"
                            title="Reset to 100% & Center"
                        >
                            {Math.round(zoom * 100)}%
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Zoom In (Max 3000%)"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
                        </button>
                    </div>

                    {/* Replay Animation */}
                    {svgContent && (
                        <button
                            onClick={handleReplay}
                            disabled={isReplaying}
                            className={`px-3 py-1.5 bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-emerald-300 border border-white/10 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm ${isReplaying ? 'opacity-70 cursor-not-allowed' : ''}`}
                            title="Re-animate live diagram construction"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isReplaying ? 'animate-spin text-emerald-400' : ''}>
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                <path d="M16 21h5v-5"/>
                            </svg>
                            <span className="text-[11px] font-bold">{isReplaying ? 'Streaming...' : 'Replay'}</span>
                        </button>
                    )}

                    {/* Explain Theory for this diagram */}
                    {activeBoardDiagram && (
                        <button
                            onClick={handleRequestDiagramTheory}
                            disabled={isAiTyping}
                            className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/35 text-blue-300 hover:text-white border border-blue-500/40 hover:border-blue-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Generate in-depth technical theory for this diagram in chat"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                            <span>Theory</span>
                        </button>
                    )}

                    {/* Copy Code */}
                    {activeBoardDiagram && (
                        <button
                            onClick={handleCopy}
                            className="px-3 py-1.5 bg-black/40 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
                            title="Copy Mermaid Code"
                        >
                            {copied ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span className="text-[10px] text-emerald-400 font-bold">Copied</span>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>
                                    <span className="text-[10px]">Code</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className={`p-1.5 border rounded-xl transition-all ${isFullscreen ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-lg' : 'bg-black/40 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10'}`}
                        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Open Diagram in Fullscreen'}
                    >
                        {isFullscreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></svg>
                        )}
                    </button>
                </div>
            </header>

            {/* Draggable & Highly-Zoomable Board Canvas */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`flex-1 relative overflow-hidden flex items-center justify-center select-none ${
                    canvasMode === 'select'
                        ? 'cursor-crosshair'
                        : isDragging ? 'cursor-grabbing' : 'cursor-grab'
                }`}
            >
                {/* Chalkboard subtle grid texture background */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Live streaming indicator during AI generation */}
                {isAiTyping && svgContent && (
                    <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Live Rendering</span>
                    </div>
                )}

                {/* Mode Helper Badge (Select Mode Banner) */}
                {canvasMode === 'select' && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1 bg-emerald-950/90 border border-emerald-500/50 backdrop-blur-md rounded-full shadow-lg flex items-center gap-2 animate-in fade-in pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-emerald-300">
                            Select Mode Active: Click any node or drag a box across the canvas
                        </span>
                    </div>
                )}

                {/* Floating Bottom Left Navigation & Tool Info */}
                {svgContent && (
                    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                        <div className={`px-3 py-1.5 backdrop-blur-md rounded-xl border text-[11px] flex items-center gap-2 shadow-lg ${boardTheme === 'white' ? 'bg-white/90 border-zinc-300 text-zinc-800' : 'bg-black/60 border-white/10 text-zinc-300'}`}>
                            <span className={`font-mono font-bold ${boardTheme === 'white' ? 'text-emerald-700' : 'text-emerald-400'}`}>{Math.round(zoom * 100)}%</span>
                            <span className="opacity-40">•</span>
                            <span>{canvasMode === 'select' ? 'Click node or drag box' : 'Drag to pan'}</span>
                            <span className="opacity-40">•</span>
                            <span>Scroll to zoom</span>
                        </div>
                        <button
                            onClick={handleFitView}
                            className={`px-2.5 py-1.5 backdrop-blur-md rounded-xl border text-[10px] font-bold transition-all shadow-lg ${boardTheme === 'white' ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-800 hover:text-black' : 'bg-black/60 hover:bg-zinc-800 border-white/10 text-zinc-300 hover:text-white'}`}
                            title="Fit diagram to view"
                        >
                            Fit
                        </button>
                    </div>
                )}

                {/* Floating Bottom Right Quick Zoom Controls */}
                {svgContent && (
                    <div className={`absolute bottom-4 right-4 z-10 flex items-center backdrop-blur-md rounded-xl border p-1 shadow-lg gap-1 ${boardTheme === 'white' ? 'bg-white/90 border-zinc-300' : 'bg-black/60 border-white/10'}`}>
                        <button
                            onClick={handleZoomOut}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${boardTheme === 'white' ? 'text-zinc-700 hover:text-black hover:bg-zinc-100' : 'text-zinc-300 hover:text-white hover:bg-white/10'}`}
                            title="Zoom Out"
                        >
                            -
                        </button>
                        <button
                            onClick={handleResetView}
                            className={`px-2 text-[10px] font-mono ${boardTheme === 'white' ? 'text-zinc-700 hover:text-emerald-700' : 'text-zinc-300 hover:text-emerald-400'}`}
                            title="Reset 100%"
                        >
                            1x
                        </button>
                        <button
                            onClick={handleZoomIn}
                            className={`w-7 h-7 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${boardTheme === 'white' ? 'text-zinc-700 hover:text-black hover:bg-zinc-100' : 'text-zinc-300 hover:text-white hover:bg-white/10'}`}
                            title="Zoom In"
                        >
                            +
                        </button>
                    </div>
                )}

                {/* ── Visual Overlays: Selection Marquee, Hover Outline, and Selected Part Highlight ── */}

                {/* 1. Active Drag Marquee Box */}
                {selectionMarquee && containerRef.current && (() => {
                    const cRect = containerRef.current.getBoundingClientRect();
                    const minX = Math.min(selectionMarquee.startX, selectionMarquee.currentX) - cRect.left;
                    const minY = Math.min(selectionMarquee.startY, selectionMarquee.currentY) - cRect.top;
                    const width = Math.abs(selectionMarquee.currentX - selectionMarquee.startX);
                    const height = Math.abs(selectionMarquee.currentY - selectionMarquee.startY);

                    return (
                        <div
                            className="absolute pointer-events-none z-30 border-2 border-dashed border-emerald-400 bg-emerald-500/20 rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                            style={{
                                left: minX,
                                top: minY,
                                width,
                                height
                            }}
                        >
                            <div className="absolute -top-6 left-2 bg-emerald-950 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40 shadow-sm">
                                Selecting Region...
                            </div>
                        </div>
                    );
                })()}

                {/* 2. Hover Highlight Box (Select Mode Only) */}
                {canvasMode === 'select' && !selectionMarquee && hoveredInfo && (!selectedPart || hoveredInfo.label !== selectedPart.label) && containerRef.current && (() => {
                    const bounds = getHoverOverlayBounds();
                    if (!bounds || bounds.width < 5) return null;

                    return (
                        <div
                            className="absolute pointer-events-none z-20 transition-all duration-100 border border-dashed border-cyan-400/80 bg-cyan-500/10 rounded-lg shadow-sm"
                            style={{
                                left: bounds.left,
                                top: bounds.top,
                                width: bounds.width,
                                height: bounds.height
                            }}
                        >
                            <div className="absolute -top-6 left-0 bg-cyan-950/90 text-cyan-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-cyan-500/40 shadow-sm whitespace-nowrap">
                                Click to select {hoveredInfo.label.length > 25 ? hoveredInfo.label.slice(0, 25) + '...' : hoveredInfo.label}
                            </div>
                        </div>
                    );
                })()}

                {/* 3. Selected Part Active Highlight Box with Corner Pins */}
                {selectedPart && containerRef.current && (() => {
                    const bounds = getOverlayBounds();
                    if (!bounds) return null;

                    return (
                        <div
                            className="absolute pointer-events-none z-30 transition-all duration-150"
                            style={{
                                left: bounds.left,
                                top: bounds.top,
                                width: bounds.width,
                                height: bounds.height
                            }}
                        >
                            <div className="w-full h-full border-2 border-emerald-400 bg-emerald-400/15 rounded-xl shadow-[0_0_25px_rgba(52,211,153,0.5)] ring-2 ring-emerald-500/20 animate-pulse" />
                            {/* 4 Corner Pins */}
                            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-sm shadow-sm" />
                            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-sm shadow-sm" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-sm shadow-sm" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-emerald-400 border border-black rounded-sm shadow-sm" />

                            {/* Floating Selected Tag */}
                            <div className="absolute -top-7 left-0 bg-emerald-950/95 text-emerald-300 border border-emerald-500/60 px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                <span className="max-w-[220px] truncate">{selectedPart.label}</span>
                            </div>
                        </div>
                    );
                })()}

                {/* ── 4. Floating HUD: Collapsed Pill OR Full Inspection Card ── */}
                {selectedPart && (
                    isCardCollapsed ? (
                        /* Collapsed Floating Pill Mode */
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseMove={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="selection-card-ui absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-950/95 border border-emerald-500/50 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] rounded-full px-3.5 py-1.5 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3"
                        >
                            <div
                                onClick={() => setIsCardCollapsed(false)}
                                className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
                                title="Click to expand inspection card"
                            >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs font-bold text-white max-w-[150px] sm:max-w-[200px] truncate">
                                    {selectedPart.label}
                                </span>
                                <span className="text-[9px] uppercase font-extrabold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800/60 hidden sm:inline-block">
                                    {selectedPart.role || 'Component'}
                                </span>
                            </div>

                            <div className="h-3.5 w-[1px] bg-zinc-800" />

                            {/* Focus Button */}
                            <button
                                onClick={handleFocusSelection}
                                className="text-zinc-400 hover:text-emerald-300 p-1 rounded-md hover:bg-white/10 transition-colors"
                                title="Center / Focus Camera (Key: F)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                            </button>

                            {/* Voice TTS Button */}
                            <button
                                onClick={handleReadAloud}
                                className={`p-1 rounded-md transition-colors ${isSpeakingComponent ? 'text-emerald-400 bg-emerald-950/80 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                                title={isSpeakingComponent ? 'Stop Reading' : 'Listen / Read Aloud'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                            </button>

                            {/* Quick Ask Role */}
                            <button
                                onClick={() => handleAskQuestion(`What is the role and purpose of "${selectedPart.label}" in this diagram?`)}
                                disabled={isAiTyping}
                                className="px-2 py-0.5 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-md text-[10px] font-bold transition-all shadow-sm disabled:opacity-50"
                                title="Ask role and purpose"
                            >
                                Ask Role
                            </button>

                            {/* Expand Card Button */}
                            <button
                                onClick={() => setIsCardCollapsed(false)}
                                className="text-zinc-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                                title="Expand Details Card"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                            </button>

                            {/* Dismiss Selection */}
                            <button
                                onClick={() => {
                                    setSelectedPart(null);
                                    stopSpeaking();
                                    setIsSpeakingComponent(false);
                                }}
                                className="text-zinc-400 hover:text-red-400 p-1 rounded-md hover:bg-white/10 transition-colors"
                                title="Dismiss Selection (Esc)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                        </div>
                    ) : (
                        /* Full Inspection Card */
                        <div
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseMove={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                            className="selection-card-ui absolute bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[94%] sm:w-[520px] bg-zinc-950/95 border border-emerald-500/50 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] rounded-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6"
                        >
                            {/* Card Header with Smart Actions */}
                            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 shadow-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800/60">
                                                {selectedPart.type === 'area' ? `${selectedPart.count || 'Multi'} Elements Selected` : selectedPart.role || 'Component'}
                                            </span>
                                            {selectedPart.id && (
                                                <span className="text-[10px] font-mono text-zinc-500 truncate max-w-[120px]">
                                                    #{selectedPart.id}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-sm font-bold text-white truncate mt-0.5" title={selectedPart.label}>
                                            {selectedPart.label}
                                        </h4>
                                    </div>
                                </div>

                                {/* Header Actions Toolbar */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    {/* Focus Center Camera */}
                                    <button
                                        onClick={handleFocusSelection}
                                        className="p-1.5 text-zinc-400 hover:text-emerald-300 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Center View on Selected Part (Shortcut: F)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>
                                    </button>

                                    {/* Audio TTS Read Aloud */}
                                    <button
                                        onClick={handleReadAloud}
                                        className={`p-1.5 rounded-lg transition-colors ${isSpeakingComponent ? 'text-emerald-400 bg-emerald-950/80 animate-pulse' : 'text-zinc-400 hover:text-white hover:bg-white/10'}`}
                                        title={isSpeakingComponent ? 'Stop Reading Aloud' : 'Read Aloud with Audio TTS'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                                    </button>

                                    {/* Copy Component Context */}
                                    <button
                                        onClick={handleCopyContext}
                                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Copy Component Context to Clipboard"
                                    >
                                        {copiedContext ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                                        )}
                                    </button>

                                    {/* Minimize to Pill */}
                                    <button
                                        onClick={() => setIsCardCollapsed(true)}
                                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Minimize to Floating Pill"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                                    </button>

                                    {/* Dismiss Selection */}
                                    <button
                                        onClick={() => {
                                            setSelectedPart(null);
                                            stopSpeaking();
                                            setIsSpeakingComponent(false);
                                        }}
                                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                        title="Clear Selection (Esc)"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                </div>
                            </div>

                            {/* Quick Question Chips */}
                            <div className="my-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 flex items-center gap-1">
                                    <span>⚡ Quick Questions:</span>
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {[
                                        { label: 'Role & Function', query: `What is the role and purpose of "${selectedPart.label}" in this diagram?` },
                                        { label: 'How it Works', query: `Explain step-by-step how "${selectedPart.label}" functions and what happens here.` },
                                        { label: 'Connections & Flow', query: `How does "${selectedPart.label}" interact and connect with the other components in this diagram?` },
                                        { label: 'Deep Dive', query: `Provide an in-depth explanation with key details and concepts about "${selectedPart.label}".` }
                                    ].map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAskQuestion(item.query)}
                                            disabled={isAiTyping}
                                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900/90 hover:bg-emerald-950/80 text-zinc-300 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-500/50 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Question Input */}
                            <div className="space-y-2">
                                <div className="relative flex items-center">
                                    <input
                                        type="text"
                                        value={questionInput}
                                        onChange={(e) => setQuestionInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleAskQuestion(questionInput);
                                            }
                                        }}
                                        placeholder={`Ask a question about "${selectedPart.label.length > 20 ? selectedPart.label.slice(0, 20) + '...' : selectedPart.label}"...`}
                                        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 focus:border-emerald-500 text-white text-xs rounded-xl pl-3 pr-20 py-2.5 outline-none transition-all placeholder:text-zinc-500 shadow-inner"
                                    />
                                    <button
                                        onClick={() => handleAskQuestion(questionInput)}
                                        disabled={!questionInput.trim() || isAiTyping}
                                        className="absolute right-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white disabled:text-zinc-500 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-md disabled:cursor-not-allowed"
                                    >
                                        <span>Ask AI</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                    </button>
                                </div>

                                {/* Bottom Status / Secondary action / Shortcuts */}
                                <div className="flex items-center justify-between text-[11px] pt-1 text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleInsertInChat(questionInput)}
                                            className="hover:text-emerald-300 transition-colors flex items-center gap-1 text-[10px]"
                                            title="Transfer question into main chat input to edit"
                                        >
                                            <span>Edit in chat panel ↗</span>
                                        </button>
                                        <span className="opacity-30">•</span>
                                        <span className="text-[10px] text-zinc-500 hidden sm:inline">
                                            Keys: <kbd className="px-1 py-0.2 bg-zinc-800 rounded font-mono text-[9px] text-zinc-400">F</kbd> Focus • <kbd className="px-1 py-0.2 bg-zinc-800 rounded font-mono text-[9px] text-zinc-400">Tab</kbd> Next
                                        </span>
                                    </div>

                                    {sentSuccess ? (
                                        <span className="text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                            Sent to Tyloop AI! Check chat panel
                                        </span>
                                    ) : isAiTyping ? (
                                        <span className="text-emerald-300/80 font-medium flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                            AI responding in chat...
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500 text-[10px]">Press Enter to ask</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                )}

                {/* ── Main SVG Render Layer ── */}
                {svgContent ? (
                    <div
                        ref={svgWrapperRef}
                        className={`relative w-full min-h-full flex items-center justify-center pointer-events-auto ${
                            canvasMode === 'select' ? '[&>div>svg]:cursor-crosshair [&>div>svg_*]:cursor-pointer' : ''
                        }`}
                    >
                        <div
                            className={`origin-center flex items-center justify-center max-w-none w-full min-h-full p-6 [&>svg]:max-w-[95%] [&>svg]:h-auto ${boardTheme === 'white' ? 'filter invert hue-rotate-180 brightness-95' : ''}`}
                            style={{
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                transformOrigin: 'center center'
                            }}
                            dangerouslySetInnerHTML={{ __html: streamedSvg || svgContent }}
                        />
                    </div>
                ) : renderError ? (
                    <div className="text-center p-8 max-w-md mx-auto space-y-3 bg-red-950/20 border border-red-900/40 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h4 className="text-sm font-semibold text-red-300">Diagram Rendering Issue</h4>
                        <p className="text-xs text-red-400/80 font-mono overflow-auto max-h-24 p-2 bg-black/40 rounded-lg text-left">
                            {renderError}
                        </p>
                    </div>
                ) : isAiTyping ? (
                    <div className="text-center space-y-4">
                        <div className="relative w-16 h-16 mx-auto">
                            <div className="w-16 h-16 rounded-2xl border-2 border-emerald-500/30 animate-ping absolute inset-0" />
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.21-8.58" /><path d="M15 3h6v6" /></svg>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-emerald-300">Drawing on Board...</p>
                            <p className="text-xs text-zinc-500">Tyloop is generating the visual flowchart</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 max-w-sm mx-auto space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-emerald-400 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-white">Classroom Whiteboard Ready</h3>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Ask any concept, system, algorithm, or process in the chat to see it diagrammed live on the board.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
