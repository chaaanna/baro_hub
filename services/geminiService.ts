
import { GoogleGenAI, Type } from "@google/genai";
import { Task, AIAnalysis, Subtask, Priority, KnowledgeResource } from "../types";
import { AI_CONFIG } from "../constants";
import { PromptTemplates } from "./prompts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for JSON generation to reduce duplication
async function generateJSON<T>(prompt: string, schema: any): Promise<T | null> {
    try {
        const response = await ai.models.generateContent({
            model: AI_CONFIG.MODEL_FAST,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        if (response.text) {
            return JSON.parse(response.text) as T;
        }
        return null;
    } catch (error) {
        console.error("Gemini JSON Gen Error:", error);
        throw error;
    }
}

// Helper to extract YouTube Video ID
function extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Drafts 3 versions of professional tasks from a raw user input.
 */
export const draftTaskWithAI = async (rawInput: string): Promise<Partial<Task>[]> => {
  const prompt = PromptTemplates.draftTask(rawInput);

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        product: { type: Type.STRING },
        type: { type: Type.STRING },
        styleTag: { type: Type.STRING }
      }
    }
  };

  const data = await generateJSON<any[]>(prompt, schema);
  
  if (!data || !Array.isArray(data)) throw new Error("Draft generation failed");

  return data.map(item => {
      let priority = Priority.MEDIUM;
      if (item.priority === 'HIGH') priority = Priority.HIGH;
      if (item.priority === 'LOW') priority = Priority.LOW;
      
      return {
          title: item.title,
          description: item.description,
          product: item.product,
          type: item.type,
          priority: priority,
          styleTag: item.styleTag 
      };
  });
};

/**
 * Analyzes a task to provide a strategy and learning resources.
 */
export const analyzeTaskWithAI = async (task: Task): Promise<AIAnalysis> => {
  const prompt = PromptTemplates.analyzeTask(task);

  const schema = {
    type: Type.OBJECT,
    properties: {
      strategy: { type: Type.STRING, description: "핵심 파악 사항과 실행 전략이 포함된 마크다운" },
      suggestedResources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING }
          }
        }
      }
    }
  };

  const data = await generateJSON<any>(prompt, schema);
  if (data) return { ...data, lastUpdated: Date.now() };
  throw new Error("Analysis failed");
};

/**
 * Generates a checklist of subtasks.
 */
export const generateSubtasksAI = async (task: Task): Promise<Omit<Subtask, 'id' | 'completed'>[]> => {
  const prompt = PromptTemplates.generateSubtasks(task);

  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING }
      }
    }
  };

  const data = await generateJSON<any[]>(prompt, schema);
  return data || [];
};

/**
 * Analyzes a URL or Topic using Google Search Grounding to create a Knowledge Resource.
 * Uses Gemini 3.0 Pro for deep analysis and returns structured JSON.
 */
export const analyzeResourceWithAI = async (url: string): Promise<Omit<KnowledgeResource, 'id'>> => {
    const videoId = extractYouTubeVideoId(url);
    const prompt = PromptTemplates.analyzeResource(url, videoId);

    // Using Gemini 3.0 Pro with higher temperature for creative fallback
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.4,
            responseMimeType: "application/json" // Enforce JSON output
        }
    });

    if (!response.text) {
        throw new Error("No response from AI");
    }

    try {
        const data = JSON.parse(response.text);
        return data as Omit<KnowledgeResource, 'id'>;
    } catch (e) {
        console.error("Failed to parse AI response", e);
        // Fallback structure in case parsing fails
        return {
            basicInfo: {
                title: "분석 실패",
                summary: "데이터를 파싱할 수 없습니다.",
                level: "BEGINNER",
                tags: [],
                contentType: "article"
            },
            metadata: {
                category: "기타",
                uploadedAt: new Date().toISOString()
            },
            searchOptimization: {
                keywords: [],
                chapters: []
            },
            managementInfo: {
                status: 'draft',
                visibility: 'private',
                originalFileUrl: url,
                lastUpdated: new Date().toISOString()
            }
        };
    }
};

/**
 * Chat with the AI guide about the specific task.
 */
export const chatWithGuide = async (history: {role: string, parts: {text: string}[]}[], message: string, contextTask: Task) => {
    const chat = ai.chats.create({
        model: AI_CONFIG.MODEL_SMART,
        history: [
            {
                role: 'user',
                parts: [{ text: PromptTemplates.chatGuideSystem(contextTask) }]
            },
            {
                role: 'model',
                parts: [{ text: "네, 알겠습니다. 업무 진행을 도와드리겠습니다." }]
            },
            ...history
        ]
    });

    const result = await chat.sendMessage({ message });
    return result.text;
}

/**
 * General purpose streaming chat for Gemini Pro Page with Multimodal support
 */
export const getGeminiChatStream = async (
    history: {role: string, parts: {text?: string, inlineData?: any}[]}[], 
    message: string,
    modelId: string = AI_CONFIG.MODEL_SMART,
    imageBase64?: string,
    imageMimeType?: string
) => {
    const chat = ai.chats.create({
        model: modelId,
        history: [
           {
                role: 'user',
                parts: [{ text: "당신은 Nexus AI 플랫폼의 지능형 어시스턴트 Gemini입니다. 사용자의 업무 생산성을 높이고, 창의적인 아이디어를 제공하며, 친절하고 전문적인 태도로 대화하세요. 한국어로 답변하세요." }]
            },
            {
                role: 'model',
                parts: [{ text: "반갑습니다! Nexus AI Gemini입니다. 무엇을 도와드릴까요?" }]
            },
            ...history
        ]
    });

    // Construct content parts
    const parts: any[] = [];
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
    }
    if (message) {
        parts.push({ text: message });
    }

    // Use parts structure for multimodal
    return await chat.sendMessageStream({ message: parts });
};
