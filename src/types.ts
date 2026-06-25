export interface TaskComment {
    id: string;
    author: string;
    text: string;
    timestamp: number;
}

export interface KanbanTask {
    id: string;
    projectId: string;
    title: string;
    tag: string;
    status: 'backlog' | 'progress' | 'review' | 'done';
    created: number;
    updated: number;
    isArchived?: boolean;
    isBinned?: boolean;
    complexity?: 'low' | 'medium' | 'high' | 'critical';
    assignee?: string;
    description?: string;
    dueDate?: string;
    checklist?: string;
    priority?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
    points?: number;
    cycleId?: string;
    moduleId?: string;
    collaborators?: string[];
    reviewers?: string[];
    externalLinks?: string[];
    comments?: TaskComment[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'completed';
    lastActive: number;
    isArchived?: boolean;
    isBinned?: boolean;
    isStarred?: boolean;
    budgetLimit?: number;
    spent?: number;
}

export interface Idea {
    id: string;
    projectId: string;
    content: string;
    color: string;
}

export interface TaskLog {
    id: string;
    projectId: string;
    taskId: string;
    taskTitle: string;
    fromStatus: string;
    toStatus: string;
    timestamp: number;
}

export interface ResearchDoc {
    id: string;
    projectId: string;
    title: string;
    content: string;
    type: 'pdf' | 'url' | 'text';
    created: number;
}

export interface MediaAsset {
    id: string;
    projectId: string;
    title: string;
    url: string;
    category: 'banner' | 'social' | 'ad';
    created: number;
}

export interface Draft {
    id: string;
    projectId: string;
    title: string;
    content: string;
    format: 'blog' | 'tweet' | 'email';
    created: number;
    updated: number;
    cmsStatus?: 'draft' | 'review' | 'approved' | 'published';
    seoKeywords?: string;
    collaborators?: string;
}

export interface Connection {
    id: string;
    name: string;
    icon: string;
    connected: boolean;
    apiKey?: string;
    username?: string;
}

export interface PublishSchedule {
    id: string;
    projectId: string;
    draftId: string;
    title: string;
    format: string;
    channels: string[];
    scheduledTime: number;
    status: 'queued' | 'published';
}

export interface Contact {
    id: string;
    projectId: string;
    name: string;
    email: string;
    company: string;
    dealStage: 'lead' | 'connected' | 'discussion' | 'active';
    dealValue: number;
    created: number;
    updated?: number;
    isArchived?: boolean;
    isBinned?: boolean;
    statusTag?: 'cold' | 'warm' | 'hot' | 'new';
    history?: { action: string; timestamp: number }[];
}

export type SystemRole = 'super_admin' | 'tenant_owner' | 'tenant_admin' | 'org_admin' | 'user' | 'external_client';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    systemRole?: SystemRole;
    status: 'active' | 'meeting' | 'offline' | 'vacation';
    avatarColor: string;
    customRoleIds?: string[]; // Array of role IDs for RBAC
}

export interface CustomRole {
    id: string;
    tenantId: string;
    orgId?: string;
    name: string;
    description: string;
    permissions: string[]; // e.g. ['read:tenants', 'write:users', 'manage:billing']
}

export interface Policy {
    id: string;
    tenantId: string | 'global';
    name: string;
    description: string;
    type: 'security' | 'access' | 'compliance' | 'billing';
    enforced: boolean;
}

export interface Ticket {
    id: string;
    projectId: string;
    clientId: string;
    title: string;
    description: string;
    status: 'open' | 'in-progress' | 'waiting' | 'resolved';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    created: number;
    updated: number;
}

export interface ClientFeedback {
    id: string;
    projectId: string;
    clientId: string;
    content: string;
    assetId?: string;
    status: 'pending' | 'addressed';
    created: number;
}

export interface Cycle {
    id: string;
    projectId: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed' | 'upcoming';
}

export interface Module {
    id: string;
    projectId: string;
    name: string;
    description: string;
    status: 'backlog' | 'in-progress' | 'done';
}

export interface DbField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select';
    options?: string[];
}

export interface DbRow {
    id: string;
    cells: Record<string, any>;
}

export interface DbTable {
    id: string;
    projectId: string;
    name: string;
    description: string;
    fields: DbField[];
    rows: DbRow[];
}

export interface Goal {
    id: string;
    projectId: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    dueDate: string;
    status: 'on-track' | 'behind' | 'achieved';
}

export interface Tenant {
    id: string;
    name: string;
    isSuspended?: boolean;
}

export interface Organization {
    id: string;
    tenantId: string;
    name: string;
}

export interface Team {
    id: string;
    orgId: string;
    name: string;
    memberIds: string[];
    projectIds: string[];
    isArchived?: boolean;
}

export interface ActivityLog {
    id: string;
    projectId?: string;
    teamId?: string;
    action: string;
    details: string;
    timestamp: number;
    kpiMetric?: 'task_completed' | 'deal_won' | 'budget_spent' | 'team_created' | 'post_published';
}

export interface SalesInvoice {
    id: string;
    projectId: string;
    contactId: string;
    clientName: string;
    dealValue: number;
    quoteStatus: 'draft' | 'approved';
    orderStatus: 'draft' | 'confirmed';
    invoiceStatus: 'unpaid' | 'paid';
    created: number;
}

export interface P2PTransaction {
    id: string;
    projectId: string;
    vendorName: string;
    poDescription: string;
    poAmount: number;
    requisitionStatus: 'pending' | 'approved' | 'rejected';
    poStatus: 'draft' | 'issued';
    receiptStatus: 'pending' | 'received';
    invoiceStatus: 'pending' | 'received';
    invoiceAmount: number;
    matchStatus: 'unchecked' | 'matched' | 'mismatched';
    paymentStatus: 'unpaid' | 'paid';
    created: number;
}

export interface InventoryItem {
    id: string;
    projectId: string;
    name: string;
    type: 'gear' | 'license' | 'api';
    qty: number;
    safetyStock: number;
    unitPrice: number;
    preferredSupplier: string;
    lastChecked: number;
}

export interface SupportCase {
    id: string;
    projectId: string;
    contactId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    status: 'new' | 'working' | 'escalated' | 'resolved';
    slaDeadline: number;
    comments: { author: string; text: string; timestamp: number }[];
    created: number;
}

export interface EmployeeRecord {
    id: string;
    name: string;
    role: string;
    salary: number;
    taxRate: number;
    paymentStatus: 'unpaid' | 'paid';
    onboardingTasks: { task: string; completed: boolean }[];
    joinedDate: string;
}

export interface CandidateRecord {
    id: string;
    name: string;
    role: string;
    email: string;
    status: 'applied' | 'interviewing' | 'offered' | 'hired' | 'rejected';
}

export interface TimeLog {
    id: string;
    projectId?: string;
    taskId?: string;
    taskTitle: string;
    projectName: string;
    durationMs: number;
    timestamp: number;
    billable: boolean;
}



