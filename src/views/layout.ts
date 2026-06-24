import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { views, sidebarGroups } from "../router";

export function renderSidebarProjectsList(): string {
    // Filter project-scoped tools dynamically from router
    const projectTools = views.filter(v => v.scope === 'project' && v.icon);

    return state.projects.map(p => {
        const isCurrent = state.currentProject === p.id;
        const activeClass = isCurrent ? "text-primary bg-[rgba(99,102,241,0.05)] font-semibold" : "text-text-muted";
        
        let subMenu = "";
        if (isCurrent) {
            const toolButtons = projectTools.map(tool => `
                <button class="nav-btn w-full text-left px-3 py-1.5 rounded-lg text-xs text-text-muted hover:bg-panel-hover hover:text-white flex items-center gap-1.5" data-view="${tool.key}" data-pid="${p.id}">
                    <span>${tool.icon}</span> ${tool.title}
                </button>
            `).join('');

            subMenu = `
            <div class="flex flex-col gap-1 pl-4 pr-1 py-1 border-l border-glass-border/20 ml-6 mb-2 animate-[fadeIn_0.2s_ease-out]">
                ${toolButtons}
            </div>
            `;
        }
        
        return `
        <div class="flex flex-col w-full">
            <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium hover:bg-panel-hover hover:text-white flex items-center justify-between group/btn truncate ${activeClass}" 
                    data-view="project-workspace" data-pid="${p.id}">
                <span class="truncate">📁 ${sanitizeHTML(p.name)}</span>
                <span class="opacity-0 group-hover/btn:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity pl-2" onclick="event.stopPropagation(); window.deleteProject('${p.id}')">✕</span>
            </button>
            ${subMenu}
        </div>
        `;
    }).join('');
}

export function renderSidebarNavigation(): string {
    return sidebarGroups.map(group => {
        let groupContent = "";
        
        if (group.key === 'campaigns') {
            // Render campaigns list and submenus dynamically
            groupContent = `
            <div id="sidebar-projects-list" class="flex flex-col gap-1 mt-1">
                ${renderSidebarProjectsList()}
            </div>
            `;
        } else {
            // Render other scoped views in this category dynamically
            const groupTools = views.filter(v => v.group === group.key && v.icon && v.scope !== 'project');
            groupContent = groupTools.map(item => `
                <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white flex items-center gap-1.5" data-view="${item.key}">
                    <span>${item.icon}</span> ${item.title}
                </button>
            `).join('');
        }

        const openAttr = group.open ? 'open' : '';
        
        return `
        <details class="group ${group.key === 'campaigns' ? '' : 'mt-4'}" ${openAttr}>
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
    
    return `
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter">
    <!-- Sidebar -->
    <aside class="w-64 bg-glass-bg border-r border-glass-border flex flex-col p-6 backdrop-blur-md">
        <!-- HARDCODED: Branding Header Title on Top -->
        <div class="flex items-center gap-4 mb-12 cursor-pointer" onclick="window.navigateTo('projects')">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_var(--color-primary-glow)]">M</div>
            <h2 class="text-xl font-semibold font-outfit">Meidallm</h2>
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
            <button onclick="window.signOut()" class="w-full mt-2 py-2 border border-glass-border hover:bg-rose-950/20 hover:text-rose-400 text-xs rounded-xl transition-colors font-medium cursor-pointer">
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
