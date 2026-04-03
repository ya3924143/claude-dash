import fs from 'fs';
import readline from 'readline';
import type { SessionStats, TurnStats, ModelCount } from './types.js';

function emptyModelCount(): ModelCount {
  return { O: 0, S: 0, H: 0, tokens: 0 };
}

function emptyTurnStats(): TurnStats {
  return { models: emptyModelCount(), totalTokens: 0 };
}

function classifyModel(modelId: string): 'O' | 'S' | 'H' | null {
  const lower = modelId.toLowerCase();
  if (lower.includes('opus')) return 'O';
  if (lower.includes('sonnet')) return 'S';
  if (lower.includes('haiku')) return 'H';
  return null;
}

function addModelUsage(turn: TurnStats, modelId: string, tokenCount: number): TurnStats {
  const key = classifyModel(modelId);
  const updatedModels: ModelCount = {
    ...turn.models,
    tokens: turn.models.tokens + tokenCount,
    ...(key !== null ? { [key]: turn.models[key] + 1 } : {}),
  };
  return {
    models: updatedModels,
    totalTokens: turn.totalTokens + tokenCount,
  };
}

function mergeTurnStats(a: TurnStats, b: TurnStats): TurnStats {
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

export async function parseSessionStats(transcriptPath: string): Promise<SessionStats> {
  const empty = (): SessionStats => ({
    lastTurn: emptyTurnStats(),
    currentTurn: emptyTurnStats(),
    session: emptyTurnStats(),
  });

  if (!fs.existsSync(transcriptPath)) {
    return empty();
  }

  let stream: fs.ReadStream;
  try {
    stream = fs.createReadStream(transcriptPath, { encoding: 'utf8' });
  } catch {
    return empty();
  }

  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  // Each element is a completed turn (started by a human message)
  const turns: TurnStats[] = [];
  let currentTurn: TurnStats = emptyTurnStats();
  let inTurn = false;

  try {
    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let entry: Record<string, unknown>;
      try {
        entry = JSON.parse(trimmed) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (entry['type'] === 'user' || entry['type'] === 'human') {
        if (inTurn) {
          turns.push(currentTurn);
          currentTurn = emptyTurnStats();
        }
        inTurn = true;
        continue;
      }

      if (entry['type'] === 'assistant' && inTurn) {
        const message = entry['message'] as Record<string, unknown> | undefined;
        if (!message) continue;

        const usage = message['usage'] as Record<string, number> | undefined;
        const modelId = message['model'] as string | undefined;

        if (usage && modelId) {
          const tokenCount =
            (usage['input_tokens'] ?? 0) +
            (usage['output_tokens'] ?? 0) +
            (usage['cache_read_input_tokens'] ?? 0) +
            (usage['cache_creation_input_tokens'] ?? 0);
          currentTurn = addModelUsage(currentTurn, modelId, tokenCount);
        }
      }
    }
  } catch {
    // Stream errors — return what we have so far
  } finally {
    rl.close();
  }

  // Push the final in-progress turn (currentTurn)
  if (inTurn) {
    turns.push(currentTurn);
  }

  const session = turns.reduce(mergeTurnStats, emptyTurnStats());
  const lastTurn = turns.length >= 2 ? turns[turns.length - 2] : emptyTurnStats();
  const latestTurn = turns.length >= 1 ? turns[turns.length - 1] : emptyTurnStats();

  return {
    lastTurn,
    currentTurn: latestTurn,
    session,
  };
}
