import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Scanner from "@/components/Scanner";
import { Upload } from "@/components/Upload";
import { History } from "@/components/History";
import { Shield, ScanLine, Clock, Upload as UploadIcon, Video } from "lucide-react";
import ScreenRecorder from "@/components/ScreenRecorder";
import { logApi } from "@/api/logs/apiLogHandling";
import { useToast } from "@/components/ui/use-toast";

const MainApp = () => {
  const [historyItems, setHistoryItems] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const response = await logApi.getAllLogs();

      console.log(response.data);
      const logs = response.data.map((log: any) => ({
        id: log.id,
        is_deepfake: log.is_deepfake,
        date: log.date.toString(),
        hour: log.hour.toString(),
      }));

      setHistoryItems(logs);
    } catch (error: any) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Failed to load history",
        description: error.response?.data?.message || "Could not load scan history",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleScanComplete = (result: { status: "authentic" | "fake" | null; timestamp: Date; resultId?: string }) => {
    // After a scan completes, refetch logs to get the latest data from the backend
    fetchLogs();
  };


  const handleDeleteItem = async (id: string) => {
    try {
      // Convert string id to number if your API expects a number
      const logId = parseInt(id);

      await logApi.deleteLogById(logId);

      // Remove from local state
      setHistoryItems((prev) => prev.filter((item) => item.id.toString() !== id));

      toast({
        title: "Log deleted",
        description: "The scan log has been removed",
      });
    } catch (error: any) {
      console.error("Error deleting log:", error);
      toast({
        title: "Delete failed",
        description: error.response?.data?.message || "Could not delete the log",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DeepTrust</h1>
              <p className="text-xs text-muted-foreground">AI Content Verification</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Tabs defaultValue="scanner" className="w-full">
        <TabsList className="w-full rounded-none border-b border-border h-14 bg-background/50 backdrop-blur-sm sticky top-[73px] z-40">
          <TabsTrigger
            value="scanner"
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
          >
            <ScanLine className="w-4 h-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger
            value="record"
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
          >
            <Video className="w-4 h-4" />
            Screen
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
          >
            <UploadIcon className="w-4 h-4" />
            Upload
          </TabsTrigger>

          <TabsTrigger
            value="history"
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
          >
            <Clock className="w-4 h-4" />
            History
            {historyItems.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {historyItems.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="m-0">
          <Scanner onScanComplete={handleScanComplete} />
        </TabsContent>

        <TabsContent value="upload" className="m-0">
          <Upload onScanComplete={handleScanComplete} />
        </TabsContent>

        <TabsContent value="record" className="m-0">
          <ScreenRecorder
            onScanComplete={handleScanComplete}
          />
        </TabsContent>

        <TabsContent value="history" className="m-0">
          <History items={historyItems} onDelete={handleDeleteItem} isLoading={isLoadingLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainApp;
