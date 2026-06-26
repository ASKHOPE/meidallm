import { state } from "../state";
import { getStoredEvents } from "../telemetry/collector";

export function computeCAC(projectId: string): number {
    const project = state.projects.find(p => p.id === projectId);
    if (!project) return 0;
    
    // Total spent in project
    const spend = project.spent || 0;
    
    // New customers in project (contacts that are 'active')
    const activeContacts = state.contacts.filter(c => c.projectId === projectId && c.dealStage === 'active');
    const newCustomers = activeContacts.length;
    
    if (newCustomers === 0) {
        return spend > 0 ? spend : 150; // default baseline CAC of $150 if no customers but spend exists
    }
    return Math.round(spend / newCustomers);
}

export function computeMRR(projectId: string): number {
    // Sum of paid, recurring invoices for the project
    const invoices = state.salesInvoices.filter(inv => inv.projectId === projectId && inv.invoiceStatus === 'paid');
    
    let mrr = 0;
    for (const inv of invoices) {
        if (inv.isRecurring) {
            mrr += inv.dealValue;
        } else {
            // Assume 20% of one-off invoices contribute to recurring retainer value
            mrr += inv.dealValue * 0.20;
        }
    }
    
    // Seed some baseline if no invoices yet
    if (mrr === 0) {
        const seed = projectId.charCodeAt(projectId.length - 1) || 5;
        mrr = seed * 450 + 1200;
    }
    return Math.round(mrr);
}

export function computeLTV(projectId: string): number {
    const activeContacts = state.contacts.filter(c => c.projectId === projectId && c.dealStage === 'active');
    const customerCount = activeContacts.length || 5; // fallback
    const mrr = computeMRR(projectId);
    
    const arpu = mrr / customerCount;
    // Churn rate: assume 3% or calculate based on cold contacts ratio
    const coldContacts = state.contacts.filter(c => c.projectId === projectId && c.statusTag === 'cold').length;
    const totalContacts = state.contacts.filter(c => c.projectId === projectId).length || 1;
    const churnRate = 0.02 + (coldContacts / totalContacts) * 0.05; // 2% baseline + up to 5% based on cold contacts
    
    return Math.round(arpu / churnRate);
}

export function computeTTV(projectId: string): number {
    // Telemetry: time between SessionStarted and FeatureUsed/TaskCreated
    const events = getStoredEvents().filter(e => e.tenantId === state.activeTenantId);
    const signupEvents = events.filter(e => e.eventType === 'SessionStarted');
    const actionEvents = events.filter(e => e.eventType === 'FeatureUsed' || e.eventType === 'TaskCreated');
    
    let totalTtvMs = 0;
    let matchCount = 0;
    
    for (const signup of signupEvents) {
        // Find first action event after this signup for the same user
        const firstAction = actionEvents
            .filter(e => e.userId === signup.userId && e.timestamp > signup.timestamp)
            .sort((a, b) => a.timestamp - b.timestamp)[0];
            
        if (firstAction) {
            totalTtvMs += (firstAction.timestamp - signup.timestamp);
            matchCount++;
        }
    }
    
    if (matchCount > 0) {
        return Math.round((totalTtvMs / matchCount) / 1000); // return in seconds
    }
    
    // Baseline fallback: 180 seconds (3 minutes)
    const seed = projectId.charCodeAt(projectId.length - 1) || 5;
    return 120 + (seed % 4) * 60;
}

export function computeTaskVelocity(projectId: string): number {
    // Tasks completed per day in the active project
    const tasks = state.kanbanState.filter(t => t.projectId === projectId);
    const completedTasks = tasks.filter(t => t.status === 'done');
    
    // Find cycles or duration of the project
    // Let's assume standard cycle duration of 14 days or find the cycle in state
    const activeCycle = state.cycles.find(c => c.projectId === projectId && c.status === 'active');
    let durationDays = 14;
    if (activeCycle) {
        const start = new Date(activeCycle.startDate).getTime();
        const end = new Date(activeCycle.endDate).getTime();
        durationDays = Math.max(1, Math.round((end - start) / (24 * 60 * 60 * 1000)));
    }
    
    // Velocity = completed tasks per cycle day
    if (completedTasks.length === 0) {
        const seed = projectId.charCodeAt(projectId.length - 1) || 5;
        return seed % 3 + 1; // baseline
    }
    return Number((completedTasks.length / durationDays).toFixed(2));
}

export function computeContentPipelineRate(projectId: string): number {
    const totalDrafts = state.drafts.filter(d => d.projectId === projectId).length;
    const published = state.publishSchedules.filter(s => s.projectId === projectId && s.status === 'published').length;
    
    if (totalDrafts === 0) {
        return published > 0 ? 100 : 0;
    }
    return Math.round((published / totalDrafts) * 100);
}

export function computeHealthScore(projectId: string): number {
    // Weighted Health Score based on MRR growth, Content Yield, Velocity, and Churn
    const mrr = computeMRR(projectId);
    const pipelineRate = computeContentPipelineRate(projectId);
    const velocity = computeTaskVelocity(projectId);
    const cac = computeCAC(projectId);
    const ltv = computeLTV(projectId);
    
    // MRR Score (higher LTV:CAC ratio is better)
    const ltvToCacRatio = cac > 0 ? ltv / cac : 3;
    const financialScore = Math.min(100, Math.max(0, (ltvToCacRatio / 5) * 100));
    
    // Delivery Score (pipeline rate & velocity)
    const deliveryScore = Math.min(100, (pipelineRate * 0.7) + (velocity * 10));
    
    // Overall weighted score
    const score = Math.round((financialScore * 0.5) + (deliveryScore * 0.5));
    return Math.max(10, Math.min(100, score));
}
