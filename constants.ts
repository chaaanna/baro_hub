
import { TaskStatus, Priority } from './types';

// AI 모델 설정
export const AI_CONFIG = {
    MODEL_FAST: 'gemini-1.5-pro-preview',
    MODEL_SMART: 'gemini-1.5-pro-preview',
    DEFAULT_MAX_OUTPUT_TOKENS: 8192,
    DEFAULT_TEMPERATURE: 0.7, 
    JSON_RESPONSE_INSTRUCTIONS: "IMPORTANT: Respond STRICTLY in JSON format. Do not include any other text, markdown, or explanations outside of the JSON structure."
};

// 사용 가능한 AI 모델 목록
export const AVAILABLE_MODELS = [
    {
        id: 'gemini-1.5-pro-preview',
        name: 'Gemini 1.5 Pro',
        description: '복잡한 추론과 코딩, 창의적 작업에 최적화된 최신 모델',
        isPro: true,
    },
];


// UI 관련 상수
export const UI_DEFAULTS = {
    NEW_TASK_TITLE: "새로운 업무 요청",
    NEW_TASK_DESC_PLACEHOLDER: "여기에 상세 내용을 작성하세요...",
    EMPTY_SUBTASKS: "하위 업무가 없습니다.",
    DRAFT_PLACEHOLDER: "예: 이번 여름 프로모션 랜딩 페이지 기획안 작성해줘. 타겟은 20대 대학생이고, 밝고 경쾌한 느낌이어야 해. (A사 레퍼런스 참고)"
}

// 칸반 보드 상태 정의
export const KANBAN_STATUSES = [
    { id: TaskStatus.REQUESTED, label: "요청됨", dotColor: "bg-gray-400" },
    { id: TaskStatus.WIP, label: "진행 중", dotColor: "bg-blue-500" },
    { id: TaskStatus.CHECKED, label: "검토/승인", dotColor: "bg-purple-500" },
    { id: TaskStatus.DONE, label: "완료", dotColor: "bg-green-500" },
];


export const INITIAL_TASKS = [
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
        createdAt: 1698810000000,
    },
    // ... (rest of the initial tasks data)
];
