import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NCMCacheProvider } from "./contexts/NCMCacheContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import SimulationsPage from "./pages/SimulationsPage";
import SimulationDetailPage from "./pages/SimulationDetailPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/simulations"}>
        {() => (
          <DashboardLayout>
            <SimulationsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/simulations/:id"}>
        {(params) => (
          <DashboardLayout>
            <SimulationDetailPage simulationId={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <NCMCacheProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </NCMCacheProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
