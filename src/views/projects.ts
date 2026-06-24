import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";

export function renderProjectsView(): string {
    let list = [...state.projects];
    
    // 1. Search Query Filter
    const query = (state.workspacesSearchQuery || '').toLowerCase().trim();
    if (query) {
        list = list.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    
    // 2. Sort Logic
    const sortBy = state.workspacesSortBy || 'last-active';
    if (sortBy === 'last-active') {
        list.sort((a, b) => b.lastActive - a.lastActive);
    } else if (sortBy === 'name-asc') {
        list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
        list.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'tasks-count') {
        list.sort((a, b) => {
            const countA = state.kanbanState.filter(k => k.projectId === a.id).length;
            const countB = state.kanbanState.filter(k => k.projectId === b.id).length;
            return countB - countA;
        });
    }

    const isGrid = state.workspacesViewMode === 'grid';
    const activeLayoutClass = isGrid 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
        : "flex flex-col gap-4";

    const workspacesHTML = list.map(p => {
        const projectTasks = state.kanbanState.filter(k => k.projectId === p.id);
        const lastActiveLabel = formatTime(p.lastActive);

        if (isGrid) {
            return `
            <div class="bg-glass-bg border border-glass-border hover:border-primary p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group" onclick="window.navigateTo('project-workspace', '${p.id}')">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">📂</span>
                        <div class="flex gap-2">
                            <span class="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</span>
                            <button onclick="event.stopPropagation(); window.deleteProject('${p.id}')" class="opacity-0 group-hover:opacity-100 text-xs text-text-muted hover:text-rose-500 transition-opacity pl-2 cursor-pointer">✕</button>
                        </div>
                    </div>
                    <h3 class="text-lg font-semibold text-white mb-2 font-outfit group-hover:text-primary transition-colors">${sanitizeHTML(p.name)}</h3>
                    <p class="text-text-muted text-xs mb-6 line-clamp-2">${sanitizeHTML(p.description)}</p>
                </div>
                <div class="text-[10px] text-text-muted border-t border-glass-border/50 pt-4 flex justify-between">
                    <span>Tasks: <strong class="text-white">${projectTasks.length}</strong></span>
                    <span>Last active ${lastActiveLabel}</span>
                </div>
            </div>
            `;
        } else {
            // Row List view row
            return `
            <div class="bg-glass-bg border border-glass-border hover:border-primary px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-between group" onclick="window.navigateTo('project-workspace', '${p.id}')">
                <div class="flex items-center gap-4 truncate">
                    <span class="text-2xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.2)]">📂</span>
                    <div class="truncate">
                        <h3 class="font-semibold text-white font-outfit truncate group-hover:text-primary transition-colors text-sm">${sanitizeHTML(p.name)}</h3>
                        <p class="text-text-muted text-[11px] truncate max-w-md">${sanitizeHTML(p.description)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-6 text-[11px] text-text-muted whitespace-nowrap">
                    <span>Tasks: <strong class="text-white">${projectTasks.length}</strong></span>
                    <span>Last active: <strong class="text-white">${lastActiveLabel}</strong></span>
                    <button onclick="event.stopPropagation(); window.deleteProject('${p.id}')" class="opacity-0 group-hover:opacity-100 text-xs text-text-muted hover:text-rose-500 transition-opacity pl-2 cursor-pointer">✕</button>
                </div>
            </div>
            `;
        }
    }).join('');

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Control Header Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-panel-hover/30 border border-glass-border/30 p-4 rounded-2xl">
            <!-- Search Control -->
            <div class="relative w-full md:w-80">
                <input type="text" id="workspaces-search-input" value="${sanitizeHTML(state.workspacesSearchQuery)}" oninput="window.filterWorkspaces(this.value)" placeholder="Search folders & workspaces..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all">
                <span class="absolute right-3.5 top-3 text-text-muted text-xs">🔍</span>
            </div>

            <!-- Sorting & Layout Controls -->
            <div class="flex items-center gap-3 justify-end">
                <div>
                    <select id="workspaces-sort-select" onchange="window.sortWorkspaces(this.value)" class="bg-panel-hover border border-glass-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer">
                        <option value="last-active" ${sortBy === 'last-active' ? 'selected' : ''}>Sort: Last Active</option>
                        <option value="name-asc" ${sortBy === 'name-asc' ? 'selected' : ''}>Sort: Name A-Z</option>
                        <option value="name-desc" ${sortBy === 'name-desc' ? 'selected' : ''}>Sort: Name Z-A</option>
                        <option value="tasks-count" ${sortBy === 'tasks-count' ? 'selected' : ''}>Sort: Tasks Count</option>
                    </select>
                </div>

                <!-- Grid/List Toggles -->
                <div class="flex bg-panel-hover border border-glass-border rounded-xl p-1">
                    <button onclick="window.toggleWorkspacesViewMode('grid')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${isGrid ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}">
                        Grid
                    </button>
                    <button onclick="window.toggleWorkspacesViewMode('list')" class="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!isGrid ? 'bg-primary text-white' : 'text-text-muted hover:text-white'}">
                        List
                    </button>
                </div>

                <button onclick="window.createProjectPrompt()" class="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-medium text-xs rounded-xl shadow-[0_0_15px_var(--color-primary-glow)] hover:shadow-[0_0_25px_var(--color-primary-glow)] transition-all cursor-pointer whitespace-nowrap">
                    + New Folder
                </button>
            </div>
        </div>

        <!-- Render Target Grid/List -->
        <div id="workspaces-listing-container" class="${activeLayoutClass}">
            ${workspacesHTML}
            ${list.length === 0 ? `<div class="col-span-3 text-center text-text-muted py-16">No folders or workspaces found.</div>` : ''}
        </div>
    </div>
    `;
}
