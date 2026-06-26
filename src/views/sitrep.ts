import { state } from "../state";
import { getIconSVG } from "./icons";
import { 
    computeCAC, 
    computeMRR, 
    computeLTV, 
    computeTTV, 
    computeTaskVelocity, 
    computeContentPipelineRate, 
    computeHealthScore 
} from "../metrics/business";

export function renderSitRepView(pid: string): string {
    const tasks = state.kanbanState.filter(t => t.projectId === pid);
    const drafts = state.drafts.filter(d => d.projectId === pid);
    const goals = state.goals.filter(g => g.projectId === pid);
    const schedules = (state.publishSchedules || []).filter(s => s.projectId === pid);

    const totalTasks = tasks.length;
    const doneTasks  = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'progress' || t.status === 'review').length;
    const overdue    = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const taskPct    = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const totalGoals = goals.length;
    const doneGoals  = goals.filter(g => g.status === 'achieved' || g.currentValue >= g.targetValue).length;
    const goalPct    = totalGoals ? Math.round((goals.reduce((sum, g) => sum + Math.min(100, Math.round((g.currentValue / (g.targetValue || 1)) * 100)), 0)) / totalGoals) : 0;

    const pubDrafts    = schedules.filter(s => s.status === 'published').length;
    const queuedDrafts = schedules.filter(s => s.status === 'queued').length;

    const now       = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr   = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr   = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Business metric calculations
    const cac = computeCAC(pid);
    const mrr = computeMRR(pid);
    const ltv = computeLTV(pid);
    const ttv = computeTTV(pid);
    const velocity = computeTaskVelocity(pid);
    const pipelineRate = computeContentPipelineRate(pid);
    const healthScore = computeHealthScore(pid);

    const statCard = (iconName: string, color: string, value: string | number, label: string, sub?: string) => `
        <div class="flex flex-col gap-1 p-4 rounded-2xl bg-panel-hover border border-text-main/10 hover:border-text-main/20 transition-all">
            <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-semibold text-text-muted uppercase tracking-wider">${label}</span>
                ${getIconSVG(iconName as Parameters<typeof getIconSVG>[0], `w-4 h-4 ${color}`)}
            </div>
            <span class="text-3xl font-bold text-text-main font-outfit">${value}</span>
            ${sub ? `<span class="text-xs text-text-muted">${sub}</span>` : ''}
        </div>`;

    const bar = (pct: number, color: string) => `
        <div class="w-full h-2 rounded-full bg-text-main/10 overflow-hidden">
            <div class="h-full rounded-full ${color} transition-all duration-700" style="width:${pct}%"></div>
        </div>`;

    const recentTasks = tasks
        .filter(t => t.status !== 'done')
        .sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : 0) - (b.dueDate ? new Date(b.dueDate).getTime() : 0))
        .slice(0, 5);

    const nextPublish = schedules
        .filter(s => s.status === 'queued' && s.scheduledTime)
        .sort((a, b) => a.scheduledTime - b.scheduledTime)
        .slice(0, 3);

    const priorityColor: Record<string, string> = {
        urgent: 'text-rose-400', high: 'text-amber-400', medium: 'text-blue-400', low: 'text-text-muted'
    };

    return `
    <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto">

        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('sitrep', 'w-6 h-6 text-violet-400')}
                    Situation Report
                </h2>
                <p class="text-sm text-text-muted mt-0.5">${dayOfWeek}, ${dateStr} &mdash; ${timeStr}</p>
            </div>
            <button onclick="window.location.reload()" class="px-4 py-2 rounded-xl bg-panel-hover border border-text-main/10 text-xs font-semibold text-text-muted hover:text-text-main hover:border-text-main/25 transition-all cursor-pointer flex items-center gap-2">
                ${getIconSVG('arrow-right', 'w-4 h-4')} Refresh
            </button>
        </div>

        <!-- Top Metrics Cards Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${statCard('kanban-board', 'text-blue-400',    totalTasks,  'Total Tasks',    `${doneTasks} done · ${inProgress} in progress`)}
            ${statCard('bell',         'text-rose-400',    overdue,     'Overdue Tasks',  overdue > 0 ? 'Action required' : 'All on track')}
            ${statCard('publish',      'text-emerald-400', pubDrafts,   'Published',      `${queuedDrafts} in queue`)}
            ${statCard('project-goals','text-violet-400',  totalGoals,  'Campaign Goals', `${doneGoals} completed`)}
        </div>

        <!-- Business Operational Health Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <!-- Health Score gauge -->
            <div class="lg:col-span-1 bg-gradient-to-br from-violet-900/10 to-indigo-900/10 border border-violet-500/20 p-5 rounded-2xl flex flex-col justify-between items-center text-center">
                <div class="w-full">
                    <div class="flex items-center justify-between mb-1">
                        <span class="text-xs font-bold uppercase tracking-wider text-violet-300">Composite Health Score</span>
                        ${getIconSVG('sitrep', 'w-4 h-4 text-violet-400')}
                    </div>
                    <p class="text-[10px] text-text-muted text-left mb-4">Calculated from customer retention, publishing output, and task velocity metrics.</p>
                </div>
                
                <div class="relative w-28 h-28 flex items-center justify-center">
                    <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path class="text-text-main/5" stroke="currentColor" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path class="text-violet-400" stroke="currentColor" stroke-dasharray="${healthScore}, 100" stroke-width="3.5" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute text-center">
                        <span class="text-3xl font-extrabold text-text-main font-outfit">${healthScore}</span>
                        <span class="text-[9px] text-text-muted block font-semibold uppercase">Rating</span>
                    </div>
                </div>

                <div class="w-full mt-4 bg-panel-hover/50 border border-text-main/15 py-1.5 px-3 rounded-lg text-xs text-violet-300 font-medium">
                    ${healthScore > 80 ? '▲ Excellent Operations' : healthScore > 50 ? '● Stable Performance' : '▼ Attention Required'}
                </div>
            </div>

            <!-- Financial / Revenue KPIs -->
            <div class="lg:col-span-2 bg-panel-hover/20 border border-text-main/10 p-5 rounded-2xl flex flex-col justify-between gap-4">
                <div class="border-b border-text-main/10 pb-2 flex justify-between items-center">
                    <span class="text-xs font-bold uppercase tracking-wider text-text-muted">Business Metric & Revenue KPIs</span>
                    <span class="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        ● Live state calculations
                    </span>
                </div>
                
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">MRR Retainer</span>
                        <span class="text-lg font-bold text-emerald-400 font-outfit">$${mrr.toLocaleString()}</span>
                        <span class="text-[9px] text-text-muted block">Contract Retainers</span>
                    </div>
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">Acquisition (CAC)</span>
                        <span class="text-lg font-bold text-text-main font-outfit">$${cac}</span>
                        <span class="text-[9px] text-text-muted block">Ad spend per client</span>
                    </div>
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">Lifetime Value (LTV)</span>
                        <span class="text-lg font-bold text-text-main font-outfit">$${ltv.toLocaleString()}</span>
                        <span class="text-[9px] text-indigo-400 block font-semibold">${cac > 0 ? (ltv / cac).toFixed(1) : '3.0'}x LTV : CAC</span>
                    </div>
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">Time to Value (TTV)</span>
                        <span class="text-lg font-bold text-text-main font-outfit">${ttv}s</span>
                        <span class="text-[9px] text-text-muted block">First operation lag</span>
                    </div>
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">Task Velocity</span>
                        <span class="text-lg font-bold text-text-main font-outfit">${velocity} / day</span>
                        <span class="text-[9px] text-text-muted block">Completion rate</span>
                    </div>
                    <div class="bg-background border border-text-main/10 p-3.5 rounded-xl">
                        <span class="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">Pipeline Rate</span>
                        <span class="text-lg font-bold text-text-main font-outfit">${pipelineRate}%</span>
                        <span class="text-[9px] text-text-muted block">Draft publish yield</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-text-main flex items-center gap-2">${getIconSVG('kanban-board', 'w-4 h-4 text-blue-400')} Task Completion</h3>
                    <span class="text-sm font-bold text-blue-400">${taskPct}%</span>
                </div>
                ${bar(taskPct, 'bg-blue-500')}
                <p class="text-xs text-text-muted">${doneTasks} of ${totalTasks} tasks completed</p>
            </div>
            <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10 flex flex-col gap-3">
                <div class="flex items-center justify-between">
                    <h3 class="text-sm font-bold text-text-main flex items-center gap-2">${getIconSVG('project-goals', 'w-4 h-4 text-violet-400')} Goal Progress</h3>
                    <span class="text-sm font-bold text-violet-400">${goalPct}%</span>
                </div>
                ${bar(goalPct, 'bg-violet-500')}
                <p class="text-xs text-text-muted">${doneGoals} of ${totalGoals} goals reached 100%</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10 flex flex-col gap-3">
                <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                    ${getIconSVG('kanban-board', 'w-4 h-4 text-amber-400')} Open Priority Tasks
                </h3>
                ${recentTasks.length === 0 ? '<p class="text-xs text-text-muted">No open tasks &mdash; great work!</p>' :
                    recentTasks.map(t => `
                    <div class="flex items-center gap-3 py-2 border-b border-text-main/8 last:border-0">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-text-main truncate">${t.title || 'Untitled'}</p>
                            ${t.dueDate ? `<p class="text-xs text-text-muted">${new Date(t.dueDate).toLocaleDateString()}</p>` : ''}
                        </div>
                        <span class="text-xs font-semibold ${priorityColor[t.priority || ''] || 'text-text-muted'} capitalize">${t.priority || 'none'}</span>
                    </div>`).join('')}
            </div>

            <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10 flex flex-col gap-3">
                <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                    ${getIconSVG('publish', 'w-4 h-4 text-emerald-400')} Upcoming Publishes
                </h3>
                ${nextPublish.length === 0 ? '<p class="text-xs text-text-muted">No scheduled publishes yet.</p>' :
                    nextPublish.map(s => `
                    <div class="flex items-center gap-3 py-2 border-b border-text-main/8 last:border-0">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-text-main truncate">${s.title || 'Untitled'}</p>
                            <p class="text-xs text-text-muted">${new Date(s.scheduledTime).toLocaleString()}</p>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${s.format || 'post'}</span>
                    </div>`).join('')}
            </div>
        </div>

        <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10">
            <h3 class="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                ${getIconSVG('drafts', 'w-4 h-4 text-blue-400')} Content Pipeline Summary
            </h3>
            <div class="grid grid-cols-4 gap-4 text-center text-xs">
                <div><div class="text-xl font-bold text-text-main">${drafts.length}</div><div class="text-text-muted mt-0.5">Total Drafts</div></div>
                <div><div class="text-xl font-bold text-amber-400">${drafts.filter(d => !d.cmsStatus || d.cmsStatus === 'draft').length}</div><div class="text-text-muted mt-0.5">In Progress</div></div>
                <div><div class="text-xl font-bold text-blue-400">${drafts.filter(d => d.cmsStatus === 'review').length}</div><div class="text-text-muted mt-0.5">In Review</div></div>
                <div><div class="text-xl font-bold text-emerald-400">${pubDrafts}</div><div class="text-text-muted mt-0.5">Published</div></div>
            </div>
        </div>

    </div>`;
}
