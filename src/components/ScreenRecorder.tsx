import { useState, useRef } from "react";
import { useNavigate} from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Download, Loader2, Square, ScanLine, ShieldAlert, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { videoDetection } from "@/api/video/videoDetection";


interface ScreenRecorderProps {
  onScanComplete?: (result: { status: "authentic" | "fake" | null; timestamp: Date; resultId?: string }) => void;
}

export default function ScreenRecorder({ onScanComplete }: ScreenRecorderProps) {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<"authentic" | "fake" | null>(null);
  const [lastAnalysis, setLastAnalysis] = useState<{ classification?: string; score?: number | null } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null); // Store blob for scanning
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

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


  const startRecording = async () => {
    try {
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true, // Include system audio if available
      });

      streamRef.current = stream;

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        setRecordedVideo(videoUrl);
        setRecordedBlob(blob); // Store blob for scanning
        setIsProcessing(false);
        setIsRecording(false);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        toast({
          title: "Recording completed",
          description: "Your screen recording is ready",
        });
      };

      // Handle errors
      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording error",
          description: "An error occurred while recording",
          variant: "destructive",
        });
        setIsRecording(false);
        setIsProcessing(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsProcessing(false);

      toast({
        title: "Recording started",
        description: "Your screen is being recorded. Click stop when finished.",
      });

      // Handle user stopping screen share from browser UI
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Please allow screen sharing to record",
        variant: "destructive",
      });
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
    }
  };

  const downloadVideo = () => {
    if (recordedVideo) {
      const a = document.createElement("a");
      a.href = recordedVideo;
      a.download = `screen-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: "Your recording is being downloaded",
      });
    }
  };

  const scanRecordedVideo = async () => {
    if (!recordedBlob) {
      toast({
        title: "No video to scan",
        description: "Please record a video first",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      // Send the video blob to the backend
      const response = await videoDetection.postVideo(recordedBlob);
      const result = response.data;
      const logId = toNumericId(result?.resultId ?? result?.id);
      const status: "authentic" | "fake" | null =
        result?.status ?? toStatusFromClassification(result?.classification);
      setLastAnalysis({
        classification: typeof result?.classification === "string" ? result.classification : undefined,
        score: typeof result?.score === "number" ? result.score : null,
      });

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

      // Set the scan result based on API response
      setScanResult(status);

      // Call the scan complete handler
      if (onScanComplete) {
        onScanComplete({
          status,
          timestamp: new Date(),
          resultId: logId !== null ? String(logId) : undefined,
        });
      }

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
            style={{ backgroundColor: "var(--primary)", color: "white" }}
            onClick={() => navigate(`/scan_result/${logId}`)}
          >
            View Details
          </Button>
        ) : undefined,
      });
    } catch (error: any) {
      console.error("Scan error:", error);

      const errorMessage = error.response?.data?.message
        || error.message
        || "Could not analyze video. Please try again.";

      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });

      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const startNewRecording = () => {
    // Clean up previous recording
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
      setRecordedVideo(null);
    }
    setRecordedBlob(null); // Clear blob
    setScanResult(null);
    chunksRef.current = [];
    startRecording();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 space-y-6">
      <Card className="w-full max-w-2xl p-6">
        {!recordedVideo && !isRecording && (
          <div className="text-center space-y-4">
            <Video className="w-16 h-16 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-bold mb-2">Screen Recorder</h2>
              <p className="text-muted-foreground mb-6">
                Click the button below to start recording your screen. The recording will be saved when you stop it.
              </p>
            </div>
            <Button
              onClick={startRecording}
              size="lg"
              className="w-full max-w-md h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg"
            >
              <Video className="w-5 h-5 mr-2" />
              Start Recording
            </Button>
          </div>
        )}

        {isRecording && (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-lg font-semibold text-red-600">Recording...</span>
            </div>
            <p className="text-muted-foreground mb-6">
              Your screen is being recorded. Click stop when you're finished.
            </p>
            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="w-full max-w-md h-14 font-semibold text-lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </>
              )}
            </Button>
          </div>
        )}

        {recordedVideo && !isRecording && (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold mb-2">Recording Complete</h3>
              <p className="text-muted-foreground">Your screen recording is ready</p>
            </div>

            {/* Video Preview */}
            <div className="relative w-full rounded-lg overflow-hidden bg-black">
              <video
                src={recordedVideo}
                controls
                className="w-full h-auto max-h-[60vh]"
                autoPlay
              />

              {/* Result Overlay - Same as Scanner */}
              {scanResult && !isScanning ? (
                <div className={`absolute inset-0 ${scanResult === "authentic" ? "bg-success/20" : "bg-destructive/20"} backdrop-blur-sm flex items-center justify-center`}>
                  <div className="text-center space-y-4 p-6">
                    {scanResult === "authentic" ? (
                      <>
                        <ShieldCheck className="w-20 h-20 text-success mx-auto" />
                        <div>
                          <h3 className="text-2xl font-bold text-success-foreground">Bonafide</h3>
                          <p className="text-sm text-success-foreground/80 mt-2">
                            {lastAnalysis?.score !== null && lastAnalysis?.score !== undefined
                              ? `This looks good (Bonafide). Score: ${lastAnalysis.score.toFixed(2)}%`
                              : "This looks good (Bonafide)."}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-20 h-20 text-destructive mx-auto" />
                        <div>
                          <h3 className="text-2xl font-bold text-destructive-foreground">Deepfake Detected</h3>
                          <p className="text-sm text-destructive-foreground/80 mt-2">
                            {lastAnalysis?.score !== null && lastAnalysis?.score !== undefined
                              ? `This is potentially a Deepfake. Score: ${lastAnalysis.score.toFixed(2)}%`
                              : "This is potentially a Deepfake."}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {/* Scan Button - Primary Action */}
              <Button
                onClick={scanRecordedVideo}
                disabled={isScanning}
                size="lg"
                className="w-full h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Scanning for Deepfakes...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-2" />
                    Scan for Deepfakes
                  </>
                )}
              </Button>

              {/* Secondary Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={downloadVideo}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={isScanning}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={startNewRecording}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                  disabled={isScanning}
                >
                  <Video className="w-5 h-5 mr-2" />
                  Record Again
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}