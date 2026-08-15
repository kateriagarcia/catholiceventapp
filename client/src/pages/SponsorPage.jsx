import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';

const TIERS = [
  { value: 'standard', label: 'Standard', price: '$50–75/mo', blurb: 'Listed in the sponsor directory and event sidebars.' },
  { value: 'featured', label: 'Featured', price: '$100–150/mo', blurb: 'Everything in Standard, plus the homepage banner slot.' },
];

export default function SponsorPage() {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === '1' || window.location.pathname.endsWith('/success');

  const [form, setForm] = useState({ tier: 'standard', business_name: '', contact_email: '', website: '', category: '' });
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);
    try {
      const { url } = await api.post('/stripe/checkout-session', form);
      window.location.href = url;
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  }

  if (isSuccess) {
    return (
      <div className="container" style={{ padding: '3rem 1.25rem', maxWidth: 640, textAlign: 'center' }}>
        <h1>Welcome aboard!</h1>
        <p className="text-muted">
          Thanks for sponsoring the Parish Event Finder. Your listing will appear on the site shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: 720 }}>
      <h1>Sponsor the Parish Event Finder</h1>
      <p className="text-muted">
        Reach Catholics actively looking for events near them. Founding sponsors get a discounted rate (e.g. $25/mo)
        for the first 5–10 sponsors in exchange for an early commitment and testimonial.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
        {TIERS.map((t) => (
          <div key={t.value} className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem' }}>{t.label}</h3>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0.25rem 0' }}>{t.price}</p>
            <p className="text-muted" style={{ marginBottom: 0 }}>{t.blurb}</p>
          </div>
        ))}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        <div className="field">
          <label htmlFor="tier">Sponsorship tier</label>
          <select id="tier" value={form.tier} onChange={(e) => setField('tier', e.target.value)}>
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label} — {t.price}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="business_name">Business name</label>
          <input id="business_name" required value={form.business_name} onChange={(e) => setField('business_name', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <input
            id="category"
            placeholder="e.g. Religious Goods, Catering, Retreat Center"
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="website">Website</label>
          <input id="website" type="url" placeholder="https://" value={form.website} onChange={(e) => setField('website', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="contact_email">Contact email</label>
          <input
            id="contact_email"
            type="email"
            required
            value={form.contact_email}
            onChange={(e) => setField('contact_email', e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Redirecting to checkout…' : 'Continue to payment'}
        </button>
        <p className="field-hint" style={{ marginTop: '0.75rem' }}>
          You'll be redirected to Stripe to complete your subscription securely.
        </p>
      </form>
    </div>
  );
}
