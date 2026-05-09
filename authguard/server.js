require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const bcrypt    = require('bcrypt');
const path      = require('path');
const https     = require('https');
const rateLimit = require('express-rate-limit');

const User = require('./models/User');

const app  = express();
const PORT = process.env.PORT || 3000;

const LOCKOUT_LIMIT    = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Defense 3: Rate limiting ─────────────────────────────────────────────────
// Max 10 login requests per IP per minute
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
    const params  = `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`;
    const options = {
      hostname: 'www.google.com',
      path:     '/recaptcha/api/siteverify',
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(params),
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data',  chunk => data += chunk);
      res.on('end',  () => { try { resolve(JSON.parse(data)); } catch { resolve({ success: false }); } });
    });
    req.on('error', () => resolve({ success: false }));
    req.write(params);
    req.end();
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/register',  (req, res) => res.sendFile(path.join(__dirname, 'public', 'register.html')));
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

    // Defense 1: Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({
        success: false,
        message:  `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    // Defense 2: bcrypt comparison (bcrypt + salt already applied at registration/seed)
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      // Defense 1: Increment failed attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      if (user.loginAttempts >= LOCKOUT_LIMIT) {
        user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION);
        await user.save();
        return res.status(403).json({
          success: false,
          message: 'Account locked after too many failed attempts. Try again in 15 minutes.',
        });
      }

      await user.save();
      const attemptsLeft = LOCKOUT_LIMIT - user.loginAttempts;
      return res.json({
        success: false,
        message: `Invalid credentials. ${attemptsLeft} attempt(s) left before lockout.`,
      });
    }

    // Success — reset lockout state
    user.loginAttempts = 0;
    user.lockUntil     = undefined;
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
    const hashed   = await bcrypt.hash(password, 10);
    await User.create({ firstName, lastName, email: email.toLowerCase(), username, password: hashed });
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`\nAuthGuard running → http://localhost:${PORT}\n`));
