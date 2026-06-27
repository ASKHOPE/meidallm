import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

// List of global languages supported for translation
const GLOBAL_LANGUAGES = [
    { key: 'en', label: '🇺🇸 English' },
    { key: 'es', label: '🇪🇸 Spanish' },
    { key: 'fr', label: '🇫🇷 French' },
    { key: 'de', label: '🇩🇪 German' },
    { key: 'pt', label: '🇵🇹 Portuguese' },
    { key: 'it', label: '🇮🇹 Italian' },
    { key: 'ru', label: '🇷🇺 Russian' },
    { key: 'ja', label: '🇯🇵 Japanese' },
    { key: 'zh', label: '🇨🇳 Chinese' },
    { key: 'ar', label: '🇸🇦 Arabic' },
    { key: 'hi', label: '🇮🇳 Hindi' },
    { key: 'te', label: '🇮🇳 Telugu' },
    { key: 'bn', label: '🇧🇩 Bengali' },
    { key: 'nl', label: '🇳🇱 Dutch' },
    { key: 'ko', label: '🇰🇷 Korean' },
    { key: 'tr', label: '🇹🇷 Turkish' },
    { key: 'vi', label: '🇻🇳 Vietnamese' },
    { key: 'pl', label: '🇵🇱 Polish' },
    { key: 'sv', label: '🇸🇪 Swedish' },
    { key: 'el', label: '🇬🇷 Greek' },
    { key: 'he', label: '🇮🇱 Hebrew' }
];

export function renderComposeView(pid?: string): string {
    const currentProjectId = pid || state.currentProject || 'p1';
    
    // Read state parameters (or fallback to defaults)
    const primaryLang = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_primary_lang') : 'en') || 'en';
    const secondaryLang = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_secondary_lang') : 'es') || 'es';
    const layoutMode = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_layout') : 'single') || 'single';
    const activeMetaTab = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_meta_tab') : 'social') || 'social';
    const activeFont = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_font') : 'font-inter') || 'font-inter';
    const isHtmlMode = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_compose_html_mode') === 'true' : false);

    // Get current project media assets
    const projectMedia = state.mediaAssets.filter(m => m.projectId === currentProjectId);

    return `
    <div class="fade-in flex flex-col gap-5 max-w-[1700px] mx-auto w-full text-[var(--color-text-main)]">

        <!-- ── Compact Header Bar ── -->
        <div class="flex flex-wrap justify-between items-center gap-3">

            <!-- Left: Title -->
            <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <svg class="w-3.5 h-3.5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </div>
                <div>
                    <h2 class="text-sm font-bold text-[var(--color-text-main)] leading-none">Content Studio</h2>
                    <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5">WYSIWYG · Dual-column · Multi-language</p>
                </div>
            </div>

            <!-- Right: Controls -->
            <div class="flex flex-wrap items-center gap-2">

                <!-- Language pills -->
                <div class="flex items-center bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-lg overflow-hidden divide-x divide-[var(--color-glass-border)]">
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5">
                        <span class="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">A</span>
                        <select id="compose-primary-lang" onchange="window.updateComposeLangSetting('primary', this.value)"
                            class="bg-transparent text-[11px] font-semibold text-[var(--color-text-main)] cursor-pointer outline-none border-none appearance-none pr-4"
                            style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a1a1aa'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 0 center;">
                            ${GLOBAL_LANGUAGES.map(l => `<option value="${l.key}" ${primaryLang === l.key ? 'selected' : ''}>${l.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex items-center gap-1.5 px-2.5 py-1.5">
                        <span class="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">B</span>
                        <select id="compose-secondary-lang" onchange="window.updateComposeLangSetting('secondary', this.value)"
                            class="bg-transparent text-[11px] font-semibold text-[var(--color-text-main)] cursor-pointer outline-none border-none appearance-none pr-4"
                            style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a1a1aa'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 0 center;">
                            ${GLOBAL_LANGUAGES.map(l => `<option value="${l.key}" ${secondaryLang === l.key ? 'selected' : ''}>${l.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <!-- Transliteration badge -->
                ${(primaryLang === 'hi' || primaryLang === 'te') ? `
                <div class="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-md">
                    <span class="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"></span>
                    <span class="text-[9px] font-bold text-orange-400">${primaryLang === 'hi' ? 'हिंदी' : 'తెలుగు'} Phonetic</span>
                </div>` : ''}

                <!-- Layout toggle -->
                <div class="flex bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-lg overflow-hidden">
                    <button onclick="window.updateComposeLayout('single')"
                        class="px-3 py-1.5 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${layoutMode === 'single' ? 'bg-violet-600 text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        Single
                    </button>
                    <button onclick="window.updateComposeLayout('dual')"
                        class="px-3 py-1.5 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-l border-[var(--color-glass-border)] ${layoutMode === 'dual' ? 'bg-violet-600 text-white' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="8" height="18" rx="1"/><rect x="13" y="3" width="8" height="18" rx="1"/></svg>
                        Dual
                    </button>
                </div>

                <!-- AI Translate -->
                <button onclick="window.runComposeAITranslate()"
                    class="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[10px] font-semibold transition-all cursor-pointer shadow-sm shadow-violet-900/30">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>
                    Translate
                </button>
            </div>
        </div>

        <!-- ── Main Grid ── -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

            <!-- ── Editor Panel (col-span-8) ── -->
            <div class="lg:col-span-8 flex flex-col bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden shadow-lg">

                <!-- Menubar -->
                <div class="flex items-center gap-0.5 px-3 py-1.5 border-b border-[var(--color-glass-border)] bg-[var(--color-panel-hover)]/40">
                    ${[
                        { label: 'File', items: [
                            { label: 'New Document', fn: "window.clearRceDocument()" },
                            { label: 'Print', fn: "window.printRceDocument()" }
                        ]},
                        { label: 'Edit', items: [
                            { label: 'Undo', fn: "window.execComposeFormat('undo')" },
                            { label: 'Redo', fn: "window.execComposeFormat('redo')" },
                            { label: '---' },
                            { label: 'Select All', fn: "window.execComposeFormat('selectAll')" }
                        ]},
                        { label: 'View', items: [
                            { label: 'Toggle HTML', fn: "window.toggleRceHtmlView()" },
                            { label: 'Fullscreen', fn: "window.toggleRceFullscreen()" }
                        ]},
                        { label: 'Insert', items: [
                            { label: 'Link', fn: "window.promptInsertComposeLink()" },
                            { label: 'Image', fn: "window.promptInsertComposeImage()" },
                            { label: 'Video', fn: "window.promptInsertComposeVideo()" },
                            { label: 'Audio', fn: "window.promptInsertComposeAudio()" },
                            { label: '---' },
                            { label: 'Table', fn: "window.insertRceTable()" },
                            { label: 'Divider', fn: "window.execComposeFormat('insertHorizontalRule')" }
                        ]},
                        { label: 'Format', items: [
                            { label: 'Bold', fn: "window.execComposeFormat('bold')" },
                            { label: 'Italic', fn: "window.execComposeFormat('italic')" },
                            { label: 'Underline', fn: "window.execComposeFormat('underline')" },
                            { label: 'Strikethrough', fn: "window.execComposeFormat('strikeThrough')" }
                        ]},
                        { label: 'Tools', items: [
                            { label: 'Word Count', fn: "window.calculateRceWordCount()" },
                            { label: 'AI Translate', fn: "window.runComposeAITranslate()" }
                        ]}
                    ].map(menu => `
                        <div class="relative group">
                            <button class="px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] rounded transition-colors cursor-pointer font-medium">${menu.label}</button>
                            <div class="absolute left-0 top-full mt-0.5 w-40 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-2xl py-1 hidden group-hover:block z-30">
                                ${menu.items.map((item: any) => item.label === '---'
                                    ? `<div class="border-t border-[var(--color-glass-border)] my-1"></div>`
                                    : `<button onclick="${item.fn}" class="w-full text-left px-3 py-1.5 text-[11px] hover:bg-[var(--color-panel-hover)] text-[var(--color-text-main)] transition-colors">${item.label}</button>`
                                ).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- ── Formatting Toolbar ── -->
                <div class="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--color-glass-border)] select-none">

                    <!-- Font family -->
                    <select id="compose-font-selector" onchange="window.updateComposeFontFamily(this.value)"
                        class="h-7 px-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] text-[11px] font-medium text-[var(--color-text-main)] rounded-md cursor-pointer outline-none appearance-none"
                        style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a1a1aa'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 6px center; padding-right: 20px;">
                        <option value="font-inter"    ${activeFont === 'font-inter'    ? 'selected' : ''}>Inter</option>
                        <option value="font-outfit"   ${activeFont === 'font-outfit'   ? 'selected' : ''}>Outfit</option>
                        <option value="font-playfair" ${activeFont === 'font-playfair' ? 'selected' : ''}>Playfair</option>
                        <option value="font-fira"     ${activeFont === 'font-fira'     ? 'selected' : ''}>Fira Code</option>
                        <option value="font-roboto"   ${activeFont === 'font-roboto'   ? 'selected' : ''}>Roboto</option>
                    </select>

                    <!-- Block type -->
                    <select onchange="window.execComposeFormat('formatBlock', this.value); this.selectedIndex = 0;"
                        class="h-7 px-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] text-[11px] font-medium text-[var(--color-text-main)] rounded-md cursor-pointer outline-none appearance-none"
                        style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a1a1aa'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 6px center; padding-right: 20px;">
                        <option value="">Style</option>
                        <option value="H1">H1</option>
                        <option value="H2">H2</option>
                        <option value="H3">H3</option>
                        <option value="H4">H4</option>
                        <option value="P">¶ Para</option>
                    </select>

                    <div class="w-px h-5 bg-[var(--color-glass-border)] mx-0.5"></div>

                    <!-- Bold / Italic / Underline / Strike -->
                    <button id="rce-btn-bold"      onclick="window.execComposeFormat('bold')"          class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Bold">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
                    </button>
                    <button id="rce-btn-italic"    onclick="window.execComposeFormat('italic')"        class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Italic">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
                    </button>
                    <button id="rce-btn-underline" onclick="window.execComposeFormat('underline')"     class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Underline">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
                    </button>
                    <button id="rce-btn-strike"    onclick="window.execComposeFormat('strikeThrough')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Strikethrough">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><path d="M16 6C16 6 14.5 4 12 4s-5 1.5-5 4c0 2 1.36 3.38 3 4"/><path d="M8 18c0 0 1.5 2 4 2s5-1.5 5-4c0-2-1.36-3.38-3-4"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('superscript')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer text-[10px] font-bold" title="Superscript">x²</button>
                    <button onclick="window.execComposeFormat('subscript')"   class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer text-[10px] font-bold" title="Subscript">x₂</button>

                    <div class="w-px h-5 bg-[var(--color-glass-border)] mx-0.5"></div>

                    <!-- Text color / Highlight -->
                    <button onclick="window.promptComposeColor('foreColor')"  class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Text Color">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3L5 21"/><path d="m15 3-5.47 13.53"/><path d="M2 15h14"/><line x1="19" y1="3" x2="19" y2="21"/><line x1="22" y1="3" x2="16" y2="3"/><line x1="22" y1="21" x2="16" y2="21"/></svg>
                    </button>
                    <button onclick="window.promptComposeColor('hiliteColor')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Highlight">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>
                    </button>

                    <div class="w-px h-5 bg-[var(--color-glass-border)] mx-0.5"></div>

                    <!-- Alignment -->
                    <button onclick="window.execComposeFormat('justifyLeft')"   class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Align Left">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('justifyCenter')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Align Center">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="7" y2="12"/><line x1="19" y1="18" x2="5" y2="18"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('justifyRight')"  class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Align Right">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
                    </button>

                    <div class="w-px h-5 bg-[var(--color-glass-border)] mx-0.5"></div>

                    <!-- Lists & Indent -->
                    <button onclick="window.execComposeFormat('insertUnorderedList')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Bullet List">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('insertOrderedList')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Numbered List">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('outdent')" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Outdent">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="3" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
                    </button>
                    <button onclick="window.execComposeFormat('indent')"  class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Indent">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 8 21 12 17 16"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="13" y2="6"/><line x1="3" y1="18" x2="13" y2="18"/></svg>
                    </button>

                    <div class="w-px h-5 bg-[var(--color-glass-border)] mx-0.5"></div>

                    <!-- Table -->
                    <button onclick="window.insertRceTable()" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Insert Table">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>
                    </button>

                    <!-- Math symbols -->
                    <select onchange="window.insertRceMathSymbol(this.value); this.selectedIndex = 0;"
                        class="h-7 px-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] text-[11px] font-medium text-[var(--color-text-main)] rounded-md cursor-pointer outline-none appearance-none"
                        style="background-image: url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23a1a1aa'/%3E%3C/svg%3E&quot;); background-repeat: no-repeat; background-position: right 6px center; padding-right: 20px;" title="Insert math symbol">
                        <option value="">Ω Math</option>
                        <option value="∑">∑ Sum</option>
                        <option value="√">√ Root</option>
                        <option value="π">π Pi</option>
                        <option value="θ">θ Theta</option>
                        <option value="Ω">Ω Omega</option>
                        <option value="Δ">Δ Delta</option>
                        <option value="μ">μ Mu</option>
                        <option value="∞">∞ Inf</option>
                    </select>

                    <!-- HTML / Fullscreen -->
                    <div class="ml-auto flex items-center gap-1">
                        <button onclick="window.toggleRceHtmlView()" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer font-mono text-[9px] font-bold" title="HTML Source">&lt;/&gt;</button>
                        <button onclick="window.toggleRceFullscreen()" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer" title="Fullscreen">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
                        </button>
                    </div>
                </div>

                <!-- Editor Sheets (Visual contenteditable vs Raw HTML Textareas) -->
                <div class="px-4 pb-4 pt-3 grid grid-cols-1 ${layoutMode === 'dual' ? 'md:grid-cols-2' : ''} gap-4 transition-all">
                    
                    <!-- COLUMN 1: PRIMARY LANGUAGE WORKSPACE -->
                    <div class="flex flex-col gap-3">
                        <!-- Header bar -->
                        <div class="flex justify-between items-center bg-[var(--color-panel-hover)] px-3 py-1.5 rounded-lg border border-[var(--color-glass-border)]/50">
                            <span class="text-[10px] font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                                🟢 Primary Sheet (${GLOBAL_LANGUAGES.find(l => l.key === primaryLang)?.label})
                                ${(primaryLang === 'hi' || primaryLang === 'te') ? `
                                <span class="text-[8px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <span class="w-1 h-1 rounded-full bg-orange-400 animate-pulse"></span>
                                    Type English → ${primaryLang === 'hi' ? 'हिंदी' : 'తెలుగు'} (Space to convert)
                                </span>` : ''}
                            </span>
                            <span class="text-[8px] text-indigo-400 flex items-center gap-1 font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                RH editing body
                            </span>
                        </div>
                        
                        <!-- Header Inputs -->
                        <div class="flex flex-col gap-2">
                            <input type="text" id="compose-title" placeholder="Primary Title..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-xs text-[var(--color-text-main)] focus:outline-none">
                            <input type="text" id="compose-subtitle" placeholder="Primary Subtitle / Hook..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-xs text-[var(--color-text-main)] focus:outline-none">
                        </div>

                        <!-- Rich visual editor vs HTML raw editor -->
                        <div class="relative min-h-[400px]">
                            <!-- Visual Contenteditable Sheet -->
                            <div id="compose-body-contentable" 
                                 contenteditable="true" 
                                 ondragover="event.preventDefault()"
                                 ondrop="window.handleComposeDrop(event, 'compose-body-contentable')"
                                 class="editor-canvas w-full bg-[var(--color-background)] border border-[var(--color-glass-border)]/80 shadow-2xl p-8 rounded-2xl text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[400px] leading-relaxed max-h-[550px] overflow-y-auto ${activeFont} ${isHtmlMode ? 'hidden' : ''}"
                                 style="font-family: var(--editor-font-family, 'Inter', sans-serif);">
                                <div><h2>Executive Summary</h2></div><div><p>Start composing your main campaign article here...</p></div>
                            </div>
                            
                            <!-- HTML Source Textarea -->
                            <textarea id="compose-body-html" 
                                      class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-6 rounded-2xl text-xs text-emerald-400 font-mono focus:outline-none min-h-[400px] max-h-[550px] overflow-y-auto leading-relaxed ${isHtmlMode ? '' : 'hidden'}"
                                      placeholder="HTML Source Code..."></textarea>
                        </div>
                    </div>

                    <!-- COLUMN 2: SECONDARY LANGUAGE WORKSPACE (Dual Column Mode) -->
                    ${layoutMode === 'dual' ? `
                    <div class="flex flex-col gap-3 border-l border-[var(--color-glass-border)]/50 pl-6 animate-[fadeIn_0.2s_ease-out]">
                        <!-- Header bar -->
                        <div class="flex justify-between items-center bg-[var(--color-panel-hover)] px-3 py-1.5 rounded-lg border border-[var(--color-glass-border)]/50">
                            <span class="text-[10px] font-bold text-[var(--color-text-main)] flex items-center gap-1.5">
                                🟡 Secondary Sheet (${GLOBAL_LANGUAGES.find(l => l.key === secondaryLang)?.label})
                            </span>
                            <span class="text-[8px] text-rose-400 flex items-center gap-1 font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                                GB co-authoring
                            </span>
                        </div>
                        
                        <!-- Header Inputs -->
                        <div class="flex flex-col gap-2">
                            <input type="text" id="compose-title-secondary" placeholder="Secondary Title..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-xs text-[var(--color-text-main)] focus:outline-none">
                            <input type="text" id="compose-subtitle-secondary" placeholder="Secondary Subtitle / Hook..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-xs text-[var(--color-text-main)] focus:outline-none">
                        </div>

                        <!-- Rich visual editor vs HTML raw editor -->
                        <div class="relative min-h-[400px]">
                            <!-- Visual Contenteditable Sheet -->
                            <div id="compose-body-contentable-secondary" 
                                 contenteditable="true" 
                                 ondragover="event.preventDefault()"
                                 ondrop="window.handleComposeDrop(event, 'compose-body-contentable-secondary')"
                                 class="editor-canvas w-full bg-[var(--color-background)] border border-[var(--color-glass-border)]/80 shadow-2xl p-8 rounded-2xl text-sm text-[var(--color-text-main)] focus:outline-none focus:ring-1 focus:ring-violet-500 min-h-[400px] leading-relaxed max-h-[550px] overflow-y-auto ${activeFont} ${isHtmlMode ? 'hidden' : ''}"
                                 style="font-family: var(--editor-font-family, 'Inter', sans-serif);">
                                <div><h2>Resumen Ejecutivo</h2></div><div><p>Comience a redactar la versión traducida aquí...</p></div>
                            </div>
                            
                            <!-- HTML Source Textarea -->
                            <textarea id="compose-body-html-secondary" 
                                      class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-6 rounded-2xl text-xs text-emerald-400 font-mono focus:outline-none min-h-[400px] max-h-[550px] overflow-y-auto leading-relaxed ${isHtmlMode ? '' : 'hidden'}"
                                      placeholder="HTML Source Code..."></textarea>
                        </div>
                    </div>` : ''}

                </div>

                <!-- Collaborative Presence typing indicator -->
                <div id="compose-typing-indicator" class="bg-[var(--color-panel-hover)]/30 border border-[var(--color-glass-border)] rounded-full px-3 py-1.5 flex items-center gap-2 text-[9px] text-[var(--color-text-muted)] w-fit shadow-md hidden animate-pulse">
                    <span class="flex gap-0.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"></span>
                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]"></span>
                    </span>
                    <span>Richard Hendricks is co-editing live...</span>
                </div>

                <!-- RCE Statusbar Footer -->
                <div class="flex justify-between items-center bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-xl mt-3 text-xs select-none">
                    <!-- Left: Word count status -->
                    <div id="rce-statusbar-left" class="text-[10px] text-[var(--color-text-muted)] font-semibold flex items-center gap-3">
                        <span id="rce-word-count">Words: 2</span>
                        <span class="w-[1px] h-3 bg-[var(--color-glass-border)]"></span>
                        <span id="rce-char-count">Characters: 120</span>
                    </div>

                    <!-- Right: Toggle HTML view and Fullscreen -->
                    <div class="flex items-center gap-2">
                        <button onclick="window.toggleRceHtmlView()" class="px-2.5 py-1 bg-background border border-[var(--color-glass-border)] rounded text-[9px] font-bold text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] cursor-pointer transition-colors" title="Toggle Raw HTML Editor">
                            &lt;/&gt; HTML Editor
                        </button>
                        <button onclick="window.toggleRceFullscreen()" class="px-2.5 py-1 bg-background border border-[var(--color-glass-border)] rounded text-[9px] font-bold text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] cursor-pointer transition-colors" title="Toggle Fullscreen Mode">
                            📺 Fullscreen
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex justify-between items-center px-4 py-3 border-t border-[var(--color-glass-border)]">
                    <div class="flex gap-2">
                        <button onclick="window.saveComposeAsDraft('${currentProjectId}')" class="px-4 py-2 bg-[var(--color-panel-hover)] hover:bg-[var(--color-panel-hover)]/80 text-[var(--color-text-main)] rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-[var(--color-glass-border)]">
                            Save Draft
                        </button>
                        <button onclick="window.submitComposeForReview('${currentProjectId}')" class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer">
                            Submit for Review
                        </button>
                    </div>
                </div>
            </div>

            <!-- 2. RIGHT SIDEBAR: METADATA & MEDIA LIBRARY (Col Span 4) -->
            <div class="lg:col-span-4 flex flex-col gap-6">
                <!-- Cover Image & Author Section -->
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                    <div>
                        <h3 class="text-xs font-bold font-outfit text-[var(--color-text-main)] flex items-center gap-1.5">
                            🖼️ Document Cover & Bio
                        </h3>
                        <p class="text-[9px] text-[var(--color-text-muted)] mt-0.5 font-medium">Visual cover and author details.</p>
                    </div>
                    <div class="flex flex-col gap-3">
                        <div>
                            <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Cover Image URL</label>
                            <div class="relative">
                                <input type="text" id="compose-cover-image" oninput="window.updateComposeCoverPreview(this.value)" placeholder="https://example.com/image.jpg" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] focus:outline-none">
                                <button onclick="window.simulateImageUpload()" class="absolute right-2 top-1.5 text-violet-400 hover:text-violet-300" title="Simulate Upload">🖼️</button>
                            </div>
                            <div id="compose-cover-preview" class="hidden mt-2 w-full h-16 rounded-lg overflow-hidden border border-[var(--color-glass-border)] bg-cover bg-center"></div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1 truncate" title="Author">Author</label>
                                <input type="text" id="compose-author" value="Hosanna" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] focus:outline-none min-w-0">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1 truncate" title="Designation">Designation</label>
                                <input type="text" id="compose-designation" value="Lead Editor" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] focus:outline-none min-w-0">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section A: Platform Publishing Metadata -->
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                    <div>
                        <h3 class="text-xs font-bold font-outfit text-[var(--color-text-main)] flex items-center gap-1.5">
                            📦 Publishing Metadata
                        </h3>
                        <p class="text-[9px] text-[var(--color-text-muted)] mt-0.5 font-medium">Custom parameters for target channels.</p>
                    </div>

                    <!-- Tabs to switch platform category scope -->
                    <div class="flex border-b border-[var(--color-glass-border)] text-center text-[9px] font-bold">
                        <button onclick="window.switchComposeMetaTab('social')" class="flex-1 pb-2 border-b-2 transition-all cursor-pointer ${activeMetaTab === 'social' ? 'border-violet-500 text-violet-400' : 'border-transparent text-[var(--color-text-muted)]'}" id="meta-tab-btn-social">Social</button>
                        <button onclick="window.switchComposeMetaTab('video')" class="flex-1 pb-2 border-b-2 transition-all cursor-pointer ${activeMetaTab === 'video' ? 'border-violet-500 text-violet-400' : 'border-transparent text-[var(--color-text-muted)]'}" id="meta-tab-btn-video">Video</button>
                        <button onclick="window.switchComposeMetaTab('live')" class="flex-1 pb-2 border-b-2 transition-all cursor-pointer ${activeMetaTab === 'live' ? 'border-violet-500 text-violet-400' : 'border-transparent text-[var(--color-text-muted)]'}" id="meta-tab-btn-live">Live</button>
                        <button onclick="window.switchComposeMetaTab('podcast')" class="flex-1 pb-2 border-b-2 transition-all cursor-pointer ${activeMetaTab === 'podcast' ? 'border-violet-500 text-violet-400' : 'border-transparent text-[var(--color-text-muted)]'}" id="meta-tab-btn-podcast">Podcast</button>
                    </div>

                    <!-- Tabs Content list -->
                    <div id="meta-pane-container" class="max-h-[220px] overflow-y-auto no-scrollbar flex flex-col gap-3 text-left">
                        
                        <!-- Content Tags & Alternative Titles (Always visible at the top of metadata panel) -->
                        <div class="border-b border-[var(--color-glass-border)] pb-3 mb-1 flex flex-col gap-3">
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Content Tags</label>
                                <input type="text" id="compose-tags" placeholder="e.g. tech, product, guide" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Alternative Title (A/B Test)</label>
                                <input type="text" id="compose-alt-title-1" placeholder="Alt Title (e.g. for newsletter)" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                        </div>

                        <!-- 1. SOCIAL MEDIA METADATA -->
                        <div id="meta-pane-social" class="${activeMetaTab === 'social' ? '' : 'hidden'} flex flex-col gap-3">
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">X (Twitter) Caption</label>
                                <textarea id="meta-social-x" rows="2" placeholder="Write tweet thread..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Instagram Caption</label>
                                <textarea id="meta-social-insta" rows="2" placeholder="Write caption + hashtags..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">LinkedIn Post Draft</label>
                                <textarea id="meta-social-linkedin" rows="2" placeholder="Write B2B corporate content..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Reddit Subreddit</label>
                                <input id="meta-social-subreddit" type="text" placeholder="e.g. r/technology" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                        </div>

                        <!-- 2. VIDEO PLATFORM METADATA -->
                        <div id="meta-pane-video" class="${activeMetaTab === 'video' ? '' : 'hidden'} flex flex-col gap-3">
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">YouTube Video Description</label>
                                <textarea id="meta-video-desc" rows="3" placeholder="Write optimized description..." class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] resize-none"></textarea>
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Video Visibility</label>
                                <select id="meta-video-visibility" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)] cursor-pointer">
                                    <option value="public">🌐 Public (Immediate)</option>
                                    <option value="unlisted">🔗 Unlisted</option>
                                    <option value="private">🔒 Private</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-2 mt-1">
                                <input type="checkbox" id="meta-video-shorts" class="w-3.5 h-3.5 cursor-pointer accent-violet-500">
                                <label for="meta-video-shorts" class="text-[9px] font-bold text-[var(--color-text-main)] uppercase cursor-pointer select-none">Publish as Shorts/TikTok</label>
                            </div>
                        </div>

                        <!-- 3. LIVE STREAMING METADATA -->
                        <div id="meta-pane-live" class="${activeMetaTab === 'live' ? '' : 'hidden'} flex flex-col gap-3">
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Twitch Stream Title</label>
                                <input id="meta-live-title" type="text" placeholder="e.g. Q4 Product Launch Q&A!" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Stream Category</label>
                                <input id="meta-live-category" type="text" placeholder="e.g. Talk Shows & Podcasts" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                        </div>

                        <!-- 4. PODCAST METADATA -->
                        <div id="meta-pane-podcast" class="${activeMetaTab === 'podcast' ? '' : 'hidden'} flex flex-col gap-3">
                            <div class="grid grid-cols-2 gap-2">
                                <div>
                                    <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Episode #</label>
                                    <input id="meta-pod-episode" type="number" placeholder="1" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                                </div>
                                <div>
                                    <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Season #</label>
                                    <input id="meta-pod-season" type="number" placeholder="1" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                                </div>
                            </div>
                            <div>
                                <label class="block text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">Audio Source URL</label>
                                <input id="meta-pod-audio" type="text" placeholder="https://example.com/audio.mp3" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2 rounded text-xs text-[var(--color-text-main)]">
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Section B: Media Library Panel -->
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
                    <div>
                        <h3 class="text-xs font-bold font-outfit text-[var(--color-text-main)] flex items-center gap-1.5">
                            📁 Media Library
                        </h3>
                        <p class="text-[9px] text-[var(--color-text-muted)] mt-0.5 font-medium">Drag assets into the editor sheet.</p>
                    </div>
                    
                    <div class="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                        ${projectMedia.map(m => {
                            const isVideo = m.type === 'video' || m.url.includes('.mp4');
                            const isAudio = m.type === 'audio' || m.url.includes('.mp3');
                            
                            let previewHTML = '';
                            if (isVideo) {
                                previewHTML = `<div class="w-full h-14 bg-slate-800 rounded-lg flex items-center justify-center text-lg border border-[var(--color-glass-border)]">🎥</div>`;
                            } else if (isAudio) {
                                previewHTML = `<div class="w-full h-14 bg-slate-800 rounded-lg flex items-center justify-center text-lg border border-[var(--color-glass-border)]">🎵</div>`;
                            } else {
                                previewHTML = `<div class="w-full h-14 rounded-lg border border-[var(--color-glass-border)] bg-cover bg-center" style="background-image: url('${m.url}')"></div>`;
                            }

                            return `
                            <div draggable="true"
                                 ondragstart="window.handleAssetDragStart(event, '${m.id}', '${m.url}', '${m.type}')"
                                 class="bg-[var(--color-panel-hover)]/30 border border-[var(--color-glass-border)] p-2 rounded-xl flex flex-col gap-2 hover:border-violet-500/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing group">
                                
                                ${previewHTML}
                                
                                <div class="flex justify-between items-start gap-1">
                                    <span class="text-[9px] font-bold text-[var(--color-text-main)] truncate max-w-[80px]" title="${sanitizeHTML(m.title)}">${sanitizeHTML(m.title)}</span>
                                    <button onclick="window.insertAssetAtCursor('${m.url}', '${m.type}')" class="text-[8px] bg-violet-600/10 text-violet-400 hover:bg-violet-600 hover:text-white px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer">+ Add</button>
                                </div>
                            </div>
                            `;
                        }).join('')}
                        
                        ${projectMedia.length === 0 ? `
                            <div class="text-center text-[10px] text-[var(--color-text-muted)] py-8 border border-dashed border-[var(--color-glass-border)] rounded-xl">
                                No assets in library. Upload files in Media Assets tab.
                            </div>` : ''}
                    </div>
                </div>

            </div>
            
        </div>
    </div>
    `;
}
