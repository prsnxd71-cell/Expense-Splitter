const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const MINIMOTH_URL = 'https://api.minimoth.dev/v1/otp';

/**
 * Normalizes phone numbers (ensures country code if missing, e.g. +91 for 10-digit Indian numbers)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s-]/g, '');
  if (/^\d{10}$/.test(cleaned)) {
    return `+91${cleaned}`;
  }
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}

/**
 * 1. POST /api/auth/send-otp
 * Body: { phone }
 */
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.trim().length < 8) {
    return res.status(400).json({ error: 'Please enter a valid phone number.' });
  }

  const formattedPhone = normalizePhone(phone.trim());
  const apiKey = process.env.MINIMOTH_API_KEY;
  const isMock = !apiKey || apiKey === 'mock' || apiKey.startsWith('demo');

  if (isMock) {
    console.log(`\n==============================================`);
    console.log(`[MiniMoth Sandbox Mode]`);
    console.log(`OTP generated for ${formattedPhone}: 123456`);
    console.log(`==============================================\n`);
    return res.json({
      success: true,
      message: 'OTP sent! (Sandbox mode: Use 123456 to verify)',
      phone: formattedPhone,
      isSandbox: true
    });
  }

  try {
    const response = await fetch(`${MINIMOTH_URL}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({ phone: formattedPhone })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(response.status).json({
        error: data.message || data.error || `Minimoth API returned status ${response.status}`
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully to your phone via WhatsApp/SMS.',
      phone: formattedPhone,
      otp_id: data.otp_id
    });
  } catch (err) {
    console.error('Minimoth API Error:', err.message);
    return res.status(500).json({
      error: `Network error connecting to Minimoth API: ${err.message}`
    });
  }
});

/**
 * 2. POST /api/auth/verify-otp
 * Body: { phone, code, name }
 */
router.post('/verify-otp', async (req, res) => {
  const { phone, code, name } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required.' });
  }
  if (!code || code.trim().length !== 6) {
    return res.status(400).json({ error: 'Please enter a valid 6-digit OTP code.' });
  }

  const formattedPhone = normalizePhone(phone.trim());
  const apiKey = process.env.MINIMOTH_API_KEY;
  const isMock = !apiKey || apiKey === 'mock' || apiKey.startsWith('demo');

  if (isMock) {
    // In sandbox demo mode, accept 123456 or 000000
    if (code.trim() !== '123456' && code.trim() !== '000000') {
      return res.status(400).json({ error: 'Invalid OTP. In sandbox mode, please enter 123456.' });
    }
  } else {
    try {
      const response = await fetch(`${MINIMOTH_URL}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey
        },
        body: JSON.stringify({ phone: formattedPhone, code: code.trim() })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return res.status(response.status).json({
          error: data.message || data.error || 'Invalid or expired OTP code.'
        });
      }
    } catch (err) {
      console.error('Minimoth verify error:', err.message);
      return res.status(500).json({
        error: `Network error verifying OTP with Minimoth: ${err.message}`
      });
    }
  }

  // OTP verified successfully: Find or register user
  let user = User.findByPhone(formattedPhone);
  if (!user) {
    user = User.create({
      phone: formattedPhone,
      name: name && name.trim() ? name.trim() : `User ${formattedPhone.slice(-4)}`
    });
  } else if (name && name.trim() && user.name.startsWith('User ')) {
    user = User.updateName(user.id, name.trim());
  }

  // Issue session token
  const token = jwt.sign(
    { id: user.id, phone: user.phone, name: user.name },
    process.env.JWT_SECRET || 'workshop_secret',
    { expiresIn: '7d' }
  );

  return res.json({
    success: true,
    message: 'Authenticated successfully!',
    token,
    user
  });
});

module.exports = router;

