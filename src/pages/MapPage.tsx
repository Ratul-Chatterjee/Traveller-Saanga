import { useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/MapView";
import { REGIONS, TYPES } from "@/data/constants";
import type { Place } from "@/types";
import { useAppState } from "@/lib/state";
import { usePlaces } from "@/hooks/usePlaces";
import { Star, MapPin } from "lucide-react";

export default function MapPage() {
  const s = useAppState();
  const { data: places = [], isLoading, error } = usePlaces();
  const [region, setRegion] = useState("All Regions");
  const [type, setType] = useState("All Types");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);

  const filtered = useMemo(
    () =>
      places.filter(
        (p) =>
          (region === "All Regions" || p.region === region) &&
          (type === "All Types" ||
            p.type === type ||
            (type === "Caves" && p.type === "Cave"))
      ),
    [places, region, type]
  );

  // Fetch road-network route from OSRM for actual road path
  useEffect(() => {
    if (filtered.length < 2) {
      setRouteGeometry(null);
      return;
    }
    const coords = filtered.map((p) => [p.lng, p.lat].join(",")).join(";");
    const backendUrl = import.meta.env.VITE_API_URL;
    fetch(`${backendUrl}/api/directions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { lat: filtered[0].lat, lng: filtered[0].lng },
        destination: { lat: filtered[filtered.length - 1].lat, lng: filtered[filtered.length - 1].lng },
        waypoints: filtered.slice(1, -1).map((w) => ({ lat: w.lat, lng: w.lng })),
      }),
    })
      .then((res) => res.ok && res.json())
      .then((data) => {
        if (data?.routes?.[0]?.geometry) {
          const geom = data.routes[0].geometry;
          if (geom.type === "LineString") {
            const coords: [number, number][] = geom.coordinates.map(
              (c: number[]) => [c[1], c[0]] as [number, number]
            );
            setRouteGeometry(coords);
          }
        }
      })
      .catch(() => {
        // fallback to straight-line polyline in MapView
      });
  }, [filtered]);

  return (
    <div className="space-y-4 p-4 pb-24 lg:p-8 lg:pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold lg:text-3xl">Live Map</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Loading destinations…"
              : `${filtered.length} destinations · actual road route shown in gold`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border bg-card px-3 py-2 text-sm outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border bg-card px-3 py-2 text-sm outline-none"
          >
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Error loading map destinations. Please try again later.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <MapView
          places={filtered}
          cart={s.cart}
          selectedId={selectedId}
          onSelect={(p) => {
            setSelectedId(p.id);
            s.setDetailPlace(p);
          }}
          height={620}
          routeGeometry={routeGeometry ?? undefined}
        />
        <aside className="hidden max-h-[620px] overflow-y-auto rounded-2xl border bg-card p-3 lg:block">
          <div className="mb-2 px-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Top picks
          </div>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground animate-pulse">
              Loading…
            </div>
          ) : (
            <div className="space-y-2">
              {filtered
                .filter((p) => p.rating >= 4.6)
                .slice(0, 12)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${
                      selectedId === p.id ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={9} /> {p.district}
                        </span>
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star size={9} fill="currentColor" /> {p.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </aside>
      </div>

    </div>
  );
}
