import type { RenderContext, ModelCount } from '../types.js';
import { dim, bold, yellow, brightYellow, RESET } from './colors.js';
import { getModelColor } from './colors.js';
import { renderBar } from './bars.js';

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function renderTurnsLine(ctx: RenderContext): string | null {
  const { config, sessionStats } = ctx;
  const { showLastTurn, showCurrentTurn } = config;

  if (!showLastTurn && !showCurrentTurn) return null;

  const { lastTurn, currentTurn } = sessionStats;
  const { layout, colorScheme } = config;

  if (layout === 'dashboard') {
    return renderDashboardTurns(ctx);
  }
  return renderStandardTurns(ctx);
}

function renderStandardTurns(ctx: RenderContext): string {
  const { config, sessionStats, usageData } = ctx;
  const { showLastTurn, showCurrentTurn, colorScheme } = config;
  const { lastTurn, currentTurn } = sessionStats;

  const segments: string[] = [];

  if (showLastTurn) {
    segments.push(buildTurnSegment('上轮', lastTurn.models, lastTurn.totalTokens, colorScheme));
  }

  if (showCurrentTurn) {
    segments.push(buildTurnSegment('本轮', currentTurn.models, currentTurn.totalTokens, colorScheme));
  }

  // Sonnet-only weekly quota — append after turns
  segments.push(buildSonnetQuotaSegment(usageData?.sevenDaySonnet ?? null));

  return segments.join(`  ${dim('│')}  `);
}

function buildSonnetQuotaSegment(percent: number | null): string {
  const label = bold(yellow('Sonnet Only'));
  if (percent === null) {
    return `${label} ${dim('--')}`;
  }
  const bar = renderBar(percent, 6, 'gradient', brightYellow);
  return `${label} ${bar} ${dim(`${percent}%`)}`;
}

function renderDashboardTurns(ctx: RenderContext): string {
  const { config, sessionStats } = ctx;
  const { showLastTurn, showCurrentTurn, colorScheme } = config;
  const { lastTurn, currentTurn } = sessionStats;

  const lines: string[] = [];

  if (showLastTurn) {
    lines.push(buildDashboardTurnLine('上轮', lastTurn.models, lastTurn.totalTokens, colorScheme));
  }

  if (showCurrentTurn) {
    lines.push(buildDashboardTurnLine('本轮', currentTurn.models, currentTurn.totalTokens, colorScheme));
  }

  return lines.join('\n');
}

function buildTurnSegment(
  label: string,
  models: ModelCount,
  totalTokens: number,
  colorScheme: RenderContext['config']['colorScheme'],
): string {
  const labelStr = dim(label);
  const modelParts = buildModelParts(models, colorScheme);
  const tokenStr = dim(formatTokens(totalTokens));
  const modelStr = modelParts.length > 0 ? `${modelParts.join(' ')} ` : '';
  return `${labelStr} ${modelStr}${tokenStr}`;
}

function buildDashboardTurnLine(
  label: string,
  models: ModelCount,
  totalTokens: number,
  colorScheme: RenderContext['config']['colorScheme'],
): string {
  const paddedLabel = label.padStart(2);
  const labelStr = dim(paddedLabel);
  const modelParts = buildModelParts(models, colorScheme);
  const tokenStr = dim(formatTokens(totalTokens));
  const modelStr = modelParts.length > 0 ? `${modelParts.join(' ')} ` : '';
  return `   ${labelStr}  ${modelStr}${tokenStr}`;
}

function buildModelParts(models: ModelCount, colorScheme: RenderContext['config']['colorScheme']): string[] {
  const parts: string[] = [];
  const entries: Array<['O' | 'S' | 'H', number]> = [
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
