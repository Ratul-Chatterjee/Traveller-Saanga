import type { Place } from "@/types";
import { totalRouteDistance } from "./distance";

export const FOOD_PER_DAY = 600;          // ₹/person
export const FUEL_COST_PER_KM = 12;       // ₹/km — taxi/cab average

export type ExpenseInput = {
  places: Place[];
  nights: number;
  travelers: number;
  budget: number;
};

export type ExpenseBreakdown = {
  travel: number;
  food: number;
  entry: number;
  total: number;
  remaining: number;
  exceeded: boolean;
  distanceKm: number;
};

export function calcExpense({ places, nights, travelers, budget }: ExpenseInput): ExpenseBreakdown {
  const distanceKm = totalRouteDistance(places);
  const travel = Math.round(distanceKm * FUEL_COST_PER_KM);
  const food = FOOD_PER_DAY * Math.max(1, nights) * Math.max(1, travelers);
  const entry = places.reduce((s, p) => s + p.entryFee, 0) * Math.max(1, travelers);
  const total = travel + food + entry;
  return {
    travel,
    food,
    entry,
    total,
    remaining: budget - total,
    exceeded: total > budget && budget > 0,
    distanceKm,
  };
}

/**
 * Extract month number (0-11) from a date string.
 * Handles both "YYYY-MM-DD" (from API) and "Mon DD-DD" (static data) formats.
 */
function eventMonth(date: string): number | null {
  const m = date.match(/^(\d{4})-(\d{2})-\d{2}$/);
  if (m) return parseInt(m[2], 10) - 1;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  for (let i = 0; i < MONTHS.length; i++) {
    if (date.toLowerCase().includes(MONTHS[i].toLowerCase())) return i;
  }
  return null;
}

/** Returns true if the event overlaps the [start, end] trip window (month-level matching). */
export function eventMatchesTrip(eventDate: string, start: Date, end: Date): boolean {
  const em = eventMonth(eventDate);
  if (em === null) return false;
  const s = start.getMonth();
  const e = end.getMonth();
  const range: number[] = [];
  if (s <= e) for (let i = s; i <= e; i++) range.push(i);
  else { for (let i = s; i < 12; i++) range.push(i); for (let i = 0; i <= e; i++) range.push(i); }
  return range.includes(em);
}
