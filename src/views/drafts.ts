import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

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
    
    // SEO Suite
    seoTitle: string;
    seoDesc: string;
    focusKeyword: string;
    canonicalUrl: string;
    searchIntent: string;
    metaRobots: string;

    // Social Distribution Meta
    socialCaptionX: string;
    socialCaptionInsta: string;
    socialCaptionThreads: string;
    socialCaptionLinkedIn: string;
    socialAltText: string;
    hashtags: string;

    // CMS & Campaign settings
    campaignName: string;
    targetPersona: string;
    funnelStage: string;
    primaryCtaText: string;
    primaryCtaUrl: string;
    contentCategory: string;
    language: string;
    license: string;
    liveUrl: string;
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
            fontSize: parsed.fontSize || "text-sm",
            
            seoTitle: parsed.seoTitle || "",
            seoDesc: parsed.seoDesc || "",
            focusKeyword: parsed.focusKeyword || "",
            canonicalUrl: parsed.canonicalUrl || "",
            searchIntent: parsed.searchIntent || "informational",
            metaRobots: parsed.metaRobots || "index, follow",

            socialCaptionX: parsed.socialCaptionX || "",
            socialCaptionInsta: parsed.socialCaptionInsta || "",
            socialCaptionThreads: parsed.socialCaptionThreads || "",
            socialCaptionLinkedIn: parsed.socialCaptionLinkedIn || "",
            socialAltText: parsed.socialAltText || "",
            hashtags: parsed.hashtags || "",

            campaignName: parsed.campaignName || "",
            targetPersona: parsed.targetPersona || "",
            funnelStage: parsed.funnelStage || "tofu",
            primaryCtaText: parsed.primaryCtaText || "",
            primaryCtaUrl: parsed.primaryCtaUrl || "",
            contentCategory: parsed.contentCategory || "",
            language: parsed.language || "en",
            license: parsed.license || "all-rights",
            liveUrl: parsed.liveUrl || ""
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
            fontSize: "text-sm",
            
            seoTitle: "",
            seoDesc: "",
            focusKeyword: "",
            canonicalUrl: "",
            searchIntent: "informational",
            metaRobots: "index, follow",

            socialCaptionX: "",
            socialCaptionInsta: "",
            socialCaptionThreads: "",
            socialCaptionLinkedIn: "",
            socialAltText: "",
            hashtags: "",

            campaignName: "",
            targetPersona: "",
            funnelStage: "tofu",
            primaryCtaText: "",
            primaryCtaUrl: "",
            contentCategory: "",
            language: "en",
            license: "all-rights",
            liveUrl: ""
        };
    }
}

let activeDraftId: string | null = null;
let activeContextTab: 'research' | 'media' | 'metadata' = 'metadata';

export function renderDraftsView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    // local state for collapsible drawers
    const draftsSidebarOpen = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_drafts_sidebar_open') !== 'false' : true);
    const metadataSidebarOpen = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_metadata_sidebar_open') !== 'false' : true);

    const projectDrafts = state.drafts.filter(d => d.projectId === pid);
    const projectDocs = state.researchDocs.filter(d => d.projectId === pid);
    const projectMedia = state.mediaAssets.filter(m => m.projectId === pid);

    if (!activeDraftId && projectDrafts.length > 0) {
        activeDraftId = projectDrafts[0].id;
    }
    const activeDraft = state.drafts.find(d => d.id === activeDraftId && d.projectId === pid);
    const data = activeDraft ? parseDraftContent(activeDraft.content) : null;

    // Word calculations
    const bodyText = data ? data.body.trim() : "";
    const words = bodyText ? bodyText.split(/\s+/).length : 0;
    const readingTime = Math.max(1, Math.ceil(words / 200));

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

    // Dynamic grid column distribution
    let editorSpan = 12;
    if (draftsSidebarOpen && metadataSidebarOpen) {
        editorSpan = 5;
    } else if (draftsSidebarOpen && !metadataSidebarOpen) {
        editorSpan = 9;
    } else if (!draftsSidebarOpen && metadataSidebarOpen) {
        editorSpan = 8;
    }

    return `
    <div class="fade-in flex flex-col h-full min-h-[600px] text-text-main">
        <!-- Page Title Header -->
        <div class="flex justify-between items-center mb-6">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">Drafts & Compose</h2>
                <p class="text-xs text-text-muted">Compose copywriting copy integrated with campaign knowledge and metadata tools.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.toggleDraftsSidebar()" class="px-3 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-bold text-text-main hover:bg-panel-hover/80 transition-all cursor-pointer">
                    ${draftsSidebarOpen ? '📁 Close List' : '📁 Open List'}
                </button>
                <button onclick="window.toggleMetadataSidebar()" class="px-3 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-bold text-text-main hover:bg-panel-hover/80 transition-all cursor-pointer">
                    ${metadataSidebarOpen ? '📝 Close Metadata' : '📝 Open Metadata'}
                </button>
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-semibold text-text-main hover:bg-panel-hover/80 transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.createNewDraft('${pid}')" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">+ New Draft</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-grow items-stretch">
            <!-- Col 1: Drafts Drawer (span 3) -->
            <div class="${draftsSidebarOpen ? 'lg:col-span-3' : 'hidden'} bg-background border border-text-main/15 rounded-2xl p-4 flex flex-col gap-4 max-h-[300px] lg:max-h-none overflow-hidden">
                <div class="border-b border-text-main/10 pb-2">
                    <h3 class="font-semibold text-text-main text-sm uppercase tracking-wider text-text-muted mb-2">All Drafts (${projectDrafts.length})</h3>
                    <div class="relative w-full">
                        <input type="text" id="drafts-search-input" oninput="window.filterDrafts()" placeholder="Search drafts..." class="w-full bg-panel-hover border border-text-main/15 rounded-xl pl-3 pr-8 py-1.5 text-[11px] text-text-main focus:outline-none focus:border-text-main transition-all">
                        <span class="absolute right-3 top-2 text-text-muted text-[10px]">${getIconSVG('search', 'w-3.5 h-3.5')}</span>
                    </div>
                </div>
                <div id="drafts-drawer-list" class="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
                    ${projectDrafts.map(d => {
                        const isSel = d.id === activeDraftId;
                        const activeClasses = isSel 
                            ? 'bg-text-main/10 border-text-main text-text-main' 
                            : 'bg-transparent border-text-main/10 hover:bg-panel-hover text-text-muted';
                        
                        let formatIcon = '📝';
                        if (d.format === 'tweet') formatIcon = '🐦';
                        if (d.format === 'email') formatIcon = '✉️';

                        return `
                        <div class="draft-item-card border rounded-xl p-3 flex flex-col justify-between gap-3 cursor-pointer transition-all ${activeClasses} group/draft-card" 
                             onclick="window.selectDraft('${d.id}')"
                             data-title="${sanitizeHTML(d.title)}">
                            <div class="flex justify-between items-start gap-2">
                                <span class="text-[9px] font-bold uppercase flex items-center gap-1">
                                    <span>${formatIcon}</span> ${d.format}
                                </span>
                                <button onclick="event.stopPropagation(); window.deleteDraft('${d.id}')" class="text-[9px] hover:text-rose-500 font-bold opacity-0 group-hover/draft-card:opacity-100 focus:opacity-100 transition-opacity cursor-pointer">✕ Remove</button>
                            </div>
                            <div class="font-bold text-xs truncate w-full text-text-main">${sanitizeHTML(d.title)}</div>
                        </div>
                        `;
                    }).join('')}
                    ${projectDrafts.length === 0 ? `
                        <div class="text-center text-text-muted text-[11px] py-8">No drafts created. Click "+ New Draft".</div>
                    ` : ''}
                </div>
            </div>

            <!-- Col 2: Copywriter Editor (span editorSpan) -->
            <div class="lg:col-span-${editorSpan} bg-background border border-text-main/15 rounded-2xl p-6 flex flex-col gap-4 max-h-[700px] overflow-y-auto">
                ${activeDraft && data ? `
                    <div class="flex flex-col gap-4">
                        <!-- Top title edit -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-text-main/10 pb-3">
                            <input id="editor-title" type="text" value="${sanitizeHTML(activeDraft.title)}" 
                                   onkeyup="window.saveStructuredDraft('${activeDraft.id}')" 
                                   class="w-full bg-transparent text-text-main font-outfit text-xl font-bold focus:outline-none" placeholder="Draft Title...">
                            <div class="flex gap-2 shrink-0">
                                <button onclick="window.copyDraftToClipboard('${activeDraft.id}')" class="px-3 py-1.5 bg-panel-hover border border-text-main/15 text-xs font-semibold rounded-lg hover:bg-panel-hover/80 text-text-main transition-all cursor-pointer">📋 Copy Copy</button>
                            </div>
                        </div>

                        <!-- Adaptation Format selector (Article, Social, Newsletter) -->
                        <div>
                            <label class="block text-[9px] font-bold text-text-muted uppercase mb-1.5">Adapt Format Mode</label>
                            <div class="flex gap-2">
                                ${[
                                    { key: 'blog', label: 'Article / Blog', icon: '📝' },
                                    { key: 'tweet', label: 'Social Post', icon: '🐦' },
                                    { key: 'email', label: 'Newsletter Broadcast', icon: '✉️' }
                                ].map(item => {
                                    const active = activeDraft.format === item.key;
                                    const btnClass = active 
                                        ? 'bg-text-main text-background border-text-main font-bold' 
                                        : 'bg-panel-hover text-text-muted border-text-main/15 hover:text-text-main';
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
                        <div class="grid grid-cols-2 gap-3 bg-panel-hover/10 border border-text-main/10 p-4 rounded-xl">
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-0.5">Author</label>
                                <input id="editor-author" type="text" value="${sanitizeHTML(data.author)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Marketing Lead" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-0.5">Target Audience</label>
                                <input id="editor-audience" type="text" value="${sanitizeHTML(data.audience)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Developer, HR Managers" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-0.5">Keywords</label>
                                <input id="editor-keywords" type="text" value="${sanitizeHTML(data.keywords)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. AI, SaaS, pipeline" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-0.5">Tone of voice</label>
                                <select id="editor-tone" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                    <option value="professional" ${data.tone === 'professional' ? 'selected' : ''}>Professional</option>
                                    <option value="creative" ${data.tone === 'creative' ? 'selected' : ''}>Creative</option>
                                    <option value="casual" ${data.tone === 'casual' ? 'selected' : ''}>Casual</option>
                                </select>
                            </div>
                        </div>

                        <!-- Formatting Toolbar -->
                        <div class="flex items-center gap-3 border-b border-text-main/10 pb-3 flex-wrap">
                            <!-- Font Selection -->
                            <div>
                                <select id="editor-font-select" onchange="window.updateEditorStyle('${activeDraft.id}')" class="bg-background border border-text-main/15 p-1.5 rounded-lg text-xs text-text-main focus:outline-none cursor-pointer">
                                    ${fonts.map(f => `<option value="${f.class}" ${data.fontFamily === f.class ? 'selected' : ''}>${f.name}</option>`).join('')}
                                </select>
                            </div>
                            <!-- Font Size -->
                            <div>
                                <select id="editor-size-select" onchange="window.updateEditorStyle('${activeDraft.id}')" class="bg-background border border-text-main/15 p-1.5 rounded-lg text-xs text-text-main focus:outline-none cursor-pointer">
                                    ${sizes.map(s => `<option value="${s.class}" ${data.fontSize === s.class ? 'selected' : ''}>${s.name}</option>`).join('')}
                                </select>
                            </div>
                            <span class="text-text-muted text-xs">|</span>
                            <!-- Direct Markdown helper inserts -->
                            <button onclick="window.insertMarkdownHelper('**')" class="text-xs hover:text-text-main px-1.5 font-bold cursor-pointer">B</button>
                            <button onclick="window.insertMarkdownHelper('*')" class="text-xs hover:text-text-main px-1.5 italic cursor-pointer">I</button>
                            <button onclick="window.insertMarkdownHelper('### ')" class="text-xs hover:text-text-main px-1.5 font-semibold cursor-pointer">H3</button>
                        </div>

                        <!-- Structured copy fields -->
                        <div class="flex flex-col gap-3">
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-1">Headline Hook</label>
                                <textarea id="editor-hook" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-xs focus:outline-none resize-none leading-relaxed h-14" placeholder="Enter headline hook...">${sanitizeHTML(data.hook)}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-1">Thesis & Core points</label>
                                <textarea id="editor-thesis" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-xs focus:outline-none resize-none leading-relaxed h-20" placeholder="Core arguments or key points (one per line)...">${sanitizeHTML(data.thesis)}</textarea>
                            </div>

                            <div>
                                <label class="block text-[9px] font-bold text-text-muted uppercase mb-1">Body Content</label>
                                <textarea id="editor-content" data-draft-id="${activeDraft.id}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" 
                                          class="w-full bg-panel-hover border border-text-main/15 p-4 rounded-xl text-text-main focus:outline-none resize-none leading-relaxed h-72 ${data.fontFamily} ${data.fontSize}" 
                                          placeholder="Write campaign body content...">${sanitizeHTML(data.body)}</textarea>
                            </div>

                            <!-- Graphic attachment preview -->
                            <div class="flex flex-col gap-1.5">
                                <label class="block text-[9px] font-bold text-text-muted uppercase">Graphic Asset URL</label>
                                <div class="flex gap-2">
                                    <input id="editor-image-url" type="text" value="${data.imageUrl}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="Paste image URL..." class="flex-grow bg-panel-hover border border-text-main/15 p-2 rounded-xl text-xs text-text-main focus:outline-none">
                                    ${data.imageUrl ? `<button onclick="window.clearEditorImage('${activeDraft.id}')" class="px-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs border border-rose-500/20 rounded-xl cursor-pointer">Remove</button>` : ''}
                                </div>
                                ${data.imageUrl ? `
                                <div class="w-full h-32 rounded-xl bg-cover bg-center border border-text-main/15 mt-1" style="background-image: url('${data.imageUrl}')"></div>
                                ` : ''}
                            </div>
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

            <!-- Col 3: Campaign Context & Extensive Metadata side panel (span 4) -->
            <div class="${metadataSidebarOpen ? 'lg:col-span-4' : 'hidden'} bg-background border border-text-main/15 rounded-2xl p-4 flex flex-col gap-4 max-h-[400px] lg:max-h-none overflow-hidden">
                <!-- Context tabs -->
                <div class="flex gap-3 border-b border-text-main/10 pb-2">
                    <button onclick="window.setDraftContextTab('metadata')" class="pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${activeContextTab === 'metadata' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">📝 Metadata</button>
                    <button onclick="window.setDraftContextTab('research')" class="pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${activeContextTab === 'research' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">🔍 Knowledge</button>
                    <button onclick="window.setDraftContextTab('media')" class="pb-1 text-xs font-bold uppercase tracking-wider cursor-pointer ${activeContextTab === 'media' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">🖼️ Assets</button>
                </div>

                <!-- Tab content viewport -->
                <div class="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
                    ${activeDraft && data ? (() => {
                        if (activeContextTab === 'metadata') {
                            const seoTitleLength = data.seoTitle.length;
                            const seoDescLength = data.seoDesc.length;
                            const captionXLength = data.socialCaptionX.length;
                            
                            const seoTitleAlert = seoTitleLength > 60 ? 'text-rose-500 font-bold' : seoTitleLength >= 50 ? 'text-emerald-500' : 'text-text-muted';
                            const seoDescAlert = seoDescLength > 160 ? 'text-rose-500 font-bold' : seoDescLength >= 120 ? 'text-emerald-500' : 'text-text-muted';
                            const captionXAlert = captionXLength > 280 ? 'text-rose-500 font-bold' : captionXLength >= 250 ? 'text-amber-500' : 'text-text-muted';
                            
                            return `
                            <!-- Category 1: CMS & Editorial settings -->
                            <div class="flex flex-col gap-2.5 border border-text-main/10 p-3.5 rounded-xl bg-panel-hover/10">
                                <h4 class="text-[10px] font-bold text-text-main uppercase tracking-wider border-b border-text-main/10 pb-1 flex items-center justify-between">
                                    <span>⚙️ CMS & Editorial Settings</span>
                                </h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Workflow Stage</label>
                                        <select id="editor-cms-status" onchange="window.updateCmsStatus('${activeDraft.id}', this.value)" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="draft" ${activeDraft.cmsStatus === 'draft' ? 'selected' : ''}>Draft</option>
                                            <option value="review" ${activeDraft.cmsStatus === 'review' ? 'selected' : ''}>In Review</option>
                                            <option value="approved" ${activeDraft.cmsStatus === 'approved' ? 'selected' : ''}>Approved</option>
                                            <option value="published" ${activeDraft.cmsStatus === 'published' ? 'selected' : ''}>Published</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Campaign Name</label>
                                        <input id="editor-campaign-name" type="text" value="${sanitizeHTML(data.campaignName)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Q3 Launch" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Content Category</label>
                                        <input id="editor-content-category" type="text" value="${sanitizeHTML(data.contentCategory)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Tutorials" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Target Persona</label>
                                        <input id="editor-target-persona" type="text" value="${sanitizeHTML(data.targetPersona)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Developer Lead" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                </div>
                                <div class="grid grid-cols-3 gap-1.5">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Funnel Stage</label>
                                        <select id="editor-funnel-stage" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-1.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="tofu" ${data.funnelStage === 'tofu' ? 'selected' : ''}>TOFU (Aware)</option>
                                            <option value="mofu" ${data.funnelStage === 'mofu' ? 'selected' : ''}>MOFU (Consider)</option>
                                            <option value="bofu" ${data.funnelStage === 'bofu' ? 'selected' : ''}>BOFU (Decide)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Language</label>
                                        <select id="editor-language" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-1.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="en" ${data.language === 'en' ? 'selected' : ''}>English</option>
                                            <option value="es" ${data.language === 'es' ? 'selected' : ''}>Spanish</option>
                                            <option value="fr" ${data.language === 'fr' ? 'selected' : ''}>French</option>
                                            <option value="de" ${data.language === 'de' ? 'selected' : ''}>German</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">License</label>
                                        <select id="editor-license" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-1.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="all-rights" ${data.license === 'all-rights' ? 'selected' : ''}>All Rights</option>
                                            <option value="creative-commons" ${data.license === 'creative-commons' ? 'selected' : ''}>CC BY 4.0</option>
                                            <option value="public-domain" ${data.license === 'public-domain' ? 'selected' : ''}>Public Domain</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Live Published URL</label>
                                    <input id="editor-live-url" type="url" value="${sanitizeHTML(data.liveUrl)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="https://live-post-url.com" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                </div>
                            </div>

                            <!-- Category 2: SEO Suite -->
                            <div class="flex flex-col gap-2.5 border border-text-main/10 p-3.5 rounded-xl bg-panel-hover/10">
                                <h4 class="text-[10px] font-bold text-text-main uppercase tracking-wider border-b border-text-main/10 pb-1">🔍 Search Engine Optimization (SEO)</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Focus Keyword</label>
                                        <input id="editor-focus-keyword" type="text" value="${sanitizeHTML(data.focusKeyword)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. better auth" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Search Intent</label>
                                        <select id="editor-search-intent" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="informational" ${data.searchIntent === 'informational' ? 'selected' : ''}>Informational</option>
                                            <option value="transactional" ${data.searchIntent === 'transactional' ? 'selected' : ''}>Transactional</option>
                                            <option value="commercial" ${data.searchIntent === 'commercial' ? 'selected' : ''}>Commercial</option>
                                            <option value="navigational" ${data.searchIntent === 'navigational' ? 'selected' : ''}>Navigational</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Meta Robots Tag</label>
                                        <select id="editor-meta-robots" onchange="window.saveStructuredDraft('${activeDraft.id}')" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                                            <option value="index, follow" ${data.metaRobots === 'index, follow' ? 'selected' : ''}>Index, Follow</option>
                                            <option value="noindex, follow" ${data.metaRobots === 'noindex, follow' ? 'selected' : ''}>Noindex, Follow</option>
                                            <option value="index, nofollow" ${data.metaRobots === 'index, nofollow' ? 'selected' : ''}>Index, Nofollow</option>
                                            <option value="noindex, nofollow" ${data.metaRobots === 'noindex, nofollow' ? 'selected' : ''}>Noindex, Nofollow</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Canonical URL</label>
                                        <input id="editor-canonical-url" type="url" value="${sanitizeHTML(data.canonicalUrl)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="https://main-source.com" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-0.5">
                                        <label class="block text-[8px] font-bold text-text-muted uppercase">SEO Target Title</label>
                                        <span class="text-[8px] ${seoTitleAlert}">${seoTitleLength}/60 chars</span>
                                    </div>
                                    <input id="editor-seo-title" type="text" value="${sanitizeHTML(data.seoTitle)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="Target Page Title tag..." class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                </div>
                                <div>
                                    <div class="flex justify-between items-center mb-0.5">
                                        <label class="block text-[8px] font-bold text-text-muted uppercase">SEO Target Meta Desc</label>
                                        <span class="text-[8px] ${seoDescAlert}">${seoDescLength}/160 chars</span>
                                    </div>
                                    <textarea id="editor-seo-desc" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" rows="2.5" placeholder="Meta description for search results snippet..." class="w-full bg-background border border-text-main/15 p-2.5 rounded-xl text-text-main text-xs focus:outline-none resize-none leading-normal">${sanitizeHTML(data.seoDesc)}</textarea>
                                </div>
                            </div>

                            <!-- Category 3: Social captions -->
                            <div class="flex flex-col gap-2.5 border border-text-main/10 p-3.5 rounded-xl bg-panel-hover/10">
                                <h4 class="text-[10px] font-bold text-text-main uppercase tracking-wider border-b border-text-main/10 pb-1">📣 Social Distribution & Hook Meta</h4>
                                <div>
                                    <div class="flex justify-between items-center mb-0.5">
                                        <label class="block text-[8px] font-bold text-text-muted uppercase">X (Twitter) Custom Caption</label>
                                        <span class="text-[8px] ${captionXAlert}">${captionXLength}/280 chars</span>
                                    </div>
                                    <textarea id="editor-caption-x" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" rows="2" placeholder="Punchy tweet version..." class="w-full bg-background border border-text-main/15 p-2 rounded-xl text-text-main text-xs focus:outline-none resize-none">${sanitizeHTML(data.socialCaptionX)}</textarea>
                                </div>
                                <div>
                                    <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">LinkedIn Custom Caption</label>
                                    <textarea id="editor-caption-linkedin" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" rows="2.5" placeholder="Professional, longer form LinkedIn hook..." class="w-full bg-background border border-text-main/15 p-2 rounded-xl text-text-main text-xs focus:outline-none resize-none">${data.socialCaptionLinkedIn ? sanitizeHTML(data.socialCaptionLinkedIn) : ''}</textarea>
                                </div>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Instagram Caption</label>
                                        <textarea id="editor-caption-insta" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" rows="2" placeholder="Instagram copy..." class="w-full bg-background border border-text-main/15 p-2 rounded-xl text-text-main text-xs focus:outline-none resize-none">${sanitizeHTML(data.socialCaptionInsta)}</textarea>
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Threads Caption</label>
                                        <textarea id="editor-caption-threads" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" rows="2" placeholder="Threads hook..." class="w-full bg-background border border-text-main/15 p-2 rounded-xl text-text-main text-xs focus:outline-none resize-none">${sanitizeHTML(data.socialCaptionThreads)}</textarea>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Social Graphic Image Alt Text</label>
                                    <input id="editor-social-alt-text" type="text" value="${data.socialAltText ? sanitizeHTML(data.socialAltText) : ''}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="Describe the graphic for accessibility..." class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                </div>
                                <div>
                                    <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">Suggested Hashtags</label>
                                    <input id="editor-hashtags" type="text" value="${sanitizeHTML(data.hashtags)}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. #marketing #seo" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                </div>
                            </div>

                            <!-- Category 4: Primary CTA settings -->
                            <div class="flex flex-col gap-2.5 border border-text-main/10 p-3.5 rounded-xl bg-panel-hover/10">
                                <h4 class="text-[10px] font-bold text-text-main uppercase tracking-wider border-b border-text-main/10 pb-1">🎯 Action & Lead CTA</h4>
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">CTA Button Text</label>
                                        <input id="editor-cta-text" type="text" value="${data.primaryCtaText ? sanitizeHTML(data.primaryCtaText) : ''}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="e.g. Sign Up Now" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                    <div>
                                        <label class="block text-[8px] font-bold text-text-muted uppercase mb-0.5">CTA Target URL</label>
                                        <input id="editor-cta-url" type="url" value="${data.primaryCtaUrl ? sanitizeHTML(data.primaryCtaUrl) : ''}" onkeyup="window.saveStructuredDraft('${activeDraft.id}')" placeholder="https://yoursite.com/signup" class="w-full bg-background border border-text-main/15 p-2 rounded-lg text-text-main text-xs focus:outline-none">
                                    </div>
                                </div>
                            </div>

                            <!-- Readability stats card -->
                            <div class="bg-panel-hover/30 border border-text-main/10 rounded-xl p-3.5 flex flex-col gap-1.5 mt-2">
                                <h5 class="text-[9px] font-bold text-text-main uppercase tracking-wider mb-1">Content Index Indicators</h5>
                                <div class="flex justify-between text-xs">
                                    <span class="text-text-muted">Total Words:</span>
                                    <span class="font-mono font-semibold">${words} words</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-text-muted">Est. Reading Time:</span>
                                    <span class="font-mono font-semibold text-emerald-500">${readingTime} min</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-text-muted">Readability Status:</span>
                                    <span class="font-bold ${words > 300 ? 'text-emerald-500' : 'text-amber-500'}">${words > 300 ? 'SEO Optimized' : 'Short Draft'}</span>
                                </div>
                            </div>
                            `;
                        } else if (activeContextTab === 'research') {
                            return `
                            <!-- Mini RAG query box -->
                            <div class="bg-panel-hover/30 border border-text-main/15 rounded-xl p-3 flex flex-col gap-2">
                                <h4 class="text-[10px] font-bold text-text-main uppercase">Query Knowledge Base</h4>
                                <div class="flex gap-1.5">
                                    <input id="draft-rag-input" type="text" class="flex-grow bg-panel-hover border border-text-main/15 p-1.5 rounded-lg text-text-main text-[11px] focus:outline-none" placeholder="Ask RAG...">
                                    <button onclick="window.queryDraftRAG('${pid}')" class="px-2.5 py-1.5 bg-text-main text-background text-[10px] font-bold rounded-lg cursor-pointer shrink-0">Ask</button>
                                </div>
                                <div id="draft-rag-response" class="hidden text-[10px] bg-text-main/5 p-2 rounded-lg text-text-muted leading-relaxed select-text mt-1"></div>
                            </div>

                            <!-- Documents library -->
                            <div class="flex flex-col gap-2">
                                <h4 class="text-[10px] font-bold text-text-main uppercase tracking-wider border-b border-text-main/10 pb-1">RAG Sources</h4>
                                ${projectDocs.map(doc => `
                                    <div class="bg-panel-hover/20 border border-text-main/15 p-2.5 rounded-xl flex flex-col gap-1.5 group/rag-item">
                                        <div class="flex justify-between items-center">
                                            <span class="text-[10px] text-text-main truncate max-w-[80%] font-bold" title="${sanitizeHTML(doc.title)}">${sanitizeHTML(doc.title)}</span>
                                            <button onclick="window.insertResearchText(\`${doc.content.replace(/`/g, '\\`').replace(/"/g, '\\"')}\`)" class="text-[9px] text-text-main hover:underline cursor-pointer opacity-0 group-hover/rag-item:opacity-100 transition-opacity">Insert</button>
                                        </div>
                                        <p class="text-[9px] text-text-muted line-clamp-2">${sanitizeHTML(doc.content)}</p>
                                    </div>
                                `).join('')}
                                ${projectDocs.length === 0 ? `<div class="text-[10px] text-text-muted italic text-center py-4">No indexed documents.</div>` : ''}
                            </div>
                            `;
                        } else {
                            return `
                            <!-- Media library -->
                            <div class="grid grid-cols-2 gap-2">
                                ${projectMedia.map(m => `
                                    <div class="bg-panel-hover/20 border border-text-main/15 rounded-xl overflow-hidden group/media-item flex flex-col justify-between">
                                        <div class="h-16 overflow-hidden bg-slate-900 relative">
                                            <img src="${m.url}" class="w-full h-full object-cover">
                                        </div>
                                        <div class="p-1.5 flex flex-col gap-1">
                                            <div class="text-[9px] text-text-main truncate font-semibold" title="${sanitizeHTML(m.title)}">${sanitizeHTML(m.title)}</div>
                                            <button onclick="window.insertMediaAssetUrl('${m.url}')" class="w-full py-1 bg-text-main text-background text-[8px] font-bold rounded cursor-pointer">Attach / Insert</button>
                                        </div>
                                    </div>
                                `).join('')}
                                ${projectMedia.length === 0 ? `<div class="col-span-2 text-[10px] text-text-muted italic text-center py-4">No media assets found.</div>` : ''}
                            </div>
                            `;
                        }
                    })() : `
                        <div class="text-center py-16 text-xs text-text-muted">
                            Open or create a content draft to view distribution parameters.
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

    w.setDraftContextTab = (tab: 'research' | 'media' | 'metadata') => {
        activeContextTab = tab;
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.updateCmsStatus = (id: string, val: string) => {
        const draft = state.drafts.find(d => d.id === id);
        if (draft) {
            draft.cmsStatus = val as any;
            w.saveStructuredDraft(id);
        }
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
        
        // Metadata fields
        const seoTitleEl = document.getElementById('editor-seo-title') as HTMLInputElement;
        const seoDescEl = document.getElementById('editor-seo-desc') as HTMLTextAreaElement;
        const focusKeywordEl = document.getElementById('editor-focus-keyword') as HTMLInputElement;
        const canonicalUrlEl = document.getElementById('editor-canonical-url') as HTMLInputElement;
        const searchIntentEl = document.getElementById('editor-search-intent') as HTMLSelectElement;
        const metaRobotsEl = document.getElementById('editor-meta-robots') as HTMLSelectElement;

        const hashtagsEl = document.getElementById('editor-hashtags') as HTMLInputElement;
        const captionXEl = document.getElementById('editor-caption-x') as HTMLTextAreaElement;
        const captionInstaEl = document.getElementById('editor-caption-insta') as HTMLTextAreaElement;
        const captionThreadsEl = document.getElementById('editor-caption-threads') as HTMLTextAreaElement;
        const captionLinkedInEl = document.getElementById('editor-caption-linkedin') as HTMLTextAreaElement;
        const socialAltTextEl = document.getElementById('editor-social-alt-text') as HTMLInputElement;

        const campaignNameEl = document.getElementById('editor-campaign-name') as HTMLInputElement;
        const targetPersonaEl = document.getElementById('editor-target-persona') as HTMLInputElement;
        const funnelStageEl = document.getElementById('editor-funnel-stage') as HTMLSelectElement;
        const primaryCtaTextEl = document.getElementById('editor-cta-text') as HTMLInputElement;
        const primaryCtaUrlEl = document.getElementById('editor-cta-url') as HTMLInputElement;
        const contentCategoryEl = document.getElementById('editor-content-category') as HTMLInputElement;
        const languageEl = document.getElementById('editor-language') as HTMLSelectElement;
        const licenseEl = document.getElementById('editor-license') as HTMLSelectElement;
        const liveUrlEl = document.getElementById('editor-live-url') as HTMLInputElement;

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
            fontSize: sizeEl ? sizeEl.value : "text-sm",
            
            seoTitle: seoTitleEl ? seoTitleEl.value : "",
            seoDesc: seoDescEl ? seoDescEl.value : "",
            focusKeyword: focusKeywordEl ? focusKeywordEl.value : "",
            canonicalUrl: canonicalUrlEl ? canonicalUrlEl.value : "",
            searchIntent: searchIntentEl ? searchIntentEl.value : "informational",
            metaRobots: metaRobotsEl ? metaRobotsEl.value : "index, follow",

            socialCaptionX: captionXEl ? captionXEl.value : "",
            socialCaptionInsta: captionInstaEl ? captionInstaEl.value : "",
            socialCaptionThreads: captionThreadsEl ? captionThreadsEl.value : "",
            socialCaptionLinkedIn: captionLinkedInEl ? captionLinkedInEl.value : "",
            socialAltText: socialAltTextEl ? socialAltTextEl.value : "",
            hashtags: hashtagsEl ? hashtagsEl.value : "",

            campaignName: campaignNameEl ? campaignNameEl.value : "",
            targetPersona: targetPersonaEl ? targetPersonaEl.value : "",
            funnelStage: funnelStageEl ? funnelStageEl.value : "tofu",
            primaryCtaText: primaryCtaTextEl ? primaryCtaTextEl.value : "",
            primaryCtaUrl: primaryCtaUrlEl ? primaryCtaUrlEl.value : "",
            contentCategory: contentCategoryEl ? contentCategoryEl.value : "",
            language: languageEl ? languageEl.value : "en",
            license: licenseEl ? licenseEl.value : "all-rights",
            liveUrl: liveUrlEl ? liveUrlEl.value : ""
        };

        draft.content = JSON.stringify(contentData);
        draft.updated = Date.now();
        state.saveState();
        
        // Update words/character counters locally
        if (bodyEl) {
            const text = bodyEl.value;
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const chars = text.length;
            const wordCounter = document.getElementById('editor-counter-words');
            const charCounter = document.getElementById('editor-counter-chars');
            if (wordCounter) wordCounter.innerText = `${words} words`;
            if (charCounter) charCounter.innerText = `${chars} characters`;
        }
        // Update live SEO metrics counter in the sidebar if DOM elements exist
        const seoTitleCounter = document.getElementById('editor-seo-title-count');
        if (seoTitleCounter && seoTitleEl) {
            seoTitleCounter.innerText = `${seoTitleEl.value.length}/60 chars`;
        }
        const seoDescCounter = document.getElementById('editor-seo-desc-count');
        if (seoDescCounter && seoDescEl) {
            seoDescCounter.innerText = `${seoDescEl.value.length}/160 chars`;
        }
        const captionXCounter = document.getElementById('editor-caption-x-count');
        if (captionXCounter && captionXEl) {
            captionXCounter.innerText = `${captionXEl.value.length}/280 chars`;
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
                box.innerHTML = `<strong>RAG Output:</strong> ${sanitizeHTML(matches[0].content)} <br><button onclick="window.insertResearchText(\`${matches[0].content.replace(/`/g, '\\`').replace(/"/g, '\\"')}\`)" class="text-text-main hover:underline mt-1 cursor-pointer text-[9px] block">Insert snippet into copy</button>`;
            } else {
                box.innerHTML = `No direct match in the database for "${sanitizeHTML(q)}". Try indexing more documents in your Research engine.`;
            }
        }, 600);
    };

    w.toggleDraftsSidebar = () => {
        const current = localStorage.getItem('meidallm_drafts_sidebar_open') !== 'false';
        localStorage.setItem('meidallm_drafts_sidebar_open', (!current).toString());
        w.navigateTo('drafts', state.currentProject || undefined);
    };

    w.toggleMetadataSidebar = () => {
        const current = localStorage.getItem('meidallm_metadata_sidebar_open') !== 'false';
        localStorage.setItem('meidallm_metadata_sidebar_open', (!current).toString());
        w.navigateTo('drafts', state.currentProject || undefined);
    };
}
