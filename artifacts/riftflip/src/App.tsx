import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
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
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/favicon.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#7c3aed",
    colorForeground: "#e2e8f0",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#0f0d22",
    colorInput: "rgba(255,255,255,0.07)",
    colorInputForeground: "#e2e8f0",
    colorNeutral: "rgba(139,92,246,0.3)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "rounded-2xl w-[420px] max-w-full overflow-hidden border border-violet-500/20",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-black",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButtonText: "text-white font-semibold",
    formFieldLabel: "text-slate-300 font-medium",
    footerActionLink: "text-violet-400 hover:text-violet-300",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-600",
    identityPreviewEditButton: "text-violet-400",
    formFieldSuccessText: "text-green-400",
    alertText: "text-slate-200",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-violet-500/20 hover:border-violet-500/40 transition-all",
    formButtonPrimary: "bg-gradient-to-r from-violet-600 to-indigo-500 hover:opacity-90 transition-all font-bold",
    formFieldInput: "bg-white/7 border-violet-500/30 text-white placeholder:text-slate-600",
    footerAction: "bg-white/3",
    dividerLine: "bg-white/10",
    alert: "bg-white/5 border border-white/10",
    otpCodeFieldInput: "border-violet-500/30 bg-white/7 text-white",
    formFieldRow: "gap-2",
    main: "gap-4",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#080614" }}>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#080614" }}>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsub;
  }, [addListener, qc]);

  return null;
}

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
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey!}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in with Discord to access your account",
            actionLink: "Sign up",
            actionText: "Don't have an account?",
          },
        },
        signUp: {
          start: {
            title: "Join Riftflip",
            subtitle: "Sign up with Discord to start playing",
            actionLink: "Sign in",
            actionText: "Already have an account?",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
