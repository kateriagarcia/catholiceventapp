import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = { name: '', state: '', website: '' };

export default function DiocesesTab() {
  const [dioceses, setDioceses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api.get('/dioceses').then(setDioceses).catch(() => setDioceses([])).finally(() => setLoading(false));
  }
  useEffect(load, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }
  function startEdit(d) {
    setEditingId(d.id);
    setForm({ name: d.name, state: d.state, website: d.website || '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editingId) await api.put(`/dioceses/${editingId}`, form);
    else await api.post('/dioceses', form);
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this diocese and all of its parishes/events?')) return;
    await api.del(`/dioceses/${id}`);
    load();
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={startNew} style={{ marginBottom: '1rem' }}>
        + Add diocese
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>State</label>
              <input required value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} />
            </div>
            <div className="field">
              <label>Website</label>
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Create diocese'}
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
              <th>State</th>
              <th>Website</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {dioceses.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.state}</td>
                <td>{d.website}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(d)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(d.id)}>
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
