import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Send,
  Trash2,
  Loader2,
  X,
  Search,
  Plus,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { cn, getSignerColor, getInitials } from "../lib/utils";
import * as api from "../lib/api";
import type { Document as DocType, User, LocalPlacement, SelectedSigner, PlacementInput } from "../types";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PrepareDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = React.useState<DocType | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [numPages, setNumPages] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState({ width: 0, height: 0 });

  // Users and signers
  const [users, setUsers] = React.useState<User[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSigners, setSelectedSigners] = React.useState<SelectedSigner[]>([]);
  const [activeSigner, setActiveSigner] = React.useState<SelectedSigner | null>(null);

  // Placements
  const [placements, setPlacements] = React.useState<LocalPlacement[]>([]);

  // Dialog states
  const [confirmSendOpen, setConfirmSendOpen] = React.useState(false);
  const [sending, setSending] = React.useState(false);

  // Fetch document and users
  React.useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const [doc, userList] = await Promise.all([
          api.getDocument(id),
          api.getUsers(),
        ]);
        setDocument(doc);
        setUsers(userList);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const filteredUsers = users.filter(
    (u) =>
      !selectedSigners.some((s) => s.id === u.id) &&
      (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addSigner = (user: User) => {
    const colorIndex = selectedSigners.length;
    const color = getSignerColor(colorIndex);
    setSelectedSigners((prev) => [...prev, { ...user, color }]);
    setActiveSigner({ ...user, color });
    setSearchQuery("");
  };

  const removeSigner = (userId: number) => {
    setSelectedSigners((prev) => prev.filter((s) => s.id !== userId));
    setPlacements((prev) => prev.filter((p) => p.signer.id !== userId));
    if (activeSigner?.id === userId) {
      setActiveSigner(null);
    }
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeSigner) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const newPlacement: LocalPlacement = {
      id: crypto.randomUUID(),
      signer: activeSigner,
      page_number: currentPage,
      x,
      y,
      width: 0.2,
      height: 0.06,
      order: placements.length + 1,
    };

    setPlacements((prev) => [...prev, newPlacement]);
  };

  const removePlacement = (placementId: string) => {
    setPlacements((prev) => prev.filter((p) => p.id !== placementId));
  };

  const currentPagePlacements = placements.filter(
    (p) => p.page_number === currentPage
  );

  const getSignerPlacements = (signerId: number) =>
    placements.filter((p) => p.signer.id === signerId);

  const handleSend = async () => {
    if (!id || placements.length === 0) return;

    setSending(true);
    try {
      const placementInputs: PlacementInput[] = placements.map((p, idx) => ({
        signer_id: p.signer.id,
        page_number: p.page_number,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        order: idx + 1,
      }));

      const request = await api.createSignatureRequest(id, placementInputs);
      await api.sendSignatureRequest(request.id);

      navigate("/pending");
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setSending(false);
      setConfirmSendOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Document not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            Click on the document to place signature areas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/documents")}>
            Cancel
          </Button>
          <Button
            onClick={() => setConfirmSendOpen(true)}
            disabled={placements.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Send for Signing
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
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
              {activeSigner && (
                <Badge className={cn(activeSigner.color.bg, activeSigner.color.text, "border-0")}>
                  Placing for: {activeSigner.full_name || activeSigner.username}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div
              className={cn(
                "relative mx-auto overflow-hidden border-t",
                activeSigner && "cursor-crosshair"
              )}
              onClick={handlePdfClick}
            >
              <Document
                file={document.file_url}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={
                  <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  width={600}
                  onLoadSuccess={(page) =>
                    setPageSize({ width: page.width, height: page.height })
                  }
                />
              </Document>

              {/* Placement overlays */}
              {currentPagePlacements.map((placement) => {
                const signer = selectedSigners.find(
                  (s) => s.id === placement.signer.id
                );
                if (!signer) return null;

                return (
                  <div
                    key={placement.id}
                    className={cn(
                      "absolute border-2 rounded flex items-center justify-between px-2 py-1",
                      signer.color.bg,
                      signer.color.border
                    )}
                    style={{
                      left: `${placement.x * 100}%`,
                      top: `${placement.y * 100}%`,
                      width: `${placement.width * 100}%`,
                      height: `${placement.height * 100}%`,
                    }}
                  >
                    <span className={cn("text-xs font-medium truncate", signer.color.text)}>
                      {signer.full_name || signer.username}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removePlacement(placement.id);
                      }}
                      className={cn(
                        "ml-1 rounded-full p-0.5 hover:bg-gray-200",
                        signer.color.text
                      )}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Signer Panel */}
        <div className="space-y-4">
          {/* Add Signers */}
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Add Signers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              {searchQuery && (
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      No users found
                    </p>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => addSigner(user)}
                        className="flex w-full items-center gap-2 rounded-md p-2 text-left hover:bg-muted"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.full_name || user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {user.full_name || user.username}
                        </span>
                        <Plus className="ml-auto h-4 w-4 text-muted-foreground" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Signers */}
          {selectedSigners.length > 0 && (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">
                  Selected Signers ({selectedSigners.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedSigners.map((signer) => {
                  const signerPlacements = getSignerPlacements(signer.id);
                  const isActive = activeSigner?.id === signer.id;

                  return (
                    <div
                      key={signer.id}
                      className={cn(
                        "flex items-center gap-2 rounded-lg p-2 cursor-pointer transition-colors",
                        isActive
                          ? cn(signer.color.bg, signer.color.border, "border")
                          : "hover:bg-muted"
                      )}
                      onClick={() => setActiveSigner(signer)}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: signer.color.fill }}
                      />
                      <span className="text-sm font-medium flex-1 truncate">
                        {signer.full_name || signer.username}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {signerPlacements.length} spot{signerPlacements.length !== 1 && "s"}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSigner(signer.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          {selectedSigners.length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Search and add users who need to sign this document</p>
              </CardContent>
            </Card>
          )}

          {selectedSigners.length > 0 && !activeSigner && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                <p>Click on a signer to start placing their signature areas</p>
              </CardContent>
            </Card>
          )}

          {activeSigner && (
            <Card>
              <CardContent className="py-4 text-center text-sm text-muted-foreground">
                <p>
                  Click on the PDF to place a signature area for{" "}
                  <strong>{activeSigner.full_name || activeSigner.username}</strong>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirm Send Dialog */}
      <Dialog open={confirmSendOpen} onOpenChange={setConfirmSendOpen}>
        <DialogContent onClose={() => setConfirmSendOpen(false)}>
          <DialogHeader>
            <DialogTitle>Send for Signing?</DialogTitle>
            <DialogDescription>
              This will send the document to the following signers:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            {selectedSigners.map((signer) => {
              const count = getSignerPlacements(signer.id).length;
              return (
                <div
                  key={signer.id}
                  className="flex items-center gap-2 rounded-lg bg-muted p-2"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: signer.color.fill }}
                  />
                  <span className="flex-1">
                    {signer.full_name || signer.username}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {count} signature{count !== 1 && "s"}
                  </span>
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSendOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send for Signing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
