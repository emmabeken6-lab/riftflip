import { Router } from "express";
import { users, tipLogs, addActivity, type TipLog } from "../lib/store";

const router = Router();

router.post("/tips/send", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { toUsername, amount } = req.body as { toUsername?: string; amount?: number };
  if (!toUsername || !amount || amount <= 0) {
    res.status(400).json({ error: "toUsername and amount are required" });
    return;
  }
  if (Math.floor(amount) !== amount) {
    res.status(400).json({ error: "Amount must be a whole number" });
    return;
  }

  const sender = users.get(req.user.id);
  if (!sender) { res.status(404).json({ error: "Sender not found" }); return; }
  if (sender.balance < amount) { res.status(400).json({ error: "Insufficient balance" }); return; }
  if (sender.username.toLowerCase() === toUsername.toLowerCase()) {
    res.status(400).json({ error: "Cannot tip yourself" });
    return;
  }

  const recipient = [...users.values()].find(
    (u) => u.username.toLowerCase() === toUsername.toLowerCase()
  );
  if (!recipient) { res.status(404).json({ error: "User not found" }); return; }

  sender.balance -= amount;
  recipient.balance += amount;

  const tip: TipLog = {
    id: `tip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromId: sender.id,
    fromName: sender.username,
    toId: recipient.id,
    toName: recipient.username,
    amount,
    createdAt: new Date().toISOString(),
  };
  tipLogs.unshift(tip);
  if (tipLogs.length > 500) tipLogs.splice(500);

  addActivity({
    action: "tip_sent",
    adminId: sender.id,
    adminName: sender.username,
    targetId: recipient.id,
    targetName: recipient.username,
    details: `Tip: 🪙 ${amount} tokens from ${sender.username} → ${recipient.username}`,
  });

  res.json({ ok: true, tip, senderBalance: sender.balance, recipientBalance: recipient.balance });
});

router.get("/tips/history", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const userId = req.user.id;
  const history = tipLogs.filter((t) => t.fromId === userId || t.toId === userId).slice(0, 50);
  res.json({ tips: history });
});

export default router;
