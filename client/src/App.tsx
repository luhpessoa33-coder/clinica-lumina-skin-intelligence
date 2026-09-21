import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import PublicSite from "@/pages/PublicSite";
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

export default function App() {
  const path = useCurrentPath();
  const isProtectedRoute = path === "/portal" || path === "/acesso";
  return <ErrorBoundary><Toaster richColors position="top-right" /><Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f7f4ed] text-sm text-[#58716a]">Abrindo ambiente…</main>}>{isProtectedRoute ? <ClinicalRecords /> : <PublicSite />}</Suspense></ErrorBoundary>;
}
