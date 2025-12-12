import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, Link as LinkIcon, FileVideo, Loader2, Mic, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { videoDetection } from "@/api/video/videoDetection";
import { audioDetection } from "@/api/audio/audioDetection";

interface UploadProps {
  onScanComplete: (result: { status: "authentic" | "fake" | null; timestamp: Date }) => void;
}

export const Upload = ({ onScanComplete }: UploadProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState("");
  const navigate = useNavigate();

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
  
      onScanComplete({
        status: result.status,
        timestamp: new Date(),
      });
  
      setIsScanning(false);
      setSelectedVideoFile(null);
      setSelectedAudioFile(null);
  
      toast({
        title: result.status === "authentic" ? "Content Authentic" : "Deepfake Detected",
        description: result.status === "authentic"
          ? "No signs of manipulation detected"
          : "This content appears to be manipulated",
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
    
    // Simulate scanning process
    setTimeout(() => {
      const isFake = Math.random() > 0.5;
      const result = {
        status: isFake ? ("fake" as const) : ("authentic" as const),
        timestamp: new Date(),
      };
      
      onScanComplete(result);
      setIsScanning(false);
      setContentUrl("");
      
      toast({
        title: isFake ? "⚠️ Deepfake Detected" : "✓ Content Authentic",
        description: isFake 
          ? "This content appears to be manipulated" 
          : "No signs of manipulation detected",
        variant: isFake ? "destructive" : "default",
      });
    }, 3000);
  };

  const selectedFile = selectedVideoFile || selectedAudioFile;

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="file" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          {/*<TabsTrigger value="url" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            URL/Link
          </TabsTrigger>*/}
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media File</CardTitle>
              <CardDescription>
                Upload a video or audio file to check for deepfakes
              </CardDescription>
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
                {selectedVideoFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedVideoFile.name}
                  </p>
                )}
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
                {selectedAudioFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedAudioFile.name}
                  </p>
                )}
              </div>

            
              <Button
                onClick={handleFileUpload}
                disabled={!selectedFile || isScanning}
                className="w-full"
                size="lg"
              >
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

        {/**
         * 
         * 
         * <TabsContent value="url" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Enter Content URL</CardTitle>
              <CardDescription>
                Provide a link to video or audio content to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="url"
                  placeholder="https://example.com/video.mp4"
                  value={contentUrl}
                  onChange={(e) => setContentUrl(e.target.value)}
                  disabled={isScanning}
                />
              </div>
              <Button
                onClick={handleUrlScan}
                disabled={!contentUrl.trim() || isScanning}
                className="w-full"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Scan URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
         * 
         * 
         */}
      </Tabs>
    </div>
  );
};