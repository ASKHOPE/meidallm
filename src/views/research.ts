import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

export function renderResearchView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDocs = state.researchDocs.filter(d => d.projectId === pid);

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">Research & RAG Engine</h2>
                <p class="text-xs text-text-muted">Upload marketing assets, API references, or documentation to query semantic context.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-semibold text-text-main hover:bg-panel-hover/80 transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.showAddDocModal()" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">+ Add Document</button>
            </div>
        </div>

        <!-- RAG Query Box -->
        <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
            <h3 class="font-bold text-text-main text-base">Query Project Knowledge</h3>
            <div class="flex gap-3">
                <input id="rag-query-input" type="text" class="flex-grow bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main" placeholder="Ask questions about your research (e.g. 'What is the accuracy?')">
                <button onclick="window.queryRAG('${pid}')" class="px-6 py-3 bg-text-main text-background font-bold text-xs rounded-xl hover:bg-text-main/90 transition-colors cursor-pointer">Query RAG</button>
            </div>
            <!-- Query Result Response Container -->
            <div id="rag-response-container" class="hidden bg-text-main/5 border border-text-main/10 p-5 rounded-xl flex flex-col gap-2">
                <div class="text-xs uppercase tracking-wider text-text-main font-bold">AI Assistant Response</div>
                <p id="rag-response-text" class="text-xs text-text-main leading-relaxed"></p>
                <div class="border-t border-text-main/10 pt-3 mt-2 flex flex-col gap-1">
                    <div class="text-[10px] text-text-muted uppercase font-semibold">Referenced Sources:</div>
                    <ul id="rag-response-sources" class="list-disc list-inside text-xs text-text-muted"></ul>
                </div>
            </div>
        </div>

        <!-- Document List -->
        <div class="bg-background border border-text-main/15 rounded-2xl p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 class="font-bold text-text-main text-base">Knowledge Base Sources (${projectDocs.length})</h3>
                <div class="relative w-48">
                    <input type="text" id="research-search-input" oninput="window.filterResearchDocs()" placeholder="Search documents..." class="w-full bg-panel-hover border border-text-main/15 rounded-xl pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-text-main transition-all">
                    <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">${getIconSVG('search', 'w-3.5 h-3.5')}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${projectDocs.map(d => {
                    let typeIcon = getIconSVG('paperclip', 'w-3 h-3 text-text-muted');
                    if (d.type === 'url') typeIcon = getIconSVG('external-link', 'w-3 h-3 text-text-muted');
                    if (d.type === 'text') typeIcon = getIconSVG('drafts', 'w-3 h-3 text-text-muted');
                    return `
                    <div class="research-doc-item bg-panel-hover border border-text-main/15 p-5 rounded-xl flex flex-col justify-between hover:border-text-main/40 transition-colors"
                         data-title="${sanitizeHTML(d.title)}">
                        <div>
                            <div class="flex justify-between items-start gap-2 mb-3">
                                <span class="text-[9px] font-bold uppercase px-2 py-0.5 bg-text-main/5 text-text-muted rounded flex items-center gap-1 border border-text-main/10">
                                    <span class="flex items-center justify-center">${typeIcon}</span> ${d.type}
                                </span>
                                <button onclick="window.deleteResearchDoc('${d.id}')" class="text-text-muted hover:text-rose-500 text-xs font-semibold cursor-pointer">✕ Delete</button>
                            </div>
                            <h4 class="font-bold text-text-main mb-2 truncate text-sm" title="${sanitizeHTML(d.title)}">${sanitizeHTML(d.title)}</h4>
                            <p class="text-xs text-text-muted line-clamp-3 leading-relaxed">${sanitizeHTML(d.content)}</p>
                        </div>
                        <div class="text-[10px] text-text-muted border-t border-text-main/10 pt-3 mt-4">
                            Added ${formatTime(d.created)}
                        </div>
                    </div>
                    `;
                }).join('')}
                ${projectDocs.length === 0 ? `
                    <div class="col-span-2 text-center text-xs text-text-muted py-12 border border-dashed border-text-main/15 rounded-xl">
                        No documents added yet. Click "+ Add Document" to populate your RAG database.
                    </div>
                ` : ''}
            </div>
        </div>
    </div>

    <!-- Add Document Modal -->
    <div id="add-doc-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/20 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-text-main">
            <h3 class="text-lg font-bold font-outfit">Add Knowledge Base Source</h3>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Source Type</label>
                <select id="doc-type" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main">
                    <option value="text">Paste Text / Note</option>
                    <option value="pdf">Import Local PDF File</option>
                    <option value="url">Scrape Website / URL</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Title / Source Name</label>
                <input id="doc-title" type="text" maxlength="60" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main" placeholder="e.g. Better Auth Overview">
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Content / Body Text</label>
                <textarea id="doc-content" rows="6" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main resize-none" placeholder="Paste doc details here..."></textarea>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddDocModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-xs font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitDocForm('${pid}')" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">Add Document</button>
            </div>
        </div>
    </div>
    `;
}
