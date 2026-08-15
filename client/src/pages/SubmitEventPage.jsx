import { useEffect, useState } from 'react';
import { api } from '../api/client';
import AudienceTagPicker from '../components/AudienceTagPicker';
import { CATEGORIES } from '../lib/constants';

const initialForm = {
  parish_id: '',
  parish_name_text: '',
  parish_address_text: '',
  title: '',
  description: '',
  category: 'feast',
  start_datetime: '',
  end_datetime: '',
  is_recurring: false,
  recurrence_rule: '',
  submitted_by_email: '',
  website_url: '', // honeypot — left blank by real users
};

export default function SubmitEventPage() {
  const [parishes, setParishes] = useState([]);
  const [parishKnown, setParishKnown] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [audienceTags, setAudienceTags] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    api.get('/parishes').then(setParishes).catch(() => setParishes([]));
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrors([]);
    try {
      await api.post('/submissions', {
        ...form,
        parish_id: parishKnown && form.parish_id ? Number(form.parish_id) : null,
        parish_name_text: parishKnown ? null : form.parish_name_text,
        parish_address_text: parishKnown ? null : form.parish_address_text,
        audience_tags: audienceTags,
        end_datetime: form.end_datetime || null,
      });
      setStatus('success');
      setForm(initialForm);
      setAudienceTags([]);
    } catch (err) {
      setStatus('error');
      setErrors(err.errors || [err.message]);
    }
  }

  if (status === 'success') {
    return (
      <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: 640 }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.4rem' }}>Thanks — your event was submitted!</h1>
          <p className="text-muted">
            It's now pending review. Once approved, it'll appear on the site.
          </p>
          <button className="btn btn-primary" onClick={() => setStatus('idle')}>
            Submit another event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.25rem', maxWidth: 640 }}>
      <h1>Submit an Event</h1>
      <p className="text-muted">
        Share a parish event with the community. Submissions are reviewed before they go live.
      </p>

      {errors.length > 0 && (
        <div className="error-banner">
          {errors.map((err) => (
            <div key={err}>{err}</div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem' }}>
        {/* Honeypot: hidden from real users via CSS, invisible to screen readers via aria-hidden/tabIndex */}
        <div className="honeypot-field" aria-hidden="true">
          <label htmlFor="website_url">Website</label>
          <input
            id="website_url"
            name="website_url"
            tabIndex={-1}
            autoComplete="off"
            value={form.website_url}
            onChange={(e) => setField('website_url', e.target.value)}
          />
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={parishKnown}
              onChange={(e) => setParishKnown(e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            My parish is already listed
          </label>
        </div>

        {parishKnown ? (
          <div className="field">
            <label htmlFor="parish_id">Parish</label>
            <select id="parish_id" required value={form.parish_id} onChange={(e) => setField('parish_id', e.target.value)}>
              <option value="">Select a parish…</option>
              {parishes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.address}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <div className="field">
              <label htmlFor="parish_name_text">Parish name</label>
              <input
                id="parish_name_text"
                required
                value={form.parish_name_text}
                onChange={(e) => setField('parish_name_text', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="parish_address_text">Parish address</label>
              <input
                id="parish_address_text"
                value={form.parish_address_text}
                onChange={(e) => setField('parish_address_text', e.target.value)}
              />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="title">Event title</label>
          <input id="title" required value={form.title} onChange={(e) => setField('title', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={form.category} onChange={(e) => setField('category', e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="start_datetime">Start</label>
            <input
              id="start_datetime"
              type="datetime-local"
              required
              value={form.start_datetime}
              onChange={(e) => setField('start_datetime', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="end_datetime">End (optional)</label>
            <input
              id="end_datetime"
              type="datetime-local"
              value={form.end_datetime}
              onChange={(e) => setField('end_datetime', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => setField('is_recurring', e.target.checked)}
              style={{ marginRight: '0.5rem' }}
            />
            This event repeats
          </label>
        </div>
        {form.is_recurring && (
          <div className="field">
            <label htmlFor="recurrence_rule">Recurrence details</label>
            <input
              id="recurrence_rule"
              placeholder="e.g. Every Friday during Lent"
              value={form.recurrence_rule}
              onChange={(e) => setField('recurrence_rule', e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label>Audience</label>
          <AudienceTagPicker value={audienceTags} onChange={setAudienceTags} />
        </div>

        <div className="field">
          <label htmlFor="submitted_by_email">Your email</label>
          <input
            id="submitted_by_email"
            type="email"
            required
            value={form.submitted_by_email}
            onChange={(e) => setField('submitted_by_email', e.target.value)}
          />
          <span className="field-hint">Only used if we have a question about this submission.</span>
        </div>

        <button type="submit" className="btn btn-primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Submitting…' : 'Submit event for review'}
        </button>
      </form>
    </div>
  );
}
