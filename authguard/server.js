require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
const https = require('https');
const rateLimit = require('express-rate-limit');
const fs = require('fs'); // === PART C: Added for Alert Logging ===

const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

// === PART C: IDPS Configuration ===
const IDPS_TIME_WINDOW = 300 * 1000;          // 5 mn
//  detection window
const IDPS_LOCKOUT_DURATION = 2 * 60 * 1000; // 2 minutes lockout (Automatic Response)
const idpsTracker = {};                      // Tracks timestamps of failed attempts

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Defense 3: Rate limiting─────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests — please wait 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Defense 4: reCAPTCHA v2 verification ────────────────────────────────────
function verifyRecaptcha(token) {
  return new Promise((resolve) => {
    const params = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const options = {
      hostname: 'www.google.com',
      path: '/recaptcha/api/siteverify',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch { resolve({ success: false }); } });
    });
    req.on('error', () => resolve({ success: false }));
    req.write(params);
    req.end();
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/register', (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.post('/api/login', loginLimiter, async (req, res) => {
  const { username, password, recaptchaToken } = req.body;

  if (!username || !password)
    return res.json({ success: false, message: 'All fields are required' });

  // Defense 4: Require and verify CAPTCHA
  if (!recaptchaToken)
    return res.json({ success: false, message: 'Please complete the CAPTCHA.' });

  const captcha = await verifyRecaptcha(recaptchaToken);
  if (!captcha.success)
    return res.json({ success: false, message: 'CAPTCHA verification failed. Please try again.' });

  try {
    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!user)
      return res.json({ success: false, message: 'Invalid credentials' });

    // === PART C: Check Lockout Status ===
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const secondsLeft = Math.ceil((user.lockUntil - Date.now()) / 1000);
      return res.status(403).json({
        success: false,
        message: `Account locked due to suspicious activity. Try again in ${secondsLeft} seconds.`,
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      // === START OF PART C (IDPS LOGIC) ===
      const now = Date.now();
      const uname = user.username;

      if (!idpsTracker[uname]) {
        idpsTracker[uname] = [];
      }

      // 1. Record timestamp of the failed attempt
      idpsTracker[uname].push(now);

      // 2. Keep only attempts within the last 30 seconds
      idpsTracker[uname] = idpsTracker[uname].filter(time => now - time <= IDPS_TIME_WINDOW);
      user.loginAttempts = idpsTracker[uname].length;

      // 3. Detection Rule: 5 failed attempts in 5m
      if (idpsTracker[uname].length >= 5) {

        // 4. Automatic Response (Prevention): Lock account for 2 minutes
        user.lockUntil = new Date(now + IDPS_LOCKOUT_DURATION);
        await user.save();

        // 5. Alert Generation (Save to Log File)
        const logMsg = `[${new Date().toISOString()}] ALERT: Suspicious activity detected! Possible Brute-Force Attack on user '${uname}'. Account locked.\n`;
        fs.appendFileSync('idps_alerts.log', logMsg);

        // Clear the tracker for this user after lockout
        delete idpsTracker[uname];

        return res.status(403).json({
          success: false,
          message: 'Suspicious activity detected! Account locked for 2 minutes.',
        });
      }

      await user.save();
      const attemptsMade = idpsTracker[uname].length;
      return res.json({
        success: false,
        message: `Invalid credentials. Failed attempts in last 30s: ${attemptsMade}/5`,
      });
      // === END OF PART C ===
    }

    // Success — reset lockout state and tracker
    delete idpsTracker[user.username];
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const name = user.firstName ? `${user.firstName} ${user.lastName}` : user.username;
    res.json({ success: true, message: `Welcome back, ${name}!` });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;
  if (!firstName || !lastName || !email || !password || !confirmPassword)
    return res.json({ success: false, message: 'All fields are required' });
  if (password !== confirmPassword)
    return res.json({ success: false, message: 'Passwords do not match' });
  if (password.length < 6)
    return res.json({ success: false, message: 'Password must be at least 6 characters' });

  try {
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.json({ success: false, message: 'Email already registered' });

    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ firstName, lastName, email: email.toLowerCase(), username, password: hashed });
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`\nAuthGuard running → http://localhost:${PORT}\n`));