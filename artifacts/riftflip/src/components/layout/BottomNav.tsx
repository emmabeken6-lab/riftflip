import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Home, Gamepad2, MessageCircle, Trophy, Coins, Flame, Bomb, LogIn, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";

const GAMES = [
  { slug: "coinflip", name: "Coinflip", Icon: Coins },
  { slug: "jackpot", name: "Jackpot", Icon: Flame },
  { slug: "minefield", name: "Minefield", Icon: Bomb },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const [gamesOpen, setGamesOpen] = useState(false);
  const { user, isSignedIn } = useAuth();
  const isGameActive = location.startsWith("/game/");

  useEffect(() => {
    if (!gamesOpen) return;
    const handler = () => setGamesOpen(false);
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [gamesOpen]);

  const tab = (href: string, Icon: React.ElementType, label: string, testId: string) => {
    const isActive = href === "/" ? location === "/" : location === href;
    return (
      <Link href={href} data-testid={testId} className="flex flex-col items-center gap-1 px-3 py-1 relative" onClick={() => setGamesOpen(false)}>
        <Icon size={21} strokeWidth={isActive ? 2.4 : 1.7} style={{ color: isActive ? "#a78bfa" : "#4a4a4a" }} />
        <span className="font-medium truncate" style={{ color: isActive ? "#a78bfa" : "#4a4a4a", fontSize: "10px" }}>{label}</span>
        {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: "#7c3aed" }} />}
      </Link>
    );
  };

  return (
    <>
      <AnimatePresence>
        {gamesOpen && (
          <>
            <div className="fixed inset-0 z-40" />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.13 }}
              className="fixed z-50 left-1/2 -translate-x-1/2"
              style={{ bottom: "68px", minWidth: "230px" }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <div className="rounded-xl overflow-hidden" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}>
                {GAMES.map((game, i) => {
                  const isActive = location === `/game/${game.slug}`;
                  return (
                    <div
                      key={game.slug}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[#222]"
                      style={{ borderBottom: i < GAMES.length - 1 ? "1px solid #222" : "none", background: isActive ? "#222" : "transparent" }}
                      onMouseDown={(e) => { e.stopPropagation(); navigate(`/game/${game.slug}`); setGamesOpen(false); }}
                      onTouchEnd={(e) => { e.stopPropagation(); navigate(`/game/${game.slug}`); setGamesOpen(false); }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#222", border: "1px solid #333" }}>
                        <game.Icon size={17} strokeWidth={1.8} style={{ color: isActive ? "#a78bfa" : "#555" }} />
                      </div>
                      <span className="font-semibold text-sm" style={{ color: isActive ? "#e2e8f0" : "#888" }}>{game.name}</span>
                    </div>
                  );
                })}
                <div className="flex items-center justify-center gap-2 px-4 py-2.5" style={{ background: "#161616", borderTop: "1px solid #222" }}>
                  <span className="text-green-600 text-xs">● 0% House Edge</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav
        data-testid="bottom-nav"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ background: "#151515", borderTop: "1px solid #222" }}
      >
        <div className="flex items-center justify-around px-2 py-2 pb-safe">
          {tab("/", Home, "Home", "nav-tab-home")}

          <button
            data-testid="nav-tab-games"
            className="flex flex-col items-center gap-1 px-3 py-1 relative cursor-pointer"
            onClick={(e) => { e.stopPropagation(); setGamesOpen((v) => !v); }}
          >
            <Gamepad2 size={21} strokeWidth={isGameActive || gamesOpen ? 2.4 : 1.7} style={{ color: isGameActive || gamesOpen ? "#a78bfa" : "#4a4a4a" }} />
            <span className="font-medium" style={{ color: isGameActive || gamesOpen ? "#a78bfa" : "#4a4a4a", fontSize: "10px" }}>Games</span>
            {(isGameActive || gamesOpen) && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: "#7c3aed" }} />}
          </button>

          {tab("/chat", MessageCircle, "Chat", "nav-tab-chat")}
          {tab("/rewards", Trophy, "Rewards", "nav-tab-rewards")}

          {isSignedIn && user ? (
            <Link href="/profile" data-testid="nav-tab-profile" className="flex flex-col items-center gap-1 px-3 py-1 relative" onClick={() => setGamesOpen(false)}>
              <img
                src={avatarUrl(user)}
                alt="Profile"
                className="w-6 h-6 rounded-full object-cover"
                style={{ outline: location === "/profile" ? "2px solid #7c3aed" : "none", outlineOffset: "1px" }}
              />
              <span className="font-medium truncate" style={{ color: location === "/profile" ? "#a78bfa" : "#4a4a4a", fontSize: "10px" }}>Profile</span>
              {location === "/profile" && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full" style={{ background: "#7c3aed" }} />}
            </Link>
          ) : (
            <Link href="/sign-in" data-testid="nav-tab-signin" className="flex flex-col items-center gap-1 px-3 py-1 relative" onClick={() => setGamesOpen(false)}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#222" }}>
                <User size={13} style={{ color: "#555" }} />
              </div>
              <span className="font-medium" style={{ color: location === "/sign-in" ? "#a78bfa" : "#4a4a4a", fontSize: "10px" }}>Sign In</span>
            </Link>
          )}
        </div>
      </nav>
    </>
  );
}
