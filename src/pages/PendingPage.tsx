import * as React from "react";
import { Link } from "react-router-dom";
import { Clock, FileText, Users, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { formatDate, getInitials } from "../lib/utils";
import * as api from "../lib/api";
import type { SignatureRequestListItem } from "../types";

export function PendingPage() {
  const [requests, setRequests] = React.useState<SignatureRequestListItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await api.getSignatureRequests({ initiated: true });
        setRequests(data.filter((r) => r.status === "pending"));
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Signatures</h1>
        <p className="text-muted-foreground">
          Documents you've sent that are waiting for signatures
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
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No pending requests</h3>
            <p className="text-muted-foreground mb-4">
              You haven't sent any documents for signing yet
            </p>
            <Link to="/documents">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{request.document.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Sent {formatDate(request.created_at)}
                    </p>
                  </div>
                  <Badge variant="warning">
                    {request.placements_signed} / {request.placements_total} signed
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>
                      {request.placements_total} signature
                      {request.placements_total !== 1 && "s"} required
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {/* Show unique signers */}
                    {Array.from(
                      new Set(request.my_placements.map(() => "signer"))
                    )
                      .slice(0, 3)
                      .map((_, idx) => (
                        <Avatar key={idx} className="h-6 w-6 border-2 border-background">
                          <AvatarFallback className="text-xs">?</AvatarFallback>
                        </Avatar>
                      ))}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${
                          (request.placements_signed / request.placements_total) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
