import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderAdminTenantsView(): string {
    return `
    <div class="fade-in flex flex-col gap-6 max-w-5xl mx-auto">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('folder', 'w-6 h-6 text-emerald-500')} Tenant Management
                </h2>
                <p class="text-xs text-text-muted mt-1">Provision and manage isolated tenants within the system.</p>
            </div>
            <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                ${getIconSVG('plus', 'w-4 h-4')} Provision Tenant
            </button>
        </div>

        <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                        <th class="p-4 font-bold border-b border-text-main/10">Tenant ID</th>
                        <th class="p-4 font-bold border-b border-text-main/10">Name</th>
                        <th class="p-4 font-bold border-b border-text-main/10">Status</th>
                        <th class="p-4 font-bold border-b border-text-main/10 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="text-xs divide-y divide-text-main/10">
                    ${state.tenants.map(t => `
                    <tr class="hover:bg-text-main/5 transition-colors">
                        <td class="p-4 font-mono text-text-muted">${sanitizeHTML(t.id)}</td>
                        <td class="p-4 font-bold text-text-main">${sanitizeHTML(t.name)}</td>
                        <td class="p-4">
                            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>
                        </td>
                        <td class="p-4 flex justify-end gap-2">
                            <button class="px-3 py-1.5 rounded-lg border border-text-main/15 hover:bg-text-main/10 transition-colors font-bold text-[11px]">Edit</button>
                            <button class="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors font-bold text-[11px]">Suspend</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;
}

export function renderAdminRBACView(): string {
    return `
    <div class="fade-in flex flex-col gap-8 max-w-6xl mx-auto">
        <div class="border-b border-text-main/10 pb-4">
            <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                ${getIconSVG('team', 'w-6 h-6 text-purple-500')} RBAC & User Privileges
            </h2>
            <p class="text-xs text-text-muted mt-1">Manage custom roles and elevate user privileges across the system.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Custom Roles Configuration -->
            <div class="lg:col-span-1 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-sm text-text-main">Custom Roles</h3>
                    <button class="text-xs text-purple-500 hover:text-purple-400 font-bold">+ New Role</button>
                </div>
                <div class="flex flex-col gap-3">
                    ${state.customRoles.map(r => `
                    <div class="bg-background border border-text-main/15 p-4 rounded-xl hover:border-purple-500/50 transition-colors cursor-pointer group">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-bold text-xs text-text-main group-hover:text-purple-500 transition-colors">${sanitizeHTML(r.name)}</h4>
                            <span class="text-[9px] font-mono text-text-muted bg-text-main/10 px-1.5 py-0.5 rounded">${sanitizeHTML(r.tenantId)}</span>
                        </div>
                        <p class="text-[11px] text-text-muted mb-3 leading-relaxed">${sanitizeHTML(r.description)}</p>
                        <div class="flex flex-wrap gap-1.5">
                            ${r.permissions.map(p => `<span class="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded text-[9px] font-mono">${sanitizeHTML(p)}</span>`).join('')}
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>

            <!-- User Privileges Matrix -->
            <div class="lg:col-span-2 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h3 class="font-bold text-sm text-text-main">User Matrix</h3>
                    <input type="text" placeholder="Search users..." class="bg-background border border-text-main/15 rounded-lg px-3 py-1.5 text-xs text-text-main focus:outline-none focus:border-purple-500 transition-colors w-64">
                </div>
                <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                                <th class="p-3 font-bold border-b border-text-main/10">User</th>
                                <th class="p-3 font-bold border-b border-text-main/10">Global Role</th>
                                <th class="p-3 font-bold border-b border-text-main/10">Custom Role Assignments</th>
                                <th class="p-3 font-bold border-b border-text-main/10"></th>
                            </tr>
                        </thead>
                        <tbody class="text-xs divide-y divide-text-main/10">
                            ${state.team.map(user => {
                                const assignedRoles = (user.customRoleIds || []).map(rid => state.customRoles.find(r => r.id === rid)).filter(Boolean) as any[];
                                return `
                                <tr class="hover:bg-text-main/5 transition-colors">
                                    <td class="p-3">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-white font-bold text-xs shrink-0">${user.name.substring(0, 2).toUpperCase()}</div>
                                            <div>
                                                <div class="font-bold text-text-main text-xs">${sanitizeHTML(user.name)}</div>
                                                <div class="text-[10px] text-text-muted">${sanitizeHTML(user.email)}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-3 font-mono text-[11px] text-text-muted uppercase">${sanitizeHTML(user.role)}</td>
                                    <td class="p-3">
                                        <div class="flex flex-wrap gap-1.5">
                                            ${assignedRoles.length > 0 
                                                ? assignedRoles.map(r => `<span class="px-2 py-0.5 bg-purple-500/10 text-purple-500 border border-purple-500/20 rounded text-[9px] font-bold">${sanitizeHTML(r.name)}</span>`).join('')
                                                : `<span class="text-[10px] text-text-muted italic">None</span>`
                                            }
                                        </div>
                                    </td>
                                    <td class="p-3 text-right">
                                        <button class="text-purple-500 hover:text-purple-400 font-bold text-[11px] transition-colors" onclick="alert('Open assignment modal')">Manage</button>
                                    </td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}

export function renderAdminPoliciesView(): string {
    return `
    <div class="fade-in flex flex-col gap-6 max-w-4xl mx-auto">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('check', 'w-6 h-6 text-blue-500')} Rules & Policies
                </h2>
                <p class="text-xs text-text-muted mt-1">Enforce system-wide or tenant-specific access rules and limitations.</p>
            </div>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                ${getIconSVG('plus', 'w-4 h-4')} Create Policy
            </button>
        </div>

        <div class="grid grid-cols-1 gap-4">
            ${state.policies.map(p => `
            <div class="bg-background border ${p.enforced ? 'border-blue-500/40 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-text-main/15'} p-5 rounded-xl flex items-center justify-between transition-all">
                <div class="flex items-start gap-4">
                    <div class="mt-1 ${p.enforced ? 'text-blue-500' : 'text-text-muted'}">
                        ${p.type === 'security' ? getIconSVG('bot', 'w-5 h-5') : p.type === 'billing' ? getIconSVG('analytics', 'w-5 h-5') : getIconSVG('kanban-board', 'w-5 h-5')}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 class="font-bold text-sm text-text-main">${sanitizeHTML(p.name)}</h3>
                            <span class="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-text-main/10 text-text-muted">${sanitizeHTML(p.type)}</span>
                            ${p.tenantId !== 'global' ? `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/10 text-blue-500 border border-blue-500/20">Tenant: ${sanitizeHTML(p.tenantId)}</span>` : `<span class="px-2 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20">Global</span>`}
                        </div>
                        <p class="text-xs text-text-muted">${sanitizeHTML(p.description)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <span class="text-[10px] font-bold uppercase ${p.enforced ? 'text-blue-500' : 'text-text-muted'}">${p.enforced ? 'Enforced' : 'Disabled'}</span>
                    <button class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${p.enforced ? 'bg-blue-500' : 'bg-text-main/20'}" onclick="window.togglePolicy('${p.id}')">
                        <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${p.enforced ? 'translate-x-6' : 'translate-x-1'}"></span>
                    </button>
                </div>
            </div>
            `).join('')}
        </div>
    </div>
    `;
}
