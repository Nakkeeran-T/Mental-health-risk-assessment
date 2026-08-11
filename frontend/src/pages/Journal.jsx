import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/api';
import './Journal.css';

const CATEGORIES = ['Gratitude', 'Anxiety', 'Goals', 'Reflection', 'Stress', 'Progress', 'Other'];
const MOOD_EMOJIS = { 1: '😩', 2: '😟', 3: '😐', 4: '🙂', 5: '😀' };
const MOOD_LABELS = { 1: 'Severely Down', 2: 'Anxious', 3: 'Neutral', 4: 'Good', 5: 'Great' };
const MOOD_COLORS = { 1: 'var(--color-critical)', 2: 'var(--color-high)', 3: 'var(--color-moderate)', 4: 'var(--color-low)', 5: '#00f2fe' };

const EMOTION_EMOJI = { joy: '😊', optimism: '🌟', sadness: '😔', anger: '😠', neutral: '😐' };
const EMOTION_COLOR = { joy: '#00f2fe', optimism: '#f9d71c', sadness: '#a78bfa', anger: '#f87171', neutral: '#9ca3af' };
const getEmotionEmoji = (e) => EMOTION_EMOJI[e?.toLowerCase()] || '🧠';
const getEmotionColor = (e) => EMOTION_COLOR[e?.toLowerCase()] || '#9ca3af';

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

  // Read/filter state
  const [expandedId, setExpandedId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      const matchesCategory = filterCategory === 'All' || e.category === filterCategory;
      const matchesSearch = !searchTerm || 
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        e.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [entries, filterCategory, searchTerm]);

  if (loading) {
    return (
      <div className="main-content" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <span className="loading-spinner-lg">Loading your reflections...</span>
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="journal-container">

        {/* Header */}
        <div className="journal-header">
          <div>
            <h1>
              <span className="journal-header-icon">📓</span>
              <span className="journal-header-text">My Reflections Journal</span>
            </h1>
            <p className="journal-subtitle">
              A private, secure space to express your thoughts, track emotions, and cultivate mindfulness.
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            ➕ Write New Entry
          </button>
        </div>

        {success && <div className="auth-success" style={{ marginBottom: '1.5rem' }}>{success}</div>}
        {error && <div className="auth-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

        {/* Write / Edit Form */}
        {showForm && (
          <div className="glass-card journal-form-card">
            <h3 style={{ color: 'var(--text-primary)' }}>{editingEntry ? '✏️ Edit Reflection' : '✍️ Write New Reflection'}</h3>
            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Entry Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Give your reflection a title..."
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
                    style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                  >
                    <option value="">— Select category —</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">How are you feeling? (Optional)</label>
                  <div className="mood-tag-row">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        className={`mood-tag-btn ${moodTag === v ? 'selected' : ''}`}
                        onClick={() => setMoodTag(prev => prev === v ? null : v)}
                        title={`${MOOD_EMOJIS[v]} ${MOOD_LABELS[v]}`}
                      >
                        {MOOD_EMOJIS[v]}
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
                  placeholder="Write freely... your journal entries are private and secure."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center' }}>
                  {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Save Reflection'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm} style={{ flex: 1, justifyContent: 'center' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar & Search */}
        {entries.length > 0 && (
          <div className="journal-controls-row">
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

            <input
              type="text"
              className="journal-search-input"
              placeholder="🔍 Search entries..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Entries List */}
        {filteredEntries.length === 0 ? (
          <div className="glass-card empty-state">
            <div className="empty-icon">📓</div>
            <h3>No Journal Entries Found</h3>
            <p>
              {entries.length === 0
                ? "Start your mindfulness journey by creating your first reflection."
                : "No entries match your search or selected category filter."}
            </p>
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
                      <span className="mood-tag-display" title={MOOD_LABELS[entry.moodTag]} style={{ color: MOOD_COLORS[entry.moodTag] }}>
                        {MOOD_EMOJIS[entry.moodTag]}
                      </span>
                    )}
                    {/* NLP-detected emotion tag */}
                    {entry.detectedEmotion && (
                      <span title={`AI Emotion Analysis: ${entry.detectedEmotion}${entry.emotionConfidence ? ` (${(entry.emotionConfidence*100).toFixed(0)}% confidence)` : ''}`}
                        style={{
                          fontSize: '0.72rem', padding: '0.2rem 0.6rem', borderRadius: 999,
                          fontWeight: 600, letterSpacing: '0.03em',
                          background: `${getEmotionColor(entry.detectedEmotion)}18`,
                          color: getEmotionColor(entry.detectedEmotion),
                          border: `1px solid ${getEmotionColor(entry.detectedEmotion)}35`,
                          cursor: 'help'
                        }}>
                        {getEmotionEmoji(entry.detectedEmotion)} {entry.detectedEmotion}
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
                    {expandedId === entry.id ? 'Show less ↑' : 'Read full reflection ↓'}
                  </button>
                )}

                <div className="journal-entry-actions">
                  <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }} onClick={() => handleEdit(entry)}>
                    ✏️ Edit
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(entry.id)} title="Delete entry">
                    🗑️ Delete
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
