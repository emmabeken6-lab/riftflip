import { Router } from "express";
import express from "express";
import { logger } from "../lib/logger";
import { paymentLogs, addActivity, users, verifyIpnSignature } from "../lib/store";

const router = Router();

const NOWPAYMENTS_API_KEY = process.env["NOWPAYMENTS_API_KEY"] ?? "";
const NOWPAYMENTS_BASE = "https://api.nowpayments.io/v1";
const MOWPAYMENTS_API_KEY = process.env["MOWPAYMENTS_API_KEY"] ?? "";
const MOWPAYMENTS_BASE = "https://api.mowpayments.com/v1";

function nowHeaders() {
  return { "x-api-key": NOWPAYMENTS_API_KEY, "Content-Type": "application/json" };
}
function mowHeaders() {
  return { "Authorization": `Bearer ${MOWPAYMENTS_API_KEY}`, "Content-Type": "application/json" };
}

router.get("/payments/status", (_req, res) => {
  res.json({
    configured: !!NOWPAYMENTS_API_KEY,
    mowConfigured: !!MOWPAYMENTS_API_KEY,
  });
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
  const { payCurrency, priceAmount } = req.body as { payCurrency?: string; priceAmount?: number };
  if (!payCurrency || !priceAmount || priceAmount <= 0) {
    res.status(400).json({ error: "payCurrency and priceAmount are required" });
    return;
  }

  const domains = (process.env["REPLIT_DOMAINS"] ?? "").split(",");
  const primaryDomain = domains[0]?.trim() ?? "";
  const baseUrl = primaryDomain ? `https://${primaryDomain}` : "";

  try {
    const body = {
      price_amount: priceAmount,
      price_currency: "usd",
      pay_currency: payCurrency.toLowerCase(),
      order_id: `rift-${req.user.id}-${Date.now()}`,
      order_description: `Riftflip deposit for ${req.user.username}`,
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
      priceAmount,
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

/* ── MowPayments (Robux) ── */

router.post("/payments/mow/create", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { robuxAmount } = req.body as { robuxAmount?: number };
  if (!robuxAmount || robuxAmount <= 0) {
    res.status(400).json({ error: "robuxAmount is required" });
    return;
  }

  const orderId = `mow-${req.user.id}-${Date.now()}`;

  if (MOWPAYMENTS_API_KEY) {
    try {
      const r = await fetch(`${MOWPAYMENTS_BASE}/payments`, {
        method: "POST",
        headers: mowHeaders(),
        body: JSON.stringify({
          amount: robuxAmount,
          currency: "robux",
          order_id: orderId,
          description: `Riftflip deposit for ${req.user.username}`,
        }),
      });
      const data = await r.json() as {
        id?: string;
        trade_url?: string;
        status?: string;
        error?: string;
      };
      if (data.error) { res.status(400).json({ error: data.error }); return; }
      paymentLogs.unshift({
        id: data.id ?? orderId,
        userId: req.user.id,
        username: req.user.username,
        priceAmount: robuxAmount,
        payCurrency: "robux",
        payAmount: robuxAmount,
        status: data.status ?? "waiting",
        createdAt: new Date().toISOString(),
      });
      res.json({ orderId: data.id ?? orderId, tradeUrl: data.trade_url, robuxAmount, status: data.status ?? "waiting" });
      return;
    } catch (err) {
      logger.error({ err }, "MowPayments create error");
    }
  }

  paymentLogs.unshift({
    id: orderId,
    userId: req.user.id,
    username: req.user.username,
    priceAmount: robuxAmount,
    payCurrency: "robux",
    payAmount: robuxAmount,
    status: "pending_manual",
    createdAt: new Date().toISOString(),
  });
  res.json({
    orderId,
    robuxAmount,
    status: "pending_manual",
    instructions: `Send R$ ${robuxAmount} Robux via Roblox trade or gamepass. Use order ID: ${orderId} as the trade note. An admin will confirm and credit your balance.`,
  });
});

router.get("/payments/mow/check/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const log = paymentLogs.find((p) => p.id === orderId);
  if (!log) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ orderId, status: log.status, robuxAmount: log.priceAmount });
});

/* ── NowPayments Payout (Withdraw) ── */

router.post("/payments/withdraw", async (req, res) => {
  if (!req.isAuthenticated?.() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { robuxAmount, withdrawAddress, currency } = req.body as {
    robuxAmount?: number;
    withdrawAddress?: string;
    currency?: string;
  };
  if (!robuxAmount || robuxAmount <= 0 || !withdrawAddress || !currency) {
    res.status(400).json({ error: "robuxAmount, withdrawAddress, and currency are required" });
    return;
  }
  const user = users.get(req.user.id);
  if (!user || user.balance < robuxAmount) {
    res.status(400).json({ error: "Insufficient balance" });
    return;
  }

  const usdAmount = Math.round(robuxAmount * 0.0035 * 100) / 100;

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
        user.balance -= robuxAmount;
        paymentLogs.unshift({
          id: data.id ?? `withdraw-${Date.now()}`,
          userId: req.user.id,
          username: req.user.username,
          priceAmount: robuxAmount,
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
          details: `Withdrawal: R$ ${robuxAmount} tokens → $${usdAmount} USD in ${currency.toUpperCase()} to ${withdrawAddress.slice(0, 10)}…`,
        });
        res.json({ ok: true, id: data.id });
        return;
      }
    } catch (err) {
      logger.error({ err }, "NowPayments payout error");
    }
  }

  // Fallback: manual withdrawal request
  user.balance -= robuxAmount;
  const wdId = `wd-${req.user.id}-${Date.now()}`;
  paymentLogs.unshift({
    id: wdId,
    userId: req.user.id,
    username: req.user.username,
    priceAmount: robuxAmount,
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
    details: `Manual withdrawal request: R$ ${robuxAmount} tokens → ${currency.toUpperCase()} to ${withdrawAddress.slice(0, 10)}…`,
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
        const robuxAmount = Math.floor(priceUsd / 0.0035);
        if (user) {
          user.balance += robuxAmount;
          addActivity({
            action: "deposit_confirmed",
            adminId: "system",
            adminName: "NowPayments",
            targetId: userId,
            targetName: user.username,
            details: `Deposit confirmed: $${priceUsd} USD → R$ ${robuxAmount} (${data.pay_currency?.toUpperCase()})`,
          });
          logger.info({ userId, robuxAmount }, "Balance credited");
        }
      }
    }

    res.json({ ok: true });
  },
);

export default router;
