
# 6. 지식 허브 AI 구현 가이드 (Knowledge Hub AI Logic)

이 문서는 지식 허브의 핵심 기능인 **"URL/파일 기반 지식 구조화"**를 구현하기 위한 상세 기술 가이드입니다. Google Gemini의 최신 기능인 **Search Grounding**을 활용하여 비디오 및 문서를 분석하는 방법을 다룹니다.

---

## 🧠 1. 모델 선정 및 성능 분석

### 사용 모델: `gemini-3-pro-preview`
지식 허브 기능은 단순한 텍스트 생성이 아니라, 최신 웹 정보와 YouTube 메타데이터에 접근해야 하므로 **반드시 도구(Tools) 사용이 가능한 모델**을 써야 합니다.

| 구분 | 선택 모델 | 선정 이유 |
| :--- | :--- | :--- |
| **모델명** | `gemini-3-pro-preview` (권장) | 1. **Google Search Grounding** 도구를 지원하는 최상위 모델입니다.<br>2. 긴 컨텍스트 창을 가지고 있어 긴 영상의 자막이나 긴 아티클 분석에 유리합니다. |
| **대안** | `gemini-2.5-flash` | 속도는 빠르지만 복잡한 구조화(챕터 나누기 등)나 최신 검색 정확도가 Pro 모델에 비해 떨어질 수 있습니다. |

### 🎯 비디오 분석 정확도 및 한계

이 로직은 비디오 파일 자체를 다운로드해서 프레임 단위로 보는 것이 아니라, **Google Search**를 통해 수집된 메타데이터를 기반으로 분석합니다.

*   **정확도 높음 (High Accuracy):**
    *   YouTube 자막(CC)이 있는 영상.
    *   제목, 설명란에 타임스탬프가 포함된 영상.
    *   Google 검색 인덱스에 잘 등록된 유명한 아티클.
*   **정확도 낮음 (Limitations):**
    *   자막이 없고 설명이 부실한 영상 (AI가 제목만으로 내용을 추론해야 함).
    *   로그인이 필요한 페이지 (Notion 비공개 링크 등).
    *   최근 1시간 내 업로드되어 검색 인덱싱이 안 된 콘텐츠.

---

## 🛠 2. 핵심 코드 구현 (Core Implementation)

`services/geminiService.ts`에 포함될 핵심 함수입니다.

### 의존성 설정
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

### 분석 함수 (`analyzeResourceWithAI`)

이 함수는 URL을 입력받아 `Google Search Tool`을 활성화한 상태로 Gemini를 호출하고, 결과를 순수 JSON으로 반환받습니다.

```typescript
/**
 * URL을 분석하여 구조화된 지식 데이터(JSON)를 반환합니다.
 */
export const analyzeResourceWithAI = async (url: string) => {
    // 1. YouTube Video ID 추출 (검색 정확도 향상용)
    const videoId = extractYouTubeVideoId(url);
    
    // 2. 프롬프트 구성 (하단 프롬프트 섹션 참조)
    const prompt = PromptTemplates.analyzeResource(url, videoId);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', // Search Tool 사용 가능 모델 필수
            contents: prompt,
            config: {
                // 핵심: Google Search 도구 활성화
                tools: [{ googleSearch: {} }],
                
                // 핵심: JSON 응답 강제 (파싱 에러 방지)
                responseMimeType: "application/json",
                
                // 창의성 조절 (0.4 정도가 팩트 기반 요약에 적절)
                temperature: 0.4 
            }
        });

        if (!response.text) {
            throw new Error("No response from AI");
        }

        // 3. JSON 파싱 및 반환
        return JSON.parse(response.text);

    } catch (e) {
        console.error("AI Analysis Failed", e);
        // 실패 시 폴백(Fallback) 로직이나 에러 처리가 필요함
        throw e;
    }
};

// 헬퍼: YouTube ID 정규식 추출
function extractYouTubeVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
```

---

## 📝 3. 프롬프트 엔지니어링 (Prompt Engineering)

AI가 검색 결과를 단순히 나열하는 것이 아니라, 우리가 원하는 **"지식 데이터베이스 스키마"**에 맞춰 응답하도록 강력하게 지시해야 합니다.

```typescript
export const analyzeResourcePrompt = (url: string, videoId?: string | null) => {
    // 비디오 ID가 있다면 특정하여 검색하도록 유도
    const searchTarget = videoId ? `site:youtube.com "${videoId}"` : url;

    return `
    당신은 기업 내부 지식관리(KM) 시스템을 위한 AI 분석가입니다.
    제공된 URL의 콘텐츠를 분석하여, 데이터베이스에 즉시 저장할 수 있는 JSON 데이터를 추출하세요.

    [TARGET URL]
    ${url}
    
    [SEARCH HINT]
    Search Query: ${searchTarget}
    Video ID: ${videoId || 'N/A'}
    
    [ANALYSIS STRATEGY]
    1. **Primary Search**: Google Search를 사용하여 해당 URL의 제목, 설명, 자막(Transcript), 챕터 정보를 찾으세요.
    2. **Reconstruction**: 직접적인 스크립트가 없다면, 검색 결과에 나타난 제목과 요약을 바탕으로 내용을 재구성하세요.
    3. **Chapter Extraction**: 영상의 경우 타임스탬프(00:00) 정보를 찾아 챕터를 나누세요. 정보가 없다면 주제별로 키워드만 추출하세요.

    [OUTPUT SCHEMA - JSON ONLY]
    반드시 아래 포맷을 준수하세요. 마크다운(\`\`\`)을 포함하지 마세요.

    {
      "basicInfo": {
        "title": "제목 (명확하고 간결하게)",
        "summary": "핵심 내용 요약 (1-2문장)",
        "level": "BEGINNER | INTERMEDIATE | ADVANCED",
        "tags": ["태그1", "태그2", "태그3"],
        "contentType": "video | article | document"
      },
      "metadata": {
        "duration": 0, // 초 단위 숫자 (영상인 경우만, 없으면 0)
        "category": "개발 | 기획 | 디자인 | 기타",
        "uploadedAt": "YYYY-MM-DD"
      },
      "searchOptimization": {
        // 검색 엔진 최적화를 위한 데이터
        "keywords": ["검색 키워드 10개 내외"],
        "chapters": [
          // 영상이 5분 이상일 경우 필수
          { "title": "챕터 제목", "timestamp": "MM:SS", "summary": "내용" }
        ]
      },
      "managementInfo": {
        "originalFileUrl": "${url}",
        "lastUpdated": "${new Date().toISOString()}"
      }
    }
    `;
};
```

---

## ⚡ 4. 최적화 팁 (Tips for Developers)

1.  **Race Condition 처리:**
    AI 분석은 평균 3~8초가 소요됩니다. 사용자가 버튼을 중복 클릭하지 않도록 UI에서 `isAnalyzing` 상태를 확실하게 처리해야 합니다.

2.  **Fallback 데이터:**
    Google Search가 실패하거나 차단된 사이트일 경우 JSON 파싱 에러가 발생할 수 있습니다. `try-catch` 블록에서 "제목: 분석 실패, 원본 URL 유지" 형태의 더미 데이터를 반환하여 앱이 멈추지 않도록 해야 합니다.

3.  **파일 업로드 지원 (확장 기능):**
    URL이 아닌 실제 파일(PDF, MP4)을 분석하려면, `gemini-1.5-pro` (또는 최신) 모델의 **File API**를 사용해야 합니다.
    *   `ai.files.uploadFile()`로 파일을 업로드합니다.
    *   업로드된 `fileUri`를 `generateContent`의 `contents`에 포함하여 보냅니다.
    *   이 경우 Search Tool 대신 멀티모달 인식 기능을 사용하게 됩니다.

