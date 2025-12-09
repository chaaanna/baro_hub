
import React from 'react';
import { ViewMode } from '../types';
import { LayoutDashboard, Search, Sparkles, ListTodo, Bot, BookOpen, Video } from './Icons';

interface LayoutProps { 
    children: React.ReactNode; 
    currentView: ViewMode; 
    onNavigate: (view: ViewMode) => void; 
}

const NavButton = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center lg:justify-start px-4 py-3 rounded-full transition-all duration-200 group relative
    ${active ? 'bg-blue-100/50 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
  >
     {React.cloneElement(icon as React.ReactElement<any>, { className: `w-5 h-5 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}` })}
     <span className="hidden lg:block ml-3 text-sm">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  return (
    <div className="min-h-screen flex font-sans bg-white text-gray-900">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-gray-200 flex flex-col bg-gray-50/80 backdrop-blur-md fixed h-full z-20">
        <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8">
          <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8">
                  <div className="absolute inset-0 rounded-full border-[3px] border-t-blue-500 border-r-green-500 border-b-yellow-500 border-l-red-500"></div>
              </div>
              <span className="hidden lg:block font-bold text-xl text-gray-800 tracking-tight">Nexus AI</span>
          </div>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1">
          <NavButton 
              icon={<LayoutDashboard />} 
              label="보드" 
              active={currentView === 'BOARD'} 
              onClick={() => onNavigate('BOARD')}
          />
          <NavButton 
              icon={<Bot />} 
              label="Gemini Pro" 
              active={currentView === 'GEMINI'} 
              onClick={() => onNavigate('GEMINI')}
          />
          <NavButton 
              icon={<BookOpen />} 
              label="지식 허브" 
              active={currentView === 'KNOWLEDGE'} 
              onClick={() => onNavigate('KNOWLEDGE')}
          />
          <NavButton 
              icon={<Video />} 
              label="영상 분석" 
              active={currentView === 'VIDEO'} 
              onClick={() => onNavigate('VIDEO')}
          />
          <div className="pt-4 pb-2">
               <div className="h-px bg-gray-200 mx-2"></div>
          </div>
          <NavButton icon={<ListTodo />} label="내 업무" />
          <NavButton icon={<Search />} label="검색" />
        </nav>

        <div className="p-6 border-t border-gray-100">
           <div className="bg-white p-4 rounded-2xl hidden lg:block border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <p className="text-xs font-semibold text-gray-600">AI 크레딧</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                 <div className="bg-blue-600 h-1.5 rounded-full w-[45%]"></div>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                 <span>450 사용</span>
                 <span>1000 한도</span>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-20 lg:ml-64 flex flex-col h-screen overflow-y-auto relative">
          {currentView === 'BOARD' && (
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          )}
          {children}
      </main>
    </div>
  );
};
