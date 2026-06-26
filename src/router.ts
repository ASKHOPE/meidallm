import { renderProjectsView } from "./views/projects";
import { renderWorkspaceView } from "./views/workspace";
import { renderKanbanView } from "./views/kanban";
import { renderIdeasView } from "./views/ideas";
import { renderResearchView } from "./views/research";
import { renderMediaView } from "./views/media";
import { renderDraftsView } from "./views/drafts";
import { renderSettingsView } from "./views/settings";
import { renderPublishView } from "./views/publish";
import { renderReviewView } from "./views/review";
import { renderSitRepView } from "./views/sitrep";
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
import { renderGanttView } from "./views/gantt";
import { renderWorkloadView } from "./views/workload";
import { renderTableView } from "./views/table-view";
import { renderAutomationsView } from "./views/automations";
import { renderFormsView } from "./views/forms";
import { renderProfileView } from "./views/profile";

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
    roles?: string[];
    render: (pid?: string) => string;
}

// Configurable accordion categories for sidebar layout
export const sidebarGroups: NavGroup[] = [
    { key: 'workflow', label: 'Campaign Workflow', open: true },
    { key: 'system', label: 'System & Operations', open: true },
    { key: 'admin', label: 'Administration', open: true }
];

// Global registry of application views
export const views: ViewConfig[] = [
    // Administration Group
    {
        key: 'admin-analytics',
        title: 'Usage & Analytics',
        icon: 'admin-analytics',
        scope: 'global',
        group: 'admin',
        roles: ['super_admin'],
        render: () => renderAdminAnalyticsView()
    },
    {
        key: 'admin-tenants',
        title: 'Tenants',
        icon: 'admin-tenants',
        scope: 'global',
        group: 'admin',
        roles: ['super_admin'],
        render: () => renderAdminTenantsView()
    },
    {
        key: 'admin-rbac',
        title: 'RBAC & Users',
        icon: 'admin-rbac',
        scope: 'global',
        group: 'admin',
        roles: ['super_admin', 'tenant_owner', 'tenant_admin'],
        render: () => renderAdminRBACView()
    },
    {
        key: 'admin-policies',
        title: 'Rules & Policies',
        icon: 'admin-policies',
        scope: 'global',
        group: 'admin',
        roles: ['super_admin', 'tenant_owner'],
        render: () => renderAdminPoliciesView()
    },
    {
        key: 'settings',
        title: 'Settings',
        icon: 'settings',
        scope: 'system',
        group: 'admin',
        render: () => renderSettingsView()
    },
    {
        key: 'profile',
        title: 'Profile Management',
        scope: 'system',
        group: 'admin',
        render: () => renderProfileView()
    },

    // Campaign Workflow Group
    {
        key: 'project-workspace',
        title: 'Workspace Overview',
        icon: 'project-workspace',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderWorkspaceView(pid || '')
    },
    {
        key: 'idea-canvas',
        title: 'Idea Canvas',
        icon: 'idea-canvas',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderIdeasView(pid || '')
    },
    {
        key: 'kanban-board',
        title: 'Task Kanban Board',
        icon: 'kanban-board',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderKanbanView(pid || '')
    },
    {
        key: 'gantt',
        title: 'Gantt Timeline',
        icon: 'gantt',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderGanttView(pid || '')
    },
    {
        key: 'workload',
        title: 'Team Workload',
        icon: 'workload',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderWorkloadView(pid || '')
    },
    {
        key: 'table-view',
        title: 'Table View',
        icon: 'table-view',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderTableView(pid || '')
    },
    {
        key: 'project-cycles',
        title: 'Cycles & Sprints',
        icon: 'project-cycles',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderCyclesView(pid || '')
    },
    {
        key: 'database-hub',
        title: 'Collaborative Databases',
        icon: 'database-hub',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderDatabaseView(pid || '')
    },
    {
        key: 'project-goals',
        title: 'Campaign Goals',
        icon: 'project-goals',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderGoalsView(pid || '')
    },
    {
        key: 'research',
        title: 'Research & RAG Engine',
        icon: 'research',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderResearchView(pid || '')
    },
    {
        key: 'media',
        title: 'Media Assets Studio',
        icon: 'media',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderMediaView(pid || '')
    },
    {
        key: 'drafts',
        title: 'Drafts & Compose',
        icon: 'drafts',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderDraftsView(pid || '')
    },
    {
        key: 'review',
        title: 'Review',
        icon: 'review',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderReviewView(pid || '')
    },
    {
        key: 'sitrep',
        title: 'Situation Report',
        icon: 'sitrep',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderSitRepView(pid || '')
    },
    {
        key: 'publish',
        title: 'Publish & Schedule',
        icon: 'publish',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderPublishView(pid || '')
    },
    {
        key: 'analytics',
        title: 'Campaign Analytics',
        icon: 'analytics',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderAnalyticsView(pid || '')
    },
    {
        key: 'automations',
        title: 'Workflow Automations',
        icon: 'settings',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderAutomationsView(pid || '')
    },
    {
        key: 'forms',
        title: 'Ingestion Forms',
        icon: 'connections',
        scope: 'project',
        group: 'workflow',
        render: (pid) => renderFormsView(pid || '')
    },

    // System & Operations Group
    {
        key: 'workspaces',
        title: 'Workspaces',
        icon: 'workspaces',
        scope: 'global',
        group: 'system',
        render: () => renderProjectsView()
    },
    {
        key: 'connections',
        title: 'Connections & API',
        icon: 'connections',
        scope: 'global',
        group: 'system',
        render: () => renderConnectionsView()
    },
    {
        key: 'crm',
        title: 'CRM Hub',
        icon: 'crm',
        scope: 'project',
        group: 'system',
        render: (pid) => renderCRMView(pid || '')
    },
    {
        key: 'project-erp',
        title: 'ERP & Budgeting',
        icon: 'project-erp',
        scope: 'project',
        group: 'system',
        render: (pid) => renderERPView(pid || '')
    },
    {
        key: 'time-tracking',
        title: 'Time Tracking',
        icon: 'time-tracking',
        scope: 'global',
        group: 'system',
        render: () => renderTimeTrackingView()
    },
    {
        key: 'team',
        title: 'Team Office',
        icon: 'team',
        scope: 'global',
        group: 'system',
        render: () => renderTeamView()
    },
    {
        key: 'client-portal',
        title: 'Client Portal',
        icon: 'client-portal',
        scope: 'project',
        group: 'system',
        roles: ['external_client', 'super_admin', 'tenant_owner', 'tenant_admin', 'manager', 'sales'],
        render: () => renderClientPortalView()
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk',
        icon: 'helpdesk',
        scope: 'project',
        group: 'system',
        render: () => renderHelpdeskView()
    }
];
