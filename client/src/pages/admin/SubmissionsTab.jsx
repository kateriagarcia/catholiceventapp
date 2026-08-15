import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { categoryLabel, formatDateTime } from '../../lib/constants';

export default function SubmissionsTab() {
  const [status, setStatus] = useState('pending');
  const [submissions, setSubmissions] = useState([]);
  const [dioceses, setDioceses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [newParishDiocese, setNewParishDiocese] = useState({});

  function load() {
    setLoading(true);
    api
      .get('/submissions', { status })
      .then(setSubmissions)
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, [status]);
  useEffect(() => {
    api.get('/dioceses').then(setDioceses).catch(() => setDioceses([]));
  }, []);

  async function approve(submission) {
    setBusyId(submission.id);
    try {
      const body = {};
      if (!submission.parish_id) {
        const dioceseId = newParishDiocese[submission.id];
        if (!dioceseId) {
          alert('Pick a diocese for the new parish before approving.');
          setBusyId(null);
          return;
        }
        body.diocese_id = dioceseId;
      }
      await api.post(`/submissions/${submission.id}/approve`, body);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function reject(submission) {
    setBusyId(submission.id);
    try {
      await api.post(`/submissions/${submission.id}/reject`, {});
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} className={`chip ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {!loading && submissions.length === 0 && <div className="empty-state">No {status} submissions.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {submissions.map((s) => (
          <div key={s.id} className="card" style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>{s.title}</strong> <span className="tag">{categoryLabel(s.category)}</span>
                <div className="text-muted" style={{ fontSize: '0.9rem' }}>
                  {formatDateTime(s.start_datetime)} · {s.parish_name || s.parish_name_text} · submitted by {s.submitted_by_email}
                </div>
                {s.description && <p style={{ marginTop: '0.5rem', marginBottom: 0 }}>{s.description}</p>}
                {s.audience_tags?.length > 0 && (
                  <div style={{ marginTop: '0.4rem' }}>
                    {s.audience_tags.map((t) => (
                      <span key={t} className="tag tag-gold" style={{ marginRight: '0.3rem' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {status === 'pending' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
                  {!s.parish_id && (
                    <select
                      value={newParishDiocese[s.id] || ''}
                      onChange={(e) => setNewParishDiocese((m) => ({ ...m, [s.id]: e.target.value }))}
                    >
                      <option value="">New parish — pick diocese…</option>
                      {dioceses.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary btn-sm" disabled={busyId === s.id} onClick={() => approve(s)}>
                      Approve
                    </button>
                    <button className="btn btn-danger btn-sm" disabled={busyId === s.id} onClick={() => reject(s)}>
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
