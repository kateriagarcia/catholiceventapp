import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = { name: '', diocese_id: '', address: '', lat: '', lng: '', website: '', phone: '', is_verified: false };

export default function ParishesTab() {
  const [parishes, setParishes] = useState([]);
  const [dioceses, setDioceses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api.get('/parishes').then(setParishes).catch(() => setParishes([])).finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => {
    api.get('/dioceses').then(setDioceses).catch(() => setDioceses([]));
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function startEdit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      diocese_id: p.diocese_id,
      address: p.address || '',
      lat: p.lat ?? '',
      lng: p.lng ?? '',
      website: p.website || '',
      phone: p.phone || '',
      is_verified: p.is_verified,
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const body = {
      ...form,
      diocese_id: Number(form.diocese_id),
      lat: form.lat === '' ? null : Number(form.lat),
      lng: form.lng === '' ? null : Number(form.lng),
    };
    if (editingId) await api.put(`/parishes/${editingId}`, body);
    else await api.post('/parishes', body);
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this parish and all of its events?')) return;
    await api.del(`/parishes/${id}`);
    load();
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={startNew} style={{ marginBottom: '1rem' }}>
        + Add parish
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Diocese</label>
              <select required value={form.diocese_id} onChange={(e) => setForm((f) => ({ ...f, diocese_id: e.target.value }))}>
                <option value="">Select…</option>
                {dioceses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="field">
              <label>Latitude</label>
              <input value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} />
            </div>
            <div className="field">
              <label>Longitude</label>
              <input value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} />
            </div>
            <div className="field">
              <label>Website</label>
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_verified}
                  onChange={(e) => setForm((f) => ({ ...f, is_verified: e.target.checked }))}
                  style={{ marginRight: '0.5rem' }}
                />
                Verified parish
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Create parish'}
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
              <th>Name</th>
              <th>Diocese</th>
              <th>Verified</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {parishes.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.diocese_name}</td>
                <td>{p.is_verified ? '✓' : ''}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(p.id)}>
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
