import { state } from "../state";
import { sanitizeHTML } from "../utils";

export function renderAnalyticsView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    // Seed mock data using project id hash
    const seed = pid.charCodeAt(pid.length - 1) || 5;
    const impressionsVal = seed * 3420 + 20950;
    const clicksVal = seed * 420 + 2310;
    const ctrVal = (5.5 + (seed % 3) * 0.7).toFixed(1) + "%";
    const engagementVal = (7.2 + (seed % 5) * 0.4).toFixed(1) + "%";

    // Actual published posts
    const actualPublished = state.publishSchedules.filter(s => s.projectId === pid && s.status === 'published');

    // Default mock posts
    const defaultMocks = [
        {
            id: 'mock-post-1',
            title: 'Q3 Agency Feature Launch Highlights',
            format: 'tweet',
            channels: ['X (Twitter)', 'Threads', 'WhatsApp'],
            scheduledTime: Date.now() - 86400000 * 2,
            content: '🚀 The new Meidallm AI console is officially live! Seamlessly manage ideas 💡, research logs 🔍, media assets 🖼️, and publish scheduled campaigns 📢 all in one workflow. Get started at meidallm.com!',
            metrics: {
                impressions: 4850,
                clicks: 612,
                ctr: '12.6%',
                engagement: '8.4%',
                likes: 340,
                comments: 42,
                shares: 88
            }
        },
        {
            id: 'mock-post-2',
            title: 'How to build premium agentic interfaces',
            format: 'blog',
            channels: ['YouTube', 'Pinterest', 'Facebook'],
            scheduledTime: Date.now() - 86400000 * 5,
            content: 'Check out our new tutorial outlining the system design behind meidallm. We discuss the Zod validation layer, state management, and real-time DOM-based list filtering. Watch the video now!',
            metrics: {
                impressions: 12900,
                clicks: 1450,
                ctr: '11.2%',
                engagement: '9.8%',
                likes: 850,
                comments: 110,
                shares: 245
            }
        },
        {
            id: 'mock-post-3',
            title: 'Workspace Folder & Kanban Workflow integration',
            format: 'email',
            channels: ['Instagram', 'Threads'],
            scheduledTime: Date.now() - 86400000 * 7,
            content: 'Tired of cluttered boards? Meidallm allows you to organize campaigns into discrete active workspaces. Sort by task count, filter in real-time, and track progress using Kanban views.',
            metrics: {
                impressions: 3200,
                clicks: 290,
                ctr: '9.1%',
                engagement: '6.5%',
                likes: 195,
                comments: 18,
                shares: 34
            }
        }
    ];

    const allPosts = [
        ...actualPublished.map(s => {
            const draft = state.drafts.find(d => d.id === s.draftId);
            const content = draft ? draft.content : 'Published campaign content';
            const sSeed = s.id.charCodeAt(s.id.length - 1) || 5;
            return {
                id: s.id,
                title: s.title,
                format: s.format,
                channels: s.channels,
                scheduledTime: s.scheduledTime,
                content: content,
                metrics: {
                    impressions: sSeed * 1230 + 500,
                    clicks: sSeed * 140 + 50,
                    ctr: (4.5 + (sSeed % 4) * 1.2).toFixed(1) + '%',
                    engagement: (5.2 + (sSeed % 3) * 0.9).toFixed(1) + '%',
                    likes: sSeed * 45 + 10,
                    comments: sSeed * 5 + 2,
                    shares: sSeed * 12 + 1
                }
            };
        }),
        ...defaultMocks
    ];

    // Expose posts list to global scope for selector callbacks
    if (typeof window !== 'undefined') {
        (window as any).analyticsPosts = allPosts;
    }

    const firstPost = allPosts[0];

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Top Metrics Row (Global Campaign Summary) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Global Impressions</span>
                <span class="text-2xl font-bold text-white font-outfit">${impressionsVal.toLocaleString()}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +12% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Total Link Clicks</span>
                <span class="text-2xl font-bold text-white font-outfit">${clicksVal.toLocaleString()}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +8.4% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Avg. Campaign CTR</span>
                <span class="text-2xl font-bold text-white font-outfit">${ctrVal}</span>
                <span class="text-[10px] text-rose-400 block mt-1">▼ -0.3% this week</span>
            </div>
            <div class="bg-glass-bg border border-glass-border p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Engagement Rate</span>
                <span class="text-2xl font-bold text-white font-outfit">${engagementVal}</span>
                <span class="text-[10px] text-emerald-400 block mt-1">▲ +1.5% this week</span>
            </div>
        </div>

        <!-- Post Browser Section -->
        <div class="bg-glass-bg border border-glass-border rounded-2xl p-6">
            <div class="border-b border-glass-border pb-4 mb-6">
                <h3 class="text-lg font-semibold text-white font-outfit">Published Post Browser</h3>
                <p class="text-xs text-text-muted mt-0.5">Analyze and preview content performance across your channels.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Published Posts List (span 5) -->
                <div class="lg:col-span-5 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    ${allPosts.map((post, idx) => {
                        const dateStr = new Date(post.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        const isSelected = idx === 0;
                        const activeClass = isSelected ? 'border-primary bg-panel-hover/60 shadow-[0_0_15px_var(--color-primary-glow)]' : 'border-glass-border bg-panel-hover/20 hover:bg-panel-hover/30';
                        return `
                        <div id="anal-post-card-${post.id}" onclick="window.selectAnalyticsPost('${post.id}')" 
                             class="p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${activeClass}">
                            <div class="flex justify-between items-start gap-2">
                                <h4 class="font-semibold text-sm text-white truncate max-w-[80%]">${sanitizeHTML(post.title)}</h4>
                                <span class="text-[10px] text-text-muted shrink-0">${dateStr}</span>
                            </div>
                            <p class="text-xs text-text-muted line-clamp-2">${sanitizeHTML(post.content)}</p>
                            <div class="flex gap-1.5 flex-wrap mt-1">
                                ${post.channels.map(chan => `<span class="bg-glass-border/50 text-white text-[9px] px-1.5 py-0.5 rounded font-medium">${chan}</span>`).join('')}
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Right: Metrics Detail & Browser Preview (span 7) -->
                <div class="lg:col-span-7 flex flex-col gap-6 bg-panel-hover/10 border border-glass-border/50 rounded-xl p-5" id="analytics-detail-panel">
                    ${firstPost ? renderPostDetailHTML(firstPost) : `<div class="text-text-muted text-center py-12">No posts available.</div>`}
                </div>
            </div>
        </div>
    </div>
    `;
}

// Separate helper for detail pane HTML
export function renderPostDetailHTML(post: any): string {
    return `
    <div class="flex flex-col gap-5">
        <!-- Post Title and Channel Header -->
        <div class="flex justify-between items-start border-b border-glass-border/30 pb-4">
            <div>
                <h4 class="text-base font-semibold text-white font-outfit mb-0.5">${sanitizeHTML(post.title)}</h4>
                <div class="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                    <span>Published via</span>
                    <div class="flex gap-1">
                        ${post.channels.map((c: string) => `<span class="bg-primary/20 text-primary border border-primary/20 text-[10px] px-2 py-0.5 rounded-full font-semibold">${c}</span>`).join('')}
                    </div>
                </div>
            </div>
            <span class="text-[10px] text-text-muted font-medium bg-glass-border px-2.5 py-1 rounded-full uppercase tracking-wider">
                ${post.format}
            </span>
        </div>

        <!-- Mini Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-glass-bg/40 border border-glass-border/50 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Impressions</span>
                <span class="text-lg font-bold text-white">${post.metrics.impressions.toLocaleString()}</span>
            </div>
            <div class="bg-glass-bg/40 border border-glass-border/50 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Clicks</span>
                <span class="text-lg font-bold text-white">${post.metrics.clicks.toLocaleString()}</span>
            </div>
            <div class="bg-glass-bg/40 border border-glass-border/50 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">CTR</span>
                <span class="text-lg font-bold text-white">${post.metrics.ctr}</span>
            </div>
            <div class="bg-glass-bg/40 border border-glass-border/50 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Engagement</span>
                <span class="text-lg font-bold text-white">${post.metrics.engagement}</span>
            </div>
        </div>

        <!-- Social Media Feed Browser Mock Frame -->
        <div class="border border-glass-border rounded-xl bg-glass-bg/25 overflow-hidden flex flex-col">
            <!-- Browser Header bar -->
            <div class="bg-glass-border/40 px-4 py-2 border-b border-glass-border flex items-center gap-2">
                <div class="flex gap-1.5 shrink-0">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                </div>
                <div class="bg-black/20 border border-glass-border/40 text-[10px] text-text-muted py-0.5 px-3 rounded-md flex-grow font-mono truncate">
                    https://meidallm.com/preview/${post.id}
                </div>
            </div>

            <!-- Feed Preview Body -->
            <div class="p-5 flex flex-col gap-4 text-left">
                <!-- User Avatar card -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-xs font-bold text-white shadow-md">
                        M
                    </div>
                    <div>
                        <div class="font-bold text-xs text-white">Meidallm Portal</div>
                        <div class="text-[10px] text-text-muted">@meidallm_agency • Just now</div>
                    </div>
                </div>
                <!-- Content text -->
                <p class="text-xs text-text-main leading-relaxed font-outfit select-text whitespace-pre-line">${sanitizeHTML(post.content)}</p>
                
                <!-- Mock Media Preview if exists -->
                <div class="w-full h-32 rounded-lg bg-cover bg-center border border-glass-border/50" style="background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80')"></div>

                <!-- Footer Engagement Actions -->
                <div class="flex justify-between items-center border-t border-glass-border/30 pt-3 text-[11px] text-text-muted font-medium px-1">
                    <span class="flex items-center gap-1.5 hover:text-rose-400 transition-colors">❤️ ${post.metrics.likes} Likes</span>
                    <span class="flex items-center gap-1.5 hover:text-primary transition-colors">💬 ${post.metrics.comments} Comments</span>
                    <span class="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">🔁 ${post.metrics.shares} Shares</span>
                </div>
            </div>
        </div>
    </div>
    `;
}
