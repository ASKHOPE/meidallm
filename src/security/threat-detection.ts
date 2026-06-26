// Threat Detection Engine — Phase 6
// Client-side anomaly detection, brute force protection, session fingerprinting

import { recordAudit } from './audit-log';

const BRUTE_FORCE_KEY = 'meidallm_login_attempts';
const SESSION_FP_KEY = 'meidallm_session_fp';
const ANOMALY_KEY = 'meidallm_anomaly_flags';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const ANOMALY_THRESHOLDS = {
    bulkExport: 3,           // 3+ exports in 5 min
    rapidTenantSwitch: 5,    // 5+ tenant switches in 2 min
    massDelete: 10,           // 10+ deletes in 1 min
};

// --- Brute Force Detection ---
interface LoginAttempt {
    timestamp: number;
    success: boolean;
}

export function recordLoginAttempt(tenantId: string, userId: string, success: boolean): boolean {
    const attempts = getLoginAttempts();
    attempts.push({ timestamp: Date.now(), success });

    // Trim old attempts
    const cutoff = Date.now() - LOCKOUT_WINDOW_MS;
    const recent = attempts.filter(a => a.timestamp > cutoff);
    localStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(recent));

    const failures = recent.filter(a => !a.success).length;
    if (failures >= MAX_LOGIN_ATTEMPTS) {
        recordAudit(tenantId, userId, 'login_failed', 'auth', `Account locked after ${failures} failed attempts`, 'critical');
        return false; // Account locked
    }
    return true; // Account not locked
}

function getLoginAttempts(): LoginAttempt[] {
    try { return JSON.parse(localStorage.getItem(BRUTE_FORCE_KEY) || '[]'); }
    catch { return []; }
}

export function isAccountLocked(): boolean {
    const cutoff = Date.now() - LOCKOUT_WINDOW_MS;
    const recent = getLoginAttempts().filter(a => a.timestamp > cutoff);
    return recent.filter(a => !a.success).length >= MAX_LOGIN_ATTEMPTS;
}

export function getRemainingLockoutMs(): number {
    const attempts = getLoginAttempts().filter(a => !a.success);
    if (attempts.length < MAX_LOGIN_ATTEMPTS) return 0;
    const oldest = attempts[attempts.length - MAX_LOGIN_ATTEMPTS]!;
    return Math.max(0, (oldest.timestamp + LOCKOUT_WINDOW_MS) - Date.now());
}

// --- Session Fingerprinting ---
interface SessionFingerprint {
    userAgent: string;
    timezone: string;
    screenRes: string;
    language: string;
    hash: string;
}

function computeFingerprint(): SessionFingerprint {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    const scr = typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '0x0';
    const lang = typeof navigator !== 'undefined' ? navigator.language : 'en';

    // Simple hash
    const raw = `${ua}|${tz}|${scr}|${lang}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
    }
    return { userAgent: ua, timezone: tz, screenRes: scr, language: lang, hash: hash.toString(16) };
}

export function initSessionFingerprint(tenantId: string, userId: string): void {
    if (typeof window === 'undefined') return;

    const current = computeFingerprint();
    const stored = localStorage.getItem(SESSION_FP_KEY);

    if (stored) {
        try {
            const previous = JSON.parse(stored) as SessionFingerprint;
            if (previous.hash !== current.hash) {
                recordAudit(tenantId, userId, 'suspicious_activity', 'session',
                    `Session fingerprint changed: ${previous.hash} → ${current.hash}. UA/TZ/Screen may have changed.`,
                    'warning'
                );
            }
        } catch { /* first time */ }
    }

    localStorage.setItem(SESSION_FP_KEY, JSON.stringify(current));
}

// --- Anomaly Detection ---
interface AnomalyCounter {
    type: string;
    timestamps: number[];
}

function getAnomalyCounters(): AnomalyCounter[] {
    try { return JSON.parse(localStorage.getItem(ANOMALY_KEY) || '[]'); }
    catch { return []; }
}

function saveAnomalyCounters(counters: AnomalyCounter[]): void {
    localStorage.setItem(ANOMALY_KEY, JSON.stringify(counters));
}

export function recordAnomaly(
    tenantId: string,
    userId: string,
    type: 'bulkExport' | 'rapidTenantSwitch' | 'massDelete',
    windowMs: number = 5 * 60 * 1000
): boolean {
    const counters = getAnomalyCounters();
    let counter = counters.find(c => c.type === type);
    if (!counter) {
        counter = { type, timestamps: [] };
        counters.push(counter);
    }

    const now = Date.now();
    counter.timestamps = counter.timestamps.filter(t => now - t < windowMs);
    counter.timestamps.push(now);
    saveAnomalyCounters(counters);

    const threshold = ANOMALY_THRESHOLDS[type] || 5;
    if (counter.timestamps.length >= threshold) {
        recordAudit(tenantId, userId, 'suspicious_activity', `anomaly:${type}`,
            `${type} threshold breached: ${counter.timestamps.length} events in ${Math.round(windowMs / 1000)}s window`,
            'critical'
        );
        return true; // Anomaly detected
    }
    return false;
}

// --- Threat Summary ---
export interface ThreatSummary {
    accountLocked: boolean;
    lockoutRemainingMs: number;
    recentFailedLogins: number;
    anomaliesDetected: number;
    sessionFingerprintChanged: boolean;
    criticalAuditCount: number;
}

export function getThreatSummary(): ThreatSummary {
    const cutoff = Date.now() - LOCKOUT_WINDOW_MS;
    const loginAttempts = getLoginAttempts().filter(a => a.timestamp > cutoff);
    const anomalies = getAnomalyCounters();
    const totalAnomaly = anomalies.reduce((sum, c) => sum + c.timestamps.length, 0);

    let fpChanged = false;
    try {
        const stored = JSON.parse(localStorage.getItem(SESSION_FP_KEY) || '{}');
        const current = computeFingerprint();
        fpChanged = stored.hash !== undefined && stored.hash !== current.hash;
    } catch { /* ignore */ }

    return {
        accountLocked: isAccountLocked(),
        lockoutRemainingMs: getRemainingLockoutMs(),
        recentFailedLogins: loginAttempts.filter(a => !a.success).length,
        anomaliesDetected: totalAnomaly,
        sessionFingerprintChanged: fpChanged,
        criticalAuditCount: 0 // Filled by caller from audit log
    };
}
