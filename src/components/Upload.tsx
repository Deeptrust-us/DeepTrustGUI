import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload as UploadIcon, Link as LinkIcon, FileVideo, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadProps {
  onScanComplete: (result: { status: "authentic" | "fake" | null; timestamp: Date }) => void;
}

export const Upload = ({ onScanComplete }: UploadProps) => {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [contentUrl, setContentUrl] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to scan",
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
      setSelectedFile(null);
      
      toast({
        title: isFake ? "⚠️ Deepfake Detected" : "✓ Content Authentic",
        description: isFake 
          ? "This content appears to be manipulated" 
          : "No signs of manipulation detected",
        variant: isFake ? "destructive" : "default",
      });
    }, 3000);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="file" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <LinkIcon className="w-4 h-4" />
            URL/Link
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Media File</CardTitle>
              <CardDescription>
                Upload a video, audio, or image file to check for deepfakes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                <FileVideo className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <Input
                  type="file"
                  accept="video/*,audio/*,image/*"
                  onChange={handleFileChange}
                  className="mb-4"
                  disabled={isScanning}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mb-4">
                    Selected: {selectedFile.name}
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

        <TabsContent value="url" className="mt-6">
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
      </Tabs>
    </div>
  );
};
