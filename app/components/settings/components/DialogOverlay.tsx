"use client";

import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export default function DialogOverlay({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-5 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
