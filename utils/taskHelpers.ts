
import { Task, Priority, TaskStatus } from "../types";

export type SortOption = 'NONE' | 'DUE_DATE' | 'PRIORITY' | 'SMART';

interface FilterOptions {
  query: string;
  priority: Priority | 'ALL';
  onlyMyTasks: boolean;
  currentUserId: string;
}

/**
 * 날짜를 'M. D.' 형식으로 변환합니다. (예: 10. 27.)
 */
export const formatDate = (timestamp?: number | string): string => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  // 한국어 표기 포맷 사용 (월. 일.)
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
};

export const getSortedAndFilteredTasks = (
  tasks: Task[],
  filters: FilterOptions,
  sortBy: SortOption
): Task[] => {
  let result = [...tasks];

  // 1. Filter
  if (filters.query) {
    const lowerQ = filters.query.toLowerCase();
    result = result.filter(t => 
      t.title.toLowerCase().includes(lowerQ) || 
      t.description.toLowerCase().includes(lowerQ) ||
      t.product.toLowerCase().includes(lowerQ)
    );
  }

  if (filters.priority !== 'ALL') {
    result = result.filter(t => t.priority === filters.priority);
  }

  if (filters.onlyMyTasks) {
    result = result.filter(t => t.assigneeId === filters.currentUserId);
  }

  // 2. Sort
  if (sortBy !== 'NONE') {
    result.sort((a, b) => {
      if (sortBy === 'DUE_DATE') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === 'PRIORITY') {
        const pScore = { [Priority.HIGH]: 3, [Priority.MEDIUM]: 2, [Priority.LOW]: 1 };
        return pScore[b.priority] - pScore[a.priority];
      }
      if (sortBy === 'SMART') {
        // Smart Sort: Weight = Priority Score + Due Date Urgency
        const pScore = { [Priority.HIGH]: 100, [Priority.MEDIUM]: 50, [Priority.LOW]: 10 };
        const now = new Date().getTime();
        const aDue = new Date(a.dueDate).getTime();
        const bDue = new Date(b.dueDate).getTime();
        
        // Closer due date = higher score
        const aDays = (aDue - now) / (1000 * 60 * 60 * 24);
        const bDays = (bDue - now) / (1000 * 60 * 60 * 24);
        
        const aScore = pScore[a.priority] - aDays;
        const bScore = pScore[b.priority] - bDays;
        
        return bScore - aScore;
      }
      return 0;
    });
  }

  return result;
};
