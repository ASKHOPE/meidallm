import { state } from "../state";
import { sanitizeHTML } from "../utils";

// Local tracking for active editing draft
let activeDraftId: string | null = null;

export function renderDraftsView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDrafts = state.drafts.filter(d => d.projectId === pid);
    
    // Fallback to first draft if no draft selected or invalid
    if (!activeDraftId && projectDrafts.length > 0) {
        activeDraftId = projectDrafts[0].id;
    }
    const activeDraft = state.drafts.find(d => d.id === activeDraftId && d.projectId === pid);

    return `
    <div class="fade-in flex flex-col h-full min-h-[500px]">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-outfit text-white">Drafts & Compose</h2>
                <p class="text-sm text-text-muted">Write tweets, blog posts, or marketing email layouts for this campaign.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.createNewDraft('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ New Draft</button>
            </div>
        </div>

        <div class="flex flex-col lg:flex-row gap-6 flex-grow items-stretch">
            <!-- Left Side: Drafts List Drawer -->
            <div class="w-full lg:w-80 bg-glass-bg border border-glass-border rounded-2xl p-4 flex flex-col gap-4 max-h-[300px] lg:max-h-none overflow-y-auto">
                <h3 class="font-semibold text-white text-sm uppercase tracking-wider text-text-muted border-b border-glass-border/40 pb-2">All Drafts (${projectDrafts.length})</h3>
                <div class="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                    ${projectDrafts.map(d => {
                        let formatIcon = '📝';
                        if (d.format === 'tweet') formatIcon = '🐦';
                        if (d.format === 'email') formatIcon = '✉️';
                        
                        const isActive = d.id === activeDraftId;
                        const activeClasses = isActive 
                            ? 'bg-[rgba(99,102,241,0.1)] border-primary/50 text-white' 
                            : 'bg-transparent border-glass-border hover:bg-panel-hover text-text-muted';
                        
                        return `
                        <div class="border rounded-xl p-3 flex flex-col justify-between gap-3 cursor-pointer transition-all ${activeClasses}" onclick="window.selectDraft('${d.id}')">
                            <div class="flex justify-between items-start gap-2">
                                <span class="text-xs font-semibold uppercase flex items-center gap-1">
                                    <span>${formatIcon}</span> ${d.format}
                                </span>
                                <button onclick="event.stopPropagation(); window.deleteDraft('${d.id}')" class="text-[10px] hover:text-rose-500 font-bold opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">✕ Remove</button>
                            </div>
                            <div class="font-medium text-sm truncate w-full text-white">${sanitizeHTML(d.title)}</div>
                        </div>
                        `;
                    }).join('')}
                    ${projectDrafts.length === 0 ? `
                        <div class="text-center text-text-muted text-xs py-8">No drafts created yet. Click "+ New Draft" to start writing.</div>
                    ` : ''}
                </div>
            </div>

            <!-- Right Side: Text Editor Panel -->
            <div class="flex-grow bg-glass-bg border border-glass-border rounded-2xl p-6 flex flex-col gap-4 min-h-[400px]">
                ${activeDraft ? `
                    <div class="flex flex-col gap-4 flex-grow">
                        <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                            <div class="flex-grow w-full">
                                <input id="editor-title" type="text" value="${sanitizeHTML(activeDraft.title)}" onkeyup="window.saveEditorState('${activeDraft.id}')" class="w-full bg-transparent text-white font-outfit text-xl font-semibold border-b border-transparent focus:border-glass-border/40 pb-2 focus:outline-none" placeholder="Draft Title...">
                            </div>
                            <div class="flex gap-2 w-full sm:w-auto justify-end">
                                <button onclick="window.copyDraftToClipboard('${activeDraft.id}')" class="px-3.5 py-1.5 bg-panel-hover hover:bg-glass-border border border-glass-border text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                                    📋 Copy Text
                                </button>
                                <button onclick="window.deleteDraft('${activeDraft.id}')" class="px-3.5 py-1.5 border border-rose-500/30 hover:bg-rose-950/20 text-rose-400 text-xs font-medium rounded-lg transition-colors cursor-pointer">
                                    Delete
                                </button>
                            </div>
                        </div>

                        <div>
                            <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1">Format Type</label>
                            <div class="flex gap-2">
                                ${['tweet', 'blog', 'email'].map(fmt => {
                                    const isActive = activeDraft.format === fmt;
                                    const fmtClass = isActive
                                        ? 'bg-primary text-white border-primary shadow-[0_0_10px_var(--color-primary-glow)]'
                                        : 'bg-panel-hover text-text-muted border-glass-border hover:text-white';
                                    return `
                                    <button onclick="window.changeDraftFormat('${activeDraft.id}', '${fmt}')" class="border px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${fmtClass}">
                                        ${fmt === 'tweet' ? '🐦 ' : fmt === 'email' ? '✉️ ' : '📝 '}${fmt}
                                    </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Editor Textarea -->
                        <div class="flex-grow flex flex-col">
                            <textarea id="editor-content" onkeyup="window.saveEditorState('${activeDraft.id}')" class="w-full flex-grow bg-panel-hover border border-glass-border p-4 rounded-2xl text-white text-sm focus:outline-none focus:border-primary resize-none leading-relaxed h-[300px]" placeholder="Type draft body or copy text here...">${sanitizeHTML(activeDraft.content)}</textarea>
                        </div>

                        <!-- Counters Footer -->
                        <div class="flex justify-between items-center text-xs text-text-muted border-t border-glass-border/30 pt-3">
                            <div id="editor-counter-words">0 words</div>
                            <div id="editor-counter-chars">0 characters</div>
                        </div>
                    </div>
                ` : `
                    <div class="flex-grow flex flex-center items-center justify-center text-center text-text-muted py-16">
                        <div>
                            <span class="text-5xl block mb-4">✍️</span>
                            Select or create a draft from the list to launch the marketing composer.
                        </div>
                    </div>
                `}
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to main.ts
(window as any).selectDraft = (id: string) => {
    activeDraftId = id;
    (window as any).navigateTo('drafts', state.currentProject || undefined);
};
