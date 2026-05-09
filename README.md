# AuthGuard — Online Brute-Force Attack Lab

An end-to-end Information Security lab that builds a login system, attacks it with a custom brute-force script, implements four defenses, and documents the before/after results.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Phase 1 — Login System](#phase-1--login-system)
- [Phase 2 — Brute-Force Attack](#phase-2--brute-force-attack)
- [Phase 3 — Defenses](#phase-3--defenses)
- [Phase 4 — Results Comparison](#phase-4--results-comparison)
- [Key Findings](#key-findings)

---

## Overview

This lab demonstrates how an online brute-force / dictionary attack works against a login endpoint, and how layered defenses stop it completely.

| Phase | Goal |
|-------|------|
| 1 | Build a real login system backed by MongoDB |
| 2 | Attack it with a custom Python dictionary attack script |
| 3 | Add 4 security defenses |
| 4 | Re-attack and compare results |

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB Atlas (Mongoose ODM)
- bcrypt (password hashing)
- express-rate-limit

**Frontend**
- HTML + Tailwind CSS + JavaScript
- Google reCAPTCHA v2

**Attack Tool**
- Python 3 + requests library

---

## Project Structure

```
Is Lab proj/
├── authguard/                  ← Login server (Phase 1 + Phase 3)
│   ├── server.js               ← Express server with all 4 defenses
│   ├── .env                    ← MongoDB URI, reCAPTCHA keys
│   ├── package.json
│   ├── models/
│   │   └── User.js             ← Mongoose schema (username, password, lockout fields)
│   ├── scripts/
│   │   └── seed.js             ← Seeds 10 test users with hashed passwords
│   └── public/
│       ├── index.html          ← Login page (with reCAPTCHA widget)
│       ├── register.html
│       ├── dashboard.html
│       ├── style.css
│       └── js/
│           ├── login.js
│           ├── register.js
│           └── dashboard.js
│
└── attack/                     ← Attack scripts (Phase 2 + Phase 4)
    ├── brute_force.py          ← Main dictionary attack (all users, one run)
    ├── compare.py              ← Phase 4: before vs after comparison
    ├── wordlist.txt            ← 129-password wordlist
    └── reports/                ← Auto-saved attack reports (.txt)
```

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- MongoDB Atlas account (or local MongoDB)

### 1. Install Node dependencies
```bash
cd authguard
npm install
```

### 2. Install Python dependency
```bash
pip install requests
```

### 3. Configure environment variables

Edit `authguard/.env`:
```
MONGO_URI=<your MongoDB connection string>
PORT=3000
RECAPTCHA_SITE_KEY=<your reCAPTCHA v2 site key>
RECAPTCHA_SECRET_KEY=<your reCAPTCHA v2 secret key>
```

> Get reCAPTCHA v2 keys at [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin).
> Choose **Challenge (v2)** and add `localhost` as an allowed domain.

### 4. Seed the database
```bash
cd authguard
node scripts/seed.js
```

This creates 10 test accounts with intentionally weak passwords for demo purposes.

---

## Phase 1 — Login System

A full login/register system with:
- MongoDB user storage
- bcrypt password hashing (salt rounds: 10)
- Login via username **or** email
- Dashboard redirect on success

**Run the server:**
```bash
cd authguard
node server.js
```

Open [http://localhost:3000](http://localhost:3000)

---

## Phase 2 — Brute-Force Attack

A Python dictionary attack script that targets all 10 seeded accounts in one run.

**What it does:**
- Sends `POST /api/login` with `{"username": ..., "password": ...}`
- Tries every password in `wordlist.txt` per user
- Stops per-user when the password is found or a defense blocks it
- Detects: success, CAPTCHA block, account lockout, rate limit
- Auto-saves a timestamped report to `attack/reports/`

**Run the attack:**
```bash
cd attack
python brute_force.py

# Full speed (no delay between requests)
python brute_force.py --delay 0
```

**Without defenses — results:**

| Username | Password | Cracked at attempt |
|----------|----------|--------------------|
| bob | 123456 | #1 |
| eve | password | #2 |
| charlie | qwerty | #8 |
| frank | abc123 | #9 |
| diana | letmein | #13 |
| grace | monkey | #15 |
| henry | dragon | #16 |
| isabella | master | #17 |
| alice | password123 | #22 |
| jack | sunshine | #24 |

**10/10 accounts cracked in 127 total requests (~6.35 seconds)**

---

## Phase 3 — Defenses

Four defenses implemented in `authguard/server.js` and the frontend:

### Defense 1 — Account Lockout
- Tracks `loginAttempts` per user in MongoDB
- After **5 failed attempts** → account locked for **15 minutes**
- Server returns HTTP 403 with minutes remaining
- Counter resets on successful login

### Defense 2 — bcrypt + Salt
- All passwords hashed with bcrypt at salt rounds 10
- Stored hashes are never reversible
- Makes offline cracking of stolen hashes computationally expensive

### Defense 3 — Rate Limiting
- `express-rate-limit` applied to `POST /api/login`
- **Max 10 requests per minute per IP**
- Returns HTTP 429 when exceeded

### Defense 4 — Google reCAPTCHA v2
- "I'm not a robot" checkbox on the login form
- Frontend sends the reCAPTCHA token with every login request
- Server verifies the token with Google's `siteverify` API before checking credentials
- Bots that skip the token get rejected immediately
- CAPTCHA resets after every failed login attempt

---

## Phase 4 — Results Comparison

Run the comparison script to attack the defended server and generate a full before/after report:

```bash
# Terminal 1 — server with defenses active
cd authguard && node server.js

# Terminal 2 — Phase 4 comparison
cd attack && python compare.py
```

Report saved to: `attack/reports/phase4_comparison_<timestamp>.txt`

**Results:**

| Metric | Before Defenses | After Defenses |
|--------|----------------|----------------|
| Accounts cracked | **10 / 10** | **0 / 10** |
| Total requests sent | 127 | 10 |
| Time to complete | ~6.35s | ~0.1s |
| Attack success rate | **100%** | **0%** |

**Defense breakdown (after):**

| Defense | Accounts blocked |
|---------|-----------------|
| reCAPTCHA v2 | 10/10 (100%) |
| Account lockout | 0/10 (CAPTCHA stopped it first) |
| Rate limiting | 0/10 (CAPTCHA stopped it first) |

---

## Key Findings

1. **Weak passwords are the root cause.** All 10 accounts were cracked using a 129-word list in under 7 seconds — because every password was a well-known common password.

2. **CAPTCHA is the strongest first-line defense against bots.** It blocked 100% of automated attempts before a single password guess could be evaluated.

3. **Layered defenses matter.** If CAPTCHA were bypassed (e.g. via a CAPTCHA-solving service), account lockout would stop the attack at 5 attempts per account, and rate limiting would throttle the IP to 10 requests/minute.

4. **bcrypt prevents offline cracking.** Even if the database were leaked, bcrypt hashes cannot be reversed and are too slow to brute-force directly.

5. **Defense in depth works.** No single defense is enough — together, the four layers make automated online attacks infeasible.

---

## Test Accounts

> These are seeded for lab demo purposes only. Never use passwords like these in production.

| Username | Password |
|----------|----------|
| alice | password123 |
| bob | 123456 |
| charlie | qwerty |
| diana | letmein |
| eve | password |
| frank | abc123 |
| grace | monkey |
| henry | dragon |
| isabella | master |
| jack | sunshine |
