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
    resetAppState
} from "./state";
import { renderLayoutHTML, renderSidebarProjectsList } from "./views/layout";
import { renderProjectsView } from "./views/projects";
import { renderWorkspaceView } from "./views/workspace";
import { renderKanbanView } from "./views/kanban";
import { renderIdeasView } from "./views/ideas";
import { renderSettingsView } from "./views/settings";
import type { KanbanTask } from "./types";

// Update sidebar project listing
function updateSidebarUI() {
    const listContainer = document.getElementById('sidebar-projects-list');
    if (listContainer) {
        listContainer.innerHTML = renderSidebarProjectsList();
    }
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

    switch (viewKey) {
        case 'projects':
            viewTitle = 'All Projects';
            viewHTML = renderProjectsView();
            break;
        case 'project-workspace':
            viewTitle = 'Project Workspace';
            viewHTML = renderWorkspaceView(pid || '');
            break;
        case 'kanban-board':
            viewTitle = 'Task Kanban Board';
            viewHTML = renderKanbanView(pid || '');
            break;
        case 'idea-canvas':
            viewTitle = 'Idea Canvas';
            viewHTML = renderIdeasView(pid || '');
            break;
        case 'settings':
            viewTitle = 'Settings';
            viewHTML = renderSettingsView();
            break;
        default:
            viewTitle = 'Module Offline';
            viewHTML = `<div class="fade-in text-text-muted">This module is under construction.</div>`;
    }

    if (pageTitle) pageTitle.innerText = viewTitle;
    if (appContent) appContent.innerHTML = viewHTML;
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
