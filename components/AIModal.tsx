
import React, { useState, useEffect } from 'react';
import { Task, Subtask, ChatMessage } from '../types';
import { analyzeTaskWithAI, generateSubtasksAI, chatWithGuide, draftTaskWithAI } from '../src/services/geminiService';
import { Sparkles, BrainCircuit, ListTodo, CheckCircle2, X, Wand2, AlertCircle, PenLine, Loader2, MessageSquare } from './Icons';
import { marked } from 'marked';
import { Content } from '@google/generative-ai';

const AIModal: React.FC<{ task: Task; onClose: () => void; onUpdateTask: (updatedTask: Task) => void; }> = ({ task, onClose, onUpdateTask }) => {
    const [activeTab, setActiveTab] = useState('strategy');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Tab-specific state
    const [analysis, setAnalysis] = useState<{ strategy: string; resources: { title: string; url: string }[] } | null>(null);
    const [subtasks, setSubtasks] = useState<Partial<Subtask>[]>([]);
    const [chatHistory, setChatHistory] = useState<Content[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [drafts, setDrafts] = useState<Partial<Task>[]>([]);
    const [userInput, setUserInput] = useState(task.title);

    const runAnalysis = async () => {
        if (analysis) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeTaskWithAI(task);
            setAnalysis(result);
        } catch (e: any) {
            setError('Failed to analyze task.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const runSubtaskGeneration = async () => {
        if (subtasks.length > 0) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateSubtasksAI(task);
            setSubtasks(result);
        } catch (e: any) {
            setError('Failed to generate subtasks.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    
    const runDraftGeneration = async () => {
        if (!userInput.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await draftTaskWithAI(userInput);
            setDrafts(result);
        } catch (e: any) {
            setError('Failed to generate drafts.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || isLoading) return;
        
        const userMessage: Content = { role: 'user', parts: [{ text: chatInput }] };
        setChatHistory(prev => [...prev, userMessage]);
        const currentInput = chatInput;
        setChatInput('');
        setIsLoading(true);

        try {
            const response = await chatWithGuide(chatHistory, currentInput, task);
            const modelMessage: Content = { role: 'model', parts: [{ text: response }] };
            setChatHistory(prev => [...prev, modelMessage]);
        } catch (e: any) {
            setError('Failed to get chat response.');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const applyDraft = (draft: Partial<Task>) => {
        onUpdateTask({ ...task, title: draft.title || task.title, description: draft.description || task.description });
        onClose();
    };

    const addSubtasksToTask = () => {
        const newSubtasks = subtasks.filter(s => s.title).map((s, index) => ({
            id: `sub_${Date.now()}_${index}`,
            title: s.title!,
            completed: false,
        }));
        onUpdateTask({ ...task, subtasks: [...(task.subtasks || []), ...newSubtasks] });
        setSubtasks([]);
    };

    useEffect(() => {
        if (activeTab === 'strategy') runAnalysis();
        if (activeTab === 'subtasks') runSubtaskGeneration();
    }, [activeTab]);
    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex items-center justify-center text-gray-500 p-8"><Loader2 className="animate-spin mr-2"/>Loading...</div>;
        }
        if (error) {
            return <div className="text-red-500 bg-red-50 p-4 rounded-lg m-4"><AlertCircle className="inline mr-2"/>{error}</div>;
        }

        switch (activeTab) {
            case 'draft':
                return (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold">Redraft Task</h3>
                    <p className="text-sm text-gray-500 mb-4">Generate new versions of the task title and description.</p>
                    <div className="flex gap-2">
                      <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} className="flex-1 border-gray-300 rounded-lg"/>
                      <button onClick={runDraftGeneration} disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center"><Wand2 className="inline mr-2"/>Generate</button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {drafts.map((d, i) => (
                        <div key={i} className="border p-4 rounded-lg hover:bg-gray-50">
                          <p className="font-bold text-gray-800">{d.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{d.description}</p>
                          <button onClick={() => applyDraft(d)} className="text-sm text-purple-600 font-bold mt-3 hover:underline">Apply this draft</button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
            case 'strategy':
                return analysis ? (
                    <div className="p-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(analysis.strategy || "") as string }}></div>
                ) : null;
            case 'subtasks':
                return (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Generated Subtasks</h3>
                            {subtasks.length > 0 && <button onClick={addSubtasksToTask} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700">Add to Task</button>}
                        </div>
                        <div className="space-y-2">
                        {subtasks.map((s, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                                <CheckCircle2 className="text-gray-400 w-5 h-5 flex-shrink-0"/>
                                <span className="text-gray-700">{s.title}</span>
                            </div>
                        ))}
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className="p-6 flex flex-col h-full">
                        <div className="flex-1 overflow-y-auto mb-4 pr-2 custom-scrollbar">
                           {chatHistory.map((msg, index) => (
                               <div key={index} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                   <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: marked(msg.parts[0].text) as string }} />
                                   </div>
                               </div>
                           ))}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChatSend()} className="flex-1 border-gray-300 rounded-lg" placeholder="Ask a follow-up question..." />
                            <button onClick={handleChatSend} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">Send</button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
          <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl h-[80vh] flex flex-col relative" onClick={e => e.stopPropagation()}>
            <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"><X/></button>
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-purple-500"/> AI Task Assistant</h2>
              <p className="text-sm text-gray-500 mt-1">For task: <span className="font-medium text-gray-700">{task.title}</span></p>
            </div>
    
            <div className="flex-1 flex overflow-hidden">
              <div className="w-1/3 max-w-[220px] border-r bg-gray-50/50 p-4">
                <nav className="space-y-2">
                  <button onClick={() => setActiveTab('draft')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'draft' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}><PenLine/> Redraft Task</button>
                  <button onClick={() => setActiveTab('strategy')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'strategy' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}><BrainCircuit/> Analyze</button>
                  <button onClick={() => setActiveTab('subtasks')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'subtasks' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}><ListTodo/> Generate Subtasks</button>
                  <button onClick={() => setActiveTab('chat')} className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200'}`}><MessageSquare/> AI Guide Chat</button>
                </nav>
              </div>
    
              <div className="flex-1 overflow-y-auto">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      );
}

export default AIModal;
