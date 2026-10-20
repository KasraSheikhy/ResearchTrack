# ResearchTrack · Product roadmap

> A clean, open-source workspace to discover academic opportunities and manage
> research applications, contacts and deadlines. Checkboxes below distinguish
> code that **already exists** from planned work.

## Phase 0 — Scope and data model
- [x] Define opportunity, application, contact and task entities
- [x] Separate **public verified sources** from **private user data**
- [x] Define deadline statuses: verified, unannounced, rolling, paused
- [x] Choose a no-dependency static MVP for immediate use and GitHub Pages hosting
- [x] Publish a CONTRIBUTING guide
- [ ] Publish a code of conduct

## Phase 1 — Working personal dashboard (v0.2)
- [x] Responsive dark-mode dashboard with core stats
- [x] General academic application types (internship, RA, PhD, master’s, summer school)
- [x] Source-linked opportunity catalog with search and filters
- [x] Application tracker (status, university, country, lab, PI, email, funding, visa)
- [x] Application document checklist
- [x] Multiple research contacts, emails and follow-up dates
- [x] Tasks with due dates and completed states
- [x] Monthly deadline and task calendar
- [x] JSON backup/restore; CSV exports; iCalendar export
- [x] Private browser-local persistence
- [x] Sample 2027 programs with sources; ISTA marked **paused**
- [ ] Drag-and-drop Kanban board for applications
- [x] Ranked lab / supervisor contacts, linked to opportunities
- [ ] Multi-lab preference ranking embedded directly within each application
- [ ] Migration helper for older ResearchTrack export formats
- [ ] Import from CSV and Excel

## Phase 2 — Trustworthy opportunity discovery
- [x] Scheduled GitHub Actions workflow that reads limited official sources
- [x] Rule-based, year-scoped extraction of 3 verified program deadlines
- [x] Fail-safe parser: missing/ambiguous results never erase a previous date
- [x] Detect suspended ISTA ISTernship cycle
- [x] Source freshness data, official URL and deadline timezone in the feed
- [x] Periodic remote public-feed refresh on deployed website (15 minutes while open)
- [x] Unit tests for deadline parsing and failure cases
- [ ] Expand source coverage beyond 4 monitored programs
- [ ] Human review queue for questionable date changes
- [x] Source updates tab / audit history in the UI
- [ ] New opportunity submissions (GitHub Issues / pull requests)
- [x] Local, in-app deadline-change alerts for tracked opportunities
- [ ] External notifications (email / push) when followed opportunities change

## Phase 2.5 — Advisor & research matching (v0.4)
- [x] Introduce a separate offline advisor engine (no personal data uploaded)
- [x] CV text paste / `.txt` / `.md` import, profile skill detection
- [x] Explainable research-alignment ranking with eligibility/deadline warnings
- [x] Session-only CV privacy and no CV data in JSON workspace backups
- [x] Export a Markdown fit report
- [x] Suggested application action plan with opt-in task creation
- [x] Editable outreach email draft with user review; no auto-send
- [x] Node unit tests + browser smoke tests for Advisor
- [ ] Robust PDF/DOCX parsing entirely on-device (no external document upload)
- [ ] Allow users to edit profile signals and assign manual weighting
- [ ] Additional opportunity metadata: required qualifications, host PI, lab papers and DOI links
- [ ] Evidence-grounded semantic research fit from publications with source citations
- [ ] Opt-in LLM provider with server-side key handling, privacy controls and rate limits
- [ ] CV critique with specific evidence and user-approved rewrites
- [ ] Cross-source eligibility/visa verification with human-review disclaimers
- [ ] Personal statement draft, interview prep and explicit user-approved actions

## Phase 3 — Accounts and cross-device sync
- [ ] Build optional authentication (GitHub/Google)
- [ ] Supabase Postgres schema + row-level security tests
- [ ] Opt-in encrypted backups and account sync
- [ ] Safe local-to-cloud migration without accidental public exposure
- [ ] Notification preferences (browser and opt-in email)
- [ ] Google Calendar OAuth integration (opt-in)

## Phase 4 — Public release
- [x] MIT license
- [x] Github Pages deployment workflow (ready; not yet activated)
- [x] Standalone README with setup/deployment instructions
- [x] Optional local Playwright smoke test: desktop, mobile, contact, application, calendar and feed alerts
- [ ] Automated browser UI regression tests in CI
- [ ] Accessibility audit and keyboard navigation improvements
- [ ] Security review (XSS, data import limits, source monitoring)
- [ ] Privacy policy + terms explaining data retention
- [x] Open-source contribution and opportunity issue templates
- [ ] Public project board
- [ ] Create public GitHub repository and publish site

## First issue candidates
1. **Improve deadline parsers**: add source-specific tests and manual review workflow.
2. **Multiple supervisors per application**: model lab preferences with rank and correspondence history.
3. **Notification center**: track deadline changes without sending private application data to a public server.
4. **Cloud account phase**: implement opt-in Supabase sync with RLS and exportability.
5. **Responsive UX**: add keyboard shortcuts, focus management and accessible calendar interactions.
