import { useLocation, Link } from "wouter";
import { Wallet } from "lucide-react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/games", label: "Games" },
  { href: "/chat", label: "Chat", badge: 4 },
  { href: "/rewards", label: "Rewards" },
  { href: "/wallet", label: "Wallet" },
];

export default function TopNav() {
  const [location] = useLocation();

  return (
    <header
      data-testid="top-nav"
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 h-16"
      style={{
        background: "rgba(8,6,20,0.92)",
        borderBottom: "1px solid rgba(139,92,246,0.25)",
        backdropFilter: "blur(24px)",
      }}
    >
      <Link href="/" className="flex items-center gap-3 group" data-testid="nav-logo">
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

      <nav className="flex items-center gap-1">
        {navLinks.map((link) => {
          const isActive = link.href === "/" ? location === "/" : location.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              data-testid={`nav-link-${link.label.toLowerCase()}`}
              className="relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={{
                color: isActive ? "#a78bfa" : "#94a3b8",
                background: isActive ? "rgba(139,92,246,0.15)" : "transparent",
              }}
            >
              {link.label}
              {link.badge && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-white font-bold"
                  style={{
                    fontSize: "9px",
                    background: "#ef4444",
                    boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                  }}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl"
          style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
          data-testid="balance-display"
        >
          <Wallet size={15} className="text-violet-400" />
          <span className="text-sm font-bold text-violet-300">R$ 12,450</span>
        </div>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "2px solid rgba(167,139,250,0.5)",
          }}
          data-testid="user-avatar"
        >
          R
        </div>
      </div>
    </header>
  );
}
