import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import EventCard from '../components/EventCard';

export default function DiocesePage() {
  const { id } = useParams();
  const [diocese, setDiocese] = useState(null);
  const [parishes, setParishes] = useState([]);
  const [events, setEvents] = useState([]);
  const [parishFilter, setParishFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dioceses/${id}`).then(setDiocese).catch(() => setDiocese(null));
    api.get(`/dioceses/${id}/parishes`).then(setParishes).catch(() => setParishes([]));
  }, [id]);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/dioceses/${id}/events`, { parish_id: parishFilter || undefined })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [id, parishFilter]);

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <h1>{diocese ? diocese.name : 'Diocese'}</h1>
      {diocese?.website && (
        <p>
          <a href={diocese.website} target="_blank" rel="noreferrer">
            {diocese.website}
          </a>
        </p>
      )}

      <div className="field" style={{ maxWidth: 320, marginTop: '1.5rem' }}>
        <label htmlFor="parish-filter">Browse by parish</label>
        <select id="parish-filter" value={parishFilter} onChange={(e) => setParishFilter(e.target.value)}>
          <option value="">All parishes</option>
          {parishes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <h2 style={{ fontSize: '1.2rem', marginTop: '1.5rem' }}>
        {loading ? 'Loading…' : `${events.length} upcoming event${events.length === 1 ? '' : 's'}`}
      </h2>
      {!loading && events.length === 0 && <div className="empty-state">No upcoming events in this diocese yet.</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {events.map((event) => (
          <EventCard key={event.id} event={{ ...event, parish_name: event.parish_name }} />
        ))}
      </div>
    </div>
  );
}
