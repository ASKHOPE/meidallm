import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

export function renderProjectsView(): string {
    let list = [...state.projects];
    const filter = state.workspacesFilter || 'active';

    const activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    const validProjectIds = activeTeam ? activeTeam.projectIds : [];

    // 0. Filter by active team assignment
    list = list.filter(p => validProjectIds.includes(p.id) || p.id === 'p-welcome');

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

        // Action controls based on filter (using clean vector icons)
        let actionHTML = "";
        if (filter === 'active') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.updateProjectPrompt('${p.id}')" class="text-text-muted hover:text-text-main cursor-pointer" title="Edit Name/Desc">
                    ${getIconSVG('edit', 'w-3.5 h-3.5')}
                </button>
                <button onclick="event.stopPropagation(); window.archiveProjectToggle('${p.id}', true)" class="text-text-muted hover:text-text-main cursor-pointer" title="Archive Folder">
                    ${getIconSVG('archive', 'w-3.5 h-3.5')}
                </button>
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" class="text-text-muted hover:text-red-500 cursor-pointer" title="Move to Bin">
                    ${getIconSVG('trash', 'w-3.5 h-3.5')}
                </button>
            </div>
            `;
        } else if (filter === 'archived') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.archiveProjectToggle('${p.id}', false)" class="text-text-muted hover:text-text-main cursor-pointer" title="Restore to Workspaces">
                    ${getIconSVG('external-link', 'w-3.5 h-3.5')}
                </button>
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" class="text-text-muted hover:text-red-500 cursor-pointer" title="Move to Bin">
                    ${getIconSVG('trash', 'w-3.5 h-3.5')}
                </button>
            </div>
            `;
        } else if (filter === 'bin') {
            actionHTML = `
            <div class="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', false)" class="text-text-muted hover:text-text-main cursor-pointer" title="Restore Folder">
                    ${getIconSVG('check', 'w-3.5 h-3.5')}
                </button>
                <button onclick="event.stopPropagation(); window.deleteProject('${p.id}')" class="text-text-muted hover:text-red-500 cursor-pointer font-bold" title="Delete Permanently">
                    ${getIconSVG('close', 'w-3.5 h-3.5')}
                </button>
            </div>
            `;
        }

        const starBtn = `
        <button onclick="event.stopPropagation(); window.toggleProjectStar('${p.id}')" class="hover:scale-110 transition-transform cursor-pointer" title="Star Folder">
            ${p.isStarred ? getIconSVG('star-filled', 'w-4 h-4') : getIconSVG('star', 'w-4 h-4 text-text-muted')}
        </button>
        `;

        if (isGrid) {
            return `
            <div class="bg-background border border-text-main/15 hover:border-text-main p-6 rounded-2xl transition-all cursor-pointer flex flex-col justify-between min-h-[180px] group" onclick="window.navigateTo('project-workspace', '${p.id}')">
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex items-center gap-2">
                            <span class="text-text-main">${getIconSVG('folder', 'w-7 h-7')}</span>
                            ${starBtn}
                        </div>
                        <div class="flex items-center gap-2">
                            ${actionHTML}
                        </div>
                    </div>
                    <h3 class="text-base font-bold text-text-main mb-2 font-outfit transition-colors">${sanitizeHTML(p.name)}</h3>
                    <p class="text-text-muted text-xs mb-6 line-clamp-2">${sanitizeHTML(p.description)}</p>
                </div>
                <div class="text-[10px] text-text-muted border-t border-text-main/10 pt-4 flex justify-between">
                    <span>Tasks: <strong class="text-text-main">${projectTasks.length}</strong></span>
                    <span>Last active ${lastActiveLabel}</span>
                </div>
            </div>
            `;
        } else {
            // Row List view row
            return `
            <div class="bg-background border border-text-main/15 hover:border-text-main px-6 py-4 rounded-xl transition-all cursor-pointer flex items-center justify-between group" onclick="window.navigateTo('project-workspace', '${p.id}')">
                <div class="flex items-center gap-4 truncate">
                    <span class="text-text-main">${getIconSVG('folder', 'w-5 h-5')}</span>
                    ${starBtn}
                    <div class="truncate">
                        <h3 class="font-bold text-text-main font-outfit truncate transition-colors text-sm">${sanitizeHTML(p.name)}</h3>
                        <p class="text-text-muted text-[11px] truncate max-w-md">${sanitizeHTML(p.description)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-6 text-[11px] text-text-muted whitespace-nowrap">
                    <span>Tasks: <strong class="text-text-main">${projectTasks.length}</strong></span>
                    <span>Last active: <strong class="text-text-main">${lastActiveLabel}</strong></span>
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
            <div class="flex gap-6 border-b border-text-main/10 w-full pb-2">
                <button onclick="window.setWorkspacesFilter('active')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'active' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Active Workspaces</button>
                <button onclick="window.setWorkspacesFilter('archived')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'archived' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Archived</button>
                <button onclick="window.setWorkspacesFilter('bin')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'bin' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Bin / Trash</button>
            </div>
        </div>

        <!-- Control Header Bar -->
        <div class="flex items-center justify-between gap-4 bg-background border border-text-main/15 p-4 rounded-2xl flex-wrap md:flex-nowrap">
            <!-- Search Control -->
            <div class="relative flex-grow max-w-md">
                <input type="text" id="workspaces-search-input" value="${sanitizeHTML(state.workspacesSearchQuery)}" oninput="window.filterWorkspaces(this.value)" placeholder="Search folders & workspaces..." class="w-full bg-background border border-text-main/15 rounded-lg pl-4 pr-10 py-2.5 text-xs text-text-main focus:outline-none focus:border-text-main transition-all">
                <span class="absolute right-3.5 top-3 text-text-muted text-xs">${getIconSVG('search', 'w-4 h-4')}</span>
            </div>

            <!-- Toolbar Controls -->
            <div class="flex items-center gap-3 shrink-0">
                <!-- Sorting select -->
                <select onchange="window.sortWorkspaces(this.value)" class="bg-background border border-text-main/15 text-xs text-text-main px-3 py-2.5 rounded-lg focus:outline-none focus:border-text-main cursor-pointer">
                    <option value="last-active" ${state.workspacesSortBy === 'last-active' ? 'selected' : ''}>Sort by: Last Active</option>
                    <option value="name-asc" ${state.workspacesSortBy === 'name-asc' ? 'selected' : ''}>Sort by: Name (A-Z)</option>
                    <option value="name-desc" ${state.workspacesSortBy === 'name-desc' ? 'selected' : ''}>Sort by: Name (Z-A)</option>
                    <option value="tasks-count" ${state.workspacesSortBy === 'tasks-count' ? 'selected' : ''}>Sort by: Tasks Count</option>
                </select>

                <!-- Grid/List switches -->
                <div class="flex bg-text-main/5 p-1 rounded-lg border border-text-main/10">
                    <button onclick="window.toggleWorkspacesViewMode('grid')" class="p-1.5 rounded transition-all cursor-pointer ${isGrid ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" title="Grid View">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                    </button>
                    <button onclick="window.toggleWorkspacesViewMode('list')" class="p-1.5 rounded transition-all cursor-pointer ${!isGrid ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" title="List View">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                    </button>
                </div>

                <!-- Create workspace button -->
                <button onclick="window.createProjectPrompt()" class="bg-text-main text-background hover:bg-text-main/90 font-bold px-4 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm">
                    ${getIconSVG('plus', 'w-3.5 h-3.5')} New Workspace
                </button>
            </div>
        </div>

        <!-- Workspaces Cards Container -->
        <div class="${activeLayoutClass}">
            ${workspacesHTML}
        </div>

        ${list.length === 0 ? (() => {
            let title = "No campaigns found";
            let desc = "There are no workspaces matching the active search or state parameters.";
            let icon = getIconSVG('info', 'w-8 h-8 text-text-muted');

            if (filter === 'active') {
                title = "Welcome to Meidallm";
                desc = "No active workspaces found. Click '+ New Workspace' above to initialize your first folder.";
                icon = getIconSVG('folder', 'w-8 h-8 text-text-muted');
            } else if (filter === 'archived') {
                title = "Archive is Empty";
                desc = "Move completed workspaces to the archive to keep your active workspace panel clean.";
                icon = getIconSVG('archive', 'w-8 h-8 text-text-muted');
            } else if (filter === 'bin') {
                title = "Trash Bin is Empty";
                desc = "Deleted workspaces will rest in this trash bin before permanent removal.";
                icon = getIconSVG('trash', 'w-8 h-8 text-text-muted');
            }

            return `
            <div class="border border-dashed border-text-main/15 text-center text-text-muted py-24 rounded-2xl flex flex-col items-center justify-center gap-2">
                <span class="text-3xl">${icon}</span>
                <h4 class="font-bold text-text-main mt-2">${title}</h4>
                <p class="text-xs max-w-xs leading-relaxed">${desc}</p>
            </div>
            `;
        })() : ''}
    </div>
    `;
}
