import { dim, RESET } from './colors.js';
import { getModelColor } from './colors.js';
export function formatTokens(n) {
    if (n >= 1_000_000)
        return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)
        return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
}
export function renderTurnsLine(ctx) {
    const { config, sessionStats } = ctx;
    const { showLastTurn, showCurrentTurn } = config;
    if (!showLastTurn && !showCurrentTurn)
        return null;
    const { lastTurn, currentTurn } = sessionStats;
    const { layout, colorScheme } = config;
    if (layout === 'dashboard') {
        return renderDashboardTurns(ctx);
    }
    return renderStandardTurns(ctx);
}
function renderStandardTurns(ctx) {
    const { config, sessionStats } = ctx;
    const { showLastTurn, showCurrentTurn, colorScheme } = config;
    const { lastTurn, currentTurn } = sessionStats;
    const segments = [];
    if (showLastTurn) {
        segments.push(buildTurnSegment('上轮', lastTurn.models, lastTurn.totalTokens, colorScheme));
    }
    if (showCurrentTurn) {
        segments.push(buildTurnSegment('本轮', currentTurn.models, currentTurn.totalTokens, colorScheme));
    }
    return segments.join(`  ${dim('│')}  `);
}
function renderDashboardTurns(ctx) {
    const { config, sessionStats } = ctx;
    const { showLastTurn, showCurrentTurn, colorScheme } = config;
    const { lastTurn, currentTurn } = sessionStats;
    const lines = [];
    if (showLastTurn) {
        lines.push(buildDashboardTurnLine('上轮', lastTurn.models, lastTurn.totalTokens, colorScheme));
    }
    if (showCurrentTurn) {
        lines.push(buildDashboardTurnLine('本轮', currentTurn.models, currentTurn.totalTokens, colorScheme));
    }
    return lines.join('\n');
}
function buildTurnSegment(label, models, totalTokens, colorScheme) {
    const labelStr = dim(label);
    const modelParts = buildModelParts(models, colorScheme);
    const tokenStr = dim(formatTokens(totalTokens));
    const modelStr = modelParts.length > 0 ? `${modelParts.join(' ')} ` : '';
    return `${labelStr} ${modelStr}${tokenStr}`;
}
function buildDashboardTurnLine(label, models, totalTokens, colorScheme) {
    const paddedLabel = label.padStart(2);
    const labelStr = dim(paddedLabel);
    const modelParts = buildModelParts(models, colorScheme);
    const tokenStr = dim(formatTokens(totalTokens));
    const modelStr = modelParts.length > 0 ? `${modelParts.join(' ')} ` : '';
    return `   ${labelStr}  ${modelStr}${tokenStr}`;
}
function buildModelParts(models, colorScheme) {
    const parts = [];
    const entries = [
        ['O', models.O],
        ['S', models.S],
        ['H', models.H],
    ];
    for (const [model, count] of entries) {
        if (count > 0) {
            const colorCode = getModelColor(model, colorScheme);
            parts.push(`${colorCode}${model}${RESET}:×${count}`);
        }
    }
    return parts;
}
//# sourceMappingURL=turns.js.map