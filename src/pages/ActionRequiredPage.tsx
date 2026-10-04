import * as React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, FileText, PenLine } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { formatDate } from "../lib/utils";
import * as api from "../lib/api";
import type { SignatureRequestListItem } from "../types";

export function ActionRequiredPage() {
  const [requests, setRequests] = React.useState<SignatureRequestListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.getSignatureRequests({ action_required: true });
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const pendingRequests = requests.filter((r) =>
    r.my_placements.some((p) => p.status === "pending")
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Action Required</h1>
        <p className="text-muted-foreground">
          Documents that need your signature
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
      ) : pendingRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground">
              You don't have any documents waiting for your signature
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => {
            const myPendingCount = request.my_placements.filter(
              (p) => p.status === "pending"
            ).length;

            return (
              <Card key={request.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-medium">{request.document.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        From {request.initiator.full_name || request.initiator.username}
                        {" "}&bull;{" "}
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                    <Badge variant="destructive">
                      {myPendingCount} signature{myPendingCount !== 1 && "s"} needed
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{request.document.page_count} pages</span>
                    </div>
                    <Link to={`/sign/${request.id}`}>
                      <Button>
                        <PenLine className="mr-2 h-4 w-4" />
                        Sign Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
