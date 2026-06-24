import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";

export function renderResearchView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDocs = state.researchDocs.filter(d => d.projectId === pid);

    return `
    <div class="fade-in flex flex-col gap-6">
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="text-2xl font-outfit text-white">Research & RAG Engine</h2>
                <p class="text-sm text-text-muted">Upload marketing assets, API references, or documentation to query semantic context.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.showAddDocModal()" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Document</button>
            </div>
        </div>

        <!-- RAG Query Box -->
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl flex flex-col gap-4">
            <h3 class="font-medium text-white text-lg">Query Project Knowledge</h3>
            <div class="flex gap-3">
                <input id="rag-query-input" type="text" class="flex-grow bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="Ask questions about your research (e.g. 'What is the accuracy?')">
                <button onclick="window.queryRAG('${pid}')" class="px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer">Query RAG</button>
            </div>
            <!-- Query Result Response Container -->
            <div id="rag-response-container" class="hidden bg-[rgba(255,255,255,0.02)] border border-glass-border p-5 rounded-xl flex flex-col gap-2">
                <div class="text-xs uppercase tracking-wider text-primary font-semibold">AI Assistant Response</div>
                <p id="rag-response-text" class="text-sm text-white leading-relaxed"></p>
                <div class="border-t border-glass-border/30 pt-3 mt-2 flex flex-col gap-1">
                    <div class="text-[10px] text-text-muted uppercase font-semibold">Referenced Sources:</div>
                    <ul id="rag-response-sources" class="list-disc list-inside text-xs text-text-muted"></ul>
                </div>
            </div>
        </div>

        <!-- Document List -->
        <div class="bg-glass-bg border border-glass-border rounded-2xl p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 class="font-medium text-white text-lg">Knowledge Base Sources (${projectDocs.length})</h3>
                <div class="relative w-48">
                    <input type="text" id="research-search-input" oninput="window.filterResearchDocs()" placeholder="Search documents..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-3 pr-8 py-2 text-xs text-white focus:outline-none focus:border-primary transition-all">
                    <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">🔍</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${projectDocs.map(d => {
                    let typeIcon = '📄';
                    if (d.type === 'url') typeIcon = '🔗';
                    if (d.type === 'text') typeIcon = '📝';
                    return `
                    <div class="research-doc-item bg-panel-hover border border-glass-border p-5 rounded-xl flex flex-col justify-between hover:border-glass-border/60 transition-colors"
                         data-title="${sanitizeHTML(d.title)}">
                        <div>
                            <div class="flex justify-between items-start gap-2 mb-3">
                                <span class="text-xs font-semibold uppercase px-2 py-0.5 bg-glass-border/50 text-text-muted rounded flex items-center gap-1">
                                    <span>${typeIcon}</span> ${d.type}
                                </span>
                                <button onclick="window.deleteResearchDoc('${d.id}')" class="text-text-muted hover:text-rose-500 text-xs font-bold cursor-pointer">✕ Delete</button>
                            </div>
                            <h4 class="font-semibold text-white mb-2 truncate" title="${sanitizeHTML(d.title)}">${sanitizeHTML(d.title)}</h4>
                            <p class="text-xs text-text-muted line-clamp-3 leading-relaxed">${sanitizeHTML(d.content)}</p>
                        </div>
                        <div class="text-[10px] text-text-muted border-t border-glass-border/20 pt-3 mt-4">
                            Added ${formatTime(d.created)}
                        </div>
                    </div>
                    `;
                }).join('')}
                ${projectDocs.length === 0 ? `
                    <div class="col-span-2 text-center text-xs text-text-muted py-12 border-2 border-dashed border-glass-border/30 rounded-xl">
                        No documents added yet. Click "+ Add Document" to populate your RAG database.
                    </div>
                ` : ''}
            </div>
        </div>
    </div>

    <!-- Add Document Modal -->
    <div id="add-doc-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
            <h3 class="text-xl font-semibold text-white">Add Knowledge Base Source</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Source Type</label>
                <select id="doc-type" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
                    <option value="text">Paste Text / Note</option>
                    <option value="pdf">Import Local PDF File</option>
                    <option value="url">Scrape Website / URL</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Title / Source Name</label>
                <input id="doc-title" type="text" maxlength="60" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary" placeholder="e.g. Better Auth Overview">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Content / Body Text</label>
                <textarea id="doc-content" rows="6" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary resize-none" placeholder="Paste doc details here..."></textarea>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddDocModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitDocForm('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors cursor-pointer">Add Document</button>
            </div>
        </div>
    </div>
    `;
}
