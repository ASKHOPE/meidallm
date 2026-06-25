import { getIconSVG } from "./icons";

export function renderAIAssistantDrawer(): string {
    return `
    <!-- Collapsible AI Assistant slide-out drawer -->
    <aside id="ai-assistant-drawer" class="w-80 bg-background border-l border-text-main/15 flex flex-col p-5 transition-all duration-300 transform translate-x-full fixed right-0 top-0 bottom-0 z-40 shadow-xl">
        <div class="flex justify-between items-center mb-5 pb-3 border-b border-text-main/10">
            <div class="flex items-center gap-2 text-text-main">
                ${getIconSVG('bot', 'w-5 h-5')}
                <h3 class="font-bold font-outfit text-sm">AI Assistant</h3>
            </div>
            <button onclick="window.toggleAiAssistant(false)" class="text-text-muted hover:text-text-main transition-colors text-sm">${getIconSVG('close', 'w-4 h-4')}</button>
        </div>
        
        <div id="ai-chat-thread" class="flex-grow overflow-y-auto flex flex-col gap-4 text-xs pr-1">
            <div class="bg-text-main/5 p-3 rounded-lg border border-text-main/10 text-text-muted leading-relaxed">
                Hello! I am your AI assistant. I have full context of your database tables, tasks, cycles, and CRM. Try asking:
                <ul class="list-disc pl-4 mt-2 flex flex-col gap-1.5">
                    <li><button onclick="window.sendAiMessage('Show tasks at risk')" class="text-left text-text-main underline hover:text-text-main/80">Show tasks at risk</button></li>
                    <li><button onclick="window.sendAiMessage('Summarize current cycle progress')" class="text-left text-text-main underline hover:text-text-main/80">Summarize current cycle progress</button></li>
                    <li><button onclick="window.sendAiMessage('Recommend copywriting tone')" class="text-left text-text-main underline hover:text-text-main/80">Recommend copywriting tone</button></li>
                    <li><button onclick="window.openCreativeWizard()" class="text-left text-purple-500 font-bold underline hover:text-purple-400">Launch Creative Wizard ✨</button></li>
                </ul>
            </div>
        </div>
        
        <form id="ai-chat-form" onsubmit="event.preventDefault(); window.submitAiChat();" class="mt-4 pt-4 border-t border-text-main/10 flex gap-2">
            <input type="text" id="ai-chat-input" placeholder="Ask AI assistant..." class="flex-grow bg-background border border-text-main/15 p-2.5 rounded-lg text-text-main text-xs focus:outline-none focus:border-text-main">
            <button type="submit" class="px-3 bg-text-main text-background font-bold text-xs rounded-lg hover:bg-text-main/90 transition-colors">Send</button>
        </form>
    </aside>
    `;
}
