"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

const IssueMap = dynamic(() => import("@/components/map/IssueMap"), {
  ssr: false,
});

const legend = [
  { color: "#10b981", label: "Low" },
  { color: "#f59e0b", label: "Medium" },
  { color: "#ef4444", label: "High" },
  { color: "#b91c1c", label: "Critical" },
];

export default function MapPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            <MapPin className="text-primary" /> Community Map
          </h1>
          <p className="mt-2 text-ink-soft">
            Live civic issues across your city, colour-coded by severity.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-sm text-ink-soft">
              <span
                className="h-3 w-3 rounded-full"
                style={{ background: l.color }}
              />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 h-[70vh] overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
        <IssueMap />
      </div>
    </div>
  );
}
