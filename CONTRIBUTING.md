# Contributing to ResearchTrack

Thanks for helping make research opportunities easier to find and track.

## Contributing code

1. Open an issue describing the problem, or link an existing issue.
2. Make one focused change in a branch.
3. Run `python3 -m unittest discover -s tests -v`.
4. For UI work, optionally install Playwright and run `python3 tests/ui_smoke.py` with Chromium.
5. Open a pull request with a screenshot for visible UI changes.

## Contributing opportunities

- Link the program's **official** application page.
- Keep dates tied to an explicit application cycle and timezone.
- Do not mark a deadline as verified from an aggregator, speculation or last year's date.
- New automatic monitors need source-specific parser tests and fail-safe behavior.
- If a page is ambiguous, leave the deadline empty and set `deadlineStatus: "unannounced"`.
- Respect websites' robots rules, rate limits and terms; no aggressive scraping.

## Privacy

Never include a student's personal data, private notes, CV, email history, credentials,
private exported JSON or API keys in public issues or pull requests.

## Project scope

Support all applicants: internships, research assistantships, PhDs, master's,
fellowships and summer schools. Features should be accessible, privacy-first,
mobile-friendly, well-sourced and ideally free to host.
