import { state, notifyStateChange, hireCreator, completeOnboardingTask, runMonthlyPayroll, addCandidate, saveState } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

// Custom override for alert to use premium toast notifications
const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('converted') || msg.toLowerCase().includes('saved') || msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('paid') || msg.toLowerCase().includes('hired');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

export function renderTeamView(): string {
    const list = state.team;
    const teamsList = state.teams || [];
    const activeProjects = state.projects.filter(p => !p.isArchived && !p.isBinned);
    const role = state.activeRole || 'admin';
    
    // Filtering teams
    const activeTeams = teamsList.filter(t => !t.isArchived);
    const archivedTeams = teamsList.filter(t => t.isArchived);

    // Selected entity for activity tracking / KPI inspection
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
        const totalDealsWon = state.contacts.filter(c => c.dealStage === 'active').reduce((sum, c) => sum + c.dealValue, 0);

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

    // Tab content logic
    let tabContentHTML = "";
    if (teamsSession.activeTab === 'teams' || teamsSession.activeTab === 'archived') {
        const tenantOrgs = state.organizations.filter(o => o.tenantId === state.activeTenantId);
        
        tabContentHTML = `
        <div class="flex flex-col gap-8">
            ${tenantOrgs.map(org => {
                const orgTeams = (teamsSession.activeTab === 'teams' ? activeTeams : archivedTeams).filter(t => t.orgId === org.id);
                if (orgTeams.length === 0) return '';

                return `
                <div class="flex flex-col gap-4">
                    <h3 class="text-lg font-bold font-outfit border-b border-text-main/20 pb-2 pl-2">${sanitizeHTML(org.name)}</h3>
                    <div class="grid grid-cols-1 gap-4">
                        ${orgTeams.map(team => {
                            const isArchived = team.isArchived;
                            return `
                            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                                <div class="flex justify-between items-start border-b border-text-main/10 pb-3">
                                    <div>
                                        <h4 class="font-bold text-text-main text-sm font-outfit">${sanitizeHTML(team.name)}</h4>
                                        <span class="text-[9px] text-text-muted font-mono uppercase">ID: ${team.id}</span>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="window.archiveTeamToggle('${team.id}', ${!isArchived})" class="text-text-muted hover:text-text-main p-1.5 border border-text-main/10 hover:border-text-main/20 rounded cursor-pointer animate-none" title="${isArchived ? 'Restore Team' : 'Archive Team'}">
                                            ${isArchived ? getIconSVG('external-link', 'w-3.5 h-3.5') : getIconSVG('archive', 'w-3.5 h-3.5')}
                                        </button>
                                        <button onclick="window.deleteTeamAction('${team.id}')" class="text-red-500 hover:text-red-600 p-1.5 border border-red-500/10 hover:border-red-500/20 rounded cursor-pointer" title="Dissolve Permanently">
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
                    </div>
                </div>
                `;
            }).join('')}

            ${tenantOrgs.every(org => (teamsSession.activeTab === 'teams' ? activeTeams : archivedTeams).filter(t => t.orgId === org.id).length === 0) ? `
            <div class="border border-dashed border-text-main/15 p-12 text-center text-text-muted text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <span>${getIconSVG('info', 'w-8 h-8')}</span>
                <h4 class="font-bold text-text-main">No records available</h4>
                <p class="text-[11px] max-w-xs leading-normal">Teams in this tab status category are currently empty for this Tenant.</p>
            </div>
            ` : ''}
        </div>
        `;
    } else if (teamsSession.activeTab === 'directory') {
        const tenantOrgs = state.organizations.filter(o => o.tenantId === state.activeTenantId);
        tabContentHTML = `
        <div class="flex flex-col gap-8">
            ${tenantOrgs.map(org => {
                const orgTeams = state.teams.filter(t => !t.isArchived && t.orgId === org.id);
                if (orgTeams.length === 0) return '';
                
                return `
                <div class="flex flex-col gap-4">
                    <h3 class="text-lg font-bold font-outfit border-b border-text-main/20 pb-2 pl-2">${sanitizeHTML(org.name)} Directory</h3>
                    <div class="flex flex-col gap-6">
                        ${orgTeams.map(team => {
                            const teamMembers = list.filter(tm => team.memberIds.includes(tm.id));
                            if (teamMembers.length === 0) return '';
                            return `
                            <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                                <h4 class="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">${sanitizeHTML(team.name)}</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    ${teamMembers.map(tm => {
                                        let statusDot = tm.status === 'active' ? 'bg-emerald-400 animate-pulse' : tm.status === 'meeting' ? 'bg-rose-500' : tm.status === 'vacation' ? 'bg-amber-400' : 'bg-slate-500';
                                        return `
                                        <div class="bg-text-main/5 border border-text-main/10 p-3 rounded-lg flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full ${tm.avatarColor} flex items-center justify-center font-bold text-white text-xs relative shrink-0">
                                                ${tm.name.substring(0, 2).toUpperCase()}
                                                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-background border border-background flex items-center justify-center">
                                                    <span class="w-1.5 h-1.5 rounded-full ${statusDot}"></span>
                                                </span>
                                            </div>
                                            <div class="overflow-hidden">
                                                <span class="font-bold text-text-main block text-[11px] truncate">${sanitizeHTML(tm.name)}</span>
                                                <span class="text-[9px] text-text-muted block truncate">${sanitizeHTML(tm.role)}</span>
                                            </div>
                                        </div>
                                        `;
                                    }).join('')}
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                `;
            }).join('')}
            ${tenantOrgs.every(org => state.teams.filter(t => !t.isArchived && t.orgId === org.id).length === 0) ? `
            <div class="border border-dashed border-text-main/15 p-12 text-center text-text-muted text-xs rounded-2xl flex flex-col items-center justify-center gap-2">
                <span>${getIconSVG('team', 'w-8 h-8')}</span>
                <h4 class="font-bold text-text-main">Directory Empty</h4>
                <p class="text-[11px] max-w-xs leading-normal">No users found in active teams for this tenant.</p>
            </div>
            ` : ''}
        </div>
        `;
    } else if (teamsSession.activeTab === 'recruiting') {
        const candidates = state.candidates || [];
        tabContentHTML = `
        <div class="flex flex-col gap-6">
            <!-- Log Application Form -->
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                <h3 class="font-bold text-sm font-outfit">Log Creator/Freelancer Application</h3>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Candidate Name</label>
                        <input id="cand-name" type="text" placeholder="e.g. Elena Rostova" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Target Role</label>
                        <input id="cand-role" type="text" placeholder="e.g. Social Media Copywriter" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Email Address</label>
                        <div class="flex gap-2">
                            <input id="cand-email" type="email" placeholder="elena@writer.io" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                            <button onclick="window.submitCandidateApplication()" class="px-4 bg-text-main text-background font-bold text-xs rounded-xl hover:bg-text-main/80 transition-colors cursor-pointer">Submit</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Candidate Pipeline -->
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                <h3 class="font-bold text-sm font-outfit">Talent Pipeline Catalog</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-text-main/20 text-text-muted">
                                <th class="py-2.5 font-bold">Candidate</th>
                                <th class="py-2.5 font-bold">Role</th>
                                <th class="py-2.5 font-bold">Email</th>
                                <th class="py-2.5 font-bold text-center">Status</th>
                                <th class="py-2.5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${candidates.length > 0 ? candidates.map(c => {
                                let badgeColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                if (c.status === 'hired') badgeColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                if (c.status === 'offered') badgeColor = 'text-purple-500 bg-purple-500/10 border-purple-500/20';
                                if (c.status === 'rejected') badgeColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                                return `
                                <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                    <td class="py-3 font-semibold text-text-main">${sanitizeHTML(c.name)}</td>
                                    <td class="py-3">${sanitizeHTML(c.role)}</td>
                                    <td class="py-3 font-mono text-[11px]">${sanitizeHTML(c.email)}</td>
                                    <td class="py-3 text-center">
                                        <span class="px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase ${badgeColor}">
                                            ${c.status}
                                        </span>
                                    </td>
                                    <td class="py-3 text-center">
                                        ${c.status !== 'hired' ? `
                                            <button onclick="window.hireCandidateAction('${c.id}')" class="px-3 py-1 bg-text-main text-background rounded text-[10px] font-bold hover:bg-text-main/80 transition-colors cursor-pointer">
                                                Hire Creator
                                            </button>
                                        ` : `<span class="text-emerald-500 font-bold">Onboarded</span>`}
                                    </td>
                                </tr>
                                `;
                            }).join('') : `
                            <tr>
                                <td colspan="5" class="text-center py-8 text-text-muted">No candidate profiles registered yet. Log an application above.</td>
                            </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    } else if (teamsSession.activeTab === 'onboarding') {
        const employees = state.employees || [];
        tabContentHTML = `
        <div class="flex flex-col gap-6">
            <!-- Creator Checklists -->
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                <h3 class="font-bold text-sm font-outfit">Influencer & Creator Onboarding Checklists</h3>
                <div class="flex flex-col gap-4">
                    ${employees.length > 0 ? employees.map(emp => {
                        const totalTasks = emp.onboardingTasks.length;
                        const completedTasks = emp.onboardingTasks.filter(t => t.completed).length;
                        const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                        return `
                        <div class="border border-text-main/10 p-4 rounded-xl flex flex-col gap-3 bg-text-main/5">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-bold text-text-main text-sm">${sanitizeHTML(emp.name)}</h4>
                                    <span class="text-[10px] text-text-muted">${sanitizeHTML(emp.role)} • Joined: ${emp.joinedDate}</span>
                                </div>
                                <span class="font-mono text-xs font-bold text-text-main bg-text-main/10 px-2 py-0.5 rounded">${pct}% Done</span>
                            </div>
                            <div class="w-full bg-text-main/10 h-2 rounded-full overflow-hidden">
                                <div class="bg-text-main h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
                            </div>
                            
                            <div class="mt-2 flex flex-col gap-2 bg-background border border-text-main/5 p-3 rounded-lg">
                                <span class="text-[9px] text-text-muted font-bold block uppercase tracking-wider mb-1">Onboarding Checklist Tasks</span>
                                ${emp.onboardingTasks.map((t, idx) => `
                                    <label class="flex items-center gap-2.5 text-xs text-text-muted hover:text-text-main cursor-pointer select-none">
                                        <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="window.toggleOnboardingTaskAction('${emp.id}', ${idx}, this.checked)" class="rounded border-text-main/20 text-text-main focus:ring-text-main cursor-pointer">
                                        <span class="${t.completed ? 'line-through text-text-muted' : 'text-text-main'}">${sanitizeHTML(t.task)}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        `;
                    }).join('') : `
                    <div class="text-center py-8 text-text-muted text-xs">No active employee onboarding checklists. Hire a candidate from the Talent Acquisition pipeline to start.</div>
                    `}
                </div>
            </div>

            <!-- Payroll Executor -->
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                <h3 class="font-bold text-sm font-outfit">Accountant Payroll Executor</h3>
                <p class="text-[11px] text-text-muted">Process monthly payroll runs for onboarded agency creators. Executing payroll posts a logged expense directly to the Contractors ledger in the main ERP.</p>
                
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="border-b border-text-main/20 text-text-muted">
                                <th class="py-2.5 font-bold">Employee</th>
                                <th class="py-2.5 font-bold">Role</th>
                                <th class="py-2.5 font-bold text-right">Gross Salary</th>
                                <th class="py-2.5 font-bold text-center">Tax Rate</th>
                                <th class="py-2.5 font-bold text-right">Net Pay</th>
                                <th class="py-2.5 font-bold text-center">Status</th>
                                <th class="py-2.5 font-bold text-center">Execution</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${employees.length > 0 ? employees.map(emp => {
                                const netPay = emp.salary * (1 - emp.taxRate);
                                const isPaid = emp.paymentStatus === 'paid';
                                return `
                                <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                    <td class="py-3 font-semibold text-text-main">${sanitizeHTML(emp.name)}</td>
                                    <td class="py-3">${sanitizeHTML(emp.role)}</td>
                                    <td class="py-3 text-right font-mono">$${emp.salary.toLocaleString()}</td>
                                    <td class="py-3 text-center font-mono">${Math.round(emp.taxRate * 100)}%</td>
                                    <td class="py-3 text-right font-mono">$${netPay.toLocaleString()}</td>
                                    <td class="py-3 text-center">
                                        <span class="px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase ${isPaid ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}">
                                            ${emp.paymentStatus}
                                        </span>
                                    </td>
                                    <td class="py-3 text-center">
                                        ${!isPaid ? `
                                            <button onclick="window.runPayrollAction('${emp.id}')" class="px-3 py-1 bg-emerald-500 text-white rounded text-[10px] font-bold hover:bg-emerald-600 transition-colors cursor-pointer">
                                                Execute Payroll
                                            </button>
                                        ` : `<span class="text-emerald-500 font-bold">✓ Processed</span>`}
                                    </td>
                                </tr>
                                `;
                            }).join('') : `
                            <tr>
                                <td colspan="7" class="text-center py-8 text-text-muted">No creators/employees available for payroll execution.</td>
                            </tr>
                            `}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        `;
    } else if (teamsSession.activeTab === 'capacity') {
        const teamMembers = state.team;
        tabContentHTML = `
        <div class="flex flex-col gap-6">
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                <h3 class="font-bold text-sm font-outfit">Resource Capacity Planning</h3>
                <p class="text-[11px] text-text-muted">Manage workload across the team to prevent burnout and ensure timely delivery.</p>
                <div class="grid grid-cols-1 gap-4 mt-2">
                    ${teamMembers.map(member => {
                        // Mock capacity calculation
                        const assignedTasks = state.kanbanState.filter(t => t.assignee === member.id && t.status !== 'done');
                        const totalPoints = assignedTasks.reduce((sum, t) => sum + (t.points || 2), 0);
                        const capacityLimit = 40; // 40 points per sprint/week
                        const utilization = Math.min(100, Math.round((totalPoints / capacityLimit) * 100));
                        
                        let barColor = 'bg-emerald-500';
                        if (utilization > 85) barColor = 'bg-rose-500';
                        else if (utilization > 65) barColor = 'bg-amber-500';

                        return `
                        <div class="border border-text-main/10 p-4 rounded-xl bg-text-main/5 flex flex-col gap-3">
                            <div class="flex justify-between items-center">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full ${member.avatarColor} flex items-center justify-center font-bold text-white text-xs shrink-0">
                                        ${member.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-text-main text-xs">${sanitizeHTML(member.name)}</h4>
                                        <span class="text-[9px] text-text-muted">${sanitizeHTML(member.role)}</span>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-xs font-bold font-mono ${utilization > 85 ? 'text-rose-500' : 'text-text-main'}">${utilization}% Utilized</div>
                                    <div class="text-[9px] text-text-muted">${totalPoints} / ${capacityLimit} Points</div>
                                </div>
                            </div>
                            <div class="w-full bg-text-main/10 h-2 rounded-full overflow-hidden mt-1">
                                <div class="${barColor} h-full rounded-full transition-all duration-500" style="width: ${utilization}%"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        `;
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
                <div class="flex flex-wrap gap-4 border-b border-text-main/10 pb-2">
                    <button onclick="window.switchTeamViewTab('teams')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'teams' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Active Teams (${activeTeams.length})</button>
                    <button onclick="window.switchTeamViewTab('archived')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'archived' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Archived Records (${archivedTeams.length})</button>
                    <button onclick="window.switchTeamViewTab('directory')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'directory' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Directory Presence</button>
                    <button onclick="window.switchTeamViewTab('recruiting')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'recruiting' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Talent Acquisition (${state.candidates ? state.candidates.length : 0})</button>
                    <button onclick="window.switchTeamViewTab('onboarding')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'onboarding' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Onboarding & Payroll (${state.employees ? state.employees.length : 0})</button>
                    <button onclick="window.switchTeamViewTab('capacity')" class="pb-1 text-xs font-bold uppercase tracking-wider ${teamsSession.activeTab === 'capacity' ? 'text-text-main border-b-2 border-text-main' : 'text-text-muted hover:text-text-main'}">Capacity</button>
                </div>

                <!-- Tab Content Panel -->
                ${tabContentHTML}
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

    w.submitCandidateApplication = () => {
        const nameEl = document.getElementById('cand-name') as HTMLInputElement;
        const roleEl = document.getElementById('cand-role') as HTMLInputElement;
        const emailEl = document.getElementById('cand-email') as HTMLInputElement;
        if (nameEl && roleEl && emailEl) {
            const name = nameEl.value.trim();
            const role = roleEl.value.trim();
            const email = emailEl.value.trim();
            if (!name || !role || !email) {
                alert("Please fill out candidate name, role, and email.");
                return;
            }
            addCandidate(name, role, email);
            nameEl.value = "";
            roleEl.value = "";
            emailEl.value = "";
        }
    };

    w.hireCandidateAction = (candId: string) => {
        const activeRole = state.activeRole || 'admin';
        if (activeRole !== 'admin' && activeRole !== 'manager') {
            alert("Permission Denied: Only Admin and Manager roles can hire creators.");
            return;
        }
        hireCreator(candId);
    };

    w.toggleOnboardingTaskAction = (empId: string, taskIdx: number, checked: boolean) => {
        const activeRole = state.activeRole || 'admin';
        if (activeRole !== 'admin' && activeRole !== 'manager' && activeRole !== 'accountant') {
            alert("Permission Denied: Only Admin, Manager, and Accountant roles can update onboarding checklists.");
            notifyStateChange(); // Re-render to revert check visual if denied
            return;
        }
        completeOnboardingTask(empId, taskIdx, checked);
    };

    w.runPayrollAction = (empId: string) => {
        const activeRole = state.activeRole || 'admin';
        if (activeRole !== 'admin' && activeRole !== 'manager' && activeRole !== 'accountant') {
            alert("Permission Denied: Only Admin, Manager, and Accountant roles can execute payroll runs.");
            return;
        }
        runMonthlyPayroll(empId);
    };
}
