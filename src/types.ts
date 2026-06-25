export interface KanbanTask {
    id: string;
    projectId: string;
    title: string;
    tag: string;
    status: 'backlog' | 'progress' | 'review' | 'done';
    created: number;
    updated: number;
    isArchived?: boolean;
    isBinned?: boolean;
    complexity?: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    description?: string;
    dueDate?: string;
    checklist?: string;
    priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
    points?: number;
    cycleId?: string;
    moduleId?: string;
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed';
    lastActive: number;
    isArchived?: boolean;
    isBinned?: boolean;
    isStarred?: boolean;
    budgetLimit?: number;
    spent?: number;
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
    cmsStatus?: 'draft' | 'review' | 'approved' | 'published';
    seoKeywords?: string;
    collaborators?: string;
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

export interface Contact {
    id: string;
    projectId: string;
    name: string;
    email: string;
    company: string;
    dealStage: 'lead' | 'connected' | 'discussion' | 'active';
    dealValue: number;
    created: number;
    updated?: number;
    isArchived?: boolean;
    isBinned?: boolean;
    statusTag?: 'cold' | 'warm' | 'hot' | 'new';
    history?: { action: string; timestamp: number }[];
}

export interface TeamMember {
    id: string;
    name: string;
    role: string;
    status: 'active' | 'meeting' | 'offline' | 'vacation';
    avatarColor: string;
}

export interface Cycle {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'upcoming';
}

export interface Module {
    id: string;
    projectId: string;
    name: string;
    description: string;
    status: 'backlog' | 'in-progress' | 'done';
}

export interface DbField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
}

export interface DbRow {
    id: string;
    cells: Record<string, any>;
}

export interface DbTable {
    id: string;
    projectId: string;
    name: string;
    description: string;
    fields: DbField[];
    rows: DbRow[];
}

export interface Goal {
    id: string;
    projectId: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    dueDate: string;
    status: 'on-track' | 'behind' | 'achieved';
}

export interface Team {
    id: string;
    name: string;
    memberIds: string[];
    projectIds: string[];
    isArchived?: boolean;
}

export interface ActivityLog {
    id: string;
    projectId?: string;
    teamId?: string;
    action: string;
    details: string;
    timestamp: number;
    kpiMetric?: 'task_completed' | 'deal_won' | 'budget_spent' | 'team_created' | 'post_published';
}


