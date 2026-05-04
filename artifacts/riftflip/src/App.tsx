import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
