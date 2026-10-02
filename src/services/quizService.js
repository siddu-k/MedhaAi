import { streamChat } from './aiService';

/**
 * Extract plain text from uploaded files (PDF, DOCX, TXT, MD, JSON, CSV, CODE)
 */
export async function extractDocumentText(file) {
    if (!file) return '';

    const name = file.name.toLowerCase();

    // 1. Plain text, markdown, json, csv, code files
    if (
        name.endsWith('.txt') ||
        name.endsWith('.md') ||
        name.endsWith('.json') ||
        name.endsWith('.csv') ||
        name.endsWith('.js') ||
        name.endsWith('.jsx') ||
        name.endsWith('.ts') ||
        name.endsWith('.tsx') ||
        name.endsWith('.py') ||
        name.endsWith('.java') ||
        name.endsWith('.cpp') ||
        name.endsWith('.c') ||
        name.endsWith('.html') ||
        name.endsWith('.css') ||
        file.type.startsWith('text/')
    ) {
        return await file.text();
    }

    // 2. PDF Files (Streamlined browser text extraction fallback + structure scanner)
    if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            // Fast browser binary stream text chunk scanner
            let extracted = '';
            let inText = false;
            let currentWord = '';

            for (let i = 0; i < bytes.length; i++) {
                const charCode = bytes[i];
                // ASCII readable range: 32 (space) to 126 (~), newline 10, return 13
                if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13) {
                    currentWord += String.fromCharCode(charCode);
                } else {
                    if (currentWord.length > 3) {
                        // Filter out binary PDF tags and keywords
                        const clean = currentWord.trim();
                        if (!clean.startsWith('/') && !clean.startsWith('obj') && !clean.startsWith('endobj') && !clean.includes('Filter') && !clean.includes('Stream')) {
                            extracted += clean + ' ';
                        }
                    }
                    currentWord = '';
                }
            }

            if (extracted.trim().length > 100) {
                return extracted.substring(0, 15000);
            }
        } catch (e) {
            console.warn('PDF stream extraction error, using name fallback:', e);
        }
        return `Document: ${file.name} (${Math.round(file.size / 1024)} KB)`;
    }

    // 3. Fallback for Word doc or others
    try {
        const text = await file.text();
        if (text && text.length > 50) return text.substring(0, 15000);
    } catch (e) {
        // ignore
    }

    return `Document: ${file.name} (${Math.round(file.size / 1024)} KB)`;
}

/**
 * Sanitize JSON string to fix common LLM formatting issues like unescaped LaTeX backslashes,
 * trailing commas, and literal linebreaks inside quotes.
 */
function sanitizeAndParseJSON(str) {
    if (!str || typeof str !== 'string') return null;

    // Remove markdown code fences
    let clean = str.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

    // Find first { or [
    const firstBrace = clean.indexOf('{');
    const firstBracket = clean.indexOf('[');
    let startIdx = -1;
    let isArray = false;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIdx = firstBrace;
    } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        isArray = true;
    }

    if (startIdx !== -1) {
        const endChar = isArray ? ']' : '}';
        const lastIdx = clean.lastIndexOf(endChar);
        if (lastIdx > startIdx) {
            clean = clean.substring(startIdx, lastIdx + 1);
        }
    }

    // Attempt 1: Direct JSON parse
    try {
        return JSON.parse(clean);
    } catch (e) {
        // continue to sanitization
    }

    // Attempt 2: Fix trailing commas
    let repaired = clean.replace(/,\s*([\}\]])/g, '$1');

    // Fix unescaped backslashes (common in LaTeX / math like \O, \omega, \theta, \lambda)
    // Replace \ that is NOT followed by ", \, /, b, f, n, r, t, or uXXXX with \\
    repaired = repaired.replace(/\\(?:[^"\\/bfnrtu]|u(?![\da-fA-F]{4}))/g, (match) => {
        return '\\' + match;
    });

    try {
        return JSON.parse(repaired);
    } catch (e) {
        // continue
    }

    // Attempt 3: Fix literal unescaped newlines in strings
    repaired = repaired.replace(/(?<=:\s*"[^"]*)\n(?=[^"]*")/g, '\\n');
    try {
        return JSON.parse(repaired);
    } catch (e) {
        // continue
    }

    return null;
}

/**
 * Sanitize a question object to ensure required fields
 */
function sanitizeQuestionObject(q, idx) {
    const options = Array.isArray(q.options) && q.options.length >= 2
        ? q.options.map(opt => String(opt).trim())
        : ['Option A', 'Option B', 'Option C', 'Option D'];

    // Ensure exactly 4 options
    while (options.length < 4) {
        options.push(`Alternative Option ${options.length + 1}`);
    }

    let correctIdx = Number(q.correctAnswerIndex);
    if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) {
        correctIdx = 0;
    }

    return {
        id: q.id || (idx + 1),
        question: String(q.question || `Assessment Question ${idx + 1}`).trim(),
        options: options.slice(0, 4),
        correctAnswerIndex: correctIdx,
        explanation: String(q.explanation || 'Mechanical rationale provided for this question.').trim(),
        difficulty: q.difficulty || 'medium'
    };
}

/**
 * Guaranteed fallback quiz generator to prevent app crashes
 */
function generateFallbackQuiz(topic, count = 5) {
    const questions = [];
    const targetCount = Math.max(1, Math.min(10, Number(count) || 5));

    for (let i = 1; i <= targetCount; i++) {
        questions.push({
            id: i,
            question: `Which fundamental principle is central to ${topic} (Module ${i})?`,
            options: [
                `Optimal trade-offs between execution speed, memory bounds, and architectural simplicity`,
                `Unrestricted memory allocation with zero lock synchronization overhead`,
                `Linear sequential scanning without index optimization or caching`,
                `Static monolithic deployment with hardcoded configuration parameters`
            ],
            correctAnswerIndex: 0,
            explanation: `In ${topic}, balancing execution efficiency with spatial bounds and architectural modularity provides baseline production stability.`,
            difficulty: 'medium'
        });
    }

    return {
        title: `${topic} Assessment`,
        topic: topic,
        difficulty: 'medium',
        totalQuestions: targetCount,
        questions
    };
}

/**
 * Clean and parse Quiz JSON output from LLM, with robust multi-stage fallbacks
 */
export function parseQuizJSON(rawText, fallbackTopic = 'Technical Knowledge', expectedCount = 5) {
    if (!rawText) return generateFallbackQuiz(fallbackTopic, expectedCount);

    // 1. Sanitize & parse whole string
    const parsed = sanitizeAndParseJSON(rawText);
    if (parsed) {
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
            return {
                ...parsed,
                questions: parsed.questions.map((q, idx) => sanitizeQuestionObject(q, idx))
            };
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
            return {
                title: `${fallbackTopic} Assessment`,
                topic: fallbackTopic,
                difficulty: 'medium',
                totalQuestions: parsed.length,
                questions: parsed.map((q, idx) => sanitizeQuestionObject(q, idx))
            };
        }
    }

    // 2. Extract individual JSON question objects with Regex
    const questionObjRegex = /\{\s*"id"\s*:\s*\d+[\s\S]*?"question"\s*:\s*"[\s\S]*?"options"\s*:\s*\[[\s\S]*?\][\s\S]*?\}/g;
    const matches = rawText.match(questionObjRegex);
    if (matches && matches.length > 0) {
        const extracted = [];
        for (let i = 0; i < matches.length; i++) {
            const qParsed = sanitizeAndParseJSON(matches[i]);
            if (qParsed && qParsed.question && Array.isArray(qParsed.options)) {
                extracted.push(sanitizeQuestionObject(qParsed, i));
            }
        }
        if (extracted.length > 0) {
            return {
                title: `${fallbackTopic} Assessment`,
                topic: fallbackTopic,
                difficulty: 'medium',
                totalQuestions: extracted.length,
                questions: extracted
            };
        }
    }

    // 3. Heuristic Markdown Question Parser (e.g. Q1. ... A) ... B) ...)
    const qBlocks = rawText.split(/(?:^|\n)(?:Q(?:uestion)?\s*\d+[:.]|\d+[\.)]\s+)/i).filter(b => b.trim().length > 20);
    if (qBlocks.length >= 1) {
        const extractedQuestions = qBlocks.map((block, idx) => {
            const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
            const questionText = lines[0] || `Assessment Question ${idx + 1} on ${fallbackTopic}`;
            const rawOptions = lines.filter(l => /^[A-Da-d][\).:]|^\([A-Da-d]\)/.test(l))
                                    .map(l => l.replace(/^[A-Da-d][\).:]\s*|^\([A-Da-d]\)\s*/, '').trim());
            const options = rawOptions.length === 4 ? rawOptions : [
                rawOptions[0] || 'Primary theoretical framework',
                rawOptions[1] || 'Secondary architectural implementation',
                rawOptions[2] || 'Alternative algorithmic strategy',
                rawOptions[3] || 'System optimization protocol'
            ];

            return {
                id: idx + 1,
                question: questionText,
                options,
                correctAnswerIndex: 0,
                explanation: `Detailed mechanical breakdown for ${questionText.substring(0, 50)}...`,
                difficulty: 'medium'
            };
        });

        if (extractedQuestions.length > 0) {
            return {
                title: `${fallbackTopic} Assessment`,
                topic: fallbackTopic,
                difficulty: 'medium',
                totalQuestions: extractedQuestions.length,
                questions: extractedQuestions
            };
        }
    }

    // 4. Guaranteed Fallback Quiz Generation
    return generateFallbackQuiz(fallbackTopic, expectedCount);
}

/**
 * Generate a complete AI Quiz from a topic, custom text, or uploaded document
 */
export async function generateQuiz({
    topic = '',
    documentText = '',
    questionCount = 5,
    difficulty = 'medium', // 'easy' | 'medium' | 'hard' | 'adaptive'
    model = null,
    onProgress
}) {
    const contextContent = documentText ? `SOURCE DOCUMENT KNOWLEDGE BASE:\n"""\n${documentText.substring(0, 12000)}\n"""` : '';
    const subject = topic.trim() || 'Core Engineering & Computing Principles';
    const targetCount = Number(questionCount) || 5;

    const prompt = `You are a Senior Principal Examiner, Lead Educator, and Technical Assessor.
MANDATORY REQUIREMENT: You MUST generate EXACTLY ${targetCount} DISTINCT multiple-choice questions (Not 1, not 2, but EXACTLY ${targetCount} questions in the "questions" array).

TOPIC: "${subject}"
TARGET QUESTION COUNT: EXACTLY ${targetCount} QUESTIONS
DIFFICULTY LEVEL: ${difficulty.toUpperCase()}
${contextContent}

CRITICAL RULES:
1. ARRAY LENGTH: The "questions" array in your JSON output MUST contain EXACTLY ${targetCount} question objects.
2. SUBSTANCE: Every question must be deeply substantive, technically accurate, and test real comprehension, architectural principles, algorithms, or practical implementation.
3. 4 CHOICES: Each question MUST provide exactly 4 distinct, plausible options (A, B, C, D) in the "options" array.
4. ONE CORRECT: "correctAnswerIndex" MUST be an integer from 0 to 3 (0=A, 1=B, 2=C, 3=D).
5. SCIENTIFIC & MATHEMATICAL SYMBOLS:
   - Format equations, complexity bounds, and mathematical symbols using standard LaTeX/KaTeX: e.g. $O(N \\log N)$, $T(n) = 2T(n/2) + O(n)$, $\\Omega(1)$, $\\Theta(N)$, $\\lambda$, $\\pi$, $V = IR$.
   - Format code variables, keywords, and data structures in backticks: e.g. \`Array[i]\`, \`pthread_mutex_lock()\`, \`useState\`, \`B-Tree\`.
   - When appropriate for algorithmic or architectural questions, include concise Mermaid diagrams inside the explanation: e.g. \`\`\`mermaid\\ngraph TD\\n  A --> B\\n\`\`\`.
6. DETAILED EXPLANATION: Provide a thorough "explanation" field for each question detailing the internal mechanics and why the answer is correct.
7. OUTPUT MUST BE STRICTLY A VALID JSON OBJECT enclosed in \`\`\`json ... \`\`\` with NO other text outside the block.

JSON OUTPUT STRUCTURE (CONTAINING ALL ${targetCount} QUESTIONS):
\`\`\`json
{
  "title": "${subject} Assessment",
  "topic": "${subject}",
  "difficulty": "${difficulty}",
  "totalQuestions": ${targetCount},
  "questions": [
    {
      "id": 1,
      "question": "Question 1 text here...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Mechanical and theoretical explanation for Question 1.",
      "difficulty": "${difficulty}"
    }
  ]
}
\`\`\``;

    const messages = [
        { role: 'user', content: prompt }
    ];

    let fullResponse = '';
    try {
        await streamChat(
            messages,
            (partial) => {
                fullResponse = partial;
                if (onProgress) onProgress(partial);
            },
            null,
            model,
            { isQuizMode: true }
        );
    } catch (err) {
        console.warn('AI Streaming Error during quiz generation, switching to fallback quiz:', err);
    }

    const parsedQuiz = parseQuizJSON(fullResponse, subject, targetCount);
    return parsedQuiz || generateFallbackQuiz(subject, targetCount);
}
