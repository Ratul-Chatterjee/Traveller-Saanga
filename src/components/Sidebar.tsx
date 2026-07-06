import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Compass,
  Map as MapIcon,
  CalendarDays,
  ListChecks,
  Heart,
  Sun,
  Moon,
} from "lucide-react";
import { useAppState } from "@/lib/state";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/festivals", label: "Festivals", icon: CalendarDays },
  { to: "/itinerary", label: "Planner", icon: ListChecks },
  { to: "/wishlist", label: "Wishlist", icon: Heart },
];

export function Sidebar() {
  const [loc] = useLocation();
  const s = useAppState();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-card/50 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-20 items-center gap-2 px-6">
        <img src="/Traveller%20Sanga%20Logo.png" alt="Traveller Saanga" className="h-9 w-auto" />
        <div>
          <div className="font-serif text-lg font-semibold leading-tight">OdishaTrail</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Soul of Odisha</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((n) => {
          const active = loc === n.to;
          const Icon = n.icon;
          const badge =
            n.to === "/itinerary" ? s.cart.size :
            n.to === "/wishlist" ? s.wishlist.size : 0;
          return (
            <Link
              key={n.to}
              href={n.to}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-primary/15 to-amber-500/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />}
              <Icon size={17} />
              <span className="flex-1">{n.label}</span>
              {badge > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3">
        <button
          onClick={() => s.setDark(!s.dark)}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          {s.dark ? <Sun size={16} /> : <Moon size={16} />}
          {s.dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const [loc] = useLocation();
  const s = useAppState();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 backdrop-blur lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {[NAV[0], NAV[1], NAV[2], NAV[4], NAV[5]].map((n) => {
          const active = loc === n.to;
          const Icon = n.icon;
          const badge = n.to === "/itinerary" ? s.cart.size : 0;
          return (
            <Link
              key={n.to}
              href={n.to}
              className={`relative flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon size={18} />
              {n.label}
              {badge > 0 && (
                <span className="absolute right-1 top-0 grid h-4 w-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
