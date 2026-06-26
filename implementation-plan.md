# MeidaLLM — Comprehensive Feature & Architecture Plan
## Synthesized from Deep Research Reports 3, 4, and 5

This plan distills the three research reports into a concrete, phased roadmap tailored to MeidaLLM's existing architecture (Astro + TypeScript SPA, client-side state, multi-tenant sidebar navigation, RBAC system).

---

## What the Reports Cover

| Report | Focus | Key Takeaways for Us |
|--------|-------|---------------------|
| **Report 3** | Product & usage metrics, privacy, multi-tenant security | Event tracking schema, data minimization, GDPR/CCPA controls, tenant isolation patterns |
| **Report 4** | SaaS analytics taxonomy (expanded) | Full event tables with SQL, retention policies, business metric formulas (CAC/MRR/LTV/TTV), data pipeline architecture, creator taxonomy |
| **Report 5** | ClickUp-grade feature spec | Workspace hierarchy, advanced task fields, views (Gantt/Workload/Mind Map), Docs/Wikis, Chat, Goals, Sprints, AI Agents, Automations, Forms, Whiteboards |

---

## Phase 1: Analytics Telemetry Layer
**Priority: HIGH — Foundation for all metrics**

### 1.1 Client-Side Event Bus

Create an event tracking system that captures user behavior without external dependencies:

#### [NEW] `src/telemetry/events.ts`
- Define a typed `TelemetryEvent` interface: `{ tenant_id, user_id, event_type, timestamp, properties, session_id }`
- Event types: `PageViewed`, `FeatureUsed`, `ButtonClicked`, `SessionStarted`, `SessionEnded`, `TaskCreated`, `DraftPublished`, `RageClick`
- All events carry `tenant_id` from `state.activeTenantId` automatically

#### [NEW] `src/telemetry/collector.ts`
- In-memory event buffer with flush-to-localStorage (since we're client-side)
- Batch flush every 30 seconds or on 50-event threshold
- Automatic session tracking (start/end based on activity timeout)
- Rage-click detection: 3+ clicks on same element within 2 seconds

#### [NEW] `src/telemetry/privacy.ts`
- PII scrubber that strips emails, names, and free-text content from event properties before storage
- Pseudonymize `user_id` using a salted hash
- Consent flag check: if `state.privacyConsent === false`, drop all non-essential events
- Data retention: auto-purge raw events older than 90 days, keep aggregates for 2 years

#### [MODIFY] `src/main.ts`
- Wire up the event bus to navigation clicks, view switches, and key actions
- Instrument: project creation, task status changes, draft publish, CRM deal stage changes

---

### 1.2 Analytics Dashboard Enhancement

#### [MODIFY] `src/views/analytics.ts`
Add new dashboard sections derived from collected telemetry:

| Widget | Data Source | Purpose |
|--------|-----------|---------|
| Feature Adoption Heatmap | `FeatureUsed` events | Which sidebar views get most traffic |
| Session Duration Chart | `SessionStarted/Ended` | Average time-in-app per day |
| Funnel: Idea → Publish | Multi-event correlation | Drop-off rates in content pipeline |
| User Activity Tiers | DAU/WAU/MAU counts | Engagement trend over time |
| Rage Click Log | `RageClick` events | UX frustration hotspots |

---

## Phase 2: Privacy, Security & Compliance Controls
**Priority: HIGH — Required for multi-tenant trust**

### 2.1 Privacy Settings Panel

#### [MODIFY] `src/views/settings.ts`
Add a "Privacy & Compliance" tab:
- **Data Minimization Toggle**: Enable/disable analytics collection
- **Consent Management**: Record user consent status with timestamp
- **Data Export**: "Download My Data" button → generates JSON of all user-associated state
- **Right to Erasure**: "Delete My Data" button → purges user-specific events, anonymizes remaining records
- **Retention Display**: Show current retention policy (90 days raw / 2 years aggregated)

### 2.2 Tenant Isolation Hardening

#### [MODIFY] `src/state.ts`
- Enforce `tenant_id` filtering on every state accessor
- Add `assertTenantScope(entityTenantId)` guard function that throws if entity doesn't belong to current tenant
- Add row-level security wrapper for state queries

#### [NEW] `src/security/audit-log.ts`
- Log all sensitive operations: login, role changes, data exports, permission changes, settings modifications
- Each audit entry: `{ tenant_id, user_id, action, resource, timestamp, ip_hint }`
- Viewable in Admin → Usage & Analytics panel (super_admin only)

### 2.3 Encryption & Token Security

#### [MODIFY] `src/middleware.ts`
- Add CSRF token generation and validation for all state-mutating operations
- Implement session token rotation on role/tenant switch
- Add Content-Security-Policy headers

---

## Phase 3: Enhanced Task Management (ClickUp-Grade)
**Priority: MEDIUM — Feature parity with modern PM tools**

### 3.1 Advanced Task Fields

#### [MODIFY] `src/types.ts` — Extend `KanbanTask`

```typescript
export interface KanbanTask {
    // ... existing fields ...
    
    // New from Report 5
    subtasks?: KanbanTask[];           // Nested subtasks (unlimited depth)
    checklists?: Checklist[];          // Lightweight todo lists
    dependencies?: Dependency[];        // Blocking/blocked-by relationships
    recurrence?: RecurrenceRule;        // Auto-recreate schedule
    relationships?: TaskRelationship[]; // relates-to, duplicate-of
    customFields?: CustomFieldValue[];  // User-defined fields
    isMilestone?: boolean;              // Diamond marker, no duration
    startDate?: string;                 // When work begins
    timeEstimate?: number;              // Estimated ms
    timeTracked?: number;               // Actual ms (rolled up from time logs)
    watchers?: string[];                // Members following this task
    attachments?: Attachment[];         // File uploads
    clips?: ScreenClip[];              // Screen recordings
}

export interface Checklist {
    id: string;
    name: string;
    items: { id: string; text: string; done: boolean }[];
}

export interface Dependency {
    taskId: string;
    type: 'blocks' | 'blocked-by' | 'waiting-on';
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
    interval: number;
    nextOccurrence: number;
}

export interface TaskRelationship {
    targetTaskId: string;
    type: 'relates-to' | 'duplicate-of';
}

export interface CustomFieldValue {
    fieldId: string;
    value: any;
}
```

### 3.2 New View Modes

#### [NEW] `src/views/gantt.ts`
- Horizontal timeline bars from `startDate` to `dueDate`
- Dependency arrows between task bars
- Drag edges to resize, drag bars to reschedule
- Critical path highlighting
- Milestone diamond markers

#### [NEW] `src/views/workload.ts`
- Per-team-member capacity view
- Bars fill based on `timeEstimate` vs available hours per day
- Color-coded: green (under), yellow (at capacity), red (overloaded)
- Drag tasks between members to rebalance

#### [NEW] `src/views/table.ts`
- Spreadsheet-style grid: every task = row, every field = column
- Inline editing for all field types
- Column-level aggregations (sum, average, count)
- Sortable and filterable

> [!NOTE]
> Mind Map and Map views from Report 5 are deferred to Phase 5 as they require canvas rendering libraries (e.g. Fabric.js or Canvas API).

### 3.3 Task Detail Panel Overhaul

#### [MODIFY] `src/views/kanban.ts`
The task detail slide-out panel gets a major upgrade:
- **Subtask tree**: Collapsible nested subtask list with inline add
- **Checklist section**: Multiple named checklists with progress bars
- **Dependencies panel**: Visual list of blocking/blocked tasks
- **Activity feed**: Chronological log of all changes (status, assignee, field edits)
- **Comment thread**: @mentions, rich text, file attachments
- **Custom fields**: Render dynamic fields based on configured field types
- **Time tracking widget**: Start/stop timer inline, manual entry

---

## Phase 4: Business Metrics Engine
**Priority: MEDIUM — Ties analytics to revenue**

### 4.1 Metric Computation Service

#### [NEW] `src/metrics/business.ts`

| Metric | Formula | Data Sources |
|--------|---------|-------------|
| **CAC** | `spend / new_customers` | `state.activityLogs` (campaign events) + ERP spend data |
| **MRR** | `Σ(active subscription prices)` | ERP `SalesInvoice` with recurring flag |
| **LTV** | `ARPU × (1 / churn_rate)` | Invoice history + churn events |
| **TTV** | `first_key_action_time - signup_time` | Telemetry `SessionStarted` + `FeatureUsed` |
| **Task Velocity** | `tasks_completed / cycle_duration` | `KanbanTask` status changes per `Cycle` |
| **Content Pipeline Rate** | `published / total_drafts` | `Draft.cmsStatus` + `PublishSchedule` |

### 4.2 SitRep Dashboard Integration

#### [MODIFY] `src/views/sitrep.ts`
- Add business metric cards (MRR trend, CAC, LTV)
- Add content pipeline funnel visualization
- Add team velocity sparkline per cycle
- Add "Health Score" composite metric (weighted average of key KPIs)

---

## Phase 5: AI & Automation Infrastructure
**Priority: LOW — Future-facing, requires backend services**

> [!IMPORTANT]
> These features from Report 5 (Brain, Super Agents, AI Notetaker) require a backend API. The current app is client-side only. This phase outlines the **client-side scaffolding** that would integrate with a future API.

### 5.1 Automation Rules Engine (Client-Side)

#### [NEW] `src/automation/engine.ts`
- Event-driven: listens to state mutations (task status change, due date arrival, etc.)
- Rule definition: `{ trigger, condition, action }`
- Trigger types: status_changed, priority_changed, due_date_passed, assignee_added, custom_field_changed
- Action types: change_status, change_priority, assign_to, create_subtask, post_comment, send_notification

#### [NEW] `src/views/automations.ts`
- Visual rule builder UI
- Pre-built templates: "When task done → notify manager", "When overdue → set priority urgent"
- Rule testing with dry-run preview

### 5.2 AI Assistant Enhancement

#### [MODIFY] `src/views/ai-assistant.ts`
- Add context-aware prompts: auto-include current project, view, and selected task
- AI summary generation: summarize all task comments + activity into a standup update
- AI draft generation: generate content drafts from task descriptions
- Status update generator: read all tasks in a project and produce a "what's done / in progress / blocked" report

### 5.3 Forms Builder (Report 5 §12)

#### [NEW] `src/views/forms.ts`
- Drag-and-drop form builder
- Field types: text, number, dropdown, date, file upload, email, phone, rating
- Submission → auto-creates a task in specified List/Project
- Shareable URL for external submissions

---

## Phase 6: Security Hardening & DDoS Protection
**Priority: HIGH — Complements existing rate limiting**

### 6.1 Enhanced Rate Limiting

#### [MODIFY] `src/middleware.ts`
- Per-tenant rate limits (not just global)
- Graduated response: warn → throttle → block → CAPTCHA challenge
- Separate limits for: API calls, login attempts, data exports, search queries

### 6.2 Threat Detection

#### [NEW] `src/security/threat-detection.ts`
- **Brute force detection**: Lock account after 5 failed login attempts in 10 minutes
- **Anomaly detection**: Flag unusual patterns (bulk data export, rapid tenant switching, mass deletion)
- **Session fingerprinting**: Detect session hijacking via User-Agent + timezone + screen resolution changes
- **CAPTCHA integration**: Trigger CAP puzzle (from the `cap` library already integrated) on suspicious activity

### 6.3 Compliance Audit Trail

#### [MODIFY] `src/views/admin.ts`
Add "Security Audit Log" panel to Admin → Usage & Analytics:
- Filterable timeline of all security events
- Export audit log as CSV/JSON
- Automated compliance report generation (GDPR Article 30 ROPA)

---

## Phase 7: Creator Taxonomy & CRM Integration
**Priority: LOW — Niche value-add from Report 4 §6**

### 7.1 Contact Segmentation by Creator Type

#### [MODIFY] `src/types.ts` — Extend `Contact`

```typescript
export interface Contact {
    // ... existing fields ...
    creatorType?: 'influencer' | 'micro-influencer' | 'vlogger' | 'podcaster' | 'live-streamer' | 'blogger' | 'digital-artist' | 'course-creator' | 'newsletter-writer' | 'affiliate-marketer' | 'community-manager' | 'ugc-creator';
    platforms?: string[];
    audienceDemographics?: string;
    monetizationModel?: string;
}
```

#### [MODIFY] `src/views/crm.ts`
- Add creator type filter/segment to CRM pipeline view
- Add platform badges on contact cards
- Add audience demographics info in contact detail panel

---

## Execution Priority Matrix

| Phase | Effort | Impact | Dependencies | Recommended Order |
|-------|--------|--------|-------------|-------------------|
| **Phase 1**: Analytics Telemetry | Medium | High | None | **1st** |
| **Phase 2**: Privacy & Security | Medium | Critical | Phase 1 | **2nd** |
| **Phase 6**: Security Hardening | Low | High | Phase 2 | **3rd** |
| **Phase 3**: Enhanced Tasks | High | High | None | **4th** |
| **Phase 4**: Business Metrics | Medium | Medium | Phase 1 | **5th** |
| **Phase 5**: AI & Automation | High | Medium | Backend API | **6th** |
| **Phase 7**: Creator Taxonomy | Low | Low | Phase 3 | **7th** |

---

## Open Questions

> [!IMPORTANT]
> **Backend API**: Phases 5 and parts of Phase 1 (persistent telemetry storage) assume a backend service exists or will be built. Currently the app is client-side with localStorage. Should we:
> - A) Build a lightweight Express/Fastify API alongside the Astro app?
> - B) Keep everything client-side with localStorage (limited scale)?
> - C) Use a third-party analytics service (Mixpanel, PostHog)?

> [!IMPORTANT]
> **Phase 3 Scope**: Report 5 lists ~25 ClickUp feature modules. I've selected the highest-impact ones (subtasks, dependencies, Gantt, workload, custom fields). Should we prioritize differently? E.g., should Docs/Wikis or Chat come before Gantt?

> [!WARNING]
> **Data Migration**: Adding new fields to `KanbanTask` and `Contact` will require a state migration strategy for existing localStorage data. The plan includes backward-compatible defaults so existing data won't break.

---

## Files Summary

| Action | File | Phase |
|--------|------|-------|
| NEW | `src/telemetry/events.ts` | 1 |
| NEW | `src/telemetry/collector.ts` | 1 |
| NEW | `src/telemetry/privacy.ts` | 1 |
| MODIFY | `src/main.ts` | 1 |
| MODIFY | `src/views/analytics.ts` | 1 |
| MODIFY | `src/views/settings.ts` | 2 |
| MODIFY | `src/state.ts` | 2 |
| NEW | `src/security/audit-log.ts` | 2 |
| MODIFY | `src/middleware.ts` | 2, 6 |
| MODIFY | `src/types.ts` | 3, 7 |
| NEW | `src/views/gantt.ts` | 3 |
| NEW | `src/views/workload.ts` | 3 |
| NEW | `src/views/table.ts` | 3 |
| MODIFY | `src/views/kanban.ts` | 3 |
| NEW | `src/metrics/business.ts` | 4 |
| MODIFY | `src/views/sitrep.ts` | 4 |
| NEW | `src/automation/engine.ts` | 5 |
| NEW | `src/views/automations.ts` | 5 |
| MODIFY | `src/views/ai-assistant.ts` | 5 |
| NEW | `src/views/forms.ts` | 5 |
| NEW | `src/security/threat-detection.ts` | 6 |
| MODIFY | `src/views/admin.ts` | 6 |
| MODIFY | `src/views/crm.ts` | 7 |
