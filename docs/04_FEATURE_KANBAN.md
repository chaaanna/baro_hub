# 4. 기능: 스마트 칸반 보드 (Smart Kanban)

드래그 앤 드롭(Drag & Drop)과 스마트 정렬/필터링 기능을 갖춘 칸반 보드입니다.

## 🧱 핵심 컴포넌트 구성

### 1. 데이터 구조 설정
상태(Column) 정의를 상수로 관리하여 확장성을 높입니다.
```typescript
export const KANBAN_COLUMNS = [
  { id: 'REQUESTED', label: '요청됨', color: 'bg-gray-400' },
  { id: 'WIP', label: '진행 중', color: 'bg-blue-500' },
  { id: 'DONE', label: '완료', color: 'bg-green-500' },
];
```

### 2. 스마트 정렬 로직 (유틸리티)

단순한 날짜순/우선순위 정렬을 넘어, 마감일 임박도와 우선순위를 가중치로 계산하는 **"스마트 정렬(Smart Sort)"** 알고리즘을 사용합니다.

```typescript
// utils/taskHelpers.ts 예시
if (sortBy === 'SMART') {
    const pScore = { HIGH: 100, MEDIUM: 50, LOW: 10 };
    // 마감일까지 남은 일수 계산
    const daysUntilDue = (dueDate - now) / (dayInMs);
    
    // 공식: 우선순위 점수 - 남은 일수 (남은 일수가 적을수록 점수 높음)
    // 우선순위가 높고 마감일이 급한 업무가 최상단에 위치함
    return (pScore[b.priority] - daysUntilDueB) - (pScore[a.priority] - daysUntilDueA);
}
```

### 3. 드래그 앤 드롭 구현

외부 라이브러리 없이 네이티브 **HTML5 Drag and Drop API**를 사용하여 가볍게 구현합니다.

```tsx
// 핸들러 예시
const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
};

const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    onStatusChange(taskId, status); // 상태 변경 콜백 호출
};

// JSX 구조
<div className="flex gap-4">
    {KANBAN_COLUMNS.map(col => (
        <div 
            onDragOver={(e) => e.preventDefault()} // 드롭 허용을 위해 필수
            onDrop={(e) => handleDrop(e, col.id)}
        >
            {/* 업무 카드 렌더링 */}
        </div>
    ))}
</div>
```

## 🎨 스타일링 팁
*   **컬럼 너비:** `min-w-[340px]` 등을 주어 가로 스크롤이 생기더라도 카드가 찌그러지지 않게 합니다.
*   **인터랙션:** `active:cursor-grabbing` 클래스를 사용하여 드래그 중임을 시각적으로 알립니다.
*   **애니메이션:** 리스트 렌더링 시 인덱스(index)에 따라 `animation-delay`를 다르게 주어 순차적으로 나타나는 효과를 줍니다.
