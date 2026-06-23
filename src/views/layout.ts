import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderSidebarProjectsList(): string {
    return state.projects.map(p => `
        <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white flex items-center justify-between group/btn truncate" 
                data-view="project-workspace" data-pid="${p.id}">
            <span class="truncate">↳ ${sanitizeHTML(p.name)}</span>
            <span class="opacity-0 group-hover/btn:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity pl-2" onclick="event.stopPropagation(); window.deleteProject('${p.id}')">✕</span>
        </button>
    `).join('');
}

export function renderLayoutHTML(): string {
    const displayName = state.currentUser ? state.currentUser.split('@')[0] || 'Admin' : 'Admin';
    return `
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter">
    <!-- Sidebar -->
    <aside class="w-64 bg-glass-bg border-r border-glass-border flex flex-col p-6 backdrop-blur-md">
        <div class="flex items-center gap-4 mb-12 cursor-pointer" onclick="window.navigateTo('projects')">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center font-bold text-xl shadow-[0_0_20px_var(--color-primary-glow)]">M</div>
            <h2 class="text-xl font-semibold font-outfit">Meidallm</h2>
        </div>

        <nav class="flex flex-col gap-2 flex-grow">
            <!-- Projects Group -->
            <details class="group" open>
                <summary class="flex justify-between items-center text-xs uppercase tracking-wide text-text-muted font-semibold cursor-pointer select-none py-2 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                    Projects & Campaigns
                    <span class="transition-transform group-open:-rotate-180 text-sm">▾</span>
                </summary>
                <div id="sidebar-projects-list" class="flex flex-col gap-1 mt-1 animate-[fadeIn_0.3s_ease-out]">
                    ${renderSidebarProjectsList()}
                </div>
            </details>

            <details class="group mt-4" open>
                <summary class="flex justify-between items-center text-xs uppercase tracking-wide text-text-muted font-semibold cursor-pointer select-none py-2 hover:text-white transition-colors list-none [&::-webkit-details-marker]:hidden">
                    System
                    <span class="transition-transform group-open:-rotate-180 text-sm">▾</span>
                </summary>
                <div class="flex flex-col gap-1 mt-1 animate-[fadeIn_0.3s_ease-out]">
                    <button class="nav-btn w-full text-left px-4 py-3 rounded-xl transition-all font-medium text-text-muted hover:bg-panel-hover hover:text-white" data-view="settings">⚙️ Settings</button>
                </div>
            </details>
        </nav>

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
