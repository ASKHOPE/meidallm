import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";
import { getStoredEvents, getStoredSessions } from "../telemetry/collector";

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
            content: 'The new Meidallm AI console is officially live! Seamlessly manage ideas, research logs, media assets, and publish scheduled campaigns all in one workflow. Get started at meidallm.com!',
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

    // Telemetry calculations
    const events = getStoredEvents().filter(e => e.tenantId === state.activeTenantId);
    const sessions = getStoredSessions();
    const tenantSessionIds = new Set(events.map(e => e.sessionId));
    const tenantSessions = sessions.filter(s => tenantSessionIds.has(s.sessionId));

    // DAU/WAU/MAU
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;
    const thirtyDays = 30 * oneDay;

    const dauUsers = new Set(events.filter(e => now - e.timestamp <= oneDay).map(e => e.userId)).size || (seed % 3 + 1);
    const wauUsers = new Set(events.filter(e => now - e.timestamp <= sevenDays).map(e => e.userId)).size || (seed % 4 + 4);
    const mauUsers = new Set(events.filter(e => now - e.timestamp <= thirtyDays).map(e => e.userId)).size || (seed % 5 + 12);

    // Session duration
    let avgDurationMin = seed * 3 + 8; // fallback seed duration
    const completedSessions = tenantSessions.filter(s => s.endTime !== null);
    if (completedSessions.length > 0) {
        const totalDurationMs = completedSessions.reduce((sum, s) => sum + ((s.endTime as number) - s.startTime), 0);
        avgDurationMin = Math.round((totalDurationMs / completedSessions.length) / 60000) || avgDurationMin;
    }

    // Feature Adoption Heatmap
    const featureCounts: Record<string, number> = {
        'Kanban Board': seed * 12 + 15,
        'Ideas Board': seed * 8 + 10,
        'CRM Pipeline': seed * 5 + 8,
        'Analytics': seed * 4 + 5,
        'AI Assistant': seed * 10 + 6
    };
    events.filter(e => e.eventType === 'FeatureUsed').forEach(e => {
        const feat = String(e.properties.feature || 'Unknown');
        featureCounts[feat] = (featureCounts[feat] || 0) + 1;
    });
    const sortedFeatures = Object.entries(featureCounts).sort((a, b) => b[1] - a[1]);
    const maxFeatureCount = Math.max(...sortedFeatures.map(f => f[1]), 1);

    // Content Pipeline Funnel
    const totalIdeas = state.ideasState.filter(i => i.projectId === pid).length || (seed * 4 + 10);
    const totalDrafts = state.drafts.filter(d => d.projectId === pid).length || (seed * 3 + 6);
    const inReviewDrafts = state.drafts.filter(d => d.projectId === pid && d.cmsStatus === 'review').length || (seed % 2 + 2);
    const publishedDrafts = state.publishSchedules.filter(s => s.projectId === pid && s.status === 'published').length || (seed % 3 + 3);

    // Rage Clicks
    const rageClickCounts: Record<string, number> = {
        '#btn-publish-now': seed % 2,
        '#btn-save-draft': seed % 3,
        '.kanban-column-drop': 0
    };
    events.filter(e => e.eventType === 'RageClick').forEach(e => {
        const elem = String(e.properties.element || 'unknown-element');
        rageClickCounts[elem] = (rageClickCounts[elem] || 0) + 1;
    });
    const sortedRageClicks = Object.entries(rageClickCounts).filter(r => r[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return `
    <div class="fade-in flex flex-col gap-6">
        <!-- Top Metrics Row (Global Campaign Summary) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-background border border-text-main/15 p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Global Impressions</span>
                <span class="text-2xl font-bold text-text-main font-outfit">${impressionsVal.toLocaleString()}</span>
                <span class="text-[10px] text-emerald-500 block mt-1">▲ +12% this week</span>
            </div>
            <div class="bg-background border border-text-main/15 p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Total Link Clicks</span>
                <span class="text-2xl font-bold text-text-main font-outfit">${clicksVal.toLocaleString()}</span>
                <span class="text-[10px] text-emerald-500 block mt-1">▲ +8.4% this week</span>
            </div>
            <div class="bg-background border border-text-main/15 p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Avg. Campaign CTR</span>
                <span class="text-2xl font-bold text-text-main font-outfit">${ctrVal}</span>
                <span class="text-[10px] text-rose-500 block mt-1">▼ -0.3% this week</span>
            </div>
            <div class="bg-background border border-text-main/15 p-6 rounded-2xl">
                <span class="text-xs text-text-muted uppercase tracking-wider font-semibold block mb-1">Engagement Rate</span>
                <span class="text-2xl font-bold text-text-main font-outfit">${engagementVal}</span>
                <span class="text-[10px] text-emerald-500 block mt-1">▲ +1.5% this week</span>
            </div>
        </div>

        <!-- Post Browser Section -->
        <div class="bg-background border border-text-main/15 rounded-2xl p-6">
            <div class="border-b border-text-main/10 pb-4 mb-6">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Published Post Browser</h3>
                <p class="text-xs text-text-muted mt-0.5">Analyze and preview content performance across your channels.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Published Posts List (span 5) -->
                <div class="lg:col-span-5 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    ${allPosts.map((post, idx) => {
                        const dateStr = new Date(post.scheduledTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        const isSelected = idx === 0;
                        const activeClass = isSelected ? 'border-text-main bg-panel-hover/60 shadow-[0_0_15px_var(--color-primary-glow)]' : 'border-text-main/15 bg-panel-hover/20 hover:bg-panel-hover/30';
                        return `
                        <div id="anal-post-card-${post.id}" onclick="window.selectAnalyticsPost('${post.id}')" 
                             class="p-4 rounded-xl border transition-all cursor-pointer text-left flex flex-col gap-2 ${activeClass}">
                             <div class="flex justify-between items-start gap-2">
                                 <h4 class="font-semibold text-sm text-text-main truncate max-w-[80%]">${sanitizeHTML(post.title)}</h4>
                                 <span class="text-[10px] text-text-muted shrink-0">${dateStr}</span>
                             </div>
                             <p class="text-xs text-text-muted line-clamp-2">${sanitizeHTML(post.content)}</p>
                             <div class="flex gap-1.5 flex-wrap mt-1">
                                 ${post.channels.map(chan => `<span class="bg-panel-hover text-text-main text-[9px] px-1.5 py-0.5 rounded font-medium">${chan}</span>`).join('')}
                             </div>
                        </div>
                        `;
                    }).join('')}
                </div>

                <!-- Right: Metrics Detail & Browser Preview (span 7) -->
                <div class="lg:col-span-7 flex flex-col gap-6 bg-panel-hover/10 border border-text-main/15 rounded-xl p-5" id="analytics-detail-panel">
                    ${firstPost ? renderPostDetailHTML(firstPost) : `<div class="text-text-muted text-center py-12">No posts available.</div>`}
                </div>
            </div>
        </div>

        <!-- App Usage & Telemetry Section -->
        <div class="bg-background border border-text-main/15 rounded-2xl p-6">
            <div class="border-b border-text-main/10 pb-4 mb-6">
                <h3 class="text-lg font-semibold text-text-main font-outfit">Real-time Telemetry & Engagement Audit</h3>
                <p class="text-xs text-text-muted mt-0.5">Scrubbed client-side telemetry showing feature adoption, active users, session tracking, and user frustration logs.</p>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Left Column: Engagement & Features -->
                <div class="flex flex-col gap-6">
                    <!-- Engagement Tiers Grid -->
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Engagement & Activity Tiers</h4>
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div class="bg-panel-hover/30 border border-text-main/15 p-4 rounded-xl text-center">
                                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1 flex items-center justify-center gap-1">
                                    DAU (Today)
                                </span>
                                <span class="text-xl font-bold text-indigo-400 font-outfit">${dauUsers}</span>
                            </div>
                            <div class="bg-panel-hover/30 border border-text-main/15 p-4 rounded-xl text-center">
                                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1">WAU (7 Days)</span>
                                <span class="text-xl font-bold text-indigo-400 font-outfit">${wauUsers}</span>
                            </div>
                            <div class="bg-panel-hover/30 border border-text-main/15 p-4 rounded-xl text-center">
                                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1">MAU (30 Days)</span>
                                <span class="text-xl font-bold text-indigo-400 font-outfit">${mauUsers}</span>
                            </div>
                            <div class="bg-panel-hover/30 border border-text-main/15 p-4 rounded-xl text-center">
                                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1">Avg Session</span>
                                <span class="text-xl font-bold text-emerald-400 font-outfit">${avgDurationMin}m</span>
                            </div>
                        </div>
                    </div>

                    <!-- Feature Adoption Heatmap -->
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Feature Adoption Heatmap</h4>
                        <div class="flex flex-col gap-3">
                            ${sortedFeatures.map(([feat, count]) => {
                                const percent = Math.round((count / maxFeatureCount) * 100);
                                return `
                                <div class="flex flex-col gap-1">
                                    <div class="flex justify-between text-xs font-medium">
                                        <span class="text-text-main">${sanitizeHTML(feat)}</span>
                                        <span class="text-text-muted">${count} operations (${percent}%)</span>
                                    </div>
                                    <div class="w-full bg-panel-hover/50 h-2 rounded-full overflow-hidden">
                                        <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style="width: ${percent}%"></div>
                                    </div>
                                </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- Right Column: Pipeline & Rage Clicks -->
                <div class="flex flex-col gap-6">
                    <!-- Content Pipeline Funnel -->
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Content Conversion Funnel</h4>
                        <div class="flex flex-col gap-2">
                            <!-- Step 1: Ideas -->
                            <div class="bg-panel-hover/20 border border-text-main/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">1</span>
                                    <span class="text-xs font-semibold text-text-main">Campaign Ideas Canvas</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-sm font-bold text-text-main font-outfit">${totalIdeas}</span>
                                    <span class="text-[10px] text-text-muted block">100% Base</span>
                                </div>
                            </div>
                            <div class="text-center text-text-muted/40 font-bold text-xs py-0.5">▼</div>
                            <!-- Step 2: Drafts -->
                            <div class="bg-panel-hover/20 border border-text-main/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">2</span>
                                    <span class="text-xs font-semibold text-text-main">Drafts Composed</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-sm font-bold text-text-main font-outfit">${totalDrafts}</span>
                                    <span class="text-[10px] text-indigo-400 block">${totalIdeas ? Math.round((totalDrafts / totalIdeas) * 100) : 0}% Conversion</span>
                                </div>
                            </div>
                            <div class="text-center text-text-muted/40 font-bold text-xs py-0.5">▼</div>
                            <!-- Step 3: Review -->
                            <div class="bg-panel-hover/20 border border-text-main/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-xs font-bold">3</span>
                                    <span class="text-xs font-semibold text-text-main">In Editorial Review</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-sm font-bold text-text-main font-outfit">${inReviewDrafts}</span>
                                    <span class="text-[10px] text-indigo-400 block">${totalDrafts ? Math.round((inReviewDrafts / totalDrafts) * 100) : 0}% Selection</span>
                                </div>
                            </div>
                            <div class="text-center text-text-muted/40 font-bold text-xs py-0.5">▼</div>
                            <!-- Step 4: Published -->
                            <div class="bg-panel-hover/20 border border-text-main/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                                    <span class="text-xs font-semibold text-text-main">Successfully Published</span>
                                </div>
                                <div class="text-right">
                                    <span class="text-sm font-bold text-emerald-400 font-outfit">${publishedDrafts}</span>
                                    <span class="text-[10px] text-emerald-400 block">${totalIdeas ? Math.round((publishedDrafts / totalIdeas) * 100) : 0}% Global Yield</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Rage Click Frustration Log -->
                    <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider text-rose-400 mb-3 flex items-center gap-1.5">
                            ${getIconSVG('info', 'w-3.5 h-3.5 text-rose-400')}
                            User Frustration Heatmap (Rage Clicks)
                        </h4>
                        ${sortedRageClicks.length === 0 ? `
                            <div class="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 text-center">
                                <p class="text-xs text-emerald-400 font-medium">Zero UI bottlenecks detected. Excellent layout response!</p>
                            </div>
                        ` : `
                            <div class="border border-text-main/10 rounded-xl overflow-hidden bg-panel-hover/10">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-panel-hover/30 text-text-muted uppercase text-[9px] tracking-wider font-semibold border-b border-text-main/10">
                                        <tr>
                                            <th class="px-4 py-2">Selector / Target</th>
                                            <th class="px-4 py-2 text-right">Frustration Incidents</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-text-main/5">
                                        ${sortedRageClicks.map(([elem, count]) => `
                                            <tr class="hover:bg-panel-hover/20 transition-colors">
                                                <td class="px-4 py-2.5 font-mono text-[10px] text-text-main">${sanitizeHTML(elem)}</td>
                                                <td class="px-4 py-2.5 text-right font-bold text-rose-400 font-outfit">${count} instances</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
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
        <div class="flex justify-between items-start border-b border-text-main/10 pb-4">
            <div>
                <h4 class="text-base font-semibold text-text-main font-outfit mb-0.5">${sanitizeHTML(post.title)}</h4>
                <div class="flex items-center gap-1.5 text-xs text-text-muted mt-1">
                    <span>Published via</span>
                    <div class="flex gap-1">
                        ${post.channels.map((c: string) => `<span class="bg-text-main/10 text-text-main border border-text-main/15 text-[10px] px-2 py-0.5 rounded-full font-semibold">${c}</span>`).join('')}
                    </div>
                </div>
            </div>
            <span class="text-[10px] text-text-muted font-medium bg-panel-hover px-2.5 py-1 rounded-full uppercase tracking-wider">
                ${post.format}
            </span>
        </div>

        <!-- Mini Metrics Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-panel-hover/30 border border-text-main/15 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Impressions</span>
                <span class="text-lg font-bold text-text-main">${post.metrics.impressions.toLocaleString()}</span>
            </div>
            <div class="bg-panel-hover/30 border border-text-main/15 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Clicks</span>
                <span class="text-lg font-bold text-text-main">${post.metrics.clicks.toLocaleString()}</span>
            </div>
            <div class="bg-panel-hover/30 border border-text-main/15 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">CTR</span>
                <span class="text-lg font-bold text-text-main">${post.metrics.ctr}</span>
            </div>
            <div class="bg-panel-hover/30 border border-text-main/15 p-3.5 rounded-xl text-center">
                <span class="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-0.5">Engagement</span>
                <span class="text-lg font-bold text-text-main">${post.metrics.engagement}</span>
            </div>
        </div>

        <!-- Social Media Feed Browser Mock Frame -->
        <div class="border border-text-main/15 rounded-xl bg-panel-hover/5 overflow-hidden flex flex-col">
            <!-- Browser Header bar -->
            <div class="bg-panel-hover/40 px-4 py-2 border-b border-text-main/10 flex items-center gap-2">
                <div class="flex gap-1.5 shrink-0">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-500 block"></span>
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                </div>
                <div class="bg-text-main/5 border border-text-main/10 text-[10px] text-text-muted py-0.5 px-3 rounded-md flex-grow font-mono truncate">
                    https://meidallm.com/preview/${post.id}
                </div>
            </div>

            <!-- Feed Preview Body -->
            <div class="p-5 flex flex-col gap-4 text-left">
                <!-- User Avatar card -->
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-text-main text-background flex items-center justify-center text-xs font-bold shadow-md">
                        M
                    </div>
                    <div>
                        <div class="font-bold text-xs text-text-main">Meidallm Portal</div>
                        <div class="text-[10px] text-text-muted">@meidallm_agency • Just now</div>
                    </div>
                </div>
                <!-- Content text -->
                <p class="text-xs text-text-main leading-relaxed font-outfit select-text whitespace-pre-line">${sanitizeHTML(post.content)}</p>
                
                <!-- Mock Media Preview if exists -->
                <div class="w-full h-32 rounded-lg bg-cover bg-center border border-text-main/15" style="background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80')"></div>

                <!-- Footer Engagement Actions -->
                <div class="flex justify-between items-center border-t border-text-main/10 pt-3 text-[11px] text-text-muted font-medium px-1">
                    <span class="flex items-center gap-1.5 hover:text-rose-500 transition-colors">${getIconSVG('heart', 'w-3.5 h-3.5 text-rose-500')} <span>${post.metrics.likes} Likes</span></span>
                    <span class="flex items-center gap-1.5 hover:text-text-main transition-colors">${getIconSVG('comment', 'w-3.5 h-3.5 text-text-muted')} <span>${post.metrics.comments} Comments</span></span>
                    <span class="flex items-center gap-1.5 hover:text-emerald-500 transition-colors">${getIconSVG('share', 'w-3.5 h-3.5 text-emerald-500')} <span>${post.metrics.shares} Shares</span></span>
                </div>
            </div>
        </div>
    </div>
    `;
}
