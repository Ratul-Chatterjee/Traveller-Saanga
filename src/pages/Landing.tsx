import { useState, type FormEvent } from "react";
import {
  Compass, Sparkles, MapPin, Waves, Mountain,
  Calendar, ArrowRight, Mail, User as UserIcon, Lock, Sun, Moon, Eye, EyeOff,
} from "lucide-react";
import { signInWithGoogle, registerWithEmail, loginWithEmail } from "@/lib/firebase";
import { useAppState } from "@/lib/state";

const HERO = "https://upload.wikimedia.org/wikipedia/commons/4/47/Konarka_Temple.jpg";
const STRIP = [
  { url: "https://upload.wikimedia.org/wikipedia/commons/b/b7/Shri_Jagannath_temple.jpg", label: "Puri Jagannath" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/9/94/Birds_eyeview_of_Chilika_Lake.jpg", label: "Chilika Lake" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Simlipal_tiger_reserve.jpg", label: "Simlipal" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Barehipani_Falls.jpg", label: "Barehipani Falls" },
  { url: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Shanti_Stupa,_Dhauli_01.jpg/960px-Shanti_Stupa,_Dhauli_01.jpg", label: "Dhauli Stupa" },
];

const STATS = [
  { k: "42+", v: "curated destinations" },
  { k: "13", v: "classical dance forms" },
  { k: "480 km", v: "of golden coastline" },
  { k: "62", v: "tribal communities" },
];

const REASONS = [
  { icon: Mountain, title: "An ancient soul", body: "From the Sun Temple at Konark to the Lingaraj spires — a thousand-year story carved in stone, untouched by mass tourism." },
  { icon: Waves, title: "Where land meets sea", body: "480 km of unspoilt coast, the brackish wonder of Chilika Lake, and Olive Ridley turtles arriving by the million." },
  { icon: Compass, title: "Forests few have walked", body: "Simlipal's tiger reserve, the twin-leap of Barehipani Falls, and tribal hamlets in the Eastern Ghats." },
  { icon: Sparkles, title: "Festivals that stop time", body: "Rath Yatra, Konark Dance Festival, Bali Yatra, Raja — the year in Odisha is one continuous, joyful procession." },
];

export default function Landing() {
  const s = useAppState();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      // Firebase auth state change is handled by onAuthStateChanged in state.ts
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        await registerWithEmail(name.trim(), email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (err: any) {
      const code = err.code || "";
      if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (code === "auth/email-already-in-use") {
        setError("Email already registered. Please sign in instead.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative min-h-[100vh] overflow-hidden">
        <img src={HERO} alt="Konark Sun Temple" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/30 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

        {/* Top bar */}
        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 text-white lg:px-10">
          <div className="flex items-center gap-2.5">
            <img src="/Traveller%20Sanga%20Logo.png" alt="Traveller Saanga" className="h-10 w-auto" />
            <div>
              <div className="font-serif text-xl font-bold leading-none">Traveller Saanga</div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-amber-200/90">Soul of Odisha</div>
            </div>
          </div>
          <nav className="hidden items-center gap-7 text-sm text-white/80 md:flex">
            <a href="#story" className="hover:text-white">The Story</a>
            <a href="#why" className="hover:text-white">Why Odisha</a>
            <a href="#preview" className="hover:text-white">What's Inside</a>
            <button onClick={() => s.setDark(!s.dark)} className="grid h-8 w-8 place-items-center rounded-xl border border-white/20 bg-white/10 backdrop-blur transition hover:bg-white/20">
              {s.dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <a href="#login" className="rounded-full bg-white/15 px-4 py-1.5 backdrop-blur hover:bg-white/25">Sign in</a>
          </nav>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-10 lg:grid-cols-[1.15fr_1fr] lg:px-10 lg:pt-16">
          <div className="text-white">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-500/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-100 backdrop-blur">
              <Sun size={12} /> India's best-kept secret
            </span>
            <h1 className="mt-6 font-serif text-5xl font-bold leading-[1.05] sm:text-6xl lg:text-7xl">
              Discover the <span className="bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent">hidden soul</span> of India.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Temples older than empires. Beaches longer than horizons. Tribes whose songs have outlived dynasties.
              Welcome to <span className="font-semibold text-white">Odisha</span> — where every village has a story.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:scale-[1.02]">
                Begin your journey <ArrowRight size={15} />
              </a>
              <a href="#why" className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
                Why it's a secret
              </a>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-2 gap-y-5 sm:grid-cols-4 sm:gap-x-6">
              {STATS.map((s) => (
                <div key={s.v}>
                  <div className="font-serif text-2xl font-bold text-amber-100 sm:text-3xl">{s.k}</div>
                  <div className="text-[11px] uppercase tracking-wider text-white/70">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ─── AUTH CARD ─────────────────────────────────────────────── */}
          <div id="login" className="relative">
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-amber-300/30 via-rose-300/20 to-primary/30 blur-2xl" />
            <div className="relative rounded-3xl border border-white/20 bg-white/95 p-7 shadow-2xl backdrop-blur-xl dark:bg-zinc-900/90 sm:p-8">
              {/* Mode toggle */}
              <div className="mb-5 flex rounded-xl border bg-background p-1">
                <button
                  onClick={() => { setMode("login"); setError(null); }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${mode === "login" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setMode("register"); setError(null); }}
                  className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${mode === "register" ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Create Account
                </button>
              </div>

              <h2 className="font-serif text-xl font-bold leading-tight">
                {mode === "login" ? "Welcome back, Traveller" : "Start your Odisha journey"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "login"
                  ? "Sign in to access your saved itineraries and wishlist."
                  : "Create an account to save destinations, build itineraries, and discover festivals."}
              </p>

              {/* Google sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border bg-background px-5 py-2.5 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.8 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.4-.2-2.7-.5-4z"/>
                  <path fill="#34A853" d="M6.3 14.7l7 5.1C15 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3c-7.6 0-14.2 4.1-17.7 10.3z" transform="translate(-1,2)"/>
                  <path fill="#FBBC05" d="M24 45c5.7 0 10.6-1.9 14.2-5.1l-6.6-5.4C29.8 36 27 37 24 37c-5.7 0-10.6-3.1-11.8-7.5l-7 5.4C8.6 40.7 15.8 45 24 45z" transform="translate(0,-1)"/>
                  <path fill="#EA4335" d="M44.5 20H24v8.5h11.8c-1 3-3.5 5.4-6.8 6.9l6.6 5.4c4.5-4.2 7.4-10.5 7.4-17.8 0-1.4-.2-2.7-.5-4z" transform="translate(-1,0)"/>
                </svg>
                Continue with Google
              </button>

              <div className="my-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === "register" && (
                  <label className="block">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your name</div>
                    <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                      <UserIcon size={14} className="text-muted-foreground" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Ananya Mishra"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email</div>
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <Mail size={14} className="text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                </label>

                <label className="block">
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</div>
                  <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                    <Lock size={14} className="text-muted-foreground" />
                    <input
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "register" ? "Min. 6 characters" : "Your password"}
                      required
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="text-muted-foreground hover:text-foreground">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Please wait…</span>
                  ) : mode === "login" ? (
                    <span className="flex items-center gap-2">Sign In <ArrowRight size={15} /></span>
                  ) : (
                    <span className="flex items-center gap-2">Create Account <ArrowRight size={15} /></span>
                  )}
                </button>
              </form>

              <p className="mt-4 text-center text-[11px] text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

        {/* Image strip */}
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-10 lg:px-10">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
            {STRIP.map((p) => (
              <div key={p.label} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/20 shadow-xl">
                <img src={p.url} alt={p.label} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-1.5 left-2 text-[11px] font-semibold text-white">{p.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STORY SECTION */}
      <section id="story" className="relative overflow-hidden bg-gradient-to-b from-amber-50 via-orange-50 to-background py-24 dark:from-zinc-950 dark:via-zinc-950 dark:to-background">
        <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
            The Story
          </span>
          <h2 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl">
            Why they call it the <em className="not-italic text-primary">Hidden Secret</em> of India.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            While the rest of the country races through Goa and Jaipur, Odisha quietly keeps the originals —
            the temples that taught India how to carve, the dances that taught it how to move, and the
            beaches still empty enough to hear the wind. <span className="font-semibold text-foreground">It just waits for you to find it.</span>
          </p>
        </div>
      </section>

      {/* WHY ODISHA */}
      <section id="why" className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-primary">
              Why Odisha
            </span>
            <h2 className="mt-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
              Four worlds. <span className="text-primary">One state.</span>
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.title} className="group relative overflow-hidden rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10">
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-200/30 to-primary/20 blur-2xl transition group-hover:scale-150" />
                  <div className="relative">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-amber-500 text-white shadow-lg shadow-amber-500/20">
                      <Icon size={18} />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-bold">{r.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PREVIEW */}
      <section id="preview" className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-900 to-orange-950 py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.15),transparent_60%),radial-gradient(circle_at_80%_70%,rgba(251,113,133,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-14 max-w-2xl">
            <h2 className="font-serif text-4xl font-bold leading-tight sm:text-5xl">Your trail, intelligently planned.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: MapPin, title: "Smart Route Planner", body: "Pick your stops — we auto-arrange them by nearest neighbour and split into days." },
              { icon: Calendar, title: "Festival Matchmaker", body: "Set your travel dates and discover which Odia festivals fall right inside them." },
              { icon: Sparkles, title: "Live Expense Engine", body: "Travel, food, and entry fees — recalculated live as you tweak your trip." },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-primary text-zinc-900">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-serif text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{f.body}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <h3 className="font-serif text-3xl font-bold sm:text-4xl">Ready to find your Odisha?</h3>
            <a href="#login" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-primary px-7 py-3.5 text-sm font-bold text-zinc-900 shadow-xl shadow-amber-500/30 transition hover:scale-[1.03]">
              Sign in &amp; start planning <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-xs text-muted-foreground sm:flex-row lg:px-10">
          <div className="flex items-center gap-2">
            <img src="/Traveller%20Sanga%20Logo.png" alt="Traveller Saanga" className="h-6 w-auto" />
            <span className="font-serif text-sm font-semibold text-foreground">Traveller Saanga</span>
            <span>· Soul of Odisha</span>
          </div>
          <div>Built with care for India's quietest treasure.</div>
        </div>
      </footer>
    </div>
  );
}
