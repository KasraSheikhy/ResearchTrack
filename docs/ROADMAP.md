# ResearchTrack roadmap

ResearchTrack v0.5 is a local application tracker with a curated public catalog.
The 22 current entries are not a complete search engine. Coverage and source
quality come before more AI features.

## Available in v0.5

- [x] Local application, contact, task and deadline tracking
- [x] JSON backup/restore, CSV export and iCalendar export
- [x] 22 multidisciplinary opportunities with official sources
- [x] Discipline, program type, country and deadline filters
- [x] Official website, application and lab/project links when verified
- [x] Private **Add a link** entries in Discover, included in workspace backup
- [x] Scheduled checks for three deadlines and the paused ISTA cycle
- [x] Local fit scoring with past/closed calls excluded from open recommendations
- [x] Eligibility shown separately from research fit
- [x] Fit reports, outreach drafts and application task plans
- [x] GitHub Pages deployment with parser and advisor tests

## Next: build the discovery engine

- [ ] Discover new calls from official university, institute and funding-agency pages
- [ ] Normalize dates, application cycles, funding, degree level and eligibility with
  a source citation for every imported field
- [ ] Detect duplicate programs and redirects before they enter the public catalog
- [ ] Send uncertain, conflicting or incomplete results to a human review queue
- [ ] Monitor broken links, changed deadlines and reopened/closed calls
- [ ] Add PhD, research assistant, fellowship and visiting-student opportunities
- [ ] Add saved searches and alerts for new matching opportunities
- [ ] Let users report stale data or submit a private link for public review
- [ ] Show catalog coverage and freshness by field, country and last verification
- [ ] Import/export reviewed opportunities as CSV or JSON

## Better matching

- [x] Recognize research areas beyond AI/CS in pasted CV text
- [ ] Let users edit detected fields, exclude unwanted topics and set priorities
- [ ] Rank custom opportunities as well as public catalog entries
- [ ] Match against project descriptions, lab pages and publication abstracts with
  a citation for every recommendation
- [x] Separate research fit from eligibility text
- [ ] Add independent eligibility confidence, funding fit and deadline urgency
- [ ] Check selected labs and recent publications, with links to the underlying source
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
