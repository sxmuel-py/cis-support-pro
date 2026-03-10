"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";

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
  const supabase = useMemo(() => createClient(), []);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4 font-sans">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="space-y-4 pt-8 text-center">
          <div className="mx-auto">
            <Logo size={48} className="mb-2" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight">
              CIS <span className="text-primary">PRO</span>
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {processingMagicLink 
                ? "Authenticating your account" 
                : showForgotPassword 
                ? "Reset your password" 
                : "Sign in to the support portal"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-8">
          {processingMagicLink ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Processing magic link...</p>
            </div>
          ) : !showForgotPassword ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@cislagos.org"
                    className="h-11 border-input bg-background px-3 focus-visible:ring-primary transition-all rounded-md"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError(null);
                      }}
                      className="text-xs font-medium text-primary hover:underline transition-all"
                    >
                      Forgot?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-11 border-input bg-background px-3 focus-visible:ring-primary transition-all rounded-md"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-primary text-primary-foreground font-semibold transition-all rounded-md"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center pt-2">
                <p className="text-[11px] text-muted-foreground">
                  Access restricted to @cislagos.org accounts
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              {resetSuccess ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-6 text-center text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-8 w-8" />
                    <p className="font-semibold text-sm">Check your email for a reset link</p>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 rounded-md"
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
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="name@cislagos.org"
                      className="h-11 border-input bg-background rounded-md"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button type="submit" className="w-full h-11 rounded-md font-semibold bg-primary" disabled={loading}>
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full h-11 rounded-md text-muted-foreground transition-colors"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setError(null);
                      setResetEmail("");
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
