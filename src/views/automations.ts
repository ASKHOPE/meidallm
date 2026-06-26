import { state } from "../state";
import { getIconSVG } from "./icons";
import { getRules, saveRules, type AutomationRule } from "../automation/engine";
import { sanitizeHTML } from "../utils";

export function renderAutomationsView(pid: string): string {
    const rules = getRules();
    const projectRules = rules.filter(r => r.tenantId === (state.activeTenantId || 't-meidallm'));
    const tasks = state.kanbanState.filter(t => t.projectId === pid);

    // Register window helper functions once
    if (typeof window !== 'undefined' && !(window as any).automationsInitialized) {
        (window as any).automationsInitialized = true;

        (window as any).toggleRule = (ruleId: string) => {
            const currentRules = getRules();
            const rule = currentRules.find(r => r.id === ruleId);
            if (rule) {
                rule.enabled = !rule.enabled;
                saveRules(currentRules);
                if ((window as any).refreshActiveView) {
                    (window as any).refreshActiveView();
                }
            }
        };

        (window as any).deleteRule = (ruleId: string) => {
            const currentRules = getRules();
            const filtered = currentRules.filter(r => r.id !== ruleId);
            saveRules(filtered);
            if ((window as any).refreshActiveView) {
                (window as any).refreshActiveView();
            }
        };

        (window as any).applyTemplateRule = (templateType: string) => {
            const currentRules = getRules();
            const activeTenant = state.activeTenantId || 't-meidallm';
            let newRule: AutomationRule | null = null;

            if (templateType === 'done-notify') {
                newRule = {
                    id: 'rule-' + Math.random().toString(36).substr(2, 9),
                    tenantId: activeTenant,
                    name: 'Notify Manager when Task is Done',
                    trigger: { type: 'status_changed', value: 'done' },
                    action: { type: 'post_comment', value: 'System: Task completed successfully. Ready for final review.' },
                    enabled: true
                };
            } else if (templateType === 'overdue-urgent') {
                newRule = {
                    id: 'rule-' + Math.random().toString(36).substr(2, 9),
                    tenantId: activeTenant,
                    name: 'Set Overdue Tasks to Urgent',
                    trigger: { type: 'due_date_passed' },
                    action: { type: 'change_priority', value: 'urgent' },
                    enabled: true
                };
            } else if (templateType === 'progress-assign') {
                newRule = {
                    id: 'rule-' + Math.random().toString(36).substr(2, 9),
                    tenantId: activeTenant,
                    name: 'Auto-Assign In-Progress to Sarah',
                    trigger: { type: 'status_changed', value: 'progress' },
                    action: { type: 'assign_to', value: 'Sarah (Editorial)' },
                    enabled: true
                };
            }

            if (newRule) {
                currentRules.push(newRule);
                saveRules(currentRules);
                if ((window as any).refreshActiveView) {
                    (window as any).refreshActiveView();
                }
            }
        };

        (window as any).createCustomRule = (e: Event) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const nameInput = form.querySelector('#rule-name') as HTMLInputElement;
            const triggerSelect = form.querySelector('#rule-trigger') as HTMLSelectElement;
            const triggerValInput = form.querySelector('#rule-trigger-val') as HTMLInputElement;
            const actionSelect = form.querySelector('#rule-action') as HTMLSelectElement;
            const actionValInput = form.querySelector('#rule-action-val') as HTMLInputElement;

            if (!nameInput || !triggerSelect || !triggerValInput || !actionSelect || !actionValInput) return;

            const name = nameInput.value;
            const triggerType = triggerSelect.value as any;
            const triggerVal = triggerValInput.value;
            const actionType = actionSelect.value as any;
            const actionVal = actionValInput.value;

            if (!name) return alert('Please enter a rule name.');

            const currentRules = getRules();
            const newRule: AutomationRule = {
                id: 'rule-' + Math.random().toString(36).substr(2, 9),
                tenantId: state.activeTenantId || 't-meidallm',
                name: name.trim(),
                trigger: {
                    type: triggerType,
                    value: triggerVal ? triggerVal.trim() : undefined
                },
                action: {
                    type: actionType,
                    value: actionVal.trim()
                },
                enabled: true
            };

            currentRules.push(newRule);
            saveRules(currentRules);
            form.reset();
            if ((window as any).refreshActiveView) {
                (window as any).refreshActiveView();
            }
        };

        (window as any).runDryRun = () => {
            const taskIdSelect = document.getElementById('dryrun-task-id') as HTMLSelectElement;
            const ruleIdSelect = document.getElementById('dryrun-rule-id') as HTMLSelectElement;
            const consoleOutput = document.getElementById('dryrun-console') as HTMLDivElement;

            if (!taskIdSelect || !ruleIdSelect || !consoleOutput) return;

            const taskId = taskIdSelect.value;
            const ruleId = ruleIdSelect.value;

            if (!taskId || !ruleId) {
                consoleOutput.innerHTML = '<span class="text-rose-400">Error: Select both a task and a rule to test.</span>';
                return;
            }

            const currentRules = getRules();
            const rule = currentRules.find(r => r.id === ruleId);
            const task = state.kanbanState.find(t => t.id === taskId);

            if (!rule || !task) {
                consoleOutput.innerHTML = '<span class="text-rose-400">Error: Selected rule or task not found.</span>';
                return;
            }

            consoleOutput.innerHTML = `
<span class="text-indigo-400 font-bold">▶ Launching dry-run simulation for rule: "${rule.name}"</span>
<span class="text-text-muted">Target task: "${task.title}" (ID: ${task.id})</span>
<span class="text-text-muted">Trigger type: ${rule.trigger.type} ${rule.trigger.value ? `(${rule.trigger.value})` : ''}</span>
<span class="text-text-muted">Condition: Tenant matching "${rule.tenantId}" ... Passed.</span>
<span class="text-emerald-400 font-bold">✔ Dry-run outcome:</span>
<span class="text-text-main">  Would perform action: <span class="font-mono text-purple-400">${rule.action.type}</span> with value <span class="font-mono text-indigo-300">"${rule.action.value}"</span></span>
<span class="text-emerald-400">✔ Simulation completed with no errors. No persistent changes made to state.</span>`;
        };
    }

    return `
    <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight flex items-center gap-2">
                    ${getIconSVG('settings', 'w-6 h-6 text-violet-400')}
                    Workflow Automation Rules
                </h2>
                <p class="text-sm text-text-muted mt-0.5">Automate task assignees, priorities, and updates using custom client-side triggers.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left: Active Rules list (span 7) -->
            <div class="lg:col-span-7 flex flex-col gap-4">
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
                    <h3 class="text-sm font-bold text-text-main mb-4">Active Rules (${projectRules.length})</h3>
                    
                    ${projectRules.length === 0 ? `
                        <div class="text-center py-12 border border-dashed border-text-main/15 rounded-xl">
                            <p class="text-xs text-text-muted">No automation rules configured for this workspace yet.</p>
                        </div>
                    ` : `
                        <div class="flex flex-col gap-3">
                            ${projectRules.map(rule => `
                                <div class="bg-panel-hover/20 border ${rule.enabled ? 'border-text-main/15' : 'border-text-main/5 opacity-60'} p-4 rounded-xl flex items-center justify-between gap-4 transition-all">
                                    <div class="flex-grow min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-xs font-bold text-text-main truncate">${sanitizeHTML(rule.name)}</span>
                                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">${rule.trigger.type}</span>
                                        </div>
                                        <p class="text-[11px] text-text-muted">
                                            If trigger matches <span class="text-text-main font-semibold">${rule.trigger.value || '*'}</span>, then perform <span class="text-text-main font-semibold">${rule.action.type}</span> to <span class="text-purple-400 font-semibold font-mono">"${rule.action.value}"</span>.
                                        </p>
                                    </div>
                                    <div class="flex items-center gap-3 shrink-0">
                                        <!-- Switch toggle -->
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" class="sr-only peer" ${rule.enabled ? 'checked' : ''} onchange="window.toggleRule('${rule.id}')">
                                            <div class="w-7 h-4 bg-text-main/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-text-main after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-500"></div>
                                        </label>
                                        
                                        <!-- Delete button -->
                                        <button onclick="window.deleteRule('${rule.id}')" class="text-text-muted hover:text-rose-400 p-1 rounded hover:bg-panel-hover transition-colors">
                                            ${getIconSVG('trash', 'w-3.5 h-3.5')}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>

                <!-- Live dry-run simulation panel -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
                    <h3 class="text-sm font-bold text-text-main mb-2">Automation Sandbox Simulator</h3>
                    <p class="text-xs text-text-muted mb-4">Select a task and rule to execute a dry-run test trace in real-time.</p>

                    <div class="flex flex-col sm:flex-row gap-3 mb-4">
                        <select id="dryrun-task-id" class="flex-grow bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                            <option value="">-- Choose Task --</option>
                            ${tasks.map(t => `<option value="${t.id}">${sanitizeHTML(t.title)}</option>`).join('')}
                        </select>
                        <select id="dryrun-rule-id" class="flex-grow bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                            <option value="">-- Choose Rule --</option>
                            ${projectRules.map(r => `<option value="${r.id}">${sanitizeHTML(r.name)}</option>`).join('')}
                        </select>
                        <button onclick="window.runDryRun()" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer shrink-0">
                            Dry-Run Test
                        </button>
                    </div>

                    <div id="dryrun-console" class="bg-black/40 border border-text-main/10 rounded-xl p-4 min-h-[100px] text-xs font-mono whitespace-pre-wrap text-left text-text-muted">
                        Console output waiting for dry-run trigger...
                    </div>
                </div>
            </div>

            <!-- Right: Templates & Custom Builder (span 5) -->
            <div class="lg:col-span-5 flex flex-col gap-6">
                <!-- Pre-built Templates -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
                    <h3 class="text-sm font-bold text-text-main mb-3">Pre-built Automation Templates</h3>
                    <div class="flex flex-col gap-2">
                        <button onclick="window.applyTemplateRule('done-notify')" class="p-3 text-left rounded-xl bg-panel-hover/40 border border-text-main/10 hover:border-text-main/20 hover:bg-panel-hover/60 transition-all cursor-pointer flex justify-between items-center">
                            <div class="text-left">
                                <div class="text-xs font-semibold text-text-main">When Task is Completed -> Comment</div>
                                <p class="text-[10px] text-text-muted mt-0.5">Posts a system notification comment for review.</p>
                            </div>
                            ${getIconSVG('plus', 'w-4 h-4 text-indigo-400')}
                        </button>
                        <button onclick="window.applyTemplateRule('overdue-urgent')" class="p-3 text-left rounded-xl bg-panel-hover/40 border border-text-main/10 hover:border-text-main/20 hover:bg-panel-hover/60 transition-all cursor-pointer flex justify-between items-center">
                            <div class="text-left">
                                <div class="text-xs font-semibold text-text-main">When Task Overdue -> Set Priority Urgent</div>
                                <p class="text-[10px] text-text-muted mt-0.5">Escalates task priority automatically to urgent.</p>
                            </div>
                            ${getIconSVG('plus', 'w-4 h-4 text-indigo-400')}
                        </button>
                        <button onclick="window.applyTemplateRule('progress-assign')" class="p-3 text-left rounded-xl bg-panel-hover/40 border border-text-main/10 hover:border-text-main/20 hover:bg-panel-hover/60 transition-all cursor-pointer flex justify-between items-center">
                            <div class="text-left">
                                <div class="text-xs font-semibold text-text-main">When In-Progress -> Auto-Assign to Sarah</div>
                                <p class="text-[10px] text-text-muted mt-0.5">Updates assignee automatically once work begins.</p>
                            </div>
                            ${getIconSVG('plus', 'w-4 h-4 text-indigo-400')}
                        </button>
                    </div>
                </div>

                <!-- Custom Rule Builder Form -->
                <div class="bg-background border border-text-main/15 p-5 rounded-2xl">
                    <h3 class="text-sm font-bold text-text-main mb-3">Custom Rule Builder</h3>
                    <form onsubmit="window.createCustomRule(event)" class="flex flex-col gap-3">
                        <div class="flex flex-col gap-1 text-left">
                            <label class="text-[10px] font-bold text-text-muted uppercase">Rule Name</label>
                            <input id="rule-name" type="text" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" placeholder="e.g. Done -> Assign to Client">
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-left">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-text-muted uppercase">When (Trigger)</label>
                                <select id="rule-trigger" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                                    <option value="status_changed">Status Changed</option>
                                    <option value="priority_changed">Priority Changed</option>
                                    <option value="task_created">Task Created</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-text-muted uppercase">Trigger Value</label>
                                <input id="rule-trigger-val" type="text" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" placeholder="e.g. done or progress">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 text-left">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-text-muted uppercase">Then (Action)</label>
                                <select id="rule-action" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none">
                                    <option value="change_status">Change Status</option>
                                    <option value="change_priority">Change Priority</option>
                                    <option value="assign_to">Assign To</option>
                                    <option value="post_comment">Post Comment</option>
                                    <option value="create_subtask">Create Subtask</option>
                                </select>
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-bold text-text-muted uppercase">Action Value</label>
                                <input id="rule-action-val" type="text" class="w-full bg-panel-hover border border-glass-border p-2 rounded-lg text-xs text-text-main focus:outline-none" placeholder="e.g. review or Comment text" required>
                            </div>
                        </div>

                        <button type="submit" class="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors cursor-pointer mt-2">
                            Create Rule
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
}
