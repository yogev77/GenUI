const PREFS_KEY = "genui-preferences";

export interface SitePreferences {
  fontSize: "small" | "default" | "large" | "xl";
  wantMore: string[]; // e.g. ["games", "creative", "tools"]
  uiFeedback: string[]; // e.g. ["too-cluttered", "love-dark-theme"]
  interactions: string[]; // log of all selections for context
}

const defaults: SitePreferences = {
  fontSize: "default",
  wantMore: [],
  uiFeedback: [],
  interactions: [],
};

export function getPreferences(): SitePreferences {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export function savePreferences(prefs: SitePreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function addInteraction(prefs: SitePreferences, label: string): SitePreferences {
  return {
    ...prefs,
    interactions: [...prefs.interactions.slice(-19), label], // keep last 20
  };
}

export const FONT_SIZE_CLASSES: Record<SitePreferences["fontSize"], string> = {
  small: "text-sm",
  default: "text-base",
  large: "text-lg",
  xl: "text-xl",
};
