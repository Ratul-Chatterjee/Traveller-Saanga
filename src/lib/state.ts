import { useEffect, useState } from "react";
import { auth, onAuthStateChanged, firebaseSignOut, getIdToken } from "./firebase";
import type { Place } from "@/types";

const KEY = "travellersaanga.v4";

// Migration: v3 → v4 clears stale cart/wishlist (old place IDs no longer valid)
function migrate(raw: string): Persisted {
  try {
    const p = JSON.parse(raw);
    const v = p._v || 3;
    if (v < 4) return { ...DEFAULT, _v: 4 };
    return p;
  } catch { return { ...DEFAULT, _v: 4 }; }
}

type Persisted = {
  _v: number;
  cart: string[];
  wishlist: string[];
  dark: boolean;
  budget: number;
  travelers: number;
  startDate: string | null;
  endDate: string | null;
  optimize: boolean;
};

const DEFAULT: Persisted = {
  _v: 4,
  cart: [],
  wishlist: [],
  dark: false,
  budget: 25000,
  travelers: 2,
  startDate: null,
  endDate: null,
  optimize: true,
};

// ── Firebase Auth user (source of truth, NOT persisted) ───────────────────
type AppUser = { name: string; email: string; uid: string; photoURL?: string | null } | null;
let currentUser: AppUser = null;

// ── Persisted local prefs ─────────────────────────────────────────────────
function load(): Persisted {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    return migrate(raw);
  } catch {
    return DEFAULT;
  }
}
function save(p: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

let state: Persisted = load();
const listeners = new Set<() => void>();

function emit() {
  save(state);
  listeners.forEach((l) => l());
  syncToBackend();
}

// ── Backend sync ──────────────────────────────────────────────────────────
async function syncToBackend() {
  if (!currentUser) return;
  const token = await getIdToken();
  if (!token) return;
  const backendUrl = import.meta.env.VITE_API_URL;
  fetch(`${backendUrl}/api/user/state`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      cart: state.cart,
      wishlist: state.wishlist,
      itinerary: {
        budget: state.budget,
        travelers: state.travelers,
        startDate: state.startDate,
        endDate: state.endDate,
        optimize: state.optimize,
      },
    }),
  }).catch((err) => console.error("Failed to sync state to backend:", err));
}

async function loadFromBackend() {
  if (!currentUser) return;
  const token = await getIdToken();
  if (!token) return;
  const backendUrl = import.meta.env.VITE_API_URL;
  try {
    const res = await fetch(`${backendUrl}/api/user/state`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json();
    if (data) {
      state = {
        ...state,
        cart: data.cart || state.cart,
        wishlist: data.wishlist || state.wishlist,
        ...(data.itinerary || {}),
      };
      save(state);
      listeners.forEach((l) => l());
    }
  } catch (err) {
    console.warn("Could not load user state from backend:", err);
  }
}

// ── Listen for Firebase auth changes ─────────────────────────────────────
let authInitialized = false;
onAuthStateChanged(auth, (firebaseUser) => {
  authInitialized = true;
  if (firebaseUser) {
    currentUser = {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Traveller",
      email: firebaseUser.email || "",
      photoURL: firebaseUser.photoURL,
    };
    loadFromBackend();
  } else {
    currentUser = null;
  }
  listeners.forEach((l) => l());
});

// ── Hook ──────────────────────────────────────────────────────────────────
// ── Global detail modal ────────────────────────────────────────────────────
let modalPlace: Place | null = null;

export function useAppState() {
  const [, force] = useState(0);

  useEffect(() => {
    const l = () => force((x) => x + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return {
    // Auth
    user: currentUser,
    authReady: authInitialized,

    async signOut() {
      await firebaseSignOut();
      state = { ...DEFAULT, dark: state.dark };
      save(state);
      listeners.forEach((l) => l());
    },

    // Itinerary / Cart
    cart: new Set(state.cart),
    toggleCart(id: string) {
      const s = new Set(state.cart);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      state = { ...state, cart: [...s] };
      emit();
    },
    clearCart() {
      state = { ...state, cart: [] };
      emit();
    },

    // Wishlist
    wishlist: new Set(state.wishlist),
    toggleWishlist(id: string) {
      const s = new Set(state.wishlist);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      state = { ...state, wishlist: [...s] };
      emit();
    },

    // Theme
    dark: state.dark,
    setDark(v: boolean) {
      state = { ...state, dark: v };
      emit();
    },

    // Trip settings
    budget: state.budget,
    setBudget(n: number) {
      state = { ...state, budget: n };
      emit();
    },
    travelers: state.travelers,
    setTravelers(n: number) {
      state = { ...state, travelers: Math.max(1, n) };
      emit();
    },
    startDate: state.startDate,
    endDate: state.endDate,
    setDates(start: string | null, end: string | null) {
      state = { ...state, startDate: start, endDate: end };
      emit();
    },
    optimize: state.optimize,
    setOptimize(v: boolean) {
      state = { ...state, optimize: v };
      emit();
    },

    // Global detail modal
    detailPlace: modalPlace,
    setDetailPlace(p: Place | null) {
      modalPlace = p;
      listeners.forEach((l) => l());
    },
  };
}

// ── Apply theme class ─────────────────────────────────────────────────────
if (typeof window !== "undefined") {
  const apply = () => {
    document.documentElement.classList.toggle("dark", state.dark);
  };
  apply();
  listeners.add(apply);
}
