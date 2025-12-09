
import { KnowledgeResource } from "../../types";
import { callGeminiWithJSON } from "./geminiService";
import { PromptTemplates } from "./prompts";

const INITIAL_RESOURCES: KnowledgeResource[] = [
    // ... (initial resources data)
];

// This function is now adapted to use the AI Logic backend.
export const addResourceFromUrl = async (url: string): Promise<KnowledgeResource> => {
    console.log(`Analyzing URL with AI Logic: ${url}`);
    
    // 1. Create the prompt using the existing template
    const prompt = PromptTemplates.analyzeResource(url, null); 
    
    // 2. Call the backend endpoint
    const aiData = await callGeminiWithJSON(prompt);
    
    if (aiData.error) {
        throw new Error(`AI Analysis Failed: ${aiData.reason}`);
    }

    // 4. Map the AI response to the KnowledgeResource structure
    const newResource: KnowledgeResource = {
        id: `kr_${Date.now()}`,
        title: aiData.basicInfo?.title || "Untitled Resource",
        summary: aiData.basicInfo?.summary || "No summary available.",
        contentType: aiData.basicInfo?.contentType || 'article',
        sourceUrl: url,
        status: 'processed',
        createdAt: new Date().toISOString(),
        tags: aiData.basicInfo?.tags || [],
        // Add other fields from aiData as necessary
    };

    console.log("New resource created:", newResource);
    // Here you would typically save the newResource to your database (e.g., Firestore)
    // For this example, we'll just return it.
    return newResource;
};


export const getKnowledgeResources = async (): Promise<KnowledgeResource[]> => {
    // This is a mock function. In a real app, you would fetch this from Firestore.
    return Promise.resolve(INITIAL_RESOURCES);
};
