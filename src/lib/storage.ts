import { createInitialSeedState } from '../shared/seed';
import type { MintlyWorkspaceState } from '../shared/types';

export const STORAGE_KEY = 'mintly.workspace.in.v1';

export function loadLocalWorkspace(): MintlyWorkspaceState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createInitialSeedState(new Date().toISOString());
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as MintlyWorkspaceState;
    if (
      !parsed ||
      !parsed.profile ||
      parsed.profile.currency !== 'INR' ||
      !Array.isArray(parsed.accounts) ||
      parsed.accounts.length === 0
    ) {
      throw new Error('Legacy or invalid workspace');
    }
    return parsed;
  } catch {
    const seed = createInitialSeedState(new Date().toISOString());
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    } catch {
      // ignore storage quota errors
    }
    return seed;
  }
}

export function saveLocalWorkspace(state: MintlyWorkspaceState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function resetLocalWorkspace(): MintlyWorkspaceState {
  const seed = createInitialSeedState(new Date().toISOString());
  saveLocalWorkspace(seed);
  return seed;
}
