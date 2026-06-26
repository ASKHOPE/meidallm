// Security Audit Log — Phase 2
// Records sensitive operations with tenant/user context

export type AuditAction =
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'role_changed'
    | 'tenant_switched'
    | 'org_switched'
    | 'permission_changed'
    | 'data_exported'
    | 'data_deleted'
    | 'settings_changed'
    | 'user_created'
    | 'user_suspended'
    | 'policy_changed'
    | 'bulk_operation'
    | 'api_key_generated'
    | 'password_changed'
    | 'consent_changed'
    | 'captcha_triggered'
    | 'rate_limit_hit'
    | 'suspicious_activity';

export interface AuditEntry {
    id: string;
    tenantId: string;
    userId: string;
    action: AuditAction;
    resource: string;         // e.g. 'project:p1', 'user:tm3', 'settings:privacy'
    details: string;
    timestamp: number;
    ipHint: string;           // Anonymized / truncated IP
    severity: 'info' | 'warning' | 'critical';
}

const AUDIT_STORAGE_KEY = 'meidallm_audit_log';
const MAX_AUDIT_ENTRIES = 5000;

function generateAuditId(): string {
    return `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

// Anonymize IP: keep first two octets only
function anonymizeIp(ip: string): string {
    if (!ip || ip === '127.0.0.1') return '127.0.x.x';
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.x.x`;
    return 'x.x.x.x';
}

// Record an audit event
export function recordAudit(
    tenantId: string,
    userId: string,
    action: AuditAction,
    resource: string,
    details: string,
    severity: 'info' | 'warning' | 'critical' = 'info'
): void {
    const entry: AuditEntry = {
        id: generateAuditId(),
        tenantId,
        userId,
        action,
        resource,
        details,
        timestamp: Date.now(),
        ipHint: anonymizeIp('127.0.0.1'), // Client-side, no real IP
        severity
    };

    try {
        const log = getAuditLog();
        log.push(entry);
        // Trim to max entries
        const trimmed = log.slice(-MAX_AUDIT_ENTRIES);
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(trimmed));
    } catch { /* storage full */ }
}

// Retrieve audit log
export function getAuditLog(): AuditEntry[] {
    try {
        return JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

// Filter audit log by tenant
export function getAuditLogForTenant(tenantId: string): AuditEntry[] {
    return getAuditLog().filter(e => e.tenantId === tenantId);
}

// Filter by severity
export function getCriticalAudits(): AuditEntry[] {
    return getAuditLog().filter(e => e.severity === 'critical' || e.severity === 'warning');
}

// Export audit log as JSON (for compliance reports)
export function exportAuditLog(tenantId?: string): string {
    const data = tenantId ? getAuditLogForTenant(tenantId) : getAuditLog();
    return JSON.stringify({
        exportedAt: new Date().toISOString(),
        tenantId: tenantId || 'all',
        totalEntries: data.length,
        entries: data
    }, null, 2);
}

// Clear audit log (admin only, with re-audit)
export function clearAuditLog(tenantId: string, userId: string): void {
    recordAudit(tenantId, userId, 'bulk_operation', 'audit_log', 'Audit log cleared by admin', 'critical');
    const entry = getAuditLog().slice(-1); // Keep only the "cleared" entry
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(entry));
}
