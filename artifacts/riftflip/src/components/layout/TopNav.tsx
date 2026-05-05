import { useLocation, Link } from "wouter";
import { Wallet, LogIn, LogOut, User } from "lucide-react";
import { useUser, useClerk, Show } from "@clerk/react";
import riftflipLogo from "@assets/5d919577b49f5f0010fa8d0f_1777874058058.png";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

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
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        <Show when="signed-in">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
            data-testid="balance-display"
          >
            <Wallet size={15} className="text-violet-400" />
            <span className="text-sm font-bold text-violet-300">R$ 0</span>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: basePath || "/" })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#94a3b8",
            }}
            data-testid="sign-out-btn"
          >
            {isLoaded && user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.username ?? "User"}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                <User size={12} className="text-white" />
              </div>
            )}
            <span className="text-slate-300 text-sm font-medium max-w-24 truncate">
              {user?.username ?? user?.firstName ?? "Account"}
            </span>
            <LogOut size={14} className="text-slate-500" />
          </button>
        </Show>

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
