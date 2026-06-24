import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderIdeasView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;
    
    state.currentProject = p.id;
    const projectIdeas = state.ideasState.filter(i => i.projectId === pid);

    return `
    <div class="fade-in flex flex-col h-full min-h-[500px]">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} Idea Board</h2>
                <p class="text-xs text-text-muted">Brainstorm features and campaign steps.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative w-48">
                    <input type="text" id="ideas-search-input" oninput="window.filterIdeas()" placeholder="Search notes..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                    <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">🔍</span>
                </div>
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.addStickyNote('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-xs font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Note</button>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow items-start">
            ${projectIdeas.map(idea => `
                <div class="idea-note-item bg-glass-bg border border-glass-border p-5 rounded-2xl flex flex-col justify-between min-h-[160px] hover:-translate-y-1 transition-all group relative"
                     data-content="${sanitizeHTML(idea.content)}">
                    <textarea onchange="window.updateStickyNote('${idea.id}', this.value)" 
                              maxlength="200"
                              class="w-full bg-transparent text-white text-xs resize-none focus:outline-none border-b border-transparent focus:border-glass-border/30 pb-2 h-24 font-inter" 
                              placeholder="Write your brilliant idea here...">${sanitizeHTML(idea.content)}</textarea>
                    <div class="flex justify-between items-center pt-2 border-t border-glass-border/20 mt-2">
                        <button onclick="window.convertIdeaToTask('${idea.id}')" class="text-[10px] text-primary hover:text-white flex items-center gap-1 transition-colors cursor-pointer">
                            📋 Convert to Task
                        </button>
                        <button onclick="window.deleteStickyNote('${idea.id}')" class="text-[10px] text-rose-400 hover:text-rose-600 font-bold cursor-pointer">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')}
            ${projectIdeas.length === 0 ? `
                <div class="col-span-full border-2 border-dashed border-glass-border/30 rounded-2xl p-12 text-center text-xs text-text-muted">
                    💡 No brainstorm items yet. Click "+ Add Note" to create sticky notes!
                </div>
            ` : ''}
        </div>
    </div>
    `;
}
