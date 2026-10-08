import React, { useState, useEffect } from 'react';
import { api } from '../api';

export default function GroupsPage({ user, onSelectGroup }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New group form state
  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [membersInput, setMembersInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch groups
  const loadGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getGroups();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || 'Failed to load groups.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  // Handle group creation
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      setError('Please provide a group name.');
      return;
    }

    const additionalMembers = membersInput
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);

    if (additionalMembers.length === 0) {
      setError('Please enter at least one other member name or phone to split with.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createGroup(groupName.trim(), additionalMembers);
      setGroups(prev => [res.group, ...prev]);
      setGroupName('');
      setMembersInput('');
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Failed to create group.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header section with Create Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)' }}>Your Expense Groups</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Select a group to view expenses and settlements
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Close Form' : '+ New Group'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Create Group Form Card */}
      {showForm && (
        <div className="card" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
          <h3 className="card-title" style={{ marginBottom: 12 }}>Create New Expense Group</h3>
          <form onSubmit={handleCreateGroup}>
            <div className="form-group">
              <label className="form-label" htmlFor="groupName">Group Name</label>
              <input
                id="groupName"
                className="form-input"
                type="text"
                placeholder="e.g. Goa Trip, Flat 402, Dinner"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="members">
                Other Members (comma separated names or phones)
              </label>
              <input
                id="members"
                className="form-input"
                type="text"
                placeholder="e.g. Rahul, Priya, Sam"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                You ({user?.name || 'You'}) will be automatically included as the creator.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Save Group'}
            </button>
          </form>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          Loading your groups...
        </div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🧾</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 6 }}>No groups yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 18 }}>
            Create your first expense group to start splitting bills with friends.
          </p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Create Group
          </button>
        </div>
      ) : (
        /* Groups List */
        <div className="groups-grid">
          {groups.map(group => {
            const userBal = group.userBalance || 0;
            const isOwed = userBal > 0.01;
            const owes = userBal < -0.01;

            return (
              <div
                key={group.id}
                className="group-card"
                onClick={() => onSelectGroup(group)}
              >
                <div>
                  <h3 className="group-card-title">{group.name}</h3>
                  <p className="group-card-members">
                    {group.members?.length || 0} members: {group.members?.slice(0, 3).join(', ')}
                    {group.members?.length > 3 ? ` +${group.members.length - 3} more` : ''}
                  </p>
                </div>

                <div className="group-card-footer">
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Spend</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                      ₹{group.totalSpend?.toFixed(2) || '0.00'}
                    </strong>
                  </div>

                  <div>
                    {isOwed && (
                      <span className="badge badge-positive">
                        +₹{userBal.toFixed(2)} back
                      </span>
                    )}
                    {owes && (
                      <span className="badge badge-negative">
                        -₹{Math.abs(userBal).toFixed(2)} owes
                      </span>
                    )}
                    {!isOwed && !owes && (
                      <span className="badge badge-neutral">Settled</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

