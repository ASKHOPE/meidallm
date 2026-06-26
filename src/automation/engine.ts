import type { KanbanTask } from "../types";

export interface AutomationRule {
    id: string;
    tenantId: string;
    name: string;
    trigger: {
        type: 'status_changed' | 'priority_changed' | 'due_date_passed' | 'task_created';
        value?: string;
    };
    condition?: {
        field: string;
        operator: 'equals' | 'contains' | 'greater_than';
        value: any;
    };
    action: {
        type: 'change_status' | 'change_priority' | 'assign_to' | 'create_subtask' | 'post_comment';
        value: string;
    };
    enabled: boolean;
}

const DEFAULT_RULES: AutomationRule[] = [
    {
        id: 'rule-1',
        tenantId: 't-meidallm',
        name: 'Auto-Assign Completed Tasks to Reviewer',
        trigger: { type: 'status_changed', value: 'review' },
        action: { type: 'assign_to', value: 'Sarah (Editorial)' },
        enabled: true
    },
    {
        id: 'rule-2',
        tenantId: 't-meidallm',
        name: 'Set High Priority when Status is In-Progress',
        trigger: { type: 'status_changed', value: 'progress' },
        action: { type: 'change_priority', value: 'high' },
        enabled: true
    },
    {
        id: 'rule-3',
        tenantId: 't-meidallm',
        name: 'Add Welcome Comment on New Tasks',
        trigger: { type: 'task_created' },
        action: { type: 'post_comment', value: 'System: Task initialized. Please review checklist and subtasks.' },
        enabled: true
    }
];

export function getRules(): AutomationRule[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem('meidallm_automation_rules');
        if (!stored) {
            localStorage.setItem('meidallm_automation_rules', JSON.stringify(DEFAULT_RULES));
            return DEFAULT_RULES;
        }
        return JSON.parse(stored);
    } catch {
        return DEFAULT_RULES;
    }
}

export function saveRules(rules: AutomationRule[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('meidallm_automation_rules', JSON.stringify(rules));
    } catch {}
}

const executionStack = new Set<string>();

export function triggerAutomations(
    triggerType: 'status_changed' | 'priority_changed' | 'due_date_passed' | 'task_created',
    task: KanbanTask,
    activeTenantId: string,
    extra?: { oldValue?: string; newValue?: string }
): void {
    const stackKey = `${task.id}-${triggerType}`;
    if (executionStack.has(stackKey)) return;
    
    executionStack.add(stackKey);
    
    try {
        const rules = getRules().filter(r => r.enabled && r.tenantId === activeTenantId);
        
        for (const rule of rules) {
            if (rule.trigger.type !== triggerType) continue;
            
            // Validate status/priority trigger values
            if (triggerType === 'status_changed' && rule.trigger.value && extra?.newValue !== rule.trigger.value) {
                continue;
            }
            if (triggerType === 'priority_changed' && rule.trigger.value && extra?.newValue !== rule.trigger.value) {
                continue;
            }
            
            // Conditions
            if (rule.condition) {
                const val = (task as any)[rule.condition.field];
                if (rule.condition.operator === 'equals' && val !== rule.condition.value) continue;
                if (rule.condition.operator === 'contains' && !String(val).includes(rule.condition.value)) continue;
            }
            
            // Execute Action
            switch (rule.action.type) {
                case 'change_status': {
                    task.status = rule.action.value as KanbanTask['status'];
                    break;
                }
                case 'change_priority': {
                    task.priority = rule.action.value as KanbanTask['priority'];
                    break;
                }
                case 'assign_to': {
                    task.assignee = rule.action.value;
                    break;
                }
                case 'post_comment': {
                    if (!task.comments) task.comments = [];
                    const commentExists = task.comments.some(c => c.text === rule.action.value);
                    if (!commentExists) {
                        task.comments.push({
                            id: 'comment-' + Math.random().toString(36).substr(2, 9),
                            author: 'Automation System',
                            text: rule.action.value,
                            timestamp: Date.now()
                        });
                    }
                    break;
                }
                case 'create_subtask': {
                    if (!task.subtasks) task.subtasks = [];
                    const subExists = task.subtasks.some(s => s.title === rule.action.value);
                    if (!subExists) {
                        task.subtasks.push({
                            id: 'sub-' + Math.random().toString(36).substr(2, 9),
                            projectId: task.projectId,
                            title: rule.action.value,
                            tag: task.tag,
                            status: 'backlog',
                            created: Date.now(),
                            updated: Date.now()
                        });
                    }
                    break;
                }
            }
        }
    } finally {
        executionStack.delete(stackKey);
    }
}
