import type { KanbanTask, Project, Idea, TaskLog } from "./types";

// Default Initial State Fallbacks
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

export const state = {
    currentUser: null as string | null,
    currentProject: null as string | null,
    activeViewKey: 'projects',
    draggedTaskId: null as string | null,
    
    kanbanState: [] as KanbanTask[],
    projects: [] as Project[],
    ideasState: [] as Idea[],
    taskLogs: [] as TaskLog[],
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

// Persistence Helpers
export function loadState() {
    try {
        state.currentUser = localStorage.getItem('meidallm_user');
        
        const storedKanban = localStorage.getItem('meidallm_kanban');
        state.kanbanState = storedKanban ? JSON.parse(storedKanban) : DEFAULT_KANBAN;
        
        const storedProjects = localStorage.getItem('meidallm_projects');
        state.projects = storedProjects ? JSON.parse(storedProjects) : DEFAULT_PROJECTS;

        const storedIdeas = localStorage.getItem('meidallm_ideas');
        state.ideasState = storedIdeas ? JSON.parse(storedIdeas) : DEFAULT_IDEAS;

        const storedLogs = localStorage.getItem('meidallm_logs');
        state.taskLogs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch (e) {
        console.error("Failed to load local storage state:", e);
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
    
    // Update parent project's last active time
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
        
        // Log transition
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
        
        // Update project's last active time
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
            
            // Remove the sticky note
            state.ideasState.splice(ideaIndex, 1);
            
            notifyStateChange();
            return true;
        }
    }
    return false;
}

export function resetAppState() {
    localStorage.clear();
    location.reload();
}
