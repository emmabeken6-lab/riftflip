import { Router, type IRouter } from "express";

const router: IRouter = Router();

const BOT_SECRET = process.env["BOT_API_SECRET"] ?? "riftflip-bot-secret";

function authBot(req: Parameters<Parameters<IRouter["use"]>[0]>[0], res: Parameters<Parameters<IRouter["use"]>[0]>[1], next: Parameters<Parameters<IRouter["use"]>[0]>[2]) {
  const auth = req.headers["x-bot-secret"];
  if (auth !== BOT_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

const users: Record<string, { username: string; balance: number; banned: boolean; joinedAt: string }> = {};

const wins: Array<{ username: string; game: string; amount: number; multiplier: number; timestamp: string }> = [];

const events: Array<{ id: string; title: string; description: string; createdBy: string; endsAt: string; createdAt: string }> = [];

router.get("/bot/balance/:username", authBot, (req, res): void => {
  const username = Array.isArray(req.params["username"]) ? req.params["username"][0] : req.params["username"];
  const user = users[username.toLowerCase()];
  if (!user) {
    res.status(404).json({ error: "User not found", balance: 0 });
    return;
  }
  res.json({ username: user.username, balance: user.balance, banned: user.banned });
});

router.get("/bot/stats", authBot, (_req, res): void => {
  const totalUsers = Object.keys(users).length;
  const totalWins = wins.length;
  const totalPaid = wins.reduce((sum, w) => sum + w.amount, 0);
  const biggestWin = wins.length > 0 ? wins.reduce((max, w) => (w.amount > max.amount ? w : max)) : null;
  res.json({ totalUsers, totalWins, totalPaid, biggestWin, activeEvents: events.length });
});

router.post("/bot/announce-win", authBot, (req, res): void => {
  const { username, game, amount, multiplier } = req.body as {
    username: string;
    game: string;
    amount: number;
    multiplier: number;
  };
  if (!username || !game || amount == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const win = { username, game, amount, multiplier: multiplier ?? 1, timestamp: new Date().toISOString() };
  wins.push(win);
  res.status(201).json(win);
});

router.get("/bot/wins", authBot, (_req, res): void => {
  res.json(wins.slice(-20).reverse());
});

router.post("/bot/event", authBot, (req, res): void => {
  const { title, description, createdBy, endsAt } = req.body as {
    title: string;
    description: string;
    createdBy: string;
    endsAt: string;
  };
  if (!title || !createdBy) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const event = {
    id: Date.now().toString(),
    title,
    description: description ?? "",
    createdBy,
    endsAt: endsAt ?? "",
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  res.status(201).json(event);
});

router.get("/bot/events", authBot, (_req, res): void => {
  res.json(events);
});

router.post("/bot/ban/:username", authBot, (req, res): void => {
  const username = Array.isArray(req.params["username"]) ? req.params["username"][0] : req.params["username"];
  const key = username.toLowerCase();
  if (!users[key]) {
    users[key] = { username, balance: 0, banned: true, joinedAt: new Date().toISOString() };
  } else {
    users[key]!.banned = true;
  }
  res.json({ username, banned: true });
});

router.post("/bot/unban/:username", authBot, (req, res): void => {
  const username = Array.isArray(req.params["username"]) ? req.params["username"][0] : req.params["username"];
  const key = username.toLowerCase();
  if (!users[key]) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  users[key]!.banned = false;
  res.json({ username, banned: false });
});

router.get("/bot/user/:username", authBot, (req, res): void => {
  const username = Array.isArray(req.params["username"]) ? req.params["username"][0] : req.params["username"];
  const user = users[username.toLowerCase()];
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const userWins = wins.filter((w) => w.username.toLowerCase() === username.toLowerCase());
  res.json({ ...user, wins: userWins.length, totalWon: userWins.reduce((s, w) => s + w.amount, 0) });
});

export default router;
