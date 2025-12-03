
import { KnowledgeResource } from "../types";
import { analyzeResourceWithAI } from "./geminiService";

const INITIAL_RESOURCES: KnowledgeResource[] = [
    {
        id: 'r1',
        basicInfo: {
            title: 'React 19 새로운 기능 가이드',
            summary: 'React Compiler와 새로운 Hook들이 가져올 성능 최적화 및 개발 경험 개선 사항을 다룹니다.',
            level: 'ADVANCED',
            tags: ['React', 'Frontend', 'Performance'],
            contentType: 'article',
            author: '김지민'
        },
        metadata: {
            category: '개발',
            subCategory: 'Frontend',
            uploadedAt: '2025-11-21T10:00:00Z',
            department: '개발팀'
        },
        searchOptimization: {
            keywords: ['React 19', 'Actions', 'Server Components', 'useOptimistic'],
            chapters: []
        },
        managementInfo: {
            status: 'active',
            visibility: 'public',
            originalFileUrl: 'https://react.dev/blog/2024/02/15/react-labs-what-we-have-been-working-on-february-2024',
            lastUpdated: new Date().toISOString()
        }
    },
    {
        id: 'r2',
        basicInfo: {
            title: '효율적인 회의 진행을 위한 5가지 팁',
            summary: '불필요한 회의를 줄이고, 짧은 시간 안에 명확한 결론을 도출하는 퍼실리테이션 기법을 소개합니다.',
            level: 'BEGINNER',
            tags: ['Soft Skill', 'Management', 'Productivity'],
            contentType: 'video',
            author: '박민수'
        },
        metadata: {
            duration: 720,
            category: '업무 스킬',
            subCategory: '커뮤니케이션',
            uploadedAt: '2025-11-20T14:30:00Z',
            department: 'HR'
        },
        searchOptimization: {
            keywords: ['Meeting', 'Productivity', 'Facilitation'],
            chapters: [
                { title: '회의 준비', timestamp: '00:00-02:30', summary: '아젠다 설정의 중요성' },
                { title: '진행 스킬', timestamp: '02:31-08:00', summary: 'Time Boxing 기법' }
            ]
        },
        managementInfo: {
            status: 'active',
            visibility: 'team',
            originalFileUrl: 'https://youtube.com/...',
            lastUpdated: new Date().toISOString()
        }
    }
];

// Generate dummy data for pagination demo
const generateDummyData = () => {
    const dummies: KnowledgeResource[] = [];
    const topics = ['Next.js 14', 'TypeScript 5.0', 'Kubernetes', 'Figma AutoLayout', 'Tailwind CSS', 'Docker', 'AWS Lambda', 'Flutter', 'SwiftUI', 'Rust Basic', 'Go Routine', 'GraphQL', 'Redis Caching', 'Kafka', 'ElasticSearch', 'Vue 3', 'SvelteKit', 'Angular 17', 'Spring Boot', 'Django Ninja'];
    
    topics.forEach((topic, i) => {
        dummies.push({
            id: `dummy-${i}`,
            basicInfo: {
                title: `${topic} 핵심 요약 및 실무 적용 가이드`,
                summary: `${topic}의 주요 개념을 빠르게 훑어보고 실제 프로젝트에 적용하는 방법을 다루는 학습 자료입니다.`,
                level: i % 3 === 0 ? 'BEGINNER' : i % 3 === 1 ? 'INTERMEDIATE' : 'ADVANCED',
                tags: [topic.split(' ')[0], 'Dev', 'Study'],
                contentType: i % 2 === 0 ? 'video' : 'article',
                author: `User ${i+1}`
            },
            metadata: {
                duration: i % 2 === 0 ? 300 + (i * 60) : undefined,
                category: '개발',
                subCategory: i % 2 === 0 ? 'Frontend' : 'Backend',
                uploadedAt: new Date(Date.now() - 86400000 * (i + 10)).toISOString(),
                department: 'Tech Team'
            },
            searchOptimization: {
                keywords: [topic, 'Coding', 'Best Practice'],
                chapters: i % 2 === 0 ? [
                    { title: 'Introduction', timestamp: '00:00-02:00', summary: 'Introduction to the topic' },
                    { title: 'Deep Dive', timestamp: '02:00-10:00', summary: 'Core concepts explained' }
                ] : []
            },
            managementInfo: {
                status: 'active',
                visibility: 'team',
                originalFileUrl: 'https://example.com',
                lastUpdated: new Date().toISOString()
            }
        });
    });
    return dummies;
};

let memoryResources: KnowledgeResource[] = [...INITIAL_RESOURCES, ...generateDummyData()];

export const knowledgeService = {
    getAllResources: async (): Promise<KnowledgeResource[]> => {
        return new Promise(resolve => setTimeout(() => resolve([...memoryResources]), 300));
    },

    addResourceFromUrl: async (url: string): Promise<KnowledgeResource> => {
        // 1. AI Analysis using Google Search Grounding & JSON Parsing
        const analysis = await analyzeResourceWithAI(url);
        
        // 2. Create Record (merging AI result with ID)
        const newResource: KnowledgeResource = {
            id: `r${Date.now()}`,
            ...analysis,
            managementInfo: {
                ...analysis.managementInfo,
                originalFileUrl: url // Ensure URL is set
            }
        };

        memoryResources = [newResource, ...memoryResources];
        return newResource;
    },

    addResourceFromFile: async (file: File): Promise<KnowledgeResource> => {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate mock analysis based on file metadata
        const isVideo = file.type.startsWith('video');
        const title = file.name.split('.')[0];
        
        const newResource: KnowledgeResource = {
            id: `r${Date.now()}`,
            basicInfo: {
                title: title,
                summary: `업로드된 파일(${file.name})에 대한 AI 자동 분석 결과입니다. 파일의 주요 내용을 요약하고 핵심 정보를 추출했습니다.`,
                level: 'INTERMEDIATE',
                tags: ['File', isVideo ? 'Video' : 'Document', 'Upload'],
                contentType: isVideo ? 'video' : 'document',
                author: 'User Upload'
            },
            metadata: {
                duration: isVideo ? 300 : undefined, // Dummy duration
                category: '기타',
                subCategory: '자료실',
                uploadedAt: new Date().toISOString(),
                department: '개인'
            },
            searchOptimization: {
                keywords: [title, 'Upload', 'Analysis'],
                chapters: []
            },
            managementInfo: {
                status: 'active',
                visibility: 'private',
                originalFileUrl: URL.createObjectURL(file), // Local preview URL
                fileSize: file.size,
                lastUpdated: new Date().toISOString()
            }
        };

        memoryResources = [newResource, ...memoryResources];
        return newResource;
    },

    retryResource: async (id: string): Promise<KnowledgeResource> => {
        const existing = memoryResources.find(r => r.id === id);
        if (!existing) throw new Error("Resource not found");

        // Re-analyze using the original URL
        const analysis = await analyzeResourceWithAI(existing.managementInfo.originalFileUrl || '');
        
        const updatedResource: KnowledgeResource = {
            id: existing.id,
            ...analysis,
            managementInfo: {
                ...analysis.managementInfo,
                originalFileUrl: existing.managementInfo.originalFileUrl,
                lastUpdated: new Date().toISOString()
            }
        };

        // Update memory
        memoryResources = memoryResources.map(r => r.id === id ? updatedResource : r);
        return updatedResource;
    },

    deleteResource: async (id: string): Promise<void> => {
        memoryResources = memoryResources.filter(r => r.id !== id);
    }
};
