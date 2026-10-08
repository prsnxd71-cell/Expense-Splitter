import React, { useState } from 'react';
import { api } from '../api';

export default function GroupDetailPage({ group, currentUser, onBack, onGroupUpdated }) {
  const [currentGroup, setCurrentGroup] = useState(group);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Add Expense form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(
    group.members.includes(currentUser?.name)
      ? currentUser?.name
      : group.members[0] || ''
  );
  const [splitAmong, setSplitAmong] = useState([...group.members]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Toggle member in split list
  const toggleSplitMember = (member) => {
    if (splitAmong.includes(member)) {
      if (splitAmong.length === 1) {
        setError('At least one person must share the expense.');
        return;
      }
      setSplitAmong(splitAmong.filter(m => m !== member));
    } else {
      setSplitAmong([...splitAmong, member]);
    }
  };

  // Submit new expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const parsedAmt = parseFloat(amount);
    if (!title.trim()) {
      setError('Please provide an expense description.');
      return;
    }
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError('Please enter a valid expense amount greater than 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.addExpense(currentGroup.id, {
        title: title.trim(),
        amount: parsedAmt,
        paidBy,
        splitAmong
      });

      // Update local state with latest group calculations
      setCurrentGroup(res.updatedGroup);
      if (onGroupUpdated) {
        onGroupUpdated(res.updatedGroup);
      }

      // Reset form
      setTitle('');
      setAmount('');
      setSplitAmong([...currentGroup.members]);
      setShowAddExpense(false);
      setSuccess('Expense added and split calculated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record expense.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate current user's balance
  const userIdent = currentUser?.name || currentUser?.phone;
  const userNetBalance = currentGroup.balances?.[userIdent] ?? 0;

  return (
    <div>
      {/* Back button */}
      <button className="back-btn" onClick={onBack}>
        ← Back to all groups
      </button>

      {/* Group Title and Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {currentGroup.name}
          </h2>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {currentGroup.members?.map((m) => (
              <span key={m} className="badge badge-neutral" style={{ border: '1px solid var(--border)' }}>
                {m} {m === userIdent ? '(You)' : ''}
              </span>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddExpense(!showAddExpense)}
        >
          {showAddExpense ? '✕ Cancel' : '+ Add Expense'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Summary Stat Boxes */}
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">₹{currentGroup.totalSpend?.toFixed(2) || '0.00'}</div>
        </div>

        <div className="stat-box">
          <div className="stat-label">Your Net Status</div>
          <div
            className="stat-value"
            style={{
              color: userNetBalance > 0.01 ? 'var(--success)' : userNetBalance < -0.01 ? 'var(--danger)' : 'var(--text-main)'
            }}
          >
            {userNetBalance > 0.01
              ? `+₹${userNetBalance.toFixed(2)}`
              : userNetBalance < -0.01
              ? `-₹${Math.abs(userNetBalance).toFixed(2)}`
              : '₹0.00'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {userNetBalance > 0.01 ? 'You are owed' : userNetBalance < -0.01 ? 'You owe group' : 'All squared up'}
          </span>
        </div>

        <div className="stat-box">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{currentGroup.expenses?.length || 0}</div>
        </div>
      </div>

      {/* Add Expense Form Card */}
      {showAddExpense && (
        <div className="card" style={{ borderColor: 'var(--primary)', marginBottom: 24 }}>
          <h3 className="card-title">Record an Expense</h3>
          <form onSubmit={handleAddExpense}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label className="form-label" htmlFor="expenseTitle">Expense Description</label>
                <input
                  id="expenseTitle"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Dinner, Fuel, Groceries"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="expenseAmount">Amount (₹)</label>
                <input
                  id="expenseAmount"
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="paidBy">Paid By</label>
              <select
                id="paidBy"
                className="form-input"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {currentGroup.members?.map((m) => (
                  <option key={m} value={m}>
                    {m} {m === userIdent ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Split Equally Among ({splitAmong.length} selected)
              </label>
              <div className="split-pills">
                {currentGroup.members?.map((member) => {
                  const isChecked = splitAmong.includes(member);
                  return (
                    <button
                      type="button"
                      key={member}
                      className={`pill-checkbox ${isChecked ? 'active' : ''}`}
                      onClick={() => toggleSplitMember(member)}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {member}
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Calculating...' : 'Add Expense & Recalculate'}
            </button>
          </form>
        </div>
      )}

      {/* Suggested Settlements Section */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 className="card-title">Settlement Summary</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          Calculated minimal transfers to settle all group debts:
        </p>

        {(!currentGroup.settlements || currentGroup.settlements.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--success)', fontWeight: 600 }}>
            🎉 Everyone is squared up! No debts pending.
          </div>
        ) : (
          <div className="settlement-list">
            {currentGroup.settlements.map((s, idx) => (
              <div key={idx} className="settlement-item">
                <div>
                  <span className="settlement-debtor">{s.from}</span>
                  <span className="settlement-arrow"> owes </span>
                  <span className="settlement-creditor">{s.to}</span>
                </div>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                  ₹{s.amount.toFixed(2)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense History List */}
      <div className="card">
        <h3 className="card-title">Expense History</h3>
        {(!currentGroup.expenses || currentGroup.expenses.length === 0) ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', padding: '12px 0' }}>
            No expenses recorded yet. Click "+ Add Expense" above to add the first bill.
          </p>
        ) : (
          <div>
            {currentGroup.expenses.map((exp) => (
              <div key={exp.id} className="expense-item">
                <div className="expense-info">
                  <h4>{exp.title}</h4>
                  <div className="expense-meta">
                    Paid by <strong>{exp.paidBy}</strong> • Split with {exp.splitAmong?.length || currentGroup.members.length} people •{' '}
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="expense-amount">
                  ₹{exp.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

