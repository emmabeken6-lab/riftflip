import { useLocation, Link } from "wouter";
import { Home, Gamepad2, MessageCircle, Trophy, Wallet } from "lucide-react";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/chat", label: "Chat", icon: MessageCircle, badge: 4 },
  { href: "/rewards", label: "Rewards", icon: Trophy },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      data-testid="bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: "linear-gradient(180deg, rgba(10,8,25,0.95) 0%, rgba(10,8,25,1) 100%)",
        borderTop: "1px solid rgba(139,92,246,0.3)",
        backdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = tab.href === "/" ? location === "/" : location.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              data-testid={`nav-tab-${tab.label.toLowerCase()}`}
              className="flex flex-col items-center gap-1 px-3 py-1 min-w-0 relative"
            >
              <div className="relative">
                <Icon
                  size={22}
                  className={isActive ? "text-violet-400" : "text-slate-500"}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {tab.badge && (
                  <span
                    data-testid="chat-badge"
                    className="absolute -top-2 -right-2 flex items-center justify-center w-4 h-4 rounded-full text-white font-bold"
                    style={{
                      fontSize: "9px",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      boxShadow: "0 0 6px rgba(239,68,68,0.6)",
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className="text-xs font-medium truncate"
                style={{
                  color: isActive ? "#a78bfa" : "#64748b",
                  fontSize: "10px",
                }}
              >
                {tab.label}
              </span>
              {isActive && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
