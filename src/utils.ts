export function sanitizeHTML(str: string): string {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

export function formatTime(ms: number): string {
    const diff = Date.now() - ms;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

export function formatExactTime(ms: number): string {
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
