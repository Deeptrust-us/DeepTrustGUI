export const API_HISTORY_STORAGE_KEY = "api_history";
export const API_HISTORY_UPDATED_EVENT = "api-history-updated";

export type ScanStatus = "authentic" | "fake" | null;
export type HistoryMediaType = "image" | "video" | "audio";

export interface HistoryLogEntry {
  id: string;
  timestamp: string;
  date: string;
  hour: string;
  classification: string;
  score: number | null;
  fidelity: number | string | null;
  isDeepfake: boolean;
  mediaType: HistoryMediaType;
  previewReference?: string;
  endpointUsed?: string;
}

type HistoryLogLike = Partial<HistoryLogEntry> & {
  is_deepfake?: unknown;
  isDeepFake?: unknown;
};

interface CreateHistoryEntryInput {
  result: unknown;
  mediaType: HistoryMediaType;
  previewReference?: string;
  endpointUsed?: string;
  createdAt?: Date;
}

const pad = (value: number) => String(value).padStart(2, "0");

const formatLocalDate = (value: Date) =>
  `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;

const formatLocalTime = (value: Date) =>
  `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;

const isBrowser = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.trim().replace("%", "");
    if (!normalized) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toMetricValue = (value: unknown): number | string | null => {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) return numeric;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  return null;
};

export const resolveScanStatus = (value: unknown): ScanStatus => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.includes("bonafide") || normalized.includes("bona fide") || normalized.includes("bona-fide")) return "authentic";
  if (normalized.includes("auth") || normalized.includes("real") || normalized.includes("genuine")) return "authentic";
  if (normalized.includes("deepfake") || normalized.includes("fake") || normalized.includes("manip")) return "fake";
  return null;
};

export const formatPercent = (value: unknown): string | null => {
  const numeric = toFiniteNumber(value);
  if (numeric !== null) return `${numeric.toFixed(2)}%`;
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
};

const deriveClassification = (result: Record<string, unknown>, status: ScanStatus): string => {
  if (typeof result.classification === "string" && result.classification.trim()) {
    return result.classification.trim();
  }
  if (status === "authentic") return "Bonafide";
  if (status === "fake") return "Deepfake";
  return "Unknown";
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `log-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const notifyHistoryUpdated = () => {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(API_HISTORY_UPDATED_EVENT));
};

const normalizeHistoryEntry = (item: unknown): HistoryLogEntry | null => {
  if (!item || typeof item !== "object") return null;
  const raw = item as HistoryLogLike;

  const id = typeof raw.id === "string" && raw.id.trim() ? raw.id.trim() : null;
  if (!id) return null;

  const timestamp =
    typeof raw.timestamp === "string" && raw.timestamp.trim() ? raw.timestamp : new Date().toISOString();
  const date =
    typeof raw.date === "string" && raw.date.trim() ? raw.date : formatLocalDate(new Date(timestamp));
  const hour =
    typeof raw.hour === "string" && raw.hour.trim() ? raw.hour : formatLocalTime(new Date(timestamp));
  const classification =
    typeof raw.classification === "string" && raw.classification.trim() ? raw.classification.trim() : "Unknown";
  const mediaType =
    raw.mediaType === "audio" || raw.mediaType === "image" || raw.mediaType === "video" ? raw.mediaType : "image";
  const score = toFiniteNumber(raw.score);
  const fidelity = toMetricValue(raw.fidelity);
  const isDeepfake =
    toBoolean(raw.isDeepfake) ??
    toBoolean(raw.is_deepfake) ??
    toBoolean(raw.isDeepFake) ??
    (resolveScanStatus(classification) === "fake");

  return {
    id,
    timestamp,
    date,
    hour,
    classification,
    score,
    fidelity,
    isDeepfake,
    mediaType,
    previewReference: typeof raw.previewReference === "string" && raw.previewReference.trim() ? raw.previewReference.trim() : undefined,
    endpointUsed: typeof raw.endpointUsed === "string" && raw.endpointUsed.trim() ? raw.endpointUsed.trim() : undefined,
  };
};

export const getHistoryEntries = (): HistoryLogEntry[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(API_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(normalizeHistoryEntry)
      .filter((entry): entry is HistoryLogEntry => entry !== null)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch {
    return [];
  }
};

const saveHistoryEntries = (entries: HistoryLogEntry[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(API_HISTORY_STORAGE_KEY, JSON.stringify(entries));
  notifyHistoryUpdated();
};

export const getHistoryEntryById = (id: string): HistoryLogEntry | null =>
  getHistoryEntries().find((entry) => entry.id === id) ?? null;

export const appendHistoryEntry = ({
  result,
  mediaType,
  previewReference,
  endpointUsed,
  createdAt = new Date(),
}: CreateHistoryEntryInput): HistoryLogEntry => {
  const payload = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : {};
  const status = (payload.status as ScanStatus | undefined) ?? resolveScanStatus(payload.classification);

  const entry: HistoryLogEntry = {
    id: generateId(),
    timestamp: createdAt.toISOString(),
    date: formatLocalDate(createdAt),
    hour: formatLocalTime(createdAt),
    classification: deriveClassification(payload, status),
    score: toFiniteNumber(payload.score ?? payload.normalized_score),
    fidelity: toMetricValue(payload.fidelity ?? payload.probability ?? payload.confidence),
    isDeepfake: status === "fake",
    mediaType,
    previewReference,
    endpointUsed,
  };

  const existing = getHistoryEntries();
  saveHistoryEntries([entry, ...existing]);
  return entry;
};

export const deleteHistoryEntry = (id: string) => {
  saveHistoryEntries(getHistoryEntries().filter((entry) => entry.id !== id));
};

export const subscribeToHistoryUpdates = (callback: () => void) => {
  if (!isBrowser()) return () => undefined;

  const handleStorage = (event: StorageEvent) => {
    if (event.key === API_HISTORY_STORAGE_KEY) callback();
  };
  const handleCustom = () => callback();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(API_HISTORY_UPDATED_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(API_HISTORY_UPDATED_EVENT, handleCustom);
  };
};
