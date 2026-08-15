import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import SubmissionsTab from './SubmissionsTab';
import SponsorsTab from './SponsorsTab';
import DiocesesTab from './DiocesesTab';
import ParishesTab from './ParishesTab';
import EventsTab from './EventsTab';

const TABS = [
  { key: 'submissions', label: 'Submissions' },
  { key: 'sponsors', label: 'Sponsors' },
  { key: 'events', label: 'Events' },
  { key: 'parishes', label: 'Parishes' },
  { key: 'dioceses', label: 'Dioceses' },
];

export default function AdminPage() {
  const [authState, setAuthState] = useState('checking'); // checking | out | in
  const [tab, setTab] = useState('submissions');

  useEffect(() => {
    api
      .get('/admin/me')
      .then(() => setAuthState('in'))
      .catch(() => setAuthState('out'));
  }, []);

  if (authState === 'checking') {
    return <div className="container" style={{ padding: '2rem 1.25rem' }}>Loading…</div>;
  }

  if (authState === 'out') {
    return <AdminLogin onLoggedIn={() => setAuthState('in')} />;
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button
          className="btn btn-secondary btn-sm"
          onClick={async () => {
            await api.post('/admin/logout');
            setAuthState('out');
          }}
        >
          Log out
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} className={`chip ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'submissions' && <SubmissionsTab />}
      {tab === 'sponsors' && <SponsorsTab />}
      {tab === 'events' && <EventsTab />}
      {tab === 'parishes' && <ParishesTab />}
      {tab === 'dioceses' && <DiocesesTab />}
    </div>
  );
}

function AdminLogin({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/admin/login', { username, password });
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ padding: '3rem 1.25rem', maxWidth: 400 }}>
      <h1 style={{ fontSize: '1.4rem' }}>Admin Login</h1>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        <div className="field">
          <label htmlFor="username">Username</label>
          <input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
