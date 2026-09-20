import { Toaster } from "@/components/ui/sonner";
import ErrorBoundary from "@/components/ErrorBoundary";
import ClinicalRecords from "@/pages/ClinicalRecords";

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster richColors position="top-right" />
      <ClinicalRecords />
    </ErrorBoundary>
  );
}
