import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Settings from "@/pages/settings";
import Auth from "@/pages/auth";
import Landing from "@/pages/landing";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/auth">
        {(params) => <Auth />}
      </Route>
      <ProtectedRoute path="/app" component={Home} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/">
        {(params) => <Landing />}
      </Route>
      <Route>
        {(params) => <NotFound />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;