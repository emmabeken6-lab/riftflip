import { Router } from "express";
import {
  users, rainEvents, giveaways, addActivity, isAdmin as storeIsAdmin,
  endRain, processExpiredRains,
  type RainEvent, type GiveawayRecord,
} from "../lib/store";

const router = Router();

function requireAdmin(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  if (!req.isAuthenticated?.() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!storeIsAdmin(req.user.id) && !users.get(req.user.id)?.isAdmin) { res.status(403).json({ error: "Admin required" }); return; }
  next();
}

/* ── Public: active events for chat polling ── */

router.get("/events/active", (_req, res) => {
  processExpiredRains();
  const activeRain = rainEvents.find((r) => r.status === "active") ?? null;
  const activeGiveaways = giveaways.filter((g) => g.status === "active");
  res.json({ rain: activeRain, giveaways: activeGiveaways });
});

router.get("/events/rain", (_req, res) => {
  res.json({ rains: rainEvents.slice(0, 20) });
});

router.get("/events/giveaways", (_req, res) => {
  res.json({ giveaways: giveaways.slice(0, 20) });
});

/* ── Join rain / enter giveaway (authenticated users) ── */

router.post("/events/rain/:id/join", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  processExpiredRains();
  const rain = rainEvents.find((r) => r.id === req.params["id"]);
  if (!rain) { res.status(404).json({ error: "Rain not found" }); return; }
  if (rain.status !== "active") { res.status(400).json({ error: "Rain has ended" }); return; }
  if (new Date(rain.endsAt).getTime() <= Date.now()) {
    endRain(rain.id);
    res.status(400).json({ error: "Rain has ended" });
    return;
  }
  const userId = req.user.id;
  if (rain.joiners.includes(userId)) { res.status(400).json({ error: "Already joined" }); return; }
  rain.joiners.push(userId);
  rain.joinerNames[userId] = req.user.username;
  res.json({ ok: true, joiners: rain.joiners.length });
});

router.post("/events/giveaway/:id/enter", (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) { res.status(401).json({ error: "Not authenticated" }); return; }
  const giveaway = giveaways.find((g) => g.id === req.params["id"]);
  if (!giveaway) { res.status(404).json({ error: "Giveaway not found" }); return; }
  if (giveaway.status !== "active") { res.status(400).json({ error: "Giveaway has ended" }); return; }
  if (new Date(giveaway.endsAt).getTime() <= Date.now()) { res.status(400).json({ error: "Giveaway has ended" }); return; }
  const userId = req.user.id;
  if (giveaway.entrants.includes(userId)) { res.status(400).json({ error: "Already entered" }); return; }
  giveaway.entrants.push(userId);
  giveaway.entrantNames[userId] = req.user.username;
  res.json({ ok: true, entrants: giveaway.entrants.length });
});

/* ── Admin: start rain ── */

router.post("/admin/events/rain", requireAdmin, (req, res) => {
  const { totalAmount, durationMinutes, minLevel, minMessages } = req.body as {
    totalAmount?: number;
    durationMinutes?: number;
    minLevel?: number;
    minMessages?: number;
  };
  if (!totalAmount || totalAmount <= 0 || !durationMinutes || durationMinutes <= 0) {
    res.status(400).json({ error: "totalAmount and durationMinutes are required" });
    return;
  }

  const admin = users.get(req.user!.id);
  if (!admin || admin.balance < totalAmount) {
    res.status(400).json({ error: "Insufficient admin balance" });
    return;
  }

  // Deduct tokens from admin
  admin.balance -= totalAmount;

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMinutes * 60_000);
  const rain: RainEvent = {
    id: `rain-${Date.now()}`,
    adminId: req.user!.id,
    adminName: req.user!.username,
    totalAmount,
    requirements: { minLevel: minLevel ?? 0, minMessages: minMessages ?? 0 },
    durationMs: durationMinutes * 60_000,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    joiners: [],
    joinerNames: {},
    status: "active",
  };
  rainEvents.unshift(rain);
  if (rainEvents.length > 50) rainEvents.splice(50);

  addActivity({
    action: "rain_started",
    adminId: req.user!.id,
    adminName: req.user!.username,
    details: `Rain started: 🪙 ${totalAmount} tokens over ${durationMinutes} min (req: lvl ${minLevel ?? 0}, msgs ${minMessages ?? 0})`,
  });

  res.json({ ok: true, rain });
});

router.post("/admin/events/rain/:id/end", requireAdmin, (req, res) => {
  processExpiredRains();
  endRain(req.params["id"]!);
  res.json({ ok: true });
});

/* ── Admin: create giveaway ── */

router.post("/admin/events/giveaway", requireAdmin, (req, res) => {
  const { prize, durationMinutes, minLevel, minMessages } = req.body as {
    prize?: number;
    durationMinutes?: number;
    minLevel?: number;
    minMessages?: number;
  };
  if (!prize || prize <= 0 || !durationMinutes || durationMinutes <= 0) {
    res.status(400).json({ error: "prize and durationMinutes are required" });
    return;
  }

  const admin = users.get(req.user!.id);
  if (!admin || admin.balance < prize) {
    res.status(400).json({ error: "Insufficient admin balance" });
    return;
  }
  admin.balance -= prize;

  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMinutes * 60_000);
  const giveaway: GiveawayRecord = {
    id: `ga-${Date.now()}`,
    adminId: req.user!.id,
    adminName: req.user!.username,
    prize,
    requirements: { minLevel: minLevel ?? 0, minMessages: minMessages ?? 0 },
    endsAt: endsAt.toISOString(),
    entrants: [],
    entrantNames: {},
    status: "active",
    createdAt: now.toISOString(),
  };
  giveaways.unshift(giveaway);
  if (giveaways.length > 50) giveaways.splice(50);

  addActivity({
    action: "giveaway_created",
    adminId: req.user!.id,
    adminName: req.user!.username,
    details: `Giveaway created: 🪙 ${prize} tokens, ends in ${durationMinutes} min (req: lvl ${minLevel ?? 0}, msgs ${minMessages ?? 0})`,
  });

  res.json({ ok: true, giveaway });
});

router.post("/admin/events/giveaway/:id/draw", requireAdmin, (req, res) => {
  const giveaway = giveaways.find((g) => g.id === req.params["id"]);
  if (!giveaway) { res.status(404).json({ error: "Giveaway not found" }); return; }
  if (giveaway.status === "ended") { res.status(400).json({ error: "Already ended" }); return; }
  giveaway.status = "ended";

  if (giveaway.entrants.length === 0) {
    addActivity({
      action: "giveaway_ended",
      adminId: req.user!.id,
      adminName: req.user!.username,
      details: `Giveaway ended with no entrants — 🪙 ${giveaway.prize} tokens returned`,
    });
    // Refund admin
    const admin = users.get(giveaway.adminId);
    if (admin) admin.balance += giveaway.prize;
    res.json({ ok: true, winnerId: null, winnerName: null });
    return;
  }

  const winnerIdx = Math.floor(Math.random() * giveaway.entrants.length);
  const winnerId = giveaway.entrants[winnerIdx]!;
  const winnerName = giveaway.entrantNames[winnerId] ?? "Unknown";
  giveaway.winnerId = winnerId;
  giveaway.winnerName = winnerName;

  const winner = users.get(winnerId);
  if (winner) winner.balance += giveaway.prize;

  addActivity({
    action: "giveaway_ended",
    adminId: req.user!.id,
    adminName: req.user!.username,
    targetId: winnerId,
    targetName: winnerName,
    details: `Giveaway winner: ${winnerName} won 🪙 ${giveaway.prize} tokens from ${giveaway.entrants.length} entrants`,
  });

  res.json({ ok: true, winnerId, winnerName, prize: giveaway.prize });
});

export default router;
