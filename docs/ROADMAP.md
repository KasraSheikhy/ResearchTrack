# ResearchTrack roadmap

ResearchTrack v0.5 is a local-first application tracker with 22 curated public
opportunities. The catalog is useful, but it is not a complete search engine.
The next priority is reliable discovery and verification, not a larger hand-made
list or an admission-prediction model.

## Product focus

ResearchTrack should first serve undergraduate students, master's students and
other early-career researchers looking for research internships, summer programs,
visiting-student calls and research assistant opportunities. PhD, fellowship,
postdoctoral, grant and faculty listings can be added gradually after the discovery
pipeline is reliable. The product should connect discovery to application work,
rather than become another general academic job board.

## Available in v0.5

- [x] Local application, contact, task and deadline tracking
- [x] JSON backup/restore, CSV export and iCalendar export
- [x] 22 multidisciplinary opportunities with official sources
- [x] Discipline, program type, country and deadline filters
- [x] Official website, application and lab/project links when verified
- [x] Private **Add a link** entries in Discover and workspace backups
- [x] Scheduled checks for three deadlines and the paused ISTA cycle
- [x] Local, rule-based fit scoring
- [x] Past, closed and paused calls excluded from open recommendations
- [x] Eligibility shown separately from research fit
- [x] Fit reports, outreach drafts and application task plans
- [x] Parser and advisor tests; manual-only GitHub Pages deployment

## Now: discovery engine foundation

### Source strategy

- [ ] Classify every source as an official source, trusted directory or search-only
  discovery source
- [ ] Treat official program and application pages as the source of truth
- [ ] Keep the discovery source and the official evidence source as separate fields
- [ ] Use directories and search APIs only to find candidate URLs; never publish a
  search snippet as opportunity data
- [ ] Start with source adapters in this order:
  1. ORISE/NIH current opportunities
  2. Google Research student programs
  3. NSF REU and official REU program pages
  4. Pathways to Science directories with official-link verification
  5. EURAXESS and MSCA calls
  6. Council on Undergraduate Research and European Education Area as seed hubs
- [ ] Document source scope, expected update frequency, access rules and parser owner
  in the source registry

### Source discovery

- [ ] Replace the hard-coded monitor list with a versioned source registry
- [ ] Support official program indexes, university career pages, research institute
  directories, funding agencies, RSS feeds and sitemaps
- [ ] Discover candidate URLs without publishing them directly
- [ ] Keep optional search-API adapters separate from the no-key discovery path
- [ ] Record when, where and how every candidate was discovered
- [ ] Respect robots rules, rate limits, response-size limits and allowed content types

### Extraction and evidence

- [ ] Add a generic opportunity extractor with source-specific overrides
- [ ] Extract program name, institution, location, research areas, program type,
  degree level, opening date, deadline, timezone, funding and eligibility
- [ ] Extract official website, application, project and lab links independently
- [ ] Store source evidence for every extracted field
- [ ] Preserve the last verified value when a fetch or parser fails
- [ ] Detect page language and normalize dates without inventing missing details

### Opportunity data model

- [ ] Separate a long-lived program from each yearly application cycle
- [ ] Model institutions, programs, calls, labs, projects and supervisors separately
- [ ] Give every public record a stable ID and retain old cycle history
- [ ] Store deadline timezone, rolling-deadline status and application-open date
- [ ] Structure eligibility by degree level, enrolment, citizenship, residency,
  institution, location and graduation window
- [ ] Structure funding as stipend, tuition, housing, meals and travel support without
  treating missing information as "not funded"
- [ ] Store discovered URL, canonical official URL and application URL independently

### Validation and review

- [ ] Canonicalize URLs and detect redirects before saving candidates
- [ ] Detect duplicates by canonical URL, institution, program name and cycle
- [ ] Score source authority, extraction confidence and data completeness separately
- [ ] Reject stale news posts, expired cached pages and non-program content
- [ ] Add a review queue with field-level evidence and approve/reject controls
- [ ] Publish only reviewed or high-confidence candidates to the public feed
- [ ] Keep an audit trail for additions, edits, closures and rejected candidates

### Monitoring

- [ ] Monitor all published opportunities, not only four hard-coded sources
- [ ] Detect changed deadlines, reopened calls, paused cycles and removed pages
- [ ] Check official, apply and lab links for breakage and redirect drift
- [ ] Use content fingerprints to avoid reporting unchanged pages
- [ ] Retry temporary failures without deleting previously verified data
- [ ] Show source health, last successful check and verification age

### Discovery infrastructure

- [ ] Keep the personal workspace local-first and separate from the public catalog
- [ ] Introduce a public catalog database only when the reviewed feed outgrows static
  JSON and scheduled GitHub Actions
- [ ] Add scheduled workers, a read-only catalog API and a small review interface
- [ ] Make every import idempotent so reruns cannot create duplicate records
- [ ] Track fetch, parse, validation and publication failures separately
- [ ] Add retry limits, request budgets and per-source backoff

## Next: make Discover genuinely useful

- [ ] Add degree-level, funding, eligibility, on-site/remote and deadline-window filters
- [ ] Add PhD, research assistant, fellowship, grant and visiting-student calls
- [ ] Add saved searches and watchlists
- [ ] Notify users only when a matching opportunity is new or materially changed
- [ ] Show catalog coverage and freshness by field, country and source
- [ ] Let users report stale data or submit a private link for public review
- [ ] Import and export reviewed opportunities as CSV or JSON
- [ ] Add a browser bookmarklet or extension for saving an opportunity in one click
- [ ] Keep personal opportunities local unless the user explicitly submits one

## Better matching

- [x] Recognize research areas beyond AI/CS in pasted CV text
- [x] Separate research fit from eligibility text
- [ ] Let users correct detected interests and set preferred or excluded topics
- [ ] Rank personal opportunities alongside the public catalog
- [ ] Separate research fit, eligibility confidence, funding fit and deadline urgency
- [ ] Explain why an opportunity was omitted or ranked low
- [ ] Match against project descriptions, lab pages and publication abstracts with
  a citation for every recommendation
- [ ] Show relevant supervisors and recent work without treating publication count
  as a quality score
- [ ] Support on-device PDF and DOCX text extraction
- [ ] Keep external models optional, consent-based and isolated from private data

## Application workflow

- [ ] Multiple supervisors and ranked labs per application
- [ ] Outreach history, follow-up reminders and reusable email templates
- [ ] Recommender tracking and document versions
- [ ] Drag-and-drop application board
- [ ] Deadline conflict view and weekly planning
- [ ] Compare programs side by side
- [ ] Turn a selected opportunity into a checklist based on its actual requirements
- [ ] CSV/Excel import with a preview before replacing or merging data
- [ ] Safe migration from older ResearchTrack backups

## Success measures

- [ ] Track the percentage of public entries with working official and application
  links
- [ ] Track median verification age and coverage by field, country and program type
- [ ] Track duplicate rate, stale-record rate and incorrect-deadline corrections
- [ ] Track the percentage of entries with structured eligibility and funding data
- [ ] Track saved opportunities that become applications without collecting private
  document content
- [ ] Prefer catalog freshness and accuracy over the raw number of opportunities

## Quality and release work

- [ ] Run browser smoke tests in CI
- [ ] Add feed-schema validation and migration tests
- [ ] Add fixtures for different date formats, languages and broken pages
- [ ] Add security tests for imports, URLs and rendered user content
- [ ] Add keyboard navigation and an accessibility audit
- [ ] Add performance budgets for large catalogs
- [ ] Add contributor tools for proposing and reviewing sources
- [ ] Publish a privacy policy before optional accounts or cloud sync

## Later

- [ ] Build an opportunity graph connecting programs, institutions, labs,
  supervisors, topics and funding sources
- [ ] Add citation-backed lab and recent-publication exploration
- [ ] Generate a weekly digest from saved searches and deadline changes
- [ ] Add multilingual discovery while always preserving the original source text
- [ ] Add an offline installable PWA and background-safe update checks
- [ ] Optional encrypted cross-device sync
- [ ] Optional calendar, browser and email notifications
- [ ] Shared shortlists for mentors or research groups with explicit permissions
- [ ] Opt-in semantic search over verified sources
- [ ] Public catalog statistics and an API for reviewed opportunity data

## Non-goals

- Claiming to cover every opportunity on the internet
- Publishing AI-extracted data without evidence or validation
- Guessing deadlines, eligibility rules or missing links
- Bypassing access controls, robots rules or source terms
- Predicting admission probability from a CV

## Good first issues

1. Define and validate the source-registry schema.
2. Add a candidate record with separate discovery and official evidence URLs.
3. Build canonical URL and duplicate detection tests.
4. Add an ORISE/NIH adapter backed by saved test fixtures.
5. Add one Google Research student-program adapter.
6. Add a local review queue that never modifies the public feed automatically.
7. Add broken-link checks for official, application and lab URLs.
