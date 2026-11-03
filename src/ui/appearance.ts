/**
 * Light or dark appearance, chosen in Settings → Display. FAITH is light by default, even when the
 * phone is set to dark mode: many users are older adults and the light theme reads best for them.
 * "Match phone" follows the system setting. Stored per device in app_settings (not health data).
 */
import { useSyncExternalStore } from 'react';

export type AppearanceId = 'light' | 'dark' | 'system';

export const APPEARANCES: { id: AppearanceId; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'Match phone' },
];

let current: AppearanceId = 'light';
const listeners = new Set<() => void>();

export function parseAppearance(value: string | null): AppearanceId {
  return APPEARANCES.some((a) => a.id === value) ? (value as AppearanceId) : 'light';
}

export function getAppearance(): AppearanceId {
  return current;
}

export function setAppearance(id: AppearanceId): void {
  if (id === current) return;
  current = id;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppearance(): AppearanceId {
  return useSyncExternalStore(subscribe, getAppearance, getAppearance);
}

/** Whether the dark palette applies, given the choice and the phone's own setting. */
export function isDarkAppearance(id: AppearanceId, systemScheme: string | null | undefined): boolean {
  return id === 'dark' || (id === 'system' && systemScheme === 'dark');
}
