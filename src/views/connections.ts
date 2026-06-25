import { state } from "../state";
import { sanitizeHTML } from "../utils";

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
                            <span class="text-3xl">${c.icon}</span>
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
