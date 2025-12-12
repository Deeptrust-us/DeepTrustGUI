import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ShieldCheck, ShieldAlert } from "lucide-react";
import { logApi } from "@/api/handling/apiLogHandling";

type DetectionLog = {
  id?: number;
  // backend may send either camelCase or snake_case (depending on serialization)
  isDeepFake?: boolean;
  is_deepfake?: boolean;
  date?: string;
  hour?: string;
  classification?: string;
  score?: number;
  normalized_score?: number;
};

const ScanResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const toBool = (value: unknown): boolean => {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value !== 0;
    if (typeof value === "string") {
      const v = value.trim().toLowerCase();
      if (v === "true" || v === "1" || v === "yes" || v === "y") return true;
      if (v === "false" || v === "0" || v === "no" || v === "n") return false;
    }
    return false;
  };

  const numericId = useMemo(() => {
    if (!id) return null;
    const parsed = Number.parseInt(id, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const [log, setLog] = useState<DetectionLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isDeepfakeFromClassification = (value: unknown): boolean | null => {
    if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase();
    if (!v) return null;
    if (v.includes("deepfake")) return true;
    if (v.includes("bonafide") || v.includes("bona fide") || v.includes("bona-fide")) return false;
    return null;
  };

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (numericId === null) {
        setLog(null);
        setLoadError("Invalid scan result id.");
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await logApi.getLogById(numericId);
        if (cancelled) return;
        setLog(response.data);
      } catch (err: unknown) {
        if (cancelled) return;
        setLog(null);
        const maybeMessage =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: unknown }).response === "object" &&
          (err as { response?: { data?: unknown } }).response?.data &&
          typeof (err as { response?: { data?: unknown } }).response?.data === "object" &&
          "message" in ((err as { response?: { data?: { message?: unknown } } }).response?.data ?? {}) &&
          typeof (err as { response?: { data?: { message?: unknown } } }).response?.data?.message === "string"
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;

        setLoadError(maybeMessage || "Could not load scan result details.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [numericId]);

  const classification = log?.classification ?? "—";
  const isDeepfake =
    log && !isLoading && !loadError
      ? (isDeepfakeFromClassification(log?.classification) ??
        toBool(log?.isDeepFake ?? log?.is_deepfake))
      : false;

  const statusColor = isDeepfake ? "text-red-600" : "text-green-600";
  const pageBg = isLoading || loadError || !log ? "bg-white" : isDeepfake ? "bg-red-50" : "bg-green-50";
  const detailsCardBorder =
    isLoading || loadError || !log ? "border-gray-200" : isDeepfake ? "border-red-200" : "border-green-200";
  const score = log?.score ?? log?.normalized_score ?? null;

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "—";
    // Backend returns a normalized 0..100 score (can be < 1, still percent).
    return `${value.toFixed(2)}%`;
  };

  return (
    <div className={`min-h-screen ${pageBg} flex flex-col items-center px-4 py-8`}>
      {/* Logo and Branding */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">DeepTrust</h1>
          <p className="text-xs text-gray-600">AI Content Verification</p>
        </div>
      </div>

      {/* Result Status */}
      <div className="flex flex-col items-center mb-6">
        {isLoading ? (
          <>
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse mb-2" />
            <h2 className="text-2xl font-bold text-gray-700 mb-1">Loading…</h2>
          </>
        ) : loadError ? (
          <>
            <ShieldAlert className="w-16 h-16 text-red-500 mb-2" />
            <h2 className="text-2xl font-bold text-red-600 mb-1">Unable to load</h2>
            <p className="text-sm text-gray-600 text-center max-w-md">{loadError}</p>
          </>
        ) : isDeepfake ? (
          <>
            <ShieldAlert className="w-16 h-16 text-red-500 mb-2" />
            <h2 className="text-3xl font-bold text-red-600 mb-1">Deepfake</h2>
          </>
        ) : (
          <>
            <ShieldCheck className="w-16 h-16 text-green-500 mb-2" />
            <h2 className="text-3xl font-bold text-green-600 mb-1">Bonafide</h2>
          </>
        )}
      </div>

      {/* DetectionLog Details (no media preview) */}
      <div className={`w-full max-w-md bg-white rounded-lg shadow-md p-6 mb-6 border ${detailsCardBorder}`}>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Log ID</span>
          <span className="text-gray-900 font-semibold">{log?.id ?? (id ?? "—")}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Date</span>
          <span className="text-gray-900 font-semibold">{log?.date ?? "—"}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Time</span>
          <span className="text-gray-900 font-semibold">
            {log?.hour ? log.hour.split(".")[0] : "—"}
          </span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Classification</span>
          <span className="text-gray-900 font-semibold">{classification}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-700 font-medium">Score</span>
          <span className={`text-xl font-bold ${statusColor}`}>{formatPercent(score)}</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex">
        <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default ScanResult;