import React, { useState, useEffect } from 'react';
import api from '../api/api';
import './Profile.css';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        const data = res.data.data;
        setProfile(data);
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError('Could not load user profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUpdating(true);

    try {
      // Endpoint takes @RequestParam firstName and lastName
      const res = await api.put(`/users/me?firstName=${encodeURIComponent(firstName)}&lastName=${encodeURIComponent(lastName)}`);
      setProfile(res.data.data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '4rem' }}>
        Loading profile details...
      </div>
    );
  }

  return (
    <div className="main-content">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <p className="profile-subtitle">Manage your account information and preferences.</p>
        </div>

        <div className="profile-grid">
          {/* Info Card */}
          <div className="glass-card profile-info-card">
            <div className="profile-avatar">
              👤
            </div>
            <div className="profile-details-list">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Email Address</span>
                <span className="profile-detail-val">{profile?.email}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Account Role</span>
                <span className="profile-detail-val badge-role">{profile?.role}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Member Since</span>
                <span className="profile-detail-val">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="glass-card profile-edit-card">
            <h3>Update Profile</h3>
            
            {error && <div className="auth-error" style={{ margin: '1rem 0' }}>{error}</div>}
            {success && <div className="auth-success" style={{ margin: '1rem 0' }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  className="form-input"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  className="form-input"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={updating}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {updating ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
