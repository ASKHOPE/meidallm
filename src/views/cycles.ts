import { state, addCycle, deleteCycle, addModule, deleteModule } from "../state";
import { sanitizeHTML } from "../utils";

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

    return `
    <div class="fade-in flex flex-col gap-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-panel-hover/30 border border-glass-border/30 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} - Cycles & Epics</h2>
                <p class="text-xs text-text-muted">Track velocity, time-boxed sprints (Cycles), and logical feature milestones (Modules).</p>
            </div>
            <div class="flex gap-2.5">
                <button onclick="window.showAddCycleModal()" class="px-4 py-2 bg-primary text-white font-medium text-xs rounded-xl hover:bg-indigo-600 transition-colors cursor-pointer">+ New Cycle</button>
                <button onclick="window.showAddModuleModal()" class="px-4 py-2 bg-panel-hover border border-glass-border text-white font-medium text-xs rounded-xl hover:bg-glass-border transition-colors cursor-pointer">+ New Epic</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <!-- Cycles Section -->
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-white font-outfit">Sprints & Cycles</h3>
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
                        <div class="bg-glass-bg border border-glass-border rounded-2xl p-5 hover:border-primary/50 transition-all flex flex-col gap-4">
                            <div class="flex justify-between items-start">
                                <div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs">⚡</span>
                                        <h4 class="font-bold text-white text-sm leading-none">${sanitizeHTML(cy.name)}</h4>
                                        <span class="text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                                            cy.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            cy.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                            'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                        }">${cy.status}</span>
                                    </div>
                                    <span class="text-[10px] text-text-muted block mt-1.5">${cy.startDate} to ${cy.endDate}</span>
                                </div>
                                <button onclick="window.deleteCyclePrompt('${cy.id}')" class="text-text-muted hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
                            </div>

                            <!-- Progress Bar -->
                            <div class="flex flex-col gap-1.5">
                                <div class="flex justify-between items-center text-[10px] text-text-muted">
                                    <span>Cycle Velocity</span>
                                    <span class="font-bold text-white">${donePoints}/${totalPoints} SP (${velocityPct}%)</span>
                                </div>
                                <div class="w-full h-2 bg-panel-hover rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-500" style="width: ${velocityPct}%"></div>
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
                        <div class="text-center text-text-muted text-xs py-12 border border-dashed border-glass-border rounded-2xl bg-glass-bg/5">
                            No cycles defined yet. Add one above to start planning sprints!
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Epics / Modules Section -->
            <div class="flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-semibold text-white font-outfit">Epics & Modules</h3>
                    <span class="text-xs text-text-muted font-mono">${modules.length} Modules</span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${modules.map(mod => {
                        const modTasks = tasks.filter(t => t.moduleId === mod.id);
                        const doneTasks = modTasks.filter(t => t.status === 'done');
                        const modPct = modTasks.length > 0 ? Math.round((doneTasks.length / modTasks.length) * 100) : 0;

                        return `
                        <div class="bg-glass-bg border border-glass-border rounded-2xl p-5 hover:border-primary/50 transition-all flex flex-col justify-between gap-4">
                            <div class="flex flex-col gap-2">
                                <div class="flex justify-between items-start">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs">🎯</span>
                                        <h4 class="font-bold text-white text-xs leading-none truncate max-w-[120px]">${sanitizeHTML(mod.name)}</h4>
                                    </div>
                                    <button onclick="window.deleteModulePrompt('${mod.id}')" class="text-text-muted hover:text-rose-500 text-[10px] font-bold cursor-pointer">✕</button>
                                </div>
                                <p class="text-[10px] text-text-muted leading-relaxed line-clamp-2 h-7">${sanitizeHTML(mod.description)}</p>
                            </div>

                            <div class="border-t border-glass-border/30 pt-3 flex flex-col gap-2">
                                <div class="flex justify-between items-center text-[10px]">
                                    <span class="text-text-muted">Progress</span>
                                    <span class="text-white font-semibold">${doneTasks.length}/${modTasks.length} Tasks (${modPct}%)</span>
                                </div>
                                <div class="w-full h-1.5 bg-panel-hover rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width: ${modPct}%"></div>
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                    ${modules.length === 0 ? `
                        <div class="col-span-2 text-center text-text-muted text-xs py-12 border border-dashed border-glass-border rounded-2xl bg-glass-bg/5">
                            No epics/modules created yet. Add one above to organize feature areas!
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    </div>

    <!-- Add Cycle Modal -->
    <div id="add-cycle-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-white font-outfit">Create New Cycle</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Cycle / Sprint Name</label>
                <input id="modal-cycle-name" type="text" placeholder="e.g. Cycle 4: Optimization" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Start Date</label>
                    <input id="modal-cycle-start" type="date" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">End Date</label>
                    <input id="modal-cycle-end" type="date" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer">
                </div>
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Sprint Status</label>
                <select id="modal-cycle-status" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer">
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active Now</option>
                    <option value="completed">Completed</option>
                </select>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddCycleModal()" class="px-3.5 py-1.5 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitCycleForm('${activePid}')" class="px-4 py-1.5 bg-primary rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Create Cycle</button>
            </div>
        </div>
    </div>

    <!-- Add Module Modal -->
    <div id="add-module-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-white font-outfit">Create New Epic</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Epic / Module Name</label>
                <input id="modal-module-name" type="text" placeholder="e.g. User Authentication" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Brief Description</label>
                <textarea id="modal-module-desc" placeholder="What are the goals of this feature epic?" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary resize-none h-20 leading-relaxed"></textarea>
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Status</label>
                <select id="modal-module-status" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer">
                    <option value="backlog">Backlog</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done / Released</option>
                </select>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddModuleModal()" class="px-3.5 py-1.5 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitModuleForm('${activePid}')" class="px-4 py-1.5 bg-primary rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Create Epic</button>
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.showAddCycleModal = () => {
        const modal = document.getElementById('add-cycle-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddCycleModal = () => {
        const modal = document.getElementById('add-cycle-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitCycleForm = (pid: string) => {
        const nameEl = document.getElementById('modal-cycle-name') as HTMLInputElement;
        const startEl = document.getElementById('modal-cycle-start') as HTMLInputElement;
        const endEl = document.getElementById('modal-cycle-end') as HTMLInputElement;
        const statusEl = document.getElementById('modal-cycle-status') as HTMLSelectElement;

        if (nameEl && startEl && endEl && statusEl) {
            const name = nameEl.value.trim();
            const start = startEl.value;
            const end = endEl.value;
            const status = statusEl.value as any;

            if (!name || !start || !end) {
                alert("Please fill out all fields.");
                return;
            }

            addCycle(pid, name, start, end, status);
            w.hideAddCycleModal();
            // Clear inputs
            nameEl.value = "";
            startEl.value = "";
            endEl.value = "";
        }
    };

    w.deleteCyclePrompt = (id: string) => {
        if (confirm("Delete this cycle? Tasks will be unassigned but not deleted.")) {
            deleteCycle(id);
        }
    };

    w.showAddModuleModal = () => {
        const modal = document.getElementById('add-module-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddModuleModal = () => {
        const modal = document.getElementById('add-module-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitModuleForm = (pid: string) => {
        const nameEl = document.getElementById('modal-module-name') as HTMLInputElement;
        const descEl = document.getElementById('modal-module-desc') as HTMLTextAreaElement;
        const statusEl = document.getElementById('modal-module-status') as HTMLSelectElement;

        if (nameEl && descEl && statusEl) {
            const name = nameEl.value.trim();
            const desc = descEl.value.trim();
            const status = statusEl.value as any;

            if (!name) {
                alert("Epic name is required.");
                return;
            }

            addModule(pid, name, desc, status);
            w.hideAddModuleModal();
            // Clear inputs
            nameEl.value = "";
            descEl.value = "";
        }
    };

    w.deleteModulePrompt = (id: string) => {
        if (confirm("Delete this epic module? Tasks will be unassigned.")) {
            deleteModule(id);
        }
    };
}
