import { Link } from 'react-router-dom';
import { categoryLabel, audienceLabel, formatDateTime } from '../lib/constants';

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="card"
      style={{ display: 'block', padding: '1.1rem 1.25rem', color: 'inherit' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
            {formatDateTime(event.start_datetime)}
            {event.distance_miles != null && ` · ${event.distance_miles.toFixed(1)} mi away`}
          </div>
          <h3 style={{ margin: '0.15rem 0 0.3rem', fontSize: '1.1rem' }}>{event.title}</h3>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            {event.parish_name}
            {event.diocese_state ? `, ${event.diocese_state}` : ''}
          </div>
        </div>
        <span className="tag">{categoryLabel(event.category)}</span>
      </div>
      {event.audience_tags?.length > 0 && (
        <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {event.audience_tags.map((t) => (
            <span key={t} className="tag tag-gold">
              {audienceLabel(t)}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
