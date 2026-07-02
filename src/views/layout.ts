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
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned && validProjectIds.includes(p.id));
    
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
            <div class="opacity-0 group-hover/dropdown-item:opacity-100 flex items-center gap-1 transition-opacity pl-2">
                <span class="text-xs text-text-muted hover:text-amber-500 cursor-pointer" onclick="event.stopPropagation(); window.toggleProjectStar('${p.id}')" title="${p.isStarred ? 'Unpin' : 'Pin to Rail'}">
                    ${getIconSVG('pin', 'w-3 h-3')}
                </span>
                <span class="text-xs text-text-muted hover:text-red-500 cursor-pointer" onclick="event.stopPropagation(); window.confirmBinProject('${p.id}', '${p.name.replace(/'/g, "\\'")}')" title="Move to Bin">
                    ${getIconSVG('trash', 'w-3 h-3')}
                </span>
            </div>
        </button>
        `;
    }).join('');
    
    if (activeProjects.length === 0) {
        options = `<div class="px-3 py-2.5 text-xs text-text-muted italic">No workspaces available</div>`;
    }
    return options;
}

export function renderSidebarNavigation(): string {
    const userProfile = state.team.find(t => t.email === state.currentUser) || state.team[0];
    const systemRole = userProfile?.systemRole || 'user';
    const role = state.activeRole || 'admin';
    
    return sidebarGroups.filter(g => g.key !== 'admin' || ['super_admin', 'tenant_owner', 'tenant_admin', 'support_admin', 'support_manager'].includes(systemRole)).map(group => {
        const groupTools = views.filter(v => v.group === group.key && v.icon && (!v.roles || v.roles.includes(systemRole)));
        const groupContent = groupTools.map(item => {
            const isProjectScoped = item.scope === 'project';
            const pidAttr = isProjectScoped && state.currentProject ? `data-pid="${state.currentProject}"` : '';
            const iconSVG = getIconSVG((item.icon || item.key) as IconName, 'w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)] transition-colors');
            
            // RBAC Lock Rules
            let isLocked = false;
            if (item.key === 'project-erp' && (role === 'sales' || role === 'support')) isLocked = true;
            if (item.key === 'crm' && role === 'accountant') isLocked = true;
            if (item.key === 'publish' && (role === 'accountant' || role === 'support')) isLocked = true;
            if (item.key === 'drafts' && (role === 'accountant' || role === 'support')) isLocked = true;
            if (item.key === 'settings' && (role !== 'admin' && role !== 'manager')) isLocked = true;
            if (item.key === 'team' && (role !== 'admin' && role !== 'manager' && role !== 'accountant' && !systemRole.startsWith('support_'))) isLocked = true;

            if (isLocked) {
                return `
                <button onclick="if(window.showToast) { window.showToast('Permission Denied: Role [${role.toUpperCase()}] cannot access this view.', 'error'); } else { alert('Access Denied'); }" 
                        class="opacity-50 w-full ${state.sidebarCollapsed ? 'justify-center' : 'text-left px-3'} py-2 rounded-lg transition-all font-medium text-[11px] text-[var(--color-text-muted)]/60 flex items-center gap-3 border border-transparent cursor-not-allowed"
                        title="Locked: ${item.title}">
                    <span class="shrink-0 flex items-center justify-center">${iconSVG}</span> 
                    ${!state.sidebarCollapsed ? `
                    <span class="line-clamp-2 leading-tight break-words text-left pr-1">${item.title}</span>
                    <span class="text-[9px] font-bold text-rose-500 font-mono ml-auto flex items-center gap-0.5 shrink-0">${getIconSVG('admin-rbac', 'w-2.5 h-2.5 text-rose-500')} <span>LOCK</span></span>
                    ` : ''}
                </button>
                `;
            }
            
            let actionButton = '';


            return `
            <div class="nav-btn group w-full ${state.sidebarCollapsed ? 'justify-center' : 'text-left px-3'} py-2 rounded-lg transition-all font-medium text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-panel-hover)] hover:text-[var(--color-text-main)] flex items-center gap-3 border border-transparent cursor-pointer" 
                    data-view="${item.key}" ${pidAttr} title="${item.title}">
                <span class="shrink-0 flex items-center justify-center pointer-events-none">${iconSVG}</span> 
                ${!state.sidebarCollapsed ? `
                <span class="line-clamp-2 leading-tight break-words text-left pr-1 pointer-events-none">${item.title}</span>
                ${actionButton}
                ` : ''}
            </div>
            `;
        }).join('');

        if (group.key === 'hubs') {
            return `
            <div class="flex flex-col gap-0.5 mt-0">
                ${groupContent}
            </div>
            `;
        }

        const openAttr = state.sidebarCollapsed || group.open ? 'open' : '';
        
        return `
        <details class="group mt-2" ${openAttr}>
            <summary class="${state.sidebarCollapsed ? 'hidden' : 'flex'} justify-between items-center text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold cursor-pointer select-none py-2 hover:text-[var(--color-text-main)] transition-colors list-none [&::-webkit-details-marker]:hidden">
                ${group.label}
                <span class="transition-transform group-open:-rotate-180 text-[10px] text-[var(--color-text-muted)]">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </span>
            </summary>
            <div class="flex flex-col gap-0.5 mt-1 ${state.sidebarCollapsed ? 'items-center' : ''}">
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
    const isAdmin = role === 'admin';
    
    const hasActiveSupportCases = state.supportCases && state.supportCases.some(sc => sc.status !== 'resolved');
    
    let activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    if (!activeTeam && state.teams.length > 0) activeTeam = state.teams[0];
    const validProjectIds = activeTeam ? activeTeam.projectIds : [];
    const teamProjects = state.projects.filter(p => !p.isArchived && !p.isBinned && validProjectIds.includes(p.id));
    
    // Rail shows starred projects + currently active project
    let railProjects = teamProjects.filter(p => p.isStarred);
    if (state.currentProject && !railProjects.find(p => p.id === state.currentProject)) {
        const current = teamProjects.find(p => p.id === state.currentProject);
        if (current) railProjects.push(current);
    }
    railProjects = railProjects.slice(0, 4);

    const sidebarCollapsedClass = state.sidebarCollapsed 
        ? "sidebar-is-collapsed py-5 flex flex-col items-center border-r border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] transition-all duration-300 ease-in-out relative" 
        : "py-5 pl-5 border-r border-[var(--color-glass-border)] relative opacity-100 pointer-events-auto transition-all duration-300 ease-in-out";

    const sidebarInnerClass = state.sidebarCollapsed 
        ? "w-full flex flex-col items-center" 
        : "opacity-100 pointer-events-auto";

    return `
<div class="flex h-screen w-full overflow-hidden text-[var(--color-text-main)] font-inter bg-background">
    <!-- Left Rail + Sidebar Wrapper -->
    <div class="flex h-full shrink-0 relative group/sidebar-container">
        <!-- Left Rail -->
    <aside class="w-16 bg-[var(--color-panel-hover)] border-r border-[var(--color-glass-border)] flex flex-col items-center py-5 justify-between select-none">
        <div class="flex flex-col items-center gap-4 w-full">
            <!-- Brand Logo -->
            <div class="relative group/rail-item w-full flex justify-center">
                <div class="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-lg cursor-pointer shadow-md mb-2 animate-[fadeIn_0.3s_ease-out]" onclick="window.navigateTo('workspaces')">M</div>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Overview
                </div>
            </div>
            <div class="w-8 border-t border-[var(--color-glass-border)] my-1"></div>
            
            <!-- Super Admin Quick Access (super_admin only) -->
            ${systemRole === 'super_admin' ? `
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.toggleSuperAdminDropdown(event)" class="relative w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/50 hover:border-violet-400 hover:bg-violet-600/30 flex items-center justify-center font-bold text-[10px] text-violet-400 cursor-pointer transition-all shadow-sm shadow-violet-900/30">
                    <span class="font-black tracking-tight">SA</span>
                    <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-violet-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-violet-500/40">
                    Super Admin Panel
                </div>
                <div id="super-admin-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-52 bg-[var(--color-glass-bg)] border border-violet-500/30 rounded-lg shadow-xl p-1 z-[60] flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span class="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block"></span>
                        Super Admin
                    </div>
                    <div class="flex flex-col gap-0.5 mt-0.5">
                        <button onclick="window.navigateTo('admin-analytics'); window.closeSuperAdminDropdown();" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                            Usage &amp; Analytics
                        </button>
                        <button onclick="window.navigateTo('admin-tenants'); window.closeSuperAdminDropdown();" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            Tenants
                        </button>
                        <button onclick="window.navigateTo('admin-orgs'); window.closeSuperAdminDropdown();" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            Organizations
                        </button>
                        <button onclick="window.navigateTo('admin-rbac'); window.closeSuperAdminDropdown();" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            RBAC &amp; Users
                        </button>
                        <button onclick="window.navigateTo('admin-policies'); window.closeSuperAdminDropdown();" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium flex items-center gap-2">
                            <svg class="w-3.5 h-3.5 text-violet-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Rules &amp; Policies
                        </button>
                    </div>
                </div>
            </div>

            <!-- Role Switcher (super_admin only, shown under SA) -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.toggleRoleDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-violet-500/30 hover:border-violet-400 flex items-center justify-center cursor-pointer transition-all shadow-sm">
                    ${getIconSVG('admin-rbac', 'w-4 h-4 text-violet-400')}
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-violet-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-violet-500/40">
                    Switch Role (${role.toUpperCase()})
                </div>
                <div id="role-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-48 bg-[var(--color-glass-bg)] border border-violet-500/30 rounded-lg shadow-xl p-1 z-[60] flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider">Switch Role</div>
                    <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        ${['admin', 'manager', 'accountant', 'sales', 'support'].map(r => `<button onclick="window.switchRole('${r}')" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-violet-600/15 hover:text-violet-300 font-medium ${r === role ? 'bg-violet-600/10 font-bold text-violet-300' : ''}">${r.toUpperCase()}</button>`).join('')}
                    </div>
                </div>
            </div>
            <div class="w-8 border-t border-violet-500/30 my-1"></div>
            ` : ''}
            
            <!-- Unified Hierarchy Switcher -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.toggleHierarchyDropdown(event)" class="relative w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center cursor-pointer transition-all shadow-sm">
                    ${getIconSVG('connections', 'w-4 h-4 text-amber-500')}
                    ${hasActiveSupportCases ? `
                    <span class="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                    </span>
                    ` : ''}
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Switch Context
                </div>
                <div id="hierarchy-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-64 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-2 z-[60] flex flex-col gap-3">
                    
                    ${(systemRole === 'super_admin' || systemRole === 'tenant_owner' || systemRole === 'tenant_admin') ? `
                    <div class="flex flex-col gap-1.5">
                        <div class="px-2 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex justify-between items-center">
                            <span>Tenant</span>
                            <button onclick="window.navigateTo('admin-tenants'); window.closeAllRailDropdowns();" class="text-amber-500 hover:text-amber-400 capitalize px-1 bg-amber-500/10 rounded">Manage</button>
                        </div>
                        <div class="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                            ${state.tenants.map(t => `<button onclick="window.switchTenant('${t.id}')" class="w-full text-left px-2 py-1.5 text-xs rounded transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${t.id === state.activeTenantId ? 'bg-[var(--color-panel-hover)] font-bold border-l-2 border-amber-500' : ''} truncate">${sanitizeHTML(t.name)}</button>`).join('')}
                        </div>
                        <div class="px-2 pb-1 flex flex-wrap gap-1">
                            ${['admin', 'manager', 'accountant', 'sales', 'support'].map(r => `<button onclick="window.switchRole('${r}')" class="text-[8px] px-1 py-0.5 rounded border ${r === role ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : 'border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'} cursor-pointer" title="Switch to ${r.toUpperCase()}">${r.toUpperCase()}</button>`).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div class="flex flex-col gap-1.5">
                        <div class="px-2 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex justify-between items-center">
                            <span>Organization</span>
                            <button onclick="window.navigateTo('admin-orgs'); window.closeAllRailDropdowns();" class="text-amber-500 hover:text-amber-400 capitalize px-1 bg-amber-500/10 rounded">Manage</button>
                        </div>
                        <div class="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                            ${state.organizations.filter(o => o.tenantId === state.activeTenantId).map(o => `<button onclick="window.switchOrganization('${o.id}')" class="w-full text-left px-2 py-1.5 text-xs rounded transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${o.id === state.activeOrgId ? 'bg-[var(--color-panel-hover)] font-bold border-l-2 border-amber-500' : ''} truncate">${sanitizeHTML(o.name)}</button>`).join('') || '<div class="px-2 py-1 text-xs text-[var(--color-text-muted)] italic">No Organizations</div>'}
                        </div>
                        <div class="px-2 pb-1 flex flex-wrap gap-1">
                            ${['admin', 'manager', 'accountant', 'sales', 'support'].map(r => `<button onclick="window.switchRole('${r}')" class="text-[8px] px-1 py-0.5 rounded border ${r === role ? 'bg-amber-500/20 border-amber-500 text-amber-500 font-bold' : 'border-[var(--color-glass-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'} cursor-pointer" title="Switch to ${r.toUpperCase()}">${r.toUpperCase()}</button>`).join('')}
                        </div>
                    </div>

                    <div>
                        <div class="px-2 pb-1 text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex justify-between items-center">
                            <span>Team</span>
                            <button onclick="window.navigateTo('team'); window.closeAllRailDropdowns();" class="text-amber-500 hover:text-amber-400 capitalize px-1 bg-amber-500/10 rounded">Manage</button>
                        </div>
                        <div class="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                            ${state.teams.filter(t => t.orgId === state.activeOrgId).map(t => `<button onclick="window.switchTeam('${t.id}')" class="w-full text-left px-2 py-1.5 text-xs rounded transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${t.id === state.activeTeamId ? 'bg-[var(--color-panel-hover)] font-bold border-l-2 border-amber-500' : ''} truncate">${sanitizeHTML(t.name)}</button>`).join('') || '<div class="px-2 py-1 text-xs text-[var(--color-text-muted)] italic">No Teams</div>'}
                        </div>
                    </div>

                </div>
            </div>
            
            <!-- Project circular button -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button id="project-selector-btn" onclick="window.toggleProjectDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center cursor-pointer transition-all shadow-sm">
                    <svg class="w-4 h-4 text-amber-500 fill-current" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Switch Workspace
                </div>
                <div id="project-selector-dropdown" class="hidden absolute left-full top-0 ml-3 w-56 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-[60] flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex justify-between items-center">
                        <span>Switch Workspace</span>
                        <button onclick="window.navigateTo('workspaces'); window.closeAllRailDropdowns();" class="text-amber-500 hover:text-amber-400 capitalize text-[9px] px-1 bg-amber-500/10 rounded">Manage</button>
                    </div>
                    <div id="project-dropdown-list" class="flex flex-col max-h-48 overflow-y-auto gap-0.5">
                        ${renderProjectDropdownOptions()}
                    </div>
                    <div class="border-t border-[var(--color-glass-border)] my-1"></div>
                    <button onclick="window.createProjectPrompt(); window.closeProjectDropdown();" class="w-full text-left px-2.5 py-2 text-xs text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] rounded-md transition-colors flex items-center gap-2 font-bold cursor-pointer">
                        ${getIconSVG('plus', 'w-3.5 h-3.5')} New Project
                    </button>
                </div>
            </div>

            <!-- Team Workspace Shortcut Pins -->
            ${railProjects.map(p => {
                const isCurrent = state.currentProject === p.id;
                const activeBorderClass = isCurrent ? 'border-amber-500 border-2' : 'border-[var(--color-glass-border)] hover:border-amber-400';
                return `
                <div class="relative group/rail-item w-full flex justify-center">
                    <button onclick="window.selectProject('${p.id}')" class="w-10 h-10 rounded-full bg-amber-500/10 border ${activeBorderClass} flex items-center justify-center font-bold text-xs text-amber-500 cursor-pointer transition-all shadow-sm">
                        ${p.name.substring(0, 2).toUpperCase()}
                    </button>
                    <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                        ${sanitizeHTML(p.name)}
                    </div>
                </div>
                `;
            }).join('')}
            ${railProjects.length > 0 ? `<div class="w-8 border-t border-[var(--color-glass-border)] my-1"></div>` : ''}
        </div>
        
        <div class="flex flex-col items-center gap-4 w-full">
            <!-- Role Switcher (if admin but NOT super_admin — super_admin has their own at top) OR Theme Changer -->
            ${isAdmin && systemRole !== 'super_admin' ? `
            <!-- Role circular switcher button -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.toggleRoleDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center cursor-pointer transition-all shadow-sm">
                    ${getIconSVG('admin-rbac', 'w-4.5 h-4.5 text-[var(--color-text-muted)]')}
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Switch Role (${role.toUpperCase()})
                </div>
                <div id="role-rail-dropdown" class="hidden absolute left-full top-0 ml-3 w-48 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-1 z-30 flex flex-col">
                    <div class="px-3 py-1.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Switch Role</div>
                    <div class="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                        ${['admin', 'manager', 'accountant', 'sales', 'support'].map(r => `<button onclick="window.switchRole('${r}')" class="w-full text-left px-2.5 py-2 text-xs rounded-md transition-colors text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium ${r === role ? 'bg-[var(--color-panel-hover)] font-bold' : ''}">${r.toUpperCase()}</button>`).join('')}
                    </div>
                </div>
            </div>
            ` : `
            <!-- Theme cycle / toggle -->
            <div id="theme-switcher-container" class="flex flex-col bg-[var(--color-panel-hover)] p-0.5 rounded-lg border border-[var(--color-glass-border)] w-10">
                <div class="relative group/rail-item w-full flex justify-center">
                    <button onclick="window.setTheme('day')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'day' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-day">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M20 12h2"/><path d="M2 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                    </button>
                    <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                        Day Mode
                    </div>
                </div>
                <div class="relative group/rail-item w-full flex justify-center">
                    <button onclick="window.setTheme('night')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'night' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-night">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    </button>
                    <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                        Night Mode
                    </div>
                </div>
                <div class="relative group/rail-item w-full flex justify-center">
                    <button onclick="window.setTheme('auto')" class="theme-btn w-full h-8 flex items-center justify-center rounded-md transition-all ${state.theme === 'auto' ? 'bg-background text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" id="theme-btn-auto">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5Z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    </button>
                    <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                        System Mode
                    </div>
                </div>
            </div>
            `}

            <!-- Inbox Button -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.navigateTo('inbox')" class="w-10 h-10 flex items-center justify-center bg-[var(--color-panel-hover)] hover:bg-[var(--color-panel-hover)]/80 text-[var(--color-text-main)] rounded-xl border border-[var(--color-glass-border)] cursor-pointer transition-colors">
                    ${getIconSVG('inbox', 'w-4.5 h-4.5 text-[var(--color-text-muted)]')}
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Inbox
                </div>
            </div>

            <!-- Help Desk Button -->
            <div class="relative group/rail-item w-full flex justify-center">
                <button onclick="window.navigateTo('helpdesk')" class="w-10 h-10 flex items-center justify-center bg-[var(--color-panel-hover)] hover:bg-[var(--color-panel-hover)]/80 text-[var(--color-text-main)] rounded-xl border border-[var(--color-glass-border)] cursor-pointer transition-colors">
                    ${getIconSVG('helpdesk', 'w-4.5 h-4.5 text-[var(--color-text-muted)]')}
                </button>
                <div class="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/rail-item:opacity-100 transition-all duration-200 pointer-events-none translate-x-2 group-hover/rail-item:translate-x-0 whitespace-nowrap z-50 border border-white/10">
                    Help Desk
                </div>
            </div>

            <!-- Profile button with Sign Out dropdown -->
            <div class="relative w-full flex justify-center" id="profile-rail-container">
                <button onclick="window.toggleProfileDropdown(event)" class="w-10 h-10 rounded-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] flex items-center justify-center font-bold text-xs text-[var(--color-text-main)] cursor-pointer transition-all shadow-sm animate-[fadeIn_0.3s_ease-out]">
                    ${displayName.substring(0, 2).toUpperCase()}
                </button>
                <!-- Profile dropdown -->
                <div id="profile-rail-dropdown" class="hidden absolute bottom-0 left-full ml-3 w-52 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl shadow-2xl p-1.5 z-[60] flex flex-col gap-0.5">
                    <div class="px-3 py-2 border-b border-[var(--color-glass-border)] mb-1">
                        <div class="text-xs font-bold text-[var(--color-text-main)] truncate">${displayName}</div>
                        <div class="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">${state.currentUser || ''}</div>
                    </div>
                    <button onclick="window.navigateTo('profile'); window.closeProfileDropdown();" class="w-full text-left px-3 py-2 text-xs rounded-lg text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium flex items-center gap-2.5 transition-colors cursor-pointer">
                        ${getIconSVG('user', 'w-3.5 h-3.5 text-[var(--color-text-muted)]')}
                        Profile Management
                    </button>
                    <button onclick="window.navigateTo('settings'); window.closeProfileDropdown();" class="w-full text-left px-3 py-2 text-xs rounded-lg text-[var(--color-text-main)] hover:bg-[var(--color-panel-hover)] font-medium flex items-center gap-2.5 transition-colors cursor-pointer">
                        ${getIconSVG('settings', 'w-3.5 h-3.5 text-[var(--color-text-muted)]')}
                        Settings
                    </button>
                    <div class="h-px bg-[var(--color-glass-border)] my-1"></div>
                    <button onclick="window.signOut(); window.closeProfileDropdown();" class="w-full text-left px-3 py-2 text-xs rounded-lg text-rose-500 hover:bg-rose-500/10 font-medium flex items-center gap-2.5 transition-colors cursor-pointer">
                        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    </aside>

    <!-- Main Navigation Sidebar -->
    <aside id="main-sidebar" class="bg-[var(--color-glass-bg)] flex flex-col transition-all duration-300 ease-in-out relative overflow-visible ${sidebarCollapsedClass}" style="width: ${state.sidebarCollapsed ? '64' : state.sidebarWidth}px; min-width: ${state.sidebarCollapsed ? '64' : '200'}px; max-width: 400px;">
        <!-- Floating Seam Toggle Pill -->
        <button onclick="window.toggleSidebarCollapse(event)" class="absolute top-1/2 -translate-y-1/2 -right-3 w-[14px] h-10 rounded-full border flex items-center justify-center cursor-pointer shadow-md z-40 transition-all duration-200
            ${state.sidebarCollapsed
                ? 'bg-[var(--color-text-main)] border-[var(--color-text-main)] text-[var(--color-glass-bg)] hover:scale-110 shadow-[0_0_0_3px_var(--color-glass-border)]'
                : 'bg-background border-[var(--color-glass-border)] hover:border-[var(--color-text-main)] text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:scale-110'}">
            ${state.sidebarCollapsed
                ? getIconSVG('chevron-down', 'w-2.5 h-2.5 -rotate-90')
                : getIconSVG('chevron-down', 'w-2.5 h-2.5 rotate-90')}
        </button>
        
        <!-- Sidebar Resizer Handle -->
        ${!state.sidebarCollapsed ? `
        <div id="sidebar-resizer" class="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-purple-500/50 z-[45] transition-colors" onmousedown="window.initSidebarResizer(event)"></div>
        ` : ''}
        <div class="w-full h-full flex flex-col overflow-hidden transition-opacity duration-300 ${sidebarInnerClass}">
            ${!state.sidebarCollapsed ? `
            <div class="mb-3 flex flex-col shrink-0 pr-5">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-inter">Workspace</span>
                <span class="text-sm font-bold text-[var(--color-text-main)] truncate mt-0.5" id="sidebar-active-project-display">${activeProjectName}</span>
            </div>
            
            <div class="mb-4 shrink-0 pr-5">
                <div class="relative cursor-pointer group" onclick="window.toggleCommandMenu(true)">
                    <div class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[var(--color-text-muted)] group-hover:text-[var(--color-text-main)] transition-colors">
                        ${getIconSVG('search', 'w-3.5 h-3.5')}
                    </div>
                    <input type="text" readonly placeholder="Search (⌘K)" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-md py-1.5 pl-8 pr-2 text-xs text-[var(--color-text-main)] cursor-pointer group-hover:border-[var(--color-text-muted)] transition-colors outline-none pointer-events-none">
                </div>
            </div>
            ` : ''}
            
            <nav class="flex flex-col gap-1.5 flex-grow overflow-y-auto w-full ${state.sidebarCollapsed ? 'items-center mt-2' : 'pr-4'}">
                ${renderSidebarNavigation()}
            </nav>
        </div>
    </aside>
    </div>
    <main class="flex-grow flex flex-col p-6 overflow-y-auto mr-0 transition-all duration-300 bg-background" id="main-content-wrapper">
        ${state.isSupportAssistMode ? `
        <div class="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 flex justify-between items-center animate-[fadeIn_0.3s_ease-out]">
            <div class="flex items-center gap-2 font-bold text-xs">
                ⚠️ SUPPORT ASSIST MODE: Viewing data for ${sanitizeHTML(state.team.find(t => t.id === state.assistTargetUserId)?.name || 'Unknown')} (Read-Only)
            </div>
            <button onclick="window.exitSupportAssist()" class="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer">
                Exit Assist Mode
            </button>
        </div>
        ` : ''}
        <header class="flex justify-between items-center pb-4 border-b border-text-main/10 mb-6">
            <h1 id="page-title" class="text-2xl font-bold font-outfit text-text-main">Overview</h1>
            <div class="flex gap-2">
                <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="window.toggleCommandMenu(true)" title="Command Menu (⌘K)">
                    ${getIconSVG('search', 'w-4 h-4')}
                </button>
                
                <!-- Quick Calendar Button -->
                <div class="relative">
                    <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="window.toggleQuickCalendarDropdown(event)" title="Quick Calendar View">
                        ${getIconSVG('calendar', 'w-4 h-4')}
                    </button>
                    <div id="quick-calendar-dropdown" class="hidden absolute right-0 top-full mt-2 w-80 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl shadow-2xl p-4 z-[60] flex flex-col gap-3">
                        <div class="flex justify-between items-center border-b border-[var(--color-glass-border)] pb-2 mb-1">
                            <span class="text-xs font-bold text-[var(--color-text-main)] font-outfit">Schedules Quick-Look</span>
                            <span class="text-[9px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">June 2026</span>
                        </div>
                        <div id="quick-calendar-list" class="max-h-64 overflow-y-auto flex flex-col gap-2 no-scrollbar text-left">
                            <!-- Schedules will be rendered here dynamically -->
                        </div>
                        <button onclick="window.navigateToHub('distribute', 'publish'); window.closeQuickCalendarDropdown();" class="w-full text-center py-2 bg-[var(--color-panel-hover)] hover:bg-[var(--color-panel-hover)]/80 text-[10px] font-bold rounded-lg border border-[var(--color-glass-border)] text-[var(--color-text-main)] transition-colors cursor-pointer">
                            Go to Distribution Calendar →
                        </button>
                    </div>
                </div>

                <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main" onclick="window.toggleAiAssistant(true)" title="AI Assistant">
                    ${getIconSVG('bot', 'w-4 h-4')}
                </button>
                <div class="relative">
                    <button class="w-9 h-9 bg-background border border-text-main/15 rounded-lg flex items-center justify-center hover:border-text-main/45 transition-all cursor-pointer text-text-main relative" onclick="window.toggleNotificationsDropdown(event)" title="Notifications">
                        ${getIconSVG('bell', 'w-4 h-4')}
                        ${(state.notifications && state.notifications.filter(n => !n.isRead && n.targetUsers.includes(state.team.find(t => t.email === state.currentUser)?.id || '')).length > 0) ? `<span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>` : ''}
                    </button>
                    <div id="notifications-dropdown" class="hidden absolute right-0 top-full mt-2 w-80 bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-lg shadow-xl p-0 z-[60] flex flex-col">
                        <div class="px-3 py-2 border-b border-text-main/10 flex justify-between items-center bg-text-main/5">
                            <span class="text-xs font-bold text-[var(--color-text-main)]">Notifications</span>
                            <button onclick="window.markAllNotificationsRead()" class="text-[10px] text-purple-400 hover:text-purple-300">Mark all read</button>
                        </div>
                        <div class="max-h-80 overflow-y-auto" id="notifications-list">
                            ${(() => {
                                const userNotifs = (state.notifications || []).filter(n => n.targetUsers.includes(state.team.find(t => t.email === state.currentUser)?.id || '')).sort((a, b) => b.timestamp - a.timestamp);
                                if (userNotifs.length === 0) return '<div class="p-4 text-center text-xs text-text-muted">No notifications.</div>';
                                return userNotifs.map(n => `
                                    <div class="p-3 border-b border-text-main/10 last:border-0 ${!n.isRead ? 'bg-purple-500/10' : ''} cursor-pointer hover:bg-text-main/5 transition-colors" onclick="window.handleNotificationClick('${n.id}')">
                                        <div class="flex justify-between items-start mb-1">
                                            <span class="font-bold text-xs text-text-main">${sanitizeHTML(n.title)}</span>
                                            <span class="text-[9px] text-text-muted">${new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <div class="text-[10px] text-text-muted mb-2">${sanitizeHTML(n.message)}</div>
                                        ${n.actionData?.type === 'access_request' ? `
                                        <div class="text-[9px] font-bold text-blue-400 bg-blue-500/10 inline-block px-2 py-0.5 rounded uppercase tracking-wider mt-1">Pending Access Request</div>
                                        ` : ''}
                                    </div>
                                `).join('');
                            })()}
                        </div>
                    </div>
                </div>
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

<!-- Unified Dialog Overlay (Custom replacement for prompt, confirm, alert) -->
<div id="global-dialog-overlay" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-[100] animate-[fadeIn_0.15s_ease-out]">
    <div id="global-dialog-box" class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col p-6 gap-4">
        <h3 id="global-dialog-title" class="text-base font-bold font-outfit text-[var(--color-text-main)]">Dialog Title</h3>
        <p id="global-dialog-message" class="text-xs text-[var(--color-text-muted)] leading-relaxed hidden">Dialog Message</p>
        
        <!-- Prompt/Input container -->
        <div id="global-dialog-input-container" class="hidden">
            <label id="global-dialog-input-label" class="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1.5">Input Label</label>
            <input id="global-dialog-input" type="text" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-3 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-violet-500 transition-colors">
        </div>

        <!-- Form container (multiple fields) -->
        <div id="global-dialog-form-container" class="hidden flex flex-col gap-3"></div>
        
        <div class="flex justify-end items-center gap-2.5 mt-2">
            <button id="global-dialog-cancel-btn" class="px-4 py-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-lg text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer">Cancel</button>
            <button id="global-dialog-confirm-btn" class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">Confirm</button>
        </div>
    </div>
</div>
`;
}

if (typeof window !== 'undefined') {
    const w = window as any;
    
    w.toggleNotificationsDropdown = (e: MouseEvent) => {
        e.stopPropagation();
        w.closeAllRailDropdowns();
        const el = document.getElementById('notifications-dropdown');
        if (el) el.classList.toggle('hidden');
    };
    
    w.markAllNotificationsRead = () => {
        import('../state').then(m => {
            const userId = m.state.team.find(t => t.email === m.state.currentUser)?.id;
            if (m.state.notifications && userId) {
                m.state.notifications.forEach(n => {
                    if (n.targetUsers.includes(userId)) n.isRead = true;
                });
                m.notifyStateChange();
            }
        });
    };
    
    w.handleNotificationClick = (id: string) => {
        import('../state').then(m => {
            const notif = m.state.notifications?.find(n => n.id === id);
            if (notif) {
                notif.isRead = true;
                if (notif.actionData?.type === 'access_request') {
                    // Navigate to helpdesk
                    w.navigateTo('helpdesk');
                }
                m.notifyStateChange();
            }
        });
    };
    
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

    w.showConfirmDialog = (title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const overlay = document.getElementById('global-dialog-overlay');
            const titleEl = document.getElementById('global-dialog-title');
            const messageEl = document.getElementById('global-dialog-message');
            const inputContainer = document.getElementById('global-dialog-input-container');
            const formContainer = document.getElementById('global-dialog-form-container');
            const confirmBtn = document.getElementById('global-dialog-confirm-btn');
            const cancelBtn = document.getElementById('global-dialog-cancel-btn');

            if (!overlay || !titleEl || !messageEl || !inputContainer || !formContainer || !confirmBtn || !cancelBtn) {
                resolve(false);
                return;
            }

            titleEl.textContent = title;
            messageEl.textContent = message;
            messageEl.classList.remove('hidden');
            inputContainer.classList.add('hidden');
            formContainer.classList.add('hidden');
            cancelBtn.classList.remove('hidden');
            overlay.classList.remove('hidden');

            const onConfirm = (e: Event) => {
                e.preventDefault();
                cleanup();
                resolve(true);
            };
            const onCancel = (e: Event) => {
                e.preventDefault();
                cleanup();
                resolve(false);
            };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                overlay.classList.add('hidden');
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    };

    w.showPromptDialog = (title: string, label: string, defaultValue = '', placeholder = ''): Promise<string | null> => {
        return new Promise((resolve) => {
            const overlay = document.getElementById('global-dialog-overlay');
            const titleEl = document.getElementById('global-dialog-title');
            const messageEl = document.getElementById('global-dialog-message');
            const inputContainer = document.getElementById('global-dialog-input-container');
            const inputLabel = document.getElementById('global-dialog-input-label');
            const input = document.getElementById('global-dialog-input') as HTMLInputElement;
            const formContainer = document.getElementById('global-dialog-form-container');
            const confirmBtn = document.getElementById('global-dialog-confirm-btn');
            const cancelBtn = document.getElementById('global-dialog-cancel-btn');

            if (!overlay || !titleEl || !messageEl || !inputContainer || !inputLabel || !input || !formContainer || !confirmBtn || !cancelBtn) {
                resolve(null);
                return;
            }

            titleEl.textContent = title;
            messageEl.classList.add('hidden');
            
            inputContainer.classList.remove('hidden');
            inputLabel.textContent = label;
            input.value = defaultValue;
            input.placeholder = placeholder;
            
            formContainer.classList.add('hidden');
            cancelBtn.classList.remove('hidden');
            overlay.classList.remove('hidden');
            input.focus();

            const onConfirm = (e: Event) => {
                e.preventDefault();
                const val = input.value;
                cleanup();
                resolve(val);
            };
            const onCancel = (e: Event) => {
                e.preventDefault();
                cleanup();
                resolve(null);
            };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                overlay.classList.add('hidden');
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    };

    w.showFormDialog = (title: string, fields: {key: string, label: string, type: string, placeholder?: string, defaultValue?: any, options?: {value: string, label: string}[] }[]): Promise<Record<string, any> | null> => {
        return new Promise((resolve) => {
            const overlay = document.getElementById('global-dialog-overlay');
            const titleEl = document.getElementById('global-dialog-title');
            const messageEl = document.getElementById('global-dialog-message');
            const inputContainer = document.getElementById('global-dialog-input-container');
            const formContainer = document.getElementById('global-dialog-form-container');
            const confirmBtn = document.getElementById('global-dialog-confirm-btn');
            const cancelBtn = document.getElementById('global-dialog-cancel-btn');

            if (!overlay || !titleEl || !messageEl || !inputContainer || !formContainer || !confirmBtn || !cancelBtn) {
                resolve(null);
                return;
            }

            titleEl.textContent = title;
            messageEl.classList.add('hidden');
            inputContainer.classList.add('hidden');
            formContainer.classList.remove('hidden');
            cancelBtn.classList.remove('hidden');

            formContainer.innerHTML = fields.map(f => {
                if (f.type === 'select') {
                    return `
                    <div>
                        <label class="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">${f.label}</label>
                        <select id="form-dialog-field-${f.key}" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-violet-500 cursor-pointer">
                            ${f.options?.map(o => `<option value="${o.value}" ${o.value === f.defaultValue ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>`;
                }
                return `
                <div>
                    <label class="block text-[10px] font-bold text-[var(--color-text-muted)] uppercase mb-1">${f.label}</label>
                    <input id="form-dialog-field-${f.key}" type="${f.type}" value="${f.defaultValue || ''}" placeholder="${f.placeholder || ''}" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-violet-500">
                </div>`;
            }).join('');

            overlay.classList.remove('hidden');

            const onConfirm = (e: Event) => {
                e.preventDefault();
                const results: Record<string, any> = {};
                fields.forEach(f => {
                    const el = document.getElementById(`form-dialog-field-${f.key}`) as any;
                    if (el) {
                        results[f.key] = el.type === 'checkbox' ? el.checked : el.value;
                    }
                });
                cleanup();
                resolve(results);
            };
            const onCancel = (e: Event) => {
                e.preventDefault();
                cleanup();
                resolve(null);
            };
            const cleanup = () => {
                confirmBtn.removeEventListener('click', onConfirm);
                cancelBtn.removeEventListener('click', onCancel);
                overlay.classList.add('hidden');
            };

            confirmBtn.addEventListener('click', onConfirm);
            cancelBtn.addEventListener('click', onCancel);
        });
    };

    w.initSidebarResizer = (e: MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const sidebar = document.getElementById('main-sidebar');
        if (!sidebar) return;
        const startWidth = sidebar.offsetWidth;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            // enforce min-max visually immediately (state and render will follow on mouseup)
            if (newWidth >= 200 && newWidth <= 400) {
                sidebar.style.width = newWidth + 'px';
            }
        };

        const onMouseUp = (upEvent: MouseEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            import('../state').then(m => {
                const finalWidth = sidebar.offsetWidth;
                if (finalWidth >= 200 && finalWidth <= 400) {
                    m.state.sidebarWidth = finalWidth;
                    m.notifyStateChange();
                }
            });
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    w.toggleHierarchyDropdown = (e: MouseEvent) => {
        e.stopPropagation();
        const el = document.getElementById('hierarchy-rail-dropdown');
        const isHidden = el?.classList.contains('hidden');
        w.closeAllRailDropdowns();
        if (isHidden && el) el.classList.remove('hidden');
    };

    w.toggleQuickCalendarDropdown = (e: MouseEvent) => {
        e.stopPropagation();
        const el = document.getElementById('quick-calendar-dropdown');
        const show = el?.classList.contains('hidden');
        w.closeAllRailDropdowns();
        if (show) {
            el?.classList.remove('hidden');
            // Render schedules dynamically
            const listEl = document.getElementById('quick-calendar-list');
            if (listEl) {
                const schedules = state.publishSchedules || [];
                if (schedules.length === 0) {
                    listEl.innerHTML = `<div class="text-[10px] text-zinc-500 py-4 text-center">No campaigns scheduled this month.</div>`;
                } else {
                    listEl.innerHTML = schedules.map(s => {
                        const dateStr = new Date(s.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        return `
                        <div class="bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-lg p-2.5 flex flex-col gap-1.5">
                            <div class="flex justify-between items-center text-[9px] text-[var(--color-text-muted)]">
                                <span class="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">${s.status}</span>
                                <span>${dateStr}</span>
                            </div>
                            <div class="text-xs font-bold text-[var(--color-text-main)] truncate">${sanitizeHTML(s.title)}</div>
                            <div class="text-[9px] text-[var(--color-text-muted)] truncate">Channels: ${s.channels.join(', ')}</div>
                        </div>`;
                    }).join('');
                }
            }
        }
    };
    
    w.closeQuickCalendarDropdown = () => {
        document.getElementById('quick-calendar-dropdown')?.classList.add('hidden');
    };
}
