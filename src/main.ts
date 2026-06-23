import { authClient } from "./auth-client";

// Type Definitions
interface KanbanTask {
    id: string;
    projectId: string;
    title: string;
    tag: string;
    status: 'backlog' | 'progress' | 'review' | 'done';
    created: number;
    updated: number;
}

interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed';
    lastActive: number;
}

interface Idea {
    id: string;
    projectId: string;
    content: string;
    color: string;
}

interface TaskLog {
    id: string;
    projectId: string;
    taskId: string;
    taskTitle: string;
    fromStatus: string;
    toStatus: string;
    timestamp: number;
}

// Security: XSS Sanitization Helper
function sanitizeHTML(str: string): string {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Initial State (Fallbacks if localStorage is empty)
let kanbanState: KanbanTask[] = [
    { id: 't1', projectId: 'p1', title: 'Setup Campaign Domain', tag: 'DevOps', status: 'backlog', created: Date.now() - 86400000*5, updated: Date.now() - 86400000*5 },
    { id: 't2', projectId: 'p1', title: 'Draft Product Messaging Docs', tag: 'Docs', status: 'progress', created: Date.now() - 172800000, updated: Date.now() - 43200000 }
];

let projects: Project[] = [
    { id: 'p1', name: 'Q3 Marketing Launch', description: 'Major product update campaign.', status: 'active', lastActive: Date.now() },
    { id: 'p2', name: 'Agentic Workflow Video', description: 'YouTube tutorial series.', status: 'active', lastActive: Date.now() - 86400000*2 }
];

let ideasState: Idea[] = [
    { id: 'i1', projectId: 'p1', content: 'Leverage LinkedIn video tutorials', color: '#fef08a' },
    { id: 'i2', projectId: 'p1', content: 'Draft newsletter for existing users', color: '#bfdbfe' }
];

let taskLogs: TaskLog[] = [];

// Global State
let currentUser: string | null = null;
let currentProject: string | null = null;
let activeViewKey = 'projects';
let draggedTaskId: string | null = null;

// Persistence Helpers
function loadState() {
    try {
        currentUser = localStorage.getItem('meidallm_user');
        
        const storedKanban = localStorage.getItem('meidallm_kanban');
        if (storedKanban) kanbanState = JSON.parse(storedKanban);
        
        const storedProjects = localStorage.getItem('meidallm_projects');
        if (storedProjects) projects = JSON.parse(storedProjects);

        const storedIdeas = localStorage.getItem('meidallm_ideas');
        if (storedIdeas) ideasState = JSON.parse(storedIdeas);

        const storedLogs = localStorage.getItem('meidallm_logs');
        if (storedLogs) taskLogs = JSON.parse(storedLogs);
    } catch (e) {
        console.error("Failed to load local storage state:", e);
    }
}

function saveState() {
    try {
        if (currentUser) {
            localStorage.setItem('meidallm_user', currentUser);
        } else {
            localStorage.removeItem('meidallm_user');
        }
        localStorage.setItem('meidallm_kanban', JSON.stringify(kanbanState));
        localStorage.setItem('meidallm_projects', JSON.stringify(projects));
        localStorage.setItem('meidallm_ideas', JSON.stringify(ideasState));
        localStorage.setItem('meidallm_logs', JSON.stringify(taskLogs));
    } catch (e) {
        console.error("Failed to save state to local storage:", e);
    }
}

// Format relative times
function formatTime(ms: number): string {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

function formatExactTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Side menu items generation helper
function renderSidebarProjectsList(): string {
    return projects.map(p => `
        <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white flex items-center justify-between group/btn truncate" 
                data-view="project-workspace" data-pid="${p.id}">
            <span class="truncate">↳ ${sanitizeHTML(p.name)}</span>
            <span class="opacity-0 group-hover/btn:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity pl-2" onclick="event.stopPropagation(); window.deleteProject('${p.id}')">✕</span>
        </button>
    `).join('');
}

// Render dynamic components inside layout
function updateSidebarUI() {
    const listContainer = document.getElementById('sidebar-projects-list');
    if (listContainer) {
        listContainer.innerHTML = renderSidebarProjectsList();
    }
}

// Login Gate Screen Template
const loginHTML = `
<div class="flex items-center justify-center min-h-screen w-full bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0f172a_100%)] p-6">
    <div class="bg-glass-bg border border-glass-border p-8 rounded-2xl w-full max-w-md backdrop-blur-md shadow-2xl flex flex-col gap-6 fade-in">
        <div class="flex flex-col items-center gap-2 text-center">
            <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_var(--color-primary-glow)]">M</div>
            <h2 class="text-2xl font-bold font-outfit text-white mt-2">Welcome to Meidallm</h2>
            <p class="text-sm text-text-muted">Enter credentials to unlock the console</p>
        </div>
        
        <div id="login-error" class="hidden bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3"></div>

        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Email Address</label>
                <input id="login-email" type="email" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="admin@meidallm.com">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Password</label>
                <input id="login-password" type="password" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="••••••••">
            </div>
            <button onclick="window.submitLoginForm()" class="w-full mt-2 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer">Sign In</button>
        </div>
        <div class="text-center text-[10px] text-text-muted">
            Default credentials: <span class="text-white">admin@meidallm.com</span> / <span class="text-white">adminpass</span>
        </div>
    </div>
</div>
`;

// Base Shell Layout HTML template
const appHTML = `
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter">
    <!-- Sidebar -->
    <aside class="w-64 bg-glass-bg border-r border-glass-border flex flex-col p-6 backdrop-blur-md">
        <div class="flex items-center gap-4 mb-12 cursor-pointer" onclick="window.navigateTo('projects')">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_var(--color-primary-glow)]">M</div>
            <h2 class="text-xl font-semibold font-outfit">Meidallm</h2>
        </div>

        <nav class="flex flex-col gap-2 flex-grow">
            <!-- Projects Group -->
            <details class="group" open>
                <summary class="flex justify-between items-center text-xs uppercase tracking-wide text-text-muted font-semibold cursor-pointer select-none py-2 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                    Projects & Campaigns
                    <span class="transition-transform group-open:-rotate-180 text-sm">▾</span>
                </summary>
                <div id="sidebar-projects-list" class="flex flex-col gap-1 mt-1 animate-[fadeIn_0.3s_ease-out]">
                    <!-- Injected dynamically -->
                </div>
            </details>

            <details class="group mt-4" open>
                <summary class="flex justify-between items-center text-xs uppercase tracking-wide text-text-muted font-semibold cursor-pointer select-none py-2 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                    System
                    <span class="transition-transform group-open:-rotate-180 text-sm">▾</span>
                </summary>
                <div class="flex flex-col gap-1 mt-1 animate-[fadeIn_0.3s_ease-out]">
                    <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white" data-view="settings">⚙️ Settings</button>
                </div>
            </details>
        </nav>

        <div class="flex flex-col gap-3 pt-6 border-t border-glass-border">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-panel-hover rounded-full flex items-center justify-center font-semibold text-white">AU</div>
                <div>
                    <div id="user-display-name" class="font-semibold text-sm">Admin User</div>
                    <div class="text-xs text-text-muted">Pro Plan</div>
                </div>
            </div>
            <button onclick="window.signOut()" class="w-full mt-2 py-2 border border-glass-border hover:bg-rose-950/20 hover:text-rose-400 text-xs rounded-xl transition-colors font-medium cursor-pointer">
                Sign Out
            </button>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-grow flex flex-col p-8 overflow-y-auto">
        <header class="flex justify-between items-center pb-6 border-b border-glass-border mb-8">
            <h1 id="page-title" class="text-3xl font-semibold font-outfit">Overview</h1>
            <div class="flex gap-3">
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all" onclick="alert('Search capabilities loaded')">🔍</button>
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all" onclick="alert('No new notifications')">🔔</button>
            </div>
        </header>
        <div id="app-content" class="flex-grow flex flex-col"></div>
    </main>
</div>
`;

// Views Object
const views: Record<string, { title: string, render: (pid?: string) => string }> = {
    'projects': {
        title: 'All Projects',
        render: () => `
            <div class="fade-in">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-outfit font-medium">Active Campaigns</h2>
                    <button onclick="window.createProjectPrompt()" class="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium shadow-[0_0_15px_var(--color-primary-glow)] hover:shadow-[0_0_25px_var(--color-primary-glow)] transition-all cursor-pointer">+ New Project</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${projects.map(p => `
                        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl hover:border-primary transition-all cursor-pointer flex flex-col justify-between" onclick="window.navigateTo('project-workspace', '${p.id}')">
                            <div>
                                <div class="flex justify-between items-start mb-4">
                                    <span class="text-3xl">📁</span>
                                    <span class="text-xs text-text-muted">Active</span>
                                </div>
                                <h3 class="text-xl font-semibold text-white mb-2 font-outfit">${sanitizeHTML(p.name)}</h3>
                                <p class="text-text-muted text-sm mb-4">${sanitizeHTML(p.description)}</p>
                            </div>
                            <div class="text-xs text-text-muted border-t border-glass-border pt-4 flex justify-between">
                                <span>Tasks: ${kanbanState.filter(k => k.projectId === p.id).length}</span>
                                <span>Last active ${formatTime(p.lastActive)}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${projects.length === 0 ? `<div class="col-span-2 text-center text-text-muted py-12">No campaigns active. Click "+ New Project" to get started.</div>` : ''}
                </div>
            </div>
        `
    },
    'project-workspace': {
        title: 'Project Workspace',
        render: (pid) => {
            const p = projects.find(x => x.id === pid);
            if (!p) return `<div>Project not found.</div>`;
            currentProject = p.id;
            
            const projectTasks = kanbanState.filter(t => t.projectId === pid);
            const projectIdeas = ideasState.filter(i => i.projectId === pid);

            return `
            <div class="fade-in flex flex-col gap-6">
                <!-- Top Row: Overview & Kanban -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <!-- Project Details -->
                    <div class="bg-glass-bg border border-glass-border rounded-2xl p-6 col-span-1 flex flex-col justify-between">
                        <div>
                            <h3 class="text-xl font-semibold text-white font-outfit mb-2">${sanitizeHTML(p.name)}</h3>
                            <p class="text-text-muted text-sm mb-6">${sanitizeHTML(p.description)}</p>
                            <div class="flex flex-col gap-3">
                                <div class="flex justify-between text-sm"><span class="text-text-muted">Status</span><span class="text-emerald-400 font-medium">Active</span></div>
                                <div class="flex justify-between text-sm"><span class="text-text-muted">Total Tasks</span><span class="text-white font-medium">${projectTasks.length}</span></div>
                                <div class="flex justify-between text-sm"><span class="text-text-muted">Ideas Count</span><span class="text-white font-medium">${projectIdeas.length}</span></div>
                            </div>
                        </div>
                        <button onclick="window.navigateTo('projects')" class="w-full mt-6 px-4 py-2 bg-panel-hover border border-glass-border rounded-lg text-sm hover:bg-glass-border transition-colors">Back to Projects</button>
                    </div>

                    <!-- Kanban Preview -->
                    <div class="bg-glass-bg border border-glass-border rounded-2xl p-6 col-span-2 flex flex-col">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-white font-outfit">Task Pipeline</h3>
                            <button onclick="window.navigateTo('kanban-board', '${p.id}')" class="text-sm text-primary hover:text-white transition-colors cursor-pointer">Open Full Board →</button>
                        </div>
                        <div class="flex gap-4 flex-grow overflow-x-auto">
                            ${['backlog', 'progress', 'done'].map(status => {
                                const tasks = projectTasks.filter(t => t.status === status);
                                return `
                                <div class="flex-1 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)] rounded-xl p-3 min-w-[180px]">
                                    <div class="text-xs font-semibold text-text-muted uppercase mb-3 flex justify-between">
                                        <span>${status}</span>
                                        <span class="bg-panel-hover px-1.5 py-0.5 rounded text-[10px]">${tasks.length}</span>
                                    </div>
                                    <div class="flex flex-col gap-2">
                                        ${tasks.slice(0, 3).map(t => `<div class="bg-glass-bg border border-glass-border p-3 rounded-lg text-sm truncate">${sanitizeHTML(t.title)}</div>`).join('')}
                                        ${tasks.length > 3 ? `<div class="text-center text-xs text-text-muted py-1">+ ${tasks.length - 3} more</div>` : ''}
                                        ${tasks.length === 0 ? `<div class="text-center text-xs text-text-muted py-4 border border-dashed border-glass-border rounded-lg">Empty</div>` : ''}
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Bottom Row: Assets Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div onclick="window.navigateTo('idea-canvas', '${p.id}')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                        <span class="text-4xl mb-3">💡</span>
                        <h4 class="font-medium text-white">Idea Canvas</h4>
                        <p class="text-xs text-text-muted mt-1">${projectIdeas.length} notes active</p>
                    </div>
                    <div onclick="alert('Research Module is being configured')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                        <span class="text-4xl mb-3">🔍</span>
                        <h4 class="font-medium text-white">Research & RAG</h4>
                        <p class="text-xs text-text-muted mt-1">2 PDFs uploaded</p>
                    </div>
                    <div onclick="alert('Media studio holds 12 generic templates')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                        <span class="text-4xl mb-3">🖼️</span>
                        <h4 class="font-medium text-white">Media Assets</h4>
                        <p class="text-xs text-text-muted mt-1">12 images</p>
                    </div>
                    <div onclick="alert('Drafting panel available')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                        <span class="text-4xl mb-3">📝</span>
                        <h4 class="font-medium text-white">Drafts & Compose</h4>
                        <p class="text-xs text-text-muted mt-1">1 active draft</p>
                    </div>
                </div>
            </div>
            `;
        }
    },
    'kanban-board': {
        title: 'Task Kanban Board',
        render: (pid) => {
            const p = projects.find(x => x.id === pid);
            if (!p) return `<div>Project not found.</div>`;
            currentProject = p.id;
            
            const projectTasks = kanbanState.filter(t => t.projectId === pid);
            const projectLogs = taskLogs.filter(l => l.projectId === pid).reverse();

            const cols: { key: KanbanTask['status'], label: string }[] = [
                { key: 'backlog', label: 'Backlog' },
                { key: 'progress', label: 'In Progress' },
                { key: 'review', label: 'Review' },
                { key: 'done', label: 'Done' }
            ];

            return `
            <div class="fade-in flex flex-col xl:flex-row gap-6 h-full min-h-[500px]">
                <!-- Board Columns -->
                <div class="flex-grow flex flex-col">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} Board</h2>
                            <p class="text-sm text-text-muted">Drag tasks to change their pipeline phase.</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                            <button onclick="window.showAddTaskModal()" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Task</button>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow items-stretch">
                        ${cols.map(c => {
                            const tasks = projectTasks.filter(t => t.status === c.key);
                            return `
                            <div class="bg-[rgba(15,23,42,0.6)] border border-glass-border rounded-2xl p-4 flex flex-col min-h-[400px]"
                                 ondragover="event.preventDefault();"
                                 ondrop="window.handleDropTask(event, '${c.key}')"
                                 class="kanban-col">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-medium text-white">${c.label}</h3>
                                    <span class="bg-panel-hover text-text-muted px-2 py-0.5 rounded text-xs">${tasks.length}</span>
                                </div>
                                <div class="flex flex-col gap-3 flex-grow overflow-y-auto min-h-[300px]">
                                    ${tasks.map(t => `
                                        <div draggable="true" 
                                             ondragstart="window.handleDragStart(event, '${t.id}')"
                                             class="bg-glass-bg border border-glass-border hover:border-primary p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all select-none">
                                            <div class="flex justify-between items-start mb-2">
                                                <span class="px-2 py-0.5 text-[10px] font-semibold bg-panel-hover text-text-muted rounded">${sanitizeHTML(t.tag)}</span>
                                                <button onclick="window.deleteTask('${t.id}')" class="text-text-muted hover:text-rose-500 text-xs cursor-pointer">✕</button>
                                            </div>
                                            <h4 class="font-medium text-white mb-3 text-sm">${sanitizeHTML(t.title)}</h4>
                                            <div class="text-[10px] text-text-muted flex flex-col gap-1 border-t border-glass-border/50 pt-2 mt-2">
                                                <div>📅 Created: ${formatTime(t.created)}</div>
                                                <div>🔄 Updated: ${formatTime(t.updated)}</div>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${tasks.length === 0 ? `
                                        <div class="flex-grow flex items-center justify-center border-2 border-dashed border-glass-border/30 rounded-xl p-8 text-center text-xs text-text-muted">
                                            Drop task here
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <!-- History Logs Drawer -->
                <div class="w-full xl:w-80 bg-glass-bg border border-glass-border rounded-2xl p-6 flex flex-col shrink-0 max-h-[600px] xl:max-h-none overflow-hidden">
                    <h3 class="text-lg font-semibold text-white font-outfit mb-4">Timeline & Updates</h3>
                    <div class="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
                        ${projectLogs.map(l => `
                            <div class="border-l-2 border-primary pl-4 py-1 relative">
                                <div class="w-2 h-2 rounded-full bg-primary absolute -left-[5px] top-2"></div>
                                <div class="text-xs text-text-muted mb-0.5 flex justify-between">
                                    <span>${formatExactTime(l.timestamp)}</span>
                                    <span>${formatTime(l.timestamp)}</span>
                                </div>
                                <p class="text-xs text-white">
                                    <strong>${sanitizeHTML(l.taskTitle)}</strong> updated status from <span class="text-text-muted">${l.fromStatus}</span> to <span class="text-indigo-400 font-medium">${l.toStatus}</span>.
                                </p>
                            </div>
                        `).join('')}
                        ${projectLogs.length === 0 ? `<div class="text-center text-text-muted text-xs py-8">No status transition events logged yet. Drag columns to trigger.</div>` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Add Task Modal -->
            <div id="add-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
                <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
                    <h3 class="text-xl font-semibold text-white">Add Pipeline Task</h3>
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Task Title</label>
                        <input id="modal-task-title" type="text" maxlength="80" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="Enter task name...">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Tag</label>
                        <input id="modal-task-tag" type="text" maxlength="20" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="e.g. Marketing, DevOps, Design">
                    </div>
                    <div class="flex justify-end gap-2 mt-2">
                        <button onclick="window.hideAddTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                        <button onclick="window.submitTaskForm('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">Create Task</button>
                    </div>
                </div>
            </div>
            `;
        }
    },
    'idea-canvas': {
        title: 'Idea Canvas',
        render: (pid) => {
            const p = projects.find(x => x.id === pid);
            if (!p) return `<div>Project not found.</div>`;
            currentProject = p.id;

            const projectIdeas = ideasState.filter(i => i.projectId === pid);

            return `
            <div class="fade-in flex flex-col h-full min-h-[500px]">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} Idea Board</h2>
                        <p class="text-sm text-text-muted">Brainstorm features and campaign steps.</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                        <button onclick="window.addStickyNote('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Note</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow items-start">
                    ${projectIdeas.map(idea => `
                        <div class="bg-glass-bg border border-glass-border p-5 rounded-2xl flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-all group relative">
                            <textarea onchange="window.updateStickyNote('${idea.id}', this.value)" 
                                      maxlength="200"
                                      class="w-full bg-transparent text-white text-sm resize-none focus:outline-none border-b border-transparent focus:border-glass-border/30 pb-2 h-24 font-inter" 
                                      placeholder="Write your brilliant idea here...">${sanitizeHTML(idea.content)}</textarea>
                            <div class="flex justify-between items-center pt-2 border-t border-glass-border/20 mt-2">
                                <button onclick="window.convertIdeaToTask('${idea.id}')" class="text-xs text-primary hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
                                    📋 Convert to Task
                                </button>
                                <button onclick="window.deleteStickyNote('${idea.id}')" class="text-xs text-rose-400 hover:text-rose-600 font-bold cursor-pointer">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                    ${projectIdeas.length === 0 ? `
                        <div class="col-span-full border-2 border-dashed border-glass-border/30 rounded-2xl p-12 text-center text-text-muted">
                            💡 No brainstorm items yet. Click "+ Add Note" to create sticky notes!
                        </div>
                    ` : ''}
                </div>
            </div>
            `;
        }
    },
    'settings': {
        title: 'Settings',
        render: () => `
            <div class="fade-in bg-glass-bg border border-glass-border rounded-2xl p-8 max-w-2xl">
                <h2 class="text-2xl font-outfit mb-6">Application Settings</h2>
                <div class="flex items-center justify-between py-4 border-b border-glass-border">
                    <div>
                        <h4 class="font-medium text-white">Storage Synchronization</h4>
                        <p class="text-sm text-text-muted">Local Storage persistence active</p>
                    </div>
                    <div class="text-emerald-400 font-semibold text-sm">Active</div>
                </div>
                <div class="flex items-center justify-between py-4 border-b border-glass-border">
                    <div>
                        <h4 class="font-medium text-white">Tailwind CSS v4</h4>
                        <p class="text-sm text-text-muted">Successfully migrated layout engine</p>
                    </div>
                    <div class="text-emerald-400 font-semibold text-sm">Active</div>
                </div>
                <div class="flex items-center justify-between py-4 border-b border-glass-border">
                    <div>
                        <h4 class="font-medium text-white">TypeScript Engine</h4>
                        <p class="text-sm text-text-muted">Strict type checks with Vite compilation</p>
                    </div>
                    <div class="text-emerald-400 font-semibold text-sm">Active</div>
                </div>
                <div class="pt-6">
                    <button onclick="window.resetAppState()" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 transition-colors text-white font-medium text-sm rounded-xl cursor-pointer">
                        Reset Application Database
                    </button>
                </div>
            </div>
        `
    }
};

// Global Routing
function renderView(viewKey: string, pid?: string) {
    activeViewKey = viewKey;
    if (pid) currentProject = pid;
    
    const view = views[viewKey];
    const pageTitle = document.getElementById('page-title');
    const appContent = document.getElementById('app-content');
    
    // Update active nav state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-[rgba(99,102,241,0.1)]', 'border-[rgba(99,102,241,0.2)]', 'text-primary');
        btn.classList.add('text-text-muted');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewKey}"]${pid ? `[data-pid="${pid}"]` : ''}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-text-muted');
        activeBtn.classList.add('bg-[rgba(99,102,241,0.1)]', 'border-[rgba(99,102,241,0.2)]', 'text-primary');
    }

    if (!view) {
        if(pageTitle) pageTitle.innerText = "Module Offline";
        if(appContent) appContent.innerHTML = `<div class="fade-in text-text-muted">This module is under construction.</div>`;
        return;
    }

    if(pageTitle) pageTitle.innerText = view.title;
    if(appContent) appContent.innerHTML = view.render(pid);
}

// Global window actions for inline click integration
(window as any).navigateTo = (viewKey: string, pid?: string) => {
    renderView(viewKey, pid);
};

// Authentication Submit Handler
(window as any).submitLoginForm = async () => {
    const emailEl = document.getElementById('login-email') as HTMLInputElement;
    const passwordEl = document.getElementById('login-password') as HTMLInputElement;
    const errorEl = document.getElementById('login-error');
    
    if (!emailEl || !passwordEl || !errorEl) return;
    
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    
    // Email Validation (RFC 5322 regex pattern)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email || !emailRegex.test(email)) {
        errorEl.innerText = "Please enter a valid email address.";
        errorEl.classList.remove('hidden');
        return;
    }
    
    // Password Strength & Presence Check
    if (!password || password.length < 6) {
        errorEl.innerText = "Password must be at least 6 characters long.";
        errorEl.classList.remove('hidden');
        return;
    }
    
    try {
        // Authenticate using better-auth client API
        const { data, error } = await authClient.signIn.email({
            email,
            password
        });
        
        if (error) {
            // Check if user is not found, offer to sign them up directly
            if (error.status === 404 || error.message?.toLowerCase().includes("not found") || error.code === "INVALID_EMAIL_OR_PASSWORD") {
                errorEl.innerText = "Authenticating/Creating account...";
                errorEl.classList.remove('hidden');
                
                const signUpRes = await authClient.signUp.email({
                    email,
                    password,
                    name: email.split('@')[0] || 'User'
                });
                
                if (signUpRes.error) {
                    errorEl.innerText = signUpRes.error.message || "Failed to sign up.";
                    return;
                }
                
                currentUser = email;
                saveState();
                renderMainApp();
                return;
            }
            errorEl.innerText = error.message || "Authentication failed.";
            errorEl.classList.remove('hidden');
        } else if (data) {
            currentUser = email;
            saveState();
            renderMainApp();
        }
    } catch (err: any) {
        errorEl.innerText = err.message || "Connection error. Make sure your server is running.";
        errorEl.classList.remove('hidden');
    }
};

(window as any).signOut = async () => {
    try {
        await authClient.signOut();
    } catch (e) {
        console.error("Sign out API failed, clearing local session", e);
    }
    currentUser = null;
    localStorage.removeItem('meidallm_user');
    renderLoginPortal();
};

// Project functions
(window as any).createProjectPrompt = () => {
    const name = prompt("Enter project/campaign name (max 40 chars):");
    if (!name) return;
    if (name.length > 40) {
        alert("Project name cannot exceed 40 characters.");
        return;
    }
    const description = prompt("Enter campaign description (max 100 chars):") || "";
    if (description.length > 100) {
        alert("Project description cannot exceed 100 characters.");
        return;
    }
    
    const newProj: Project = {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        description: description.trim(),
        status: 'active',
        lastActive: Date.now()
    };
    projects.push(newProj);
    saveState();
    updateSidebarUI();
    renderView('projects');
};

(window as any).deleteProject = (pid: string) => {
    if (confirm("Are you sure you want to delete this project and all its associated tasks and ideas?")) {
        projects = projects.filter(p => p.id !== pid);
        kanbanState = kanbanState.filter(k => k.projectId !== pid);
        ideasState = ideasState.filter(i => i.projectId !== pid);
        taskLogs = taskLogs.filter(l => l.projectId !== pid);
        saveState();
        updateSidebarUI();
        renderView('projects');
    }
};

// Drag & Drop Task Functions
(window as any).handleDragStart = (e: DragEvent, taskId: string) => {
    draggedTaskId = taskId;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    }
};

(window as any).handleDropTask = (e: DragEvent, status: KanbanTask['status']) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    
    const task = kanbanState.find(t => t.id === draggedTaskId);
    if (task) {
        const oldStatus = task.status;
        if (oldStatus !== status) {
            task.status = status;
            task.updated = Date.now();
            
            // Log transition
            const logEntry: TaskLog = {
                id: 'log-' + Math.random().toString(36).substr(2, 9),
                projectId: task.projectId,
                taskId: task.id,
                taskTitle: task.title,
                fromStatus: oldStatus,
                toStatus: status,
                timestamp: Date.now()
            };
            taskLogs.push(logEntry);
            
            saveState();
            if (currentProject) {
                // Update parent project's last active time
                const p = projects.find(proj => proj.id === currentProject);
                if (p) p.lastActive = Date.now();
                saveState();
                renderView('kanban-board', currentProject);
            }
        }
    }
    draggedTaskId = null;
};

// Add Task functions
(window as any).showAddTaskModal = () => {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.remove('hidden');
};

(window as any).hideAddTaskModal = () => {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.add('hidden');
};

(window as any).submitTaskForm = (pid: string) => {
    const titleEl = document.getElementById('modal-task-title') as HTMLInputElement;
    const tagEl = document.getElementById('modal-task-tag') as HTMLInputElement;
    
    if (!titleEl || !titleEl.value.trim()) {
        alert("Task Title is required!");
        return;
    }
    
    const newTask: KanbanTask = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: titleEl.value.trim(),
        tag: tagEl ? tagEl.value.trim() || 'General' : 'General',
        status: 'backlog',
        created: Date.now(),
        updated: Date.now()
    };
    
    kanbanState.push(newTask);
    saveState();
    
    // Reset inputs & hide
    titleEl.value = '';
    if (tagEl) tagEl.value = '';
    (window as any).hideAddTaskModal();
    
    renderView('kanban-board', pid);
};

(window as any).deleteTask = (taskId: string) => {
    if (confirm("Remove this task?")) {
        kanbanState = kanbanState.filter(t => t.id !== taskId);
        taskLogs = taskLogs.filter(l => l.taskId !== taskId);
        saveState();
        if (currentProject) renderView('kanban-board', currentProject);
    }
};

// Idea Sticky Note Functions
(window as any).addStickyNote = (pid: string) => {
    const newIdea: Idea = {
        id: 'i-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        content: '',
        color: '#fef08a'
    };
    ideasState.push(newIdea);
    saveState();
    renderView('idea-canvas', pid);
};

(window as any).updateStickyNote = (ideaId: string, content: string) => {
    const idea = ideasState.find(i => i.id === ideaId);
    if (idea) {
        idea.content = content;
        saveState();
    }
};

(window as any).deleteStickyNote = (ideaId: string) => {
    ideasState = ideasState.filter(i => i.id !== ideaId);
    saveState();
    if (currentProject) renderView('idea-canvas', currentProject);
};

(window as any).convertIdeaToTask = (ideaId: string) => {
    const ideaIndex = ideasState.findIndex(i => i.id === ideaId);
    if (ideaIndex > -1) {
        const idea = ideasState[ideaIndex];
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
            kanbanState.push(newTask);
            
            // Remove the sticky note
            ideasState.splice(ideaIndex, 1);
            
            saveState();
            alert("Idea successfully converted to a Kanban task!");
            renderView('idea-canvas', idea.projectId);
        } else {
            alert("Cannot convert empty idea note to a task.");
        }
    }
};

// Reset Database function
(window as any).resetAppState = () => {
    if (confirm("This will clear all custom campaigns, tasks, and notes, restoring setup defaults. Continue?")) {
        localStorage.clear();
        location.reload();
    }
};

// App Layout Renderers
function renderLoginPortal() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = loginHTML;
    }
}

function renderMainApp() {
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = appHTML;
    }
    
    // Fill sidebar contents and load projects overview
    updateSidebarUI();
    
    // Set display name
    const nameEl = document.getElementById('user-display-name');
    const user = currentUser;
    if (nameEl && user) {
        nameEl.innerText = user.split('@')[0] || 'Admin';
    }
    
    renderView('projects');
}

// Initialization entry point
async function init() {
    loadState();
    
    // Check real auth status from server
    try {
        const sessionRes = await authClient.getSession();
        if (sessionRes && sessionRes.data) {
            currentUser = sessionRes.data.user.email;
            renderMainApp();
        } else {
            currentUser = null;
            renderLoginPortal();
        }
    } catch(e) {
        console.error("Auth session fetch failed:", e);
        if (currentUser) {
            renderMainApp();
        } else {
            renderLoginPortal();
        }
    }
    
    // Setup Sidebar Nav Click Listeners
    document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.nav-btn');
        if (target) {
            const view = target.getAttribute('data-view');
            const pid = target.getAttribute('data-pid') || undefined;
            if (view) renderView(view, pid);
        }
    });
}

// Run app init
document.addEventListener('DOMContentLoaded', init);
// Run fallback if DOMContentLoaded was fired already
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
}
