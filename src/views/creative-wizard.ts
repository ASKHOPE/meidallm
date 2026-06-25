import { getIconSVG } from "./icons";

export function renderCreativeWizardModal(): string {
    return `
    <div id="creative-wizard-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm hidden items-center justify-center z-50 animate-[fadeIn_0.15s_ease-out]">
        <div class="bg-background border border-text-main/20 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div class="flex items-center justify-between border-b border-text-main/10 p-5 bg-text-main/5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        ${getIconSVG('idea-canvas', 'w-6 h-6')}
                    </div>
                    <div>
                        <h2 class="text-lg font-bold font-outfit text-text-main">Creative Campaign Wizard</h2>
                        <p class="text-xs text-text-muted mt-0.5">Auto-generate briefs, tasks, and budgets using AI.</p>
                    </div>
                </div>
                <button onclick="window.closeCreativeWizard()" class="text-text-muted hover:text-text-main transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-text-main/10">
                    ${getIconSVG('close', 'w-5 h-5')}
                </button>
            </div>
            
            <div class="flex-grow overflow-y-auto p-6" id="wizard-content">
                <!-- Step 1: Campaign Details -->
                <div id="wizard-step-1" class="flex flex-col gap-5">
                    <div>
                        <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Campaign Name</label>
                        <input type="text" id="wizard-campaign-name" placeholder="e.g. Q4 Holiday Launch" class="w-full bg-background border border-text-main/15 p-3 rounded-lg text-text-main text-sm focus:outline-none focus:border-purple-500 transition-colors">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Target Audience & Goals</label>
                        <textarea id="wizard-campaign-goals" rows="3" placeholder="Describe the audience and main objectives..." class="w-full bg-background border border-text-main/15 p-3 rounded-lg text-text-main text-sm focus:outline-none focus:border-purple-500 transition-colors resize-none"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Platform</label>
                            <select class="w-full bg-background border border-text-main/15 p-3 rounded-lg text-text-main text-sm focus:outline-none focus:border-purple-500 cursor-pointer">
                                <option>Omnichannel</option>
                                <option>Social Media</option>
                                <option>Email & CRM</option>
                                <option>Web & SEO</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Estimated Budget</label>
                            <input type="number" placeholder="USD" class="w-full bg-background border border-text-main/15 p-3 rounded-lg text-text-main text-sm focus:outline-none focus:border-purple-500 transition-colors">
                        </div>
                    </div>
                </div>

                <!-- Step 2: AI Generating (Hidden initially) -->
                <div id="wizard-step-2" class="hidden flex-col items-center justify-center py-12 gap-4">
                    <div class="w-12 h-12 border-4 border-text-main/10 border-t-purple-500 rounded-full animate-spin"></div>
                    <p class="text-sm font-bold text-text-main animate-pulse">MeidaLLM Brain is analyzing parameters...</p>
                    <p class="text-xs text-text-muted">Drafting creative brief and extracting initial tasks.</p>
                </div>

                <!-- Step 3: Review & Approve (Hidden initially) -->
                <div id="wizard-step-3" class="hidden flex-col gap-5">
                    <div class="bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl">
                        <h3 class="font-bold text-sm text-text-main mb-2 flex items-center gap-2">${getIconSVG('bot', 'w-4 h-4 text-purple-500')} Generated Creative Brief</h3>
                        <div class="text-xs text-text-muted leading-relaxed space-y-2">
                            <p><strong>Objective:</strong> Drive 20% increase in holiday sales across demographics.</p>
                            <p><strong>Tone:</strong> Festivity, Urgency, Exclusivity.</p>
                            <p><strong>Deliverables:</strong> 3x Video Ads, 5x Email Blasts, Landing Page Refresh.</p>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="font-bold text-sm text-text-main mb-3">Suggested Task Breakdown</h3>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center gap-3 bg-background border border-text-main/15 p-3 rounded-lg">
                                <input type="checkbox" checked class="w-4 h-4 rounded border-text-main/20 text-purple-500 focus:ring-purple-500 cursor-pointer">
                                <span class="text-xs font-bold text-text-main">Draft initial video scripts</span>
                                <span class="ml-auto text-[10px] bg-text-main/10 px-2 py-0.5 rounded text-text-muted">Pre-production</span>
                            </div>
                            <div class="flex items-center gap-3 bg-background border border-text-main/15 p-3 rounded-lg">
                                <input type="checkbox" checked class="w-4 h-4 rounded border-text-main/20 text-purple-500 focus:ring-purple-500 cursor-pointer">
                                <span class="text-xs font-bold text-text-main">Design email newsletter templates</span>
                                <span class="ml-auto text-[10px] bg-text-main/10 px-2 py-0.5 rounded text-text-muted">Design</span>
                            </div>
                            <div class="flex items-center gap-3 bg-background border border-text-main/15 p-3 rounded-lg">
                                <input type="checkbox" checked class="w-4 h-4 rounded border-text-main/20 text-purple-500 focus:ring-purple-500 cursor-pointer">
                                <span class="text-xs font-bold text-text-main">Set up tracking pixels for landing page</span>
                                <span class="ml-auto text-[10px] bg-text-main/10 px-2 py-0.5 rounded text-text-muted">Technical</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="border-t border-text-main/10 p-5 bg-text-main/5 flex justify-between items-center">
                <button id="wizard-btn-back" class="hidden px-4 py-2 bg-background border border-text-main/15 hover:bg-text-main/5 rounded-lg text-xs font-bold text-text-main transition-colors" onclick="window.wizardStep(-1)">Back</button>
                <div class="flex-grow"></div>
                <button id="wizard-btn-next" class="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="window.wizardStep(1)">
                    Generate via AI ${getIconSVG('bot', 'w-4 h-4')}
                </button>
                <button id="wizard-btn-finish" class="hidden px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-2" onclick="window.finishWizard()">
                    Create Workspace ${getIconSVG('check', 'w-4 h-4')}
                </button>
            </div>
        </div>
    </div>
    `;
}
