export interface KanbanTask {
    id: string;
    projectId: string;
    title: string;
    tag: string;
    status: 'backlog' | 'progress' | 'review' | 'done';
    created: number;
    updated: number;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed';
    lastActive: number;
}

export interface Idea {
    id: string;
    projectId: string;
    content: string;
    color: string;
}

export interface TaskLog {
    id: string;
    projectId: string;
    taskId: string;
    taskTitle: string;
    fromStatus: string;
    toStatus: string;
    timestamp: number;
}

export interface ResearchDoc {
    id: string;
    projectId: string;
    title: string;
    content: string;
    type: 'pdf' | 'url' | 'text';
    created: number;
}

export interface MediaAsset {
    id: string;
    projectId: string;
    title: string;
    url: string;
    category: 'banner' | 'social' | 'ad';
    created: number;
}

export interface Draft {
    id: string;
    projectId: string;
    title: string;
    content: string;
    format: 'blog' | 'tweet' | 'email';
    created: number;
    updated: number;
}

export interface Connection {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    apiKey?: string;
    username?: string;
}

export interface PublishSchedule {
    id: string;
    projectId: string;
    draftId: string;
    title: string;
    format: string;
    channels: string[];
    scheduledTime: number;
    status: 'queued' | 'published';
}
