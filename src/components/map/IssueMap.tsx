"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleMap, useLoadScript, MarkerF, InfoWindowF } from "@react-google-maps/api";
import Link from "next/link";
import { listIssues } from "@/services/issues";
import type { Issue, Severity } from "@/types";
import { Spinner, EmptyState } from "@/components/ui/Feedback";
import { SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { firebaseEnabled } from "@/lib/firebase";
import { MapPin } from "lucide-react";

const containerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 23.0225, lng: 72.5714 }; // Ahmedabad

const severityColor: Record<Severity, string> = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#ef4444",
  Critical: "#b91c1c",
};

// Simple, reliable circle marker (no anchor/Point needed). `path: 0` is
// google.maps.SymbolPath.CIRCLE — used as a literal so it works whenever this
// is evaluated after the Maps script has loaded.
function pin(color: string): google.maps.Symbol {
  return {
    path: 0,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2.5,
    scale: 8,
  };
}

export default function IssueMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded } = useLoadScript({ googleMapsApiKey: apiKey });
  const [issues, setIssues] = useState<Issue[]>([]);
  const [active, setActive] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseEnabled) {
      setLoading(false);
      return;
    }
    listIssues(300)
      .then(setIssues)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const center = useMemo(
    () =>
      issues.length
        ? { lat: issues[0].latitude, lng: issues[0].longitude }
        : defaultCenter,
    [issues]
  );

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={<MapPin />}
          title="Google Maps key missing"
          description="Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to render the map."
        />
      </div>
    );
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={issues.length ? 13 : 11}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      }}
    >
      {issues.map((i) => (
        <MarkerF
          key={i.id}
          position={{ lat: i.latitude, lng: i.longitude }}
          icon={pin(severityColor[i.severity])}
          onClick={() => setActive(i)}
        />
      ))}

      {active && (
        <InfoWindowF
          position={{ lat: active.latitude, lng: active.longitude }}
          onCloseClick={() => setActive(null)}
        >
          <div className="w-56 p-1">
            <div className="flex items-center gap-1.5">
              <StatusBadge status={active.status} />
              <SeverityBadge severity={active.severity} />
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">{active.title}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">
              {active.description}
            </p>
            <Link
              href={`/issues/${active.id}`}
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              View details →
            </Link>
          </div>
        </InfoWindowF>
      )}
    </GoogleMap>
  );
}
