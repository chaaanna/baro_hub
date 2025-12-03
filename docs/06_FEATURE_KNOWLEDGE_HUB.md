# 6. 기능: 지식 허브 (Ver 2) - Search Grounding

Gemini 3.0 Pro의 **Google Search Grounding** 기능을 활용하여, URL이나 파일을 읽고 구조화된 데이터베이스로 변환하는 기능입니다.

## 🧠 핵심 로직: 검색 그라운딩 (Search Grounding)

단순한 텍스트 생성이 아니라, 실제 웹 검색 결과를 바탕으로 정보를 구성합니다.

**서비스 호출 예시 (`geminiService.ts`):**
```typescript
const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview', // 도구(Tools) 사용을 위해 필수
    contents: prompt,
    config: {
        tools: [{ googleSearch: {} }], // Google 검색 도구 활성화
        responseMimeType: "application/json" // JSON 출력 강제
    }
});
```

**프롬프트 전략:**
1.  **입력:** URL 또는 파일 텍스트.
2.  **지시:** "이 콘텐츠를 검색하세요. YouTube 영상이라면 챕터/타임스탬프를 찾으세요. 아티클이라면 핵심 요약을 추출하세요."
3.  **폴백(Fallback):** "직접적인 스크립트가 없다면, 검색 결과(제목, 설명 등)를 바탕으로 내용을 재구성하세요."

## 💾 데이터 모델 (Types)

AI는 다음과 같은 인터페이스에 맞춰 데이터를 반환해야 합니다.

```typescript
interface KnowledgeResource {
  basicInfo: {
    title: string;
    summary: string; // 1-2 문장 요약
    contentType: 'video' | 'article' | 'document';
    tags: string[];
  };
  metadata: {
    duration?: number; // 초 단위 (영상일 경우)
    uploadedAt: string;
  };
  searchOptimization: {
    // 검색 및 탐색을 위한 구조화된 데이터
    chapters: { title: string; timestamp: string; summary: string }[];
    keywords: string[];
  };
}
```

## 🖥 UI 구현 가이드

### 1. 전문가 모드 추가 모달 (Professional Add Modal)
*   **탭 구성:** URL 입력 vs 파일 업로드.
*   **파일 처리:** 파일이 업로드되면 JS의 File API를 통해 텍스트를 추출하거나 메타데이터를 읽어 Gemini에게 전달합니다.
*   **피드백:** 분석에 3~5초 이상 소요되므로, "정밀 분석 중..."이라는 배너나 스피너를 표시하여 사용자 이탈을 방지합니다.

### 2. 리소스 카드 (Resource Card)
*   **상태 처리:** AI 분석 실패 시, 카드를 붉은색(`bg-red-50`)으로 표시하고 "재시도(Retry)" 버튼을 제공합니다.
*   **상세 정보:** 카드 내부의 챕터나 키워드 목록은 공간 절약을 위해 접기/펼치기 기능을 구현합니다.

### 3. 페이지네이션 (Pagination)
*   데이터가 많아질 것을 대비해 클라이언트 사이드 페이지네이션(예: 페이지당 8개)을 구현합니다.
