import { authClient } from "./auth-client";
import { initTelemetry, trackEvent } from "./telemetry/collector";
import { syncTimerStart, syncTimerStop, syncTimerDiscard, syncManualLog, syncAllLocalLogs, flushQueue, fetchActiveTimer } from "./timerSync";
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
    toggleProjectStar,
    addTeam,
    toggleTeamMember,
    toggleTeamProjectAccess,
    deleteTeam,
    archiveTeam,
    logActivity,
    addContact,
    updateContact,
    archiveContact,
    binContact,
    updateContactTag,
    notifyStateChange,
    switchOrganization,
    switchTenant,
    switchTeam,
    switchRole,
    togglePolicy,
    deleteContact,
    hasPermission,
    startTimer,
    stopAndSaveTimer,
    discardTimer,
    addOrganization,
    updateOrganization,
    deleteOrganization,
    createTicket,
    assignTicket,
    updateTicketStatus,
    addTicketEvent,
    sendMessage,
    triggerSupportAssist,
    exitSupportAssist
} from "./state";
import { renderLayoutHTML, renderProjectDropdownOptions } from "./views/layout";
import { renderHelpdeskView } from "./views/helpdesk";
import { renderInboxView } from "./views/inbox";
import { renderPostDetailHTML } from "./views/analytics";
import { parseDraftContent } from "./views/drafts";
import { views } from "./router";
import { sanitizeHTML } from "./utils";
import { getIconSVG } from "./views/icons";
import type { KanbanTask, ResearchDoc, MediaAsset, Draft, TimeLog } from "./types";

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
        activeDisplay.innerHTML = currentProject ? `<svg class="w-4 h-4 text-amber-500 fill-current inline-block mr-1.5" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ${sanitizeHTML(currentProject.name)}` : "Select Campaign...";
    }

    // 3. Update active workspace name on the main navigation sidebar
    const sidebarActiveDisplay = document.getElementById('sidebar-active-project-display');
    if (sidebarActiveDisplay) {
        const currentProject = state.projects.find(p => p.id === state.currentProject);
        sidebarActiveDisplay.innerText = currentProject ? currentProject.name : "Select Campaign...";
    }
    
    // 4. Update the data-pid attribute of project-scoped buttons
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
            <button onclick="window.setTheme('day')" class="theme-btn flex-1 flex items-center justify-center py-1 rounded-md transition-all ${state.theme === 'day' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-day" title="Day Mode">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M20 12h2"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            </button>
            <button onclick="window.setTheme('night')" class="theme-btn flex-1 flex items-center justify-center py-1 rounded-md transition-all ${state.theme === 'night' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-night" title="Night Mode">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            </button>
            <button onclick="window.setTheme('auto')" class="theme-btn flex-1 flex items-center justify-center py-1 rounded-md transition-all ${state.theme === 'auto' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-auto" title="System Auto">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </button>
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
    
    // Telemetry instrumentation
    trackEvent(state.activeTenantId || 't-meidallm', state.currentUser || 'anonymous', 'PageViewed', { view: viewKey, projectId: activePid || '' });
    trackEvent(state.activeTenantId || 't-meidallm', state.currentUser || 'anonymous', 'FeatureUsed', { feature: viewKey });
    
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
    if (viewKey === 'helpdesk') {
        state.sidebarCollapsed = true;
        saveState();
        notifyStateChange();
    }
    
    // If user clicks a nav item while the sidebar is hover-expanded (collapsed state),
    // pin the sidebar open so it doesn't collapse when they move the mouse away
    // (but skip this if they clicked helpdesk, which we want to keep collapsed)
    if (state.sidebarCollapsed && viewKey !== 'helpdesk') {
        state.sidebarCollapsed = false;
        saveState();
        notifyStateChange();
        // Small delay so the sidebar expand animation completes before rendering
        setTimeout(() => renderView(viewKey, pid), 50);
        return;
    }
    renderView(viewKey, pid);
};

w.navigateToHub = (hubKey: string, tabKey: string, pid?: string) => {
    w.navigateTo(hubKey, pid);
    setTimeout(() => {
        const hubId = hubKey.endsWith('-hub') ? hubKey.replace('-hub', '') : hubKey;
        w.switchHubTab(hubId, tabKey);
    }, 100);
};

w.toggleProjectStar = (pid: string) => {
    toggleProjectStar(pid);
};

w.createProjectPrompt = async () => {
    // Check if on Creator Tier and exceed limit of 3 campaigns
    const brand = state.agencyBrand || { subscriptionTier: 'pro' };
    const activeProjectsCount = state.projects.filter(p => !p.isArchived && !p.isBinned).length;
    if (brand.subscriptionTier === 'creator' && activeProjectsCount >= 3) {
        if (window.showToast) window.showToast("Upgrade Required: Creator Tier is limited to 3 active campaigns. Upgrade in Settings.", "error");
        return;
    }

    const res = await w.showFormDialog("Create New Workspace", [
        { key: "name", label: "Workspace / Campaign Name (Max 40 chars)", type: "text", placeholder: "e.g. Q4 Growth Sprint" },
        { key: "description", label: "Description (Max 100 chars)", type: "text", placeholder: "Workspace objectives and deliverables..." }
    ]);
    if (!res || !res.name) return;

    if (res.name.length > 40) {
        if (window.showToast) window.showToast("Workspace name cannot exceed 40 characters.", "error");
        return;
    }
    if (res.description && res.description.length > 100) {
        if (window.showToast) window.showToast("Workspace description cannot exceed 100 characters.", "error");
        return;
    }
    const newId = addProject(res.name, res.description || "");
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

w.togglePolicy = (policyId: string) => {
    togglePolicy(policyId);
};

w.closeAllRailDropdowns = () => {
    document.getElementById('tenant-rail-dropdown')?.classList.add('hidden');
    document.getElementById('org-rail-dropdown')?.classList.add('hidden');
    document.getElementById('team-rail-dropdown')?.classList.add('hidden');
    document.getElementById('project-selector-dropdown')?.classList.add('hidden');
    document.getElementById('user-rail-dropdown')?.classList.add('hidden');
    document.getElementById('role-rail-dropdown')?.classList.add('hidden');
    document.getElementById('super-admin-rail-dropdown')?.classList.add('hidden');
    document.getElementById('hierarchy-rail-dropdown')?.classList.add('hidden');
    document.getElementById('profile-rail-dropdown')?.classList.add('hidden');
    document.getElementById('quick-calendar-dropdown')?.classList.add('hidden');
};

w.toggleProfileDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('profile-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.closeProfileDropdown = () => {
    document.getElementById('profile-rail-dropdown')?.classList.add('hidden');
};

w.toggleRoleDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('role-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.toggleTenantDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('tenant-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.toggleOrgDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('org-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.toggleTeamDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('team-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.toggleProjectDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('project-selector-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.toggleUserDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('user-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.closeUserDropdown = () => {
    document.getElementById('user-rail-dropdown')?.classList.add('hidden');
};

w.closeProjectDropdown = () => {
    document.getElementById('project-selector-dropdown')?.classList.add('hidden');
};

w.toggleSuperAdminDropdown = (e: Event) => {
    e.stopPropagation();
    const el = document.getElementById('super-admin-rail-dropdown');
    const show = el?.classList.contains('hidden');
    w.closeAllRailDropdowns();
    if (show) el?.classList.remove('hidden');
};

w.closeSuperAdminDropdown = () => {
    document.getElementById('super-admin-rail-dropdown')?.classList.add('hidden');
};

w.toggleSidebarCollapse = (e: Event) => {
    e.stopPropagation();
    state.sidebarCollapsed = !state.sidebarCollapsed;
    notifyStateChange();
};

// Global click handler to dismiss dropdowns
document.addEventListener('click', () => {
    if (w.closeAllRailDropdowns) {
        w.closeAllRailDropdowns();
    }
});

w.selectProject = (pid: string) => {
    state.currentProject = pid;
    saveState();
    
    // Always navigate to the workspace overview (dashboard) of that workshop
    renderView('project-workspace', pid);
    w.closeProjectDropdown();
};

w.deleteProject = async (pid: string) => {
    const ok = await w.showConfirmDialog("Delete Workspace", "Are you sure you want to delete this workspace and all its associated tasks and ideas?");
    if (ok) {
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
    const app = document.getElementById('app');
    if (modal && app) {
        app.appendChild(modal);
        modal.classList.remove('hidden');
    }
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
        if (window.showToast) window.showToast("Task Title is required!", "error");
        return;
    }
    const priority = prioEl ? prioEl.value : 'none';
    const points = ptsEl ? parseInt(ptsEl.value) || 0 : 0;
    
    addTask(pid, titleEl.value, tagEl ? tagEl.value : '', priority as any, points);
    w.hideAddTaskModal();
};

w.deleteTask = async (taskId: string) => {
    const ok = await w.showConfirmDialog("Delete Task", "Are you sure you want to remove this task?");
    if (ok) {
        deleteTask(taskId);
    }
};

w.addStickyNote = (pid: string) => {
    addStickyNote(pid);
};

w.updateStickyNote = (ideaId: string, content: string, silent = false) => {
    updateStickyNote(ideaId, content, silent);
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

w.createWorkspaceFromIdea = (ideaId: string) => {
    const idea = state.ideasState.find(i => i.id === ideaId);
    if (!idea) return;
    
    // Extract plain text for project name
    const temp = document.createElement("div");
    temp.innerHTML = idea.content;
    const plainName = (temp.textContent || temp.innerText || "").trim();
    
    const projectName = plainName.substring(0, 40) || "New Campaign from Brainstorm";
    const projectDesc = "Campaign workspace spawned from ideation board. Content: " + plainName.substring(0, 150);
    
    // Add the project
    const newProjId = addProject(projectName, projectDesc);
    
    // Navigate to the newly created project workspace
    renderView('project-workspace', newProjId);
    
    // Show a success message
    alert("Successfully created workspace: " + projectName);
};

w.handleIdeaImgUpload = (ideaId: string, input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgHtml = `<img src="${e.target?.result}" class="max-w-full h-auto rounded-lg my-2 border border-glass-border/30">`;
        const editor = document.getElementById(`idea-editor-${ideaId}`);
        if (editor) {
            editor.focus();
            document.execCommand('insertHTML', false, imgHtml);
            updateStickyNote(ideaId, editor.innerHTML);
        }
    };
    reader.readAsDataURL(file);
    input.value = '';
};

w.handleIdeaFileUpload = (ideaId: string, input: HTMLInputElement) => {
    const file = input.files?.[0];
    if (!file) return;

    const fileHtml = `<div class="file-attachment bg-panel-hover/50 border border-glass-border p-2 rounded-xl flex items-center gap-2 my-2 text-xs select-none" contenteditable="false"><svg class="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 16px; height: 16px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><span>${sanitizeHTML(file.name)}</span></div><br>`;
    const editor = document.getElementById(`idea-editor-${ideaId}`);
    if (editor) {
        editor.focus();
        document.execCommand('insertHTML', false, fileHtml);
        updateStickyNote(ideaId, editor.innerHTML);
    }
    input.value = '';
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

w.confirmBinProject = (pid: string, expectedName: string) => {
    const confirmName = prompt(`Type "${expectedName}" to confirm deletion of this workspace:`);
    if (confirmName === expectedName) {
        binProject(pid, true);
        alert(`Workspace "${expectedName}" has been moved to the bin.`);
    } else if (confirmName !== null) {
        alert("Deletion cancelled: Workspace name did not match.");
    }
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

w.showAddContactModal = () => {
    const modal = document.getElementById('add-contact-modal');
    if (modal) modal.classList.remove('hidden');
};

w.hideAddContactModal = () => {
    const modal = document.getElementById('add-contact-modal');
    if (modal) {
        modal.classList.add('hidden');
        const name = document.getElementById('modal-contact-name') as HTMLInputElement;
        const email = document.getElementById('modal-contact-email') as HTMLInputElement;
        const company = document.getElementById('modal-contact-company') as HTMLInputElement;
        const value = document.getElementById('modal-contact-value') as HTMLInputElement;
        const creator = document.getElementById('modal-contact-creator-type') as HTMLSelectElement;
        const platforms = document.getElementById('modal-contact-platforms') as HTMLInputElement;
        const demographics = document.getElementById('modal-contact-demographics') as HTMLInputElement;
        const monetization = document.getElementById('modal-contact-monetization') as HTMLInputElement;
        if (name) name.value = '';
        if (email) email.value = '';
        if (company) company.value = '';
        if (value) value.value = '';
        if (creator) creator.value = '';
        if (platforms) platforms.value = '';
        if (demographics) demographics.value = '';
        if (monetization) monetization.value = '';
    }
};

w.submitContactForm = (pid: string) => {
    const nameInput = document.getElementById('modal-contact-name') as HTMLInputElement;
    const emailInput = document.getElementById('modal-contact-email') as HTMLInputElement;
    const companyInput = document.getElementById('modal-contact-company') as HTMLInputElement;
    const valueInput = document.getElementById('modal-contact-value') as HTMLInputElement;
    const tagSelect = document.getElementById('modal-contact-tag') as HTMLSelectElement;
    const creatorSelect = document.getElementById('modal-contact-creator-type') as HTMLSelectElement;
    const platformsInput = document.getElementById('modal-contact-platforms') as HTMLInputElement;
    const demographicsInput = document.getElementById('modal-contact-demographics') as HTMLInputElement;
    const monetizationInput = document.getElementById('modal-contact-monetization') as HTMLInputElement;

    if (!nameInput || !emailInput || !companyInput || !valueInput || !tagSelect) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const company = companyInput.value.trim();
    const value = Number(valueInput.value) || 0;
    const tag = tagSelect.value as any;
    const creatorType = creatorSelect?.value as any || undefined;
    const platforms = platformsInput?.value ? platformsInput.value.split(',').map(p => p.trim()).filter(Boolean) : undefined;
    const demographics = demographicsInput?.value.trim() || undefined;
    const monetization = monetizationInput?.value.trim() || undefined;

    if (!name || !email || !company) {
        return alert("Name, email, and company are required.");
    }

    addContact(pid, name, email, company, 'lead', value, tag, creatorType, platforms, demographics, monetization);
    w.hideAddContactModal();
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

w.configureConnectionPrompt = async (id: string) => {
    const conn = state.connections.find(c => c.id === id);
    if (!conn) return;
    if (conn.connected) {
        const ok = await w.showConfirmDialog("Disconnect Platform", `Are you sure you want to disconnect ${conn.name}?`);
        if (ok) {
            conn.connected = false;
            conn.username = undefined;
            conn.apiKey = undefined;
            notifyStateChange();
        }
    } else {
        const res = await w.showFormDialog(`Connect to ${conn.name}`, [
            { key: "username", label: "Username / Account Name", type: "text", defaultValue: conn.username || "", placeholder: "e.g. creative_brand" },
            { key: "apiKey", label: "API Key / Access Token", type: "password", defaultValue: conn.apiKey || "", placeholder: "Paste credentials..." }
        ]);
        if (!res) return;
        conn.connected = true;
        conn.username = res.username.trim() || conn.name.toLowerCase().replace(/\s+/g, '') + '_user';
        conn.apiKey = res.apiKey.trim();
        notifyStateChange();
    }
};

// Connections category tab switcher
w.switchConnectionTab = (tab: string) => {
    // Reset all tabs to inactive style
    document.querySelectorAll('.conn-tab').forEach((btn: any) => {
        btn.style.background = '';
        btn.style.color = 'var(--color-text-muted)';
        btn.style.boxShadow = '';
        btn.setAttribute('data-active', 'false');
    });
    // Activate selected tab
    const activeBtn = document.getElementById('conn-tab-' + tab) as HTMLElement | null;
    if (activeBtn) {
        activeBtn.style.background = 'var(--color-glass-bg)';
        activeBtn.style.color = 'var(--color-text-main)';
        activeBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,.15)';
        activeBtn.setAttribute('data-active', 'true');
    }
    // Filter cards
    document.querySelectorAll('.conn-card').forEach((card: any) => {
        if (tab === 'all' || card.getAttribute('data-category') === tab) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
};

// Content Composer handlers
w.saveComposeAsDraft = (pid: string) => {
    const titleEl = document.getElementById('compose-title') as HTMLInputElement;
    const subtitleEl = document.getElementById('compose-subtitle') as HTMLInputElement;
    const bodyEl = document.getElementById('compose-body-contentable') as HTMLDivElement;
    const formatEl = document.getElementById('compose-format') as HTMLSelectElement;
    const tagsEl = document.getElementById('compose-tags') as HTMLInputElement;
    const authorEl = document.getElementById('compose-author') as HTMLInputElement;
    const designationEl = document.getElementById('compose-designation') as HTMLInputElement;
    const coverEl = document.getElementById('compose-cover-image') as HTMLInputElement;

    if (!titleEl || !bodyEl) return;
    const title = titleEl.value.trim() || "Untitled Composition";
    const content = bodyEl.innerHTML;

    // Build alternative titles and tags metadata package
    const metaPayload = {
        subtitle: subtitleEl?.value || "",
        author: authorEl?.value || "Hosanna",
        designation: designationEl?.value || "",
        tags: tagsEl?.value || "",
        coverImage: coverEl?.value || "",
        altTitle1: (document.getElementById('compose-alt-title-1') as HTMLInputElement)?.value || "",
        altTitle2: (document.getElementById('compose-alt-title-2') as HTMLInputElement)?.value || "",
        
        // Massive platform metadata package
        socialX: (document.getElementById('meta-social-x') as HTMLTextAreaElement)?.value || "",
        socialInsta: (document.getElementById('meta-social-insta') as HTMLTextAreaElement)?.value || "",
        socialLinkedIn: (document.getElementById('meta-social-linkedin') as HTMLTextAreaElement)?.value || "",
        socialSubreddit: (document.getElementById('meta-social-subreddit') as HTMLInputElement)?.value || "",
        socialAlt: (document.getElementById('meta-social-alt') as HTMLInputElement)?.value || "",
        
        videoDesc: (document.getElementById('meta-video-desc') as HTMLTextAreaElement)?.value || "",
        videoVisibility: (document.getElementById('meta-video-visibility') as HTMLSelectElement)?.value || "public",
        videoCategory: (document.getElementById('meta-video-category') as HTMLSelectElement)?.value || "tech",
        videoShorts: (document.getElementById('meta-video-shorts') as HTMLInputElement)?.checked || false,

        liveTitle: (document.getElementById('meta-live-title') as HTMLInputElement)?.value || "",
        liveCategory: (document.getElementById('meta-live-category') as HTMLInputElement)?.value || "",
        liveLatency: (document.getElementById('meta-live-latency') as HTMLSelectElement)?.value || "low",

        podEpisode: (document.getElementById('meta-pod-episode') as HTMLInputElement)?.value || "",
        podSeason: (document.getElementById('meta-pod-season') as HTMLInputElement)?.value || "",
        podType: (document.getElementById('meta-pod-type') as HTMLSelectElement)?.value || "full",
        podAudio: (document.getElementById('meta-pod-audio') as HTMLInputElement)?.value || "",
        podExplicit: (document.getElementById('meta-pod-explicit') as HTMLInputElement)?.checked || false
    };

    const newDraft = {
        id: 'd-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title,
        content: JSON.stringify({ body: content, meta: metaPayload }),
        format: (formatEl?.value === 'social' ? 'tweet' : formatEl?.value === 'email' ? 'email' : 'blog') as any,
        created: Date.now(),
        updated: Date.now(),
        cmsStatus: 'draft' as const,
        seoKeywords: tagsEl?.value
    };

    state.drafts.unshift(newDraft);
    notifyStateChange();

    if (window.showToast) window.showToast("Draft saved successfully with platform metadata!", "success");
    
    // Clear inputs
    titleEl.value = "";
    bodyEl.innerHTML = "<div><h2>Executive Summary</h2></div><div><p>Start writing content here...</p></div>";
    if (subtitleEl) subtitleEl.value = "";
    if (tagsEl) tagsEl.value = "";
    if (coverEl) {
        coverEl.value = "";
        const preview = document.getElementById('compose-cover-preview');
        if (preview) preview.classList.add('hidden');
    }
    
    // Switch to Drafts tab
    window.switchHubTab('create', 'drafts');
};

w.submitComposeForReview = (pid: string) => {
    const titleEl = document.getElementById('compose-title') as HTMLInputElement;
    const bodyEl = document.getElementById('compose-body-contentable') as HTMLDivElement;
    const bodySecondaryEl = document.getElementById('compose-body-contentable-secondary') as HTMLDivElement;
    const formatEl = document.getElementById('compose-format') as HTMLSelectElement;
    const tagsEl = document.getElementById('compose-tags') as HTMLInputElement;

    if (!titleEl || !bodyEl) return;
    const title = titleEl.value.trim() || "Untitled Composition";
    const content = bodyEl.innerHTML;
    const secondaryContent = bodySecondaryEl ? bodySecondaryEl.innerHTML : "";

    const newDraft = {
        id: 'd-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title,
        content: JSON.stringify({ 
            body: content, 
            bodySecondary: secondaryContent, 
            meta: {} 
        }),
        format: (formatEl?.value === 'social' ? 'tweet' : formatEl?.value === 'email' ? 'email' : 'blog') as any,
        created: Date.now(),
        updated: Date.now(),
        cmsStatus: 'review' as const,
        seoKeywords: tagsEl?.value
    };

    state.drafts.unshift(newDraft);
    notifyStateChange();

    if (window.showToast) window.showToast("Submitted content for team review!", "success");
    
    titleEl.value = "";
    bodyEl.innerHTML = "<div><h2>Executive Summary</h2></div><div><p>Start writing content here...</p></div>";
    if (bodySecondaryEl) bodySecondaryEl.innerHTML = "";
    
    window.switchHubTab('create', 'review');
};

w.runAIExtractor = (action: 'outline' | 'improve') => {
    const bodyEl = document.getElementById('compose-body-contentable') as HTMLDivElement;
    const indicatorEl = document.getElementById('compose-typing-indicator');
    if (!bodyEl) return;

    if (indicatorEl) indicatorEl.classList.remove('hidden');

    setTimeout(() => {
        if (action === 'outline') {
            bodyEl.innerHTML = `
                <h2>### Topic Outline</h2>
                <ul>
                    <li><strong>Introduction</strong>: Define objectives & target audience.</li>
                    <li><strong>Key Themes</strong>: Detail creator platform dynamics.</li>
                    <li><strong>CTA</strong>: Conclude with subscription drivers.</li>
                </ul>
            `;
        } else if (action === 'improve') {
            const current = bodyEl.innerHTML;
            bodyEl.innerHTML = `
                <h2>🌟 AI Optimized Version:</h2>
                <blockquote>${current}</blockquote>
                <p><em>Optimized for maximum reader engagement, readability, and conversion metrics.</em></p>
            `;
        }
        if (indicatorEl) indicatorEl.classList.add('hidden');
        if (window.showToast) window.showToast("AI suggestion generated!", "success");
    }, 1500);
};

// Word-grade Rich Editor helper functions
w.execComposeFormat = (cmd: string, val: string = "") => {
    document.execCommand(cmd, false, val);
};

w.promptInsertComposeLink = async () => {
    const url = await w.showPromptDialog("Insert Link", "Link URL", "https://", "Enter full URL...");
    if (url) {
        document.execCommand("createLink", false, url);
    }
};

w.promptInsertComposeImage = async () => {
    const url = await w.showPromptDialog("Insert Image in Document", "Image URL", "https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=600&q=80", "Enter image URL...");
    if (url) {
        document.execCommand("insertImage", false, url);
    }
};

w.promptInsertComposeVideo = async () => {
    const url = await w.showPromptDialog("Embed Video URL", "Video Link (YouTube / Vimeo / mp4)", "https://www.youtube.com/embed/dQw4w9WgXcQ", "Enter embed link...");
    if (url) {
        const videoHTML = `<div class="my-4 aspect-video rounded-xl overflow-hidden border border-text-main/10 shadow-lg"><iframe class="w-full h-full" src="${url}" frameborder="0" allowfullscreen></iframe></div><p></p>`;
        document.execCommand("insertHTML", false, videoHTML);
    }
};

w.promptInsertComposeAudio = async () => {
    const url = await w.showPromptDialog("Embed Audio URL", "Audio Source (mp3 / wav)", "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", "Enter audio file URL...");
    if (url) {
        const audioHTML = `<div class="my-4 bg-panel-hover border border-text-main/10 rounded-xl p-3.5 flex items-center justify-between"><audio class="w-full" controls src="${url}"></audio></div><p></p>`;
        document.execCommand("insertHTML", false, audioHTML);
    }
};

w.promptComposeColor = async (cmd: 'foreColor' | 'hiliteColor') => {
    const color = await w.showPromptDialog("Choose Hex Color", "Color value (Hex or Name)", cmd === 'foreColor' ? "#a855f7" : "#fef08a", "e.g. #ff0000 or red");
    if (color) {
        document.execCommand(cmd, false, color);
    }
};

// Switch Compose Languages Settings
w.updateComposeLangSetting = (type: 'primary' | 'secondary', lang: string) => {
    localStorage.setItem(`meidallm_compose_${type}_lang`, lang);
    notifyStateChange();
};

w.updateComposeLayout = (mode: 'single' | 'dual') => {
    localStorage.setItem('meidallm_compose_layout', mode);
    notifyStateChange();
};

w.updateComposeFontFamily = (font: string) => {
    localStorage.setItem('meidallm_compose_font', font);
    
    // Set CSS variable on editor sheets
    const fonts: Record<string, string> = {
        'font-inter': 'Inter, sans-serif',
        'font-outfit': 'Outfit, sans-serif',
        'font-playfair': 'Playfair Display, serif',
        'font-fira': 'Fira Code, monospace',
        'font-roboto': 'Roboto, sans-serif'
    };
    document.documentElement.style.setProperty('--editor-font-family', fonts[font] || 'Inter, sans-serif');
    notifyStateChange();
};

// Drag and drop asset library handlers
w.handleAssetDragStart = (e: DragEvent, assetId: string, url: string, type: string) => {
    if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', JSON.stringify({ url, type }));
        e.dataTransfer.effectAllowed = 'copy';
    }
};

w.handleComposeDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    
    try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data && data.url) {
            w.insertAssetAtCursor(data.url, data.type, targetId);
        }
    } catch(err) {
        console.error("Drop failed:", err);
    }
};

w.insertAssetAtCursor = (url: string, type: string, targetId: string = 'compose-body-contentable') => {
    const target = document.getElementById(targetId) as HTMLElement | null;
    if (!target) return;
    
    let html = "";
    if (type === 'video') {
        html = `<div class="my-4 aspect-video rounded-xl overflow-hidden border border-text-main/10 shadow-lg"><iframe class="w-full h-full" src="${url}" frameborder="0" allowfullscreen></iframe></div><p></p>`;
    } else if (type === 'audio') {
        html = `<div class="my-4 bg-panel-hover border border-text-main/10 rounded-xl p-3.5 flex items-center justify-between"><audio class="w-full" controls src="${url}"></audio></div><p></p>`;
    } else {
        html = `<div class="my-4 rounded-xl overflow-hidden border border-text-main/10 shadow-md"><img src="${url}" class="w-full h-auto object-cover max-h-[300px]"></div><p></p>`;
    }

    target.focus();
    document.execCommand("insertHTML", false, html);
    if (window.showToast) window.showToast("Media asset added to draft body!", "success");
    w.calculateRceWordCount();
};

w.clearRceDocument = async () => {
    const ok = await w.showConfirmDialog("Clear Document", "Are you sure you want to clear the entire document? This cannot be undone.");
    if (ok) {
        const visual = document.getElementById('compose-body-contentable');
        const visualSec = document.getElementById('compose-body-contentable-secondary');
        const code = document.getElementById('compose-body-html') as HTMLTextAreaElement;
        const codeSec = document.getElementById('compose-body-html-secondary') as HTMLTextAreaElement;
        
        if (visual) visual.innerHTML = "<div><p></p></div>";
        if (visualSec) visualSec.innerHTML = "<div><p></p></div>";
        if (code) code.value = "";
        if (codeSec) codeSec.value = "";
        
        w.calculateRceWordCount();
        if (window.showToast) window.showToast("Document cleared.", "info");
    }
};

w.printRceDocument = () => {
    window.print();
};

w.toggleRceHtmlView = () => {
    const isCurrentlyHtml = localStorage.getItem('meidallm_compose_html_mode') === 'true';
    const nextHtml = !isCurrentlyHtml;
    localStorage.setItem('meidallm_compose_html_mode', String(nextHtml));

    // Sync content
    const visual = document.getElementById('compose-body-contentable') as HTMLDivElement;
    const code = document.getElementById('compose-body-html') as HTMLTextAreaElement;
    const visualSec = document.getElementById('compose-body-contentable-secondary') as HTMLDivElement;
    const codeSec = document.getElementById('compose-body-html-secondary') as HTMLTextAreaElement;

    if (nextHtml) {
        // Sync Visual to HTML textarea code view
        if (visual && code) code.value = visual.innerHTML;
        if (visualSec && codeSec) codeSec.value = visualSec.innerHTML;
        
        if (visual) visual.classList.add('hidden');
        if (code) code.classList.remove('hidden');
        if (visualSec) visualSec.classList.add('hidden');
        if (codeSec) codeSec.classList.remove('hidden');
    } else {
        // Sync HTML textarea back to Visual editor
        if (visual && code) visual.innerHTML = code.value;
        if (visualSec && codeSec) visualSec.innerHTML = codeSec.value;

        if (visual) visual.classList.remove('hidden');
        if (code) code.classList.add('hidden');
        if (visualSec) visualSec.classList.remove('hidden');
        if (codeSec) codeSec.classList.add('hidden');
    }
    
    if (window.showToast) {
        window.showToast(nextHtml ? "Switched to Raw HTML Editor mode." : "Switched to Visual Rich Formatter mode.", "info");
    }
    w.calculateRceWordCount();
};

w.toggleRceFullscreen = () => {
    // Elegant stylesheet-based mock fullscreen that works reliably in iframe/subagent contexts
    const body = document.body;
    body.classList.toggle('rce-fullscreen-active');
    if (window.showToast) {
        window.showToast(body.classList.contains('rce-fullscreen-active') ? "Entered Fullscreen Workspace mode." : "Exited Fullscreen Workspace mode.", "info");
    }
};

w.insertRceTable = async () => {
    const res = await w.showFormDialog("Insert Table Grid", [
        { key: "rows", label: "Number of Rows", type: "number", placeholder: "3" },
        { key: "cols", label: "Number of Columns", type: "number", placeholder: "3" }
    ]);
    if (!res) return;
    
    const rows = Math.min(Math.max(parseInt(res.rows) || 2, 1), 20);
    const cols = Math.min(Math.max(parseInt(res.cols) || 2, 1), 20);

    let tableHtml = `<table class="w-full border-collapse border border-text-main/15 my-4 text-xs select-text"><tbody>`;
    for (let r = 0; r < rows; r++) {
        tableHtml += `<tr>`;
        for (let c = 0; c < cols; c++) {
            tableHtml += `<td class="border border-text-main/15 p-2 min-w-[60px]" contenteditable="true">Cell</td>`;
        }
        tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p></p>`;

    document.execCommand("insertHTML", false, tableHtml);
    if (window.showToast) window.showToast(`Inserted a ${rows}x${cols} table grid!`, "success");
    w.calculateRceWordCount();
};

w.insertRceMathSymbol = (sym: string) => {
    if (!sym) return;
    document.execCommand("insertText", false, sym);
    w.calculateRceWordCount();
};

w.calculateRceWordCount = () => {
    const visual = document.getElementById('compose-body-contentable');
    const visualSec = document.getElementById('compose-body-contentable-secondary');
    
    let text = "";
    if (visual) text += visual.textContent || "";
    if (visualSec) text += visualSec.textContent || "";

    const cleanText = text.trim();
    const wordCount = cleanText ? cleanText.split(/\s+/).length : 0;
    const charCount = text.length;

    const wcEl = document.getElementById('rce-word-count');
    const ccEl = document.getElementById('rce-char-count');
    
    if (wcEl) wcEl.textContent = `Words: ${wordCount}`;
    if (ccEl) ccEl.textContent = `Characters: ${charCount}`;
};

// Switch Compose Metadata Category Tab
w.switchComposeMetaTab = (tab: string) => {
    localStorage.setItem('meidallm_compose_meta_tab', tab);
    
    // Hide all panels
    ['social', 'video', 'live', 'podcast'].forEach(k => {
        const pane = document.getElementById('meta-pane-' + k);
        const btn = document.getElementById('meta-tab-btn-' + k);
        if (pane) pane.classList.add('hidden');
        if (btn) {
            btn.classList.remove('border-violet-500', 'text-violet-400');
            btn.classList.add('border-transparent', 'text-[var(--color-text-muted)]');
        }
    });

    // Show selected panel
    const targetPane = document.getElementById('meta-pane-' + tab);
    const targetBtn = document.getElementById('meta-tab-btn-' + tab);
    if (targetPane) targetPane.classList.remove('hidden');
    if (targetBtn) {
        targetBtn.classList.add('border-violet-500', 'text-violet-400');
        targetBtn.classList.remove('border-transparent', 'text-[var(--color-text-muted)]');
    }
};

// Simulated AI Translation Handler
w.runComposeAITranslate = () => {
    const titleEl = document.getElementById('compose-title') as HTMLInputElement;
    const subtitleEl = document.getElementById('compose-subtitle') as HTMLInputElement;
    const bodyEl = document.getElementById('compose-body-contentable') as HTMLDivElement;
    
    const titleSecondaryEl = document.getElementById('compose-title-secondary') as HTMLInputElement;
    const subtitleSecondaryEl = document.getElementById('compose-subtitle-secondary') as HTMLInputElement;
    const bodySecondaryEl = document.getElementById('compose-body-contentable-secondary') as HTMLDivElement;

    if (!titleEl || !bodyEl) return;
    
    const primaryKey = localStorage.getItem('meidallm_compose_primary_lang') || 'en';
    const secondaryKey = localStorage.getItem('meidallm_compose_secondary_lang') || 'es';

    const transLabels: Record<string, string> = {
        es: "Spanish", fr: "French", de: "German", ja: "Japanese", zh: "Chinese", ar: "Arabic", pt: "Portuguese",
        hi: "Hindi", te: "Telugu"
    };
    const destLang = transLabels[secondaryKey] || 'Spanish';

    if (window.showToast) window.showToast(`Translating draft content to ${destLang}...`, "info");
    
    const indicatorEl = document.getElementById('compose-typing-indicator');
    if (indicatorEl) {
        indicatorEl.classList.remove('hidden');
        const span = indicatorEl.querySelector('span:last-child');
        if (span) span.textContent = `AI Translation to ${destLang} in progress...`;
    }

    setTimeout(() => {
        // Mock translation mappings for presentation
        const mockTitles: Record<string, string> = {
            es: "Cinco Tendencias de Inteligencia Artificial en Producción de Medios",
            fr: "Cinq Tendances de l'Intelligence Artificielle dans la Production Médias",
            de: "Fünf KI-Trends in der Medienproduktion",
            ja: "メディア制作における5つの人工知能トレンド",
            zh: "媒体制作中的五大人工智能趋势",
            ar: "خمسة اتجاهات للذكاء الاصطناعي في إنتاج الوسائط",
            pt: "Cinco Tendências de Inteligência Artificial na Produção de Mídia",
            hi: "मीडिया उत्पादन में पांच आर्टिफिशियल इंटेलिजेंस रुझान",
            te: "మీడియా ప్రొడక్షన్‌లో ఐదు ఆర్టిఫిషియల్ ఇంటెలిజెన్స్ ట్రెండ్‌లు"
        };
        const mockSubs: Record<string, string> = {
            es: "Cómo los flujos de trabajo generativos están remodelando la economía de creadores",
            fr: "Comment les workflows génératifs façonnent l'économie des créateurs",
            de: "Wie generative Workflows die Creator Economy umgestalten",
            ja: "生成ワークフローがクリエイターエコノミーをどのように再構築しているか",
            zh: "生成式工作流如何重塑创作者经济",
            ar: "كيف تعيد سير العمل التوليدي تشكيل اقتصاد المبدعين",
            pt: "Como os fluxos de trabalho generativos estão remodelando a economia dos criadores",
            hi: "कैसे जनरेटिव वर्कफ़्लो क्रिएटर इकॉनमी को नया आकार दे रहे हैं",
            te: "జనరేటివ్ వర్క్‌ఫ్లోలు క్రియేటర్ ఎకానమీని ఎలా పునర్నిర్మిస్తున్నాయి"
        };
        const mockBodies: Record<string, string> = {
            es: "<h2>Resumen Ejecutivo</h2><p>La IA generativa está revolucionando todos los aspectos del desarrollo creativo, reduciendo el tiempo de comercialización para creadores independientes y marcas globales.</p>",
            fr: "<h2>Résumé Exécutif</h2><p>L'IA générative révolutionne tous les aspects du développement créatif, accélérant la mise sur le marché pour les créateurs indépendants et les marques mondiales.</p>",
            de: "<h2>Zusammenfassung</h2><p>Generative KI revolutioniert alle Aspekte der kreativen Entwicklung und verkürzt die Markteinführungszeit für unabhängige Entwickler und globale Marken.</p>",
            ja: "<h2>エグゼクティブサマリー</h2><p>ジェネレーティブAIは創造的開発のあらゆる側面を革新し、独立系クリエイターやグローバルブランドの市場投入までの時間を短縮しています。</p>",
            zh: "<h2>执行摘要</h2><p>生成式人工智能正在彻底改变创意开发的各个方面，缩短独立创作者和全球品牌的上市时间。</p>",
            ar: "<h2>ملخص تنفيذي</h2><p>يحدث الذكاء الاصطناعي التوليدي ثورة في جميع جوانب التطوير الإبداعي، مما يقلل من وقت الوصول إلى السوق للمبدعين المستقلين والعلامات التجارية العالمية.</p>",
            pt: "<h2>Resumo Executivo</h2><p>A IA generativa está revolucionando todos os aspectos do desenvolvimento criativo, reduzindo o tempo de mercado para criadores independentes e marcas globais.</p>",
            hi: "<h2>कार्यकारी सारांश</h2><p>जनरेटिव एआई रचनात्मक विकास के हर पहलू में क्रांति ला रहा है, स्वतंत्र रचनाकारों और वैश्विक ब्रांडों के लिए बाजार में आने के समय को कम कर रहा है।</p>",
            te: "<h2>ఎగ్జిక్యూటివ్ సమ్మరీ</h2><p>జనరేటివ్ AI సృజనాత్మక అభివృద్ధి యొక్క ప్రతి అంశాన్ని విప్లవాత్మకంగా మారుస్తోంది, స్వతంత్ర సృష్టికర్తలు మరియు గ్లోబల్ బ్రాండ్‌ల కోసం మార్కెట్ సమయాన్ని తగ్గిస్తుంది।</p>"
        };

        // Enable Dual Edit Mode automatically to display both side-by-side
        w.updateComposeLayout('dual');

        setTimeout(() => {
            const secTitle = document.getElementById('compose-title-secondary') as HTMLInputElement;
            const secSub = document.getElementById('compose-subtitle-secondary') as HTMLInputElement;
            const secBody = document.getElementById('compose-body-contentable-secondary') as HTMLDivElement;

            if (secTitle) secTitle.value = mockTitles[secondaryKey] || "AI Translated Content";
            if (secSub) secSub.value = mockSubs[secondaryKey] || "";
            if (secBody) secBody.innerHTML = mockBodies[secondaryKey] || "Translated draft content body.";
            
            if (indicatorEl) indicatorEl.classList.add('hidden');
            if (window.showToast) window.showToast(`AI translation complete! Dual columns active.`, "success");
        }, 100);
    }, 1800);
};

w.updateComposeCoverPreview = (url: string) => {
    const preview = document.getElementById('compose-cover-preview');
    if (!preview) return;
    if (url.trim()) {
        preview.style.backgroundImage = `url('${url}')`;
        preview.classList.remove('hidden');
    } else {
        preview.classList.add('hidden');
    }
};

w.simulateImageUpload = () => {
    const images = [
        "https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    ];
    const url = images[Math.floor(Math.random() * images.length)]!;
    const coverInput = document.getElementById('compose-cover-image') as HTMLInputElement;
    if (coverInput) {
        coverInput.value = url;
        w.updateComposeCoverPreview(url);
        if (window.showToast) window.showToast("Cover image attached successfully!", "success");
    }
};

// Gantt Timeline Drag & Drop resizing / shifting
w.initGanttDrag = (e: MouseEvent, taskId: string, mode: 'shift' | 'left' | 'right', initialLeft: number, dayWidth: number, rangeStartStr: string, initialWidth?: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const barEl = document.getElementById(`gantt-bar-${taskId}`) || (e.currentTarget as HTMLElement);
    if (!barEl) return;

    const startLeft = initialLeft;
    const startWidth = initialWidth || barEl.offsetWidth;
    const rangeStart = new Date(rangeStartStr);

    const onMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaDays = Math.round(deltaX / dayWidth);

        if (mode === 'shift') {
            const newLeft = startLeft + deltaDays * dayWidth;
            barEl.style.left = `${newLeft}px`;
        } else if (mode === 'left') {
            const newLeft = startLeft + deltaDays * dayWidth;
            const newWidth = startWidth - deltaDays * dayWidth;
            if (newWidth >= dayWidth) {
                barEl.style.left = `${newLeft}px`;
                barEl.style.width = `${newWidth}px`;
            }
        } else if (mode === 'right') {
            const newWidth = startWidth + deltaDays * dayWidth;
            if (newWidth >= dayWidth) {
                barEl.style.width = `${newWidth}px`;
            }
        }
    };

    const onMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        const deltaX = upEvent.clientX - startX;
        const deltaDays = Math.round(deltaX / dayWidth);

        const task = state.kanbanState.find(t => t.id === taskId);
        if (task) {
            const currentDue = task.dueDate ? new Date(task.dueDate) : new Date();
            const currentStart = (task as any).startDate ? new Date((task as any).startDate) : new Date(currentDue.getTime() - 3 * 86400000);

            if (mode === 'shift') {
                currentStart.setDate(currentStart.getDate() + deltaDays);
                currentDue.setDate(currentDue.getDate() + deltaDays);
            } else if (mode === 'left') {
                currentStart.setDate(currentStart.getDate() + deltaDays);
                if (currentStart.getTime() > currentDue.getTime()) {
                    currentStart.setTime(currentDue.getTime());
                }
            } else if (mode === 'right') {
                currentDue.setDate(currentDue.getDate() + deltaDays);
                if (currentDue.getTime() < currentStart.getTime()) {
                    currentDue.setTime(currentStart.getTime());
                }
            }

            task.dueDate = currentDue.toISOString().split('T')[0];
            (task as any).startDate = currentStart.toISOString().split('T')[0];
            notifyStateChange();
        }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
};

w.updateGanttFilter = (key: string, value: string) => {
    localStorage.setItem(`meidallm_gantt_filter_${key}`, value);
    notifyStateChange();
};

// Publish schedule handlers
w.schedulePost = (pid: string) => {
    const selectEl = document.getElementById('publish-draft-select') as HTMLSelectElement;
    const dateEl = document.getElementById('publish-datetime') as HTMLInputElement;
    const channelsEl = document.querySelectorAll('input[name="channels"]:checked');

    if (!selectEl || !dateEl) return;
    const draftId = selectEl.value;
    if (!draftId) {
        if (window.showToast) window.showToast("Please select a content draft to publish.", "error");
        return;
    }
    const draft = state.drafts.find(d => d.id === draftId);
    if (!draft) return;

    const channels: string[] = [];
    channelsEl.forEach(el => channels.push((el as HTMLInputElement).value));
    if (channels.length === 0) {
        if (window.showToast) window.showToast("Please select at least one publishing channel.", "error");
        return;
    }

    const publishTimeStr = dateEl.value;
    if (!publishTimeStr) {
        if (window.showToast) window.showToast("Please specify a publishing date and time.", "error");
        return;
    }
    const scheduledTime = new Date(publishTimeStr).getTime();

    addPublishSchedule(pid, draftId, draft.title, draft.format, channels, scheduledTime);
    if (window.showToast) window.showToast("Campaign post successfully scheduled!", "success");
};

w.deleteSchedule = async (id: string, pid: string) => {
    const ok = await w.showConfirmDialog("Delete Schedule", "Cancel and delete this scheduled publication?");
    if (ok) {
        deletePublishSchedule(id);
    }
};

w.handleCalendarDragStart = (e: DragEvent, scheduleId: string) => {
    if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', scheduleId);
        e.dataTransfer.effectAllowed = 'move';
    }
};

w.handleCalendarDrop = (e: DragEvent, day: number) => {
    e.preventDefault();
    if (!e.dataTransfer) return;
    
    const scheduleId = e.dataTransfer.getData('text/plain');
    const schedule = state.publishSchedules.find(s => s.id === scheduleId);
    
    if (schedule) {
        // Build new date object preserving current hours/minutes but switching day to the target day in June 2026
        const current = new Date(schedule.scheduledTime);
        current.setDate(day);
        current.setMonth(5); // June is month index 5
        current.setFullYear(2026);
        
        schedule.scheduledTime = current.getTime();
        notifyStateChange();
        
        if (window.showToast) {
            window.showToast(`Rescheduled "${schedule.title}" to June ${day}, 2026`, 'success');
        }
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

// --- Active Timer Window Handlers ---
let activeTimerInterval: any = null;

function checkActiveTimerTick() {
    const isRunning = state.activeTimer && state.activeTimer.startTime !== null;
    const clock = document.getElementById('active-timer-clock');
    
    if (isRunning && clock) {
        if (!activeTimerInterval) {
            const updateClock = () => {
                const el = document.getElementById('active-timer-clock');
                if (el && state.activeTimer.startTime) {
                    const elapsedMs = Date.now() - state.activeTimer.startTime + (state.activeTimer.secondsElapsed * 1000);
                    const totalSecs = Math.floor(elapsedMs / 1000);
                    const hours = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
                    const minutes = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
                    const seconds = Math.floor(totalSecs % 60).toString().padStart(2, '0');
                    el.innerText = `${hours}:${minutes}:${seconds}`;
                }
            };
            updateClock();
            activeTimerInterval = setInterval(updateClock, 1000);
        }
    } else {
        if (activeTimerInterval) {
            clearInterval(activeTimerInterval);
            activeTimerInterval = null;
        }
    }
}

w.handleTimerProjectChange = (pid: string) => {
    const taskSelect = document.getElementById('timer-task-select') as HTMLSelectElement;
    if (taskSelect) {
        const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isBinned && !t.isArchived);
        taskSelect.innerHTML = `<option value="">-- No Task / General --</option>` +
            tasks.map(t => `<option value="${t.id}">${sanitizeHTML(t.title)}</option>`).join('');
    }
};

w.handleManualProjectChange = (pid: string) => {
    const taskSelect = document.getElementById('manual-task-select') as HTMLSelectElement;
    if (taskSelect) {
        const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isBinned && !t.isArchived);
        taskSelect.innerHTML = `<option value="">-- No Task / General --</option>` +
            tasks.map(t => `<option value="${t.id}">${sanitizeHTML(t.title)}</option>`).join('');
    }
};

w.startActiveTimer = () => {
    const projectSelect = document.getElementById('timer-project-select') as HTMLSelectElement;
    const taskSelect = document.getElementById('timer-task-select') as HTMLSelectElement;
    const descInput = document.getElementById('timer-description-input') as HTMLInputElement;
    const billableCheckbox = document.getElementById('timer-billable-checkbox') as HTMLInputElement;

    if (!projectSelect || !taskSelect) return;

    const projectId = projectSelect.value;
    const taskId = taskSelect.value;
    const desc = descInput ? descInput.value.trim() : "";
    const isBillable = billableCheckbox ? billableCheckbox.checked : true;

    const project = state.projects.find(p => p.id === projectId);
    const task = state.kanbanState.find(t => t.id === taskId);

    const projectName = project ? project.name : "General Work";
    const taskTitle = task ? task.title : (desc || "General Administrative Work");

    startTimer(projectId, taskId, taskTitle, projectName, isBillable);

    // Sync to Postgres in background (localStorage is already updated by startTimer)
    const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
    const activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    const activeOrg = state.organizations.find(o => o.id === activeTeam?.orgId);
    syncTimerStart({
        id: state.activeTimer.startTime!.toString(), // use startTime as stable ID
        userId: currentUserProfile?.id || state.currentUser || 'unknown',
        userEmail: state.currentUser,
        orgId: activeOrg?.id,
        teamId: activeTeam?.id,
        projectId,
        projectName,
        taskId,
        taskTitle,
        description: desc,
        billable: isBillable,
        startTime: state.activeTimer.startTime!
    });
};

w.stopActiveTimer = () => {
    const endTime = Date.now();
    const timerId = state.activeTimer.startTime?.toString();
    const log = stopAndSaveTimer();
    if (log) {
        const totalSecs = Math.floor(log.durationMs / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const minutes = Math.floor((totalSecs % 3600) / 60);
        const durationStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        if (window.showToast) window.showToast(`Timer stopped — ${durationStr} logged!`, 'success');

        // Sync stop to Postgres in background
        const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
        if (timerId) {
            syncTimerStop({
                id: timerId,
                userId: currentUserProfile?.id || state.currentUser || 'unknown',
                endTime,
                durationMs: log.durationMs
            });
        }
        // Also sync the resulting log entry
        syncManualLog({ ...log, userId: currentUserProfile?.id, userName: currentUserProfile?.name });
    }
};

w.discardActiveTimer = () => {
    if (confirm("Are you sure you want to discard this running timer? Your elapsed hours will not be saved.")) {
        const timerId = state.activeTimer.startTime?.toString();
        const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
        discardTimer();
        if (timerId) {
            syncTimerDiscard({
                id: timerId,
                userId: currentUserProfile?.id || state.currentUser || 'unknown'
            });
        }
    }
};

w.showManualLogModal = () => {
    const modal = document.getElementById('manual-log-modal');
    if (modal) modal.classList.remove('hidden');
};

w.hideManualLogModal = () => {
    const modal = document.getElementById('manual-log-modal');
    if (modal) modal.classList.add('hidden');
};

w.saveManualTimeLog = () => {
    const projectSelect = document.getElementById('manual-project-select') as HTMLSelectElement;
    const taskSelect = document.getElementById('manual-task-select') as HTMLSelectElement;
    const descInput = document.getElementById('manual-description-input') as HTMLInputElement;
    const hrsInput = document.getElementById('manual-hours-input') as HTMLInputElement;
    const minsInput = document.getElementById('manual-minutes-input') as HTMLInputElement;
    const billableCheckbox = document.getElementById('manual-billable-checkbox') as HTMLInputElement;
    const dateInput = document.getElementById('manual-date-input') as HTMLInputElement;
    const startInput = document.getElementById('manual-start-input') as HTMLInputElement;
    const endInput = document.getElementById('manual-end-input') as HTMLInputElement;

    if (!projectSelect || !taskSelect || !hrsInput || !minsInput) return;

    const projectId = projectSelect.value;
    const taskId = taskSelect.value;
    const desc = descInput ? descInput.value.trim() : "";
    const dateVal = dateInput?.value || new Date().toISOString().split('T')[0];
    const startTime = startInput?.value || undefined;
    const endTime = endInput?.value || undefined;
    const isBillable = billableCheckbox ? billableCheckbox.checked : true;

    // Calculate duration from start/end times if both provided, else use manual hrs/mins
    let durationMs: number;
    if (startTime && endTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        const [eh, em] = endTime.split(':').map(Number);
        const diffMins = (eh * 60 + em) - (sh * 60 + sm);
        durationMs = Math.max(diffMins, 0) * 60000;
        if (durationMs === 0) {
            const hrs = parseInt(hrsInput.value) || 0;
            const mins = parseInt(minsInput.value) || 0;
            durationMs = (hrs * 3600 + mins * 60) * 1000;
        }
    } else {
        const hrs = parseInt(hrsInput.value) || 0;
        const mins = parseInt(minsInput.value) || 0;
        durationMs = (hrs * 3600 + mins * 60) * 1000;
    }

    if (durationMs === 0) {
        alert("Please enter a duration greater than 0.");
        return;
    }

    const project = state.projects.find(p => p.id === projectId);
    const task = state.kanbanState.find(t => t.id === taskId);
    const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
    const activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    const activeOrg = state.organizations.find(o => o.id === activeTeam?.orgId);

    const projectName = project ? project.name : "General Work";
    const taskTitle = task ? task.title : (desc || "General Administrative Work");

    // Build timestamp from selected date
    const entryDate = new Date(dateVal);
    if (startTime) {
        const [sh, sm] = startTime.split(':').map(Number);
        entryDate.setHours(sh, sm, 0, 0);
    }

    const newLog: TimeLog = {
        id: 'tl-' + Math.random().toString(36).substr(2, 9),
        projectId: projectId || undefined,
        taskId: taskId || undefined,
        taskTitle,
        projectName,
        durationMs,
        timestamp: entryDate.getTime(),
        billable: isBillable,
        description: desc || undefined,
        date: dateVal,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        userId: currentUserProfile?.id,
        userName: currentUserProfile?.name,
        teamId: activeTeam?.id,
        orgId: activeOrg?.id,
        status: 'pending'
    };

    state.timeLogs.unshift(newLog);
    notifyStateChange();
    w.hideManualLogModal();
    if (window.showToast) window.showToast(`Time logged: ${(durationMs/3600000).toFixed(1)}h saved successfully`, 'success');
};

w.exportTimeLogs = () => {
    if (state.timeLogs.length === 0) {
        alert("No time logs to export.");
        return;
    }
    let csv = "ID,Project,Task,Duration (Minutes),Billable,Date\n";
    state.timeLogs.forEach(log => {
        csv += `"${log.id}","${log.projectName.replace(/"/g, '""')}","${log.taskTitle.replace(/"/g, '""')}","${Math.floor(log.durationMs/60000)}","${log.billable}","${new Date(log.timestamp).toLocaleDateString()}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `meidallm-timesheet-${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
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
    checkActiveTimerTick();
}

// Register state-change listener to redraw active UI components
registerStateListener(() => {
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = renderLayoutHTML();
    }
    updateSidebarUI();
    updateThemeButtonsUI();
    renderView(state.activeViewKey, state.currentProject || undefined);
    checkActiveTimerTick();
});

// Initialization
let initialized = false;
async function init() {
    if (initialized) return;
    initialized = true;
    await loadState();
    initTelemetry();
    
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
    
    // Multi-user collaboration presence simulation loops
    setInterval(() => {
        const typingIndicator = document.getElementById('compose-typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.toggle('hidden');
        }
    }, 4000);

    // (Removed) Collab Presence Toast interval
    const collabMsgs = [
        "Richard Hendricks edited the 'Compose' outline.",
        "Gavin Belson acquired the social captions lock.",
        "Bablu Katru resolved SLA escalations in Helpdesk.",
        "Richard Hendricks is active in Timeline (Gantt).",
        "Gavin Belson updated campaign goals progress."
    ];
    let msgIdx = 0;
    /*
    setInterval(() => {
        if (window.showToast && Math.random() > 0.3) {
            window.showToast(`👥 Collab Presence: ${collabMsgs[msgIdx++ % collabMsgs.length]}`, 'info');
        }
    }, 15000);
    */
    
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

    // Paste listener for auto-detecting language in primary editor
    document.addEventListener('paste', (e) => {
        const target = e.target as HTMLElement;
        if (target && target.id === 'compose-body-contentable') {
            const pastedText = e.clipboardData?.getData('text') || '';
            if (!pastedText.trim()) return;

            const detected = detectPastedLanguage(pastedText);
            if (detected) {
                const currentPrimary = localStorage.getItem('meidallm_compose_primary_lang') || 'en';
                if (detected !== currentPrimary) {
                    w.updateComposeLangSetting('primary', detected);

                    const langNames: Record<string, string> = {
                        en: 'English', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese',
                        it: 'Italian', ru: 'Russian', ja: 'Japanese', zh: 'Chinese', ar: 'Arabic',
                        hi: 'Hindi', te: 'Telugu', bn: 'Bengali', nl: 'Dutch', ko: 'Korean', tr: 'Turkish',
                        vi: 'Vietnamese', pl: 'Polish', sv: 'Swedish', el: 'Greek', he: 'Hebrew'
                    };
                    const detectedName = langNames[detected] || detected.toUpperCase();

                    if (window.showToast) {
                        window.showToast(`✨ Auto-Detected language: ${detectedName}. Primary layout updated.`, 'success');
                    }
                }
            }
        }
    });

    // Indic languages real-time phonetic transliteration support
    w.fetchTransliteration = async (word: string, langCode: string): Promise<string> => {
        if (!word || !/^[a-zA-Z'-]+$/.test(word)) return word;
        const itc = langCode === 'hi' ? 'hi-t-i0-und' : 'te-t-i0-und';
        const url = `https://inputtools.google.com/request?text=${encodeURIComponent(word)}&itc=${itc}&num=1&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`;
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1] && data[1][0][1][0]) {
                return data[1][0][1][0];
            }
        } catch (err) {
            console.error("Transliteration request failed:", err);
        }
        return word;
    };

    document.addEventListener('keydown', async (e) => {
        const target = e.target as HTMLElement;
        if (!target) return;

        let langCode: string | null = null;
        let isContentEditable = false;

        if (target.id === 'compose-body-contentable') {
            langCode = localStorage.getItem('meidallm_compose_primary_lang') || 'en';
            isContentEditable = true;
        } else if (target.id === 'compose-body-contentable-secondary') {
            langCode = localStorage.getItem('meidallm_compose_secondary_lang') || 'es';
            isContentEditable = true;
        } else if (target.id === 'compose-title' || target.id === 'compose-subtitle') {
            langCode = localStorage.getItem('meidallm_compose_primary_lang') || 'en';
            isContentEditable = false;
        } else if (target.id === 'compose-title-secondary' || target.id === 'compose-subtitle-secondary') {
            langCode = localStorage.getItem('meidallm_compose_secondary_lang') || 'es';
            isContentEditable = false;
        }

        if (langCode !== 'hi' && langCode !== 'te') return;

        const triggers = [' ', 'Enter', '.', ',', '?', '!', ';', ':'];
        if (!triggers.includes(e.key)) return;

        if (!isContentEditable) {
            const input = target as HTMLInputElement;
            const caretPos = input.selectionStart || 0;
            const textBefore = input.value.substring(0, caretPos);
            const textAfter = input.value.substring(caretPos);
            
            const wordMatch = textBefore.match(/([a-zA-Z'-]+)$/);
            if (wordMatch) {
                const word = wordMatch[1];
                e.preventDefault();
                
                const transliterated = await w.fetchTransliteration(word, langCode);
                const startOfWord = caretPos - word.length;
                const insertion = transliterated + (e.key === 'Enter' ? '' : e.key);
                
                input.value = input.value.substring(0, startOfWord) + insertion + textAfter;
                const newCaretPos = startOfWord + insertion.length;
                input.setSelectionRange(newCaretPos, newCaretPos);
                
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
                const range = sel.getRangeAt(0).cloneRange();
                
                sel.modify("extend", "backward", "word");
                const word = sel.toString().trim();
                
                sel.removeAllRanges();
                sel.addRange(range);
                
                if (word && /^[a-zA-Z'-]+$/.test(word)) {
                    e.preventDefault();
                    
                    const transliterated = await w.fetchTransliteration(word, langCode);
                    
                    sel.modify("extend", "backward", "word");
                    const replaceRange = sel.getRangeAt(0);
                    replaceRange.deleteContents();
                    
                    let insertion = transliterated;
                    if (e.key === ' ') {
                        insertion += ' ';
                    } else if (e.key !== 'Enter') {
                        insertion += e.key;
                    }
                    
                    const node = document.createTextNode(insertion);
                    replaceRange.insertNode(node);
                    
                    replaceRange.setStartAfter(node);
                    replaceRange.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(replaceRange);
                    
                    if (e.key === 'Enter') {
                        document.execCommand('insertParagraph', false);
                    }
                    
                    w.calculateRceWordCount();
                }
            }
        }
    });

    // Input/keyup listeners to update RCE word/character counts live as user writes
    document.addEventListener('input', (e) => {
        const target = e.target as HTMLElement;
        if (target && (target.id === 'compose-body-contentable' || target.id === 'compose-body-contentable-secondary')) {
            w.calculateRceWordCount();
        }
    });

    document.addEventListener('keyup', (e) => {
        const target = e.target as HTMLElement;
        if (target && (target.id === 'compose-body-contentable' || target.id === 'compose-body-contentable-secondary')) {
            w.calculateRceWordCount();
        }
    });
}

function detectPastedLanguage(text: string): string | null {
    // 1. Script ranges checks first
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja'; // Japanese Hiragana/Katakana
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh'; // Chinese Hanzi
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko'; // Korean Hangul
    if (/[\u0600-\u06FF]/.test(text)) return 'ar'; // Arabic
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Hindi Devanagari
    if (/[\u0400-\u04FF]/.test(text)) return 'ru'; // Russian Cyrillic
    if (/[\u0590-\u05FF]/.test(text)) return 'he'; // Hebrew
    if (/[\u0370-\u03FF]/.test(text)) return 'el'; // Greek

    // 2. Stop words analysis for European languages
    const normalized = text.toLowerCase();
    
    // Vietnamese tone marks
    if (/[đươàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/.test(normalized)) {
        if (/\b(và|của|cho|trong|tôi|không|có|được|người|với)\b/.test(normalized)) {
            return 'vi';
        }
    }

    if (/\b(que|para|con|una|los|del|como|este|todo)\b/.test(normalized)) return 'es';
    if (/\b(les|pour|dans|avec|une|cette|pourquoi|mais)\b/.test(normalized)) return 'fr';
    if (/\b(und|ist|mit|von|eine|nicht|sind|haben|oder|aber)\b/.test(normalized)) return 'de';
    if (/\b(uma|com|para|mais|como|pelo|pela|seus|suas)\b/.test(normalized)) return 'pt';
    if (/\b(gli|del|con|per|non|come|questo|tutto|anche)\b/.test(normalized)) return 'it';
    if (/\b(het|een|van|met|voor|zijn|voor|maar|deze|niet)\b/.test(normalized)) return 'nl';
    if (/\b(dla|nie|jest|jestem|jego|tylko|być|jako|przy)\b/.test(normalized)) return 'pl';
    if (/\b(och|att|det|med|men|för|eller|inte|denna|till)\b/.test(normalized)) return 'sv';

    return null;
}

// Command Menu (CMD+K / Ctrl+K) Logic & Actions
const COMMANDS = [
    { name: "Go to Workspaces", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateTo('workspaces'); } },
    { name: "Go to Task Kanban Board", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('projects-hub', 'kanban-board'); } },
    { name: "Go to Cycles & Sprints", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('projects-hub', 'project-cycles'); } },
    { name: "Go to Collaborative Databases", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('database-hub', 'database-hub'); } },
    { name: "Go to Idea Canvas", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('discover-hub', 'idea-canvas'); } },
    { name: "Go to Research & RAG Engine", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('discover-hub', 'research'); } },
    { name: "Go to Media Assets Studio", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('create-hub', 'media'); } },
    { name: "Go to Drafts & Compose", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('create-hub', 'drafts'); } },
    { name: "Go to Campaign Analytics", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateToHub('insights-hub', 'analytics'); } },
    { name: "Go to CRM Hub", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateTo('crm'); } },
    { name: "Go to Team Office", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateTo('team'); } },
    { name: "Go to Settings", category: "Navigation", action: () => { w.toggleCommandMenu(false); w.navigateTo('settings'); } },
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

    state.tickets?.forEach(t => {
        currentList.push({
            name: `Ticket: ${t.title}`,
            category: "Tickets",
            action: () => { w.navigateTo('helpdesk'); w.openTicketModal(t.id); w.toggleCommandMenu(false); }
        });
    });

    state.team?.forEach(member => {
        currentList.push({
            name: `User: ${member.name} (${member.email})`,
            category: "Team Directory",
            action: () => { w.navigateTo('team'); w.toggleCommandMenu(false); }
        });
    });

    state.teams?.forEach(team => {
        currentList.push({
            name: `Tenant: ${team.name}`,
            category: "Tenants",
            action: () => { w.switchTeam(team.id); w.toggleCommandMenu(false); }
        });
    });
    
    const filtered = cleanQuery ? currentList.filter(item => item.name.toLowerCase().includes(cleanQuery)) : currentList;
    
    const categories: Record<string, typeof filtered> = {};
    filtered.forEach(item => {
        if (!categories[item.category]) categories[item.category] = [];
        categories[item.category]!.push(item);
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

let currentWizardStep = 1;
w.openCreativeWizard = () => {
    currentWizardStep = 1;
    const modal = document.getElementById('creative-wizard-modal');
    if (modal) modal.classList.remove('hidden');
    w.updateWizardUI();
    w.toggleAiAssistant(false); // Close AI drawer if open
};

w.closeCreativeWizard = () => {
    const modal = document.getElementById('creative-wizard-modal');
    if (modal) modal.classList.add('hidden');
};

w.wizardStep = (dir: number) => {
    currentWizardStep += dir;
    if (currentWizardStep > 3) currentWizardStep = 3;
    if (currentWizardStep < 1) currentWizardStep = 1;
    w.updateWizardUI();

    // If moving to step 2 (AI generating), auto advance to step 3 after a delay
    if (currentWizardStep === 2) {
        setTimeout(() => {
            currentWizardStep = 3;
            w.updateWizardUI();
        }, 3000);
    }
};

w.updateWizardUI = () => {
    document.getElementById('wizard-step-1')?.classList.add('hidden');
    document.getElementById('wizard-step-1')?.classList.remove('flex');
    document.getElementById('wizard-step-2')?.classList.add('hidden');
    document.getElementById('wizard-step-2')?.classList.remove('flex');
    document.getElementById('wizard-step-3')?.classList.add('hidden');
    document.getElementById('wizard-step-3')?.classList.remove('flex');
    
    document.getElementById(`wizard-step-${currentWizardStep}`)?.classList.remove('hidden');
    document.getElementById(`wizard-step-${currentWizardStep}`)?.classList.add('flex');

    const btnBack = document.getElementById('wizard-btn-back');
    const btnNext = document.getElementById('wizard-btn-next');
    const btnFinish = document.getElementById('wizard-btn-finish');

    if (btnBack && btnNext && btnFinish) {
        if (currentWizardStep === 1) {
            btnBack.classList.add('hidden');
            btnNext.classList.remove('hidden');
            btnFinish.classList.add('hidden');
        } else if (currentWizardStep === 2) {
            btnBack.classList.add('hidden');
            btnNext.classList.add('hidden');
            btnFinish.classList.add('hidden');
        } else if (currentWizardStep === 3) {
            btnBack.classList.remove('hidden');
            btnNext.classList.add('hidden');
            btnFinish.classList.remove('hidden');
        }
    }
};

w.finishWizard = () => {
    const nameInput = document.getElementById('wizard-campaign-name') as HTMLInputElement;
    const name = nameInput && nameInput.value.trim() !== '' ? nameInput.value : 'AI Generated Campaign';
    
    addProject(name, 'Auto-generated via MeidaLLM Brain');
    
    w.closeCreativeWizard();
    alert('Creative Brief and Workspace generated successfully!');
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
        
        const activeProjId = state.currentProject || 'p1';
        const project = state.projects.find(p => p.id === activeProjId);
        const projectName = project ? project.name : 'Unknown Project';
        const activeView = state.activeViewKey;

        // Context prefix
        const contextPrefix = `[Context: Project "${projectName}" | View "${activeView}"]<br><br>`;
        
        if (lower.includes('task') && (lower.includes('risk') || lower.includes('overdue'))) {
            const activeTasks = state.kanbanState.filter(t => !t.isArchived && !t.isBinned && t.status !== 'done');
            if (activeTasks.length > 0) {
                response = contextPrefix + `Here are tasks currently at risk:<br><br>` + 
                  activeTasks.map(t => `• <strong>${t.title}</strong> (${t.tag}) - Status: <strong>${t.status}</strong>`).join('<br>');
            } else {
                response = contextPrefix + "Great news! All active tasks are completed or on-schedule.";
            }
        } else if (lower.includes('standup') || (lower.includes('summarize') && (lower.includes('comment') || lower.includes('active')))) {
            // Standup summary from comments + activity
            const projTasks = state.kanbanState.filter(t => t.projectId === activeProjId);
            const taskComments = projTasks.flatMap(t => (t.comments || []).map(c => `Task "${t.title}": "${c.text}" (by ${c.author})`));
            
            response = contextPrefix + `<strong>Daily Standup & Activity Summary:</strong><br><br>`;
            if (taskComments.length > 0) {
                response += `<strong>Recent Collaborator Comments:</strong><br>` + taskComments.slice(-5).map(c => `• ${c}`).join('<br>') + `<br><br>`;
            } else {
                response += `No recent comments found in this project.<br><br>`;
            }
            
            const done = projTasks.filter(t => t.status === 'done');
            const progress = projTasks.filter(t => t.status === 'progress');
            response += `<strong>Progress Breakdown:</strong><br>` +
                        `• Completed: ${done.length} tasks<br>` +
                        `• In Progress: ${progress.length} tasks<br>`;
        } else if (lower.includes('status') || lower.includes('report')) {
            // Status report: done, progress, backlog, review
            const projTasks = state.kanbanState.filter(t => t.projectId === activeProjId);
            const done = projTasks.filter(t => t.status === 'done');
            const progress = projTasks.filter(t => t.status === 'progress');
            const review = projTasks.filter(t => t.status === 'review');
            const backlog = projTasks.filter(t => t.status === 'backlog');
            
            response = contextPrefix + `<strong>Workspace Status Report for "${projectName}":</strong><br><br>` +
                        `<span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5"></span><strong>Done (${done.length}):</strong><br>` +
                        (done.length ? done.map(t => `  • ${t.title}`).slice(0, 3).join('<br>') : '  • None') + `<br>` +
                        `<span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5"></span><strong>In Progress (${progress.length}):</strong><br>` +
                        (progress.length ? progress.map(t => `  • ${t.title}`).slice(0, 3).join('<br>') : '  • None') + `<br>` +
                        `<span class="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1.5"></span><strong>In Review (${review.length}):</strong><br>` +
                        (review.length ? review.map(t => `  • ${t.title}`).slice(0, 3).join('<br>') : '  • None') + `<br>` +
                        `<span class="inline-block w-2.5 h-2.5 rounded-full bg-slate-500 mr-1.5"></span><strong>Backlog (${backlog.length}):</strong><br>` +
                        (backlog.length ? backlog.map(t => `  • ${t.title}`).slice(0, 3).join('<br>') : '  • None');
        } else if (lower.includes('draft') || lower.includes('generate') || lower.includes('write')) {
            // Draft content generation from task description
            const activeTasks = state.kanbanState.filter(t => t.projectId === activeProjId && t.status !== 'done');
            const taskToDraft = activeTasks[0];
            
            if (taskToDraft) {
                response = contextPrefix + `<strong>AI Generated Draft Content for "${taskToDraft.title}":</strong><br><br>` +
                           `<em>Based on description: "${taskToDraft.description || 'No description provided.'}"</em><br><br>` +
                           `"The future of creative workflows is unified. With the latest campaign updates for ${projectName}, our team has streamlined the asset pipelines. Check it out now and elevate your marketing yield!"`;
            } else {
                response = contextPrefix + `No active tasks found in this project to generate drafts from. Try creating a task first!`;
            }
        } else if (lower.includes('cycle') || lower.includes('sprint')) {
            const activeCycle = state.cycles.find(c => c.status === 'active');
            if (activeCycle) {
                const cycleTasks = state.kanbanState.filter(t => t.cycleId === activeCycle.id);
                const doneTasks = cycleTasks.filter(t => t.status === 'done');
                response = contextPrefix + `<strong>Active Cycle: ${activeCycle.name}</strong><br>
                Duration: ${activeCycle.startDate} to ${activeCycle.endDate}<br>
                Progress: ${doneTasks.length} / ${cycleTasks.length} tasks completed.`;
            } else {
                response = contextPrefix + "There is no currently active cycle. Head over to Cycles & Sprints to start one!";
            }
        } else if (lower.includes('tone') || lower.includes('copywriting')) {
            const toneSelect = document.getElementById('setting-brand-tone') as HTMLSelectElement;
            const currentTone = toneSelect ? toneSelect.value : 'Creative';
            response = contextPrefix + `I recommend drafting with a <strong>${currentTone}</strong> tone to align with your current Campaign Preferences.`;
        } else {
            response = contextPrefix + "I've checked the organization state. Let me know if you need me to summarize task logs, check goals, or filter database entries!";
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
w.createGoalPrompt = async () => {
    const res = await w.showFormDialog("Add Campaign Goal", [
        { key: "title", label: "Goal Title", type: "text", placeholder: "e.g. YouTube Subscriber Target" },
        { key: "target", label: "Target Value", type: "number", placeholder: "e.g. 10000" },
        { key: "unit", label: "Metric Unit", type: "text", placeholder: "e.g. Subscribers, Views, Posts", defaultValue: "units" },
        { key: "dueDate", label: "Due Date", type: "date", defaultValue: new Date().toISOString().split('T')[0] }
    ]);
    if (!res || !res.title || isNaN(Number(res.target))) return;

    const newGoal = {
        id: 'g-' + Math.random().toString(36).substr(2, 9),
        projectId: state.currentProject || 'p1',
        title: res.title.trim(),
        targetValue: Number(res.target),
        currentValue: 0,
        unit: res.unit.trim(),
        dueDate: res.dueDate || '',
        status: 'on-track' as const
    };
    
    state.goals.push(newGoal);
    notifyStateChange();
};

w.deleteGoal = async (id: string) => {
    const ok = await w.showConfirmDialog("Delete Goal", "Are you sure you want to delete this campaign goal?");
    if (ok) {
        state.goals = state.goals.filter(g => g.id !== id);
        notifyStateChange();
    }
};

w.incrementGoalProgress = async (id: string) => {
    const goal = state.goals.find(g => g.id === id);
    if (goal) {
        const valStr = await w.showPromptDialog(`Update Progress: ${goal.title}`, "Increment Progress By", "5", "Enter value...");
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

// Admin Hub Tenant Methods
w.provisionTenant = () => {
    if (!w.hasPermission('manage:tenants')) {
        alert("Permission Denied: Super Admin only.");
        return;
    }
    const name = prompt("Enter new Tenant name:");
    if (name) {
        const id = 't-' + name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        state.tenants.push({ id, name, isSuspended: false });
        notifyStateChange();
    }
};

w.suspendTenant = (id: string) => {
    if (!w.hasPermission('manage:tenants')) {
        alert("Permission Denied: Super Admin only.");
        return;
    }
    const tenant = state.tenants.find(t => t.id === id);
    if (tenant) {
        tenant.isSuspended = !tenant.isSuspended;
        notifyStateChange();
    }
};

w.addOrganization = addOrganization;
w.updateOrganization = updateOrganization;
w.deleteOrganization = deleteOrganization;
w.addTeam = addTeam;

w.createTicket = createTicket;
w.assignTicket = assignTicket;
w.updateTicketStatus = updateTicketStatus;
w.addTicketEvent = addTicketEvent;
w.sendMessage = sendMessage;
w.triggerSupportAssist = triggerSupportAssist;
w.exitSupportAssist = exitSupportAssist;

// Full UI modal handlers for Help Desk
w.openNewTicketModal = () => {
    const modalId = 'new-ticket-modal';
    if (document.getElementById(modalId)) return;
    
    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center fade-in p-4 backdrop-blur-sm';
    
    overlay.innerHTML = `
        <div class="bg-background border border-text-main/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            <div class="p-5 border-b border-text-main/10 flex justify-between items-center bg-text-main/5">
                <h3 class="font-bold font-outfit text-lg flex items-center gap-2">
                    <svg class="w-5 h-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/><circle cx="12" cy="12" r="10"/></svg>
                    Create New Ticket
                </h3>
                <button onclick="document.getElementById('${modalId}').remove()" class="text-text-muted hover:text-text-main cursor-pointer p-1 rounded hover:bg-text-main/10 transition-colors">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5 flex flex-col gap-4">
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Subject / Title</label>
                    <input type="text" id="ticket-title" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full transition-colors" placeholder="Brief summary of the issue...">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Category</label>
                        <select id="ticket-category" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full cursor-pointer transition-colors">
                            <option value="General">General</option>
                            <option value="Technical">Technical Support</option>
                            <option value="Billing">Billing & Account</option>
                            <option value="Feature Request">Feature Request</option>
                            <option value="HR">Human Resources</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Priority</label>
                        <select id="ticket-priority" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full cursor-pointer transition-colors">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Department</label>
                        <select id="ticket-dept" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full cursor-pointer transition-colors">
                            <option value="">(None)</option>
                            <option value="IT">IT & Systems</option>
                            <option value="Finance">Finance</option>
                            <option value="Operations">Operations</option>
                            <option value="Sales">Sales</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Issue Type</label>
                        <select id="ticket-issue" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full cursor-pointer transition-colors" onchange="document.getElementById('access-features-container').style.display = this.value === 'Access Request' ? 'flex' : 'none'">
                            <option value="Support">Support</option>
                            <option value="Bug">Bug / Error</option>
                            <option value="Access Request">Access Request</option>
                            <option value="Hardware">Hardware Issue</option>
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Affected Asset</label>
                        <input type="text" id="ticket-asset" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full transition-colors" placeholder="e.g. Laptop, Server #12">
                    </div>
                </div>
                
                <div id="access-features-container" class="flex-col gap-1.5" style="display: none;">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Requested Features / Pages</label>
                    <input type="text" id="ticket-requested-features" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full transition-colors" placeholder="e.g. Admin Panel, Financial Reports">
                </div>
                <div class="flex flex-col gap-1.5">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Description</label>
                    <textarea id="ticket-desc" rows="4" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full resize-none transition-colors" placeholder="Provide detailed information..."></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Assignee</label>
                        <select id="ticket-assignee" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full cursor-pointer transition-colors">
                            <option value="">Unassigned</option>
                            ${stateModule.state.team.map(member => `<option value="${member.id}">${sanitize(member.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div class="flex flex-col gap-1.5">
                        <label class="text-[10px] font-bold uppercase tracking-wider text-text-muted">Attachments / URLs</label>
                        <input type="text" id="ticket-attachments" class="bg-background border border-text-main/20 rounded-lg p-2.5 text-sm text-text-main outline-none focus:border-purple-500 w-full transition-colors" placeholder="Comma separated URLs...">
                    </div>
                </div>
            </div>
            <div class="p-4 border-t border-text-main/10 flex justify-end gap-3 bg-text-main/5">
                <button onclick="document.getElementById('${modalId}').remove()" class="px-4 py-2 rounded-lg text-xs font-bold text-text-muted hover:text-text-main hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button id="ticket-submit" class="bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-md shadow-purple-500/20">Submit Ticket</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    const titleInput = document.getElementById('ticket-title') as HTMLInputElement;
    if (titleInput) titleInput.focus();
    
    const submitBtn = document.getElementById('ticket-submit');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const title = (document.getElementById('ticket-title') as HTMLInputElement).value.trim();
            const desc = (document.getElementById('ticket-desc') as HTMLTextAreaElement).value.trim();
            const cat = (document.getElementById('ticket-category') as HTMLSelectElement).value;
            const prio = (document.getElementById('ticket-priority') as HTMLSelectElement).value as any;
            
            const dept = (document.getElementById('ticket-dept') as HTMLSelectElement).value;
            const issue = (document.getElementById('ticket-issue') as HTMLSelectElement).value;
            const asset = (document.getElementById('ticket-asset') as HTMLInputElement).value.trim();
            const assignee = (document.getElementById('ticket-assignee') as HTMLSelectElement).value;
            const attachments = (document.getElementById('ticket-attachments') as HTMLInputElement).value.trim();
            const requestedFeatures = (document.getElementById('ticket-requested-features') as HTMLInputElement)?.value.trim();
            
            if (!title) {
                alert("Please provide a title.");
                return;
            }
            
            if (w.createTicket) w.createTicket(title, desc, prio, cat, { department: dept, issueType: issue, affectedAsset: asset, assigneeId: assignee, attachments, requestedFeatures });
            
            // Check if it's an Access Request and trigger Notification for Admins (Phase 5)
            if (issue === 'Access Request') {
                const admins = stateModule.state.team.filter(t => t.systemRole === 'tenant_admin' || t.systemRole === 'tenant_owner');
                if (admins.length > 0) {
                    stateModule.state.notifications = stateModule.state.notifications || [];
                    const notifId = 'notif-' + Math.random().toString(36).substr(2, 9);
                    stateModule.state.notifications.push({
                        id: notifId,
                        title: 'Pending Access Request',
                        message: `Access requested for: ${requestedFeatures || 'Unknown'} by ${stateModule.state.team.find(t => t.email === stateModule.state.currentUser)?.name || 'Unknown'}`,
                        type: 'warning',
                        isRead: false,
                        timestamp: Date.now(),
                        targetUsers: admins.map(a => a.id),
                        actionData: { type: 'access_request', ticketTitle: title }
                    });
                }
            }
            
            stateModule.notifyStateChange();
            
            document.getElementById(modalId)?.remove();
        });
    }
};

w.openTicketModal = (ticketId: string) => {
    import('./state').then(stateModule => {
        const ticket = stateModule.state.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        const modalId = 'ticket-detail-modal';
        if (document.getElementById(modalId)) document.getElementById(modalId)?.remove();
        
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center fade-in p-4 backdrop-blur-sm';
        
        const sanitize = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const historyHtml = ticket.events.map(e => `
            <div class="relative pl-6 pb-4 border-l border-text-main/20 last:border-transparent last:pb-0">
                <div class="absolute left-[-5px] top-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 outline outline-4 outline-background"></div>
                <div class="text-[10px] text-text-muted mb-0.5">${new Date(e.timestamp).toLocaleString()}</div>
                <div class="text-xs font-bold">${sanitize(e.actor)} <span class="font-normal opacity-70">performed</span> ${sanitize(e.action.replace('_', ' '))}</div>
                <div class="text-xs text-text-muted mt-1 italic">${sanitize(e.details || '')}</div>
            </div>
        `).join('');

        let priorityColor = 'text-text-muted';
        if (ticket.priority === 'high') priorityColor = 'text-rose-500 font-bold';
        if (ticket.priority === 'urgent') priorityColor = 'text-rose-600 font-black animate-pulse';

        overlay.innerHTML = `
            <div class="bg-background border border-text-main/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-5 border-b border-text-main/10 flex justify-between items-center bg-text-main/5">
                    <div>
                        <h3 class="font-bold font-outfit text-lg">${sanitize(ticket.title)}</h3>
                        <div class="flex items-center gap-3 text-xs text-text-muted mt-1">
                            <span class="font-mono text-[10px]">${sanitize(ticket.id)}</span>
                            <span class="px-1.5 py-0.5 bg-text-main/10 rounded uppercase font-bold text-[9px]">${sanitize(ticket.category || 'General')}</span>
                            <span class="${priorityColor} capitalize text-[10px]">${ticket.priority} priority</span>
                        </div>
                        ${ticket.department || ticket.issueType || ticket.affectedAsset ? `
                        <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-text-main/10">
                            ${ticket.department ? `<div class="bg-background border border-text-main/10 rounded px-2 py-1 text-[10px] text-text-muted"><strong class="text-text-main">Dept:</strong> ${sanitize(ticket.department)}</div>` : ''}
                            ${ticket.issueType ? `<div class="bg-background border border-text-main/10 rounded px-2 py-1 text-[10px] text-text-muted"><strong class="text-text-main">Type:</strong> ${sanitize(ticket.issueType)}</div>` : ''}
                            ${ticket.affectedAsset ? `<div class="bg-background border border-text-main/10 rounded px-2 py-1 text-[10px] text-text-muted"><strong class="text-text-main">Asset:</strong> ${sanitize(ticket.affectedAsset)}</div>` : ''}
                        </div>
                        ${ticket.attachments ? `
                        <div class="mt-3 pt-3 border-t border-text-main/10">
                            <strong class="text-[10px] uppercase text-text-muted">Attachments</strong>
                            <div class="text-xs mt-1 text-purple-400 break-words">${sanitize(ticket.attachments)}</div>
                        </div>
                        ` : ''}
                        ` : ''}
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" class="text-text-muted hover:text-text-main cursor-pointer p-1 rounded hover:bg-text-main/10 transition-colors self-start">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div class="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
                    <div>
                        <h4 class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">Description</h4>
                        <div class="bg-text-main/5 p-4 rounded-xl text-sm whitespace-pre-wrap">${sanitize(ticket.description)}</div>
                    </div>
                    
                    <div>
                        <h4 class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4">Audit Timeline</h4>
                        <div class="ml-2">
                            ${historyHtml || '<div class="text-xs text-text-muted italic">No timeline events recorded.</div>'}
                        </div>
                    </div>
                </div>
                
                ${ticket.issueType === 'Access Request' && ticket.status !== 'resolved' && (stateModule.state.team.find(t => t.email === stateModule.state.currentUser)?.systemRole === 'tenant_admin' || stateModule.state.team.find(t => t.email === stateModule.state.currentUser)?.systemRole === 'tenant_owner') ? `
                <div class="p-4 border-t border-text-main/10 bg-text-main/5 flex justify-end gap-3">
                    <button onclick="window.approveAccessRequest('${ticket.id}'); document.getElementById('${modalId}').remove();" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-md">
                        Approve Access Request
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        document.body.appendChild(overlay);
    });
};

w.approveAccessRequest = (ticketId: string) => {
    import('./state').then(stateModule => {
        const ticket = stateModule.state.tickets.find(t => t.id === ticketId);
        if (ticket) {
            // Dismiss associated notification if any
            stateModule.state.notifications = stateModule.state.notifications.filter(n => n.actionData?.ticketTitle !== ticket.title);
            
            // Mark ticket as resolved
            stateModule.updateTicketStatus(ticketId, 'resolved');
            stateModule.addTicketEvent(ticketId, 'access_approved', 'Access request was approved by admin');
            
            // Notify user
            stateModule.state.notifications.push({
                id: 'notif-' + Math.random().toString(36).substr(2, 9),
                title: 'Access Granted',
                message: `Your access request for "${ticket.requestedFeatures}" has been approved.`,
                type: 'success',
                isRead: false,
                timestamp: Date.now(),
                targetUsers: [ticket.clientId]
            });
            
            stateModule.notifyStateChange();
        }
    });
};

w.updateUserSupportRole = (userId: string, newRole: string) => {
    import('./state').then(stateModule => {
        const user = stateModule.state.team.find(t => t.id === userId);
        if (user) {
            user.systemRole = newRole as any;
            if (newRole === 'support_admin') user.role = 'Support Admin';
            else if (newRole === 'support_manager') user.role = 'Support Manager';
            else if (newRole === 'support_l2') user.role = 'L2 Specialist';
            else if (newRole === 'support_l1') user.role = 'L1 Agent';
            else user.role = 'User';
            
            stateModule.notifyStateChange();
        }
    });
};

w.openSupportManagementModal = () => {
    import('./state').then(stateModule => {
        const modalId = 'support-mgmt-modal';
        if (document.getElementById(modalId)) return;
        
        const overlay = document.createElement('div');
        overlay.id = modalId;
        overlay.className = 'fixed inset-0 bg-black/60 z-[100] flex items-center justify-center fade-in p-4 backdrop-blur-sm';
        
        const sanitize = (str: string) => str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        const teamHtml = stateModule.state.team.map(member => {
            const isSupport = member.systemRole?.startsWith('support_');
            return `
                <div class="flex items-center justify-between p-3 border-b border-text-main/10 last:border-0 hover:bg-text-main/5 transition-colors">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style="background-color: ${member.avatarColor}">${member.name.charAt(0)}</div>
                        <div>
                            <div class="font-bold text-sm">${sanitize(member.name)}</div>
                            <div class="text-[10px] text-text-muted">${sanitize(member.email)}</div>
                        </div>
                    </div>
                    <select onchange="window.updateUserSupportRole('${member.id}', this.value)" class="bg-background border border-text-main/20 rounded px-2 py-1 text-xs cursor-pointer outline-none">
                        <option value="user" ${!isSupport ? 'selected' : ''}>Standard User</option>
                        <option value="support_l1" ${member.systemRole === 'support_l1' ? 'selected' : ''}>L1 Agent</option>
                        <option value="support_l2" ${member.systemRole === 'support_l2' ? 'selected' : ''}>L2 Specialist</option>
                        <option value="support_manager" ${member.systemRole === 'support_manager' ? 'selected' : ''}>Support Manager</option>
                        <option value="support_admin" ${member.systemRole === 'support_admin' ? 'selected' : ''}>Support Admin</option>
                    </select>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="bg-background border border-text-main/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-5 border-b border-text-main/10 flex justify-between items-center bg-text-main/5">
                    <div>
                        <h3 class="font-bold font-outfit text-lg">Support Team Management</h3>
                        <p class="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-1">Assign hierarchies & roles</p>
                    </div>
                    <button onclick="document.getElementById('${modalId}').remove()" class="text-text-muted hover:text-text-main cursor-pointer p-1 rounded hover:bg-text-main/10 transition-colors self-start">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                
                <div class="p-5 overflow-y-auto flex-1">
                    <div class="border border-text-main/10 rounded-xl overflow-hidden">
                        ${teamHtml}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    });
};

(window as any).switchHubTab = (hubId: string, tabKey: string) => {
    // Update tab indicators
    const tabs = document.querySelectorAll(`#${hubId}-tabs .hub-tab-btn`);
    tabs.forEach(tab => {
        const isSelected = tab.getAttribute('data-tab') === tabKey;
        if (isSelected) {
            tab.classList.add('text-[var(--color-text-main)]');
            tab.classList.remove('text-[var(--color-text-muted)]');
        } else {
            tab.classList.remove('text-[var(--color-text-main)]');
            tab.classList.add('text-[var(--color-text-muted)]');
        }
        
        const indicator = tab.querySelector('.hub-tab-indicator');
        if (indicator) {
            if (isSelected) {
                indicator.classList.remove('opacity-0');
                indicator.classList.add('opacity-100');
            } else {
                indicator.classList.remove('opacity-100');
                indicator.classList.add('opacity-0');
            }
        }
    });

    // Update content visibility
    const contents = document.querySelectorAll(`#${hubId}-content .hub-tab-content`);
    contents.forEach(content => {
        const isSelected = content.getAttribute('data-tab') === tabKey;
        if (isSelected) {
            content.classList.remove('opacity-0', 'pointer-events-none', 'z-0', 'hidden');
            content.classList.add('opacity-100', 'pointer-events-auto', 'z-10', 'relative');
        } else {
            content.classList.remove('opacity-100', 'pointer-events-auto', 'z-10', 'relative');
            content.classList.add('opacity-0', 'pointer-events-none', 'z-0', 'hidden');
        }
    });
};

// Startup Hooks
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
}
