import { state, saveState, notifyStateChange } from "../state";
import { sanitizeHTML } from "../utils";

export function renderTeamView(): string {
    const list = state.team;

    return `
    <div class="fade-in flex flex-col gap-6 max-w-4xl">
        <!-- Team Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-panel-hover/30 border border-glass-border/30 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit text-white">Team Office</h2>
                <p class="text-xs text-text-muted font-inter">Real-time presence board and availability status for campaign directors.</p>
            </div>
            <div class="flex gap-2 shrink-0">
                <button onclick="alert('Starting Call Huddle sync...')" class="px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-medium text-xs rounded-xl shadow-[0_0_15px_var(--color-primary-glow)] hover:shadow-[0_0_25px_var(--color-primary-glow)] transition-all cursor-pointer">🎧 Start Call Huddle</button>
            </div>
        </div>

        <!-- Office status board grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            ${list.map(tm => {
                let statusLabel = "";
                let statusDot = "";
                let badgeClass = "";

                if (tm.status === 'active') {
                    statusLabel = "Active Now";
                    statusDot = "bg-emerald-400 animate-pulse";
                    badgeClass = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
                } else if (tm.status === 'meeting') {
                    statusLabel = "In Meeting";
                    statusDot = "bg-rose-500";
                    badgeClass = "bg-rose-500/10 text-rose-400 border border-rose-500/20";
                } else if (tm.status === 'vacation') {
                    statusLabel = "On Vacation";
                    statusDot = "bg-amber-400";
                    badgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                } else {
                    statusLabel = "Offline";
                    statusDot = "bg-slate-500";
                    badgeClass = "bg-slate-500/10 text-slate-400 border border-slate-500/20";
                }

                // If this is Hosanna (the active user), render a status select control
                const isMe = tm.id === 'tm1';

                return `
                <div class="bg-glass-bg border border-glass-border rounded-2xl p-5 flex flex-col justify-between items-center text-center gap-4 relative group hover:border-primary transition-all">
                    <div class="flex flex-col items-center gap-3">
                        <div class="w-16 h-16 rounded-full ${tm.avatarColor} flex items-center justify-center font-bold text-2xl text-white relative shadow-inner">
                            ${tm.name.substring(0, 2).toUpperCase()}
                            <span class="absolute bottom-0.5 right-0.5 w-4.5 h-4.5 rounded-full border-3 border-glass-bg flex items-center justify-center">
                                <span class="w-2.5 h-2.5 rounded-full ${statusDot}"></span>
                            </span>
                        </div>
                        <div>
                            <h4 class="font-semibold text-white text-base font-outfit">${sanitizeHTML(tm.name)}</h4>
                            <p class="text-xs text-text-muted mt-0.5">${sanitizeHTML(tm.role)}</p>
                        </div>
                    </div>

                    <div class="w-full border-t border-glass-border/30 pt-3 flex flex-col gap-2.5">
                        <div class="flex justify-between items-center text-[10px]">
                            <span class="text-text-muted">Presence:</span>
                            <span class="px-2 py-0.5 rounded-full font-semibold ${badgeClass}">${statusLabel}</span>
                        </div>
                        
                        ${isMe ? `
                        <div class="flex flex-col gap-1 items-start">
                            <label class="text-[9px] text-text-muted uppercase font-semibold">Set My Status</label>
                            <select onchange="window.updateMyPresenceStatus(this.value)" class="w-full bg-panel-hover border border-glass-border/50 text-[10px] text-white p-1.5 rounded-lg cursor-pointer focus:outline-none">
                                <option value="active" ${tm.status === 'active' ? 'selected' : ''}>🟢 Active Now</option>
                                <option value="meeting" ${tm.status === 'meeting' ? 'selected' : ''}>🔴 In Meeting</option>
                                <option value="vacation" ${tm.status === 'vacation' ? 'selected' : ''}>🌴 On Vacation</option>
                                <option value="offline" ${tm.status === 'offline' ? 'selected' : ''}>⚫ Go Offline</option>
                            </select>
                        </div>
                        ` : `
                        <button onclick="alert('Opening secure chat channel with ${sanitizeHTML(tm.name)}...')" class="w-full py-1.5 bg-panel-hover border border-glass-border hover:bg-glass-border text-[10px] font-semibold text-white rounded-lg transition-colors cursor-pointer">
                            Send Quick Chat
                        </button>
                        `}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.updateMyPresenceStatus = (newStatus: string) => {
        const me = state.team.find(tm => tm.id === 'tm1');
        if (me) {
            me.status = newStatus as any;
            saveState();
            notifyStateChange();
        }
    };
}
