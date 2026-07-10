import { createHmac, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function getRazorpayKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() ?? '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() ?? '';
  return { keyId, keySecret };
}

function basicAuth(keyId: string, keySecret: string) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
}

/** POST /api/payments/order — create a Razorpay order */
router.post('/order', async (req, res) => {
  const { keyId: envKeyId, keySecret } = getRazorpayKeys();

  const body = req.body as {
    amount: number;        // in rupees
    currency?: string;
    purpose?: string;
    razorpayKeyId?: string; // allow frontend to supply key for first-time setup
  };

  const keyId = body.razorpayKeyId?.trim() || envKeyId;

  if (!keyId || !keySecret) {
    res.status(400).json({
      ok: false,
      message: 'Razorpay Key ID and Secret are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.',
    });
    return;
  }

  const amountPaise = Math.round((body.amount ?? 0) * 100);
  if (amountPaise <= 0) {
    res.status(400).json({ ok: false, message: 'Amount must be greater than 0' });
    return;
  }

  try {
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: basicAuth(keyId, keySecret),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: body.currency ?? 'INR',
        receipt: `sgpro_${randomUUID().slice(0, 8)}`,
        notes: { purpose: body.purpose ?? 'SG Pro Growth payment' },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!rzpRes.ok) {
      const err = (await rzpRes.json()) as { error?: { description?: string } };
      res.status(502).json({ ok: false, message: err.error?.description ?? 'Razorpay order creation failed' });
      return;
    }

    const order = (await rzpRes.json()) as {
      id: string; amount: number; currency: string; status: string;
    };

    res.json({ ok: true, orderId: order.id, amount: order.amount, currency: order.currency, keyId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(502).json({ ok: false, message: `Payment error: ${msg}` });
  }
});

/** POST /api/payments/verify — verify payment signature after checkout */
router.post('/verify', (req, res) => {
  const { keySecret } = getRazorpayKeys();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body as {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    res.status(400).json({ ok: false, message: 'Missing payment verification fields' });
    return;
  }

  const expected = createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const valid = expected === razorpay_signature;
  res.json({
    ok: valid,
    message: valid ? `Payment ${razorpay_payment_id} verified successfully` : 'Payment signature mismatch',
    paymentId: razorpay_payment_id,
  });
});

/** GET /api/payments/config — return public key for frontend */
router.get('/config', (_req, res) => {
  const { keyId } = getRazorpayKeys();
  res.json({ configured: Boolean(keyId), keyId: keyId || null });
});

export default router;
