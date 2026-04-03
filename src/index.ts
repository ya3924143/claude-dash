import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import { readStdin, getContextPercent } from './stdin.js';
import { loadConfig } from './config.js';
import { parseSessionStats } from './transcript.js';
import { render } from './render/index.js';
import { getUsage } from './usage-api.js';
import type { RenderContext } from './types.js';

export function formatSessionDuration(startedAt: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - startedAt.getTime();
  if (diffMs < 0) return '0s';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export async function main(): Promise<void> {
  try {
    const stdin = await readStdin();

    if (stdin === null) {
      process.stdout.write('[claude-dash] Initializing...\n');
      return;
    }

    const config = await loadConfig();

    const transcriptPath = stdin.transcript_path ?? '';
    const sessionStats = transcriptPath
      ? await parseSessionStats(transcriptPath)
      : {
          lastTurn: { models: { O: 0, S: 0, H: 0, tokens: 0 }, totalTokens: 0 },
          currentTurn: { models: { O: 0, S: 0, H: 0, tokens: 0 }, totalTokens: 0 },
          session: { models: { O: 0, S: 0, H: 0, tokens: 0 }, totalTokens: 0 },
        };

    const contextPercent = getContextPercent(stdin);

    const usageData = await getUsage();

    const ctx: RenderContext = {
      stdin,
      config,
      usageData,
      sessionStats,
      contextPercent,
    };

    render(ctx);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    process.stdout.write(`[claude-dash] Error: ${message}\n`);
  }
}

const scriptPath = fileURLToPath(import.meta.url);
const argvPath = process.argv[1];

const isSamePath = (a: string, b: string): boolean => {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return a === b;
  }
};

if (argvPath && isSamePath(argvPath, scriptPath)) {
  void main();
}
