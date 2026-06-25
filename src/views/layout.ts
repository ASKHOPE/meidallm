import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { views, sidebarGroups } from "../router";
import { getIconSVG } from "./icons";
import { renderAIAssistantDrawer } from "./ai-assistant";
import { renderCreativeWizardModal } from "./creative-wizard";
import type { IconName } from "./icons";

export function renderProjectDropdownOptions(): string {
    const activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    const validProjectIds = activeTeam ? activeTeam.projectIds : [];
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned && validProjectIds.includes(p.id) && (p.isStarred || p.id === 'p-welcome'));
    
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
    const userProfile = state.team.find(t => t.id === state.currentUser) || state.team[0];
    const systemRole = userProfile?.systemRole || 'user';
    const role = state.activeRole || 'admin';
    
    return sidebarGroups.filter(g => g.key !== 'admin' || ['super_admin', 'tenant_owner', 'tenant_admin'].includes(systemRole)).map(group => {
        const groupTools = views.filter(v => v.group === group.key && v.icon && (!v.roles || v.roles.includes(systemRole)));
        const groupContent = groupTools.map(item => {
            const isProjectScoped = item.scope === 'project';
            const pidAttr = isProjectScoped && state.currentProject ? `data-pid="${state.currentProject}"` : '';
            const iconSVG = getIconSVG(item.key as IconName, 'w-4 h-4 text-text-muted group-hover:text-text-main transition-colors');
            
            // RBAC Lock Rules
            let isLocked = false;
            if (item.key === 'project-erp' && (role === 'sales' || role === 'support')) isLocked = true;
            if (item.key === 'crm' && role === 'accountant') isLocked = true;
            if (item.key === 'publish' && (role === 'accountant' || role === 'support')) isLocked = true;
            if (item.key === 'drafts' && (role === 'accountant' || role === 'support')) isLocked = true;
            if (item.key === 'settings' && (role !== 'admin' && role !== 'manager')) isLocked = true;
            if (item.key === 'team' && (role !== 'admin' && role !== 'manager' && role !== 'accountant')) isLocked = true;

            if (isLocked) {
                return `
                <button onclick="if(window.showToast) { window.showToast('Permission Denied: Role [${role.toUpperCase()}] cannot access this view.', 'error'); } else { alert('Access Denied'); }" 
                        class="opacity-50 w-full text-left px-3 py-2 rounded-md transition-all font-medium text-xs text-text-muted/60 flex items-center gap-2.5 border border-transparent cursor-not-allowed">
                    <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                    <span class="truncate">${item.title}</span>
                    <span class="text-[9px] font-bold text-rose-500 font-mono ml-auto flex items-center gap-0.5">${getIconSVG('admin-rbac', 'w-2.5 h-2.5 text-rose-500')} <span>LOCK</span></span>
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
    const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
    const systemRole = currentUserProfile?.systemRole || 'user';
    const displayName = state.currentUser ? state.currentUser.split('@')[0] || 'Admin' : 'Admin';
    const currentProject = state.projects.find(p => p.id === state.currentProject);
    const activeProjectName = currentProject ? sanitizeHTML(currentProject.name) : "Select Campaign...";
    
    return `
<div class="flex h-screen w-full overflow-hidden text-text-main font-inter bg-background">
    <!-- Sidebar -->
    <aside class="w-64 bg-background border-r border-text-main/15 flex flex-col p-5">
        <!-- Brand Header -->
        <div class="flex items-center gap-3 mb-6 cursor-pointer" onclick="window.navigateTo('workspaces')">
            <div class="w-8 h-8 text-background rounded-lg flex items-center justify-center font-bold text-base shadow-sm" style="background-color: var(--color-text-main)">M</div>
            <h2 class="text-base font-bold font-outfit uppercase tracking-wider text-text-main">MeidaLLM</h2>
        </div>

        <!-- SaaS Hierarchy Dropdowns -->
        <div class="flex flex-col gap-2 mb-5">
            ${(systemRole === 'super_admin' || systemRole === 'tenant_owner' || systemRole === 'tenant_admin') ? `
            <div class="relative">
                <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Tenant</label>
                <select onchange="window.switchTenant(this.value)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-xs font-semibold text-text-main focus:outline-none cursor-pointer">
                    ${state.tenants.map(t => `<option value="${t.id}" ${t.id === state.activeTenantId ? 'selected' : ''}>${sanitizeHTML(t.name)}</option>`).join('')}
                </select>
            </div>
            ` : ''}
            <div class="relative">
                <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Organization</label>
                <select onchange="window.switchOrganization(this.value)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-xs font-semibold text-text-main focus:outline-none cursor-pointer">
                    ${state.organizations.filter(o => o.tenantId === state.activeTenantId).map(o => `<option value="${o.id}" ${o.id === state.activeOrgId ? 'selected' : ''}>${sanitizeHTML(o.name)}</option>`).join('') || '<option value="">No Organizations</option>'}
                </select>
            </div>
            <div class="relative">
                <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Team</label>
                <select onchange="window.switchTeam(this.value)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-xs font-semibold text-text-main focus:outline-none cursor-pointer">
                    ${state.teams.filter(t => t.orgId === state.activeOrgId).map(t => `<option value="${t.id}" ${t.id === state.activeTeamId ? 'selected' : ''}>${sanitizeHTML(t.name)}</option>`).join('') || '<option value="">No Teams</option>'}
                </select>
            </div>
            
            <!-- Project Selector Dropdown (Active Workspace) -->
            <div class="relative mt-2">
                <label class="text-[9px] font-bold text-text-muted uppercase tracking-wider block mb-1">Active Workspace</label>
                <button id="project-selector-btn" onclick="window.toggleProjectDropdown(event)" class="w-full bg-background border border-text-main/15 hover:border-text-main/40 rounded-lg px-3 py-2 text-left text-xs font-semibold text-text-main flex justify-between items-center transition-all cursor-pointer">
                    <span id="active-project-name-display" class="truncate flex items-center gap-2">${getIconSVG('folder', 'w-3.5 h-3.5')} ${activeProjectName}</span>
                    <span class="text-text-muted transition-transform" id="project-selector-arrow">${getIconSVG('chevron-down', 'w-3 h-3')}</span>
                </button>
                <div id="project-selector-dropdown" class="hidden absolute top-full left-0 mt-1.5 w-full bg-background border border-text-main/20 rounded-lg shadow-sm py-1.5 z-10 flex flex-col animate-[fadeIn_0.15s_ease-out] p-1">
                    <div id="project-dropdown-list" class="flex flex-col max-h-48 overflow-y-auto gap-0.5">
                        ${renderProjectDropdownOptions()}
                    </div>
                    <div class="border-t border-text-main/10 my-1"></div>
                    <button onclick="window.createProjectPrompt(); window.closeProjectDropdown();" class="w-full text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-md transition-colors flex items-center gap-2 font-bold">
                        ${getIconSVG('plus', 'w-3.5 h-3.5')} New Project
                    </button>
                </div>
            </div>
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
                    <div class="text-[9px] text-text-muted font-mono uppercase tracking-wider">Tenant: ${sanitizeHTML(state.tenants.find(t => t.id === state.activeTenantId)?.name || 'Personal')}</div>
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

            <!-- Settings Route -->
            <button class="nav-btn flex items-center justify-between bg-text-main/5 hover:bg-text-main/10 p-1 rounded-lg border border-text-main/10 text-[10px] my-0.5 font-bold uppercase tracking-wider font-inter cursor-pointer transition-colors" data-view="settings">
                <span class="pl-1.5 text-text-main">Settings</span>
                <span class="text-text-muted pr-1">${getIconSVG('settings', 'w-3 h-3')}</span>
            </button>

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
    
    ${renderAIAssistantDrawer()}
    ${renderCreativeWizardModal()}
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
        
        let iconHtml = getIconSVG('info', 'w-4 h-4 text-blue-500');
        if (type === 'success') {
            iconHtml = getIconSVG('check', 'w-4 h-4 text-emerald-500');
            toast.classList.add('border-emerald-500/30');
        } else if (type === 'error') {
            iconHtml = getIconSVG('info', 'w-4 h-4 text-rose-500');
            toast.classList.add('border-rose-500/30');
        }
        
        toast.innerHTML = `<span class="shrink-0 flex items-center justify-center">${iconHtml}</span><span class="flex-1">${msg}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.className += ' animate-[fadeOutRight_0.2s_ease-out_forwards]';
            setTimeout(() => toast.remove(), 250);
        }, 3000);
    };
}
