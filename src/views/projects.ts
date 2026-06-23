import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";

export function renderProjectsView(): string {
    return `
        <div class="fade-in">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-outfit font-medium">Active Campaigns</h2>
                <button onclick="window.createProjectPrompt()" class="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary rounded-xl font-medium shadow-[0_0_15px_var(--color-primary-glow)] hover:shadow-[0_0_25px_var(--color-primary-glow)] transition-all cursor-pointer">+ New Project</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                ${state.projects.map(p => {
                    const projectTasks = state.kanbanState.filter(k => k.projectId === p.id);
                    return `
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
                            <span>Tasks: ${projectTasks.length}</span>
                            <span>Last active ${formatTime(p.lastActive)}</span>
                        </div>
                    </div>
                    `;
                }).join('')}
                ${state.projects.length === 0 ? `<div class="col-span-2 text-center text-text-muted py-12">No campaigns active. Click "+ New Project" to get started.</div>` : ''}
            </div>
        </div>
    `;
}
