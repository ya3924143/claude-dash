import { PRESET_LIST } from './presets.js';
import { render } from './render/index.js';
import { RESET } from './render/colors.js';
const MOCK_STDIN = {
    model: { display_name: 'Opus 4.6 (1M context)' },
    context_window: {
        context_window_size: 1_000_000,
        used_percentage: 4,
        current_usage: { input_tokens: 37_628 },
    },
};
const MOCK_USAGE = {
    planName: 'Max',
    fiveHour: 19,
    sevenDay: 41,
    fiveHourResetAt: new Date(Date.now() + 3 * 3_600_000 + 42 * 60_000),
    sevenDayResetAt: new Date(Date.now() + 4 * 86_400_000 + 11 * 3_600_000),
};
const MOCK_SESSION_STATS = {
    lastTurn: { models: { O: 3, S: 1, H: 0, tokens: 12_400 }, totalTokens: 12_400 },
    currentTurn: { models: { O: 5, S: 2, H: 1, tokens: 18_700 }, totalTokens: 18_700 },
    session: { models: { O: 28, S: 14, H: 6, tokens: 384_200 }, totalTokens: 384_200 },
};
function printDivider(name, description) {
    const line = '─'.repeat(60);
    process.stdout.write(`${RESET}\n${line}\n`);
    process.stdout.write(`  ${name.padEnd(12)}  ${description}\n`);
    process.stdout.write(`${line}\n`);
}
function previewAll() {
    process.stdout.write(`${RESET}claude-dash 预览 — 所有 ${PRESET_LIST.length} 个方案\n`);
    for (const { name, description, config } of PRESET_LIST) {
        printDivider(name, description);
        const ctx = {
            stdin: MOCK_STDIN,
            config,
            usageData: MOCK_USAGE,
            sessionStats: MOCK_SESSION_STATS,
            contextPercent: 4,
        };
        render(ctx);
        process.stdout.write('\n');
    }
    process.stdout.write(`${RESET}以上为模拟数据渲染。使用 /claude-dash:setup 选择方案。\n`);
}
previewAll();
//# sourceMappingURL=preview.js.map