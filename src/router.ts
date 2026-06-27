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
import { renderAdminTenantsView, renderAdminOrgsView, renderAdminRBACView, renderAdminPoliciesView, renderAdminAnalyticsView } from "./views/admin";
import { renderClientPortalView } from "./views/client-portal";
import { renderHelpdeskView } from "./views/helpdesk";
import { renderInboxView } from "./views/inbox";
import { renderTimeTrackingView } from "./views/time-tracking";
import { renderGanttView } from "./views/gantt";
import { renderWorkloadView } from "./views/workload";
import { renderTableView } from "./views/table-view";
import { renderAutomationsView } from "./views/automations";
import { renderFormsView } from "./views/forms";
import { renderProfileView } from "./views/profile";

import { renderDiscoverHub, renderProjectsHub, renderCreateHub, renderDistributeHub, renderInsightsHub, renderDatabaseHub } from "./views/hubs";

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
    { key: 'hubs', label: 'Hubs', open: true },
    { key: 'organization', label: 'ORGANIZATION', open: true },
    { key: 'customer_platform', label: 'CUSTOMER & PLATFORM', open: true },
    { key: 'admin', label: 'ADMINISTRATION', open: true }
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
        key: 'admin-orgs',
        title: 'Organizations',
        icon: 'folder',
        scope: 'global',
        group: 'admin',
        roles: ['super_admin', 'tenant_owner', 'tenant_admin'],
        render: () => renderAdminOrgsView()
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
        icon: 'user',
        scope: 'system',
        group: 'admin',
        render: () => renderProfileView()
    },

    // Campaign Workflow Group (Hubs)
    {
        key: 'project-workspace',
        title: 'Workspace Overview',
        icon: 'project-workspace',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderWorkspaceView(pid || '')
    },
    {
        key: 'discover-hub',
        title: 'Discover',
        icon: 'idea-canvas',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderDiscoverHub(pid || '')
    },
    {
        key: 'projects-hub',
        title: 'Projects',
        icon: 'kanban-board',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderProjectsHub(pid || '')
    },
    {
        key: 'create-hub',
        title: 'Create',
        icon: 'media',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderCreateHub(pid || '')
    },
    {
        key: 'distribute-hub',
        title: 'Distribute',
        icon: 'publish',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderDistributeHub(pid || '')
    },
    {
        key: 'insights-hub',
        title: 'Insights',
        icon: 'analytics',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderInsightsHub(pid || '')
    },
    {
        key: 'database-hub',
        title: 'Database',
        icon: 'database-hub',
        scope: 'project',
        group: 'hubs',
        render: (pid) => renderDatabaseHub(pid || '')
    },

    // System & Operations Group
    {
        key: 'workspaces',
        title: 'Workspaces',
        icon: 'workspaces',
        scope: 'global',
        group: 'organization',
        render: () => renderProjectsView()
    },
    {
        key: 'inbox',
        title: 'Inbox',
        icon: 'inbox',
        scope: 'system',
        group: 'hidden',
        render: () => renderInboxView()
    },
    {
        key: 'connections',
        title: 'Connections & API',
        icon: 'connections',
        scope: 'global',
        group: 'customer_platform',
        render: () => renderConnectionsView()
    },
    {
        key: 'crm',
        title: 'CRM Hub',
        icon: 'crm',
        scope: 'project',
        group: 'organization',
        render: (pid) => renderCRMView(pid || '')
    },
    {
        key: 'project-erp',
        title: 'ERP & Budgeting',
        icon: 'project-erp',
        scope: 'project',
        group: 'organization',
        render: (pid) => renderERPView(pid || '')
    },
    {
        key: 'time-tracking',
        title: 'Time Tracking',
        icon: 'time-tracking',
        scope: 'global',
        group: 'organization',
        render: () => renderTimeTrackingView()
    },
    {
        key: 'team',
        title: 'Team Office',
        icon: 'team',
        scope: 'global',
        group: 'organization',
        render: () => renderTeamView()
    },
    {
        key: 'client-portal',
        title: 'Client Portal',
        icon: 'client-portal',
        scope: 'project',
        group: 'customer_platform',
        roles: ['external_client', 'super_admin', 'tenant_owner', 'tenant_admin', 'manager', 'sales'],
        render: () => renderClientPortalView()
    },
    {
        key: 'helpdesk',
        title: 'Helpdesk',
        icon: 'helpdesk',
        scope: 'global',
        group: 'hidden',
        render: () => renderHelpdeskView()
    }
];
