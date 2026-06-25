import { z } from "zod";
import type { KanbanTask, Project, Idea, TaskLog, ResearchDoc, MediaAsset, Draft, Connection, PublishSchedule, Contact, TeamMember, Cycle, Module, DbField, DbRow, DbTable, Goal, Tenant, Organization, Team, CustomRole, Policy, SalesInvoice, P2PTransaction, InventoryItem, SupportCase, EmployeeRecord, CandidateRecord, ActivityLog } from "./types";

export const GoalSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    targetValue: z.number(),
    currentValue: z.number(),
    unit: z.string(),
    dueDate: z.string(),
    status: z.enum(['on-track', 'behind', 'achieved'])
});

export const CustomRoleSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string(),
    permissions: z.array(z.string())
});

export const PolicySchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(['security', 'access', 'compliance', 'billing']),
    enforced: z.boolean()
});

// --- Zod Validation Schemas ---
export const KanbanTaskSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    tag: z.string(),
    status: z.enum(['backlog', 'progress', 'review', 'done']),
    created: z.number(),
    updated: z.number(),
    isArchived: z.boolean().optional(),
    isBinned: z.boolean().optional(),
    complexity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    assignee: z.string().optional(),
    description: z.string().optional(),
    dueDate: z.string().optional(),
    checklist: z.string().optional(),
    priority: z.enum(['none', 'low', 'medium', 'high', 'urgent']).optional(),
    points: z.number().optional(),
    cycleId: z.string().optional(),
    moduleId: z.string().optional()
});

export const ProjectSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['active', 'completed']),
    lastActive: z.number(),
    isArchived: z.boolean().optional(),
    isBinned: z.boolean().optional(),
    isStarred: z.boolean().optional(),
    budgetLimit: z.number().optional(),
    spent: z.number().optional()
});

export const IdeaSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    content: z.string(),
    color: z.string()
});

export const TaskLogSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    taskId: z.string(),
    taskTitle: z.string(),
    fromStatus: z.string(),
    toStatus: z.string(),
    timestamp: z.number()
});

export const ResearchDocSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    content: z.string(),
    type: z.enum(['pdf', 'url', 'text']),
    created: z.number()
});

export const MediaAssetSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    url: z.string(),
    category: z.enum(['banner', 'social', 'ad']),
    created: z.number()
});

export const DraftSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    content: z.string(),
    format: z.enum(['blog', 'tweet', 'email']),
    created: z.number(),
    updated: z.number(),
    cmsStatus: z.enum(['draft', 'review', 'approved', 'published']).optional(),
    seoKeywords: z.string().optional(),
    collaborators: z.string().optional()
});

export const ConnectionSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    connected: z.boolean(),
    apiKey: z.string().optional(),
    username: z.string().optional()
});

export const PublishScheduleSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    draftId: z.string(),
    title: z.string(),
    format: z.string(),
    channels: z.array(z.string()),
    scheduledTime: z.number(),
    status: z.enum(['queued', 'published'])
});

export const ContactSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    email: z.string(),
    company: z.string(),
    dealStage: z.enum(['lead', 'connected', 'discussion', 'active']),
    dealValue: z.number(),
    created: z.number(),
    updated: z.number().optional(),
    isArchived: z.boolean().optional(),
    isBinned: z.boolean().optional(),
    statusTag: z.enum(['cold', 'warm', 'hot', 'new']).optional(),
    history: z.array(z.object({
        action: z.string(),
        timestamp: z.number()
    })).optional()
});

export const TeamMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    status: z.enum(['active', 'meeting', 'offline', 'vacation']),
    avatarColor: z.string()
});

export const TenantSchema = z.object({
    id: z.string(),
    name: z.string()
});

export const OrganizationSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    name: z.string()
});

export const TeamSchema = z.object({
    id: z.string(),
    orgId: z.string(),
    name: z.string(),
    memberIds: z.array(z.string()),
    projectIds: z.array(z.string()),
    isArchived: z.boolean().optional()
});

export const ActivityLogSchema = z.object({
    id: z.string(),
    projectId: z.string().optional(),
    teamId: z.string().optional(),
    action: z.string(),
    details: z.string(),
    timestamp: z.number(),
    kpiMetric: z.enum(['task_completed', 'deal_won', 'budget_spent', 'team_created', 'post_published']).optional()
});



export const CycleSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.enum(['active', 'completed', 'upcoming'])
});

export const ModuleSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    description: z.string(),
    status: z.enum(['backlog', 'in-progress', 'done'])
});

export const DbFieldSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.enum(['text', 'number', 'date', 'select']),
    options: z.array(z.string()).optional()
});

export const DbRowSchema = z.object({
    id: z.string(),
    cells: z.record(z.string(), z.any())
});

export const DbTableSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    description: z.string(),
    fields: z.array(DbFieldSchema),
    rows: z.array(DbRowSchema)
});

export const SalesInvoiceSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    contactId: z.string(),
    clientName: z.string(),
    dealValue: z.number(),
    quoteStatus: z.enum(['draft', 'approved']),
    orderStatus: z.enum(['draft', 'confirmed']),
    invoiceStatus: z.enum(['unpaid', 'paid']),
    created: z.number()
});

export const P2PTransactionSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    vendorName: z.string(),
    poDescription: z.string(),
    poAmount: z.number(),
    requisitionStatus: z.enum(['pending', 'approved', 'rejected']),
    poStatus: z.enum(['draft', 'issued']),
    receiptStatus: z.enum(['pending', 'received']),
    invoiceStatus: z.enum(['pending', 'received']),
    invoiceAmount: z.number(),
    matchStatus: z.enum(['unchecked', 'matched', 'mismatched']),
    paymentStatus: z.enum(['unpaid', 'paid']),
    created: z.number()
});

export const InventoryItemSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    type: z.enum(['gear', 'license', 'api']),
    qty: z.number(),
    safetyStock: z.number(),
    unitPrice: z.number(),
    preferredSupplier: z.string(),
    lastChecked: z.number()
});

export const SupportCaseSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    contactId: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['new', 'working', 'escalated', 'resolved']),
    slaDeadline: z.number(),
    comments: z.array(z.object({
        author: z.string(),
        text: z.string(),
        timestamp: z.number()
    })),
    created: z.number()
});

export const EmployeeRecordSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    salary: z.number(),
    taxRate: z.number(),
    paymentStatus: z.enum(['unpaid', 'paid']),
    onboardingTasks: z.array(z.object({
        task: z.string(),
        completed: z.boolean()
    })),
    joinedDate: z.string()
});

export const CandidateRecordSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    email: z.string(),
    status: z.enum(['applied', 'interviewing', 'offered', 'hired', 'rejected'])
});

// --- Default Initial State Fallbacks ---
const DEFAULT_KANBAN: KanbanTask[] = [
    { id: 't-welcome-1', projectId: 'p-welcome', title: 'Explore the Idea Canvas to map campaign thoughts', tag: 'Brainstorm', status: 'progress', created: Date.now(), updated: Date.now(), priority: 'medium', points: 3 },
    { id: 't-welcome-2', projectId: 'p-welcome', title: 'Configure Sprints & Cycles to assign team tasks', tag: 'Planning', status: 'backlog', created: Date.now(), updated: Date.now(), priority: 'high', points: 5 },
    { id: 't-welcome-3', projectId: 'p-welcome', title: 'Track Sponsor Deals in the CRM pipeline', tag: 'CRM', status: 'backlog', created: Date.now(), updated: Date.now(), priority: 'urgent', points: 8 },
    { id: 't-welcome-4', projectId: 'p-welcome', title: 'Monitor expenditures and workloads in ERP & Budgeting', tag: 'ERP', status: 'backlog', created: Date.now(), updated: Date.now(), priority: 'low', points: 2 },
    { id: 't1', projectId: 'p1', title: 'Setup Campaign Domain', tag: 'DevOps', status: 'backlog', created: Date.now() - 86400000*5, updated: Date.now() - 86400000*5 },
    { id: 't2', projectId: 'p1', title: 'Draft Product Messaging Docs', tag: 'Docs', status: 'progress', created: Date.now() - 172800000, updated: Date.now() - 43200000 }
];


const DEFAULT_PROJECTS: Project[] = [
    { id: 'p-welcome', name: '🚀 Welcome Tour', description: 'Interactive overview of Meidallm workflows, features, and capabilities.', status: 'active', lastActive: Date.now(), isStarred: true, budgetLimit: 100000, spent: 45000 },
    { id: 'p1', name: 'Q3 Product Launch', description: 'Major product updates campaign.', status: 'active', lastActive: Date.now(), isStarred: true, budgetLimit: 50000, spent: 15150 },
    { id: 'p2', name: 'YouTube Retainer Channel', description: 'Developer video tutorial series.', status: 'active', lastActive: Date.now() - 86400000 * 2, budgetLimit: 12000, spent: 3000 },
    { id: 'p3', name: 'Pinterest Creative Ads', description: 'Visual banner campaign creative boosts.', status: 'active', lastActive: Date.now() - 86400000 * 4, budgetLimit: 8000, spent: 400 },
    { id: 'p4', name: 'Facebook Ads A/B Campaign', description: 'Conversion and retargeting ads.', status: 'active', lastActive: Date.now() - 86400000 * 6, isStarred: true, budgetLimit: 25000, spent: 12400 },
    { id: 'p5', name: 'Threads Community Growth', description: 'Daily engagement drives and AMAs.', status: 'active', lastActive: Date.now() - 86400000 * 8, budgetLimit: 5000, spent: 250 },
    { id: 'p6', name: 'WhatsApp Customer Operations', description: 'Direct messaging and service updates.', status: 'active', lastActive: Date.now() - 86400000 * 10, budgetLimit: 6000, spent: 0 },
    { id: 'p7', name: 'X Product Hunt Launch', description: 'Tech community launch day push.', status: 'active', lastActive: Date.now() - 86400000 * 12, isStarred: true, budgetLimit: 15000, spent: 15000 },
    { id: 'p8', name: 'Content Calendar Pipeline', description: 'Long-form articles and resources.', status: 'active', lastActive: Date.now() - 86400000 * 14, budgetLimit: 10000, spent: 2150 },
    { id: 'p9', name: 'Influencer Co-branding Hub', description: 'Sponsorship collaborations and codes.', status: 'active', lastActive: Date.now() - 86400000 * 16, budgetLimit: 30000, spent: 12000 }
];

const DEFAULT_IDEAS: Idea[] = [
    { id: 'i1', projectId: 'p1', content: 'Leverage LinkedIn video tutorials', color: '#fef08a' },
    { id: 'i2', projectId: 'p1', content: 'Draft newsletter for existing users', color: '#bfdbfe' }
];

const DEFAULT_RESEARCH: ResearchDoc[] = [
    {
        id: 'r1',
        projectId: 'p1',
        title: 'Competitor Analysis - LLM Benchmarks.pdf',
        content: 'Our tests show competitor agents have 85% accuracy. Meidallm currently achieves 92% accuracy on core tool-use execution. Focus positioning around reliability, fast tool loops, and premium UX.',
        type: 'pdf',
        created: Date.now() - 86400000*3
    },
    {
        id: 'r2',
        projectId: 'p1',
        title: 'https://better-auth.com/docs/plugins/infra',
        content: 'The dash() plugin links better-auth to active database tracking. Enables real-time telemetry, admin console views, and security logging. Essential for enterprise audit trails.',
        type: 'url',
        created: Date.now() - 86400000*2
    }
];

const DEFAULT_MEDIA: MediaAsset[] = [
    {
        id: 'm1',
        projectId: 'p1',
        title: 'Launch Banner Gradient',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        category: 'banner',
        created: Date.now() - 86400000
    },
    {
        id: 'm2',
        projectId: 'p1',
        title: 'Product Mockup Social',
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
        category: 'social',
        created: Date.now() - 86400000
    }
];

const DEFAULT_DRAFTS: Draft[] = [
    {
        id: 'd1',
        projectId: 'p1',
        title: 'Launch Announcement Tweet',
        content: '🚀 Today, we are releasing the Meidallm Portal! \n\nA complete control center to monitor agent runs, configure RAG models, edit media templates, and draft copy in real-time. \n\nGet started now at meidallm.com!',
        format: 'tweet',
        created: Date.now() - 86400000,
        updated: Date.now()
    },
    {
        id: 'd2',
        projectId: 'p1',
        title: 'Beta Welcome Email',
        content: 'Subject: Welcome to the Meidallm Console!\n\nHi {{name}},\n\nThank you for signing up for the Meidallm Portal beta! You now have full access to our project pipeline manager, live brainstorming boards, and AI composer. \n\nIf you have any feedback or run into questions, simply reply to this email!\n\nBest,\nThe Meidallm Team',
        format: 'email',
        created: Date.now() - 86400000,
        updated: Date.now()
    }
];

const DEFAULT_CONNECTIONS: Connection[] = [
    { id: 'conn-x', name: 'X (Twitter)', icon: '🐦', connected: false },
    { id: 'conn-instagram', name: 'Instagram', icon: '📸', connected: false },
    { id: 'conn-facebook', name: 'Facebook', icon: '🔵', connected: false },
    { id: 'conn-youtube', name: 'YouTube', icon: '🎥', connected: false },
    { id: 'conn-whatsapp', name: 'WhatsApp', icon: '💬', connected: false },
    { id: 'conn-pinterest', name: 'Pinterest', icon: '📌', connected: false },
    { id: 'conn-threads', name: 'Threads', icon: '🌀', connected: false }
];

const DEFAULT_CONTACTS: Contact[] = [
    { id: 'c1', projectId: 'p1', name: 'Sarah Jenkins', email: 'sarah@stripe.com', company: 'Stripe', dealStage: 'connected', dealValue: 12000, created: Date.now() - 86400000 * 4, statusTag: 'warm', history: [{ action: 'Created Prospect', timestamp: Date.now() - 86400000 * 4 }] },
    { id: 'c2', projectId: 'p1', name: 'Alex Rivera', email: 'alex@vercel.com', company: 'Vercel', dealStage: 'discussion', dealValue: 25000, created: Date.now() - 86400000 * 2, statusTag: 'hot', history: [{ action: 'Created Prospect', timestamp: Date.now() - 86400000 * 2 }] },
    { id: 'c3', projectId: 'p1', name: 'Emily Chen', email: 'emily@notion.so', company: 'Notion', dealStage: 'lead', dealValue: 8000, created: Date.now() - 86400000 * 6, statusTag: 'new', history: [{ action: 'Created Prospect', timestamp: Date.now() - 86400000 * 6 }] }
];

const DEFAULT_TEAM: TeamMember[] = [
    { id: 'tm1', name: 'Hosanna (You)', email: 'hosanna@example.com', role: 'Product Architect', status: 'active', avatarColor: 'bg-indigo-500' },
    { id: 'tm2', name: 'Gavin Belson', email: 'gavin@example.com', role: 'Campaign Strategist', status: 'meeting', avatarColor: 'bg-rose-500' },
    { id: 'tm3', name: 'Richard Hendricks', email: 'richard@example.com', role: 'Lead Developer', status: 'active', avatarColor: 'bg-emerald-500' },
    { id: 'tm4', name: 'Monica Hall', email: 'monica@example.com', role: 'Agency Relations', status: 'vacation', avatarColor: 'bg-amber-500' }
];

const DEFAULT_TENANTS: Tenant[] = [
    { id: 't-meidallm', name: 'Meidallm Corp' },
    { id: 't-global', name: 'Global Agency Partners' },
    { id: 't-creative', name: 'Creative Studios LLC' },
    { id: 't-personal', name: 'Personal Workspace' }
];

const DEFAULT_ORGS: Organization[] = [
    { id: 'org-meidallm-core', tenantId: 't-meidallm', name: 'Meidallm Core Product' },
    { id: 'org-meidallm-labs', tenantId: 't-meidallm', name: 'Meidallm AI Labs' },
    { id: 'org-global-marketing', tenantId: 't-global', name: 'Global Marketing Team' },
    { id: 'org-creative-media', tenantId: 't-creative', name: 'Creative Media Production' },
    { id: 'personal', tenantId: 't-personal', name: 'My Workspace' }
];

const DEFAULT_TEAMS: Team[] = [
    { id: 'team-eng', orgId: 'org-meidallm-core', name: 'Engineering', memberIds: ['tm1', 'tm3'], projectIds: ['p1'], isArchived: false },
    { id: 'team-marketing', orgId: 'org-meidallm-core', name: 'Marketing & Comms', memberIds: ['tm2', 'tm4'], projectIds: ['p2', 'p3'], isArchived: false },
    { id: 'team-design', orgId: 'org-meidallm-core', name: 'Design & UI/UX', memberIds: [], projectIds: [], isArchived: false },
    { id: 't-3', orgId: 'org-global-marketing', name: 'Campaign Strategy', memberIds: ['tm1', 'tm2'], projectIds: ['p-welcome', 'p3', 'p4', 'p5'] },
    { id: 't-personal', orgId: 'personal', name: 'My Projects', memberIds: ['tm1'], projectIds: ['p6', 'p7', 'p8', 'p9'] }
];


const DEFAULT_CYCLES: Cycle[] = [
    { id: 'cy1', projectId: 'p1', name: 'Cycle 1: Alpha Launch', startDate: '2026-06-01', endDate: '2026-06-14', status: 'completed' },
    { id: 'cy2', projectId: 'p1', name: 'Cycle 2: Core UX', startDate: '2026-06-15', endDate: '2026-06-28', status: 'active' },
    { id: 'cy3', projectId: 'p1', name: 'Cycle 3: Integrations', startDate: '2026-06-29', endDate: '2026-07-12', status: 'upcoming' }
];

const DEFAULT_MODULES: Module[] = [
    { id: 'mod1', projectId: 'p1', name: 'Core Platform', description: 'Underlying services and authentication.', status: 'done' },
    { id: 'mod2', projectId: 'p1', name: 'Campaign RAG Engine', description: 'AI-assisted context search & generation.', status: 'in-progress' },
    { id: 'mod3', projectId: 'p1', name: 'Direct Social Publishing', description: 'Connections and auto-scheduler.', status: 'backlog' }
];

const DEFAULT_TABLES: DbTable[] = [
    {
        id: 'tbl-influencer',
        projectId: 'p1',
        name: 'Influencer Directory',
        description: 'Track media outreach contacts, sponsor deals, and follower metrics.',
        fields: [
            { id: 'f-name', name: 'Influencer Name', type: 'text' },
            { id: 'f-platform', name: 'Platform', type: 'select', options: ['YouTube', 'TikTok', 'X (Twitter)', 'Instagram'] },
            { id: 'f-followers', name: 'Follower Count', type: 'number' },
            { id: 'f-email', name: 'Contact Email', type: 'text' },
            { id: 'f-status', name: 'Outreach Status', type: 'select', options: ['Planned', 'Contacted', 'Negotiating', 'Contracted'] }
        ],
        rows: [
            {
                id: 'row-1',
                cells: {
                    'f-name': 'Linus Tech Tips',
                    'f-platform': 'YouTube',
                    'f-followers': 15000000,
                    'f-email': 'linus@lttgroup.com',
                    'f-status': 'Negotiating'
                }
            },
            {
                id: 'row-2',
                cells: {
                    'f-name': 'MKBHD',
                    'f-platform': 'YouTube',
                    'f-followers': 18000000,
                    'f-email': 'marques@mkbhd.com',
                    'f-status': 'Contracted'
                }
            },
            {
                id: 'row-3',
                cells: {
                    'f-name': 'TechCrunch',
                    'f-platform': 'X (Twitter)',
                    'f-followers': 10000000,
                    'f-email': 'tips@techcrunch.com',
                    'f-status': 'Planned'
                }
            }
        ]
    },
    {
        id: 'tbl-budget',
        projectId: 'p1',
        name: 'Campaign Budget & Expenses',
        description: 'Record operating spend, sponsorship costs, and ad investments.',
        fields: [
            { id: 'f-desc', name: 'Expense Description', type: 'text' },
            { id: 'f-category', name: 'Category', type: 'select', options: ['Sponsor Costs', 'Paid Ads', 'Tooling & APIs', 'Contractors'] },
            { id: 'f-amount', name: 'Amount ($)', type: 'number' },
            { id: 'f-date', name: 'Date Incurred', type: 'date' }
        ],
        rows: [
            {
                id: 'row-b1',
                cells: {
                    'f-desc': 'YouTube Sponsor Retainer',
                    'f-category': 'Sponsor Costs',
                    'f-amount': 12000,
                    'f-date': '2026-06-10'
                }
            },
            {
                id: 'row-b2',
                cells: {
                    'f-desc': 'Better-Auth API Subscriptions',
                    'f-category': 'Tooling & APIs',
                    'f-amount': 150,
                    'f-date': '2026-06-12'
                }
            },
            {
                id: 'row-b3',
                cells: {
                    'f-desc': 'Vercel Enterprise Plan',
                    'f-category': 'Tooling & APIs',
                    'f-amount': 3000,
                    'f-date': '2026-06-15'
                }
            }
        ]
    }
];

const DEFAULT_GOALS: Goal[] = [
    { id: 'g1', projectId: 'p1', title: 'YouTube Retainer Views', targetValue: 50000, currentValue: 12400, unit: 'Views', dueDate: '2026-07-15', status: 'on-track' },
    { id: 'g2', projectId: 'p1', title: 'Publish Marketing Content', targetValue: 30, currentValue: 12, unit: 'Posts', dueDate: '2026-07-01', status: 'on-track' },
    { id: 'g3', projectId: 'p1', title: 'Organic Signups Target', targetValue: 1500, currentValue: 240, unit: 'Users', dueDate: '2026-08-01', status: 'behind' }
];

const DEFAULT_INVENTORY: InventoryItem[] = [
    { id: 'i1', projectId: 'p-welcome', name: 'Microphone Kit (Rode)', type: 'gear', qty: 3, safetyStock: 2, unitPrice: 250, preferredSupplier: 'B&H Photo', lastChecked: Date.now() },
    { id: 'i2', projectId: 'p-welcome', name: 'SD Cards (128GB)', type: 'gear', qty: 10, safetyStock: 12, unitPrice: 35, preferredSupplier: 'Amazon Business', lastChecked: Date.now() },
    { id: 'i3', projectId: 'p-welcome', name: 'Adobe Creative Cloud Seats', type: 'license', qty: 5, safetyStock: 6, unitPrice: 85, preferredSupplier: 'Adobe Systems', lastChecked: Date.now() }
];

const DEFAULT_SUPPORT: SupportCase[] = [
    { id: 'sc1', projectId: 'p-welcome', contactId: 'c1', title: 'Adobe rendering crash on export', description: 'When exporting the brand sponsor reel, Adobe Premiere crashes at 80% with GPU error.', priority: 'high', status: 'new', slaDeadline: Date.now() + 3600 * 1000 * 2, comments: [], created: Date.now() },
    { id: 'sc2', projectId: 'p-welcome', contactId: 'c2', title: 'Sponsor logo revision requested', description: 'The sponsor requested to update the logo in the middle card to their new Q3 brand design.', priority: 'medium', status: 'working', slaDeadline: Date.now() + 3600 * 1000 * 4, comments: [
        { author: 'Sarah (Admin)', text: 'Contacted the editor to swap out the PNG.', timestamp: Date.now() - 1800 * 1000 }
    ], created: Date.now() - 3600 * 1000 }
];

const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
    { id: 'e1', name: 'Alex Rivera', role: 'Lead Video Editor', salary: 4500, taxRate: 0.15, paymentStatus: 'unpaid', onboardingTasks: [
        { task: 'Sign Freelancer Agreement / NDA', completed: true },
        { task: 'Configure Google Workspace Channel Access', completed: true },
        { task: 'Submit W-9 / Bank Details', completed: true }
    ], joinedDate: '2026-01-10' }
];

const DEFAULT_CANDIDATES: CandidateRecord[] = [
    { id: 'cand1', name: 'David Kim', role: 'Motion Designer', email: 'david@designer.io', status: 'offered' },
    { id: 'cand2', name: 'Elena Rostova', role: 'Social Media Writer', email: 'elena@copywrite.net', status: 'interviewing' }
];

const DEFAULT_CUSTOM_ROLES: CustomRole[] = [
    { id: 'role-finance', tenantId: 't-meidallm', name: 'Finance Manager', description: 'Can view and pay P2P invoices and run payroll.', permissions: ['read:erp', 'write:erp', 'manage:billing'] },
    { id: 'role-moderator', tenantId: 't-meidallm', name: 'Community Moderator', description: 'Can review content but cannot publish.', permissions: ['read:projects', 'read:kanban'] },
    { id: 'role-hr', tenantId: 't-global', name: 'HR Recruiter', description: 'Can manage candidates and onboarding.', permissions: ['read:team', 'write:team'] }
];

const DEFAULT_POLICIES: Policy[] = [
    { id: 'pol-1', tenantId: 'global', name: 'Require 2FA', description: 'Enforce two-factor authentication for all users.', type: 'security', enforced: false },
    { id: 'pol-2', tenantId: 't-meidallm', name: 'Max Spend: $10,000', description: 'Cap monthly P2P invoice spending.', type: 'billing', enforced: true },
    { id: 'pol-3', tenantId: 't-meidallm', name: 'Strict Data Siloing', description: 'Prevent cross-organization data access.', type: 'compliance', enforced: true }
];

export const state = {
    currentUser: null as string | null,
    activeTenantId: null as string | null,
    activeOrgId: null as string | null,
    activeTeamId: null as string | null,
    currentProject: null as string | null,
    activeViewKey: 'workspaces',
    draggedTaskId: null as string | null,
    
    kanbanState: [] as KanbanTask[],
    projects: [] as Project[],
    ideasState: [] as Idea[],
    taskLogs: [] as TaskLog[],
    researchDocs: [] as ResearchDoc[],
    mediaAssets: [] as MediaAsset[],
    drafts: [] as Draft[],
    goals: [] as Goal[],
    
    // Enterprise Adapters
    activeRole: 'admin' as 'admin' | 'manager' | 'accountant' | 'sales' | 'support',
    salesInvoices: [] as SalesInvoice[],
    p2pTransactions: [] as P2PTransaction[],
    inventoryItems: [] as InventoryItem[],
    supportCases: [] as SupportCase[],
    employees: [] as EmployeeRecord[],
    candidates: [] as CandidateRecord[],
    customRoles: [] as CustomRole[],
    policies: [] as Policy[],
    agencyBrand: { logo: 'Meidallm Agency', primaryColor: '#000000', subscriptionTier: 'pro' as 'creator' | 'pro' },
    
    // Extended States
    theme: 'day' as 'night' | 'day' | 'auto',
    connections: [] as Connection[],
    publishSchedules: [] as PublishSchedule[],
    workspacesSearchQuery: '',
    workspacesViewMode: 'grid' as 'grid' | 'list',
    workspacesSortBy: 'last-active' as 'last-active' | 'name-asc' | 'name-desc' | 'tasks-count',
    workspacesFilter: 'active' as 'active' | 'archived' | 'bin',
    kanbanFilter: 'active' as 'active' | 'archived' | 'bin',
    crmFilter: 'active' as 'active' | 'archived' | 'bin',
    kanbanActiveCycleId: null as string | null,
    kanbanActiveModuleId: null as string | null,
    contacts: [] as Contact[],
    team: [] as TeamMember[],
    teams: [] as Team[],
    tenants: [] as Tenant[],
    organizations: [] as Organization[],
    activityLogs: [] as ActivityLog[],
    
    cycles: [] as Cycle[],
    modules: [] as Module[],
    tables: [] as DbTable[],
    kanbanViewMode: 'board' as 'board' | 'list' | 'spreadsheet',
    activeTableId: 'tbl-influencer' as string | null,
    databaseViewMode: 'grid' as 'grid' | 'gallery',
    activeCommandMenu: false,
    activeAiAssistant: false,
    aiMessages: [] as { sender: 'user' | 'ai', text: string }[]
};

// UI Re-render Callback Registration
let stateChangeListener: (() => void) | null = null;

export function registerStateListener(listener: () => void) {
    stateChangeListener = listener;
}

export function notifyStateChange(skipSave = false) {
    if (!skipSave) {
        saveState();
    }
    if (stateChangeListener) {
        stateChangeListener();
    }
}

export function applyThemeClass(theme: 'day' | 'night' | 'auto') {
    if (typeof window === 'undefined') return;
    document.documentElement.className = '';
    if (theme === 'day') {
        document.documentElement.classList.add('theme-light');
    } else if (theme === 'night') {
        document.documentElement.classList.add('theme-dark');
    } else if (theme === 'auto') {
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.add(systemPrefersDark ? 'theme-dark' : 'theme-light');
    }
}

// Persistence & Zod Verification Helpers
function applyDbState(parsed: any) {
    if (!parsed) return;
    
    if (parsed.kanbanState) {
        const val = z.array(KanbanTaskSchema).safeParse(parsed.kanbanState);
        if (val.success) state.kanbanState = val.data;
    }
    if (parsed.projects) {
        const val = z.array(ProjectSchema).safeParse(parsed.projects);
        if (val.success) state.projects = val.data;
    }
    if (parsed.ideasState) {
        const val = z.array(IdeaSchema).safeParse(parsed.ideasState);
        if (val.success) state.ideasState = val.data;
    }
    if (parsed.taskLogs) {
        const val = z.array(TaskLogSchema).safeParse(parsed.taskLogs);
        if (val.success) state.taskLogs = val.data;
    }
    if (parsed.researchDocs) {
        const val = z.array(ResearchDocSchema).safeParse(parsed.researchDocs);
        if (val.success) state.researchDocs = val.data;
    }
    if (parsed.mediaAssets) {
        const val = z.array(MediaAssetSchema).safeParse(parsed.mediaAssets);
        if (val.success) state.mediaAssets = val.data;
    }
    if (parsed.drafts) {
        const val = z.array(DraftSchema).safeParse(parsed.drafts);
        if (val.success) state.drafts = val.data;
    }
    if (parsed.connections) {
        const val = z.array(ConnectionSchema).safeParse(parsed.connections);
        if (val.success) state.connections = val.data;
    }
    if (parsed.publishSchedules) {
        const val = z.array(PublishScheduleSchema).safeParse(parsed.publishSchedules);
        if (val.success) state.publishSchedules = val.data;
    }
    if (parsed.contacts) {
        const val = z.array(ContactSchema).safeParse(parsed.contacts);
        if (val.success) state.contacts = val.data;
    }
    if (parsed.team) {
        const val = z.array(TeamMemberSchema).safeParse(parsed.team);
        if (val.success) state.team = val.data;
    }
    if (parsed.teams) {
        const val = z.array(TeamSchema).safeParse(parsed.teams);
        if (val.success) state.teams = val.data;
    }
    if (parsed.tenants) {
        const val = z.array(TenantSchema).safeParse(parsed.tenants);
        if (val.success) state.tenants = val.data;
    }
    if (parsed.organizations) {
        const val = z.array(OrganizationSchema).safeParse(parsed.organizations);
        if (val.success) state.organizations = val.data;
    }
    if (parsed.activityLogs) {
        const val = z.array(ActivityLogSchema).safeParse(parsed.activityLogs);
        if (val.success) state.activityLogs = val.data;
    }
    if (parsed.cycles) {
        const val = z.array(CycleSchema).safeParse(parsed.cycles);
        if (val.success) state.cycles = val.data;
    }
    if (parsed.modules) {
        const val = z.array(ModuleSchema).safeParse(parsed.modules);
        if (val.success) state.modules = val.data;
    }
    if (parsed.tables) {
        const val = z.array(DbTableSchema).safeParse(parsed.tables);
        if (val.success) state.tables = val.data;
    }
    if (parsed.goals) {
        const val = z.array(GoalSchema).safeParse(parsed.goals);
        if (val.success) state.goals = val.data;
    }
    if (parsed.salesInvoices) {
        const val = z.array(SalesInvoiceSchema).safeParse(parsed.salesInvoices);
        if (val.success) state.salesInvoices = val.data;
    }
    if (parsed.p2pTransactions) {
        const val = z.array(P2PTransactionSchema).safeParse(parsed.p2pTransactions);
        if (val.success) state.p2pTransactions = val.data;
    }
    if (parsed.inventoryItems) {
        const val = z.array(InventoryItemSchema).safeParse(parsed.inventoryItems);
        if (val.success) state.inventoryItems = val.data;
    }
    if (parsed.supportCases) {
        const val = z.array(SupportCaseSchema).safeParse(parsed.supportCases);
        if (val.success) state.supportCases = val.data;
    }
    if (parsed.employees) {
        const val = z.array(EmployeeRecordSchema).safeParse(parsed.employees);
        if (val.success) state.employees = val.data;
    }
    if (parsed.candidates) {
        const val = z.array(CandidateRecordSchema).safeParse(parsed.candidates);
        if (val.success) state.candidates = val.data;
    }
    if (parsed.customRoles) {
        const val = z.array(CustomRoleSchema).safeParse(parsed.customRoles);
        if (val.success) state.customRoles = val.data;
    }
    if (parsed.policies) {
        const val = z.array(PolicySchema).safeParse(parsed.policies);
        if (val.success) state.policies = val.data;
    }
    if (parsed.activeRole) state.activeRole = parsed.activeRole;
    if (parsed.agencyBrand) state.agencyBrand = parsed.agencyBrand;
    if (parsed.theme) state.theme = parsed.theme;
    if (parsed.kanbanViewMode) state.kanbanViewMode = parsed.kanbanViewMode;
    if (parsed.activeTableId) state.activeTableId = parsed.activeTableId;
    if (parsed.databaseViewMode) state.databaseViewMode = parsed.databaseViewMode;
}

function loadLocalState() {
    try {
        const local = {
            kanbanState: JSON.parse(localStorage.getItem('meidallm_kanban') || 'null'),
            projects: JSON.parse(localStorage.getItem('meidallm_projects') || 'null'),
            ideasState: JSON.parse(localStorage.getItem('meidallm_ideas') || 'null'),
            taskLogs: JSON.parse(localStorage.getItem('meidallm_logs') || 'null'),
            researchDocs: JSON.parse(localStorage.getItem('meidallm_research') || 'null'),
            mediaAssets: JSON.parse(localStorage.getItem('meidallm_media') || 'null'),
            drafts: JSON.parse(localStorage.getItem('meidallm_drafts') || 'null'),
            connections: JSON.parse(localStorage.getItem('meidallm_connections') || 'null'),
            publishSchedules: JSON.parse(localStorage.getItem('meidallm_schedules') || 'null'),
            contacts: JSON.parse(localStorage.getItem('meidallm_contacts') || 'null'),
            team: JSON.parse(localStorage.getItem('meidallm_team') || 'null'),
            teams: JSON.parse(localStorage.getItem('meidallm_teams') || 'null'),
            tenants: JSON.parse(localStorage.getItem('meidallm_tenants') || 'null'),
            organizations: JSON.parse(localStorage.getItem('meidallm_organizations') || 'null'),
            activityLogs: JSON.parse(localStorage.getItem('meidallm_activity') || 'null'),
            cycles: JSON.parse(localStorage.getItem('meidallm_cycles') || 'null'),
            modules: JSON.parse(localStorage.getItem('meidallm_modules') || 'null'),
            tables: JSON.parse(localStorage.getItem('meidallm_tables') || 'null'),
            goals: JSON.parse(localStorage.getItem('meidallm_goals') || 'null'),
            salesInvoices: JSON.parse(localStorage.getItem('meidallm_sales_invoices') || 'null'),
            p2pTransactions: JSON.parse(localStorage.getItem('meidallm_p2p_transactions') || 'null'),
            inventoryItems: JSON.parse(localStorage.getItem('meidallm_inventory_items') || 'null'),
            supportCases: JSON.parse(localStorage.getItem('meidallm_support_cases') || 'null'),
            employees: JSON.parse(localStorage.getItem('meidallm_employees') || 'null'),
            candidates: JSON.parse(localStorage.getItem('meidallm_candidates') || 'null'),
            customRoles: JSON.parse(localStorage.getItem('meidallm_custom_roles') || 'null'),
            policies: JSON.parse(localStorage.getItem('meidallm_policies') || 'null'),
            activeRole: localStorage.getItem('meidallm_active_role'),
            agencyBrand: JSON.parse(localStorage.getItem('meidallm_agency_brand') || 'null'),
            theme: localStorage.getItem('meidallm_theme'),
            kanbanViewMode: localStorage.getItem('meidallm_kanban_viewmode'),
            activeTableId: localStorage.getItem('meidallm_active_tableid'),
            databaseViewMode: localStorage.getItem('meidallm_database_viewmode')
        };
        applyDbState(local);
        
        state.activeTenantId = localStorage.getItem('meidallm_active_tenantid');
        state.activeOrgId = localStorage.getItem('meidallm_active_orgid');
        state.activeTeamId = localStorage.getItem('meidallm_active_teamid');
    } catch (e) {
        console.error("Local storage load fallback failed:", e);
    }
    
    // Seed default sets if arrays are completely empty
    if (state.projects.length === 0) state.projects = DEFAULT_PROJECTS;
    if (state.kanbanState.length === 0) state.kanbanState = DEFAULT_KANBAN;
    if (state.ideasState.length === 0) state.ideasState = DEFAULT_IDEAS;
    if (state.researchDocs.length === 0) state.researchDocs = DEFAULT_RESEARCH;
    if (state.mediaAssets.length === 0) state.mediaAssets = DEFAULT_MEDIA;
    if (state.drafts.length === 0) state.drafts = DEFAULT_DRAFTS;
    if (state.connections.length === 0) state.connections = DEFAULT_CONNECTIONS;
    if (state.contacts.length === 0) state.contacts = DEFAULT_CONTACTS;
    if (state.team.length === 0) state.team = DEFAULT_TEAM;
    if (state.teams.length === 0) state.teams = DEFAULT_TEAMS;
    if (state.tenants.length === 0) state.tenants = DEFAULT_TENANTS;
    if (state.organizations.length === 0) state.organizations = DEFAULT_ORGS;
    if (state.activityLogs.length === 0) state.activityLogs = [];
    if (state.cycles.length === 0) state.cycles = DEFAULT_CYCLES;
    if (state.modules.length === 0) state.modules = DEFAULT_MODULES;
    if (state.tables.length === 0) state.tables = DEFAULT_TABLES;
    if (state.goals.length === 0) state.goals = DEFAULT_GOALS;
    
    // Creator SaaS Enterprise Defaults
    if (state.inventoryItems.length === 0) state.inventoryItems = DEFAULT_INVENTORY;
    if (state.supportCases.length === 0) state.supportCases = DEFAULT_SUPPORT;
    if (state.employees.length === 0) state.employees = DEFAULT_EMPLOYEES;
    if (state.candidates.length === 0) state.candidates = DEFAULT_CANDIDATES;
    if (state.customRoles.length === 0) state.customRoles = DEFAULT_CUSTOM_ROLES;
    if (state.policies.length === 0) state.policies = DEFAULT_POLICIES;
    if (!state.activeRole) state.activeRole = 'admin';
    if (!state.agencyBrand || !state.agencyBrand.logo) state.agencyBrand = { logo: 'Meidallm Agency', primaryColor: '#000000', subscriptionTier: 'pro' };
    if (!state.agencyBrand.subscriptionTier) state.agencyBrand.subscriptionTier = 'pro';
    
    applyThemeClass(state.theme);
}

export async function loadState() {
    const email = (typeof window !== 'undefined') ? (window as any).__user_email : null;
    if (email) {
        state.currentUser = email;
        localStorage.setItem('meidallm_user', email);
    } else {
        state.currentUser = localStorage.getItem('meidallm_user');
    }

    // 1. Instant fallback from localStorage
    loadLocalState();

    // 2. Fetch fresh data from postgres database
    if (state.currentUser && typeof window !== 'undefined') {
        try {
            const res = await fetch(`/api/state?email=${encodeURIComponent(state.currentUser)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.userPrefs) {
                    state.activeOrgId = data.userPrefs.activeOrgId;
                    state.theme = data.userPrefs.theme;
                    applyThemeClass(state.theme);
                }
                if (data.orgState) {
                    applyDbState(data.orgState);
                    notifyStateChange(true); // skip save on initial pull
                }
            }
        } catch (e) {
            console.error("Failed to fetch state from postgres:", e);
        }
    }
}

export function togglePolicy(policyId: string) {
    const policy = state.policies.find(p => p.id === policyId);
    if (policy) {
        policy.enforced = !policy.enforced;
        notifyStateChange();
    }
}

export function saveState() {
    try {
        if (state.currentUser) {
            localStorage.setItem('meidallm_user', state.currentUser);
        } else {
            localStorage.removeItem('meidallm_user');
        }
        if (state.activeTenantId) {
            localStorage.setItem('meidallm_active_tenantid', state.activeTenantId);
        }
        if (state.activeOrgId) {
            localStorage.setItem('meidallm_active_orgid', state.activeOrgId);
        }
        if (state.activeTeamId) {
            localStorage.setItem('meidallm_active_teamid', state.activeTeamId);
        }
        localStorage.setItem('meidallm_kanban', JSON.stringify(state.kanbanState));
        localStorage.setItem('meidallm_projects', JSON.stringify(state.projects));
        localStorage.setItem('meidallm_ideas', JSON.stringify(state.ideasState));
        localStorage.setItem('meidallm_logs', JSON.stringify(state.taskLogs));
        localStorage.setItem('meidallm_research', JSON.stringify(state.researchDocs));
        localStorage.setItem('meidallm_media', JSON.stringify(state.mediaAssets));
        localStorage.setItem('meidallm_drafts', JSON.stringify(state.drafts));
        localStorage.setItem('meidallm_theme', state.theme);
        localStorage.setItem('meidallm_connections', JSON.stringify(state.connections));
        localStorage.setItem('meidallm_schedules', JSON.stringify(state.publishSchedules));
        localStorage.setItem('meidallm_contacts', JSON.stringify(state.contacts));
        localStorage.setItem('meidallm_team', JSON.stringify(state.team));
        localStorage.setItem('meidallm_teams', JSON.stringify(state.teams));
        localStorage.setItem('meidallm_tenants', JSON.stringify(state.tenants));
        localStorage.setItem('meidallm_organizations', JSON.stringify(state.organizations));
        localStorage.setItem('meidallm_activity', JSON.stringify(state.activityLogs));
        localStorage.setItem('meidallm_cycles', JSON.stringify(state.cycles));
        localStorage.setItem('meidallm_modules', JSON.stringify(state.modules));
        localStorage.setItem('meidallm_tables', JSON.stringify(state.tables));
        localStorage.setItem('meidallm_goals', JSON.stringify(state.goals));
        localStorage.setItem('meidallm_sales_invoices', JSON.stringify(state.salesInvoices));
        localStorage.setItem('meidallm_p2p_transactions', JSON.stringify(state.p2pTransactions));
        localStorage.setItem('meidallm_inventory_items', JSON.stringify(state.inventoryItems));
        localStorage.setItem('meidallm_support_cases', JSON.stringify(state.supportCases));
        localStorage.setItem('meidallm_employees', JSON.stringify(state.employees));
        localStorage.setItem('meidallm_candidates', JSON.stringify(state.candidates));
        localStorage.setItem('meidallm_custom_roles', JSON.stringify(state.customRoles));
        localStorage.setItem('meidallm_policies', JSON.stringify(state.policies));
        localStorage.setItem('meidallm_active_role', state.activeRole);
        localStorage.setItem('meidallm_agency_brand', JSON.stringify(state.agencyBrand));
        localStorage.setItem('meidallm_kanban_viewmode', state.kanbanViewMode);
        if (state.activeTableId) localStorage.setItem('meidallm_active_tableid', state.activeTableId);
        localStorage.setItem('meidallm_database_viewmode', state.databaseViewMode);

        // Async save to Postgres database
        if (state.currentUser && typeof window !== 'undefined') {
            if (!state.activeOrgId) {
                const parts = state.currentUser.split("@");
                state.activeOrgId = parts.length === 2 && parts[1] ? parts[1] : `personal-${parts[0]}`;
            }
            const body = {
                email: state.currentUser,
                orgId: state.activeOrgId,
                theme: state.theme,
                orgState: {
                    kanbanState: state.kanbanState,
                    projects: state.projects,
                    ideasState: state.ideasState,
                    taskLogs: state.taskLogs,
                    researchDocs: state.researchDocs,
                    mediaAssets: state.mediaAssets,
                    drafts: state.drafts,
                    connections: state.connections,
                    publishSchedules: state.publishSchedules,
                    contacts: state.contacts,
                    team: state.team,
                    teams: state.teams,
                    activityLogs: state.activityLogs,
                    cycles: state.cycles,
                    modules: state.modules,
                    tables: state.tables,
                    goals: state.goals,
                    salesInvoices: state.salesInvoices,
                    p2pTransactions: state.p2pTransactions,
                    inventoryItems: state.inventoryItems,
                    supportCases: state.supportCases,
                    employees: state.employees,
                    candidates: state.candidates,
                    customRoles: state.customRoles,
                    policies: state.policies,
                    activeRole: state.activeRole,
                    agencyBrand: state.agencyBrand,
                    kanbanViewMode: state.kanbanViewMode,
                    activeTableId: state.activeTableId,
                    databaseViewMode: state.databaseViewMode
                }
            };
            fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }).catch(err => console.error("Database save failed:", err));
        }
    } catch (e) {
        console.error("Failed to save state:", e);
    }
}

// State Mutators
export function logChange(projectId: string, taskId: string, itemTitle: string, fromState: string, toState: string) {
    const logEntry: TaskLog = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        projectId,
        taskId,
        taskTitle: itemTitle,
        fromStatus: fromState,
        toStatus: toState,
        timestamp: Date.now()
    };
    state.taskLogs.push(logEntry);
}

export function addContact(pid: string, name: string, email: string, company: string, dealStage: Contact['dealStage'], dealValue: number, statusTag?: Contact['statusTag']) {
    const newContact: Contact = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        dealStage,
        dealValue,
        created: Date.now(),
        updated: Date.now(),
        isArchived: false,
        isBinned: false,
        statusTag: statusTag || 'new',
        history: [{ action: 'Created Prospect', timestamp: Date.now() }]
    };
    state.contacts.push(newContact);
    logChange(pid, '', `Contact ${newContact.name}`, 'none', 'created_contact');
    notifyStateChange();
    return newContact.id;
}

export function updateContact(cid: string, name: string, email: string, company: string, dealStage: Contact['dealStage'], dealValue: number, statusTag?: Contact['statusTag']) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        const oldStage = contact.dealStage;
        contact.name = name.trim();
        contact.email = email.trim();
        contact.company = company.trim();
        contact.dealStage = dealStage;
        contact.dealValue = dealValue;
        if (statusTag) contact.statusTag = statusTag;
        contact.updated = Date.now();
        if (!contact.history) contact.history = [];
        if (oldStage !== dealStage) {
            contact.history.push({
                action: `Stage changed: ${oldStage} ➔ ${dealStage}`,
                timestamp: Date.now()
            });
        } else {
            contact.history.push({
                action: `Updated details`,
                timestamp: Date.now()
            });
        }
        logChange(contact.projectId, '', `Contact ${contact.name}`, 'edited', 'updated_contact');
        notifyStateChange();
    }
}

export function archiveContact(cid: string, isArchived: boolean) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        contact.isArchived = isArchived;
        contact.updated = Date.now();
        if (!contact.history) contact.history = [];
        contact.history.push({
            action: isArchived ? 'Archived prospect' : 'Restored prospect from archive',
            timestamp: Date.now()
        });
        notifyStateChange();
    }
}

export function binContact(cid: string, isBinned: boolean) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        contact.isBinned = isBinned;
        contact.updated = Date.now();
        if (!contact.history) contact.history = [];
        contact.history.push({
            action: isBinned ? 'Moved to Bin' : 'Restored from Bin',
            timestamp: Date.now()
        });
        notifyStateChange();
    }
}

export function updateContactTag(cid: string, tag: Contact['statusTag']) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        contact.statusTag = tag;
        contact.updated = Date.now();
        if (!contact.history) contact.history = [];
        contact.history.push({
            action: `Updated status tag to ${tag}`,
            timestamp: Date.now()
        });
        notifyStateChange();
    }
}

export function deleteContact(cid: string) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        logChange(contact.projectId, '', `Contact ${contact.name}`, 'active', 'deleted_contact');
        state.contacts = state.contacts.filter(c => c.id !== cid);
        notifyStateChange();
    }
}

export function addTeam(name: string) {
    const newTeam: Team = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        orgId: state.activeOrgId || 'personal',
        name: name.trim(),
        memberIds: [],
        projectIds: [],
        isArchived: false
    };
    state.teams.push(newTeam);
    logActivity(undefined, newTeam.id, 'Team Created', `Team "${newTeam.name}" was successfully registered.`, 'team_created');
    notifyStateChange();
    return newTeam.id;
}

export function toggleTeamMember(teamId: string, memberId: string) {
    const team = state.teams.find(t => t.id === teamId);
    const member = state.team.find(m => m.id === memberId);
    if (team && member) {
        if (team.memberIds.includes(memberId)) {
            team.memberIds = team.memberIds.filter(id => id !== memberId);
            logActivity(undefined, teamId, 'Member Removed', `Removed ${member.name} from team ${team.name}.`);
        } else {
            team.memberIds.push(memberId);
            logActivity(undefined, teamId, 'Member Added', `Added ${member.name} to team ${team.name}.`);
        }
        notifyStateChange();
    }
}

export function toggleTeamProjectAccess(teamId: string, projectId: string) {
    const team = state.teams.find(t => t.id === teamId);
    const proj = state.projects.find(p => p.id === projectId);
    if (team && proj) {
        if (team.projectIds.includes(projectId)) {
            team.projectIds = team.projectIds.filter(id => id !== projectId);
            logActivity(projectId, teamId, 'Access Revoked', `Revoked workspace access of team ${team.name} for ${proj.name}.`);
        } else {
            team.projectIds.push(projectId);
            logActivity(projectId, teamId, 'Access Granted', `Granted workspace access of team ${team.name} for ${proj.name}.`);
        }
        notifyStateChange();
    }
}

export function archiveTeam(teamId: string, isArchived: boolean) {
    const team = state.teams.find(t => t.id === teamId);
    if (team) {
        team.isArchived = isArchived;
        logActivity(undefined, teamId, isArchived ? 'Team Archived' : 'Team Restored', `Team ${team.name} was ${isArchived ? 'archived' : 'restored'}.`);
        notifyStateChange();
    }
}

export function deleteTeam(teamId: string) {
    const team = state.teams.find(t => t.id === teamId);
    if (team) {
        logActivity(undefined, teamId, 'Team Deleted', `Team ${team.name} was permanently dissolved.`);
        state.teams = state.teams.filter(t => t.id !== teamId);
        notifyStateChange();
    }
}

export function logActivity(projectId?: string, teamId?: string, action?: string, details?: string, kpiMetric?: ActivityLog['kpiMetric']) {
    const newLog: ActivityLog = {
        id: 'act-' + Math.random().toString(36).substr(2, 9),
        projectId,
        teamId,
        action: action || 'Event',
        details: details || '',
        timestamp: Date.now(),
        kpiMetric
    };
    state.activityLogs.push(newLog);
    notifyStateChange();
}

export function addProject(name: string, description: string) {
    const newProj: Project = {
        id: 'p-' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        description: description.trim(),
        status: 'active',
        lastActive: Date.now(),
        isArchived: false,
        isBinned: false
    };
    state.projects.push(newProj);
    logChange(newProj.id, '', newProj.name, 'none', 'created');
    notifyStateChange();
    return newProj.id;
}

export function updateProject(pid: string, name: string, description: string) {
    const p = state.projects.find(x => x.id === pid);
    if (p) {
        const oldName = p.name;
        p.name = name.trim();
        p.description = description.trim();
        p.lastActive = Date.now();
        logChange(pid, '', p.name, oldName, 'edited');
        notifyStateChange();
    }
}

export function archiveProject(pid: string, isArchived: boolean) {
    const p = state.projects.find(x => x.id === pid);
    if (p) {
        p.isArchived = isArchived;
        p.lastActive = Date.now();
        logChange(pid, '', p.name, isArchived ? 'active' : 'archived', isArchived ? 'archived' : 'active');
        if (isArchived && state.currentProject === pid) {
            state.currentProject = null;
            state.activeViewKey = 'workspaces';
        }
        notifyStateChange();
    }
}

export function binProject(pid: string, isBinned: boolean) {
    const p = state.projects.find(x => x.id === pid);
    if (p) {
        p.isBinned = isBinned;
        p.lastActive = Date.now();
        logChange(pid, '', p.name, isBinned ? 'active' : 'binned', isBinned ? 'binned' : 'active');
        if (isBinned && state.currentProject === pid) {
            state.currentProject = null;
            state.activeViewKey = 'workspaces';
        }
        notifyStateChange();
    }
}

export function deleteProject(pid: string) {
    const p = state.projects.find(x => x.id === pid);
    const pName = p ? p.name : 'Unknown Folder';
    state.projects = state.projects.filter(p => p.id !== pid);
    state.kanbanState = state.kanbanState.filter(k => k.projectId !== pid);
    state.ideasState = state.ideasState.filter(i => i.projectId !== pid);
    logChange(pid, '', pName, 'binned', 'permanently_deleted');
    if (state.currentProject === pid) {
        state.currentProject = null;
    }
    notifyStateChange();
}

export function toggleProjectStar(pid: string) {
    const p = state.projects.find(x => x.id === pid);
    if (p) {
        p.isStarred = !p.isStarred;
        notifyStateChange();
    }
}

export function updateCmsMetadata(draftId: string, cmsStatus: Draft['cmsStatus'], seoKeywords: string, collaborators: string) {
    const d = state.drafts.find(x => x.id === draftId);
    if (d) {
        d.cmsStatus = cmsStatus;
        d.seoKeywords = seoKeywords.trim();
        d.collaborators = collaborators.trim();
        notifyStateChange();
    }
}

export function updateErpBudget(pid: string, budgetLimit: number, spent: number) {
    const p = state.projects.find(x => x.id === pid);
    if (p) {
        p.budgetLimit = budgetLimit;
        p.spent = spent;
        notifyStateChange();
    }
}

export function addTask(pid: string, title: string, tag: string, priority?: KanbanTask['priority'], points?: number) {
    const newTask: KanbanTask = {
        id: 't-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        tag: tag.trim() || 'General',
        status: 'backlog',
        created: Date.now(),
        updated: Date.now(),
        isArchived: false,
        isBinned: false,
        priority: priority || 'none',
        points: points || 0
    };
    state.kanbanState.push(newTask);
    logChange(pid, newTask.id, newTask.title, 'none', 'created');
    
    const p = state.projects.find(proj => proj.id === pid);
    if (p) p.lastActive = Date.now();

    notifyStateChange();
}

export function updateTask(
    taskId: string, 
    title: string, 
    tag: string, 
    status?: KanbanTask['status'],
    complexity?: KanbanTask['complexity'],
    assignee?: string,
    description?: string,
    dueDate?: string,
    checklist?: string,
    priority?: KanbanTask['priority'],
    points?: number,
    cycleId?: string,
    moduleId?: string
) {
    const t = state.kanbanState.find(x => x.id === taskId);
    if (t) {
        const oldTitle = t.title;
        t.title = title.trim();
        t.tag = tag.trim() || 'General';
        if (status) t.status = status;
        if (complexity !== undefined) t.complexity = complexity;
        if (assignee !== undefined) t.assignee = assignee;
        if (description !== undefined) t.description = description;
        if (dueDate !== undefined) t.dueDate = dueDate;
        if (checklist !== undefined) t.checklist = checklist;
        if (priority !== undefined) t.priority = priority;
        if (points !== undefined) t.points = points;
        if (cycleId !== undefined) t.cycleId = cycleId;
        if (moduleId !== undefined) t.moduleId = moduleId;
        t.updated = Date.now();
        logChange(t.projectId, t.id, t.title, oldTitle, 'edited');
        notifyStateChange();
    }
}

export function archiveTask(taskId: string, isArchived: boolean) {
    const t = state.kanbanState.find(x => x.id === taskId);
    if (t) {
        t.isArchived = isArchived;
        t.updated = Date.now();
        logChange(t.projectId, t.id, t.title, isArchived ? 'active' : 'archived', isArchived ? 'archived' : 'active');
        notifyStateChange();
    }
}

export function binTask(taskId: string, isBinned: boolean) {
    const t = state.kanbanState.find(x => x.id === taskId);
    if (t) {
        t.isBinned = isBinned;
        t.updated = Date.now();
        logChange(t.projectId, t.id, t.title, isBinned ? 'active' : 'binned', isBinned ? 'binned' : 'active');
        notifyStateChange();
    }
}

export function deleteTask(taskId: string) {
    const task = state.kanbanState.find(t => t.id === taskId);
    if (task) {
        logChange(task.projectId, task.id, task.title, 'binned', 'permanently_deleted');
        state.kanbanState = state.kanbanState.filter(t => t.id !== taskId);
        notifyStateChange();
    }
}

export function moveTask(taskId: string, targetStatus: KanbanTask['status']) {
    const task = state.kanbanState.find(t => t.id === taskId);
    if (task && task.status !== targetStatus) {
        const oldStatus = task.status;
        task.status = targetStatus;
        task.updated = Date.now();
        logChange(task.projectId, task.id, task.title, oldStatus, targetStatus);
        
        const p = state.projects.find(proj => proj.id === task.projectId);
        if (p) p.lastActive = Date.now();

        notifyStateChange();
    }
}

export function addStickyNote(pid: string) {
    const newIdea: Idea = {
        id: 'i-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        content: '',
        color: '#fef08a'
    };
    state.ideasState.push(newIdea);
    notifyStateChange();
}

export function updateStickyNote(ideaId: string, content: string) {
    const idea = state.ideasState.find(i => i.id === ideaId);
    if (idea) {
        idea.content = content;
        notifyStateChange();
    }
}

export function deleteStickyNote(ideaId: string) {
    state.ideasState = state.ideasState.filter(i => i.id !== ideaId);
    notifyStateChange();
}

export function convertIdeaToTask(ideaId: string) {
    const ideaIndex = state.ideasState.findIndex(i => i.id === ideaId);
    if (ideaIndex > -1) {
        const idea = state.ideasState[ideaIndex];
        if (idea && idea.content.trim()) {
            const newTask: KanbanTask = {
                id: 't-' + Math.random().toString(36).substr(2, 9),
                projectId: idea.projectId,
                title: idea.content,
                tag: 'Brainstorm',
                status: 'backlog',
                created: Date.now(),
                updated: Date.now()
            };
            state.kanbanState.push(newTask);
            state.ideasState.splice(ideaIndex, 1);
            notifyStateChange();
            return true;
        }
    }
    return false;
}

// Research Mutators
export function addResearchDoc(pid: string, title: string, content: string, type: ResearchDoc['type']) {
    const newDoc: ResearchDoc = {
        id: 'r-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        content: content.trim(),
        type,
        created: Date.now()
    };
    state.researchDocs.push(newDoc);
    notifyStateChange();
}

export function deleteResearchDoc(id: string) {
    state.researchDocs = state.researchDocs.filter(d => d.id !== id);
    notifyStateChange();
}

// Media Mutators
export function addMediaAsset(pid: string, title: string, url: string, category: MediaAsset['category']) {
    const newAsset: MediaAsset = {
        id: 'm-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        url: url.trim(),
        category,
        created: Date.now()
    };
    state.mediaAssets.push(newAsset);
    notifyStateChange();
}

export function deleteMediaAsset(id: string) {
    state.mediaAssets = state.mediaAssets.filter(a => a.id !== id);
    notifyStateChange();
}

// Drafts Mutators
export function addDraft(pid: string, title: string, content: string, format: Draft['format']) {
    const newDraft: Draft = {
        id: 'd-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        title: title.trim(),
        content,
        format,
        created: Date.now(),
        updated: Date.now()
    };
    state.drafts.push(newDraft);
    notifyStateChange();
    return newDraft.id;
}

export function updateDraft(id: string, title: string, content: string) {
    const draft = state.drafts.find(d => d.id === id);
    if (draft) {
        draft.title = title.trim();
        draft.content = content;
        draft.updated = Date.now();
        notifyStateChange();
    }
}

export function deleteDraft(id: string) {
    state.drafts = state.drafts.filter(d => d.id !== id);
    notifyStateChange();
}

export function addPublishSchedule(pid: string, draftId: string, title: string, format: string, channels: string[], scheduledTime: number) {
    const newSchedule: PublishSchedule = {
        id: 's-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        draftId,
        title,
        format,
        channels,
        scheduledTime,
        status: scheduledTime <= Date.now() ? 'published' : 'queued'
    };
    state.publishSchedules.push(newSchedule);
    notifyStateChange();
    return newSchedule.id;
}

export function deletePublishSchedule(id: string) {
    state.publishSchedules = state.publishSchedules.filter(s => s.id !== id);
    notifyStateChange();
}

// Sprints/Cycles Mutators
export function addCycle(pid: string, name: string, startDate: string, endDate: string, status: Cycle['status']) {
    const newCycle: Cycle = {
        id: 'cy-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        name: name.trim(),
        startDate,
        endDate,
        status
    };
    state.cycles.push(newCycle);
    notifyStateChange();
    return newCycle.id;
}

export function deleteCycle(id: string) {
    state.cycles = state.cycles.filter(cy => cy.id !== id);
    // Unassign tasks belonging to this cycle
    state.kanbanState.forEach(t => {
        if (t.cycleId === id) t.cycleId = undefined;
    });
    notifyStateChange();
}

// Modules Mutators
export function addModule(pid: string, name: string, description: string, status: Module['status']) {
    const newModule: Module = {
        id: 'mod-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        name: name.trim(),
        description: description.trim(),
        status
    };
    state.modules.push(newModule);
    notifyStateChange();
    return newModule.id;
}

export function deleteModule(id: string) {
    state.modules = state.modules.filter(m => m.id !== id);
    // Unassign tasks belonging to this module
    state.kanbanState.forEach(t => {
        if (t.moduleId === id) t.moduleId = undefined;
    });
    notifyStateChange();
}

// Collaborative Databases Mutators
export function addDbTable(pid: string, name: string, description: string) {
    const newTable: DbTable = {
        id: 'tbl-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        name: name.trim(),
        description: description.trim(),
        fields: [
            { id: 'f-name', name: 'Name', type: 'text' }
        ],
        rows: []
    };
    state.tables.push(newTable);
    state.activeTableId = newTable.id;
    notifyStateChange();
    return newTable.id;
}

export function deleteDbTable(id: string) {
    state.tables = state.tables.filter(tbl => tbl.id !== id);
    if (state.activeTableId === id) {
        const remaining = state.tables.find(tbl => tbl.projectId === state.currentProject);
        state.activeTableId = remaining ? remaining.id : null;
    }
    notifyStateChange();
}

export function addDbField(tableId: string, name: string, type: DbField['type'], options?: string[]) {
    const tbl = state.tables.find(t => t.id === tableId);
    if (tbl) {
        const newField: DbField = {
            id: 'f-' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            type,
            options
        };
        tbl.fields.push(newField);
        notifyStateChange();
        return newField.id;
    }
    return null;
}

export function deleteDbField(tableId: string, fieldId: string) {
    const tbl = state.tables.find(t => t.id === tableId);
    if (tbl) {
        tbl.fields = tbl.fields.filter(f => f.id !== fieldId);
        // Clean up data in cell records for this column
        tbl.rows.forEach(r => {
            delete r.cells[fieldId];
        });
        notifyStateChange();
    }
}

export function addDbRow(tableId: string, cells: Record<string, any>) {
    const tbl = state.tables.find(t => t.id === tableId);
    if (tbl) {
        const newRow: DbRow = {
            id: 'row-' + Math.random().toString(36).substr(2, 9),
            cells
        };
        tbl.rows.push(newRow);
        notifyStateChange();
        return newRow.id;
    }
    return null;
}

export function updateDbRow(tableId: string, rowId: string, cells: Record<string, any>) {
    const tbl = state.tables.find(t => t.id === tableId);
    if (tbl) {
        const row = tbl.rows.find(r => r.id === rowId);
        if (row) {
            row.cells = { ...row.cells, ...cells };
            notifyStateChange();
        }
    }
}

export function deleteDbRow(tableId: string, rowId: string) {
    const tbl = state.tables.find(t => t.id === tableId);
    if (tbl) {
        tbl.rows = tbl.rows.filter(r => r.id !== rowId);
        notifyStateChange();
    }
}

export async function switchTenant(tenantId: string) {
    if (typeof window === 'undefined') return;
    saveState();
    state.activeTenantId = tenantId;
    localStorage.setItem('meidallm_active_tenantid', tenantId);
    
    const firstOrg = state.organizations.find(o => o.tenantId === tenantId);
    if (firstOrg) {
        await switchOrganization(firstOrg.id, true);
    } else {
        state.activeOrgId = null;
        state.activeTeamId = null;
        notifyStateChange();
    }
}

export async function switchTeam(teamId: string) {
    if (typeof window === 'undefined') return;
    saveState();
    state.activeTeamId = teamId;
    localStorage.setItem('meidallm_active_teamid', teamId);
    notifyStateChange();
}

export async function switchOrganization(orgId: string, skipTenantCheck = false) {
    if (typeof window === 'undefined') return;
    
    saveState();
    state.activeOrgId = orgId;
    localStorage.setItem('meidallm_active_orgid', orgId);
    
    if (!skipTenantCheck) {
        const org = state.organizations.find(o => o.id === orgId);
        if (org && org.tenantId !== state.activeTenantId) {
            state.activeTenantId = org.tenantId;
            localStorage.setItem('meidallm_active_tenantid', org.tenantId);
        }
    }

    const firstTeam = state.teams.find(t => t.orgId === orgId);
    if (firstTeam) {
        state.activeTeamId = firstTeam.id;
        localStorage.setItem('meidallm_active_teamid', firstTeam.id);
    } else {
        state.activeTeamId = null;
    }
    
    if (state.currentUser) {
        try {
            const res = await fetch(`/api/state?email=${encodeURIComponent(state.currentUser)}&orgId=${encodeURIComponent(orgId)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.orgState) {
                    applyDbState(data.orgState);
                }
            }
        } catch (e) {
            console.error("Failed to switch database org context:", e);
        }
    }
    notifyStateChange();
}

export function switchRole(role: typeof state.activeRole) {
    state.activeRole = role;
    notifyStateChange();
}

export function updateAgencyBrand(logo: string, primaryColor: string, subscriptionTier?: 'creator' | 'pro') {
    state.agencyBrand = { logo: logo.trim(), primaryColor, subscriptionTier: subscriptionTier || 'pro' };
    notifyStateChange();
}

export function generateSponsorInvoice(contactId: string) {
    const contact = state.contacts.find(c => c.id === contactId);
    if (!contact) return null;
    
    if (!contact.email) {
        alert("Lead must have a valid email before generating an invoice!");
        return null;
    }
    if (contact.dealValue <= 0) {
        alert("Lead must have a deal value greater than $0!");
        return null;
    }
    
    const existing = state.salesInvoices.find(inv => inv.contactId === contactId);
    if (existing) {
        alert("Sponsor campaign invoice has already been generated!");
        return existing.id;
    }
    
    const invoiceId = 'inv-' + Math.random().toString(36).substr(2, 9);
    const newInvoice: SalesInvoice = {
        id: invoiceId,
        projectId: contact.projectId,
        contactId: contactId,
        clientName: contact.name,
        dealValue: contact.dealValue,
        quoteStatus: 'approved',
        orderStatus: 'confirmed',
        invoiceStatus: 'unpaid',
        created: Date.now()
    };
    
    state.salesInvoices.push(newInvoice);
    
    logActivity(contact.projectId, undefined, `Sponsor Billing`, `Quote & Sales Order generated for ${contact.name} (${contact.company}) - Value: $${contact.dealValue.toLocaleString()}`);
    
    if (!contact.history) contact.history = [];
    contact.history.push({ action: `Quote, Sales Order, and Unpaid Invoice Generated`, timestamp: Date.now() });
    
    notifyStateChange();
    alert(`Success: Quote, Order, and Unpaid Invoice #${invoiceId} generated for ${contact.name}!`);
    return invoiceId;
}

export function paySponsorInvoice(invoiceId: string) {
    const inv = state.salesInvoices.find(i => i.id === invoiceId);
    if (!inv) return;
    
    if (inv.invoiceStatus === 'paid') return;
    inv.invoiceStatus = 'paid';
    
    let budgetTable = state.tables.find(t => t.projectId === inv.projectId && t.id.includes('budget'));
    if (!budgetTable) {
        budgetTable = state.tables.find(t => t.id === 'tbl-budget');
    }
    
    if (budgetTable) {
        const rowId = 'row-' + Math.random().toString(36).substr(2, 9);
        budgetTable.rows.push({
            id: rowId,
            cells: {
                'f-desc': `Revenue: Sponsor Retainer (${inv.clientName})`,
                'f-category': 'General',
                'f-amount': -inv.dealValue,
                'f-date': new Date().toISOString().split('T')[0]
            }
        });
    }
    
    const contact = state.contacts.find(c => c.id === inv.contactId);
    if (contact) {
        contact.dealStage = 'active';
        contact.updated = Date.now();
        if (!contact.history) contact.history = [];
        contact.history.push({ action: `Invoice Paid - Sponsorship Active`, timestamp: Date.now() });
    }
    
    logActivity(inv.projectId, undefined, `Order-to-Cash Reconciled`, `Sponsorship Invoice #${invoiceId} paid. Campaign budget credited by $${inv.dealValue.toLocaleString()}`);
    
    notifyStateChange();
    alert(`Success: Invoice #${invoiceId} paid! Campaign budget credited.`);
}

export function createP2PTransaction(pid: string, vendorName: string, poDescription: string, poAmount: number) {
    const newTx: P2PTransaction = {
        id: 'p2p-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        vendorName: vendorName.trim(),
        poDescription: poDescription.trim(),
        poAmount,
        requisitionStatus: 'pending',
        poStatus: 'draft',
        receiptStatus: 'pending',
        invoiceStatus: 'pending',
        invoiceAmount: poAmount,
        matchStatus: 'unchecked',
        paymentStatus: 'unpaid',
        created: Date.now()
    };
    state.p2pTransactions.push(newTx);
    notifyStateChange();
    return newTx.id;
}

export function approveP2PRequisition(p2pId: string) {
    const tx = state.p2pTransactions.find(t => t.id === p2pId);
    if (tx) {
        tx.requisitionStatus = 'approved';
        tx.poStatus = 'issued';
        notifyStateChange();
    }
}

export function deliverP2PGoods(p2pId: string) {
    const tx = state.p2pTransactions.find(t => t.id === p2pId);
    if (tx) {
        tx.receiptStatus = 'received';
        notifyStateChange();
    }
}

export function receiveP2PInvoice(p2pId: string, invoiceAmount: number) {
    const tx = state.p2pTransactions.find(t => t.id === p2pId);
    if (tx) {
        tx.invoiceStatus = 'received';
        tx.invoiceAmount = invoiceAmount;
        tx.matchStatus = 'unchecked';
        notifyStateChange();
    }
}

export function run3WayMatch(p2pId: string) {
    const tx = state.p2pTransactions.find(t => t.id === p2pId);
    if (tx) {
        const isMatched = tx.poStatus === 'issued' && 
                          tx.receiptStatus === 'received' && 
                          tx.invoiceStatus === 'received' && 
                          tx.poAmount === tx.invoiceAmount;
        
        tx.matchStatus = isMatched ? 'matched' : 'mismatched';
        notifyStateChange();
        
        if (isMatched) {
            alert(`Success: 3-Way Match verified for PO ${tx.id}! Payments released.`);
        } else {
            alert(`Discrepancy: Contract amount ($${tx.poAmount}) does not match Invoice amount ($${tx.invoiceAmount}) or deliverable receipt is missing!`);
        }
    }
}

export function payP2PInvoice(p2pId: string) {
    const tx = state.p2pTransactions.find(t => t.id === p2pId);
    if (tx && tx.matchStatus === 'matched' && tx.paymentStatus === 'unpaid') {
        tx.paymentStatus = 'paid';
        
        let budgetTable = state.tables.find(tbl => tbl.projectId === tx.projectId && tbl.id.includes('budget'));
        if (!budgetTable) {
            budgetTable = state.tables.find(tbl => tbl.id === 'tbl-budget');
        }
        
        if (budgetTable) {
            const rowId = 'row-' + Math.random().toString(36).substr(2, 9);
            budgetTable.rows.push({
                id: rowId,
                cells: {
                    'f-desc': `Contractor Pay: ${tx.poDescription} (${tx.vendorName})`,
                    'f-category': 'Contractors',
                    'f-amount': tx.invoiceAmount,
                    'f-date': new Date().toISOString().split('T')[0]
                }
            });
        }
        
        logActivity(tx.projectId, undefined, `Procure-to-Pay Verified`, `Contractor payment of $${tx.invoiceAmount.toLocaleString()} released to ${tx.vendorName}`);
        
        notifyStateChange();
        alert(`Success: Contractor invoice paid! Expense posted to campaign ledger.`);
    }
}

export function replenishInventory(itemId: string, qty: number) {
    const item = state.inventoryItems.find(i => i.id === itemId);
    if (item) {
        item.qty += qty;
        item.lastChecked = Date.now();
        
        const cost = qty * item.unitPrice;
        let budgetTable = state.tables.find(tbl => tbl.projectId === item.projectId && tbl.id.includes('budget'));
        if (!budgetTable) {
            budgetTable = state.tables.find(tbl => tbl.id === 'tbl-budget');
        }
        
        if (budgetTable) {
            const rowId = 'row-' + Math.random().toString(36).substr(2, 9);
            budgetTable.rows.push({
                id: rowId,
                cells: {
                    'f-desc': `Replenishment: ${item.name} x${qty}`,
                    'f-category': item.type === 'license' ? 'Tooling & APIs' : 'General',
                    'f-amount': cost,
                    'f-date': new Date().toISOString().split('T')[0]
                }
            });
        }
        
        logActivity(item.projectId, undefined, `Inventory Restocked`, `Restocked ${qty} units of ${item.name}. Spend incurred: $${cost.toLocaleString()}`);
        notifyStateChange();
        alert(`Success: Restocked ${qty} units of ${item.name}. Cost: $${cost.toLocaleString()}`);
    }
}

export function adjustInventoryCount(itemId: string, newCount: number) {
    const item = state.inventoryItems.find(i => i.id === itemId);
    if (item) {
        const diff = newCount - item.qty;
        item.qty = newCount;
        item.lastChecked = Date.now();
        logActivity(item.projectId, undefined, `Inventory Audit`, `Cycle Count Adjustment on ${item.name}: count changed by ${diff > 0 ? '+' : ''}${diff} units.`);
        notifyStateChange();
    }
}

export function closeFinancialMonth(pid: string, month: string) {
    logActivity(pid, undefined, `Financial Close`, `Campaign ledger closed for ${month}. Campaign accounts locked.`);
    notifyStateChange();
    alert(`Success: Campaign accounts for ${month} have been closed and locked!`);
}

export function addCandidate(name: string, role: string, email: string) {
    const newCand = {
        id: 'cand-' + Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        role: role.trim(),
        email: email.trim(),
        status: 'applied' as const
    };
    state.candidates.push(newCand);
    logActivity(undefined, undefined, `HR recruiting`, `Logged application for ${name} as ${role}.`);
    notifyStateChange();
    alert(`Success: Candidate application registered!`);
}

export function hireCreator(candidateId: string) {
    const cand = state.candidates.find(c => c.id === candidateId);
    if (cand) {
        cand.status = 'hired';
        
        const newEmp: EmployeeRecord = {
            id: 'emp-' + Math.random().toString(36).substr(2, 9),
            name: cand.name,
            role: cand.role,
            salary: cand.role.includes('Editor') ? 4000 : 3200,
            taxRate: 0.12,
            paymentStatus: 'unpaid',
            onboardingTasks: [
                { task: 'Sign NDA / Contractor Agreement', completed: false },
                { task: 'Configure Google Workspace Channel Access', completed: false },
                { task: 'Verify Bank Routing Details', completed: false }
            ],
            joinedDate: new Date().toISOString().split('T')[0] || ''
        };
        state.employees.push(newEmp);
        logActivity(undefined, undefined, `HR Hiring`, `Hired candidate ${cand.name} as ${cand.role}. Onboarding checklist triggered.`);
        notifyStateChange();
        alert(`Success: Hired ${cand.name}! Creator onboarding checklist initialized.`);
    }
}

export function completeOnboardingTask(empId: string, taskIndex: number, completed: boolean) {
    const emp = state.employees.find(e => e.id === empId);
    if (emp && emp.onboardingTasks[taskIndex]) {
        emp.onboardingTasks[taskIndex].completed = completed;
        notifyStateChange();
    }
}

export function runMonthlyPayroll(empId: string) {
    const emp = state.employees.find(e => e.id === empId);
    if (emp) {
        emp.paymentStatus = 'paid';
        const netPay = emp.salary * (1 - emp.taxRate);
        
        let budgetTable = state.tables.find(t => t.id === 'tbl-budget');
        if (budgetTable) {
            const rowId = 'row-' + Math.random().toString(36).substr(2, 9);
            budgetTable.rows.push({
                id: rowId,
                cells: {
                    'f-desc': `Payroll Run: ${emp.name} (${emp.role})`,
                    'f-category': 'Contractors',
                    'f-amount': emp.salary,
                    'f-date': new Date().toISOString().split('T')[0]
                }
            });
        }
        
        logActivity(undefined, undefined, `HR Payroll`, `Payroll executed for ${emp.name}. Total Gross: $${emp.salary.toLocaleString()}, Net: $${netPay.toLocaleString()}`);
        notifyStateChange();
        alert(`Success: Payroll processed for ${emp.name}. Gross paid: $${emp.salary.toLocaleString()}`);
    }
}

export function createSupportCase(pid: string, contactId: string, title: string, description: string, priority: SupportCase['priority']) {
    const newCase: SupportCase = {
        id: 'sc-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        contactId,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'new',
        slaDeadline: Date.now() + (priority === 'critical' ? 2 * 3600 * 1000 : priority === 'high' ? 4 * 3600 * 1000 : 12 * 3600 * 1000),
        comments: [],
        created: Date.now()
    };
    state.supportCases.push(newCase);
    notifyStateChange();
    return newCase.id;
}

export function addCaseComment(caseId: string, text: string) {
    const cs = state.supportCases.find(c => c.id === caseId);
    if (cs) {
        cs.comments.push({
            author: state.currentUser ? (state.currentUser.split('@')[0] || 'Agent') : 'Agent',
            text: text.trim(),
            timestamp: Date.now()
        });
        cs.status = 'working';
        notifyStateChange();
    }
}

export function resolveSupportCase(caseId: string) {
    const cs = state.supportCases.find(c => c.id === caseId);
    if (cs) {
        cs.status = 'resolved';
        notifyStateChange();
        alert("Case resolved successfully!");
    }
}

export function resetAppState() {
    localStorage.clear();
    location.reload();
}
