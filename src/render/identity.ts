import type { RenderContext } from '../types.js';
import { getModelName } from '../stdin.js';
import {
  dim, bold, blue, cyan, magenta, brightWhite, brightCyan, brightGreen, brightYellow, RESET,
  getContextColor, getModelColor,
} from './colors.js';
import { renderContextCircle, renderBar } from './bars.js';

export function renderIdentityLine(ctx: RenderContext): string {
  const { stdin, config, usageData, sessionStats, contextPercent } = ctx;
  const { layout, colorScheme, contextIndicator, barStyle, barWidth, showSessionStats } = config;

  const modelName = getModelName(stdin);
  const planName = config.showPlanName ? (usageData?.planName ?? null) : null;
  const modelLabel = planName ? `${modelName} | ${planName}` : modelName;

  if (layout === 'dashboard') {
    return renderDashboardIdentity(ctx, modelName, planName, modelLabel);
  }

  return renderStandardIdentity(ctx, modelLabel, contextPercent, showSessionStats, sessionStats);
}

function renderStandardIdentity(
  ctx: RenderContext,
  modelLabel: string,
  contextPercent: number,
  showSessionStats: boolean,
  sessionStats: RenderContext['sessionStats'],
): string {
  const { config } = ctx;
  const { colorScheme } = config;

  // [Model | Plan]
  const bracketedModel = bold(cyan(`[${modelLabel}]`));

  // Context indicator
  const circle = renderContextCircle(contextPercent, colorScheme);
  const ctxColorCode = getContextColor(contextPercent, colorScheme);
  const ctxPercent = `\x1b[1m${ctxColorCode}${contextPercent}%${RESET}`;
  const contextPart = `${circle} ${ctxPercent}`;

  let sessionPart = '';
  if (showSessionStats) {
    const { session } = sessionStats;
    const { models, totalTokens } = session;
    const label = dim('对话');
    const oPart = buildModelCount('O', models.O, colorScheme);
    const sPart = buildModelCount('S', models.S, colorScheme);
    const hPart = buildModelCount('H', models.H, colorScheme);
    const parts = [oPart, sPart, hPart].filter(Boolean).join(' ');
    const tokenStr = magenta(formatTokens(totalTokens));
    sessionPart = `  ${label} ${parts} ${tokenStr}`;
  }

  const cwdPart = ctx.stdin.cwd ? `  ${blue(`[${extractProjectName(ctx.stdin.cwd)}]`)}` : '';

  return `${bracketedModel}  ${contextPart}${sessionPart}${cwdPart}`;
}

function renderDashboardIdentity(
  ctx: RenderContext,
  modelName: string,
  planName: string | null,
  modelLabel: string,
): string {
  const { stdin, config, sessionStats, contextPercent } = ctx;
  const { colorScheme, barStyle, barWidth } = config;

  const session = sessionStats.session;
  const totalTokens = session.totalTokens;
  const tokenStr = magenta(formatTokens(totalTokens));

  const modelLine = `  ${dim('model')}  ${cyan(modelLabel)}  ${dim('tokens')} ${tokenStr}`;

  const ctxColorCode = getContextColor(contextPercent, colorScheme);
  const ctxColor = (s: string): string => `${ctxColorCode}${s}${RESET}`;
  const bar = renderBar(contextPercent, barWidth, barStyle, ctxColor);
  const ctxLine = `    ${dim('ctx')}  ${bar} ${ctxColorCode}${contextPercent}%${RESET}`;

  return `${modelLine}\n${ctxLine}`;
}

function extractProjectName(cwd: string): string {
  const home = process.env.HOME ?? '';
  const display = home && cwd.startsWith(home) ? '~' + cwd.slice(home.length) : cwd;
  // 只取最后一级目录名，如果是 home 则显示 ~
  const parts = cwd.split('/').filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : display;
}

function buildModelCount(model: 'O' | 'S' | 'H', count: number, scheme: RenderContext['config']['colorScheme']): string {
  if (count === 0) return '';
  const colorCode = getModelColor(model, scheme);
  const modelStr = bold(`${colorCode}${model}${RESET}`);
  const countStr = brightWhite(`×${count}`);
  return `${modelStr}:${countStr}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
