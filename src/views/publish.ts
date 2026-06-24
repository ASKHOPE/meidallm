import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderPublishView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDrafts = state.drafts.filter(d => d.projectId === pid);
    const projectSchedules = state.publishSchedules.filter(s => s.projectId === pid);
    
    // Read view mode from state (or default to localStorage)
    const viewMode = (typeof window !== 'undefined' ? localStorage.getItem('meidallm_publish_viewmode') : 'form') || 'form';

    // RENDER: Compose Form View
    const composeFormHTML = `
    <div class="flex-grow bg-glass-bg border border-glass-border p-6 rounded-2xl">
        <h3 class="text-xl font-semibold text-white font-outfit mb-2">Publish & Schedule Campaign</h3>
        <p class="text-text-muted text-sm mb-6">Distribute approved drafts to your connected API channels.</p>

        <div class="flex flex-col gap-4">
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Select approved draft</label>
                <select id="publish-draft-select" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-white cursor-pointer">
                    <option value="">-- Choose approved content --</option>
                    ${projectDrafts.map(d => `<option value="${d.id}">${sanitizeHTML(d.title)} (${d.format})</option>`).join('')}
                </select>
            </div>

            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-2">Publish channels</label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="WhatsApp" class="rounded text-white focus:ring-zinc-500">
                        <span>💬 WhatsApp</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="Pinterest" class="rounded text-white focus:ring-zinc-500">
                        <span>📌 Pinterest</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="YouTube" class="rounded text-white focus:ring-zinc-500">
                        <span>🎥 YouTube</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="Facebook" class="rounded text-white focus:ring-zinc-500">
                        <span>🔵 Facebook</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="Instagram" class="rounded text-white focus:ring-zinc-500">
                        <span>📸 Instagram</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="Threads" class="rounded text-white focus:ring-zinc-500">
                        <span>🌀 Threads</span>
                    </label>
                    <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-white transition-all">
                        <input type="checkbox" name="channels" value="X (Twitter)" class="rounded text-white focus:ring-zinc-500">
                        <span>🐦 X (Twitter)</span>
                    </label>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Publish Date & Time</label>
                    <input id="publish-datetime" type="datetime-local" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-white cursor-pointer">
                </div>
                <div class="flex items-end">
                    <button onclick="window.schedulePost('${pid}')" class="w-full py-3.5 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 transition-all cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                        Schedule Release
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;

    // RENDER: Calendar Release View (June 2026)
    const daysInMonth = 30;
    let calendarCellsHTML = "";

    // Empty cells for Monday start offsets (June 1st, 2026 is Monday, so Monday = index 0 offset = 0)
    for (let day = 1; day <= daysInMonth; day++) {
        // Filter schedules on this specific calendar day
        const daySchedules = projectSchedules.filter(s => {
            const date = new Date(s.scheduledTime);
            return date.getDate() === day && date.getMonth() === 5 && date.getFullYear() === 2026;
        });

        const daySchedulesHTML = daySchedules.map(s => {
            const isPub = s.status === 'published';
            const statusColor = isPub ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            return `
            <div class="border rounded px-1.5 py-0.5 text-[9px] font-medium leading-tight truncate ${statusColor}" title="${sanitizeHTML(s.title)}">
                ${s.channels[0] || 'Post'}: ${sanitizeHTML(s.title)}
            </div>
            `;
        }).join('');

        calendarCellsHTML += `
        <div onclick="window.calendarCellClick('${pid}', ${day})" class="min-h-[90px] border border-glass-border/30 bg-panel-hover/20 hover:bg-panel-hover/50 p-2 rounded-xl transition-all cursor-pointer flex flex-col gap-1.5 relative group">
            <span class="text-xs font-bold text-text-muted group-hover:text-white">${day}</span>
            <div class="flex flex-col gap-1 overflow-y-auto max-h-[60px] pr-0.5">
                ${daySchedulesHTML}
            </div>
        </div>
        `;
    }

    const calendarGridHTML = `
    <div class="flex-grow bg-glass-bg border border-glass-border p-6 rounded-2xl">
        <div class="flex justify-between items-center mb-6">
            <div>
                <h3 class="text-xl font-semibold text-white font-outfit">Release Calendar</h3>
                <p class="text-xs text-text-muted">June 2026 editorial distribution schedules.</p>
            </div>
            <div class="text-xs font-bold text-white uppercase tracking-wider bg-panel-hover px-3 py-1.5 rounded-lg border border-glass-border">June 2026</div>
        </div>
        
        <!-- Calendar Grid Layout -->
        <div class="grid grid-cols-7 gap-2 mb-2 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
            <div>Sun</div>
        </div>
        
        <div class="grid grid-cols-7 gap-2">
            ${calendarCellsHTML}
        </div>
    </div>
    `;

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Calendar / Queue Toggle Tabs -->
        <div class="flex gap-6 border-b border-glass-border/30 w-full pb-2">
            <button onclick="window.setPublishViewMode('form')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'form' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Compose & Queue</button>
            <button onclick="window.setPublishViewMode('calendar')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${viewMode === 'calendar' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Release Calendar</button>
        </div>

        <div class="flex flex-col lg:flex-row gap-6">
            <!-- Left content slot based on toggle -->
            ${viewMode === 'calendar' ? calendarGridHTML : composeFormHTML}

            <!-- Distribution Queue List right sidebar -->
            <div class="w-full lg:w-80 bg-glass-bg border border-glass-border rounded-2xl p-6 flex flex-col shrink-0">
                <h3 class="text-lg font-semibold text-white font-outfit mb-4">Distribution Queue</h3>
                <div id="publish-queue-list" class="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                    ${projectSchedules.map(s => {
                        const isPublished = s.status === 'published';
                        const statusClass = isPublished ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                        return `
                        <div class="bg-panel-hover/50 border border-glass-border rounded-xl p-4 flex flex-col gap-2 relative">
                            <div class="flex justify-between items-center">
                                <span class="px-2 py-0.5 text-[9px] font-semibold border rounded-full ${statusClass}">${s.status.toUpperCase()}</span>
                                <span class="text-[10px] text-text-muted">${new Date(s.scheduledTime).toLocaleDateString()}</span>
                            </div>
                            <h4 class="font-medium text-white text-xs truncate">${sanitizeHTML(s.title)}</h4>
                            <div class="text-[10px] text-text-muted flex gap-1.5 flex-wrap">
                                ${s.channels.map(c => `<span class="bg-glass-border px-1.5 py-0.5 rounded">${c}</span>`).join('')}
                            </div>
                            ${!isPublished ? `
                                <button onclick="window.deleteSchedule('${s.id}', '${pid}')" class="absolute right-3 top-3.5 text-text-muted hover:text-rose-500 text-xs cursor-pointer">✕</button>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                    ${projectSchedules.length === 0 ? `<div class="text-center text-text-muted text-xs py-8">No scheduled posts found. Select a draft to queue.</div>` : ''}
                </div>
            </div>
        </div>
    </div>
    `;
}
