import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './Journal.css';

const CATEGORIES = ['Gratitude', 'Anxiety', 'Goals', 'Reflection', 'Stress', 'Progress', 'Other'];
const MOOD_LABELS = { 1: '😩 Severely Down', 2: '😟 Anxious', 3: '😐 Neutral', 4: '🙂 Good', 5: '😀 Great' };
const MOOD_COLORS = { 1: 'var(--color-critical)', 2: 'var(--color-high)', 3: 'var(--color-moderate)', 4: 'var(--color-low)', 5: '#00f2fe' };

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [moodTag, setMoodTag] = useState(null);
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  // Read/expand state
  const [expandedId, setExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');

  const fetchEntries = async () => {
    try {
      const res = await api.get('/journal');
      setEntries(res.data.data || []);
    } catch (err) {
      setError('Could not load journal entries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setMoodTag(null);
    setCategory('');
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMoodTag(entry.moodTag);
    setCategory(entry.category || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { title, content, moodTag, category: category || null };
      if (editingEntry) {
        await api.put(`/journal/${editingEntry.id}`, payload);
        setSuccess('Entry updated! ✏️');
      } else {
        await api.post('/journal', payload);
        setSuccess('Entry saved! 📝');
      }
      resetForm();
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await api.delete(`/journal/${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      setError('Failed to delete entry.');
    }
  };

  const filteredEntries = filterCategory === 'All'
    ? entries
    : entries.filter(e => e.category === filterCategory);

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <span className="loading-spinner-lg">Loading journal...</span>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="journal-container">

        {/* Header */}
        <div className="journal-header">
          <div>
            <h1>📓 My Reflections Journal</h1>
            <p className="journal-subtitle">
              A private space to express your thoughts, track emotions, and celebrate progress.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            + New Entry
          </button>
        </div>

        {success && <div className="auth-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}
        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Write / Edit Form */}
        {showForm && (
          <div className="glass-card journal-form-card">
            <h3>{editingEntry ? '✏️ Edit Entry' : '✍️ Write New Entry'}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Entry Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Give this entry a title..."
                  required
                />
              </div>

              {/* Category + Mood Row */}
              <div className="journal-meta-row">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category</label>
                  <select
                    className="form-input select-dark"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    <option value="">— Select category —</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Mood Tag (optional)</label>
                  <div className="mood-tag-row">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`mood-tag-btn ${moodTag === v ? 'selected' : ''}`}
                        onClick={() => setMoodTag(prev => prev === v ? null : v)}
                        title={MOOD_LABELS[v]}
                      >
                        {Object.keys(MOOD_LABELS)[v - 1].split(' ')[0] === '1' ? '😩'
                          : v === 2 ? '😟' : v === 3 ? '😐' : v === 4 ? '🙂' : '😀'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="form-group">
                <label className="form-label">Your Reflection</label>
                <textarea
                  className="form-input journal-textarea"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write freely... this is your private space."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Entry'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm} style={{ flex: 1 }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar */}
        {entries.length > 0 && (
          <div className="journal-filter-bar">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-icon">📓</div>
            <h3>No Entries Yet</h3>
            <p>Start writing your first reflection. It's private, safe, and just for you.</p>
          </div>
        ) : (
          <div className="journal-entries-grid">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="glass-card journal-entry-card">
                <div className="journal-entry-header">
                  <div className="journal-entry-meta">
                    {entry.category && (
                      <span className="category-chip">{entry.category}</span>
                    )}
                    {entry.moodTag && (
                      <span className="mood-tag-display" style={{ color: MOOD_COLORS[entry.moodTag] }}>
                        {entry.moodTag === 1 ? '😩' : entry.moodTag === 2 ? '😟' : entry.moodTag === 3 ? '😐' : entry.moodTag === 4 ? '🙂' : '😀'}
                      </span>
                    )}
                  </div>
                  <span className="journal-entry-date">
                    {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="journal-entry-title">{entry.title}</h3>

                <p className={`journal-entry-content ${expandedId === entry.id ? 'expanded' : ''}`}>
                  {entry.content}
                </p>

                {entry.content.length > 200 && (
                  <button
                    className="read-more-btn"
                    onClick={() => setExpandedId(prev => prev === entry.id ? null : entry.id)}
                  >
                    {expandedId === entry.id ? 'Show less ↑' : 'Read more ↓'}
                  </button>
                )}

                <div className="journal-entry-actions">
                  <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }} onClick={() => handleEdit(entry)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(entry.id)} title="Delete entry">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal;
