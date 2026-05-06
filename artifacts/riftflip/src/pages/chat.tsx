import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, MessageCircle, CloudRain, Gift, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  id: number;
  user: string;
  avatar: string;
  color: string;
  text: string;
  time: string;
  isWin: boolean;
}

interface RainEvent {
  id: string;
  adminName: string;
  totalAmount: number;
  endsAt: string;
  joiners: string[];
  requirements: { minLevel?: number; minMessages?: number };
  status: "active" | "ended";
  tokensPerUser?: number;
}

interface GiveawayRecord {
  id: string;
  adminName: string;
  prize: number;
  endsAt: string;
  entrants: string[];
  requirements: { minLevel?: number; minMessages?: number };
  status: "active" | "ended";
  winnerId?: string;
  winnerName?: string;
}

const REACTIONS = ["👏", "🔥", "💯", "🚀", "💎", "🏆"];
let nextId = 1;

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) { setRemaining("Ended"); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}m ${s}s`);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [endsAt]);
  return remaining;
}

function RainBanner({ rain, userId, onJoined }: { rain: RainEvent; userId?: string; onJoined: () => void }) {
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(userId ? rain.joiners.includes(userId) : false);
  const countdown = useCountdown(rain.endsAt);

  const join = async () => {
    setJoining(true);
    try {
      const r = await fetch(`/api/events/rain/${rain.id}/join`, { method: "POST", credentials: "include" });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setJoined(true); onJoined(); }
    } catch { /* ignore */ }
    setJoining(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-4 mb-3 p-4 rounded-2xl"
      style={{ background: "linear-gradient(135deg, #0a1f2a 0%, #0d1a3a 100%)", border: "1px solid #1a4a7a" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#0a2a4a", border: "1px solid #1a5a8a" }}>
          <CloudRain size={18} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-black text-sm">🌧 Token Rain!</p>
            <span className="text-xs font-mono text-blue-400">{countdown}</span>
          </div>
          <p className="text-blue-200 text-xs mb-1">
            <span className="font-semibold">{rain.adminName}</span> is raining 🪙 <strong>{rain.totalAmount.toLocaleString()}</strong> tokens
          </p>
          <p className="text-blue-400 text-xs mb-2">
            {rain.joiners.length} joined · Each gets ≈ 🪙 {rain.joiners.length > 0 ? Math.floor(rain.totalAmount / rain.joiners.length).toLocaleString() : rain.totalAmount.toLocaleString()}
          </p>
          {(rain.requirements.minLevel ?? 0) > 0 && (
            <p className="text-blue-600 text-xs mb-2">Req: Level {rain.requirements.minLevel}+</p>
          )}
          {joined ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#0a2a15", border: "1px solid #1a5a2a", color: "#4ade80" }}>
              ✓ You joined!
            </span>
          ) : (
            <button onClick={join} disabled={joining || !userId}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
              style={{ background: "#1a5a8a", color: "#fff" }}>
              {joining ? <Loader2 size={11} className="animate-spin" /> : "🌧"} Join Rain
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function GiveawayBanner({ giveaway, userId, onEntered }: { giveaway: GiveawayRecord; userId?: string; onEntered: () => void }) {
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(userId ? giveaway.entrants.includes(userId) : false);
  const countdown = useCountdown(giveaway.endsAt);

  const enter = async () => {
    setEntering(true);
    try {
      const r = await fetch(`/api/events/giveaway/${giveaway.id}/enter`, { method: "POST", credentials: "include" });
      const d = await r.json() as { ok?: boolean; error?: string };
      if (d.ok) { setEntered(true); onEntered(); }
    } catch { /* ignore */ }
    setEntering(false);
  };

  const isEnded = giveaway.status === "ended";

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="mx-4 mb-3 p-4 rounded-2xl"
      style={{ background: "linear-gradient(135deg, #1a0a2a 0%, #2a0a3a 100%)", border: "1px solid #5a1a8a" }}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#2a0a4a", border: "1px solid #5a1a8a" }}>
          <Gift size={18} className="text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-black text-sm">🎁 Giveaway!</p>
            {!isEnded && <span className="text-xs font-mono text-violet-400">{countdown}</span>}
          </div>
          <p className="text-violet-200 text-xs mb-1">
            <span className="font-semibold">{giveaway.adminName}</span> is giving away 🪙 <strong>{giveaway.prize.toLocaleString()}</strong> tokens
          </p>
          {isEnded && giveaway.winnerName ? (
            <p className="text-yellow-400 text-xs font-bold mb-2">🏆 Winner: {giveaway.winnerName}</p>
          ) : (
            <p className="text-violet-400 text-xs mb-2">{giveaway.entrants.length} entered</p>
          )}
          {(giveaway.requirements.minLevel ?? 0) > 0 && (
            <p className="text-violet-600 text-xs mb-2">Req: Level {giveaway.requirements.minLevel}+</p>
          )}
          {!isEnded && (entered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: "#0a2a15", border: "1px solid #1a5a2a", color: "#4ade80" }}>
              ✓ Entered!
            </span>
          ) : (
            <button onClick={enter} disabled={entering || !userId}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
              style={{ background: "#5a1a8a", color: "#fff" }}>
              {entering ? <Loader2 size={11} className="animate-spin" /> : "🎁"} Enter Giveaway
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Chat() {
  const { user, isSignedIn } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [reactions, setReactions] = useState<Record<number, string[]>>({});
  const [activeRain, setActiveRain] = useState<RainEvent | null>(null);
  const [activeGiveaways, setActiveGiveaways] = useState<GiveawayRecord[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const pollEvents = useCallback(async () => {
    try {
      const r = await fetch("/api/events/active", { credentials: "include" });
      const d = await r.json() as { rain?: RainEvent | null; giveaways?: GiveawayRecord[] };
      setActiveRain(d.rain ?? null);
      setActiveGiveaways(d.giveaways ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    void pollEvents();
    const iv = setInterval(() => { void pollEvents(); }, 5000);
    return () => clearInterval(iv);
  }, [pollEvents]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const displayName = isSignedIn && user ? user.username : "You";
    const avatarChar = displayName[0]?.toUpperCase() ?? "Y";
    setMessages((prev) => [
      ...prev,
      { id: nextId++, user: displayName, avatar: avatarChar, color: "#7c3aed", text: input.trim(), time, isWin: false },
    ]);
    setInput("");
  };

  const addReaction = (msgId: number, emoji: string) => {
    setReactions((prev) => ({ ...prev, [msgId]: [...(prev[msgId] ?? []), emoji] }));
  };

  return (
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - 64px)", background: "#111" }}
      data-testid="chat-page"
    >
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid #222", background: "#161616" }}
        data-testid="chat-header"
      >
        <div>
          <h1 className="text-white font-bold text-lg">Live Chat</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Online</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Users size={16} />
          <span>0</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-testid="chat-messages">
        <AnimatePresence>
          {activeRain && activeRain.status === "active" && (
            <div className="pt-3">
              <RainBanner
                key={activeRain.id}
                rain={activeRain}
                userId={user?.id}
                onJoined={pollEvents}
              />
            </div>
          )}
          {activeGiveaways.map((ga) => (
            <div key={ga.id} className={activeRain ? "" : "pt-3"}>
              <GiveawayBanner
                giveaway={ga}
                userId={user?.id}
                onEntered={pollEvents}
              />
            </div>
          ))}
        </AnimatePresence>

        <div className="px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-center" data-testid="chat-empty">
              <MessageCircle size={40} className="text-slate-700 mb-3" />
              <p className="text-slate-500 font-medium">No messages yet</p>
              <p className="text-slate-700 text-sm mt-1">Be the first to say something!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-3 ${msg.isWin ? "items-center" : "items-start"}`}
                    data-testid={`chat-message-${msg.id}`}
                  >
                    {msg.isWin ? (
                      <div
                        className="w-full px-4 py-2.5 rounded-lg flex items-center gap-3"
                        style={{ background: "#1a2a1a", border: "1px solid #2a3a2a" }}
                      >
                        <span className="text-green-400 text-lg">🏆</span>
                        <span className="text-green-300 text-sm font-semibold">{msg.text}</span>
                      </div>
                    ) : (
                      <>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                          style={{ background: msg.color }}
                        >
                          {msg.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-bold" style={{ color: msg.color }}>{msg.user}</span>
                            <span className="text-slate-600 text-xs">{msg.time}</span>
                          </div>
                          <p className="text-slate-300 text-sm break-words">{msg.text}</p>
                          {reactions[msg.id] && reactions[msg.id]!.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {reactions[msg.id]!.map((r, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#222" }}>{r}</span>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-1 mt-1">
                            {REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => addReaction(msg.id, emoji)}
                                className="text-sm opacity-20 hover:opacity-100 transition-opacity"
                                data-testid={`reaction-${emoji}-${msg.id}`}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          )}
        </div>
      </div>

      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid #222", background: "#161616" }}
        data-testid="chat-input-area"
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={isSignedIn ? "Type a message..." : "Sign in to chat…"}
            disabled={!isSignedIn}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white outline-none transition-colors disabled:opacity-50"
            style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e5e5e5" }}
            data-testid="chat-input"
          />
          <button
            onClick={sendMessage}
            disabled={!isSignedIn}
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80 disabled:opacity-30"
            style={{ background: "#7c3aed" }}
            data-testid="chat-send-btn"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
