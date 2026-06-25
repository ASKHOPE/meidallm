import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { views, sidebarGroups } from "../router";
import { getIconSVG } from "./icons";
import type { IconName } from "./icons";

export function renderProjectDropdownOptions(): string {
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned && (p.isStarred || p.id === 'p-welcome'));
    const sorted = [...activeProjects].sort((a, b) => {
        if (a.id === 'p-welcome') return -1;
        if (b.id === 'p-welcome') return 1;
        return (b.isStarred ? 1 : 0) - (a.isStarred ? 1 : 0);
    });
    let options = sorted.map(p => {
        const isCurrent = state.currentProject === p.id;
        const currentClass = isCurrent ? "text-text-main font-semibold bg-text-main/10" : "text-text-muted hover:text-text-main hover:bg-text-main/5";
        const starIcon = p.isStarred ? getIconSVG('star-filled', 'w-3.5 h-3.5') : getIconSVG('folder', 'w-3.5 h-3.5 text-text-muted');
        
        return `
        <button onclick="window.selectProject('${p.id}')" class="w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center justify-between group/dropdown-item ${currentClass}">
            <span class="truncate flex items-center gap-2">${starIcon} ${sanitizeHTML(p.name)}</span>
            <span class="opacity-0 group-hover/dropdown-item:opacity-100 text-xs text-text-muted hover:text-red-500 transition-opacity pl-2" onclick="event.stopPropagation(); window.binProjectToggle('${p.id}', true)" title="Move to Bin">
                ${getIconSVG('trash', 'w-3 h-3')}
            </span>
        </button>
        `;
    }).join('');
    
    if (activeProjects.length === 0) {
        options = `<div class="px-3 py-2.5 text-xs text-text-muted italic">No starred projects</div>`;
    }
    return options;
}

export function renderSidebarNavigation(): string {
    const role = state.activeRole || 'admin';
    return sidebarGroups.map(group => {
        let groupContent = "";
        
        if (group.key === 'workflow') {
            const workflowTools = views.filter(v => v.group === 'workflow' && v.icon);
            groupContent = workflowTools.map(item => {
                const isProjectScoped = item.scope === 'project';
                const pidAttr = isProjectScoped && state.currentProject ? `data-pid="${state.currentProject}"` : '';
                const iconSVG = getIconSVG(item.key as IconName, 'w-4 h-4 text-text-muted group-hover:text-text-main transition-colors');
                
                // RBAC Rules
                let isLocked = false;
                if (item.key === 'project-erp' && (role === 'sales' || role === 'support')) isLocked = true;
                if (item.key === 'crm' && role === 'accountant') isLocked = true;
                if (item.key === 'publish' && (role === 'accountant' || role === 'support')) isLocked = true;
                if (item.key === 'drafts' && (role === 'accountant' || role === 'support')) isLocked = true;

                if (isLocked) {
                    return `
                    <button onclick="if(window.showToast) { window.showToast('Permission Denied: Role [${role.toUpperCase()}] cannot access this view.', 'error'); } else { alert('Access Denied'); }" 
                            class="opacity-50 w-full text-left px-3 py-2 rounded-md transition-all font-medium text-xs text-text-muted/60 flex items-center gap-2.5 border border-transparent cursor-not-allowed">
                        <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                        <span class="truncate">${item.title}</span>
                        <span class="text-[9px] font-bold text-rose-500 font-mono ml-auto">🔒 LOCK</span>
                    </button>
                    `;
                }
                
                return `
                <button class="nav-btn group w-full text-left px-3 py-2 rounded-md transition-all font-medium text-xs text-text-muted hover:bg-text-main/5 hover:text-text-main flex items-center gap-2.5 border border-transparent" 
                        data-view="${item.key}" ${pidAttr}>
                    <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                    <span class="truncate">${item.title}</span>
                </button>
                `;
            }).join('');
        } else {
            const groupTools = views.filter(v => v.group === group.key && v.icon && v.scope !== 'project');
            groupContent = groupTools.map(item => {
                const iconSVG = getIconSVG(item.key as IconName, 'w-4 h-4 text-text-muted group-hover:text-text-main transition-colors');
                
                // Hide Settings/Team Office for Support and Sales if locked
                let isLocked = false;
                if (item.key === 'settings' && (role !== 'admin' && role !== 'manager')) isLocked = true;
                if (item.key === 'team' && (role !== 'admin' && role !== 'manager' && role !== 'accountant')) isLocked = true;

                if (isLocked) {
                    return `
                    <button onclick="if(window.showToast) { window.showToast('Permission Denied: Role [${role.toUpperCase()}] cannot access Settings.', 'error'); } else { alert('Access Denied'); }" 
                            class="opacity-50 w-full text-left px-3 py-2 rounded-md transition-all font-medium text-xs text-text-muted/60 flex items-center gap-2.5 border border-transparent cursor-not-allowed">
                        <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                        <span class="truncate">${item.title}</span>
                        <span class="text-[9px] font-bold text-rose-500 font-mono ml-auto">🔒 LOCK</span>
                    </button>
                    `;
                }

                return `
                <button class="nav-btn group w-full text-left px-3 py-2 rounded-md transition-all font-medium text-xs text-text-muted hover:bg-text-main/5 hover:text-text-main flex items-center gap-2.5 border border-transparent" data-view="${item.key}">
                    <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                    <span class="truncate">${item.title}</span>
                </button>
                `;
            }).join('');
        }

        const openAttr = group.open ? 'open' : '';
        
        return `
        <details class="group ${group.key === 'workflow' ? '' : 'mt-4'}" ${openAttr}>
            <summary class="flex justify-between items-center text-[10px] uppercase tracking-wider text-text-muted font-bold cursor-pointer select-none py-1.5 hover:text-text-main transition-colors list-none [&::-webkit-details-marker]:hidden">
                ${group.label}
                <span class="transition-transform group-open:-rotate-180 text-[10px] text-text-muted">${getIconSVG('chevron-down', 'w-3 h-3')}</span>
            </summary>
            <div class="flex flex-col gap-0.5 mt-1 animate-[fadeIn_0.3s_ease-out]">
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
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter bg-background">
    <!-- Sidebar -->
    <aside class="w-64 bg-background border-r border-text-main/15 flex flex-col p-5">
        <!-- Brand Header -->
        <div class="flex items-center gap-3 mb-6 cursor-pointer" onclick="window.navigateTo('workspaces')">
            <div class="w-8 h-8 text-background rounded-lg flex items-center justify-center font-bold text-base shadow-sm" style="background-color: ${state.agencyBrand?.primaryColor || 'var(--color-text-main)'}">M</div>
            <h2 class="text-base font-bold font-outfit uppercase tracking-wider text-text-main">${sanitizeHTML(state.agencyBrand?.logo || "Meidallm")}</h2>
        </div>

        <!-- Project Selector Dropdown -->
        <div class="relative mb-5">
            <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Active Workspace</label>
            <button id="project-selector-btn" onclick="window.toggleProjectDropdown(event)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-main flex justify-between items-center transition-all cursor-pointer">
                <span id="active-project-name-display" class="truncate flex items-center gap-2">${getIconSVG('folder', 'w-3.5 h-3.5')} ${activeProjectName}</span>
                <span class="text-text-muted transition-transform" id="project-selector-arrow">${getIconSVG('chevron-down', 'w-3 h-3')}</span>
            </button>
            <div id="project-selector-dropdown" class="hidden relative mt-1.5 w-full bg-background border border-text-main/20 rounded-lg shadow-sm py-1.5 z-10 flex flex-col animate-[fadeIn_0.15s_ease-out] p-1">
                <div id="project-dropdown-list" class="flex flex-col max-h-48 overflow-y-auto gap-0.5">
                    ${renderProjectDropdownOptions()}
                </div>
                <div class="border-t border-text-main/10 my-1"></div>
                <button onclick="window.createProjectPrompt(); window.closeProjectDropdown();" class="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-md transition-colors flex items-center gap-2 font-bold">
                    ${getIconSVG('plus', 'w-3.5 h-3.5')} New Project
                </button>
            </div>
        </div>

        <!-- Tenant Switcher Dropdown -->
        <div class="relative mb-5">
            <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Tenant Organization</label>
            <select onchange="window.switchOrganization(this.value)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-xs font-semibold text-text-main focus:outline-none cursor-pointer">
                <option value="personal" ${state.activeOrgId === 'personal' || !state.activeOrgId ? 'selected' : ''}>💼 Personal Workspace</option>
                <option value="nike" ${state.activeOrgId === 'nike' ? 'selected' : ''}>⚡ Nike Campaign Hub</option>
                <option value="stripe" ${state.activeOrgId === 'stripe' ? 'selected' : ''}>💳 Stripe Creator Hub</option>
                <option value="spacex" ${state.activeOrgId === 'spacex' ? 'selected' : ''}>🚀 SpaceX Media Office</option>
            </select>
        </div>

        <!-- Navigation -->
        <nav class="flex flex-col gap-2 flex-grow overflow-y-auto pr-1">
            ${renderSidebarNavigation()}
        </nav>

        <!-- Footer -->
        <div class="flex flex-col gap-3 pt-4 border-t border-text-main/10">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-text-main/10 rounded-full flex items-center justify-center font-bold text-xs text-text-main">
                    ${displayName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                    <div id="user-display-name" class="font-bold text-xs">${sanitizeHTML(state.agencyBrand?.logo || displayName)}</div>
                    <div class="text-[9px] text-text-muted font-mono uppercase tracking-wider">Tenant: ${sanitizeHTML(state.activeOrgId || 'personal')}</div>
                </div>
            </div>

            <!-- Theme Switcher -->
            <div id="theme-switcher-container" class="flex items-center justify-between bg-text-main/5 p-1 rounded-lg border border-text-main/10 text-[9px] my-0.5">
                <span class="text-text-muted pl-1.5 font-bold uppercase tracking-wider font-inter">Theme</span>
                <div class="flex gap-0.5">
                    <button onclick="window.setTheme('day')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'day' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-day">Day</button>
                    <button onclick="window.setTheme('night')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'night' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-night">Night</button>
                    <button onclick="window.setTheme('auto')" class="theme-btn px-2 py-0.5 rounded transition-all font-bold ${state.theme === 'auto' ? 'bg-text-main text-background' : 'text-text-muted hover:text-text-main'}" id="theme-btn-auto">Auto</button>
                </div>
            </div>

            <!-- User Role Switcher -->
            <div class="flex items-center justify-between bg-text-main/5 p-1 rounded-lg border border-text-main/10 text-[9px] my-0.5">
                <span class="text-text-muted pl-1.5 font-bold uppercase tracking-wider font-inter">User Role</span>
                <select onchange="window.switchRole(this.value)" class="bg-background border border-text-main/20 text-text-main text-[9px] font-bold py-0.5 rounded focus:outline-none cursor-pointer">
                    <option value="admin" ${state.activeRole === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="manager" ${state.activeRole === 'manager' ? 'selected' : ''}>Manager</option>
                    <option value="accountant" ${state.activeRole === 'accountant' ? 'selected' : ''}>Accountant</option>
                    <option value="sales" ${state.activeRole === 'sales' ? 'selected' : ''}>Sales Rep</option>
                    <option value="support" ${state.activeRole === 'support' ? 'selected' : ''}>Support Rep</option>
                </select>
            </div>

            <button onclick="window.signOut()" class="w-full py-2 border border-text-main/15 hover:border-text-main/40 text-xs rounded-lg transition-colors font-bold cursor-pointer">
                Sign Out
            </button>
        </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-grow flex flex-col p-6 overflow-y-auto mr-0 transition-all duration-300 bg-background" id="main-content-wrapper">
        <header class="flex justify-between items-center pb-4 border-b border-text-main/10 mb-6">
            <h1 id="page-title" class="text-2xl font-bold font-outfit text-text-main">Overview</h1>
            <div class="flex gap-2">
                <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="window.toggleCommandMenu(true)" title="Command Menu (⌘K)">
                    ${getIconSVG('search', 'w-4 h-4')}
                </button>
                <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="window.toggleAiAssistant(true)" title="AI Assistant">
                    ${getIconSVG('bot', 'w-4 h-4')}
                </button>
                <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="alert('No new notifications')">
                    ${getIconSVG('bell', 'w-4 h-4')}
                </button>
            </div>
        </header>
        <div id="app-content" class="flex-grow flex flex-col"></div>
    </main>
    
    <!-- Collapsible AI Assistant slide-out drawer -->
    <aside id="ai-assistant-drawer" class="w-80 bg-background border-l border-text-main/15 flex flex-col p-5 transition-all duration-300 transform translate-x-full fixed right-0 top-0 bottom-0 z-40 shadow-xl">
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-text-main/10">
            <div class="flex items-center gap-2 text-text-main">
                ${getIconSVG('bot', 'w-5 h-5')}
                <h3 class="font-bold font-outfit text-sm">AI Assistant</h3>
            </div>
            <button onclick="window.toggleAiAssistant(false)" class="text-text-muted hover:text-text-main transition-colors text-sm">${getIconSVG('close', 'w-4 h-4')}</button>
        </div>
        
        <div id="ai-chat-thread" class="flex-grow overflow-y-auto flex flex-col gap-4 text-xs pr-1">
            <div class="bg-text-main/5 p-3 rounded-lg border border-text-main/10 text-text-muted leading-relaxed">
                Hello! I am your AI assistant. I have full context of your database tables, tasks, cycles, and CRM. Try asking:
                <ul class="list-disc pl-4 mt-2 flex flex-col gap-1.5">
                    <li><button onclick="window.sendAiMessage('Show tasks at risk')" class="text-left text-text-main underline hover:text-text-main/80">Show tasks at risk</button></li>
                    <li><button onclick="window.sendAiMessage('Summarize current cycle progress')" class="text-left text-text-main underline hover:text-text-main/80">Summarize current cycle progress</button></li>
                    <li><button onclick="window.sendAiMessage('Recommend copywriting tone')" class="text-left text-text-main underline hover:text-text-main/80">Recommend copywriting tone</button></li>
                </ul>
            </div>
        </div>
        
        <form id="ai-chat-form" onsubmit="event.preventDefault(); window.submitAiChat();" class="mt-4 pt-4 border-t border-text-main/10 flex gap-2">
            <input type="text" id="ai-chat-input" placeholder="Ask AI assistant..." class="flex-grow bg-background border border-text-main/15 p-2.5 rounded-lg text-text-main text-xs focus:outline-none focus:border-text-main">
            <button type="submit" class="px-3 bg-text-main text-background font-bold text-xs rounded-lg hover:bg-text-main/90 transition-colors">Send</button>
        </form>
    </aside>
</div>

<!-- Toast Notification Container -->
<div id="toast-container" class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none"></div>

<!-- Command Menu Modal -->
<div id="command-menu-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center hidden z-50 pt-24 animate-[fadeIn_0.15s_ease-out]" onclick="window.toggleCommandMenu(false)">
    <div class="bg-background border border-text-main/20 rounded-lg w-full max-w-lg overflow-hidden shadow-xl flex flex-col max-h-[400px]" onclick="event.stopPropagation()">
        <div class="flex items-center gap-3 border-b border-text-main/10 p-3">
            <span class="text-text-muted">${getIconSVG('search', 'w-4 h-4')}</span>
            <input type="text" id="command-menu-search" oninput="window.filterCommandMenu(this.value)" placeholder="Type a command or search..." class="w-full bg-transparent text-text-main text-xs focus:outline-none placeholder-text-muted" autofocus>
            <span class="text-[9px] text-text-muted bg-text-main/5 px-1.5 py-0.5 rounded font-mono font-bold select-none">ESC</span>
        </div>
        <div class="flex-grow overflow-y-auto p-2 flex flex-col gap-1" id="command-menu-items">
            <!-- Command categories & items will be rendered dynamically by JS -->
        </div>
    </div>
</div>
`;
}

if (typeof window !== 'undefined') {
    const w = window as any;
    w.showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `p-3.5 rounded-xl border text-xs font-bold shadow-lg transition-all flex items-center gap-2 pointer-events-auto bg-background text-text-main border-text-main/20 animate-[fadeInUp_0.2s_ease-out_forwards]`;
        
        let emoji = 'ℹ️';
        if (type === 'success') {
            emoji = '🟢';
            toast.classList.add('border-emerald-500/30');
        } else if (type === 'error') {
            emoji = '🔴';
            toast.classList.add('border-rose-500/30');
        }
        
        toast.innerHTML = `<span>${emoji}</span><span>${msg}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.className += ' animate-[fadeOutRight_0.2s_ease-out_forwards]';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    };
}
