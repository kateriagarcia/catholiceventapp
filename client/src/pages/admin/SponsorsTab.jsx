import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = { business_name: '', category: '', website: '', logo_url: '', tier: 'standard', active_until: '', contact_email: '', status: 'active' };

export default function SponsorsTab() {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api
      .get('/sponsors/admin')
      .then(setSponsors)
      .catch(() => setSponsors([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function startEdit(sponsor) {
    setEditingId(sponsor.id);
    setForm({ ...emptyForm, ...sponsor });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) {
      await api.put(`/sponsors/${editingId}`, form);
    } else {
      await api.post('/sponsors', form);
    }
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this sponsor?')) return;
    await api.del(`/sponsors/${id}`);
    load();
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={startNew} style={{ marginBottom: '1rem' }}>
        + Add sponsor
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field">
              <label>Business name</label>
              <input required value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category || ''} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="field">
              <label>Website</label>
              <input value={form.website || ''} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="field">
              <label>Logo URL</label>
              <input value={form.logo_url || ''} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} />
            </div>
            <div className="field">
              <label>Tier</label>
              <select value={form.tier} onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}>
                <option value="standard">Standard</option>
                <option value="featured">Featured</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="past_due">Past due</option>
              </select>
            </div>
            <div className="field">
              <label>Active until</label>
              <input type="date" value={form.active_until || ''} onChange={(e) => setForm((f) => ({ ...f, active_until: e.target.value }))} />
            </div>
            <div className="field">
              <label>Contact email</label>
              <input value={form.contact_email || ''} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Create sponsor'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Business</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Active until</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sponsors.map((s) => (
              <tr key={s.id}>
                <td>{s.business_name}</td>
                <td>{s.tier}</td>
                <td>{s.status}</td>
                <td>{s.active_until || '—'}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(s.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
