import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderTimeTrackingView(): string {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const currentProject = state.projects.find(p => p.id === state.currentProject);

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
                <button class="bg-background border border-text-main/15 hover:bg-text-main/5 text-text-main px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                    Export CSV
                </button>
                <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="alert('Log manual time')">
                    ${getIconSVG('plus', 'w-4 h-4')} Log Time
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-1 flex flex-col gap-6">
                <!-- Daily Summary -->
                <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm">
                    <h3 class="font-bold text-xs uppercase tracking-wider text-text-muted mb-4">${today}</h3>
                    <div class="flex flex-col gap-4">
                        <div class="text-center">
                            <div class="text-4xl font-bold font-mono text-emerald-500 tracking-tight">6h 15m</div>
                            <div class="text-[10px] text-text-muted uppercase tracking-wider mt-1">Total Logged Today</div>
                        </div>
                        <div class="h-px bg-text-main/10 w-full"></div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-text-muted font-bold">Billable:</span>
                            <span class="text-text-main font-mono">4h 30m</span>
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-text-muted font-bold">Non-Billable:</span>
                            <span class="text-text-main font-mono">1h 45m</span>
                        </div>
                    </div>
                </div>

                <!-- Timer active -->
                <div class="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl shadow-sm text-center">
                    <h3 class="font-bold text-xs text-emerald-500 mb-2">Active Timer</h3>
                    <div class="text-xl font-mono text-text-main font-bold mb-3">00:45:12</div>
                    <div class="text-[10px] text-text-muted mb-4 truncate">Drafting Q4 Campaign Brief...</div>
                    <button class="bg-emerald-500 text-white w-full py-2 rounded-lg text-xs font-bold transition-colors hover:bg-emerald-600">
                        Stop Timer
                    </button>
                </div>
            </div>

            <div class="lg:col-span-3 flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden shadow-sm">
                    <div class="p-4 border-b border-text-main/10 bg-text-main/5 flex justify-between items-center">
                        <h3 class="font-bold text-sm text-text-main">Recent Time Entries</h3>
                    </div>
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-wider text-text-muted bg-text-main/5 border-b border-text-main/10">
                                <th class="p-4 font-bold">Task / Project</th>
                                <th class="p-4 font-bold">Duration</th>
                                <th class="p-4 font-bold">Type</th>
                                <th class="p-4 font-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody class="text-xs divide-y divide-text-main/10">
                            <tr class="hover:bg-text-main/5 transition-colors">
                                <td class="p-4">
                                    <div class="font-bold text-text-main">Design email newsletter templates</div>
                                    <div class="text-[10px] text-text-muted mt-0.5">Q4 Holiday Launch</div>
                                </td>
                                <td class="p-4 font-mono font-bold text-text-main">2h 15m</td>
                                <td class="p-4">
                                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border text-emerald-500 bg-emerald-500/10 border-emerald-500/20">Billable</span>
                                </td>
                                <td class="p-4">
                                    <button class="text-text-muted hover:text-text-main transition-colors">${getIconSVG('edit', 'w-4 h-4')}</button>
                                </td>
                            </tr>
                            <tr class="hover:bg-text-main/5 transition-colors">
                                <td class="p-4">
                                    <div class="font-bold text-text-main">Weekly Team Sync</div>
                                    <div class="text-[10px] text-text-muted mt-0.5">Internal</div>
                                </td>
                                <td class="p-4 font-mono font-bold text-text-main">1h 00m</td>
                                <td class="p-4">
                                    <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border text-amber-500 bg-amber-500/10 border-amber-500/20">Non-Billable</span>
                                </td>
                                <td class="p-4">
                                    <button class="text-text-muted hover:text-text-main transition-colors">${getIconSVG('edit', 'w-4 h-4')}</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}
