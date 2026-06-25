import { state } from "../state";
import { getIconSVG } from "./icons";

export function renderSitRepView(pid: string): string {
    const tasks = ((state as any).tasks || []).filter((t: any) => t.projectId === pid);
    const drafts = state.drafts.filter((d: any) => d.projectId === pid);
    const goals = ((state as any).goals || []).filter((g: any) => g.projectId === pid);
    const schedules = (state.publishSchedules || []).filter((s: any) => s.projectId === pid);

    const totalTasks = tasks.length;
    const doneTasks  = tasks.filter((t: any) => t.status === 'done').length;
    const inProgress = tasks.filter((t: any) => t.status === 'in-progress').length;
    const overdue    = tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done').length;
    const taskPct    = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const totalGoals = goals.length;
    const doneGoals  = goals.filter((g: any) => (g.progress || 0) >= 100).length;
    const goalPct    = totalGoals ? Math.round((doneGoals / totalGoals) * 100) : 0;

    const pubDrafts    = schedules.filter((s: any) => s.status === 'published').length;
    const queuedDrafts = schedules.filter((s: any) => s.status === 'queued').length;

    const now       = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr   = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const timeStr   = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
        .filter((t: any) => t.status !== 'done')
        .sort((a: any, b: any) => (a.dueDate || 0) - (b.dueDate || 0))
        .slice(0, 5);

    const nextPublish = schedules
        .filter((s: any) => s.status === 'queued' && s.scheduledTime)
        .sort((a: any, b: any) => a.scheduledTime - b.scheduledTime)
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

        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            ${statCard('kanban-board', 'text-blue-400',    totalTasks,  'Total Tasks',    `${doneTasks} done · ${inProgress} in progress`)}
            ${statCard('bell',         'text-rose-400',    overdue,     'Overdue Tasks',  overdue > 0 ? 'Action required' : 'All on track')}
            ${statCard('publish',      'text-emerald-400', pubDrafts,   'Published',      `${queuedDrafts} in queue`)}
            ${statCard('project-goals','text-violet-400',  totalGoals,  'Campaign Goals', `${doneGoals} completed`)}
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
                ${recentTasks.length === 0 ? '<p class="text-xs text-text-muted">No open tasks — great work!</p>' :
                    recentTasks.map((t: any) => `
                    <div class="flex items-center gap-3 py-2 border-b border-text-main/8 last:border-0">
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-text-main truncate">${t.title || 'Untitled'}</p>
                            ${t.dueDate ? `<p class="text-xs text-text-muted">${new Date(t.dueDate).toLocaleDateString()}</p>` : ''}
                        </div>
                        <span class="text-xs font-semibold ${priorityColor[t.priority] || 'text-text-muted'} capitalize">${t.priority || ''}</span>
                    </div>`).join('')}
            </div>

            <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10 flex flex-col gap-3">
                <h3 class="text-sm font-bold text-text-main flex items-center gap-2">
                    ${getIconSVG('publish', 'w-4 h-4 text-emerald-400')} Upcoming Publishes
                </h3>
                ${nextPublish.length === 0 ? '<p class="text-xs text-text-muted">No scheduled publishes yet.</p>' :
                    nextPublish.map((s: any) => `
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
                <div><div class="text-xl font-bold text-amber-400">${drafts.filter((d: any) => !d.cmsStatus || d.cmsStatus === 'draft').length}</div><div class="text-text-muted mt-0.5">In Progress</div></div>
                <div><div class="text-xl font-bold text-blue-400">${drafts.filter((d: any) => d.cmsStatus === 'review').length}</div><div class="text-text-muted mt-0.5">In Review</div></div>
                <div><div class="text-xl font-bold text-emerald-400">${pubDrafts}</div><div class="text-text-muted mt-0.5">Published</div></div>
            </div>
        </div>

    </div>`;
}
