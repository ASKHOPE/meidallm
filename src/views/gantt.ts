import { state } from "../state";
import { getIconSVG } from "./icons";
import { sanitizeHTML } from "../utils";

export function renderGanttView(pid: string): string {
    const tasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned);
    const teamMembers = state.team || [];
    
    // View state for filters (using localStorage or defaults)
    const assigneeFilter = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_gantt_filter_assignee') : 'all') || 'all';
    const priorityFilter = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_gantt_filter_priority') : 'all') || 'all';
    const searchFilter = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_gantt_filter_search') : '') || '';

    // Filter tasks
    const filteredTasks = tasks.filter(t => {
        const matchesAssignee = assigneeFilter === 'all' || t.assignee === assigneeFilter;
        const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
        const matchesSearch = !searchFilter || t.title.toLowerCase().includes(searchFilter.toLowerCase());
        return matchesAssignee && matchesPriority && matchesSearch;
    });

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Determine date range
    const dates = filteredTasks
        .filter(t => t.dueDate)
        .map(t => new Date(t.dueDate!).getTime());
    const minDate = dates.length > 0 ? Math.min(...dates) : Date.now();
    const maxDate = dates.length > 0 ? Math.max(...dates) : Date.now() + 30 * 86400000;
    
    // Grid boundary
    const rangeStart = new Date(Math.min(minDate, Date.now()) - 5 * 86400000);
    const rangeEnd = new Date(maxDate + 10 * 86400000);

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

    const dayWidth = 40; // px per day column
    const totalWidth = days.length * dayWidth;

    const statusColor: Record<string, string> = {
        'backlog': 'bg-slate-500/60',
        'progress': 'bg-blue-500/70 border-blue-400',
        'review': 'bg-amber-500/70 border-amber-400',
        'done': 'bg-emerald-500/70 border-emerald-400'
    };

    const priorityBorder: Record<string, string> = {
        'urgent': 'border-l-rose-500',
        'high': 'border-l-amber-500',
        'medium': 'border-l-blue-500',
        'low': 'border-l-slate-500',
        'none': 'border-l-transparent'
    };

    const sortedTasks = [...filteredTasks].sort((a, b) => {
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return aDate - bDate;
    });

    const taskRows = sortedTasks.map(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        // Default start date to 3 days before due date if missing
        const startDate = (task as any).startDate ? new Date((task as any).startDate) : (dueDate ? new Date(dueDate.getTime() - 3 * 86400000) : null);

        if (!dueDate || !startDate) {
            return `
            <div class="flex items-center h-12 border-b border-[var(--color-glass-border)]">
                <div class="w-64 shrink-0 px-4 text-xs text-[var(--color-text-main)] truncate flex items-center gap-2 border-r border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] sticky left-0 z-[5]">
                    <span class="w-2 h-2 rounded-full ${statusColor[task.status] || 'bg-slate-500/60'}"></span>
                    <span class="truncate">${sanitizeHTML(task.title)}</span>
                </div>
                <div class="flex-grow relative h-full" style="width:${totalWidth}px">
                    <div class="absolute inset-0 flex items-center px-4">
                        <span class="text-[10px] text-[var(--color-text-muted)] italic">No duration set</span>
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
        <div class="flex items-center h-12 border-b border-[var(--color-glass-border)] hover:bg-[var(--color-panel-hover)]/30 transition-colors group">
            <!-- Sticky Title Column -->
            <div class="w-64 shrink-0 px-4 text-xs text-[var(--color-text-main)] truncate flex items-center justify-between border-r border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] sticky left-0 z-[5] border-l-4 ${borderLeft}">
                <div class="flex items-center gap-2 min-w-0">
                    ${isMilestone ? `<span class="text-amber-400 text-sm">◆</span>` : `<span class="w-2 h-2 rounded-full ${barColor}"></span>`}
                    <span class="truncate font-semibold">${sanitizeHTML(task.title)}</span>
                </div>
                <span class="text-[9px] text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">${task.assignee || 'Unassigned'}</span>
            </div>
            
            <!-- Timeline Track -->
            <div class="flex-grow relative h-full" style="width:${totalWidth}px">
                <!-- Milestone Marker -->
                ${isMilestone ? `
                    <div class="absolute top-1/2 -translate-y-1/2 w-4.5 h-4.5 rotate-45 bg-amber-500 border border-amber-400 shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform" 
                         style="left:${leftPx}px"
                         onmousedown="window.initGanttDrag(event, '${task.id}', 'shift', ${leftPx}, ${dayWidth}, '${rangeStart.toISOString()}')"
                         title="${sanitizeHTML(task.title)} (Milestone): ${dueDate.toLocaleDateString()}"></div>
                ` : `
                    <!-- Task Bar Container -->
                    <div id="gantt-bar-${task.id}" 
                         class="absolute top-2.5 h-7 rounded-lg ${barColor} border shadow-md flex items-center justify-between px-2 select-none hover:shadow-lg transition-shadow group/bar"
                         style="left:${leftPx}px; width:${widthPx}px; min-width:32px;">
                        
                        <!-- Left Resize Handle -->
                        <div class="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/20 rounded-l-lg transition-colors"
                             onmousedown="event.stopPropagation(); window.initGanttDrag(event, '${task.id}', 'left', ${leftPx}, ${dayWidth}, '${rangeStart.toISOString()}', ${widthPx})"></div>
                        
                        <!-- Task Info / Label -->
                        <div class="text-[10px] text-white font-bold truncate px-1 flex-grow cursor-grab active:cursor-grabbing h-full flex items-center"
                             onmousedown="window.initGanttDrag(event, '${task.id}', 'shift', ${leftPx}, ${dayWidth}, '${rangeStart.toISOString()}', ${widthPx})">
                            <span class="truncate pr-1">${durationDays}d</span>
                        </div>
                        
                        <!-- Right Resize Handle -->
                        <div class="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/20 rounded-r-lg transition-colors"
                             onmousedown="event.stopPropagation(); window.initGanttDrag(event, '${task.id}', 'right', ${leftPx}, ${dayWidth}, '${rangeStart.toISOString()}', ${widthPx})"></div>
                    </div>
                `}
            </div>
        </div>`;
    }).join('');

    return `
    <div class="flex flex-col gap-5 p-6 h-full overflow-hidden text-[var(--color-text-main)]">
        <!-- Interactive Controls Bar -->
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-glass-border)] pb-5">
            <div>
                <h2 class="text-2xl font-bold font-outfit tracking-tight flex items-center gap-2.5">
                    ${getIconSVG('gantt', 'w-6 h-6 text-blue-400')}
                    Interactive Gantt Timeline
                </h2>
                <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    Drag bars to shift dates or drag edges to extend duration. Autosaves to workspace.
                </p>
            </div>
            
            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-2.5">
                <!-- Search -->
                <input type="text" 
                       id="gantt-search" 
                       placeholder="Filter by task title..." 
                       value="${searchFilter}"
                       oninput="window.updateGanttFilter('search', this.value)"
                       class="bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] px-3.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-violet-500 w-44">
                
                <!-- Assignee Filter -->
                <select id="gantt-filter-assignee" 
                        onchange="window.updateGanttFilter('assignee', this.value)"
                        class="bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] px-3 py-1.5 rounded-lg text-xs cursor-pointer">
                    <option value="all">All Assignees</option>
                    ${teamMembers.map(m => `<option value="${m.name}" ${assigneeFilter === m.name ? 'selected' : ''}>${sanitizeHTML(m.name)}</option>`).join('')}
                </select>

                <!-- Priority Filter -->
                <select id="gantt-filter-priority" 
                        onchange="window.updateGanttFilter('priority', this.value)"
                        class="bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] px-3 py-1.5 rounded-lg text-xs cursor-pointer">
                    <option value="all" ${priorityFilter === 'all' ? 'selected' : ''}>All Priorities</option>
                    <option value="urgent" ${priorityFilter === 'urgent' ? 'selected' : ''}>🚨 Urgent</option>
                    <option value="high" ${priorityFilter === 'high' ? 'selected' : ''}>🟠 High</option>
                    <option value="medium" ${priorityFilter === 'medium' ? 'selected' : ''}>🔵 Medium</option>
                    <option value="low" ${priorityFilter === 'low' ? 'selected' : ''}>⚪ Low</option>
                </select>
            </div>
        </div>

        <!-- Gantt Chart Container -->
        <div class="flex-1 overflow-auto rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-panel-hover)]/20 shadow-inner">
            <div class="flex flex-col relative" style="width:${totalWidth + 256}px">
                <!-- Month Header -->
                <div class="flex sticky top-0 z-20 bg-[var(--color-glass-bg)] backdrop-blur-md border-b border-[var(--color-glass-border)]">
                    <div class="w-64 shrink-0 px-4 py-2.5 text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider border-r border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] sticky left-0 z-30">Workspace Tasks</div>
                    <div class="flex">
                        ${months.map(m => `<div class="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider py-2.5 text-center border-r border-[var(--color-glass-border)]/50" style="width:${m.span * dayWidth}px">${m.label}</div>`).join('')}
                    </div>
                </div>
                
                <!-- Day Header -->
                <div class="flex sticky top-[37px] z-20 bg-[var(--color-glass-bg)]/90 backdrop-blur-sm border-b border-[var(--color-glass-border)]">
                    <div class="w-64 shrink-0 border-r border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] sticky left-0 z-30"></div>
                    <div class="flex">
                        ${days.map(d => `<div class="text-center text-[9px] py-1.5 ${d.isToday ? 'bg-violet-500/15 text-violet-400 font-bold border-x border-violet-500/20' : d.isWeekend ? 'text-[var(--color-text-muted)]/40 bg-[var(--color-panel-hover)]/40' : 'text-[var(--color-text-muted)]'}" style="width:${dayWidth}px">${d.label}</div>`).join('')}
                    </div>
                </div>
                
                <!-- Task Rows -->
                <div class="flex flex-col relative">
                    <!-- Today Line Marker overlay -->
                    ${(() => {
                        const todayIndex = days.findIndex(d => d.isToday);
                        if (todayIndex !== -1) {
                            return `<div class="absolute top-0 bottom-0 w-0.5 bg-violet-500/40 z-10 pointer-events-none" style="left:${256 + todayIndex * dayWidth + dayWidth/2}px"></div>`;
                        }
                        return '';
                    })()}
                    
                    ${taskRows}
                </div>
                
                ${sortedTasks.length === 0 ? `
                    <div class="flex flex-col items-center justify-center py-20 text-[var(--color-text-muted)] text-xs gap-2">
                        <span>${getIconSVG('calendar', 'w-8 h-8 text-[var(--color-text-muted)]/40')}</span>
                        <span>No tasks matching the filter parameters.</span>
                    </div>` : ''}
            </div>
        </div>
    </div>`;
}
