import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { views, sidebarGroups } from "../router";

export function renderProjectDropdownOptions(): string {
    let options = state.projects.map(p => {
        const isCurrent = state.currentProject === p.id;
        const currentClass = isCurrent ? "text-primary font-semibold bg-[rgba(99,102,241,0.05)]" : "text-text-muted hover:text-white";
        return `
        <button onclick="window.selectProject('${p.id}')" class="w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between group/dropdown-item ${currentClass}">
            <span class="truncate">📁 ${sanitizeHTML(p.name)}</span>
            <span class="opacity-0 group-hover/dropdown-item:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity pl-2" onclick="event.stopPropagation(); window.deleteProject('${p.id}')">✕</span>
        </button>
        `;
    }).join('');
    
    if (state.projects.length === 0) {
        options = `<div class="px-4 py-2.5 text-xs text-text-muted italic">No active projects</div>`;
    }
    return options;
}

export function renderSidebarNavigation(): string {
    return sidebarGroups.map(group => {
        let groupContent = "";
        
        if (group.key === 'workflow') {
            const workflowTools = views.filter(v => v.group === 'workflow' && v.icon);
            groupContent = workflowTools.map(item => {
                const isProjectScoped = item.scope === 'project';
                const pidAttr = isProjectScoped && state.currentProject ? `data-pid="${state.currentProject}"` : '';
                return `
                <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white flex items-center gap-2.5" 
                        data-view="${item.key}" ${pidAttr}>
                    <span>${item.icon}</span> ${item.title}
                </button>
                `;
            }).join('');
        } else {
            const groupTools = views.filter(v => v.group === group.key && v.icon && v.scope !== 'project');
            groupContent = groupTools.map(item => `
                <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white flex items-center gap-2.5" data-view="${item.key}">
                    <span>${item.icon}</span> ${item.title}
                </button>
            `).join('');
        }

        const openAttr = group.open ? 'open' : '';
        
        return `
        <details class="group ${group.key === 'workflow' ? '' : 'mt-4'}" ${openAttr}>
            <summary class="flex justify-between items-center text-xs uppercase tracking-wide text-text-muted font-semibold cursor-pointer select-none py-2 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                ${group.label}
                <span class="transition-transform group-open:-rotate-180 text-sm">▾</span>
            </summary>
            <div class="flex flex-col gap-1 mt-1 animate-[fadeIn_0.3s_ease-out]">
                ${groupContent}
            </div>
        </details>
        `;
    }).join('');
}

export function renderLayoutHTML(): string {
    const displayName = state.currentUser ? state.currentUser.split('@')[0] || 'Admin' : 'Admin';
    const currentProject = state.projects.find(p => p.id === state.currentProject);
    const activeProjectName = currentProject ? sanitizeHTML(currentProject.name) : "Select Campaign...";
    
    return `
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter">
    <!-- Sidebar -->
    <aside class="w-64 bg-glass-bg border-r border-glass-border flex flex-col p-6 backdrop-blur-md">
        <!-- HARDCODED: Branding Header Title on Top -->
        <div class="flex items-center gap-4 mb-8 cursor-pointer" onclick="window.navigateTo('workspaces')">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_var(--color-primary-glow)]">M</div>
            <h2 class="text-xl font-semibold font-outfit">Meidallm</h2>
        </div>

        <!-- Project Selector Dropdown -->
        <div class="relative mb-6">
            <label class="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">Active Workspace</label>
            <button id="project-selector-btn" onclick="window.toggleProjectDropdown(event)" class="w-full bg-[rgba(255,255,255,0.03)] border border-glass-border hover:bg-panel-hover rounded-xl px-4 py-3 text-left text-sm font-medium text-white flex justify-between items-center transition-all cursor-pointer">
                <span id="active-project-name-display" class="truncate">📁 ${activeProjectName}</span>
                <span class="text-xs text-text-muted transition-transform" id="project-selector-arrow">▾</span>
            </button>
            <div id="project-selector-dropdown" class="hidden absolute top-[calc(100%+6px)] left-0 w-full bg-[rgba(20,24,37,0.95)] border border-glass-border rounded-xl shadow-2xl py-2 z-50 flex flex-col backdrop-blur-xl animate-[fadeIn_0.15s_ease-out]">
                <div id="project-dropdown-list" class="flex flex-col max-h-48 overflow-y-auto">
                    ${renderProjectDropdownOptions()}
                </div>
                <div class="border-t border-glass-border my-1.5"></div>
                <button onclick="window.createProjectPrompt(); window.closeProjectDropdown();" class="w-full text-left px-4 py-2 text-xs text-primary hover:bg-panel-hover hover:text-white transition-colors flex items-center gap-2 font-medium">
                    <span>+</span> New Project
                </button>
            </div>
        </div>

        <!-- DYNAMIC: Navigation categories and buttons loaded from config -->
        <nav class="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
            ${renderSidebarNavigation()}
        </nav>

        <!-- HARDCODED: Account Management & Sign Out Footer at Bottom -->
        <div class="flex flex-col gap-3 pt-6 border-t border-glass-border">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-panel-hover rounded-full flex items-center justify-center font-semibold text-white">
                    ${displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <div id="user-display-name" class="font-semibold text-sm">${sanitizeHTML(displayName)}</div>
                    <div class="text-xs text-text-muted">Pro Plan</div>
                </div>
            </div>

            <!-- Theme Switcher -->
            <div class="flex items-center justify-between bg-panel-hover/50 p-1.5 rounded-lg border border-glass-border text-[10px] my-1">
                <span class="text-text-muted pl-1.5 font-medium uppercase tracking-wider">Theme</span>
                <div class="flex gap-1">
                    <button onclick="window.setTheme('day')" class="theme-btn px-2 py-0.5 rounded transition-colors font-semibold ${state.theme === 'day' ? 'text-white bg-primary' : 'text-text-muted hover:text-white'}" id="theme-btn-day">Day</button>
                    <button onclick="window.setTheme('night')" class="theme-btn px-2 py-0.5 rounded transition-colors font-semibold ${state.theme === 'night' ? 'text-white bg-primary' : 'text-text-muted hover:text-white'}" id="theme-btn-night">Night</button>
                    <button onclick="window.setTheme('auto')" class="theme-btn px-2 py-0.5 rounded transition-colors font-semibold ${state.theme === 'auto' ? 'text-white bg-primary' : 'text-text-muted hover:text-white'}" id="theme-btn-auto">Auto</button>
                </div>
            </div>

            <button onclick="window.signOut()" class="w-full py-2 border border-glass-border hover:bg-rose-950/20 hover:text-rose-400 text-xs rounded-xl transition-colors font-medium cursor-pointer">
                Sign Out
            </button>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-grow flex flex-col p-8 overflow-y-auto">
        <header class="flex justify-between items-center pb-6 border-b border-glass-border mb-8">
            <h1 id="page-title" class="text-3xl font-semibold font-outfit">Overview</h1>
            <div class="flex gap-3">
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all" onclick="alert('Search capabilities loaded')">🔍</button>
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all" onclick="alert('No new notifications')">🔔</button>
            </div>
        </header>
        <div id="app-content" class="flex-grow flex flex-col"></div>
    </main>
</div>
`;
}
