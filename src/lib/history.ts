export interface HistoryEntry {
  timestamp: string;
  feature: string;
  reasoning: string;
  linesOfCode: number;
}

export interface SiteHistory {
  entries: HistoryEntry[];
  totalFeatures: number;
  totalLinesOfCode: number;
}
