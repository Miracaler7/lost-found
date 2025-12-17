const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

const isBmsceEmail = (email) => typeof email === 'string' && email.toLowerCase().endsWith('@bmsce.ac.in');

// Password validation function
const isStrongPassword = (password) => {
  // Password constraint
  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/;
  return regex.test(password) && !password.includes(' ');
};

router.post('/signup', async (req, res) => {
  try {
    const { name, phone, email, usn, password } = req.body;
    if (!name || !phone || !email || !usn || !password) {
      return res.json({ success: false, message: 'All fields are required' });
    }

    if (!isBmsceEmail(email)) {
      return res.json({ success: false, message: 'Email must end with @bmsce.ac.in' });
    }

    if (!isStrongPassword(password)) {
      return res.json({
        success: false,
        message: 'Password must be at least 8 characters long, include one uppercase letter, one number, one special character, and contain no spaces',
      });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.json({ success: false, message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name, phone, email: email.toLowerCase(), usn, passwordHash });

    res.json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.json({ success: false, message: 'Missing credentials' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json({ success: false, message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.json({ success: false, message: 'Invalid email or password' });

    res.json({ success: true, message: 'Login successful', user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
