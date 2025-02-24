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
    let mounted = true;

    async function initializeAuth() {
      try {
        // Get the stored session first
        const storedSession = localStorage.getItem('supabase.auth.token');
        const parsedSession = storedSession ? JSON.parse(storedSession) : null;

        // If we have a stored session, try to use it first
        if (parsedSession) {
          try {
            const { data, error: setError } = await supabase.auth.setSession(parsedSession);
            if (!setError && data.session) {
              setSession(data.session);
              setUser(data.session.user);
              if (window.location.pathname === '/auth') {
                setLocation('/app');
              }
              setIsLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error setting stored session:', err);
            localStorage.removeItem('supabase.auth.token');
          }
        }

        // If no stored session or it failed, get a new session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
          localStorage.removeItem('supabase.auth.token');
          if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
            setLocation('/auth');
          }
          setIsLoading(false);
          return;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
          if (window.location.pathname === '/auth') {
            setLocation('/app');
          }
        } else if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          setLocation('/auth');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          setLocation('/auth');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
    
      if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
        localStorage.removeItem('supabase.auth.token');
        if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
          setLocation('/auth');
        }
        return;
      }
      
      setSession(session);
      setUser(session.user);
      localStorage.setItem('supabase.auth.token', JSON.stringify(session));
      if (window.location.pathname === '/auth') {
        setLocation('/app');
      }
    });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, setLocation]);

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
          redirectTo: `${window.location.origin}/app`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            response_type: 'code',
            scope: 'email profile'
          }
        },
      })
      if (error) throw error
    } catch (error) {
      console.error('Google sign-in error:', error)
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