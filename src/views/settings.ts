import { state, notifyStateChange, updateAgencyBrand } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

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
    const brand = state.agencyBrand || { logo: 'Meidallm Agency', primaryColor: '#000000', subscriptionTier: 'pro' };
    const role = state.activeRole || 'admin';
    const isAdmin = role === 'admin';

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

            <!-- Tenant Agency Branding & Subscription (UC-8) -->
            <div class="flex flex-col gap-4 border-t border-text-main/10 pt-6">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Agency Branding & Subscription Plan</h3>
                ${!isAdmin ? `
                    <div class="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-500 font-bold flex items-center gap-2">
                        ${getIconSVG('info', 'w-4 h-4 text-amber-500 shrink-0')}
                        <span>View Only: Custom branding and subscription tier configurations require Tenant Admin privileges.</span>
                    </div>
                ` : ''}
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Agency Logo Title</label>
                        <input type="text" id="setting-agency-logo" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="Meidallm Agency" value="${sanitizeHTML(brand.logo)}" ${!isAdmin ? 'disabled' : ''}>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Primary Brand Accent Color</label>
                        <div class="flex gap-2">
                            <input type="color" id="setting-agency-color" class="h-11 w-14 bg-panel-hover border border-text-main/15 p-1 rounded-xl cursor-pointer" value="${brand.primaryColor || '#000000'}" ${!isAdmin ? 'disabled' : ''}>
                            <input type="text" id="setting-agency-color-text" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main font-mono" placeholder="#000000" value="${brand.primaryColor || '#000000'}" oninput="document.getElementById('setting-agency-color').value = this.value" ${!isAdmin ? 'disabled' : ''}>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">SaaS Subscription Tier</label>
                    <select id="setting-agency-tier" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main cursor-pointer" ${!isAdmin ? 'disabled' : ''}>
                        <option value="creator" ${brand.subscriptionTier === 'creator' ? 'selected' : ''}>Creator Tier (Max 3 Active Campaigns)</option>
                        <option value="pro" ${brand.subscriptionTier === 'pro' ? 'selected' : ''}>Agency Pro Tier (Unlimited Campaigns)</option>
                    </select>
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

            <!-- Privacy & Compliance -->
            <div class="flex flex-col gap-4 border-t border-text-main/10 pt-4">
                <h3 class="text-lg font-semibold text-text-main font-outfit flex items-center gap-2">
                    ${getIconSVG('admin-policies', 'w-5 h-5 text-violet-400')}
                    Privacy & Compliance
                </h3>
                
                <div class="flex items-center gap-3 bg-panel-hover/30 border border-text-main/10 rounded-xl p-4">
                    <input type="checkbox" id="setting-analytics-consent" ${typeof localStorage !== 'undefined' && localStorage.getItem('meidallm_privacy_consent') !== 'false' ? 'checked' : ''} 
                           onchange="window.toggleAnalyticsConsent(this.checked)" class="rounded text-text-main focus:ring-text-main h-4 w-4">
                    <label for="setting-analytics-consent" class="text-sm text-text-main cursor-pointer select-none flex-1">
                        <strong class="block font-medium">Analytics Data Collection</strong>
                        <span class="text-xs text-text-muted">Allow anonymous usage analytics to improve the product. No PII is collected.</span>
                    </label>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div class="bg-panel-hover/30 border border-text-main/10 rounded-xl p-4">
                        <h4 class="font-medium text-text-main text-sm mb-1">Data Retention</h4>
                        <p class="text-xs text-text-muted mb-2">Raw events: 90 days. Aggregated metrics: 2 years.</p>
                        <button onclick="window.purgeExpiredTelemetry()" class="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer">
                            Purge Expired Data
                        </button>
                    </div>
                    <div class="bg-panel-hover/30 border border-text-main/10 rounded-xl p-4">
                        <h4 class="font-medium text-text-main text-sm mb-1">Consent Status</h4>
                        <p class="text-xs text-text-muted mb-1" id="consent-status-display">
                            ${typeof localStorage !== 'undefined' && localStorage.getItem('meidallm_privacy_consent_ts') ? 'Consented on: ' + localStorage.getItem('meidallm_privacy_consent_ts') : 'Not recorded'}
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button onclick="window.exportMyData()" class="px-4 py-3 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 font-medium text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 justify-center">
                        ${getIconSVG('external-link', 'w-3.5 h-3.5')} Download My Data (JSON)
                    </button>
                    <button onclick="window.eraseMyData()" class="px-4 py-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 font-medium text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-2 justify-center">
                        ${getIconSVG('trash', 'w-3.5 h-3.5')} Delete My Data (Right to Erasure)
                    </button>
                </div>
            </div>

            <div class="pt-4 border-t border-text-main/10 flex justify-end gap-4">
                <button onclick="window.saveSettingsAction()" class="px-6 py-3 bg-text-main text-background font-bold text-xs rounded-xl cursor-pointer transition-all">
                    Save Configuration
                </button>
            </div>
        </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.saveSettingsAction = () => {
        const logoEl = document.getElementById('setting-agency-logo') as HTMLInputElement;
        const colorEl = document.getElementById('setting-agency-color') as HTMLInputElement;
        const tierEl = document.getElementById('setting-agency-tier') as HTMLSelectElement;

        if (logoEl && colorEl && tierEl) {
            const logo = logoEl.value.trim() || 'Meidallm Agency';
            const color = colorEl.value;
            const tier = tierEl.value as 'creator' | 'pro';

            updateAgencyBrand(logo, color, tier);
            
            // Check if there are more campaigns than allowed in Creator Tier
            const activeProjectsCount = state.projects.filter(p => !p.isArchived && !p.isBinned).length;
            if (tier === 'creator' && activeProjectsCount > 3) {
                alert(`Saved branding, but Warning: You have ${activeProjectsCount} active campaigns, which exceeds the Creator Tier limit of 3. Please archive campaigns to comply with limits.`);
            } else {
                alert("Settings and custom branding saved successfully!");
            }
        } else {
            alert("Settings saved successfully!");
        }
    };

    // Privacy & Compliance actions
    w.toggleAnalyticsConsent = (consented: boolean) => {
        localStorage.setItem('meidallm_privacy_consent', String(consented));
        localStorage.setItem('meidallm_privacy_consent_ts', new Date().toISOString());
        alert(consented ? 'Analytics collection enabled.' : 'Analytics collection disabled. No new events will be recorded.');
    };

    w.purgeExpiredTelemetry = () => {
        try {
            const key = 'meidallm_telemetry';
            const events = JSON.parse(localStorage.getItem(key) || '[]');
            const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);
            const retained = events.filter((e: any) => e.timestamp > cutoff);
            const purged = events.length - retained.length;
            localStorage.setItem(key, JSON.stringify(retained));
            alert(`Purged ${purged} expired events. ${retained.length} events retained.`);
        } catch {
            alert('No telemetry data to purge.');
        }
    };

    w.exportMyData = () => {
        const userId = state.currentUser || 'unknown';
        const data = {
            exportedAt: new Date().toISOString(),
            userId,
            telemetryEvents: JSON.parse(localStorage.getItem('meidallm_telemetry') || '[]').length,
            sessions: JSON.parse(localStorage.getItem('meidallm_session') || '[]').length,
            auditLog: JSON.parse(localStorage.getItem('meidallm_audit_log') || '[]').length,
            note: 'This export includes counts. Full data available in localStorage.'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meidallm-data-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Data export downloaded.');
    };

    w.eraseMyData = () => {
        if (!confirm('This will permanently delete all your telemetry and session data. This action cannot be undone. Continue?')) return;
        localStorage.removeItem('meidallm_telemetry');
        localStorage.removeItem('meidallm_session');
        localStorage.removeItem('meidallm_privacy_consent');
        localStorage.removeItem('meidallm_privacy_consent_ts');
        alert('All personal telemetry data has been erased.');
        notifyStateChange();
    };
}

