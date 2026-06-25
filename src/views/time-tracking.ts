import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

// Helper to format duration in milliseconds to human readable format
function formatDuration(ms: number): string {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

function getTodayLoggedMs(): number {
    const todayStart = new Date().setHours(0,0,0,0);
    return state.timeLogs
        .filter(log => log.timestamp >= todayStart)
        .reduce((sum, log) => sum + log.durationMs, 0);
}

function getTodayBillableMs(billable: boolean): number {
    const todayStart = new Date().setHours(0,0,0,0);
    return state.timeLogs
        .filter(log => log.timestamp >= todayStart && log.billable === billable)
        .reduce((sum, log) => sum + log.durationMs, 0);
}

export function renderTimeTrackingView(): string {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    
    // Compute stats
    const todayTotal = formatDuration(getTodayLoggedMs());
    const todayBillable = formatDuration(getTodayBillableMs(true));
    const todayNonBillable = formatDuration(getTodayBillableMs(false));

    const active = state.activeTimer;
    const isRunning = active.startTime !== null;

    let timerWidgetHTML = "";

    if (isRunning) {
        // Render running active timer
        timerWidgetHTML = `
        <div class="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl shadow-sm text-center flex flex-col gap-3">
            <h3 class="font-bold text-xs text-emerald-500 tracking-wider uppercase">Active Timer</h3>
            <div id="active-timer-clock" class="text-3xl font-mono text-text-main font-bold tracking-wider animate-pulse">00:00:00</div>
            
            <div class="text-left flex flex-col gap-2 mt-2">
                <div>
                    <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Project</label>
                    <div class="text-xs text-text-main font-semibold truncate bg-panel-hover p-2.5 rounded-lg border border-glass-border/30">${sanitizeHTML(active.projectName || 'General Work')}</div>
                </div>
                <div>
                    <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Task</label>
                    <div class="text-xs text-text-main font-semibold truncate bg-panel-hover p-2.5 rounded-lg border border-glass-border/30">${sanitizeHTML(active.taskTitle || 'No associated task')}</div>
                </div>
                <div class="flex items-center gap-2 mt-1">
                    <span class="text-[10px] font-bold text-text-muted uppercase">Billable Status:</span>
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${active.isBillable ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}">${active.isBillable ? 'Billable' : 'Non-Billable'}</span>
                </div>
            </div>

            <div class="flex gap-2 mt-4">
                <button onclick="window.stopActiveTimer()" class="flex-1 bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-colors hover:bg-emerald-600 cursor-pointer flex items-center justify-center gap-1">
                    ${getIconSVG('check', 'w-3.5 h-3.5')} Stop & Save
                </button>
                <button onclick="window.discardActiveTimer()" class="px-3 bg-panel-hover hover:bg-glass-border border border-glass-border text-rose-500 rounded-lg text-xs font-bold transition-colors cursor-pointer" title="Discard">
                    ${getIconSVG('trash', 'w-3.5 h-3.5')}
                </button>
            </div>
        </div>
        `;
    } else {
        // Render start timer form
        const activeProjects = state.projects.filter(p => !p.isBinned && !p.isArchived);
        timerWidgetHTML = `
        <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm flex flex-col gap-3">
            <h3 class="font-bold text-xs text-text-muted tracking-wider uppercase">Track Time</h3>
            
            <div class="flex flex-col gap-2.5">
                <div>
                    <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Select Campaign</label>
                    <select id="timer-project-select" onchange="window.handleTimerProjectChange(this.value)" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                        <option value="">-- General Work --</option>
                        ${activeProjects.map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Select Task</label>
                    <select id="timer-task-select" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                        <option value="">-- No Task / General --</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">What are you working on?</label>
                    <input type="text" id="timer-description-input" placeholder="e.g. Drafting copy, templates" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none">
                </div>
                <div class="flex items-center gap-2 py-1">
                    <input type="checkbox" id="timer-billable-checkbox" checked class="rounded bg-panel-hover border-glass-border text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                    <label for="timer-billable-checkbox" class="text-xs text-text-main font-semibold cursor-pointer">Billable Hours</label>
                </div>
            </div>

            <button onclick="window.startActiveTimer()" class="bg-emerald-500 text-white w-full py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-emerald-600 cursor-pointer flex items-center justify-center gap-1.5 mt-2">
                ${getIconSVG('play', 'w-4 h-4')} Start Timer
            </button>
        </div>
        `;
    }

    // Render table rows
    const recentLogsHTML = state.timeLogs.map(log => {
        const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
        return `
        <tr class="hover:bg-text-main/5 transition-colors border-b border-glass-border/30">
            <td class="p-4">
                <div class="font-bold text-text-main">${sanitizeHTML(log.taskTitle)}</div>
                <div class="text-[10px] text-text-muted mt-0.5">${sanitizeHTML(log.projectName)}</div>
            </td>
            <td class="p-4 font-mono font-bold text-text-main">${formatDuration(log.durationMs)}</td>
            <td class="p-4">
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${log.billable ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}">
                    ${log.billable ? 'Billable' : 'Non-Billable'}
                </span>
            </td>
            <td class="p-4 text-text-muted text-[10px]">${dateStr}</td>
        </tr>
        `;
    }).join('');

    return `
    <div class="fade-in flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('calendar', 'w-6 h-6 text-emerald-500')} Timesheets
                </h2>
                <p class="text-xs text-text-muted mt-1">Log your hours, track billable time, and review capacity.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.exportTimeLogs()" class="bg-background border border-text-main/15 hover:bg-text-main/5 text-text-main px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                    Export CSV
                </button>
                <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer" onclick="window.showManualLogModal()">
                    ${getIconSVG('plus', 'w-4 h-4')} Log Time
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-1 flex flex-col gap-6">
                <!-- Daily Summary -->
                <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm text-left">
                    <h3 class="font-bold text-xs uppercase tracking-wider text-text-muted mb-4">${today}</h3>
                    <div class="flex flex-col gap-4">
                        <div class="text-center">
                            <div class="text-4xl font-bold font-mono text-emerald-500 tracking-tight">${todayTotal}</div>
                            <div class="text-[10px] text-text-muted uppercase tracking-wider mt-1">Total Logged Today</div>
                        </div>
                        <div class="h-px bg-text-main/10 w-full"></div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-text-muted font-bold">Billable:</span>
                            <span class="text-text-main font-mono">${todayBillable}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-text-muted font-bold">Non-Billable:</span>
                            <span class="text-text-main font-mono">${todayNonBillable}</span>
                        </div>
                    </div>
                </div>

                <!-- Timer active/start widget -->
                <div id="timer-widget-container">${timerWidgetHTML}</div>
            </div>

            <div class="lg:col-span-3 flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden shadow-sm text-left">
                    <div class="p-4 border-b border-text-main/10 bg-text-main/5 flex justify-between items-center">
                        <h3 class="font-bold text-sm text-text-main">Recent Time Entries</h3>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="text-[10px] uppercase tracking-wider text-text-muted bg-text-main/5 border-b border-text-main/10">
                                    <th class="p-4 font-bold">Task / Project</th>
                                    <th class="p-4 font-bold">Duration</th>
                                    <th class="p-4 font-bold">Type</th>
                                    <th class="p-4 font-bold">Date</th>
                                </tr>
                            </thead>
                            <tbody class="text-xs divide-y divide-text-main/10">
                                ${recentLogsHTML}
                                ${state.timeLogs.length === 0 ? `
                                    <tr>
                                        <td colspan="4" class="p-8 text-center text-xs text-text-muted italic">
                                            No recent time logs found. Start the active timer or log manual time above.
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Manual Log Modal -->
        <div id="manual-log-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-left">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Log Manual Time</h3>
                
                <div class="flex flex-col gap-3">
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Select Project</label>
                        <select id="manual-project-select" onchange="window.handleManualProjectChange(this.value)" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                            <option value="">-- General Work --</option>
                            ${state.projects.filter(p => !p.isBinned && !p.isArchived).map(p => `<option value="${p.id}">${sanitizeHTML(p.name)}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Select Task</label>
                        <select id="manual-task-select" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none cursor-pointer">
                            <option value="">-- No Task / General --</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Work Description</label>
                        <input type="text" id="manual-description-input" placeholder="e.g. Project onboarding sync" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Hours</label>
                            <input type="number" id="manual-hours-input" min="0" max="24" value="1" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] uppercase font-bold text-text-muted mb-1">Minutes</label>
                            <input type="number" id="manual-minutes-input" min="0" max="59" value="0" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-lg text-text-main text-xs focus:outline-none">
                        </div>
                    </div>
                    <div class="flex items-center gap-2 py-1">
                        <input type="checkbox" id="manual-billable-checkbox" checked class="rounded bg-panel-hover border-glass-border text-emerald-500 focus:ring-emerald-500 cursor-pointer">
                        <label for="manual-billable-checkbox" class="text-xs text-text-main font-semibold cursor-pointer">Billable Hours</label>
                    </div>
                </div>

                <div class="flex justify-end gap-2 mt-2">
                    <button onclick="window.hideManualLogModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-lg text-xs font-semibold hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                    <button onclick="window.saveManualTimeLog()" class="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer">Save Entry</button>
                </div>
            </div>
        </div>
    </div>
    `;
}
