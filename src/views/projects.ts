import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";

export function renderProjectsView(): string {
    let list = [...state.projects];
    const filter = state.workspacesFilter || 'active';

    // 1. Filter by status: active, archived, bin (soft-deleted)
    if (filter === 'active') {
        list = list.filter(p => !p.isBinned && !p.isArchived);
    } else if (filter === 'archived') {
        list = list.filter(p => p.isArchived && !p.isBinned);
    } else if (filter === 'bin') {
        list = list.filter(p => p.isBinned);
    }

    // 2. Search Query Filter
    const query = (state.workspacesSearchQuery || '').toLowerCase().trim();
    if (query) {
        list = list.filter(p => p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query));
    }
    
    // 3. Sort Logic
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

        // Action controls based on filter
        let actionHTML = "";
        if (filter === 'active') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.updateProjectPrompt('${p.id}')" class="text-xs text-text-muted hover:text-white cursor-pointer" title="Edit Name/Desc">✏️</button>
                <button onclick="event.stopPropagation(); window.archiveProjectToggle('${p.id}', true)" class="text-xs text-text-muted hover:text-amber-400 cursor-pointer" title="Archive Folder">📦</button>
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" class="text-xs text-text-muted hover:text-rose-500 cursor-pointer" title="Move to Bin">🗑️</button>
            </div>
            `;
        } else if (filter === 'archived') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.archiveProjectToggle('${p.id}', false)" class="text-xs text-text-muted hover:text-emerald-400 cursor-pointer" title="Restore to Workspaces">📂</button>
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" class="text-xs text-text-muted hover:text-rose-500 cursor-pointer" title="Move to Bin">🗑️</button>
            </div>
            `;
        } else if (filter === 'bin') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', false)" class="text-xs text-text-muted hover:text-emerald-400 cursor-pointer" title="Restore Folder">🔄</button>
                <button onclick="event.stopPropagation(); window.deleteProject('${p.id}')" class="text-xs text-text-muted hover:text-rose-500 cursor-pointer font-bold" title="Delete Permanently">✕</button>
            </div>
            `;
        }

        if (isGrid) {
            return `
            <div class="bg-glass-bg border border-glass-border hover:border-primary p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between min-h-[180px] group" onclick="window.navigateTo('project-workspace', '${p.id}')">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <span class="text-3xl filter drop-shadow-[0_0_8px_rgba(99,102,241,0.3)]">📂</span>
                        <div class="flex items-center gap-2">
                            ${actionHTML}
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
                    <div class="flex items-center">
                        ${actionHTML}
                    </div>
                </div>
            </div>
            `;
        }
    }).join('');

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Tabs Header Row -->
        <div class="flex justify-between items-center mb-1">
            <div class="flex gap-6 border-b border-glass-border/30 w-full pb-2">
                <button onclick="window.setWorkspacesFilter('active')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'active' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Active Workspaces</button>
                <button onclick="window.setWorkspacesFilter('archived')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'archived' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Archived</button>
                <button onclick="window.setWorkspacesFilter('bin')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'bin' ? 'text-primary border-b-2 border-primary font-bold' : 'text-text-muted hover:text-white'}">Bin / Trash</button>
            </div>
        </div>

        <!-- Control Header Bar -->
        <div class="flex items-center justify-between gap-4 bg-panel-hover/30 border border-glass-border/30 p-4 rounded-2xl flex-wrap md:flex-nowrap">
            <!-- Search Control -->
            <div class="relative flex-grow max-w-md">
                <input type="text" id="workspaces-search-input" value="${sanitizeHTML(state.workspacesSearchQuery)}" oninput="window.filterWorkspaces(this.value)" placeholder="Search folders & workspaces..." class="w-full bg-panel-hover border border-glass-border rounded-xl pl-4 pr-10 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all">
                <span class="absolute right-3.5 top-3 text-text-muted text-xs">🔍</span>
            </div>

            <!-- Sorting & Layout Controls -->
            <div class="flex items-center gap-3 shrink-0">
                <select id="workspaces-sort-select" onchange="window.sortWorkspaces(this.value)" class="bg-panel-hover border border-glass-border rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer">
                    <option value="last-active" ${sortBy === 'last-active' ? 'selected' : ''}>Sort: Last Active</option>
                    <option value="name-asc" ${sortBy === 'name-asc' ? 'selected' : ''}>Sort: Name A-Z</option>
                    <option value="name-desc" ${sortBy === 'name-desc' ? 'selected' : ''}>Sort: Name Z-A</option>
                    <option value="tasks-count" ${sortBy === 'tasks-count' ? 'selected' : ''}>Sort: Tasks Count</option>
                </select>

                <!-- Grid/List Toggles -->
                <div class="flex bg-panel-hover border border-glass-border rounded-xl p-1 shrink-0">
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
            ${list.length === 0 ? `<div class="col-span-3 text-center text-text-muted py-16">No folders or workspaces found in this filter.</div>` : ''}
        </div>
    </div>
    `;
}
