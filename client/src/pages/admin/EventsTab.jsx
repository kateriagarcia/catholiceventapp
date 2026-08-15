import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { CATEGORIES, formatDateTime } from '../../lib/constants';
import AudienceTagPicker from '../../components/AudienceTagPicker';

const emptyForm = {
  parish_id: '',
  title: '',
  description: '',
  category: 'feast',
  start_datetime: '',
  end_datetime: '',
  is_recurring: false,
  recurrence_rule: '',
  is_active: true,
};

export default function EventsTab() {
  const [events, setEvents] = useState([]);
  const [parishes, setParishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [audienceTags, setAudienceTags] = useState([]);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    api
      .get('/events', { include_past: '1', limit: 200 })
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);
  useEffect(() => {
    api.get('/parishes').then(setParishes).catch(() => setParishes([]));
  }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setAudienceTags([]);
    setShowForm(true);
  }
  function startEdit(ev) {
    setEditingId(ev.id);
    setForm({
      parish_id: ev.parish_id,
      title: ev.title,
      description: ev.description || '',
      category: ev.category,
      start_datetime: ev.start_datetime?.slice(0, 16),
      end_datetime: ev.end_datetime?.slice(0, 16) || '',
      is_recurring: ev.is_recurring,
      recurrence_rule: ev.recurrence_rule || '',
      is_active: ev.is_active,
    });
    setAudienceTags(ev.audience_tags || []);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const body = { ...form, parish_id: Number(form.parish_id), audience_tags: audienceTags, end_datetime: form.end_datetime || null };
    if (editingId) await api.put(`/events/${editingId}`, body);
    else await api.post('/events', body);
    setShowForm(false);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this event?')) return;
    await api.del(`/events/${id}`);
    load();
  }

  return (
    <div>
      <button className="btn btn-primary btn-sm" onClick={startNew} style={{ marginBottom: '1rem' }}>
        + Add event
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Parish</label>
              <select required value={form.parish_id} onChange={(e) => setForm((f) => ({ ...f, parish_id: e.target.value }))}>
                <option value="">Select…</option>
                {parishes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Title</label>
              <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  style={{ marginRight: '0.5rem' }}
                />
                Active
              </label>
            </div>
            <div className="field">
              <label>Start</label>
              <input
                type="datetime-local"
                required
                value={form.start_datetime}
                onChange={(e) => setForm((f) => ({ ...f, start_datetime: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>End</label>
              <input type="datetime-local" value={form.end_datetime} onChange={(e) => setForm((f) => ({ ...f, end_datetime: e.target.value }))} />
            </div>
            <div className="field">
              <label>
                <input
                  type="checkbox"
                  checked={form.is_recurring}
                  onChange={(e) => setForm((f) => ({ ...f, is_recurring: e.target.checked }))}
                  style={{ marginRight: '0.5rem' }}
                />
                Recurring
              </label>
            </div>
            {form.is_recurring && (
              <div className="field">
                <label>Recurrence rule</label>
                <input value={form.recurrence_rule} onChange={(e) => setForm((f) => ({ ...f, recurrence_rule: e.target.value }))} />
              </div>
            )}
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label>Audience</label>
              <AudienceTagPicker value={audienceTags} onChange={setAudienceTags} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Save changes' : 'Create event'}
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
              <th>Title</th>
              <th>Parish</th>
              <th>Start</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id}>
                <td>{ev.title}</td>
                <td>{ev.parish_name}</td>
                <td>{formatDateTime(ev.start_datetime)}</td>
                <td>{ev.is_active ? '✓' : ''}</td>
                <td style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(ev)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => remove(ev.id)}>
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
