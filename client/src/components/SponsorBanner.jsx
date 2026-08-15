import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function SponsorBanner() {
  const [sponsor, setSponsor] = useState(null);

  useEffect(() => {
    api
      .get('/sponsors/featured')
      .then(setSponsor)
      .catch(() => setSponsor(null));
  }, []);

  if (!sponsor) return null;

  return (
    <div
      className="card"
      style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        background: 'var(--color-gold-light)',
        borderColor: '#ecd9ae',
      }}
    >
      <span className="tag-gold tag">Featured Sponsor</span>
      <div style={{ flex: 1 }}>
        <strong>{sponsor.business_name}</strong>
        {sponsor.category && <span className="text-muted"> · {sponsor.category}</span>}
      </div>
      {sponsor.website && (
        <a href={sponsor.website} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
          Visit
        </a>
      )}
    </div>
  );
}

export function SponsorSidebar({ excludeId }) {
  const [sponsors, setSponsors] = useState([]);

  useEffect(() => {
    api
      .get('/sponsors')
      .then((list) => setSponsors(list.filter((s) => s.id !== excludeId).slice(0, 3)))
      .catch(() => setSponsors([]));
  }, [excludeId]);

  if (sponsors.length === 0) return null;

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-muted)' }}>
        Sponsored
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {sponsors.map((s) => (
          <a
            key={s.id}
            href={s.website || '#'}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
          >
            <strong style={{ display: 'block' }}>{s.business_name}</strong>
            {s.category && <span className="text-muted" style={{ fontSize: '0.85rem' }}>{s.category}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}
