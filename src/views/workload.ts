import { state } from "../state";
import { getIconSVG } from "./icons";

export function renderWorkloadView(pid: string): string {
    const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned && t.status !== 'done');
    const team = state.team.filter(m => m.status !== 'offline');
    const hoursPerDay = 8;

    // Build per-member data
    const memberData = team.map(member => {
        const memberTasks = tasks.filter(t => t.assignee === member.id || t.assignee === member.name);
        const totalPoints = memberTasks.reduce((s, t) => s + (t.points || 1), 0);
        const estimatedHours = totalPoints * 2; // rough: 1 point ≈ 2 hours
        const capacityPct = Math.min(100, Math.round((estimatedHours / (hoursPerDay * 5)) * 100)); // vs 5-day week

        let loadStatus: 'under' | 'optimal' | 'over' = 'under';
        let loadColor = 'bg-emerald-500';
        let loadTextColor = 'text-emerald-400';
        if (capacityPct > 85) { loadStatus = 'over'; loadColor = 'bg-rose-500'; loadTextColor = 'text-rose-400'; }
        else if (capacityPct > 50) { loadStatus = 'optimal'; loadColor = 'bg-blue-500'; loadTextColor = 'text-blue-400'; }

        const byStatus = {
            backlog: memberTasks.filter(t => t.status === 'backlog').length,
            progress: memberTasks.filter(t => t.status === 'progress').length,
            review: memberTasks.filter(t => t.status === 'review').length
        };

        const urgentCount = memberTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

        return { member, memberTasks, totalPoints, estimatedHours, capacityPct, loadStatus, loadColor, loadTextColor, byStatus, urgentCount };
    });

    // Sort: overloaded first
    memberData.sort((a, b) => b.capacityPct - a.capacityPct);

    const totalAssigned = tasks.filter(t => t.assignee).length;
    const totalUnassigned = tasks.filter(t => !t.assignee).length;
    const avgLoad = memberData.length > 0 ? Math.round(memberData.reduce((s, m) => s + m.capacityPct, 0) / memberData.length) : 0;
    const overloaded = memberData.filter(m => m.loadStatus === 'over').length;

    return `
    <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('workload', 'w-6 h-6 text-violet-400')}
                    Team Workload
                </h2>
                <p class="text-sm text-text-muted mt-0.5">Capacity planning across ${team.length} team members</p>
            </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-4 gap-4">
            <div class="p-4 rounded-2xl bg-panel-hover border border-text-main/10">
                <div class="text-2xl font-bold text-text-main">${totalAssigned}</div>
                <div class="text-xs text-text-muted mt-1">Assigned Tasks</div>
            </div>
            <div class="p-4 rounded-2xl bg-panel-hover border border-text-main/10">
                <div class="text-2xl font-bold text-amber-400">${totalUnassigned}</div>
                <div class="text-xs text-text-muted mt-1">Unassigned</div>
            </div>
            <div class="p-4 rounded-2xl bg-panel-hover border border-text-main/10">
                <div class="text-2xl font-bold text-blue-400">${avgLoad}%</div>
                <div class="text-xs text-text-muted mt-1">Avg Capacity</div>
            </div>
            <div class="p-4 rounded-2xl bg-panel-hover border border-text-main/10">
                <div class="text-2xl font-bold ${overloaded > 0 ? 'text-rose-400' : 'text-emerald-400'}">${overloaded}</div>
                <div class="text-xs text-text-muted mt-1">Overloaded</div>
            </div>
        </div>

        <!-- Member Cards -->
        <div class="flex flex-col gap-3">
            ${memberData.map(m => `
            <div class="p-4 rounded-2xl bg-panel-hover border border-text-main/10 hover:border-text-main/20 transition-all">
                <div class="flex items-center gap-4 mb-3">
                    <!-- Avatar -->
                    <div class="w-10 h-10 ${m.member.avatarColor} rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                        ${m.member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-text-main">${m.member.name}</p>
                                <p class="text-xs text-text-muted">${m.member.role}</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-xs font-bold ${m.loadTextColor}">${m.capacityPct}% capacity</span>
                                ${m.urgentCount > 0 ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">${m.urgentCount} urgent</span>` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Capacity Bar -->
                <div class="w-full h-3 rounded-full bg-text-main/10 overflow-hidden mb-3">
                    <div class="h-full rounded-full ${m.loadColor} transition-all duration-500" style="width:${m.capacityPct}%"></div>
                </div>

                <!-- Task Breakdown -->
                <div class="flex items-center gap-4 text-xs text-text-muted">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-500"></span> Backlog: ${m.byStatus.backlog}</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> In Progress: ${m.byStatus.progress}</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500"></span> Review: ${m.byStatus.review}</span>
                    <span class="ml-auto">${m.totalPoints} pts · ~${m.estimatedHours}h est.</span>
                </div>

                ${m.memberTasks.length > 0 ? `
                <div class="mt-3 flex flex-wrap gap-1.5">
                    ${m.memberTasks.slice(0, 6).map(t => `
                        <span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-text-main/5 text-text-muted border border-text-main/8 truncate max-w-[180px]">${t.title}</span>
                    `).join('')}
                    ${m.memberTasks.length > 6 ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-semibold text-text-muted">+${m.memberTasks.length - 6} more</span>` : ''}
                </div>` : ''}
            </div>
            `).join('')}

            ${memberData.length === 0 ? `
            <div class="flex flex-col items-center justify-center gap-2 p-12 rounded-2xl border border-dashed border-text-main/15 text-text-muted text-sm text-center">
                ${getIconSVG('team', 'w-8 h-8 mx-auto mb-2 opacity-40')}
                No team members found. Add team members to see workload distribution.
            </div>` : ''}
        </div>
    </div>`;
}
