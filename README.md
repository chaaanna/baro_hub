# Nexus AI Task Manager

**Nexus AI**는 Google Gemini 모델을 기반으로 한 지능형 업무 관리 플랫폼입니다. 
단순한 할 일 관리를 넘어, AI가 업무를 분석하고 전략을 제안하며, 구체적인 실행 계획(Subtasks)을 자동으로 생성해줍니다.

## ✨ 주요 기능 (Key Features)

### 1. 🤖 AI-Powered Workflow
*   **Smart Draft**: 거친 아이디어를 전문적인 업무 명세서(PRD/Task Spec)로 변환
*   **Strategic Analysis**: 업무의 배경, 필요 기술, 리스크 등을 AI가 분석하여 전략 리포트 제공
*   **Auto-Subtasks**: 복잡한 업무를 실행 가능한 체크리스트로 자동 분해
*   **AI Chat Guide**: 업무에 특화된 컨텍스트를 가진 AI 어시스턴트와 대화

### 2. 📋 Modern Kanban Board
*   **Drag & Drop**: 직관적인 상태 관리
*   **Smart Sorting**: 마감일과 우선순위를 고려한 스마트 정렬 알고리즘
*   **Rich Metadata**: 담당자, 우선순위, 마감일, 제품군 태그 등 시각화
*   **Filter & Search**: 실시간 검색 및 필터링 지원

### 3. 💬 Gemini Pro Workspace
*   **Multi-turn Chat**: 연속적인 대화가 가능한 채팅 인터페이스
*   **Multimodal Support**: 이미지 업로드 및 음성 인식(Web Speech API) 지원
*   **Model Selection**: 작업 성격에 맞는 모델(Flash/Pro) 선택 가능

## 🛠 기술 스택 (Tech Stack)

*   **Framework**: React 19
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Icons**: Lucide React

## 🚀 시작하기 (Getting Started)

1.  **설치**
    ```bash
    npm install
    ```

2.  **환경 변수 설정**
    `.env` 파일에 Google Gemini API 키를 설정해야 합니다. (Google AI Studio 환경에서는 자동 주입됨)
    ```env
    API_KEY=your_api_key_here
    ```

3.  **실행**
    ```bash
    npm run dev
    ```

---
Designed with ❤️ by Nexus AI Team
