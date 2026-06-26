import { state } from "../state";
import { getIconSVG } from "./icons";

export function renderTableView(pid: string): string {
    const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned);

    const columns = [
        { key: 'title', label: 'Task', width: 'min-w-[220px]' },
        { key: 'status', label: 'Status', width: 'w-28' },
        { key: 'priority', label: 'Priority', width: 'w-24' },
        { key: 'assignee', label: 'Assignee', width: 'w-32' },
        { key: 'tag', label: 'Tag', width: 'w-28' },
        { key: 'points', label: 'Points', width: 'w-20' },
        { key: 'complexity', label: 'Complexity', width: 'w-24' },
        { key: 'dueDate', label: 'Due Date', width: 'w-28' },
        { key: 'cycleId', label: 'Cycle', width: 'w-28' },
        { key: 'created', label: 'Created', width: 'w-28' }
    ];

    const statusBadge: Record<string, string> = {
        'backlog': 'bg-slate-500/15 text-slate-400 border-slate-500/20',
        'progress': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        'review': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
        'done': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
    };

    const priorityBadge: Record<string, string> = {
        'urgent': 'bg-rose-500/15 text-rose-400',
        'high': 'bg-amber-500/15 text-amber-400',
        'medium': 'bg-blue-500/15 text-blue-400',
        'low': 'bg-slate-500/15 text-slate-400',
        'none': 'bg-text-main/5 text-text-muted'
    };

    const complexityBadge: Record<string, string> = {
        'critical': 'bg-rose-500/15 text-rose-400',
        'high': 'bg-amber-500/15 text-amber-400',
        'medium': 'bg-blue-500/15 text-blue-400',
        'low': 'bg-emerald-500/15 text-emerald-400'
    };

    function getCycleName(cycleId?: string): string {
        if (!cycleId) return '-';
        return state.cycles.find(c => c.id === cycleId)?.name || '-';
    }

    function formatDate(ts: number): string {
        return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    function getMemberName(assignee?: string): string {
        if (!assignee) return '-';
        const m = state.team.find(t => t.id === assignee || t.name === assignee);
        return m ? (m.name.split(' ')[0] || m.name) : assignee;
    }

    // Aggregates
    const totalPoints = tasks.reduce((s, t) => s + (t.points || 0), 0);
    const avgPoints = tasks.length > 0 ? (totalPoints / tasks.length).toFixed(1) : '0';
    const doneCount = tasks.filter(t => t.status === 'done').length;
    const inProgressCount = tasks.filter(t => t.status === 'progress').length;

    const sortedTasks = [...tasks].sort((a, b) => b.updated - a.updated);

    const col = (i: number) => columns[i]!.width;

    const rows = sortedTasks.map(task => `
        <tr class="border-b border-text-main/6 hover:bg-text-main/3 transition-colors group">
            <td class="px-3 py-2.5 text-xs font-semibold text-text-main ${col(0)}">
                <div class="flex items-center gap-2 cursor-pointer" onclick="window.openTaskDetail && window.openTaskDetail('${task.id}')">
                    <span class="w-2 h-2 rounded-full ${statusBadge[task.status]?.split(' ')[0] || ''} shrink-0"></span>
                    <span class="truncate max-w-[200px]">${task.title}</span>
                </div>
            </td>
            <td class="px-3 py-2.5 ${col(1)}">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusBadge[task.status] || ''}">${task.status}</span>
            </td>
            <td class="px-3 py-2.5 ${col(2)}">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityBadge[task.priority || 'none'] || ''}">${task.priority || 'none'}</span>
            </td>
            <td class="px-3 py-2.5 text-xs text-text-muted ${col(3)}">${getMemberName(task.assignee)}</td>
            <td class="px-3 py-2.5 ${col(4)}">
                <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-text-main/5 text-text-muted">${task.tag || '-'}</span>
            </td>
            <td class="px-3 py-2.5 text-xs text-text-main font-mono text-center ${col(5)}">${task.points || '-'}</td>
            <td class="px-3 py-2.5 ${col(6)}">
                ${task.complexity ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${complexityBadge[task.complexity] || ''}">${task.complexity}</span>` : '<span class="text-xs text-text-muted">-</span>'}
            </td>
            <td class="px-3 py-2.5 text-xs text-text-muted ${col(7)}">${task.dueDate || '-'}</td>
            <td class="px-3 py-2.5 text-xs text-text-muted ${col(8)}">${getCycleName(task.cycleId)}</td>
            <td class="px-3 py-2.5 text-xs text-text-muted ${col(9)}">${formatDate(task.created)}</td>
        </tr>
    `).join('');

    return `
    <div class="flex flex-col gap-4 p-6 h-full overflow-hidden">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('table-view', 'w-6 h-6 text-cyan-400')}
                    Table View
                </h2>
                <p class="text-sm text-text-muted mt-0.5">${tasks.length} tasks · ${totalPoints} total points · avg ${avgPoints} pts/task</p>
            </div>
            <div class="flex items-center gap-3 text-xs text-text-muted">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500"></span> ${inProgressCount} in progress</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${doneCount} done</span>
            </div>
        </div>

        <!-- Aggregation Row -->
        <div class="flex items-center gap-4 px-3 py-2.5 rounded-xl bg-panel-hover border border-text-main/10">
            <span class="text-[10px] font-bold text-text-muted uppercase tracking-wider">Aggregates</span>
            <span class="text-xs text-text-main font-semibold">Total Pts: <span class="text-blue-400">${totalPoints}</span></span>
            <span class="text-xs text-text-main font-semibold">Tasks: <span class="text-blue-400">${tasks.length}</span></span>
            <span class="text-xs text-text-main font-semibold">Completion: <span class="text-emerald-400">${tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0}%</span></span>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto rounded-2xl border border-text-main/10 bg-panel-hover">
            <table class="w-full text-left">
                <thead class="sticky top-0 z-10 bg-background border-b border-text-main/15">
                    <tr>
                        ${columns.map(c => `<th class="px-3 py-2.5 text-[10px] font-bold text-text-muted uppercase tracking-wider ${c.width}">${c.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                    ${tasks.length === 0 ? `
                    <tr>
                        <td colspan="${columns.length}" class="px-3 py-12 text-center text-sm text-text-muted">
                            ${getIconSVG('kanban-board', 'w-6 h-6 mx-auto mb-2 opacity-40')}
                            No tasks in this project. Create tasks in the Kanban board to see them here.
                        </td>
                    </tr>` : ''}
                </tbody>
            </table>
        </div>
    </div>`;
}
