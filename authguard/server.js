require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');
const path     = require('path');

const User = require('./models/User');

const app  = express();
const PORT = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/register', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'register.html')));

app.get('/dashboard', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.json({ success: false, message: 'All fields are required' });

  try {
    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });
    if (!user)
      return res.json({ success: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.json({ success: false, message: 'Invalid credentials' });

    const name = user.firstName
      ? `${user.firstName} ${user.lastName}`
      : user.username;
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

app.listen(PORT, () =>
  console.log(`\nAuthGuard running → http://localhost:${PORT}\n`));
