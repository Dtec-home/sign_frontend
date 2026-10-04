import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import SignatureCanvas from "react-signature-canvas";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  PenLine,
  Check,
  Loader2,
  X,
  Eraser,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import * as api from "../lib/api";
import type { SignatureRequest, SignaturePlacement } from "../types";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function SigningPage() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const sigRef = React.useRef<SignatureCanvas>(null);

  const [request, setRequest] = React.useState<SignatureRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [numPages, setNumPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);

  const [signDialogOpen, setSignDialogOpen] = React.useState(false);
  const [activePlacement, setActivePlacement] = React.useState<SignaturePlacement | null>(null);
  const [signing, setSigning] = React.useState(false);

  React.useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      try {
        const data = await api.getSignatureRequest(requestId);
        setRequest(data);
      } catch (error) {
        console.error("Failed to fetch request:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [requestId]);

  const myPlacements = request?.placements.filter(
    (p) => p.signer.id === user?.id
  ) || [];

  const pendingPlacements = myPlacements.filter((p) => p.status === "pending");
  const signedPlacements = myPlacements.filter((p) => p.status === "signed");

  const currentPagePlacements = request?.placements.filter(
    (p) => p.page_number === currentPage
  ) || [];

  const handlePlacementClick = (placement: SignaturePlacement) => {
    if (placement.signer.id !== user?.id) return;
    if (placement.status === "signed") return;

    setActivePlacement(placement);
    setSignDialogOpen(true);
  };

  const handleSign = async () => {
    if (!activePlacement || sigRef.current?.isEmpty()) return;

    setSigning(true);
    try {
      const signature = sigRef.current?.toDataURL("image/png");
      const result = await api.signPlacement(activePlacement.id, signature || "");

      // Refresh request data
      if (requestId) {
        const updated = await api.getSignatureRequest(requestId);
        setRequest(updated);
      }

      setSignDialogOpen(false);
      sigRef.current?.clear();

      if (result.all_signed) {
        navigate("/completed");
      }
    } catch (error) {
      console.error("Failed to sign:", error);
    } finally {
      setSigning(false);
    }
  };

  const clearSignature = () => sigRef.current?.clear();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Request not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{request.document.title}</h1>
          <p className="text-sm text-muted-foreground">
            Click on your signature areas to sign
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={pendingPlacements.length === 0 ? "success" : "secondary"}>
            {signedPlacements.length} / {myPlacements.length} signed
          </Badge>
          <Button variant="outline" onClick={() => navigate("/action-required")}>
            Back
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        {/* PDF Viewer */}
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
                  disabled={currentPage >= numPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative mx-auto overflow-hidden border-t">
              <Document
                file={request.document.file_url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <Page pageNumber={currentPage} width={600} />
              </Document>

              {/* Placement overlays */}
              {currentPagePlacements.map((placement) => {
                const isMine = placement.signer.id === user?.id;
                const isPending = placement.status === "pending";

                return (
                  <div
                    key={placement.id}
                    className={cn(
                      "absolute border-2 rounded flex items-center justify-center transition-all",
                      isMine && isPending
                        ? "border-primary bg-blue-50 cursor-pointer hover:bg-blue-100"
                        : isMine && !isPending
                        ? "border-green-500 bg-green-100"
                        : isPending
                        ? "border-gray-300 bg-gray-100"
                        : "border-green-300 bg-green-50"
                    )}
                    style={{
                      left: `${placement.x * 100}%`,
                      top: `${placement.y * 100}%`,
                      width: `${placement.width * 100}%`,
                      height: `${placement.height * 100}%`,
                    }}
                    onClick={() => handlePlacementClick(placement)}
                  >
                    {isMine && isPending ? (
                      <div className="flex items-center gap-1 text-xs font-medium text-primary">
                        <PenLine className="h-3 w-3" />
                        <span>Sign here</span>
                      </div>
                    ) : placement.status === "signed" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <span className="text-xs text-gray-500">
                        {placement.signer.full_name || placement.signer.username}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Signature Status Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Your Signatures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {myPlacements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No signatures required from you
                </p>
              ) : (
                myPlacements.map((placement, idx) => (
                  <div
                    key={placement.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors",
                      placement.status === "signed"
                        ? "bg-green-50"
                        : "bg-muted hover:opacity-80"
                    )}
                    onClick={() => {
                      setCurrentPage(placement.page_number);
                      if (placement.status === "pending") {
                        handlePlacementClick(placement);
                      }
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        placement.status === "signed"
                          ? "bg-green-500 text-white"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {placement.status === "signed" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Page {placement.page_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {placement.status === "signed" ? "Signed" : "Pending"}
                      </p>
                    </div>
                    {placement.status === "pending" && (
                      <PenLine className="h-4 w-4 text-primary" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {pendingPlacements.length === 0 && myPlacements.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-4 text-center">
                <Check className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="font-medium text-green-800">All Done!</p>
                <p className="text-sm text-green-600">
                  You've signed all required areas
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sign Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent onClose={() => setSignDialogOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Draw Your Signature</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="border-2 border-dashed rounded-lg bg-white">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: "w-full h-40",
                  style: { width: "100%", height: "160px" },
                }}
                backgroundColor="white"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={clearSignature}
            >
              <Eraser className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSignDialogOpen(false)}
              disabled={signing}
            >
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply Signature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
