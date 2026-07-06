import { useRef, useEffect, useState } from "react";
import type { Place } from "@/types";

interface Props {
  places: Place[];
  cart: Set<string>;
  selectedId: string | null;
  onSelect: (p: Place) => void;
  height?: number;
  routeGeometry?: [number, number][];
}

declare global {
  interface Window {
    initOdishaMap: (() => void) | undefined;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

let loadingPromise: Promise<void> | null = null;
let loadAttempted = false;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadAttempted = true;

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    if (existing) {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        reject(new Error("Google Maps script did not load in time"));
      }, 30000);
      return;
    }

    window.initOdishaMap = () => {
      resolve();
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initOdishaMap&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);

    setTimeout(() => {
      reject(new Error("Google Maps script load timed out"));
    }, 30000);
  });

  return loadingPromise;
}

export function MapView({
  places, cart, selectedId, onSelect, height = 520, routeGeometry,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!API_KEY) {
      setLoadError("Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file.");
      return;
    }

    loadGoogleMaps()
      .then(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = new window.google.maps.Map(containerRef.current, {
          center: { lat: 20.9517, lng: 85.0985 },
          zoom: 7,
          mapTypeId: "roadmap",
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        mapRef.current = map;
        setLoadError(null);
      })
      .catch((err: Error) => {
        const msg = err.message.includes("API key")
          ? "Google Maps API key error. Check that the key is valid, Maps JavaScript API is enabled, and referrer restrictions include this site."
          : `Google Maps failed to load: ${err.message}`;
        setLoadError(msg);
      });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (places.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    const infoWindow = new window.google.maps.InfoWindow();

    places.forEach((place) => {
      const pos = new window.google.maps.LatLng(place.lat, place.lng);
      bounds.extend(pos);

      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        title: place.name,
      });

      marker.addListener("click", () => {
        onSelect(place);
        infoWindow.setContent(
          `<div style="font-family:Inter,sans-serif;padding:4px 0;max-width:200px;">
            <strong style="font-size:14px;">${place.name}</strong>
            ${place.rating ? `<br><span style="color:#eab308;">\u2605 ${place.rating}</span>` : ""}
            ${place.district ? `<br><span style="font-size:12px;color:#666;">${place.district}</span>` : ""}
          </div>`
        );
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    map.fitBounds(bounds);

    if (routeGeometry && routeGeometry.length > 1) {
      const path = routeGeometry.map(([lat, lng]) => ({ lat, lng }));
      polylineRef.current = new window.google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#F59E0B",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map,
      });
    }
  }, [places, cart, onSelect, routeGeometry]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const place = places.find((p) => p.id === selectedId);
    if (place) {
      map.setCenter({ lat: place.lat, lng: place.lng });
      map.setZoom(11);
    }
  }, [selectedId, places]);

  if (loadError) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl border bg-muted p-8 text-center shadow-inner"
        style={{ height: `${height}px`, width: "100%" }}
      >
        <div className="max-w-md space-y-2">
          <p className="text-sm font-medium text-destructive">Map unavailable</p>
          <p className="text-xs text-muted-foreground">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border shadow-inner"
      style={{ height: `${height}px`, width: "100%" }}
    />
  );
}
