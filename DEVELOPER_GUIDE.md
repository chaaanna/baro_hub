# Nexus AI Developer Guide

본 문서는 Nexus AI 프로젝트의 아키텍처, 폴더 구조, 그리고 개발 규칙을 설명합니다.
본 프로젝트는 **"Vite + React Standard Architecture"**를 따르며, 유지보수성과 확장성을 최우선으로 설계되었습니다.

## 🏗 1. 프로젝트 구조 (Project Structure)

```
/
├── components/        # UI 컴포넌트 (재사용 가능)
│   ├── Layout.tsx     # 전역 레이아웃 (사이드바, 네비게이션)
│   ├── Kanban.tsx     # 칸반 보드 로직
│   ├── AIModal.tsx    # AI 분석 및 상세 모달
│   ├── GeminiPage.tsx # 독립된 AI 채팅 페이지
│   ├── Icons.tsx      # 아이콘 모음 (Lucide wrapper)
│   └── AIViews.tsx    # 모달 내부의 탭별 서브 뷰 (Draft, Strategy 등)
├── services/          # 비즈니스 로직 및 API 호출 계층
│   ├── geminiService.ts # Google GenAI API 연동 로직
│   ├── taskService.ts   # 업무 데이터 CRUD (추후 DB 연동 시 이곳만 수정)
│   └── prompts.ts       # AI 프롬프트 템플릿 관리
├── utils/             # 순수 유틸리티 함수
│   └── taskHelpers.ts   # 정렬, 필터링 등 데이터 가공 로직
├── types.ts           # 전역 타입 정의 (Interface, Enum)
├── constants.ts       # 상수, Mock 데이터, 환경 설정
├── App.tsx            # 라우팅 및 상태 조합 (Composition Root)
└── index.css          # 전역 스타일 및 Tailwind 설정
```

## 🧩 2. 핵심 아키텍처 패턴

### A. 관심사의 분리 (Separation of Concerns)
*   **UI Components**: 오직 렌더링과 사용자 이벤트 처리만 담당합니다.
*   **Services**: 데이터 페칭, AI 호출, 상태 변경 로직을 캡슐화합니다. 컴포넌트는 `service` 내부의 구현 방식을 알 필요가 없습니다.
*   **Types**: 데이터 모델(`Task`, `User` 등)은 `types.ts`에서 중앙 관리하여 순환 참조를 방지합니다.

### B. 프롬프트 엔지니어링 관리 (Prompt Management)
*   `services/prompts.ts` 파일에서 모든 프롬프트를 관리합니다.
*   이는 AI의 답변 퀄리티를 튜닝하거나, 다국어 지원을 확장할 때 코드 로직과 프롬프트를 분리하여 관리하기 위함입니다.

### C. 스타일링 전략 (Styling Strategy)
*   **Tailwind CSS**: 유틸리티 클래스를 사용하여 빠르게 스타일링합니다.
*   **Design System**: `index.css`와 `DESIGN_SYSTEM.md`에 정의된 컬러 팔레트와 타이포그래피 규칙을 준수합니다.
    *   배경: Pure White + Dot Matrix Pattern
    *   카드: Glassmorphism (약한 Blur) + Shadow

## 💻 3. 개발 규칙 (Conventions)

### Naming
*   **Components**: PascalCase (예: `KanbanBoard.tsx`)
*   **Functions/Variables**: camelCase (예: `handleTaskClick`, `isLoading`)
*   **Interfaces**: PascalCase (예: `Task`, `AIAnalysis`)
*   **Constants**: UPPER_SNAKE_CASE (예: `MAX_TOKENS`, `INITIAL_TASKS`)

### State Management
*   로컬 UI 상태는 `useState`를 사용합니다.
*   전역적으로 공유되어야 하는 데이터(Task 목록 등)는 `App.tsx`에서 상태를 끌어올려(Lifting State Up) 관리하거나, 필요 시 Context API를 도입합니다.
*   현재는 `App.tsx`가 `taskService`를 통해 데이터를 로드하고 자식 컴포넌트에 주입하는 형태입니다.

### AI Integration Rules
*   `@google/genai` SDK를 사용합니다.
*   API 키는 반드시 `process.env.API_KEY`를 통해 접근합니다.
*   스트리밍 응답(`sendMessageStream`)을 적극 활용하여 사용자 경험(Latency)을 최적화합니다.

## 🔄 4. 데이터 흐름 (Data Flow)

1.  **User Action**: 사용자가 "AI 분석" 버튼 클릭.
2.  **Component**: `AIModal.tsx`에서 `handleAnalyze` 함수 실행.
3.  **Service**: `geminiService.analyzeTask(task)` 호출.
4.  **API Call**: Google Gemini로 프롬프트 전송 (`prompts.analyzeTask` 사용).
5.  **Response**: JSON 응답 파싱 후 `AIAnalysis` 객체 반환.
6.  **State Update**: `App.tsx`의 `handleUpdateTask`를 통해 React 상태 업데이트.
7.  **Re-render**: UI에 분석 결과 표시.

---
문서 업데이트 날짜: 2023-10-27
