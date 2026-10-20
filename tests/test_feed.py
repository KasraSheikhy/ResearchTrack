import copy
import json
import sys
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from update_opportunities import normalize_html, extract_deadline, detect_paused, update_feed


class FeedTests(unittest.TestCase):
    def test_e3_date(self):
        txt = 'The portal will close on November 1st 2026 at 23:55 Swiss local time.'
        self.assertEqual(extract_deadline('epfl-e3', txt), '2026-11-01')

    def test_life_sciences_date(self):
        self.assertEqual(extract_deadline('epfl-srp', 'Deadline November 15, 2026 – 23:59 CET.'), '2026-11-15')

    def test_aalto_date(self):
        self.assertEqual(extract_deadline('aalto-asci', 'Deadline: 31 January 2027 23:59 (UTC+2)'), '2027-01-31')

    def test_wrong_cycle_does_not_overwrite(self):
        self.assertIsNone(extract_deadline('epfl-e3', 'Deadline November 1st 2025'))

    def test_ignores_scripts(self):
        text = normalize_html('<script>Deadline November 3 2026</script><p>Deadline November 1 2026</p>')
        self.assertNotIn('November 3', text)
        self.assertEqual(extract_deadline('epfl-e3',text), '2026-11-01')

    def test_paused(self):
        self.assertTrue(detect_paused('ISTernship program has been paused for the 2026 and 2027 application cycles.'))
        self.assertFalse(detect_paused('Information about the 2027 cycle will be announced.'))

    def test_only_validated_dates_replace(self):
        original = json.loads((ROOT/'data'/'opportunities.json').read_text())
        updated,changes=update_feed(copy.deepcopy(original),{'epfl-e3':'<p>The deadline is November 2, 2026</p>'},'2026-10-20T10:00:00+00:00')
        e3=next(x for x in updated['programs'] if x['id']=='epfl-e3')
        self.assertEqual(e3['deadline'],'2026-11-02')
        self.assertEqual(len(changes),1)
        unchanged,changes=update_feed(copy.deepcopy(original),{'epfl-e3':'<p>Deadline November 2, 2028</p>'},'2026-10-20T10:00:00+00:00')
        self.assertEqual(next(x for x in unchanged['programs'] if x['id']=='epfl-e3')['deadline'],'2026-11-01')
        self.assertEqual(changes,[])


if __name__=='__main__':
    unittest.main()
