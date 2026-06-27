import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderWorkspaceView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;
    
    state.currentProject = p.id;
    
    const projectTasks = state.kanbanState.filter(t => t.projectId === pid);
    const projectIdeas = state.ideasState.filter(i => i.projectId === pid);
    const projectDocs = state.researchDocs.filter(d => d.projectId === pid);
    const projectMedia = state.mediaAssets.filter(m => m.projectId === pid);
    const projectDrafts = state.drafts.filter(d => d.projectId === pid);

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Top Row: Overview & Kanban -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Project Details -->
            <div class="bg-glass-bg border border-glass-border rounded-2xl p-6 col-span-1 flex flex-col justify-between text-left">
                <div>
                    <h3 class="text-xl font-semibold text-white font-outfit mb-2">${sanitizeHTML(p.name)}</h3>
                    <p class="text-text-muted text-sm mb-6">${sanitizeHTML(p.description)}</p>
                    <div class="flex flex-col gap-3">
                        <div class="flex justify-between text-sm"><span class="text-text-muted">Status</span><span class="text-emerald-400 font-medium">Active</span></div>
                        <div class="flex justify-between text-sm"><span class="text-text-muted">Total Tasks</span><span class="text-white font-medium">${projectTasks.length}</span></div>
                        <div class="flex justify-between text-sm"><span class="text-text-muted">Ideas Count</span><span class="text-white font-medium">${projectIdeas.length}</span></div>
                    </div>
                    
                    <!-- Collaboration presence facepile -->
                    <div class="mt-5 border-t border-[var(--color-glass-border)] pt-4 flex justify-between items-center">
                        <div class="flex -space-x-2">
                            <div class="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] font-bold text-white border border-[var(--color-glass-bg)]" title="Hosanna (You)">HO</div>
                            <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white border border-[var(--color-glass-bg)]" title="Richard Hendricks">RH</div>
                            <div class="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white border border-[var(--color-glass-bg)]" title="Gavin Belson">GB</div>
                        </div>
                        <span class="text-[9px] text-[var(--color-text-muted)] font-medium flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            3 active now
                        </span>
                    </div>
                </div>
                <button onclick="window.navigateTo('workspaces')" class="w-full mt-6 px-4 py-2 bg-panel-hover border border-glass-border rounded-lg text-sm hover:bg-glass-border transition-colors cursor-pointer">Back to Workspaces</button>
            </div>

            <!-- Kanban Preview -->
            <div class="bg-glass-bg border border-glass-border rounded-2xl p-6 col-span-2 flex flex-col text-left">
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
                <span class="mb-3 text-primary">${getIconSVG('idea-canvas', 'w-10 h-10')}</span>
                <h4 class="font-medium text-white">Idea Canvas</h4>
                <p class="text-xs text-text-muted mt-1">${projectIdeas.length} notes active</p>
            </div>
            <div onclick="window.navigateTo('research', '${p.id}')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                <span class="mb-3 text-primary">${getIconSVG('research', 'w-10 h-10')}</span>
                <h4 class="font-medium text-white">Research & RAG</h4>
                <p class="text-xs text-text-muted mt-1">${projectDocs.length} sources indexed</p>
            </div>
            <div onclick="window.navigateTo('media', '${p.id}')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                <span class="mb-3 text-primary">${getIconSVG('media', 'w-10 h-10')}</span>
                <h4 class="font-medium text-white">Media Assets</h4>
                <p class="text-xs text-text-muted mt-1">${projectMedia.length} images</p>
            </div>
            <div onclick="window.navigateTo('drafts', '${p.id}')" class="bg-glass-bg border border-glass-border rounded-2xl p-6 hover:bg-panel-hover hover:border-primary transition-all cursor-pointer flex flex-col items-center text-center">
                <span class="mb-3 text-primary">${getIconSVG('drafts', 'w-10 h-10')}</span>
                <h4 class="font-medium text-white">Drafts & Compose</h4>
                <p class="text-xs text-text-muted mt-1">${projectDrafts.length} active drafts</p>
            </div>
        </div>
    </div>
    `;
}
