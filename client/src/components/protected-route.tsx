import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { Route, useLocation } from "wouter"

interface ProtectedRouteProps {
  path: string
  component: React.ComponentType
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user
    if (!isLoading && !user && location !== '/auth' && location !== '/') {
      setLocation('/auth');
    }
  }, [user, isLoading, location, setLocation]);

  // Show loading state only if we're loading and not on auth or landing page
  if (isLoading && location !== '/auth' && location !== '/') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your session...</p>
        </div>
      </div>
    );
  }

  return (
    <Route path={path}>
      {() => (user || isLoading) ? <Component /> : null}
    </Route>
  );
}