import { z } from "zod";
import type { KanbanTask, Project, Idea, TaskLog, ResearchDoc, MediaAsset, Draft, Connection, PublishSchedule, Contact, TeamMember, Cycle, Module, DbField, DbRow, DbTable, Goal } from "./types";

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
    dealStage: z.enum(['lead', 'contacted', 'negotiation', 'won']),
    dealValue: z.number(),
    created: z.number()
});

export const TeamMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    role: z.string(),
    status: z.enum(['active', 'meeting', 'offline', 'vacation']),
    avatarColor: z.string()
});

export const TeamSchema = z.object({
    id: z.string(),
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
    cells: z.record(z.any())
});

export const DbTableSchema = z.object({
    id: z.string(),
    projectId: z.string(),
    name: z.string(),
    description: z.string(),
    fields: z.array(DbFieldSchema),
    rows: z.array(DbRowSchema)
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
    { id: 'c1', projectId: 'p1', name: 'Sarah Jenkins', email: 'sarah@stripe.com', company: 'Stripe', dealStage: 'contacted', dealValue: 12000, created: Date.now() - 86400000 * 4 },
    { id: 'c2', projectId: 'p1', name: 'Alex Rivera', email: 'alex@vercel.com', company: 'Vercel', dealStage: 'negotiation', dealValue: 25000, created: Date.now() - 86400000 * 2 },
    { id: 'c3', projectId: 'p1', name: 'Emily Chen', email: 'emily@notion.so', company: 'Notion', dealStage: 'lead', dealValue: 8000, created: Date.now() - 86400000 * 6 }
];

const DEFAULT_TEAM: TeamMember[] = [
    { id: 'tm1', name: 'Hosanna (You)', role: 'Product Architect', status: 'active', avatarColor: 'bg-indigo-500' },
    { id: 'tm2', name: 'Gavin Belson', role: 'Campaign Strategist', status: 'meeting', avatarColor: 'bg-rose-500' },
    { id: 'tm3', name: 'Richard Hendricks', role: 'Lead Developer', status: 'active', avatarColor: 'bg-emerald-500' },
    { id: 'tm4', name: 'Monica Hall', role: 'Agency Relations', status: 'vacation', avatarColor: 'bg-amber-500' }
];

const DEFAULT_TEAMS: Team[] = [
    { id: 't-1', name: 'Design & Copywriting', memberIds: ['tm1', 'tm3'], projectIds: ['p1'] },
    { id: 't-2', name: 'Marketing Strategy', memberIds: ['tm2', 'tm4'], projectIds: ['p2'] }
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

export const state = {
    currentUser: null as string | null,
    activeOrgId: null as string | null,
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
    
    // Extended States
    theme: 'night' as 'night' | 'day' | 'auto',
    connections: [] as Connection[],
    publishSchedules: [] as PublishSchedule[],
    workspacesSearchQuery: '',
    workspacesViewMode: 'grid' as 'grid' | 'list',
    workspacesSortBy: 'last-active' as 'last-active' | 'name-asc' | 'name-desc' | 'tasks-count',
    workspacesFilter: 'active' as 'active' | 'archived' | 'bin',
    kanbanFilter: 'active' as 'active' | 'archived' | 'bin',
    kanbanActiveCycleId: null as string | null,
    kanbanActiveModuleId: null as string | null,
    contacts: [] as Contact[],
    team: [] as TeamMember[],
    teams: [] as Team[],
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
            activityLogs: JSON.parse(localStorage.getItem('meidallm_activity') || 'null'),
            cycles: JSON.parse(localStorage.getItem('meidallm_cycles') || 'null'),
            modules: JSON.parse(localStorage.getItem('meidallm_modules') || 'null'),
            tables: JSON.parse(localStorage.getItem('meidallm_tables') || 'null'),
            goals: JSON.parse(localStorage.getItem('meidallm_goals') || 'null'),
            theme: localStorage.getItem('meidallm_theme'),
            kanbanViewMode: localStorage.getItem('meidallm_kanban_viewmode'),
            activeTableId: localStorage.getItem('meidallm_active_tableid'),
            databaseViewMode: localStorage.getItem('meidallm_database_viewmode')
        };
        applyDbState(local);
        
        state.activeOrgId = localStorage.getItem('meidallm_active_orgid');
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
    if (state.activityLogs.length === 0) state.activityLogs = [];
    if (state.cycles.length === 0) state.cycles = DEFAULT_CYCLES;
    if (state.modules.length === 0) state.modules = DEFAULT_MODULES;
    if (state.tables.length === 0) state.tables = DEFAULT_TABLES;
    if (state.goals.length === 0) state.goals = DEFAULT_GOALS;
    
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

export function saveState() {
    try {
        if (state.currentUser) {
            localStorage.setItem('meidallm_user', state.currentUser);
        } else {
            localStorage.removeItem('meidallm_user');
        }
        if (state.activeOrgId) {
            localStorage.setItem('meidallm_active_orgid', state.activeOrgId);
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
        localStorage.setItem('meidallm_activity', JSON.stringify(state.activityLogs));
        localStorage.setItem('meidallm_cycles', JSON.stringify(state.cycles));
        localStorage.setItem('meidallm_modules', JSON.stringify(state.modules));
        localStorage.setItem('meidallm_tables', JSON.stringify(state.tables));
        localStorage.setItem('meidallm_goals', JSON.stringify(state.goals));
        localStorage.setItem('meidallm_kanban_viewmode', state.kanbanViewMode);
        if (state.activeTableId) localStorage.setItem('meidallm_active_tableid', state.activeTableId);
        localStorage.setItem('meidallm_database_viewmode', state.databaseViewMode);

        // Async save to Postgres database
        if (state.currentUser && typeof window !== 'undefined') {
            if (!state.activeOrgId) {
                const parts = state.currentUser.split("@");
                state.activeOrgId = parts.length === 2 ? parts[1] : `personal-${parts[0]}`;
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

export function addContact(pid: string, name: string, email: string, company: string, dealStage: Contact['dealStage'], dealValue: number) {
    const newContact: Contact = {
        id: 'c-' + Math.random().toString(36).substr(2, 9),
        projectId: pid,
        name: name.trim(),
        email: email.trim(),
        company: company.trim(),
        dealStage,
        dealValue,
        created: Date.now()
    };
    state.contacts.push(newContact);
    logChange(pid, '', `Contact ${newContact.name}`, 'none', 'created_contact');
    notifyStateChange();
    return newContact.id;
}

export function updateContact(cid: string, name: string, email: string, company: string, dealStage: Contact['dealStage'], dealValue: number) {
    const contact = state.contacts.find(c => c.id === cid);
    if (contact) {
        contact.name = name.trim();
        contact.email = email.trim();
        contact.company = company.trim();
        contact.dealStage = dealStage;
        contact.dealValue = dealValue;
        logChange(contact.projectId, '', `Contact ${contact.name}`, 'edited', 'updated_contact');
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
    points?: number
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

export function resetAppState() {
    localStorage.clear();
    location.reload();
}
