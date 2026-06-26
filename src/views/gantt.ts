import { state } from "../state";
import { getIconSVG } from "./icons";

export function renderGanttView(pid: string): string {
    const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Determine date range
    const dates = tasks
        .filter(t => t.dueDate)
        .map(t => new Date(t.dueDate!).getTime());
    const minDate = dates.length > 0 ? Math.min(...dates) : Date.now();
    const maxDate = dates.length > 0 ? Math.max(...dates) : Date.now() + 30 * 86400000;
    const rangeStart = new Date(Math.min(minDate, Date.now()) - 7 * 86400000);
    const rangeEnd = new Date(maxDate + 14 * 86400000);

    // Generate day columns
    const days: { date: string; label: string; isToday: boolean; isWeekend: boolean }[] = [];
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
        const iso = cursor.toISOString().split('T')[0]!;
        days.push({
            date: iso,
            label: cursor.toLocaleDateString('en-US', { day: 'numeric' }),
            isToday: iso === today,
            isWeekend: cursor.getDay() === 0 || cursor.getDay() === 6
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    // Month labels
    const months: { label: string; span: number }[] = [];
    let currentMonth = '';
    for (const d of days) {
        const m = new Date(d.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (m !== currentMonth) {
            months.push({ label: m, span: 1 });
            currentMonth = m;
        } else {
            months[months.length - 1]!.span++;
        }
    }

    const dayWidth = 32; // px per day column
    const totalWidth = days.length * dayWidth;

    const statusColor: Record<string, string> = {
        'backlog': 'bg-slate-500/60',
        'progress': 'bg-blue-500/70',
        'review': 'bg-amber-500/70',
        'done': 'bg-emerald-500/70'
    };

    const priorityBorder: Record<string, string> = {
        'urgent': 'border-l-rose-500',
        'high': 'border-l-amber-500',
        'medium': 'border-l-blue-500',
        'low': 'border-l-slate-500',
        'none': 'border-l-transparent'
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
    });

    const taskRows = sortedTasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const startDate = (task as any).startDate ? new Date((task as any).startDate) : (dueDate ? new Date(dueDate.getTime() - 3 * 86400000) : null);

        if (!dueDate || !startDate) {
            return `
            <div class="flex items-center h-10 border-b border-text-main/8">
                <div class="w-56 shrink-0 px-3 text-xs text-text-main truncate flex items-center gap-2 border-r border-text-main/10">
                    <span class="w-2 h-2 rounded-full ${statusColor[task.status] || 'bg-slate-500/60'}"></span>
                    ${task.title}
                </div>
                <div class="flex-1 relative" style="width:${totalWidth}px">
                    <div class="absolute inset-y-0 flex items-center px-3">
                        <span class="text-[10px] text-text-muted italic">No dates set</span>
                    </div>
                </div>
            </div>`;
        }

        const startDayIndex = Math.max(0, Math.round((startDate.getTime() - rangeStart.getTime()) / 86400000));
        const durationDays = Math.max(1, Math.round((dueDate.getTime() - startDate.getTime()) / 86400000));
        const leftPx = startDayIndex * dayWidth;
        const widthPx = Math.max(dayWidth, durationDays * dayWidth);
        const isMilestone = (task as any).isMilestone;
        const barColor = statusColor[task.status] || 'bg-slate-500/60';
        const borderLeft = priorityBorder[task.priority || 'none'] || '';

        return `
        <div class="flex items-center h-10 border-b border-text-main/8 hover:bg-text-main/3 transition-colors">
            <div class="w-56 shrink-0 px-3 text-xs text-text-main truncate flex items-center gap-2 border-r border-text-main/10 border-l-2 ${borderLeft}">
                ${isMilestone ? `<span class="text-amber-400 text-sm">◆</span>` : `<span class="w-2 h-2 rounded-full ${barColor}"></span>`}
                ${task.title}
            </div>
            <div class="flex-1 relative h-full" style="width:${totalWidth}px">
                ${isMilestone ? `
                    <div class="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 bg-amber-500 border border-amber-400 shadow-sm" style="left:${leftPx}px"></div>
                ` : `
                    <div class="absolute top-1.5 h-5 rounded-md ${barColor} shadow-sm cursor-pointer hover:brightness-110 transition-all flex items-center px-2"
                         style="left:${leftPx}px; width:${widthPx}px; min-width:24px"
                         title="${task.title}: ${startDate.toLocaleDateString()} → ${dueDate.toLocaleDateString()}">
                        <span class="text-[9px] text-white font-semibold truncate">${durationDays}d</span>
                    </div>
                `}
            </div>
        </div>`;
    }).join('');

    return `
    <div class="flex flex-col gap-4 p-6 h-full overflow-hidden">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('gantt', 'w-6 h-6 text-blue-400')}
                    Gantt Timeline
                </h2>
                <p class="text-sm text-text-muted mt-0.5">${sortedTasks.length} tasks plotted across ${days.length} days</p>
            </div>
        </div>

        <div class="flex-1 overflow-auto rounded-2xl border border-text-main/10 bg-panel-hover">
            <div class="flex flex-col" style="min-width:${totalWidth + 224}px">
                <!-- Month Header -->
                <div class="flex sticky top-0 z-10 bg-background border-b border-text-main/15">
                    <div class="w-56 shrink-0 px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider border-r border-text-main/10">Task</div>
                    <div class="flex">
                        ${months.map(m => `<div class="text-[10px] font-bold text-text-muted uppercase tracking-wider py-1.5 text-center border-r border-text-main/8" style="width:${m.span * dayWidth}px">${m.label}</div>`).join('')}
                    </div>
                </div>
                <!-- Day Header -->
                <div class="flex sticky top-[29px] z-10 bg-background/95 backdrop-blur-sm border-b border-text-main/15">
                    <div class="w-56 shrink-0 border-r border-text-main/10"></div>
                    <div class="flex">
                        ${days.map(d => `<div class="text-center text-[9px] py-1 ${d.isToday ? 'bg-blue-500/15 text-blue-400 font-bold' : d.isWeekend ? 'text-text-muted/50 bg-text-main/3' : 'text-text-muted'}" style="width:${dayWidth}px">${d.label}</div>`).join('')}
                    </div>
                </div>
                <!-- Task Rows -->
                ${taskRows}
                ${sortedTasks.length === 0 ? `
                    <div class="flex items-center justify-center h-40 text-text-muted text-sm">
                        ${getIconSVG('calendar', 'w-6 h-6 mr-2 opacity-40')}
                        No tasks with dates. Add due dates to see them on the timeline.
                    </div>` : ''}
            </div>
        </div>
    </div>`;
}
