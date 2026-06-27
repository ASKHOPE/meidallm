import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
    if (!ms || ms <= 0) return '0h 0m';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours}h ${minutes.toString().padStart(2,'0')}m ${secs.toString().padStart(2,'0')}s`;
}

function formatDurationShort(ms: number): string {
    if (!ms || ms <= 0) return '0:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2,'0')}`;
}

function msToHours(ms: number): number {
    return Math.round((ms / 3600000) * 100) / 100;
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
    d.setDate(diff);
    d.setHours(0,0,0,0);
    return d;
}

function getWeekBounds() {
    const weekStart = getWeekStart(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23,59,59,999);
    return { weekStart: weekStart.getTime(), weekEnd: weekEnd.getTime() };
}

function getUserLogs(userId?: string) {
    if (!userId) return state.timeLogs;
    return state.timeLogs.filter(l => l.userId === userId || !l.userId);
}

function filterLogsByRole(systemRole: string, currentUserId: string, teamId?: string) {
    const managerRoles = ['super_admin','tenant_owner','tenant_admin','org_admin','support_admin','support_manager'];
    const isManager = managerRoles.includes(systemRole) ||
                      state.activeRole === 'manager' ||
                      state.activeRole === 'admin';

    if (isManager) {
        // Managers can see all logs, optionally filtered to their team
        if (teamId) return state.timeLogs.filter(l => l.teamId === teamId || !l.teamId);
        return state.timeLogs;
    }
    // Regular employees see only their own
    return state.timeLogs.filter(l => !l.userId || l.userId === currentUserId);
}

// ─── STATS HELPERS ──────────────────────────────────────────────────────────

function getStatsByPeriod(logs: any[], periodMs: number) {
    const since = Date.now() - periodMs;
    const period = logs.filter(l => l.timestamp >= since);
    const totalMs = period.reduce((s: number, l: any) => s + l.durationMs, 0);
    const billableMs = period.filter((l: any) => l.billable).reduce((s: number, l: any) => s + l.durationMs, 0);
    return { totalMs, billableMs, nonBillableMs: totalMs - billableMs, count: period.length };
}

function getThisWeekLogs(logs: any[]) {
    const { weekStart, weekEnd } = getWeekBounds();
    return logs.filter(l => l.timestamp >= weekStart && l.timestamp <= weekEnd);
}

function buildWeeklyBarData(logs: any[]) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const weekStart = getWeekStart(new Date());
    return days.map((day, i) => {
        const dayStart = new Date(weekStart);
        dayStart.setDate(dayStart.getDate() + i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23,59,59,999);
        const dayLogs = logs.filter(l => l.timestamp >= dayStart.getTime() && l.timestamp <= dayEnd.getTime());
        const totalMs = dayLogs.reduce((s: number, l: any) => s + l.durationMs, 0);
        return { day, totalMs, hours: msToHours(totalMs) };
    });
}

// ─── MAIN RENDER ────────────────────────────────────────────────────────────

export function renderTimeTrackingView(): string {
    const currentUserProfile = state.team.find(m => m.email === state.currentUser) || state.team[0];
    const systemRole = currentUserProfile?.systemRole || 'user';
    const currentUserId = currentUserProfile?.id || '';
    const role = state.activeRole || 'admin';
    const isManager = ['super_admin','tenant_owner','tenant_admin','org_admin','support_admin','support_manager'].includes(systemRole)
                   || role === 'manager' || role === 'admin';

    const viewLogs = filterLogsByRole(systemRole, currentUserId);

    const today = new Date();
    const todayStart = new Date(today).setHours(0,0,0,0);
    const todayLogs = viewLogs.filter(l => l.timestamp >= todayStart);
    const todayMs = todayLogs.reduce((s: number, l: any) => s + l.durationMs, 0);
    const todayBillable = todayLogs.filter((l: any) => l.billable).reduce((s: number, l: any) => s + l.durationMs, 0);

    const weekLogs = getThisWeekLogs(viewLogs);
    const weekMs = weekLogs.reduce((s: number, l: any) => s + l.durationMs, 0);
    const weekBillable = weekLogs.filter((l: any) => l.billable).reduce((s: number, l: any) => s + l.durationMs, 0);

    const activeTimer = state.activeTimer;
    const isRunning = activeTimer.startTime !== null;

    const weekBarData = buildWeeklyBarData(viewLogs);
    const maxHours = Math.max(...weekBarData.map(d => d.hours), 8);

    // Build per-member summary (managers only)
    const memberSummaryHTML = isManager ? buildMemberSummary(viewLogs) : '';

    // Pending approval count
    const pendingCount = viewLogs.filter((l: any) => l.status === 'pending' || !l.status).length;

    const activeProjects = state.projects.filter(p => !p.isBinned && !p.isArchived);
    const activeTeam = state.teams.find(t => t.id === state.activeTeamId);
    const teamMembers = isManager ? state.team.filter(m => !activeTeam || activeTeam.memberIds.includes(m.id)) : [];

    return `
    <div class="fade-in flex flex-col gap-6 w-full max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex flex-wrap justify-between items-start gap-4 border-b border-[var(--color-glass-border)] pb-5">
            <div>
                <h2 class="text-2xl font-bold font-outfit text-[var(--color-text-main)] flex items-center gap-3">
                    ${getIconSVG('time-tracking', 'w-7 h-7 text-emerald-500')}
                    Time Tracker
                </h2>
                <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    ${isManager ? 'Team time management — clock-in, approvals, payroll reporting' : 'Track your work hours, billable time, and productivity'}
                </p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                ${isManager ? `
                <span class="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                    ${getIconSVG('team', 'w-3 h-3')} Manager View
                </span>
                ${pendingCount > 0 ? `
                <span class="bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider animate-pulse">
                    ${pendingCount} Pending Approvals
                </span>` : ''}
                ` : ''}
                <button onclick="window.showManualLogModal()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm">
                    ${getIconSVG('plus', 'w-4 h-4')} Log Time
                </button>
                <button onclick="window.exportTimeLogs()" class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] hover:bg-[var(--color-panel-hover)] text-[var(--color-text-main)] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    Export CSV
                </button>
            </div>
        </div>

        <!-- LIVE TIMER BANNER -->
        ${isRunning ? `
        <div class="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between gap-4 animate-[fadeIn_0.3s_ease]">
            <div class="flex items-center gap-4">
                <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <div>
                    <div class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Timer Running</div>
                    <div class="text-sm font-semibold text-[var(--color-text-main)] mt-0.5">${sanitizeHTML(activeTimer.taskTitle || 'General Work')} · ${sanitizeHTML(activeTimer.projectName || 'No Project')}</div>
                </div>
                <div id="active-timer-clock" class="text-2xl font-mono font-bold text-emerald-500 tracking-widest ml-4">00:00:00</div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-[10px] font-bold px-2 py-1 rounded border ${activeTimer.isBillable ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'} uppercase tracking-wider">${activeTimer.isBillable ? 'Billable' : 'Non-Billable'}</span>
                <button onclick="window.stopActiveTimer()" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5">
                    ${getIconSVG('check', 'w-3.5 h-3.5')} Stop & Save
                </button>
                <button onclick="window.discardActiveTimer()" class="px-3 py-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] text-rose-500 rounded-lg text-xs font-bold transition-colors cursor-pointer" title="Discard">
                    ${getIconSVG('trash', 'w-3.5 h-3.5')}
                </button>
            </div>
        </div>
        ` : ''}

        <!-- Stats row -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${[
                { label: 'Today', value: formatDurationShort(todayMs), sub: `Billable: ${formatDurationShort(todayBillable)}`, color: 'emerald' },
                { label: 'This Week', value: formatDurationShort(weekMs), sub: `Billable: ${formatDurationShort(weekBillable)}`, color: 'blue' },
                { label: 'Billable %', value: weekMs > 0 ? Math.round((weekBillable/weekMs)*100)+'%' : '0%', sub: 'of weekly hours', color: 'violet' },
                { label: 'Entries', value: String(viewLogs.length), sub: `${pendingCount} pending review`, color: 'amber' },
            ].map(s => `
            <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-4">
                <div class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-1">${s.label}</div>
                <div class="text-2xl font-bold font-mono text-${s.color}-500">${s.value}</div>
                <div class="text-[10px] text-[var(--color-text-muted)] mt-1">${s.sub}</div>
            </div>
            `).join('')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- LEFT: Timer + Quick Log -->
            <div class="flex flex-col gap-5">
                <!-- Start Timer -->
                ${!isRunning ? `
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-5 flex flex-col gap-4">
                    <div class="flex items-center gap-2">
                        <div class="w-2 h-2 rounded-full bg-[var(--color-text-muted)]"></div>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Start Timer</h3>
                    </div>
                    <div class="flex flex-col gap-3">
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Description</label>
                            <input type="text" id="timer-description-input" placeholder="What are you working on?" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-emerald-500 transition-colors">
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Workspace</label>
                            <select id="timer-project-select" onchange="window.handleTimerProjectChange(this.value)" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none cursor-pointer focus:border-emerald-500 transition-colors">
                                <option value="">— General Work —</option>
                                ${activeProjects.map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Task</label>
                            <select id="timer-task-select" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none cursor-pointer">
                                <option value="">— No Task —</option>
                            </select>
                        </div>
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" id="timer-billable-checkbox" checked class="w-4 h-4 rounded accent-emerald-500 cursor-pointer">
                                <span class="text-xs font-semibold text-[var(--color-text-main)]">Billable</span>
                            </label>
                        </div>
                    </div>
                    <button onclick="window.startActiveTimer()" class="bg-emerald-500 hover:bg-emerald-600 text-white w-full py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-500/30">
                        ${getIconSVG('play', 'w-4 h-4')} Start Timer
                    </button>
                </div>
                ` : ''}

                <!-- Weekly Bar Chart -->
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-5">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">This Week</h3>
                        <span class="text-xs font-mono font-bold text-[var(--color-text-main)]">${formatDurationShort(weekMs)}</span>
                    </div>
                    <div class="flex items-end gap-1.5 h-24">
                        ${weekBarData.map((d, i) => {
                            const pct = maxHours > 0 ? (d.hours / maxHours) * 100 : 0;
                            const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                            return `
                            <div class="flex-1 flex flex-col items-center gap-1">
                                <div class="w-full relative flex items-end" style="height:80px;">
                                    <div class="w-full rounded-t-sm transition-all duration-500 ${isToday ? 'bg-emerald-500' : 'bg-[var(--color-panel-hover)]'} border ${isToday ? 'border-emerald-400' : 'border-[var(--color-glass-border)]'}"
                                         style="height:${Math.max(pct, 2)}%; min-height: 3px;"
                                         title="${d.day}: ${d.hours}h">
                                    </div>
                                </div>
                                <span class="text-[9px] font-bold ${isToday ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'}">${d.day}</span>
                            </div>`;
                        }).join('')}
                    </div>
                    <div class="mt-3 pt-3 border-t border-[var(--color-glass-border)] flex justify-between text-[10px] text-[var(--color-text-muted)]">
                        <span>Billable: <span class="font-bold text-emerald-500">${formatDurationShort(weekBillable)}</span></span>
                        <span>Non-Billable: <span class="font-bold text-amber-500">${formatDurationShort(weekMs - weekBillable)}</span></span>
                    </div>
                </div>

                <!-- Hourly Rate (manager only) -->
                ${isManager ? `
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-5">
                    <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Payroll Estimate</h3>
                    <div class="flex flex-col gap-2 text-xs">
                        ${teamMembers.slice(0,5).map(m => {
                            const mLogs = state.timeLogs.filter(l => l.userId === m.id || (!l.userId && m.email === state.currentUser));
                            const mWeekLogs = getThisWeekLogs(mLogs);
                            const mHours = msToHours(mWeekLogs.reduce((s,l) => s + l.durationMs, 0));
                            const rate = 25; // Default rate - would come from employee record
                            const estPay = (mHours * rate).toFixed(2);
                            return `
                            <div class="flex items-center justify-between py-1.5 border-b border-[var(--color-glass-border)]/50">
                                <div class="flex items-center gap-2">
                                    <div class="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style="background-color: ${m.avatarColor || '#6366f1'}">
                                        ${m.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <span class="font-semibold text-[var(--color-text-main)] truncate max-w-[80px]">${sanitizeHTML(m.name)}</span>
                                </div>
                                <div class="text-right">
                                    <div class="font-mono font-bold text-[var(--color-text-main)]">${mHours}h</div>
                                    <div class="text-[10px] text-emerald-500">~$${estPay}</div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- RIGHT: Time Entries Log -->
            <div class="lg:col-span-2 flex flex-col gap-5">
                <!-- Tab bar -->
                <div class="flex items-center gap-1 bg-[var(--color-panel-hover)] p-1 rounded-xl border border-[var(--color-glass-border)]">
                    ${['My Entries', isManager ? 'Team View' : '', isManager ? 'Approvals' : '', 'Reports'].filter(Boolean).map((tab, i) => `
                    <button onclick="window.switchTimeTab('${tab.replace(' ','-').toLowerCase()}')"
                            id="time-tab-${tab.replace(' ','-').toLowerCase()}"
                            class="time-tab flex-1 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${i === 0 ? 'bg-[var(--color-glass-bg)] text-[var(--color-text-main)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}">
                        ${tab}
                    </button>
                    `).join('')}
                </div>

                <!-- MY ENTRIES TAB -->
                <div id="time-panel-my-entries" class="time-panel flex flex-col gap-3">
                    ${renderEntriesTable(viewLogs.slice(0, 30), false, isManager)}
                </div>

                <!-- TEAM VIEW TAB (manager) -->
                ${isManager ? `
                <div id="time-panel-team-view" class="time-panel hidden flex flex-col gap-3">
                    ${memberSummaryHTML}
                </div>

                <!-- APPROVALS TAB -->
                <div id="time-panel-approvals" class="time-panel hidden flex flex-col gap-3">
                    ${renderApprovalsPanel(viewLogs)}
                </div>
                ` : ''}

                <!-- REPORTS TAB -->
                <div id="time-panel-reports" class="time-panel hidden">
                    ${renderReportsPanel(viewLogs)}
                </div>
            </div>
        </div>
    </div>

    <!-- Manual Log Modal -->
    <div id="manual-log-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50">
        <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] p-6 rounded-2xl w-full max-w-lg flex flex-col gap-4 shadow-2xl">
            <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-[var(--color-text-main)] font-outfit">Log Time Entry</h3>
                <button onclick="window.hideManualLogModal()" class="text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors">${getIconSVG('close', 'w-5 h-5')}</button>
            </div>
            <div class="flex flex-col gap-3">
                <div>
                    <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Description</label>
                    <input type="text" id="manual-description-input" placeholder="What did you work on?" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-emerald-500">
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Workspace</label>
                        <select id="manual-project-select" onchange="window.handleManualProjectChange(this.value)" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none cursor-pointer">
                            <option value="">— General Work —</option>
                            ${state.projects.filter(p => !p.isBinned && !p.isArchived).map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Task</label>
                        <select id="manual-task-select" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none cursor-pointer">
                            <option value="">— No Task —</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-3">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Date</label>
                        <input type="date" id="manual-date-input" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-emerald-500 cursor-pointer">
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Start</label>
                        <input type="time" id="manual-start-input" value="09:00" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-emerald-500 cursor-pointer">
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">End</label>
                        <input type="time" id="manual-end-input" value="10:00" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none focus:border-emerald-500 cursor-pointer">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Hours</label>
                        <input type="number" id="manual-hours-input" min="0" max="24" value="1" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-[var(--color-text-muted)] mb-1">Minutes</label>
                        <input type="number" id="manual-minutes-input" min="0" max="59" value="0" class="w-full bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] p-2.5 rounded-lg text-[var(--color-text-main)] text-xs focus:outline-none">
                    </div>
                </div>
                <div class="flex items-center gap-3 py-1">
                    <label class="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" id="manual-billable-checkbox" checked class="w-4 h-4 rounded accent-emerald-500 cursor-pointer">
                        <span class="text-xs font-semibold text-[var(--color-text-main)]">Billable Hours</span>
                    </label>
                </div>
            </div>
            <div class="flex justify-end gap-3 pt-2 border-t border-[var(--color-glass-border)]">
                <button onclick="window.hideManualLogModal()" class="px-4 py-2 bg-[var(--color-panel-hover)] border border-[var(--color-glass-border)] rounded-lg text-xs font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.saveManualTimeLog()" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm">Save Entry</button>
            </div>
        </div>
    </div>

    <script>
    // Tab switching
    window.switchTimeTab = function(tab) {
        document.querySelectorAll('.time-panel').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.time-tab').forEach(b => {
            b.classList.remove('bg-[var(--color-glass-bg)]', 'text-[var(--color-text-main)]', 'shadow-sm');
            b.classList.add('text-[var(--color-text-muted)]');
        });
        const panel = document.getElementById('time-panel-' + tab);
        if (panel) panel.classList.remove('hidden');
        const btn = document.getElementById('time-tab-' + tab);
        if (btn) {
            btn.classList.add('bg-[var(--color-glass-bg)]', 'text-[var(--color-text-main)]', 'shadow-sm');
            btn.classList.remove('text-[var(--color-text-muted)]');
        }
    };

    // Approve/reject time entries
    window.approveTimeLog = function(logId) {
        const log = window.appState?.timeLogs?.find(l => l.id === logId);
        if (log) { log.status = 'approved'; log.approvedBy = window.appState?.currentUser; }
        if (window.notifyStateChange) window.notifyStateChange();
    };
    window.rejectTimeLog = function(logId) {
        const log = window.appState?.timeLogs?.find(l => l.id === logId);
        if (log) { log.status = 'rejected'; }
        if (window.notifyStateChange) window.notifyStateChange();
    };
    </script>
    `;
}

// ─── SUB-RENDERS ────────────────────────────────────────────────────────────

function renderEntriesTable(logs: any[], showUser: boolean, showApproval: boolean): string {
    if (logs.length === 0) {
        return `<div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-10 text-center">
            <div class="text-[var(--color-text-muted)] text-xs">No time entries yet. Start a timer or log time manually.</div>
        </div>`;
    }

    // Group by date
    const grouped: Record<string, any[]> = {};
    logs.forEach(log => {
        const date = new Date(log.timestamp).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric' });
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(log);
    });

    return Object.entries(grouped).map(([date, dayLogs]) => {
        const dayTotal = dayLogs.reduce((s, l) => s + l.durationMs, 0);
        return `
        <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden">
            <div class="flex justify-between items-center px-4 py-3 bg-[var(--color-panel-hover)]/50 border-b border-[var(--color-glass-border)]">
                <span class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">${date}</span>
                <span class="text-xs font-mono font-bold text-[var(--color-text-main)]">${formatDurationShort(dayTotal)}</span>
            </div>
            <div class="divide-y divide-[var(--color-glass-border)]/50">
                ${dayLogs.map(log => {
                    const statusColor = log.status === 'approved' ? 'text-emerald-500' : log.status === 'rejected' ? 'text-rose-500' : 'text-amber-500';
                    const statusLabel = log.status || 'pending';
                    return `
                    <div class="flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-panel-hover)]/50 transition-colors group">
                        <div class="w-1.5 h-8 rounded-full ${log.billable ? 'bg-emerald-500' : 'bg-amber-500'} shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <div class="text-xs font-semibold text-[var(--color-text-main)] truncate">${sanitizeHTML(log.description || log.taskTitle || 'No description')}</div>
                            <div class="text-[10px] text-[var(--color-text-muted)] truncate mt-0.5">
                                ${sanitizeHTML(log.projectName || 'General')}${log.taskTitle && log.description ? ' · ' + sanitizeHTML(log.taskTitle) : ''}
                                ${log.startTime && log.endTime ? ` · ${log.startTime} – ${log.endTime}` : ''}
                                ${showUser && log.userName ? ` · ${sanitizeHTML(log.userName)}` : ''}
                            </div>
                        </div>
                        <div class="flex items-center gap-3 shrink-0">
                            ${showApproval ? `<span class="text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${statusColor} border-current/30 bg-current/5">${statusLabel}</span>` : ''}
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded border ${log.billable ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-amber-500 border-amber-500/30 bg-amber-500/10'}">${log.billable ? '$ Billable' : 'Non-Bill'}</span>
                            <span class="font-mono text-xs font-bold text-[var(--color-text-main)]">${formatDurationShort(log.durationMs)}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }).join('');
}

function buildMemberSummary(logs: any[]): string {
    const members = state.team;
    const { weekStart, weekEnd } = getWeekBounds();

    return `
    <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--color-glass-border)] bg-[var(--color-panel-hover)]/50">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Team Hours — This Week</h3>
        </div>
        <div class="divide-y divide-[var(--color-glass-border)]/50">
            ${members.map(m => {
                const mLogs = state.timeLogs.filter(l => l.userId === m.id || (!l.userId && m.email === state.currentUser));
                const weekLogs = mLogs.filter(l => l.timestamp >= weekStart && l.timestamp <= weekEnd);
                const weekMs = weekLogs.reduce((s, l) => s + l.durationMs, 0);
                const billableMs = weekLogs.filter(l => l.billable).reduce((s, l) => s + l.durationMs, 0);
                const pct = weekMs > 0 ? Math.round((billableMs/weekMs)*100) : 0;
                const targetHours = 40;
                const doneHours = msToHours(weekMs);
                const barPct = Math.min((doneHours / targetHours) * 100, 100);

                return `
                <div class="flex items-center gap-4 px-4 py-3 hover:bg-[var(--color-panel-hover)]/50 transition-colors">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style="background-color: ${m.avatarColor || '#6366f1'}">
                        ${m.name.substring(0,2).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-semibold text-[var(--color-text-main)]">${sanitizeHTML(m.name)}</div>
                        <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">${sanitizeHTML(m.role)}</div>
                        <div class="mt-1.5 h-1.5 w-full bg-[var(--color-panel-hover)] rounded-full overflow-hidden">
                            <div class="h-full rounded-full bg-emerald-500 transition-all" style="width:${barPct}%"></div>
                        </div>
                    </div>
                    <div class="text-right shrink-0">
                        <div class="font-mono text-sm font-bold text-[var(--color-text-main)]">${formatDurationShort(weekMs)}</div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">${pct}% billable</div>
                        <div class="text-[10px] text-emerald-500">${doneHours}h / ${targetHours}h</div>
                    </div>
                </div>`;
            }).join('')}
        </div>
    </div>
    ${renderEntriesTable(logs.slice(0, 20), true, true)}`;
}

function renderApprovalsPanel(logs: any[]): string {
    const pending = logs.filter(l => !l.status || l.status === 'pending');

    if (pending.length === 0) {
        return `<div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-10 text-center">
            <div class="text-emerald-500 text-2xl mb-2">✓</div>
            <div class="text-xs font-bold text-[var(--color-text-main)]">All caught up!</div>
            <div class="text-[10px] text-[var(--color-text-muted)] mt-1">No pending time approvals</div>
        </div>`;
    }

    return `
    <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden">
        <div class="px-4 py-3 border-b border-[var(--color-glass-border)] bg-amber-500/5">
            <h3 class="text-xs font-bold uppercase tracking-wider text-amber-500">Pending Approvals (${pending.length})</h3>
        </div>
        <div class="divide-y divide-[var(--color-glass-border)]/50">
            ${pending.map(log => `
            <div class="flex items-center gap-3 px-4 py-3">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-semibold text-[var(--color-text-main)]">${sanitizeHTML(log.description || log.taskTitle || 'Time Entry')}</div>
                    <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        ${sanitizeHTML(log.projectName || 'General')} · ${sanitizeHTML(log.userName || 'Unknown')} · ${new Date(log.timestamp).toLocaleDateString()}
                    </div>
                </div>
                <span class="font-mono text-xs font-bold text-[var(--color-text-main)] shrink-0">${formatDurationShort(log.durationMs)}</span>
                <div class="flex gap-2 shrink-0">
                    <button onclick="window.approveTimeLog('${log.id}')" class="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 rounded-lg text-[10px] font-bold transition-colors cursor-pointer">Approve</button>
                    <button onclick="window.rejectTimeLog('${log.id}')" class="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 rounded-lg text-[10px] font-bold transition-colors cursor-pointer">Reject</button>
                </div>
            </div>`).join('')}
        </div>
    </div>`;
}

function renderReportsPanel(logs: any[]): string {
    const periods = [
        { label: 'Today', ms: 86400000 },
        { label: 'This Week', ms: 7 * 86400000 },
        { label: 'This Month', ms: 30 * 86400000 },
    ];

    // Group by project
    const byProject: Record<string, number> = {};
    logs.forEach(l => {
        const k = l.projectName || 'General';
        byProject[k] = (byProject[k] || 0) + l.durationMs;
    });
    const projectEntries = Object.entries(byProject).sort((a, b) => b[1] - a[1]);
    const maxProjMs = projectEntries[0]?.[1] || 1;

    return `
    <div class="flex flex-col gap-5">
        <!-- Period breakdown -->
        <div class="grid grid-cols-3 gap-3">
            ${periods.map(p => {
                const stats = getStatsByPeriod(logs, p.ms);
                return `
                <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl p-4 text-center">
                    <div class="text-[10px] uppercase font-bold text-[var(--color-text-muted)] tracking-wider mb-2">${p.label}</div>
                    <div class="text-xl font-mono font-bold text-[var(--color-text-main)]">${formatDurationShort(stats.totalMs)}</div>
                    <div class="text-[10px] text-emerald-500 mt-1">${formatDurationShort(stats.billableMs)} billable</div>
                    <div class="text-[10px] text-[var(--color-text-muted)]">${stats.count} entries</div>
                </div>`;
            }).join('')}
        </div>

        <!-- By Project -->
        <div class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-[var(--color-glass-border)] bg-[var(--color-panel-hover)]/50">
                <h3 class="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Time by Workspace</h3>
            </div>
            <div class="p-4 flex flex-col gap-3">
                ${projectEntries.length === 0 ? '<div class="text-xs text-[var(--color-text-muted)] text-center py-4">No data yet</div>' :
                  projectEntries.map(([proj, ms]) => {
                    const pct = Math.round((ms / maxProjMs) * 100);
                    return `
                    <div>
                        <div class="flex justify-between text-[11px] mb-1">
                            <span class="font-semibold text-[var(--color-text-main)] truncate">${sanitizeHTML(proj)}</span>
                            <span class="font-mono text-[var(--color-text-muted)] shrink-0 ml-2">${formatDurationShort(ms)}</span>
                        </div>
                        <div class="h-2 bg-[var(--color-panel-hover)] rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500" style="width:${pct}%"></div>
                        </div>
                    </div>`;
                  }).join('')
                }
            </div>
        </div>
    </div>`;
}
