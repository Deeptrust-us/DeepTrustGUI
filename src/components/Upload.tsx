import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload as UploadIcon, Loader2, Mic, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { videoDetection } from "@/api/video/videoDetection";
import { audioDetection } from "@/api/audio/audioDetection";

interface UploadProps {
  onScanComplete: (result: { status: "authentic" | "fake" | null; timestamp: Date }) => void;
  embedded?: boolean;
}

export const Upload = ({ onScanComplete, embedded = false }: UploadProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const navigate = useNavigate();

  const toNumericId = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const toStatusFromClassification = (value: unknown): "authentic" | "fake" | null => {
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
    if (typeof value === "number" && Number.isFinite(value)) {
      // Backend already returns a client-friendly 0..100 score.
      return `${value.toFixed(2)}%`;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed.replace("%", ""));
      if (Number.isFinite(numeric)) {
        return `${numeric.toFixed(2)}%`;
      }
      return trimmed;
    }
    return null;
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideoFile(file);
      setSelectedAudioFile(null); // Clear audio selection when video is selected
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedAudioFile(file);
      setSelectedVideoFile(null); // Clear video selection when audio is selected
    }
  };

  const handleFileUpload = async () => {
    const selectedFile = selectedVideoFile || selectedAudioFile;
    
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video or audio file to scan",
        variant: "destructive",
      });
      return;
    }
  
    setIsScanning(true);
  
    try {
      // Determine if it's audio or video based on which file is selected
      const isAudio = !!selectedAudioFile;
      
      // Convert File to Blob (File is already a Blob, but we ensure it's the right type)
      const fileBlob = selectedFile;
  
      // Call the appropriate API
      const response = isAudio
        ? await audioDetection.postAudio(fileBlob)
        : await videoDetection.postVideo(fileBlob);
  
      const result = response.data;
      const logId = toNumericId(result?.resultId ?? result?.id);
      const status: "authentic" | "fake" | null =
        result?.status ?? toStatusFromClassification(result?.classification);

      const verdictText =
        status === "fake"
          ? "This is potentially a Deepfake."
          : status === "authentic"
            ? "This looks good (Bonafide)."
            : "Result received.";

      const detailsParts: string[] = [];
      const scoreText = formatMaybePercent(
        result?.score
      );
      if (scoreText) detailsParts.push(`Score: ${scoreText}`);
      if (typeof result?.classification === "string" && result.classification.trim()) {
        detailsParts.push(`Classification: ${result.classification}`);
      }
      if (logId !== null) detailsParts.push(`Log #${logId}`);
  
      onScanComplete({
        status,
        timestamp: new Date(),
      });
  
      setIsScanning(false);
      setSelectedVideoFile(null);
      setSelectedAudioFile(null);
  
      toast({
        title:
          typeof result?.classification === "string" && result.classification.trim()
            ? result.classification
            : status === "authentic"
              ? "Bonafide"
              : "Deepfake",
        description:
          detailsParts.length > 0
            ? `${verdictText} ${detailsParts.join(" • ")}`
            : verdictText,
        variant: status === "fake" ? "destructive" : "success",
        action: logId !== null ? (
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
      console.error("Scan error:", error);
  
      const apiMessage =
        typeof error === "object" && error
          ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message
          : undefined;
      const errorMessage =
        (typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        "Could not analyze content. Please try again.";
  
      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });
  
      setIsScanning(false);
    }
  };

  const handleUrlScan = async () => {
    if (!contentUrl.trim()) {
      toast({
        title: "No URL provided",
        description: "Please enter a URL to scan",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    // URL scanning is currently not wired to a backend endpoint.
    // The URL tab is also disabled in the UI, so we avoid fake/random results here.
    toast({
      title: "URL scan not available",
      description: "URL/Link scanning isn't implemented. Please use Upload File or Recorder instead.",
      variant: "destructive",
    });

    setIsScanning(false);
  };

  const selectedFile = selectedVideoFile || selectedAudioFile;

  return (
    <div className={embedded ? "w-full" : "container mx-auto px-4 py-8"}>
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Media File</CardTitle>
            <CardDescription>Upload a video or audio file to check for deepfakes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground">Video File</h3>
                  <p className="text-xs text-muted-foreground">Upload video files (MP4, WebM, etc.)</p>
                </div>
              </div>
              <Input
                type="file"
                accept="video/*"
                onChange={handleVideoFileChange}
                className="mb-2"
                disabled={isScanning}
              />
              {selectedVideoFile && <p className="text-sm text-muted-foreground">Selected: {selectedVideoFile.name}</p>}
            </div>

            <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3 mb-4">
                <Mic className="w-8 h-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-foreground">Audio File</h3>
                  <p className="text-xs text-muted-foreground">Upload audio files (MP3, WAV, WebM, etc.)</p>
                </div>
              </div>
              <Input
                type="file"
                accept="audio/*"
                onChange={handleAudioFileChange}
                className="mb-2"
                disabled={isScanning}
              />
              {selectedAudioFile && <p className="text-sm text-muted-foreground">Selected: {selectedAudioFile.name}</p>}
            </div>

            <Button onClick={handleFileUpload} disabled={!selectedFile || isScanning} className="w-full" size="lg">
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <UploadIcon className="w-4 h-4 mr-2" />
                  Scan File
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};