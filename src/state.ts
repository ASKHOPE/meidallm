import { z } from "zod";
import type { KanbanTask, Project, Idea, TaskLog, ResearchDoc, MediaAsset, Draft } from "./types";

// --- Zod Validation Schemas ---
export const KanbanTaskSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    tag: z.string(),
    status: z.enum(['backlog', 'progress', 'review', 'done']),
    created: z.number(),
    updated: z.number()
});

export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'completed']),
    lastActive: z.number()
});

export const IdeaSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    content: z.string(),
    color: z.string()
});

export const TaskLogSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    taskId: z.string(),
    taskTitle: z.string(),
    fromStatus: z.string(),
    toStatus: z.string(),
    timestamp: z.number()
});

export const ResearchDocSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    content: z.string(),
    type: z.enum(['pdf', 'url', 'text']),
    created: z.number()
});

export const MediaAssetSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    url: z.string(),
    category: z.enum(['banner', 'social', 'ad']),
    created: z.number()
});

export const DraftSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    content: z.string(),
    format: z.enum(['blog', 'tweet', 'email']),
    created: z.number(),
    updated: z.number()
});

// --- Default Initial State Fallbacks ---
const DEFAULT_KANBAN: KanbanTask[] = [
    { id: 't1', projectId: 'p1', title: 'Setup Campaign Domain', tag: 'DevOps', status: 'backlog', created: Date.now() - 86400000*5, updated: Date.now() - 86400000*5 },
    { id: 't2', projectId: 'p1', title: 'Draft Product Messaging Docs', tag: 'Docs', status: 'progress', created: Date.now() - 172800000, updated: Date.now() - 43200000 }
];

const DEFAULT_PROJECTS: Project[] = [
    { id: 'p1', name: 'Q3 Marketing Launch', description: 'Major product update campaign.', status: 'active', lastActive: Date.now() },
    { id: 'p2', name: 'Agentic Workflow Video', description: 'YouTube tutorial series.', status: 'active', lastActive: Date.now() - 86400000*2 }
];

const DEFAULT_IDEAS: Idea[] = [
    { id: 'i1', projectId: 'p1', content: 'Leverage LinkedIn video tutorials', color: '#fef08a' },
    { id: 'i2', projectId: 'p1', content: 'Draft newsletter for existing users', color: '#bfdbfe' }
];

const DEFAULT_RESEARCH: ResearchDoc[] = [
    {
        id: 'r1',
        projectId: 'p1',
        title: 'Competitor Analysis - LLM Benchmarks.pdf',
        content: 'Our tests show competitor agents have 85% accuracy. Meidallm currently achieves 92% accuracy on core tool-use execution. Focus positioning around reliability, fast tool loops, and premium UX.',
        type: 'pdf',
        created: Date.now() - 86400000*3
    },
    {
        id: 'r2',
        projectId: 'p1',
        title: 'https://better-auth.com/docs/plugins/infra',
        content: 'The dash() plugin links better-auth to active database tracking. Enables real-time telemetry, admin console views, and security logging. Essential for enterprise audit trails.',
        type: 'url',
        created: Date.now() - 86400000*2
    }
];

const DEFAULT_MEDIA: MediaAsset[] = [
    {
        id: 'm1',
        projectId: 'p1',
        title: 'Launch Banner Gradient',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        category: 'banner',
        created: Date.now() - 86400000
    },
    {
        id: 'm2',
        projectId: 'p1',
        title: 'Product Mockup Social',
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
        category: 'social',
        created: Date.now() - 86400000
    }
];

const DEFAULT_DRAFTS: Draft[] = [
    {
        id: 'd1',
        projectId: 'p1',
        title: 'Launch Announcement Tweet',
        content: '🚀 Today, we are releasing the Meidallm Portal! \n\nA complete control center to monitor agent runs, configure RAG models, edit media templates, and draft copy in real-time. \n\nGet started now at meidallm.com!',
        format: 'tweet',
        created: Date.now() - 86400000,
        updated: Date.now()
    },
    {
        id: 'd2',
        projectId: 'p1',
        title: 'Beta Welcome Email',
        content: 'Subject: Welcome to the Meidallm Console!\n\nHi {{name}},\n\nThank you for signing up for the Meidallm Portal beta! You now have full access to our project pipeline manager, live brainstorming boards, and AI composer. \n\nIf you have any feedback or run into questions, simply reply to this email!\n\nBest,\nThe Meidallm Team',
        format: 'email',
        created: Date.now() - 86400000,
        updated: Date.now()
    }
];

export const state = {
    currentUser: null as string | null,
    currentProject: null as string | null,
    activeViewKey: 'projects',
    draggedTaskId: null as string | null,
    
    kanbanState: [] as KanbanTask[],
    projects: [] as Project[],
    ideasState: [] as Idea[],
    taskLogs: [] as TaskLog[],
    researchDocs: [] as ResearchDoc[],
    mediaAssets: [] as MediaAsset[],
    drafts: [] as Draft[]
};

// UI Re-render Callback Registration
let stateChangeListener: (() => void) | null = null;

export function registerStateListener(listener: () => void) {
    stateChangeListener = listener;
}

export function notifyStateChange() {
    saveState();
    if (stateChangeListener) {
        stateChangeListener();
    }
}

// Persistence & Zod Verification Helpers
export function loadState() {
    try {
        state.currentUser = localStorage.getItem('meidallm_user');
        
        const storedKanban = localStorage.getItem('meidallm_kanban');
        if (storedKanban) {
            const parsed = JSON.parse(storedKanban);
            const val = z.array(KanbanTaskSchema).safeParse(parsed);
            state.kanbanState = val.success ? val.data : DEFAULT_KANBAN;
        } else {
            state.kanbanState = DEFAULT_KANBAN;
        }
        
        const storedProjects = localStorage.getItem('meidallm_projects');
        if (storedProjects) {
            const parsed = JSON.parse(storedProjects);
            const val = z.array(ProjectSchema).safeParse(parsed);
            state.projects = val.success ? val.data : DEFAULT_PROJECTS;
        } else {
            state.projects = DEFAULT_PROJECTS;
        }

        const storedIdeas = localStorage.getItem('meidallm_ideas');
        if (storedIdeas) {
            const parsed = JSON.parse(storedIdeas);
            const val = z.array(IdeaSchema).safeParse(parsed);
            state.ideasState = val.success ? val.data : DEFAULT_IDEAS;
        } else {
            state.ideasState = DEFAULT_IDEAS;
        }

        const storedLogs = localStorage.getItem('meidallm_logs');
        if (storedLogs) {
            const parsed = JSON.parse(storedLogs);
            const val = z.array(TaskLogSchema).safeParse(parsed);
            state.taskLogs = val.success ? val.data : [];
        } else {
            state.taskLogs = [];
        }

        const storedResearch = localStorage.getItem('meidallm_research');
        if (storedResearch) {
            const parsed = JSON.parse(storedResearch);
            const val = z.array(ResearchDocSchema).safeParse(parsed);
            state.researchDocs = val.success ? val.data : DEFAULT_RESEARCH;
        } else {
            state.researchDocs = DEFAULT_RESEARCH;
        }

        const storedMedia = localStorage.getItem('meidallm_media');
        if (storedMedia) {
            const parsed = JSON.parse(storedMedia);
            const val = z.array(MediaAssetSchema).safeParse(parsed);
            state.mediaAssets = val.success ? val.data : DEFAULT_MEDIA;
        } else {
            state.mediaAssets = DEFAULT_MEDIA;
        }

        const storedDrafts = localStorage.getItem('meidallm_drafts');
        if (storedDrafts) {
            const parsed = JSON.parse(storedDrafts);
            const val = z.array(DraftSchema).safeParse(parsed);
            state.drafts = val.success ? val.data : DEFAULT_DRAFTS;
        } else {
            state.drafts = DEFAULT_DRAFTS;
        }
    } catch (e) {
        console.error("Failed to load local storage state:", e);
        // Clean slate recovery
        state.kanbanState = DEFAULT_KANBAN;
        state.projects = DEFAULT_PROJECTS;
        state.ideasState = DEFAULT_IDEAS;
        state.taskLogs = [];
        state.researchDocs = DEFAULT_RESEARCH;
        state.mediaAssets = DEFAULT_MEDIA;
        state.drafts = DEFAULT_DRAFTS;
    }
}

export function saveState() {
    try {
        if (state.currentUser) {
            localStorage.setItem('meidallm_user', state.currentUser);
        } else {
            localStorage.removeItem('meidallm_user');
        }
        localStorage.setItem('meidallm_kanban', JSON.stringify(state.kanbanState));
        localStorage.setItem('meidallm_projects', JSON.stringify(state.projects));
        localStorage.setItem('meidallm_ideas', JSON.stringify(state.ideasState));
        localStorage.setItem('meidallm_logs', JSON.stringify(state.taskLogs));
        localStorage.setItem('meidallm_research', JSON.stringify(state.researchDocs));
        localStorage.setItem('meidallm_media', JSON.stringify(state.mediaAssets));
        localStorage.setItem('meidallm_drafts', JSON.stringify(state.drafts));
    } catch (e) {
        console.error("Failed to save state to local storage:", e);
    }
}

// State Mutators
export function addProject(name: string, description: string) {
    const newProj: Project = {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        description: description.trim(),
        status: 'active',
        lastActive: Date.now()
    };
    state.projects.push(newProj);
    notifyStateChange();
    return newProj.id;
}

export function deleteProject(pid: string) {
    state.projects = state.projects.filter(p => p.id !== pid);
    state.kanbanState = state.kanbanState.filter(k => k.projectId !== pid);
    state.ideasState = state.ideasState.filter(i => i.projectId !== pid);
    state.taskLogs = state.taskLogs.filter(l => l.projectId !== pid);
    state.researchDocs = state.researchDocs.filter(r => r.projectId !== pid);
    state.mediaAssets = state.mediaAssets.filter(m => m.projectId !== pid);
    state.drafts = state.drafts.filter(d => d.projectId !== pid);
    if (state.currentProject === pid) {
        state.currentProject = null;
    }
    notifyStateChange();
}

export function addTask(pid: string, title: string, tag: string) {
    const newTask: KanbanTask = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        tag: tag.trim() || 'General',
        status: 'backlog',
        created: Date.now(),
        updated: Date.now()
    };
    state.kanbanState.push(newTask);
    
    const p = state.projects.find(proj => proj.id === pid);
    if (p) p.lastActive = Date.now();

    notifyStateChange();
}

export function deleteTask(taskId: string) {
    const task = state.kanbanState.find(t => t.id === taskId);
    if (task) {
        state.kanbanState = state.kanbanState.filter(t => t.id !== taskId);
        state.taskLogs = state.taskLogs.filter(l => l.taskId !== taskId);
        notifyStateChange();
    }
}

export function moveTask(taskId: string, targetStatus: KanbanTask['status']) {
    const task = state.kanbanState.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
        const oldStatus = task.status;
        task.status = targetStatus;
        task.updated = Date.now();
        
        const logEntry: TaskLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            projectId: task.projectId,
            taskId: task.id,
            taskTitle: task.title,
            fromStatus: oldStatus,
            toStatus: targetStatus,
            timestamp: Date.now()
        };
        state.taskLogs.push(logEntry);
        
        const p = state.projects.find(proj => proj.id === task.projectId);
        if (p) p.lastActive = Date.now();

        notifyStateChange();
    }
}

export function addStickyNote(pid: string) {
    const newIdea: Idea = {
        id: 'i-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        content: '',
        color: '#fef08a'
    };
    state.ideasState.push(newIdea);
    notifyStateChange();
}

export function updateStickyNote(ideaId: string, content: string) {
    const idea = state.ideasState.find(i => i.id === ideaId);
    if (idea) {
        idea.content = content;
        notifyStateChange();
    }
}

export function deleteStickyNote(ideaId: string) {
    state.ideasState = state.ideasState.filter(i => i.id !== ideaId);
    notifyStateChange();
}

export function convertIdeaToTask(ideaId: string) {
    const ideaIndex = state.ideasState.findIndex(i => i.id === ideaId);
    if (ideaIndex > -1) {
        const idea = state.ideasState[ideaIndex];
        if (idea && idea.content.trim()) {
            const newTask: KanbanTask = {
                id: 't-' + Math.random().toString(36).substr(2, 9),
                projectId: idea.projectId,
                title: idea.content,
                tag: 'Brainstorm',
                status: 'backlog',
                created: Date.now(),
                updated: Date.now()
            };
            state.kanbanState.push(newTask);
            state.ideasState.splice(ideaIndex, 1);
            notifyStateChange();
            return true;
        }
    }
    return false;
}

// Research Mutators
export function addResearchDoc(pid: string, title: string, content: string, type: ResearchDoc['type']) {
    const newDoc: ResearchDoc = {
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        content: content.trim(),
        type,
        created: Date.now()
    };
    state.researchDocs.push(newDoc);
    notifyStateChange();
}

export function deleteResearchDoc(id: string) {
    state.researchDocs = state.researchDocs.filter(d => d.id !== id);
    notifyStateChange();
}

// Media Mutators
export function addMediaAsset(pid: string, title: string, url: string, category: MediaAsset['category']) {
    const newAsset: MediaAsset = {
        id: 'm-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        url: url.trim(),
        category,
        created: Date.now()
    };
    state.mediaAssets.push(newAsset);
    notifyStateChange();
}

export function deleteMediaAsset(id: string) {
    state.mediaAssets = state.mediaAssets.filter(a => a.id !== id);
    notifyStateChange();
}

// Drafts Mutators
export function addDraft(pid: string, title: string, content: string, format: Draft['format']) {
    const newDraft: Draft = {
        id: 'd-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        content,
        format,
        created: Date.now(),
        updated: Date.now()
    };
    state.drafts.push(newDraft);
    notifyStateChange();
    return newDraft.id;
}

export function updateDraft(id: string, title: string, content: string) {
    const draft = state.drafts.find(d => d.id === id);
    if (draft) {
        draft.title = title.trim();
        draft.content = content;
        draft.updated = Date.now();
        notifyStateChange();
    }
}

export function deleteDraft(id: string) {
    state.drafts = state.drafts.filter(d => d.id !== id);
    notifyStateChange();
}

export function resetAppState() {
    localStorage.clear();
    location.reload();
}
