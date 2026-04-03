import fs from 'fs';
import path from 'path';
import readline from 'readline';
function emptyModelCount() {
    return { O: 0, S: 0, H: 0, tokens: 0 };
}
function emptyTurnStats() {
    return { models: emptyModelCount(), totalTokens: 0 };
}
function classifyModel(modelId) {
    const lower = modelId.toLowerCase();
    if (lower.includes('opus'))
        return 'O';
    if (lower.includes('sonnet'))
        return 'S';
    if (lower.includes('haiku'))
        return 'H';
    return null;
}
function addModelUsage(turn, modelId, tokenCount) {
    const key = classifyModel(modelId);
    const updatedModels = {
        ...turn.models,
        tokens: turn.models.tokens + tokenCount,
        ...(key !== null ? { [key]: turn.models[key] + 1 } : {}),
    };
    return {
        models: updatedModels,
        totalTokens: turn.totalTokens + tokenCount,
    };
}
function mergeTurnStats(a, b) {
    return {
        models: {
            O: a.models.O + b.models.O,
            S: a.models.S + b.models.S,
            H: a.models.H + b.models.H,
            tokens: a.models.tokens + b.models.tokens,
        },
        totalTokens: a.totalTokens + b.totalTokens,
    };
}
export async function parseSessionStats(transcriptPath) {
    const empty = () => ({
        lastTurn: emptyTurnStats(),
        currentTurn: emptyTurnStats(),
        session: emptyTurnStats(),
    });
    if (!fs.existsSync(transcriptPath)) {
        return empty();
    }
    let stream;
    try {
        stream = fs.createReadStream(transcriptPath, { encoding: 'utf8' });
    }
    catch {
        return empty();
    }
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    // Each element: { stats, startedAt } — one per user message
    const turns = [];
    let currentTurn = emptyTurnStats();
    let currentStartedAt = '';
    let inTurn = false;
    try {
        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            let entry;
            try {
                entry = JSON.parse(trimmed);
            }
            catch {
                continue;
            }
            if (entry['type'] === 'user' || entry['type'] === 'human') {
                if (inTurn) {
                    turns.push({ stats: currentTurn, startedAt: currentStartedAt });
                    currentTurn = emptyTurnStats();
                }
                currentStartedAt = entry['timestamp'] ?? '';
                inTurn = true;
                continue;
            }
            if (entry['type'] === 'assistant' && inTurn) {
                const message = entry['message'];
                if (!message)
                    continue;
                const usage = message['usage'];
                const modelId = message['model'];
                if (usage && modelId) {
                    const tokenCount = (usage['input_tokens'] ?? 0) +
                        (usage['output_tokens'] ?? 0) +
                        (usage['cache_read_input_tokens'] ?? 0) +
                        (usage['cache_creation_input_tokens'] ?? 0);
                    currentTurn = addModelUsage(currentTurn, modelId, tokenCount);
                }
            }
        }
    }
    catch {
        // Stream errors — return what we have so far
    }
    finally {
        rl.close();
    }
    if (inTurn) {
        turns.push({ stats: currentTurn, startedAt: currentStartedAt });
    }
    // Collect turn timestamps for sub-agent attribution
    const turnTimestamps = turns.map(t => t.startedAt);
    // Parse sub-agents and attribute to turns by timestamp
    const subagentEntries = await parseSubagentEntries(transcriptPath);
    const turnStatsWithSubagents = turns.map((turn, i) => {
        const turnStart = turnTimestamps[i];
        const nextTurnStart = turnTimestamps[i + 1] ?? '\uffff'; // after everything
        const matched = subagentEntries.filter(e => e.timestamp >= turnStart && e.timestamp < nextTurnStart);
        const subStats = matched.reduce((acc, e) => addModelUsage(acc, e.modelId, e.tokenCount), emptyTurnStats());
        return mergeTurnStats(turn.stats, subStats);
    });
    const session = turnStatsWithSubagents.reduce(mergeTurnStats, emptyTurnStats());
    const lastTurn = turnStatsWithSubagents.length >= 2
        ? turnStatsWithSubagents[turnStatsWithSubagents.length - 2]
        : emptyTurnStats();
    const latestTurn = turnStatsWithSubagents.length >= 1
        ? turnStatsWithSubagents[turnStatsWithSubagents.length - 1]
        : emptyTurnStats();
    return {
        lastTurn,
        currentTurn: latestTurn,
        session,
    };
}
async function parseSubagentEntries(transcriptPath) {
    const sessionDir = transcriptPath.replace(/\.jsonl$/, '');
    const subagentsDir = path.join(sessionDir, 'subagents');
    if (!fs.existsSync(subagentsDir)) {
        return [];
    }
    let files;
    try {
        files = fs.readdirSync(subagentsDir).filter(f => f.endsWith('.jsonl'));
    }
    catch {
        return [];
    }
    const allEntries = [];
    for (const file of files) {
        const filePath = path.join(subagentsDir, file);
        const entries = await parseSubagentFile(filePath);
        allEntries.push(...entries);
    }
    return allEntries;
}
async function parseSubagentFile(filePath) {
    let stream;
    try {
        stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    }
    catch {
        return [];
    }
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    const entries = [];
    try {
        for await (const line of rl) {
            const trimmed = line.trim();
            if (!trimmed)
                continue;
            let entry;
            try {
                entry = JSON.parse(trimmed);
            }
            catch {
                continue;
            }
            if (entry['type'] !== 'assistant')
                continue;
            const timestamp = entry['timestamp'] ?? '';
            const message = entry['message'];
            if (!message)
                continue;
            const usage = message['usage'];
            const modelId = message['model'];
            if (usage && modelId) {
                const tokenCount = (usage['input_tokens'] ?? 0) +
                    (usage['output_tokens'] ?? 0) +
                    (usage['cache_read_input_tokens'] ?? 0) +
                    (usage['cache_creation_input_tokens'] ?? 0);
                entries.push({ timestamp, modelId, tokenCount });
            }
        }
    }
    catch {
        // Stream errors — return what we have
    }
    finally {
        rl.close();
    }
    return entries;
}
//# sourceMappingURL=transcript.js.map