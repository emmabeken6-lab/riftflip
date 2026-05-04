import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users } from "lucide-react";

const INITIAL_MESSAGES = [
  { id: 1, user: "CrashKing99", avatar: "C", color: "#7c3aed", text: "Just hit 14x on crash let's GO", time: "2:41 PM", isWin: false },
  { id: 2, user: "System", avatar: "S", color: "#10b981", text: "DiamondHands won R$ 23,100 on Slots!", time: "2:42 PM", isWin: true },
  { id: 3, user: "LuckyRoller", avatar: "L", color: "#3b82f6", text: "gg everyone, this game is insane", time: "2:42 PM", isWin: false },
  { id: 4, user: "NeonWarrior", avatar: "N", color: "#f59e0b", text: "anyone else playing jackpot rn?", time: "2:43 PM", isWin: false },
  { id: 5, user: "System", avatar: "S", color: "#10b981", text: "NeonWarrior won R$ 94,500 on Jackpot!", time: "2:43 PM", isWin: true },
  { id: 6, user: "BluePhoenix", avatar: "B", color: "#ec4899", text: "bro that jackpot is insane congrats!!", time: "2:44 PM", isWin: false },
  { id: 7, user: "GoldRusher", avatar: "G", color: "#f97316", text: "I just started playing, what game should I try first?", time: "2:44 PM", isWin: false },
  { id: 8, user: "StarPlayer44", avatar: "S", color: "#06b6d4", text: "start with coinflip, its simple and fun", time: "2:45 PM", isWin: false },
  { id: 9, user: "VoidWalker", avatar: "V", color: "#a855f7", text: "or crash if you want the adrenaline rush lol", time: "2:45 PM", isWin: false },
  { id: 10, user: "System", avatar: "S", color: "#10b981", text: "CrashKing99 won R$ 48,200 on Crash!", time: "2:46 PM", isWin: true },
  { id: 11, user: "LuckyRoller", avatar: "L", color: "#3b82f6", text: "this site is literally the best roblox casino ever", time: "2:46 PM", isWin: false },
  { id: 12, user: "NeonWarrior", avatar: "N", color: "#f59e0b", text: "agreed, nothing else comes close", time: "2:47 PM", isWin: false },
];

const BOT_RESPONSES = [
  "This game is so fun!",
  "Riftflip is the GOAT casino",
  "Who else is grinding right now?",
  "Just hit a sick multiplier on crash!",
  "Good luck everyone!",
  "The mines game is actually addictive",
];

const REACTIONS = ["👏", "🔥", "💯", "🚀", "💎", "🏆"];

let nextId = 13;

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [reactions, setReactions] = useState<Record<number, string[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => {
      const bots = ["RobloxPro", "CasinoElite", "WinMaster", "SpeedGamer", "LegendPlayer"];
      const bot = bots[Math.floor(Math.random() * bots.length)];
      const colors = ["#7c3aed", "#3b82f6", "#ec4899", "#10b981", "#f59e0b"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const text = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      setMessages((prev) => [
        ...prev.slice(-50),
        { id: nextId++, user: bot, avatar: bot[0], color, text, time, isWin: false },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: nextId++, user: "You", avatar: "Y", color: "#7c3aed", text: input, time, isWin: false },
    ]);
    setInput("");
  };

  const addReaction = (msgId: number, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [msgId]: [...(prev[msgId] || []), emoji],
    }));
  };

  return (
    <div className="flex flex-col h-screen md:h-[calc(100vh-64px)]" style={{ background: "#080614" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(139,92,246,0.2)", background: "rgba(255,255,255,0.03)" }}
        data-testid="chat-header"
      >
        <div>
          <h1 className="text-white font-bold text-lg">Live Chat</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">8,492 online</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Users size={16} />
          <span>8.4K</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" data-testid="chat-messages">
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
                  className="w-full px-4 py-2.5 rounded-xl flex items-center gap-3"
                  style={{
                    background: "linear-gradient(90deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
                    border: "1px solid rgba(16,185,129,0.3)",
                  }}
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
                    {reactions[msg.id] && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {reactions[msg.id].map((r, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 rounded-full text-xs"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 mt-1">
                      {REACTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => addReaction(msg.id, emoji)}
                          className="text-sm opacity-30 hover:opacity-100 transition-opacity"
                          data-testid={`reaction-${emoji}`}
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

      {/* Input */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(139,92,246,0.2)", background: "rgba(255,255,255,0.03)" }}
        data-testid="chat-input-area"
      >
        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
            data-testid="chat-input"
          />
          <button
            onClick={sendMessage}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
            data-testid="chat-send-btn"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
