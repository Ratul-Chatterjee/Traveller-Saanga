import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Storage } from "@google-cloud/storage";
import axios from "axios";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { generateHolidays } from "./compute-holidays.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// ── Serve built frontend ──────────────────────────────────────────────────────
const distPath = path.resolve(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path === "/health") return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN || "https://traveller-saanga-367344494806.us-central1.run.app",
].filter(Boolean));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, mobile apps, Cloud Run health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
  })
);

// ── Firebase Admin SDK ───────────────────────────────────────────────────────
let db = null;
let adminAuth = null;

try {
  // On Cloud Run, uses Application Default Credentials (ADC) automatically.
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON path.
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      // Inline JSON (useful for Cloud Run secret env vars)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      initializeApp({ credential: cert(serviceAccount) });
    } else {
      // ADC — works on Cloud Run automatically
      initializeApp();
    }
  }
  db = getFirestore();
  adminAuth = getAuth();
  console.log("✅ Firebase Admin SDK initialized (Firestore + Auth).");
} catch (err) {
  console.warn("⚠️  Firebase Admin SDK init failed. Using local file fallback.", err.message);
}

// ── Auth Middleware ──────────────────────────────────────────────────────────
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing authorization token." });

  if (!adminAuth) {
    return res.status(503).json({ error: "Authentication service unavailable." });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.uid = decoded.uid;
    req.userEmail = decoded.email || "";
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}

// ── GCS Storage Client ───────────────────────────────────────────────────────
let storage;
try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT_ID) {
    storage = new Storage();
  }
} catch (err) {
  console.warn("GCS client init skipped:", err.message);
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. HOLIDAYS SERVICE — Computed Odisha holiday calendar
// ══════════════════════════════════════════════════════════════════════════════

/** Compute Odisha holidays for a given year using astronomical calculations. */
function loadOdishaHolidays(year) {
  try {
    return generateHolidays(year);
  } catch (err) {
    console.warn("Failed to compute Odisha holidays:", err.message);
    return [];
  }
}

app.get("/api/odisha/holidays", (req, res) => {
  try {
    const { type, year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    let holidays = loadOdishaHolidays(targetYear);
    if (type) {
      holidays = holidays.filter((h) => h.type.toLowerCase() === type.toLowerCase());
    }
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ error: "Failed to load holidays: " + err.message });
  }
});

app.get("/api/odisha/check", (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: "date parameter required (YYYY-MM-DD)" });
    const year = parseInt(date.split("-")[0]);
    const holidays = loadOdishaHolidays(year);
    const match = holidays.find((h) => h.date === date);
    res.json(match ? { isHoliday: true, holiday: match } : { isHoliday: false });
  } catch (err) {
    res.status(500).json({ error: "Failed to check holiday: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. TOURIST PLACES SERVICE
// ══════════════════════════════════════════════════════════════════════════════
const PLACES_CACHE_FILE = path.join(__dirname, "data", "places_cache.json");

async function loadCachedPlaces() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (storage && bucketName) {
    try {
      const [content] = await storage.bucket(bucketName).file("places_cache.json").download();
      return JSON.parse(content.toString());
    } catch {}
  }
  if (fs.existsSync(PLACES_CACHE_FILE)) {
    try { return JSON.parse(fs.readFileSync(PLACES_CACHE_FILE, "utf8")); } catch {}
  }
  throw new Error("No places cache found. Run POST /api/places/refresh first to seed the cache from OpenStreetMap.");
}

async function saveCachedPlaces(places) {
  const content = JSON.stringify(places, null, 2);
  try { fs.mkdirSync(path.dirname(PLACES_CACHE_FILE), { recursive: true }); fs.writeFileSync(PLACES_CACHE_FILE, content, "utf8"); } catch {}
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (storage && bucketName) {
    try { await storage.bucket(bucketName).file("places_cache.json").save(content, { contentType: "application/json", resumable: false }); } catch {}
  }
}

app.get("/api/places", async (req, res) => {
  try { res.json(await loadCachedPlaces()); }
  catch (err) { res.status(500).json({ error: "Failed to load places: " + err.message }); }
});

app.post("/api/places/refresh", async (req, res) => {
  try {
    const overpassQuery = `[out:json][timeout:90];area["ISO3166-2"="IN-OR"]->.a;(node["tourism"="attraction"](area.a);node["historic"="monument"](area.a););out body 100;`;
    const response = await axios.get("https://overpass-api.de/api/interpreter", {
      params: { data: overpassQuery },
      headers: { "User-Agent": "TravellerSaanga/1.0" },
    });
    const osmNodes = response.data?.elements || [];
    const cleanedPlaces = osmNodes.filter((n) => n.tags?.name).map((n) => ({
      id: `osm-${n.id}`, name: n.tags.name, lat: n.lat, lng: n.lon,
      entryFee: parseInt(n.tags.fee) || 0, duration: n.tags.tourism === "attraction" ? 2.5 : 1.5,
      type: n.tags.tourism || n.tags.historic || "Attraction", district: n.tags["addr:district"] || "Odisha",
      region: "Odisha Tourism", rating: 4.0,
      image: "https://images.unsplash.com/photo-1609947017136-71d36ec90c43?auto=format&fit=crop&w=600&q=80",
      description: n.tags.description || `Historic ${n.tags.historic || "attraction"} in Odisha.`,
    }));
    await saveCachedPlaces(cleanedPlaces);
    res.json({ message: "Places refreshed", count: cleanedPlaces.length });
  } catch (err) {
    res.status(500).json({ error: "Refresh failed: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. DIRECTIONS — OSRM (Open Source Routing Machine, free, OSM-based)
// ══════════════════════════════════════════════════════════════════════════════
app.post("/api/directions", async (req, res) => {
  const { origin, destination, waypoints } = req.body;
  if (!origin || !destination) return res.status(400).json({ error: "origin and destination are required" });

  // OSRM expects lng,lat order
  const coords = [`${origin.lng},${origin.lat}`];
  if (waypoints?.length) {
    waypoints.forEach((w) => coords.push(`${w.lng},${w.lat}`));
  }
  coords.push(`${destination.lng},${destination.lat}`);

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${coords.join(";")}?overview=full&geometries=geojson&steps=true&alternatives=false`;
    const response = await axios.get(url);
    const route = response.data?.routes?.[0];
    if (!route) return res.status(404).json({ error: "No route found between these locations." });

    const legs = route.legs || [];
    let totalDistance = 0;
    let totalDuration = 0;
    for (const leg of legs) {
      totalDistance += leg.distance || 0;
      totalDuration += leg.duration || 0;
    }

    res.json({
      routes: [{
        legs: legs.map((leg) => ({
          distance: { value: leg.distance, text: `${(leg.distance / 1000).toFixed(1)} km` },
          duration: { value: leg.duration, text: `${Math.round(leg.duration / 60)} mins` },
        })),
        distance: totalDistance,
        duration: totalDuration,
        geometry: route.geometry,
      }],
    });
  } catch (err) {
    res.status(500).json({ error: "Directions proxy failed: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. USER STATE — Firestore backed, Firebase ID token protected
// ══════════════════════════════════════════════════════════════════════════════

// Local file fallback (used when Firestore is unavailable)
let localUserDB = {};
const USER_DB_FILE = path.join(__dirname, "data", "user_database.json");
if (fs.existsSync(USER_DB_FILE)) {
  try { localUserDB = JSON.parse(fs.readFileSync(USER_DB_FILE, "utf8")); } catch {}
}
function saveLocalUserDB() {
  try { fs.mkdirSync(path.dirname(USER_DB_FILE), { recursive: true }); fs.writeFileSync(USER_DB_FILE, JSON.stringify(localUserDB, null, 2)); } catch {}
}

// GET /api/user/state — returns cart, wishlist, itinerary for authenticated user
app.get("/api/user/state", requireAuth, async (req, res) => {
  const uid = req.uid;
  if (db) {
    try {
      const doc = await db.collection("user_states").doc(uid).get();
      if (doc.exists) return res.json(doc.data());
    } catch (err) {
      console.warn("Firestore read failed, using local:", err.message);
    }
  }
  res.json(localUserDB[uid] || { cart: [], wishlist: [], itinerary: null });
});

// POST /api/user/state — upserts cart, wishlist, itinerary for authenticated user
app.post("/api/user/state", requireAuth, async (req, res) => {
  const uid = req.uid;
  const { cart, wishlist, itinerary } = req.body;
  const data = {
    cart: cart || [],
    wishlist: wishlist || [],
    itinerary: itinerary || null,
    email: req.userEmail,
    updatedAt: new Date().toISOString(),
  };
  if (db) {
    try {
      await db.collection("user_states").doc(uid).set(data, { merge: true });
      return res.json({ success: true });
    } catch (err) {
      console.warn("Firestore write failed, using local:", err.message);
    }
  }
  localUserDB[uid] = data;
  saveLocalUserDB();
  res.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    firestore: !!db,
    gcs: !!storage,
  });
});

app.get("/", (req, res) => res.json({ service: "Traveller Saanga Backend", version: "2.0.0" }));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Backend server listening on port ${PORT}`);
});
