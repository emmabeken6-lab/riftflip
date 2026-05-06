import { Switch, Route, Router as WouterRouter } from "wouter";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/home";
import Games from "@/pages/games";
import Chat from "@/pages/chat";
import Rewards from "@/pages/rewards";
import Wallet from "@/pages/wallet";
import CoinflipGame from "@/pages/game/coinflip";
import JackpotGame from "@/pages/game/jackpot";
import MinefieldGame from "@/pages/game/minefield";
import Profile from "@/pages/profile";
import SignIn from "@/pages/sign-in";
import AdminPanel from "@/pages/admin";
import TipsPage from "@/pages/tips";
import SplashScreen from "@/components/SplashScreen";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games" component={Games} />
      <Route path="/game/coinflip" component={CoinflipGame} />
      <Route path="/game/jackpot" component={JackpotGame} />
      <Route path="/game/minefield" component={MinefieldGame} />
      <Route path="/chat" component={Chat} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/profile" component={Profile} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/wallet/tips" component={TipsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem("rift_splash") === "1"; } catch { return false; }
  });

  const handleSplashDone = () => {
    try { sessionStorage.setItem("rift_splash", "1"); } catch {}
    setSplashDone(true);
  };

  return (
    <WouterRouter base={basePath}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            {!splashDone && <SplashScreen onDone={handleSplashDone} />}
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </WouterRouter>
  );
}

export default App;
