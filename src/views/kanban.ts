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
                    <span class="absolute right-3 top-2.5 text-text-muted flex items-center justify-center">${getIconSVG('search', 'w-3.5 h-3.5')}</span>
                </div>
                <!-- Cycle Filter -->
                <select onchange="window.setKanbanCycleFilter(this.value)" class="bg-panel-hover border border-glass-border text-xs text-text-main p-2 rounded-xl cursor-pointer">
                    <option value="">All Cycles</option>
                    ${projectCycles.map(c => `<option value="${c.id}" ${state.kanbanActiveCycleId === c.id ? 'selected' : ''}>${sanitizeHTML(c.name)}</option>`).join('')}
                </select>
                <!-- Module Filter -->
                <select onchange="window.setKanbanModuleFilter(this.value)" class="bg-panel-hover border border-glass-border text-xs text-text-main p-2 rounded-xl cursor-pointer">
                    <option value="">All Modules</option>
                    ${projectModules.map(m => `<option value="${m.id}" ${state.kanbanActiveModuleId === m.id ? 'selected' : ''}>${sanitizeHTML(m.name)}</option>`).join('')}
                </select>
                <!-- Layout Mode -->
                <div class="flex bg-panel-hover p-1 rounded-xl border border-glass-border">
                    <button onclick="window.setKanbanViewMode('board')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 ${viewMode === 'board' ? 'bg-text-main text-background' : 'text-text-muted'}">${getIconSVG('kanban-board', 'w-3 h-3')} Board</button>
                    <button onclick="window.setKanbanViewMode('list')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 ${viewMode === 'list' ? 'bg-text-main text-background' : 'text-text-muted'}">${getIconSVG('drafts', 'w-3 h-3')} List</button>
                    <button onclick="window.setKanbanViewMode('spreadsheet')" class="px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:text-text-main transition-colors cursor-pointer flex items-center gap-1 ${viewMode === 'spreadsheet' ? 'bg-text-main text-background' : 'text-text-muted'}">${getIconSVG('database-hub', 'w-3 h-3')} Table</button>
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
    <div id="add-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden animate-[fadeIn_0.2s_ease-out]" style="z-index: 9999;">
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
    <div id="edit-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden animate-[fadeIn_0.2s_ease-out]" style="z-index: 9999;">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-4xl flex flex-col gap-4 overflow-y-auto max-h-[90vh] font-outfit text-text-main shadow-2xl">
            <!-- Modal Header -->
            <div class="flex justify-between items-center border-b border-glass-border/30 pb-3">
                <div class="flex items-center gap-2">
                    <span class="text-text-muted text-[10px] font-bold uppercase tracking-wider">Edit Task</span>
                    <span class="px-2 py-0.5 text-[10px] font-mono bg-panel-hover text-text-muted rounded" id="edit-modal-task-id"></span>
                </div>
                <button onclick="window.closeEditTaskModal()" class="text-text-muted hover:text-text-main transition-colors cursor-pointer">
                    ${getIconSVG('close', 'w-5 h-5')}
                </button>
            </div>
            
            <!-- Two Column Layout -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column (Main Info, Subtasks, Checklists, Comments) -->
                <div class="lg:col-span-2 flex flex-col gap-5">
                    <div>
                        <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Title</label>
                        <input id="edit-modal-task-title" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm font-semibold focus:outline-none focus:border-text-main">
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Tag</label>
                        <input id="edit-modal-task-tag" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="e.g. Marketing, DevOps, Design">
                    </div>
                    
                    <div>
                        <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Detailed Description</label>
                        <textarea id="edit-modal-task-description" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main resize-none h-28 leading-relaxed" placeholder="Write description..."></textarea>
                    </div>
                    
                    <!-- Subtasks Section -->
                    <div class="bg-panel-hover/20 p-4 rounded-2xl border border-glass-border/30">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">${getIconSVG('folder', 'w-3.5 h-3.5 text-primary')} Subtasks</h4>
                            <button id="edit-modal-add-subtask-btn" class="text-[10px] bg-text-main text-background px-2.5 py-1 rounded font-semibold hover:bg-indigo-600 transition-colors">+ Add Subtask</button>
                        </div>
                        <div id="edit-modal-subtasks-container" class="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1"></div>
                    </div>
                    
                    <!-- Checklists Section -->
                    <div class="bg-panel-hover/20 p-4 rounded-2xl border border-glass-border/30">
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1.5">${getIconSVG('check', 'w-3.5 h-3.5 text-emerald-500')} Checklists</h4>
                            <button id="edit-modal-add-checklist-btn" class="text-[10px] bg-text-main text-background px-2.5 py-1 rounded font-semibold hover:bg-indigo-600 transition-colors">+ Add Checklist</button>
                        </div>
                        <div id="edit-modal-checklists-container" class="flex flex-col gap-4 max-h-60 overflow-y-auto pr-1"></div>
                    </div>
                    
                    <!-- Discussion & Comments -->
                    <div class="bg-panel-hover/20 p-4 rounded-2xl border border-glass-border/30">
                        <h4 class="text-xs font-bold text-text-main uppercase tracking-wider mb-2">Discussion & Activity</h4>
                        <div id="edit-modal-comments-container" class="space-y-2 max-h-48 overflow-y-auto mb-3 pr-1 bg-background/30 p-2 rounded-xl border border-glass-border/20"></div>
                        <div class="flex gap-2">
                            <input id="edit-modal-new-comment" type="text" placeholder="Add a comment or @mention..." class="flex-1 bg-panel-hover border border-glass-border p-2 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main">
                            <button id="edit-modal-add-comment-btn" class="px-3 py-2 bg-text-main text-background rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Post</button>
                        </div>
                    </div>
                </div>
                
                <!-- Right Column (Metadata, Time Tracking, Custom Fields, Dependencies, Collaboration) -->
                <div class="flex flex-col gap-5 bg-panel-hover/10 p-4 rounded-2xl border border-glass-border/30">
                    <!-- Standard Attributes -->
                    <div class="grid grid-cols-2 gap-3 text-xs">
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Status</label>
                            <select id="edit-modal-task-status" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="backlog">Backlog</option>
                                <option value="progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Priority</label>
                            <select id="edit-modal-task-priority" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="none">None</option>
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Complexity</label>
                            <select id="edit-modal-task-complexity" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Points</label>
                            <input id="edit-modal-task-points" type="number" min="0" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Assignee</label>
                            <select id="edit-modal-task-assignee" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="">Unassigned</option>
                                ${state.team.map(m => `<option value="${m.name}">${m.name}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Start Date</label>
                            <input id="edit-modal-task-startdate" type="date" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Due Date</label>
                            <input id="edit-modal-task-duedate" type="date" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                        </div>
                        <div class="col-span-2 flex items-center gap-2 mt-1">
                            <input id="edit-modal-task-milestone" type="checkbox" class="rounded border-glass-border bg-panel-hover text-primary focus:ring-0 cursor-pointer">
                            <label for="edit-modal-task-milestone" class="text-xs font-semibold text-text-main cursor-pointer">Mark as Milestone</label>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Sprint / Cycle</label>
                            <select id="edit-modal-task-cycle" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="">Unassigned</option>
                                ${projectCycles.map(c => `<option value="${c.id}">${sanitizeHTML(c.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">Epic / Module</label>
                            <select id="edit-modal-task-module" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                <option value="">Unassigned</option>
                                ${projectModules.map(m => `<option value="${m.id}">${sanitizeHTML(m.name)}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- Time Tracking Widget -->
                    <div class="border-t border-glass-border/30 pt-3 flex flex-col gap-2">
                        <h4 class="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1">${getIconSVG('play', 'w-3 h-3 text-emerald-400')} Time Tracking</h4>
                        <div class="flex items-center justify-between text-xs">
                            <span id="edit-modal-timer-display" class="font-mono text-text-main bg-panel-hover/50 px-2.5 py-1 rounded border border-glass-border/20">00:00:00</span>
                            <div class="flex gap-1.5">
                                <button id="edit-modal-timer-toggle" class="bg-emerald-500 hover:bg-emerald-600 text-background px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer">Start</button>
                                <button id="edit-modal-timer-manual" class="bg-panel-hover hover:bg-glass-border px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer">Log Time</button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1 text-[10px] text-text-muted">
                            <div class="flex justify-between">
                                <span>Tracked: <strong id="edit-modal-time-tracked" class="text-text-main">0h</strong></span>
                                <span>Estimate: <strong id="edit-modal-time-estimate-text" class="text-text-main">None</strong></span>
                            </div>
                            <div class="w-full bg-panel-hover rounded-full h-1.5 overflow-hidden border border-glass-border/10">
                                <div id="edit-modal-time-progress-bar" class="bg-indigo-500 h-full w-0"></div>
                            </div>
                            <div class="mt-1">
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-0.5">Time Estimate (hours)</label>
                                <input id="edit-modal-task-timeestimate" type="number" min="0" step="0.5" class="w-full bg-panel-hover border border-glass-border p-1.5 rounded text-[10px] text-text-main focus:outline-none" placeholder="e.g. 8">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Dependencies Section -->
                    <div class="border-t border-glass-border/30 pt-3 flex flex-col gap-2">
                        <h4 class="text-xs font-bold text-text-main uppercase tracking-wider flex items-center gap-1">${getIconSVG('info', 'w-3 h-3 text-orange-400')} Dependencies</h4>
                        <div id="edit-modal-dependencies-container" class="flex flex-col gap-1 text-xs"></div>
                        <div class="flex gap-1">
                            <select id="edit-modal-dep-type" class="bg-panel-hover border border-glass-border text-[10px] text-text-main p-1 rounded focus:outline-none cursor-pointer">
                                <option value="blocks">Blocks</option>
                                <option value="blocked-by">Blocked By</option>
                            </select>
                            <select id="edit-modal-dep-task" class="flex-1 bg-panel-hover border border-glass-border text-[10px] text-text-main p-1 rounded focus:outline-none cursor-pointer">
                                <option value="">Select Task...</option>
                            </select>
                            <button id="edit-modal-add-dep-btn" class="bg-text-main text-background px-2.5 py-1 rounded text-[10px] font-bold hover:bg-indigo-600 transition-colors cursor-pointer">+</button>
                        </div>
                    </div>
                    
                    <!-- Custom Fields Section -->
                    <div class="border-t border-glass-border/30 pt-3 flex flex-col gap-2">
                        <h4 class="text-xs font-bold text-text-main uppercase tracking-wider">Custom Fields</h4>
                        <div id="edit-modal-customfields-container" class="flex flex-col gap-2.5 text-xs"></div>
                    </div>

                    <!-- Collaboration Details -->
                    <div class="border-t border-glass-border/30 pt-3 flex flex-col gap-2 text-xs">
                        <h4 class="text-xs font-bold text-text-main uppercase tracking-wider">Collaboration</h4>
                        <div>
                            <label class="block text-[9px] font-bold text-text-muted uppercase mb-1">Watchers (Following)</label>
                            <div id="edit-modal-watchers-container" class="flex flex-wrap gap-1.5 mb-1.5"></div>
                            <div class="flex gap-1">
                                <input id="edit-modal-watcher-input" type="text" placeholder="Add watcher..." class="flex-1 bg-panel-hover border border-glass-border p-1.5 rounded text-[10px] text-text-main focus:outline-none">
                                <button id="edit-modal-add-watcher-btn" class="bg-text-main text-background px-2 py-1 rounded text-[10px] font-bold hover:bg-indigo-600 transition-colors cursor-pointer">+</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-text-muted uppercase mb-1 font-mono">Collaborators</label>
                            <input id="edit-modal-task-collaborators" type="text" placeholder="e.g. Alice, Bob" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main text-xs focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-text-muted uppercase mb-1 font-mono">Reviewers</label>
                            <input id="edit-modal-task-reviewers" type="text" placeholder="e.g. Charlie" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main text-xs focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[9px] font-bold text-text-muted uppercase mb-1 font-mono">External Links</label>
                            <input id="edit-modal-task-links" type="text" placeholder="e.g. https://github.com/..." class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main text-xs focus:outline-none">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Modal Actions Footer -->
            <div class="flex justify-between items-center border-t border-glass-border/30 pt-4 mt-2">
                <button id="edit-modal-delete-btn" class="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer">Delete Task</button>
                <div class="flex gap-2">
                    <button onclick="window.closeEditTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                    <button id="edit-modal-save-btn" class="px-5 py-2 bg-text-main text-background rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">Save Changes</button>
                </div>
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
                        ${getIconSVG('play', 'w-3.5 h-3.5')}
                    </button>
                    ${actionHTML}
                </div>
            </div>
            <h4 class="font-medium text-text-main mb-3 text-xs leading-snug">${sanitizeHTML(t.title)}</h4>
        </div>
        
        <div class="border-t border-text-main/10 pt-2 mt-2 flex flex-col gap-1.5">
            <div class="flex items-center gap-1.5 flex-wrap">
                ${t.complexity ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/20">${t.complexity}</span>` : ''}
                ${t.priority && t.priority !== 'none' ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider flex items-center gap-0.5 ${t.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}">${getIconSVG('info', 'w-2 h-2 text-current')} ${t.priority}</span>` : ''}
                ${t.points ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-0.5">${getIconSVG('project-goals', 'w-2 h-2 text-current')} ${t.points} SP</span>` : ''}
                ${cycle ? `<span class="px-1.5 py-0.5 text-[8px] font-medium rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-0.5">${getIconSVG('project-cycles', 'w-2 h-2 text-current')} ${sanitizeHTML(cycle.name)}</span>` : ''}
                ${mod ? `<span class="px-1.5 py-0.5 text-[8px] font-medium rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">${getIconSVG('project-goals', 'w-2 h-2 text-current')} ${sanitizeHTML(mod.name)}</span>` : ''}
                ${t.assignee ? `<span class="text-[9px] text-primary font-medium flex items-center gap-0.5">${getIconSVG('team', 'w-2.5 h-2.5 text-current')} ${sanitizeHTML(t.assignee)}</span>` : ''}
                ${t.dueDate ? `<span class="text-[9px] text-text-muted flex items-center gap-0.5">${getIconSVG('calendar', 'w-2.5 h-2.5 text-current')} ${t.dueDate}</span>` : ''}
            </div>
            
            ${(() => {
                // Generate simulated locks for visual multi-user presentation
                const hash = t.title.length + t.id.charCodeAt(t.id.length - 1);
                if (hash % 4 === 0) {
                    const names = ["Gavin Belson", "Richard Hendricks", "Bablu Katru"];
                    const editorName = names[hash % names.length];
                    return `
                    <div class="mt-2 bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 text-[8px] font-bold px-2 py-1 rounded flex items-center gap-1.5 animate-pulse">
                        <span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                        🔒 ${editorName} is editing...
                    </div>`;
                }
                return '';
            })()}

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
            ${t.priority && t.priority !== 'none' ? `<span class="text-[9px] text-orange-400 font-semibold flex items-center gap-0.5">${getIconSVG('info', 'w-2.5 h-2.5 text-current')} ${t.priority}</span>` : ''}
            ${t.points ? `<span class="text-[9px] text-purple-400 font-bold flex items-center gap-0.5">${getIconSVG('project-goals', 'w-2.5 h-2.5 text-current')} ${t.points}</span>` : ''}
            ${cycle ? `<span class="text-[9px] text-indigo-400 flex items-center gap-0.5">${getIconSVG('project-cycles', 'w-2.5 h-2.5 text-current')} ${sanitizeHTML(cycle.name)}</span>` : ''}
            ${t.assignee ? `<span class="text-[9px] text-text-muted flex items-center gap-0.5">${getIconSVG('team', 'w-2.5 h-2.5 text-current')} ${sanitizeHTML(t.assignee)}</span>` : ''}
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

        // Save active task ID globally for subtask/checklist handlers
        (window as any).activeEditingTaskId = taskId;

        const modal = document.getElementById('edit-task-modal');
        const titleEl = document.getElementById('edit-modal-task-title') as HTMLInputElement;
        const tagEl = document.getElementById('edit-modal-task-tag') as HTMLInputElement;
        const compEl = document.getElementById('edit-modal-task-complexity') as HTMLSelectElement;
        const assEl = document.getElementById('edit-modal-task-assignee') as HTMLSelectElement;
        const dateEl = document.getElementById('edit-modal-task-duedate') as HTMLInputElement;
        const descEl = document.getElementById('edit-modal-task-description') as HTMLTextAreaElement;
        const prioEl = document.getElementById('edit-modal-task-priority') as HTMLSelectElement;
        const ptsEl = document.getElementById('edit-modal-task-points') as HTMLInputElement;
        const cyEl = document.getElementById('edit-modal-task-cycle') as HTMLSelectElement;
        const modEl = document.getElementById('edit-modal-task-module') as HTMLSelectElement;
        const collabEl = document.getElementById('edit-modal-task-collaborators') as HTMLInputElement;
        const revEl = document.getElementById('edit-modal-task-reviewers') as HTMLInputElement;
        const linksEl = document.getElementById('edit-modal-task-links') as HTMLInputElement;
        const commentsContainer = document.getElementById('edit-modal-comments-container');
        const newCommentEl = document.getElementById('edit-modal-new-comment') as HTMLInputElement;
        const addCommentBtn = document.getElementById('edit-modal-add-comment-btn');
        const saveBtn = document.getElementById('edit-modal-save-btn');
        
        // Extended UI elements
        const taskIdLabel = document.getElementById('edit-modal-task-id');
        const statusSelect = document.getElementById('edit-modal-task-status') as HTMLSelectElement;
        const milestoneCheckbox = document.getElementById('edit-modal-task-milestone') as HTMLInputElement;
        const startDateInput = document.getElementById('edit-modal-task-startdate') as HTMLInputElement;
        const subtasksContainer = document.getElementById('edit-modal-subtasks-container');
        const addSubtaskBtn = document.getElementById('edit-modal-add-subtask-btn');
        const checklistsContainer = document.getElementById('edit-modal-checklists-container');
        const addChecklistBtn = document.getElementById('edit-modal-add-checklist-btn');
        const depContainer = document.getElementById('edit-modal-dependencies-container');
        const depTypeSelect = document.getElementById('edit-modal-dep-type') as HTMLSelectElement;
        const depTaskSelect = document.getElementById('edit-modal-dep-task') as HTMLSelectElement;
        const addDepBtn = document.getElementById('edit-modal-add-dep-btn');
        const customFieldsContainer = document.getElementById('edit-modal-customfields-container');
        const watchersContainer = document.getElementById('edit-modal-watchers-container');
        const watcherInput = document.getElementById('edit-modal-watcher-input') as HTMLInputElement;
        const addWatcherBtn = document.getElementById('edit-modal-add-watcher-btn');
        
        // Timer elements
        const timerDisplay = document.getElementById('edit-modal-timer-display');
        const timerToggleBtn = document.getElementById('edit-modal-timer-toggle');
        const timerManualBtn = document.getElementById('edit-modal-timer-manual');
        const timeTrackedEl = document.getElementById('edit-modal-time-tracked');
        const timeEstimateText = document.getElementById('edit-modal-time-estimate-text');
        const timeProgressBar = document.getElementById('edit-modal-time-progress-bar');
        const timeEstimateInput = document.getElementById('edit-modal-task-timeestimate') as HTMLInputElement;
        
        const deleteBtn = document.getElementById('edit-modal-delete-btn');

        if (modal && titleEl && tagEl && compEl && assEl && dateEl && descEl && prioEl && ptsEl && cyEl && modEl && collabEl && revEl && linksEl && saveBtn) {
            // Bind base values
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
            collabEl.value = (t.collaborators || []).join(', ');
            revEl.value = (t.reviewers || []).join(', ');
            linksEl.value = (t.externalLinks || []).join(', ');
            
            if (taskIdLabel) taskIdLabel.innerText = t.id;
            if (statusSelect) statusSelect.value = t.status;
            if (milestoneCheckbox) milestoneCheckbox.checked = !!t.isMilestone;
            if (startDateInput) startDateInput.value = t.startDate || "";
            if (timeEstimateInput) timeEstimateInput.value = t.timeEstimate ? (t.timeEstimate / (3600 * 1000)).toString() : "";

            // Delete action
            if (deleteBtn) {
                deleteBtn.onclick = (e) => {
                    e.preventDefault();
                    if (confirm("Permanently delete this task?")) {
                        w.closeEditTaskModal();
                        t.isBinned = true; // Move to bin first or delete?
                        notifyStateChange();
                    }
                };
            }

            // 1. Comments list & Activity logs
            let localComments = [...(t.comments || [])];
            const renderLocalComments = () => {
                if (commentsContainer) {
                    const taskLogs = state.taskLogs.filter(l => l.taskId === t.id);
                    const activity = [
                        ...localComments.map(c => ({ type: 'comment', ...c })),
                        ...taskLogs.map(l => ({ type: 'log', ...l }))
                    ].sort((a, b) => a.timestamp - b.timestamp);

                    if (activity.length === 0) {
                        commentsContainer.innerHTML = `<div class="text-xs text-text-muted italic py-1 pl-1">No comments or activity yet. Start the conversation!</div>`;
                    } else {
                        commentsContainer.innerHTML = activity.map(item => {
                            if (item.type === 'comment') {
                                return `
                                <div class="bg-panel-hover/50 p-2 rounded-lg border border-glass-border/30 text-xs text-left">
                                    <div class="flex justify-between text-[10px] text-text-muted mb-1 font-bold">
                                        <span>${sanitizeHTML(item.author)}</span>
                                        <span>${new Date(item.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div class="text-text-main">${sanitizeHTML(item.text)}</div>
                                </div>
                                `;
                            } else {
                                let logMsg = "";
                                if (item.toStatus === 'created') logMsg = "Task created";
                                else if (item.toStatus === 'edited') logMsg = "Task details edited";
                                else if (item.toStatus === 'archived') logMsg = "Task archived";
                                else if (item.toStatus === 'binned') logMsg = "Task moved to Trash Bin";
                                else if (item.toStatus === 'permanently_deleted') logMsg = "Task permanently deleted";
                                else if (item.fromStatus === 'binned' && item.toStatus === 'active') logMsg = "Task restored from Bin";
                                else if (item.fromStatus === 'archived' && item.toStatus === 'active') logMsg = "Task unarchived";
                                else logMsg = `Moved from ${item.fromStatus} to ${item.toStatus}`;
                                
                                return `
                                <div class="text-[10px] text-text-muted text-center italic py-2 border-b border-glass-border/20 last:border-b-0">
                                    ${logMsg} • ${new Date(item.timestamp).toLocaleString()}
                                </div>
                                `;
                            }
                        }).join('');
                    }
                    commentsContainer.scrollTop = commentsContainer.scrollHeight;
                }
            };
            renderLocalComments();

            if (addCommentBtn && newCommentEl) {
                addCommentBtn.onclick = (e) => {
                    e.preventDefault();
                    const text = newCommentEl.value.trim();
                    if (text) {
                        localComments.push({
                            id: Math.random().toString(36).substring(2),
                            author: state.currentUser || "anonymous@example.com",
                            text,
                            timestamp: Date.now()
                        });
                        newCommentEl.value = "";
                        renderLocalComments();
                    }
                };
            }

            // 2. Subtasks
            let localSubtasks = [...(t.subtasks || [])];
            const renderSubtasks = () => {
                if (subtasksContainer) {
                    if (localSubtasks.length === 0) {
                        subtasksContainer.innerHTML = `<div class="text-[10px] text-text-muted italic">No subtasks defined.</div>`;
                    } else {
                        subtasksContainer.innerHTML = localSubtasks.map((st, idx) => `
                            <div class="flex justify-between items-center bg-background/30 border border-glass-border/20 p-2 rounded-xl text-xs gap-2">
                                <div class="flex items-center gap-2 min-w-0">
                                    <input type="checkbox" ${st.status === 'done' ? 'checked' : ''} 
                                           onchange="window.toggleSubtaskStatus(${idx}, this.checked)" 
                                           class="rounded border-glass-border bg-panel-hover text-primary cursor-pointer shrink-0">
                                    <span class="truncate ${st.status === 'done' ? 'line-through text-text-muted' : 'text-text-main'}">${sanitizeHTML(st.title)}</span>
                                </div>
                                <button onclick="window.deleteSubtask(${idx})" class="text-text-muted hover:text-red-500 transition-colors shrink-0">
                                    ${getIconSVG('trash', 'w-3 h-3')}
                                </button>
                            </div>
                        `).join('');
                    }
                }
            };
            w.toggleSubtaskStatus = (idx: number, checked: boolean) => {
                if (localSubtasks[idx]) {
                    localSubtasks[idx].status = checked ? 'done' : 'progress';
                    localSubtasks[idx].updated = Date.now();
                    renderSubtasks();
                }
            };
            w.deleteSubtask = (idx: number) => {
                localSubtasks.splice(idx, 1);
                renderSubtasks();
            };
            if (addSubtaskBtn) {
                addSubtaskBtn.onclick = (e) => {
                    e.preventDefault();
                    const subName = prompt("Enter subtask title:");
                    if (subName && subName.trim()) {
                        localSubtasks.push({
                            id: 'st-' + Math.random().toString(36).substr(2, 9),
                            projectId: t.projectId,
                            title: subName.trim(),
                            tag: 'Subtask',
                            status: 'backlog',
                            created: Date.now(),
                            updated: Date.now()
                        });
                        renderSubtasks();
                    }
                };
            }
            renderSubtasks();

            // 3. Checklists
            let localChecklists = JSON.parse(JSON.stringify(t.checklists || [])) as typeof t.checklists & any[];
            const renderChecklists = () => {
                if (checklistsContainer) {
                    if (localChecklists.length === 0) {
                        checklistsContainer.innerHTML = `<div class="text-[10px] text-text-muted italic">No checklists created.</div>`;
                    } else {
                        checklistsContainer.innerHTML = localChecklists.map((cl, clIdx) => {
                            const total = cl.items.length;
                            const done = cl.items.filter((i: any) => i.done).length;
                            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                            return `
                            <div class="bg-background/40 border border-glass-border/30 p-3 rounded-xl flex flex-col gap-2">
                                <div class="flex justify-between items-center">
                                    <h5 class="text-xs font-bold text-text-main flex items-center gap-1">${sanitizeHTML(cl.name)} <span class="text-[9px] text-text-muted font-normal">(${done}/${total})</span></h5>
                                    <div class="flex gap-1.5 items-center">
                                        <button onclick="window.addChecklistItem(${clIdx})" class="text-[9px] bg-panel-hover hover:bg-glass-border text-text-main px-1.5 py-0.5 rounded font-semibold cursor-pointer">+ Item</button>
                                        <button onclick="window.deleteChecklist(${clIdx})" class="text-text-muted hover:text-red-500 transition-colors cursor-pointer">
                                            ${getIconSVG('trash', 'w-3 h-3')}
                                        </button>
                                    </div>
                                </div>
                                <div class="w-full bg-panel-hover rounded-full h-1 overflow-hidden">
                                    <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${pct}%"></div>
                                </div>
                                <div class="flex flex-col gap-1.5 mt-1.5">
                                    ${cl.items.map((item: any, itemIdx: number) => `
                                        <div class="flex justify-between items-center text-xs gap-2 pl-1">
                                            <div class="flex items-center gap-2 min-w-0">
                                                <input type="checkbox" ${item.done ? 'checked' : ''} 
                                                       onchange="window.toggleChecklistItem(${clIdx}, ${itemIdx}, this.checked)" 
                                                       class="rounded border-glass-border bg-panel-hover text-emerald-500 cursor-pointer">
                                                <span class="truncate ${item.done ? 'line-through text-text-muted' : 'text-text-main'}">${sanitizeHTML(item.text)}</span>
                                            </div>
                                            <button onclick="window.deleteChecklistItem(${clIdx}, ${itemIdx})" class="text-text-muted hover:text-red-500 transition-colors shrink-0 cursor-pointer">
                                                ${getIconSVG('close', 'w-3 h-3')}
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            `;
                        }).join('');
                    }
                }
            };
            w.deleteChecklist = (clIdx: number) => {
                localChecklists.splice(clIdx, 1);
                renderChecklists();
            };
            w.addChecklistItem = (clIdx: number) => {
                const text = prompt("Enter checklist item text:");
                if (text && text.trim()) {
                    localChecklists[clIdx].items.push({
                        id: 'cli-' + Math.random().toString(36).substr(2, 9),
                        text: text.trim(),
                        done: false
                    });
                    renderChecklists();
                }
            };
            w.toggleChecklistItem = (clIdx: number, itemIdx: number, checked: boolean) => {
                if (localChecklists[clIdx] && localChecklists[clIdx].items[itemIdx]) {
                    localChecklists[clIdx].items[itemIdx].done = checked;
                    renderChecklists();
                }
            };
            w.deleteChecklistItem = (clIdx: number, itemIdx: number) => {
                localChecklists[clIdx].items.splice(itemIdx, 1);
                renderChecklists();
            };
            if (addChecklistBtn) {
                addChecklistBtn.onclick = (e) => {
                    e.preventDefault();
                    const clName = prompt("Enter checklist name:");
                    if (clName && clName.trim()) {
                        localChecklists.push({
                            id: 'cl-' + Math.random().toString(36).substr(2, 9),
                            name: clName.trim(),
                            items: []
                        });
                        renderChecklists();
                    }
                };
            }
            renderChecklists();

            // 4. Dependencies
            let localDeps = [...(t.dependencies || [])];
            const renderDeps = () => {
                if (depContainer) {
                    if (localDeps.length === 0) {
                        depContainer.innerHTML = `<div class="text-[10px] text-text-muted italic">No dependencies defined.</div>`;
                    } else {
                        depContainer.innerHTML = localDeps.map((dep, idx) => {
                            const otherTask = state.kanbanState.find(x => x.id === dep.taskId);
                            const label = otherTask ? otherTask.title : 'Unknown Task';
                            const typeLabel = dep.type === 'blocks' ? 'Blocks' : (dep.type === 'blocked-by' ? 'Blocked By' : 'Waiting On');
                            const typeColor = dep.type === 'blocks' ? 'text-indigo-400' : 'text-orange-400';
                            return `
                            <div class="flex justify-between items-center bg-panel-hover/30 p-2 rounded-lg gap-2 text-[10px]">
                                <div class="min-w-0">
                                    <span class="font-bold ${typeColor} uppercase mr-1">${typeLabel}:</span>
                                    <span class="truncate text-text-main" title="${sanitizeHTML(label)}">${sanitizeHTML(label)}</span>
                                </div>
                                <button onclick="window.deleteDependency(${idx})" class="text-text-muted hover:text-red-500 transition-colors shrink-0 cursor-pointer">
                                    ${getIconSVG('close', 'w-3 h-3')}
                                </button>
                            </div>
                            `;
                        }).join('');
                    }
                }
            };
            w.deleteDependency = (idx: number) => {
                localDeps.splice(idx, 1);
                renderDeps();
            };
            if (depTaskSelect) {
                const otherTasks = state.kanbanState.filter(x => x.id !== taskId);
                depTaskSelect.innerHTML = `<option value="">Select Task...</option>` +
                    otherTasks.map(ot => `<option value="${ot.id}">${sanitizeHTML(ot.title)}</option>`).join('');
            }
            if (addDepBtn && depTypeSelect && depTaskSelect) {
                addDepBtn.onclick = (e) => {
                    e.preventDefault();
                    const depTaskId = depTaskSelect.value;
                    const depType = depTypeSelect.value as any;
                    if (depTaskId && depType) {
                        if (!localDeps.some(d => d.taskId === depTaskId && d.type === depType)) {
                            localDeps.push({ taskId: depTaskId, type: depType });
                            renderDeps();
                        }
                        depTaskSelect.value = "";
                    }
                };
            }
            renderDeps();

            // 5. Custom Fields
            let localCustomFields = [...(t.customFields || [])];
            const TASK_CUSTOM_FIELDS = [
                { id: 'cf-platform', name: 'Platform', type: 'select', options: ['YouTube', 'Instagram', 'TikTok', 'X', 'Blog'] },
                { id: 'cf-roi', name: 'Expected ROI (%)', type: 'number' },
                { id: 'cf-stage', name: 'Creative Stage', type: 'select', options: ['Concept', 'Filming', 'Editing', 'Approved'] }
            ];
            const renderCustomFields = () => {
                if (customFieldsContainer) {
                    customFieldsContainer.innerHTML = TASK_CUSTOM_FIELDS.map(cf => {
                        const activeValObj = localCustomFields.find(f => f.fieldId === cf.id);
                        const val = activeValObj ? activeValObj.value : '';
                        
                        if (cf.type === 'select') {
                            const optionsHTML = cf.options!.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('');
                            return `
                            <div>
                                <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">${cf.name}</label>
                                <select id="custom-field-${cf.id}" onchange="window.updateLocalCustomField('${cf.id}', this.value)" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none cursor-pointer">
                                    <option value="">None</option>
                                    ${optionsHTML}
                                </select>
                            </div>
                            `;
                        } else {
                            return `
                            <div>
                                <label class="block text-[10px] font-bold text-text-muted uppercase mb-1">${cf.name}</label>
                                <input id="custom-field-${cf.id}" type="number" value="${val}" onchange="window.updateLocalCustomField('${cf.id}', this.value)" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-text-main focus:outline-none" placeholder="Enter number...">
                            </div>
                            `;
                        }
                    }).join('');
                }
            };
            w.updateLocalCustomField = (fieldId: string, val: any) => {
                const idx = localCustomFields.findIndex(f => f.fieldId === fieldId);
                if (idx !== -1) {
                    const item = localCustomFields[idx];
                    if (item) {
                        item.value = val;
                    }
                } else {
                    localCustomFields.push({ fieldId, value: val });
                }
            };
            renderCustomFields();

            // 6. Watchers
            let localWatchers = [...(t.watchers || [])];
            const renderWatchers = () => {
                if (watchersContainer) {
                    if (localWatchers.length === 0) {
                        watchersContainer.innerHTML = `<span class="text-[10px] text-text-muted italic">No watchers.</span>`;
                    } else {
                        watchersContainer.innerHTML = localWatchers.map((wat, idx) => `
                            <span class="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-medium">
                                <span>${sanitizeHTML(wat)}</span>
                                <button onclick="window.deleteWatcher(${idx})" class="hover:text-red-400 font-bold shrink-0 cursor-pointer">×</button>
                            </span>
                        `).join('');
                    }
                }
            };
            w.deleteWatcher = (idx: number) => {
                localWatchers.splice(idx, 1);
                renderWatchers();
            };
            if (addWatcherBtn && watcherInput) {
                addWatcherBtn.onclick = (e) => {
                    e.preventDefault();
                    const wName = watcherInput.value.trim();
                    if (wName && !localWatchers.includes(wName)) {
                        localWatchers.push(wName);
                        renderWatchers();
                    }
                    watcherInput.value = "";
                };
            }
            renderWatchers();

            // 7. Time tracking widget stopwatch
            let localTimeTracked = t.timeTracked || 0;
            let currentTimerVal = 0;
            let timerInterval: any = null;
            let isRunning = false;

            const formatDuration = (ms: number): string => {
                const totalSec = Math.floor(ms / 1000);
                const hrs = Math.floor(totalSec / 3600);
                const mins = Math.floor((totalSec % 3600) / 60);
                const secs = totalSec % 60;
                return [hrs, mins, secs].map(v => v.toString().padStart(2, '0')).join(':');
            };

            const updateTimeUI = () => {
                if (timerDisplay) {
                    timerDisplay.innerText = formatDuration(currentTimerVal);
                }
                if (timeTrackedEl) {
                    timeTrackedEl.innerText = `${(localTimeTracked / (3600 * 1000)).toFixed(2)}h`;
                }
                const estimateHrs = parseFloat(timeEstimateInput?.value || "0");
                if (timeEstimateText) {
                    timeEstimateText.innerText = estimateHrs > 0 ? `${estimateHrs}h` : 'None';
                }
                if (timeProgressBar) {
                    const estMs = estimateHrs * 3600 * 1000;
                    const pct = estMs > 0 ? Math.min(100, Math.round((localTimeTracked / estMs) * 100)) : 0;
                    timeProgressBar.style.width = `${pct}%`;
                }
            };
            updateTimeUI();

            if (timerToggleBtn) {
                timerToggleBtn.onclick = (e) => {
                    e.preventDefault();
                    if (!isRunning) {
                        isRunning = true;
                        timerToggleBtn.innerText = "Stop";
                        timerToggleBtn.classList.remove('bg-emerald-500', 'hover:bg-emerald-600');
                        timerToggleBtn.classList.add('bg-red-500', 'hover:bg-red-600');
                        const start = Date.now();
                        timerInterval = setInterval(() => {
                            currentTimerVal = Date.now() - start;
                            if (timerDisplay) {
                                timerDisplay.innerText = formatDuration(currentTimerVal);
                            }
                        }, 1000);
                    } else {
                        isRunning = false;
                        clearInterval(timerInterval);
                        timerToggleBtn.innerText = "Start";
                        timerToggleBtn.classList.remove('bg-red-500', 'hover:bg-red-600');
                        timerToggleBtn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');
                        
                        // Add time track
                        localTimeTracked += currentTimerVal;
                        
                        // Save a time log entry
                        const currentProjectName = state.projects.find(p => p.id === t.projectId)?.name || 'Default Project';
                        state.timeLogs.push({
                            id: 'tl-' + Math.random().toString(36).substr(2, 9),
                            projectId: t.projectId,
                            taskId: t.id,
                            taskTitle: t.title,
                            projectName: currentProjectName,
                            durationMs: currentTimerVal,
                            timestamp: Date.now(),
                            billable: true,
                            userId: state.currentUser,
                            userName: state.currentUser || "anonymous"
                        });
                        currentTimerVal = 0;
                        updateTimeUI();
                    }
                };
            }

            if (timerManualBtn) {
                timerManualBtn.onclick = (e) => {
                    e.preventDefault();
                    const hoursStr = prompt("Enter hours to log manually (e.g. 1.5):");
                    const hours = parseFloat(hoursStr || "0");
                    if (hours > 0) {
                        const ms = hours * 3600 * 1000;
                        localTimeTracked += ms;
                        
                        const currentProjectName = state.projects.find(p => p.id === t.projectId)?.name || 'Default Project';
                        state.timeLogs.push({
                            id: 'tl-' + Math.random().toString(36).substr(2, 9),
                            projectId: t.projectId,
                            taskId: t.id,
                            taskTitle: t.title,
                            projectName: currentProjectName,
                            durationMs: ms,
                            timestamp: Date.now(),
                            billable: true
                        });
                        updateTimeUI();
                    }
                };
            }

            // Show modal
            const app = document.getElementById('app');
            if (app) app.appendChild(modal);
            modal.classList.remove('hidden');

            const saveHandler = () => {
                if (isRunning) {
                    clearInterval(timerInterval);
                }
                const collaborators = collabEl.value.split(',').map(s => s.trim()).filter(Boolean);
                const reviewers = revEl.value.split(',').map(s => s.trim()).filter(Boolean);
                const externalLinks = linksEl.value.split(',').map(s => s.trim()).filter(Boolean);
                
                const estHrs = parseFloat(timeEstimateInput?.value || "0");
                const timeEstimate = estHrs > 0 ? estHrs * 3600 * 1000 : undefined;
                const isMilestone = milestoneCheckbox?.checked || false;
                const startDate = startDateInput?.value || undefined;

                updateTask(
                    taskId,
                    titleEl.value,
                    tagEl.value,
                    (statusSelect ? statusSelect.value : t.status) as any,
                    compEl.value as any,
                    assEl.value,
                    descEl.value,
                    dateEl.value,
                    undefined,
                    prioEl.value as any,
                    parseInt(ptsEl.value) || 0,
                    cyEl.value || undefined,
                    modEl.value || undefined,
                    collaborators,
                    reviewers,
                    externalLinks,
                    localComments
                );

                // Now also update the new fields! We can do it by finding the task and setting properties directly:
                const savedTask = state.kanbanState.find(x => x.id === taskId);
                if (savedTask) {
                    savedTask.subtasks = localSubtasks;
                    savedTask.checklists = localChecklists;
                    savedTask.dependencies = localDeps;
                    savedTask.customFields = localCustomFields;
                    savedTask.watchers = localWatchers;
                    savedTask.timeTracked = localTimeTracked;
                    savedTask.timeEstimate = timeEstimate;
                    savedTask.isMilestone = isMilestone;
                    savedTask.startDate = startDate;
                    notifyStateChange(); // Save to master and localStorage
                }
                w.closeEditTaskModal();
            };

            saveBtn.onclick = saveHandler;
            const saveBtnFooter = document.getElementById('edit-modal-save-btn-footer');
            if (saveBtnFooter) saveBtnFooter.onclick = saveHandler;
        }
    };

    w.closeEditTaskModal = () => {
        const modal = document.getElementById('edit-task-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    };
}
