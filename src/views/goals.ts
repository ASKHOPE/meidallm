import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderGoalsView(projectId: string): string {
    const goals = state.goals.filter(g => g.projectId === projectId);
    
    let goalsListHTML = "";
    
    if (goals.length === 0) {
        goalsListHTML = `
            <div class="col-span-full border border-text-main/15 rounded-xl p-8 text-center text-text-muted">
                <div class="flex justify-center mb-3">
                    ${getIconSVG('project-goals', 'w-8 h-8 text-text-muted')}
                </div>
                No goals created yet. Let's build target milestones for this campaign!
            </div>
        `;
    } else {
        goalsListHTML = goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
            const statusColors = {
                'on-track': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
                'behind': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
                'achieved': 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            }[goal.status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

            return `
            <div class="bg-background border border-text-main/15 p-6 rounded-2xl flex flex-col gap-4 relative overflow-hidden transition-all hover:border-text-main">
                <div class="flex justify-between items-start gap-4">
                    <div>
                        <h4 class="font-bold text-text-main text-base">${sanitizeHTML(goal.title)}</h4>
                        <div class="text-xs text-text-muted mt-1">Due: ${sanitizeHTML(goal.dueDate)}</div>
                    </div>
                    <span class="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full border ${statusColors}">
                        ${goal.status.replace('-', ' ')}
                    </span>
                </div>
                
                <div class="flex flex-col gap-1.5 mt-2">
                    <div class="flex justify-between text-xs text-text-muted">
                        <span>Progress (${percent}%)</span>
                        <span class="font-medium text-text-main">${goal.currentValue} / ${goal.targetValue} ${sanitizeHTML(goal.unit)}</span>
                    </div>
                    <div class="w-full bg-panel-hover h-2 rounded-full overflow-hidden">
                        <div class="bg-text-main h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                    </div>
                </div>
                
                <div class="flex justify-between items-center mt-3 pt-3 border-t border-text-main/10">
                    <button onclick="window.incrementGoalProgress('${goal.id}')" class="px-3 py-1.5 bg-panel-hover hover:bg-text-main hover:text-background rounded-lg text-xs font-semibold transition-all">
                        + Update Progress
                    </button>
                    <button onclick="window.deleteGoal('${goal.id}')" class="text-xs text-rose-500 hover:text-rose-600 transition-colors">
                        Delete
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <div class="flex justify-between items-center">
            <div>
                <h3 class="text-xl font-bold font-outfit text-text-main">Campaign Goals & KPIs</h3>
                <p class="text-xs text-text-muted">Track strategic marketing OKRs and metric objectives.</p>
            </div>
            <button onclick="window.createGoalPrompt()" class="px-4 py-2 bg-text-main text-background font-bold text-xs rounded-xl hover:bg-text-main/90 transition-all shadow-sm">
                + Add Goal
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${goalsListHTML}
        </div>
    </div>
    `;
}
