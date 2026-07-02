import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderIdeasView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;
    
    state.currentProject = p.id;
    const projectIdeas = state.ideasState.filter(i => i.projectId === pid);

    return `
    <div class="fade-in flex flex-col h-full min-h-[500px] text-text-main">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">${sanitizeHTML(p.name)} Idea Board</h2>
                <p class="text-xs text-text-muted">Brainstorm features and campaign steps.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative w-48">
                    <input type="text" id="ideas-search-input" oninput="window.filterIdeas()" placeholder="Search notes..." class="w-full bg-panel-hover border border-text-main/15 rounded-xl pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-text-main transition-all">
                    <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">${getIconSVG('search', 'w-3.5 h-3.5')}</span>
                </div>
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-semibold text-text-main hover:bg-panel-hover/80 transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.addStickyNote('${pid}')" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">+ Add Note</button>
            </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-grow items-start">
            ${projectIdeas.map(idea => `
                <div class="idea-note-item bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col justify-between min-h-[220px] hover:border-text-main/40 transition-all group relative text-left"
                     data-content="${sanitizeHTML(idea.content)}">
                    <div class="flex flex-col gap-2 w-full">
                        <div class="flex items-center justify-between select-none border-b border-text-main/5 pb-2">
                            <div class="flex items-center gap-1.5">
                                <span class="text-text-muted/40 text-xs font-bold leading-none cursor-grab active:cursor-grabbing select-none" title="Drag note">⋮⋮</span>
                                <span class="text-[9px] font-bold text-text-muted uppercase tracking-wider">Sticky Note</span>
                            </div>
                            <!-- Rich Text Toolbar -->
                            <div class="flex items-center gap-1 ml-auto">
                                <button onclick="document.execCommand('bold', false); window.updateStickyNote('${idea.id}', document.getElementById('idea-editor-${idea.id}').innerHTML, true)" class="p-1 text-text-muted hover:text-text-main text-[10px] font-bold cursor-pointer" title="Bold">B</button>
                                <button onclick="document.execCommand('italic', false); window.updateStickyNote('${idea.id}', document.getElementById('idea-editor-${idea.id}').innerHTML, true)" class="p-1 text-text-muted hover:text-text-main text-[10px] italic cursor-pointer" title="Italic">I</button>
                                <button onclick="document.execCommand('underline', false); window.updateStickyNote('${idea.id}', document.getElementById('idea-editor-${idea.id}').innerHTML, true)" class="p-1 text-text-muted hover:text-text-main text-[10px] underline cursor-pointer" title="Underline">U</button>
                                <select onchange="document.execCommand('fontName', false, this.value); window.updateStickyNote('${idea.id}', document.getElementById('idea-editor-${idea.id}').innerHTML, true)" class="bg-transparent text-text-muted hover:text-text-main text-[9px] border-0 focus:ring-0 p-0.5 cursor-pointer max-w-[65px]" title="Font">
                                    <option value="Inter" selected>Inter</option>
                                    <option value="Outfit">Outfit</option>
                                    <option value="Georgia">Georgia</option>
                                    <option value="Courier New">Courier</option>
                                </select>
                                <button onclick="document.getElementById('idea-img-input-${idea.id}').click()" class="p-1 text-text-muted hover:text-text-main cursor-pointer" title="Insert Image">
                                    ${getIconSVG('image', 'w-3.5 h-3.5')}
                                </button>
                                <button onclick="document.getElementById('idea-file-input-${idea.id}').click()" class="p-1 text-text-muted hover:text-text-main cursor-pointer" title="Attach File">
                                    ${getIconSVG('paperclip', 'w-3.5 h-3.5')}
                                </button>
                                <input type="file" id="idea-img-input-${idea.id}" class="hidden" accept="image/*" onchange="window.handleIdeaImgUpload('${idea.id}', this)">
                                <input type="file" id="idea-file-input-${idea.id}" class="hidden" accept="*" onchange="window.handleIdeaFileUpload('${idea.id}', this)">
                            </div>
                        </div>
                        <div id="idea-editor-${idea.id}"
                             contenteditable="true" 
                             oninput="window.updateStickyNote('${idea.id}', this.innerHTML, true)" 
                             class="w-full bg-transparent text-text-main text-xs resize-none focus:outline-none border-b border-transparent focus:border-text-main/10 pb-2 min-h-[100px] max-h-[180px] overflow-y-auto font-inter text-left" 
                             placeholder="Write your brilliant idea here...">${idea.content || ''}</div>
                    </div>
                    <div class="flex justify-between items-center pt-3 mt-3 border-t border-text-main/5">
                        <div class="flex gap-2">
                            <button onclick="window.convertIdeaToTask('${idea.id}')" class="text-[10px] text-text-main hover:text-text-muted flex items-center gap-1 transition-colors cursor-pointer font-semibold">
                                ${getIconSVG('check', 'w-3 h-3')} Convert to Task
                            </button>
                            <button onclick="window.createWorkspaceFromIdea('${idea.id}')" class="text-[10px] text-primary hover:text-indigo-400 flex items-center gap-1 transition-colors cursor-pointer font-semibold">
                                ${getIconSVG('folder', 'w-3 h-3')} Workspace
                            </button>
                        </div>
                        <button onclick="window.deleteStickyNote('${idea.id}')" class="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('')}
            ${projectIdeas.length === 0 ? `
                <div class="col-span-full border-2 border-dashed border-text-main/15 rounded-2xl p-12 text-center text-xs text-text-muted">
                    ${getIconSVG('info', 'w-6 h-6 mx-auto mb-2 text-text-muted')} No brainstorm items yet. Click "+ Add Note" to create sticky notes!
                </div>
            ` : ''}
        </div>
    </div>
    `;
}
