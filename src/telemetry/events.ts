// Telemetry Event Definitions — Phase 1
// All events carry tenant_id automatically from state.activeTenantId

export type TelemetryEventType =
    | 'PageViewed'
    | 'FeatureUsed'
    | 'ButtonClicked'
    | 'SessionStarted'
    | 'SessionEnded'
    | 'TaskCreated'
    | 'TaskStatusChanged'
    | 'DraftPublished'
    | 'DraftCreated'
    | 'DealStageChanged'
    | 'ProjectCreated'
    | 'ProjectSwitched'
    | 'SearchPerformed'
    | 'RageClick'
    | 'ErrorOccurred'
    | 'LoginAttempt'
    | 'RoleSwitched'
    | 'TenantSwitched'
    | 'ExportRequested'
    | 'SettingsChanged';

export interface TelemetryEvent {
    id: string;
    tenantId: string;
    userId: string;           // Pseudonymized hash, never raw PII
    sessionId: string;
    eventType: TelemetryEventType;
    timestamp: number;
    properties: Record<string, string | number | boolean>;
}

export interface SessionMeta {
    sessionId: string;
    startTime: number;
    endTime: number | null;
    pageViews: number;
    featureUses: number;
    rageClicks: number;
}

export interface TelemetryAggregate {
    date: string;             // YYYY-MM-DD
    tenantId: string;
    dau: number;              // distinct user count
    sessions: number;
    avgSessionDurationMs: number;
    topFeatures: Record<string, number>;  // feature_name → use_count
    rageClickCount: number;
    errorCount: number;
}

// Feature names for sidebar views
export const TRACKED_FEATURES = [
    'idea-canvas', 'kanban-board', 'project-cycles', 'database-hub',
    'project-goals', 'research', 'media', 'drafts', 'review', 'sitrep',
    'publish', 'analytics', 'workspaces', 'connections', 'crm',
    'project-erp', 'time-tracking', 'team', 'client-portal', 'helpdesk',
    'settings'
] as const;

export type TrackedFeature = typeof TRACKED_FEATURES[number];
