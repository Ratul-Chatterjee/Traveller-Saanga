import { useEffect, useState } from "react";
import { Calendar, Tag, ShieldCheck } from "lucide-react";
import type { Holiday } from "@/types";

export default function Festivals() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL;
    fetch(`${backendUrl}/api/odisha/holidays`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load holiday schedule");
        return res.json();
      })
      .then((data) => {
        setHolidays(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 p-4 pb-24 lg:p-8 lg:pb-8">
      <div>
        <h1 className="font-serif text-2xl font-semibold lg:text-3xl">Odisha Holidays & Celebrations</h1>
        <p className="text-xs text-muted-foreground">Plan your itinerary around regional state holidays and festivals</p>
      </div>

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="text-sm text-muted-foreground animate-pulse">Loading live holiday registry...</div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm text-destructive">
          Error loading holidays: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {holidays.map((h, i) => (
            <article key={i} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-amber-500 to-rose-600 p-4 flex flex-col justify-between text-white">
                <span className="self-start inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
                  <Calendar size={11} /> {h.date}
                </span>
                <h3 className="font-serif text-lg font-semibold">{h.name}</h3>
              </div>
              <div className="p-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck size={12} className="text-emerald-500" /> Odisha State Holiday
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  h.type === "Gazetted" ? "bg-red-500/10 text-red-500" :
                  h.type === "Optional" ? "bg-amber-500/10 text-amber-500" :
                  "bg-blue-500/10 text-blue-500"
                }`}>
                  <Tag size={10} /> {h.type}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
