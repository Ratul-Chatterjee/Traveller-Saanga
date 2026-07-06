import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Trash2, Clock, Wallet, MapPin, Sparkles, Star, Route, AlertTriangle,
  Calendar, Users, IndianRupee, Navigation,
} from "lucide-react";
import { useAppState } from "@/lib/state";
import { usePlaces } from "@/hooks/usePlaces";
import { optimizeRoute, totalRouteDistance, travelHours, haversine } from "@/utils/distance";
import { calcExpense, eventMatchesTrip } from "@/utils/expense";
import type { Holiday } from "@/types";

export default function Itinerary() {
  const s = useAppState();
  const { data: places = [], isLoading: placesLoading } = usePlaces();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [drivingDistance, setDrivingDistance] = useState<number | null>(null);
  const [drivingDuration, setDrivingDuration] = useState<number | null>(null);

  // Fetch live holidays for trip matching
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL;
    fetch(`${backendUrl}/api/odisha/holidays`)
      .then((res) => res.ok && res.json())
      .then((data) => data && setHolidays(data))
      .catch((err) => console.warn("Failed to load live holidays for itinerary:", err.message));
  }, []);

  const items = useMemo(() => places.filter((p) => s.cart.has(p.id)), [places, s.cart]);
  const optimized = useMemo(() => optimizeRoute(items), [items]);
  const ordered = s.optimize ? optimized : items;

  // Fetch real road-network distance & time via OSRM proxy
  useEffect(() => {
    if (ordered.length < 2) {
      setDrivingDistance(null);
      setDrivingDuration(null);
      return;
    }

    setDrivingDistance(null);
    setDrivingDuration(null);

    const abort = new AbortController();
    const backendUrl = import.meta.env.VITE_API_URL;
    fetch(`${backendUrl}/api/directions`, {
      signal: abort.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { lat: ordered[0].lat, lng: ordered[0].lng },
        destination: { lat: ordered[ordered.length - 1].lat, lng: ordered[ordered.length - 1].lng },
        waypoints: ordered.slice(1, -1).map(w => ({ lat: w.lat, lng: w.lng }))
      })
    })
      .then(res => res.ok && res.json())
      .then(data => {
        if (abort.signal.aborted) return;
        if (data && data.routes && data.routes[0]) {
          const legs = data.routes[0].legs || [];
          let totalMeters = 0;
          let totalSeconds = 0;
          legs.forEach((leg: any) => {
            totalMeters += leg.distance?.value || 0;
            totalSeconds += leg.duration?.value || 0;
          });
          if (totalMeters > 0) {
            setDrivingDistance(totalMeters / 1000); // meters to km
            setDrivingDuration(totalSeconds / 3600); // seconds to hours
          }
        }
      })
      .catch(err => {
        if (err.name !== "AbortError") console.warn("Directions API routing fallback to haversine:", err.message);
      });
    return () => abort.abort();
  }, [ordered]);

  const fallbackDistance = useMemo(() => totalRouteDistance(ordered), [ordered]);
  const distance = drivingDistance !== null ? drivingDistance : fallbackDistance;
  
  const originalDistance = useMemo(() => totalRouteDistance(items), [items]);
  const optimizedDistance = useMemo(() => totalRouteDistance(optimized), [optimized]);
  const savedKm = Math.max(0, originalDistance - optimizedDistance);
  const savedPct = originalDistance > 0 ? (savedKm / originalDistance) * 100 : 0;
  
  const driveHours = drivingDuration !== null ? drivingDuration : travelHours(distance);
  const visitHours = ordered.reduce((a, b) => a + b.duration, 0);

  // Compute days based on selected trip dates, else estimate by visit hours
  const tripNights = useMemo(() => {
    if (s.startDate && s.endDate) {
      const ms = new Date(s.endDate).getTime() - new Date(s.startDate).getTime();
      return Math.max(1, Math.round(ms / 86400000));
    }
    return Math.max(1, Math.ceil((visitHours + driveHours) / 8));
  }, [s.startDate, s.endDate, visitHours, driveHours]);

  const expense = useMemo(
    () => calcExpense({
      places: ordered, nights: tripNights,
      travelers: s.travelers, budget: s.budget,
    }),
    [ordered, tripNights, s.travelers, s.budget]
  );

  // Group route into ~7h days for display
  const days = useMemo(() => {
    const out: typeof ordered[] = [];
    let cur: typeof ordered = [];
    let h = 0;
    ordered.forEach((p, i) => {
      const drive = i === 0 ? 0 : travelHours(haversine(ordered[i - 1], p));
      if (h + p.duration + drive > 8 && cur.length) { out.push(cur); cur = []; h = 0; }
      cur.push(p); h += p.duration + drive;
    });
    if (cur.length) out.push(cur);
    return out;
  }, [ordered]);

  // Suggested holidays/events for trip dates
  const suggestedEvents = useMemo(() => {
    if (!s.startDate || !s.endDate || holidays.length === 0) return [];
    const start = new Date(s.startDate);
    const end = new Date(s.endDate);
    return holidays.filter((e) => eventMatchesTrip(e.date, start, end));
  }, [s.startDate, s.endDate, holidays]);

  if (placesLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">Loading trip data…</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20">
            <Sparkles className="text-primary" />
          </div>
          <h2 className="font-serif text-2xl font-semibold">Your trip is empty</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Add destinations from Explore — we'll auto-optimize the route, estimate costs, and surface festivals overlapping your dates.
          </p>
          <Link href="/explore" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30">
            Discover destinations
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-24 lg:p-8 lg:pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold lg:text-3xl">Smart Trip Planner</h1>
          <p className="text-xs text-muted-foreground">
            {items.length} stops · {days.length} day{days.length > 1 ? "s" : ""} · {distance.toFixed(0)} km route
          </p>
        </div>
        <div className="flex items-center gap-2">
          {s.optimize && savedKm >= 1 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
              −{savedKm.toFixed(0)} km saved ({savedPct.toFixed(0)}%)
            </span>
          )}
          <button
            onClick={() => s.setOptimize(!s.optimize)}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              s.optimize ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"
            }`}
          >
            <Route size={13} /> {s.optimize ? "Route optimized" : "Optimize route"}
          </button>
          <button
            onClick={s.clearCart}
            className="inline-flex items-center gap-1.5 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Trip-summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={MapPin} label="Stops" value={items.length} />
        <Stat icon={Navigation} label="Distance" value={`${distance.toFixed(0)} km`} />
        <Stat icon={Clock} label="Total time" value={`${(visitHours + driveHours).toFixed(1)}h`} sub={`${visitHours}h visit · ${driveHours.toFixed(1)}h drive`} />
        <Stat icon={Wallet} label="Total cost" value={`₹${expense.total.toLocaleString("en-IN")}`} accent={expense.exceeded} />
        <Stat icon={IndianRupee} label="Remaining" value={`₹${expense.remaining.toLocaleString("en-IN")}`} accent={expense.exceeded} />
      </div>

      {expense.exceeded && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 shrink-0 text-destructive" size={18} />
          <div className="text-sm">
            <div className="font-semibold text-destructive">Budget exceeded by ₹{Math.abs(expense.remaining).toLocaleString("en-IN")}</div>
            <div className="text-xs text-muted-foreground">Try fewer stops or raise your budget below.</div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT: route days */}
        <div className="space-y-6">
          {days.map((day, idx) => {
            const dayHours = day.reduce((a, b) => a + b.duration, 0);
            const dayCost = day.reduce((a, b) => a + b.entryFee, 0) * Math.max(1, s.travelers);
            const dayDist = totalRouteDistance(day);
            return (
              <section key={idx} className="rounded-3xl border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-500 text-sm font-bold text-white">
                      D{idx + 1}
                    </div>
                    <div>
                      <div className="font-serif text-lg font-semibold">Day {idx + 1}</div>
                      <div className="text-xs text-muted-foreground">{day[0].region} · {dayDist.toFixed(0)} km</div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-1"><Clock size={11} /> {dayHours}h visit</div>
                    <div>₹{dayCost.toLocaleString("en-IN")} entry</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {day.map((p, i) => {
                    const leg = i === 0 ? 0 : haversine(day[i - 1], p);
                    return (
                      <div key={p.id}>
                        {leg > 0 && (
                          <div className="flex items-center gap-2 pl-10 text-[10px] text-muted-foreground">
                            <span className="h-3 w-px bg-border" />
                            <Navigation size={10} /> {leg.toFixed(0)} km · ~{travelHours(leg).toFixed(1)}h drive
                          </div>
                        )}
                        <div className="flex items-center gap-3 rounded-2xl border bg-background p-3">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/15 to-amber-500/10 text-[11px] font-bold text-primary">
                            {i + 1}
                          </div>
                          <img src={p.image} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=70"; }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold">{p.name}</div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {p.district}</span>
                              <span className="inline-flex items-center gap-0.5 text-amber-500"><Star size={10} fill="currentColor" /> {p.rating}</span>
                              <span className="inline-flex items-center gap-0.5"><Clock size={10} /> {p.duration}h</span>
                              <span>{p.entryFee === 0 ? "Free" : `₹${p.entryFee}`}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => s.toggleCart(p.id)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* RIGHT: trip controls */}
        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {/* Trip dates + travelers */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="mb-3 inline-flex items-center gap-2 font-serif text-lg font-semibold">
              <Calendar size={16} className="text-primary" /> Trip details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Mini label="Start">
                <input type="date" value={s.startDate ?? ""} onChange={(e) => s.setDates(e.target.value || null, s.endDate)} className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs outline-none" />
              </Mini>
              <Mini label="End">
                <input type="date" value={s.endDate ?? ""} onChange={(e) => s.setDates(s.startDate, e.target.value || null)} className="w-full rounded-lg border bg-background px-2 py-1.5 text-xs outline-none" />
              </Mini>
              <Mini label="Travelers">
                <div className="flex items-center gap-2">
                  <button onClick={() => s.setTravelers(s.travelers - 1)} className="grid h-7 w-7 place-items-center rounded-lg border hover:bg-muted">−</button>
                  <span className="flex-1 text-center text-sm font-bold inline-flex items-center justify-center gap-1"><Users size={12} /> {s.travelers}</span>
                  <button onClick={() => s.setTravelers(s.travelers + 1)} className="grid h-7 w-7 place-items-center rounded-lg border hover:bg-muted">+</button>
                </div>
              </Mini>
              <Mini label="Nights">
                <div className="flex h-7 items-center justify-center rounded-lg bg-muted text-sm font-bold">{tripNights}</div>
              </Mini>
            </div>
          </section>

          {/* Budget */}
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <h3 className="mb-3 inline-flex items-center gap-2 font-serif text-lg font-semibold">
              <Wallet size={16} className="text-primary" /> Budget & expenses
            </h3>
            <div className="mb-3">
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-semibold">Total budget</span>
                <span className="font-bold">₹{s.budget.toLocaleString("en-IN")}</span>
              </div>
              <input type="range" min={5000} max={150000} step={1000} value={s.budget} onChange={(e) => s.setBudget(+e.target.value)} className="w-full accent-[hsl(var(--primary))]" />
            </div>
            <div className="space-y-1.5 text-xs">
              <Row label="Travel (≈₹12/km)" value={`₹${expense.travel.toLocaleString("en-IN")}`} />
              <Row label={`Food (₹600/day × ${s.travelers})`} value={`₹${expense.food.toLocaleString("en-IN")}`} />
              <Row label={`Entry fees × ${s.travelers}`} value={`₹${expense.entry.toLocaleString("en-IN")}`} />
              <div className="my-2 h-px bg-border" />
              <Row label="Total" value={`₹${expense.total.toLocaleString("en-IN")}`} bold />
              <Row
                label={expense.exceeded ? "Over budget" : "Remaining"}
                value={`₹${Math.abs(expense.remaining).toLocaleString("en-IN")}`}
                bold
                accent={expense.exceeded ? "red" : "green"}
              />
            </div>
            {/* Budget bar */}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full transition-all ${expense.exceeded ? "bg-destructive" : "bg-gradient-to-r from-emerald-500 to-primary"}`}
                style={{ width: `${Math.min(100, (expense.total / Math.max(1, s.budget)) * 100)}%` }}
              />
            </div>
          </section>

          {/* Suggested events */}
          {s.startDate && s.endDate && (
            <section className="rounded-2xl border bg-card p-5 shadow-sm">
              <h3 className="mb-3 inline-flex items-center gap-2 font-serif text-lg font-semibold">
                <Sparkles size={16} className="text-primary" /> Festivals during your trip
              </h3>
              {suggestedEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No major festivals on these dates. Try planning around Rath Yatra (Jul) or the Konark Dance Festival (Dec).</p>
              ) : (
                <div className="space-y-2">
                  {suggestedEvents.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border bg-background p-2">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-[10px] font-bold text-white">
                        {e.date.split("-")[2]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.name}</div>
                        <div className="text-[11px] text-muted-foreground">{e.date} · {e.type} holiday</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${accent ? "border-destructive/40" : ""}`}>
      <Icon size={16} className={accent ? "text-destructive" : "text-primary"} />
      <div className={`mt-2 text-lg font-bold ${accent ? "text-destructive" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function Mini({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}

function Row({ label, value, bold, muted, accent }: { label: string; value: string; bold?: boolean; muted?: boolean; accent?: "red" | "green" }) {
  const color = accent === "red" ? "text-destructive" : accent === "green" ? "text-emerald-600" : "";
  return (
    <div className={`flex items-center justify-between ${muted ? "text-muted-foreground" : ""}`}>
      <span>{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${color}`}>{value}</span>
    </div>
  );
}
