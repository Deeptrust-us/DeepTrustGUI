import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Scanner from "@/components/Scanner";
import { Upload } from "@/components/Upload";
import { History } from "@/components/History";
import { ScanLine, Upload as UploadIcon, Video, History as HistoryIcon } from "lucide-react";
import ScreenRecorder from "@/components/ScreenRecorder";
import { logApi } from "@/api/handling/apiLogHandling";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { DemoMenu, type DemoRequest } from "@/components/DemoMenu";

type HistoryItem = { id: number; is_deepfake: boolean; date: string; hour: string };

type Mode = "scanner" | "screen" | "upload";

const MainApp = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [mode, setMode] = useState<Mode>("scanner");
  const [demoRequest, setDemoRequest] = useState<DemoRequest | null>(null);
  const { toast } = useToast();

  const getErrorMessage = (error: unknown): string | undefined => {
    if (typeof error !== "object" || !error) return undefined;
    const e = error as { response?: { data?: { message?: unknown } } };
    const msg = e.response?.data?.message;
    return typeof msg === "string" ? msg : undefined;
  };

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const response = await logApi.getAllLogs();

      console.log(response.data);
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
  }, [toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleScanComplete = (_result: { status: "authentic" | "fake" | null; timestamp: Date; resultId?: string }) => {
    // After a scan completes, refetch logs to get the latest data from the backend
    fetchLogs();
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const logId = parseInt(id, 10);

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

  const historyCount = historyItems.length;
  const historyLabel = useMemo(() => {
    if (historyCount === 0) return "History";
    return `History (${historyCount})`;
  }, [historyCount]);

  const scrollToHistory = () => {
    const el = document.getElementById("history");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Global Header (minimal, informational) */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold text-foreground tracking-tight">Deeptrust-US</div>
            <div className="flex items-center gap-2">
              <DemoMenu
                basePath="/demos"
                onPick={(req) => {
                  setMode("upload");
                  setDemoRequest(req);
                }}
              />
              <Button variant="ghost" size="sm" onClick={scrollToHistory} className="gap-2">
                <HistoryIcon className="w-4 h-4" />
                {historyLabel}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="pt-14 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            DeepTrust — Restoring trust in what we see and hear.
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
            Deeptrust-US detects manipulation, deepfakes, and synthetic media to help people verify authenticity in a digital
            world.
          </p>
        </section>

        {/* Mode selector + dynamic interaction zone */}
        <section className="pb-16">
          <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-full">
            <div className="flex justify-center">
              <TabsList className="h-11 rounded-full bg-muted p-1">
                <TabsTrigger value="scanner" className="rounded-full px-5 gap-2">
                  <ScanLine className="w-4 h-4" />
                  Scanner
                </TabsTrigger>
                <TabsTrigger value="screen" className="rounded-full px-5 gap-2">
                  <Video className="w-4 h-4" />
                  Screen
                </TabsTrigger>
                <TabsTrigger value="upload" className="rounded-full px-5 gap-2">
                  <UploadIcon className="w-4 h-4" />
                  Upload
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="mt-8">
              <div className="mx-auto w-full max-w-5xl rounded-2xl border border-border bg-card">
                <div className="p-4 md:p-6">
                  <TabsContent value="scanner" className="m-0">
                    <Scanner onScanComplete={handleScanComplete} embedded />
                  </TabsContent>
                  <TabsContent value="screen" className="m-0">
                    <ScreenRecorder onScanComplete={handleScanComplete} embedded />
                  </TabsContent>
                  <TabsContent value="upload" className="m-0">
                    <Upload
                      onScanComplete={handleScanComplete}
                      embedded
                      demoRequest={demoRequest}
                      onDemoConsumed={() => setDemoRequest(null)}
                    />
                  </TabsContent>
                </div>
              </div>
            </div>
          </Tabs>
        </section>

        {/* History (scroll-to section, not a new page) */}
        <section id="history" className="pb-20 scroll-mt-24">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="text-2xl font-bold text-foreground tracking-tight">History</div>
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoadingLogs}>
              Refresh
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <History items={historyItems} onDelete={handleDeleteItem} isLoading={isLoadingLogs} embedded />
          </div>
        </section>
      </main>
    </div>
  );
};

export default MainApp;
