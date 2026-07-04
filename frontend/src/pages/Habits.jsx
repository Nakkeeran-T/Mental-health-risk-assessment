import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './Habits.css';

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchHabits = async () => {
    try {
      const res = await api.get('/habits');
      setHabits(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch habits:', err);
      setError('Could not load self-care habits.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError('');
    setSubmitting(true);

    try {
      await api.post('/habits', { title, description });
      setTitle('');
      setDescription('');
      fetchHabits();
    } catch (err) {
      console.error('Failed to create habit:', err);
      setError('Failed to create new self-care habit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleHabit = async (id) => {
    setError('');
    try {
      await api.post(`/habits/${id}/complete`);
      fetchHabits();
    } catch (err) {
      console.error('Failed to toggle habit status:', err);
      setError('Failed to update habit completion status.');
    }
  };

  const handleDeleteHabit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this self-care goal?')) return;
    setError('');
    try {
      await api.delete(`/habits/${id}`);
      fetchHabits();
    } catch (err) {
      console.error('Failed to delete habit:', err);
      setError('Failed to delete habit.');
    }
  };

  const isCompletedToday = (lastCompletedAt) => {
    if (!lastCompletedAt) return false;
    const lastDate = new Date(lastCompletedAt).toDateString();
    const todayDate = new Date().toDateString();
    return lastDate === todayDate;
  };

  if (loading) {
    return (
      <div className="main-content" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
        Loading habits tracker...
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="habits-container">
        <div className="habits-header">
          <h1>Self-Care Habits & Goals</h1>
          <p className="habits-subtitle">Build healthy routines and track your daily self-care streaks.</p>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: '2rem' }}>{error}</div>}

        <div className="habits-layout">
          {/* Create Goal Card */}
          <div className="glass-card habits-form-card">
            <h3>Add New Goal</h3>
            <form onSubmit={handleCreateHabit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Habit Title</label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Meditate 10 min, Drink Water"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Short Description (Optional)</label>
                <textarea
                  id="description"
                  className="form-input"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this habit about?"
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || !title.trim()}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {submitting ? 'Creating Habit...' : 'Create Habit'}
              </button>
            </form>
          </div>

          {/* List of Goals */}
          <div className="habits-list-column">
            {habits.length === 0 ? (
              <div className="glass-card text-center" style={{ padding: '3rem', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)' }}>You don't have any habits registered. Add some to get started!</p>
              </div>
            ) : (
              <div className="habits-list">
                {habits.map((habit) => {
                  const completed = isCompletedToday(habit.lastCompletedAt);
                  return (
                    <div key={habit.id} className={`glass-card habit-item ${completed ? 'completed' : ''}`}>
                      <div className="habit-checkbox-wrapper">
                        <button 
                          onClick={() => handleToggleHabit(habit.id)}
                          className={`habit-check-btn ${completed ? 'checked' : ''}`}
                          title={completed ? 'Mark as incomplete' : 'Mark as completed'}
                        >
                          {completed ? '✓' : ''}
                        </button>
                        <div className="habit-info">
                          <h4>{habit.title}</h4>
                          {habit.description && <p>{habit.description}</p>}
                        </div>
                      </div>

                      <div className="habit-actions">
                        <span className="streak-badge-fire">
                          🔥 {habit.streakCount} Day{habit.streakCount === 1 ? '' : 's'}
                        </span>
                        <button 
                          onClick={() => handleDeleteHabit(habit.id)}
                          className="btn-delete"
                          title="Delete Goal"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Habits;
