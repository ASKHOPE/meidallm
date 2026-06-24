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
    { key: 'system', label: 'System', open: true }
];

// Global registry of application views
export const views: ViewConfig[] = [
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
        key: 'settings',
        title: 'Settings',
        icon: '⚙️',
        scope: 'system',
        group: 'system',
        render: () => renderSettingsView()
    }
];
