# IS Lab Project — Part B: Online Brute-Force Attack

## Project Overview
Build a login system, attack it with a custom brute-force script, then implement defenses and compare results. This is a security lab demonstrating online brute-force attacks.

## Tech Stack
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose ODM)
- **Frontend**: HTML + CSS + JavaScript
- **Attack Tool**: Custom Python script (requests library)
- **Password Hashing**: bcrypt (with salt)

## User Profile
- Experience: Intermediate web dev, learning security concepts
- Needs: Help with security-specific parts (hashing, attack scripts, defenses)
- Preference: Hands-on, phase-by-phase work

## Phases

### Phase 1 — Build the Login System
**Goal**: Working login page backed by MongoDB with hashed passwords.

Files to create:
- `server.js` — Express server, routes, MongoDB connection
- `models/User.js` — Mongoose schema (username, hashed password, lockout fields)
- `public/index.html` — Login page UI
- `public/style.css` — Styling
- `public/script.js` — Frontend form handling
- `scripts/seed.js` — Populate 5–10 test users with hashed passwords
- `.env` — MongoDB URI, PORT, secrets
- `package.json` — dependencies

**Status**: [ ] Not started

---

### Phase 2 — Brute-Force Attack Script
**Goal**: Python script that performs a dictionary attack against the running login server.

Files to create:
- `attack/brute_force.py` — Main attack script (dictionary + brute-force modes)
- `attack/wordlist.txt` — Small password wordlist (100–500 entries)

What the script does:
- Sends POST requests to `/login`
- Tries each password from the wordlist
- Records: attempts made, time elapsed, success/fail
- Prints a summary report

**Status**: [ ] Not started

---

### Phase 3 — Implement Defenses
**Goal**: Add 4 defenses and re-test.

Defenses to implement:
1. **Account lockout** — lock after 5 failed attempts (stored in MongoDB, auto-unlock after 15 min)
2. **bcrypt + salt** — upgrade from SHA-256 to bcrypt (already planned from Phase 1)
3. **Rate limiting** — `express-rate-limit` middleware, 10 req/min per IP
4. **CAPTCHA** — Google reCAPTCHA v2 ("I'm not a robot" checkbox) on the login form, verified server-side via Google's `siteverify` API

**Status**: [ ] Not started

---

### Phase 4 — Re-Attack & Document Results
**Goal**: Run the same brute-force script against the defended system and compare.

Deliverables:
- Before-defense results (attempts, time to crack)
- After-defense results (how many attempts before lockout/block)
- Written comparison for lab report

**Status**: [ ] Not started

---

## File Structure
```
Is Lab proj/
├── CLAUDE.md              ← this file
├── my part.md             ← original Lab-final
├── .env
├── package.json
├── server.js
├── models/
│   └── User.js
├── public/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── scripts/
│   └── seed.js
└── attack/
    ├── brute_force.py
    └── wordlist.txt
```

## Key Rules for This Project
- Never store plaintext passwords — always bcrypt + salt
- The attack scripts target ONLY the local dev server (localhost)
- CAPTCHA: Google reCAPTCHA v2 — needs a site key + secret key from Google reCAPTCHA admin console
- Test users: usernames like `alice`, `bob`, etc. with weak passwords (for demo purposes)
- Keep attack script output clean: show attempt count, found password, time taken

## Commands
```bash
# Install dependencies
npm install

# Seed the database
node scripts/seed.js

# Start the server
node server.js

# Run the attack (from attack/ directory)
python brute_force.py
```

## Dependencies (Node)
- express
- mongoose
- bcrypt
- dotenv
- express-rate-limit
- cors

## Dependencies (Python)
- requests
