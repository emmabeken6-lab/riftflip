import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Wallet, LogIn, LogOut, User, ChevronDown, Trophy, Gamepad2 } from "lucide-react";
import { useAuth, avatarUrl } from "@/contexts/AuthContext";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

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
  const { user, isSignedIn, isLoading, refetch } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    refetch();
  };

  return (
    <header
      data-testid="top-nav"
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 h-16"
      style={{ background: "#151515", borderBottom: "1px solid #222" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3" data-testid="nav-logo">
        <img src={riftflipLogo} alt="Riftflip" className="w-8 h-8 object-contain" />
        <span
          className="text-xl font-black tracking-tight"
          style={{ background: "linear-gradient(135deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
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
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: isActive ? "#c4b5fd" : "#666", background: isActive ? "#1e1e1e" : "transparent" }}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {!isLoading && isSignedIn && user ? (
          <>
            {/* Balance pill */}
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: "#1e1e1e", border: "1px solid #2a2a2a" }}
            >
              <Wallet size={13} className="text-slate-500" />
              <span className="text-sm font-bold" style={{ color: "#9ca3af" }}>
                <span style={{ color: "#6b7280", fontWeight: 700, fontSize: "0.85em" }}>T</span>{" "}{user.balance.toLocaleString()}
              </span>
            </div>

            {/* User dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-[#1e1e1e]"
                style={{ background: menuOpen ? "#1e1e1e" : "#191919", border: "1px solid #2a2a2a" }}
              >
                <div className="relative">
                  <img src={avatarUrl(user)} alt={user.username} className="w-7 h-7 rounded-full object-cover" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "#5865F2", border: "1.5px solid #151515" }}>
                    <DiscordIcon />
                  </div>
                </div>
                <span className="text-slate-300 text-sm font-medium max-w-28 truncate">{user.username}</span>
                <ChevronDown size={13} className="text-slate-600" style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden z-50 min-w-48"
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
                >
                  <div className="px-4 py-3 flex items-center gap-3" style={{ borderBottom: "1px solid #222" }}>
                    <img src={avatarUrl(user)} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{user.username}</p>
                      <div className="flex items-center gap-1">
                        <DiscordIcon />
                        <span className="text-xs text-slate-500">Discord · #{user.discriminator}</span>
                      </div>
                    </div>
                  </div>

                  {[
                    { label: "View Profile", icon: User, href: "/profile" },
                    { label: "Wallet", icon: Wallet, href: "/wallet" },
                    { label: "Rewards", icon: Trophy, href: "/rewards" },
                    { label: "Games", icon: Gamepad2, href: "/games" },
                  ].map((item, i) => (
                    <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
                      <div
                        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-[#222]"
                        style={{ borderBottom: i < 3 ? "1px solid #1e1e1e" : "none" }}
                      >
                        <item.icon size={14} className="text-slate-500" />
                        <span className="text-slate-300 text-sm">{item.label}</span>
                      </div>
                    </Link>
                  ))}

                  <div style={{ borderTop: "1px solid #222" }}>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1e1010]"
                    >
                      <LogOut size={14} className="text-red-500" />
                      <span className="text-red-500 text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : !isLoading ? (
          <Link href="/sign-in">
            <button
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "#7c3aed", color: "#fff" }}
            >
              <LogIn size={14} />
              Sign In
            </button>
          </Link>
        ) : null}
      </div>
    </header>
  );
}
