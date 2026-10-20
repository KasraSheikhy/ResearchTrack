"""Optional browser smoke tests. Run: python tests/ui_smoke.py (requires Playwright and Chromium).

Loads assets inline to work in environments without a local HTTP server.
Does not upload any user data or visit external sites.
"""
from pathlib import Path
import copy
import json
import os

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def assembled(mock_feed=None):
    doc = (ROOT / 'index.html').read_text(encoding='utf-8')
    doc = doc.replace('<link rel="stylesheet" href="styles.css" />',
                      '<style>' + (ROOT / 'styles.css').read_text(encoding='utf-8') + '</style>')
    doc = doc.replace('<script src="data/opportunities.js"></script>',
                      '<script>' + (ROOT / 'data/opportunities.js').read_text(encoding='utf-8') + '</script>')
    code = (ROOT / 'advisor.js').read_text(encoding='utf-8') + '\n' + (ROOT / 'app.js').read_text(encoding='utf-8')
    if mock_feed:
        history = [{'id':'epfl-e3', 'field':'deadline', 'old':'2026-11-01',
                    'new':'2026-11-02', 'at':'2026-10-21T00:00:00Z'}]
        response = {'feed':mock_feed,'history':history}
        code = '''window.fetch = async (u) => new Response(JSON.stringify(String(u).includes('changes.json') ? __HISTORY__ : __FEED__), {status:200,headers:{'Content-Type':'application/json'}});
'''.replace('__HISTORY__',json.dumps(history)).replace('__FEED__',json.dumps(mock_feed)) + code
    return doc.replace('<script src="app.js"></script>', '<script>' + code + '</script>')


def run():
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=os.environ.get('CHROME_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 950})
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.set_content(assembled(), wait_until='load')
        assert page.get_by_role('heading', name='Your research, organized.').count() == 1
        page.locator('[data-view="advisor"]').click()
        assert page.get_by_role('heading', name='Find your research fit.').count() == 1
        page.locator('#advisor-cv-text').fill('Computer Engineering undergraduate. Research in machine learning, statistics and Python. I know linear algebra and algorithms, with theoretical interests in ML.')
        page.locator('#advisor-interests').fill('Machine learning, statistics')
        page.locator('[data-action="advisor-analyze"]').click()
        assert page.locator('.advisor-match').count() == 9
        assert 'Aalto' in page.locator('.advisor-grid').inner_text()
        page.locator('[data-action="advisor-add-plan"]').click()
        page.locator('[data-view="tasks"]').click()
        assert 'Verify eligibility' in page.locator('body').inner_text()
        page.locator('[data-view="advisor"]').click()
        page.locator('[data-action="advisor-email"]').first.click()
        assert page.locator('#advisor-draft-text').count() == 1
        assert 'Dear ' in page.locator('#advisor-draft-text').input_value()
        page.locator('[data-view="updates"]').click()
        assert page.locator('.source-tile').count() == 9
        page.locator('[data-view="contacts"]').click()
        page.locator('[data-action="new-contact"]').click()
        page.locator('#field-name').fill('Dr. Example')
        page.locator('#field-rank').fill('1')
        page.locator('#field-email').fill('example@example.edu')
        page.locator('#field-outreachStatus').select_option('Contacted')
        page.locator('#drawer-form [type=submit]').click()
        assert page.get_by_text('Dr. Example').count() >= 1
        page.locator('[data-view="applications"]').click()
        page.locator('[data-action="edit-application"]').first.click()
        page.locator('#field-lab').fill('Theory Lab')
        page.locator('#drawer-form [type=submit]').click()
        assert 'Theory Lab' in page.locator('table').inner_text()
        page.locator('[data-view="calendar"]').click()
        assert page.locator('.cal-day').count() >= 28
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.body.scrollWidth') <= 390
        assert not errors, errors
        page2 = browser.new_page(viewport={'width': 1200,'height': 800})
        page2.on('pageerror', lambda e: errors.append(str(e)))
        changed = json.loads((ROOT / 'data/opportunities.json').read_text())
        changed['feedUpdatedAt'] = '2026-10-21T00:00:00Z'
        changed['programs'][0]['deadline'] = '2026-11-02'
        page2.set_content(assembled(changed), wait_until='load')
        page2.wait_for_function("document.querySelector('#update-count').textContent === '1'", timeout=5000)
        page2.locator('[data-view="updates"]').click()
        assert 'Nov 2' not in page2.locator('.update-item').first.inner_text() or page2.locator('.update-item').count()>=2
        assert '2026-11-02' in page2.locator('.update-item').first.inner_text()
        page2.locator('[data-action="mark-update"]').click()
        assert page2.locator('#update-count').inner_text()=='0'
        assert not errors, errors
        browser.close()
        print('PASS: overview, updates, contacts, application editing, calendar, responsive layout; feed alerts, marking alerts read, zero uncaught JS errors')


if __name__ == '__main__':
    run()
