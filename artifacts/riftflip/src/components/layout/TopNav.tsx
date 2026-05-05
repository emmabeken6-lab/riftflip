import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Wallet, LogIn, LogOut, User, ChevronDown, Trophy, Gamepad2 } from "lucide-react";
import { useUser, useClerk, Show } from "@clerk/react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/chat", label: "Chat" },
  { href: "/rewards", label: "Rewards" },
  { href: "/wallet", label: "Wallet" },
];

export default function TopNav() {
  const [location] = useLocation();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const discordAccount = user?.externalAccounts?.find((a) => a.provider === "discord");
  const displayName = discordAccount?.username ?? user?.username ?? user?.firstName ?? "Account";

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header
      data-testid="top-nav"
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 h-16"
      style={{
        background: "rgba(8,6,20,0.93)",
        borderBottom: "1px solid rgba(139,92,246,0.22)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3" data-testid="nav-logo">
        <img src={riftflipLogo} alt="Riftflip" className="w-9 h-9 object-contain" />
        <span
          className="text-xl font-black tracking-tight"
          style={{
            background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          RIFTFLIP
        </span>
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`nav-link-${link.label.toLowerCase()}`}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                color: isActive ? "#a78bfa" : "#94a3b8",
                background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
              }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Balance pill (signed in) */}
        <Show when="signed-in">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.28)" }}
            data-testid="balance-display"
          >
            <Wallet size={14} className="text-violet-400" />
            <span className="text-sm font-bold text-violet-300">R$ 0</span>
          </div>
        </Show>

        {/* User dropdown (signed in) */}
        <Show when="signed-in">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:scale-[1.02]"
              style={{
                background: menuOpen ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.07)",
                border: menuOpen ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.11)",
              }}
              data-testid="user-menu-btn"
            >
              {isLoaded && user?.imageUrl ? (
                <div className="relative">
                  <img
                    src={user.imageUrl}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  {discordAccount && (
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "#5865F2", border: "1.5px solid #080614" }}
                    >
                      <DiscordIcon />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                >
                  <User size={13} className="text-white" />
                </div>
              )}
              <span className="text-slate-200 text-sm font-semibold max-w-28 truncate">{displayName}</span>
              <ChevronDown
                size={13}
                className="text-slate-500 transition-transform"
                style={{ transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>

            {/* Dropdown menu */}
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 rounded-2xl overflow-hidden z-50 min-w-52"
                style={{
                  background: "linear-gradient(180deg, #0f0d22 0%, #0c0a1e 100%)",
                  border: "1px solid rgba(139,92,246,0.28)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-black"
                      style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm truncate">{displayName}</p>
                    {discordAccount && (
                      <div className="flex items-center gap-1">
                        <DiscordIcon />
                        <span className="text-xs" style={{ color: "#7c8df0" }}>Discord</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                {[
                  { label: "View Profile", icon: User, href: "/profile", color: "#a78bfa" },
                  { label: "Wallet", icon: Wallet, href: "/wallet", color: "#60a5fa" },
                  { label: "Rewards", icon: Trophy, href: "/rewards", color: "#fbbf24" },
                  { label: "Games", icon: Gamepad2, href: "/games", color: "#34d399" },
                ].map((item, i) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                      style={{ borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
                    >
                      <item.icon size={15} style={{ color: item.color }} />
                      <span className="text-slate-300 text-sm font-medium">{item.label}</span>
                    </div>
                  </Link>
                ))}

                {/* Sign out */}
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ redirectUrl: basePath || "/" });
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 transition-colors"
                    data-testid="sign-out-btn"
                  >
                    <LogOut size={15} className="text-red-400" />
                    <span className="text-red-400 text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </Show>

        {/* Sign in button (signed out) */}
        <Show when="signed-out">
          <Link href="/sign-in">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)", color: "#fff" }}
              data-testid="sign-in-btn"
            >
              <LogIn size={15} />
              Sign In
            </button>
          </Link>
        </Show>
      </div>
    </header>
  );
}
