import { state, updateTask, notifyStateChange } from "../state";
import { sanitizeHTML, formatTime, formatExactTime } from "../utils";
import type { KanbanTask } from "../types";
import { getIconSVG } from "./icons";

export function renderKanbanView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;
    
    state.currentProject = p.id;
    
    const filter = state.kanbanFilter || 'active';
    let projectTasks = state.kanbanState.filter(t => t.projectId === pid);

    // Filter tasks by active/archived/bin status
    if (filter === 'active') {
        projectTasks = projectTasks.filter(t => !t.isBinned && !t.isArchived);
    } else if (filter === 'archived') {
        projectTasks = projectTasks.filter(t => t.isArchived && !t.isBinned);
    } else if (filter === 'bin') {
        projectTasks = projectTasks.filter(t => t.isBinned);
    }

    // Filter by Active Cycle or Module
    if (state.kanbanActiveCycleId) {
        projectTasks = projectTasks.filter(t => t.cycleId === state.kanbanActiveCycleId);
    }
    if (state.kanbanActiveModuleId) {
        projectTasks = projectTasks.filter(t => t.moduleId === state.kanbanActiveModuleId);
    }

    const projectLogs = state.taskLogs.filter(l => l.projectId === pid).reverse();
    const projectCycles = state.cycles.filter(c => c.projectId === pid);
    const projectModules = state.modules.filter(m => m.projectId === pid);

    const cols = [
        { key: 'backlog' as const, label: 'Backlog' },
        { key: 'progress' as const, label: 'In Progress' },
        { key: 'review' as const, label: 'Review' },
        { key: 'done' as const, label: 'Done' }
    ];

    const viewMode = state.kanbanViewMode || 'board';

    // Header Controls HTML
    const headerHTML = `
    <!-- Kanban Header and Filter Tabs -->
    <div class="flex flex-col gap-4 mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 class="text-2xl font-outfit text-text-main">${sanitizeHTML(p.name)} Task Center</h2>
                <p class="text-xs text-text-muted">High-velocity issue tracking with collaborative sprints, modules, and database views.</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
                <!-- Search -->
                <div class="relative w-40">
                    <input type="text" id="kanban-search-input" oninput="window.filterKanbanTasks()" placeholder="Search tasks..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-text-main transition-all">
                    <span class="absolute right-3 top-2 text-text-muted text-[10px]">🔍</span>
                </div>
                <!-- Cycle Filter -->
                <select onchange="window.setKanbanCycleFilter(this.value)" class="bg-panel-hover border border-glass-border text-xs text-text-main p-2 rounded-xl cursor-pointer">
                    <option value="">All Cycles</option>
                    ${projectCycles.map(c => `<option value="${c.id}" ${state.kanbanActiveCycleId === c.id ? 'selected' : ''}>⚡ ${sanitizeHTML(c.name)}</option>`).join('')}
                </select>
                <!-- Module Filter -->
                <select onchange="window.setKanbanModuleFilter(this.value)" class="bg-panel-hover border border-glass-border text-xs text-text-main p-2 rounded-xl cursor-pointer">
                    <option value="">All Modules</option>
                    ${projectModules.map(m => `<option value="${m.id}" ${state.kanbanActiveModuleId === m.id ? 'selected' : ''}>🎯 ${sanitizeHTML(m.name)}</option>`).join('')}
                </select>
                <!-- Layout Mode -->
                <div class="flex bg-panel-hover p-1 rounded-xl border border-glass-border">
                    <button onclick="window.setKanbanViewMode('board')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer ${viewMode === 'board' ? 'bg-text-main text-background' : 'text-text-muted'}">📋 Board</button>
                    <button onclick="window.setKanbanViewMode('list')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-text-main text-background' : 'text-text-muted'}">📝 List</button>
                    <button onclick="window.setKanbanViewMode('spreadsheet')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer ${viewMode === 'spreadsheet' ? 'bg-text-main text-background' : 'text-text-muted'}">📊 Table</button>
                </div>
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-3 py-2 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.showAddTaskModal()" class="px-3 py-2 bg-text-main text-background rounded-xl text-xs font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Task</button>
            </div>
        </div>

        <!-- Kanban Filter Status Tabs -->
        <div class="flex gap-4 border-b border-glass-border/30 pb-2 mt-2">
            <button onclick="window.setKanbanFilter('active')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'active' ? 'text-primary border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Active Tasks</button>
            <button onclick="window.setKanbanFilter('archived')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'archived' ? 'text-primary border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Archived</button>
            <button onclick="window.setKanbanFilter('bin')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'bin' ? 'text-primary border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Bin / Trash</button>
        </div>
    </div>
    `;

    let viewHTML = '';

    if (viewMode === 'board') {
        // --- 1. KANBAN BOARD VIEW ---
        viewHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 flex-grow items-stretch">
            ${cols.map(c => {
                const tasks = projectTasks.filter(t => t.status === c.key);
                return `
                <div class="bg-glass-bg/50 border border-glass-border rounded-2xl p-4 flex flex-col min-h-[400px]"
                     ondragover="event.preventDefault();"
                     ondrop="window.handleDropTask(event, '${c.key}')">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-medium text-text-main text-sm">${c.label}</h3>
                        <span class="bg-panel-hover text-text-muted px-2 py-0.5 rounded text-[10px]">${tasks.length}</span>
                    </div>
                    <div class="flex flex-col gap-3 flex-grow overflow-y-auto min-h-[300px]">
                        ${tasks.map(t => renderTaskCard(t, filter, projectCycles, projectModules)).join('')}
                        ${tasks.length === 0 ? `
                            <div class="flex-grow flex items-center justify-center border border-dashed border-glass-border/30 rounded-xl p-8 text-center text-[10px] text-text-muted">
                                Drop task here
                            </div>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
        `;
    } else if (viewMode === 'list') {
        // --- 2. COLLAPSIBLE LIST VIEW ---
        viewHTML = `
        <div class="flex flex-col gap-4 w-full">
            ${cols.map(c => {
                const tasks = projectTasks.filter(t => t.status === c.key);
                return `
                <details class="bg-glass-bg/50 border border-glass-border rounded-2xl overflow-hidden" open>
                    <summary class="flex justify-between items-center px-5 py-3.5 bg-panel-hover/30 cursor-pointer select-none text-sm font-semibold text-text-main">
                        <div class="flex items-center gap-3">
                            <span class="text-text-muted">▾</span>
                            <span>${c.label}</span>
                            <span class="px-2 py-0.5 bg-panel-hover rounded text-[10px] font-medium text-text-muted">${tasks.length}</span>
                        </div>
                    </summary>
                    <div class="p-4 flex flex-col gap-2 bg-glass-bg/10">
                        ${tasks.map(t => renderTaskListRow(t, filter, projectCycles, projectModules)).join('')}
                        ${tasks.length === 0 ? `<div class="text-center text-xs text-text-muted py-6">No tasks in this stage</div>` : ''}
                    </div>
                </details>
                `;
            }).join('')}
        </div>
        `;
    } else {
        // --- 3. SPREADSHEET TABLE VIEW ---
        viewHTML = `
        <div class="w-full overflow-x-auto bg-glass-bg/50 border border-glass-border rounded-2xl">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="border-b border-glass-border/40 bg-panel-hover/40 text-text-muted font-mono uppercase tracking-wider text-[10px]">
                        <th class="p-3">Task Title</th>
                        <th class="p-3">Tag</th>
                        <th class="p-3">Status</th>
                        <th class="p-3">Priority</th>
                        <th class="p-3">Points</th>
                        <th class="p-3">Complexity</th>
                        <th class="p-3">Assignee</th>
                        <th class="p-3">Sprint/Cycle</th>
                        <th class="p-3">Epic/Module</th>
                        <th class="p-3">Due Date</th>
                        <th class="p-3 text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${projectTasks.map(t => renderTaskSpreadsheetRow(t, filter, projectCycles, projectModules)).join('')}
                    ${projectTasks.length === 0 ? `
                        <tr>
                            <td colspan="11" class="p-12 text-center text-text-muted font-medium italic bg-glass-bg/5">No active campaign tasks matches current filters.</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        `;
    }

    return `
    <div class="fade-in flex flex-col xl:flex-row gap-6 h-full min-h-[500px]">
        <!-- Board Columns -->
        <div class="flex-grow flex flex-col">
            ${headerHTML}
            ${viewHTML}
        </div>

        <!-- History Logs Drawer -->
        <div class="w-full xl:w-80 bg-glass-bg border border-glass-border rounded-2xl p-6 flex flex-col shrink-0 max-h-[600px] xl:max-h-none overflow-hidden">
            <h3 class="text-lg font-semibold text-text-main font-outfit mb-4">Timeline & Updates</h3>
            <div class="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
                ${projectLogs.map(l => {
                    let logMsg = "";
                    if (l.toStatus === 'created') {
                        logMsg = `created task <strong>${sanitizeHTML(l.taskTitle)}</strong>.`;
                    } else if (l.toStatus === 'edited') {
                        logMsg = `edited task <strong>${sanitizeHTML(l.taskTitle)}</strong> details.`;
                    } else if (l.toStatus === 'archived') {
                        logMsg = `archived task <strong>${sanitizeHTML(l.taskTitle)}</strong>.`;
                    } else if (l.toStatus === 'binned') {
                        logMsg = `moved task <strong>${sanitizeHTML(l.taskTitle)}</strong> to the Trash Bin.`;
                    } else if (l.toStatus === 'permanently_deleted') {
                        logMsg = `permanently deleted task <strong>${sanitizeHTML(l.taskTitle)}</strong>.`;
                    } else if (l.fromStatus === 'binned' && l.toStatus === 'active') {
                        logMsg = `restored task <strong>${sanitizeHTML(l.taskTitle)}</strong> from Bin.`;
                    } else if (l.fromStatus === 'archived' && l.toStatus === 'active') {
                        logMsg = `unarchived task <strong>${sanitizeHTML(l.taskTitle)}</strong>.`;
                    } else {
                        logMsg = `moved <strong>${sanitizeHTML(l.taskTitle)}</strong> from <span class="text-text-muted">${l.fromStatus}</span> to <span class="text-indigo-400 font-medium">${l.toStatus}</span>.`;
                    }

                    return `
                    <div class="border-l-2 border-text-main pl-4 py-1 relative">
                        <div class="w-2 h-2 rounded-full bg-text-main text-background absolute -left-[5px] top-2"></div>
                        <div class="text-xs text-text-muted mb-0.5 flex justify-between">
                            <span>${formatExactTime(l.timestamp)}</span>
                            <span>${formatTime(l.timestamp)}</span>
                        </div>
                        <p class="text-xs text-text-main leading-normal">
                            ${logMsg}
                        </p>
                    </div>
                    `;
                }).join('')}
                ${projectLogs.length === 0 ? `<div class="text-center text-text-muted text-xs py-8">No status transition events logged yet. Drag columns to trigger.</div>` : ''}
            </div>
        </div>
    </div>
    
    <!-- Add Task Modal -->
    <div id="add-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
            <h3 class="text-xl font-semibold text-text-main">Add Pipeline Task</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Task Title</label>
                <input id="modal-task-title" type="text" maxlength="80" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="Enter task name...">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Tag</label>
                <input id="modal-task-tag" type="text" maxlength="20" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="e.g. Marketing, DevOps, Design">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Priority</label>
                    <select id="modal-task-priority" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Story Points</label>
                    <input id="modal-task-points" type="number" min="0" max="100" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="0">
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitTaskForm('${pid}')" class="px-4 py-2 bg-text-main text-background rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">Create Task</button>
            </div>
        </div>
    </div>

    <!-- Edit Task Details Modal -->
    <div id="edit-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 overflow-y-auto max-h-[90vh]">
            <h3 class="text-xl font-semibold text-text-main font-outfit">Task Details & Records</h3>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Title</label>
                    <input id="edit-modal-task-title" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Tag / Phase</label>
                    <input id="edit-modal-task-tag" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Complexity</label>
                    <select id="edit-modal-task-complexity" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Assignee</label>
                    <input id="edit-modal-task-assignee" type="text" placeholder="Assignee Name" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Due Date</label>
                    <input id="edit-modal-task-duedate" type="date" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Priority</label>
                    <select id="edit-modal-task-priority" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Story Points</label>
                    <input id="edit-modal-task-points" type="number" min="0" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Sprint / Cycle</label>
                    <select id="edit-modal-task-cycle" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                        <option value="">Unassigned</option>
                        ${projectCycles.map(c => `<option value="${c.id}">${sanitizeHTML(c.name)}</option>`).join('')}
                    </select>
                </div>
                <div class="col-span-2">
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Epic / Module</label>
                    <select id="edit-modal-task-module" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                        <option value="">Unassigned</option>
                        ${projectModules.map(m => `<option value="${m.id}">${sanitizeHTML(m.name)}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Detailed Description & Notes</label>
                <textarea id="edit-modal-task-description" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main resize-none h-28 leading-relaxed" placeholder="Type records, reference assets, or detailed action plans here..."></textarea>
            </div>

            <div class="flex justify-end gap-2 mt-2 border-t border-glass-border/30 pt-3">
                <button onclick="window.closeEditTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button id="edit-modal-save-btn" class="px-5 py-2 bg-text-main text-background rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">Save Changes</button>
            </div>
        </div>
    </div>
    `;
}

function renderTaskCard(t: KanbanTask, filter: string, cycles: any[], modules: any[]): string {
    const actionHTML = getTaskActions(t, filter);
    const cycle = cycles.find(c => c.id === t.cycleId);
    const mod = modules.find(m => m.id === t.moduleId);

    return `
    <div draggable="true" 
         ondragstart="window.handleDragStart(event, '${t.id}')"
         onclick="window.openEditTaskModal('${t.id}')"
         class="kanban-col-item bg-background border border-text-main/15 hover:border-text-main p-4 rounded-xl cursor-grab active:cursor-grabbing hover:shadow-lg transition-all select-none group/kanban-item flex flex-col justify-between"
         data-title="${sanitizeHTML(t.title)}"
         data-tag="${sanitizeHTML(t.tag)}">
        <div>
            <div class="flex justify-between items-start mb-2">
                <div class="flex items-center gap-1.5">
                    <span class="text-text-muted/40 text-xs font-bold leading-none cursor-grab active:cursor-grabbing select-none" title="Drag to reorder">⋮⋮</span>
                    <span class="px-2 py-0.5 text-[9px] font-semibold bg-panel-hover text-text-muted rounded">${sanitizeHTML(t.tag)}</span>
                </div>
                <div class="flex gap-2 opacity-0 group-hover/kanban-item:opacity-100 transition-opacity">
                    <button onclick="event.stopPropagation(); alert('Start timer for task: ${t.id}')" class="text-emerald-500 hover:text-emerald-600 transition-colors" title="Start Timer">
                        ▶️
                    </button>
                    ${actionHTML}
                </div>
            </div>
            <h4 class="font-medium text-text-main mb-3 text-xs leading-snug">${sanitizeHTML(t.title)}</h4>
        </div>
        
        <div class="border-t border-text-main/10 pt-2 mt-2 flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
                ${t.complexity ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">${t.complexity}</span>` : ''}
                ${t.priority && t.priority !== 'none' ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider ${t.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}">⚠️ ${t.priority}</span>` : ''}
                ${t.points ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">🎯 ${t.points} SP</span>` : ''}
                ${cycle ? `<span class="px-1.5 py-0.5 text-[8px] font-medium rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">⚡ ${sanitizeHTML(cycle.name)}</span>` : ''}
                ${mod ? `<span class="px-1.5 py-0.5 text-[8px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">🎯 ${sanitizeHTML(mod.name)}</span>` : ''}
                ${t.assignee ? `<span class="text-[9px] text-primary font-medium">👤 ${sanitizeHTML(t.assignee)}</span>` : ''}
                ${t.dueDate ? `<span class="text-[9px] text-text-muted">📅 ${t.dueDate}</span>` : ''}
            </div>
            <div class="text-[8px] text-text-muted flex justify-between pt-1 opacity-60">
                <span>Created ${formatTime(t.created)}</span>
            </div>
        </div>
    </div>
    `;
}

function renderTaskListRow(t: KanbanTask, filter: string, cycles: any[], modules: any[]): string {
    const actionHTML = getTaskActions(t, filter);
    const cycle = cycles.find(c => c.id === t.cycleId);
    const mod = modules.find(m => m.id === t.moduleId);

    return `
    <div onclick="window.openEditTaskModal('${t.id}')"
         class="kanban-col-item bg-glass-bg border border-glass-border hover:border-text-main p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-4 group/kanban-item"
         data-title="${sanitizeHTML(t.title)}"
         data-tag="${sanitizeHTML(t.tag)}">
        <div class="flex items-center gap-3 min-w-0">
            <span class="px-2 py-0.5 text-[9px] font-semibold bg-panel-hover text-text-muted rounded shrink-0">${sanitizeHTML(t.tag)}</span>
            <h4 class="font-medium text-text-main text-xs truncate max-w-sm md:max-w-md">${sanitizeHTML(t.title)}</h4>
        </div>
        <div class="flex items-center gap-3 shrink-0">
            ${t.priority && t.priority !== 'none' ? `<span class="text-[9px] text-orange-400 font-semibold">⚠️ ${t.priority}</span>` : ''}
            ${t.points ? `<span class="text-[9px] text-purple-400 font-bold">🎯 ${t.points}</span>` : ''}
            ${cycle ? `<span class="text-[9px] text-indigo-400">⚡ ${sanitizeHTML(cycle.name)}</span>` : ''}
            ${t.assignee ? `<span class="text-[9px] text-text-muted">👤 ${sanitizeHTML(t.assignee)}</span>` : ''}
            <div class="flex gap-2 opacity-0 group-hover/kanban-item:opacity-100 transition-opacity">
                ${actionHTML}
            </div>
        </div>
    </div>
    `;
}

function renderTaskSpreadsheetRow(t: KanbanTask, filter: string, cycles: any[], modules: any[]): string {
    return `
    <tr class="border-b border-glass-border/30 hover:bg-panel-hover/10 transition-colors group/row kanban-col-item"
        data-title="${sanitizeHTML(t.title)}"
        data-tag="${sanitizeHTML(t.tag)}">
        <td class="p-2.5">
            <input type="text" value="${sanitizeHTML(t.title)}" 
                   onchange="window.updateSpreadsheetTask('${t.id}', 'title', this.value)" 
                   class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-text-main text-xs w-full">
        </td>
        <td class="p-2.5">
            <input type="text" value="${sanitizeHTML(t.tag)}" 
                   onchange="window.updateSpreadsheetTask('${t.id}', 'tag', this.value)" 
                   class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-text-main text-xs w-20">
        </td>
        <td class="p-2.5">
            <select onchange="window.updateSpreadsheetTask('${t.id}', 'status', this.value)" 
                    class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-text-main text-[11px] rounded p-1 cursor-pointer">
                <option value="backlog" ${t.status === 'backlog' ? 'selected' : ''}>Backlog</option>
                <option value="progress" ${t.status === 'progress' ? 'selected' : ''}>In Progress</option>
                <option value="review" ${t.status === 'review' ? 'selected' : ''}>Review</option>
                <option value="done" ${t.status === 'done' ? 'selected' : ''}>Done</option>
            </select>
        </td>
        <td class="p-2.5">
            <select onchange="window.updateSpreadsheetTask('${t.id}', 'priority', this.value)" 
                    class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-text-main text-[11px] rounded p-1 cursor-pointer">
                <option value="none" ${t.priority === 'none' ? 'selected' : ''}>None</option>
                <option value="low" ${t.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${t.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${t.priority === 'high' ? 'selected' : ''}>High</option>
                <option value="urgent" ${t.priority === 'urgent' ? 'selected' : ''}>Urgent</option>
            </select>
        </td>
        <td class="p-2.5">
            <input type="number" min="0" value="${t.points || 0}" 
                   onchange="window.updateSpreadsheetTask('${t.id}', 'points', this.value)" 
                   class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-text-main text-xs w-12 text-center">
        </td>
        <td class="p-2.5">
            <select onchange="window.updateSpreadsheetTask('${t.id}', 'complexity', this.value)" 
                    class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-text-main text-[11px] rounded p-1 cursor-pointer">
                <option value="low" ${t.complexity === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${t.complexity === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${t.complexity === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${t.complexity === 'critical' ? 'selected' : ''}>Critical</option>
            </select>
        </td>
        <td class="p-2.5">
            <input type="text" value="${sanitizeHTML(t.assignee || '')}" placeholder="None"
                   onchange="window.updateSpreadsheetTask('${t.id}', 'assignee', this.value)" 
                   class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-text-main text-xs w-24">
        </td>
        <td class="p-2.5">
            <select onchange="window.updateSpreadsheetTask('${t.id}', 'cycleId', this.value)" 
                    class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-text-main text-[11px] rounded p-1 cursor-pointer max-w-[100px]">
                <option value="">Unassigned</option>
                ${cycles.map(c => `<option value="${c.id}" ${t.cycleId === c.id ? 'selected' : ''}>${sanitizeHTML(c.name)}</option>`).join('')}
            </select>
        </td>
        <td class="p-2.5">
            <select onchange="window.updateSpreadsheetTask('${t.id}', 'moduleId', this.value)" 
                    class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-text-main text-[11px] rounded p-1 cursor-pointer max-w-[100px]">
                <option value="">Unassigned</option>
                ${modules.map(m => `<option value="${m.id}" ${t.moduleId === m.id ? 'selected' : ''}>${sanitizeHTML(m.name)}</option>`).join('')}
            </select>
        </td>
        <td class="p-2.5">
            <input type="date" value="${t.dueDate || ''}" 
                   onchange="window.updateSpreadsheetTask('${t.id}', 'dueDate', this.value)" 
                   class="bg-transparent border-0 hover:bg-panel-hover focus:ring-1 focus:ring-primary rounded p-1 text-text-main text-[11px] cursor-pointer">
        </td>
        <td class="p-2.5 text-center">
            <div class="flex gap-2.5 justify-center opacity-40 group-hover/row:opacity-100 transition-opacity">
                ${getTaskActions(t, filter)}
            </div>
        </td>
    </tr>
    `;
}

function getTaskActions(t: KanbanTask, filter: string): string {
    if (filter === 'active') {
        return `
        <button onclick="event.stopPropagation(); window.archiveTaskToggle('${t.id}', true)" class="text-text-muted hover:text-text-main cursor-pointer" title="Archive">
            ${getIconSVG('archive', 'w-3.5 h-3.5')}
        </button>
        <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', true)" class="text-text-muted hover:text-red-500 cursor-pointer" title="Move to Bin">
            ${getIconSVG('trash', 'w-3.5 h-3.5')}
        </button>
        `;
    } else if (filter === 'archived') {
        return `
        <button onclick="event.stopPropagation(); window.archiveTaskToggle('${t.id}', false)" class="text-text-muted hover:text-text-main cursor-pointer" title="Restore">
            ${getIconSVG('external-link', 'w-3.5 h-3.5')}
        </button>
        <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', true)" class="text-text-muted hover:text-red-500 cursor-pointer" title="Move to Bin">
            ${getIconSVG('trash', 'w-3.5 h-3.5')}
        </button>
        `;
    } else {
        return `
        <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', false)" class="text-text-muted hover:text-text-main cursor-pointer" title="Restore">
            ${getIconSVG('check', 'w-3.5 h-3.5')}
        </button>
        <button onclick="event.stopPropagation(); window.deleteTask('${t.id}')" class="text-text-muted hover:text-red-500 cursor-pointer font-bold" title="Delete Permanently">
            ${getIconSVG('close', 'w-3.5 h-3.5')}
        </button>
        `;
    }
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.setKanbanViewMode = (mode: 'board' | 'list' | 'spreadsheet') => {
        state.kanbanViewMode = mode;
        notifyStateChange();
    };

    w.setKanbanCycleFilter = (val: string) => {
        state.kanbanActiveCycleId = val || null;
        notifyStateChange();
    };

    w.setKanbanModuleFilter = (val: string) => {
        state.kanbanActiveModuleId = val || null;
        notifyStateChange();
    };

    w.updateSpreadsheetTask = (taskId: string, key: string, val: string) => {
        const t = state.kanbanState.find(x => x.id === taskId);
        if (t) {
            let processedVal: any = val;
            if (key === 'points') processedVal = parseInt(val) || 0;
            if (key === 'cycleId' || key === 'moduleId') processedVal = val || undefined;
            
            updateTask(
                taskId,
                key === 'title' ? val : t.title,
                key === 'tag' ? val : t.tag,
                key === 'status' ? val as any : t.status,
                key === 'complexity' ? val as any : t.complexity,
                key === 'assignee' ? val : t.assignee,
                key === 'description' ? val : t.description,
                key === 'dueDate' ? val : t.dueDate,
                undefined,
                key === 'priority' ? val as any : t.priority,
                key === 'points' ? processedVal : t.points,
                key === 'cycleId' ? processedVal : t.cycleId,
                key === 'moduleId' ? processedVal : t.moduleId
            );
        }
    };

    w.openEditTaskModal = (taskId: string) => {
        const t = state.kanbanState.find(x => x.id === taskId);
        if (!t) return;

        const modal = document.getElementById('edit-task-modal');
        const titleEl = document.getElementById('edit-modal-task-title') as HTMLInputElement;
        const tagEl = document.getElementById('edit-modal-task-tag') as HTMLInputElement;
        const compEl = document.getElementById('edit-modal-task-complexity') as HTMLSelectElement;
        const assEl = document.getElementById('edit-modal-task-assignee') as HTMLInputElement;
        const dateEl = document.getElementById('edit-modal-task-duedate') as HTMLInputElement;
        const descEl = document.getElementById('edit-modal-task-description') as HTMLTextAreaElement;
        const prioEl = document.getElementById('edit-modal-task-priority') as HTMLSelectElement;
        const ptsEl = document.getElementById('edit-modal-task-points') as HTMLInputElement;
        const cyEl = document.getElementById('edit-modal-task-cycle') as HTMLSelectElement;
        const modEl = document.getElementById('edit-modal-task-module') as HTMLSelectElement;
        const saveBtn = document.getElementById('edit-modal-save-btn');

        if (modal && titleEl && tagEl && compEl && assEl && dateEl && descEl && prioEl && ptsEl && cyEl && modEl && saveBtn) {
            titleEl.value = t.title || "";
            tagEl.value = t.tag || "";
            compEl.value = t.complexity || "low";
            assEl.value = t.assignee || "";
            dateEl.value = t.dueDate || "";
            descEl.value = t.description || "";
            prioEl.value = t.priority || "none";
            ptsEl.value = (t.points !== undefined) ? t.points.toString() : "0";
            cyEl.value = t.cycleId || "";
            modEl.value = t.moduleId || "";

            // Show modal
            modal.classList.remove('hidden');

            saveBtn.onclick = () => {
                updateTask(
                    taskId,
                    titleEl.value,
                    tagEl.value,
                    t.status,
                    compEl.value as any,
                    assEl.value,
                    descEl.value,
                    dateEl.value,
                    undefined,
                    prioEl.value as any,
                    parseInt(ptsEl.value) || 0,
                    cyEl.value || undefined,
                    modEl.value || undefined
                );
                w.closeEditTaskModal();
            };
        }
    };

    w.closeEditTaskModal = () => {
        const modal = document.getElementById('edit-task-modal');
        if (modal) modal.classList.add('hidden');
    };
}
