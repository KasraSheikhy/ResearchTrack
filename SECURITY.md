# Security and privacy

ResearchTrack's public starter version stores application data only in the browser's
`localStorage`. It does not have accounts, remote backups or an application API.

- The public opportunity feed contains program metadata only, and is deployed as static JSON.
- Never commit personal backup JSON or applicant email addresses into the public repository.
- Export a backup before clearing browser storage, switching devices or using private mode.
- Browser-local data can be read by browser extensions or anyone with access to the browser profile.
- Import only backups you trust. Imported records are displayed with HTML escaping, but the
  application has not undergone a formal security audit.
- Source monitoring checks a small set of official pages. A 'verified' timestamp only
  indicates a program-specific parser matched the expected cycle; it does not guarantee
  availability, visa eligibility, funding or admission.

**Responsible disclosure:** Until a maintainer chooses a dedicated contact channel, please
open a GitHub issue with non-sensitive details. Do not post working exploits, passwords,
private account data or personal backups publicly.
