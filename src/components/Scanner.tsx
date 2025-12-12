import { useState, useRef, useEffect } from "react";
import { videoDetection } from "@/api/video/videoDetection";
import { audioDetection } from "@/api/audio/audioDetection";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Mic, ShieldCheck, ShieldAlert, Loader2, Square, ScanLine } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ScanStatus = "idle" | "recording" | "recorded" | "scanning" | "complete";
type ScanResult = "authentic" | "fake" | null;
type CaptureMode = "camera" | "audio";

interface ScannerProps {
  onScanComplete: (result: { status: ScanResult; timestamp: Date; resultId?: string }) => void;
}

export default function Scanner({ onScanComplete }: ScannerProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>("camera");
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const requestCameraPermissions = async () => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Not supported",
          description: "Your browser doesn't support camera access. Please use a modern browser with HTTPS.",
          variant: "destructive",
        });
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      });

      setStream(mediaStream);
      setHasPermissions(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      toast({
        title: "Access granted",
        description: "Camera and microphone are ready",
      });
    } catch (error) {
      console.error("Camera access error:", error);
      
      let errorMessage = "Please allow camera and microphone access in your browser settings";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Permission denied. Please check your browser settings and allow camera/microphone access.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera or microphone found on your device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (error.name === "SecurityError") {
          errorMessage = "Camera access requires HTTPS. Please ensure you're using a secure connection.";
        }
      }
      
      toast({
        title: "Camera access failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const requestAudioPermissions = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });

      setStream(mediaStream);
      setHasPermissions(true);

      toast({
        title: "Microphone access granted",
        description: "Audio recording is ready",
      });
    } catch (error) {
      toast({
        title: "Permission denied",
        description: "Please allow microphone access",
        variant: "destructive",
      });
    }
  };

  const requestPermissions = async () => {
    if (captureMode === "camera") {
      await requestCameraPermissions();
    } else if (captureMode === "audio") {
      await requestAudioPermissions();
    }
  };

  const startRecording = async () => {
    if (!hasPermissions) {
      await requestPermissions();
      return;
    }

    if (!stream) return;

    try {
      // Determine MIME type based on mode
      const mimeType = captureMode === "camera"
        ? (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : MediaRecorder.isTypeSupported("video/webm")
            ? "video/webm"
            : "video/mp4")
        : (MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : MediaRecorder.isTypeSupported("audio/mp4")
            ? "audio/mp4"
            : "audio/webm");

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: captureMode === "camera" ? 2500000 : undefined,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        setRecordedBlob(blob);
        setScanStatus("recorded");
        setIsProcessing(false);

        toast({
          title: "Recording completed",
          description: "Your recording is ready for analysis",
        });
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording error",
          description: "An error occurred while recording",
          variant: "destructive",
        });
        setScanStatus("idle");
        setIsProcessing(false);
      };

      mediaRecorder.start(1000);
      setScanStatus("recording");

      toast({
        title: "Recording started",
        description: "Recording in progress. Click stop when finished.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Could not start recording",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
    }
  };

  const scanRecordedContent = async () => {
    if (!recordedBlob) {
      toast({
        title: "No recording to scan",
        description: "Please record content first",
        variant: "destructive",
      });
      return;
    }
  
    setScanStatus("scanning");
    setScanResult(null);
  
    try {
      // Send the blob to backend based on capture mode
      const response = captureMode === "camera"
        ? await videoDetection.postVideo(recordedBlob)
        : await audioDetection.postAudio(recordedBlob);
  
      const result = response.data;
  
      setScanResult(result.status);
      setScanStatus("complete");
  
      onScanComplete({
        status: result.status,
        timestamp: new Date(),
        resultId: result.resultId,
      });
  
      toast({
        title: result.status === "authentic" ? "Verified Authentic" : "Deepfake Detected",
        description: result.status === "authentic"
          ? "This content appears to be genuine"
          : "Warning: This content may be manipulated",
        variant: result.status === "authentic" ? "default" : "destructive",
        action: result.status === "fake" ? (
          <Button
            variant="outline"
            size="sm"
            style={{ backgroundColor: "var(--primary)", color: "black" }}
            onClick={() => navigate(`/scan_result/${result.resultId}`)}
          >
            View Details
          </Button>
        ) : undefined,
      });
    } catch (error: any) {
      console.error("Scan error:", error);
  
      const errorMessage = error.response?.data?.message
        || error.message
        || "Could not analyze content. Please try again.";
  
      toast({
        title: "Scan failed",
        description: errorMessage,
        variant: "destructive",
      });
  
      setScanStatus("recorded"); // Go back to recorded state on error
    }
  };

  const resetScan = () => {
    setScanStatus("idle");
    setScanResult(null);
    setRecordedVideo(null);
    setRecordedBlob(null);

    // Stop current stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setHasPermissions(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }

    // Clean up recorded video URL
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
  };

  // Reset when switching modes
  useEffect(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setHasPermissions(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setRecordedVideo(null);
    setRecordedBlob(null);
    setScanResult(null);
    setScanStatus("idle");
  }, [captureMode]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 space-y-6">
      {/* Mode Selector */}
      <Tabs value={captureMode} onValueChange={(value) => setCaptureMode(value as CaptureMode)} className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="camera" className="gap-2">
            <Camera className="w-4 h-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="audio" className="gap-2">
            <Mic className="w-4 h-4" />
            Audio
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="relative w-full max-w-md aspect-[3/4] overflow-hidden bg-card shadow-scanner">
        {/* Live Video Preview (only when recording or idle) */}
        {captureMode === "camera" && scanStatus !== "recorded" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Audio-only visualization (only when recording or idle) */}
        {/* Audio-only visualization (only when idle, not when recording) */}
        {captureMode === "audio" && hasPermissions && scanStatus === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/20 to-primary/5">
            <div className="text-center space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse" />
                <div className="absolute inset-4 rounded-full border-4 border-primary/50 animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Mic className="w-16 h-16 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm font-medium text-primary">Ready to Record</p>
            </div>
          </div>
        )}


        {/* Recorded Video/Audio Preview */}
        {scanStatus === "recorded" && recordedVideo && (
          <>
            {captureMode === "camera" ? (
              <video
                src={recordedVideo}
                controls
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/20 to-primary/5">
                <div className="text-center space-y-4">
                  <Mic className="w-20 h-20 text-primary" />
                  <p className="text-sm font-medium text-primary">Audio Recording</p>
                  <audio src={recordedVideo} controls className="w-full max-w-xs" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Overlay when no permissions */}
        {!hasPermissions && scanStatus === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm">
            <div className="flex gap-4 mb-4">
              {captureMode === "camera" ? (
                <>
                  <Camera className="w-12 h-12 text-muted-foreground" />
                  <Mic className="w-12 h-12 text-muted-foreground" />
                </>
              ) : (
                <Mic className="w-12 h-12 text-muted-foreground" />
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center px-6">
              {captureMode === "camera"
                ? "Camera and microphone access required"
                : "Microphone access required for audio recording"}
            </p>
          </div>
        )}

        {/* Recording Overlay */}
        {/* Recording Overlay - Shows for both video and audio */}
        {scanStatus === "recording" && (
          <div className="absolute inset-0 bg-red-500/10 backdrop-blur-[1px]">
            <div className="absolute inset-0 border-2 border-red-500 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse mx-auto" />
                <p className="text-sm font-medium text-red-600">Recording...</p>
              </div>
            </div>
          </div>
        )}


        {/* Scanning Overlay */}
        {scanStatus === "scanning" && (
          <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]">
            <div className="absolute inset-0 border-2 border-primary animate-scan-pulse" />
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-line" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium text-primary">Analyzing content...</p>
              </div>
            </div>
          </div>
        )}

        {/* Result Overlay */}
        {scanStatus === "complete" && scanResult && (
          <div className={`absolute inset-0 ${scanResult === "authentic" ? "bg-success/20" : "bg-destructive/20"} backdrop-blur-sm flex items-center justify-center`}>
            <div className="text-center space-y-4 p-6">
              {scanResult === "authentic" ? (
                <>
                  <ShieldCheck className="w-20 h-20 text-success mx-auto" />
                  <div>
                    <h3 className="text-2xl font-bold text-success-foreground">Verified Authentic</h3>
                    <p className="text-sm text-success-foreground/80 mt-2">
                      No signs of manipulation detected
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-20 h-20 text-destructive mx-auto" />
                  <div>
                    <h3 className="text-2xl font-bold text-destructive-foreground">Deepfake Detected</h3>
                    <p className="text-sm text-destructive-foreground/80 mt-2">
                      Warning: Potential manipulation found
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Corner Indicators */}
        {hasPermissions && scanStatus === "idle" && (
          <>
            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/40" />
            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary/40" />
            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary/40" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/40" />
          </>
        )}
      </Card>

      {/* Control Buttons */}
      {scanStatus === "idle" && (
        <Button
          onClick={startRecording}
          size="lg"
          className="w-full max-w-md h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg shadow-glow"
        >
          {hasPermissions ? (
            <>
              {captureMode === "camera" ? (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </>
              )}
            </>
          ) : (
            <>
              {captureMode === "camera" ? (
                <>
                  <Camera className="w-5 h-5 mr-2" />
                  Enable Camera & Mic
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Enable Microphone
                </>
              )}
            </>
          )}
        </Button>
      )}

      {scanStatus === "recording" && (
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
      )}

      {scanStatus === "recorded" && (
        <div className="w-full max-w-md space-y-3">
          <Button
            onClick={scanRecordedContent}
            size="lg"
            className="w-full h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg"
          >
            <ScanLine className="w-5 h-5 mr-2" />
            Scan for Deepfakes
          </Button>
          <Button
            onClick={resetScan}
            size="lg"
            variant="secondary"
            className="w-full h-14 font-semibold text-lg"
          >
            Record Again
          </Button>
        </div>
      )}

      {scanStatus === "complete" && (
        <Button
          onClick={resetScan}
          size="lg"
          variant="secondary"
          className="w-full max-w-md h-14 font-semibold text-lg"
        >
          Scan Again
        </Button>
      )}
    </div>
  );
}