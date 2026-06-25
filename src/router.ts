import { renderProjectsView } from "./views/projects";
import { renderWorkspaceView } from "./views/workspace";
import { renderKanbanView } from "./views/kanban";
import { renderIdeasView } from "./views/ideas";
import { renderResearchView } from "./views/research";
import { renderMediaView } from "./views/media";
import { renderDraftsView } from "./views/drafts";
import { renderSettingsView } from "./views/settings";
import { renderPublishView } from "./views/publish";
import { renderAnalyticsView } from "./views/analytics";
import { renderConnectionsView } from "./views/connections";
import { renderCRMView } from "./views/crm";
import { renderERPView } from "./views/erp";
import { renderTeamView } from "./views/team";
import { renderDatabaseView } from "./views/database";
import { renderCyclesView } from "./views/cycles";
import { renderGoalsView } from "./views/goals";
import { renderAdminTenantsView, renderAdminRBACView, renderAdminPoliciesView, renderAdminAnalyticsView } from "./views/admin";
import { renderClientPortalView } from "./views/client-portal";
import { renderHelpdeskView } from "./views/helpdesk";
import { renderTimeTrackingView } from "./views/time-tracking";

export interface NavGroup {
    key: string;
    label: string;
    open: boolean;
}

export interface ViewConfig {
    key: string;
    title: string;
    icon?: string;
    scope: 'global' | 'project' | 'system';
    group: string;
    render: (pid?: string) => string;
}

// Configurable accordion categories for sidebar layout
export const sidebarGroups: NavGroup[] = [
    { key: 'workflow', label: 'Campaign Workflow', open: true },
    { key: 'system', label: 'System', open: true },
    { key: 'admin', label: 'Super Admin Workspace', open: true }
];

// Global registry of application views
export const views: ViewConfig[] = [
    {
        key: 'admin-analytics',
        title: 'Usage & Analytics',
        icon: '📈',
        scope: 'global',
        group: 'admin',
        render: () => renderAdminAnalyticsView()
    },
    {
        key: 'admin-tenants',
        title: 'Tenants',
        icon: '🏢',
        scope: 'global',
        group: 'admin',
        render: () => renderAdminTenantsView()
    },
    {
        key: 'admin-rbac',
        title: 'RBAC & Users',
        icon: '🛡️',
        scope: 'global',
        group: 'admin',
        render: () => renderAdminRBACView()
    },
    {
        key: 'admin-policies',
        title: 'Rules & Policies',
        icon: '⚖️',
        scope: 'global',
        group: 'admin',
        render: () => renderAdminPoliciesView()
    },
    {
        key: 'workspaces',
        title: 'Workspaces',
        icon: '📂',
        scope: 'global',
        group: 'workflow',
        render: () => renderProjectsView()
    },
    {
        key: 'project-workspace',
        title: 'Project Workspace',
        scope: 'global',
        group: 'workflow',
        render: (pid) => renderWorkspaceView(pid || '')
    },
    {
        key: 'idea-canvas',
        title: 'Idea Canvas',
        icon: '💡',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderIdeasView(pid || '')
    },
    {
        key: 'kanban-board',
        title: 'Task Kanban Board',
        icon: '📋',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderKanbanView(pid || '')
    },
    {
        key: 'project-cycles',
        title: 'Cycles & Sprints',
        icon: '⚡',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderCyclesView(pid || '')
    },
    {
        key: 'database-hub',
        title: 'Collaborative Databases',
        icon: '📊',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderDatabaseView(pid || '')
    },
    {
        key: 'project-goals',
        title: 'Campaign Goals',
        icon: '🎯',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderGoalsView(pid || '')
    },
    {
        key: 'research',
        title: 'Research & RAG Engine',
        icon: '🔍',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderResearchView(pid || '')
    },
    {
        key: 'media',
        title: 'Media Assets Studio',
        icon: '🖼️',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderMediaView(pid || '')
    },
    {
        key: 'drafts',
        title: 'Drafts & Compose',
        icon: '📝',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderDraftsView(pid || '')
    },
    {
        key: 'publish',
        title: 'Publish & Schedule',
        icon: '📢',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderPublishView(pid || '')
    },
    {
        key: 'analytics',
        title: 'Campaign Analytics',
        icon: '📊',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderAnalyticsView(pid || '')
    },
    {
        key: 'connections',
        title: 'Connections & API',
        icon: '🔌',
        scope: 'global',
        group: 'workflow',
        render: () => renderConnectionsView()
    },
    {
        key: 'crm',
        title: 'CRM Hub',
        icon: '💼',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderCRMView(pid || '')
    },
    {
        key: 'project-erp',
        title: 'ERP & Budgeting',
        icon: '📈',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderERPView(pid || '')
    },
    {
        key: 'time-tracking',
        title: 'Time Tracking',
        icon: '⏰',
        scope: 'global',
        group: 'workflow',
        render: () => renderTimeTrackingView()
    },
    {
        key: 'team',
        title: 'Team Office',
        icon: '👥',
        scope: 'global',
        group: 'workflow',
        render: () => renderTeamView()
    },
    {
        key: 'settings',
        title: 'Settings',
        icon: '⚙️',
        scope: 'system',
        group: 'footer',
        render: () => renderSettingsView()
    },
    {
        key: 'client-portal',
        title: 'Client Portal',
        icon: '🔗',
        scope: 'project',
        group: 'workflow',
        render: () => renderClientPortalView()
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk',
        icon: '🎫',
        scope: 'project',
        group: 'workflow',
        render: () => renderHelpdeskView()
    }
];
