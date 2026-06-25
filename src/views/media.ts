import { state } from "../state";
import { sanitizeHTML, formatTime } from "../utils";
import { getIconSVG } from "./icons";

export function renderMediaView(pid: string): string {
    const p = state.projects.find(x => x.id === pid);
    if (!p) return `<div class="fade-in text-text-muted">Project not found.</div>`;

    const projectAssets = state.mediaAssets.filter(m => m.projectId === pid);

    // Preset options to import instantly
    const PRESETS = [
        { title: "Dashboard Hero Layout", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80", category: "banner" as const },
        { title: "Instagram Post Gradient", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80", category: "social" as const },
        { title: "Sidebar Promotion Banner", url: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80", category: "ad" as const },
        { title: "LinkedIn Story Asset", url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?auto=format&fit=crop&w=800&q=80", category: "social" as const }
    ];

    return `
    <div class="fade-in flex flex-col gap-6 text-text-main">
        <div class="flex justify-between items-center mb-4">
            <div>
                <h2 class="text-2xl font-outfit font-bold text-text-main">Media Assets Studio</h2>
                <p class="text-xs text-text-muted">Manage templates, promotional banners, and social assets for this campaign.</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.navigateTo('project-workspace', '${p.id}')" class="px-4 py-2 bg-panel-hover border border-text-main/15 rounded-xl text-xs font-semibold text-text-main hover:bg-panel-hover/80 transition-colors cursor-pointer">Workspace</button>
                <button onclick="window.showAddMediaModal()" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">+ Add Asset</button>
            </div>
        </div>

        <!-- Curated Presets Panel -->
        <div class="bg-background border border-text-main/15 p-6 rounded-2xl">
            <h3 class="font-bold text-text-main text-base mb-4">Import Premium Preset Templates</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${PRESETS.map((preset, index) => `
                <div class="bg-panel-hover border border-text-main/15 rounded-xl overflow-hidden hover:border-text-main transition-all flex flex-col group">
                    <div class="h-28 overflow-hidden bg-slate-800 relative">
                        <img src="${preset.url}" alt="${preset.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        <span class="absolute top-2 left-2 text-[9px] font-semibold uppercase bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">${preset.category}</span>
                    </div>
                    <div class="p-3 flex-grow flex flex-col justify-between gap-3">
                        <h4 class="text-xs font-bold text-text-main truncate">${preset.title}</h4>
                        <button onclick="window.importPresetMedia('${pid}', ${index})" class="w-full py-1.5 bg-text-main text-background text-[10px] font-bold rounded-lg transition-colors cursor-pointer">
                            Import Preset
                        </button>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Active Media Grid -->
        <div class="bg-background border border-text-main/15 rounded-2xl p-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 class="font-bold text-text-main text-base">Active Assets (${projectAssets.length})</h3>
                <div class="relative w-48">
                    <input type="text" id="media-search-input" oninput="window.filterMediaAssets()" placeholder="Search assets..." class="w-full bg-panel-hover border border-text-main/15 rounded-xl pl-3 pr-8 py-2 text-xs text-text-main focus:outline-none focus:border-text-main transition-all">
                    <span class="absolute right-3 top-2.5 text-text-muted text-[10px]">${getIconSVG('search', 'w-3.5 h-3.5')}</span>
                </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                ${projectAssets.map(a => `
                <div class="media-asset-item bg-panel-hover border border-text-main/15 rounded-2xl overflow-hidden hover:border-text-main transition-all flex flex-col group relative"
                     data-title="${sanitizeHTML(a.title)}"
                     data-category="${a.category}">
                    <div class="h-40 overflow-hidden bg-slate-950 relative">
                        <img src="${a.url}" alt="${sanitizeHTML(a.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                        <span class="absolute top-3 left-3 text-[10px] font-semibold uppercase bg-black/60 text-white px-2 py-0.5 rounded backdrop-blur-sm">${a.category}</span>
                        <button onclick="window.deleteMediaAsset('${a.id}')" class="absolute top-3 right-3 w-7 h-7 bg-rose-600/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-colors backdrop-blur-sm cursor-pointer">✕</button>
                    </div>
                    <div class="p-4 flex flex-col gap-1">
                        <h4 class="font-bold text-text-main truncate text-xs" title="${sanitizeHTML(a.title)}">${sanitizeHTML(a.title)}</h4>
                        <div class="text-[9px] text-text-muted mt-1">Created ${formatTime(a.created)}</div>
                    </div>
                </div>
                `).join('')}
                ${projectAssets.length === 0 ? `
                    <div class="col-span-full text-center text-xs text-text-muted py-16 border border-dashed border-text-main/15 rounded-2xl">
                        🖼️ No media assets imported yet. Click a preset template above to load visual mockups.
                    </div>
                ` : ''}
            </div>
        </div>
    </div>

    <!-- Add Custom Media Modal -->
    <div id="add-media-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden z-50 animate-[fadeIn_0.2s_ease-out]">
        <div class="bg-background border border-text-main/20 p-6 rounded-2xl w-full max-w-md flex flex-col gap-4 text-text-main">
            <h3 class="text-lg font-bold font-outfit">Add Custom Graphic Asset</h3>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Asset Category</label>
                <select id="media-category" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main">
                    <option value="banner">Promotional Banner</option>
                    <option value="social">Social Media post (1:1 / 4:5)</option>
                    <option value="ad">Advertising Creative</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Asset Title / Tagline</label>
                <input id="media-title" type="text" maxlength="60" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main" placeholder="e.g. Q3 Launch Promo Banner">
            </div>
            <div>
                <label class="block text-xs font-bold text-text-muted uppercase mb-1">Image Asset URL</label>
                <input id="media-url" type="url" class="w-full bg-background border border-text-main/20 p-3 rounded-xl text-text-main text-xs focus:outline-none focus:border-text-main" placeholder="https://images.unsplash.com/... (or similar URL)">
            </div>
            <div class="flex justify-end gap-2 mt-2">
                <button onclick="window.hideAddMediaModal()" class="px-4 py-2 bg-background border border-text-main/20 rounded-xl text-xs font-semibold hover:bg-text-main/10 transition-colors cursor-pointer">Cancel</button>
                <button onclick="window.submitMediaForm('${pid}')" class="px-4 py-2 bg-text-main text-background rounded-xl text-xs font-bold transition-colors cursor-pointer">Create Asset</button>
            </div>
        </div>
    </div>
    `;
}
