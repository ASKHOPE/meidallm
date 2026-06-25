import { state, addCycle, deleteCycle, addModule, deleteModule } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderCyclesView(pid?: string): string {
    const activePid = pid || state.currentProject;
    if (!activePid) {
        return `<div class="fade-in text-text-muted text-center py-12">Please select an active project to view Cycles & Modules.</div>`;
    }

    const p = state.projects.find(x => x.id === activePid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const cycles = state.cycles.filter(c => c.projectId === activePid);
    const modules = state.modules.filter(m => m.projectId === activePid);
    const tasks = state.kanbanState.filter(t => t.projectId === activePid && !t.isBinned);

    // Build Sprint Calendar grid for June 2026 showing cycles
    const daysInMonth = 30;
    let calendarCellsHTML = "";
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDateStr = `2026-06-${day.toString().padStart(2, '0')}`;
        
        // Find which cycles overlap this day
        const overlappingCycles = cycles.filter(c => {
            return currentDateStr >= c.startDate && currentDateStr <= c.endDate;
        });

        const cyclesHTML = overlappingCycles.map(c => {
            const isCompleted = c.status === 'completed';
            const colorClass = isCompleted ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            return `
            <div class="border rounded px-1 py-0.5 text-[8px] font-bold leading-tight truncate flex items-center gap-0.5 ${colorClass}" title="${sanitizeHTML(c.name)}">
                ${getIconSVG('project-cycles', 'w-2 h-2 shrink-0')}
                <span>${sanitizeHTML(c.name)}</span>
            </div>
            `;
        }).join('');

        calendarCellsHTML += `
        <div class="min-h-[70px] border border-text-main/10 bg-panel-hover/10 p-1.5 rounded-xl flex flex-col gap-1">
            <span class="text-[10px] font-bold text-text-muted">${day}</span>
            <div class="flex flex-col gap-0.5 overflow-y-auto max-h-[45px]">
                ${cyclesHTML}
            </div>
        </div>
        `;
    }

    return `
    <div class="fade-in flex flex-col gap-8 text-text-main">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/15 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">${sanitizeHTML(p.name)} - Cycles & Epics</h2>
                <p class="text-xs text-text-muted">Track velocity, time-boxed sprints (Cycles), and logical feature milestones (Modules).</p>
            </div>
            <div class="flex gap-2.5">
                <button onclick="window.showAddCycleModal()" class="px-4 py-2.5 bg-text-main text-background hover:bg-text-main/90 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm">+ New Cycle</button>
                <button onclick="window.showAddModuleModal()" class="px-4 py-2.5 bg-background border border-text-main/20 text-text-main hover:bg-text-main/5 font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-sm">+ New Epic</button>
            </div>
        </div>

        <!-- Explainer Section: What are Sprints & Cycles? -->
        <div class="bg-panel-hover/20 border border-text-main/10 rounded-2xl p-5 flex flex-col gap-2">
            <h3 class="font-bold text-sm font-outfit flex items-center gap-2">
                ${getIconSVG('idea-canvas', 'w-4 h-4 text-amber-500 shrink-0')} What are Cycles & Sprints?
            </h3>
            <p class="text-xs text-text-muted leading-relaxed">
                <strong>Sprints (Cycles)</strong> are time-boxed iterations (usually 2 weeks) where team members commit to finishing a specific list of tasks. This keeps focus high and supports iterative development.
                <strong>Epics & Modules</strong> organize those tasks into logical feature areas or milestones, allowing stakeholders to track broad initiatives while developers focus on daily tasks.
            </p>
        </div>

        <!-- Sprint Timeline Calendar -->
        <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="font-bold text-sm font-outfit">Sprint Timeline Calendar</h3>
                    <p class="text-[10px] text-text-muted">Visualizing active sprint windows for June 2026.</p>
                </div>
                <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider bg-panel-hover px-2.5 py-1 rounded border border-text-main/10">June 2026</span>
            </div>
            
            <!-- Calendar Grid Headers -->
            <div class="grid grid-cols-7 gap-2 mb-1.5 text-center text-[9px] font-bold text-text-muted uppercase tracking-wider">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
            </div>
            
            <div class="grid grid-cols-7 gap-2">
                ${calendarCellsHTML}
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <!-- Cycles Section -->
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-text-main font-outfit">Sprints & Cycles</h3>
                    <span class="text-xs text-text-muted font-mono">${cycles.length} Cycles</span>
                </div>
                <div class="flex flex-col gap-4">
                    ${cycles.map(cy => {
                        const cycleTasks = tasks.filter(t => t.cycleId === cy.id);
                        const doneTasks = cycleTasks.filter(t => t.status === 'done');
                        const totalPoints = cycleTasks.reduce((sum, t) => sum + (t.points || 0), 0);
                        const donePoints = doneTasks.reduce((sum, t) => sum + (t.points || 0), 0);
                        const velocityPct = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0;

                        return `
                        <div class="bg-background border border-text-main/15 rounded-2xl p-5 hover:border-text-main/55 transition-all flex flex-col gap-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="flex items-center gap-2">
                                        ${getIconSVG('project-cycles', 'w-4 h-4 text-text-muted shrink-0')}
                                        <h4 class="font-bold text-text-main text-sm leading-none">${sanitizeHTML(cy.name)}</h4>
                                        <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                                            cy.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                            cy.status === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                            'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                        }">${cy.status}</span>
                                    </div>
                                    <span class="text-[10px] text-text-muted block mt-1.5">${cy.startDate} to ${cy.endDate}</span>
                                </div>
                                <button onclick="window.deleteCyclePrompt('${cy.id}')" class="text-text-muted hover:text-rose-500 text-xs font-bold cursor-pointer">
                                    ${getIconSVG('close', 'w-3.5 h-3.5')}
                                </button>
                            </div>

                            <!-- Progress Bar -->
                            <div class="flex flex-col gap-1.5">
                                <div class="flex justify-between items-center text-[10px] text-text-muted">
                                    <span>Cycle Velocity</span>
                                    <span class="font-bold text-text-main">${donePoints}/${totalPoints} SP (${velocityPct}%)</span>
                                </div>
                                <div class="w-full h-2 bg-panel-hover rounded-full overflow-hidden">
                                    <div class="h-full bg-text-main rounded-full transition-all duration-500" style="width: ${velocityPct}%"></div>
                                </div>
                                <div class="flex justify-between items-center text-[9px] text-text-muted pt-1">
                                    <span>${cycleTasks.length} tasks assigned</span>
                                    <span>${doneTasks.length} completed</span>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                    ${cycles.length === 0 ? `
                        <div class="text-center text-text-muted text-xs py-12 border border-dashed border-text-main/15 rounded-2xl bg-panel-hover/10">
                            No cycles defined yet. Add one above to start planning sprints!
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Epics / Modules Section -->
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-text-main font-outfit">Epics & Modules</h3>
                    <span class="text-xs text-text-muted font-mono">${modules.length} Modules</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${modules.map(mod => {
                        const modTasks = tasks.filter(t => t.moduleId === mod.id);
                        const doneTasks = modTasks.filter(t => t.status === 'done');
                        const modPct = modTasks.length > 0 ? Math.round((doneTasks.length / modTasks.length) * 100) : 0;

                        return `
                        <div class="bg-background border border-text-main/15 rounded-2xl p-5 hover:border-text-main/55 transition-all flex flex-col justify-between gap-4">
                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center gap-1.5">
                                        ${getIconSVG('project-goals', 'w-3.5 h-3.5 text-text-muted shrink-0')}
                                        <h4 class="font-bold text-text-main text-xs leading-none truncate max-w-[120px]">${sanitizeHTML(mod.name)}</h4>
                                    </div>
                                    <button onclick="window.deleteModulePrompt('${mod.id}')" class="text-text-muted hover:text-rose-500 text-[10px] font-bold cursor-pointer">
                                        ${getIconSVG('close', 'w-3 h-3')}
                                    </button>
                                </div>
                                <p class="text-[10px] text-text-muted leading-relaxed line-clamp-2 h-7">${sanitizeHTML(mod.description)}</p>
                            </div>

                            <div class="border-t border-text-main/10 pt-3 flex flex-col gap-2">
                                <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-text-muted">Progress</span>
                                    <span class="text-text-main font-semibold">${doneTasks.length}/${modTasks.length} Tasks (${modPct}%)</span>
                                </div>
                                <div class="w-full h-1.5 bg-panel-hover rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${modPct}%"></div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                    ${modules.length === 0 ? `
                        <div class="col-span-2 text-center text-text-muted text-xs py-12 border border-dashed border-text-main/15 rounded-2xl bg-panel-hover/10">
                            No epics/modules created yet. Add one above to organize feature areas!
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>

    <!-- Add Cycle Modal -->
    <div id="add-cycle-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/20 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-text-main font-outfit">Create New Cycle</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Cycle / Sprint Name</label>
                <input id="modal-cycle-name" type="text" placeholder="e.g. Cycle 4: Optimization" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Start Date</label>
                    <input id="modal-cycle-start" type="date" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main cursor-pointer">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">End Date</label>
                    <input id="modal-cycle-end" type="date" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main cursor-pointer">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Sprint Status</label>
                <select id="modal-cycle-status" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main cursor-pointer">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active Now</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddCycleModal()" class="px-3.5 py-1.5 bg-background border border-text-main/20 rounded-xl text-xs font-medium hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitCycleForm('${activePid}')" class="px-4 py-1.5 bg-text-main text-background rounded-xl text-xs font-semibold hover:bg-text-main/90 transition-colors cursor-pointer">Create Cycle</button>
            </div>
        </div>
    </div>

    <!-- Add Module Modal -->
    <div id="add-module-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/20 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-text-main font-outfit">Create New Epic</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Epic / Module Name</label>
                <input id="modal-module-name" type="text" placeholder="e.g. User Authentication" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Brief Description</label>
                <textarea id="modal-module-desc" placeholder="What are the goals of this feature epic?" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main resize-none h-20 leading-relaxed"></textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Status</label>
                <select id="modal-module-status" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main cursor-pointer">
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done / Released</option>
                </select>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddModuleModal()" class="px-3.5 py-1.5 bg-background border border-text-main/20 rounded-xl text-xs font-medium hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitModuleForm('${activePid}')" class="px-4 py-1.5 bg-text-main text-background rounded-xl text-xs font-semibold hover:bg-text-main/90 transition-colors cursor-pointer">Create Epic</button>
            </div>
        </div>
    </div>
    `;
}
