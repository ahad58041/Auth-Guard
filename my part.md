# Part B – Online Brute-Force Attack (Build & Attack

# Your Own Login Page)

## Objective: Demonstrate an online brute-force attack and understand defenses.

## 1. Build a Login System

```
 A Login Page (HTML/PHP/CSS/JavaScript, Node.js, Python MongoDB, Django—your
choice)
 A Database Table that stores:
o username
o hashed password (use at least SHA-256)
```
Note: You do NOT store plaintext passwords.

## 2. Populate the Database

```
 Insert 5–10 test user accounts.
 Hash the passwords yourself (store only hashes).
```
## 3. Perform an Online Brute-Force Attack

Using tools such as:

```
 Hydra
 Burp Suite Intruder
 OWASP Zap
 Custom Python Script
```
Attack your own login page:

```
 Try a small dictionary attack.
 Try a password brute-force attempt.
 Record how many attempts it took to break a password.
```
## 4. Add Defenses & Test Again


After performing attacks, implement at least two security defenses:

```
 Account lockout after 5 failed attempts
 CAPTCHA
 Multi-factor authentication
 Password hashing + salting
```
Test your attack again and show:

```
 What changed?
 How many attempts were now blocked?
```