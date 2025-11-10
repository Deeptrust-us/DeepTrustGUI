import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, ShieldAlert, Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom"; // Add this import

interface HistoryItem {
  id: string;
  resultId: string; // Add this
  status: "authentic" | "fake";
  timestamp: Date;
}

interface HistoryProps {
  items: HistoryItem[];
}

export function History({ items }: HistoryProps) {
  const navigate = useNavigate(); // Add this

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="text-center space-y-4 max-w-md">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">No Scans Yet</h3>
            <p className="text-muted-foreground mt-2">
              Your scan history will appear here once you start analyzing content
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
          <Badge variant="secondary" className="text-sm">
            {items.length} {items.length === 1 ? "scan" : "scans"}
          </Badge>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-3">
            {items.map((item) => (
              <Card
                key={item.id}
                onClick={() => navigate(`/scan_result/${item.resultId}`)} // Add click handler
                className={`p-4 transition-all hover:shadow-md cursor-pointer hover:scale-[1.01] ${
                  item.status === "authentic"
                    ? "border-success/30 bg-success/5 hover:border-success/50"
                    : "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      item.status === "authentic"
                        ? "bg-success/20"
                        : "bg-destructive/20"
                    }`}
                  >
                    {item.status === "authentic" ? (
                      <ShieldCheck className="w-5 h-5 text-success" />
                    ) : (
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">
                        {item.status === "authentic"
                          ? "Verified Authentic"
                          : "Deepfake Detected"}
                      </h3>
                      <Badge
                        variant={item.status === "authentic" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {item.status === "authentic" ? "SAFE" : "WARNING"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {item.status === "authentic"
                        ? "No signs of manipulation detected"
                        : "Potential manipulation identified"}
                    </p>

                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                    </div>
                  </div>

                  {/* Add chevron to indicate clickable */}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}