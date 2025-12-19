import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Scanner from "@/components/Scanner";
import ScreenRecorder from "@/components/ScreenRecorder";
import { Upload } from "@/components/Upload";
import ImageAnalyzer from "@/components/ImageAnalyzer";
import { History } from "@/components/History";
import { logApi } from "@/api/handling/apiLogHandling";
import { useToast } from "@/components/ui/use-toast";
import { ClipboardPaste, Clock, ScanLine, Shield, Upload as UploadIcon, Video } from "lucide-react";

type HistoryItem = { id: number; is_deepfake: boolean; date: string; hour: string };

type Mode = "scanner" | "record" | "upload" | "paste" | "history";

const MainApp = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const { toast } = useToast();

  const getErrorMessage = (error: unknown): string | undefined => {
    if (typeof error !== "object" || !error) return undefined;
    const e = error as { response?: { data?: { message?: unknown } } };
    const msg = e.response?.data?.message;
    return typeof msg === "string" ? msg : undefined;
  };

  const fetchLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const response = await logApi.getAllLogs();

      const data: unknown = response.data;
      const logs: HistoryItem[] = Array.isArray(data)
        ? data
            .map((log) => {
              const obj = (log ?? {}) as Record<string, unknown>;
              const idValue = obj.id;
              const id =
                typeof idValue === "number"
                  ? idValue
                  : typeof idValue === "string"
                    ? Number.parseInt(idValue, 10)
                    : NaN;
              if (!Number.isFinite(id)) return null;

              const isDeepfake =
                (typeof obj.is_deepfake === "boolean" && obj.is_deepfake) ||
                (typeof obj.isDeepFake === "boolean" && obj.isDeepFake) ||
                (typeof obj.classification === "string" && obj.classification.toLowerCase().includes("deepfake"));

              return {
                id,
                is_deepfake: Boolean(isDeepfake),
                date: String(obj.date ?? ""),
                hour: String(obj.hour ?? ""),
              } satisfies HistoryItem;
            })
            .filter((x): x is HistoryItem => x !== null)
        : [];

      setHistoryItems(logs);
    } catch (error: unknown) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Failed to load history",
        description: getErrorMessage(error) || (error instanceof Error ? error.message : "Could not load scan history"),
        variant: "destructive",
      });
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScanComplete = (_result: { status: "authentic" | "fake" | null; timestamp: Date; resultId?: string }) => {
    fetchLogs();
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const logId = Number.parseInt(id, 10);
      await logApi.deleteLogById(logId);
      setHistoryItems((prev) => prev.filter((item) => item.id.toString() !== id));

      toast({
        title: "Log deleted",
        description: "The scan log has been removed",
      });
    } catch (error: unknown) {
      console.error("Error deleting log:", error);
      toast({
        title: "Delete failed",
        description: getErrorMessage(error) || (error instanceof Error ? error.message : "Could not delete the log"),
        variant: "destructive",
      });
    }
  };

  const historyLabel = useMemo(() => {
    const count = historyItems.length;
    return count > 0 ? `History (${count})` : "History";
  }, [historyItems.length]);

  return (
    <div className="min-h-screen bg-background">
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

      <Tabs defaultValue={"scanner" satisfies Mode} className="w-full">
        <TabsList className="w-full rounded-none border-b border-border h-14 bg-background/50 backdrop-blur-sm sticky top-[73px] z-40">
          <TabsTrigger value="scanner" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
            <ScanLine className="w-4 h-4" />
            Scanner
          </TabsTrigger>
          <TabsTrigger value="record" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
            <Video className="w-4 h-4" />
            Screen
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
            <UploadIcon className="w-4 h-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="paste" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
            <ClipboardPaste className="w-4 h-4" />
            Paste
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
            <Clock className="w-4 h-4" />
            {historyLabel}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="m-0">
          <Scanner onScanComplete={handleScanComplete} />
        </TabsContent>
        <TabsContent value="record" className="m-0">
          <ScreenRecorder onScanComplete={handleScanComplete} />
        </TabsContent>
        <TabsContent value="upload" className="m-0">
          <Upload onScanComplete={handleScanComplete} />
        </TabsContent>
        <TabsContent value="paste" className="m-0">
          <ImageAnalyzer onScanComplete={handleScanComplete} />
        </TabsContent>
        <TabsContent value="history" className="m-0">
          <History items={historyItems} onDelete={handleDeleteItem} isLoading={isLoadingLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MainApp;
