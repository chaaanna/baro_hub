
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { KanbanBoard } from './components/Kanban';
import AIModal from './components/AIModal';
import { Task, ViewMode } from './types';
import { taskService } from './src/services/taskService';
import { Plus } from './components/Icons';
import { GeminiPage } from './components/GeminiPage';
import KnowledgeHub from './components/KnowledgeHub';
import VideoAnalysisView from './src/views/VideoAnalysisView';

export default function App() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentView, setCurrentView] = useState<ViewMode>('BOARD');

    useEffect(() => {
        const loadTasks = async () => {
            const fetchedTasks = await taskService.getAllTasks();
            setTasks(fetchedTasks);
        };
        loadTasks();
    }, []);

    const handleUpdateTask = (updatedTask: Task) => {
        const updatedTasks = tasks.map(task =>
            task.id === updatedTask.id ? updatedTask : task
        );
        setTasks(updatedTasks);
        taskService.updateTask(updatedTask);
    };

    const handleAddTask = async () => {
        const newTask = await taskService.createTask({
            title: 'New Task - Click to edit',
            description: 'Please provide a detailed description for this new task.',
            status: 'REQUESTED',
            priority: 'MEDIUM',
            dueDate: new Date().toISOString().split('T')[0],
        } as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
        setTasks(prevTasks => [newTask, ...prevTasks]);
        setSelectedTask(newTask);
        setIsModalOpen(true);
    };

    const openModal = (task: Task) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };
    
    const handleDeleteTask = (taskId: string) => {
        taskService.deleteTask(taskId);
        setTasks(tasks.filter(task => task.id !== taskId));
    };
    
    const renderCurrentView = () => {
        switch (currentView) {
            case 'BOARD':
                return (
                    <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <h1 className="text-3xl font-bold text-gray-800">Kanban Board</h1>
                            <button
                                onClick={handleAddTask}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center transition-colors shadow-sm hover:shadow-md"
                            >
                                <Plus className="mr-2" />
                                Add Task
                            </button>
                        </div>
                        <KanbanBoard 
                            tasks={tasks} 
                            onTaskClick={openModal} 
                            onStatusChange={(taskId, newStatus) => {
                                const task = tasks.find(t => t.id === taskId);
                                if (task) handleUpdateTask({ ...task, status: newStatus });
                            }} 
                            onDeleteTask={handleDeleteTask} 
                        />
                    </div>
                );
            case 'GEMINI':
                return <GeminiPage />;
            case 'KNOWLEDGE':
                return <KnowledgeHub />;
            case 'VIDEO':
                return <VideoAnalysisView />;
            default:
                return <div>View not found</div>;
        }
    }

    return (
        <Layout currentView={currentView} onNavigate={setCurrentView}>
            {renderCurrentView()}
            {isModalOpen && selectedTask && (
                <AIModal
                    task={selectedTask}
                    onClose={closeModal}
                    onUpdateTask={handleUpdateTask}
                />
            )}
        </Layout>
    );
}
