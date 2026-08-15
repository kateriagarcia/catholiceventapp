import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import EventCard from '../components/EventCard';
import SponsorBanner from '../components/SponsorBanner';
import AudienceTagPicker from '../components/AudienceTagPicker';

export default function HomePage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [startAfter, setStartAfter] = useState('');
  const [startBefore, setStartBefore] = useState('');
  const [audienceTags, setAudienceTags] = useState([]);
  const [geo, setGeo] = useState(null);
  const [geoStatus, setGeoStatus] = useState('idle');

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 9 };
    if (geo) {
      params.lat = geo.lat;
      params.lng = geo.lng;
      params.radius_miles = 75;
    }
    api
      .get('/events', params)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [geo]);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('unsupported');
      return;
    }
    setGeoStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus('done');
      },
      () => setGeoStatus('denied'),
      { timeout: 8000 }
    );
  }

  function handleSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('q', location);
    if (startAfter) params.set('start_after', startAfter);
    if (startBefore) params.set('start_before', startBefore);
    if (audienceTags.length > 0) params.set('audience_tags', audienceTags.join(','));
    navigate(`/browse?${params.toString()}`);
  }

  return (
    <div>
      <section
        style={{
          background: 'linear-gradient(180deg, var(--color-primary-light), var(--color-bg))',
          padding: '3rem 0 2.5rem',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div className="container">
          <h1 style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>Find a Catholic parish event near you</h1>
          <p className="text-muted" style={{ maxWidth: 560, marginBottom: '1.75rem' }}>
            Feast days, adoration, fish fries, novenas, retreats, and festivals — search by location, date, and who
            it's for.
          </p>

          <form onSubmit={handleSearch} className="card" style={{ padding: '1.25rem', maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="location">Location or keyword</label>
                <input
                  id="location"
                  placeholder="City, parish, state…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="start-after">From</label>
                <input id="start-after" type="date" value={startAfter} onChange={(e) => setStartAfter(e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label htmlFor="start-before">To</label>
                <input id="start-before" type="date" value={startBefore} onChange={(e) => setStartBefore(e.target.value)} />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', display: 'block', marginBottom: '0.4rem' }}>
                Audience
              </label>
              <AudienceTagPicker value={audienceTags} onChange={setAudienceTags} />
            </div>

            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="submit" className="btn btn-primary">
                Search events
              </button>
              <button type="button" className="btn btn-secondary" onClick={useMyLocation} disabled={geoStatus === 'locating'}>
                {geoStatus === 'locating' ? <span className="spinner-inline" /> : '📍'} Use my location
              </button>
              {geoStatus === 'denied' && <span className="text-muted" style={{ fontSize: '0.85rem' }}>Location access denied.</span>}
              {geoStatus === 'unsupported' && <span className="text-muted" style={{ fontSize: '0.85rem' }}>Geolocation isn't supported here.</span>}
            </div>
          </form>
        </div>
      </section>

      <div className="container" style={{ padding: '2rem 1.25rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <SponsorBanner />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.3rem' }}>{geo ? 'Upcoming events near you' : 'Upcoming events'}</h2>
          <a href="/browse">See all →</a>
        </div>

        {loading && <p className="text-muted">Loading events…</p>}
        {!loading && events.length === 0 && (
          <div className="empty-state">No upcoming events yet — check back soon.</div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
