import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { views, sidebarGroups } from "../router";

export function renderProjectDropdownOptions(): string {
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned);
    let options = activeProjects.map(p => {
        const isCurrent = state.currentProject === p.id;
        const currentClass = isCurrent ? "text-text-main font-semibold bg-panel-hover" : "text-text-muted hover:text-text-main";
        return `
        <button onclick="window.selectProject('${p.id}')" class="w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between group/dropdown-item ${currentClass}">
            <span class="truncate">📁 ${sanitizeHTML(p.name)}</span>
            <span class="opacity-0 group-hover/dropdown-item:opacity-100 text-xs text-rose-400 hover:text-rose-600 transition-opacity pl-2" onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" title="Move to Bin">🗑️</span>
        </button>
        `;
    }).join('');
    
    if (activeProjects.length === 0) {
        options = `<div class="px-4 py-2.5 text-xs text-text-muted italic">No active projects</div>`;
    }
    return options;
}
export function renderSidebarNavigation(): string {
    const viewIconColors: Record<string, { bg: string, text: string }> = {
        'workspaces': { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
        'idea-canvas': { bg: 'bg-yellow-500/10 dark:bg-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-400' },
        'kanban-board': { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
        'project-cycles': { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
        'database-hub': { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
        'research': { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400' },
        'media': { bg: 'bg-pink-500/10 dark:bg-pink-500/20', text: 'text-pink-600 dark:text-pink-400' },
        'drafts': { bg: 'bg-indigo-500/10 dark:bg-indigo-500/20', text: 'text-indigo-600 dark:text-indigo-400' },
        'publish': { bg: 'bg-orange-500/10 dark:bg-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
        'analytics': { bg: 'bg-teal-500/10 dark:bg-teal-500/20', text: 'text-teal-600 dark:text-teal-400' },
        'connections': { bg: 'bg-sky-500/10 dark:bg-sky-500/20', text: 'text-sky-600 dark:text-sky-400' },
        'crm': { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
        'team': { bg: 'bg-green-500/10 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
        'settings': { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400' }
    };

    return sidebarGroups.map(group => {
        let groupContent = "";
        
        if (group.key === 'workflow') {
            const workflowTools = views.filter(v => v.group === 'workflow' && v.icon);
            groupContent = workflowTools.map(item => {
                const isProjectScoped = item.scope === 'project';
                const pidAttr = isProjectScoped && state.currentProject ? `data-pid="${state.currentProject}"` : '';
                const colors = viewIconColors[item.key] || { bg: 'bg-zinc-500/10 dark:bg-zinc-500/20', text: 'text-zinc-600 dark:text-zinc-400' };
                return `
                <button class="nav-btn w-full text-left px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs text-text-muted hover:bg-panel-hover hover:text-text-main flex items-center gap-2 border border-transparent" 
                        data-view="${item.key}" ${pidAttr}>
                    <span class="w-6.5 h-6.5 rounded-md flex items-center justify-center ${colors.bg} ${colors.text} text-xs shrink-0">${item.icon}</span> 
                    <span class="truncate">${item.title}</span>
                </button>
                `;
            }).join('');
        } else {
            const groupTools = views.filter(v => v.group === group.key && v.icon && v.scope !== 'project');
            groupContent = groupTools.map(item => {
                const colors = viewIconColors[item.key] || { bg: 'bg-zinc-500/10 dark:bg-zinc-500/20', text: 'text-zinc-600 dark:text-zinc-400' };
                return `
                <button class="nav-btn w-full text-left px-2.5 py-1.5 rounded-lg transition-all font-medium text-xs text-text-muted hover:bg-panel-hover hover:text-text-main flex items-center gap-2 border border-transparent" data-view="${item.key}">
                    <span class="w-6.5 h-6.5 rounded-md flex items-center justify-center ${colors.bg} ${colors.text} text-xs shrink-0">${item.icon}</span> 
                    <span class="truncate">${item.title}</span>
                </button>
                `;
            }).join('');
        }

        const openAttr = group.open ? 'open' : '';
        
        return `
        <details class="group ${group.key === 'workflow' ? '' : 'mt-3'}" ${openAttr}>
            <summary class="flex justify-between items-center text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer select-none py-1.5 hover:text-text-main transition-colors list-none [&::-webkit-details-marker]:hidden">
                ${group.label}
                <span class="transition-transform group-open:-rotate-180 text-xs">▾</span>
            </summary>
            <div class="flex flex-col gap-0.5 mt-0.5 animate-[fadeIn_0.3s_ease-out]">
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
                    <div class="text-[10px] text-text-muted font-mono uppercase tracking-wider">Tenant: ${sanitizeHTML(state.activeOrgId || 'personal')}</div>
                </div>
            </div>

            <!-- Theme Switcher -->
            <div class="flex items-center justify-between bg-panel-hover/50 p-1.5 rounded-lg border border-glass-border text-[10px] my-1">
                <span class="text-text-muted pl-1.5 font-medium uppercase tracking-wider">Theme</span>
                <div class="flex gap-1">
                    <button onclick="window.setTheme('day')" class="theme-btn px-2 py-0.5 rounded transition-all font-semibold ${state.theme === 'day' ? 'bg-text-main text-bg-dark' : 'text-text-muted hover:text-text-main'}" id="theme-btn-day">Day</button>
                    <button onclick="window.setTheme('night')" class="theme-btn px-2 py-0.5 rounded transition-all font-semibold ${state.theme === 'night' ? 'bg-text-main text-bg-dark' : 'text-text-muted hover:text-text-main'}" id="theme-btn-night">Night</button>
                    <button onclick="window.setTheme('auto')" class="theme-btn px-2 py-0.5 rounded transition-all font-semibold ${state.theme === 'auto' ? 'bg-text-main text-bg-dark' : 'text-text-muted hover:text-text-main'}" id="theme-btn-auto">Auto</button>
                </div>
            </div>

            <button onclick="window.signOut()" class="w-full py-2 border border-glass-border hover:bg-rose-950/20 hover:text-rose-400 text-xs rounded-xl transition-colors font-medium cursor-pointer">
                Sign Out
            </button>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-grow flex flex-col p-8 overflow-y-auto mr-0 transition-all duration-300" id="main-content-wrapper">
        <header class="flex justify-between items-center pb-6 border-b border-glass-border mb-8">
            <h1 id="page-title" class="text-3xl font-semibold font-outfit">Overview</h1>
            <div class="flex gap-3">
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all cursor-pointer" onclick="window.toggleCommandMenu(true)" title="Command Menu (⌘K)">🔍</button>
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all cursor-pointer" onclick="window.toggleAiAssistant(true)" title="ClickUp Brain AI">🤖</button>
                <button class="w-11 h-11 bg-glass-bg border border-glass-border rounded-xl flex items-center justify-center hover:bg-panel-hover hover:-translate-y-0.5 transition-all cursor-pointer" onclick="alert('No new notifications')">🔔</button>
            </div>
        </header>
        <div id="app-content" class="flex-grow flex flex-col"></div>
    </main>
    
    <!-- Collapsible AI Assistant slide-out drawer -->
    <aside id="ai-assistant-drawer" class="w-80 bg-glass-bg border-l border-glass-border flex flex-col p-6 backdrop-blur-md transition-all duration-300 transform translate-x-full fixed right-0 top-0 bottom-0 z-40 shadow-2xl">
        <div class="flex justify-between items-center mb-6">
            <div class="flex items-center gap-2">
                <span class="text-lg">🤖</span>
                <h3 class="font-bold text-white font-outfit text-sm">ClickUp AI Brain</h3>
            </div>
            <button onclick="window.toggleAiAssistant(false)" class="text-text-muted hover:text-white transition-colors text-sm">✕</button>
        </div>
        
        <div id="ai-chat-thread" class="flex-grow overflow-y-auto flex flex-col gap-4 text-xs pr-1">
            <div class="bg-panel-hover/50 p-3 rounded-xl border border-glass-border/40 text-text-muted leading-relaxed">
                Hello! I am your AI assistant. I have full context of your database tables, tasks, cycles, and CRM. Try asking:
                <ul class="list-disc pl-4 mt-2 flex flex-col gap-1.5">
                    <li><button onclick="window.sendAiMessage('Show tasks at risk')" class="text-left text-white underline hover:text-zinc-200">Show tasks at risk</button></li>
                    <li><button onclick="window.sendAiMessage('Summarize current cycle progress')" class="text-left text-white underline hover:text-zinc-200">Summarize current cycle progress</button></li>
                    <li><button onclick="window.sendAiMessage('Recommend copywriting tone')" class="text-left text-white underline hover:text-zinc-200">Recommend copywriting tone</button></li>
                </ul>
            </div>
        </div>
        
        <form id="ai-chat-form" onsubmit="event.preventDefault(); window.submitAiChat();" class="mt-4 pt-4 border-t border-glass-border/40 flex gap-2">
            <input type="text" id="ai-chat-input" placeholder="Ask AI assistant..." class="flex-grow bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-white">
            <button type="submit" class="px-3 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors">Send</button>
        </form>
    </aside>
</div>

<!-- Command Menu Modal -->
<div id="command-menu-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center hidden z-50 pt-24 animate-[fadeIn_0.15s_ease-out]" onclick="window.toggleCommandMenu(false)">
    <div class="bg-glass-bg border border-glass-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[400px]" onclick="event.stopPropagation()">
        <div class="flex items-center gap-3 border-b border-glass-border/40 p-4">
            <span class="text-text-muted text-sm">🔍</span>
            <input type="text" id="command-menu-search" oninput="window.filterCommandMenu(this.value)" placeholder="Type a command or search..." class="w-full bg-transparent text-white text-sm focus:outline-none placeholder-text-muted" autofocus>
            <span class="text-[10px] text-text-muted bg-panel-hover px-1.5 py-0.5 rounded font-mono font-semibold select-none">ESC</span>
        </div>
        <div class="flex-grow overflow-y-auto p-2.5 flex flex-col gap-1.5" id="command-menu-items">
            <!-- Command categories & items will be rendered dynamically by JS -->
        </div>
    </div>
</div>

`;
}
