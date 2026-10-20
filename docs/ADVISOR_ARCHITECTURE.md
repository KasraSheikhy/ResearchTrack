# Advisor Lab — design, privacy and future agents

## Implemented now: local and deterministic

Four user-facing capabilities share the small `advisor.js` engine:

1. **CV Analyzer** — parses text pasted or uploaded as `.txt`/`.md`; detects research areas using a documented keyword dictionary. It does not extract structured CV facts with an LLM.
2. **Opportunity Matcher** — compares the profile signals with official-feed research areas; applies country preferences, listing/funding signals and cycle feasibility checks; provides evidence and warnings. **Fit score is not acceptance probability or a measure of applicant quality.** Missing keywords must not be treated as evidence of missing skills.
3. **Application Planner** — suggests actions for top viable opportunities; adding tasks requires a click.
4. **Outreach Writer** — drafts an editable professor inquiry. It never sends the email and intentionally leaves identity / role placeholders unless entered by the user.

User CV text lives in the JavaScript session only. It is not exported, put into the source feed or persisted with localStorage. Every matching calculation runs on-device. Score explanations rely only on tagged opportunity metadata and keyword overlap; no fabricated labs, contact addresses, papers, acceptance rates or visa decisions.

## Suggested future agent architecture

### Research Scout
- Queries or monitors official university pages and lab directories with page timestamps.
- Records source URL, dates, degree requirements, nationality/visa conditions and whether information is confirmed.
- On ambiguous or changed dates, opens an editorial review ticket; never silently overwrites a confirmed deadline.

### Resume / Profile Agent
- Parses PDF/DOCX locally using a reviewed, bundled parser; normalizes skills, academic stage, selected projects and publication links.
- Lets users edit extracted facts. Keep CV content private by default.
- Produces a CV critique that distinguishes observed evidence from suggestions.

### Lab Fit Agent
- Reads named labs and publicly listed recent publications, with links/DOIs.
- Explains *why* a specific project's methods and topics relate to specific parts of a CV.
- Separates fit, eligibility, funding, timing, and application competitiveness. Never predicts acceptance from keyword overlap alone.

### Application Co-pilot
- Produces a personalized plan and document checklist, interview questions, and outreach drafts.
- The user must explicitly approve sending mail, saving cloud data or editing calendars.

## Optional AI backend (not yet implemented)

- Provide explicit, granular consent each time a user elects cloud-based processing.
- Use a secure server proxy for API calls; never commit model API keys to a public GitHub Pages repository or expose a shared secret in browser JS.
- Encrypt in transit; define retention and deletion controls; minimize resume data sent to an AI provider.
- Treat crawled webpages, CV text and PDF contents as **untrusted data**: do not obey instructions embedded within documents; prevent prompt-injection effects on tools and outputs.
- Cite official sources for every researched date, requirement and contact. Preserve uncertainty; do not generate email addresses.
- Rate-limit use, track costs, and write consent + access logging policies before public launch.
- Introduce human review for eligibility, especially work authorization and regulated-data research.

## Acceptance criteria for v0.5

- Works with selectable-text PDF/DOCX in-browser while offline; no external CV upload.
- All extracted CV claims user-editable; tests for non-text/large/corrupt files.
- Opportunity fit explanations link to research-area sources and, where available, labs/publications.
- At least 30 verified sources, with audit history and parser failure behavior.
- Accessibility testing and user-facing feedback on scoring limitations.
