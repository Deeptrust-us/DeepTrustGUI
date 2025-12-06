import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Mic, ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ScanStatus = "idle" | "scanning" | "complete";
type ScanResult = "authentic" | "fake" | null;

interface ScannerProps {
  onScanComplete: (result: { status: ScanResult; timestamp: Date }) => void;
}

export function ScannerOld({ onScanComplete }: ScannerProps) {
  const [scanStatus, setScanStatus] = useState<ScanStatus>("idle");
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasPermissions, setHasPermissions] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const requestPermissions = async () => {
    try {
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
      toast({
        title: "Permission denied",
        description: "Please allow camera and microphone access",
        variant: "destructive",
      });
    }
  };

  const startScan = async () => {
    if (!hasPermissions) {
      await requestPermissions();
      return;
    }

    setScanStatus("scanning");
    setScanResult(null);

    // Simulate scanning process (2.5 seconds)
    setTimeout(() => {
      // Random result for demo (70% authentic, 30% fake)
      const result: ScanResult = Math.random() > 0.3 ? "authentic" : "fake";
      setScanResult(result);
      setScanStatus("complete");
      
      onScanComplete({
        status: result,
        timestamp: new Date(),
      });

      toast({
        title: result === "authentic" ? "Verified Authentic" : "Deepfake Detected",
        description: result === "authentic" 
          ? "This content appears to be genuine" 
          : "Warning: This content may be manipulated",
        variant: result === "authentic" ? "default" : "destructive",
      });
    }, 2500);
  };

  const resetScan = () => {
    setScanStatus("idle");
    setScanResult(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4 space-y-6">
      <Card className="relative w-full max-w-md aspect-[3/4] overflow-hidden bg-card shadow-scanner">
        {/* Video Preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay when no permissions */}
        {!hasPermissions && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm">
            <div className="flex gap-4 mb-4">
              <Camera className="w-12 h-12 text-muted-foreground" />
              <Mic className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground text-center px-6">
              Camera and microphone access required for deepfake detection
            </p>
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

      {/* Control Button */}
      {scanStatus === "idle" && (
        <Button
          onClick={startScan}
          size="lg"
          className="w-full max-w-md h-14 bg-gradient-primary hover:opacity-90 text-white font-semibold text-lg shadow-glow"
        >
          {hasPermissions ? (
            <>
              <ShieldCheck className="w-5 h-5 mr-2" />
              Start Scan
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Enable Camera & Mic
            </>
          )}
        </Button>
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
