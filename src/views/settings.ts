export function renderSettingsView(): string {
    return `
        <div class="fade-in bg-glass-bg border border-glass-border rounded-2xl p-8 max-w-2xl">
            <h2 class="text-2xl font-outfit mb-6">Application Settings</h2>
            <div class="flex items-center justify-between py-4 border-b border-glass-border">
                <div>
                    <h4 class="font-medium text-white">Storage Synchronization</h4>
                    <p class="text-sm text-text-muted">Local Storage persistence active</p>
                </div>
                <div class="text-emerald-400 font-semibold text-sm">Active</div>
            </div>
            <div class="flex items-center justify-between py-4 border-b border-glass-border">
                <div>
                    <h4 class="font-medium text-white">Tailwind CSS v4</h4>
                    <p class="text-sm text-text-muted">Successfully migrated layout engine</p>
                </div>
                <div class="text-emerald-400 font-semibold text-sm">Active</div>
            </div>
            <div class="flex items-center justify-between py-4 border-b border-glass-border">
                <div>
                    <h4 class="font-medium text-white">TypeScript Engine</h4>
                    <p class="text-sm text-text-muted">Strict type checks with Vite compilation</p>
                </div>
                <div class="text-emerald-400 font-semibold text-sm">Active</div>
            </div>
            <div class="pt-6">
                <button onclick="window.resetAppState()" class="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 transition-colors text-white font-medium text-sm rounded-xl cursor-pointer">
                    Reset Application Database
                </button>
            </div>
        </div>
    `;
}
