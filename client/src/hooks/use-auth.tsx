import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { useLocation } from "wouter"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

type AuthContextType = {
  session: Session | null
  user: User | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const [, setLocation] = useLocation()

  useEffect(() => {
    // Handle access token from URL hash or query params
    const handleAuthParams = () => {
      // Check URL hash first
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      // Check URL query params if tokens not in hash
      const queryParams = new URLSearchParams(window.location.search);
      const queryAccessToken = queryParams.get('access_token');
      const queryRefreshToken = queryParams.get('refresh_token');
      
      if ((accessToken && refreshToken) || (queryAccessToken && queryRefreshToken)) {
        // Set session with a more robust approach
        const session = {
          access_token: accessToken || queryAccessToken || '',
          refresh_token: refreshToken || queryRefreshToken || '',
          provider_token: null,
          provider_refresh_token: null,
          expires_at: Math.floor(Date.now() / 1000) + 3600 // Add expiration time (1 hour from now)
        };

        // Store session in localStorage for persistence
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));

        // First try to refresh the session before setting it
        supabase.auth.refreshSession().then(({ data: { session: refreshedSession }, error: refreshError }) => {
          if (!refreshError && refreshedSession) {
            setSession(refreshedSession);
            setUser(refreshedSession.user);
            // Update stored session
            localStorage.setItem('supabase.auth.token', JSON.stringify(refreshedSession));
            window.history.replaceState(null, '', window.location.pathname);
            setTimeout(() => setLocation('/app'), 100);
          } else {
            // If refresh fails, try setting the new session
            supabase.auth.setSession(session).then(({ data, error }) => {
              if (!error && data.session) {
                setSession(data.session);
                setUser(data.session.user);
                // Update stored session
                localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
                window.history.replaceState(null, '', window.location.pathname);
                setTimeout(() => setLocation('/app'), 100);
              } else {
                console.error('Error setting session:', error);
                toast({
                  title: "Authentication Error",
                  description: "Failed to establish session. Please try again.",
                  variant: "destructive",
                });
              }
            });
          }
        });
      }
    };

    handleAuthParams();

    // Try to restore session from localStorage first
    const storedSession = localStorage.getItem('supabase.auth.token');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        supabase.auth.setSession(parsedSession).then(({ data, error }) => {
          if (!error && data.session) {
            setSession(data.session);
            setUser(data.session.user);
          }
        });
      } catch (error) {
        console.error('Error restoring session:', error);
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        // Update stored session
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session) {
        // Update stored session
        localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        // Ensure we have a valid session before redirecting
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (currentSession && !error) {
          setTimeout(() => {
            setLocation('/app');
          }, 100);
        }
      } else {
        // Clear stored session on logout
        localStorage.removeItem('supabase.auth.token');
        setLocation('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      // Removed redirect as it's handled in onAuthStateChange
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      })
    } catch (error) {
      toast({
        title: "Error signing in",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`, // Redirect to app page instead of callback
        },
      })
      if (error) throw error
      toast({
        title: "Check your email",
        description: "We sent you a confirmation link.",
      })
    } catch (error) {
      toast({
        title: "Error signing up",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            response_type: 'token',
            scope: 'email profile'
          }
        },
      })
      if (error) throw error
    } catch (error) {
      toast({
        title: "Error signing in with Google",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setLocation("/auth")
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error) {
      toast({
        title: "Error signing out",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}