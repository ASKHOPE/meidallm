import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderGoalsView(projectId: string): string {
    const goals = state.goals.filter(g => g.projectId === projectId);
    
    let goalsListHTML = "";
    
    if (goals.length === 0) {
        goalsListHTML = `
            <div class="col-span-full border border-glass-border rounded-xl p-8 text-center text-text-muted">
                <span class="text-3xl block mb-2">🎯</span>
                No goals created yet. Let's build target milestones for this campaign!
            </div>
        `;
    } else {
        goalsListHTML = goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const statusColors = {
                'on-track': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                'behind': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                'achieved': 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            }[goal.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

            return `
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all hover:border-text-muted">
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <h4 class="font-semibold text-white text-base">${sanitizeHTML(goal.title)}</h4>
                        <div class="text-xs text-text-muted mt-1">Due: ${sanitizeHTML(goal.dueDate)}</div>
                    </div>
                    <span class="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border ${statusColors}">
                        ${goal.status.replace('-', ' ')}
                    </span>
                </div>
                
                <div class="flex flex-col gap-1.5 mt-2">
                    <div class="flex justify-between text-xs text-text-muted">
                        <span>Progress (${percent}%)</span>
                        <span class="font-medium text-white">${goal.currentValue} / ${goal.targetValue} ${sanitizeHTML(goal.unit)}</span>
                    </div>
                    <div class="w-full bg-panel-hover h-2 rounded-full overflow-hidden">
                        <div class="bg-white h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-glass-border/40">
                    <button onclick="window.incrementGoalProgress('${goal.id}')" class="px-3 py-1.5 bg-panel-hover hover:bg-white hover:text-black rounded-lg text-xs font-semibold transition-all">
                        + Update Progress
                    </button>
                    <button onclick="window.deleteGoal('${goal.id}')" class="text-xs text-rose-400 hover:text-rose-600 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    return `
    <div class="fade-in flex flex-col gap-6">
        <div class="flex justify-between items-center">
            <div>
                <h3 class="text-xl font-bold font-outfit text-white">Campaign Goals & KPIs</h3>
                <p class="text-xs text-text-muted">Track strategic marketing OKRs and metric objectives.</p>
            </div>
            <button onclick="window.createGoalPrompt()" class="px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                + Add Goal
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${goalsListHTML}
        </div>
    </div>
    `;
}
