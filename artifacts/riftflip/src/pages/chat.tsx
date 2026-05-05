import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Users, MessageCircle } from "lucide-react";

interface Message {
  id: number;
  user: string;
  avatar: string;
  color: string;
  text: string;
  time: string;
  isWin: boolean;
}

const REACTIONS = ["👏", "🔥", "💯", "🚀", "💎", "🏆"];
let nextId = 1;

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [reactions, setReactions] = useState<Record<number, string[]>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [
      ...prev,
      { id: nextId++, user: "You", avatar: "Y", color: "#7c3aed", text: input.trim(), time, isWin: false },
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
      {/* Header */}
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" data-testid="chat-messages">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center" data-testid="chat-empty">
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
                        {reactions[msg.id] && reactions[msg.id].length > 0 && (
                          <div className="flex gap-1 mt-1 flex-wrap">
                            {reactions[msg.id].map((r, i) => (
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

      {/* Input */}
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
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white outline-none transition-colors"
            style={{ background: "#1e1e1e", border: "1px solid #333", color: "#e5e5e5" }}
            data-testid="chat-input"
          />
          <button
            onClick={sendMessage}
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all hover:opacity-80"
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
