import type { RenderContext } from '../types.js';
import { renderIdentityLine } from './identity.js';
import { renderUsageLine } from './usage.js';
import { renderTurnsLine } from './turns.js';
import { RESET } from './colors.js';

// ANSI escape sequence pattern
const ANSI_PATTERN = /\x1b\[[0-9;]*[a-zA-Z]/g;

export function stripAnsi(str: string): string {
  return str.replace(ANSI_PATTERN, '');
}

export function visualLength(str: string): number {
  const plain = stripAnsi(str);
  let length = 0;
  for (const char of plain) {
    const codePoint = char.codePointAt(0) ?? 0;
    // CJK Unified Ideographs, CJK Compatibility Ideographs, CJK Extension A/B,
    // Hangul, Hiragana, Katakana, Fullwidth Forms, and other double-width ranges
    if (
      (codePoint >= 0x1100 && codePoint <= 0x115f) ||   // Hangul Jamo
      (codePoint >= 0x2e80 && codePoint <= 0x303e) ||   // CJK Radicals
      (codePoint >= 0x3041 && codePoint <= 0x33ff) ||   // Japanese
      (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||   // CJK Extension A
      (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||   // CJK Unified Ideographs
      (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||   // Yi
      (codePoint >= 0xac00 && codePoint <= 0xd7af) ||   // Hangul Syllables
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||   // CJK Compatibility Ideographs
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||   // Vertical forms
      (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||   // CJK Compatibility Forms
      (codePoint >= 0xff00 && codePoint <= 0xff60) ||   // Fullwidth Forms
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||   // Fullwidth Signs
      (codePoint >= 0x1f300 && codePoint <= 0x1f64f) || // Misc Symbols and Pictographs
      (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) || // Supplemental Symbols
      (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
      (codePoint >= 0x2a700 && codePoint <= 0x2ceaf) || // CJK Extensions C/D/E
      (codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) || // CJK Extension F
      (codePoint >= 0x30000 && codePoint <= 0x3134f)    // CJK Extension G
    ) {
      length += 2;
    } else {
      length += 1;
    }
  }
  return length;
}

export function truncateToWidth(str: string, maxWidth: number): string {
  if (visualLength(str) <= maxWidth) return str;

  const suffix = '...';
  const suffixLen = suffix.length;
  const targetWidth = maxWidth - suffixLen;

  // Walk through the string character by character, respecting ANSI sequences
  const stripped = stripAnsi(str);
  let visibleWidth = 0;
  let charIndex = 0;

  for (const char of stripped) {
    const codePoint = char.codePointAt(0) ?? 0;
    const charWidth = visualLength(char);
    if (visibleWidth + charWidth > targetWidth) break;
    visibleWidth += charWidth;
    charIndex += char.length; // handle surrogate pairs
  }

  // Now find the corresponding position in the original ANSI string
  let ansiOffset = 0;
  let plainConsumed = 0;
  let result = '';

  while (ansiOffset < str.length && plainConsumed < charIndex) {
    // Check for ANSI sequence at current position
    const ansiMatch = /^\x1b\[[0-9;]*[a-zA-Z]/.exec(str.slice(ansiOffset));
    if (ansiMatch) {
      result += ansiMatch[0];
      ansiOffset += ansiMatch[0].length;
      continue;
    }
    result += str[ansiOffset];
    ansiOffset++;
    plainConsumed++;
  }

  // Close any open ANSI sequences before appending suffix
  return `${result}${RESET}${suffix}`;
}

function getTerminalWidth(): number {
  const colsEnv = process.env['COLUMNS'];
  if (colsEnv) {
    const parsed = parseInt(colsEnv, 10);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return process.stdout.columns ?? 120;
}

/**
 * Attempt to wrap a long line at │ separator boundaries without breaking mid-segment.
 * Returns the original line if no sensible wrap point exists.
 */
function wrapAtSeparator(line: string, maxWidth: number): string {
  if (visualLength(line) <= maxWidth) return line;

  // Split on the dim │ separator (which may have ANSI codes around it)
  // We look for │ in the stripped version to find split positions
  const stripped = stripAnsi(line);
  const separatorChar = '│';
  const idx = stripped.indexOf(separatorChar);
  if (idx === -1) {
    // No separator — truncate the whole line
    return truncateToWidth(line, maxWidth);
  }

  // Collect all separator positions in the stripped string
  const positions: number[] = [];
  let searchFrom = 0;
  while (true) {
    const pos = stripped.indexOf(separatorChar, searchFrom);
    if (pos === -1) break;
    positions.push(pos);
    searchFrom = pos + 1;
  }

  // Find a good wrap position: last separator where left part fits in maxWidth
  // Each segment is separated by '  │  ' (2 spaces on each side)
  // For simplicity, just split at the last separator where the left segment fits
  for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    // Extract the segment up to (but not including) the separator and surrounding spaces
    const leftPlain = stripped.slice(0, pos).trimEnd();
    if (visualLength(leftPlain) <= maxWidth) {
      // Find corresponding position in ANSI string
      const leftAnsi = extractAnsiUpTo(line, stripped, pos - (stripped.slice(0, pos).length - leftPlain.length));
      const rightAnsi = extractAnsiFrom(line, stripped, pos + separatorChar.length).trimStart();
      if (!rightAnsi) return leftAnsi;
      return `${leftAnsi}\n${rightAnsi}`;
    }
  }

  return truncateToWidth(line, maxWidth);
}

/**
 * Extract ANSI string corresponding to the first `plainCount` visible characters.
 */
function extractAnsiUpTo(ansiStr: string, _plainStr: string, plainCount: number): string {
  let ansiOffset = 0;
  let plainConsumed = 0;
  let result = '';

  while (ansiOffset < ansiStr.length && plainConsumed < plainCount) {
    const ansiMatch = /^\x1b\[[0-9;]*[a-zA-Z]/.exec(ansiStr.slice(ansiOffset));
    if (ansiMatch) {
      result += ansiMatch[0];
      ansiOffset += ansiMatch[0].length;
      continue;
    }
    result += ansiStr[ansiOffset];
    ansiOffset++;
    plainConsumed++;
  }

  // Append any trailing ANSI sequences (resets)
  while (ansiOffset < ansiStr.length) {
    const ansiMatch = /^\x1b\[[0-9;]*[a-zA-Z]/.exec(ansiStr.slice(ansiOffset));
    if (!ansiMatch) break;
    result += ansiMatch[0];
    ansiOffset += ansiMatch[0].length;
  }

  return result;
}

/**
 * Extract the ANSI string starting after `plainOffset` visible characters.
 */
function extractAnsiFrom(ansiStr: string, _plainStr: string, plainOffset: number): string {
  let ansiOffset = 0;
  let plainConsumed = 0;

  // Skip past the first `plainOffset` visible characters (and any ANSI between them)
  while (ansiOffset < ansiStr.length && plainConsumed < plainOffset) {
    const ansiMatch = /^\x1b\[[0-9;]*[a-zA-Z]/.exec(ansiStr.slice(ansiOffset));
    if (ansiMatch) {
      ansiOffset += ansiMatch[0].length;
      continue;
    }
    ansiOffset++;
    plainConsumed++;
  }

  return ansiStr.slice(ansiOffset);
}

export function render(ctx: RenderContext): void {
  const { config } = ctx;
  const { layout } = config;

  const rawLines: Array<string | null> = [
    renderIdentityLine(ctx),
    renderUsageLine(ctx),
    renderTurnsLine(ctx),
  ];

  const lines = rawLines.filter((l): l is string => l !== null);

  const termWidth = getTerminalWidth();

  const outputLines: string[] = [];

  if (layout === 'dashboard') {
    // Each sub-renderer may return multi-line strings already joined with \n
    for (const block of lines) {
      for (const line of block.split('\n')) {
        outputLines.push(line);
      }
    }
  } else {
    // compact / standard: each renderer returns a single line
    for (const line of lines) {
      if (visualLength(line) > termWidth) {
        outputLines.push(wrapAtSeparator(line, termWidth));
      } else {
        outputLines.push(line);
      }
    }
  }

  // Output each line with RESET prefix to prevent color bleed
  for (const line of outputLines) {
    process.stdout.write(`${RESET}${line}\n`);
  }
}
