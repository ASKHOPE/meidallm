import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderPublishView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectDrafts = state.drafts.filter(d => d.projectId === pid);
    const projectSchedules = state.publishSchedules.filter(s => s.projectId === pid);

    return `
    <div class="fade-in flex flex-col lg:flex-row gap-6">
        <!-- Composer/Scheduler Panel -->
        <div class="flex-grow bg-glass-bg border border-glass-border p-6 rounded-2xl">
            <h3 class="text-xl font-semibold text-white font-outfit mb-2">Publish & Schedule Campaign</h3>
            <p class="text-text-muted text-sm mb-6">Distribute approved drafts to your connected API channels.</p>

            <div class="flex flex-col gap-4">
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Select approved draft</label>
                    <select id="publish-draft-select" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                        <option value="">-- Choose approved content --</option>
                        ${projectDrafts.map(d => `<option value="${d.id}">${sanitizeHTML(d.title)} (${d.format})</option>`).join('')}
                    </select>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-2">Publish channels</label>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="WhatsApp" class="rounded text-primary focus:ring-primary">
                            <span>💬 WhatsApp</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="Pinterest" class="rounded text-primary focus:ring-primary">
                            <span>📌 Pinterest</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="YouTube" class="rounded text-primary focus:ring-primary">
                            <span>🎥 YouTube</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="Facebook" class="rounded text-primary focus:ring-primary">
                            <span>🔵 Facebook</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="Instagram" class="rounded text-primary focus:ring-primary">
                            <span>📸 Instagram</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="Threads" class="rounded text-primary focus:ring-primary">
                            <span>🌀 Threads</span>
                        </label>
                        <label class="flex items-center gap-2 bg-panel-hover border border-glass-border p-2.5 rounded-xl text-xs text-white cursor-pointer hover:border-primary transition-all">
                            <input type="checkbox" name="channels" value="X (Twitter)" class="rounded text-primary focus:ring-primary">
                            <span>🐦 X (Twitter)</span>
                        </label>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Publish Time</label>
                        <input id="publish-datetime" type="datetime-local" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary cursor-pointer">
                    </div>
                    <div class="flex items-end">
                        <button onclick="window.schedulePost('${pid}')" class="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white font-medium text-sm rounded-xl shadow-[0_0_15px_var(--color-primary-glow)] hover:shadow-[0_0_25px_var(--color-primary-glow)] transition-all cursor-pointer">
                            Schedule Campaign
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Schedule Logs / Queue Panel -->
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
    `;
}
