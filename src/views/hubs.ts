import { renderIdeasView } from "./ideas";
import { renderResearchView } from "./research";
import { renderGoalsView } from "./goals";
import { renderKanbanView } from "./kanban";
import { renderGanttView } from "./gantt";
import { renderCyclesView } from "./cycles";
import { renderWorkloadView } from "./workload";
import { renderComposeView } from "./compose";
import { renderMediaView } from "./media";
import { renderDraftsView } from "./drafts";
import { renderReviewView } from "./review";
import { renderPublishView } from "./publish";
import { renderAutomationsView } from "./automations";
import { renderFormsView } from "./forms";
import { renderAnalyticsView } from "./analytics";
import { renderSitRepView } from "./sitrep";
import { renderDatabaseView } from "./database";
import { renderTableView } from "./table-view";

export function renderClientSideHub(hubId: string, hubTitle: string, tabs: {key: string, title: string, render: (pid?: string) => string}[], pid?: string) {
    return `
    <div class="flex flex-col h-full w-full relative">
        <div class="shrink-0 mb-6 border-b border-[var(--color-glass-border)] pb-0">
            <h1 class="text-2xl font-bold font-outfit text-[var(--color-text-main)] mb-4">${hubTitle}</h1>
            <div class="flex gap-6 overflow-x-auto no-scrollbar" id="${hubId}-tabs">
                ${tabs.map((tab, idx) => `
                    <button onclick="window.switchHubTab('${hubId}', '${tab.key}')" 
                        class="hub-tab-btn pb-3 text-sm font-medium transition-colors relative ${idx === 0 ? 'text-[var(--color-text-main)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}" data-tab="${tab.key}">
                        ${tab.title}
                        <div class="hub-tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 rounded-t-full transition-opacity ${idx === 0 ? 'opacity-100' : 'opacity-0'}"></div>
                    </button>
                `).join('')}
            </div>
        </div>
        <div class="flex-grow relative overflow-hidden" id="${hubId}-content">
            ${tabs.map((tab, idx) => `
                <div class="hub-tab-content absolute inset-0 overflow-y-auto no-scrollbar transition-opacity duration-300 ${idx === 0 ? 'opacity-100 pointer-events-auto z-10 relative' : 'opacity-0 pointer-events-none z-0 hidden'}" data-tab="${tab.key}">
                    ${tab.render(pid)}
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

export const renderDiscoverHub = (pid?: string) => renderClientSideHub('discover', 'Strategy & Discovery', [
    { key: 'idea-canvas', title: 'Idea Canvas', render: renderIdeasView },
    { key: 'project-goals', title: 'Goals & OKRs', render: renderGoalsView },
    { key: 'research', title: 'Research & RAG', render: renderResearchView }
], pid);

export const renderProjectsHub = (pid?: string) => renderClientSideHub('projects', 'Projects & Work', [
    { key: 'kanban-board', title: 'Task Board', render: renderKanbanView },
    { key: 'gantt', title: 'Timeline', render: renderGanttView },
    { key: 'project-cycles', title: 'Sprints', render: renderCyclesView },
    { key: 'workload', title: 'Team Workload', render: renderWorkloadView }
], pid);

export const renderCreateHub = (pid?: string) => renderClientSideHub('create', 'Content Studio', [
    { key: 'compose', title: 'Compose', render: renderComposeView },
    { key: 'drafts', title: 'Drafts', render: renderDraftsView },
    { key: 'review', title: 'Review', render: renderReviewView },
    { key: 'media', title: 'Media Assets', render: renderMediaView }
], pid);

export const renderDistributeHub = (pid?: string) => renderClientSideHub('distribute', 'Distribution & Campaigns', [
    { key: 'publish', title: 'Publish & Schedule', render: renderPublishView },
    { key: 'automations', title: 'Workflow Automations', render: renderAutomationsView },
    { key: 'forms', title: 'Ingestion Forms', render: renderFormsView }
], pid);

export const renderInsightsHub = (pid?: string) => renderClientSideHub('insights', 'Analytics & Insights', [
    { key: 'analytics', title: 'Campaign Analytics', render: renderAnalyticsView },
    { key: 'sitrep', title: 'Situation Report', render: renderSitRepView }
], pid);

export const renderDatabaseHub = (pid?: string) => renderClientSideHub('database', 'Data & Records', [
    { key: 'database-hub', title: 'Collaborative Databases', render: renderDatabaseView },
    { key: 'table-view', title: 'Table View', render: renderTableView }
], pid);
