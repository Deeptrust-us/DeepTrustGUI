import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain, ShieldCheck, ShieldAlert } from "lucide-react";
import { formatPercent, getHistoryEntryById, subscribeToHistoryUpdates, type HistoryLogEntry } from "@/lib/historyStorage";

const ScanResult = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [log, setLog] = useState<HistoryLogEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      if (!id) {
        setLog(null);
        setLoadError("Invalid scan result id.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      const entry = getHistoryEntryById(id);
      if (!entry) {
        setLog(null);
        setLoadError("This local scan record was not found. It may have been deleted from browser storage.");
      } else {
        setLog(entry);
      }
      setIsLoading(false);
    };

    load();
    return subscribeToHistoryUpdates(load);
  }, [id]);

  const classification = log?.classification ?? "—";
  const isDeepfake = log && !isLoading && !loadError ? log.isDeepfake : false;

  const statusColor = isDeepfake ? "text-red-600" : "text-green-600";
  const pageBg = isLoading || loadError || !log ? "bg-white" : isDeepfake ? "bg-red-50" : "bg-green-50";
  const detailsCardBorder =
    isLoading || loadError || !log ? "border-gray-200" : isDeepfake ? "border-red-200" : "border-green-200";
  const score = formatPercent(log?.score) ?? "—";
  const fidelity = formatPercent(log?.fidelity) ?? "—";

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
          <span className="text-gray-700 font-medium">Request ID</span>
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
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Score</span>
          <span className={`text-xl font-bold ${statusColor}`}>{score}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Fidelity</span>
          <span className="text-gray-900 font-semibold">{fidelity}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Media type</span>
          <span className="text-gray-900 font-semibold capitalize">{log?.mediaType ?? "—"}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-gray-200">
          <span className="text-gray-700 font-medium">Preview reference</span>
          <span className="text-gray-900 font-semibold text-right">{log?.previewReference ?? "—"}</span>
        </div>
        <div className="flex justify-between items-center py-3">
          <span className="text-gray-700 font-medium">Endpoint</span>
          <span className="text-gray-900 font-semibold">{log?.endpointUsed ?? "—"}</span>
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