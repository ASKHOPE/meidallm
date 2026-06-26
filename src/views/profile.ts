import { state, notifyStateChange } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('saved') || msg.toLowerCase().includes('updated');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

export function renderProfileView(): string {
    const userProfile = state.team.find(t => t.email === state.currentUser) || state.team[0];
    const systemRole = userProfile?.systemRole || 'user';
    const displayName = state.currentUser ? state.currentUser.split('@')[0] || 'Admin' : 'Admin';
    const email = state.currentUser || 'admin@meidallm.com';

    return `
        <div class="fade-in bg-background border border-text-main/15 rounded-2xl p-8 max-w-2xl flex flex-col gap-6">
            <div>
                <h2 class="text-2xl font-outfit text-text-main mb-2">Profile Management</h2>
                <p class="text-text-muted text-sm">Manage your personal information, active sessions, security preferences, and system access.</p>
            </div>

            <!-- Profile Info Card -->
            <div class="flex items-center gap-4 bg-panel-hover/30 border border-text-main/10 rounded-2xl p-5">
                <div class="w-16 h-16 rounded-full bg-rose-600 flex items-center justify-center font-bold text-2xl text-white shadow-inner select-none">
                    ${displayName.substring(0, 2).toUpperCase()}
                </div>
                <div class="overflow-hidden flex-1">
                    <h3 class="font-outfit font-bold text-lg text-text-main leading-tight truncate">${sanitizeHTML(displayName)}</h3>
                    <p class="text-xs text-text-muted mt-0.5 truncate">${sanitizeHTML(email)}</p>
                    <span class="inline-block mt-2 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        ${systemRole.replace('_', ' ')}
                    </span>
                </div>
            </div>

            <!-- User Personal Information Form -->
            <div class="flex flex-col gap-4 border-t border-text-main/10 pt-5">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Personal Details</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Full Display Name</label>
                        <input type="text" id="profile-display-name" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="Admin" value="${sanitizeHTML(displayName)}">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Contact Email Address</label>
                        <input type="email" id="profile-email" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="john.doe@enterprise.com" value="${sanitizeHTML(email)}">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Job Role / Title</label>
                    <input type="text" id="profile-job-role" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main" placeholder="Product Architect" value="${sanitizeHTML(userProfile?.role || 'Super Admin')}">
                </div>
            </div>

            <!-- Security & Tokens -->
            <div class="flex flex-col gap-4 border-t border-text-main/10 pt-5">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Security & Access Tokens</h3>
                
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Developer API Token</label>
                    <div class="flex gap-2">
                        <input type="password" id="profile-api-token" class="w-full bg-panel-hover border border-text-main/15 p-3 rounded-xl text-text-main text-sm focus:outline-none focus:border-text-main font-mono" value="sk_live_meidallm_9831a89cdef703ab" disabled>
                        <button onclick="window.copyProfileToken()" class="px-4 py-3 bg-panel-hover hover:bg-panel-hover/80 text-text-main border border-text-main/15 rounded-xl cursor-pointer text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0">
                            ${getIconSVG('paperclip', 'w-3.5 h-3.5')} Copy
                        </button>
                    </div>
                    <span class="text-[10px] text-text-muted mt-1 block">Used to authenticate background requests and CLI uploads.</span>
                </div>
            </div>

            <!-- Profile Action buttons -->
            <div class="pt-5 border-t border-text-main/10 flex justify-end gap-3">
                <button onclick="window.navigateTo('workspaces')" class="px-5 py-3 bg-panel-hover text-text-main hover:bg-panel-hover/80 font-medium text-xs rounded-xl cursor-pointer transition-colors">
                    Cancel
                </button>
                <button onclick="window.saveProfileDetails()" class="px-6 py-3 bg-text-main text-background font-bold text-xs rounded-xl cursor-pointer transition-all">
                    Save Profile Changes
                </button>
            </div>
        </div>
    `;
}

if (typeof window !== 'undefined') {
    const w = window as any;

    w.copyProfileToken = () => {
        navigator.clipboard.writeText("sk_live_meidallm_9831a89cdef703ab");
        alert("Success: API token copied to clipboard!");
    };

    w.saveProfileDetails = () => {
        const nameEl = document.getElementById('profile-display-name') as HTMLInputElement;
        const emailEl = document.getElementById('profile-email') as HTMLInputElement;
        const roleEl = document.getElementById('profile-job-role') as HTMLInputElement;

        if (nameEl && emailEl && roleEl) {
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const role = roleEl.value.trim();

            if (!name || !email) {
                alert("Error: Name and Email cannot be empty.");
                return;
            }

            // Find current user profile
            const profile = state.team.find(t => t.email === state.currentUser) || state.team[0];
            if (profile) {
                profile.name = name;
                profile.email = email;
                profile.role = role;
                state.currentUser = email;
                notifyStateChange();
                alert("Success: Profile details updated successfully!");
            }
        }
    };
}
