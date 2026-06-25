import { authClient } from "./auth-client";
import {
    state,
    registerStateListener,
    loadState,
    saveState,
    addProject,
    deleteProject,
    addTask,
    deleteTask,
    moveTask,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    convertIdeaToTask,
    addResearchDoc,
    deleteResearchDoc,
    addMediaAsset,
    deleteMediaAsset,
    addDraft,
    updateDraft,
    deleteDraft,
    addPublishSchedule,
    deletePublishSchedule,
    applyThemeClass,
    updateProject,
    archiveProject,
    binProject,
    updateTask,
    archiveTask,
    binTask,
    resetAppState,
    toggleProjectStar,
    addTeam,
    toggleTeamMember,
    toggleTeamProjectAccess,
    deleteTeam,
    archiveTeam,
    logActivity,
    archiveContact,
    binContact,
    updateContactTag,
    notifyStateChange,
    switchOrganization,
    switchTenant,
    switchTeam,
    switchRole
} from "./state";
import { renderLayoutHTML, renderProjectDropdownOptions } from "./views/layout";
import { renderPostDetailHTML } from "./views/analytics";
import { parseDraftContent } from "./views/drafts";
import { views } from "./router";
import { sanitizeHTML } from "./utils";
import type { KanbanTask, ResearchDoc, MediaAsset, Draft } from "./types";

// Custom override for alert to use premium toast notifications
const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('converted') || msg.toLowerCase().includes('saved');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

// Update sidebar project listing and active dropdown state
function updateSidebarUI() {
    // 1. Update dropdown options list
    const dropdownList = document.getElementById('project-dropdown-list');
    if (dropdownList) {
        dropdownList.innerHTML = renderProjectDropdownOptions();
    }
    
    // 2. Update dropdown display name
    const activeDisplay = document.getElementById('active-project-name-display');
    if (activeDisplay) {
        const currentProject = state.projects.find(p => p.id === state.currentProject);
        activeDisplay.innerHTML = currentProject ? `📁 ${sanitizeHTML(currentProject.name)}` : "Select Campaign...";
    }
    
    // 3. Update the data-pid attribute of project-scoped buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const viewKey = btn.getAttribute('data-view');
        const view = views.find(v => v.key === viewKey);
        if (view && view.scope === 'project') {
            if (state.currentProject) {
                btn.setAttribute('data-pid', state.currentProject);
            } else {
                btn.removeAttribute('data-pid');
            }
        }
    });
}

function updateThemeButtonsUI() {
    const container = document.getElementById('theme-switcher-container');
    if (container) {
        container.innerHTML = `
            <span class="text-text-muted pl-1.5 font-bold uppercase tracking-wider font-inter">Theme</span>
            <div class="flex gap-0.5">
                <button onclick="window.setTheme('day')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'day' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-day">Day</button>
                <button onclick="window.setTheme('night')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'night' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-night">Night</button>
                <button onclick="window.setTheme('auto')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'auto' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-auto">Auto</button>
            </div>
        `;
    }
}

// Word & Character count helper
function updateCounters(text: string) {
    const wordEl = document.getElementById('editor-counter-words');
    const charEl = document.getElementById('editor-counter-chars');
    if (!wordEl || !charEl) return;
    
    const charCount = text.length;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    
    wordEl.innerText = `${wordCount} words`;
    charEl.innerText = `${charCount} characters`;
}

// Global Routing
function renderView(viewKey: string, pid?: string) {
    const view = views.find(v => v.key === viewKey);
    if (view && view.scope === 'project' && !pid && !state.currentProject) {
        alert("Please select a project first using the dropdown selector!");
        const dropdown = document.getElementById('project-selector-dropdown');
        if (dropdown) dropdown.classList.remove('hidden');
        return;
    }

    state.activeViewKey = viewKey;
    const activePid = pid || state.currentProject || undefined;
    if (activePid) {
        state.currentProject = activePid;
    } else if (viewKey === 'workspaces' || viewKey === 'settings') {
        state.currentProject = null;
    }
    
    // Update sidebar UI dynamically so project submenus render when currentProject changes
    updateSidebarUI();
    
    const pageTitle = document.getElementById('page-title');
    const appContent = document.getElementById('app-content');
    
    // Update active navigation state styling
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-panel-hover', 'border-glass-border', 'text-text-main');
        btn.classList.add('text-text-muted');
    });
    
    const searchPid = pid || state.currentProject || '';
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewKey}"]${searchPid ? `[data-pid="${searchPid}"]` : ''}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-text-muted');
        activeBtn.classList.add('bg-panel-hover', 'border-glass-border', 'text-text-main');
    }

    let viewHTML = '';
    let viewTitle = '';

    // Dynamically retrieve the view template and info from the registry
    if (view) {
        viewTitle = view.title;
        viewHTML = view.render(searchPid);
    } else {
        viewTitle = 'Module Offline';
        viewHTML = `<div class="fade-in text-text-muted">This module is under construction.</div>`;
    }

    if (pageTitle) pageTitle.innerText = viewTitle;
    if (appContent) appContent.innerHTML = viewHTML;

    // Refresh draft stats if loading drafting view
    if (viewKey === 'drafts') {
        const textEl = document.getElementById('editor-content') as HTMLTextAreaElement;
        if (textEl) {
            updateCounters(textEl.value);
        }
    }
}

// Bind Global Window Interface
const w = window as any;

w.navigateTo = (viewKey: string, pid?: string) => {
    renderView(viewKey, pid);
};

w.toggleProjectStar = (pid: string) => {
    toggleProjectStar(pid);
};

w.createProjectPrompt = () => {
    // Check if on Creator Tier and exceed limit of 3 campaigns
    const brand = state.agencyBrand || { subscriptionTier: 'pro' };
    const activeProjectsCount = state.projects.filter(p => !p.isArchived && !p.isBinned).length;
    if (brand.subscriptionTier === 'creator' && activeProjectsCount >= 3) {
        alert("Upgrade Required: Creator Tier is limited to 3 active campaigns. Please upgrade to Agency Pro in Settings to create more.");
        return;
    }

    const name = prompt("Enter project/campaign name (max 40 chars):");
    if (!name) return;
    if (name.length > 40) {
        alert("Project name cannot exceed 40 characters.");
        return;
    }
    const description = prompt("Enter campaign description (max 100 chars):") || "";
    if (description.length > 100) {
        alert("Project description cannot exceed 100 characters.");
        return;
    }
    const newId = addProject(name, description);
    renderView('project-workspace', newId);
};

w.switchOrganization = (orgId: string) => {
    switchOrganization(orgId);
};

w.switchTenant = (tenantId: string) => {
    switchTenant(tenantId);
};

w.switchTeam = (teamId: string) => {
    switchTeam(teamId);
};

w.switchRole = (role: any) => {
    switchRole(role);
};

w.toggleProjectDropdown = (e: Event) => {
    e.stopPropagation();
    const dropdown = document.getElementById('project-selector-dropdown');
    const arrow = document.getElementById('project-selector-arrow');
    if (dropdown) {
        const isHidden = dropdown.classList.toggle('hidden');
        if (arrow) {
            arrow.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }
};

w.closeProjectDropdown = () => {
    const dropdown = document.getElementById('project-selector-dropdown');
    const arrow = document.getElementById('project-selector-arrow');
    if (dropdown) dropdown.classList.add('hidden');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
};

w.selectProject = (pid: string) => {
    state.currentProject = pid;
    saveState();
    
    // Maintain the active workflow view if it's project-scoped; otherwise navigate to project workspace
    const activeView = views.find(v => v.key === state.activeViewKey);
    if (activeView && activeView.scope === 'project') {
        renderView(state.activeViewKey, pid);
    } else {
        renderView('project-workspace', pid);
    }
    w.closeProjectDropdown();
};

w.deleteProject = (pid: string) => {
    if (confirm("Are you sure you want to delete this project and all its associated tasks and ideas?")) {
        deleteProject(pid);
        renderView('workspaces');
    }
};

w.handleDragStart = (e: DragEvent, taskId: string) => {
    state.draggedTaskId = taskId;
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', taskId);
    }
};

w.handleDropTask = (e: DragEvent, status: KanbanTask['status']) => {
    e.preventDefault();
    if (!state.draggedTaskId) return;
    moveTask(state.draggedTaskId, status);
    state.draggedTaskId = null;
};

w.showAddTaskModal = () => {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.remove('hidden');
};

w.hideAddTaskModal = () => {
    const modal = document.getElementById('add-task-modal');
    if (modal) modal.classList.add('hidden');
};

w.submitTaskForm = (pid: string) => {
    const titleEl = document.getElementById('modal-task-title') as HTMLInputElement;
    const tagEl = document.getElementById('modal-task-tag') as HTMLInputElement;
    const prioEl = document.getElementById('modal-task-priority') as HTMLSelectElement;
    const ptsEl = document.getElementById('modal-task-points') as HTMLInputElement;
    
    if (!titleEl || !titleEl.value.trim()) {
        alert("Task Title is required!");
        return;
    }
    const priority = prioEl ? prioEl.value : 'none';
    const points = ptsEl ? parseInt(ptsEl.value) || 0 : 0;
    
    addTask(pid, titleEl.value, tagEl ? tagEl.value : '', priority as any, points);
    w.hideAddTaskModal();
};

w.deleteTask = (taskId: string) => {
    if (confirm("Remove this task?")) {
        deleteTask(taskId);
    }
};

w.addStickyNote = (pid: string) => {
    addStickyNote(pid);
};

w.updateStickyNote = (ideaId: string, content: string) => {
    updateStickyNote(ideaId, content);
};

w.deleteStickyNote = (ideaId: string) => {
    deleteStickyNote(ideaId);
};

w.convertIdeaToTask = (ideaId: string) => {
    const ok = convertIdeaToTask(ideaId);
    if (ok) {
        alert("Idea successfully converted to a Kanban task!");
    } else {
        alert("Cannot convert empty idea note to a task.");
    }
};

// --- Research Module Window Handlers ---
w.showAddDocModal = () => {
    const modal = document.getElementById('add-doc-modal');
    if (modal) modal.classList.remove('hidden');
};

w.hideAddDocModal = () => {
    const modal = document.getElementById('add-doc-modal');
    if (modal) modal.classList.add('hidden');
};

w.submitDocForm = (pid: string) => {
    const typeEl = document.getElementById('doc-type') as HTMLSelectElement;
    const titleEl = document.getElementById('doc-title') as HTMLInputElement;
    const contentEl = document.getElementById('doc-content') as HTMLTextAreaElement;

    if (!titleEl || !titleEl.value.trim() || !contentEl || !contentEl.value.trim()) {
        alert("Document Title and Content are required fields.");
        return;
    }
    
    addResearchDoc(pid, titleEl.value, contentEl.value, typeEl.value as ResearchDoc['type']);
    
    // Clear inputs and hide
    titleEl.value = '';
    contentEl.value = '';
    w.hideAddDocModal();
};

w.deleteResearchDoc = (id: string) => {
    if (confirm("Permanently delete this document from the knowledge base?")) {
        deleteResearchDoc(id);
    }
};

w.queryRAG = (pid: string) => {
    const inputEl = document.getElementById('rag-query-input') as HTMLInputElement;
    const container = document.getElementById('rag-response-container');
    const responseText = document.getElementById('rag-response-text');
    const sourcesList = document.getElementById('rag-response-sources');

    if (!inputEl || !container || !responseText || !sourcesList) return;

    const query = inputEl.value.trim().toLowerCase();
    if (!query) {
        alert("Please enter a question to query.");
        return;
    }

    const docs = state.researchDocs.filter(d => d.projectId === pid);
    const matches: ResearchDoc[] = [];

    docs.forEach(doc => {
        if (doc.title.toLowerCase().includes(query) || doc.content.toLowerCase().includes(query)) {
            matches.push(doc);
        }
    });

    container.classList.remove('hidden');
    sourcesList.innerHTML = '';

    if (matches.length > 0) {
        const facts = matches.map(m => m.content).join(' ');
        responseText.innerText = `I searched your knowledge base and found information related to "${query}":\n\n"${facts.slice(0, 300)}..."`;
        
        matches.forEach(m => {
            const li = document.createElement('li');
            li.innerText = m.title;
            sourcesList.appendChild(li);
        });
    } else {
        responseText.innerText = `I searched all knowledge base sources for this campaign but couldn't find any direct matches for "${inputEl.value}". Try adding more documents or refinement tags.`;
        const li = document.createElement('li');
        li.innerText = "No references found";
        sourcesList.appendChild(li);
    }
};

// --- Media Module Window Handlers ---
w.showAddMediaModal = () => {
    const modal = document.getElementById('add-media-modal');
    if (modal) modal.classList.remove('hidden');
};

w.hideAddMediaModal = () => {
    const modal = document.getElementById('add-media-modal');
    if (modal) modal.classList.add('hidden');
};

w.submitMediaForm = (pid: string) => {
    const categoryEl = document.getElementById('media-category') as HTMLSelectElement;
    const titleEl = document.getElementById('media-title') as HTMLInputElement;
    const urlEl = document.getElementById('media-url') as HTMLInputElement;

    if (!titleEl || !titleEl.value.trim() || !urlEl || !urlEl.value.trim()) {
        alert("Media Title and Graphic URL are required.");
        return;
    }

    addMediaAsset(pid, titleEl.value, urlEl.value, categoryEl.value as MediaAsset['category']);
    
    titleEl.value = '';
    urlEl.value = '';
    w.hideAddMediaModal();
};

w.importPresetMedia = (pid: string, index: number) => {
    const PRESETS = [
        { title: "Dashboard Hero Layout", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", category: "banner" as const },
        { title: "Instagram Post Gradient", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", category: "social" as const },
        { title: "Sidebar Promotion Banner", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80", category: "ad" as const },
        { title: "LinkedIn Story Asset", url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80", category: "social" as const }
    ];

    const preset = PRESETS[index];
    if (preset) {
        addMediaAsset(pid, preset.title, preset.url, preset.category);
    }
};

w.deleteMediaAsset = (id: string) => {
    if (confirm("Remove this graphic template asset?")) {
        deleteMediaAsset(id);
    }
};

// --- Drafts Module Window Handlers ---
w.createNewDraft = (pid: string) => {
    const newId = addDraft(pid, "Untitled Compose Draft", "", "blog");
    w.selectDraft(newId);
};

w.changeDraftFormat = (id: string, targetFormat: 'blog' | 'tweet' | 'email') => {
    const draft = state.drafts.find(d => d.id === id);
    if (!draft) return;

    // Parse structured content
    const data = parseDraftContent(draft.content);
    
    // Adapt content based on the target format
    let adaptedBody = data.body;
    
    if (targetFormat === 'tweet') {
        // Adapt into a punchy short social post based on hook & thesis
        const bulletPoints = data.thesis
            ? data.thesis.split('\n').filter(l => l.trim()).map((l, i) => `${i + 1}️⃣ ${l.replace(/^-\s*/, '')}`).join('\n')
            : "";
        adaptedBody = `${data.hook ? data.hook : "📢 Quick insights from our workspace:"}\n\n${bulletPoints || data.body.substring(0, 100) + '...'}\n\n#agency #marketing`;
    } else if (targetFormat === 'email') {
        // Adapt into a structured newsletter broadcast layout
        const authorLabel = data.author ? `Best,\n${data.author}` : "Best regards,\nThe Workspace Team";
        const bulletPoints = data.thesis
            ? data.thesis.split('\n').filter(l => l.trim()).map(l => `• ${l.replace(/^-\s*/, '')}`).join('\n')
            : "";
        adaptedBody = `Subject: ${data.hook || draft.title}\n\nHi there,\n\n${data.body || "Here is a brief update from our workspace."}\n\nKey takeaways:\n${bulletPoints || "• Stay tuned for more features!"}\n\n${authorLabel}`;
    } else {
        // Adapt into a full-scale Article/Blog post
        const intro = data.hook ? `## ${data.hook}\n\n` : '';
        const bodyContent = data.body || "This campaign article covers the essential metrics and RAG context indexed in our workspace.";
        const subSections = data.thesis
            ? "\n\n" + data.thesis.split('\n').filter(l => l.trim()).map(l => `### ${l.replace(/^-\s*/, '')}\n\n[Section content goes here...]`).join('\n\n')
            : "";
        adaptedBody = `${intro}${bodyContent}${subSections}`;
    }

    const updatedData = {
        ...data,
        body: adaptedBody
    };

    draft.format = targetFormat;
    draft.content = JSON.stringify(updatedData);
    saveState();
    renderView('drafts', state.currentProject || undefined);
};

w.saveEditorState = (id: string) => {
    const titleEl = document.getElementById('editor-title') as HTMLInputElement;
    const contentEl = document.getElementById('editor-content') as HTMLTextAreaElement;

    if (!titleEl || !contentEl) return;

    updateDraft(id, titleEl.value, contentEl.value);
    updateCounters(contentEl.value);
};

w.copyDraftToClipboard = async (id: string) => {
    const contentEl = document.getElementById('editor-content') as HTMLTextAreaElement;
    if (!contentEl) return;

    try {
        await navigator.clipboard.writeText(contentEl.value);
        alert("Draft content successfully copied to system clipboard!");
    } catch (e) {
        alert("Clipboard copy failed. Please select and copy text manually.");
    }
};

w.deleteDraft = (id: string) => {
    if (confirm("Permanently discard this content draft?")) {
        deleteDraft(id);
    }
};

w.filterWorkspaces = (val: string) => {
    state.workspacesSearchQuery = val;
    notifyStateChange();
};

w.sortWorkspaces = (val: any) => {
    state.workspacesSortBy = val;
    notifyStateChange();
};

w.toggleWorkspacesViewMode = (mode: 'grid' | 'list') => {
    state.workspacesViewMode = mode;
    notifyStateChange();
};

w.setWorkspacesFilter = (filter: 'active' | 'archived' | 'bin') => {
    state.workspacesFilter = filter;
    notifyStateChange();
};

w.setKanbanFilter = (filter: 'active' | 'archived' | 'bin') => {
    state.kanbanFilter = filter;
    notifyStateChange();
};

w.updateProjectPrompt = (pid: string) => {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return;
    const name = prompt("Edit folder/campaign name:", p.name);
    if (name === null) return;
    if (!name.trim()) {
        alert("Folder name cannot be empty.");
        return;
    }
    const desc = prompt("Edit folder/campaign description:", p.description) || "";
    updateProject(pid, name, desc);
};

w.archiveProjectToggle = (pid: string, isArchived: boolean) => {
    archiveProject(pid, isArchived);
};

w.binProjectToggle = (pid: string, isBinned: boolean) => {
    binProject(pid, isBinned);
};

w.updateTaskPrompt = (taskId: string) => {
    const t = state.kanbanState.find(x => x.id === taskId);
    if (!t) return;
    const title = prompt("Edit task title:", t.title);
    if (title === null) return;
    if (!title.trim()) {
        alert("Task title cannot be empty.");
        return;
    }
    const tag = prompt("Edit task tag:", t.tag) || "General";
    updateTask(taskId, title, tag);
};

w.archiveTaskToggle = (taskId: string, isArchived: boolean) => {
    archiveTask(taskId, isArchived);
};

w.binTaskToggle = (taskId: string, isBinned: boolean) => {
    binTask(taskId, isBinned);
};

w.createTeamPrompt = () => {
    const name = prompt("Enter new team name:");
    if (name && name.trim()) {
        addTeam(name);
    }
};

w.toggleTeamMemberAccess = (teamId: string, memberId: string) => {
    toggleTeamMember(teamId, memberId);
};

w.toggleTeamWorkspaceAccess = (teamId: string, projectId: string) => {
    toggleTeamProjectAccess(teamId, projectId);
};

w.deleteTeamAction = (teamId: string) => {
    if (confirm("Permanently dissolve this team? Access settings will be removed.")) {
        deleteTeam(teamId);
    }
};

w.archiveTeamToggle = (teamId: string, isArchived: boolean) => {
    archiveTeam(teamId, isArchived);
};

w.setCrmFilter = (filter: 'active' | 'archived' | 'bin') => {
    state.crmFilter = filter;
    notifyStateChange();
};

w.archiveContactToggle = (cid: string, isArchived: boolean) => {
    archiveContact(cid, isArchived);
};

w.binContactToggle = (cid: string, isBinned: boolean) => {
    binContact(cid, isBinned);
};

w.updateCrmContactTag = (cid: string, tag: any) => {
    updateContactTag(cid, tag);
};

w.selectCrmContact = (cid: string) => {
    (window as any).__selectedCrmContactId = cid;
    notifyStateChange();
};

w.deleteContactAction = (cid: string) => {
    if (confirm("Permanently delete this contact?")) {
        deleteContact(cid);
    }
};

w.resetAppState = () => {
    if (confirm("This will clear all custom campaigns, tasks, and notes, restoring setup defaults. Continue?")) {
        resetAppState();
    }
};

// Theme switcher handler
w.setTheme = (theme: 'day' | 'night' | 'auto') => {
    state.theme = theme;
    applyThemeClass(theme);
    notifyStateChange();
};

// System color scheme change listener
if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'auto') {
            applyThemeClass('auto');
        }
    });
}

// Connections handlers
w.toggleConnectionState = (id: string) => {
    const conn = state.connections.find(c => c.id === id);
    if (conn) {
        conn.connected = !conn.connected;
        if (conn.connected && !conn.username) {
            conn.username = conn.name.toLowerCase().replace(/\s+/g, '') + '_user';
        }
        notifyStateChange();
    }
};

w.configureConnectionPrompt = (id: string) => {
    const conn = state.connections.find(c => c.id === id);
    if (!conn) return;
    if (conn.connected) {
        if (confirm(`Disconnect ${conn.name}?`)) {
            conn.connected = false;
            conn.username = undefined;
            conn.apiKey = undefined;
            notifyStateChange();
        }
    } else {
        const username = prompt(`Enter username/account for ${conn.name}:`, conn.username || "");
        if (username === null) return;
        const apiKey = prompt(`Enter API Key / Token for ${conn.name}:`, conn.apiKey || "");
        if (apiKey === null) return;
        conn.connected = true;
        conn.username = username.trim() || conn.name.toLowerCase().replace(/\s+/g, '') + '_user';
        conn.apiKey = apiKey.trim();
        notifyStateChange();
    }
};

// Publish schedule handlers
w.schedulePost = (pid: string) => {
    const selectEl = document.getElementById('publish-draft-select') as HTMLSelectElement;
    const dateEl = document.getElementById('publish-datetime') as HTMLInputElement;
    const channelsEl = document.querySelectorAll('input[name="channels"]:checked');

    if (!selectEl || !dateEl) return;
    const draftId = selectEl.value;
    if (!draftId) {
        alert("Please select a content draft to publish.");
        return;
    }
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const channels: string[] = [];
    channelsEl.forEach(el => channels.push((el as HTMLInputElement).value));
    if (channels.length === 0) {
        alert("Please select at least one publishing channel.");
        return;
    }

    const publishTimeStr = dateEl.value;
    if (!publishTimeStr) {
        alert("Please specify a publishing date and time.");
        return;
    }
    const scheduledTime = new Date(publishTimeStr).getTime();

    addPublishSchedule(pid, draftId, draft.title, draft.format, channels, scheduledTime);
    alert("Post successfully scheduled!");
};

w.deleteSchedule = (id: string, pid: string) => {
    if (confirm("Cancel and delete this scheduled publication?")) {
        deletePublishSchedule(id);
    }
};

// Analytics post selection
w.selectAnalyticsPost = (postId: string) => {
    const posts = (window as any).analyticsPosts || [];
    const post = posts.find((p: any) => p.id === postId);
    if (!post) return;

    // Highlight the selected card in list
    document.querySelectorAll('[id^="anal-post-card-"]').forEach(card => {
        card.classList.remove('border-primary', 'bg-panel-hover/60', 'shadow-[0_0_15px_var(--color-primary-glow)]');
        card.classList.add('border-glass-border', 'bg-panel-hover/20');
    });

    const selectedCard = document.getElementById(`anal-post-card-${postId}`);
    if (selectedCard) {
        selectedCard.classList.remove('border-glass-border', 'bg-panel-hover/20');
        selectedCard.classList.add('border-primary', 'bg-panel-hover/60', 'shadow-[0_0_15px_var(--color-primary-glow)]');
    }

    // Update detail pane content
    const detailPanel = document.getElementById('analytics-detail-panel');
    if (detailPanel) {
        detailPanel.innerHTML = renderPostDetailHTML(post);
    }
};

// Search filters
w.filterKanbanTasks = () => {
    const input = document.getElementById('kanban-search-input') as HTMLInputElement;
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.kanban-col-item').forEach(item => {
        const title = item.getAttribute('data-title')?.toLowerCase() || '';
        const tag = item.getAttribute('data-tag')?.toLowerCase() || '';
        if (title.includes(query) || tag.includes(query)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
};

w.filterIdeas = () => {
    const input = document.getElementById('ideas-search-input') as HTMLInputElement;
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.idea-note-item').forEach(item => {
        const content = item.getAttribute('data-content')?.toLowerCase() || '';
        if (content.includes(query)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
};

w.filterResearchDocs = () => {
    const input = document.getElementById('research-search-input') as HTMLInputElement;
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.research-doc-item').forEach(item => {
        const text = item.textContent?.toLowerCase() || '';
        if (text.includes(query)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
};

w.filterMediaAssets = () => {
    const input = document.getElementById('media-search-input') as HTMLInputElement;
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.media-asset-item').forEach(item => {
        const title = item.getAttribute('data-title')?.toLowerCase() || '';
        const cat = item.getAttribute('data-category')?.toLowerCase() || '';
        if (title.includes(query) || cat.includes(query)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
};

w.filterDrafts = () => {
    const input = document.getElementById('drafts-search-input') as HTMLInputElement;
    if (!input) return;
    const query = input.value.toLowerCase().trim();
    document.querySelectorAll('.draft-item-card').forEach(item => {
        const title = item.getAttribute('data-title')?.toLowerCase() || '';
        const content = item.getAttribute('data-content')?.toLowerCase() || '';
        if (title.includes(query) || content.includes(query)) {
            (item as HTMLElement).classList.remove('hidden');
        } else {
            (item as HTMLElement).classList.add('hidden');
        }
    });
};

w.signOut = async () => {
    try {
        await authClient.signOut();
    } catch (e) {
        console.error("Sign out API failed, clearing local session", e);
    }
    state.currentUser = null;
    localStorage.removeItem('meidallm_user');
    window.location.href = "/login";
};

// Application Main Render Mount
function renderMainApp() {
    if (!state.currentProject && state.projects.length > 0) {
        const welcome = state.projects.find(p => p.id === 'p-welcome' && !p.isBinned && !p.isArchived);
        state.currentProject = welcome ? welcome.id : state.projects.filter(p => !p.isBinned && !p.isArchived)[0]?.id || null;
    }
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = renderLayoutHTML();
    }
    updateSidebarUI();
    updateThemeButtonsUI();
    renderView(state.activeViewKey, state.currentProject || undefined);
}

// Register state-change listener to redraw active UI components
registerStateListener(() => {
    updateSidebarUI();
    updateThemeButtonsUI();
    renderView(state.activeViewKey, state.currentProject || undefined);
});

// Initialization
let initialized = false;
async function init() {
    if (initialized) return;
    initialized = true;
    loadState();
    
    try {
        const sessionRes = await authClient.getSession();
        if (sessionRes && sessionRes.data) {
            state.currentUser = sessionRes.data.user.email;
            renderMainApp();
        } else {
            state.currentUser = null;
            window.location.href = "/login";
        }
    } catch(e) {
        console.error("Auth session fetch failed:", e);
        if (state.currentUser) {
            renderMainApp();
        } else {
            window.location.href = "/login";
        }
    }
    
    // Sidebar nav delegation click listener
    document.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.nav-btn');
        if (target) {
            const view = target.getAttribute('data-view');
            const pid = target.getAttribute('data-pid') || undefined;
            if (view) renderView(view, pid);
        }
        
        // Close project dropdown when clicking outside
        const dropdown = document.getElementById('project-selector-dropdown');
        const selectorBtn = document.getElementById('project-selector-btn');
        if (dropdown && !dropdown.classList.contains('hidden') && selectorBtn && !selectorBtn.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
            w.closeProjectDropdown();
        }
    });
}

// Command Menu (CMD+K / Ctrl+K) Logic & Actions
const COMMANDS = [
    { name: "Go to Workspaces", category: "Navigation", action: () => w.navigateTo('workspaces') },
    { name: "Go to Task Kanban Board", category: "Navigation", action: () => w.navigateTo('kanban-board') },
    { name: "Go to Cycles & Sprints", category: "Navigation", action: () => w.navigateTo('project-cycles') },
    { name: "Go to Collaborative Databases", category: "Navigation", action: () => w.navigateTo('database-hub') },
    { name: "Go to Idea Canvas", category: "Navigation", action: () => w.navigateTo('idea-canvas') },
    { name: "Go to Research & RAG Engine", category: "Navigation", action: () => w.navigateTo('research') },
    { name: "Go to Media Assets Studio", category: "Navigation", action: () => w.navigateTo('media') },
    { name: "Go to Drafts & Compose", category: "Navigation", action: () => w.navigateTo('drafts') },
    { name: "Go to Campaign Analytics", category: "Navigation", action: () => w.navigateTo('analytics') },
    { name: "Go to CRM Hub", category: "Navigation", action: () => w.navigateTo('crm') },
    { name: "Go to Team Office", category: "Navigation", action: () => w.navigateTo('team') },
    { name: "Go to Settings", category: "Navigation", action: () => w.navigateTo('settings') },
    { name: "Create New Pipeline Task", category: "Actions", action: () => { w.toggleCommandMenu(false); w.showAddTaskModal(); } },
    { name: "Create New Project/Campaign", category: "Actions", action: () => { w.toggleCommandMenu(false); w.createProjectPrompt(); } },
    { name: "Create Collaborative Database Table", category: "Actions", action: () => { w.toggleCommandMenu(false); w.showCreateTableModal(); } },
    { name: "Create New Sprint Cycle", category: "Actions", action: () => { w.toggleCommandMenu(false); w.showAddCycleModal(); } },
    { name: "Switch Theme to Night Mode", category: "Settings", action: () => { w.setTheme('night'); w.toggleCommandMenu(false); } },
    { name: "Switch Theme to Day Mode", category: "Settings", action: () => { w.setTheme('day'); w.toggleCommandMenu(false); } },
    { name: "Switch Theme to Auto (System) Mode", category: "Settings", action: () => { w.setTheme('auto'); w.toggleCommandMenu(false); } }
];

w.toggleCommandMenu = (show: boolean) => {
    state.activeCommandMenu = show;
    const modal = document.getElementById('command-menu-modal');
    const searchInput = document.getElementById('command-menu-search') as HTMLInputElement;
    if (modal) {
        if (show) {
            modal.classList.remove('hidden');
            if (searchInput) {
                searchInput.value = "";
                setTimeout(() => searchInput.focus(), 50);
            }
            w.filterCommandMenu("");
        } else {
            modal.classList.add('hidden');
        }
    }
};

w.filterCommandMenu = (query: string) => {
    const container = document.getElementById('command-menu-items');
    if (!container) return;
    
    const cleanQuery = query.toLowerCase().trim();
    const currentList = [...COMMANDS];
    
    state.projects.forEach(p => {
        if (!currentList.some(item => item.name.includes(p.name))) {
            currentList.push({
                name: `Switch Project to: ${p.name}`,
                category: "Workspaces",
                action: () => { w.selectProject(p.id); w.toggleCommandMenu(false); }
            });
        }
    });
    
    const filtered = cleanQuery ? currentList.filter(item => item.name.toLowerCase().includes(cleanQuery)) : currentList;
    
    const categories: Record<string, typeof filtered> = {};
    filtered.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category].push(item);
    });
    
    let html = '';
    for (const [catName, items] of Object.entries(categories)) {
        html += `
        <div class="mb-3">
            <span class="text-[9px] uppercase tracking-wider font-semibold text-text-muted px-2.5 mb-1.5 block">${catName}</span>
            <div class="flex flex-col gap-0.5">
                ${items.map((item, idx) => `
                <button onclick="window.runCommandAction(${currentList.indexOf(item)})" 
                        class="w-full text-left px-2.5 py-2 hover:bg-panel-hover/50 text-xs text-text-main rounded-xl transition-colors cursor-pointer flex items-center justify-between group">
                    <span>${sanitizeHTML(item.name)}</span>
                    <span class="text-[9px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">↵</span>
                </button>
                `).join('')}
            </div>
        </div>
        `;
    }
    
    if (filtered.length === 0) {
        html = `<div class="text-center text-xs text-text-muted py-8">No commands or matches found.</div>`;
    }
    
    container.innerHTML = html;
};

w.runCommandAction = (index: number) => {
    const list = [...COMMANDS];
    state.projects.forEach(p => {
        if (!list.some(item => item.name.includes(p.name))) {
            list.push({
                name: `Switch Project to: ${p.name}`,
                category: "Workspaces",
                action: () => { w.selectProject(p.id); w.toggleCommandMenu(false); }
            });
        }
    });
    const cmd = list[index];
    if (cmd) {
        cmd.action();
    }
};

// Keyboard listener for command menu shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        w.toggleCommandMenu(!state.activeCommandMenu);
    }
    if (e.key === 'Escape' && state.activeCommandMenu) {
        w.toggleCommandMenu(false);
    }
});

// AI Assistant Slide-over Drawer
w.toggleAiAssistant = (open: boolean) => {
    state.activeAiAssistant = open;
    const drawer = document.getElementById('ai-assistant-drawer');
    const mainWrapper = document.getElementById('main-content-wrapper');
    if (drawer && mainWrapper) {
        if (open) {
            drawer.classList.remove('translate-x-full');
            drawer.classList.add('translate-x-0');
            mainWrapper.classList.add('mr-80');
        } else {
            drawer.classList.add('translate-x-full');
            drawer.classList.remove('translate-x-0');
            mainWrapper.classList.remove('mr-80');
        }
    }
};

w.sendAiMessage = (text: string) => {
    if (!text.trim()) return;
    state.aiMessages.push({ sender: 'user', text: text });
    w.renderAiChat();
    
    const chatThread = document.getElementById('ai-chat-thread');
    if (chatThread) {
        setTimeout(() => chatThread.scrollTop = chatThread.scrollHeight, 50);
    }
    
    setTimeout(() => {
        let response = "I'm analyzing the active state...";
        const lower = text.toLowerCase();
        
        if (lower.includes('task') && (lower.includes('risk') || lower.includes('overdue'))) {
            const activeTasks = state.kanbanState.filter(t => !t.isArchived && !t.isBinned && t.status !== 'done');
            if (activeTasks.length > 0) {
                response = `Here are tasks currently at risk:<br><br>` + 
                  activeTasks.map(t => `• <strong>${t.title}</strong> (${t.tag}) - Status: ${t.status}`).join('<br>');
            } else {
                response = "Great news! All active tasks are completed or on-schedule.";
            }
        } else if (lower.includes('cycle') || lower.includes('sprint')) {
            const activeCycle = state.cycles.find(c => c.status === 'active');
            if (activeCycle) {
                const cycleTasks = state.kanbanState.filter(t => t.cycleId === activeCycle.id);
                const doneTasks = cycleTasks.filter(t => t.status === 'done');
                response = `<strong>Active Cycle: ${activeCycle.name}</strong><br>
                Duration: ${activeCycle.startDate} to ${activeCycle.endDate}<br>
                Progress: ${doneTasks.length} / ${cycleTasks.length} tasks completed.`;
            } else {
                response = "There is no currently active cycle. Head over to Cycles & Sprints to start one!";
            }
        } else if (lower.includes('tone') || lower.includes('copywriting')) {
            const toneSelect = document.getElementById('setting-brand-tone') as HTMLSelectElement;
            const currentTone = toneSelect ? toneSelect.value : 'Creative';
            response = `I recommend drafting with a <strong>${currentTone}</strong> tone to align with your current Campaign Preferences.`;
        } else {
            response = "I've checked the organization state. Let me know if you need me to summarize task logs, check goals, or filter database entries!";
        }
        
        state.aiMessages.push({ sender: 'ai', text: response });
        w.renderAiChat();
        if (chatThread) {
            setTimeout(() => chatThread.scrollTop = chatThread.scrollHeight, 50);
        }
    }, 800);
};

w.submitAiChat = () => {
    const input = document.getElementById('ai-chat-input') as HTMLInputElement;
    if (input && input.value) {
        w.sendAiMessage(input.value);
        input.value = "";
    }
};

w.renderAiChat = () => {
    const chatThread = document.getElementById('ai-chat-thread');
    if (!chatThread) return;
    
    let html = `
        <div class="bg-panel-hover/50 p-3 rounded-xl border border-text-main/15 text-text-muted leading-relaxed">
            Hello! I am your AI assistant. I have full context of your database tables, tasks, cycles, and CRM. Try asking:
            <ul class="list-disc pl-4 mt-2 flex flex-col gap-1.5">
                <li><button onclick="window.sendAiMessage('Show tasks at risk')" class="text-left text-text-main underline hover:text-text-main/80">Show tasks at risk</button></li>
                <li><button onclick="window.sendAiMessage('Summarize current cycle progress')" class="text-left text-text-main underline hover:text-text-main/80">Summarize current cycle progress</button></li>
                <li><button onclick="window.sendAiMessage('Recommend copywriting tone')" class="text-left text-text-main underline hover:text-text-main/80">Recommend copywriting tone</button></li>
            </ul>
        </div>
    `;
    
    html += state.aiMessages.map(m => {
        if (m.sender === 'user') {
            return `
            <div class="bg-panel-hover border border-text-main/15 p-3 rounded-xl ml-6 text-text-main text-right">
                ${m.text}
            </div>
            `;
        } else {
            return `
            <div class="bg-panel-hover/40 border border-text-main/10 p-3 rounded-xl mr-6 text-text-main leading-relaxed">
                ${m.text}
            </div>
            `;
        }
    }).join('');
    
    chatThread.innerHTML = html;
};

// Goals & Milestones handlers
w.createGoalPrompt = () => {
    const title = prompt("Enter goal title:");
    if (!title) return;
    const target = prompt("Enter target numeric value (e.g. 50000):");
    if (!target || isNaN(Number(target))) return;
    const unit = prompt("Enter metric unit (e.g. Views, Posts, Signups):") || "units";
    const date = prompt("Enter due date (YYYY-MM-DD):") || new Date().toISOString().split('T')[0];
    
    const newGoal = {
        id: 'g-' + Math.random().toString(36).substr(2, 9),
        projectId: state.currentProject || 'p1',
        title: title.trim(),
        targetValue: Number(target),
        currentValue: 0,
        unit: unit.trim(),
        dueDate: date,
        status: 'on-track' as const
    };
    
    state.goals.push(newGoal);
    notifyStateChange();
};

w.deleteGoal = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign goal?")) {
        state.goals = state.goals.filter(g => g.id !== id);
        notifyStateChange();
    }
};

w.incrementGoalProgress = (id: string) => {
    const goal = state.goals.find(g => g.id === id);
    if (goal) {
        const valStr = prompt(`Increment progress for "${goal.title}" by:`, "5");
        if (valStr && !isNaN(Number(valStr))) {
            goal.currentValue += Number(valStr);
            if (goal.currentValue >= goal.targetValue) {
                goal.status = 'achieved';
            } else if (goal.currentValue < goal.targetValue / 2) {
                goal.status = 'behind';
            } else {
                goal.status = 'on-track';
            }
            notifyStateChange();
        }
    }
};

// Multi-tenant organization switcher
w.createOrganizationPrompt = () => {
    const name = prompt("Switch or create active Tenant (domain or org slug, e.g. acme-marketing):");
    if (name) {
        const cleanName = name.toLowerCase().replace(/[^a-z0-9-.]/g, '');
        if (cleanName) {
            state.activeOrgId = cleanName;
            localStorage.setItem('meidallm_active_orgid', cleanName);
            loadState().then(() => notifyStateChange());
        }
    }
};

// Startup Hooks
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
}
