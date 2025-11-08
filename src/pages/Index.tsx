import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Scanner from "@/components/Scanner";
import { Upload } from "@/components/Upload";
import { History } from "@/components/History";
import { Shield, ScanLine, Clock, Upload as UploadIcon } from "lucide-react";

interface HistoryItem {
  id: string;
  status: "authentic" | "fake";
  timestamp: Date;
}

const Index = () => {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  const handleScanComplete = (result: { status: "authentic" | "fake" | null; timestamp: Date }) => {
    if (result.status) {
      const newItem: HistoryItem = {
        id: `scan-${Date.now()}`,
        status: result.status,
        timestamp: result.timestamp,
      };
      setHistoryItems((prev) => [newItem, ...prev]);
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
              <h1 className="text-xl font-bold text-foreground">DeepGuard</h1>
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

        <TabsContent value="history" className="m-0">
          <History items={historyItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
