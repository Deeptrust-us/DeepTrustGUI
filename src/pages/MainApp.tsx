import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Scanner from "@/components/Scanner";
import { Upload } from "@/components/Upload";
import { History } from "@/components/History";
import { ClipboardPaste, ScanLine, Upload as UploadIcon, Video, History as HistoryIcon } from "lucide-react";
import ScreenRecorder from "@/components/ScreenRecorder";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { DemoMenu, type DemoRequest } from "@/components/DemoMenu";
import ImageAnalyzer from "../components/ImageAnalyzer";
import { deleteHistoryEntry, getHistoryEntries, subscribeToHistoryUpdates, type HistoryLogEntry } from "@/lib/historyStorage";

type Mode = "scanner" | "screen" | "upload" | "paste";

const MainApp = () => {
  const [historyItems, setHistoryItems] = useState<HistoryLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [mode, setMode] = useState<Mode>("scanner");
  const [demoRequest, setDemoRequest] = useState<DemoRequest | null>(null);
  const { toast } = useToast();

  const fetchLogs = useCallback(() => {
    setIsLoadingLogs(true);
    setHistoryItems(getHistoryEntries());
    setIsLoadingLogs(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => subscribeToHistoryUpdates(fetchLogs), [fetchLogs]);

  const handleScanComplete = (_result: { status: "authentic" | "fake" | null; timestamp: Date; resultId?: string }) => {
    // Refresh the local history list after a new analysis is stored.
    fetchLogs();
  };

  const handleDeleteItem = async (id: string) => {
    deleteHistoryEntry(id);
    setHistoryItems((prev) => prev.filter((item) => item.id !== id));
    toast({
      title: "Log deleted",
      description: "The local scan log has been removed",
    });
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
                <TabsTrigger value="paste" className="rounded-full px-5 gap-2">
                  <ClipboardPaste className="w-4 h-4" />
                  Paste
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
                  <TabsContent value="paste" className="m-0">
                    <ImageAnalyzer onScanComplete={handleScanComplete} embedded />
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
