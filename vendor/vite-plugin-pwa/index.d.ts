import type { Plugin } from 'vite';

export type VitePWAOptions = {
  registerType?: 'autoUpdate' | 'prompt';
  includeAssets?: string[];
  manifest?: Record<string, unknown>;
};

export function VitePWA(options?: VitePWAOptions): Plugin;
