
import React, { useState, useRef, useEffect } from 'react';
import { Upload, Film, Zap, Clock, Link, History, Loader, Rabbit } from 'lucide-react';
import { marked } from 'marked';
import { VideoAnalysisResult } from '../../types';
import * as geminiService from '../services/geminiService';
import {
  addAnalysisToHistory,
  onHistoryUpdate,
  AnalysisHistoryItem
} from '../services/firestoreService';
import { Timestamp } from 'firebase/firestore';

const VideoAnalysisView: React.FC = () => {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('url');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  
  const [activeAnalysis, setActiveAnalysis] = useState<AnalysisHistoryItem | null>(null);
  const [quickSummary, setQuickSummary] = useState<string | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("분석 중입니다...");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const unsubscribe = onHistoryUpdate((history) => {
      setAnalysisHistory(history);
      try {
        const lastActiveId = localStorage.getItem('lastActiveAnalysisId');
        if (lastActiveId) {
          const restoredAnalysis = history.find(item => item.id === lastActiveId);
          if (restoredAnalysis) {
            setActiveAnalysis(restoredAnalysis);
          }
        }
      } catch (error) {
        console.error("Error restoring last active analysis:", error);
        localStorage.removeItem('lastActiveAnalysisId');
      }
    });

    return () => unsubscribe();
  }, []);

  const resetState = () => {
      setError(null);
      setActiveAnalysis(null);
      setQuickSummary(null);
      localStorage.removeItem('lastActiveAnalysisId');
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoUrlInput('');
      resetState();
    }
  };

  const handleUrlInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrlInput(event.target.value);
    setVideoFile(null);
    resetState();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSelectHistory = (item: AnalysisHistoryItem) => {
    setActiveAnalysis(item);
    setQuickSummary(null); // Clear quick summary when viewing history
    localStorage.setItem('lastActiveAnalysisId', item.id);
    setError(null);
    setVideoUrlInput('');
    setVideoFile(null);
  };

  const extractFrames = async (
    videoElement: HTMLVideoElement, 
    duration: number
  ): Promise<{ mimeType: string; data: string }[]> => {
    return new Promise((resolve) => {
      const frames: { mimeType: string; data: string }[] = [];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const interval = 5; // seconds
      let currentTime = 0;
      
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      videoElement.addEventListener('seeked', async function onSeeked() {
        if (context) {
          context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/webp');
          frames.push({ mimeType: 'image/webp', data: dataUrl.split(',')[1] });
        }
        
        currentTime += interval;
        if (currentTime <= duration) {
          videoElement.currentTime = currentTime;
        } else {
          videoElement.removeEventListener('seeked', onSeeked);
          resolve(frames);
        }
      });
      videoElement.currentTime = 0;
    });
  };

  const handleQuickSummary = async () => {
      const source = videoUrlInput;
      if (!source) return;

      setIsLoading(true);
      setLoadingMessage("빠르게 요약하는 중...");
      resetState();

      try {
          const summary = await geminiService.getQuickSummaryFromAI(source);
          setQuickSummary(summary);
      } catch (err: any) {
          console.error("Quick summary failed:", err);
          setError(err.message || "빠른 요약 중 오류가 발생했습니다.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setLoadingMessage("상세 분석을 진행 중입니다...");
    resetState();

    const source = inputMode === 'url' ? videoUrlInput : videoFile?.name;
    if (!source) {
      setIsLoading(false);
      return;
    }

    try {
      let analysisData: Omit<AnalysisHistoryItem, 'id'>;

      if (inputMode === 'url') {
        const result = await geminiService.analyzeResourceWithAI(videoUrlInput);
        
        const parseTimeString = (timeStr: string | undefined): number => {
            if (!timeStr || !timeStr.includes(':')) return 0;
            const parts = timeStr.split(':').map(Number).reverse();
            return parts.reduce((acc, val, i) => acc + val * Math.pow(60, i), 0);
        };
        
        analysisData = {
          source: videoUrlInput,
          analyzedAt: Timestamp.now(),
          title: result.basicInfo.title || '제목 없음',
          overallSummary: result.basicInfo.summary,
          scenes: (result.searchOptimization?.chapters || []).map((ch: any) => ({ ...ch, startTime: parseTimeString(ch.startTime), endTime: parseTimeString(ch.endTime) })),
          keywords: result.searchOptimization?.keywords || result.basicInfo?.tags || [],
        };
      } else { // File Upload
        if (!videoFile || !videoRef.current) throw new Error('Video file is not ready.');
        
        const videoElement = videoRef.current;
        await new Promise<void>((resolve, reject) => {
            const onCanPlay = () => { videoElement.removeEventListener('canplay', onCanPlay); resolve(); };
            videoElement.addEventListener('canplay', onCanPlay);
            videoElement.addEventListener('error', (e) => reject(new Error('Failed to load video file.')));
            videoElement.src = URL.createObjectURL(videoFile);
        });

        const duration = videoRef.current.duration;
        const frames = await extractFrames(videoRef.current, duration);
        if (frames.length === 0) throw new Error("프레임 추출에 실패했습니다.");

        const result = await geminiService.analyzeVideoFrames(frames, duration);
        analysisData = {
            ...result,
            source: videoFile.name,
            title: videoFile.name,
            analyzedAt: Timestamp.now(),
        };
      }
      
      const docRef = await addAnalysisToHistory(analysisData);
      localStorage.setItem('lastActiveAnalysisId', docRef.id);

    } catch (err: any) {
      console.error("Analysis failed:", err);
      setError(err.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatTimestamp = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '날짜 정보 없음';
    return timestamp.toDate().toLocaleString();
  }

  const renderLoader = () => (
      <div className="w-full max-w-md mx-auto my-4 text-center p-6 bg-white border rounded-lg shadow-md">
          <div className="flex justify-center items-center">
              <Loader className="animate-spin text-blue-600 h-8 w-8 mr-3" />
              <p className="text-lg font-semibold text-gray-800">{loadingMessage}</p>
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline crossOrigin="anonymous" />
      
      <aside className="w-1/3 max-w-sm flex-shrink-0 bg-white border-r overflow-y-auto">
        <div className="p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold flex items-center gap-2"><History className="text-gray-600"/> 분석 기록</h2>
        </div>
        <div className="p-2 space-y-2">
          {analysisHistory.length > 0 ? (
            analysisHistory.map(item => (
              <button key={item.id} onClick={() => handleSelectHistory(item)} className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${activeAnalysis?.id === item.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}>
                <p className="font-semibold truncate">{item.title}</p>
                <p className="text-xs text-gray-500 truncate">{item.source}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTimestamp(item.analyzedAt)}</p>
              </button>
            ))
          ) : (
            <div className="text-center text-gray-500 p-6">
              <p>{isLoading ? "기록을 불러오는 중..." : "분석 기록이 없습니다."}</p>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-gray-800">영상 인사이트 추출</h1>
                <p className="text-gray-600 mt-2">AI가 동영상의 주요 내용을 분석하여, 핵심 인사이트를 자동으로 요약하고 정리해줍니다.</p>
            </div>
            
            {!isLoading && (
              <>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-md rounded-2xl">
                    <div className="p-6 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Film className="text-blue-500" /> 1. 영상 소스 선택</h3>
                    </div>

                    <div className="flex border-b border-gray-200">
                        <button onClick={() => setInputMode('upload')} className={`flex-1 p-3 font-medium text-sm transition-colors ${inputMode === 'upload' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Upload className="inline-block mr-2 h-4 w-4" /> 파일 업로드</button>
                        <button onClick={() => setInputMode('url')} className={`flex-1 p-3 font-medium text-sm transition-colors ${inputMode === 'url' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Link className="inline-block mr-2 h-4 w-4" /> URL 링크</button>
                    </div>

                    {inputMode === 'upload' ? (
                        <div className="flex flex-col items-center justify-center gap-4 p-6 bg-gray-50/50 rounded-b-2xl">
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" style={{ display: 'none' }} />
                            <button onClick={handleUploadClick} className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"><Upload className="mr-2 h-4 w-4" /> 동영상 파일 선택</button>
                            {videoFile && <p className="text-sm text-gray-600 mt-2">선택된 파일: <strong>{videoFile.name}</strong></p>}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 p-6 bg-gray-50/50 rounded-b-2xl">
                            <p className='text-sm text-gray-600 mb-2'>분석할 동영상 URL을 입력하세요. (YouTube, Vimeo 등)</p>
                            <input type="text" value={videoUrlInput} onChange={handleUrlInputChange} placeholder="https://www.youtube.com/watch?v=..." className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    )}
                </div>

                <div className="flex justify-center items-center gap-4">
                   {inputMode === 'url' && <button onClick={handleQuickSummary} disabled={isLoading || !videoUrlInput} className="inline-flex items-center justify-center rounded-full bg-green-600 text-white px-8 py-3 text-base font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Rabbit className="mr-2 h-4 w-4" /> 빠른 요약
                  </button>}
                  <button onClick={handleAnalyze} disabled={isLoading || ((inputMode === 'upload' && !videoFile) || (inputMode === 'url' && !videoUrlInput))} className="inline-flex items-center justify-center rounded-full bg-black text-white px-8 py-3 text-base font-bold shadow-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                      <Zap className="mr-2 h-4 w-4" /> 상세 분석
                  </button>
                </div>
              </>
            )}
            
            {isLoading && renderLoader()}

            {error && <div className="mt-4 border-l-4 border-red-500 bg-red-50 p-4">
              <p className="font-bold">오류 발생</p>
              <p className="text-sm">{error}</p>
              </div>}

            {quickSummary && !isLoading && (
                 <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl overflow-hidden mt-6">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800">빠른 요약 결과</h2>
                    </div>
                    <div className="p-6 prose" dangerouslySetInnerHTML={{ __html: marked(quickSummary) as string }}></div>
                </div>
            )}

            {activeAnalysis && !isLoading && (
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg rounded-2xl overflow-hidden mt-6">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">{activeAnalysis.title}</h2>
                    <p className="text-sm text-gray-500 truncate mt-1">{activeAnalysis.source}</p>
                  </div>
                  <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                      <h3 className="font-semibold text-lg">종합 요약</h3>
                      <p className="text-gray-700 mt-2 p-4 bg-gray-50 rounded-md">{activeAnalysis.overallSummary}</p>
                    </div>

                    {activeAnalysis.scenes?.length > 0 && <div>
                      <h3 className="font-semibold text-lg">주요 장면</h3>
                      <div className="space-y-4 mt-2">
                        {activeAnalysis.scenes.map((scene, index) => (
                          <div key={index} className="p-4 border rounded-md bg-white shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="font-semibold text-blue-700">{scene.title}</p>
                                <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                                    <Clock className="w-3 h-3 mr-1.5" />
                                    {new Date(scene.startTime * 1000).toISOString().substr(14, 5)} - {new Date(scene.endTime * 1000).toISOString().substr(14, 5)}
                                </span>
                            </div>
                            <p className="text-gray-600 mt-1.5">{scene.summary}</p>
                          </div>
                        ))}
                      </div>
                    </div>}

                    {activeAnalysis.keywords?.length > 0 && <div>
                        <h3 className="font-semibold text-lg">핵심 키워드</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {activeAnalysis.keywords.map((keyword, index) => (
                                <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">#{keyword}</span>
                            ))}
                        </div>
                    </div>}
                  </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default VideoAnalysisView;
