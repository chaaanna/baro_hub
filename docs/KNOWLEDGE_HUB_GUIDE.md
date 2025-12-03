# Knowledge Hub Implementation Guide

본 문서는 **Vite + React + TypeScript** 환경의 다른 프로젝트에 **"지식 허브(Knowledge Hub)"** 기능을 이식하기 위한 개발 가이드입니다.
UI/UX는 해당 프로젝트의 디자인 시스템을 따르되, 핵심 비즈니스 로직과 데이터 구조, AI 연동 방식은 본 가이드를 준수하여 구현합니다.

---

## 1. 필수 의존성 (Dependencies)

이 기능은 Google Gemini API를 사용하여 URL을 분석합니다.

```bash
npm install @google/genai
```

---

## 2. 데이터 모델 (Data Models)

`types.ts` 또는 모델 정의 파일에 다음 인터페이스를 추가합니다. 이 구조는 AI가 분석한 결과와 UI 표시를 위한 표준 규격입니다.

```typescript
// Resource Type Definition
export type ResourceType = 'video' | 'article' | 'document' | 'other';

// Sub-interfaces
export interface BasicInfo {
  title: string;
  summary: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  author?: string | null;
  contentType: ResourceType;
}

export interface MetaData {
  duration?: number; // 초 단위 (영상일 경우)
  language?: string;
  category?: string;
  subCategory?: string;
  uploadedAt?: string;
  department?: string | null;
}

export interface Chapter {
  title: string;
  timestamp: string;
  summary: string;
}

export interface SearchOptimization {
  keywords: string[];
  searchableText?: string;
  chapters: Chapter[];
}

export interface ManagementInfo {
  status: 'active' | 'draft' | 'archived';
  visibility: 'public' | 'team' | 'private';
  originalFileUrl?: string | null;
  thumbnailUrl?: string | null;
  lastUpdated: string;
}

// Main Entity
export interface KnowledgeResource {
  id: string;
  basicInfo: BasicInfo;
  metadata: MetaData;
  searchOptimization: SearchOptimization;
  managementInfo: ManagementInfo;
}
```

---

## 3. AI 프롬프트 엔지니어링 (Prompt Engineering)

AI가 URL을 분석하여 정해진 JSON 포맷으로 응답하도록 하는 프롬프트입니다. `services/prompts.ts` 또는 상수 파일에 정의합니다.

```typescript
export const analyzeResourcePrompt = (url: string, videoId?: string | null) => {
  const searchTarget = videoId ? `site:youtube.com "${videoId}"` : url;

  return `
    당신은 지식관리(KM) 시스템을 위한 콘텐츠 분석 AI입니다.
    제공된 URL의 콘텐츠를 분석하여 구조화된 JSON 데이터를 추출하세요.

    [TARGET URL]
    ${url}
    
    [CONTEXT]
    Search Query: ${searchTarget}
    Video ID: ${videoId || 'N/A'}
    
    [INSTRUCTIONS]
    1. Google Search 도구를 사용하여 해당 URL의 제목, 내용, 자막(영상인 경우), 메타데이터를 수집하세요.
    2. 영상의 경우 챕터(타임스탬프) 정보를 반드시 추출하거나 재구성하세요.
    3. 반드시 아래 JSON 스키마를 준수하여 응답하세요. (Markdown 포맷 제외, 순수 JSON 문자열만 반환)

    [JSON SCHEMA]
    {
      "basicInfo": {
        "title": "제목 (최대 50자)",
        "summary": "핵심 요약 (1-2문장)",
        "level": "BEGINNER | INTERMEDIATE | ADVANCED",
        "tags": ["태그1", "태그2", ...],
        "author": "작성자/채널명",
        "contentType": "video | article"
      },
      "metadata": {
        "duration": 0, // 초 단위 숫자 (없으면 0)
        "category": "카테고리 (예: 개발, 디자인)",
        "subCategory": "세부 카테고리",
        "uploadedAt": "ISO 8601 Date String"
      },
      "searchOptimization": {
        "keywords": ["키워드1", "키워드2", ...],
        "chapters": [
          { "title": "챕터명", "timestamp": "00:00", "summary": "내용" }
        ]
      },
      "managementInfo": {
        "status": "active",
        "visibility": "team",
        "originalFileUrl": "${url}",
        "lastUpdated": "ISO 8601 Date String"
      }
    }
  `;
};
```

---

## 4. 서비스 로직 구현 (Service Layer)

### 4-1. Gemini API 연동 (`geminiService.ts`)

`gemini-3-pro-preview` 모델을 사용해야 Google Search Grounding 기능을 활용할 수 있습니다.

```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper: YouTube Video ID 추출
function extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export const analyzeResourceWithAI = async (url: string): Promise<Omit<KnowledgeResource, 'id'>> => {
    const videoId = extractYouTubeVideoId(url);
    const prompt = analyzeResourcePrompt(url, videoId);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }], // 검색 기능 활성화
                responseMimeType: "application/json" // JSON 강제
            }
        });

        if (!response.text) throw new Error("Empty Response");
        return JSON.parse(response.text);
    } catch (e) {
        console.error("AI Analysis Failed", e);
        throw e;
    }
};
```

### 4-2. 데이터 관리 (`knowledgeService.ts`)

실제 프로젝트에서는 이 부분을 백엔드 API 호출(axios, fetch)로 대체해야 합니다.

```typescript
import { KnowledgeResource } from "../types";
import { analyzeResourceWithAI } from "./geminiService";

export const knowledgeService = {
    // Read
    getAllResources: async (): Promise<KnowledgeResource[]> => {
        // TODO: Replace with actual API call
        return []; 
    },

    // Create (AI Analysis -> Save)
    addResourceFromUrl: async (url: string): Promise<KnowledgeResource> => {
        // 1. AI 분석
        const analysisData = await analyzeResourceWithAI(url);
        
        // 2. DB 저장 데이터 구성
        const newResource: KnowledgeResource = {
            id: crypto.randomUUID(),
            ...analysisData,
            managementInfo: {
                ...analysisData.managementInfo,
                originalFileUrl: url
            }
        };

        // TODO: Save to DB
        return newResource;
    },
    
    // Delete
    deleteResource: async (id: string): Promise<void> => {
        // TODO: Delete from DB
    }
};
```

---

## 5. UI 컴포넌트 구현 가이드 (Component Strategy)

대상 프로젝트의 디자인 시스템(MUI, AntD, Tailwind, Styled-Components 등)에 맞춰 아래 구조를 구현합니다.

### 필수 상태 (State Requirements)

```typescript
const [resources, setResources] = useState<KnowledgeResource[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [searchQuery, setSearchQuery] = useState('');
const [isModalOpen, setIsModalOpen] = useState(false); // 상세 보기 모달
const [isAddOpen, setIsAddOpen] = useState(false); // 추가 모달
```

### 화면 구성 요소 (UI Structure)

1.  **Header / Toolbar**
    *   **검색바**: `searchQuery` 상태와 연결하여 리스트를 필터링합니다.
    *   **추가 버튼**: URL 입력 모달을 엽니다.

2.  **Resource Grid (List)**
    *   **Grid Layout**: 반응형 그리드 (예: Desktop 4열, Tablet 2열).
    *   **Pagination**: 한 페이지당 8~12개 아이템 표시.
    *   **Card Item**:
        *   썸네일/아이콘 (ContentType에 따라 구분)
        *   제목, 요약(1~2줄), 태그
        *   업로드 날짜, 재생 시간(영상일 경우)
        *   **Action**: 상세 보기(Click), 삭제(Icon)

3.  **Add Resource Modal (URL Input)**
    *   **Input**: URL 텍스트 입력 필드.
    *   **Button**: "분석 및 추가" (Click 시 `knowledgeService.addResourceFromUrl` 호출).
    *   **Loading State**: 분석 중일 때 스피너/로딩 인디케이터 표시 (3~5초 소요됨).

4.  **Detail Modal (상세 보기)**
    *   **Header**: 제목, 메타데이터(작성자, 날짜).
    *   **AI Summary**: `basicInfo.summary` 표시.
    *   **Key Points / Chapters**: `searchOptimization.chapters`가 있으면 타임스탬프와 함께 리스트로 표시, 없으면 `keywords` 표시.
    *   **Link**: 원본 URL로 이동하는 버튼 (`target="_blank"`).

### 구현 시 주의사항

1.  **비동기 처리**: AI 분석은 시간이 걸리므로(3초 이상), 반드시 **로딩 상태(Loading State)**를 UI에 명확히 표시해야 합니다.
2.  **에러 핸들링**: AI 분석 실패 시, 사용자에게 알리고 수동 입력으로 전환하거나 재시도할 수 있는 UX를 고려해야 합니다.
3.  **디자인 적응**:
    *   아이콘: 프로젝트에서 사용하는 아이콘 라이브러리(Lucide, FontAwesome 등) 사용.
    *   컬러: `contentType`에 따라 색상 코딩을 적용하면 좋습니다 (예: Video=Red, Doc=Blue).

---

## 6. 통합 예시 (Integration)

```tsx
// App.tsx or Router
import { KnowledgeHub } from './pages/KnowledgeHub';

// ...
<Route path="/knowledge" element={<KnowledgeHub />} />
```

이 가이드를 기반으로 프로젝트의 스타일 가이드에 맞춰 컴포넌트를 조립하면, 기능적으로 완벽하게 동작하는 지식 허브를 구현할 수 있습니다.
