
import React, { useState, useEffect } from 'react';
import { Task, Subtask, ChatMessage, Priority } from '../types';
import { analyzeTaskWithAI, generateSubtasksAI, chatWithGuide, draftTaskWithAI } from '../services/geminiService';
import { Sparkles, BrainCircuit, ListTodo, CheckCircle2, X, Wand2, AlertCircle, PenLine, Loader2 } from './Icons';
import { UI_TEXTS } from '../constants';
import { DraftView, StrategyView, SubtaskView, ChatView } from './AIViews';

interface AIModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (updatedTask: Task) => void;
}

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap
            ${active ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

export const AIModal: React.FC<AIModalProps> = ({ task, isOpen, onClose, onUpdateTask }) => {
  const [activeTab, setActiveTab] = useState<'draft' | 'strategy' | 'subtasks' | 'chat'>('strategy');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubtaskLoading, setIsSubtaskLoading] = useState(false);
  
  // Mode State
  const [isCreationMode, setIsCreationMode] = useState(false);

  // Local States for Child Views
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [draftInput, setDraftInput] = useState('');
  const [draftResults, setDraftResults] = useState<Partial<Task>[] | null>(null);
  const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
        // Check creation mode using constant string to avoid magic string duplication
        const isNew = task.title === UI_TEXTS.NEW_TASK_TITLE && (!task.description || task.description === '');
        setIsCreationMode(isNew);

        if (isNew) {
            setActiveTab('draft'); 
            setDraftInput('');
            setDraftResults(null);
            setSelectedDraftIndex(null);
        } else {
            setActiveTab('strategy');
            if (!task.aiAnalysis) {
                handleAnalyze();
            }
        }
    }
  }, [isOpen, task.id]);

  // --- Handlers ---

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const analysis = await analyzeTaskWithAI(task);
      onUpdateTask({ ...task, aiAnalysis: analysis });
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleGenerateSubtasks = async () => {
    if (!task.description) return;
    setIsSubtaskLoading(true);
    try {
      const newSubtasksRaw = await generateSubtasksAI(task);
      const newSubtasks: Subtask[] = newSubtasksRaw.map((s, i) => ({
        id: Date.now().toString() + i,
        title: s.title,
        completed: false
      }));
      onUpdateTask({ ...task, subtasks: [...task.subtasks, ...newSubtasks] });
    } catch (e) { console.error(e); } 
    finally { setIsSubtaskLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: inputMsg, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    
    const history = messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }));
    try {
        const responseText = await chatWithGuide(history, inputMsg, task);
        const modelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', content: responseText || "오류가 발생했습니다.", timestamp: Date.now() };
        setMessages(prev => [...prev, modelMsg]);
    } catch (e) { console.error(e); }
  };

  const handleSmartDraft = async () => {
    if (!draftInput.trim()) return;
    setIsLoading(true);
    setDraftResults(null);
    setSelectedDraftIndex(null);
    try {
        const results = await draftTaskWithAI(draftInput);
        setDraftResults(results);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  const handleSelectDraft = (draft: Partial<Task>, index: number) => {
    setSelectedDraftIndex(index);
    onUpdateTask({
        ...task,
        ...draft,
        aiAnalysis: undefined,
        subtasks: [] 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-gray-900/20 backdrop-blur-sm transition-opacity">
      <div className="modal-panel w-full max-w-6xl h-[90vh] rounded-3xl overflow-hidden flex flex-col md:flex-row animate-fade-in border border-white/50 shadow-2xl">
        
            {/* Left Panel: Context & Editor */}
            <div className="w-full md:w-[40%] lg:w-[340px] bg-gray-50/90 backdrop-blur-sm p-8 border-r border-gray-100 overflow-y-auto group/sidebar flex flex-col transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div className="relative">
                        <select 
                            value={task.priority}
                            onChange={(e) => onUpdateTask({...task, priority: e.target.value as Priority})}
                            className={`appearance-none pl-2.5 pr-8 py-1.5 text-[11px] font-bold rounded-md tracking-wide uppercase cursor-pointer transition-colors border-none focus:ring-2 focus:ring-blue-500/20 outline-none
                                ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700 hover:bg-red-200' : task.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                        >
                            <option value="HIGH">High Priority</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                        {task.priority === 'HIGH' && <AlertCircle className="w-3 h-3 absolute right-2 top-2 text-red-700 pointer-events-none" />}
                    </div>
                    <input 
                        value={task.product}
                        onChange={(e) => onUpdateTask({...task, product: e.target.value})}
                        className="text-xs font-medium text-gray-400 bg-transparent text-right w-24 border-none focus:ring-0 focus:text-gray-600 placeholder-gray-300 transition-colors outline-none"
                        placeholder="제품군 입력"
                    />
                </div>
                
                <div className="mb-4 relative group/title">
                    <textarea
                        value={task.title === UI_TEXTS.NEW_TASK_TITLE ? '' : task.title}
                        onChange={(e) => onUpdateTask({...task, title: e.target.value})}
                        className="w-full text-2xl font-bold text-gray-900 bg-transparent border-none focus:ring-0 p-0 resize-none overflow-hidden placeholder-gray-300 focus:placeholder-gray-400 outline-none"
                        placeholder="업무 제목을 입력하세요"
                        rows={1}
                        style={{ minHeight: '40px' }}
                        autoFocus={isCreationMode}
                        onInput={(e) => {
                            const t = e.target as HTMLTextAreaElement;
                            t.style.height = 'auto';
                            t.style.height = t.scrollHeight + 'px';
                        }}
                    />
                    <PenLine className="w-4 h-4 text-gray-300 absolute -right-5 top-2 opacity-0 group-hover/sidebar:opacity-100 transition-opacity pointer-events-none" />
                </div>

                <div className="mb-8 relative group/desc flex-1">
                    <textarea 
                        value={task.description}
                        onChange={(e) => onUpdateTask({...task, description: e.target.value})}
                        className="w-full text-base text-gray-600 leading-relaxed font-light bg-transparent border-none focus:ring-0 p-0 resize-none h-full min-h-[200px] placeholder-gray-300 outline-none whitespace-pre-wrap"
                        placeholder={UI_TEXTS.NEW_TASK_DESC_PLACEHOLDER}
                    />
                </div>
                
                <div className="space-y-6 border-t border-gray-200 pt-6 mt-auto">
                    {isCreationMode ? (
                         <button 
                            onClick={onClose}
                            className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            <span>업무 생성 완료</span>
                        </button>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">체크리스트</span>
                                <button 
                                    onClick={handleGenerateSubtasks}
                                    disabled={isSubtaskLoading || !task.description}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:bg-transparent group"
                                    title="AI로 하위 업무 자동 생성"
                                >
                                    {isSubtaskLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                                    <span>AI 생성</span>
                                </button>
                            </div>
                            
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-gray-500">{task.subtasks.filter(t=>t.completed).length}/{task.subtasks.length} 완료</span>
                            </div>

                            <ul className="space-y-2">
                                {task.subtasks.map(st => (
                                    <li key={st.id} className="flex items-start gap-3 group cursor-pointer" 
                                        onClick={() => {
                                            const updatedSubs = task.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s);
                                            onUpdateTask({...task, subtasks: updatedSubs});
                                        }}>
                                        <div className={`w-5 h-5 mt-0.5 rounded-full border flex items-center justify-center transition-colors ${st.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                                            {st.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm transition-colors ${st.completed ? 'text-gray-400 line-through' : 'text-gray-700 group-hover:text-gray-900'}`}>{st.title}</span>
                                    </li>
                                ))}
                            </ul>
                            {task.subtasks.length === 0 && <span className="text-sm text-gray-400 italic">{UI_TEXTS.EMPTY_SUBTASKS}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: AI Workspace */}
            <div className="flex-1 flex flex-col bg-white relative">
                {/* Tabs Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
                        {isCreationMode && (
                            <TabButton active={activeTab === 'draft'} onClick={() => setActiveTab('draft')} icon={<Wand2 className="w-4 h-4" />} label="AI 작성 (Draft)" />
                        )}
                        {!isCreationMode && (
                            <>
                                <TabButton active={activeTab === 'strategy'} onClick={() => setActiveTab('strategy')} icon={<BrainCircuit className="w-4 h-4" />} label="전략" />
                                <TabButton active={activeTab === 'subtasks'} onClick={() => setActiveTab('subtasks')} icon={<ListTodo className="w-4 h-4" />} label="계획" />
                                <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<Sparkles className="w-4 h-4" />} label="가이드" />
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative bg-white">
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-20 backdrop-blur-sm transition-opacity">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-indigo-600 animate-spin"></div>
                                <span className="text-sm font-medium text-indigo-600 animate-pulse">AI가 작업을 처리하고 있습니다...</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'draft' && isCreationMode && (
                        <DraftView 
                            input={draftInput} 
                            setInput={setDraftInput} 
                            onGenerate={handleSmartDraft} 
                            results={draftResults} 
                            selectedIdx={selectedDraftIndex}
                            onSelect={handleSelectDraft} 
                        />
                    )}
                    
                    {activeTab === 'strategy' && !isCreationMode && (
                        <StrategyView analysis={task.aiAnalysis} onAnalyze={handleAnalyze} />
                    )}

                    {activeTab === 'subtasks' && !isCreationMode && (
                        <SubtaskView task={task} onGenerate={handleGenerateSubtasks} onToggle={onUpdateTask} />
                    )}

                    {activeTab === 'chat' && !isCreationMode && (
                         <ChatView messages={messages} inputMsg={inputMsg} setInputMsg={setInputMsg} onSend={handleSendMessage} />
                    )}
                </div>
            </div>
      </div>
    </div>
  );
};
