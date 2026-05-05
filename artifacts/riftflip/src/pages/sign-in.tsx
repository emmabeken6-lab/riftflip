import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

export default function SignIn() {
  const { isSignedIn, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && isSignedIn) navigate("/");
  }, [isSignedIn, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#111" }}>
      <div className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>

        {/* Banner header */}
        <div className="relative overflow-hidden" style={{ height: "160px" }}>
          <img
            src="/banner.png"
            alt="Riftflip Casino"
            className="w-full h-full object-cover"
            style={{ objectPosition: "center center" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, #1a1a1a 100%)" }}
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span
              className="text-2xl font-black tracking-tight"
              style={{
                background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              RIFTFLIP
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-8">
          <h1 className="text-white text-xl font-black text-center mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm text-center mb-8">
            Sign in with Discord to access your account
          </p>

          <a href="/api/auth/discord">
            <button
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-lg font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#5865F2" }}
            >
              <DiscordIcon />
              Continue with Discord
            </button>
          </a>

          <p className="text-slate-700 text-xs text-center mt-6 leading-relaxed">
            By signing in you agree to our Terms of Service.
            <br />
            Your Discord username and avatar will be saved to your session.
          </p>
        </div>
      </div>
    </div>
  );
}
