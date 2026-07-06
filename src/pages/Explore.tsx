import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { SlidersHorizontal, X } from "lucide-react";
import { REGIONS, TYPES } from "@/data/constants";
import type { Place } from "@/types";
import { PlaceCard } from "@/components/PlaceCard";
import { useAppState } from "@/lib/state";
import { usePlaces } from "@/hooks/usePlaces";

export default function Explore() {
  const s = useAppState();
  const { data: places = [], isLoading, error } = usePlaces();
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("All Regions");
  const [type, setType] = useState("All Types");
  const [maxFee, setMaxFee] = useState(500);
  const [sort, setSort] = useState<"rating" | "duration" | "fee">("rating");
  const [showFilters, setShowFilters] = useState(false);
  const [loc] = useLocation();

  // Open from focus= query param
  useEffect(() => {
    const u = new URL(window.location.href);
    const id = u.searchParams.get("focus");
    if (id) {
      const p = places.find((x) => x.id === id);
      if (p) s.setDetailPlace(p);
    }
  }, [loc, places]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = places.filter((p) => {
      if (region !== "All Regions" && p.region !== region) return false;
      if (type !== "All Types" && p.type !== type && !(type === "Caves" && p.type === "Cave")) return false;
      if (p.entryFee > maxFee) return false;
      if (q && !`${p.name} ${p.district} ${p.region} ${p.type}`.toLowerCase().includes(q)) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating;
      if (sort === "duration") return a.duration - b.duration;
      return a.entryFee - b.entryFee;
    });
    return arr;
  }, [places, search, region, type, maxFee, sort]);

  return (
    <div className="space-y-6 p-4 pb-24 lg:p-8 lg:pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold lg:text-3xl">Explore Odisha</h1>
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Loading destinations..." : `${filtered.length} of ${places.length} destinations`}
          </p>
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border bg-card px-4 py-2 text-sm font-semibold lg:hidden"
        >
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Error loading destinations. Please try again later.
        </div>
      )}

      {/* Search bar */}
      <div className="rounded-2xl border bg-card p-3 shadow-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, district, region, type..."
          className="w-full bg-transparent px-2 py-2 text-sm outline-none"
        />
      </div>

      {/* Filters */}
      <div className={`grid gap-3 rounded-2xl border bg-card p-4 shadow-sm lg:grid-cols-4 ${showFilters ? "" : "hidden lg:grid"}`}>
        <Field label="Region">
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
            {REGIONS.map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </Field>
        <Field label={`Max entry fee: ₹${maxFee}`}>
          <input type="range" min={0} max={500} step={50} value={maxFee} onChange={(e) => setMaxFee(+e.target.value)} className="w-full accent-[hsl(var(--primary))]" />
        </Field>
        <Field label="Sort by">
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none">
            <option value="rating">Top rated</option>
            <option value="duration">Shortest visit</option>
            <option value="fee">Cheapest</option>
          </select>
        </Field>
      </div>

      {/* Active filter pills */}
      {(region !== "All Regions" || type !== "All Types" || maxFee < 500 || search) && (
        <div className="flex flex-wrap gap-2">
          {search && <Pill onClear={() => setSearch("")}>"{search}"</Pill>}
          {region !== "All Regions" && <Pill onClear={() => setRegion("All Regions")}>{region}</Pill>}
          {type !== "All Types" && <Pill onClear={() => setType("All Types")}>{type}</Pill>}
          {maxFee < 500 && <Pill onClear={() => setMaxFee(500)}>≤ ₹{maxFee}</Pill>}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-sm text-muted-foreground">
          No destinations match your filters. Try widening the search.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              inCart={s.cart.has(p.id)}
              inWish={s.wishlist.has(p.id)}
              onToggleCart={() => s.toggleCart(p.id)}
              onToggleWish={() => s.toggleWishlist(p.id)}
              onOpen={() => s.setDetailPlace(p)}
            />
          ))}
        </div>
      )}

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Pill({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs">
      {children}
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground"><X size={12} /></button>
    </span>
  );
}
