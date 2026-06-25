import { state, notifyStateChange } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

export function renderTeamView(): string {
    const list = state.team;
    const teamsList = state.teams || [];
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned);
    
    // Filtering teams
    const activeTeams = teamsList.filter(t => !t.isArchived);
    const archivedTeams = teamsList.filter(t => t.isArchived);

    // Selected entity for activity tracking / KPI inspection (stored in temporary session/global state or defaulted)
    const teamsSession = (window as any).__teamViewSession || { activeTab: 'teams', selectedEntityId: 'global' };
    (window as any).__teamViewSession = teamsSession;

    // Calculate metrics for selected entity
    let kpiHtml = "";
    let logsHtml = "";
    let entityLabel = "Global Workspace Analytics";

    const filterLogs = state.activityLogs || [];
    
    if (teamsSession.selectedEntityId === 'global') {
        const totalProjects = activeProjects.length;
        const totalTasksDone = state.kanbanState.filter(t => t.status === 'done').length;
        const totalSpent = state.projects.reduce((sum, p) => sum + (p.spent || 0), 0);
        const totalDealsWon = state.contacts.filter(c => c.dealStage === 'won').reduce((sum, c) => sum + c.dealValue, 0);

        kpiHtml = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Active Folders</span>
                <span class="text-xl font-bold font-mono">${totalProjects}</span>
            </div>
            <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Tasks Completed</span>
                <span class="text-xl font-bold font-mono">${totalTasksDone}</span>
            </div>
            <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Total Spent</span>
                <span class="text-xl font-bold font-mono">$${totalSpent.toLocaleString()}</span>
            </div>
            <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Deals Won</span>
                <span class="text-xl font-bold font-mono">$${totalDealsWon.toLocaleString()}</span>
            </div>
        </div>
        `;

        logsHtml = filterLogs.slice(-10).reverse().map(l => `
            <div class="flex justify-between items-start gap-4 p-2.5 border-b border-text-main/5 hover:bg-text-main/5 rounded transition-colors text-xs">
                <div>
                    <span class="font-bold text-text-main block">${sanitizeHTML(l.action)}</span>
                    <span class="text-text-muted text-[10px] block mt-0.5">${sanitizeHTML(l.details)}</span>
                </div>
                <span class="text-[10px] text-text-muted font-mono whitespace-nowrap">${formatTime(l.timestamp)}</span>
            </div>
        `).join('') || `<div class="text-center text-text-muted py-8 text-xs">No activity logged yet.</div>`;

    } else if (teamsSession.selectedEntityId.startsWith('t-')) {
        const team = teamsList.find(t => t.id === teamsSession.selectedEntityId);
        if (team) {
            entityLabel = `Team Profile: ${team.name} KPIs`;
            const teamMembersCount = team.memberIds.length;
            const teamProjects = activeProjects.filter(p => team.projectIds.includes(p.id));
            const teamProjectIds = teamProjects.map(p => p.id);
            const teamTasksDone = state.kanbanState.filter(t => teamProjectIds.includes(t.projectId) && t.status === 'done').length;
            const teamSpent = teamProjects.reduce((sum, p) => sum + (p.spent || 0), 0);

            kpiHtml = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Team Members</span>
                    <span class="text-xl font-bold font-mono">${teamMembersCount}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Workspaces</span>
                    <span class="text-xl font-bold font-mono">${teamProjects.length}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Tasks Solved</span>
                    <span class="text-xl font-bold font-mono">${teamTasksDone}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Spent Budget</span>
                    <span class="text-xl font-bold font-mono">$${teamSpent.toLocaleString()}</span>
                </div>
            </div>
            `;

            const teamLogs = filterLogs.filter(l => l.teamId === team.id);
            logsHtml = teamLogs.slice(-10).reverse().map(l => `
                <div class="flex justify-between items-start gap-4 p-2.5 border-b border-text-main/5 hover:bg-text-main/5 rounded transition-colors text-xs">
                    <div>
                        <span class="font-bold text-text-main block">${sanitizeHTML(l.action)}</span>
                        <span class="text-text-muted text-[10px] block mt-0.5">${sanitizeHTML(l.details)}</span>
                    </div>
                    <span class="text-[10px] text-text-muted font-mono whitespace-nowrap">${formatTime(l.timestamp)}</span>
                </div>
            `).join('') || `<div class="text-center text-text-muted py-8 text-xs">No team actions archived yet.</div>`;
        }
    } else {
        const project = state.projects.find(p => p.id === teamsSession.selectedEntityId);
        if (project) {
            entityLabel = `Campaign Focus: ${project.name} KPIs`;
            const projTasks = state.kanbanState.filter(t => t.projectId === project.id);
            const doneTasks = projTasks.filter(t => t.status === 'done').length;
            const openTasks = projTasks.length - doneTasks;
            const projBudget = project.budgetLimit || 0;
            const projSpent = project.spent || 0;

            kpiHtml = `
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Tasks Completed</span>
                    <span class="text-xl font-bold font-mono">${doneTasks}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Open Issues</span>
                    <span class="text-xl font-bold font-mono">${openTasks}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Budget Allocation</span>
                    <span class="text-xl font-bold font-mono">$${projBudget.toLocaleString()}</span>
                </div>
                <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-1">Spent to Date</span>
                    <span class="text-xl font-bold font-mono">$${projSpent.toLocaleString()}</span>
                </div>
            </div>
            `;

            const projLogs = filterLogs.filter(l => l.projectId === project.id);
            logsHtml = projLogs.slice(-10).reverse().map(l => `
                <div class="flex justify-between items-start gap-4 p-2.5 border-b border-text-main/5 hover:bg-text-main/5 rounded transition-colors text-xs">
                    <div>
                        <span class="font-bold text-text-main block">${sanitizeHTML(l.action)}</span>
                        <span class="text-text-muted text-[10px] block mt-0.5">${sanitizeHTML(l.details)}</span>
                    </div>
                    <span class="text-[10px] text-text-muted font-mono whitespace-nowrap">${formatTime(l.timestamp)}</span>
                </div>
            `).join('') || `<div class="text-center text-text-muted py-8 text-xs">No activity logged for this campaign workspace.</div>`;
        }
    }

    return `
    <div class="fade-in flex flex-col gap-8 max-w-5xl text-text-main">
        <!-- Team Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/15 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-bold font-outfit">Team Office</h2>
                <p class="text-xs text-text-muted font-inter">Manage organizations, create custom work teams, and distribute campaign access permissions.</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="window.createTeamPrompt()" class="px-4 py-2.5 bg-text-main text-background hover:bg-text-main/80 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm">
                    ${getIconSVG('plus', 'w-3.5 h-3.5 mr-1 inline')} Create Team
                </button>
            </div>
        </div>

        <!-- Layout Split: Left (Teams & Directory), Right (KPIs & Activity Feed) -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Tabs: Active vs Inactive Teams -->
                <div class="flex gap-4 border-b border-text-main/10 pb-2">
                    <button onclick="window.switchTeamViewTab('teams')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'teams' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Active Teams (${activeTeams.length})</button>
                    <button onclick="window.switchTeamViewTab('archived')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'archived' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Archived Records (${archivedTeams.length})</button>
                    <button onclick="window.switchTeamViewTab('directory')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'directory' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Directory Presence</button>
                </div>

                <!-- Active / Archived Teams panel -->
                ${(teamsSession.activeTab === 'teams' || teamsSession.activeTab === 'archived') ? `
                <div class="flex flex-col gap-4">
                    ${(teamsSession.activeTab === 'teams' ? activeTeams : archivedTeams).map(team => {
                        const isArchived = team.isArchived;
                        return `
                        <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                            <div class="flex justify-between items-start border-b border-text-main/10 pb-3">
                                <div>
                                    <h4 class="font-bold text-text-main text-sm font-outfit">${sanitizeHTML(team.name)}</h4>
                                    <span class="text-[9px] text-text-muted font-mono uppercase">ID: ${team.id}</span>
                                </div>
                                <div class="flex gap-2">
                                    <button onclick="window.archiveTeamToggle('${team.id}', ${!isArchived})" class="text-text-muted hover:text-text-main p-1.5 border border-text-main/10 hover:border-text-main/20 rounded" title="${isArchived ? 'Restore Team' : 'Archive Team'}">
                                        ${isArchived ? getIconSVG('external-link', 'w-3.5 h-3.5') : getIconSVG('archive', 'w-3.5 h-3.5')}
                                    </button>
                                    <button onclick="window.deleteTeamAction('${team.id}')" class="text-red-500 hover:text-red-600 p-1.5 border border-red-500/10 hover:border-red-500/20 rounded" title="Dissolve Permanently">
                                        ${getIconSVG('trash', 'w-3.5 h-3.5')}
                                    </button>
                                </div>
                            </div>

                            <!-- Group People (Only editable if active) -->
                            <div>
                                <span class="text-[9px] text-text-muted font-bold block uppercase mb-2">Team Members</span>
                                <div class="flex flex-wrap gap-1.5">
                                    ${list.map(member => {
                                        const isChecked = team.memberIds.includes(member.id);
                                        return `
                                        <button onclick="${isArchived ? '' : `window.toggleTeamMemberAccess('${team.id}', '${member.id}')`}" 
                                                class="px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer
                                                ${isChecked ? 'bg-text-main text-background border-text-main' : 'bg-background border-text-main/15 text-text-muted hover:border-text-main/35'}
                                                ${isArchived ? 'opacity-70 cursor-not-allowed' : ''}">
                                            <span class="w-1.5 h-1.5 rounded-full ${member.avatarColor}"></span>
                                            <span>${sanitizeHTML(member.name)}</span>
                                        </button>
                                        `;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- Campaign Workspaces Access -->
                            <div>
                                <span class="text-[9px] text-text-muted font-bold block uppercase mb-2">Workspace Access Control</span>
                                <div class="flex flex-col gap-1.5">
                                    ${activeProjects.map(proj => {
                                        const hasAccess = team.projectIds.includes(proj.id);
                                        return `
                                        <div class="flex justify-between items-center bg-text-main/5 p-2 rounded-lg border border-text-main/5 hover:border-text-main/10 transition-all text-xs">
                                            <span class="font-semibold truncate flex items-center gap-2">${getIconSVG('folder', 'w-3.5 h-3.5 text-text-muted')} ${sanitizeHTML(proj.name)}</span>
                                            <button onclick="${isArchived ? '' : `window.toggleTeamWorkspaceAccess('${team.id}', '${proj.id}')`}"
                                                    class="px-2 py-0.5 rounded border text-[9px] font-bold transition-all cursor-pointer
                                                    ${hasAccess ? 'bg-text-main text-background border-text-main' : 'bg-background border-text-main/15 text-text-muted hover:border-text-main/40'}
                                                    ${isArchived ? 'opacity-70 cursor-not-allowed' : ''}">
                                                ${hasAccess ? 'Revoke' : 'Grant'}
                                            </button>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                        </div>
                        `;
                    }).join('')}

                    ${(teamsSession.activeTab === 'teams' ? activeTeams : archivedTeams).length === 0 ? `
                    <div class="border border-dashed border-text-main/15 p-12 text-center text-text-muted text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                        <span>${getIconSVG('info', 'w-8 h-8')}</span>
                        <h4 class="font-bold text-text-main">No records available</h4>
                        <p class="text-[11px] max-w-xs leading-normal">Teams in this tab status category are currently empty.</p>
                    </div>
                    ` : ''}
                </div>
                ` : `
                <!-- Presence board Directory -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    ${list.map(tm => {
                        let statusDot = tm.status === 'active' ? 'bg-emerald-400 animate-pulse' : tm.status === 'meeting' ? 'bg-rose-500' : tm.status === 'vacation' ? 'bg-amber-400' : 'bg-slate-500';
                        return `
                        <div class="bg-background border border-text-main/15 p-4 rounded-xl flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full ${tm.avatarColor} flex items-center justify-center font-bold text-white text-sm relative">
                                ${tm.name.substring(0, 2).toUpperCase()}
                                <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-background border border-background flex items-center justify-center">
                                    <span class="w-2 h-2 rounded-full ${statusDot}"></span>
                                </span>
                            </div>
                            <div>
                                <span class="font-bold text-text-main block text-xs">${sanitizeHTML(tm.name)}</span>
                                <span class="text-[10px] text-text-muted block">${sanitizeHTML(tm.role)}</span>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                `}
            </div>

            <!-- Right Column: KPIs & Folder/Team Activity Logs -->
            <div class="flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm">Monitor Logs & KPIs</h3>
                    
                    <div class="flex flex-col gap-2">
                        <label class="text-[9px] text-text-muted font-bold block uppercase">Select Inspector Feed</label>
                        <select onchange="window.switchTeamActivityInspector(this.value)" class="w-full bg-background border border-text-main/15 text-xs text-text-main p-2 rounded-lg cursor-pointer focus:outline-none focus:border-text-main">
                            <option value="global" ${teamsSession.selectedEntityId === 'global' ? 'selected' : ''}>🌐 Global Workspace</option>
                            <optgroup label="Work Teams">
                                ${activeTeams.map(t => `<option value="${t.id}" ${teamsSession.selectedEntityId === t.id ? 'selected' : ''}>👥 ${sanitizeHTML(t.name)}</option>`).join('')}
                                ${archivedTeams.map(t => `<option value="${t.id}" ${teamsSession.selectedEntityId === t.id ? 'selected' : ''}>📦 (Archived) ${sanitizeHTML(t.name)}</option>`).join('')}
                            </optgroup>
                            <optgroup label="Campaign Folders">
                                ${activeProjects.map(p => `<option value="${p.id}" ${teamsSession.selectedEntityId === p.id ? 'selected' : ''}>📁 ${sanitizeHTML(p.name)}</option>`).join('')}
                            </optgroup>
                        </select>
                    </div>

                    <div class="border-t border-text-main/10 pt-4">
                        <h4 class="font-bold text-xs mb-3 text-text-main">${entityLabel}</h4>
                        ${kpiHtml}
                    </div>

                    <div class="border-t border-text-main/10 pt-4">
                        <h4 class="font-bold text-xs mb-3 text-text-main">Activity Log Stream</h4>
                        <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                            ${logsHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.switchTeamViewTab = (tab: string) => {
        const session = w.__teamViewSession || { selectedEntityId: 'global' };
        session.activeTab = tab;
        w.__teamViewSession = session;
        notifyStateChange();
    };

    w.switchTeamActivityInspector = (entityId: string) => {
        const session = w.__teamViewSession || { activeTab: 'teams' };
        session.selectedEntityId = entityId;
        w.__teamViewSession = session;
        notifyStateChange();
    };

    w.updateMyPresenceStatus = (newStatus: string) => {
        const me = state.team.find(tm => tm.id === 'tm1');
        if (me) {
            me.status = newStatus as any;
            saveState();
            notifyStateChange();
        }
    };
}
