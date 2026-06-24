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
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-panel-hover/30 border border-glass-border/30 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit text-white">${sanitizeHTML(p.name)} CRM Pipeline</h2>
                <p class="text-xs text-text-muted">Track sponsor deals, creator relations, and advertising prospects.</p>
            </div>
            <div class="flex items-center gap-4 shrink-0">
                <div class="bg-glass-bg border border-glass-border px-4 py-2 rounded-xl text-right">
                    <span class="text-[10px] text-text-muted uppercase font-semibold block mb-0.5">Pipeline Value</span>
                    <strong class="text-lg text-emerald-400 font-outfit">$${totalPipelineValue.toLocaleString()}</strong>
                </div>
                <button onclick="window.showAddContactModal()" class="px-4 py-2.5 bg-primary text-white font-medium text-xs rounded-xl shadow-[0_0_15px_var(--color-primary-glow)] hover:bg-indigo-600 transition-colors cursor-pointer">+ Add Lead</button>
            </div>
        </div>

        <!-- CRM Stages swimlanes -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            ${stages.map(stage => {
                const contacts = projectContacts.filter(c => c.dealStage === stage.key);
                const stageTotal = contacts.reduce((sum, c) => sum + c.dealValue, 0);

                return `
                <div class="bg-[rgba(15,23,42,0.6)] border border-glass-border rounded-2xl p-4 flex flex-col min-h-[450px]">
                    <div class="flex justify-between items-center mb-3">
                        <div>
                            <h3 class="font-medium text-white text-sm">${stage.label}</h3>
                            <span class="text-[10px] text-text-muted font-mono">$${stageTotal.toLocaleString()}</span>
                        </div>
                        <span class="bg-panel-hover text-text-muted px-2 py-0.5 rounded text-[10px]">${contacts.length}</span>
                    </div>

                    <div class="flex flex-col gap-3 overflow-y-auto">
                        ${contacts.map(c => `
                            <div class="bg-glass-bg border border-glass-border hover:border-primary p-4 rounded-xl flex flex-col gap-3 group/crm-card transition-all">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-semibold text-white text-xs truncate max-w-[120px]">${sanitizeHTML(c.name)}</h4>
                                        <span class="text-[10px] text-text-muted">${sanitizeHTML(c.company)}</span>
                                    </div>
                                    <div class="flex gap-1.5 opacity-0 group-hover/crm-card:opacity-100 transition-opacity">
                                        <button onclick="window.editContactPrompt('${c.id}')" class="text-[10px] text-text-muted hover:text-white cursor-pointer" title="Edit">✏️</button>
                                        <button onclick="window.deleteContactPrompt('${c.id}')" class="text-[10px] text-text-muted hover:text-rose-500 cursor-pointer font-bold" title="Delete">✕</button>
                                    </div>
                                </div>
                                <div class="text-[10px] text-text-muted flex justify-between items-center pt-2 border-t border-glass-border/30">
                                    <span class="text-emerald-400 font-semibold">$${c.dealValue.toLocaleString()}</span>
                                    <select onchange="window.updateContactStage('${c.id}', this.value)" class="bg-panel-hover border border-glass-border/50 text-[9px] text-white p-1 rounded cursor-pointer">
                                        <option value="lead" ${c.dealStage === 'lead' ? 'selected' : ''}>Lead</option>
                                        <option value="contacted" ${c.dealStage === 'contacted' ? 'selected' : ''}>Discuss</option>
                                        <option value="negotiation" ${c.dealStage === 'negotiation' ? 'selected' : ''}>Negotiate</option>
                                        <option value="won" ${c.dealStage === 'won' ? 'selected' : ''}>Won</option>
                                    </select>
                                </div>
                            </div>
                        `).join('')}
                        ${contacts.length === 0 ? `
                            <div class="border border-dashed border-glass-border/40 text-center text-text-muted text-[10px] py-12 rounded-xl">Empty Stage</div>
                        ` : ''}
                    </div>
                </div>
                `;
            }).join('')}
        </div>
    </div>

    <!-- CRM Add Lead Modal -->
    <div id="add-contact-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4">
            <h3 class="text-xl font-semibold text-white font-outfit">Add Deal Prospect</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Contact Name</label>
                <input id="modal-contact-name" type="text" placeholder="e.g. Sarah Jenkins" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Email</label>
                <input id="modal-contact-email" type="email" placeholder="e.g. sarah@stripe.com" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Company</label>
                <input id="modal-contact-company" type="text" placeholder="e.g. Stripe" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Estimated Deal Value ($)</label>
                <input id="modal-contact-value" type="number" placeholder="e.g. 5000" class="w-full bg-panel-hover border border-glass-border p-3 rounded-xl text-white text-sm focus:outline-none focus:border-primary">
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddContactModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-sm font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitContactForm('${pid}')" class="px-4 py-2 bg-primary rounded-xl text-sm font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Add Prospect</button>
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
}
