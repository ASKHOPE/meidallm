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
            const iconSVG = getIconSVG(item.key as IconName, 'w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)] transition-colors');
            
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
                        class="opacity-50 w-full text-left px-3 py-2 rounded-lg transition-all font-medium text-[13px] text-[var(--color-text-muted)]/60 flex items-center gap-3 border border-transparent cursor-not-allowed">
                    <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                    <span class="truncate">${item.title}</span>
                    <span class="text-[9px] font-bold text-rose-500 font-mono ml-auto flex items-center gap-0.5">${getIconSVG('admin-rbac', 'w-2.5 h-2.5 text-rose-500')} <span>LOCK</span></span>
                </button>
                `;
            }
            
            return `
            <button class="nav-btn group w-full text-left px-3 py-2 rounded-lg transition-all font-medium text-[13px] text-[var(--color-text-muted)] hover:bg-[var(--color-panel-hover)] hover:text-[var(--color-text-main)] flex items-center gap-3 border border-transparent cursor-pointer" 
                    data-view="${item.key}" ${pidAttr}>
                <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                <span class="truncate">${item.title}</span>
            </button>
            `;
        }).join('');

        if (group.key === 'workflow') {
            return `
            <div class="flex flex-col gap-0.5 mt-2">
                ${groupContent}
            </div>
            `;
        }

        const openAttr = group.open ? 'open' : '';
        
        return `
        <details class="group mt-5" ${openAttr}>
            <summary class="flex justify-between items-center text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold cursor-pointer select-none py-2 hover:text-[var(--color-text-main)] transition-colors list-none [&::-webkit-details-marker]:hidden">
                ${group.label}
                <span class="transition-transform group-open:-rotate-180 text-[10px] text-[var(--color-text-muted)]">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </span>
            </summary>
            <div class="flex flex-col gap-0.5 mt-1">
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
    const role = state.activeRole || 'admin';
    
    return `
<div class="flex h-screen w-full overflow-hidden text-[var(--color-text-main)] font-inter bg-background">
    <!-- Left Rail -->
    <aside class="w-16 bg-[var(--color-panel-hover)] border-r border-[var(--color-glass-border)] flex flex-col items-center py-5 justify-between select-none">
        <div class="flex flex-col items-center gap-4 w-full">
            <!-- Brand Logo -->
            <div class="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer shadow-md mb-2 animate-[fadeIn_0.3s_ease-out]" onclick="window.navigateTo('workspaces')" title="Overview">M</div>
            
            <div class="w-8 border-t border-[var(--color-glass-border)] my-1"></div>
            
            <!-- Tenant circular button -->
            ${(systemRole === 'super_admin' || systemRole === 'tenant_owner' || systemRole === 'tenant_admin') ? `
            <div class="relative group/rail-item">
                <button onclick="window.toggleTenantDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs cursor-pointer transition-all shadow-sm" title="Switch Tenant">
                    ${(state.tenants.find(t => t.id === state.activeTenantId)?.name || 'T').substring(0, 2).toUpperCase()}
                </button>
                <div id="tenant-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-56 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-30 flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Switch Tenant</div>
                    <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        ${state.tenants.map(t => `<button onclick="window.switchTenant('${t.id}')" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${t.id === state.activeTenantId ? 'bg-[var(--color-panel-hover)] font-bold' : ''}">${sanitizeHTML(t.name)}</button>`).join('')}
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Org circular button -->
            <div class="relative group/rail-item">
                <button onclick="window.toggleOrgDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs cursor-pointer transition-all shadow-sm" title="Switch Organization">
                    ${(state.organizations.find(o => o.id === state.activeOrgId)?.name || 'O').substring(0, 2).toUpperCase()}
                </button>
                <div id="org-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-56 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-30 flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Switch Organization</div>
                    <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        ${state.organizations.filter(o => o.tenantId === state.activeTenantId).map(o => `<button onclick="window.switchOrganization('${o.id}')" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${o.id === state.activeOrgId ? 'bg-[var(--color-panel-hover)] font-bold' : ''}">${sanitizeHTML(o.name)}</button>`).join('') || '<div class="px-3 py-2 text-xs text-[var(--color-text-muted)] italic">No Organizations</div>'}
                    </div>
                </div>
            </div>
            
            <!-- Team circular button -->
            <div class="relative group/rail-item">
                <button onclick="window.toggleTeamDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs cursor-pointer transition-all shadow-sm" title="Switch Team">
                    ${(state.teams.find(t => t.id === state.activeTeamId)?.name || 'T').substring(0, 2).toUpperCase()}
                </button>
                <div id="team-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-56 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-30 flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Switch Team</div>
                    <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        ${state.teams.filter(t => t.orgId === state.activeOrgId).map(t => `<button onclick="window.switchTeam('${t.id}')" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${t.id === state.activeTeamId ? 'bg-[var(--color-panel-hover)] font-bold' : ''}">${sanitizeHTML(t.name)}</button>`).join('') || '<div class="px-3 py-2 text-xs text-[var(--color-text-muted)] italic">No Teams</div>'}
                    </div>
                </div>
            </div>
            
            <!-- Project circular button -->
            <div class="relative group/rail-item">
                <button id="project-selector-btn" onclick="window.toggleProjectDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center cursor-pointer transition-all shadow-sm" title="Switch Workspace">
                    <svg class="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </button>
                <div id="project-selector-dropdown" class="hidden absolute left-full top-0 ml-3 w-56 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-30 flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Switch Workspace</div>
                    <div id="project-dropdown-list" class="flex flex-col max-h-48 overflow-y-auto gap-0.5">
                        ${renderProjectDropdownOptions()}
                    </div>
                    <div class="border-t border-[var(--color-glass-border)] my-1"></div>
                    <button onclick="window.createProjectPrompt(); window.closeProjectDropdown();" class="w-full text-left px-2.5 py-2 text-xs text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] rounded-md transition-colors flex items-center gap-2 font-bold cursor-pointer">
                        ${getIconSVG('plus', 'w-3.5 h-3.5')} New Project
                    </button>
                </div>
            </div>
        </div>
        
        <div class="flex flex-col items-center gap-4 w-full">
            <!-- User menu circular button -->
            <div class="relative">
                <button onclick="window.toggleUserDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs text-[var(--color-text-main)] cursor-pointer transition-all shadow-sm animate-[fadeIn_0.3s_ease-out]" title="Account & Roles">
                    ${displayName.substring(0, 2).toUpperCase()}
                </button>
                <div id="user-rail-dropdown" class="hidden absolute left-full bottom-0 ml-3 w-64 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-3.5 z-30 flex flex-col gap-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-full flex items-center justify-center font-bold text-xs text-[var(--color-text-main)]">
                            ${displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="overflow-hidden">
                            <div id="user-display-name" class="font-bold text-xs text-[var(--color-text-main)] truncate">${sanitizeHTML(displayName)}</div>
                            <div class="text-[10px] text-[var(--color-text-muted)] truncate">${sanitizeHTML(state.currentUser || 'john.doe@enterprise.com')}</div>
                        </div>
                    </div>
                    
                    <div class="border-t border-[var(--color-glass-border)] my-0.5"></div>
                    
                    <!-- User Role Select inside popover -->
                    <div class="flex items-center justify-between bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] px-2.5 py-1.5 rounded-lg text-xs">
                        <div class="flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-[var(--color-text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z"/></svg>
                            <span class="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider font-inter">Role</span>
                        </div>
                        <div class="relative flex items-center">
                            <select onchange="window.switchRole(this.value)" class="bg-transparent text-[var(--color-text-main)] text-xs font-semibold py-0.5 pr-4 focus:outline-none cursor-pointer appearance-none">
                                <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="manager" ${role === 'manager' ? 'selected' : ''}>Manager</option>
                                <option value="accountant" ${role === 'accountant' ? 'selected' : ''}>Accountant</option>
                                <option value="sales" ${role === 'sales' ? 'selected' : ''}>Sales Rep</option>
                                <option value="support" ${role === 'support' ? 'selected' : ''}>Support Rep</option>
                            </select>
                            <span class="absolute right-0 pointer-events-none text-[var(--color-text-muted)]">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                            </span>
                        </div>
                    </div>
                    
                    <button class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium flex items-center gap-2 cursor-pointer" onclick="window.navigateTo('settings'); window.closeUserDropdown();">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/></svg>
                        Profile Settings
                    </button>
                    <button class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-red-500 hover:bg-[var(--color-panel-hover)] font-medium flex items-center gap-2 cursor-pointer" onclick="window.signOut()">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
                    </button>
                </div>
            </div>
            
            <!-- Theme cycle / toggle -->
            <div id="theme-switcher-container" class="flex flex-col bg-[var(--color-panel-hover)] p-0.5 rounded-lg border border-[var(--color-glass-border)] w-10">
                <!-- Theme buttons inside rail (stacked) -->
                <button onclick="window.setTheme('day')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'day' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-day" title="Day Mode">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M20 12h2"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                </button>
                <button onclick="window.setTheme('night')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'night' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-night" title="Night Mode">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                </button>
                <button onclick="window.setTheme('auto')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'auto' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-auto" title="System Auto">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </button>
            </div>
            
            <button onclick="window.navigateTo('settings')" class="w-10 h-10 flex items-center justify-center bg-[var(--color-panel-hover)] hover:bg-[var(--color-panel-hover)]/80 text-[var(--color-text-main)] rounded-xl border border-[var(--color-glass-border)] cursor-pointer transition-colors" title="Settings">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
        </div>
    </aside>

    <!-- Main Navigation Sidebar -->
    <aside class="w-56 bg-[var(--color-glass-bg)] border-r border-[var(--color-glass-border)] flex flex-col p-5 animate-[fadeIn_0.3s_ease-out]">
        <div class="mb-5 flex flex-col">
            <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-inter">Workspace</span>
            <span class="text-sm font-bold text-[var(--color-text-main)] truncate mt-0.5" id="sidebar-active-project-display">${activeProjectName}</span>
        </div>
        
        <nav class="flex flex-col gap-1.5 flex-grow overflow-y-auto pr-1">
            ${renderSidebarNavigation()}
        </nav>
    </aside>
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
