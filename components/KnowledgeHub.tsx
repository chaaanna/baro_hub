
import React, { useState, useEffect } from 'react';
import { KnowledgeResource, ResourceType } from '../types';
import { knowledgeService } from '../services/knowledgeService';
import { 
    BookOpen, LinkIcon, Youtube, Video, Tag, Clock, 
    Plus, Search, ExternalLink, Trash2, Loader2, Sparkles, FileText,
    X, Bot, ArrowRight, CheckCircle2, Calendar, ChevronDown, ChevronUp, RotateCcw
} from './Icons';
import { formatDate } from '../utils/taskHelpers';

export const KnowledgeHub: React.FC = () => {
    const [resources, setResources] = useState<KnowledgeResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Modals State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(null);
    
    // UI State for Details
    const [isKeyPointsExpanded, setIsKeyPointsExpanded] = useState(false);
    
    const [inputUrl, setInputUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null); // Track which item is retrying
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadResources();
    }, []);

    // Reset expansion state when a new resource is selected
    useEffect(() => {
        if (selectedResource) {
            setIsKeyPointsExpanded(false);
        }
    }, [selectedResource]);

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
        if (!inputUrl.trim()) return;
        setIsAnalyzing(true);
        try {
            await knowledgeService.addResourceFromUrl(inputUrl);
            await loadResources();
            setIsAddModalOpen(false);
            setInputUrl('');
        } catch (error) {
            alert('자료 분석에 실패했습니다.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
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
        e.stopPropagation(); // Prevent card click
        if (confirm('이 자료를 삭제하시겠습니까?')) {
            await knowledgeService.deleteResource(id);
            setResources(prev => prev.filter(r => r.id !== id));
            if (selectedResource?.id === id) setSelectedResource(null);
        }
    };

    const getTypeIcon = (type: ResourceType) => {
        switch (type.toLowerCase()) {
            case 'video': return <Youtube className="w-5 h-5 text-red-500" />;
            case 'document': return <BookOpen className="w-5 h-5 text-blue-500" />;
            case 'article': 
            default: return <FileText className="w-5 h-5 text-green-500" />;
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return null;
        const min = Math.floor(seconds / 60);
        return `${min}분`;
    }

    const filteredResources = resources.filter(r => 
        r.basicInfo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.basicInfo.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helper to detect video URL for UI feedback
    const isVideoUrl = inputUrl.includes('youtube.com') || inputUrl.includes('youtu.be');

    // Helper to check if resource is in "Failed" state
    const isFailedState = (r: KnowledgeResource) => {
        return r.basicInfo.title.includes('분석 실패') || r.basicInfo.title.includes('Not Found') || r.basicInfo.summary.includes('데이터를 파싱할 수 없습니다');
    };

    return (
        <div className="flex flex-col h-screen bg-white overflow-hidden relative">
            {/* Background Deco */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-40 -translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

            {/* Header */}
            <header className="h-20 flex items-center justify-between px-8 z-10 shrink-0 backdrop-blur-sm bg-white/60 sticky top-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        지식 허브
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">팀을 위한 스마트한 학습 자료 저장소</p>
                </div>
                <div className="flex items-center gap-4">
                     <div className="relative group w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="자료 검색..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white pl-10 pr-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>자료 추가</span>
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredResources.map(res => (
                            <div 
                                key={res.id} 
                                onClick={() => setSelectedResource(res)}
                                className={`group cursor-pointer bg-white rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col
                                    ${isFailedState(res) ? 'border-red-200 hover:border-red-300 bg-red-50/30' : 'border-gray-100 hover:border-indigo-200'}
                                `}
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                     {/* Retry Button for Card */}
                                     {isFailedState(res) && (
                                        <button
                                            onClick={(e) => handleRetry(res.id, e)}
                                            className="p-2 rounded-full bg-white hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors shadow-sm border border-gray-200"
                                            title="재분석"
                                        >
                                            <RotateCcw className={`w-4 h-4 ${retryLoadingId === res.id ? 'animate-spin text-blue-500' : ''}`} />
                                        </button>
                                     )}
                                     <button 
                                        onClick={(e) => handleDelete(res.id, e)}
                                        className="p-2 rounded-full bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shadow-sm border border-gray-200"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-xl border transition-colors ${isFailedState(res) ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 group-hover:bg-indigo-50 group-hover:border-indigo-100'}`}>
                                            {getTypeIcon(res.basicInfo.contentType)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{res.basicInfo.contentType}</span>
                                            <span className="text-[10px] text-gray-400">{formatDate(res.metadata.uploadedAt)}</span>
                                        </div>
                                    </div>
                                    {!isFailedState(res) && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                                            ${res.basicInfo.level === 'BEGINNER' ? 'bg-green-50 text-green-600' : 
                                            res.basicInfo.level === 'INTERMEDIATE' ? 'bg-orange-50 text-orange-600' : 'bg-purple-50 text-purple-600'}`}>
                                            {res.basicInfo.level}
                                        </span>
                                    )}
                                </div>

                                <h3 className={`text-lg font-bold mb-2 leading-snug transition-colors line-clamp-2 ${isFailedState(res) ? 'text-red-600' : 'text-gray-900 group-hover:text-indigo-700'}`}>
                                    {res.basicInfo.title}
                                </h3>
                                
                                {isFailedState(res) ? (
                                    <div className="text-xs text-gray-500 mb-4 break-all bg-white/50 p-2 rounded-lg border border-red-100">
                                        <p className="font-medium text-red-500 mb-1">원본 링크:</p>
                                        {res.managementInfo.originalFileUrl}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 h-10">
                                        {res.basicInfo.summary}
                                    </p>
                                )}

                                <div className={`bg-gray-50 rounded-xl p-3 mb-4 flex-1 ${isFailedState(res) ? 'bg-white/50' : ''}`}>
                                    {res.searchOptimization.chapters.length > 0 ? (
                                        <ul className="space-y-1.5">
                                            {res.searchOptimization.chapters.slice(0, 2).map((chap, i) => (
                                                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                                                    <span className="block w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                                                    <span className="line-clamp-1">{chap.title} - {chap.summary}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                             {res.searchOptimization.keywords.slice(0, 3).map((k, i) => (
                                                <span key={i} className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-500">
                                                    {k}
                                                </span>
                                             ))}
                                             {res.searchOptimization.keywords.length === 0 && (
                                                <span className={`text-xs flex items-center gap-2 ${isFailedState(res) ? 'text-red-400' : 'text-gray-400'}`}>
                                                    {isFailedState(res) ? '재분석을 통해 다시 시도해보세요.' : '분석된 내용 없음'}
                                                </span>
                                             )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-auto">
                                    <div className="flex gap-1.5 overflow-hidden">
                                        {res.basicInfo.tags.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded-md text-[10px] font-medium text-gray-500 flex items-center gap-1">
                                                <Tag className="w-2.5 h-2.5 opacity-50" />
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    {res.metadata.duration && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(res.metadata.duration)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        
                        {/* Add Button */}
                        <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all h-full min-h-[280px] group"
                        >
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Plus className="w-6 h-6 text-indigo-500" />
                            </div>
                            <span className="font-bold text-gray-600 group-hover:text-indigo-600">새 자료 추가</span>
                            <span className="text-xs text-gray-400 mt-1">URL만 입력하면 AI가 정리해드려요</span>
                        </button>
                    </div>
                )}
            </div>

            {/* --- Detail View Modal --- */}
            {selectedResource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                             <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider
                                        ${selectedResource.basicInfo.contentType === 'video' ? 'bg-red-100 text-red-600' : 
                                          selectedResource.basicInfo.contentType === 'document' ? 'bg-blue-100 text-blue-600' : 
                                          'bg-green-100 text-green-600'}`}>
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

                        {/* Body */}
                        <div className="p-8 overflow-y-auto custom-scrollbar">
                            
                            {/* Summary Section */}
                            <div className="mb-8">
                                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-indigo-500" />
                                    AI 요약
                                </h4>
                                <p className={`leading-relaxed p-4 rounded-2xl text-sm border ${isFailedState(selectedResource) ? 'bg-red-50 border-red-100 text-red-600' : 'bg-indigo-50/30 border-indigo-50 text-gray-600'}`}>
                                    {selectedResource.basicInfo.summary}
                                </p>
                            </div>

                            {/* Chapters / Key Points Section */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        {selectedResource.searchOptimization.chapters.length > 0 ? '주요 챕터' : '핵심 키워드'}
                                    </h4>
                                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                        {selectedResource.searchOptimization.chapters.length > 0 
                                            ? `총 ${selectedResource.searchOptimization.chapters.length}개 구간` 
                                            : `키워드 ${selectedResource.searchOptimization.keywords.length}개`
                                        }
                                    </span>
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
                                        {/* Show More / Less Button */}
                                        {selectedResource.searchOptimization.chapters.length > 3 && (
                                            <button 
                                                onClick={() => setIsKeyPointsExpanded(!isKeyPointsExpanded)}
                                                className="w-full mt-3 py-2 flex items-center justify-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {isKeyPointsExpanded ? (
                                                    <>
                                                        <span>접기</span>
                                                        <ChevronUp className="w-3 h-3" />
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{selectedResource.searchOptimization.chapters.length - 3}개 더 보기</span>
                                                        <ChevronDown className="w-3 h-3" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResource.searchOptimization.keywords.length > 0 ? (
                                            selectedResource.searchOptimization.keywords.map((keyword, idx) => (
                                                <span key={idx} className="px-3 py-1.5 bg-gray-50 rounded-lg text-sm text-gray-700">
                                                    {keyword}
                                                </span>
                                            ))
                                        ) : (
                                            <div className="w-full text-center py-6 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50 text-gray-400 text-sm">
                                                상세 내용을 추출하지 못했습니다.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tags & Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <Tag className="w-4 h-4 text-gray-400" />
                                        관련 태그
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedResource.basicInfo.tags.length > 0 ? selectedResource.basicInfo.tags.map((tag, i) => (
                                            <span key={i} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-600">
                                                #{tag}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-gray-400">태그 없음</span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                                        <BookOpen className="w-4 h-4 text-gray-400" />
                                        카테고리
                                    </h4>
                                    <div className="flex gap-2">
                                        <span className="px-3 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                                            {selectedResource.metadata.category || '미지정'}
                                        </span>
                                        {selectedResource.metadata.subCategory && (
                                            <span className="px-3 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-600">
                                                {selectedResource.metadata.subCategory}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
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
                            
                            {/* Retry Button in Modal */}
                            {isFailedState(selectedResource) && (
                                <button 
                                    onClick={() => handleRetry(selectedResource.id)}
                                    disabled={retryLoadingId === selectedResource.id}
                                    className="px-4 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
                                >
                                    <RotateCcw className={`w-4 h-4 ${retryLoadingId === selectedResource.id ? 'animate-spin' : ''}`} />
                                    {retryLoadingId === selectedResource.id ? '분석 중...' : '다시 분석'}
                                </button>
                            )}

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

            {/* --- Add Resource Modal --- */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-indigo-600" />
                                AI 자료 분석
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-8">
                            {isAnalyzing ? (
                                <div className="flex flex-col items-center py-8 space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Bot className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        {isVideoUrl ? (
                                            <>
                                                <h4 className="font-bold text-gray-900">영상 정밀 분석 중...</h4>
                                                <p className="text-sm text-gray-500 mt-1">Gemini 3.0 Pro가 자막, 챕터, 메타데이터를<br/>구조화된 데이터로 변환하고 있습니다.</p>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="font-bold text-gray-900">문서 분석 중...</h4>
                                                <p className="text-sm text-gray-500 mt-1">Google Search로 최신 정보를 수집하고 요약하고 있습니다.</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">자료 링크 (URL)</label>
                                    <div className="relative mb-6">
                                        <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={inputUrl}
                                            onChange={(e) => setInputUrl(e.target.value)}
                                            placeholder="https://youtube.com/..."
                                            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="bg-blue-50 rounded-xl p-4 mb-6">
                                        <div className="flex gap-3">
                                            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
                                            <div className="text-sm text-blue-800 leading-relaxed">
                                                <strong>Tip:</strong> YouTube 링크를 입력하면, Gemini 3.0 Pro가 영상을 분석하여 챕터별 요약과 검색 키워드를 자동 생성합니다.
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddResource}
                                        disabled={!inputUrl.trim()}
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span>분석 및 추가하기</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
