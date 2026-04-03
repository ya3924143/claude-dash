import type { BarStyle, ColorScheme } from '../types.js';
import { dim, green, brightBlue, yellow, red, RESET, getContextColor } from './colors.js';

const GRADIENT_CHARS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

export function renderBar(
  percent: number,
  width: number,
  style: BarStyle,
  colorFn: (s: string) => string,
): string {
  switch (style) {
    case 'block': return renderBlockBar(percent, width, colorFn);
    case 'half': return renderHalfBar(percent, width, colorFn);
    case 'gradient': return renderGradientBar(percent, width, colorFn);
    case 'ascii': return renderAsciiBar(percent, width, colorFn);
    case 'dot': return renderDotBar(percent);
    case 'circle': return renderCircleBar(percent);
    default: return renderBlockBar(percent, width, colorFn);
  }
}

function renderBlockBar(percent: number, width: number, colorFn: (s: string) => string): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const filledPart = colorFn('█'.repeat(filled));
  const emptyPart = dim('░'.repeat(empty));
  return filledPart + emptyPart;
}

function renderHalfBar(percent: number, width: number, colorFn: (s: string) => string): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const filledPart = colorFn('▓'.repeat(filled));
  const emptyPart = dim('░'.repeat(empty));
  return filledPart + emptyPart;
}

function renderGradientBar(percent: number, width: number, colorFn: (s: string) => string): string {
  const totalUnits = width * GRADIENT_CHARS.length;
  const filledUnits = Math.round((percent / 100) * totalUnits);
  const fullBlocks = Math.floor(filledUnits / GRADIENT_CHARS.length);
  const remainder = filledUnits % GRADIENT_CHARS.length;
  const empty = width - fullBlocks - (remainder > 0 ? 1 : 0);

  let bar = colorFn('█'.repeat(fullBlocks));
  if (remainder > 0) {
    bar += colorFn(GRADIENT_CHARS[remainder - 1] ?? '▏');
  }
  bar += dim('░'.repeat(Math.max(0, empty)));
  return bar;
}

function renderAsciiBar(percent: number, width: number, colorFn: (s: string) => string): string {
  const innerWidth = width - 2;
  const filled = Math.round((percent / 100) * innerWidth);
  const empty = innerWidth - filled;
  const filledPart = colorFn('='.repeat(filled));
  const emptyPart = dim('-'.repeat(empty));
  return `[${filledPart}${emptyPart}]`;
}

function renderDotBar(percent: number): string {
  if (percent < 25) return green('●');
  if (percent < 50) return brightBlue('●');
  if (percent < 75) return yellow('●');
  return red('●');
}

function renderCircleBar(percent: number): string {
  if (percent < 25) return green('○');
  if (percent < 50) return brightBlue('◔');
  if (percent < 75) return yellow('◑');
  if (percent < 100) return yellow('◕');
  return red('●');
}

export function renderContextCircle(percent: number, scheme: ColorScheme): string {
  const colorCode = getContextColor(percent, scheme);
  if (percent < 20) return `${colorCode}○${RESET}`;
  if (percent < 40) return `${colorCode}◔${RESET}`;
  if (percent < 60) return `${colorCode}◑${RESET}`;
  if (percent < 80) return `${colorCode}◕${RESET}`;
  return `${colorCode}●${RESET}`;
}
