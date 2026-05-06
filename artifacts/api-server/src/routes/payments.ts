import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

const NOWPAYMENTS_API_KEY = process.env["NOWPAYMENTS_API_KEY"] ?? "";
const NOWPAYMENTS_BASE = "https://api.nowpayments.io/v1";

function nowHeaders() {
  return {
    "x-api-key": NOWPAYMENTS_API_KEY,
    "Content-Type": "application/json",
  };
}

router.get("/payments/status", (_req, res) => {
  if (!NOWPAYMENTS_API_KEY) {
    res.json({ configured: false });
    return;
  }
  res.json({ configured: true });
});

router.get("/payments/currencies", async (_req, res) => {
  if (!NOWPAYMENTS_API_KEY) {
    res.status(503).json({ error: "NOWPAYMENTS_API_KEY not configured" });
    return;
  }
  try {
    const r = await fetch(`${NOWPAYMENTS_BASE}/currencies`, { headers: nowHeaders() });
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
  const { payCurrency, priceAmount } = req.body as {
    payCurrency?: string;
    priceAmount?: number;
  };
  if (!payCurrency || !priceAmount || priceAmount <= 0) {
    res.status(400).json({ error: "payCurrency and priceAmount are required" });
    return;
  }
  try {
    const body = {
      price_amount: priceAmount,
      price_currency: "usd",
      pay_currency: payCurrency.toLowerCase(),
      order_id: `rift-${req.user.id}-${Date.now()}`,
      order_description: `Riftflip deposit for ${req.user.username}`,
      success_url: `${req.headers.origin ?? ""}/wallet?deposit=success`,
      cancel_url: `${req.headers.origin ?? ""}/wallet?deposit=cancelled`,
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
    if (data.error) {
      res.status(400).json({ error: data.error });
      return;
    }
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
      error?: string;
    };
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

export default router;
