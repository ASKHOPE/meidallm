import { state, updateErpBudget, addDbRow, notifyStateChange } from "../state";
import { sanitizeHTML } from "../utils";

// Custom override for alert to use premium toast notifications
const alert = (msg: string) => {
    if (typeof window !== 'undefined' && (window as any).showToast) {
        const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('copied') || msg.toLowerCase().includes('converted') || msg.toLowerCase().includes('saved');
        (window as any).showToast(msg, isSuccess ? 'success' : 'info');
    } else {
        window.alert(msg);
    }
};

export function renderERPView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    state.currentProject = p.id;

    // Find or create budget table for this project
    let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
    if (!budgetTable) {
        // Fallback to any table with budget in name, or just use the first budget table if available
        budgetTable = state.tables.find(t => t.id === 'tbl-budget');
    }

    const budgetLimit = p.budgetLimit || 0;
    
    // Dynamically calculate spent amount from the database table rows if possible
    let spent = p.spent || 0;
    if (budgetTable) {
        const amountField = budgetTable.fields.find(f => f.name.toLowerCase().includes('amount') || f.id === 'f-amount');
        if (amountField) {
            const sum = budgetTable.rows.reduce((acc, row) => {
                const val = parseFloat(row.cells[amountField.id]);
                return acc + (isNaN(val) ? 0 : val);
            }, 0);
            if (sum > 0) {
                spent = sum;
                p.spent = spent; // Sync state
            }
        }
    }

    const percent = budgetLimit > 0 ? Math.min(100, Math.round((spent / budgetLimit) * 100)) : 0;
    
    // Calculate Resource Allocation
    // Map team members to their total points and task counts from kanbanState
    const projectTasks = state.kanbanState.filter(t => t.projectId === pid && !t.isArchived && !t.isBinned);
    const teamLoad = state.team.map(member => {
        const tasks = projectTasks.filter(t => t.assignee === member.id || t.assignee === member.name);
        const points = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
        const hours = points * 2.5; // Estimate 2.5 hours per complexity point
        return {
            ...member,
            taskCount: tasks.length,
            points,
            hours
        };
    });

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <!-- ERP Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background border border-text-main/20 p-5 rounded-2xl">
            <div>
                <h2 class="text-2xl font-outfit font-bold">${sanitizeHTML(p.name)} ERP Hub</h2>
                <p class="text-xs text-text-muted">Control project budgeting, log invoices/expenses, and view live team resource workload meters.</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
                <button onclick="window.showUpdateBudgetModal()" class="px-3.5 py-2 border border-text-main/20 hover:border-text-main font-bold text-xs rounded-xl transition-all cursor-pointer">Adjust Budget</button>
                <button onclick="window.showAddExpenseModal()" class="px-4 py-2 bg-text-main text-background hover:bg-text-main/80 font-bold text-xs rounded-xl transition-all cursor-pointer">+ Add Expense</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left 2 Columns: Budget & Expenses -->
            <div class="lg:col-span-2 flex flex-col gap-6">
                <!-- Budget Card -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm">Campaign Spend Index</h3>
                    
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Total Limit</span>
                            <span class="text-xl font-bold font-mono">$${budgetLimit.toLocaleString()}</span>
                        </div>
                        <div class="bg-background border border-text-main/10 p-4 rounded-xl">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Total Spent</span>
                            <span class="text-xl font-bold font-mono">$${spent.toLocaleString()}</span>
                        </div>
                        <div class="bg-background border border-text-main/10 p-4 rounded-xl col-span-2 md:col-span-1">
                            <span class="text-[10px] text-text-muted font-bold block uppercase mb-1">Remaining</span>
                            <span class="text-xl font-bold font-mono ${(budgetLimit - spent) < 0 ? 'text-red-500' : 'text-text-main'}">$${(budgetLimit - spent).toLocaleString()}</span>
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
                        ${percent >= 90 ? `<p class="text-[10px] text-red-500 font-bold mt-1">⚠️ Warning: Campaign has spent over 90% of its budget limit.</p>` : ''}
                    </div>
                </div>

                <!-- Expense Sheet -->
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <h3 class="font-bold text-sm">Logged Invoices & Operating Spend</h3>
                        <span class="text-[10px] text-text-muted font-mono">Synced with Databases</span>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="border-b border-text-main/20 text-text-muted">
                                    <th class="py-2.5 font-bold">Description</th>
                                    <th class="py-2.5 font-bold">Category</th>
                                    <th class="py-2.5 font-bold">Date</th>
                                    <th class="py-2.5 font-bold text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${budgetTable && budgetTable.rows.length > 0 ? budgetTable.rows.map(row => {
                                    const desc = row.cells['f-desc'] || 'Expense';
                                    const cat = row.cells['f-category'] || 'General';
                                    const date = row.cells['f-date'] || '-';
                                    const amount = parseFloat(row.cells['f-amount']) || 0;
                                    return `
                                    <tr class="border-b border-text-main/10 hover:bg-text-main/5 transition-colors">
                                        <td class="py-3 font-semibold">${sanitizeHTML(desc)}</td>
                                        <td class="py-3"><span class="px-2 py-0.5 border border-text-main/20 rounded text-[9px] font-medium">${sanitizeHTML(cat)}</span></td>
                                        <td class="py-3 font-mono text-[11px]">${sanitizeHTML(date)}</td>
                                        <td class="py-3 text-right font-bold font-mono">$${amount.toLocaleString()}</td>
                                    </tr>
                                    `;
                                }).join('') : `
                                <tr>
                                    <td colspan="4" class="text-center py-8 text-text-muted text-xs">No logged expenses found. Click "+ Add Expense" to begin.</td>
                                </tr>
                                `}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right Column: Resource Meters -->
            <div class="flex flex-col gap-6">
                <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4">
                    <h3 class="font-bold text-sm">Team Load & Allocation</h3>
                    <p class="text-[11px] text-text-muted">Estimated work burden based on total complexity points assigned on Kanban boards.</p>
                    
                    <div class="flex flex-col gap-5 mt-2">
                        ${teamLoad.map(member => {
                            const maxPoints = 25; // 25 points acts as nominal full load threshold
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
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Category</label>
                <select id="modal-expense-cat" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
                    <option value="Sponsor Costs">Sponsor Costs</option>
                    <option value="Paid Ads">Paid Ads</option>
                    <option value="Tooling & APIs">Tooling & APIs</option>
                    <option value="Contractors">Contractors</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Cost Amount ($)</label>
                <input id="modal-expense-amount" type="number" placeholder="e.g. 1500" class="w-full bg-background border border-text-main/20 focus:border-text-main p-3 rounded-xl text-text-main text-sm focus:outline-none">
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

    w.submitExpenseForm = (pid: string) => {
        const descEl = document.getElementById('modal-expense-desc') as HTMLInputElement;
        const catEl = document.getElementById('modal-expense-cat') as HTMLSelectElement;
        const amountEl = document.getElementById('modal-expense-amount') as HTMLInputElement;
        const dateEl = document.getElementById('modal-expense-date') as HTMLInputElement;

        if (descEl && catEl && amountEl && dateEl) {
            const desc = descEl.value.trim();
            const cat = catEl.value;
            const amount = parseFloat(amountEl.value) || 0;
            const date = dateEl.value;

            if (!desc || amount <= 0) {
                alert("Description and a positive cost amount are required.");
                return;
            }

            // Find or create budget table for this project
            let budgetTable = state.tables.find(t => t.projectId === pid && t.id.includes('budget'));
            if (!budgetTable) {
                // If it doesn't exist, use tbl-budget
                budgetTable = state.tables.find(t => t.id === 'tbl-budget');
            }

            if (budgetTable) {
                // Add row to budget table
                const cells: Record<string, any> = {
                    'f-desc': desc,
                    'f-category': cat,
                    'f-amount': amount,
                    'f-date': date
                };
                addDbRow(budgetTable.id, cells);

                // Re-calculate project spent amount and update project state
                const sum = budgetTable.rows.reduce((acc, row) => {
                    const val = parseFloat(row.cells['f-amount']);
                    return acc + (isNaN(val) ? 0 : val);
                }, 0);
                
                const p = state.projects.find(x => x.id === pid);
                if (p) {
                    updateErpBudget(pid, p.budgetLimit || 0, sum);
                }
            } else {
                // Fallback direct spent update if table is missing
                const p = state.projects.find(x => x.id === pid);
                if (p) {
                    updateErpBudget(pid, p.budgetLimit || 0, (p.spent || 0) + amount);
                }
                notifyStateChange();
            }

            w.hideAddExpenseModal();

            // Clear fields
            descEl.value = "";
            amountEl.value = "";
        }
    };
}
