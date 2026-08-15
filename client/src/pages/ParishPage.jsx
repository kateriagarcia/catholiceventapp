import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import EventCard from '../components/EventCard';

export default function ParishPage() {
  const { id } = useParams();
  const [parish, setParish] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/parishes/${id}`).then(setParish).catch(() => setParish(null));
    api
      .get(`/parishes/${id}/events`)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [id]);

  if (!parish) return <div className="container" style={{ padding: '2rem 1.25rem' }}>Loading…</div>;

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {parish.name}
        {parish.is_verified && <span className="badge-verified">✓ Verified</span>}
      </h1>
      <p className="text-muted">
        <Link to={`/dioceses/${parish.diocese_id}`}>{parish.diocese_name}</Link>
      </p>
      {parish.address && <p>{parish.address}</p>}
      {parish.phone && <p>📞 {parish.phone}</p>}
      {parish.website && (
        <p>
          <a href={parish.website} target="_blank" rel="noreferrer">
            {parish.website}
          </a>
        </p>
      )}

      <h2 style={{ fontSize: '1.2rem', marginTop: '2rem' }}>
        {loading ? 'Loading…' : `${events.length} upcoming event${events.length === 1 ? '' : 's'}`}
      </h2>
      {!loading && events.length === 0 && <div className="empty-state">No upcoming events for this parish yet.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {events.map((event) => (
          <EventCard key={event.id} event={{ ...event, parish_name: parish.name }} />
        ))}
      </div>
    </div>
  );
}
