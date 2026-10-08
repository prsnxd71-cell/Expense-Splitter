import React, { useState } from 'react';
import { api } from '../api';

export default function AuthPage({ onLoginSuccess }) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Step 1: Request OTP via Minimoth
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone.trim() || phone.trim().length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +919876543210 or 10 digits).');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(phone.trim());
      setInfoMessage(res.message || 'OTP sent successfully!');
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim() || code.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.verifyOtp(phone.trim(), code.trim(), name.trim());
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', marginBottom: 12 }}>
            <div className="brand-icon" style={{ width: 44, height: 44, fontSize: '1.25rem' }}>₹</div>
          </div>
          <h1>Expense Splitter</h1>
          <p>Login or Register via Minimoth OTP</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {infoMessage && <div className="alert alert-info">{infoMessage}</div>}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                className="form-input"
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="name">Your Name (Optional for new users)</label>
              <input
                id="name"
                className="form-input"
                type="text"
                placeholder="e.g. Alex"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP via Minimoth'}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', textAlign: 'center', marginTop: 14 }}>
              OTP is delivered via WhatsApp/SMS by Minimoth API.
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">Enter 6-Digit OTP</label>
              <input
                id="otp"
                className="form-input"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={loading}
                autoFocus
                required
                style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.3em' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => { setStep('phone'); setCode(''); setError(''); }}
              disabled={loading}
            >
              ← Edit Phone Number ({phone})
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

