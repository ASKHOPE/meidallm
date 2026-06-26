// Telemetry Collector — Phase 1
// In-memory event buffer with localStorage flush, session tracking, rage-click detection

import type { TelemetryEvent, TelemetryEventType, SessionMeta, TelemetryAggregate } from './events';
import { scrubPII, pseudonymizeUserId } from './privacy';

const STORAGE_KEY = 'meidallm_telemetry';
const AGGREGATES_KEY = 'meidallm_telemetry_agg';
const SESSION_KEY = 'meidallm_session';
const BUFFER_FLUSH_SIZE = 50;
const FLUSH_INTERVAL_MS = 30_000;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 min inactivity = new session
const RAGE_CLICK_THRESHOLD = 3;
const RAGE_CLICK_WINDOW_MS = 2000;

let eventBuffer: TelemetryEvent[] = [];
let currentSession: SessionMeta | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let lastActivityTime = Date.now();

// Rage click tracking
const clickTracker = new Map<string, number[]>();

function generateId(): string {
    return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId(): string {
    return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Start or resume a session
export function ensureSession(tenantId: string, userId: string): SessionMeta {
    const now = Date.now();
    if (currentSession && (now - lastActivityTime) < SESSION_TIMEOUT_MS) {
        lastActivityTime = now;
        return currentSession;
    }
    // End previous session
    if (currentSession) {
        currentSession.endTime = lastActivityTime;
        saveSessionMeta(currentSession);
    }
    // Start new
    currentSession = {
        sessionId: generateSessionId(),
        startTime: now,
        endTime: null,
        pageViews: 0,
        featureUses: 0,
        rageClicks: 0
    };
    lastActivityTime = now;

    trackEvent(tenantId, userId, 'SessionStarted', {});
    return currentSession;
}

// Core event tracking
export function trackEvent(
    tenantId: string,
    rawUserId: string,
    eventType: TelemetryEventType,
    properties: Record<string, string | number | boolean>
): void {
    if (!tenantId) return;

    // Check consent
    const consent = localStorage.getItem('meidallm_privacy_consent');
    if (consent === 'false') return;

    const userId = pseudonymizeUserId(rawUserId);
    const session = currentSession || ensureSession(tenantId, rawUserId);

    // Scrub PII from properties
    const cleanProps = scrubPII(properties);

    const event: TelemetryEvent = {
        id: generateId(),
        tenantId,
        userId,
        sessionId: session.sessionId,
        eventType,
        timestamp: Date.now(),
        properties: cleanProps
    };

    eventBuffer.push(event);

    // Update session counters
    if (eventType === 'PageViewed') session.pageViews++;
    if (eventType === 'FeatureUsed') session.featureUses++;
    if (eventType === 'RageClick') session.rageClicks++;

    lastActivityTime = Date.now();

    // Auto-flush if buffer is full
    if (eventBuffer.length >= BUFFER_FLUSH_SIZE) {
        flushBuffer();
    }
}

// Rage click detection
export function trackClick(elementId: string, tenantId: string, userId: string): void {
    const now = Date.now();
    const clicks = clickTracker.get(elementId) || [];

    // Remove old clicks outside window
    const recent = clicks.filter(t => now - t < RAGE_CLICK_WINDOW_MS);
    recent.push(now);
    clickTracker.set(elementId, recent);

    if (recent.length >= RAGE_CLICK_THRESHOLD) {
        trackEvent(tenantId, userId, 'RageClick', {
            element: elementId,
            clickCount: recent.length
        });
        clickTracker.delete(elementId); // Reset after logging
    }
}

// Flush buffer to localStorage
export function flushBuffer(): void {
    if (eventBuffer.length === 0) return;

    try {
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as TelemetryEvent[];
        const combined = [...existing, ...eventBuffer];

        // Keep only last 10,000 events to prevent storage bloat
        const trimmed = combined.slice(-10000);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        eventBuffer = [];
    } catch {
        // Storage full or quota exceeded — drop oldest events
        eventBuffer = eventBuffer.slice(-100);
    }
}

function saveSessionMeta(session: SessionMeta): void {
    try {
        const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]') as SessionMeta[];
        sessions.push(session);
        // Keep last 500 sessions
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(-500)));
    } catch { /* ignore */ }
}

// Get stored events (for analytics dashboard)
export function getStoredEvents(): TelemetryEvent[] {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

// Get stored sessions
export function getStoredSessions(): SessionMeta[] {
    try {
        return JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');
    } catch {
        return [];
    }
}

// Compute daily aggregates
export function computeAggregates(tenantId: string): TelemetryAggregate[] {
    const events = getStoredEvents().filter(e => e.tenantId === tenantId);
    const byDate = new Map<string, TelemetryEvent[]>();

    for (const e of events) {
        const date = new Date(e.timestamp).toISOString().split('T')[0]!;
        if (!byDate.has(date)) byDate.set(date, []);
        byDate.get(date)!.push(e);
    }

    const aggregates: TelemetryAggregate[] = [];
    for (const [date, dayEvents] of byDate) {
        const users = new Set(dayEvents.map(e => e.userId));
        const sessions = new Set(dayEvents.filter(e => e.eventType === 'SessionStarted').map(e => e.sessionId));
        const featureUses: Record<string, number> = {};
        for (const e of dayEvents.filter(ev => ev.eventType === 'FeatureUsed')) {
            const feat = String(e.properties.feature || 'unknown');
            featureUses[feat] = (featureUses[feat] || 0) + 1;
        }

        aggregates.push({
            date,
            tenantId,
            dau: users.size,
            sessions: sessions.size,
            avgSessionDurationMs: 0, // Computed from session meta separately
            topFeatures: featureUses,
            rageClickCount: dayEvents.filter(e => e.eventType === 'RageClick').length,
            errorCount: dayEvents.filter(e => e.eventType === 'ErrorOccurred').length
        });
    }

    return aggregates.sort((a, b) => a.date.localeCompare(b.date));
}

// Initialize collector (call once on app boot)
export function initTelemetry(): void {
    if (typeof window === 'undefined') return;

    // Periodic flush
    flushTimer = setInterval(flushBuffer, FLUSH_INTERVAL_MS);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
        if (currentSession) {
            currentSession.endTime = Date.now();
            saveSessionMeta(currentSession);
        }
        flushBuffer();
    });

    // Global click listener for rage-click detection
    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const id = target.id || target.closest('[id]')?.id || target.tagName;
        if (id) {
            const tenantId = localStorage.getItem('meidallm_active_tenant') || '';
            const userId = localStorage.getItem('meidallm_current_user') || '';
            trackClick(id, tenantId, userId);
        }
    });
}

// Cleanup
export function destroyTelemetry(): void {
    if (flushTimer) clearInterval(flushTimer);
    flushBuffer();
}
