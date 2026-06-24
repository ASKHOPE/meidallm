import { state } from "../state";
import { sanitizeHTML, formatTime, formatExactTime } from "../utils";

export function renderKanbanView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;
    
    state.currentProject = p.id;
    
    const projectTasks = state.kanbanState.filter(t => t.projectId === pid);
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
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} Board</h2>
                    <p class="text-xs text-text-muted">Drag tasks to change their pipeline phase.</p>
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
                            ${tasks.map(t => `
                                <div draggable="true" 
                                     ondragstart="window.handleDragStart(event, '${t.id}')"
                                     class="kanban-col-item bg-glass-bg border border-glass-border hover:border-primary p-4 rounded-xl cursor-grab active:cursor-grabbing transition-all select-none"
                                     data-title="${sanitizeHTML(t.title)}"
                                     data-tag="${sanitizeHTML(t.tag)}">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="px-2 py-0.5 text-[9px] font-semibold bg-panel-hover text-text-muted rounded">${sanitizeHTML(t.tag)}</span>
                                        <button onclick="window.deleteTask('${t.id}')" class="text-text-muted hover:text-rose-500 text-xs cursor-pointer">✕</button>
                                    </div>
                                    <h4 class="font-medium text-white mb-3 text-xs leading-snug">${sanitizeHTML(t.title)}</h4>
                                    <div class="text-[9px] text-text-muted flex flex-col gap-0.5 border-t border-glass-border/50 pt-2 mt-2">
                                        <div>📅 Created: ${formatTime(t.created)}</div>
                                        <div>🔄 Updated: ${formatTime(t.updated)}</div>
                                    </div>
                                </div>
                            `).join('')}
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
