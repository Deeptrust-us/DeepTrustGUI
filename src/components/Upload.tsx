import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, Loader2, Mic, Video, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { videoDetection } from "@/api/video/videoDetection";
import { audioDetection } from "@/api/audio/audioDetection";
import { imageDetection } from "@/api/image/imageDetection";

interface UploadProps {
  onScanComplete: (result: { status: "authentic" | "fake" | null; timestamp: Date }) => void;
}

export const Upload = ({ onScanComplete }: UploadProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isScanning, setIsScanning] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);

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
      return `${value.toFixed(2)}%`;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return null;
      const numeric = Number(trimmed.replace("%", ""));
      if (Number.isFinite(numeric)) return `${numeric.toFixed(2)}%`;
      return trimmed;
    }
    return null;
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedVideoFile(file);
    setSelectedAudioFile(null);
    setSelectedImageFile(null);
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedAudioFile(file);
    setSelectedVideoFile(null);
    setSelectedImageFile(null);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedImageFile(file);
    setSelectedVideoFile(null);
    setSelectedAudioFile(null);
  };

  const scanBlob = async (fileBlob: Blob, kind: "audio" | "video" | "image") => {
    setIsScanning(true);

    try {
      const response =
        kind === "audio"
          ? await audioDetection.postAudio(fileBlob)
          : kind === "video"
            ? await videoDetection.postVideo(fileBlob)
            : await imageDetection.postImage(fileBlob);

      const result: unknown = response.data;
      const obj = typeof result === "object" && result ? (result as Record<string, unknown>) : null;
      const maybeId = obj ? (obj.resultId ?? obj.id) : undefined;
      const logId = toNumericId(maybeId);
      const classification = obj ? obj.classification : undefined;
      const statusFromPayload = obj && (obj.status === "authentic" || obj.status === "fake") ? obj.status : null;
      const status: "authentic" | "fake" | null = statusFromPayload ?? toStatusFromClassification(classification);

      const verdictText =
        status === "fake"
          ? "This is potentially a Deepfake."
          : status === "authentic"
            ? "This looks good (Bonafide)."
            : "Result received.";

      const detailsParts: string[] = [];
      const scoreText = formatMaybePercent(obj ? obj.score : undefined);
      if (scoreText) detailsParts.push(`Score: ${scoreText}`);
      if (typeof classification === "string" && classification.trim()) {
        detailsParts.push(`Classification: ${classification}`);
      }
      if (logId !== null) detailsParts.push(`Log #${logId}`);

      onScanComplete({ status, timestamp: new Date() });

      setSelectedVideoFile(null);
      setSelectedAudioFile(null);
      setSelectedImageFile(null);

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
      console.error("Scan error:", error);

      const apiMessage =
        typeof error === "object" && error ? (error as { response?: { data?: { message?: unknown } } }).response?.data?.message : undefined;
      const errorMessage =
        (typeof apiMessage === "string" && apiMessage.trim() ? apiMessage : undefined) ||
        (error instanceof Error ? error.message : undefined) ||
        "Could not analyze content. Please try again.";

      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async () => {
    const selectedFile = selectedVideoFile || selectedAudioFile || selectedImageFile;

    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video, audio, or image file to scan",
        variant: "destructive",
      });
      return;
    }

    const kind: "audio" | "video" | "image" = selectedAudioFile ? "audio" : selectedVideoFile ? "video" : "image";
    await scanBlob(selectedFile, kind);
  };

  const selectedFile = selectedVideoFile || selectedAudioFile || selectedImageFile;

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="file" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="file" className="gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload File
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media File</CardTitle>
              <CardDescription>Upload a video, audio, or image file to check for deepfakes</CardDescription>
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
                <Input type="file" accept="video/*" onChange={handleVideoFileChange} className="mb-2" disabled={isScanning} />
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
                <Input type="file" accept="audio/*" onChange={handleAudioFileChange} className="mb-2" disabled={isScanning} />
                {selectedAudioFile && <p className="text-sm text-muted-foreground">Selected: {selectedAudioFile.name}</p>}
              </div>

              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold text-foreground">Image File</h3>
                    <p className="text-xs text-muted-foreground">Upload image files (PNG, JPG, WebP, etc.)</p>
                  </div>
                </div>
                <Input type="file" accept="image/*" onChange={handleImageFileChange} className="mb-2" disabled={isScanning} />
                {selectedImageFile && <p className="text-sm text-muted-foreground">Selected: {selectedImageFile.name}</p>}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};
