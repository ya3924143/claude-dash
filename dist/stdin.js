export async function readStdin() {
    if (process.stdin.isTTY)
        return null;
    const chunks = [];
    try {
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) {
            chunks.push(chunk);
        }
        const raw = chunks.join('');
        if (!raw.trim())
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function getTotalTokens(stdin) {
    const usage = stdin.context_window?.current_usage;
    return (usage?.input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0);
}
export function getContextPercent(stdin) {
    // Prefer native percentage (v2.1.6+)
    const native = stdin.context_window?.used_percentage;
    if (typeof native === 'number' && !Number.isNaN(native)) {
        return Math.min(100, Math.max(0, Math.round(native)));
    }
    // Fallback: manual calculation
    const size = stdin.context_window?.context_window_size;
    if (!size || size <= 0)
        return 0;
    return Math.min(100, Math.round((getTotalTokens(stdin) / size) * 100));
}
export function getModelName(stdin) {
    return stdin.model?.display_name?.trim() || stdin.model?.id?.trim() || 'Unknown';
}
//# sourceMappingURL=stdin.js.map