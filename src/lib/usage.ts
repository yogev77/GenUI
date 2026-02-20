const USAGE_KEY = "genui-usage";
const SESSION_KEY = "genui-session-id";

export interface FeatureUsage {
  interactions: number; // clicks, taps, inputs inside the card
  viewTimeMs: number; // total time visible in viewport
  sessions: number; // how many sessions the user interacted with it
  lastInteracted: string; // ISO timestamp
}

export interface UsageData {
  features: Record<string, FeatureUsage>;
  totalSessions: number;
  firstSeen: string;
  lastSeen: string;
}

export interface AggregateUsage {
  features: Record<
    string,
    {
      totalInteractions: number;
      totalViewTimeMs: number;
      uniqueSessions: number;
    }
  >;
  totalUsers: number;
  totalSessions: number;
  lastUpdated: string;
}

function defaults(): UsageData {
  const now = new Date().toISOString();
  return {
    features: {},
    totalSessions: 0,
    firstSeen: now,
    lastSeen: now,
  };
}

export function getUsage(): UsageData {
  if (typeof window === "undefined") return defaults();
  try {
    const stored = localStorage.getItem(USAGE_KEY);
    return stored ? JSON.parse(stored) : defaults();
  } catch {
    return defaults();
  }
}

export function saveUsage(data: UsageData) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(data));
}

export function ensureSession(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem(SESSION_KEY, id);

    // Bump session count
    const usage = getUsage();
    usage.totalSessions++;
    usage.lastSeen = new Date().toISOString();
    saveUsage(usage);
  }
  return id;
}

export function recordInteraction(featureName: string) {
  const usage = getUsage();
  const sessionId = ensureSession();

  if (!usage.features[featureName]) {
    usage.features[featureName] = {
      interactions: 0,
      viewTimeMs: 0,
      sessions: 0,
      lastInteracted: new Date().toISOString(),
    };
  }

  const f = usage.features[featureName];
  f.interactions++;
  f.lastInteracted = new Date().toISOString();
  // sessions tracked per feature per session via sessionStorage
  const sessionFeatureKey = `genui-sess-${sessionId}-${featureName}`;
  if (!sessionStorage.getItem(sessionFeatureKey)) {
    sessionStorage.setItem(sessionFeatureKey, "1");
    f.sessions++;
  }

  saveUsage(usage);
}

export function recordViewTime(featureName: string, ms: number) {
  const usage = getUsage();
  if (!usage.features[featureName]) {
    usage.features[featureName] = {
      interactions: 0,
      viewTimeMs: 0,
      sessions: 0,
      lastInteracted: new Date().toISOString(),
    };
  }
  usage.features[featureName].viewTimeMs += ms;
  saveUsage(usage);
}

/** Summarize usage for Claude — top engaged features and patterns */
export function summarizeForPrompt(usage: UsageData): string {
  const entries = Object.entries(usage.features);
  if (entries.length === 0) return "";

  // Sort by engagement score: interactions * 3 + viewTime/60000
  const ranked = entries
    .map(([name, data]) => ({
      name,
      score: data.interactions * 3 + data.viewTimeMs / 60000,
      interactions: data.interactions,
      viewMinutes: Math.round(data.viewTimeMs / 60000),
      sessions: data.sessions,
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-3);

  let summary = `User engagement data (${usage.totalSessions} sessions):\n`;
  summary += `Most engaged: ${top.map((f) => `${f.name}(${f.interactions} clicks, ${f.viewMinutes}min viewed)`).join(", ")}\n`;
  if (bottom.length > 0 && ranked.length > 5) {
    summary += `Least engaged: ${bottom.map((f) => f.name).join(", ")}\n`;
  }

  // Detect patterns — what types of features are popular
  const patterns: string[] = [];
  const topNames = top.map((f) => f.name.toLowerCase());
  if (topNames.some((n) => n.includes("game") || n.includes("dice") || n.includes("tac")))
    patterns.push("games");
  if (topNames.some((n) => n.includes("color") || n.includes("palette") || n.includes("visual")))
    patterns.push("visual/creative");
  if (topNames.some((n) => n.includes("timer") || n.includes("stop") || n.includes("clock")))
    patterns.push("utilities");
  if (topNames.some((n) => n.includes("sound") || n.includes("audio") || n.includes("piano") || n.includes("wave")))
    patterns.push("audio/sound");
  if (topNames.some((n) => n.includes("math") || n.includes("number") || n.includes("counter") || n.includes("progress")))
    patterns.push("numbers/math");

  if (patterns.length > 0) {
    summary += `Detected preferences: ${patterns.join(", ")}`;
  }

  return summary;
}

/** Summarize aggregate (hive) usage for Claude */
export function summarizeAggregate(agg: AggregateUsage): string {
  const entries = Object.entries(agg.features);
  if (entries.length === 0) return "";

  const ranked = entries
    .map(([name, data]) => ({
      name,
      score: data.totalInteractions * 3 + data.totalViewTimeMs / 60000,
      ...data,
    }))
    .sort((a, b) => b.score - a.score);

  const top = ranked.slice(0, 5);
  let summary = `Hive data (${agg.totalUsers} users, ${agg.totalSessions} sessions):\n`;
  summary += `Most popular: ${top.map((f) => `${f.name}(${f.totalInteractions} total clicks, ${f.uniqueSessions} sessions)`).join(", ")}`;
  return summary;
}
