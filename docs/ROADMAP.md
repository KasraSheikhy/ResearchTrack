# ResearchTrack roadmap

ResearchTrack v0.5 is a local application tracker with a small, curated public
catalog. The catalog is not a complete search engine. Coverage and source quality
come before more AI features.

## Available in v0.5

- [x] Local application, contact, task and deadline tracking
- [x] JSON backup/restore, CSV export and iCalendar export
- [x] Curated opportunity catalog with official sources
- [x] Direct application/instruction links when available
- [x] Manual entry for programs outside the catalog, including URLs and research areas
- [x] Scheduled checks for three deadlines and the paused ISTA cycle
- [x] Local fit scoring with deadline and eligibility warnings
- [x] Fit reports, outreach drafts and application task plans
- [x] GitHub Pages deployment with parser and advisor tests

## Next: make discovery useful

- [ ] Expand beyond the current starter catalog
- [ ] Cover life sciences, chemistry, materials, physics, earth and environmental
  science, engineering, mathematics, social science and interdisciplinary programs
- [ ] Add PhD, research assistant, fellowship, summer school and visiting-student
  opportunities instead of mostly internships
- [ ] Store both the official program page and the direct application/instructions link
- [ ] Add lab, supervisor, project and recent-publication links where the program
  publishes them
- [ ] Add source adapters for official university pages and trusted public datasets
- [ ] Import opportunities from CSV/JSON and export a reusable catalog contribution
- [ ] Detect duplicate programs across sources and preserve the strongest citation
- [ ] Track application cycle, opening date, deadline timezone, funding, eligibility,
  nationality restrictions and last verification separately
- [ ] Add saved searches and filters for field, degree level, country, funding,
  eligibility, remote/on-site and deadline window
- [ ] Let users follow a search and see newly added or changed opportunities
- [ ] Add a review queue for ambiguous or conflicting source data
- [ ] Show catalog coverage and freshness instead of implying complete results

## Better matching

- [x] Recognize research areas beyond AI/CS in pasted CV text
- [ ] Let users edit detected fields, exclude unwanted topics and set priorities
- [ ] Rank custom opportunities as well as public catalog entries
- [ ] Match against project descriptions, lab pages and publication abstracts with
  a citation for every recommendation
- [ ] Separate research fit, eligibility confidence, funding fit and deadline urgency
- [ ] Explain why an opportunity was omitted or ranked low
- [ ] Support on-device PDF/DOCX text extraction
- [ ] Keep any external model optional, consent-based and isolated from private data

## Application workflow

- [ ] Multiple supervisors and ranked labs per application
- [ ] Outreach history, follow-up reminders and reusable email templates
- [ ] Recommender tracking and document versions
- [ ] Drag-and-drop application board
- [ ] Deadline conflict view and weekly planning
- [ ] CSV/Excel import with a preview before replacing or merging data
- [ ] Safe migration from older ResearchTrack backups

## Quality and release work

- [ ] Run browser smoke tests in CI
- [ ] Add keyboard navigation and an accessibility audit
- [ ] Add feed-schema validation and broken-link checks
- [ ] Add security tests for imports, URL handling and rendered user content
- [ ] Add contributor tools for proposing and reviewing new opportunities
- [ ] Publish a clear privacy policy before optional accounts or cloud sync

## Later, only if needed

- [ ] Optional encrypted cross-device sync
- [ ] Optional calendar integration and browser/email notifications
- [ ] Shared shortlists for mentors or research groups with explicit permissions
- [ ] Opt-in semantic search over verified sources

## Good first issues

1. Add a verified non-CS opportunity with both official and application links.
2. Add feed-schema and broken-link tests.
3. Add field, degree-level and funding filters.
4. Rank manually entered opportunities in the Fit Advisor.
5. Add a review queue for ambiguous deadline changes.
