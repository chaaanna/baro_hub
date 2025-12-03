
import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { MoreHorizontal, Calendar, Search, Filter, ArrowUpDown, XCircle, User, Sparkles, AlertCircle, Clock, Trash2 } from './Icons';
import { KANBAN_COLUMNS } from '../constants';
import { getSortedAndFilteredTasks, SortOption, formatDate } from '../utils/taskHelpers';

interface KanbanProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
}

export const KanbanBoard: React.FC<KanbanProps> = ({ tasks, onTaskClick, onStatusChange, onDeleteTask }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<Priority | 'ALL'>('ALL');
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('NONE');

  // --- Smart Logic using Utility ---
  const processedTasks = useMemo(() => {
    return getSortedAndFilteredTasks(
      tasks,
      {
        query: searchQuery,
        priority: filterPriority,
        onlyMyTasks,
        currentUserId: 'u1' // Assuming 'u1' is logged in
      },
      sortBy
    );
  }, [tasks, searchQuery, filterPriority, onlyMyTasks, sortBy]);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    const el = e.target as HTMLElement;
    setTimeout(() => el.classList.add('opacity-50', 'scale-95', 'grayscale'), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
    const el = e.target as HTMLElement;
    el.classList.remove('opacity-50', 'scale-95', 'grayscale');
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumn !== status) setDragOverColumn(status);
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) onStatusChange(taskId, status);
    setDragOverColumn(null);
    setDraggedTaskId(null);
  };

  return (
    <div className="flex flex-col h-full">
        {/* --- Smart Toolbar --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 px-2 flex-shrink-0">
            {/* Left: Search */}
            <div className="relative group w-full xl:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="업무, 태그, 설명 검색..." 
                    className="w-full bg-white pl-10 pr-8 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                        <XCircle className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Right: Filters & Sort */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 xl:pb-0 no-scrollbar">
                {/* Filter Label */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 border-r border-gray-200 mr-2 hidden md:flex">
                    <Filter className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">필터</span>
                </div>

                {/* My Tasks Toggle */}
                <button 
                    onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap
                        ${onlyMyTasks 
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    <User className="w-4 h-4" />
                    내 업무
                </button>

                {/* Priority Chips */}
                <div className="flex bg-white rounded-full p-1 border border-gray-200 shadow-sm">
                    {(['ALL', Priority.HIGH, Priority.MEDIUM, Priority.LOW] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setFilterPriority(p)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                                ${filterPriority === p 
                                    ? 'bg-gray-900 text-white shadow-sm' 
                                    : 'text-gray-500 hover:bg-gray-100'}`}
                        >
                            {p === 'ALL' ? '전체' : p === Priority.HIGH ? '높음' : p === Priority.MEDIUM ? '중간' : '낮음'}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

                {/* Sort Dropdown */}
                <button 
                    onClick={() => {
                        const modes: SortOption[] = ['NONE', 'SMART', 'DUE_DATE', 'PRIORITY'];
                        const nextIdx = (modes.indexOf(sortBy) + 1) % modes.length;
                        setSortBy(modes[nextIdx]);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap min-w-[140px] justify-center
                        ${sortBy !== 'NONE' 
                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                >
                    {sortBy === 'SMART' ? <Sparkles className="w-4 h-4 text-indigo-500" /> : <ArrowUpDown className="w-4 h-4" />}
                    <span>
                        {sortBy === 'NONE' && '정렬 없음'}
                        {sortBy === 'SMART' && '스마트 정렬'}
                        {sortBy === 'DUE_DATE' && '마감일순'}
                        {sortBy === 'PRIORITY' && '우선순위순'}
                    </span>
                </button>
            </div>
        </div>

        {/* --- Kanban Columns (Dynamic Rendering) --- */}
        <div className="flex gap-8 h-full min-w-max pb-4 flex-1">
        {KANBAN_COLUMNS.map((col) => {
            const colTasks = processedTasks.filter((t) => t.status === col.id);
            const isDragOver = dragOverColumn === col.id;

            return (
            <div 
                key={col.id} 
                className={`w-[340px] flex flex-col h-full rounded-3xl transition-colors duration-300 ease-in-out px-2 py-2
                    ${isDragOver ? 'bg-blue-50/60 ring-2 ring-blue-200 ring-inset' : 'bg-transparent'}
                `}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => handleDrop(e, col.id)}
            >
                <div className="flex items-center justify-between mb-6 px-2 mt-2">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`}></div>
                    <h3 className="font-bold text-gray-700 text-sm">{col.label}</h3>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors
                    ${isDragOver ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'}
                `}>
                    {colTasks.length}
                </span>
                </div>

                <div className="flex-1 overflow-y-auto px-1 space-y-4 pb-20 custom-scrollbar">
                {colTasks.length === 0 && !isDragOver ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-300 border-2 border-dashed border-gray-100 rounded-2xl">
                        <span className="text-xs">업무 없음</span>
                    </div>
                ) : (
                    colTasks.map((task, index) => (
                    <div 
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`clean-card rounded-2xl cursor-grab active:cursor-grabbing group relative bg-white transition-all duration-300 flex flex-col overflow-hidden
                            ${draggedTaskId === task.id ? 'shadow-none' : 'hover:translate-y-[-2px]'}
                        `}
                        style={{ 
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'both' 
                        }}
                        onClick={() => onTaskClick(task)}
                    >
                    <div className="p-5 relative">
                            {/* Header: Priority & Delete */}
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md select-none flex items-center gap-1
                                    ${task.priority === Priority.HIGH ? 'bg-red-50 text-red-600' : 
                                    task.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600' : 
                                    'bg-green-50 text-green-600'}`}>
                                    {task.priority === Priority.HIGH && <AlertCircle className="w-3 h-3" />}
                                    {task.priority === Priority.HIGH ? '높음' : task.priority === Priority.MEDIUM ? '중간' : '낮음'}
                                </span>
                                {/* Delete Button - Absolute Positioned */}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm('이 업무를 삭제하시겠습니까?')) {
                                            onDeleteTask(task.id);
                                        }
                                    }}
                                    className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 z-10 bg-white shadow-sm"
                                    title="업무 삭제"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            
                            <h4 className="text-gray-800 font-semibold text-[15px] mb-2 leading-snug group-hover:text-blue-600 transition-colors select-none pr-8">
                                {task.title}
                            </h4>
                            <p className="text-gray-500 text-xs line-clamp-2 mb-4 font-light select-none leading-relaxed">{task.description}</p>
                            
                            <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                                {/* Left: Dates (Created + Due) */}
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400" title="생성일">
                                        <Clock className="w-3 h-3 opacity-70" />
                                        <span>생성: {formatDate(task.createdAt || Date.now())}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors
                                        ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-600'}`} title="마감일">
                                        <Calendar className="w-3 h-3 opacity-80" />
                                        <span>마감: {formatDate(task.dueDate)}</span>
                                    </div>
                                </div>
                                
                                {/* Right: Meta info */}
                                <div className="flex flex-col items-end gap-1.5">
                                     <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md max-w-[80px] truncate">{task.product}</span>
                                     <img src={`https://picsum.photos/seed/${task.assigneeId}/30/30`} className="w-6 h-6 rounded-full ring-2 ring-white shadow-sm select-none" alt="Assignee" />
                                </div>
                            </div>
                    </div>
                    </div>
                )))}
                
                {isDragOver && colTasks.length === 0 && (
                    <div className="h-32 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 flex items-center justify-center">
                        <span className="text-blue-400 text-sm font-medium">여기에 놓으세요</span>
                    </div>
                )}
                </div>
            </div>
            );
        })}
        </div>
    </div>
  );
};
