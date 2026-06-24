import { state, addContact, updateContact, deleteContact } from "../state";
import { sanitizeHTML } from "../utils";

export function renderCRMView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    state.currentProject = p.id;

    const projectContacts = state.contacts.filter(c => c.projectId === pid);
    const totalPipelineValue = projectContacts.reduce((sum, c) => sum + c.dealValue, 0);

    const stages = [
        { key: 'lead' as const, label: 'New Leads' },
        { key: 'contacted' as const, label: 'Contacted' },
        { key: 'negotiation' as const, label: 'In Discussion' },
        { key: 'won' as const, label: 'Deals Won' }
    ];

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- CRM Header metrics -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/20 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">${sanitizeHTML(p.name)} CRM Pipeline</h2>
                <p class="text-xs text-text-muted">Track sponsor deals, creator relations, and advertising prospects. Drag and drop deals between columns to update stages.</p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
                <div class="bg-background border border-text-main/20 px-4 py-2 rounded-xl text-right">
                    <span class="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">Pipeline Value</span>
                    <strong class="text-lg text-text-main font-outfit font-bold">$${totalPipelineValue.toLocaleString()}</strong>
                </div>
                <button onclick="window.showAddContactModal()" class="px-4 py-2.5 bg-text-main text-background hover:bg-text-main/80 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-sm">+ Add Lead</button>
            </div>
        </div>

        <!-- CRM Stages swimlanes -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            ${stages.map(stage => {
                const contacts = projectContacts.filter(c => c.dealStage === stage.key);
                const stageTotal = contacts.reduce((sum, c) => sum + c.dealValue, 0);

                return `
                <div class="crm-column bg-background border border-text-main/10 rounded-2xl p-4 flex flex-col min-h-[500px] transition-all"
                     data-stage="${stage.key}"
                     ondragover="window.handleContactDragOver(event)"
                     ondragleave="window.handleContactDragLeave(event)"
                     ondrop="window.handleContactDrop(event, '${stage.key}')">
                    
                    <div class="flex justify-between items-center mb-4 pb-2 border-b border-text-main/10">
                        <div>
                            <h3 class="font-bold text-text-main text-sm">${stage.label}</h3>
                            <span class="text-[10px] text-text-muted font-mono block">$${stageTotal.toLocaleString()}</span>
                        </div>
                        <span class="bg-text-main text-background px-2 py-0.5 rounded text-[10px] font-bold">${contacts.length}</span>
                    </div>

                    <div class="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                        ${contacts.map(c => `
                            <div class="bg-background border border-text-main/20 hover:border-text-main p-4 rounded-xl flex flex-col gap-3 group/crm-card transition-all cursor-grab active:cursor-grabbing"
                                 id="contact-card-${c.id}"
                                 draggable="true"
                                 ondragstart="window.handleContactDragStart(event, '${c.id}')">
                                
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-bold text-text-main text-xs truncate max-w-[125px]">${sanitizeHTML(c.name)}</h4>
                                        <span class="text-[10px] text-text-muted font-medium">${sanitizeHTML(c.company)}</span>
                                    </div>
                                    <div class="flex gap-2 opacity-0 group-hover/crm-card:opacity-100 transition-opacity">
                                        <button onclick="window.editContactPrompt('${c.id}')" class="text-[11px] hover:scale-110 transition-transform cursor-pointer" title="Edit">✏️</button>
                                        <button onclick="window.deleteContactPrompt('${c.id}')" class="text-[11px] hover:scale-110 transition-transform cursor-pointer text-red-500 font-bold" title="Delete">✕</button>
                                    </div>
                                </div>
                                
                                <div class="text-[10px] text-text-muted flex justify-between items-center pt-2 border-t border-text-main/10">
                                    <span class="text-text-main font-bold">$${c.dealValue.toLocaleString()}</span>
                                    <select onchange="window.updateContactStage('${c.id}', this.value)" class="bg-background border border-text-main/20 text-[9px] text-text-main p-1 rounded font-medium cursor-pointer focus:outline-none focus:border-text-main">
                                        <option value="lead" ${c.dealStage === 'lead' ? 'selected' : ''}>Lead</option>
                                        <option value="contacted" ${c.dealStage === 'contacted' ? 'selected' : ''}>Discuss</option>
                                        <option value="negotiation" ${c.dealStage === 'negotiation' ? 'selected' : ''}>Negotiate</option>
                                        <option value="won" ${c.dealStage === 'won' ? 'selected' : ''}>Won</option>
                                    </select>
                                </div>
                            </div>
                        `).join('')}
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
    </div>

    <!-- CRM Add Lead Modal -->
    <div id="add-contact-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/30 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-text-main">
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
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Estimated Deal Value ($)</label>
                <input id="modal-contact-value" type="number" placeholder="e.g. 5000" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddContactModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-sm font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitContactForm('${pid}')" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/90 rounded-xl text-sm font-bold transition-colors cursor-pointer">Add Prospect</button>
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.showAddContactModal = () => {
        const modal = document.getElementById('add-contact-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddContactModal = () => {
        const modal = document.getElementById('add-contact-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitContactForm = (pid: string) => {
        const nameEl = document.getElementById('modal-contact-name') as HTMLInputElement;
        const emailEl = document.getElementById('modal-contact-email') as HTMLInputElement;
        const compEl = document.getElementById('modal-contact-company') as HTMLInputElement;
        const valEl = document.getElementById('modal-contact-value') as HTMLInputElement;

        if (nameEl && emailEl && compEl && valEl) {
            const name = nameEl.value.trim();
            const email = emailEl.value.trim();
            const company = compEl.value.trim();
            const value = parseInt(valEl.value) || 0;

            if (!name || !company) {
                alert("Name and Company fields are required.");
                return;
            }

            addContact(pid, name, email, company, 'lead', value);
            w.hideAddContactModal();

            // Clear inputs
            nameEl.value = "";
            emailEl.value = "";
            compEl.value = "";
            valEl.value = "";
        }
    };

    w.updateContactStage = (cid: string, newStage: string) => {
        const contact = state.contacts.find(c => c.id === cid);
        if (contact) {
            updateContact(cid, contact.name, contact.email, contact.company, newStage as any, contact.dealValue);
        }
    };

    w.editContactPrompt = (cid: string) => {
        const contact = state.contacts.find(c => c.id === cid);
        if (!contact) return;

        const name = prompt("Edit contact name:", contact.name);
        if (name === null) return;
        if (!name.trim()) {
            alert("Name is required.");
            return;
        }
        const comp = prompt("Edit company:", contact.company) || contact.company;
        const valStr = prompt("Edit deal value ($):", contact.dealValue.toString()) || "0";
        const value = parseInt(valStr) || 0;

        updateContact(cid, name, contact.email, comp, contact.dealStage, value);
    };

    w.deleteContactPrompt = (cid: string) => {
        if (confirm("Permanently remove this campaign deal prospect?")) {
            deleteContact(cid);
        }
    };

    // --- HTML5 Drag & Drop handlers ---
    w.handleContactDragStart = (e: DragEvent, cid: string) => {
        e.dataTransfer?.setData("text/plain", cid);
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
        }
        const card = document.getElementById(`contact-card-${cid}`);
        if (card) {
            card.classList.add("opacity-50", "border-dashed");
        }
    };

    w.handleContactDragOver = (e: DragEvent) => {
        e.preventDefault();
        const col = e.currentTarget as HTMLElement;
        col.classList.add("bg-text-main/5", "border-text-main/30");
    };

    w.handleContactDragLeave = (e: DragEvent) => {
        const col = e.currentTarget as HTMLElement;
        col.classList.remove("bg-text-main/5", "border-text-main/30");
    };

    w.handleContactDrop = (e: DragEvent, targetStage: string) => {
        e.preventDefault();
        const col = e.currentTarget as HTMLElement;
        col.classList.remove("bg-text-main/5", "border-text-main/30");

        const cid = e.dataTransfer?.getData("text/plain");
        if (cid) {
            const contact = state.contacts.find(c => c.id === cid);
            if (contact && contact.dealStage !== targetStage) {
                w.updateContactStage(cid, targetStage);
            }
        }
    };
}
