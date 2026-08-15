import { Link, NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <>
      <header
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          className="container"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, gap: '1rem' }}
        >
          <Link
            to="/"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 700, fontSize: '1.25rem', color: 'var(--color-primary)' }}
          >
            ✚ Parish Event Finder
          </Link>
          <nav style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', fontWeight: 600, fontSize: '0.95rem' }}>
            <NavLink to="/browse" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
              Browse
            </NavLink>
            <NavLink to="/submit" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
              Submit an Event
            </NavLink>
            <NavLink to="/sponsor" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
              Sponsors
            </NavLink>
          </nav>
        </div>
      </header>
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--color-border)', marginTop: '3rem', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem' }}>
          <span>&copy; {new Date().getFullYear()} Parish Event Finder</span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/submit">Submit an Event</Link>
            <Link to="/sponsor">Become a Sponsor</Link>
            <Link to="/admin">Admin</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
