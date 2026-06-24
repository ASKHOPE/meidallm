import { state } from "../state";
import { sanitizeHTML } from "../utils";

interface StructuredDraftContent {
    author: string;
    audience: string;
    keywords: string;
    tone: string;
    hook: string;
    thesis: string;
    body: string;
    imageUrl: string;
    fontFamily: string;
    fontSize: string;
}

export function parseDraftContent(content: string): StructuredDraftContent {
    try {
        const parsed = JSON.parse(content);
        return {
            author: parsed.author || "",
            audience: parsed.audience || "",
            keywords: parsed.keywords || "",
            tone: parsed.tone || "creative",
            hook: parsed.hook || "",
            thesis: parsed.thesis || "",
            body: parsed.body || "",
            imageUrl: parsed.imageUrl || "",
            fontFamily: parsed.fontFamily || "font-inter",
            fontSize: parsed.fontSize || "text-sm"
        };
    } catch (e) {
        return {
            author: "",
            audience: "",
            keywords: "",
            tone: "creative",
            hook: "",
            thesis: "",
            body: content || "",
            imageUrl: "",
            fontFamily: "font-inter",
            fontSize: "text-sm"
        };
    }
}

let activeDraftId: string | null = null;
let activeContextTab: 'research' | 'media' = 'research';

export function renderDraftsView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDrafts = state.drafts.filter(d => d.projectId === pid);
    const projectDocs = state.researchDocs.filter(d => d.projectId === pid);
    const projectMedia = state.mediaAssets.filter(m => m.projectId === pid);

    if (!activeDraftId && projectDrafts.length > 0) {
        activeDraftId = projectDrafts[0].id;
    }
    const activeDraft = state.drafts.find(d => d.id === activeDraftId && d.projectId === pid);
    const data = activeDraft ? parseDraftContent(activeDraft.content) : null;

    // Font family dropdown options mapping classes to names
    const fonts = [
        { class: 'font-inter', name: 'Inter (Sans)' },
        { class: 'font-serif', name: 'Playfair (Serif)' },
        { class: 'font-mono', name: 'JetBrains (Mono)' }
    ];

    const sizes = [
        { class: 'text-xs', name: 'Small' },
        { class: 'text-sm', name: 'Normal' },
        { class: 'text-base', name: 'Large' },
        { class: 'text-lg', name: 'Heading' }
    ];

    return `
    <div class="fade-in flex flex-col h-full min-h-[600px]">
        <!-- Page Title Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-outfit text-white">Drafts & Compose</h2>
                <p class="text-sm text-text-muted">Compose copywriting copy integrated with campaign knowledge and asset tools.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.createNewDraft('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ New Draft</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow items-stretch">
            <!-- Col 1: Drafts Drawer (span 3) -->
            <div class="lg:col-span-3 bg-glass-bg border border-glass-border rounded-2xl p-4 flex flex-col gap-4 max-h-[300px] lg:max-h-none overflow-hidden">
                <div class="border-b border-glass-border/40 pb-2">
                    <h3 class="font-semibold text-white text-sm uppercase tracking-wider text-text-muted mb-2">All Drafts (${projectDrafts.length})</h3>
                    <div class="relative w-full">
                        <input type="text" id="drafts-search-input" oninput="window.filterDrafts()" placeholder="Search drafts..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-3 pr-8 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary transition-all">
                        <span class="absolute right-3 top-2 text-text-muted text-[10px]">🔍</span>
                    </div>
                </div>
                <div id="drafts-drawer-list" class="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                    ${projectDrafts.map(d => {
                        const isSel = d.id === activeDraftId;
                        const activeClasses = isSel 
                            ? 'bg-[rgba(99,102,241,0.1)] border-primary/50 text-white' 
                            : 'bg-transparent border-glass-border hover:bg-panel-hover text-text-muted';
                        
                        let formatIcon = '📝';
                        if (d.format === 'tweet') formatIcon = '🐦';
                        if (d.format === 'email') formatIcon = '✉️';

                        return `
                        <div class="draft-item-card border rounded-xl p-3 flex flex-col justify-between gap-3 cursor-pointer transition-all ${activeClasses} group/draft-card" 
                             onclick="window.selectDraft('${d.id}')"
                             data-title="${sanitizeHTML(d.title)}">
                            <div class="flex justify-between items-start gap-2">
                                <span class="text-[10px] font-semibold uppercase flex items-center gap-1">
                                    <span>${formatIcon}</span> ${d.format}
                                </span>
                                <button onclick="event.stopPropagation(); window.deleteDraft('${d.id}')" class="text-[9px] hover:text-rose-500 font-bold opacity-0 group-hover/draft-card:opacity-100 focus:opacity-100 transition-opacity cursor-pointer">✕ Remove</button>
                            </div>
                            <div class="font-medium text-xs truncate w-full text-white">${sanitizeHTML(d.title)}</div>
                        </div>
                        `;
                    }).join('')}
                    ${projectDrafts.length === 0 ? `
                        <div class="text-center text-text-muted text-[11px] py-8">No drafts created. Click "+ New Draft".</div>
                    ` : ''}
                </div>
            </div>

            <!-- Col 2: Copywriter Editor (span 6) -->
            <div class="lg:col-span-6 bg-glass-bg border border-glass-border rounded-2xl p-6 flex flex-col gap-4 max-h-[700px] overflow-y-auto">
                ${activeDraft && data ? `
                    <div class="flex flex-col gap-4">
                        <!-- Top title edit -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-glass-border/30 pb-3">
                            <input id="editor-title" type="text" value="${sanitizeHTML(activeDraft.title)}" 
                                   onkeyup="window.saveStructuredDraft('${activeDraft.id}')" 
                                   class="w-full bg-transparent text-white font-outfit text-xl font-semibold focus:outline-none" placeholder="Draft Title...">
                            <div class="flex gap-2 shrink-0">
                                <button onclick="window.copyDraftToClipboard('${activeDraft.id}')" class="px-3 py-1.5 bg-panel-hover border border-glass-border text-xs font-semibold rounded-lg hover:text-white transition-all cursor-pointer">📋 Copy Draft</button>
                            </div>
                        </div>

                        <!-- Adaptation Format selector (Article, Social, Newsletter) -->
                        <div>
                            <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1.5">Adapt Format Mode</label>
                            <div class="flex gap-2">
                                ${[
                                    { key: 'blog', label: 'Article / Blog', icon: '📝' },
                                    { key: 'tweet', label: 'Social Post', icon: '🐦' },
                                    { key: 'email', label: 'Newsletter Broadcast', icon: '✉️' }
                                ].map(item => {
                                    const active = activeDraft.format === item.key;
                                    const btnClass = active 
                                        ? 'bg-primary text-white border-primary shadow-[0_0_10px_var(--color-primary-glow)] font-bold' 
                                        : 'bg-panel-hover text-text-muted border-glass-border hover:text-white';
                                    return `
                                    <button onclick="window.changeDraftFormat('${activeDraft.id}', '${item.key}')" 
                                            class="border px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer ${btnClass}">
                                        ${item.icon} ${item.label}
                                    </button>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Platform Copy Meta options -->
                        <div class="grid grid-cols-2 gap-3 bg-panel-hover/30 border border-glass-border/40 p-4 rounded-xl">
                            <div>
                                <label class="block text-[9px] font-semibold text-text-muted uppercase mb-0.5">Author</label>
                                <input id="editor-author" type="text" value="${sanitizeHTML(data.author)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Marketing Lead" class="w-full bg-panel-hover border border-glass-border/60 p-2 rounded-lg text-white text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-semibold text-text-muted uppercase mb-0.5">Target Audience</label>
                                <input id="editor-audience" type="text" value="${sanitizeHTML(data.audience)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Developer, HR Managers" class="w-full bg-panel-hover border border-glass-border/60 p-2 rounded-lg text-white text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-semibold text-text-muted uppercase mb-0.5">Keywords</label>
                                <input id="editor-keywords" type="text" value="${sanitizeHTML(data.keywords)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. AI, SaaS, pipeline" class="w-full bg-panel-hover border border-glass-border/60 p-2 rounded-lg text-white text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-semibold text-text-muted uppercase mb-0.5">Tone of voice</label>
                                <select id="editor-tone" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-panel-hover border border-glass-border/60 p-2 rounded-lg text-white text-xs focus:outline-none cursor-pointer">
                                    <option value="professional" ${data.tone === 'professional' ? 'selected' : ''}>Professional</option>
                                    <option value="creative" ${data.tone === 'creative' ? 'selected' : ''}>Creative</option>
                                    <option value="casual" ${data.tone === 'casual' ? 'selected' : ''}>Casual</option>
                                </select>
                            </div>
                        </div>

                        <!-- Formatting Toolbar -->
                        <div class="flex items-center gap-3 border-b border-glass-border/30 pb-3 flex-wrap">
                            <!-- Font Selection -->
                            <div>
                                <select id="editor-font-select" onchange="window.updateEditorStyle('${activeDraft.id}')" class="bg-panel-hover border border-glass-border p-1.5 rounded-lg text-xs text-white focus:outline-none cursor-pointer">
                                    ${fonts.map(f => `<option value="${f.class}" ${data.fontFamily === f.class ? 'selected' : ''}>${f.name}</option>`).join('')}
                                </select>
                            </div>
                            <!-- Font Size -->
                            <div>
                                <select id="editor-size-select" onchange="window.updateEditorStyle('${activeDraft.id}')" class="bg-panel-hover border border-glass-border p-1.5 rounded-lg text-xs text-white focus:outline-none cursor-pointer">
                                    ${sizes.map(s => `<option value="${s.class}" ${data.fontSize === s.class ? 'selected' : ''}>${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <span class="text-text-muted text-xs">|</span>
                            <!-- Direct Markdown helper inserts -->
                            <button onclick="window.insertMarkdownHelper('**')" class="text-xs hover:text-white px-1.5 font-bold cursor-pointer">B</button>
                            <button onclick="window.insertMarkdownHelper('*')" class="text-xs hover:text-white px-1.5 italic cursor-pointer">I</button>
                            <button onclick="window.insertMarkdownHelper('### ')" class="text-xs hover:text-white px-1.5 font-semibold cursor-pointer">H3</button>
                        </div>

                        <!-- Structured copy fields -->
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1">Headline Hook</label>
                                <textarea id="editor-hook" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-xs focus:outline-none resize-none leading-relaxed h-14" placeholder="Enter headline hook...">${sanitizeHTML(data.hook)}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1">Thesis & Core points</label>
                                <textarea id="editor-thesis" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-xs focus:outline-none resize-none leading-relaxed h-20" placeholder="Core arguments or key points (one per line)...">${sanitizeHTML(data.thesis)}</textarea>
                            </div>

                            <div>
                                <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1">Body Content</label>
                                <textarea id="editor-content" data-draft-id="${activeDraft.id}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" 
                                          class="w-full bg-panel-hover border border-glass-border p-4 rounded-xl text-white focus:outline-none resize-none leading-relaxed h-72 ${data.fontFamily} ${data.fontSize}" 
                                          placeholder="Write campaign body content...">${sanitizeHTML(data.body)}</textarea>
                            </div>

                            <!-- Graphic attachment preview -->
                            <div class="flex flex-col gap-1.5">
                                <label class="block text-[10px] font-semibold text-text-muted uppercase">Graphic Asset URL</label>
                                <div class="flex gap-2">
                                    <input id="editor-image-url" type="text" value="${data.imageUrl}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="Paste Unsplash URL or insert from gallery on the right..." class="flex-grow bg-panel-hover border border-glass-border p-2 rounded-xl text-xs text-white focus:outline-none">
                                    ${data.imageUrl ? `<button onclick="window.clearEditorImage('${activeDraft.id}')" class="px-3 bg-rose-950/20 text-rose-400 hover:bg-rose-950/40 text-xs border border-rose-900/30 rounded-xl cursor-pointer">Remove</button>` : ''}
                                </div>
                                ${data.imageUrl ? `
                                <div class="w-full h-32 rounded-xl bg-cover bg-center border border-glass-border mt-1" style="background-image: url('${data.imageUrl}')"></div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- Counters -->
                        <div class="flex justify-between items-center text-xs text-text-muted border-t border-glass-border/30 pt-3 mt-2">
                            <div id="editor-counter-words">0 words</div>
                            <div id="editor-counter-chars">0 characters</div>
                        </div>
                    </div>
                ` : `
                    <div class="flex-grow flex items-center justify-center text-center text-text-muted py-16">
                        <div>
                            <span class="text-5xl block mb-4">✍️</span>
                            Select or create a draft to open the Structured copywriting studio.
                        </div>
                    </div>
                `}
            </div>

            <!-- Col 3: Campaign Context side panel (span 3) -->
            <div class="lg:col-span-3 bg-glass-bg border border-glass-border rounded-2xl p-4 flex flex-col gap-4 max-h-[300px] lg:max-h-none overflow-hidden">
                <!-- Context tabs -->
                <div class="flex gap-3 border-b border-glass-border/30 pb-2">
                    <button onclick="window.setDraftContextTab('research')" class="pb-1 text-xs font-semibold uppercase tracking-wider cursor-pointer ${activeContextTab === 'research' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">🔍 Knowledge</button>
                    <button onclick="window.setDraftContextTab('media')" class="pb-1 text-xs font-semibold uppercase tracking-wider cursor-pointer ${activeContextTab === 'media' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">🖼️ Assets</button>
                </div>

                <!-- Tab content viewport -->
                <div class="flex-grow overflow-y-auto flex flex-col gap-3 pr-1">
                    ${activeContextTab === 'research' ? `
                        <!-- Mini RAG query box -->
                        <div class="bg-panel-hover/30 border border-glass-border/30 rounded-xl p-3 flex flex-col gap-2">
                            <h4 class="text-[10px] font-semibold text-white uppercase">Query Knowledge Base</h4>
                            <div class="flex gap-1.5">
                                <input id="draft-rag-input" type="text" class="flex-grow bg-panel-hover border border-glass-border p-1.5 rounded-lg text-white text-[11px] focus:outline-none" placeholder="Ask RAG...">
                                <button onclick="window.queryDraftRAG('${pid}')" class="px-2.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg cursor-pointer shrink-0">Ask</button>
                            </div>
                            <div id="draft-rag-response" class="hidden text-[10px] bg-black/20 p-2 rounded-lg text-text-muted leading-relaxed select-text mt-1"></div>
                        </div>

                        <!-- Documents library -->
                        <div class="flex flex-col gap-2">
                            <h4 class="text-[10px] font-semibold text-white uppercase tracking-wider border-b border-glass-border/20 pb-1">RAG Sources</h4>
                            ${projectDocs.map(doc => `
                                <div class="bg-panel-hover/20 border border-glass-border/30 p-2.5 rounded-xl flex flex-col gap-1.5 group/rag-item">
                                    <div class="flex justify-between items-center">
                                        <span class="text-[10px] text-white truncate max-w-[80%] font-semibold" title="${sanitizeHTML(doc.title)}">${sanitizeHTML(doc.title)}</span>
                                        <button onclick="window.insertResearchText(\`${doc.content.replace(/`/g, '\\`').replace(/"/g, '\\"')}\`)" class="text-[8px] text-primary hover:text-white cursor-pointer opacity-0 group-hover/rag-item:opacity-100 transition-opacity">Insert</button>
                                    </div>
                                    <p class="text-[9px] text-text-muted line-clamp-2">${sanitizeHTML(doc.content)}</p>
                                </div>
                            `).join('')}
                            ${projectDocs.length === 0 ? `<div class="text-[10px] text-text-muted italic text-center py-4">No indexed documents.</div>` : ''}
                        </div>
                    ` : `
                        <!-- Media library -->
                        <div class="grid grid-cols-2 gap-2">
                            ${projectMedia.map(m => `
                                <div class="bg-panel-hover/20 border border-glass-border/30 rounded-xl overflow-hidden group/media-item flex flex-col justify-between">
                                    <div class="h-16 overflow-hidden bg-slate-900 relative">
                                        <img src="${m.url}" class="w-full h-full object-cover">
                                    </div>
                                    <div class="p-1.5 flex flex-col gap-1">
                                        <div class="text-[9px] text-white truncate" title="${sanitizeHTML(m.title)}">${sanitizeHTML(m.title)}</div>
                                        <button onclick="window.insertMediaAssetUrl('${m.url}')" class="w-full py-1 bg-primary text-white text-[8px] font-bold rounded cursor-pointer">Attach / Insert</button>
                                    </div>
                                </div>
                            `).join('')}
                            ${projectMedia.length === 0 ? `<div class="col-span-2 text-[10px] text-text-muted italic text-center py-4">No media assets found.</div>` : ''}
                        </div>
                    `}
                </div>
            </div>
        </div>
    </div>
    `;
}

// Global Actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.selectDraft = (id: string) => {
        activeDraftId = id;
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.setDraftContextTab = (tab: 'research' | 'media') => {
        activeContextTab = tab;
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.saveStructuredDraft = (id: string) => {
        const titleEl = document.getElementById('editor-title') as HTMLInputElement;
        const authorEl = document.getElementById('editor-author') as HTMLInputElement;
        const audienceEl = document.getElementById('editor-audience') as HTMLInputElement;
        const keywordsEl = document.getElementById('editor-keywords') as HTMLInputElement;
        const toneEl = document.getElementById('editor-tone') as HTMLSelectElement;
        const hookEl = document.getElementById('editor-hook') as HTMLTextAreaElement;
        const thesisEl = document.getElementById('editor-thesis') as HTMLTextAreaElement;
        const bodyEl = document.getElementById('editor-content') as HTMLTextAreaElement;
        const imageEl = document.getElementById('editor-image-url') as HTMLInputElement;
        const fontEl = document.getElementById('editor-font-select') as HTMLSelectElement;
        const sizeEl = document.getElementById('editor-size-select') as HTMLSelectElement;

        const draft = state.drafts.find(d => d.id === id);
        if (!draft) return;

        if (titleEl) draft.title = titleEl.value;
        
        const contentData: StructuredDraftContent = {
            author: authorEl ? authorEl.value : "",
            audience: audienceEl ? audienceEl.value : "",
            keywords: keywordsEl ? keywordsEl.value : "",
            tone: toneEl ? toneEl.value : "creative",
            hook: hookEl ? hookEl.value : "",
            thesis: thesisEl ? thesisEl.value : "",
            body: bodyEl ? bodyEl.value : "",
            imageUrl: imageEl ? imageEl.value : "",
            fontFamily: fontEl ? fontEl.value : "font-inter",
            fontSize: sizeEl ? sizeEl.value : "text-sm"
        };

        draft.content = JSON.stringify(contentData);
        draft.updated = Date.now();
        state.saveState(); // Writes to localStorage
        
        // Update words/character counter locally
        if (bodyEl) {
            const text = bodyEl.value;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            const wordCounter = document.getElementById('editor-counter-words');
            const charCounter = document.getElementById('editor-counter-chars');
            if (wordCounter) wordCounter.innerText = `${words} words`;
            if (charCounter) charCounter.innerText = `${chars} characters`;
        }
    };

    w.updateEditorStyle = (id: string) => {
        w.saveStructuredDraft(id);
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.clearEditorImage = (id: string) => {
        const imageEl = document.getElementById('editor-image-url') as HTMLInputElement;
        if (imageEl) imageEl.value = "";
        w.saveStructuredDraft(id);
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.insertMarkdownHelper = (prefix: string) => {
        const textarea = document.getElementById('editor-content') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const text = val.substring(start, end);
        const inserted = prefix + text + (prefix.endsWith(' ') ? '' : prefix);
        textarea.value = val.substring(0, start) + inserted + val.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + inserted.length;
        
        const draftId = textarea.getAttribute('data-draft-id');
        if (draftId) {
            w.saveStructuredDraft(draftId);
        }
    };

    w.insertResearchText = (text: string) => {
        const textarea = document.getElementById('editor-content') as HTMLTextAreaElement;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const snippet = `\n[Reference: ${text}]\n`;
        textarea.value = val.substring(0, start) + snippet + val.substring(end);
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + snippet.length;

        const draftId = textarea.getAttribute('data-draft-id');
        if (draftId) {
            w.saveStructuredDraft(draftId);
        }
    };

    w.insertMediaAssetUrl = (url: string) => {
        // Set as main graphic
        const imageEl = document.getElementById('editor-image-url') as HTMLInputElement;
        if (imageEl) {
            imageEl.value = url;
            const draftId = document.getElementById('editor-content')?.getAttribute('data-draft-id');
            if (draftId) {
                w.saveStructuredDraft(draftId);
                w.navigateTo('drafts', state.currentProject || undefined);
            }
        }
    };

    w.queryDraftRAG = (pid: string) => {
        const input = document.getElementById('draft-rag-input') as HTMLInputElement;
        const box = document.getElementById('draft-rag-response');
        if (!input || !box) return;

        const q = input.value.trim().toLowerCase();
        if (!q) return;

        box.classList.remove('hidden');
        box.innerText = "Querying semantic catalog...";

        setTimeout(() => {
            const docs = state.researchDocs.filter(d => d.projectId === pid);
            const matches = docs.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));

            if (matches.length > 0) {
                box.innerHTML = `<strong>RAG Output:</strong> ${sanitizeHTML(matches[0].content)} <br><button onclick="window.insertResearchText(\`${matches[0].content.replace(/`/g, '\\`').replace(/"/g, '\\"')}\`)" class="text-primary hover:text-white mt-1 underline cursor-pointer text-[9px] block">Insert snippet into copy</button>`;
            } else {
                box.innerHTML = `No direct match in the database for "${sanitizeHTML(q)}". Try indexing more documents in your Research engine.`;
            }
        }, 600);
    };
}
