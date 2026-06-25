import { state, updateErpBudget, addDbRow, notifyStateChange, createP2PTransaction, approveP2PRequisition, deliverP2PGoods, receiveP2PInvoice, run3WayMatch, payP2PInvoice, replenishInventory, adjustInventoryCount, closeFinancialMonth, hasPermission } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

// Custom override for alert to use premium toast notifications
const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('converted') || msg.toLowerCase().includes('saved') || msg.toLowerCase().includes('verified') || msg.toLowerCase().includes('paid') || msg.toLowerCase().includes('restocked');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

export function renderERPView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    state.currentProject = p.id;
    const orgId = state.activeOrgId || 'personal-tenant';
    const role = state.activeRole || 'admin';
    const activeTab = (typeof window !== 'undefined' ? (window as any).__activeErpTab : null) || 'budget';

    // 1. Calculations for budget table
    let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
    if (!budgetTable) {
        budgetTable = state.tables.find(t => t.id === 'tbl-budget');
    }

    const budgetLimit = p.budgetLimit || 0;
    
    // Calculate spent from budget table cells
    let spent = p.spent || 0;
    if (budgetTable) {
        const amountField = budgetTable.fields.find(f => f.name.toLowerCase().includes('amount') || f.id === 'f-amount');
        if (amountField) {
            const sum = budgetTable.rows.reduce((acc, row) => {
                const val = parseFloat(row.cells[amountField.id]);
                return acc + (isNaN(val) ? 0 : val);
            }, 0);
            spent = sum;
            p.spent = spent; // Sync state
        }
    }

    const percent = budgetLimit > 0 ? Math.min(100, Math.round((spent / budgetLimit) * 100)) : 0;
    
    const categories = ['Sponsor Costs', 'Paid Ads', 'Tooling & APIs', 'Contractors', 'General'];
    const categoryTotals: Record<string, number> = {
        'Sponsor Costs': 0,
        'Paid Ads': 0,
        'Tooling & APIs': 0,
        'Contractors': 0,
        'General': 0
    };

    if (budgetTable) {
        budgetTable.rows.forEach(row => {
            const cat = row.cells['f-category'] || 'General';
            const amt = parseFloat(row.cells['f-amount']) || 0;
            if (categoryTotals[cat] !== undefined) {
                categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
            } else {
                categoryTotals['General'] = (categoryTotals['General'] || 0) + amt;
            }
        });
    }

    // Organization budgets pool context
    const orgProjects = state.projects.filter(proj => !proj.isArchived && !proj.isBinned);
    const orgTotalLimit = orgProjects.reduce((sum, pr) => sum + (pr.budgetLimit || 0), 0);
    const orgTotalSpent = orgProjects.reduce((sum, pr) => sum + (pr.spent || 0), 0);
    const orgPercent = orgTotalLimit > 0 ? Math.round((orgTotalSpent / orgTotalLimit) * 100) : 0;

    // Team load
    const projectTasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned);
    const teamLoad = state.team.map(member => {
        const tasks = projectTasks.filter(t => t.assignee === member.id || t.assignee === member.name);
        const points = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
        const hours = points * 2.5; 
        return {
            ...member,
            taskCount: tasks.length,
            points,
            hours
        };
    });

    const isFinancialRole = hasPermission('manage:billing');

    // Tabs navigation HTML
    const tabsHTML = `
    <div class="flex gap-6 border-b border-text-main/10 w-full pb-2 mb-4">
        <button onclick="window.setErpTab('budget')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'budget' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Operating Budgets</button>
        <button onclick="window.setErpTab('p2p')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'p2p' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Contractor P2P & 3-Way Match</button>
        <button onclick="window.setErpTab('inventory')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'inventory' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Production Gear & SaaS Seats</button>
        <button onclick="window.setErpTab('closeout')" class="pb-1.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeTab === 'closeout' ? 'text-text-main border-b-2 border-text-main font-bold' : 'text-text-muted hover:text-text-main'}">Campaign Closeout</button>
    </div>
    `;

    // Render Tab Content
    let tabContentHTML = "";

    if (activeTab === 'budget') {
        tabContentHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left 2 Columns: Budget & Expenses -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Workspace Budget Card -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-sm">Campaign Spend Index</h3>
                        <span class="text-[10px] text-text-muted font-bold">Active Workspace</span>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="bg-panel-hover/10 border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Limit</span>
                            <span class="text-xl font-bold font-mono text-text-main">$${budgetLimit.toLocaleString()}</span>
                        </div>
                        <div class="bg-panel-hover/10 border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Spent</span>
                            <span class="text-xl font-bold font-mono text-text-main">$${spent.toLocaleString()}</span>
                        </div>
                        <div class="bg-panel-hover/10 border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Remaining</span>
                            <span class="text-xl font-bold font-mono ${(budgetLimit - spent) < 0 ? 'text-rose-500' : 'text-text-main'}">$${(budgetLimit - spent).toLocaleString()}</span>
                        </div>
                        <div class="bg-panel-hover/10 border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Total Billable Hours</span>
                            <span class="text-xl font-bold font-mono text-emerald-500">24h 30m</span>
                        </div>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mt-2">
                        <div class="flex justify-between text-xs font-bold mb-1">
                            <span>Usage Level</span>
                            <span>${percent}%</span>
                        </div>
                        <div class="w-full bg-text-main/10 h-3 rounded-full overflow-hidden">
                            <div class="bg-text-main h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                        </div>
                        ${percent >= 90 ? `<p class="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">${getIconSVG('info', 'w-3.5 h-3.5 text-rose-500')} <span>Warning: Workspace has spent over 90% of its budget limit.</span></p>` : ''}
                    </div>

                    <!-- Visual Categories Breakdown -->
                    <div class="border-t border-text-main/10 pt-4 mt-2">
                        <h4 class="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Operating Categories Allocation</h4>
                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
                            ${categories.map(cat => {
                                const amt = categoryTotals[cat] || 0;
                                const catPercent = budgetLimit > 0 ? Math.min(100, Math.round((amt / budgetLimit) * 100)) : 0;
                                return `
                                <div class="bg-panel-hover/10 p-2.5 rounded-xl border border-text-main/5 flex flex-col justify-between min-h-[65px]">
                                    <div>
                                        <span class="text-[9px] text-text-muted font-medium block truncate" title="${cat}">${cat}</span>
                                        <span class="text-xs font-bold font-mono text-text-main">$${amt.toLocaleString()}</span>
                                    </div>
                                    <div class="w-full bg-text-main/10 h-1 rounded-full overflow-hidden mt-1.5">
                                        <div class="bg-text-main h-full" style="width: ${catPercent}%"></div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Expense Sheet -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-sm">Logged Invoices & Multi-Team Expenses</h3>
                        <span class="text-[10px] text-text-muted font-mono">Synced with Database</span>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="border-b border-text-main/20 text-text-muted">
                                    <th class="py-2.5 font-bold">Description</th>
                                    <th class="py-2.5 font-bold">Details</th>
                                    <th class="py-2.5 font-bold">Approvals</th>
                                    <th class="py-2.5 font-bold">Date</th>
                                    <th class="py-2.5 font-bold text-right">Amount</th>
                                    <th class="py-2.5 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${budgetTable && budgetTable.rows.length > 0 ? budgetTable.rows.map(row => {
                                    const desc = row.cells['f-desc'] || 'Expense';
                                    const cat = row.cells['f-category'] || 'General';
                                    const date = row.cells['f-date'] || '-';
                                    const amount = parseFloat(row.cells['f-amount']) || 0;
                                    const team = row.cells['f-team'] || 'Global';
                                    const assignee = row.cells['f-assignee'] || 'Unassigned';
                                    const status = row.cells['f-status'] || 'pending';

                                    let statusColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
                                    if (status === 'approved') statusColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
                                    if (status === 'flagged') statusColor = 'text-rose-500 bg-rose-500/10 border-rose-500/20';

                                    const isRevenue = amount < 0;

                                    return `
                                    <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                        <td class="py-3 font-semibold">
                                            <div class="text-text-main flex items-center gap-1">
                                                ${isRevenue ? getIconSVG('analytics', 'w-3 h-3 text-emerald-500 shrink-0') : ''} ${sanitizeHTML(desc)}
                                            </div>
                                            <div class="text-[9px] text-text-muted mt-0.5">${cat}</div>
                                        </td>
                                        <td class="py-3">
                                            <div class="text-text-main font-semibold">${sanitizeHTML(team)}</div>
                                            <div class="text-[9px] text-text-muted mt-0.5">Assigned: ${sanitizeHTML(assignee)}</div>
                                        </td>
                                        <td class="py-3">
                                            <span onclick="${isFinancialRole ? `window.cycleExpenseStatus('${row.id}', '${pid}', '${status}')` : `alert('Permission Denied: Only Accountants/Managers can audit statuses.')`}" 
                                                  class="px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase cursor-pointer select-none ${statusColor}" title="Click to cycle status: Pending -> Approved -> Flagged">
                                                ${status}
                                            </span>
                                        </td>
                                        <td class="py-3 font-mono text-[11px]">${sanitizeHTML(date)}</td>
                                        <td class="py-3 text-right font-bold font-mono ${isRevenue ? 'text-emerald-500' : 'text-text-main'}">
                                            ${isRevenue ? '+' : ''}$${Math.abs(amount).toLocaleString()}
                                        </td>
                                        <td class="py-3 text-center">
                                            <button onclick="window.deleteExpenseRow('${row.id}', '${pid}')" class="text-text-muted hover:text-rose-500 text-xs font-bold cursor-pointer">✕</button>
                                        </td>
                                    </tr>
                                    `;
                                }).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center py-8 text-text-muted text-xs">No logged expenses found. Click "+ Log Expense" to begin.</td>
                                </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right Column: Resource Meters & Workspace Links -->
            <div class="flex flex-col gap-6">
                <!-- Org Workspaces Budgets List -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm">Linked Workspace Budgets</h3>
                    <p class="text-[11px] text-text-muted">Compare budgets across all operational workspaces under org: ${orgId}.</p>
                    <div class="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                        ${orgProjects.map(proj => {
                            const isCurrent = proj.id === pid;
                            const spentAmt = proj.spent || 0;
                            const limitAmt = proj.budgetLimit || 0;
                            const projPct = limitAmt > 0 ? Math.min(100, Math.round((spentAmt / limitAmt) * 100)) : 0;
                            return `
                            <div class="p-3 border rounded-xl flex flex-col gap-1.5 transition-all ${isCurrent ? 'border-text-main bg-text-main/5' : 'border-text-main/10 bg-background'}">
                                <div class="flex justify-between items-center">
                                    <span class="text-xs font-bold truncate max-w-[70%]">${sanitizeHTML(proj.name)}</span>
                                    <span class="text-[10px] font-mono font-bold">$${spentAmt.toLocaleString()} / $${limitAmt.toLocaleString()}</span>
                                </div>
                                <div class="w-full bg-text-main/10 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-text-main h-full" style="width: ${projPct}%"></div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm">Team Load & Allocation</h3>
                    <p class="text-[11px] text-text-muted">Estimated work burden based on total complexity points assigned on Kanban boards.</p>
                    
                    <div class="flex flex-col gap-5 mt-2">
                        ${teamLoad.map(member => {
                            const maxPoints = 25; 
                            const loadPercent = Math.min(100, Math.round((member.points / maxPoints) * 100));
                            
                            return `
                            <div class="flex flex-col gap-2 p-3 border border-text-main/10 rounded-xl bg-background hover:border-text-main/30 transition-all">
                                <div class="flex justify-between items-center">
                                    <div class="flex items-center gap-2">
                                        <div class="w-2.5 h-2.5 rounded-full ${member.avatarColor}"></div>
                                        <div>
                                            <span class="text-xs font-bold block">${sanitizeHTML(member.name)}</span>
                                            <span class="text-[9px] text-text-muted block">${sanitizeHTML(member.role)}</span>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span class="text-xs font-bold block font-mono">${member.points} pts</span>
                                        <span class="text-[9px] text-text-muted block font-mono">~${member.hours} hrs</span>
                                    </div>
                                </div>
                                <div>
                                    <div class="w-full bg-text-main/10 h-1.5 rounded-full overflow-hidden">
                                        <div class="bg-text-main h-full rounded-full transition-all" style="width: ${loadPercent}%"></div>
                                    </div>
                                    <div class="flex justify-between text-[8px] text-text-muted mt-1 font-bold">
                                        <span>Tasks: ${member.taskCount}</span>
                                        <span>${loadPercent}% Load Cap</span>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
        `;
    } 
    
    else if (activeTab === 'p2p') {
        const txs = state.p2pTransactions.filter(t => t.projectId === pid);
        tabContentHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Freelancer Contract Request Form -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm font-outfit">Log Contractor Requisition</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Freelancer / Artist</label>
                            <input id="p2p-vendor" type="text" placeholder="e.g. Alex (Video Editor)" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Deliverable Terms</label>
                            <input id="p2p-desc" type="text" placeholder="e.g. Retainer rough cut edit" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-[10px] text-text-muted font-bold uppercase mb-1">Contract Amount ($)</label>
                            <div class="flex gap-2">
                                <input id="p2p-amount" type="number" placeholder="1200" class="w-full bg-background border border-text-main/20 focus:border-text-main p-2.5 rounded-xl text-text-main text-xs focus:outline-none">
                                <button onclick="window.submitFreelancerRequisition('${pid}')" class="px-4 bg-text-main text-background font-bold text-xs rounded-xl hover:bg-text-main/80 transition-colors cursor-pointer">Submit</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- P2P Ledger List -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm font-outfit">Procure-to-Pay Transaction Ledger</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-[11px] border-collapse">
                            <thead>
                                <tr class="border-b border-text-main/20 text-text-muted">
                                    <th class="py-2.5 font-bold">Contractor Details</th>
                                    <th class="py-2.5 font-bold text-right">PO Amount</th>
                                    <th class="py-2.5 font-bold text-center">Status / P2P Progression Stepper</th>
                                    <th class="py-2.5 font-bold text-right">Inv Amount</th>
                                    <th class="py-2.5 font-bold text-center">3-Way Match</th>
                                    <th class="py-2.5 font-bold text-center">Payment</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${txs.length > 0 ? txs.map(t => {
                                    const steps = [];
                                    const stepClass = "w-2.5 h-2.5 rounded-full flex items-center justify-center font-bold text-[7px] text-white";
                                    
                                    // 1. Requisition
                                    const reqDone = t.requisitionStatus === 'approved';
                                    steps.push(`<span class="${reqDone ? 'bg-emerald-500' : 'bg-amber-500'} ${stepClass}" title="Requisition Status: ${t.requisitionStatus}">R</span>`);
                                    
                                    // 2. PO Issued
                                    const poDone = t.poStatus === 'issued';
                                    steps.push(`<span class="${poDone ? 'bg-emerald-500' : 'bg-text-main/15 text-text-muted'} ${stepClass}" title="Contract Status: ${t.poStatus}">PO</span>`);
                                    
                                    // 3. Deliverable Received (Goods Receipt)
                                    const grDone = t.receiptStatus === 'received';
                                    steps.push(`<span class="${grDone ? 'bg-emerald-500' : 'bg-text-main/15 text-text-muted'} ${stepClass}" title="Deliverable Asset: ${t.receiptStatus}">GR</span>`);
                                    
                                    // 4. Invoice Logged
                                    const invDone = t.invoiceStatus === 'received';
                                    steps.push(`<span class="${invDone ? 'bg-emerald-500' : 'bg-text-main/15 text-text-muted'} ${stepClass}" title="Invoice Logged: ${t.invoiceStatus}">INV</span>`);

                                    // Action button based on state
                                    let actionButton = "";
                                    if (t.requisitionStatus === 'pending') {
                                        actionButton = `<button onclick="window.approveP2PRequisition('${t.id}')" class="px-2 py-1 bg-text-main text-background rounded text-[9px] font-bold hover:bg-text-main/80 cursor-pointer">Approve PO</button>`;
                                    } else if (t.poStatus === 'issued' && t.receiptStatus === 'pending') {
                                        actionButton = `<button onclick="window.deliverP2PGoods('${t.id}')" class="px-2 py-1 bg-blue-500 text-white rounded text-[9px] font-bold hover:bg-blue-600 cursor-pointer">Receive Asset</button>`;
                                    } else if (t.receiptStatus === 'received' && t.invoiceStatus === 'pending') {
                                        actionButton = `<button onclick="window.receiveP2PInvoicePrompt('${t.id}')" class="px-2 py-1 bg-purple-500 text-white rounded text-[9px] font-bold hover:bg-purple-600 cursor-pointer">Log Invoice</button>`;
                                    } else if (t.invoiceStatus === 'received' && t.matchStatus === 'unchecked') {
                                        actionButton = `<button onclick="window.run3WayMatch('${t.id}')" class="px-2 py-1 bg-amber-500 text-white rounded text-[9px] font-bold hover:bg-amber-600 cursor-pointer">Run Match</button>`;
                                    } else if (t.matchStatus === 'matched' && t.paymentStatus === 'unpaid') {
                                        actionButton = `<button onclick="window.payP2PInvoice('${t.id}')" class="px-2 py-1 bg-emerald-500 text-white rounded text-[9px] font-bold hover:bg-emerald-600 cursor-pointer">Pay Net-30</button>`;
                                    } else if (t.matchStatus === 'mismatched') {
                                        actionButton = `<button onclick="window.receiveP2PInvoicePrompt('${t.id}')" class="px-2 py-1 bg-rose-500 text-white rounded text-[9px] font-bold hover:bg-rose-600 cursor-pointer">Resolve Discrepancy</button>`;
                                    } else {
                                        actionButton = `<span class="text-emerald-500 font-bold">✓ Complete</span>`;
                                    }

                                    let matchBadge = `<span class="px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase text-text-muted bg-text-main/5 border-text-main/10">Unchecked</span>`;
                                    if (t.matchStatus === 'matched') matchBadge = `<span class="px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase text-emerald-500 bg-emerald-500/10 border-emerald-500/20">Matched</span>`;
                                    if (t.matchStatus === 'mismatched') matchBadge = `<span class="px-1.5 py-0.5 border rounded text-[9px] font-bold uppercase text-rose-500 bg-rose-500/10 border-rose-500/20">Mismatched</span>`;

                                    return `
                                    <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                        <td class="py-3">
                                            <div class="font-bold text-text-main">${sanitizeHTML(t.vendorName)}</div>
                                            <div class="text-[9px] text-text-muted mt-0.5">${sanitizeHTML(t.poDescription)}</div>
                                        </td>
                                        <td class="py-3 text-right font-mono font-semibold">$${t.poAmount.toLocaleString()}</td>
                                        <td class="py-3">
                                            <div class="flex items-center gap-1 justify-center">
                                                ${steps.join('<div class="w-2 border-t border-text-main/20"></div>')}
                                            </div>
                                        </td>
                                        <td class="py-3 text-right font-mono font-semibold">$${t.invoiceAmount.toLocaleString()}</td>
                                        <td class="py-3 text-center">${matchBadge}</td>
                                        <td class="py-3 text-center">${actionButton}</td>
                                    </tr>
                                    `;
                                }).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center py-8 text-text-muted">No freelancer contracts logged. Use Requisition Form above.</td>
                                </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-3">
                    <h4 class="font-bold text-sm">3-Way Match Verification</h4>
                    <p class="text-xs text-text-muted leading-relaxed">
                        To prevent financial fraud and error, Meidallm enforces **3-Way Matching** for contractor pay:
                    </p>
                    <ul class="list-disc pl-4 text-xs text-text-muted flex flex-col gap-2 mt-1">
                        <li><strong>1. Requisition / PO:</strong> Specifies contract payment terms agreed with freelancer.</li>
                        <li><strong>2. Asset Deliverable Receipt:</strong> Confirms the rough cut video draft or graphic asset was successfully uploaded.</li>
                        <li><strong>3. Freelancer Invoice:</strong> Specifies billed amount. Paid only when PO matches Invoice.</li>
                    </ul>
                </div>
            </div>
        </div>
        `;
    } 
    
    else if (activeTab === 'inventory') {
        const items = state.inventoryItems.filter(i => i.projectId === pid || i.projectId === 'p-welcome');
        tabContentHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Inventory List -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm font-outfit">SaaS Seats & Production Assets</h3>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="border-b border-text-main/20 text-text-muted">
                                    <th class="py-2.5 font-bold">Item Name</th>
                                    <th class="py-2.5 font-bold">Resource Type</th>
                                    <th class="py-2.5 font-bold text-center">On-Hand Qty</th>
                                    <th class="py-2.5 font-bold text-center">Safety Limit</th>
                                    <th class="py-2.5 font-bold text-right">Unit Price</th>
                                    <th class="py-2.5 font-bold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${items.map(item => {
                                    const isLow = item.qty < item.safetyStock;
                                    const qtyClass = isLow ? "text-rose-500 font-extrabold" : "text-text-main font-semibold";
                                    return `
                                    <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                        <td class="py-3 font-semibold text-text-main">
                                            ${sanitizeHTML(item.name)}
                                            ${isLow ? `<span class="ml-1.5 px-1.5 py-0.5 border border-rose-500/20 text-[8px] rounded bg-rose-500/10 text-rose-500 font-extrabold uppercase animate-pulse">Safety Alert</span>` : ''}
                                        </td>
                                        <td class="py-3 capitalize">${item.type}</td>
                                        <td class="py-3 text-center ${qtyClass}">${item.qty}</td>
                                        <td class="py-3 text-center font-mono">${item.safetyStock}</td>
                                        <td class="py-3 text-right font-mono">$${item.unitPrice}</td>
                                        <td class="py-3 text-center flex items-center justify-center gap-2">
                                            <button onclick="window.adjustInventoryPrompt('${item.id}', ${item.qty})" class="px-2 py-1 border border-text-main/20 hover:border-text-main rounded text-[9px] font-bold cursor-pointer">Audit</button>
                                            ${isLow ? `
                                                <button onclick="window.replenishInventory('${item.id}')" class="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded text-[9px] font-bold cursor-pointer">Restock</button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-3">
                    <h4 class="font-bold text-sm">Safety Stock Rules</h4>
                    <p class="text-xs text-text-muted leading-relaxed">
                        SD cards, microphone batteries, and Adobe CC seats represent critical bottlenecks. If quantities fall below safety limits, editing halts. 
                        Click **Restock** on flagged items to auto-generate PO replenishment invoices to vendors.
                    </p>
                </div>
            </div>
        </div>
        `;
    } 
    
    else if (activeTab === 'closeout') {
        // Calculate P&L summary
        const paidSponsorTotal = state.salesInvoices.filter(i => i.projectId === pid && i.invoiceStatus === 'paid').reduce((sum, inv) => sum + inv.dealValue, 0);
        const p2pExpenses = state.p2pTransactions.filter(t => t.projectId === pid && t.paymentStatus === 'paid').reduce((sum, tx) => sum + tx.invoiceAmount, 0);
        
        // Sum category totals from general ledger (exclude revenue sponsor deals)
        let otherExpenses = 0;
        if (budgetTable) {
            otherExpenses = budgetTable.rows.filter(r => {
                const amt = parseFloat(r.cells['f-amount']) || 0;
                const desc = (r.cells['f-desc'] || '').toLowerCase();
                return amt > 0 && !desc.includes('contractor pay') && !desc.includes('payroll');
            }).reduce((sum, r) => sum + (parseFloat(r.cells['f-amount']) || 0), 0);
        }

        const netIncome = paidSponsorTotal - p2pExpenses - otherExpenses;

        tabContentHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Trial Balance Summary -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm font-outfit">Campaign Profit & Loss (P&L) Statement</h3>
                    <div class="flex flex-col gap-3.5 border border-text-main/10 p-4 rounded-xl">
                        <div class="flex justify-between items-center text-xs border-b border-text-main/10 pb-2">
                            <span class="font-bold uppercase tracking-wider text-text-muted">Revenue Stream</span>
                            <span class="font-mono text-emerald-500 font-bold">+$${paidSponsorTotal.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs pl-2 text-text-muted">
                            <span>Paid Brand Retainers</span>
                            <span class="font-mono">$${paidSponsorTotal.toLocaleString()}</span>
                        </div>
                        
                        <div class="flex justify-between items-center text-xs border-b border-text-main/10 pb-2 mt-2">
                            <span class="font-bold uppercase tracking-wider text-text-muted">Operating Expenses</span>
                            <span class="font-mono text-rose-500 font-bold">-$${(p2pExpenses + otherExpenses).toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs pl-2 text-text-muted">
                            <span>Contractor Pay (P2P Paid)</span>
                            <span class="font-mono">$${p2pExpenses.toLocaleString()}</span>
                        </div>
                        <div class="flex justify-between items-center text-xs pl-2 text-text-muted">
                            <span>Gear & SaaS Seat Subscriptions</span>
                            <span class="font-mono">$${otherExpenses.toLocaleString()}</span>
                        </div>
                        
                        <div class="flex justify-between items-center text-sm border-t border-text-main/20 pt-3 mt-4">
                            <span class="font-bold text-text-main">Campaign Net Income</span>
                            <span class="font-mono font-extrabold text-base ${netIncome >= 0 ? 'text-emerald-500' : 'text-rose-500'}">
                                ${netIncome >= 0 ? '+' : ''}$${netIncome.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex flex-col gap-6">
                <!-- Locking control -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm font-outfit">Lock Month Accounts</h3>
                    <p class="text-xs text-text-muted leading-relaxed">
                        Run monthly close checks to lock campaign accounting. Once closed, no modifications or additions of invoices/expenses are allowed for that period.
                    </p>
                    <div class="flex flex-col gap-2.5">
                        <select id="closeout-month" class="w-full bg-background border border-text-main/20 p-2.5 rounded-xl text-xs text-text-main focus:outline-none cursor-pointer">
                            <option value="June 2026">June 2026</option>
                            <option value="July 2026">July 2026</option>
                        </select>
                        <button onclick="window.triggerFinancialClose('${pid}')" class="w-full py-2.5 bg-rose-500 text-white font-bold text-xs rounded-xl hover:bg-rose-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm">
                            ${getIconSVG('admin-rbac', 'w-3.5 h-3.5 text-current')} Lock Ledger Period
                        </button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <!-- ERP Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/15 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit font-bold flex items-center gap-2">
                    ${getIconSVG('workspaces', 'w-5 h-5 text-text-main')} ${sanitizeHTML(p.name)} ERP Control Hub
                </h2>
                <p class="text-xs text-text-muted">Tenant: <span class="font-mono text-text-main font-bold">${orgId}</span> • Manage workspace budget limits, verify freelancer POs, monitor safety stocks, and run financial closes.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="${isFinancialRole ? `window.showUpdateBudgetModal()` : `alert('Permission Denied: Only Admin/Manager can adjust budgets.')`}" class="px-3.5 py-2 border border-text-main/20 hover:border-text-main font-bold text-xs rounded-xl transition-all cursor-pointer">Adjust Limit</button>
                <button onclick="window.showAddExpenseModal()" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/80 font-bold text-xs rounded-xl transition-all cursor-pointer">+ Log Expense</button>
            </div>
        </div>

        <!-- Tenant Budget Pool Overview -->
        <div class="bg-background border border-text-main/15 p-5 rounded-2xl flex flex-col gap-3">
            <div class="flex justify-between items-center">
                <h3 class="font-bold text-sm text-text-main flex items-center gap-1.5">
                    ${getIconSVG('database-hub', 'w-4 h-4 text-text-main')} Tenant Workspace Pool: ${orgId.toUpperCase()}
                </h3>
                <span class="text-[10px] text-text-muted font-bold">${orgProjects.length} Starred Workspaces</span>
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="bg-panel-hover/30 border border-text-main/10 p-3 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-0.5">Org Total Limit</span>
                    <span class="text-lg font-bold font-mono text-text-main">$${orgTotalLimit.toLocaleString()}</span>
                </div>
                <div class="bg-panel-hover/30 border border-text-main/10 p-3 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-0.5">Org Aggregate Spent</span>
                    <span class="text-lg font-bold font-mono text-text-main">$${orgTotalSpent.toLocaleString()}</span>
                </div>
                <div class="bg-panel-hover/30 border border-text-main/10 p-3 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-0.5">Org Pool Remaining</span>
                    <span class="text-lg font-bold font-mono text-text-main">$${(orgTotalLimit - orgTotalSpent).toLocaleString()}</span>
                </div>
                <div class="bg-panel-hover/30 border border-text-main/10 p-3 rounded-xl">
                    <span class="text-[9px] text-text-muted font-bold block uppercase mb-0.5 font-bold">Org Pool Capacity</span>
                    <div class="flex items-center gap-2 mt-1">
                        <div class="w-full bg-text-main/10 h-2 rounded-full overflow-hidden">
                            <div class="bg-text-main h-full rounded-full" style="width: ${orgPercent}%"></div>
                        </div>
                        <span class="text-xs font-bold font-mono shrink-0">${orgPercent}%</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabs Switcher Header -->
        ${tabsHTML}

        <!-- Active Tab Content -->
        ${tabContentHTML}

    </div>

    <!-- Modals -->
    <!-- Update Budget Limit Modal -->
    <div id="update-budget-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center hidden z-50">
        <div class="bg-background border border-text-main/30 p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 text-text-main">
            <h3 class="text-lg font-bold font-outfit">Adjust Campaign Budget</h3>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Budget Limit ($)</label>
                <input id="modal-budget-limit" type="number" value="${budgetLimit}" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideUpdateBudgetModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-sm font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitBudgetUpdate('${pid}')" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/90 rounded-xl text-sm font-bold transition-colors cursor-pointer">Apply</button>
            </div>
        </div>
    </div>

    <!-- Add Expense Modal -->
    <div id="add-expense-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center hidden z-50">
        <div class="bg-background border border-text-main/30 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-text-main">
            <div class="flex justify-between items-center pb-2 border-b border-text-main/10">
                <h3 class="text-lg font-bold font-outfit">Log Operating Expense</h3>
                <button onclick="window.hideAddExpenseModal()" class="text-text-muted hover:text-text-main font-bold">✕</button>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Expense Description</label>
                <input id="modal-expense-desc" type="text" placeholder="e.g. AWS Production Infrastructure" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Category</label>
                    <select id="modal-expense-cat" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-xs focus:outline-none cursor-pointer">
                        <option value="Sponsor Costs">Sponsor Costs</option>
                        <option value="Paid Ads">Paid Ads</option>
                        <option value="Tooling & APIs">Tooling & APIs</option>
                        <option value="Contractors">Contractors</option>
                        <option value="General">General</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Cost Amount ($)</label>
                    <input id="modal-expense-amount" type="number" placeholder="e.g. 1500" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Assigned Team</label>
                    <select id="modal-expense-team" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-xs focus:outline-none cursor-pointer">
                        <option value="Global">Global / Workspace</option>
                        ${state.teams.map(t => `<option value="${sanitizeHTML(t.name)}">${sanitizeHTML(t.name)}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-text-muted uppercase mb-1">Assigned Member</label>
                    <select id="modal-expense-assignee" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-xs focus:outline-none cursor-pointer">
                        <option value="Unassigned">Unassigned</option>
                        ${state.team.map(m => `<option value="${sanitizeHTML(m.name)}">${sanitizeHTML(m.name)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Date Incurred</label>
                <input id="modal-expense-date" type="date" value="${new Date().toISOString().split('T')[0]}" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddExpenseModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-sm font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitExpenseForm('${pid}')" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/90 rounded-xl text-sm font-bold transition-colors cursor-pointer">Log Spend</button>
            </div>
        </div>
    </div>
    `;
}

// Global actions exposed to window
if (typeof window !== 'undefined') {
    const w = window as any;

    w.setErpTab = (tab: string) => {
        w.__activeErpTab = tab;
        notifyStateChange();
    };

    w.showUpdateBudgetModal = () => {
        const modal = document.getElementById('update-budget-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideUpdateBudgetModal = () => {
        const modal = document.getElementById('update-budget-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.submitBudgetUpdate = (pid: string) => {
        const limitEl = document.getElementById('modal-budget-limit') as HTMLInputElement;
        if (limitEl) {
            const limit = parseInt(limitEl.value) || 0;
            const p = state.projects.find(x => x.id === pid);
            if (p) {
                updateErpBudget(pid, limit, p.spent || 0);
            }
            w.hideUpdateBudgetModal();
        }
    };

    w.showAddExpenseModal = () => {
        const modal = document.getElementById('add-expense-modal');
        if (modal) modal.classList.remove('hidden');
    };

    w.hideAddExpenseModal = () => {
        const modal = document.getElementById('add-expense-modal');
        if (modal) modal.classList.add('hidden');
    };

    w.cycleExpenseStatus = (rowId: string, pid: string, currentStatus: string) => {
        let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
        if (!budgetTable) {
            budgetTable = state.tables.find(t => t.id === 'tbl-budget');
        }
        if (budgetTable) {
            const row = budgetTable.rows.find(r => r.id === rowId);
            if (row) {
                let nextStatus = 'pending';
                if (currentStatus === 'pending') nextStatus = 'approved';
                else if (currentStatus === 'approved') nextStatus = 'flagged';
                row.cells['f-status'] = nextStatus;
                notifyStateChange();
            }
        }
    };

    w.deleteExpenseRow = (rowId: string, pid: string) => {
        let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
        if (!budgetTable) {
            budgetTable = state.tables.find(t => t.id === 'tbl-budget');
        }
        if (budgetTable && confirm("Are you sure you want to delete this expense record?")) {
            const rowIdx = budgetTable.rows.findIndex(r => r.id === rowId);
            if (rowIdx > -1) {
                budgetTable.rows.splice(rowIdx, 1);
                
                const sum = budgetTable.rows.reduce((acc, r) => {
                    const val = parseFloat(r.cells['f-amount']);
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);

                const p = state.projects.find(x => x.id === pid);
                if (p) {
                    updateErpBudget(pid, p.budgetLimit || 0, sum);
                } else {
                    notifyStateChange();
                }
            }
        }
    };

    w.submitExpenseForm = (pid: string) => {
        const descEl = document.getElementById('modal-expense-desc') as HTMLInputElement;
        const catEl = document.getElementById('modal-expense-cat') as HTMLSelectElement;
        const amountEl = document.getElementById('modal-expense-amount') as HTMLInputElement;
        const dateEl = document.getElementById('modal-expense-date') as HTMLInputElement;
        const teamEl = document.getElementById('modal-expense-team') as HTMLSelectElement;
        const assigneeEl = document.getElementById('modal-expense-assignee') as HTMLSelectElement;

        if (descEl && catEl && amountEl && dateEl && teamEl && assigneeEl) {
            const desc = descEl.value.trim();
            const cat = catEl.value;
            const amount = parseFloat(amountEl.value) || 0;
            const date = dateEl.value;
            const team = teamEl.value;
            const assignee = assigneeEl.value;

            if (!desc || amount <= 0) {
                alert("Description and a positive cost amount are required.");
                return;
            }

            // Find or create budget table for this project
            let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
            if (!budgetTable) {
                budgetTable = state.tables.find(t => t.id === 'tbl-budget');
            }

            if (budgetTable) {
                // Add row to budget table
                const cells: Record<string, any> = {
                    'f-desc': desc,
                    'f-category': cat,
                    'f-amount': amount,
                    'f-date': date,
                    'f-team': team,
                    'f-assignee': assignee,
                    'f-status': 'pending'
                };
                addDbRow(budgetTable.id, cells);

                // Re-calculate spent
                const sum = budgetTable.rows.reduce((acc, row) => {
                    const val = parseFloat(row.cells['f-amount']);
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
                
                const p = state.projects.find(x => x.id === pid);
                if (p) {
                    updateErpBudget(pid, p.budgetLimit || 0, sum);
                }
            } else {
                const p = state.projects.find(x => x.id === pid);
                if (p) {
                    updateErpBudget(pid, p.budgetLimit || 0, (p.spent || 0) + amount);
                }
                notifyStateChange();
            }

            w.hideAddExpenseModal();

            descEl.value = "";
            amountEl.value = "";
        }
    };

    // Creator P2P Actions
    w.submitFreelancerRequisition = (pid: string) => {
        const vendorEl = document.getElementById('p2p-vendor') as HTMLInputElement;
        const descEl = document.getElementById('p2p-desc') as HTMLInputElement;
        const amountEl = document.getElementById('p2p-amount') as HTMLInputElement;
        if (vendorEl && descEl && amountEl) {
            const vendor = vendorEl.value.trim();
            const desc = descEl.value.trim();
            const amount = parseFloat(amountEl.value) || 0;
            if (!vendor || !desc || amount <= 0) {
                alert("Please enter a valid freelancer name, description and positive amount.");
                return;
            }
            createP2PTransaction(pid, vendor, desc, amount);
            vendorEl.value = "";
            descEl.value = "";
            amountEl.value = "";
        }
    };

    w.approveP2PRequisition = (p2pId: string) => {
        approveP2PRequisition(p2pId);
        alert("Contract PO approved and issued to Freelancer!");
    };

    w.deliverP2PGoods = (p2pId: string) => {
        deliverP2PGoods(p2pId);
        alert("Deliverable rough cut / asset uploaded by freelancer!");
    };

    w.receiveP2PInvoicePrompt = (p2pId: string) => {
        const amt = prompt("Enter Freelancer Invoice Billed Amount ($):");
        if (amt === null) return;
        const parsedAmt = parseFloat(amt) || 0;
        if (parsedAmt <= 0) {
            alert("Please enter a valid positive billing amount.");
            return;
        }
        receiveP2PInvoice(p2pId, parsedAmt);
        alert("Freelancer Invoice registered in billing queue.");
    };

    w.run3WayMatch = (p2pId: string) => {
        run3WayMatch(p2pId);
    };

    w.payP2PInvoice = (p2pId: string) => {
        payP2PInvoice(p2pId);
    };

    // Inventory Actions
    w.replenishInventory = (itemId: string) => {
        const item = state.inventoryItems.find(i => i.id === itemId);
        if (item) {
            const qty = item.safetyStock * 2 - item.qty;
            replenishInventory(itemId, qty);
        }
    };

    w.adjustInventoryPrompt = (itemId: string, currentQty: number) => {
        const count = prompt("Enter actual physical/SaaS seat count audit:", currentQty.toString());
        if (count === null) return;
        const parsedCount = parseInt(count);
        if (isNaN(parsedCount) || parsedCount < 0) {
            alert("Please enter a valid positive count.");
            return;
        }
        adjustInventoryCount(itemId, parsedCount);
        alert("Physical Inventory Cycle Count logged successfully.");
    };

    // Financial Closeout Actions
    w.triggerFinancialClose = (pid: string) => {
        const monthEl = document.getElementById('closeout-month') as HTMLSelectElement;
        if (monthEl) {
            closeFinancialMonth(pid, monthEl.value);
        }
    };
}
