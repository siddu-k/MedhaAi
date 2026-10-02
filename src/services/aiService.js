import { streamGeminiChat, generateGeminiSummary, isGeminiModel, POPULAR_GEMINI_MODELS, testGeminiApiKey, runGeminiInteraction, extract3DCode } from './geminiService';
import {
    streamChat as streamOllamaChat,
    generateSummary as generateOllamaSummary,
    listLocalModels,
    pullModel,
    extractMermaidDiagram,
    fileToBase64
} from './ollamaService';
import useAppStore from '../stores/appStore';

/**
 * Unified stream chat dispatcher
 * Dispatches to Gemini API if the model is a Gemini model, otherwise to Ollama local AI.
 */
export async function streamChat(messages, onToken, signal, model = null, modeData = null) {
    const store = useAppStore.getState();
    const effectiveModel = model || store.selectedModel || 'gemini-3.5-flash-lite';

    if (isGeminiModel(effectiveModel)) {
        const apiKey = store.geminiApiKey;
        return streamGeminiChat(messages, onToken, signal, effectiveModel, modeData, apiKey);
    } else {
        return streamOllamaChat(messages, onToken, signal, effectiveModel, modeData);
    }
}

/**
 * Unified conversation summary generator
 */
export async function generateSummary(messages, model = null) {
    const store = useAppStore.getState();
    const effectiveModel = model || store.selectedModel || 'gemini-3.5-flash-lite';

    if (isGeminiModel(effectiveModel)) {
        return generateGeminiSummary(messages, effectiveModel, store.geminiApiKey);
    } else {
        return generateOllamaSummary(messages);
    }
}

export {
    // Gemini exports
    isGeminiModel,
    POPULAR_GEMINI_MODELS,
    testGeminiApiKey,
    runGeminiInteraction,
    streamGeminiChat,
    generateGeminiSummary,
    extract3DCode,

    // Ollama exports
    listLocalModels,
    pullModel,
    extractMermaidDiagram,
    fileToBase64,
    streamOllamaChat,
    generateOllamaSummary
};
