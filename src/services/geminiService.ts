
import { GoogleGenerativeAI, GenerationConfig, Part, Content, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { AI_CONFIG } from '../../constants';
import { PromptTemplates } from './prompts';
import { Task, VideoAnalysisResult, AIAnalysis, Subtask } from '../../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

async function callGemini(prompt: string, modelName: string = AI_CONFIG.MODEL_SMART): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error(`Error calling Gemini (${modelName}):`, error);
        throw new Error(`AI model (${modelName}) failed to respond.`);
    }
}

export async function callGeminiWithJSON(prompt: string, modelName: string = AI_CONFIG.MODEL_SMART): Promise<any> {
    const textResponse = await callGemini(prompt, modelName);
    try {
        const cleanedJsonString = textResponse.replace(/\`\`\`json|\`\`\`/g, '').trim();
        return JSON.parse(cleanedJsonString);
    } catch (error) {
        console.error("Error parsing JSON from Gemini response:", textResponse);
        throw new Error("AI model failed to return a valid JSON.");
    }
}

export const analyzeTaskWithAI = async (task: Task): Promise<AIAnalysis> => {
    const prompt = PromptTemplates.analyzeTask(task);
    return await callGeminiWithJSON(prompt) as AIAnalysis;
};

export const generateSubtasksAI = async (task: Task): Promise<Partial<Subtask>[]> => {
    const prompt = PromptTemplates.generateSubtasks(task);
    const result = await callGeminiWithJSON(prompt);
    return result.subtasks || [];
};

export const chatWithGuide = async (history: Content[], newMessage: string, task: Task): Promise<string> => {
    const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL_SMART, safetySettings });
    const chat = model.startChat({ history, generationConfig: { maxOutputTokens: 1000 } });
    const prompt = PromptTemplates.chat(newMessage, task);
    const result = await chat.sendMessage(prompt);
    return result.response.text();
};

export const draftTaskWithAI = async (userInput: string): Promise<Partial<Task>[]> => {
    const prompt = PromptTemplates.draftTask(userInput);
    const result = await callGeminiWithJSON(prompt);
    return result.drafts || [];
};

export async function* getGeminiChatStream(
    history: Content[], message: string, modelName: string, imageBase64?: string, imageMimeType?: string
): AsyncGenerator<{ text?: string; error?: string }> {
    const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
    const chat = model.startChat({ history, generationConfig: { maxOutputTokens: 4096 } });
    try {
        const content: (string | Part)[] = [message];
        if (imageBase64 && imageMimeType) {
            content.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
        }
        const result = await chat.sendMessageStream(content);
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) yield { text: chunkText };
        }
    } catch (error: any) {
        console.error("Error in getGeminiChatStream:", error);
        yield { error: error.message || "An unknown error occurred during the stream." };
    }
}

export const analyzeResourceWithAI = async (url: string): Promise<any> => {
    const youtubeVideoId = extractYouTubeVideoId(url);
    const prompt = PromptTemplates.analyzeResource(url, youtubeVideoId);
    const result = await callGeminiWithJSON(prompt);
    if (result.error) throw new Error(`AI Analysis Failed: ${result.reason}`);
    return result;
};

export const getQuickSummaryFromAI = async (url: string): Promise<string> => {
    const prompt = PromptTemplates.quickSummarize(url);
    return await callGemini(prompt, AI_CONFIG.MODEL_FAST);
}

export const analyzeVideoFrames = async (frames: { mimeType: string; data: string }[], duration: number): Promise<VideoAnalysisResult> => {
    try {
        const model = genAI.getGenerativeModel({ model: AI_CONFIG.MODEL_SMART, safetySettings });
        const prompt = PromptTemplates.analyzeVideoFrames(frames.length, duration);
        const imageParts: Part[] = frames.map(frame => ({ inlineData: { mimeType: frame.mimeType, data: frame.data } }));
        const result = await model.generateContent([prompt, ...imageParts]);
        const text = result.response.text();
        const cleanedJson = text.replace(/\`\`\`json|\`\`\`/g, '').trim();
        const parsedResult = JSON.parse(cleanedJson);
        if (parsedResult.error) throw new Error(`AI Analysis Failed: ${parsedResult.reason}`);
        return parsedResult as VideoAnalysisResult;
    } catch (error) {
        console.error("Error analyzing video frames:", error);
        throw new Error("Failed to analyze video frames with AI.");
    }
}

const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};
