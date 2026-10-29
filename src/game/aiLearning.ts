/**
 * Lightweight on-device reinforcement memory for Pen War.
 * Stores compact shot-family rewards in WebView localStorage, which persists
 * across Android app restarts without a server or account.
 */
export interface AiLearningProfile {
  version: 1;
  shots: number;
  wins: number;
  families: Record<string, { trials: number; reward: number }>;
}

const STORAGE_KEY = 'pen-war.ai-learning.v1';
const EMPTY: AiLearningProfile = { version: 1, shots: 0, wins: 0, families: {} };
let cachedProfile: AiLearningProfile | null = null;

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadAiLearning(): AiLearningProfile {
  if (cachedProfile) return cachedProfile;
  try {
    const raw = storage()?.getItem(STORAGE_KEY);
    if (!raw) return (cachedProfile = { ...EMPTY, families: {} });
    const parsed = JSON.parse(raw) as Partial<AiLearningProfile>;
    if (parsed.version !== 1 || !parsed.families || typeof parsed.families !== 'object') {
      return (cachedProfile = { ...EMPTY, families: {} });
    }
    return (cachedProfile = {
      version: 1,
      shots: Math.max(0, Number(parsed.shots) || 0),
      wins: Math.max(0, Number(parsed.wins) || 0),
      families: parsed.families,
    });
  } catch {
    return (cachedProfile = { ...EMPTY, families: {} });
  }
}

export function learnedPenalty(key: string): number {
  const family = loadAiLearning().families[key];
  if (!family || family.trials < 2) return 0;
  // Reward is in [-1, 1]. Positive outcomes reduce score; repeated failures raise it.
  return Math.max(-0.65, Math.min(0.9, -family.reward / Math.sqrt(family.trials + 1)));
}

export function recordAiOutcome(key: string, reward: number): AiLearningProfile {
  const profile = loadAiLearning();
  const family = profile.families[key] || { trials: 0, reward: 0 };
  family.trials += 1;
  // Exponential moving average: recent outcomes matter more than old ones.
  family.reward = family.reward * 0.72 + Math.max(-1, Math.min(1, reward)) * 0.28;
  profile.families[key] = family;
  profile.shots += 1;
  if (reward > 0.35) profile.wins += 1;

  // Bound storage growth on long-running devices.
  const entries = Object.entries(profile.families);
  if (entries.length > 120) {
    entries.sort((a, b) => a[1].trials - b[1].trials);
    for (const [oldKey] of entries.slice(0, entries.length - 120)) delete profile.families[oldKey];
  }

  cachedProfile = profile;
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Learning still works for this session if storage is unavailable.
  }
  return profile;
}

export function clearAiLearning(): void {
  cachedProfile = { ...EMPTY, families: {} };
  try {
    storage()?.removeItem(STORAGE_KEY);
  } catch {
    // Storage can be disabled by the host.
  }
}
