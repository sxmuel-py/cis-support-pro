"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Headset, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [processingMagicLink, setProcessingMagicLink] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Handle magic link authentication
  useEffect(() => {
    const handleMagicLink = async () => {
      // Check if there's a hash in the URL (magic link token)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken) {
        setProcessingMagicLink(true);
        
        try {
          // Set the session with the tokens from the magic link
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Magic link error:', sessionError);
            setError('Invalid or expired magic link. Please request a new one.');
            setProcessingMagicLink(false);
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            return;
          }

          if (data.session) {
            // Successfully authenticated, redirect to dashboard
            router.push('/dashboard');
            router.refresh();
          }
        } catch (err) {
          console.error('Magic link processing error:', err);
          setError('Failed to process magic link');
          setProcessingMagicLink(false);
          // Clear the hash from URL
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    };

    handleMagicLink();
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate email domain
    if (!email.endsWith("@cislagos.org")) {
      setError("Only @cislagos.org email addresses are allowed");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResetSuccess(false);

    // Validate email domain
    if (!resetEmail.endsWith("@cislagos.org")) {
      setError("Only @cislagos.org email addresses are allowed");
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setResetSuccess(true);
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <Headset className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">CIS Support Pro</CardTitle>
            <CardDescription>
              {processingMagicLink 
                ? "Signing you in..." 
                : showForgotPassword 
                ? "Reset Your Password" 
                : "IT Help Desk Command Center"}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {processingMagicLink ? (
            // Magic Link Processing
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Processing magic link...</p>
            </div>
          ) : !showForgotPassword ? (
            // Login Form
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@cislagos.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setError(null);
                  }}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                IT Staff Only • @cislagos.org emails
              </p>
            </form>
          ) : (
            // Forgot Password Form
            <form onSubmit={handleForgotPassword} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {resetSuccess && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <div>
                    <p className="font-medium">Password reset email sent!</p>
                    <p className="text-xs mt-1">Check your inbox for the reset link.</p>
                  </div>
                </div>
              )}

              {!resetSuccess && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="your.name@cislagos.org"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your @cislagos.org email to receive a password reset link.
                    </p>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSuccess(false);
                  setError(null);
                  setResetEmail("");
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Login
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                IT Staff Only • @cislagos.org emails
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
