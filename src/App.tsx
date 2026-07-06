import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Explore from "@/pages/Explore";
import MapPage from "@/pages/MapPage";
import Festivals from "@/pages/Festivals";
import Itinerary from "@/pages/Itinerary";
import Wishlist from "@/pages/Wishlist";
import Landing from "@/pages/Landing";
import { Sidebar, MobileNav } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { DetailModal } from "@/components/DetailModal";
import { useAppState } from "@/lib/state";
const queryClient = new QueryClient();

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <img src="/Traveller%20Sanga%20Logo.png" alt="Traveller Saanga" className="h-14 w-auto animate-pulse" />
        <p className="text-sm text-muted-foreground">Loading Traveller Saanga…</p>
      </div>
    </div>
  );
}

function Shell() {
  const s = useAppState();
  const { user, authReady } = s;

  // Show a spinner while Firebase resolves its auth state (prevents flash)
  if (!authReady) return <AuthLoading />;

  if (!user) return <Landing />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar />
        <main className="relative z-0 flex-1">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/explore" component={Explore} />
            <Route path="/map" component={MapPage} />
            <Route path="/festivals" component={Festivals} />
            <Route path="/itinerary" component={Itinerary} />
            <Route path="/wishlist" component={Wishlist} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav />

      <DetailModal
        place={s.detailPlace}
        inCart={s.detailPlace ? s.cart.has(s.detailPlace.id) : false}
        inWish={s.detailPlace ? s.wishlist.has(s.detailPlace.id) : false}
        onClose={() => s.setDetailPlace(null)}
        onToggleCart={() => s.detailPlace && s.toggleCart(s.detailPlace.id)}
        onToggleWish={() => s.detailPlace && s.toggleWishlist(s.detailPlace.id)}
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Shell />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
