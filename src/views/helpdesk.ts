import { state, hasPermission } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderHelpdeskView(): string {
    const currentProject = state.projects.find(p => p.id === state.currentProject);
    const currentUser = state.team.find(t => t.email === state.currentUser);
    let tickets = currentProject ? state.tickets.filter(t => t.projectId === currentProject.id) : state.tickets;

    // Waterfall logic for ticket visibility
    if (currentUser?.systemRole === 'support_l1') {
        // L1 can only see tickets assigned to them, or unassigned open tickets
        tickets = tickets.filter(t => t.assigneeId === currentUser.id || !t.assigneeId);
    } else if (currentUser?.systemRole === 'external_client') {
        tickets = tickets.filter(t => t.clientId === currentUser.id);
    }

    const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
    const urgentTickets = tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved').length;
    
    const canViewKPIs = hasPermission('view:kpi');
    const canAssign = hasPermission('assign:tickets');

    const isSupportOrAdmin = currentUser?.systemRole?.startsWith('support_') || ['super_admin', 'tenant_owner', 'tenant_admin'].includes(currentUser?.systemRole || '');
    
    return `
    <div class="fade-in flex gap-6 max-w-[1400px] mx-auto w-full">
        <!-- Main Area -->
        <div class="flex-1 flex flex-col gap-6">
        <!-- Header -->
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('info', 'w-6 h-6 text-purple-500')} Support & Helpdesk
                </h2>
                <p class="text-xs text-text-muted mt-1">Corporate-grade ticket management and resolution system.</p>
            </div>
            <div class="flex items-center gap-3">
                ${hasPermission('manage:support_team') ? `
                    <button class="bg-background border border-text-main/20 hover:border-text-main/50 text-text-main px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-sm" onclick="window.openSupportManagementModal()">
                        ${getIconSVG('admin-rbac', 'w-4 h-4')} Manage Support Team
                    </button>
                ` : ''}
                <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-purple-500/20" onclick="window.openNewTicketModal()">
                    ${getIconSVG('plus', 'w-4 h-4')} New Ticket
                </button>
            </div>
        </div>

        <!-- KPIs -->
        ${canViewKPIs ? `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-background border border-text-main/15 p-5 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                    ${getIconSVG('inbox', 'w-6 h-6')}
                </div>
                <div>
                    <div class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Active Tickets</div>
                    <div class="text-2xl font-black font-outfit text-text-main">${openTickets}</div>
                </div>
            </div>
            <div class="bg-background border border-text-main/15 p-5 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
                    ${getIconSVG('alert', 'w-6 h-6')}
                </div>
                <div>
                    <div class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Urgent Escalations</div>
                    <div class="text-2xl font-black font-outfit text-text-main">${urgentTickets}</div>
                </div>
            </div>
            <div class="bg-background border border-text-main/15 p-5 rounded-xl flex items-center gap-4">
                <div class="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                    ${getIconSVG('check-circle', 'w-6 h-6')}
                </div>
                <div>
                    <div class="text-[10px] text-text-muted uppercase font-bold tracking-wider">Resolved</div>
                    <div class="text-2xl font-black font-outfit text-text-main">${resolvedTickets}</div>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Main Content -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <!-- Sidebar Filters -->
            <div class="xl:col-span-1 flex flex-col gap-4">
                <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col gap-3">
                    <h3 class="font-bold text-xs uppercase tracking-wider text-text-muted">Filters</h3>
                    <div class="flex flex-col gap-1.5">
                        <button class="text-left px-3 py-2 text-xs font-bold text-purple-500 bg-purple-500/10 rounded-lg cursor-pointer">All Tickets</button>
                        <button class="text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-lg transition-colors cursor-pointer">Assigned to me</button>
                        <button class="text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-lg transition-colors cursor-pointer flex justify-between">
                            Urgent <span class="bg-rose-500 text-white text-[9px] px-1.5 rounded-full">${urgentTickets}</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Ticket List -->
            <div class="xl:col-span-3">
                <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                                    <th class="p-4 font-bold border-b border-text-main/10 w-24">Ticket ID</th>
                                    <th class="p-4 font-bold border-b border-text-main/10 min-w-[250px]">Subject & Details</th>
                                    <th class="p-4 font-bold border-b border-text-main/10 w-32">Status</th>
                                    <th class="p-4 font-bold border-b border-text-main/10 w-32">Assignee</th>
                                    <th class="p-4 font-bold border-b border-text-main/10 w-24">Priority</th>
                                </tr>
                            </thead>
                            <tbody class="text-xs divide-y divide-text-main/10">
                                ${tickets.map(t => {
                                    let statusColor = 'text-text-muted bg-text-main/10 border-text-main/20';
                                    if (t.status === 'open') statusColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                    if (t.status === 'in-progress') statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                    if (t.status === 'resolved') statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                    
                                    let priorityColor = 'text-text-muted';
                                    if (t.priority === 'high') priorityColor = 'text-rose-500 font-bold';
                                    if (t.priority === 'urgent') priorityColor = 'text-rose-600 font-black animate-pulse';

                                    const assigneeName = t.assigneeId ? state.team.find(user => user.id === t.assigneeId)?.name || 'Unknown' : 'Unassigned';

                                    return `
                                    <tr class="hover:bg-text-main/5 transition-colors cursor-pointer group" onclick="window.openTicketModal('${t.id}')">
                                        <td class="p-4 font-mono text-text-muted text-[10px] group-hover:text-purple-500 transition-colors">${sanitizeHTML(t.id)}</td>
                                        <td class="p-4">
                                            <div class="font-bold text-text-main text-sm mb-0.5">${sanitizeHTML(t.title)}</div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-[9px] px-1.5 py-0.5 rounded bg-text-main/10 text-text-muted uppercase font-bold">${sanitizeHTML(t.category || 'General')}</span>
                                                ${(t.status === 'open' || t.status === 'in-progress') && (Date.now() - t.created > 86400000) ? `<span class="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 uppercase font-bold flex items-center gap-1">${getIconSVG('alert', 'w-3 h-3')} SLA Breach</span>` : ''}
                                                <span class="text-[10px] text-text-muted truncate max-w-xs">${sanitizeHTML(t.description)}</span>
                                            </div>
                                        </td>
                                        <td class="p-4" onclick="event.stopPropagation()">
                                            <select onchange="window.updateTicketStatus('${t.id}', this.value)" class="bg-transparent border-0 text-[10px] font-bold uppercase cursor-pointer outline-none ${statusColor.split(' ')[0]} p-0">
                                                <option value="open" ${t.status === 'open' ? 'selected' : ''}>OPEN</option>
                                                <option value="in-progress" ${t.status === 'in-progress' ? 'selected' : ''}>IN-PROGRESS</option>
                                                <option value="waiting" ${t.status === 'waiting' ? 'selected' : ''}>WAITING</option>
                                                <option value="resolved" ${t.status === 'resolved' ? 'selected' : ''}>RESOLVED</option>
                                            </select>
                                        </td>
                                        <td class="p-4" onclick="event.stopPropagation()">
                                            <select onchange="window.assignTicket('${t.id}', this.value)" class="bg-background border border-text-main/10 rounded px-2 py-1 text-[10px] outline-none w-full ${canAssign ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}" ${canAssign ? '' : 'disabled'}>
                                                <option value="">Unassigned</option>
                                                ${state.team.map(member => {
                                                    const workload = state.tickets.filter(tk => tk.assigneeId === member.id && tk.status !== 'resolved').length;
                                                    return `<option value="${member.id}" ${t.assigneeId === member.id ? 'selected' : ''}>${sanitizeHTML(member.name)} (${workload} tickets)</option>`;
                                                }).join('')}
                                            </select>
                                        </td>
                                        <td class="p-4 capitalize text-[11px] flex items-center gap-1.5 ${priorityColor}">
                                            ${t.priority === 'urgent' ? getIconSVG('alert', 'w-3.5 h-3.5') : ''} ${t.priority}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                                ${tickets.length === 0 ? `
                                    <tr>
                                        <td colspan="5" class="p-12 text-center text-text-muted italic flex flex-col items-center gap-2">
                                            ${getIconSVG('inbox', 'w-8 h-8 opacity-50')}
                                            <span>No support tickets found for this workspace.</span>
                                        </td>
                                    </tr>
                                ` : ''}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>

        <!-- Right Support Sidebar -->
        ${isSupportOrAdmin ? `
        <div class="w-80 shrink-0 hidden lg:flex flex-col gap-4">
            <div class="bg-background border border-text-main/10 rounded-2xl p-5 sticky top-6 shadow-xl">
                <h3 class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-4 border-b border-text-main/10 pb-2">Support Tools</h3>
                
                <div class="flex flex-col gap-2 mb-6">
                    <button class="flex items-center gap-3 p-2 hover:bg-text-main/5 rounded transition-colors text-xs font-bold text-text-main w-full text-left cursor-pointer" onclick="window.navigateTo('helpdesk')">
                        ${getIconSVG('info', 'w-4 h-4 text-purple-500')} Help Desk Dashboard
                    </button>
                    <button class="flex items-center gap-3 p-2 hover:bg-text-main/5 rounded transition-colors text-xs font-bold text-text-main w-full text-left cursor-pointer" onclick="window.navigateTo('inbox')">
                        ${getIconSVG('mail', 'w-4 h-4 text-blue-500')} Internal Messages 
                        <span class="ml-auto bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">New</span>
                    </button>
                </div>

                <h3 class="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3 border-b border-text-main/10 pb-2">Client Directory (Assist)</h3>
                <div class="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
                    ${state.team.filter(m => m.systemRole === 'user' || m.systemRole === 'external_client').map(client => `
                        <button class="flex items-center gap-3 p-2 hover:bg-text-main/5 rounded transition-colors w-full text-left cursor-pointer group" onclick="window.triggerSupportAssist('${client.id}')">
                            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-[9px]" style="background-color: ${client.avatarColor}">${client.name.charAt(0)}</div>
                            <div class="flex-1 overflow-hidden">
                                <div class="text-xs font-bold truncate group-hover:text-purple-400 transition-colors">${sanitizeHTML(client.name)}</div>
                                <div class="text-[9px] text-text-muted truncate">${sanitizeHTML(client.email)}</div>
                            </div>
                            ${getIconSVG('arrow-right', 'w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity')}
                        </button>
                    `).join('')}
                </div>
            </div>
        </div>
        ` : ''}
    </div>
    `;
}
