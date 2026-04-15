"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, CheckCircle2, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
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

  useEffect(() => {
    const handleMagicLink = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (!accessToken) {
        return;
      }

      setProcessingMagicLink(true);

      try {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || "",
        });

        if (sessionError) {
          console.error("Magic link error:", sessionError);
          setError("Invalid or expired magic link. Please request a new one.");
          setProcessingMagicLink(false);
          window.history.replaceState(null, "", window.location.pathname);
          return;
        }

        if (data.session) {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err) {
        console.error("Magic link processing error:", err);
        setError("Failed to process magic link");
        setProcessingMagicLink(false);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };

    handleMagicLink();
  }, [router, supabase.auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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

    if (!resetEmail.endsWith("@cislagos.org")) {
      setError("Only @cislagos.org email addresses are allowed");
      setLoading(false);
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
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
    <div className="relative min-h-screen overflow-hidden bg-background font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.1),transparent_24%),linear-gradient(135deg,#031022_0%,#08162d_48%,#0a1020_100%)]" />
      <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute bottom-[-4rem] right-[-4rem] h-80 w-80 rounded-full bg-orange-300/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="hidden lg:block">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(160deg,rgba(15,23,42,0.88),rgba(7,16,35,0.92))] p-8 shadow-2xl shadow-black/30 xl:p-10">
              <div className="flex max-w-xl flex-col gap-8">
                <div className="space-y-5">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Support Operations
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Logo size={56} className="rounded-2xl border-white/15 bg-white/95 p-3 shadow-lg shadow-black/20" />
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-300">
                          IT Helpdesk
                        </p>
                        <p className="text-sm text-slate-400">CIS Support Portal</p>
                      </div>
                    </div>

                    <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white xl:text-[3.1rem] xl:leading-[1.04]">
                      Support operations, without the chaos.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-slate-300">
                      A cleaner place for the CIS team to triage faster, coordinate technicians clearly, and keep ticket follow-through sharp from first login.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <FeatureCard
                    icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
                    title="Secure staff access"
                    description="Restricted to verified @cislagos.org accounts only."
                  />
                  <FeatureCard
                    icon={<Mail className="h-5 w-5 text-sky-400" />}
                    title="Email-native support"
                    description="Tickets flow in from the inbox without losing reply context."
                  />
                  <FeatureCard
                    icon={<LockKeyhole className="h-5 w-5 text-orange-400" />}
                    title="Operator-ready UX"
                    description="Built to feel more like an operations console than a basic admin page."
                  />
                </div>
              </div>
            </div>
          </div>

          <Card className="w-full max-w-[34rem] justify-self-center overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))] shadow-2xl shadow-black/20 backdrop-blur-xl">
            <CardHeader className="space-y-6 px-6 pb-5 pt-8 sm:px-8">
              <div className="flex items-center gap-4">
                <Logo size={48} className="rounded-2xl border-slate-200 bg-white p-2.5 shadow-sm" />
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                    CIS Support Portal
                  </div>
                  <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950">
                    {processingMagicLink ? "Authenticating" : showForgotPassword ? "Reset access" : "Welcome back"}
                  </CardTitle>
                  <CardDescription className="max-w-md text-sm leading-6 text-slate-600">
                    {processingMagicLink
                      ? "We’re validating your secure sign-in link."
                      : showForgotPassword
                        ? "Enter your work email and we’ll send a secure password reset link."
                        : "Sign in to continue managing the live support queue, technician workload, and ticket follow-through."}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 px-6 pb-8 pt-4 sm:px-8">
              {!showForgotPassword && !processingMagicLink ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <MiniPill label="Queue" value="Live" />
                  <MiniPill label="Access" value="Staff only" />
                  <MiniPill label="Mode" value="Secure" />
                </div>
              ) : null}

              {processingMagicLink ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-10">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="text-sm text-slate-600">Processing magic link...</p>
                </div>
              ) : !showForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  {error ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 text-sm text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="font-medium leading-6">{error}</p>
                    </div>
                  ) : null}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@cislagos.org"
                        className="auth-input h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotPassword(true);
                            setError(null);
                          }}
                          className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 transition hover:text-slate-900"
                        >
                          Forgot password
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="auth-input h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-slate-900 font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
                    disabled={loading}
                  >
                    {loading ? "Signing in..." : "Enter Support Portal"}
                  </Button>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-xs leading-6 text-slate-500">
                      Access is restricted to verified CIS staff using `@cislagos.org` email accounts.
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-6">
                  {error ? (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200/80 bg-rose-50/90 p-4 text-sm text-rose-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <p className="font-medium leading-6">{error}</p>
                    </div>
                  ) : null}

                  {resetSuccess ? (
                    <div className="space-y-4">
                      <div className="flex flex-col items-center gap-3 rounded-[1.5rem] border border-emerald-200/80 bg-emerald-50/90 p-6 text-center text-emerald-700">
                        <CheckCircle2 className="h-8 w-8" />
                        <p className="text-sm font-semibold">Check your email for a reset link</p>
                        <p className="text-sm leading-6 text-emerald-700/80">
                          We sent secure password reset instructions to your work account.
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 w-full rounded-xl border-slate-200 bg-white"
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
                        <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">
                          Email Address
                        </label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="name@cislagos.org"
                          className="auth-input h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 placeholder:text-slate-400 shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/40"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          disabled={loading}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="h-12 w-full rounded-xl bg-slate-900 font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
                        disabled={loading}
                      >
                        {loading ? "Sending..." : "Send Reset Link"}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        className="h-12 w-full rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
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
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-sm shadow-black/10 backdrop-blur-sm">
      {icon}
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
