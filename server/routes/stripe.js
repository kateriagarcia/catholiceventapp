const express = require('express');
const db = require('../db');

const router = express.Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Lazy require so the app runs fine with Stripe unconfigured.
  const Stripe = require('stripe');
  return new Stripe(key);
}

const TIER_PRICE_ENV = {
  standard: 'STRIPE_PRICE_STANDARD',
  featured: 'STRIPE_PRICE_FEATURED',
};

// Self-serve sponsor signup: creates a Stripe Checkout subscription session.
// Sponsor record is created/activated by the webhook once payment succeeds,
// so there's no manual account management on the operator's end.
router.post('/checkout-session', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured on this server yet' });

  const { tier, business_name, contact_email, website, category } = req.body;
  if (!['standard', 'featured'].includes(tier)) {
    return res.status(400).json({ error: 'tier must be "standard" or "featured"' });
  }
  if (!business_name || !contact_email) {
    return res.status(400).json({ error: 'business_name and contact_email are required' });
  }

  const priceId = process.env[TIER_PRICE_ENV[tier]];
  if (!priceId) {
    return res.status(503).json({ error: `No Stripe price configured for tier "${tier}" (set ${TIER_PRICE_ENV[tier]})` });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: contact_email,
      success_url: process.env.CLIENT_SUCCESS_URL || 'http://localhost:5173/sponsor/success',
      cancel_url: process.env.CLIENT_CANCEL_URL || 'http://localhost:5173/sponsor',
      metadata: { tier, business_name, website: website || '', category: category || '' },
      subscription_data: {
        metadata: { tier, business_name, website: website || '', category: category || '' },
      },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err.message);
    res.status(500).json({ error: 'Could not start checkout' });
  }
});

// Stripe webhook — mounted with express.raw() in index.js so the signature
// can be verified against the exact request body.
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).end();

  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const meta = session.metadata || {};
      const activeUntil = new Date();
      activeUntil.setDate(activeUntil.getDate() + 31);
      db.prepare(
        `INSERT INTO sponsors (business_name, category, website, tier, active_until, status, contact_email, stripe_customer_id, stripe_subscription_id)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?)`
      ).run(
        meta.business_name || 'New Sponsor',
        meta.category || null,
        meta.website || null,
        meta.tier || 'standard',
        activeUntil.toISOString().slice(0, 10),
        session.customer_email || null,
        session.customer,
        session.subscription
      );
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'inactive';
      db.prepare('UPDATE sponsors SET status = ? WHERE stripe_subscription_id = ?').run(status, sub.id);
      break;
    }
    default:
      break;
  }

  res.json({ received: true });
});

module.exports = router;
