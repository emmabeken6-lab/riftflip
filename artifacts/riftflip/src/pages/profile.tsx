import { Link, useLocation } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import { LogOut, Wallet, Trophy, Gamepad2, Calendar, ExternalLink, Copy, CheckCircle, User, ChevronRight, Shield } from "lucide-react";
import { useState } from "react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.11 18.1.132 18.11a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
  </svg>
);

function ProfileContent() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [copied, setCopied] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "#111" }}>
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const discordAccount = user?.externalAccounts?.find((a) => a.provider === "discord");
  const displayName = discordAccount?.username ?? user?.username ?? user?.firstName ?? "Player";
  const discordId = discordAccount?.externalId;
  const joinedAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  const copyId = () => {
    if (!discordId) return;
    navigator.clipboard.writeText(discordId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto" style={{ background: "#111" }}>
      <div className="mb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <User size={20} className="text-slate-500" />
          Profile
        </h1>
        <p className="text-slate-600 text-sm mt-0.5">Your Riftflip account</p>
      </div>

      {/* Avatar + Name */}
      <section className="mb-4 p-5 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} className="w-16 h-16 rounded-full object-cover" style={{ border: "2px solid #2a2a2a" }} />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black" style={{ background: "#222", border: "2px solid #2a2a2a" }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {discordAccount && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#5865F2", border: "2px solid #1a1a1a" }}>
                <DiscordIcon />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-black text-white truncate">{displayName}</h2>
            {discordAccount && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-sm" style={{ color: "#7c8df0" }}>Discord connected</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar size={12} className="text-slate-700" />
              <span className="text-slate-600 text-xs">Joined {joinedAt}</span>
            </div>
          </div>
        </div>

        {discordId && (
          <div
            className="mt-4 flex items-center gap-3 px-3 py-2.5 rounded-lg"
            style={{ background: "#222", border: "1px solid #333" }}
          >
            <span style={{ color: "#7c8df0" }}><DiscordIcon /></span>
            <span className="text-slate-500 text-xs flex-1 font-mono truncate">ID: {discordId}</span>
            <button
              onClick={copyId}
              className="flex items-center gap-1 text-xs font-semibold transition-all"
              style={{ color: copied ? "#4ade80" : "#555" }}
            >
              {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Balance", value: "R$ 0", icon: Wallet },
          { label: "Total Won", value: "R$ 0", icon: Trophy },
          { label: "Games", value: "0", icon: Gamepad2 },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl flex flex-col items-center gap-1 text-center" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
            <s.icon size={15} className="text-slate-600" />
            <span className="text-white font-bold text-base leading-none">{s.value}</span>
            <span className="text-slate-600 text-xs">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Quick links */}
      <section className="mb-4 rounded-xl overflow-hidden" style={{ border: "1px solid #222" }}>
        {[
          { label: "Wallet", desc: "Deposit & withdraw Robux", icon: Wallet, href: "/wallet" },
          { label: "Rewards", desc: "Daily login & VIP perks", icon: Trophy, href: "/rewards" },
          { label: "Games", desc: "Play Coinflip, Jackpot, Minefield", icon: Gamepad2, href: "/games" },
        ].map((item, i) => (
          <Link key={item.href} href={item.href}>
            <div
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-[#1e1e1e]"
              style={{ background: "#1a1a1a", borderBottom: i < 2 ? "1px solid #1e1e1e" : "none" }}
            >
              <item.icon size={15} className="text-slate-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{item.label}</p>
                <p className="text-slate-600 text-xs">{item.desc}</p>
              </div>
              <ChevronRight size={14} className="text-slate-700" />
            </div>
          </Link>
        ))}
      </section>

      {/* Discord verified badge */}
      {discordAccount && (
        <section className="mb-4 p-4 rounded-xl" style={{ background: "#1a1a1a", border: "1px solid #222" }}>
          <div className="flex items-center gap-3">
            <Shield size={15} className="text-slate-600" />
            <div className="flex-1">
              <p className="text-white text-sm font-semibold">Discord Verified</p>
              <p className="text-slate-600 text-xs">Account linked · Session auto-renews</p>
            </div>
            <a href="https://discord.com/channels/@me" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs" style={{ color: "#7c8df0" }}>
              Open <ExternalLink size={10} />
            </a>
          </div>
        </section>
      )}

      {/* Sign out */}
      <div className="mb-10">
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="w-full py-3 rounded-xl font-bold text-sm transition-colors hover:bg-[#1e1010] flex items-center justify-center gap-2"
          style={{ background: "#1a1010", border: "1px solid #2a1010", color: "#ef4444" }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Profile() {
  return (
    <>
      <Show when="signed-in">
        <ProfileContent />
      </Show>
      <Show when="signed-out">
        <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#111" }}>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
              <User size={24} className="text-slate-600" />
            </div>
            <h2 className="text-xl font-black text-white mb-2">Sign in to view your profile</h2>
            <p className="text-slate-500 text-sm mb-6">Log in with Discord to see your account</p>
            <Link href="/sign-in">
              <button className="px-8 py-3 rounded-lg text-white font-bold transition-all hover:opacity-90" style={{ background: "#7c3aed" }}>
                Sign In with Discord
              </button>
            </Link>
          </div>
        </div>
      </Show>
    </>
  );
}
