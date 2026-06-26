// Privacy & PII Protection — Phase 1+2
// Scrubs sensitive data, pseudonymizes identifiers, enforces retention

const PII_PATTERNS = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,       // Email
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,                                // Phone
    /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,                                  // SSN-like
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,                  // Credit card
    /\b(?:password|passwd|pwd|secret|token|apikey|api_key)\s*[:=]\s*\S+/gi  // Secrets
];

const SENSITIVE_KEYS = new Set([
    'password', 'passwd', 'secret', 'token', 'apiKey', 'api_key',
    'creditCard', 'ssn', 'socialSecurity', 'bankAccount',
    'accessToken', 'refreshToken', 'privateKey'
]);

// FNV-1a 32-bit hash for pseudonymization (no crypto dependency needed client-side)
function fnv1a(str: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = (hash * 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, '0');
}

// Pseudonymize user ID — one-way hash with per-session salt
const SESSION_SALT = typeof window !== 'undefined'
    ? (sessionStorage.getItem('meidallm_salt') || (() => {
        const s = Math.random().toString(36).slice(2);
        sessionStorage.setItem('meidallm_salt', s);
        return s;
    })())
    : 'server-salt';

export function pseudonymizeUserId(rawId: string | null): string {
    if (!rawId) return 'anon_' + fnv1a('anonymous');
    return 'usr_' + fnv1a(rawId + SESSION_SALT);
}

// Scrub PII from event properties
export function scrubPII(
    properties: Record<string, string | number | boolean>
): Record<string, string | number | boolean> {
    const cleaned: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(properties)) {
        // Skip sensitive keys entirely
        if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;

        if (typeof value === 'string') {
            let scrubbed = value;
            for (const pattern of PII_PATTERNS) {
                scrubbed = scrubbed.replace(pattern, '[REDACTED]');
            }
            cleaned[key] = scrubbed;
        } else {
            cleaned[key] = value;
        }
    }

    return cleaned;
}

// Purge events older than retention period
export function purgeExpiredEvents(maxAgeDays: number = 90): number {
    const STORAGE_KEY = 'meidallm_telemetry';
    try {
        const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const cutoff = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
        const retained = events.filter((e: any) => e.timestamp > cutoff);
        const purged = events.length - retained.length;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(retained));
        return purged;
    } catch {
        return 0;
    }
}

// Export all user data (for GDPR data portability / Right to Access)
export function exportUserData(userId: string): string {
    const STORAGE_KEY = 'meidallm_telemetry';
    const SESSION_KEY = 'meidallm_session';

    const pseudoId = pseudonymizeUserId(userId);
    const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
        .filter((e: any) => e.userId === pseudoId);
    const sessions = JSON.parse(localStorage.getItem(SESSION_KEY) || '[]');

    return JSON.stringify({ userId: pseudoId, events, sessions, exportedAt: new Date().toISOString() }, null, 2);
}

// Delete all user data (GDPR Right to Erasure)
export function eraseUserData(userId: string): number {
    const STORAGE_KEY = 'meidallm_telemetry';
    const pseudoId = pseudonymizeUserId(userId);

    try {
        const events = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const remaining = events.filter((e: any) => e.userId !== pseudoId);
        const deleted = events.length - remaining.length;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
        return deleted;
    } catch {
        return 0;
    }
}

// Get/set consent status
export function getPrivacyConsent(): boolean {
    return localStorage.getItem('meidallm_privacy_consent') !== 'false';
}

export function setPrivacyConsent(consented: boolean): void {
    localStorage.setItem('meidallm_privacy_consent', String(consented));
    localStorage.setItem('meidallm_privacy_consent_ts', new Date().toISOString());
}
