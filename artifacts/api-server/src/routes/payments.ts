import { Router } from "express";
import express from "express";
import { logger } from "../lib/logger";
import { paymentLogs, addActivity, users, verifyIpnSignature } from "../lib/store";

const router = Router();

const NOWPAYMENTS_API_KEY = process.env["NOWPAYMENTS_API_KEY"] ?? "";
const NOWPAYMENTS_BASE = "https://api.nowpayments.io/v1";

/** $1 USD = 30 tokens */
const TOKENS_PER_USD = 30;

function nowHeaders() {
  return { "x-api-key": NOWPAYMENTS_API_KEY, "Content-Type": "application/json" };
}

router.get("/payments/status", (_req, res) => {
  res.json({ configured: !!NOWPAYMENTS_API_KEY });
});

router.get("/payments/currencies", async (_req, res) => {
  if (!NOWPAYMENTS_API_KEY) {
    res.status(503).json({ error: "NOWPAYMENTS_API_KEY not configured" });
    return;
  }
  try {
    const r = await fetch(`${NOWPAYMENTS_BASE}/currencies?fixed_rate=true`, { headers: nowHeaders() });
    const data = await r.json();
    res.json(data);
  } catch (err) {
    logger.error({ err }, "NowPayments currencies error");
    res.status(502).json({ error: "Failed to fetch currencies" });
  }
});

router.post("/payments/create", async (req, res) => {
  if (!NOWPAYMENTS_API_KEY) {
    res.status(503).json({ error: "NOWPAYMENTS_API_KEY not configured" });
    return;
  }
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { payCurrency, tokenAmount } = req.body as { payCurrency?: string; tokenAmount?: number };
  if (!payCurrency || !tokenAmount || tokenAmount <= 0) {
    res.status(400).json({ error: "payCurrency and tokenAmount are required" });
    return;
  }

  const usdAmount = Math.max(1, Math.round((tokenAmount / TOKENS_PER_USD) * 100) / 100);

  const domains = (process.env["REPLIT_DOMAINS"] ?? "").split(",");
  const primaryDomain = domains[0]?.trim() ?? "";
  const baseUrl = primaryDomain ? `https://${primaryDomain}` : "";

  try {
    const body = {
      price_amount: usdAmount,
      price_currency: "usd",
      pay_currency: payCurrency.toLowerCase(),
      order_id: `rift-${req.user.id}-${Date.now()}`,
      order_description: `Riftflip deposit for ${req.user.username} (${tokenAmount} tokens)`,
      ipn_callback_url: `${baseUrl}/api/payments/ipn`,
      success_url: `${baseUrl}/wallet?deposit=success`,
      cancel_url: `${baseUrl}/wallet?deposit=cancelled`,
    };
    const r = await fetch(`${NOWPAYMENTS_BASE}/payment`, {
      method: "POST",
      headers: nowHeaders(),
      body: JSON.stringify(body),
    });
    const data = await r.json() as {
      payment_id?: string;
      pay_address?: string;
      pay_amount?: number;
      pay_currency?: string;
      payment_status?: string;
      error?: string;
    };
    if (data.error) { res.status(400).json({ error: data.error }); return; }

    paymentLogs.unshift({
      id: data.payment_id ?? `local-${Date.now()}`,
      userId: req.user.id,
      username: req.user.username,
      priceAmount: tokenAmount,
      payCurrency: data.pay_currency ?? payCurrency,
      payAmount: data.pay_amount ?? 0,
      status: data.payment_status ?? "waiting",
      createdAt: new Date().toISOString(),
    });

    res.json({
      paymentId: data.payment_id,
      payAddress: data.pay_address,
      payAmount: data.pay_amount,
      payCurrency: data.pay_currency,
      status: data.payment_status,
    });
  } catch (err) {
    logger.error({ err }, "NowPayments create payment error");
    res.status(502).json({ error: "Failed to create payment" });
  }
});

router.get("/payments/check/:paymentId", async (req, res) => {
  if (!NOWPAYMENTS_API_KEY) {
    res.status(503).json({ error: "NOWPAYMENTS_API_KEY not configured" });
    return;
  }
  try {
    const { paymentId } = req.params;
    const r = await fetch(`${NOWPAYMENTS_BASE}/payment/${paymentId}`, { headers: nowHeaders() });
    const data = await r.json() as {
      payment_id?: string;
      payment_status?: string;
      actually_paid?: number;
      pay_currency?: string;
      price_amount?: number;
    };
    const log = paymentLogs.find((p) => p.id === paymentId);
    if (log && data.payment_status) log.status = data.payment_status;
    res.json({
      paymentId: data.payment_id,
      status: data.payment_status,
      actuallyPaid: data.actually_paid,
      payCurrency: data.pay_currency,
    });
  } catch (err) {
    logger.error({ err }, "NowPayments check error");
    res.status(502).json({ error: "Failed to check payment" });
  }
});

/* ── NowPayments Payout (Withdraw) ── */

router.post("/payments/withdraw", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { tokenAmount, withdrawAddress, currency } = req.body as {
    tokenAmount?: number;
    withdrawAddress?: string;
    currency?: string;
  };
  if (!tokenAmount || tokenAmount <= 0 || !withdrawAddress || !currency) {
    res.status(400).json({ error: "tokenAmount, withdrawAddress, and currency are required" });
    return;
  }
  const user = users.get(req.user.id);
  if (!user || user.balance < tokenAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const usdAmount = Math.round((tokenAmount / TOKENS_PER_USD) * 100) / 100;

  if (NOWPAYMENTS_API_KEY) {
    try {
      const r = await fetch(`${NOWPAYMENTS_BASE}/payout`, {
        method: "POST",
        headers: nowHeaders(),
        body: JSON.stringify({
          withdrawals: [{
            address: withdrawAddress,
            currency: currency.toLowerCase(),
            amount: usdAmount,
            ipn_callback_url: "",
          }],
        }),
      });
      const data = await r.json() as { id?: string; error?: string };
      if (!data.error) {
        user.balance -= tokenAmount;
        paymentLogs.unshift({
          id: data.id ?? `withdraw-${Date.now()}`,
          userId: req.user.id,
          username: req.user.username,
          priceAmount: tokenAmount,
          payCurrency: currency,
          payAmount: usdAmount,
          status: "processing",
          createdAt: new Date().toISOString(),
        });
        addActivity({
          action: "withdrawal_created",
          adminId: "system",
          adminName: "NowPayments",
          targetId: req.user.id,
          targetName: req.user.username,
          details: `Withdrawal: 🪙 ${tokenAmount} tokens → $${usdAmount} USD in ${currency.toUpperCase()} to ${withdrawAddress.slice(0, 10)}…`,
        });
        res.json({ ok: true, id: data.id });
        return;
      }
    } catch (err) {
      logger.error({ err }, "NowPayments payout error");
    }
  }

  // Fallback: manual withdrawal request
  user.balance -= tokenAmount;
  const wdId = `wd-${req.user.id}-${Date.now()}`;
  paymentLogs.unshift({
    id: wdId,
    userId: req.user.id,
    username: req.user.username,
    priceAmount: tokenAmount,
    payCurrency: currency,
    payAmount: usdAmount,
    status: "pending_manual",
    createdAt: new Date().toISOString(),
  });
  addActivity({
    action: "withdrawal_requested",
    adminId: "system",
    adminName: "System",
    targetId: req.user.id,
    targetName: req.user.username,
    details: `Manual withdrawal: 🪙 ${tokenAmount} tokens → ${currency.toUpperCase()} to ${withdrawAddress.slice(0, 10)}…`,
  });
  res.json({ ok: true, id: wdId, manual: true });
});

/* ── NowPayments IPN ── */

router.post(
  "/payments/ipn",
  express.raw({ type: "application/json" }),
  (req, res) => {
    const signature = req.headers["x-nowpayments-sig"];
    if (!signature || typeof signature !== "string") {
      res.status(401).json({ error: "Missing signature" });
      return;
    }
    const body = (req.body as Buffer).toString();
    if (!verifyIpnSignature(body, signature)) {
      logger.warn("IPN signature mismatch");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const data = JSON.parse(body) as {
      payment_id?: string;
      payment_status?: string;
      order_id?: string;
      actually_paid?: number;
      pay_currency?: string;
      price_amount?: number;
    };

    logger.info({ data }, "IPN received");

    const log = paymentLogs.find((p) => p.id === data.payment_id);
    if (log && data.payment_status) log.status = data.payment_status;

    if (data.payment_status === "finished" && data.order_id) {
      const parts = data.order_id.split("-");
      const userId = parts[1];
      if (userId) {
        const user = users.get(userId);
        const priceUsd = data.price_amount ?? 0;
        const tokenAmount = Math.floor(priceUsd * TOKENS_PER_USD);
        if (user) {
          user.balance += tokenAmount;
          addActivity({
            action: "deposit_confirmed",
            adminId: "system",
            adminName: "NowPayments",
            targetId: userId,
            targetName: user.username,
            details: `Deposit confirmed: $${priceUsd} USD → 🪙 ${tokenAmount} tokens (${data.pay_currency?.toUpperCase()})`,
          });
          logger.info({ userId, tokenAmount }, "Balance credited");
        }
      }
    }

    res.json({ ok: true });
  },
);

export default router;
