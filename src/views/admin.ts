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

export function renderAdminOrgsView(): string {
    const orgs = state.organizations.filter(o => o.tenantId === state.activeTenantId || state.activeRole === 'super_admin');
    return `
    <div class="fade-in flex flex-col gap-6 max-w-5xl mx-auto">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('folder', 'w-6 h-6 text-emerald-500')} Organization Management
                </h2>
                <p class="text-xs text-text-muted mt-1">Provision and manage organizations within your tenant.</p>
            </div>
            <button class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="const name = prompt('Enter Organization Name:'); if(name) { window.addOrganization(name); }">
                ${getIconSVG('plus', 'w-4 h-4')} Provision Organization
            </button>
        </div>

        <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                        <th class="p-4 font-bold border-b border-text-main/10">Org ID</th>
                        <th class="p-4 font-bold border-b border-text-main/10">Name</th>
                        <th class="p-4 font-bold border-b border-text-main/10">Tenant ID</th>
                        <th class="p-4 font-bold border-b border-text-main/10 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="text-xs divide-y divide-text-main/10">
                    ${orgs.length === 0 ? `<tr><td colspan="4" class="p-4 text-center text-text-muted italic">No organizations found.</td></tr>` : ''}
                    ${orgs.map(o => `
                    <tr class="hover:bg-text-main/5 transition-colors">
                        <td class="p-4 font-mono text-text-muted">${sanitizeHTML(o.id)}</td>
                        <td class="p-4 font-bold text-text-main">${sanitizeHTML(o.name)}</td>
                        <td class="p-4 font-mono text-text-muted text-[10px]">${sanitizeHTML(o.tenantId)}</td>
                        <td class="p-4 flex justify-end gap-2">
                            <button class="px-3 py-1.5 rounded-lg border border-text-main/15 hover:bg-text-main/10 transition-colors font-bold text-[11px]" onclick="const n = prompt('Edit name:', '${sanitizeHTML(o.name)}'); if(n) { window.updateOrganization('${o.id}', n); }">Edit</button>
                            <button class="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 transition-colors font-bold text-[11px]" onclick="if(confirm('Delete organization?')) { window.deleteOrganization('${o.id}'); }">Delete</button>
                        </td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>
    `;
}

export function renderCorporateOverview(): string {
    return `
    <div class="fade-in flex flex-col gap-6 max-w-5xl mx-auto">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('connections', 'w-6 h-6 text-sky-500')} Corporate Overview
                </h2>
                <p class="text-xs text-text-muted mt-1">A visual map of the entire workspace hierarchy based on your access level.</p>
            </div>
        </div>

        <div class="bg-background border border-text-main/15 rounded-xl p-6">
            <div class="flex flex-col gap-4">
                ${state.tenants.length === 0 ? '<div class="text-xs text-text-muted italic">No data available.</div>' : ''}
                ${state.tenants.map(tenant => {
                    const orgs = state.organizations.filter(o => o.tenantId === tenant.id);
                    return `
                    <div class="border border-text-main/10 rounded-lg p-4 bg-text-main/5">
                        <div class="font-bold text-lg text-emerald-500 flex items-center gap-2 mb-3">
                            ${getIconSVG('admin-tenants', 'w-5 h-5')} Tenant: ${sanitizeHTML(tenant.name)}
                        </div>
                        <div class="pl-6 flex flex-col gap-3 border-l-2 border-text-main/10 ml-2">
                            ${orgs.length === 0 ? '<div class="text-xs text-text-muted italic">No organizations.</div>' : ''}
                            ${orgs.map(org => {
                                const teams = state.teams.filter(t => t.orgId === org.id);
                                return `
                                <div class="border border-text-main/10 rounded-lg p-3 bg-background">
                                    <div class="font-bold text-md text-amber-500 flex items-center gap-2 mb-2">
                                        ${getIconSVG('folder', 'w-4 h-4')} Organization: ${sanitizeHTML(org.name)}
                                    </div>
                                    <div class="pl-6 flex flex-col gap-2 border-l-2 border-text-main/10 ml-2">
                                        ${teams.length === 0 ? '<div class="text-xs text-text-muted italic">No teams.</div>' : ''}
                                        ${teams.map(team => {
                                            const projects = state.projects.filter(p => team.projectIds.includes(p.id) && !p.isArchived && !p.isBinned);
                                            return `
                                            <div class="border border-text-main/10 rounded-lg p-2 bg-text-main/5">
                                                <div class="font-bold text-sm text-purple-500 flex items-center gap-2 mb-1">
                                                    ${getIconSVG('team', 'w-3.5 h-3.5')} Team: ${sanitizeHTML(team.name)}
                                                </div>
                                                <div class="pl-6 flex flex-wrap gap-2 mt-2">
                                                    ${projects.length === 0 ? '<div class="text-[10px] text-text-muted italic">No workspaces.</div>' : ''}
                                                    ${projects.map(p => `
                                                    <span class="px-2 py-1 bg-background border border-text-main/15 rounded text-[10px] font-semibold text-text-main flex items-center gap-1.5">
                                                        ${getIconSVG('project-workspace', 'w-3 h-3 text-text-muted')} ${sanitizeHTML(p.name)}
                                                    </span>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
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
                                    <td class="p-3 font-mono text-[11px] text-text-muted uppercase">
                                        <div class="font-bold text-purple-500">${sanitizeHTML(user.systemRole || 'user')}</div>
                                        <div class="text-[9px] mt-0.5">${sanitizeHTML(user.role)}</div>
                                    </td>
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

export function renderAdminAnalyticsView(): string {
    return `
    <div class="fade-in flex flex-col gap-6 max-w-6xl mx-auto">
        <div class="border-b border-text-main/10 pb-4">
            <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                ${getIconSVG('analytics', 'w-6 h-6 text-indigo-500')} Usage & Analytics
            </h2>
            <p class="text-xs text-text-muted mt-1">Monitor system-wide resource consumption, active sessions, and tenant metrics.</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col justify-between">
                <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">Total Tenants</span>
                <div class="flex items-end justify-between">
                    <span class="text-3xl font-bold text-text-main font-mono">${state.tenants.length}</span>
                    <span class="text-xs font-bold text-emerald-500">+2 this month</span>
                </div>
            </div>
            <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col justify-between">
                <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">Active Users</span>
                <div class="flex items-end justify-between">
                    <span class="text-3xl font-bold text-text-main font-mono">${state.team.filter(t => t.status === 'active').length}</span>
                    <span class="text-xs font-bold text-emerald-500 font-mono">14.2%</span>
                </div>
            </div>
            <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col justify-between">
                <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">LLM Tokens Used</span>
                <div class="flex items-end justify-between">
                    <span class="text-3xl font-bold text-text-main font-mono">2.4M</span>
                    <span class="text-[10px] text-text-muted block text-right">~$12.00 est.</span>
                </div>
            </div>
            <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col justify-between">
                <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2">Cloud Storage</span>
                <div class="flex items-end justify-between">
                    <span class="text-3xl font-bold text-text-main font-mono">48GB</span>
                    <div class="w-16 bg-text-main/10 h-1.5 rounded-full mt-2 self-center overflow-hidden">
                        <div class="bg-indigo-500 h-full" style="width: 48%"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
            <!-- Mock Chart Area 1 -->
            <div class="bg-background border border-text-main/15 p-5 rounded-xl h-64 flex flex-col">
                <h3 class="font-bold text-xs text-text-main mb-4">Token Consumption Over Time</h3>
                <div class="flex-grow flex items-end justify-between gap-2 px-2 pb-2 border-b border-text-main/10">
                    <!-- Fake Bars -->
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 40%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 55%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 45%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 70%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 60%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 90%"></div>
                    <div class="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-colors" style="height: 85%"></div>
                </div>
                <div class="flex justify-between text-[9px] text-text-muted font-mono mt-2 px-2">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
            </div>

            <!-- Tenant Cost Breakdown -->
            <div class="bg-background border border-text-main/15 p-5 rounded-xl h-64 flex flex-col">
                <h3 class="font-bold text-xs text-text-main mb-4">Storage Usage by Tenant</h3>
                <div class="flex-grow overflow-y-auto pr-2 flex flex-col gap-3">
                    ${state.tenants.map((t, idx) => {
                        const usage = [30, 12, 4, 2][idx % 4] || 1;
                        return `
                        <div class="flex flex-col gap-1.5">
                            <div class="flex justify-between text-[10px]">
                                <span class="font-bold text-text-main">${sanitizeHTML(t.name)}</span>
                                <span class="font-mono text-text-muted">${usage} GB</span>
                            </div>
                            <div class="w-full bg-text-main/10 h-1.5 rounded-full overflow-hidden">
                                <div class="bg-emerald-500 h-full" style="width: ${(usage / 48) * 100}%"></div>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>

        <!-- Security Audit Log -->
        <div class="border-t border-text-main/10 pt-6 mt-2">
            <div class="flex justify-between items-center mb-4">
                <div>
                    <h3 class="text-lg font-bold font-outfit text-text-main flex items-center gap-2">
                        ${getIconSVG('admin-policies', 'w-5 h-5 text-rose-400')} Security Audit Log
                    </h3>
                    <p class="text-xs text-text-muted mt-0.5">Real-time security event monitoring and compliance trail</p>
                </div>
                <button onclick="window.exportAuditLog()" class="px-3 py-1.5 rounded-lg border border-text-main/15 hover:bg-text-main/10 transition-colors font-bold text-[11px] text-text-main flex items-center gap-1.5">
                    ${getIconSVG('external-link', 'w-3 h-3')} Export CSV
                </button>
            </div>

            <!-- Threat Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4" id="threat-summary-cards">
                ${(() => {
                    const auditLog = (() => { try { return JSON.parse(localStorage.getItem('meidallm_audit_log') || '[]'); } catch { return []; } })();
                    const critical = auditLog.filter((e: any) => e.severity === 'critical').length;
                    const warnings = auditLog.filter((e: any) => e.severity === 'warning').length;
                    const last24h = auditLog.filter((e: any) => Date.now() - e.timestamp < 86400000).length;
                    const loginFails = auditLog.filter((e: any) => e.action === 'login_failed').length;
                    return `
                        <div class="bg-background border border-text-main/15 p-3 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Critical Events</span>
                            <div class="text-2xl font-bold ${critical > 0 ? 'text-rose-400' : 'text-emerald-400'} font-mono mt-1">${critical}</div>
                        </div>
                        <div class="bg-background border border-text-main/15 p-3 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Warnings</span>
                            <div class="text-2xl font-bold text-amber-400 font-mono mt-1">${warnings}</div>
                        </div>
                        <div class="bg-background border border-text-main/15 p-3 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Events (24h)</span>
                            <div class="text-2xl font-bold text-blue-400 font-mono mt-1">${last24h}</div>
                        </div>
                        <div class="bg-background border border-text-main/15 p-3 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold uppercase tracking-wider">Failed Logins</span>
                            <div class="text-2xl font-bold ${loginFails > 3 ? 'text-rose-400' : 'text-text-main'} font-mono mt-1">${loginFails}</div>
                        </div>
                    `;
                })()}
            </div>

            <!-- Audit Event Table -->
            <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                            <th class="p-3 font-bold border-b border-text-main/10">Timestamp</th>
                            <th class="p-3 font-bold border-b border-text-main/10">Severity</th>
                            <th class="p-3 font-bold border-b border-text-main/10">Action</th>
                            <th class="p-3 font-bold border-b border-text-main/10">Resource</th>
                            <th class="p-3 font-bold border-b border-text-main/10">Details</th>
                            <th class="p-3 font-bold border-b border-text-main/10">User</th>
                        </tr>
                    </thead>
                    <tbody class="text-xs divide-y divide-text-main/10">
                        ${(() => {
                            const auditLog = (() => { try { return JSON.parse(localStorage.getItem('meidallm_audit_log') || '[]'); } catch { return []; } })();
                            const recent = auditLog.slice(-20).reverse();
                            if (recent.length === 0) {
                                return `<tr><td colspan="6" class="p-6 text-center text-text-muted text-sm">No audit events recorded yet. Security events will appear here.</td></tr>`;
                            }
                            return recent.map((e: any) => {
                                const severityBadge: Record<string, string> = {
                                    'info': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                                    'warning': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                                    'critical': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                };
                                const badge = severityBadge[e.severity] || severityBadge['info'];
                                const time = new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                                return `
                                <tr class="hover:bg-text-main/5 transition-colors">
                                    <td class="p-3 font-mono text-text-muted whitespace-nowrap">${time}</td>
                                    <td class="p-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge}">${e.severity}</span></td>
                                    <td class="p-3 font-semibold text-text-main">${e.action}</td>
                                    <td class="p-3 font-mono text-text-muted">${e.resource || '-'}</td>
                                    <td class="p-3 text-text-muted max-w-[250px] truncate">${e.details || '-'}</td>
                                    <td class="p-3 font-mono text-text-muted">${e.userId ? e.userId.substring(0, 12) + '...' : '-'}</td>
                                </tr>`;
                            }).join('');
                        })()}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

// Global admin window actions
if (typeof window !== 'undefined') {
    const w = window as any;
    w.exportAuditLog = () => {
        try {
            const auditLog = JSON.parse(localStorage.getItem('meidallm_audit_log') || '[]');
            const csvHeader = 'Timestamp,Severity,Action,Resource,Details,User,Tenant\\n';
            const csvRows = auditLog.map((e: any) => {
                const time = new Date(e.timestamp).toISOString();
                return `"${time}","${e.severity}","${e.action}","${e.resource}","${(e.details || '').replace(/"/g, '""')}","${e.userId}","${e.tenantId}"`;
            }).join('\\n');
            const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            if (w.showToast) w.showToast('Audit log exported as CSV', 'success');
        } catch {
            if (w.showToast) w.showToast('No audit data to export', 'error');
        }
    };
}

