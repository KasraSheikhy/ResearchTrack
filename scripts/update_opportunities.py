#!/usr/bin/env python3
"""Cautious, source-linked opportunity refresh for ResearchTrack.

Only monitored official pages may update deadline fields. Unknown pages remain
unverified. Parser failures preserve the last known good deadline and timestamp.
This script handles PUBLIC metadata, never personal localStorage data.
"""
from __future__ import annotations

import argparse
import datetime as dt
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
FEED = ROOT / 'data' / 'opportunities.json'
JS = ROOT / 'data' / 'opportunities.js'
CHANGES = ROOT / 'data' / 'changes.json'

# All monitored URLs are official program pages. Expected deadline year avoids
# accidentally picking up a different application cycle elsewhere on a page.
MONITORS = {
    'epfl-e3': {
        'url': 'https://eee.epfl.ch/apply/',
        'deadline_year': 2026,
        'pattern': r'(?:deadline|portal will close on)[^.!?]{0,115}?\b(November)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b',
        'order': 'mdy',
    },
    'epfl-srp': {
        'url': 'https://www.epfl.ch/schools/sv/education/summer-research-program/how-to-apply/',
        'deadline_year': 2026,
        'pattern': r'(?:deadline)[^.!?]{0,90}?\b(November)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b',
        'order': 'mdy',
    },
    'aalto-asci': {
        'url': 'https://www.aalto.fi/en/aalto-university-science-institute-asci/aalto-university-science-institute-international-summer-research-programme',
        'deadline_year': 2027,
        'pattern': r'(?:deadline)[^.!?]{0,75}?\b(\d{1,2})\s+(January)\s+(20\d{2})\b',
        'order': 'dmy',
    },
    'ista-isternship': {
        'url': 'https://phd.ista.ac.at/isternship/isternship-faq/',
        'paused_regex': r'(?:paused|suspended)[^.!?]{0,120}2026\s+and\s+2027\s+application\s+cycles|2026\s+and\s+2027\s+application\s+cycles[^.!?]{0,100}(?:paused|suspended)',
    },
}


class ExtractText(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.ignore = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'):
            self.ignore += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'):
            self.ignore = max(0, self.ignore - 1)
    def handle_data(self, data):
        if not self.ignore:
            self.blocks.append(data)


def normalize_html(html: str) -> str:
    parser = ExtractText()
    parser.feed(html)
    return re.sub(r'\s+', ' ', ' '.join(parser.blocks)).strip()


def extract_deadline(program_id: str, text: str) -> str | None:
    monitor = MONITORS[program_id]
    if 'pattern' not in monitor:
        return None
    found = re.search(monitor['pattern'], text, flags=re.IGNORECASE)
    if not found:
        return None
    a, b, y = found.groups()
    if int(y) != monitor['deadline_year']:
        return None
    try:
        if monitor['order'] == 'mdy':
            month, day = a, int(b)
        else:
            day, month = int(a), b
        date = dt.datetime.strptime(f'{day} {month.title()} {y}', '%d %B %Y').date()
        return date.isoformat()
    except ValueError:
        return None


def detect_paused(text: str) -> bool:
    return re.search(MONITORS['ista-isternship']['paused_regex'], text, flags=re.IGNORECASE) is not None


def fetch_source(url: str, timeout: int = 20) -> str:
    request = urllib.request.Request(
        url,
        headers={'User-Agent': 'ResearchTrackBot/0.2 (+https://github.com/; official-source-checker)',
                 'Accept': 'text/html,application/xhtml+xml'},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        content = response.read(2_000_000)
        encoding = response.headers.get_content_charset() or 'utf-8'
        return content.decode(encoding, errors='replace')


def update_feed(feed: dict, pages: dict[str, str], now: str) -> tuple[dict, list[dict]]:
    """Pure update step used by tests; pages are raw HTML keyed by program ID."""
    changes = []
    successful = 0
    for program in feed['programs']:
        key = program['id']
        if key not in pages or key not in MONITORS:
            continue
        text = normalize_html(pages[key])
        if key == 'ista-isternship':
            if not detect_paused(text):
                continue  # Never infer resumption from absence of a sentence.
            if program['deadlineStatus'] != 'paused':
                changes.append({'id': key, 'field': 'deadlineStatus', 'old': program['deadlineStatus'], 'new': 'paused', 'at': now})
            program['deadlineStatus'] = 'paused'
        else:
            deadline = extract_deadline(key, text)
            if not deadline:
                continue  # A failed parser must not erase a verified deadline.
            if program.get('deadline') != deadline:
                changes.append({'id':key,'field':'deadline','old':program.get('deadline'),'new':deadline,'at':now})
            program['deadline'] = deadline
            program['deadlineStatus'] = 'verified'
        program['lastChecked'] = now
        program['verifiedAt'] = now
        successful += 1
    if successful:
        feed['feedUpdatedAt'] = now
        feed['feedStatus'] = 'auto-checked' if successful == len(MONITORS) else 'partially-checked'
    return feed, changes


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dry-run', action='store_true', help='No file writes')
    args = parser.parse_args(argv)
    feed = json.loads(FEED.read_text(encoding='utf8'))
    pages = {}
    for pid, settings in MONITORS.items():
        try:
            pages[pid] = fetch_source(settings['url'])
            print(f'[fetched] {pid}')
        except (urllib.error.URLError, TimeoutError, OSError, UnicodeError) as exc:
            print(f'[skipped] {pid}: {exc}', file=sys.stderr)
    if not pages:
        print('No sources fetched. Keeping last known verified feed unchanged.')
        return 0
    updated, changes = update_feed(feed, pages, dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds'))
    if not args.dry_run and updated['feedStatus'] != 'seed':
        serialized = json.dumps(updated,ensure_ascii=False,indent=2) + '\n'
        FEED.write_text(serialized, encoding='utf8')
        JS.write_text('window.RESEARCHTRACK_FEED = ' + json.dumps(updated,ensure_ascii=False,indent=2) + ';\n',encoding='utf8')
        existing = json.loads(CHANGES.read_text()) if CHANGES.exists() else []
        CHANGES.write_text(json.dumps((existing+changes)[-50:],ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'Changes detected: {len(changes)}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
