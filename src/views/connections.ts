import { state } from "../state";
import { sanitizeHTML } from "../utils";

function getConnectionSVG(id: string, className = 'w-8 h-8'): string {
    const svgs: Record<string, string> = {
        'conn-x': `<svg class="${className}" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
        'conn-instagram': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
        'conn-facebook': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`,
        'conn-youtube': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
        'conn-whatsapp': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
        'conn-pinterest': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
        'conn-threads': `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2a10 10 0 1 0 10 10V8a2 2 0 0 0-4 0v4a6 6 0 1 1-11.73-1.87"/></svg>`
    };
    return svgs[id] || `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
}

export function renderConnectionsView(): string {
    const list = state.connections;

    return `
    <div class="fade-in max-w-4xl bg-background border border-text-main/15 p-6 rounded-2xl text-text-main">
        <h3 class="text-xl font-bold text-text-main font-outfit mb-2">Platform Connections</h3>
        <p class="text-text-muted text-sm mb-8">Link external publisher APIs to automate social media campaigns.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${list.map(c => {
                const isConnected = c.connected;
                const statusLabel = isConnected ? "Connected" : "Disconnected";
                const statusColor = isConnected ? "text-emerald-500" : "text-text-muted";
                const btnLabel = isConnected ? "Disconnect" : "Connect Platform";
                const btnClass = isConnected 
                    ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20" 
                    : "bg-text-main text-background hover:bg-text-main/90 font-bold";

                return `
                <div class="bg-panel-hover/10 border border-text-main/15 rounded-xl p-6 flex flex-col justify-between gap-4">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl text-blue-400">${getConnectionSVG(c.id, 'w-8 h-8')}</span>
                            <div>
                                <h4 class="font-bold text-text-main text-base">${sanitizeHTML(c.name)}</h4>
                                <p class="text-xs text-text-muted mt-0.5">Status: <strong class="${statusColor}">${statusLabel}</strong></p>
                            </div>
                        </div>
                        <div class="flex items-center">
                            <!-- Toggle switch -->
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="sr-only peer" ${isConnected ? 'checked' : ''} onchange="window.toggleConnectionState('${c.id}')">
                                <div class="w-9 h-5 bg-text-main/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-main after:border-text-main/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-text-main peer-checked:after:bg-background"></div>
                            </label>
                        </div>
                    </div>

                    ${isConnected && c.username ? `
                    <div class="bg-panel-hover/30 rounded-lg p-3 text-xs text-text-muted flex justify-between items-center border border-text-main/10">
                        <span>Connected account:</span>
                        <strong class="text-text-main font-semibold">@${sanitizeHTML(c.username)}</strong>
                    </div>
                    ` : ''}

                    <div class="flex gap-2">
                        <button onclick="window.configureConnectionPrompt('${c.id}')" class="w-full py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${btnClass} transition-all">
                            ${btnLabel}
                        </button>
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </div>
    `;
}
