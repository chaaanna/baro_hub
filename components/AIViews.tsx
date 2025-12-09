
import React, { useEffect, useRef } from 'react';
import { Task, ChatMessage, AIAnalysis } from '../types';
import { Sparkles, CheckCircle2, BrainCircuit, FileText, ArrowRight, Send } from './Icons';
import { UI_DEFAULTS } from '../constants';

// --- View Components ---

export const DraftView: React.FC<{
  input: string;
  setInput: (s: string) => void;
  onGenerate: () => void;
  results: Partial<Task>[] | null;
  selectedIdx: number | null;
  onSelect: (draft: Partial<Task>, idx: number) => void;
}> = ({ input, setInput, onGenerate, results, selectedIdx, onSelect }) => (
  <div className="max-w-3xl mx-auto animate-fade-in h-full flex flex-col">
    <div className="text-center mb-6 mt-2">
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Sparkles className="w-6 h-6 text-indigo-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">무엇을 도와드릴까요?</h3>
      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
        Gemini에게 대화하듯 요청하세요. <br/>
        거친 아이디어를 <span className="font-semibold text-indigo-600">전문적인 업무 명세서</span>로 변환해드립니다.
      </p>
    </div>

    <div className="relative w-full group mb-8">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl opacity-10 blur-lg transition-opacity group-hover:opacity-20"></div>
      <textarea 
        className="relative w-full p-6 rounded-2xl bg-white border border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-gray-900 placeholder-gray-400 resize-none h-32 transition-all text-base leading-relaxed shadow-sm"
        placeholder={UI_DEFAULTS.DRAFT_PLACEHOLDER}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button 
        onClick={onGenerate} 
        disabled={!input.trim()} 
        className="absolute bottom-4 right-4 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
      >
        <Sparkles className="w-4 h-4" /> 
        AI 작성 요청
      </button>
    </div>

    {results && (
      <div className="space-y-4 pb-10 animate-fade-in">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI 제안 결과 ({results.length})</h4>
          <span className="text-xs text-indigo-600 font-medium">원하는 카드를 클릭하여 적용하세요</span>
        </div>
        
        {results.map((draft, idx) => (
          <div 
            key={idx} 
            onClick={() => onSelect(draft, idx)}
            className={`group relative bg-white border rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-md
              ${selectedIdx === idx 
                ? 'border-indigo-500 ring-2 ring-indigo-500/10 bg-indigo-50/30' 
                : 'border-gray-200 hover:border-indigo-300'}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase
                  ${draft.styleTag === '표준' ? 'bg-gray-100 text-gray-600' :
                    draft.styleTag === '상세' ? 'bg-purple-100 text-purple-600' :
                    'bg-green-100 text-green-600'
                  }`}>
                  {draft.styleTag || 'Option'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  draft.priority === 'HIGH' ? 'bg-red-50 text-red-600 border-red-100' : 
                  draft.priority === 'MEDIUM' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                  'bg-green-50 text-green-600 border-green-100'
                }`}>{draft.priority}</span>
              </div>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all
                ${selectedIdx === idx ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 group-hover:border-indigo-400'}`}>
                {selectedIdx === idx && <CheckCircle2 className="w-3 h-3 text-white" />}
              </div>
            </div>
            <h4 className="font-bold text-gray-900 mb-2">{draft.title}</h4>
            <p className="text-sm text-gray-600 line-clamp-3 font-light leading-relaxed">{draft.description}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const StrategyView: React.FC<{ analysis?: AIAnalysis; onAnalyze: () => void }> = ({ analysis, onAnalyze }) => (
  <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
    {!analysis ? (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm shadow-blue-100">
          <BrainCircuit className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">AI 전략 분석</h3>
        <p className="text-gray-500 mb-8">Google Gemini가 업무를 분석하여<br/>최적의 실행 전략을 제안합니다.</p>
        <button onClick={onAnalyze} className="px-8 py-3 bg-black text-white rounded-full font-medium hover:scale-105 hover:shadow-lg transition-all">분석 시작하기</button>
      </div>
    ) : (
      <>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><BrainCircuit className="w-4 h-4" /></span>
            실행 전략
          </h3>
          <div className="prose prose-sm max-w-none text-gray-600 bg-gray-50/50 p-6 rounded-2xl border border-gray-100 leading-relaxed font-light">
            <pre className="whitespace-pre-wrap font-sans text-base">{analysis.strategy}</pre>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-600"><FileText className="w-4 h-4" /></span>
            추천 자료
          </h3>
          <div className="grid gap-3">
            {analysis.suggestedResources.map((res, idx) => (
              <a key={idx} href={res.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group bg-white shadow-sm">
                <div className="font-semibold text-gray-800 group-hover:text-blue-700 text-sm">{res.title}</div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>
      </>
    )}
  </div>
);

export const SubtaskView: React.FC<{
    task: Task;
    onGenerate: () => void;
    onToggle: (task: Task) => void;
}> = ({ task, onGenerate, onToggle }) => (
    <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex justify-between items-end mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">세부 업무 계획</h3>
                <p className="text-sm text-gray-500 mt-1">AI가 제안하는 단계별 체크리스트입니다.</p>
            </div>
            <button onClick={onGenerate} className="text-sm flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-2 rounded-full font-medium hover:bg-blue-100 transition-colors">
                <Sparkles className="w-4 h-4" /> AI 생성
            </button>
        </div>
        <div className="space-y-3">
            {task.subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-4 p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors ${st.completed ? 'bg-green-500 border-green-500' : 'border-gray-200 hover:border-blue-400'}`}
                            onClick={() => {
                                const updatedSubs = task.subtasks.map(s => s.id === st.id ? {...s, completed: !s.completed} : s);
                                onToggle({...task, subtasks: updatedSubs});
                            }}>
                        {st.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`flex-1 font-medium ${st.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{st.title}</span>
                </div>
            ))}
            {task.subtasks.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                    <p className="text-gray-400 text-sm">{UI_DEFAULTS.EMPTY_SUBTASKS}<br/>AI 생성을 눌러보세요.</p>
                </div>
            )}
        </div>
    </div>
);

export const ChatView: React.FC<{
    messages: ChatMessage[];
    inputMsg: string;
    setInputMsg: (s: string) => void;
    onSend: () => void;
}> = ({ messages, inputMsg, setInputMsg, onSend }) => {
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-3xl mx-auto">
            <div className="flex-1 overflow-y-auto space-y-6 pr-4 mb-6 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="text-gray-500 text-sm">이 업무에 대해 무엇이든 물어보세요.</p>
                    </div>
                )}
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm 
                            ${m.role === 'user' ? 'bg-black text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            {m.content}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>
            <div className="relative bg-white rounded-2xl shadow-sm border border-gray-200 p-1 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                <input 
                    type="text" 
                    className="w-full bg-transparent border-none outline-none pl-4 pr-12 py-3 text-gray-800 placeholder-gray-400" 
                    placeholder="메시지 입력..." 
                    value={inputMsg} 
                    onChange={(e) => setInputMsg(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && onSend()} 
                />
                <button 
                    onClick={onSend} 
                    className="absolute right-2 top-2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600" 
                    disabled={!inputMsg.trim()}
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
