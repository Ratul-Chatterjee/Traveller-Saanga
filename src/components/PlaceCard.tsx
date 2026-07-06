import { Heart, Clock, Ticket, Star, MapPin, Plus, Check } from "lucide-react";
import type { Place } from "@/types";
import { TYPE_GRADIENT } from "@/data/constants";

type Props = {
  place: Place;
  inCart: boolean;
  inWish: boolean;
  onToggleCart: () => void;
  onToggleWish: () => void;
  onOpen: () => void;
};

export function PlaceCard({ place, inCart, inWish, onToggleCart, onToggleWish, onOpen }: Props) {
  const grad = TYPE_GRADIENT[place.type] || "from-orange-500 to-amber-600";
  return (
    <div
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10"
    >
      <button onClick={onOpen} className="relative block h-44 w-full overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=70";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full bg-gradient-to-r ${grad} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md`}
        >
          {place.type}
        </span>
        <div className="absolute bottom-3 left-3 right-12 text-white">
          <div className="flex items-center gap-1 text-xs opacity-90">
            <MapPin size={12} /> {place.district}
          </div>
        </div>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleWish(); }}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-rose-500 shadow-md transition hover:scale-110"
        aria-label="wishlist"
      >
        <Heart size={15} fill={inWish ? "currentColor" : "none"} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-serif text-base font-semibold leading-tight">{place.name}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-amber-500">
          <Star size={12} fill="currentColor" />
          <span className="font-semibold text-foreground">{place.rating}</span>
          <span className="text-muted-foreground">· {place.famous || "—"}</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock size={11} /> {place.duration}h</span>
          <span className="inline-flex items-center gap-1">
            <Ticket size={11} /> {place.entryFee === 0 ? "Free" : `₹${place.entryFee}`}
          </span>
          <span>{place.bestTime || "—"}</span>
        </div>

        <button
          onClick={onToggleCart}
          className={`mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${
            inCart
              ? "bg-gradient-to-r from-primary to-amber-500 text-white shadow-md shadow-primary/30"
              : "border border-primary/40 text-primary hover:bg-primary/10"
          }`}
        >
          {inCart ? <><Check size={14} /> In Itinerary</> : <><Plus size={14} /> Add to Plan</>}
        </button>
      </div>
    </div>
  );
}
