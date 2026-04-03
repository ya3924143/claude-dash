import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { DashConfig } from './types.js';
import { CONFIG_DIR, CONFIG_FILE } from './constants.js';
import { PRESETS } from './presets.js';

const DEFAULT_PRESET_NAME = 'default';

export function getConfigPath(): string {
  return join(homedir(), CONFIG_DIR, CONFIG_FILE);
}

export async function loadConfig(): Promise<DashConfig> {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    return { ...PRESETS[DEFAULT_PRESET_NAME] };
  }

  const raw = await readFile(configPath, 'utf-8');
  const parsed: unknown = JSON.parse(raw);

  if (typeof parsed !== 'object' || parsed === null) {
    return { ...PRESETS[DEFAULT_PRESET_NAME] };
  }

  return { ...PRESETS[DEFAULT_PRESET_NAME], ...(parsed as Partial<DashConfig>) };
}

export async function saveConfig(config: DashConfig): Promise<void> {
  const configPath = getConfigPath();
  const configDir = join(homedir(), CONFIG_DIR);

  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}
