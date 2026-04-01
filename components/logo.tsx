"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className, size = 40 }: LogoProps) {
  return (
    <div className={cn("relative inline-flex items-center justify-center rounded-lg border bg-card p-2 shadow-sm", className)}>
      <Image
        src="/logo.png"
        alt="IT Helpdesk Logo"
        width={size}
        height={size}
        className="object-contain"
        priority
      />
    </div>
  );
}
