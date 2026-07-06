/**
 * Automatic Odisha holiday computation engine.
 * Computes festival dates dynamically using astronomical calculations
 * (sun/moon positions via astronomia) + fixed-date rules.
 * Uses sidereal (Nirayana) zodiac for Indian festivals with Lahiri ayanamsha.
 */

import * as astronomia from "astronomia";
import Holidays from "date-holidays";

const toDeg = (r) => (r * 180) / Math.PI;
const normalize = (d) => ((d % 360) + 360) % 360;

/** Julian centuries since J2000 for a Date object. */
function julianCenturies(date) {
  const jd = astronomia.julian.DateToJD(date);
  return astronomia.base.J2000Century(jd);
}

/**
 * Compute the Lahiri ayanamsha (precessional offset between tropical and sidereal zodiac)
 * for a given year. Approximate formula based on precession constant.
 */
function ayanamsha(year) {
  return normalize(23.856 + 0.01397 * (year - 2000));
}

/**
 * Compute sidereal (Nirayana) ecliptic longitude for the Sun.
 */
function sunSiderealLongitude(date) {
  const T = julianCenturies(date);
  const tropical = normalize(toDeg(astronomia.solar.apparentLongitude(T)));
  const ayana = ayanamsha(date.getUTCFullYear());
  return normalize(tropical - ayana);
}

/**
 * Compute tithi index (0–29) for a given Date (UTC).
 * Tithi = floor((moon_lon_tropical - sun_lon_tropical) / 12°) mod 30
 * Using tropical coords is fine since tithi is a relative measurement.
 * Checks at 00:00 UTC (05:30 IST, near sunrise in Odisha).
 */
function computeTithi(date) {
  // Normalize to 00:00 UTC to get consistent day-level tithi
  const localDate = new Date(date);
  localDate.setUTCHours(0, 0, 0, 0);
  const T = julianCenturies(localDate);
  const jd = astronomia.julian.DateToJD(localDate);

  const sunLonDeg = normalize(toDeg(astronomia.solar.apparentLongitude(T)));

  const moonPos = astronomia.moonposition.position(jd);
  const eps = astronomia.nutation.meanObliquityLaskar(T);
  const eq = new astronomia.coord.Equatorial(moonPos._ra, moonPos._dec);
  const ec = eq.toEcliptic(eps);
  const moonLonDeg = normalize(toDeg(ec.lon));

  const diff = normalize(moonLonDeg - sunLonDeg);
  return Math.floor(diff / 12);
}

/**
 * Find the date when the Sun enters a given sidereal zodiac sign.
 * signIndex: 0=Mesha(Aries), 1=Vrishabha(Taurus), 2=Mithuna(Gemini),
 * 3=Karka(Cancer), 4=Simha(Leo), 5=Kanya(Virgo),
 * 6=Tula(Libra), 7=Vrishchika(Scorpio), 8=Dhanus(Sagittarius),
 * 9=Makara(Capricorn), 10=Kumbha(Aquarius), 11=Mina(Pisces)
 */
function findSunEnterSign(year, signIndex) {
  const targetLon = signIndex * 30;
  // Search the full year since different signs fall at different points
  let d = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  let prevLon = sunSiderealLongitude(d);

  // For signs entered early in the year (9-11, 0), prev year end may be before target
  // For signs entered later, we'll find the transition normally
  while (d <= end) {
    const next = new Date(d);
    next.setUTCDate(next.getUTCDate() + 1);
    const nextLon = sunSiderealLongitude(next);

    // Check if we cross the target boundary
    // Handle wrap: if target is 0, then crossing from >330 to <30 counts
    const crossed = (prevLon < targetLon && nextLon >= targetLon) ||
      (targetLon === 0 && prevLon > 330 && nextLon < 30);
    if (crossed) return next;

    prevLon = nextLon;
    d = next;
  }
  return null;
}

/**
 * Find a date near a given approximate date that has a specific tithi.
 */
function findTithiNear(year, month, day, targetTithi, range = 20) {
  const start = new Date(Date.UTC(year, month, Math.max(1, day - range)));
  const end = new Date(Date.UTC(year, month, Math.min(31, day + range)));

  let d = new Date(start);
  while (d <= end) {
    const tithi = computeTithi(d);
    if (tithi === targetTithi) return new Date(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

/** Format Date → "YYYY-MM-DD" */
function fmt(d) {
  if (!d) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get day of week name */
function dayName(d) {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[d.getUTCDay()];
}

/**
 * Generate all Odisha holidays for a given year.
 */
export function computeOdishaHolidays(year) {
  const holidays = [];

  // ── Fixed-date holidays ──────────────────────────────────────────────
  const fixed = [
    [0, 23, "Subash Chandra Bose Jayanti / Basanta Panchami", "Gazetted"],
    [0, 26, "Republic Day", "National"],
    [3, 1, "Utkal Divas", "Gazetted"],
    [7, 15, "Independence Day", "National"],
    [9, 2, "Gandhi Jayanti", "National"],
    [11, 25, "Christmas Day", "Gazetted"],
  ];

  for (const [m, d, name, type] of fixed) {
    const dt = new Date(Date.UTC(year, m, d));
    holidays.push({ date: fmt(dt), day: dayName(dt), name, type });
  }

  // ── Solar-based (Sankranti) festivals (sidereal zodiac) ──────────────

  // Makar Sankranti: Sun enters Makara (Capricorn, sign 9, 270°)
  const makarDate = findSunEnterSign(year, 9);
  if (makarDate) {
    holidays.push({ date: fmt(makarDate), day: dayName(makarDate), name: "Makar Sankranti", type: "Gazetted" });
  }

  // Raja Sankranti: Sun enters Mithuna (Gemini, sign 2, 60°)
  const mithunaDate = findSunEnterSign(year, 2);
  if (mithunaDate) {
    holidays.push({ date: fmt(mithunaDate), day: dayName(mithunaDate), name: "Raja Sankranti", type: "Gazetted" });
  }

  // Mahabishuva Sankranti: Sun enters Mesha (Aries, sign 0, 0°)
  const meshaDate = findSunEnterSign(year, 0);
  if (meshaDate) {
    const mDt = new Date(meshaDate);
    // Also Dr. B.R. Ambedkar Jayanti on same day
    holidays.push({ date: fmt(mDt), day: dayName(mDt), name: "Mahabishuva Sankranti / Dr. B.R. Ambedkar Jayanti", type: "Gazetted" });
  }

  // ── Lunar-based festivals ─────────────────────────────────────────────

  // Maha Shivaratri: 14th tithi of Krishna Paksha = tithi 28
  // (30 - 14 + 15 - 1 = ... wait: Krishna Paksha tithis are 15-29, so 14th krishna = 14+15-1 = 28)
  // Actually: Shukla=0..14, Krishna=15..29. 14th of Krishna Paksha = 28
  const shivaratri = findTithiNear(year, 1, 15, 28);
  if (shivaratri) {
    holidays.push({ date: fmt(shivaratri), day: dayName(shivaratri), name: "Maha Shivratri", type: "Gazetted" });
  }

  // Dola Purnima: Full Moon = tithi 15, Phalguna month (~Mar)
  const dolaPurnima = findTithiNear(year, 2, 5, 15);
  if (dolaPurnima) {
    holidays.push({ date: fmt(dolaPurnima), day: dayName(dolaPurnima), name: "Dola Purnima", type: "Gazetted" });
    // Holi: Next day after Dola Purnima
    const holi = new Date(dolaPurnima);
    holi.setUTCDate(holi.getUTCDate() + 1);
    holidays.push({ date: fmt(holi), day: dayName(holi), name: "Holi", type: "Gazetted" });
  }

  // Sabitri Amabasya: New Moon = tithi 0, Jyestha month (~May-Jun)
  const sabitri = findTithiNear(year, 4, 25, 0);
  let sabitriDate = sabitri;
  if (!sabitriDate) sabitriDate = findTithiNear(year, 5, 1, 0);
  if (sabitriDate) {
    holidays.push({ date: fmt(sabitriDate), day: dayName(sabitriDate), name: "Sabitri Amabasya", type: "Gazetted" });
  }

  // Rath Yatra: 2nd tithi of Shukla Paksha (tithi 2), Ashadha month (~Jun-Jul)
  const rathYatra = findTithiNear(year, 6, 1, 2, 25);
  if (rathYatra) {
    holidays.push({ date: fmt(rathYatra), day: dayName(rathYatra), name: "Ratha Yatra", type: "Gazetted" });
    // Bahuda Yatra: 10th tithi of Shukla Paksha (tithi 10) — 8 days after Rath Yatra
    const bahuda = new Date(rathYatra);
    bahuda.setUTCDate(bahuda.getUTCDate() + 8);
    holidays.push({ date: fmt(bahuda), day: dayName(bahuda), name: "Bahuda Yatra", type: "Optional" });
  }

  // Jhulana Purnima: Full Moon = tithi 15, Shravana (~Aug)
  const jhulana = findTithiNear(year, 7, 15, 15);
  if (jhulana) {
    holidays.push({ date: fmt(jhulana), day: dayName(jhulana), name: "Jhulana Purnima", type: "Gazetted" });
  }

  // Ganesh Puja: 4th tithi of Shukla Paksha (tithi 4), Bhadrapada (~Aug-Sep)
  const ganeshDate = findTithiNear(year, 8, 1, 4, 25);
  if (ganeshDate) {
    holidays.push({ date: fmt(ganeshDate), day: dayName(ganeshDate), name: "Ganesh Puja", type: "Gazetted" });
    // Nuakhai: day after Ganesh Puja
    const nuakhai = new Date(ganeshDate);
    nuakhai.setUTCDate(nuakhai.getUTCDate() + 1);
    holidays.push({ date: fmt(nuakhai), day: dayName(nuakhai), name: "Nuakhai", type: "Gazetted" });
    // Day following Nuakhai
    const afterNuakhai = new Date(nuakhai);
    afterNuakhai.setUTCDate(afterNuakhai.getUTCDate() + 1);
    holidays.push({ date: fmt(afterNuakhai), day: dayName(afterNuakhai), name: "Day following Nuakhai", type: "Gazetted" });
  }

  // Durga Puja: Saptami (tithi 7), Ashtami (8), Navami (9), Dashami (10) of Ashvina (~Sep-Oct)
  const saptamiDate = findTithiNear(year, 9, 1, 7, 25);
  if (saptamiDate) {
    holidays.push({ date: fmt(saptamiDate), day: dayName(saptamiDate), name: "Maha Saptami", type: "Gazetted" });
    const ashtami = new Date(saptamiDate); ashtami.setUTCDate(ashtami.getUTCDate() + 1);
    holidays.push({ date: fmt(ashtami), day: dayName(ashtami), name: "Mahasthami", type: "Gazetted" });
    const navami = new Date(ashtami); navami.setUTCDate(navami.getUTCDate() + 1);
    holidays.push({ date: fmt(navami), day: dayName(navami), name: "Maha Navami", type: "Gazetted" });
    const dasami = new Date(navami); dasami.setUTCDate(dasami.getUTCDate() + 1);
    holidays.push({ date: fmt(dasami), day: dayName(dasami), name: "Vijaya Dasami", type: "Gazetted" });
  }

  // Diwali / Kali Puja: New Moon = tithi 0, Kartika (~Oct-Nov)
  const diwaliDate = findTithiNear(year, 10, 1, 0, 25);
  if (diwaliDate) {
    holidays.push({ date: fmt(diwaliDate), day: dayName(diwaliDate), name: "Diwali / Kali Puja", type: "Gazetted" });
  }

  // Rasa Purnima: Full Moon = tithi 15, Kartika (~Nov)
  const rasa = findTithiNear(year, 10, 10, 15);
  if (rasa) {
    holidays.push({ date: fmt(rasa), day: dayName(rasa), name: "Rasa Purnima", type: "Gazetted" });
  }

  // Prathamastami: 8th tithi of Krishna Paksha = tithi 22, Margashirsha (~Nov-Dec)
  const prathamaDate = findTithiNear(year, 11, 1, 22, 25);
  if (prathamaDate) {
    holidays.push({ date: fmt(prathamaDate), day: dayName(prathamaDate), name: "Prathamastami", type: "Optional" });
  }

  // ── Sort by date & deduplicate ────────────────────────────────────────
  const seen = new Set();
  const unique = [];
  for (const h of holidays.sort((a, b) => a.date.localeCompare(b.date))) {
    const key = `${h.date}|${h.name}`;
    if (!seen.has(key)) { seen.add(key); unique.push(h); }
  }

  return unique;
}

/**
 * Generate holidays for a year, merging computed Odisha festivals
 * with national holidays from date-holidays.
 */
export function generateHolidays(year) {
  const computed = computeOdishaHolidays(year);

  // Supplement with date-holidays package
  try {
    const hd = new Holidays("IN", "OR");
    const national = hd.getHolidays(year);
    for (const h of national) {
      const dateStr = h.date.slice(0, 10);
      if (!computed.find((c) => c.date === dateStr)) {
        computed.push({
          date: dateStr,
          day: new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
          name: h.name,
          type: h.type === "public" ? "National" : "Gazetted",
        });
      }
    }
  } catch {
    // date-holidays is supplemental, not critical
  }

  computed.sort((a, b) => a.date.localeCompare(b.date));
  return computed;
}
