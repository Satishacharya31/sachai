import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { Route, useLocation } from "wouter"

interface ProtectedRouteProps {
  path: string
  component: React.ComponentType
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const [, setLocation] = useLocation()

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/auth")
    }
  }, [user, isLoading, setLocation])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Route path={path}>
      {() => user ? <Component /> : null}
    </Route>
  )
}