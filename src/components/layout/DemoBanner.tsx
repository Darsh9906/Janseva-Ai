"use client";

import Link from "next/link";
import { useState } from "react";
import { X, ShieldCheck } from "lucide-react";

const ADMIN_CODE = process.env.NEXT_PUBLIC_ADMIN_CODE || "janseva2026";
const OFFICER_CODE = process.env.NEXT_PUBLIC_OFFICER_CODE || "officer2026";

/** A strip pointing judges to the staff dashboard + access codes.
 *  Always renders on load; dismiss is for the current view only. */
export default function DemoBanner() {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  return (
    <div className="relative z-50 bg-dark text-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-xs sm:text-sm">
        <ShieldCheck size={15} className="shrink-0 text-secondary" />
        <p className="flex-1 leading-snug">
          <span className="font-semibold">Reviewing this demo?</span> Try the
          citizen app, or open the{" "}
          <Link
            href="/admin"
            className="font-semibold underline underline-offset-2 hover:text-secondary"
          >
            Staff Dashboard
          </Link>{" "}
          — Admin{" "}
          <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono">
            {ADMIN_CODE}
          </code>{" "}
          · Officer{" "}
          <code className="rounded bg-white/15 px-1.5 py-0.5 font-mono">
            {OFFICER_CODE}
          </code>
        </p>
        <button
          onClick={() => setHidden(true)}
          className="shrink-0 rounded p-1 hover:bg-white/10"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
