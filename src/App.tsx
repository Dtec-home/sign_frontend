import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { SidebarProvider } from "./hooks/useSidebar";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { PrepareDocumentPage } from "./pages/PrepareDocumentPage";
import { PendingPage } from "./pages/PendingPage";
import { ActionRequiredPage } from "./pages/ActionRequiredPage";
import { CompletedPage } from "./pages/CompletedPage";
import { SigningPage } from "./pages/SigningPage";
import { SettingsPage } from "./pages/SettingsPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/documents/:id/prepare" element={<PrepareDocumentPage />} />
              <Route path="/pending" element={<PendingPage />} />
              <Route path="/action-required" element={<ActionRequiredPage />} />
              <Route path="/completed" element={<CompletedPage />} />
              <Route path="/sign/:requestId" element={<SigningPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
