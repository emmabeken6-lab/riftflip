import { Router } from "express";
import {
  generateServerSeed,
  generateClientSeed,
  hashServerSeed,
  deriveFlip,
  deriveMines,
} from "../lib/provablyFair";

const router = Router();

declare module "express-session" {
  interface SessionData {
    serverSeed?: string;
    clientSeed?: string;
    nonce?: number;
  }
}

router.get("/fairness/init", (req, res) => {
  const serverSeed = generateServerSeed();
  const clientSeed = req.session.clientSeed ?? generateClientSeed();
  req.session.serverSeed = serverSeed;
  req.session.clientSeed = clientSeed;
  req.session.nonce = 0;
  res.json({
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
    nonce: 0,
  });
});

router.post("/fairness/client-seed", (req, res) => {
  const { clientSeed } = req.body as { clientSeed?: string };
  if (!clientSeed || typeof clientSeed !== "string" || clientSeed.length > 64) {
    res.status(400).json({ error: "Invalid clientSeed" });
    return;
  }
  req.session.clientSeed = clientSeed;
  req.session.nonce = 0;
  res.json({ clientSeed, nonce: 0 });
});

router.post("/fairness/flip", (req, res) => {
  const serverSeed = req.session.serverSeed;
  const clientSeed = req.session.clientSeed;
  const nonce = req.session.nonce ?? 0;
  if (!serverSeed || !clientSeed) {
    res.status(400).json({ error: "Call /api/fairness/init first" });
    return;
  }
  const result = deriveFlip(serverSeed, clientSeed, nonce);
  req.session.nonce = nonce + 1;
  res.json({
    result,
    nonce,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
  });
});

router.post("/fairness/mines", (req, res) => {
  const { mineCount = 5, gridSize = 25 } = req.body as { mineCount?: number; gridSize?: number };
  const serverSeed = req.session.serverSeed;
  const clientSeed = req.session.clientSeed;
  const nonce = req.session.nonce ?? 0;
  if (!serverSeed || !clientSeed) {
    res.status(400).json({ error: "Call /api/fairness/init first" });
    return;
  }
  const mines = deriveMines(serverSeed, clientSeed, nonce, gridSize, mineCount);
  req.session.nonce = nonce + 1;
  res.json({
    mines,
    nonce,
    serverSeedHash: hashServerSeed(serverSeed),
    clientSeed,
  });
});

router.post("/fairness/reveal", (req, res) => {
  const serverSeed = req.session.serverSeed;
  const clientSeed = req.session.clientSeed;
  if (!serverSeed || !clientSeed) {
    res.status(400).json({ error: "No active session" });
    return;
  }
  const newSeed = generateServerSeed();
  req.session.serverSeed = newSeed;
  req.session.nonce = 0;
  res.json({
    serverSeed,
    clientSeed,
    nextServerSeedHash: hashServerSeed(newSeed),
  });
});

export default router;
