/**
 * timerSync.ts
 * 
 * Hybrid timer sync service:
 * - localStorage is ALWAYS the source of truth for the UI
 * - PostgreSQL (via /api/timers) receives background syncs
 * - All writes go to localStorage first, then queue for sync
 * - If offline, queued operations retry automatically on reconnect
 */

const API = '/api/timers';

// ─── QUEUE ──────────────────────────────────────────────────────────────────
// Persist pending ops to localStorage so they survive page refresh
const QUEUE_KEY = 'timer_sync_queue';

interface SyncOp {
    id: string;
    action: string;
    payload: Record<string, any>;
    attempts: number;
    createdAt: number;
}

function loadQueue(): SyncOp[] {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); }
    catch { return []; }
}

function saveQueue(q: SyncOp[]) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function enqueue(action: string, payload: Record<string, any>) {
    const q = loadQueue();
    q.push({ id: crypto.randomUUID(), action, payload, attempts: 0, createdAt: Date.now() });
    saveQueue(q);
    // Try immediately
    flushQueue();
}

// ─── FLUSH ──────────────────────────────────────────────────────────────────
let flushing = false;

export async function flushQueue() {
    if (flushing || !navigator.onLine) return;
    flushing = true;

    const q = loadQueue();
    const remaining: SyncOp[] = [];

    for (const op of q) {
        try {
            const res = await fetch(API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: op.action, ...op.payload }),
                signal: AbortSignal.timeout(8000)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                // Server-side error (4xx) — don't retry, drop it
                if (res.status < 500) {
                    console.warn(`[timerSync] Dropped op ${op.action}:`, err);
                    continue;
                }
                // 5xx — retry later
                op.attempts++;
                if (op.attempts < 5) remaining.push(op);
            }
            // Success — don't add back to queue
        } catch (e) {
            // Network error — retry later
            op.attempts++;
            if (op.attempts < 5) remaining.push(op);
        }
    }

    saveQueue(remaining);
    flushing = false;
}

// ─── ONLINE/OFFLINE LISTENERS ────────────────────────────────────────────────
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        console.log('[timerSync] Back online — flushing queue');
        flushQueue();
    });
    window.addEventListener('offline', () => {
        console.log('[timerSync] Offline — ops will queue locally');
    });

    // Also flush on visibility change (tab focused back)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') flushQueue();
    });
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/**
 * Called when user clicks "Start Timer"
 * localStorage is updated by main.ts BEFORE this is called.
 */
export function syncTimerStart(payload: {
    id: string;
    userId: string;
    userEmail?: string;
    orgId?: string;
    teamId?: string;
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskTitle?: string;
    description?: string;
    billable?: boolean;
    startTime: number;
}) {
    enqueue('start', payload);
}

/**
 * Called when user clicks "Stop & Save"
 */
export function syncTimerStop(payload: {
    id: string;
    userId: string;
    endTime: number;
    durationMs: number;
}) {
    enqueue('stop', payload);
}

/**
 * Called when user clicks "Discard"
 */
export function syncTimerDiscard(payload: { id: string; userId: string }) {
    enqueue('discard', payload);
}

/**
 * Sync a manual time log entry to the DB
 */
export function syncManualLog(log: Record<string, any>) {
    enqueue('sync-log', { log });
}

/**
 * Approve or reject a time log (managers only)
 */
export function syncApproval(logId: string, approve: boolean, approvedBy: string) {
    enqueue(approve ? 'approve' : 'reject', { logId, approvedBy });
}

/**
 * Fetch the active timer from server on page load (to detect stale sessions
 * from another device or a crash that left a timer running in the DB).
 */
export async function fetchActiveTimer(userId: string): Promise<{
    id: string;
    startTime: string;
    projectId?: string;
    projectName?: string;
    taskId?: string;
    taskTitle?: string;
    description?: string;
    billable?: boolean;
} | null> {
    if (!navigator.onLine) return null;
    try {
        const res = await fetch(`${API}?action=active&userId=${encodeURIComponent(userId)}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.timer || null;
    } catch {
        return null;
    }
}

/**
 * Sync all unsynced local logs to the DB.
 * Call this on app load so any offline-created entries get persisted.
 */
export async function syncAllLocalLogs(logs: any[]) {
    if (!navigator.onLine) return;
    // Only sync logs that don't have a server copy yet
    // We track synced IDs in localStorage to avoid duplicate syncs
    const syncedKey = 'synced_log_ids';
    let synced: string[] = [];
    try { synced = JSON.parse(localStorage.getItem(syncedKey) || '[]'); }
    catch { synced = []; }

    const toSync = logs.filter(l => !synced.includes(l.id));
    for (const log of toSync) {
        enqueue('sync-log', { log });
        synced.push(log.id);
    }
    // Trim to last 500 to avoid unbounded growth
    if (synced.length > 500) synced = synced.slice(-500);
    localStorage.setItem(syncedKey, JSON.stringify(synced));

    flushQueue();
}
