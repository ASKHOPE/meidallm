import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderHelpdeskView(): string {
    const currentProject = state.projects.find(p => p.id === state.currentProject);
    const tickets = currentProject ? state.tickets.filter(t => t.projectId === currentProject.id) : state.tickets;

    return `
    <div class="fade-in flex flex-col gap-6 max-w-6xl mx-auto w-full">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('info', 'w-6 h-6 text-purple-500')} Support & Helpdesk
                </h2>
                <p class="text-xs text-text-muted mt-1">Manage and track client support tickets and requests.</p>
            </div>
            <button class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="alert('Open new ticket modal')">
                ${getIconSVG('plus', 'w-4 h-4')} New Ticket
            </button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div class="lg:col-span-1 flex flex-col gap-4">
                <div class="bg-background border border-text-main/15 p-4 rounded-xl flex flex-col gap-3">
                    <h3 class="font-bold text-xs uppercase tracking-wider text-text-muted">Filters</h3>
                    <div class="flex flex-col gap-2">
                        <button class="text-left px-3 py-2 text-xs font-bold text-purple-500 bg-purple-500/10 rounded-lg">All Tickets</button>
                        <button class="text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-lg transition-colors">Open</button>
                        <button class="text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-lg transition-colors">In Progress</button>
                        <button class="text-left px-3 py-2 text-xs text-text-main hover:bg-text-main/5 rounded-lg transition-colors">Resolved</button>
                    </div>
                </div>
            </div>

            <div class="lg:col-span-3">
                <div class="bg-background border border-text-main/15 rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-text-main/5 text-[10px] uppercase tracking-wider text-text-muted">
                                <th class="p-4 font-bold border-b border-text-main/10">Ticket ID</th>
                                <th class="p-4 font-bold border-b border-text-main/10">Subject</th>
                                <th class="p-4 font-bold border-b border-text-main/10">Status</th>
                                <th class="p-4 font-bold border-b border-text-main/10">Priority</th>
                                <th class="p-4 font-bold border-b border-text-main/10">Created</th>
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
                                if (t.priority === 'urgent') priorityColor = 'text-rose-600 font-bold';

                                return `
                                <tr class="hover:bg-text-main/5 transition-colors cursor-pointer" onclick="alert('View ticket details')">
                                    <td class="p-4 font-mono text-text-muted text-[10px]">${sanitizeHTML(t.id)}</td>
                                    <td class="p-4">
                                        <div class="font-bold text-text-main">${sanitizeHTML(t.title)}</div>
                                        <div class="text-[10px] text-text-muted mt-0.5 truncate max-w-xs">${sanitizeHTML(t.description)}</div>
                                    </td>
                                    <td class="p-4">
                                        <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${statusColor}">${t.status}</span>
                                    </td>
                                    <td class="p-4 capitalize ${priorityColor}">${t.priority}</td>
                                    <td class="p-4 font-mono text-text-muted">${new Date(t.created).toLocaleDateString()}</td>
                                </tr>
                                `;
                            }).join('')}
                            ${tickets.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="p-8 text-center text-text-muted italic">No support tickets found.</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;
}
