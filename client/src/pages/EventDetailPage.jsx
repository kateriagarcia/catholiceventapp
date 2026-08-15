import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, API_URL } from '../api/client';
import { categoryLabel, audienceLabel, formatDateTime } from '../lib/constants';
import { SponsorSidebar } from '../components/SponsorBanner';

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setEvent(null);
    setError(null);
    api
      .get(`/events/${id}`)
      .then(setEvent)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="container" style={{ padding: '2rem 1.25rem' }}><div className="error-banner">{error}</div></div>;
  if (!event) return <div className="container" style={{ padding: '2rem 1.25rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem' }}>
      <div>
        <div style={{ marginBottom: '0.75rem' }}>
          <span className="tag">{categoryLabel(event.category)}</span>
        </div>
        <h1 style={{ fontSize: '1.9rem' }}>{event.title}</h1>
        <p className="text-muted" style={{ fontSize: '1.05rem' }}>
          {formatDateTime(event.start_datetime)}
          {event.end_datetime && ` – ${formatDateTime(event.end_datetime)}`}
        </p>

        {event.is_recurring && (
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Recurring: {event.recurrence_rule}</p>
        )}

        {event.audience_tags?.length > 0 && (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.75rem 0' }}>
            {event.audience_tags.map((t) => (
              <span key={t} className="tag tag-gold">
                {audienceLabel(t)}
              </span>
            ))}
          </div>
        )}

        <a href={`${API_URL}/events/${event.id}/ics`} className="btn btn-primary" style={{ margin: '1rem 0' }}>
          📅 Add to Calendar
        </a>

        {event.description && (
          <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>About this event</h3>
            <p style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{event.description}</p>
          </div>
        )}

        <div className="card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1rem' }}>
            <Link to={`/parishes/${event.parish_id}`}>{event.parish_name}</Link>
            {event.parish_verified ? <span className="badge-verified" style={{ marginLeft: '0.5rem' }}>✓ Verified</span> : null}
          </h3>
          {event.parish_address && <p style={{ marginBottom: '0.25rem' }}>{event.parish_address}</p>}
          {event.parish_phone && <p style={{ marginBottom: '0.25rem' }}>📞 {event.parish_phone}</p>}
          {event.parish_website && (
            <p style={{ marginBottom: 0 }}>
              <a href={event.parish_website} target="_blank" rel="noreferrer">
                {event.parish_website}
              </a>
            </p>
          )}
          <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>
            <Link to={`/dioceses/${event.diocese_id}`}>{event.diocese_name} →</Link>
          </p>
        </div>
      </div>

      <aside>
        <SponsorSidebar />
      </aside>
    </div>
  );
}
