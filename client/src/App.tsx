import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import { trpc } from "@/lib/trpc";
import { publicThemeStyle } from "@/lib/publicTheme";
import PublicSite from "@/pages/PublicSite";
import { clonePublicSiteContent } from "@shared/publicSite";
import { lazy, Suspense, useEffect, useState } from "react";

const ClinicalRecords = lazy(() => import("@/pages/ClinicalRecords"));

function useCurrentPath() {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);
  return path;
}

function ProtectedPortal() {
  const publicSite = trpc.publicSite.content.useQuery();
  const site = publicSite.data ?? clonePublicSiteContent();
  return <div className="lumina-protected" style={publicThemeStyle(site.theme)}><ClinicalRecords /></div>;
}

export default function App() {
  const path = useCurrentPath();
  const isProtectedRoute = path === "/portal" || path === "/acesso";
  return <ErrorBoundary><Toaster richColors position="top-right" /><Suspense fallback={<main className="grid min-h-screen place-items-center bg-[var(--lumina-background)] text-sm text-[var(--lumina-muted-text)]">Abrindo ambiente…</main>}>{isProtectedRoute ? <ProtectedPortal /> : <PublicSite />}</Suspense></ErrorBoundary>;
}
