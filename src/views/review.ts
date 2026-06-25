import { state } from "../state";
import { getIconSVG } from "./icons";

export function renderReviewView(pid: string): string {
    const drafts = state.drafts.filter((d: any) => d.projectId === pid);

    const awaitingReview = drafts.filter((d: any) => (d.cmsStatus === 'review') || (!d.cmsStatus && d.status === 'draft'));
    const approved = drafts.filter((d: any) => d.cmsStatus === 'approved');
    const needsRevision = drafts.filter((d: any) => d.cmsStatus === 'revision');

    const fmtDate = (ts: number) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

    const card = (d: any, badge: string, actions: string) => `
        <div class="flex flex-col gap-3 p-4 rounded-2xl bg-panel-hover border border-text-main/10 hover:border-text-main/25 transition-all duration-200">
            <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                    <p class="font-semibold text-text-main text-sm truncate">${d.title || 'Untitled Draft'}</p>
                    <p class="text-xs text-text-muted mt-0.5 line-clamp-2">${(d.content || '').replace(/<[^>]+>/g, '').slice(0, 100)}</p>
                </div>
                <span class="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badge}">${d.format || 'post'}</span>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-xs text-text-muted">${fmtDate(d.createdAt)}</span>
                <div class="flex gap-2">${actions}</div>
            </div>
        </div>`;

    const btn = (action: string, id: string, label: string, color: string, iconName: string) =>
        `<button onclick="window.reviewAction('${action}','${id}')" class="px-3 py-1 rounded-lg text-xs font-semibold ${color} transition-all cursor-pointer">${getIconSVG(iconName as Parameters<typeof getIconSVG>[0], 'w-3 h-3 inline mr-1')}${label}</button>`;

    const approveBtn = (id: string) => btn('approve', id, 'Approve',        'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25', 'check');
    const reviseBtn  = (id: string) => btn('revise',  id, 'Revise',         'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25',  'edit');
    const publishBtn = (id: string) => btn('publish', id, 'Send to Publish','bg-violet-500/15 text-violet-400 border border-violet-500/25 hover:bg-violet-500/25','publish');

    const empty = (msg: string) => `
        <div class="flex flex-col items-center justify-center gap-2 p-8 rounded-2xl border border-dashed border-text-main/15 text-text-muted text-sm text-center">
            ${getIconSVG('check', 'w-8 h-8 mx-auto mb-2 opacity-40')}${msg}
        </div>`;

    return `
    <div class="flex flex-col gap-6 p-6 h-full overflow-y-auto">
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-2xl font-bold text-text-main font-outfit tracking-tight">Content Review</h2>
                <p class="text-sm text-text-muted mt-1">Approve, revise, or escalate content before publishing.</p>
            </div>
            <div class="px-4 py-2 rounded-xl bg-panel-hover border border-text-main/10 text-xs text-text-muted flex items-center gap-1.5">
                ${getIconSVG('bell', 'w-4 h-4 text-amber-400')}
                <span class="font-bold text-amber-400">${awaitingReview.length}</span> awaiting review
            </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
            <div class="p-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                <div class="text-2xl font-bold text-amber-400">${awaitingReview.length}</div>
                <div class="text-xs text-text-muted font-semibold uppercase tracking-wider mt-1">Awaiting Review</div>
            </div>
            <div class="p-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/20">
                <div class="text-2xl font-bold text-emerald-400">${approved.length}</div>
                <div class="text-xs text-text-muted font-semibold uppercase tracking-wider mt-1">Approved</div>
            </div>
            <div class="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/20">
                <div class="text-2xl font-bold text-rose-400">${needsRevision.length}</div>
                <div class="text-xs text-text-muted font-semibold uppercase tracking-wider mt-1">Needs Revision</div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 mb-1">
                    ${getIconSVG('review', 'w-4 h-4 text-amber-400')}
                    <h3 class="text-sm font-bold text-text-main uppercase tracking-wider">Awaiting Review</h3>
                    <span class="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">${awaitingReview.length}</span>
                </div>
                ${awaitingReview.length === 0 ? empty('Queue is clear!') :
                    awaitingReview.map((d: any) => card(d, 'bg-amber-500/10 text-amber-400 border-amber-500/20', approveBtn(d.id) + reviseBtn(d.id))).join('')}
            </div>
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 mb-1">
                    ${getIconSVG('check', 'w-4 h-4 text-emerald-400')}
                    <h3 class="text-sm font-bold text-text-main uppercase tracking-wider">Approved</h3>
                    <span class="ml-auto text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">${approved.length}</span>
                </div>
                ${approved.length === 0 ? empty('Nothing approved yet') :
                    approved.map((d: any) => card(d, 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', publishBtn(d.id))).join('')}
            </div>
            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 mb-1">
                    ${getIconSVG('edit', 'w-4 h-4 text-rose-400')}
                    <h3 class="text-sm font-bold text-text-main uppercase tracking-wider">Needs Revision</h3>
                    <span class="ml-auto text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">${needsRevision.length}</span>
                </div>
                ${needsRevision.length === 0 ? empty('No revisions pending') :
                    needsRevision.map((d: any) => card(d, 'bg-rose-500/10 text-rose-400 border-rose-500/20', approveBtn(d.id))).join('')}
            </div>
        </div>

        <div class="p-5 rounded-2xl bg-panel-hover border border-text-main/10">
            <h3 class="text-sm font-bold text-text-main mb-3 flex items-center gap-2">
                ${getIconSVG('info', 'w-4 h-4 text-violet-400')}
                Pre-publish Review Checklist
            </h3>
            <div class="grid grid-cols-2 gap-2 text-xs text-text-muted">
                ${['Tone & brand voice consistent', 'Links verified and working', 'Media assets attached', 'SEO metadata complete', 'Legal / compliance cleared', 'Scheduled time confirmed'].map(item => `
                <label class="flex items-center gap-2 cursor-pointer hover:text-text-main transition-colors">
                    <input type="checkbox" class="accent-violet-500 cursor-pointer"> ${item}
                </label>`).join('')}
            </div>
        </div>
    </div>`;
}
