import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderAnalyticsView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    // Seed mock data using project id hash
    const seed = pid.charCodeAt(pid.length - 1) || 5;
    const impressions = (seed * 3420).toLocaleString();
    const clicks = (seed * 420).toLocaleString();
    const ctr = (4.5 + (seed % 3) * 0.7).toFixed(1) + "%";
    const engagement = (6.2 + (seed % 5) * 0.4).toFixed(1) + "%";

    const channels = [
        { name: "LinkedIn Professional", value: 55 + (seed % 4) * 8, color: "bg-indigo-500" },
        { name: "X / Twitter", value: 30 + (seed % 3) * 10, color: "bg-pink-500" },
        { name: "Medium Publications", value: 15 - (seed % 2) * 5, color: "bg-emerald-500" }
    ];

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Top Metrics Row -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Impressions</span>
                <span class="text-2xl font-bold text-white font-outfit">${impressions}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +12% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Total Clicks</span>
                <span class="text-2xl font-bold text-white font-outfit">${clicks}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +8.4% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Click-Through Rate (CTR)</span>
                <span class="text-2xl font-bold text-white font-outfit">${ctr}</span>
                <span class="text-[10px] text-rose-400 block mt-1">▼ -0.3% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Engagement Rate</span>
                <span class="text-2xl font-bold text-white font-outfit">${engagement}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +1.5% this week</span>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Channel Performance Progress Bars -->
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl col-span-1 flex flex-col justify-between">
                <div>
                    <h3 class="text-lg font-semibold text-white font-outfit mb-2">Channel Performance</h3>
                    <p class="text-xs text-text-muted mb-6">Traffic share and engagement by publication platform.</p>
                    
                    <div class="flex flex-col gap-4">
                        ${channels.map(c => `
                        <div class="flex flex-col gap-1.5">
                            <div class="flex justify-between text-xs">
                                <span class="text-white font-medium">${c.name}</span>
                                <span class="text-text-muted">${c.value}%</span>
                            </div>
                            <div class="w-full bg-glass-border/30 h-2 rounded-full overflow-hidden">
                                <div class="${c.color} h-full" style="width: ${c.value}%"></div>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                <button onclick="alert('Exporting PDF report...')" class="w-full mt-8 py-2.5 bg-panel-hover border border-glass-border rounded-xl text-xs text-white hover:bg-glass-border transition-all">Export Campaign Report</button>
            </div>

            <!-- Graphic Chart Visualizer -->
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl col-span-2">
                <h3 class="text-lg font-semibold text-white font-outfit mb-2">Engagement Timeline</h3>
                <p class="text-xs text-text-muted mb-6">Daily clicks and interactions tracked across active publish hooks.</p>

                <!-- Mock Line Chart via Flex Bars -->
                <div class="flex items-end justify-between h-48 border-b border-glass-border/30 pb-2 px-4 gap-2">
                    ${[34, 45, 23, 56, 78, 65, 89, 94, 60, 72, 85, 110].map((h, i) => `
                    <div class="flex-grow flex flex-col items-center gap-2 group/bar">
                        <div class="relative w-full">
                            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-t from-primary/50 to-secondary rounded-t-sm group-hover/bar:from-primary transition-all duration-300" style="height: ${h * 1.2}px"></div>
                            <!-- Tooltip -->
                            <div class="opacity-0 group-hover/bar:opacity-100 absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-[rgba(15,23,42,0.95)] border border-glass-border text-[10px] text-white px-2 py-1 rounded shadow-xl whitespace-nowrap transition-opacity pointer-events-none z-10">
                                Day ${i + 1}: ${h * 10} clicks
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
                <div class="flex justify-between text-[10px] text-text-muted px-4 pt-2">
                    <span>June 12</span>
                    <span>June 18</span>
                    <span>June 24</span>
                </div>
            </div>
        </div>
    </div>
    `;
}
