import { state } from "../state";
import { sanitizeHTML } from "../utils";
import { getIconSVG } from "./icons";

export function renderClientPortalView(): string {
    const currentProject = state.projects.find(p => p.id === state.currentProject);
    
    if (!currentProject) {
        return `
        <div class="flex-grow flex flex-col items-center justify-center p-8 text-center animate-[fadeIn_0.3s_ease-out]">
            <div class="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-4 shadow-sm border border-blue-500/20">
                ${getIconSVG('folder', 'w-8 h-8')}
            </div>
            <h2 class="text-xl font-bold font-outfit text-text-main">No Workspace Selected</h2>
            <p class="text-sm text-text-muted mt-2 max-w-md mx-auto">Please select a campaign from the sidebar to view your project portal.</p>
        </div>
        `;
    }

    const activeTasks = state.kanbanState.filter(t => t.projectId === currentProject.id && !t.isArchived && !t.isBinned);
    const progressTasks = activeTasks.filter(t => t.status === 'progress').length;
    const reviewTasks = activeTasks.filter(t => t.status === 'review').length;
    const doneTasks = activeTasks.filter(t => t.status === 'done').length;
    const totalTasks = activeTasks.length || 1;
    const progressPercent = Math.round((doneTasks / totalTasks) * 100);

    const clientFeedback = state.clientFeedback.filter(f => f.projectId === currentProject.id);

    return `
    <div class="fade-in flex flex-col gap-6 max-w-5xl mx-auto w-full">
        <div class="flex justify-between items-center border-b border-text-main/10 pb-4">
            <div>
                <h2 class="text-xl font-bold font-outfit text-text-main flex items-center gap-2">
                    ${getIconSVG('star-filled', 'w-6 h-6 text-blue-500')} Client Portal: ${sanitizeHTML(currentProject.name)}
                </h2>
                <p class="text-xs text-text-muted mt-1">Review progress, approve deliverables, and provide feedback.</p>
            </div>
            <button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="window.navigateTo('helpdesk')">
                Contact Support
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-2 flex flex-col gap-6">
                <!-- Project Progress Summary -->
                <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm">
                    <h3 class="font-bold text-sm text-text-main mb-4">Project Progress</h3>
                    <div class="flex items-center gap-4 mb-3">
                        <div class="flex-grow bg-text-main/10 h-3 rounded-full overflow-hidden flex">
                            <div class="bg-emerald-500 h-full transition-all duration-500" style="width: ${progressPercent}%"></div>
                        </div>
                        <span class="text-sm font-bold text-text-main">${progressPercent}%</span>
                    </div>
                    <div class="flex gap-4 text-xs">
                        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span><span class="text-text-muted">${progressTasks} In Progress</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500"></span><span class="text-text-muted">${reviewTasks} Pending Review</span></div>
                        <div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500"></span><span class="text-text-muted">${doneTasks} Completed</span></div>
                    </div>
                </div>

                <!-- Deliverables for Review -->
                <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm">
                    <h3 class="font-bold text-sm text-text-main mb-4 flex items-center gap-2">
                        ${getIconSVG('check', 'w-4 h-4 text-amber-500')} Awaiting Your Approval
                    </h3>
                    <div class="flex flex-col gap-3">
                        ${activeTasks.filter(t => t.status === 'review').map(t => `
                            <div class="flex items-center justify-between p-3 bg-text-main/5 border border-text-main/10 rounded-lg">
                                <div>
                                    <div class="font-bold text-xs text-text-main">${sanitizeHTML(t.title)}</div>
                                    <div class="text-[10px] text-text-muted mt-0.5">${sanitizeHTML(t.tag)}</div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="px-3 py-1.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">Approve</button>
                                    <button class="px-3 py-1.5 text-[10px] font-bold rounded bg-text-main/10 text-text-main hover:bg-text-main/20 transition-colors">Request Changes</button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-xs text-text-muted italic">No items currently await your review.</p>'}
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <!-- Feedback Form -->
                <div class="bg-background border border-text-main/15 p-5 rounded-xl shadow-sm">
                    <h3 class="font-bold text-sm text-text-main mb-3">Submit Feedback</h3>
                    <form onsubmit="event.preventDefault(); window.submitClientFeedback();" class="flex flex-col gap-3">
                        <textarea id="client-feedback-input" rows="4" placeholder="Share your thoughts on the latest deliverables..." class="w-full bg-transparent border border-text-main/15 p-2 rounded-lg text-xs focus:outline-none focus:border-blue-500 transition-colors resize-none"></textarea>
                        <button type="submit" class="w-full bg-text-main text-background font-bold text-xs py-2 rounded-lg hover:bg-text-main/90 transition-colors">Send Feedback</button>
                    </form>
                </div>

                <!-- Previous Feedback -->
                <div>
                    <h3 class="font-bold text-xs text-text-main mb-3 uppercase tracking-wider text-text-muted">Recent Feedback</h3>
                    <div class="flex flex-col gap-3">
                        ${clientFeedback.map(f => `
                            <div class="p-3 bg-text-main/5 border border-text-main/10 rounded-lg">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-[9px] font-bold ${f.status === 'addressed' ? 'text-emerald-500' : 'text-amber-500'} uppercase">${f.status}</span>
                                    <span class="text-[9px] text-text-muted font-mono">${new Date(f.created).toLocaleDateString()}</span>
                                </div>
                                <p class="text-[11px] text-text-main leading-relaxed">${sanitizeHTML(f.content)}</p>
                            </div>
                        `).join('') || '<p class="text-xs text-text-muted italic">No feedback submitted yet.</p>'}
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}
