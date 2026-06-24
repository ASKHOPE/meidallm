import { state, updateTask } from "../state";
import { sanitizeHTML, formatTime, formatExactTime } from "../utils";

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

    const projectLogs = state.taskLogs.filter(l => l.projectId === pid).reverse();

    const cols = [
        { key: 'backlog' as const, label: 'Backlog' },
        { key: 'progress' as const, label: 'In Progress' },
        { key: 'review' as const, label: 'Review' },
        { key: 'done' as const, label: 'Done' }
    ];

    return `
    <div class="fade-in flex flex-col xl:flex-row gap-6 h-full min-h-[500px]">
        <!-- Board Columns -->
        <div class="flex-grow flex flex-col">
            <!-- Kanban Header and Filter Tabs -->
            <div class="flex flex-col gap-4 mb-6">
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} Board</h2>
                        <p class="text-xs text-text-muted">Drag tasks to change their pipeline phase. Click a card to view detailed notes & records.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="relative w-48">
                            <input type="text" id="kanban-search-input" oninput="window.filterKanbanTasks()" placeholder="Search tasks..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                            <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">🔍</span>
                        </div>
                        <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                        <button onclick="window.showAddTaskModal()" class="px-4 py-2 bg-primary rounded-xl text-xs font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Task</button>
                    </div>
                </div>

                <!-- Kanban Filter Status Tabs -->
                <div class="flex gap-4 border-b border-glass-border/30 pb-2 mt-2">
                    <button onclick="window.setKanbanFilter('active')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'active' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Active Tasks</button>
                    <button onclick="window.setKanbanFilter('archived')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'archived' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Archived</button>
                    <button onclick="window.setKanbanFilter('bin')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'bin' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Bin / Trash</button>
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
                            <h3 class="font-medium text-white text-sm">${c.label}</h3>
                            <span class="bg-panel-hover text-text-muted px-2 py-0.5 rounded text-[10px]">${tasks.length}</span>
                        </div>
                        <div class="flex flex-col gap-3 flex-grow overflow-y-auto min-h-[300px]">
                            ${tasks.map(t => {
                                let actionHTML = "";
                                if (filter === 'active') {
                                    actionHTML = `
                                    <button onclick="event.stopPropagation(); window.archiveTaskToggle('${t.id}', true)" class="text-text-muted hover:text-amber-400 cursor-pointer" title="Archive">📦</button>
                                    <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', true)" class="text-text-muted hover:text-rose-500 cursor-pointer" title="Move to Bin">🗑️</button>
                                    `;
                                } else if (filter === 'archived') {
                                    actionHTML = `
                                    <button onclick="event.stopPropagation(); window.archiveTaskToggle('${t.id}', false)" class="text-text-muted hover:text-emerald-400 cursor-pointer" title="Restore">📂</button>
                                    <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', true)" class="text-text-muted hover:text-rose-500 cursor-pointer" title="Move to Bin">🗑️</button>
                                    `;
                                } else if (filter === 'bin') {
                                    actionHTML = `
                                    <button onclick="event.stopPropagation(); window.binTaskToggle('${t.id}', false)" class="text-text-muted hover:text-emerald-400 cursor-pointer" title="Restore">🔄</button>
                                    <button onclick="event.stopPropagation(); window.deleteTask('${t.id}')" class="text-text-muted hover:text-rose-500 cursor-pointer font-bold" title="Delete Permanently">✕</button>
                                    `;
                                }

                                return `
                                <div draggable="true" 
                                     ondragstart="window.handleDragStart(event, '${t.id}')"
                                     onclick="window.openEditTaskModal('${t.id}')"
                                     class="kanban-col-item bg-glass-bg border border-glass-border hover:border-primary p-4 rounded-xl cursor-pointer hover:shadow-lg transition-all select-none group/kanban-item flex flex-col justify-between"
                                     data-title="${sanitizeHTML(t.title)}"
                                     data-tag="${sanitizeHTML(t.tag)}">
                                    <div>
                                        <div class="flex justify-between items-start mb-2">
                                            <span class="px-2 py-0.5 text-[9px] font-semibold bg-panel-hover text-text-muted rounded">${sanitizeHTML(t.tag)}</span>
                                            <div class="flex gap-2 opacity-0 group-hover/kanban-item:opacity-100 transition-opacity">
                                                ${actionHTML}
                                            </div>
                                        </div>
                                        <h4 class="font-medium text-white mb-3 text-xs leading-snug">${sanitizeHTML(t.title)}</h4>
                                    </div>
                                    
                                    <div class="border-t border-glass-border/30 pt-2 mt-2 flex flex-col gap-1.5">
                                        <!-- Task attributes row -->
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            ${t.complexity ? `
                                            <span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider ${
                                                t.complexity === 'critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                                t.complexity === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                t.complexity === 'medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                            }">${t.complexity}</span>` : ''}
                                            ${t.priority && t.priority !== 'none' ? `
                                            <span class="px-1.5 py-0.5 text-[8px] font-semibold rounded uppercase tracking-wider ${
                                                t.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                t.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                                t.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                                'bg-green-500/10 text-green-400 border border-green-500/20'
                                            }">⚠️ ${t.priority}</span>` : ''}
                                            ${t.points ? `<span class="px-1.5 py-0.5 text-[8px] font-semibold rounded bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Estimation Story Points">🎯 ${t.points} SP</span>` : ''}
                                            ${t.assignee ? `<span class="text-[9px] text-primary font-medium flex items-center gap-0.5">👤 ${sanitizeHTML(t.assignee)}</span>` : ''}
                                            ${t.dueDate ? `<span class="text-[9px] text-text-muted flex items-center gap-0.5">📅 ${t.dueDate}</span>` : ''}
                                        </div>
                                        <div class="text-[8px] text-text-muted flex justify-between pt-1 opacity-60">
                                            <span>Created ${formatTime(t.created)}</span>
                                        </div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                            ${tasks.length === 0 ? `
                                <div class="flex-grow flex items-center justify-center border-2 border-dashed border-glass-border/30 rounded-xl p-8 text-center text-[10px] text-text-muted">
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
                    <div class="border-l-2 border-primary pl-4 py-1 relative">
                        <div class="w-2 h-2 rounded-full bg-primary absolute -left-[5px] top-2"></div>
                        <div class="text-xs text-text-muted mb-0.5 flex justify-between">
                            <span>${formatExactTime(l.timestamp)}</span>
                            <span>${formatTime(l.timestamp)}</span>
                        </div>
                        <p class="text-xs text-white leading-normal">
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
            <h3 class="text-xl font-semibold text-white">Add Pipeline Task</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Task Title</label>
                <input id="modal-task-title" type="text" maxlength="80" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="Enter task name...">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Tag</label>
                <input id="modal-task-tag" type="text" maxlength="20" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="e.g. Marketing, DevOps, Design">
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Priority</label>
                    <select id="modal-task-priority" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Story Points</label>
                    <input id="modal-task-points" type="number" min="0" max="100" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="0">
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitTaskForm('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">Create Task</button>
            </div>
        </div>
    </div>

    <!-- Edit Task Details Modal -->
    <div id="edit-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 overflow-y-auto max-h-[90vh]">
            <h3 class="text-xl font-semibold text-white font-outfit">Task Details & Records</h3>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Title</label>
                    <input id="edit-modal-task-title" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Tag / Phase</label>
                    <input id="edit-modal-task-tag" type="text" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Complexity</label>
                    <select id="edit-modal-task-complexity" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Assignee</label>
                    <input id="edit-modal-task-assignee" type="text" placeholder="Assignee Name" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Due Date</label>
                    <input id="edit-modal-task-duedate" type="date" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Priority</label>
                    <select id="edit-modal-task-priority" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Story Points</label>
                    <input id="edit-modal-task-points" type="number" min="0" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
                </div>
            </div>

            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Detailed Description & Notes</label>
                <textarea id="edit-modal-task-description" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-xs focus:outline-none focus:border-primary resize-none h-28 leading-relaxed" placeholder="Type records, reference assets, or detailed action plans here..."></textarea>
            </div>

            <div class="flex justify-end gap-2 mt-2 border-t border-glass-border/30 pt-3">
                <button onclick="window.closeEditTaskModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button id="edit-modal-save-btn" class="px-5 py-2 bg-primary rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">Save Changes</button>
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

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
        const saveBtn = document.getElementById('edit-modal-save-btn');

        if (modal && titleEl && tagEl && compEl && assEl && dateEl && descEl && prioEl && ptsEl && saveBtn) {
            titleEl.value = t.title || "";
            tagEl.value = t.tag || "";
            compEl.value = t.complexity || "low";
            assEl.value = t.assignee || "";
            dateEl.value = t.dueDate || "";
            descEl.value = t.description || "";
            prioEl.value = t.priority || "none";
            ptsEl.value = (t.points !== undefined) ? t.points.toString() : "0";

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
                    parseInt(ptsEl.value) || 0
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
