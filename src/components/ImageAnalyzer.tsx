import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { imageDetection } from "@/api/image/imageDetection";
import { ClipboardPaste, Image as ImageIcon, Loader2, ScanLine, X } from "lucide-react";

type ScanResult = "authentic" | "fake" | null;

interface ImageAnalyzerProps {
  onScanComplete: (result: { status: ScanResult; timestamp: Date; resultId?: string }) => void;
  embedded?: boolean;
}

export default function ImageAnalyzer({ onScanComplete, embedded = false }: ImageAnalyzerProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

  const toNumericId = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const toStatusFromClassification = (value: unknown): ScanResult => {
    if (typeof value !== "string") return null;
    const v = value.trim().toLowerCase();
    if (!v) return null;
    if (v.includes("bonafide") || v.includes("bona fide") || v.includes("bona-fide")) return "authentic";
    if (v.includes("auth") || v.includes("real") || v.includes("genuine")) return "authentic";
    if (v.includes("deepfake") || v.includes("fake") || v.includes("manip")) return "fake";
    return null;
  };

  const formatMaybePercent = (value: unknown): string | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number" && Number.isFinite(value)) return `${value.toFixed(2)}%`;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed.replace("%", ""));
      if (Number.isFinite(numeric)) return `${numeric.toFixed(2)}%`;
      return trimmed;
    }
    return null;
  };

  const previewUrl = useMemo(() => {
    if (!selectedImageFile) return null;
    return URL.createObjectURL(selectedImageFile);
  }, [selectedImageFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // No camera/mic resources to clean up; only object URLs are handled above.

  const clearImage = () => {
    setSelectedImageFile(null);
  };

  const setImageFromBlob = (blob: Blob, filename: string) => {
    const type = blob.type || "image/png";
    const file = new File([blob], filename, { type });
    setSelectedImageFile(file);
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items || items.length === 0) return;

    for (const item of Array.from(items)) {
      if (item.kind !== "file") continue;
      if (!item.type.startsWith("image/")) continue;

      const file = item.getAsFile();
      if (!file) continue;

      e.preventDefault();
      setSelectedImageFile(file);
      toast({
        title: "Image pasted",
        description: `Loaded ${file.type || "image"} from clipboard`,
      });
      return;
    }

    toast({
      title: "No image in clipboard",
      description: "Copy an image first (or take a screenshot), then paste here.",
      variant: "destructive",
    });
  };

  const pasteFromClipboardButton = async () => {
    try {
      if (!navigator.clipboard || !("read" in navigator.clipboard)) {
        throw new Error("Clipboard read not supported");
      }

      const clipboard = navigator.clipboard as unknown as { read: () => Promise<unknown[]> };
      const items = await clipboard.read();

      for (const rawItem of items) {
        const item = rawItem as { types?: unknown; getType?: (type: string) => Promise<Blob> };
        const types = Array.isArray(item.types) ? (item.types as unknown[]).filter((t): t is string => typeof t === "string") : [];
        const imageType = types.find((t) => t.startsWith("image/"));
        if (!imageType) continue;
        if (typeof item.getType !== "function") continue;
        const blob = await item.getType(imageType);
        setImageFromBlob(blob, `clipboard-${Date.now()}.png`);
        toast({ title: "Image loaded", description: "Loaded image from clipboard" });
        return;
      }

      toast({
        title: "No image in clipboard",
        description: "Copy an image first, then try again.",
        variant: "destructive",
      });
    } catch (err: unknown) {
      toast({
        title: "Paste not available",
        description:
          err instanceof Error
            ? `${err.message}. Tip: click the paste box and press Cmd/Ctrl+V.`
            : "Tip: click the paste box and press Cmd/Ctrl+V.",
        variant: "destructive",
      });
    }
  };

  const scanImage = async () => {
    if (!selectedImageFile) {
      toast({
        title: "No image selected",
        description: "Paste an image first.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    try {
      const response = await imageDetection.postImage(selectedImageFile, selectedImageFile.name);
      const result = response.data;

      // Endpoint spec: { classification: string, score: number } (no id/status returned).
      // Keep optional id parsing if backend adds it later.
      // Optional: backend may still include a log id, but the documented response doesn't.
      const maybeId =
        typeof result === "object" && result
          ? (result as { resultId?: unknown; id?: unknown }).resultId ?? (result as { id?: unknown }).id
          : undefined;
      const logId = toNumericId(maybeId);

      const classification =
        typeof result === "object" && result && "classification" in (result as Record<string, unknown>)
          ? (result as { classification?: unknown }).classification
          : undefined;
      const status: ScanResult = toStatusFromClassification(classification);

      const verdictText =
        status === "fake"
          ? "This is potentially a Deepfake."
          : status === "authentic"
            ? "This looks good (Bonafide)."
            : "Result received.";

      const detailsParts: string[] = [];
      const scoreValue =
        typeof result === "object" && result && "score" in (result as Record<string, unknown>)
          ? (result as { score?: unknown }).score
          : undefined;
      const scoreText = formatMaybePercent(scoreValue);
      if (scoreText) detailsParts.push(`Score: ${scoreText}`);
      if (typeof classification === "string" && classification.trim()) {
        detailsParts.push(`Classification: ${classification}`);
      }
      if (logId !== null) detailsParts.push(`Log #${logId}`);

      onScanComplete({
        status,
        timestamp: new Date(),
        resultId: logId !== null ? String(logId) : undefined,
      });

      clearImage();

      toast({
        title:
          typeof classification === "string" && classification.trim()
            ? classification
            : status === "authentic"
              ? "Bonafide"
              : "Deepfake",
        description: detailsParts.length > 0 ? `${verdictText} ${detailsParts.join(" • ")}` : verdictText,
        variant: status === "fake" ? "destructive" : "success",
        action:
          logId !== null ? (
            <Button
              variant="outline"
              size="sm"
              style={{ backgroundColor: "var(--primary)", color: "black" }}
              onClick={() => navigate(`/scan_result/${logId}`)}
            >
              View Details
            </Button>
          ) : undefined,
      });
    } catch (error: unknown) {
      const apiMessage =
        typeof error === "object" && error
          ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
          : undefined;

      const errorMessage =
        (typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        "Could not analyze image. Please try again.";

      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const wrapperClass = embedded ? "w-full" : "container mx-auto px-4 py-8";

  return (
    <div className={wrapperClass}>
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Paste Image</CardTitle>
            <CardDescription>Paste an image to check for manipulation or deepfakes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              {previewUrl ? (
                <div className="w-full max-h-[420px] overflow-hidden rounded-md bg-black flex items-center justify-center">
                  <img src={previewUrl} alt="Selected image preview" className="max-h-[420px] max-w-full w-auto h-auto object-contain" />
                </div>
              ) : (
                <div className="h-[220px] rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-10 h-10" />
                    <div className="text-sm">No image loaded</div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors outline-none"
              tabIndex={0}
              onPaste={handlePasteEvent}
            >
              <div className="flex items-center gap-3 mb-3">
                <ClipboardPaste className="w-8 h-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground">Paste an image</h3>
                  <p className="text-xs text-muted-foreground">Click this box, then press Cmd/Ctrl+V</p>
                </div>
              </div>
              <Button type="button" variant="outline" onClick={pasteFromClipboardButton} disabled={isScanning}>
                Paste from clipboard
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={scanImage}
                disabled={!selectedImageFile || isScanning}
                className="w-full sm:flex-1 h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-2" />
                    Scan Image
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  clearImage();
                }}
                disabled={isScanning}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
