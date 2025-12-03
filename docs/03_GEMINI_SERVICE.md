# 3. 핵심 AI 서비스 통합 (Core AI Service)

이 모듈은 UI와 Google Gemini API 사이의 다리 역할을 합니다.
클라이언트 초기화, JSON 구조화 생성(Structured Output), 채팅 스트리밍 기능을 담당합니다.

## 🛠 서비스 계층 구현 (Service Layer)

`gemini.ts` 또는 유사한 이름의 서비스 파일에 다음 로직을 구현합니다.

```typescript
import { GoogleGenAI, Type } from "@google/genai";

// 1. 클라이언트 초기화
// Vite 환경에서는 import.meta.env 사용
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// 2. 모델 설정 상수
export const AI_CONFIG = {
  MODEL_FAST: 'gemini-2.5-flash',       // 단순 작업, JSON 생성, 분류용
  MODEL_SMART: 'gemini-3-pro-preview',  // 복잡한 추론, 창의적 글쓰기, 검색용
};

// 3. 헬퍼: 구조화된 JSON 생성 (핵심 패턴)
// Gemini가 개발자가 정의한 스키마에 맞춰 정확한 JSON을 반환하도록 강제합니다.
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
        console.error("Gemini JSON 생성 오류:", error);
        throw error;
    }
}

// 4. 기능 예시: AI 업무 초안 작성
export const draftTaskWithAI = async (userInput: string) => {
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        priority: { type: Type.STRING, enum: ['HIGH', 'MEDIUM', 'LOW'] },
        // ... 필요한 필드 정의
      }
    }
  };
  // 프롬프트와 스키마를 전달하여 호출
  return await generateJSON(userInput, schema);
};

// 5. 기능 예시: 멀티모달 채팅 스트리밍
export const getGeminiChatStream = async (
    history: any[], 
    message: string,
    modelId: string = AI_CONFIG.MODEL_SMART,
    imageBase64?: string,
    imageMimeType?: string
) => {
    const chat = ai.chats.create({
        model: modelId,
        history: history
    });

    const parts: any[] = [];
    
    // 이미지 첨부 처리
    if (imageBase64 && imageMimeType) {
        parts.push({
            inlineData: {
                data: imageBase64,
                mimeType: imageMimeType
            }
        });
    }
    parts.push({ text: message });

    return await chat.sendMessageStream({ message: parts });
};
```

## 📝 프롬프트 엔지니어링 관리

코드 로직과 프롬프트를 분리하여 관리하는 것을 권장합니다. (예: `prompts.ts`)

```typescript
export const PromptTemplates = {
  draftTask: (input: string) => `
    당신은 시니어 PM입니다. 다음의 거친 아이디어를 3가지 전문적인 업무 명세서로 변환하세요: "${input}".
    반드시 JSON 포맷으로 응답하세요.
  `,
  analyzeTask: (task: any) => `
    다음 업무를 분석하세요: ${task.title}.
    실행 전략, 리스크, 추천 리소스를 포함해야 합니다.
  `
};
```
