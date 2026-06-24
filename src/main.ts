import { authClient } from "./auth-client";
import {
    state,
    registerStateListener,
    loadState,
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
    resetAppState
} from "./state";
import { renderLayoutHTML, renderSidebarProjectsList } from "./views/layout";
import { views } from "./router";
import type { KanbanTask, ResearchDoc, MediaAsset, Draft } from "./types";

// Update sidebar project listing
function updateSidebarUI() {
    const listContainer = document.getElementById('sidebar-projects-list');
    if (listContainer) {
        listContainer.innerHTML = renderSidebarProjectsList();
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
    state.activeViewKey = viewKey;
    if (pid) state.currentProject = pid;
    
    const pageTitle = document.getElementById('page-title');
    const appContent = document.getElementById('app-content');
    
    // Update active navigation state styling
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('bg-[rgba(99,102,241,0.1)]', 'border-[rgba(99,102,241,0.2)]', 'text-primary');
        btn.classList.add('text-text-muted');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[data-view="${viewKey}"]${pid ? `[data-pid="${pid}"]` : ''}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-text-muted');
        activeBtn.classList.add('bg-[rgba(99,102,241,0.1)]', 'border-[rgba(99,102,241,0.2)]', 'text-primary');
    }

    let viewHTML = '';
    let viewTitle = '';

    // Dynamically retrieve the view template and info from the registry
    const view = views.find(v => v.key === viewKey);
    if (view) {
        viewTitle = view.title;
        viewHTML = view.render(pid);
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

w.createProjectPrompt = () => {
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

w.deleteProject = (pid: string) => {
    if (confirm("Are you sure you want to delete this project and all its associated tasks and ideas?")) {
        deleteProject(pid);
        renderView('projects');
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
    
    if (!titleEl || !titleEl.value.trim()) {
        alert("Task Title is required!");
        return;
    }
    addTask(pid, titleEl.value, tagEl ? tagEl.value : '');
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

w.changeDraftFormat = (id: string, format: string) => {
    const draft = state.drafts.find(d => d.id === id);
    if (draft) {
        draft.format = format as Draft['format'];
        saveState();
        renderView('drafts', state.currentProject || undefined);
    }
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

w.resetAppState = () => {
    if (confirm("This will clear all custom campaigns, tasks, and notes, restoring setup defaults. Continue?")) {
        resetAppState();
    }
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
    const appContainer = document.getElementById('app');
    if (appContainer) {
        appContainer.innerHTML = renderLayoutHTML();
    }
    updateSidebarUI();
    renderView(state.activeViewKey, state.currentProject || undefined);
}

// Register state-change listener to redraw active UI components
registerStateListener(() => {
    updateSidebarUI();
    renderView(state.activeViewKey, state.currentProject || undefined);
});

// Initialization
async function init() {
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
    });
}

// Startup Hooks
document.addEventListener('DOMContentLoaded', init);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    init();
}
