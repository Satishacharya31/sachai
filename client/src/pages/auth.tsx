import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SiGoogle } from "react-icons/si";
import { Loader2 } from "lucide-react";

// Auth schema using zod directly since we're using Supabase auth
const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const { user, isLoading, signIn, signUp, signInWithGoogle } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  });

  useEffect(() => {
    if (user) {
      setLocation("/app");
    }
  }, [user, setLocation]);

  const onSubmit = async (data: AuthFormData) => {
    setAuthLoading(true);
    try {
      if (isLogin) {
        await signIn(data.email, data.password);
      } else {
        await signUp(data.email, data.password);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setAuthLoading(false);
    }
  };

  // If system is checking authentication status, show loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If already authenticated, don't render the auth form
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account to continue"
                : "Fill in the form below to create your account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={authLoading}
              >
                {authLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={authLoading}
                onClick={handleGoogleSignIn}
              >
                {authLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SiGoogle className="mr-2 h-4 w-4" />
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="link"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            AI-Powered Content Generation
          </h1>
          <p className="text-lg mb-8">
            Create SEO-optimized content for your blog, social media, and more using advanced AI models.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/10 rounded-lg">
              <h3 className="font-semibold mb-2">Multiple AI Models</h3>
              <p className="text-sm">Choose from various AI models to generate the perfect content</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <h3 className="font-semibold mb-2">SEO Optimized</h3>
              <p className="text-sm">Generate content that ranks well in search engines</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}