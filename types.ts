
export enum TaskStatus {
  REQUESTED = 'REQUESTED',
  CHECKED = 'CHECKED',
  WIP = 'WIP',
  SENT = 'SENT',
  FEEDBACK = 'FEEDBACK',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export type ViewMode = 'BOARD' | 'GEMINI' | 'KNOWLEDGE';

export interface User {
  id: string;
  name: string;
  role: 'REQUESTER' | 'ASSIGNEE';
  avatar?: string;
  email?: string; 
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface AIAnalysis {
  strategy: string;
  suggestedResources: { title: string; url: string }[];
  lastUpdated: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  product: string;
  type: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string; // ISO string
  assigneeId: string;
  requesterId: string;
  subtasks: Subtask[];
  aiAnalysis?: AIAnalysis;
  createdAt?: number; // Added for DB sorting
  updatedAt?: number; // Added for DB syncing
  styleTag?: string; // Added for AI Draft UI context
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export type ResourceType = 'video' | 'article' | 'document' | 'other';

// New Nested Structures for KnowledgeHub
export interface BasicInfo {
  title: string;
  summary: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tags: string[];
  author?: string | null;
  contentType: ResourceType;
}

export interface MetaData {
  duration?: number; // seconds
  language?: string;
  category?: string;
  subCategory?: string;
  uploadedAt?: string;
  department?: string | null;
}

export interface Chapter {
  title: string;
  timestamp: string;
  summary: string;
}

export interface SearchOptimization {
  keywords: string[];
  searchableText?: string;
  chapters: Chapter[];
}

export interface ManagementInfo {
  status: 'active' | 'draft' | 'archived';
  visibility: 'public' | 'team' | 'private';
  originalFileUrl?: string | null;
  thumbnailUrl?: string | null;
  fileSize?: number | null;
  lastUpdated: string;
}

export interface KnowledgeResource {
  id: string;
  basicInfo: BasicInfo;
  metadata: MetaData;
  searchOptimization: SearchOptimization;
  managementInfo: ManagementInfo;
}
