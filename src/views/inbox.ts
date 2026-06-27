import { state, notifyStateChange } from "../state";
import { getIconSVG } from "./icons";
import { sanitizeHTML, formatTime } from "../utils";

export function renderInboxView(): string {
    const currentUser = state.team.find(t => t.email === state.currentUser);
    if (!currentUser) return `<div class="p-8 text-center text-text-muted">Please log in to view inbox.</div>`;

    // Initialize global session state for inbox if not present
    if (typeof window !== 'undefined' && !(window as any).__inboxSession) {
        (window as any).__inboxSession = {
            activeThreadId: null,
            newMessageTo: null
        };
        
        (window as any).setActiveThread = (id: string) => {
            (window as any).__inboxSession.activeThreadId = id;
            (window as any).__inboxSession.newMessageTo = null;
            notifyStateChange(true);
        };

        (window as any).startNewMessage = (userId: string) => {
            // Find existing thread with just these two people
            const existingThread = state.messageThreads.find(t => 
                t.participants.length === 2 && 
                t.participants.includes(currentUser.id) && 
                t.participants.includes(userId)
            );
            
            if (existingThread) {
                (window as any).setActiveThread(existingThread.id);
            } else {
                (window as any).__inboxSession.activeThreadId = null;
                (window as any).__inboxSession.newMessageTo = userId;
                notifyStateChange(true);
            }
        };

        (window as any).sendInboxMessage = () => {
            const input = document.getElementById('inbox-msg-input') as HTMLInputElement;
            const content = input?.value?.trim();
            if (!content) return;
            
            const session = (window as any).__inboxSession;
            let threadId = session.activeThreadId;
            let targetId = session.newMessageTo;
            
            if (!threadId) {
                if (!targetId) return;
                threadId = 'th-' + Math.random().toString(36).substr(2, 9);
                session.activeThreadId = threadId;
                session.newMessageTo = null;
            }
            
            (window as any).sendMessage(threadId, content, targetId ? [targetId] : []);
            
            // Re-render
            notifyStateChange(true);
        };
    }

    const session = (window as any)?.__inboxSession || { activeThreadId: null, newMessageTo: null };
    
    // Filter threads that involve the current user
    const myThreads = state.messageThreads.filter(t => t.participants.includes(currentUser.id));
    
    // Sort threads by updated timestamp
    myThreads.sort((a, b) => b.updated - a.updated);
    
    if (!session.activeThreadId && myThreads.length > 0 && !session.newMessageTo) {
        session.activeThreadId = myThreads[0].id;
    }

    // LHS: Thread List
    const threadsHtml = myThreads.map(th => {
        const otherParticipantIds = th.participants.filter(p => p !== currentUser.id);
        const otherParticipants = otherParticipantIds.map(id => state.team.find(t => t.id === id)?.name || 'Unknown');
        const title = otherParticipants.length > 0 ? otherParticipants.join(', ') : 'Self Note';
        const lastMsg = th.messages.length > 0 ? th.messages[th.messages.length - 1].content : 'No messages';
        
        const isActive = session.activeThreadId === th.id;
        
        return `
            <div class="p-3 border-b border-text-main/10 cursor-pointer hover:bg-text-main/5 transition-colors ${isActive ? 'bg-purple-500/10 border-l-2 border-l-purple-500' : ''}" onclick="window.setActiveThread('${th.id}')">
                <div class="flex justify-between items-center mb-1">
                    <h4 class="text-xs font-bold truncate text-text-main pr-2">${sanitizeHTML(title)}</h4>
                    <span class="text-[9px] text-text-muted shrink-0">${formatTime(th.updated)}</span>
                </div>
                <p class="text-[10px] text-text-muted truncate">${sanitizeHTML(lastMsg)}</p>
            </div>
        `;
    }).join('') || `<div class="p-4 text-center text-[10px] text-text-muted">No messages yet.</div>`;

    // Users list for "New Message"
    const userListHtml = state.team.filter(t => t.id !== currentUser.id).map(u => `
        <button class="flex items-center gap-2 p-2 hover:bg-text-main/5 rounded transition-colors w-full text-left" onclick="window.startNewMessage('${u.id}')">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style="background-color: ${u.avatarColor}">${u.name.charAt(0)}</div>
            <div class="flex-1">
                <div class="text-xs font-bold text-text-main">${sanitizeHTML(u.name)}</div>
                <div class="text-[9px] text-text-muted">${sanitizeHTML(u.role)}</div>
            </div>
        </button>
    `).join('');

    // RHS: Active Thread or New Message View
    let rightContent = '';
    
    if (session.newMessageTo) {
        const targetUser = state.team.find(t => t.id === session.newMessageTo);
        rightContent = `
            <div class="p-4 border-b border-text-main/10 flex items-center gap-3 bg-text-main/5">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold" style="background-color: ${targetUser?.avatarColor}">${targetUser?.name.charAt(0) || '?'}</div>
                <div>
                    <h3 class="font-bold text-sm text-text-main">New Message to ${sanitizeHTML(targetUser?.name || 'Unknown')}</h3>
                    <p class="text-[10px] text-text-muted">Start a new conversation</p>
                </div>
            </div>
            <div class="flex-1 flex flex-col items-center justify-center text-text-muted p-8">
                ${getIconSVG('mail', 'w-12 h-12 mb-4 opacity-50')}
                <p class="text-xs">Type your first message below to start the thread.</p>
            </div>
        `;
    } else if (session.activeThreadId) {
        const th = state.messageThreads.find(t => t.id === session.activeThreadId);
        if (th) {
            const otherParticipantIds = th.participants.filter(p => p !== currentUser.id);
            const otherParticipants = otherParticipantIds.map(id => state.team.find(t => t.id === id));
            const title = otherParticipants.length > 0 ? otherParticipants.map(u => u?.name).join(', ') : 'Self Note';
            
            const messagesHtml = th.messages.map(m => {
                const isMe = m.senderId === currentUser.id;
                const sender = isMe ? currentUser : state.team.find(t => t.id === m.senderId);
                return `
                    <div class="flex flex-col gap-1 mb-4 ${isMe ? 'items-end' : 'items-start'}">
                        <div class="flex items-center gap-2 ${isMe ? 'flex-row-reverse' : ''}">
                            <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style="background-color: ${sender?.avatarColor}">${sender?.name.charAt(0) || '?'}</div>
                            <span class="text-[9px] text-text-muted font-bold">${isMe ? 'You' : sanitizeHTML(sender?.name || 'Unknown')}</span>
                            <span class="text-[8px] text-text-muted/60">${formatTime(m.timestamp)}</span>
                        </div>
                        <div class="max-w-[80%] rounded-2xl p-3 text-xs ${isMe ? 'bg-purple-500 text-white rounded-tr-sm' : 'bg-text-main/10 text-text-main rounded-tl-sm'}">
                            ${sanitizeHTML(m.content).replace(/\\n/g, '<br>')}
                        </div>
                    </div>
                `;
            }).join('');

            rightContent = `
                <div class="p-4 border-b border-text-main/10 flex items-center gap-3 bg-text-main/5 sticky top-0 z-10">
                    <h3 class="font-bold text-sm text-text-main flex items-center gap-2">
                        ${getIconSVG('message-square', 'w-4 h-4 text-purple-500')}
                        ${sanitizeHTML(title)}
                    </h3>
                </div>
                <div class="flex-1 p-4 overflow-y-auto flex flex-col custom-scrollbar">
                    ${messagesHtml}
                </div>
            `;
        }
    } else {
        rightContent = `
            <div class="flex-1 flex flex-col items-center justify-center text-text-muted p-8">
                ${getIconSVG('inbox', 'w-16 h-16 mb-4 opacity-30')}
                <p class="text-sm font-bold">Your Inbox</p>
                <p class="text-xs opacity-70 mt-1">Select a conversation or start a new one.</p>
            </div>
        `;
    }

    return `
    <div class="fade-in flex flex-col h-[calc(100vh-80px)] max-w-6xl mx-auto w-full bg-background border border-text-main/10 rounded-xl overflow-hidden shadow-sm">
        <div class="flex h-full">
            <!-- Sidebar -->
            <div class="w-64 border-r border-text-main/10 flex flex-col shrink-0 bg-text-main/5">
                <div class="p-4 border-b border-text-main/10 flex justify-between items-center">
                    <h2 class="font-bold font-outfit flex items-center gap-2 text-text-main">
                        ${getIconSVG('mail', 'w-4 h-4 text-purple-500')} Inbox
                    </h2>
                </div>
                
                <div class="flex-1 overflow-y-auto custom-scrollbar">
                    ${threadsHtml}
                </div>

                <div class="p-3 border-t border-text-main/10 bg-background">
                    <details class="group">
                        <summary class="flex items-center gap-2 p-2 hover:bg-text-main/5 rounded transition-colors text-xs font-bold text-text-main cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                            ${getIconSVG('plus', 'w-3 h-3')} New Message
                        </summary>
                        <div class="mt-2 pt-2 border-t border-text-main/10 flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar">
                            ${userListHtml}
                        </div>
                    </details>
                </div>
            </div>

            <!-- Main Chat Area -->
            <div class="flex-1 flex flex-col bg-background relative">
                ${rightContent}
                
                <!-- Message Input -->
                ${(session.activeThreadId || session.newMessageTo) ? `
                <div class="p-4 border-t border-text-main/10 bg-background sticky bottom-0">
                    <div class="flex gap-2">
                        <input type="text" id="inbox-msg-input" placeholder="Type your message..." class="flex-1 bg-text-main/5 border border-text-main/10 rounded-lg px-4 py-2 text-sm text-text-main outline-none focus:border-purple-500 transition-colors" onkeydown="if(event.key === 'Enter') window.sendInboxMessage()">
                        <button onclick="window.sendInboxMessage()" class="bg-purple-500 hover:bg-purple-600 text-white p-2 w-10 h-10 rounded-lg flex items-center justify-center transition-colors shadow-md">
                            ${getIconSVG('arrow-right', 'w-4 h-4')}
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    `;
}
