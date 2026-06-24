import { state, addDbTable, deleteDbTable, addDbField, deleteDbField, addDbRow, updateDbRow, deleteDbRow } from "../state";
import { sanitizeHTML } from "../utils";

export function renderDatabaseView(pid?: string): string {
    const activePid = pid || state.currentProject;
    if (!activePid) {
        return `<div class="fade-in text-text-muted text-center py-12">Please select an active project to view databases.</div>`;
    }

    const projectTables = state.tables.filter(tbl => tbl.projectId === activePid);
    
    // Auto-select first table if activeTableId is invalid or not in active project
    let activeTable = projectTables.find(t => t.id === state.activeTableId);
    if (!activeTable && projectTables.length > 0) {
        activeTable = projectTables[0];
        state.activeTableId = activeTable.id;
    }

    const viewMode = state.databaseViewMode || 'grid';

    // Sidebar listing of tables
    const sidebarHTML = `
    <div class="w-full md:w-56 shrink-0 flex flex-col gap-3.5 bg-panel-hover/10 border border-glass-border/30 p-4 rounded-2xl">
        <div class="flex justify-between items-center pb-2 border-b border-glass-border/30">
            <span class="text-xs uppercase tracking-wider font-semibold text-text-muted">Campaign Tables</span>
            <button onclick="window.showCreateTableModal()" class="text-xs text-primary hover:text-white font-bold cursor-pointer" title="Create Table">+</button>
        </div>
        <div class="flex flex-col gap-1">
            ${projectTables.map(t => {
                const isActive = activeTable && activeTable.id === t.id;
                return `
                <button onclick="window.switchActiveTable('${t.id}')" 
                        class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            isActive ? 'bg-primary text-white' : 'text-text-muted hover:bg-panel-hover/40 hover:text-white'
                        }">
                    📊 ${sanitizeHTML(t.name)}
                </button>
                `;
            }).join('')}
            ${projectTables.length === 0 ? `
                <span class="text-[10px] text-text-muted italic py-4 block text-center">No custom databases.</span>
            ` : ''}
        </div>
    </div>
    `;

    if (!activeTable) {
        return `
        <div class="fade-in flex flex-col md:flex-row gap-6">
            ${sidebarHTML}
            <div class="flex-grow flex items-center justify-center border-2 border-dashed border-glass-border/30 rounded-2xl py-24 text-center text-text-muted">
                <div>
                    <h3 class="font-outfit text-white font-semibold mb-2">No Databases Created</h3>
                    <p class="text-xs text-text-muted max-w-xs mb-4">Add custom collaborative tables to track budgets, outreach databases, resources, etc.</p>
                    <button onclick="window.showCreateTableModal()" class="px-4 py-2 bg-primary text-white font-medium text-xs rounded-xl hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">Create First Table</button>
                </div>
            </div>
        </div>

        <!-- Create Table Modal -->
        ${renderCreateTableModal(activePid)}
        `;
    }

    const fields = activeTable.fields;
    const rows = activeTable.rows;

    let viewHTML = '';

    if (viewMode === 'grid') {
        // --- 1. SPREADSHEET GRID VIEW ---
        viewHTML = `
        <div class="w-full overflow-x-auto bg-[rgba(15,23,42,0.5)] border border-glass-border rounded-2xl">
            <table class="w-full text-left text-xs border-collapse">
                <thead>
                    <tr class="border-b border-glass-border/40 bg-panel-hover/40 text-text-muted font-mono uppercase tracking-wider text-[10px]">
                        <th class="p-3 w-10 text-center"></th>
                        ${fields.map(f => `
                            <th class="p-3 border-l border-glass-border/30 min-w-[150px]">
                                <div class="flex justify-between items-center gap-2">
                                    <span>${sanitizeHTML(f.name)} <span class="text-[8px] text-text-muted lowercase">(${f.type})</span></span>
                                    <button onclick="window.deleteColumnPrompt('${activeTable.id}', '${f.id}')" class="text-text-muted hover:text-rose-500 font-bold ml-2 cursor-pointer" title="Delete Column">✕</button>
                                </div>
                            </th>
                        `).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map(r => `
                        <tr class="border-b border-glass-border/20 hover:bg-panel-hover/10 transition-colors group/row">
                            <td class="p-2.5 text-center">
                                <button onclick="window.deleteRowPrompt('${activeTable.id}', '${r.id}')" class="text-text-muted hover:text-rose-500 font-bold opacity-0 group-hover/row:opacity-100 transition-opacity cursor-pointer">✕</button>
                            </td>
                            ${fields.map(f => {
                                const val = r.cells[f.id] !== undefined ? r.cells[f.id] : '';
                                return `
                                <td class="p-2 border-l border-glass-border/20">
                                    ${renderSpreadsheetCell(activeTable.id, r.id, f, val)}
                                </td>
                                `;
                            }).join('')}
                        </tr>
                    `).join('')}
                    ${rows.length === 0 ? `
                        <tr>
                            <td colspan="${fields.length + 1}" class="p-12 text-center text-text-muted italic bg-glass-bg/5">No records in this database. Click "+ Add Record" to add your first row.</td>
                        </tr>
                    ` : ''}
                </tbody>
            </table>
        </div>
        `;
    } else {
        // --- 2. GALLERY CARDS VIEW ---
        viewHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            ${rows.map(r => `
                <div class="bg-glass-bg border border-glass-border hover:border-primary p-5 rounded-2xl relative group flex flex-col justify-between gap-4">
                    <button onclick="window.deleteRowPrompt('${activeTable.id}', '${r.id}')" class="absolute top-4 right-4 text-text-muted hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
                    <div class="flex flex-col gap-2.5">
                        ${fields.map(f => {
                            const val = r.cells[f.id] !== undefined ? r.cells[f.id] : '—';
                            return `
                            <div class="flex flex-col gap-0.5 border-b border-glass-border/10 pb-1.5 last:border-b-0 last:pb-0">
                                <span class="text-[9px] uppercase tracking-wider font-semibold text-text-muted">${sanitizeHTML(f.name)}</span>
                                <span class="text-xs text-white">${sanitizeHTML(val.toString())}</span>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
            ${rows.length === 0 ? `
                <div class="col-span-full text-center text-text-muted text-xs py-12 border border-dashed border-glass-border rounded-2xl bg-glass-bg/5">No records in this database.</div>
            ` : ''}
        </div>
        `;
    }

    return `
    <div class="fade-in flex flex-col md:flex-row gap-6 h-full min-h-[500px]">
        <!-- Sidebar -->
        ${sidebarHTML}

        <!-- Active Table Workspace -->
        <div class="flex-grow flex flex-col gap-6">
            <!-- Table Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-panel-hover/30 border border-glass-border/30 p-4.5 rounded-2xl">
                <div>
                    <h2 class="text-xl font-bold font-outfit text-white">📊 ${sanitizeHTML(activeTable.name)}</h2>
                    <p class="text-xs text-text-muted mt-1 leading-normal">${sanitizeHTML(activeTable.description)}</p>
                </div>
                <button onclick="window.deleteTablePrompt('${activeTable.id}')" class="px-3.5 py-1.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-semibold text-[10px] rounded-xl transition-all cursor-pointer">Delete Table</button>
            </div>

            <!-- Toolbar -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="flex gap-3 flex-wrap">
                    <!-- Layout Mode Switcher -->
                    <div class="flex bg-panel-hover p-1 rounded-xl border border-glass-border">
                        <button onclick="window.toggleDatabaseViewMode('grid')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-text-muted'}">📊 Spreadsheet</button>
                        <button onclick="window.toggleDatabaseViewMode('gallery')" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:text-white transition-colors cursor-pointer ${viewMode === 'gallery' ? 'bg-primary text-white' : 'text-text-muted'}">🖼️ Cards Gallery</button>
                    </div>
                </div>
                <div class="flex gap-2.5">
                    <button onclick="window.showAddFieldModal()" class="px-4 py-2 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">+ Add Column</button>
                    <button onclick="window.showAddRowModal()" class="px-4 py-2 bg-primary rounded-xl text-xs font-medium hover:bg-indigo-600 transition-colors shadow-[0_0_15px_var(--color-primary-glow)] cursor-pointer">+ Add Record</button>
                </div>
            </div>

            <!-- View Workspace Content -->
            ${viewHTML}
        </div>

        <!-- Create Table Modal -->
        ${renderCreateTableModal(activePid)}

        <!-- Add Field Modal -->
        <div id="add-field-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
                <h3 class="text-lg font-semibold text-white font-outfit">Add Schema Column</h3>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Column Name</label>
                    <input id="modal-field-name" type="text" placeholder="e.g. Outreach Email" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary">
                </div>
                <div>
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Field Type</label>
                    <select id="modal-field-type" onchange="window.toggleOptionsField(this.value)" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary cursor-pointer">
                        <option value="text">Text / Line String</option>
                        <option value="number">Number / Integer</option>
                        <option value="date">Calendar Date</option>
                        <option value="select">Dropdown Select Options</option>
                    </select>
                </div>
                <div id="modal-field-options-container" class="hidden">
                    <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Select Options (comma-separated)</label>
                    <input id="modal-field-options" type="text" placeholder="e.g. Active, Closed, Paused" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary">
                </div>
                <div class="flex justify-end gap-2 mt-2">
                    <button onclick="window.hideAddFieldModal()" class="px-3.5 py-1.5 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                    <button onclick="window.submitFieldForm('${activeTable.id}')" class="px-4 py-1.5 bg-primary rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Add Column</button>
                </div>
            </div>
        </div>

        <!-- Add Row Modal -->
        <div id="add-row-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 overflow-y-auto max-h-[85vh]">
                <h3 class="text-lg font-semibold text-white font-outfit">Add Table Record</h3>
                <div class="flex flex-col gap-4" id="add-row-fields-container">
                    ${fields.map(f => {
                        let inputHTML = '';
                        if (f.type === 'select') {
                            const opts = f.options || [];
                            inputHTML = `
                            <select data-field-id="${f.id}" class="row-field-input w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none cursor-pointer">
                                <option value="">Select...</option>
                                ${opts.map(o => `<option value="${o}">${sanitizeHTML(o)}</option>`).join('')}
                            </select>
                            `;
                        } else if (f.type === 'number') {
                            inputHTML = `
                            <input data-field-id="${f.id}" type="number" class="row-field-input w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none">
                            `;
                        } else if (f.type === 'date') {
                            inputHTML = `
                            <input data-field-id="${f.id}" type="date" class="row-field-input w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none cursor-pointer">
                            `;
                        } else {
                            inputHTML = `
                            <input data-field-id="${f.id}" type="text" class="row-field-input w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none">
                            `;
                        }

                        return `
                        <div>
                            <label class="block text-[10px] font-semibold text-text-muted uppercase mb-1">${sanitizeHTML(f.name)}</label>
                            ${inputHTML}
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="flex justify-end gap-2 mt-3">
                    <button onclick="window.hideAddRowModal()" class="px-3.5 py-1.5 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                    <button onclick="window.submitRowForm('${activeTable.id}')" class="px-4 py-1.5 bg-primary rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Save Record</button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function renderCreateTableModal(pid: string): string {
    return `
    <div id="create-table-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4">
            <h3 class="text-lg font-semibold text-white font-outfit">Create Collaborative Table</h3>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Table Name</label>
                <input id="modal-table-name" type="text" placeholder="e.g. Media Sponsorships" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary">
            </div>
            <div>
                <label class="block text-xs font-semibold text-text-muted uppercase mb-1">Description</label>
                <textarea id="modal-table-desc" placeholder="What will this database manage?" class="w-full bg-panel-hover border border-glass-border p-2.5 rounded-xl text-white text-xs focus:outline-none focus:border-primary resize-none h-20 leading-relaxed"></textarea>
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideCreateTableModal()" class="px-3.5 py-1.5 bg-panel-hover border border-glass-border rounded-xl text-xs font-medium hover:bg-glass-border transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitTableForm('${pid}')" class="px-4 py-1.5 bg-primary rounded-xl text-xs font-semibold hover:bg-indigo-600 transition-colors cursor-pointer">Create Table</button>
            </div>
        </div>
    </div>
    `;
}

function renderSpreadsheetCell(tableId: string, rowId: string, f: any, val: any): string {
    const onchangeStr = `window.updateCell('${tableId}', '${rowId}', '${f.id}', this.value)`;
    if (f.type === 'select') {
        const opts = f.options || [];
        return `
        <select onchange="${onchangeStr}" class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover text-white text-xs rounded p-1 cursor-pointer w-full">
            <option value="">Select...</option>
            ${opts.map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${sanitizeHTML(o)}</option>`).join('')}
        </select>
        `;
    } else if (f.type === 'number') {
        return `
        <input type="number" value="${val}" onchange="${onchangeStr}" class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-white text-xs w-full">
        `;
    } else if (f.type === 'date') {
        return `
        <input type="date" value="${val}" onchange="${onchangeStr}" class="bg-transparent border-0 hover:bg-panel-hover focus:bg-panel-hover rounded p-1 text-white text-xs cursor-pointer w-full">
        `;
    } else {
        return `
        <input type="text" value="${sanitizeHTML(val.toString())}" onchange="${onchangeStr}" class="bg-transparent border-0 focus:bg-panel-hover focus:ring-1 focus:ring-primary rounded px-2 py-1 text-white text-xs w-full">
        `;
    }
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.switchActiveTable = (tid: string) => {
        state.activeTableId = tid;
        state.notifyStateChange();
    };

    w.toggleDatabaseViewMode = (mode: 'grid' | 'gallery') => {
        state.databaseViewMode = mode;
        state.notifyStateChange();
    };

    w.showCreateTableModal = () => {
        const modal = document.getElementById('create-table-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideCreateTableModal = () => {
        const modal = document.getElementById('create-table-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitTableForm = (pid: string) => {
        const nameEl = document.getElementById('modal-table-name') as HTMLInputElement;
        const descEl = document.getElementById('modal-table-desc') as HTMLTextAreaElement;

        if (nameEl && descEl) {
            const name = nameEl.value.trim();
            const desc = descEl.value.trim();
            if (!name) {
                alert("Table name is required.");
                return;
            }

            addDbTable(pid, name, desc);
            w.hideCreateTableModal();
            nameEl.value = "";
            descEl.value = "";
        }
    };

    w.deleteTablePrompt = (id: string) => {
        if (confirm("Permanently delete this entire database table? This action is irreversible.")) {
            deleteDbTable(id);
        }
    };

    w.showAddFieldModal = () => {
        const modal = document.getElementById('add-field-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddFieldModal = () => {
        const modal = document.getElementById('add-field-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.toggleOptionsField = (type: string) => {
        const container = document.getElementById('modal-field-options-container');
        if (container) {
            if (type === 'select') {
                container.classList.remove('hidden');
            } else {
                container.classList.add('hidden');
            }
        }
    };

    w.submitFieldForm = (tid: string) => {
        const nameEl = document.getElementById('modal-field-name') as HTMLInputElement;
        const typeEl = document.getElementById('modal-field-type') as HTMLSelectElement;
        const optsEl = document.getElementById('modal-field-options') as HTMLInputElement;

        if (nameEl && typeEl && optsEl) {
            const name = nameEl.value.trim();
            const type = typeEl.value as any;
            const optsStr = optsEl.value.trim();

            if (!name) {
                alert("Column name is required.");
                return;
            }

            let options: string[] | undefined = undefined;
            if (type === 'select') {
                options = optsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
                if (options.length === 0) {
                    alert("Comma-separated options are required for dropdown columns.");
                    return;
                }
            }

            addDbField(tid, name, type, options);
            w.hideAddFieldModal();
            nameEl.value = "";
            optsEl.value = "";
            const container = document.getElementById('modal-field-options-container');
            if (container) container.classList.add('hidden');
        }
    };

    w.deleteColumnPrompt = (tid: string, fid: string) => {
        if (confirm("Delete this column? Cell values will be lost.")) {
            deleteDbField(tid, fid);
        }
    };

    w.showAddRowModal = () => {
        const modal = document.getElementById('add-row-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddRowModal = () => {
        const modal = document.getElementById('add-row-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitRowForm = (tid: string) => {
        const inputs = document.querySelectorAll('.row-field-input');
        const cells: Record<string, any> = {};

        inputs.forEach(el => {
            const fieldId = el.getAttribute('data-field-id')!;
            const type = el.tagName === 'SELECT' ? 'select' : (el as HTMLInputElement).type;
            const rawVal = (el as HTMLInputElement | HTMLSelectElement).value;

            if (rawVal !== "") {
                if (type === 'number') {
                    cells[fieldId] = parseFloat(rawVal) || 0;
                } else {
                    cells[fieldId] = rawVal;
                }
            }
        });

        addDbRow(tid, cells);
        w.hideAddRowModal();
        
        // Reset inputs
        inputs.forEach(el => {
            (el as HTMLInputElement | HTMLSelectElement).value = "";
        });
    };

    w.updateCell = (tid: string, rid: string, fid: string, val: string) => {
        const cellData: Record<string, any> = {};
        const tbl = state.tables.find(t => t.id === tid);
        if (tbl) {
            const f = tbl.fields.find(field => field.id === fid);
            if (f && f.type === 'number') {
                cellData[fid] = parseFloat(val) || 0;
            } else {
                cellData[fid] = val;
            }
            updateDbRow(tid, rid, cellData);
        }
    };

    w.deleteRowPrompt = (tid: string, rid: string) => {
        if (confirm("Delete this database row?")) {
            deleteDbRow(tid, rid);
        }
    };
}
