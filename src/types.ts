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
