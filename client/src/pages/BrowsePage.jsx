import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import AudienceTagPicker from '../components/AudienceTagPicker';
import MapView from '../components/MapView';
import { CATEGORIES } from '../lib/constants';

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dioceses, setDioceses] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

  const q = searchParams.get('q') || '';
  const dioceseId = searchParams.get('diocese_id') || '';
  const category = searchParams.get('category') || '';
  const startAfter = searchParams.get('start_after') || '';
  const startBefore = searchParams.get('start_before') || '';
  const audienceTags = (searchParams.get('audience_tags') || '').split(',').filter(Boolean);

  useEffect(() => {
    api.get('/dioceses').then(setDioceses).catch(() => setDioceses([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get('/events', {
        q: q || undefined,
        diocese_id: dioceseId || undefined,
        category: category || undefined,
        start_after: startAfter || undefined,
        start_before: startBefore || undefined,
        audience_tags: audienceTags.length > 0 ? audienceTags.join(',') : undefined,
      })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, dioceseId, category, startAfter, startBefore, searchParams.get('audience_tags')]);

  function updateParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  }

  return (
    <div className="container browse-layout" style={{ padding: '2rem 1.25rem' }}>
      <aside>
        <h2 style={{ fontSize: '1.1rem' }}>Filters</h2>

        <div className="field">
          <label htmlFor="q">Keyword</label>
          <input id="q" value={q} onChange={(e) => updateParam('q', e.target.value)} placeholder="Parish, city, title…" />
        </div>

        <div className="field">
          <label htmlFor="diocese">Diocese</label>
          <select id="diocese" value={dioceseId} onChange={(e) => updateParam('diocese_id', e.target.value)}>
            <option value="">All dioceses</option>
            {dioceses.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => updateParam('category', e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="start-after">From</label>
          <input id="start-after" type="date" value={startAfter} onChange={(e) => updateParam('start_after', e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="start-before">To</label>
          <input id="start-before" type="date" value={startBefore} onChange={(e) => updateParam('start_before', e.target.value)} />
        </div>

        <div className="field">
          <label>Audience</label>
          <AudienceTagPicker value={audienceTags} onChange={(tags) => updateParam('audience_tags', tags.join(','))} />
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSearchParams({})}>
          Clear filters
        </button>
      </aside>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.4rem', margin: 0 }}>
            {loading ? 'Searching…' : `${events.length} event${events.length === 1 ? '' : 's'} found`}
          </h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className={`chip ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>
              List
            </button>
            <button type="button" className={`chip ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>
              Map
            </button>
          </div>
        </div>

        {!loading && events.length === 0 && <div className="empty-state">No events match those filters yet.</div>}

        {view === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <MapView events={events} />
        )}
      </div>
    </div>
  );
}
