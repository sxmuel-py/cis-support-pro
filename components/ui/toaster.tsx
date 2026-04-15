"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => {
        const isDestructive = toast.variant === "destructive";

        return (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-3xl border px-4 py-4 shadow-2xl backdrop-blur-xl transition-all",
              isDestructive
                ? "border-rose-200/80 bg-rose-50/95 text-rose-950 shadow-rose-200/70"
                : "border-white/70 bg-white/95 text-slate-950 shadow-slate-200/80"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 rounded-2xl p-2",
                  isDestructive ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                )}
              >
                {isDestructive ? <CircleAlert className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
              </div>

              <div className="min-w-0 flex-1">
                {toast.title ? (
                  <p className="text-sm font-semibold leading-5">{toast.title}</p>
                ) : null}
                {toast.description ? (
                  <p className="mt-1 text-sm leading-5 text-slate-600">
                    {toast.description}
                  </p>
                ) : null}
              </div>

              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-black/5 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
