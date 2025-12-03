
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/Kanban';
import { AIModal } from './components/AIModal';
import { GeminiPage } from './components/GeminiPage';
import { KnowledgeHub_ver2 } from './components/KnowledgeHub_ver2'; // New Version
import { Task, TaskStatus, Priority, ViewMode } from './types';
import { taskService } from './services/taskService'; 
import { Plus } from './components/Icons';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('BOARD');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load tasks from service
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const loadedTasks = await taskService.getAllTasks();
    setTasks(loadedTasks);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleUpdateTask = async (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    try {
      await taskService.updateTask(updated);
    } catch (error) {
      console.error("Failed to update task", error);
      loadTasks(); 
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskService.updateStatus(taskId, newStatus);
    } catch (error) {
      console.error("Failed to update status", error);
      loadTasks();
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
        setIsModalOpen(false);
        setSelectedTask(null);
    }
    try {
        await taskService.deleteTask(taskId);
    } catch (error) {
        console.error("Failed to delete task", error);
        loadTasks();
    }
  };

  const handleCreateTask = async () => {
    const newTaskTemplate: Task = {
        id: `t${Date.now()}`,
        title: '새로운 업무 요청',
        description: '',
        product: '일반',
        type: '기타',
        priority: Priority.MEDIUM,
        status: TaskStatus.REQUESTED,
        dueDate: new Date().toISOString(),
        assigneeId: 'u1',
        requesterId: 'u2',
        subtasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    const createdTask = await taskService.createTask(newTaskTemplate);
    setTasks(prev => [...prev, createdTask]);
    setSelectedTask(createdTask);
    setIsModalOpen(true);
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView}>
      
      {currentView === 'GEMINI' ? (
          <GeminiPage />
      ) : currentView === 'KNOWLEDGE' ? (
          <KnowledgeHub_ver2 />
      ) : (
        <>
            {/* Board Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 shrink-0 backdrop-blur-sm bg-white/50 sticky top-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">프로젝트 보드</h1>
                    <p className="text-sm text-gray-500 mt-1">팀의 업무 흐름을 AI와 함께 최적화하세요.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button onClick={handleCreateTask} className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95">
                        <Plus className="w-4 h-4" />
                        <span>새 요청 만들기</span>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">ME</div>
                </div>
            </header>

            {/* Board Content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-8 pt-4">
                <KanbanBoard 
                    tasks={tasks} 
                    onTaskClick={handleTaskClick}
                    onStatusChange={handleStatusChange}
                    onDeleteTask={handleDeleteTask}
                />
            </div>
        </>
      )}

      {/* Detail Modal (Global) */}
      {selectedTask && (
        <AIModal 
          task={selectedTask}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUpdateTask={handleUpdateTask}
        />
      )}
    </Layout>
  );
}
