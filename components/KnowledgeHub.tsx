
import React, { useState, useEffect, useRef } from 'react';
import { KnowledgeResource, ResourceType } from '../types';
import * as knowledgeService from '../src/services/knowledgeService';
import { 
    BookOpen, LinkIcon, Youtube, Video, Tag, Clock, 
    Plus, Search, X, Loader2, AlertCircle, Sparkles, Wand2
} from './Icons';
import { analyzeResourceWithAI } from '../src/services/geminiService';
import { PromptTemplates } from '../src/services/prompts';


const KnowledgeHub: React.FC = () => {
    const [resources, setResources] = useState<KnowledgeResource[]>([]);
    const [filteredResources, setFilteredResources] = useState<KnowledgeResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [urlToAdd, setUrlToAdd] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addUrlRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                setIsLoading(true);
                const fetchedResources = await knowledgeService.getKnowledgeResources();
                setResources(fetchedResources);
                setFilteredResources(fetchedResources);
            } catch (err) {
                setError("Failed to load knowledge resources.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        if (isAdding) {
            addUrlRef.current?.focus();
        }
    }, [isAdding]);
    
    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = resources.filter(item =>
            item.title.toLowerCase().includes(lowercasedFilter) ||
            item.summary.toLowerCase().includes(lowercasedFilter) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(lowercasedFilter)))
        );
        setFilteredResources(filtered);
    }, [searchTerm, resources]);


    const handleAddResource = async () => {
        if (!urlToAdd.trim()) return;
        
        setIsSubmitting(true);
        setError(null);

        try {
            const aiData = await analyzeResourceWithAI(urlToAdd);

            if (aiData.error) {
                throw new Error(`AI Analysis Failed: ${aiData.reason}`);
            }

            const newResource: KnowledgeResource = {
                id: `kr_${Date.now()}`,
                title: aiData.basicInfo?.title || "Untitled Resource",
                summary: aiData.basicInfo?.summary || "No summary available.",
                contentType: aiData.basicInfo?.contentType || 'article',
                sourceUrl: urlToAdd,
                status: 'processed',
                createdAt: new Date().toISOString(),
                tags: aiData.basicInfo?.tags || [],
            };
            
            setResources(prev => [newResource, ...prev]);
            setUrlToAdd('');
            setIsAdding(false);
        } catch (err: any) {
            setError(err.message || "Failed to add and analyze the resource.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIcon = (type: ResourceType | undefined) => {
        switch (type) {
            case 'article': return <BookOpen />;
            case 'video': return <Youtube />;
            default: return <LinkIcon />;
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-blue-500"/></div>
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col bg-gray-50">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Knowledge Hub</h1>
                <p className="text-gray-500 mt-1">A centralized repository for team knowledge and learning materials.</p>
            </header>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search resources..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <button 
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {isAdding ? <X/> : <Plus/>}
                    {isAdding ? 'Cancel' : 'Add Resource'}
                </button>
            </div>

            {isAdding && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-lg text-blue-800 mb-2 flex items-center gap-2"><Wand2/> Add New Resource via AI</h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input 
                            ref={addUrlRef}
                            type="url"
                            value={urlToAdd}
                            onChange={(e) => setUrlToAdd(e.target.value)}
                            placeholder="Enter URL (e.g., article, video)..."
                            className="flex-grow border-gray-300 rounded-lg"
                        />
                        <button 
                            onClick={handleAddResource}
                            disabled={isSubmitting}
                            className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            Analyze & Add
                        </button>
                    </div>
                    {error && <p className="text-red-500 text-sm mt-2"><AlertCircle className="inline-block mr-1" />{error}</p>}
                </div>
            )}
            
            <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map(resource => (
                        <div key={resource.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg transition-shadow flex flex-col">
                           <div className="p-5 flex-grow">
                                <div className="flex items-center gap-3 text-gray-500 text-sm mb-2">
                                    <span className="flex items-center gap-1.5">{getIcon(resource.contentType)} {resource.contentType}</span>
                                    <span className="flex items-center gap-1.5"><Clock size={14}/> {new Date(resource.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{resource.title}</h2>
                                <p className="text-gray-600 text-sm line-clamp-3 flex-grow">{resource.summary}</p>
                           </div>
                           <div className="p-5 border-t bg-gray-50/50">
                                <div className="flex flex-wrap gap-2">
                                    {resource.tags?.slice(0, 4).map(tag => (
                                        <span key={tag} className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">#{tag}</span>
                                    ))}
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KnowledgeHub;
