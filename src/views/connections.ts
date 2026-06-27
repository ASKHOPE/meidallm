import { state } from "../state";
import { sanitizeHTML } from "../utils";

// ─── CATEGORY CONFIG ────────────────────────────────────────────────────────
const CATEGORIES = [
    { key: 'all',     label: 'All',            icon: '⚡' },
    { key: 'social',  label: 'Social Media',   icon: '📱' },
    { key: 'video',   label: 'Video',          icon: '🎥' },
    { key: 'live',    label: 'Live Streaming', icon: '🔴' },
    { key: 'podcast', label: 'Podcasts',       icon: '🎧' },
];

// ─── BRAND COLORS ────────────────────────────────────────────────────────────
const BRAND_COLORS: Record<string, string> = {
    'conn-facebook':   '#1877F2', 'conn-instagram':  '#E1306C', 'conn-x':          '#000000',
    'conn-threads':    '#101010', 'conn-linkedin':   '#0077B5', 'conn-reddit':     '#FF4500',
    'conn-discord':    '#5865F2', 'conn-telegram':   '#26A5E4', 'conn-whatsapp':   '#25D366',
    'conn-youtube':    '#FF0000', 'conn-ytshorts':   '#FF0000', 'conn-tiktok':     '#010101',
    'conn-vimeo':      '#1AB7EA', 'conn-dailymotion':'#0096DC', 'conn-rumble':     '#85C742',
    'conn-twitch':     '#9146FF', 'conn-ytlive':     '#FF0000', 'conn-fblive':     '#1877F2',
    'conn-iglive':     '#E1306C', 'conn-tiktoblive': '#010101', 'conn-lilinlive':  '#0077B5',
    'conn-spotify':    '#1ED760', 'conn-apple':      '#FC3C44', 'conn-ytpodcast':  '#FF0000',
    'conn-amazon':     '#FF9900', 'conn-audible':    '#FF9900', 'conn-rss':        '#F26522',
};

export function renderConnectionsView(): string {
    const connections = state.connections;
    const connectedCount = connections.filter(c => c.connected).length;

    // Count by category
    const counts: Record<string, number> = { all: connections.length };
    CATEGORIES.slice(1).forEach(cat => {
        counts[cat.key] = connections.filter(c => c.category === cat.key).length;
    });
    const activeCounts: Record<string, number> = { all: connectedCount };
    CATEGORIES.slice(1).forEach(cat => {
        activeCounts[cat.key] = connections.filter(c => c.category === cat.key && c.connected).length;
    });

    return `
    <div class="fade-in flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <!-- Header -->
        <div class="flex flex-wrap justify-between items-start gap-4 border-b border-[var(--color-glass-border)] pb-5">
            <div>
                <h2 class="text-2xl font-bold font-outfit text-[var(--color-text-main)] flex items-center gap-3">
                    🔌 Connections & API
                </h2>
                <p class="text-xs text-[var(--color-text-muted)] mt-1">
                    Activate platforms to enable publishing from your workspace.
                    <strong class="text-emerald-500">${connectedCount}</strong> of ${connections.length} platforms connected.
                </p>
            </div>
            <div class="flex items-center gap-2">
                <span class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-bold px-3 py-1.5 rounded-full">${connectedCount} Active</span>
                <span class="bg-[var(--color-glass-bg)] border border-[var(--color-glass-border)] text-[var(--color-text-muted)] text-[10px] font-bold px-3 py-1.5 rounded-full">${connections.length - connectedCount} Inactive</span>
            </div>
        </div>

        <!-- Category Tabs -->
        <div class="flex items-center gap-1 bg-[var(--color-panel-hover)] p-1 rounded-xl border border-[var(--color-glass-border)] overflow-x-auto">
            ${CATEGORIES.map((cat, i) => `
            <button onclick="window.switchConnectionTab('${cat.key}')"
                    id="conn-tab-${cat.key}"
                    data-active="${i === 0 ? 'true' : 'false'}"
                    class="conn-tab flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all cursor-pointer whitespace-nowrap"
                    style="${i === 0 ? 'background:var(--color-glass-bg);color:var(--color-text-main);box-shadow:0 1px 3px rgba(0,0,0,.15)' : 'color:var(--color-text-muted)'}"
            >
                <span>${cat.icon}</span>
                <span>${cat.label}</span>
                <span style="margin-left:4px;font-size:9px;font-weight:700;padding:1px 5px;border-radius:999px;${activeCounts[cat.key] > 0 ? 'background:rgba(16,185,129,.2);color:#10b981' : 'background:var(--color-panel-hover);color:var(--color-text-muted)'}">
                    ${activeCounts[cat.key]}/${counts[cat.key]}
                </span>
            </button>
            `).join('')}
        </div>

        <!-- Platform Grid (all categories share one grid, filtered by JS) -->
        <div id="connections-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            ${connections.map(c => {
                const brandColor = BRAND_COLORS[c.id] || '#6366f1';
                const isConnected = c.connected;

                return `
                <div class="conn-card" data-category="${c.category || 'social'}">
                    <div class="bg-[var(--color-glass-bg)] border ${isConnected ? 'border-emerald-500/40' : 'border-[var(--color-glass-border)]'} rounded-xl p-4 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 group h-full">
                        <!-- Top row: icon + toggle -->
                        <div class="flex items-start justify-between">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-[var(--color-glass-border)]"
                                     style="background: ${brandColor}18;">
                                    ${c.icon}
                                </div>
                                <div class="min-w-0">
                                    <div class="font-bold text-sm text-[var(--color-text-main)] leading-tight truncate">${sanitizeHTML(c.name)}</div>
                                    <div class="text-[10px] font-medium ${isConnected ? 'text-emerald-500' : 'text-[var(--color-text-muted)]'} mt-0.5 flex items-center gap-1">
                                        <span class="w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--color-glass-border)]'}"></span>
                                        ${isConnected ? 'Connected' : 'Disconnected'}
                                    </div>
                                </div>
                            </div>
                            <!-- Toggle -->
                            <label class="relative inline-flex items-center cursor-pointer shrink-0">
                                <input type="checkbox" class="sr-only peer" ${isConnected ? 'checked' : ''} onchange="window.toggleConnectionState('${c.id}')">
                                <div class="w-9 h-5 rounded-full peer transition-all
                                    bg-[var(--color-panel-hover)] peer-checked:bg-emerald-500
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:rounded-full after:h-4 after:w-4
                                    after:transition-all peer-checked:after:translate-x-full
                                    border border-[var(--color-glass-border)] peer-checked:border-emerald-500">
                                </div>
                            </label>
                        </div>

                        <!-- Use case -->
                        <div class="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
                            <span class="font-bold text-[var(--color-text-main)]">Use:</span> ${sanitizeHTML(c.use || '—')}<br>
                            <span class="font-bold text-[var(--color-text-main)]">For:</span> ${sanitizeHTML(c.creatorTypes || '—')}
                        </div>

                        <!-- Connected account or connect button -->
                        ${isConnected && c.username ? `
                        <div class="mt-auto bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2 flex justify-between items-center">
                            <span class="text-[10px] text-[var(--color-text-muted)]">Account</span>
                            <span class="text-[10px] font-bold text-[var(--color-text-main)]">@${sanitizeHTML(c.username)}</span>
                        </div>
                        ` : `
                        <button onclick="window.configureConnectionPrompt('${c.id}')"
                                class="mt-auto w-full py-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isConnected
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20'
                                    : 'bg-[var(--color-panel-hover)] text-[var(--color-text-muted)] border border-[var(--color-glass-border)] hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}">
                            ${isConnected ? 'Disconnect' : 'Connect Platform'}
                        </button>
                        `}
                    </div>
                </div>`;
            }).join('')}
        </div>

        <!-- Info Note -->
        <div class="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
            <span class="text-blue-400 shrink-0 mt-0.5">ℹ️</span>
            <div>
                <div class="text-xs font-bold text-[var(--color-text-main)] mb-1">Publishing Integration</div>
                <p class="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
                    Connected platforms appear as publishing targets in the <strong class="text-[var(--color-text-main)]">Publish & Schedule</strong> view.
                    Toggle a platform here to activate or deactivate it across your workspace. API credentials are stored per-organization.
                </p>
            </div>
        </div>
    </div>
    `;
}
