# 1. 프로젝트 설정 및 아키텍처 (Project Setup)

이 문서는 Nexus AI 스타일의 애플리케이션을 **Vite + React + TypeScript** 환경에서 구축하기 위한 기초 설정 가이드입니다.

## 📦 1. 필수 의존성 설치 (Dependencies)

새로운 프로젝트를 생성하고, 핵심 UI 라이브러리와 Google Gemini SDK를 설치합니다.

```bash
# 프로젝트 생성 (Vite)
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# UI 및 유틸리티
npm install lucide-react clsx tailwind-merge

# Google GenAI SDK (핵심 AI 엔진)
npm install @google/genai
```

## 🏗 2. 아키텍처 패턴 (Architecture Pattern)

특정 폴더 구조를 강제하지 않으나, 유지보수성을 위해 다음과 같은 **논리적 계층 분리**를 권장합니다.

1.  **Components (UI)**: 재사용 가능한 디자인 시스템 컴포넌트와 비즈니스 기능별 컴포넌트(예: 칸반, 채팅 등)를 분리합니다.
2.  **Services (Logic)**: API 통신(Gemini SDK)과 데이터 처리 로직을 UI 컴포넌트 내부가 아닌 별도의 서비스 계층으로 분리하여 캡슐화합니다.
3.  **Types (Model)**: 애플리케이션 전반에서 사용되는 데이터 모델(Interface)을 중앙에서 관리하여 타입 안정성을 확보합니다.
4.  **Utils & Constants**: 비즈니스 로직과 무관한 순수 함수와 상수 값들을 별도로 관리합니다.

## 🔑 3. 환경 변수 설정 (Environment Variables)

프로젝트 루트에 `.env` 파일을 생성하고 Google Gemini API 키를 설정합니다.

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

> **주의:** 클라이언트 사이드에서 API 키를 사용하는 경우, Vite 환경 변수 규칙(`VITE_` 접두사)을 따라야 합니다. 배포 시에는 백엔드 프록시를 통해 키를 숨기는 것이 보안상 안전합니다.

## 🧠 4. 핵심 타입 정의 (Core Types)

다른 기능들에서 공통적으로 사용될 핵심 데이터 모델을 정의합니다. (예: `types.ts`)

```typescript
export enum Priority { HIGH = 'HIGH', MEDIUM = 'MEDIUM', LOW = 'LOW' }
export enum TaskStatus { REQUESTED = 'REQUESTED', WIP = 'WIP', DONE = 'DONE' }

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
  // ... 필요한 필드 추가
}
```