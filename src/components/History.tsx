import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldAlert, Clock, Trash2, Eye, Loader2, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

interface HistoryItem {
  id: number;
  is_deepfake: boolean;
  date: string;
  hour: string;
}

interface HistoryProps {
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  embedded?: boolean;
}

export function History({ items, onDelete, onRefresh, isLoading = false, embedded = false }: HistoryProps) {
  const navigate = useNavigate();

  // Helper function to combine date and hour into a Date object
  const getTimestamp = (date: string, hour: string): Date => {
    try {
      // Combine date and hour strings into a proper Date
      const dateTimeString = `${date} ${hour}`;
      return new Date(dateTimeString);
    } catch {
      // Fallback to current date if parsing fails
      return new Date();
    }
  };

  const emptyStateWrapperClass = embedded
    ? "flex flex-col items-center justify-center min-h-[16rem] p-4"
    : "flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4";

  const scrollAreaHeightClass = embedded ? "h-[28rem] md:h-[32rem]" : "h-[calc(100vh-12rem)]";

  if (isLoading) {
    return (
      <div className={emptyStateWrapperClass}>
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="w-16 h-16 text-muted-foreground mx-auto animate-spin" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">Loading History</h3>
            <p className="text-muted-foreground mt-2">
              Fetching your scan history...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={emptyStateWrapperClass}>
        <div className="text-center space-y-4 max-w-md">
          <Clock className="w-16 h-16 text-muted-foreground mx-auto" />
          <div>
            <h3 className="text-xl font-semibold text-foreground">No Scans Yet</h3>
            <p className="text-muted-foreground mt-2">
              Your scan history will appear here once you start analyzing content
            </p>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              onClick={onRefresh}
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "p-4" : "p-4 pb-20"}>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-foreground">Scan History</h2>
            <Badge variant="secondary" className="text-sm">
              {items.length} {items.length === 1 ? "scan" : "scans"}
            </Badge>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </div>

        <ScrollArea className={scrollAreaHeightClass}>
          <div className="space-y-3">
            {items.map((item) => {
              const isAuthentic = !item.is_deepfake;
              const timestamp = getTimestamp(item.date, item.hour);
              
              return (
                <Card
                  key={item.id}
                  className={`p-4 transition-all hover:shadow-md ${
                    isAuthentic
                      ? "border-success/30 bg-success/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        isAuthentic
                          ? "bg-success/20"
                          : "bg-destructive/20"
                      }`}
                    >
                      {isAuthentic ? (
                        <ShieldCheck className="w-5 h-5 text-success" />
                      ) : (
                        <ShieldAlert className="w-5 h-5 text-destructive" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {isAuthentic
                            ? "Bonafide"
                            : "Deepfake"}
                        </h3>
                        <Badge
                          variant={isAuthentic ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {isAuthentic ? "SAFE" : "WARNING"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {isAuthentic
                          ? "No signs of manipulation detected"
                          : "Potential manipulation identified"}
                      </p>

                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(timestamp, { addSuffix: true })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/scan_result/${item.id}`);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(item.id.toString());
                        }}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}