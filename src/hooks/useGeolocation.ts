"use client";

import { useCallback, useState } from "react";

export interface GeoState {
  lat: number;
  lng: number;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data?.display_name ?? "";
  } catch {
    return "";
  }
}

function getPosition(opts: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opts);
  });
}

export function useGeolocation() {
  const [coords, setCoords] = useState<GeoState | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      !window.isSecureContext &&
      !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ) {
      setError(
        `Location needs a secure context. Open the app at http://localhost:3000 ` +
          `(not ${window.location.hostname}), or set the location manually below.`
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let pos: GeolocationPosition;
      try {
        // fast, reliable first attempt
        pos = await getPosition({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 60000,
        });
      } catch {

        pos = await getPosition({
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      }
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      reverseGeocode(next.lat, next.lng).then((a) => a && setAddress(a));
    } catch (err) {
      const e = err as GeolocationPositionError;
      if (e.code === e.PERMISSION_DENIED) {
        setError(
          "Location permission was denied. Allow it in your browser's site settings, or set it manually below."
        );
      } else if (e.code === e.POSITION_UNAVAILABLE) {
        setError(
          "Couldn't get a fix (is macOS Location Services on for your browser?). You can set the location manually below."
        );
      } else if (e.code === e.TIMEOUT) {
        setError("Location timed out. Try again, or set it manually below.");
      } else {
        setError("Could not detect your location. Set it manually below.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const setManual = useCallback((lat: number, lng: number) => {
    setError(null);
    setCoords({ lat, lng });
    reverseGeocode(lat, lng).then((a) => a && setAddress(a));
  }, []);

  return { coords, setCoords, setManual, address, setAddress, loading, error, detect };
}
