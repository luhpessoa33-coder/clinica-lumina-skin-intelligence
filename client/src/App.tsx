import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"}>{() => <Home />}</Route>
      <Route path={"/anteprojeto"}>{() => <Home view="anteprojeto" />}</Route>
      <Route path={"/orcamento"}>{() => <Home view="orcamento" />}</Route>
      <Route path={"/catalogo"}>{() => <Home view="catalogo" />}</Route>
      <Route path={"/cronograma"}>{() => <Home view="cronograma" />}</Route>
      <Route path={"/conformidade"}>{() => <Home view="conformidade" />}</Route>
      <Route path={"/cursos"}>{() => <Home view="cursos" />}</Route>
      <Route path={"/biblioteca"}>{() => <Home view="biblioteca" />}</Route>
      <Route path={"/operacao"}>{() => <Home view="operacao" />}</Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
