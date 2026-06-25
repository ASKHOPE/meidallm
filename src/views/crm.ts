import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

export function renderCRMView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    state.currentProject = p.id;
    const filter = state.crmFilter || 'active';

    // 1. Filter contacts based on project + tab filter
    let projectContacts = state.contacts.filter(c => c.projectId === pid);
    if (filter === 'active') {
        projectContacts = projectContacts.filter(c => !c.isArchived && !c.isBinned);
    } else if (filter === 'archived') {
        projectContacts = projectContacts.filter(c => c.isArchived && !c.isBinned);
    } else if (filter === 'bin') {
        projectContacts = projectContacts.filter(c => c.isBinned);
    }

    const totalPipelineValue = projectContacts.reduce((sum, c) => sum + c.dealValue, 0);

    const stages = [
        { key: 'lead' as const, label: 'Leads' },
        { key: 'connected' as const, label: 'Connected' },
        { key: 'discussion' as const, label: 'Discussion (Replied)' },
        { key: 'active' as const, label: 'Active (Complete)' }
    ];

    // Read selected contact for history detail viewer from session
    const selectedContactId = (window as any).__selectedCrmContactId || '';
    const selectedContact = projectContacts.find(c => c.id === selectedContactId);

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <!-- CRM Header metrics -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/15 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">${sanitizeHTML(p.name)} CRM Pipeline</h2>
                <p class="text-xs text-text-muted">Track sponsor deals, creator relations, and advertising prospects. Drag and drop deals between columns to update stages.</p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
                <div class="bg-background border border-text-main/15 px-4 py-2 rounded-xl text-right">
                    <span class="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">Pipeline Value</span>
                    <strong class="text-lg text-text-main font-outfit font-bold">$${totalPipelineValue.toLocaleString()}</strong>
                </div>
                <button onclick="window.showAddContactModal()" class="px-4 py-2.5 bg-text-main text-background hover:bg-text-main/80 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm">
                    ${getIconSVG('plus', 'w-3.5 h-3.5 inline mr-1')} Add Lead
                </button>
            </div>
        </div>

        <!-- CRM Tab Filters -->
        <div class="flex justify-between items-center mb-1">
            <div class="flex gap-6 border-b border-text-main/10 w-full pb-2">
                <button onclick="window.setCrmFilter('active')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'active' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Active Deals</button>
                <button onclick="window.setCrmFilter('archived')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'archived' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Archived Deals</button>
                <button onclick="window.setCrmFilter('bin')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${filter === 'bin' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Bin / Trash</button>
            </div>
        </div>

        <!-- CRM Main Board + Details Panel Split -->
        <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
            
            <!-- Swimlanes area -->
            <div class="xl:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                ${stages.map(stage => {
                    const contacts = projectContacts.filter(c => c.dealStage === stage.key);
                    const stageTotal = contacts.reduce((sum, c) => sum + c.dealValue, 0);

                    return `
                    <div class="crm-column bg-background border border-text-main/10 rounded-2xl p-4 flex flex-col min-h-[550px] transition-all"
                         data-stage="${stage.key}"
                         ondragover="window.handleContactDragOver(event)"
                         ondragleave="window.handleContactDragLeave(event)"
                         ondrop="window.handleContactDrop(event, '${stage.key}')">
                        
                        <!-- Column Header -->
                        <div class="flex justify-between items-center mb-4 pb-2 border-b border-text-main/10">
                            <div>
                                <h3 class="font-bold text-text-main text-sm">${stage.label}</h3>
                                <span class="text-[10px] text-text-muted font-mono block">$${stageTotal.toLocaleString()}</span>
                            </div>
                            <span class="bg-text-main/10 text-text-main px-2 py-0.5 rounded text-[10px] font-bold">${contacts.length}</span>
                        </div>

                        <!-- Column Cards list -->
                        <div class="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[650px] pr-1">
                            ${contacts.map(c => {
                                const tagColors = 
                                    c.statusTag === 'hot' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    c.statusTag === 'warm' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    c.statusTag === 'cold' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                    'bg-text-main/5 text-text-muted border-text-main/10';

                                const lastUpdated = c.updated ? formatTime(c.updated) : formatTime(c.created);
                                const isSelected = selectedContactId === c.id;

                                // Build actions
                                let actionButtons = "";
                                if (filter === 'active') {
                                    actionButtons = `
                                    <button onclick="event.stopPropagation(); window.archiveContactToggle('${c.id}', true)" class="text-text-muted hover:text-text-main transition-colors cursor-pointer" title="Archive Deal">
                                        ${getIconSVG('archive', 'w-3 h-3')}
                                    </button>
                                    <button onclick="event.stopPropagation(); window.binContactToggle('${c.id}', true)" class="text-text-muted hover:text-red-500 transition-colors cursor-pointer" title="Move to Bin">
                                        ${getIconSVG('trash', 'w-3 h-3')}
                                    </button>
                                    `;
                                } else if (filter === 'archived') {
                                    actionButtons = `
                                    <button onclick="event.stopPropagation(); window.archiveContactToggle('${c.id}', false)" class="text-text-muted hover:text-text-main transition-colors cursor-pointer" title="Restore to Active">
                                        ${getIconSVG('external-link', 'w-3 h-3')}
                                    </button>
                                    <button onclick="event.stopPropagation(); window.binContactToggle('${c.id}', true)" class="text-text-muted hover:text-red-500 transition-colors cursor-pointer" title="Move to Bin">
                                        ${getIconSVG('trash', 'w-3 h-3')}
                                    </button>
                                    `;
                                } else if (filter === 'bin') {
                                    actionButtons = `
                                    <button onclick="event.stopPropagation(); window.binContactToggle('${c.id}', false)" class="text-text-muted hover:text-text-main transition-colors cursor-pointer" title="Restore Deal">
                                        ${getIconSVG('check', 'w-3 h-3')}
                                    </button>
                                    <button onclick="event.stopPropagation(); window.deleteContactAction('${c.id}')" class="text-text-muted hover:text-red-500 transition-colors cursor-pointer font-bold" title="Delete Permanently">
                                        ${getIconSVG('close', 'w-3 h-3')}
                                    </button>
                                    `;
                                }

                                return `
                                <div class="bg-background border ${isSelected ? 'border-text-main' : 'border-text-main/15'} hover:border-text-main p-4 rounded-xl flex flex-col gap-3 group/crm-card transition-all cursor-grab active:cursor-grabbing"
                                     id="contact-card-${c.id}"
                                     draggable="true"
                                     onclick="window.selectCrmContact('${c.id}')"
                                     ondragstart="window.handleContactDragStart(event, '${c.id}')">
                                    
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h4 class="font-bold text-text-main text-xs truncate max-w-[120px]">${sanitizeHTML(c.name)}</h4>
                                            <span class="text-[10px] text-text-muted font-medium block mt-0.5">${sanitizeHTML(c.company)}</span>
                                        </div>
                                        <div class="flex gap-2.5 opacity-0 group-hover/crm-card:opacity-100 transition-opacity">
                                            <button onclick="event.stopPropagation(); window.editContactPrompt('${c.id}')" class="text-text-muted hover:text-text-main transition-colors cursor-pointer" title="Edit Deal Info">
                                                ${getIconSVG('edit', 'w-3 h-3')}
                                            </button>
                                            ${actionButtons}
                                        </div>
                                    </div>

                                    <!-- Tag Selector & Value Row -->
                                    <div class="flex justify-between items-center mt-1">
                                        <span class="text-[10px] font-bold text-text-main">$${c.dealValue.toLocaleString()}</span>
                                        <div class="flex items-center gap-1.5">
                                            <span class="border rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${tagColors}">${c.statusTag || 'new'}</span>
                                            <select onclick="event.stopPropagation()" onchange="window.updateCrmContactTag('${c.id}', this.value)" class="bg-background border border-text-main/20 text-[8px] text-text-muted p-0.5 rounded cursor-pointer focus:outline-none">
                                                <option value="new" ${c.statusTag === 'new' ? 'selected' : ''}>New</option>
                                                <option value="hot" ${c.statusTag === 'hot' ? 'selected' : ''}>Hot</option>
                                                <option value="warm" ${c.statusTag === 'warm' ? 'selected' : ''}>Warm</option>
                                                <option value="cold" ${c.statusTag === 'cold' ? 'selected' : ''}>Cold</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <!-- Time log info -->
                                    <div class="text-[9px] text-text-muted flex justify-between items-center pt-2 border-t border-text-main/10">
                                        <span>Updated ${lastUpdated}</span>
                                        <select onclick="event.stopPropagation()" onchange="window.updateContactStage('${c.id}', this.value)" class="bg-background border border-text-main/20 text-[9px] text-text-main p-1 rounded font-medium cursor-pointer focus:outline-none focus:border-text-main">
                                            <option value="lead" ${c.dealStage === 'lead' ? 'selected' : ''}>Lead</option>
                                            <option value="connected" ${c.dealStage === 'connected' ? 'selected' : ''}>Connected</option>
                                            <option value="discussion" ${c.dealStage === 'discussion' ? 'selected' : ''}>Discussion</option>
                                            <option value="active" ${c.dealStage === 'active' ? 'selected' : ''}>Active</option>
                                        </select>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                            ${contacts.length === 0 ? `
                                <div class="border border-dashed border-text-main/10 text-center text-text-muted text-[10px] py-12 rounded-xl flex items-center justify-center flex-col gap-1">
                                    <span>No Deals</span>
                                    <span class="text-[8px] opacity-70">Drag cards here</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>

            <!-- Details & Activity history sidebar panel -->
            <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4 max-h-[700px] overflow-y-auto">
                <h3 class="font-bold text-sm font-outfit">Deal History & Activity</h3>
                ${(() => {
                    if (!selectedContact) {
                        return `
                        <div class="text-center py-16 text-xs text-text-muted leading-relaxed">
                            ${getIconSVG('info', 'w-8 h-8 mx-auto mb-2 text-text-muted/60')}
                            Select a deal card to view time tracking, Order-to-Cash stepper, support cases, and logs.
                        </div>
                        `;
                    }

                    // OTC Invoice check
                    const inv = state.salesInvoices.find(invoice => invoice.contactId === selectedContact.id);
                    let invoiceBlock = "";
                    if (!inv) {
                        invoiceBlock = `
                        <div class="border-t border-text-main/10 pt-3">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-2">Campaign Retainer Order-to-Cash</span>
                            <button onclick="window.generateSponsorInvoice('${selectedContact.id}')" class="w-full py-2 bg-text-main text-background hover:bg-text-main/80 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                                ${getIconSVG('crm', 'w-3.5 h-3.5')} Convert to Quote, Order & Invoice
                            </button>
                        </div>
                        `;
                    } else {
                        const isPaid = inv.invoiceStatus === 'paid';
                        invoiceBlock = `
                        <div class="border-t border-text-main/10 pt-3 flex flex-col gap-2">
                            <span class="text-[10px] text-text-muted font-bold block uppercase">Campaign Billing Status</span>
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-semibold text-text-main">Invoice #${inv.id}</span>
                                <span class="px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase ${isPaid ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-500 bg-amber-500/10 border-amber-500/20'}">${inv.invoiceStatus}</span>
                            </div>
                            <!-- OTC Stepper visual -->
                            <div class="flex items-center gap-1 justify-between text-[9px] text-text-muted bg-text-main/5 p-2 rounded-lg border border-text-main/5 my-1">
                                <div class="flex flex-col items-center">
                                    <span class="text-emerald-500 font-bold flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Quote</span>
                                    <span class="text-[8px] opacity-70">Approved</span>
                                </div>
                                <div class="w-4 border-t border-text-main/20"></div>
                                <div class="flex flex-col items-center">
                                    <span class="text-emerald-500 font-bold flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Order</span>
                                    <span class="text-[8px] opacity-70">Confirmed</span>
                                </div>
                                <div class="w-4 border-t border-text-main/20"></div>
                                <div class="flex flex-col items-center">
                                    <span class="${isPaid ? 'text-emerald-500 font-bold' : 'text-amber-500'} font-bold flex items-center gap-1"><span class="inline-block w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-amber-500'}"></span> Invoice</span>
                                    <span class="text-[8px] opacity-70">${isPaid ? 'Paid' : 'Unpaid'}</span>
                                </div>
                            </div>
                            ${!isPaid ? `
                                <button onclick="window.paySponsorInvoice('${inv.id}')" class="w-full py-2 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                                    ${getIconSVG('project-erp', 'w-3.5 h-3.5')} Process Sponsor Retainer Payment
                                </button>
                            ` : `<p class="text-[10px] text-emerald-500 font-bold text-center mt-1">✓ Sponsorship revenue reconciled to Campaign Budget!</p>`}
                        </div>
                        `;
                    }

                    // Support tickets check
                    const cases = state.supportCases.filter(c => c.contactId === selectedContact.id);
                    const casesBlock = `
                    <div class="border-t border-text-main/10 pt-3 flex flex-col gap-3">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] text-text-muted font-bold block uppercase">Creator Support Tickets</span>
                            <button onclick="window.createSupportCasePrompt('${pid}', '${selectedContact.id}')" class="text-[9px] font-bold text-text-main hover:underline cursor-pointer">+ Log Ticket</button>
                        </div>
                        <div class="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                            ${cases.map(c => {
                                const now = Date.now();
                                const timeLeft = c.slaDeadline - now;
                                const hoursLeft = Math.ceil(timeLeft / (3600 * 1000));
                                const slaText = timeLeft > 0 
                                    ? `SLA: ${hoursLeft}h response limit` 
                                    : `SLA Violation! (${Math.abs(hoursLeft)}h overdue)`;
                                const slaColor = timeLeft > 0 
                                    ? (c.priority === 'critical' || timeLeft < 3600 * 1000 * 2) ? 'text-rose-500 font-bold' : 'text-amber-500' 
                                    : 'text-rose-500 font-extrabold animate-pulse';

                                let priorityColor = 'text-blue-500 bg-blue-500/10 border-blue-500/20';
                                if (c.priority === 'high') priorityColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                if (c.priority === 'critical') priorityColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                                let statusColor = 'text-amber-500';
                                if (c.status === 'resolved') statusColor = 'text-emerald-500';
                                if (c.status === 'new') statusColor = 'text-blue-500';

                                return `
                                <div class="bg-text-main/5 p-3 rounded-xl border border-text-main/10 flex flex-col gap-2">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h5 class="font-bold text-xs text-text-main leading-tight">${sanitizeHTML(c.title)}</h5>
                                            <span class="text-[8px] font-bold px-1 py-0.5 rounded border uppercase mt-1 inline-block ${priorityColor}">${c.priority}</span>
                                        </div>
                                        <span class="text-[9px] font-bold capitalize ${statusColor}">${c.status}</span>
                                    </div>
                                    <p class="text-[10px] text-text-muted mt-1 leading-relaxed">${sanitizeHTML(c.description)}</p>
                                    
                                    <div class="text-[9px] border-t border-text-main/5 pt-2 flex flex-col gap-1.5">
                                        <span class="${slaColor}">${slaText}</span>
                                        <div class="flex flex-col gap-1 max-h-[80px] overflow-y-auto pl-1.5 border-l border-text-main/15">
                                            ${c.comments.map(comm => `
                                                <div class="text-[9px] text-text-main">
                                                    <strong>${comm.author}:</strong> ${sanitizeHTML(comm.text)}
                                                </div>
                                            `).join('') || '<span class="italic text-[8px] text-text-muted">No comments yet.</span>'}
                                        </div>
                                        
                                        ${c.status !== 'resolved' ? `
                                            <div class="flex gap-1.5 mt-1.5">
                                                <input type="text" id="comment-input-${c.id}" placeholder="Reply to ticket..." class="flex-grow bg-background border border-text-main/20 focus:border-text-main rounded px-2 py-1 text-[9px] focus:outline-none">
                                                <button onclick="window.submitCaseComment('${c.id}')" class="px-2 py-1 bg-text-main text-background hover:bg-text-main/80 text-[9px] font-bold rounded cursor-pointer">Reply</button>
                                                <button onclick="window.resolveSupportCase('${c.id}')" class="px-2 py-1 bg-emerald-500 text-white hover:bg-emerald-600 text-[9px] font-bold rounded cursor-pointer">Resolve</button>
                                            </div>
                                        ` : ''}
                                    </div>
                                </div>
                                `;
                            }).join('') || `<div class="text-center py-6 text-[10px] text-text-muted italic">No support tickets logged.</div>`}
                        </div>
                    </div>
                    `;

                    return `
                    <div class="flex flex-col gap-4">
                        <div>
                            <span class="text-[10px] text-text-muted font-bold block uppercase">Client Info</span>
                            <h4 class="font-bold text-text-main text-sm mt-1">${sanitizeHTML(selectedContact.name)}</h4>
                            <p class="text-xs text-text-muted">${sanitizeHTML(selectedContact.email || 'No email provided')}</p>
                            <span class="text-[10px] bg-text-main/5 px-2 py-1 border border-text-main/10 rounded font-bold inline-block mt-2">${sanitizeHTML(selectedContact.company)}</span>
                        </div>

                        ${invoiceBlock}

                        ${casesBlock}

                        <div class="border-t border-text-main/10 pt-3">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Time Logged</span>
                            <span class="text-xs text-text-main font-mono">Created: ${new Date(selectedContact.created).toLocaleString()}</span>
                            ${selectedContact.updated ? `
                                <span class="text-xs text-text-muted font-mono block mt-1">Last Update: ${new Date(selectedContact.updated).toLocaleString()}</span>
                            ` : ''}
                        </div>

                        <div class="border-t border-text-main/10 pt-3">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-3">Activity Stream</span>
                            <div class="flex flex-col gap-3 max-h-[150px] overflow-y-auto pr-1">
                                ${(selectedContact.history || []).slice().reverse().map(h => `
                                    <div class="flex flex-col gap-1 border-l-2 border-text-main/20 pl-2.5 py-0.5 text-xs">
                                        <span class="text-text-main font-semibold">${sanitizeHTML(h.action)}</span>
                                        <span class="text-[9px] text-text-muted font-mono">${formatTime(h.timestamp)}</span>
                                    </div>
                                `).join('') || `<div class="text-[10px] text-text-muted italic">No actions recorded.</div>`}
                            </div>
                        </div>
                    </div>
                    `;
                })()}
            </div>
        </div>
    </div>

    <!-- CRM Add Lead Modal -->
    <div id="add-contact-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/20 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-text-main">
            <div class="flex justify-between items-center pb-2 border-b border-text-main/10">
                <h3 class="text-xl font-bold font-outfit">Add Deal Prospect</h3>
                <button onclick="window.hideAddContactModal()" class="text-text-muted hover:text-text-main font-bold text-sm">✕</button>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Contact Name</label>
                <input id="modal-contact-name" type="text" placeholder="e.g. Sarah Jenkins" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Email</label>
                <input id="modal-contact-email" type="email" placeholder="e.g. sarah@stripe.com" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Company</label>
                <input id="modal-contact-company" type="text" placeholder="e.g. Stripe" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Deal Value ($)</label>
                    <input id="modal-contact-value" type="number" placeholder="e.g. 5000" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Lead Tag</label>
                    <select id="modal-contact-tag" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none cursor-pointer">
                        <option value="new">New</option>
                        <option value="hot">Hot</option>
                        <option value="warm">Warm</option>
                        <option value="cold">Cold</option>
                    </select>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddContactModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-sm font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitContactForm('${pid}')" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/90 rounded-xl text-sm font-bold transition-colors cursor-pointer">Add Prospect</button>
            </div>
        </div>
    </div>
    `;
}
