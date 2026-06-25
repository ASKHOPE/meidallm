// Custom override for alert to use premium toast notifications
const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('converted') || msg.toLowerCase().includes('saved');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

export function renderSettingsView(): string {
    return `
        <div class="fade-in bg-background border border-text-main/15 rounded-2xl p-8 max-w-2xl flex flex-col gap-6">
            <div>
                <h2 class="text-2xl font-outfit text-text-main mb-2">Application Settings</h2>
                <p class="text-text-muted text-sm">Configure system-wide configurations and default agency preferences.</p>
            </div>

            <!-- General Configurations -->
            <div class="flex flex-col gap-4 border-t border-text-main/10 pt-4">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Campaign Preferences</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">AI Copywriting Brand Tone</label>
                        <select id="setting-brand-tone" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                            <option value="professional">Professional & Technical</option>
                            <option value="creative" selected>Creative & Catchy</option>
                            <option value="casual">Casual & Conversational</option>
                            <option value="academic">Academic & Analytical</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Default Schedule Offset</label>
                        <select id="setting-schedule-offset" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer">
                            <option value="1">1 Hour Offset</option>
                            <option value="6" selected>6 Hours Offset</option>
                            <option value="24">24 Hours (1 Day) Offset</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Incoming Webhook Endpoint</label>
                    <input type="text" id="setting-webhook-url" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="https://api.yourdomain.com/webhooks/campaigns" value="https://api.meidallm.com/v1/webhooks/ingest">
                </div>

                <div class="flex items-center gap-3 bg-panel-hover/30 border border-text-main/10 rounded-xl p-4 mt-2">
                    <input type="checkbox" id="setting-email-notify" checked class="rounded text-text-main focus:ring-text-main h-4 w-4">
                    <label for="setting-email-notify" class="text-sm text-text-main cursor-pointer select-none">
                        <strong class="block font-medium">Send Email Logs</strong>
                        <span class="text-xs text-text-muted">Receive status reports when campaigns auto-publish.</span>
                    </label>
                </div>
            </div>

            <!-- Platform Engines -->
            <div class="flex flex-col gap-3 border-t border-text-main/10 pt-6">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Platform Engines</h3>
                <div class="flex items-center justify-between py-2.5 border-b border-text-main/10">
                    <div>
                        <h4 class="font-medium text-text-main text-sm">Storage Synchronization</h4>
                        <p class="text-xs text-text-muted">Local Storage persistence active</p>
                    </div>
                    <div class="text-emerald-500 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</div>
                </div>
                <div class="flex items-center justify-between py-2.5 border-b border-text-main/10">
                    <div>
                        <h4 class="font-medium text-text-main text-sm">Tailwind CSS v4</h4>
                        <p class="text-xs text-text-muted">Layout rendering engine</p>
                    </div>
                    <div class="text-emerald-500 font-semibold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Active</div>
                </div>
            </div>

            <div class="pt-4 border-t border-text-main/10 flex justify-between gap-4">
                <button onclick="window.resetAppState()" class="px-5 py-3 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 text-rose-400 font-medium text-xs rounded-xl cursor-pointer transition-colors">
                    Reset Application Database
                </button>
                <button onclick="alert('Settings saved successfully!')" class="px-6 py-3 bg-text-main text-background font-bold text-xs rounded-xl cursor-pointer transition-all">
                    Save Configuration
                </button>
            </div>
        </div>
    `;
}
