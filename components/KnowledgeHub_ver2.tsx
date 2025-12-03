
import React, { useState, useEffect, useRef } from 'react';
import { KnowledgeResource, ResourceType } from '../types';
import { knowledgeService } from '../services/knowledgeService';
import { 
    BookOpen, LinkIcon, Youtube, Video, Tag, Clock, 
    Plus, Search, ExternalLink, Trash2, Loader2, Sparkles,
    X, Bot, ArrowRight, CheckCircle2, Calendar, ChevronDown, ChevronUp, RotateCcw,
    ChevronRight, ChevronLeft, Rocket, Upload
} from './Icons';
import { formatDate } from '../utils/taskHelpers';

const ITEMS_PER_PAGE = 8;

export const KnowledgeHub_ver2: React.FC = () => {
    const [resources, setResources] = useState<KnowledgeResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    
    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(null);
    
    // Add Modal Specific State
    const [activeTab, setActiveTab] = useState<'url' | 'file'>('url');
    const [inputUrl, setInputUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State for Details
    const [isKeyPointsExpanded, setIsKeyPointsExpanded] = useState(false);
    
    const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadResources();
    }, []);

    useEffect(() => {
        if (selectedResource) {
            setIsKeyPointsExpanded(false);
        }
    }, [selectedResource]);

    // Reset Modal State on Open
    useEffect(() => {
        if (isAddModalOpen) {
            setInputUrl('');
            setSelectedFile(null);
            setIsAnalyzing(false);
            setActiveTab('url');
        }
    }, [isAddModalOpen]);

    const loadResources = async () => {
        try {
            const data = await knowledgeService.getAllResources();
            setResources(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddResource = async () => {
        if (activeTab === 'url' && !inputUrl.trim()) return;
        if (activeTab === 'file' && !selectedFile) return;

        setIsAnalyzing(true);
        try {
            if (activeTab === 'url') {
                await knowledgeService.addResourceFromUrl(inputUrl);
            } else if (selectedFile) {
                await knowledgeService.addResourceFromFile(selectedFile);
            }
            
            await loadResources();
            setIsAddModalOpen(false);
            setCurrentPage(1); // Go to first page to see new item
        } catch (error) {
            alert('자료 분석에 실패했습니다.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleRetry = async (id: string, e?: React.MouseEvent) => {
        if(e) e.stopPropagation();
        setRetryLoadingId(id);
        try {
            const updated = await knowledgeService.retryResource(id);
            setResources(prev => prev.map(r => r.id === id ? updated : r));
            if (selectedResource?.id === id) setSelectedResource(updated);
        } catch (error) {
            alert('재분석에 실패했습니다.');
        } finally {
            setRetryLoadingId(null);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('이 자료를 삭제하시겠습니까?')) {
            await knowledgeService.deleteResource(id);
            setResources(prev => prev.filter(r => r.id !== id));
            if (selectedResource?.id === id) setSelectedResource(null);
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return null;
        const min = Math.floor(seconds / 60);
        return `${min}분`;
    }

    const isFailedState = (r: KnowledgeResource) => {
        return r.basicInfo.title.includes('분석 실패') || r.basicInfo.title.includes('Not Found') || r.basicInfo.summary.includes('데이터를 파싱할 수 없습니다');
    };
    
    // Filtering & Pagination Logic
    const filteredResources = resources.filter(r => 
        r.basicInfo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.basicInfo.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredResources.length / ITEMS_PER_PAGE);
    const currentData = filteredResources.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(p => p + 1);
    }

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(p => p - 1);
    }

    // Helper for Initials
    const getInitials = (name?: string | null) => {
        if (!name) return 'U';
        return name.charAt(0).toUpperCase();
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden relative">
            {/* Background Deco */}
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-3xl opacity-50 translate-y-1/4 translate-x-1/4 pointer-events-none"></div>

            {/* Header - Compact */}
            <header className="h-16 flex items-center justify-between px-6 z-10 shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <h1 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        지식 허브
                    </h1>
                    <span className="w-px h-4 bg-gray-200"></span>
                    <p className="text-xs text-gray-500">팀 스마트 학습 라이브러리</p>
                </div>
                <div className="flex items-center gap-3">
                     <div className="relative group w-56">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="자료 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-50 pl-9 pr-4 py-2 rounded-full text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border border-transparent focus:border-indigo-500 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-1.5 bg-[#306364] hover:bg-[#244b4b] text-white px-4 py-2 rounded-full text-xs font-bold transition-all shadow-sm hover:shadow-md"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>자료 추가</span>
                    </button>
                </div>
            </header>

            {/* Content - Fixed Grid with Pagination */}
            <div className="flex-1 flex flex-col p-6 min-h-0">
                {isLoading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Grid Container */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto xl:overflow-hidden content-start px-1 pb-4">
                            {currentData.map(res => (
                                <div 
                                    key={res.id} 
                                    onClick={() => setSelectedResource(res)}
                                    className={`group cursor-pointer bg-white rounded-xl p-5 border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative flex flex-col h-[260px]
                                        ${isFailedState(res) ? 'border-red-200 bg-red-50/20' : 'border-gray-200 hover:border-indigo-300'}
                                    `}
                                >
                                    {/* 1. Header: Type (Left) + Level (Right) */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide
                                            ${res.basicInfo.contentType === 'video' ? 'bg-red-50 text-red-600' : 
                                              res.basicInfo.contentType === 'document' ? 'bg-purple-50 text-purple-600' : 
                                              'bg-blue-50 text-blue-600'}`}>
                                            {res.basicInfo.contentType}
                                        </span>
                                        
                                        {!isFailedState(res) && (
                                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                                                {res.basicInfo.level}
                                            </span>
                                        )}
                                        {isFailedState(res) && (
                                            <button onClick={(e) => handleRetry(res.id, e)} className="p-1 hover:text-blue-600" title="재시도">
                                                <RotateCcw className={`w-3.5 h-3.5 ${retryLoadingId === res.id ? 'animate-spin' : ''}`} />
                                            </button>
                                        )}
                                    </div>

                                    {/* 2. Body: Title + Desc + Tags */}
                                    <div className="flex-1 flex flex-col mb-4">
                                        <h3 className={`text-[17px] font-bold mb-2 leading-snug line-clamp-2 flex items-start gap-1 group-hover:text-blue-600 transition-colors
                                            ${isFailedState(res) ? 'text-red-600' : 'text-[#1e293b]'}`}>
                                            {res.basicInfo.title}
                                            <ExternalLink className="w-3.5 h-3.5 mt-1 text-gray-300 group-hover:text-blue-400 shrink-0" />
                                        </h3>
                                        
                                        <p className="text-[13px] text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                                            {isFailedState(res) ? res.managementInfo.originalFileUrl : res.basicInfo.summary}
                                        </p>

                                        <div className="flex flex-wrap gap-1.5 mt-auto">
                                             {res.basicInfo.tags.slice(0, 3).map((tag, i) => (
                                                <span key={i} className="px-2.5 py-1 bg-[#F3F4F6] rounded-md text-[11px] font-medium text-gray-500 border border-transparent">
                                                    #{tag}
                                                </span>
                                             ))}
                                        </div>
                                    </div>

                                    {/* 3. Footer: Author + Date */}
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm
                                                ${isFailedState(res) ? 'bg-red-300' : 'bg-[#D1D5DB]'}`}>
                                                {getInitials(res.basicInfo.author)}
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
                                                {res.basicInfo.author || 'Unknown'}
                                            </span>
                                        </div>
                                        <span className="text-[11px] text-gray-400 font-medium">
                                            {formatDate(res.metadata.uploadedAt)}
                                        </span>
                                    </div>

                                    {/* Hover Actions */}
                                    <button 
                                        onClick={(e) => handleDelete(res.id, e)}
                                        className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        <div className="h-12 flex items-center justify-between border-t border-gray-100 mt-2 pt-2">
                            <div className="text-xs text-gray-400 font-medium ml-2">
                                Total {filteredResources.length} resources
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handlePrevPage} 
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                                </button>
                                
                                <div className="flex gap-1.5">
                                    {Array.from({ length: totalPages }).map((_, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-2 h-2 rounded-full transition-all ${currentPage === i + 1 ? 'bg-indigo-600 w-4' : 'bg-gray-300 hover:bg-gray-400'}`}
                                        />
                                    ))}
                                </div>

                                <button 
                                    onClick={handleNextPage} 
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                >
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>
                            <div className="w-20"></div>
                        </div>
                    </>
                )}
            </div>

             {/* --- Detail View Modal --- */}
             {selectedResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Detail Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                             <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                                        ${selectedResource.basicInfo.contentType === 'video' ? 'bg-red-100 text-red-600' : 
                                          selectedResource.basicInfo.contentType === 'document' ? 'bg-purple-50 text-purple-600' : 
                                          'bg-blue-50 text-blue-600'}`}>
                                        {selectedResource.basicInfo.contentType}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(selectedResource.metadata.uploadedAt)}
                                    </span>
                                    {selectedResource.metadata.duration && (
                                        <span className="flex items-center gap-1 text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(selectedResource.metadata.duration)}
                                        </span>
                                    )}
                                </div>
                                <h2 className={`text-xl font-bold leading-snug pr-8 ${isFailedState(selectedResource) ? 'text-red-600' : 'text-gray-900'}`}>
                                    {selectedResource.basicInfo.title}
                                </h2>
                                {selectedResource.basicInfo.author && (
                                    <p className="text-sm text-gray-500 mt-1">By {selectedResource.basicInfo.author}</p>
                                )}
                             </div>
                             <button 
                                onClick={() => setSelectedResource(null)}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/50 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Detail Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            {/* Summary */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    AI 요약
                                </h4>
                                <p className={`leading-relaxed p-4 rounded-2xl text-sm border ${isFailedState(selectedResource) ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50/30 border-indigo-50 text-gray-600'}`}>
                                    {selectedResource.basicInfo.summary}
                                </p>
                            </div>

                            {/* Chapters */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        {selectedResource.searchOptimization.chapters.length > 0 ? '주요 챕터' : '핵심 키워드'}
                                    </h4>
                                </div>
                                
                                {selectedResource.searchOptimization.chapters.length > 0 ? (
                                    <>
                                        <ul className="space-y-3">
                                            {(isKeyPointsExpanded ? selectedResource.searchOptimization.chapters : selectedResource.searchOptimization.chapters.slice(0, 3)).map((chap, idx) => (
                                                <li key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors animate-fade-in">
                                                    <div className="w-14 h-6 rounded-md bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm mt-0.5 shrink-0">
                                                        {chap.timestamp}
                                                    </div>
                                                    <div>
                                                        <span className="block text-sm font-bold text-gray-800 mb-0.5">{chap.title}</span>
                                                        <span className="text-xs text-gray-600 leading-relaxed">{chap.summary}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                        {selectedResource.searchOptimization.chapters.length > 3 && (
                                            <button 
                                                onClick={() => setIsKeyPointsExpanded(!isKeyPointsExpanded)}
                                                className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {isKeyPointsExpanded ? <span>접기</span> : <span>더 보기</span>}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResource.searchOptimization.keywords.map((keyword, idx) => (
                                            <span key={idx} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700">
                                                {keyword}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <Tag className="w-4 h-4 text-gray-400" />
                                        관련 태그
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResource.basicInfo.tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detail Footer */}
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3 items-center">
                            <a 
                                href={selectedResource.managementInfo.originalFileUrl || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95"
                            >
                                <span>원본 자료 보러가기</span>
                                <ExternalLink className="w-4 h-4" />
                            </a>
                            <button 
                                onClick={() => setSelectedResource(null)}
                                className="px-6 py-3 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl font-medium text-sm transition-colors"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal (Professional Mode) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-900">새 지식 추가하기 (Professional Mode)</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8">
                             {isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <div className="w-16 h-16 border-4 border-[#306364]/20 border-t-[#306364] rounded-full animate-spin"></div>
                                    <div className="text-center">
                                        <h4 className="font-bold text-lg text-gray-900">정밀 분석 진행 중...</h4>
                                        <p className="text-sm text-gray-500 mt-1">Gemini Pro가 콘텐츠 구조와 메타데이터를<br/>추출하고 있습니다. 잠시만 기다려주세요.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Tabs */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                                        <button 
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'url' ? 'bg-white shadow-sm text-[#306364]' : 'text-gray-500 hover:text-gray-700'}`} 
                                            onClick={() => setActiveTab('url')}
                                        >
                                            URL 링크
                                        </button>
                                        <button 
                                            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'file' ? 'bg-white shadow-sm text-[#306364]' : 'text-gray-500 hover:text-gray-700'}`} 
                                            onClick={() => setActiveTab('file')}
                                        >
                                            파일 업로드 (Video/File)
                                        </button>
                                    </div>

                                    {/* Tab Content */}
                                    {activeTab === 'url' ? (
                                        <div className="mb-8 animate-fade-in">
                                            <label className="block text-sm font-bold text-gray-900 mb-2">자료 URL (Link)</label>
                                            <input 
                                                type="text" 
                                                value={inputUrl}
                                                onChange={(e) => setInputUrl(e.target.value)}
                                                placeholder="https://youtube.com/... 또는 기술 블로그 URL"
                                                className="w-full px-5 py-4 rounded-xl bg-white border border-gray-200 focus:border-[#306364] focus:ring-4 focus:ring-[#306364]/10 outline-none transition-all text-base"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <div 
                                            className="mb-8 border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-gray-50 hover:border-[#306364]/50 transition-all cursor-pointer animate-fade-in group"
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                        >
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={handleFileSelect} 
                                            />
                                            <div className="w-14 h-14 rounded-full bg-[#306364]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                                <Upload className="w-7 h-7 text-[#306364]" />
                                            </div>
                                            {selectedFile ? (
                                                <div>
                                                    <p className="font-bold text-gray-900 text-lg mb-1">{selectedFile.name}</p>
                                                    <p className="text-sm text-gray-500">{(selectedFile.size/1024/1024).toFixed(2)} MB</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-lg font-bold text-gray-700 mb-1">클릭하여 파일 선택 또는 드래그 앤 드롭</p>
                                                    <p className="text-sm text-gray-400">MP4, PDF, DOCX, TXT (최대 100MB)</p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button 
                                        onClick={handleAddResource}
                                        disabled={activeTab === 'url' ? !inputUrl.trim() : !selectedFile}
                                        className="w-full py-4 bg-[#306364] hover:bg-[#244b4b] text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-[#306364]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                                    >
                                        정밀 분석 시작
                                    </button>

                                    {/* Footer Banner */}
                                    <div className="mt-6 bg-[#306364]/10 rounded-xl p-4 flex items-start gap-3">
                                        <Rocket className="w-5 h-5 text-[#306364] mt-0.5 shrink-0" />
                                        <p className="text-sm text-[#306364] leading-snug font-medium">
                                            <span className="font-bold">Professional Mode:</span> 지식 관리 전문가 수준의 정교한 메타데이터와 검색 최적화 키워드를 추출합니다.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
