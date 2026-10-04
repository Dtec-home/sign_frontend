import * as React from "react";
import { CheckCircle2, Download, FileText } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../lib/utils";
import * as api from "../lib/api";
import type { SignatureRequestListItem } from "../types";

export function CompletedPage() {
  const [requests, setRequests] = React.useState<SignatureRequestListItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.getSignatureRequests({ completed: true });
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleDownload = async (requestId: string, title: string) => {
    setDownloading(requestId);
    try {
      const blob = await api.downloadSignedDocument(requestId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signed-${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Completed</h1>
        <p className="text-muted-foreground">
          Fully signed documents ready for download
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 w-48 rounded bg-muted mb-2" />
                <div className="h-4 w-32 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No completed documents</h3>
            <p className="text-muted-foreground">
              Documents will appear here once all signatures are collected
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{request.document.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Completed {request.completed_at ? formatDate(request.completed_at) : ""}
                    </p>
                  </div>
                  <Badge variant="success">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{request.document.page_count} pages</span>
                    </div>
                    <span>&bull;</span>
                    <span>
                      {request.placements_total} signature
                      {request.placements_total !== 1 && "s"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      handleDownload(request.id, request.document.title)
                    }
                    disabled={downloading === request.id}
                  >
                    {downloading === request.id ? (
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
