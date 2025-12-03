import { Priority, Task, TaskStatus, User } from "./types";

// --- AI Configuration ---
export const AI_CONFIG = {
  MODEL_FAST: 'gemini-2.5-flash',
  MODEL_SMART: 'gemini-2.5-flash', // Default base model
  MAX_TOKENS: 2000,
};

// --- Model Definitions for UI ---
export interface GeminiModel {
  id: string;
  name: string;
  description: string;
  isPro?: boolean;
}

export const AVAILABLE_MODELS: GeminiModel[] = [
  { 
    id: 'gemini-2.5-flash', 
    name: 'Gemini 2.5 Flash', 
    description: '빠르고 효율적인 일상 업무용 모델',
    isPro: false
  },
  { 
    id: 'gemini-3-pro-preview', 
    name: 'Gemini 3.0 Pro', 
    description: '복잡한 추론과 코딩, 창의적 작업에 최적화',
    isPro: true
  }
];

// --- UI Constants ---
export const UI_TEXTS = {
  NEW_TASK_TITLE: '새로운 업무 요청',
  NEW_TASK_DESC_PLACEHOLDER: '여기에 상세 내용을 작성하세요...',
  EMPTY_SUBTASKS: '하위 업무가 없습니다.',
  DRAFT_PLACEHOLDER: '예: 이번 여름 프로모션 랜딩 페이지 기획안 작성해줘. 타겟은 20대 대학생이고, 밝고 경쾌한 느낌이어야 해. (A사 레퍼런스 참고)',
};

// --- Kanban Configuration ---
export const KANBAN_COLUMNS: { id: TaskStatus; label: string; dotColor: string }[] = [
  { id: TaskStatus.REQUESTED, label: '요청됨', dotColor: 'bg-gray-400' },
  { id: TaskStatus.WIP, label: '진행 중', dotColor: 'bg-blue-500' },
  { id: TaskStatus.CHECKED, label: '검토/승인', dotColor: 'bg-purple-500' },
  { id: TaskStatus.DONE, label: '완료', dotColor: 'bg-green-500' },
];

// --- Mock Data ---
export const MOCK_USERS: User[] = [
  { id: 'u1', name: '김철수', role: 'ASSIGNEE', avatar: 'https://picsum.photos/id/1005/50/50' },
  { id: 'u2', name: '이영희', role: 'REQUESTER', avatar: 'https://picsum.photos/id/1011/50/50' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: '워시타워 캠페인 설정',
    description: '신규 워시타워 유닛을 위한 4분기 마케팅 캠페인을 구성합니다. 랜딩 페이지 검증 및 구글 애널리틱스 설정이 포함됩니다.',
    product: '가전제품',
    type: '캠페인',
    priority: Priority.HIGH,
    status: TaskStatus.WIP,
    dueDate: '2023-11-15',
    assigneeId: 'u1',
    requesterId: 'u2',
    subtasks: [
        { id: 's1', title: '크리에이티브 에셋 확인', completed: true },
        { id: 's2', title: '트래킹 픽셀 설정', completed: false }
    ],
    createdAt: 1698810000000 
  },
  {
    id: 't2',
    title: '개인정보 처리방침 업데이트',
    description: '법무팀 요청에 따라 모든 지역 사이트의 하단 개인정보 처리방침 링크를 업데이트해야 합니다.',
    product: '글로벌',
    type: '유지보수',
    priority: Priority.MEDIUM,
    status: TaskStatus.REQUESTED,
    dueDate: '2023-11-20',
    assigneeId: 'u1',
    requesterId: 'u2',
    subtasks: [],
    createdAt: 1699200000000
  },
  {
    id: 't3',
    title: '모바일 결제 버그 수정',
    description: 'iPhone 14 Pro Max Safari 환경에서 결제 버튼이 하단 푸터와 겹치는 현상이 발생합니다.',
    product: '이커머스',
    type: '버그',
    priority: Priority.HIGH,
    status: TaskStatus.CHECKED,
    dueDate: '2023-11-10',
    assigneeId: 'u1',
    requesterId: 'u2',
    subtasks: [],
    createdAt: 1698500000000
  },
    {
    id: 't4',
    title: '분기별 성과 보고서 생성',
    description: '3분기 데이터를 추출하여 이해관계자를 위한 PDF 요약 보고서를 작성합니다.',
    product: '내부',
    type: '리포팅',
    priority: Priority.LOW,
    status: TaskStatus.DONE,
    dueDate: '2023-10-30',
    assigneeId: 'u1',
    requesterId: 'u2',
    subtasks: [],
    createdAt: 1698000000000
  }
];