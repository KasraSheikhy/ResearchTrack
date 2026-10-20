/* ResearchTrack v0.5 — dependency-free, local-first application manager.
 * Shared/public opportunities: window.RESEARCHTRACK_FEED + periodically fetched JSON.
 * Personal applications/contacts/tasks: localStorage only, never uploaded by the app.
 */
(() => {
  'use strict';
  const STORAGE = 'researchtrack-workspace-v2';
  const STATUS = ['Wishlist','Researching','Preparing','Applied','Interview','Offer','Accepted','Rejected','Withdrawn'];
  const PRIORITIES = ['Very high','High','Medium','Conditional'];
  const APPLICATION_TYPES = ['Research internship','Research assistantship','PhD','Master’s','Summer school','Fellowship','Other'];
  const CHECKLIST = ['Check eligibility','Select a lab / supervisor','Tailor CV','Write motivation letter / SOP','Prepare transcripts','Request recommendation letter','Submit the application','Save confirmation / follow up'];
  const EMOJI = {Finland:'🇫🇮',Switzerland:'🇨🇭','United States':'🇺🇸',Japan:'🇯🇵',Austria:'🇦🇹','Saudi Arabia':'🇸🇦',Germany:'🇩🇪',Canada:'🇨🇦'};
  const TODAY = () => new Date().toISOString().slice(0,10);
  const Advisor = window.ResearchTrackAdvisor;
  let advisorCV = ''; // session-only: never written to localStorage
  let advisorInterests = '';
  let advisorCountries = '';
  let advisorProfile = null;
  let advisorMatches = [];
  let advisorDraft = '';
  let advisorDraftProgram = '';
  let advisorDraftProfessor = '';
  let advisorDraftLab = '';
  let advisorDraftDegree = '';

  const $ = sel => document.querySelector(sel);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeUrl = v => {try {const url = new URL(v); return ['http:','https:'].includes(url.protocol) ? url.href : '#';}catch{return '#';}};
  const validUrl = v => safeUrl(v) !== '#';
  const uid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1000000)}`;
  const niceDate = s => {if(!s)return 'To be announced';const d=new Date(`${s}T12:00:00Z`);return Number.isNaN(d.valueOf())?'Unknown':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).format(d);};
  const shortDate = s => s ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(`${s}T12:00:00Z`)) : 'TBA';
  const daysUntil = s => s ? Math.ceil((Date.parse(`${s}T12:00:00Z`)-Date.parse(`${TODAY()}T12:00:00Z`))/86400000) : null;
  const statusTag = x => ['Accepted','Offer'].includes(x)?'good':['Applied','Interview'].includes(x)?'verified':['Rejected','Withdrawn'].includes(x)?'red':'purple';
  const deadlineTag = x => x==='verified'?'good':['paused','closed'].includes(x)?'red':x==='rolling'?'warn':'';
  const sourceFeed = window.RESEARCHTRACK_FEED || {programs:[],feedUpdatedAt:null,feedStatus:'unavailable'};
  let feed = sourceFeed;
  let publicChanges = [];
  const localSeed = () => ({version:2,notifications:[],customOpportunities:[],applications:sourceFeed.programs.map(p=>({id:uid(),programId:p.id,name:p.name,status:'Wishlist',priority:p.priority||'Medium',lab:'',supervisor:'',email:'',deadlineOverride:'',fundingNotes:'',visaNotes:'',notes:'',submittedAt:'',confirmation:'',checklist:{},createdAt:TODAY(),updatedAt:TODAY()})),contacts:[],tasks:[
    {id:uid(),title:'Review EPFL E3 eligibility and shortlist host labs',programId:'epfl-e3',due:'2026-10-24',done:false},
    {id:uid(),title:'Prepare your CV and motivation letter for EPFL E3',programId:'epfl-e3',due:'2026-10-27',done:false},
    {id:uid(),title:'Check Aalto AScI project list in mid-December',programId:'aalto-asci',due:'2026-12-15',done:false}
  ]});
  function load(){try{const item=localStorage.getItem(STORAGE);if(item){const o=JSON.parse(item);if(o?.version===2&&Array.isArray(o.applications)&&Array.isArray(o.contacts)&&Array.isArray(o.tasks)){o.notifications=Array.isArray(o.notifications)?o.notifications:[];o.customOpportunities=Array.isArray(o.customOpportunities)?o.customOpportunities:[];return o;}}}catch(e){console.warn('Storage read unavailable',e);}return {...localSeed(),notifications:[]};}
  let state=load(); let view='overview'; let query=''; let filter='all'; let country='all'; let discipline='all'; let programType='all'; let selectedMonth=new Date();selectedMonth.setDate(1);let drawerType=null;let drawerId=null;let toastTimer=null;
  const allOpportunities = () => [...feed.programs,...state.customOpportunities.map(p=>({...p,personal:true}))];
  const findP = id => allOpportunities().find(p=>p.id===id);
  const appFor = id => state.applications.find(a=>a.programId===id);
  const displayDeadline = a => a.deadlineOverride || findP(a.programId)?.deadline || '';
  const displayCountry = a => findP(a.programId)?.country || a.country || '';
  const appName = a => a.name || findP(a.programId)?.name || 'New application';
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){notify('Cannot save locally. Export a backup.');} }
  function notify(message){const t=$('#toast');t.textContent=message;t.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.add('hidden'),3000);}
  function tag(text, cls=''){return `<span class="tag ${cls}">${esc(text)}</span>`;}
  function pageHead(kicker,title,subtitle,actions=''){return `<div class="page-head"><div><div class="kicker">${esc(kicker)}</div><h1>${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p></div>${actions?`<div class="page-tools">${actions}</div>`:''}</div>`;}
  function taskProgress(a){const n=CHECKLIST.filter((_,i)=>a.checklist?.[i]).length;return {n,total:CHECKLIST.length,pct:Math.round(n/CHECKLIST.length*100)};}
  function deadlineSquare(day){const d=new Date(`${day}T12:00:00Z`);return `<div class="date-square"><b>${d.getUTCDate()}</b><span>${d.toLocaleString('en-US',{month:'short',timeZone:'UTC'})}</span></div>`;}
  function daysLabel(d){const n=daysUntil(d);return n===null?'TBA':n<0?'Closed':n===0?'Today':`${n} days left`;}
  function prioritySort(x){return ({'Very high':0,'High':1,'Medium':2,'Conditional':3})[x]??4;}
  function render(){
    document.querySelectorAll('[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));
    $('#crumb').textContent=({overview:'Overview',opportunities:'Discover',applications:'Applications',contacts:'Contacts',tasks:'Tasks',calendar:'Calendar',updates:'Source updates',advisor:'Fit Advisor',settings:'Settings'})[view];
    $('#opportunity-count').textContent=allOpportunities().length;
    $('#update-count').textContent=(state.notifications||[]).filter(n=>!n.seen).length;
    const fn={overview:renderOverview,opportunities:renderOpportunities,applications:renderApplications,contacts:renderContacts,tasks:renderTasks,calendar:renderCalendar,updates:renderUpdates,advisor:renderAdvisor,settings:renderSettings}[view];
    $('#content').innerHTML=fn();
  }
  function renderAdvisor(){
    const analyzed=advisorProfile!==null;
    const chips=(advisorProfile?.areas||[]).map(area=>tag(area,'verified')).join(' ');
    const actionable=advisorMatches.filter(m=>m.canApply);
    const cvReview=Advisor.reviewCV(advisorCV,advisorProfile||{});
    const high=actionable.filter(m=>(m.score||0)>=65).length;
    const cards=analyzed?advisorMatches.map((m,i)=>{
      const e=m.blockers.map(b=>`<div class="advisor-warning">⚠ ${esc(b)}</div>`).join('');
      const positives=m.reasons.map(x=>`<div class="advisor-reason">✓ ${esc(x)}</div>`).join('');
      const matching=[...m.exact,...m.related].map(v=>tag(v,'verified')).join(' ');
      const tracked=!!appFor(m.id);
      const applyLink=validUrl(m.applicationUrl)?`<a class="btn btn-small btn-accent" href="${esc(safeUrl(m.applicationUrl))}" target="_blank" rel="noopener noreferrer">Apply / instructions ↗</a>`:'';
      const sourceLink=validUrl(m.sourceUrl)?`<a class="btn btn-small btn-quiet" href="${esc(safeUrl(m.sourceUrl))}" target="_blank" rel="noopener noreferrer">Official website ↗</a>`:'';
      const labsLink=validUrl(m.labsUrl)?`<a class="btn btn-small btn-quiet" href="${esc(safeUrl(m.labsUrl))}" target="_blank" rel="noopener noreferrer">Explore labs ↗</a>`:'';
      return `<article class="panel advisor-match ${m.canApply?'':'advisor-inactive'}"><div class="advisor-match-head"><div class="advisor-number">${i+1}</div><div style="flex:1;min-width:0"><h3>${esc(m.name)}</h3><div class="medium text-muted">${esc(m.institution||'')} · ${esc(m.country||'')} · ${esc(m.type||'')}</div></div><div class="advisor-score"><strong>${m.score===null?'—':m.score}</strong><small>/ 100 research fit</small></div></div><div class="advisor-trackbar"><div style="width:${m.score||0}%"></div></div><div class="advisor-match-meta">${tag(m.label,m.canApply&&m.score>=65?'good':m.canApply?'purple':'red')}${tag(m.deadline?niceDate(m.deadline):m.deadlineStatus==='closed'?'Call closed':'Deadline TBA',deadlineTag(m.deadlineStatus))}</div>${matching?`<div class="advisor-chips">${matching}</div>`:''}<div class="advisor-explanation">${positives}${e}</div><div class="eligibility-box"><b>Eligibility — check separately from fit</b><span>${esc(m.eligibility||'Confirm degree, nationality, institution and visa requirements on the official page.')}</span></div><div class="advisor-match-actions">${applyLink}${sourceLink}${labsLink}<button class="btn btn-small" data-action="advisor-track" data-id="${esc(m.id)}">${tracked?'Edit tracked application':'Add to tracker'}</button><button class="btn btn-small" data-action="advisor-email" data-id="${esc(m.id)}">Draft outreach ↗</button></div></article>`;
    }).join(''):'<div class="panel advisor-empty"><div class="advisor-large-icon">✧</div><h2>Your research shortlist starts here</h2><p>Paste your CV or upload a plain-text resume, add your interests, and run the local fit analysis. Nothing leaves your device.</p></div>';
    const draft=advisorDraft?`<section class="panel advisor-draft"><div class="panel-head"><h2>Professor outreach draft</h2><button class="btn btn-small" data-action="advisor-copy-draft">Copy draft</button></div><div class="panel-body"><p class="medium text-muted">Generated for ${esc(advisorDraftProgram)}. Replace all placeholders and verify the professor's research before sending.</p><div class="form-grid" style="margin:12px 0"><div class="form-field"><label for="advisor-professor">Professor / PI</label><input class="input" id="advisor-professor" value="${esc(advisorDraftProfessor)}" placeholder="e.g. Prof. Jane Smith" /></div><div class="form-field"><label for="advisor-lab">Lab</label><input class="input" id="advisor-lab" value="${esc(advisorDraftLab)}" placeholder="Lab / Research group" /></div><div class="form-field wide"><label for="advisor-degree">Your introduction</label><input class="input" id="advisor-degree" value="${esc(advisorDraftDegree)}" placeholder="e.g. a third-year BSc Computer Science student at ..." /></div></div><button class="btn btn-small btn-quiet" data-action="advisor-refresh-draft">Regenerate using these details</button><textarea id="advisor-draft-text" class="textarea advisor-email-area" spellcheck="true">${esc(advisorDraft)}</textarea><button class="btn btn-accent" data-action="advisor-download-email">Download draft (.txt)</button></div></section>`:'';
    return pageHead('LOCAL-FIRST · FIT ADVISOR','Compare your profile with the catalog.','Rank the opportunities currently in ResearchTrack and build an application plan.',`<button class="btn btn-quiet" data-action="advisor-clear">Clear CV from this session</button>`)
      +`<div class="info-banner"><span style="font-size:16px">🔒</span><span><strong>Privacy:</strong> CV text is kept in this browser tab only — never saved to the workspace, uploaded or sent to an AI provider. The offline advisor uses transparent keyword rules, <strong>not an LLM</strong>. Fit scores are <strong>not admission probabilities</strong>.</span></div>`
      +`<div class="info-banner"><span style="font-size:16px">ℹ</span><span><strong>Coverage:</strong> this ranks the ${feed.programs.length} public programs in the curated catalog; it does not search the whole web. Personal links stay in Discover and in your browser only.</span></div>`
      +`<section class="advisor-stages"><div class="advisor-stage"><span class="advisor-stage-icon">01</span><div><strong>CV Analyzer</strong><small>Detect areas and skills</small></div></div><div class="advisor-stage"><span class="advisor-stage-icon">02</span><div><strong>Opportunity Matcher</strong><small>Explain research alignment</small></div></div><div class="advisor-stage"><span class="advisor-stage-icon">03</span><div><strong>Application Planner</strong><small>Prioritize the next steps</small></div></div><div class="advisor-stage"><span class="advisor-stage-icon">04</span><div><strong>Outreach Writer</strong><small>Prepare an editable email</small></div></div></section>`
      +`<section class="panel advisor-input-panel"><div class="panel-head"><h2>01 — Your research profile</h2>${analyzed?tag('Analyzed locally','good'):tag('Private · session only','verified')}</div><div class="panel-body"><div class="form-grid"><div class="form-field wide"><label for="advisor-cv-text">Resume / CV text</label><textarea class="textarea advisor-cv-area" id="advisor-cv-text" placeholder="Paste your CV here — education, research experience, projects, technical skills, publications and awards...">${esc(advisorCV)}</textarea><div class="medium text-muted">You can also upload a .txt or .md file. PDF/DOCX extraction is planned; for now, copy selectable text from those files.</div></div><div class="form-field"><label for="advisor-interests">Research interests (optional)</label><input id="advisor-interests" class="input" placeholder="Machine learning, probability, algorithms..." value="${esc(advisorInterests)}" /></div><div class="form-field"><label for="advisor-countries">Preferred countries (comma-separated)</label><input id="advisor-countries" class="input" placeholder="Finland, Switzerland, Japan" value="${esc(advisorCountries)}" /></div></div><div class="advisor-controls"><label class="btn btn-quiet btn-small" for="advisor-cv-file">↑ Upload text CV</label><input type="file" id="advisor-cv-file" accept=".txt,.md,text/plain,text/markdown" hidden /><button class="btn btn-accent" data-action="advisor-analyze">✧ Analyze & match opportunities</button></div>${analyzed?`<div class="advisor-profile"><div class="row space-between"><strong>Profile detected</strong><span class="tiny text-muted">${advisorProfile.characters} CV characters · ${advisorProfile.keywords.length} technical terms</span></div><div class="advisor-chips">${chips||'<span class="medium text-muted">No matching areas detected; add research interests to improve results.</span>'}</div></div>`:''}</div></section>`
      +(analyzed&&advisorCV.trim()?`<section class="panel advisor-feedback"><div class="panel-head"><h2>CV clarity review</h2>${tag('Heuristic checks · review manually')}</div><div class="panel-body"><div class="advisor-feedback-grid"><div><div class="section-subtitle">Signals spotted</div>${cvReview.strengths.map(x=>`<div class="advisor-reason">✓ ${esc(x)}</div>`).join('')||'<div class="medium text-muted">No reliable structured signals detected.</div>'}</div><div><div class="section-subtitle">Suggested improvements</div>${cvReview.suggestions.map(x=>`<div class="advisor-suggestion">→ ${esc(x)}</div>`).join('')}</div></div></div></section>`:'')
      +`<div class="advisor-results-head"><div><h2>02 — Opportunity matches</h2><p class="subtitle">${analyzed?`${high} strong research-alignment matches · ${advisorMatches.length} programs analyzed`:'Personalized rankings appear after analysis.'}</p></div><div class="row wrap">${analyzed?`<button class="btn btn-quiet" data-action="advisor-download-report">↓ Download fit report</button><button class="btn btn-accent" data-action="advisor-add-plan">+ Add action plan to tasks</button>`:''}</div></div>`
      +`<div class="advisor-grid">${cards}</div>`
      +draft
      +`<section class="panel" style="margin-top:20px"><div class="panel-body"><strong>Catalog coverage comes first</strong><p class="medium text-muted" style="margin:9px 0 0">The next discovery work is broader subject coverage, more official sources, direct application links, duplicate detection and saved searches. Smarter matching is only useful after the catalog is trustworthy.</p></div></section>`;
  }
  function analyzeAdvisor(){
    if(!Advisor){notify('Advisor engine unavailable');return;}
    advisorCV=$('#advisor-cv-text')?.value||advisorCV;
    advisorInterests=$('#advisor-interests')?.value||'';
    advisorCountries=$('#advisor-countries')?.value||'';
    if(advisorCV.trim().length<60 && !advisorInterests.trim()){notify('Paste a CV (60+ characters) or enter research interests');return;}
    advisorProfile=Advisor.extractProfile(advisorCV,advisorInterests);
    advisorMatches=Advisor.rank(feed.programs,advisorProfile,{countries:advisorCountries},TODAY());
    advisorDraft='';advisorDraftProgram='';render();notify('Research-fit analysis completed locally');
  }
  function advisorEmail(id,regenerate=false){
    const m=advisorMatches.find(x=>x.id===id);if(!m||!advisorProfile)return;
    if(!regenerate){advisorDraftProfessor=state.contacts.find(c=>c.programId===id)?.name||'';advisorDraftLab=state.contacts.find(c=>c.programId===id)?.lab||state.applications.find(a=>a.programId===id)?.lab||'';advisorDraftDegree='';}
    advisorDraftProgram=m.name;
    advisorDraft=Advisor.emailDraft(m,advisorProfile,{name:advisorDraftProfessor,lab:advisorDraftLab,degree:advisorDraftDegree});
    render();$('#advisor-draft-text')?.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function addAdvisorPlan(){
    const suggested=Advisor.plan(advisorMatches,3);let added=0;
    for(const item of suggested){if(state.tasks.some(t=>t.title===item.title))continue;
      state.tasks.push({id:uid(),title:item.title,programId:item.programId,due:item.due||'',done:false,notes:item.detail});added++;
    }
    if(added){save();render();notify(`Added ${added} tasks to your workspace`);}else notify('These recommended tasks are already in your workspace');
  }
  function renderOverview(){
    const total=state.applications.length;const submitted=state.applications.filter(a=>['Applied','Interview','Offer','Accepted','Rejected'].includes(a.status)).length;
    const upcoming=state.applications.filter(a=>{const d=daysUntil(displayDeadline(a));return d!==null&&d>=0&&d<=30;});
    const active=state.applications.filter(a=>['Researching','Preparing'].includes(a.status)).length;
    const todo=state.tasks.filter(t=>!t.done).sort((a,b)=>(a.due||'9999').localeCompare(b.due||'9999'));
    const imminent=state.applications.filter(a=>{const d=daysUntil(displayDeadline(a));return d!==null&&d>=0;}).sort((a,b)=>displayDeadline(a).localeCompare(displayDeadline(b))).slice(0,5);
    const recent=state.applications.filter(a=>['Applied','Interview','Offer','Accepted'].includes(a.status)).slice(0,5);
    const note=feed.feedStatus==='seed'?'This starter feed includes official source links. Enable GitHub Pages + the scheduled workflow to refresh verified opportunities automatically.':`Public source feed last processed ${new Date(feed.feedUpdatedAt).toLocaleString()}. Always open the official source to confirm a deadline.`;
    return pageHead('YOUR APPLICATION COMMAND CENTER','Your research, organized.','Keep every opportunity, professor and deadline in one calm workspace.',`<button class="btn btn-quiet" data-action="export">Export backup ↗</button><button class="btn btn-accent" data-action="new-application">+ New application</button>`)
      +`<section class="metrics"><div class="metric"><span class="icon-bubble">▤</span><span class="meta">Tracked applications</span><strong>${total}</strong><span class="hint">Across all programs</span></div><div class="metric"><span class="icon-bubble">↗</span><span class="meta">Submitted</span><strong>${submitted}</strong><span class="hint">Applications sent</span></div><div class="metric"><span class="icon-bubble">◷</span><span class="meta">Deadlines ≤ 30 days</span><strong>${upcoming.length}</strong><span class="hint">Time-sensitive applications</span></div><div class="metric"><span class="icon-bubble">☑</span><span class="meta">Open tasks</span><strong>${todo.length}</strong><span class="hint">${active} applications in progress</span></div></section>`
      +`<div class="info-banner"><span style="font-size:17px">◉</span><span>${esc(note)}</span></div>`
      +`<div class="two-col"><section class="panel"><div class="panel-head"><h2>Upcoming application deadlines</h2><button class="text-button" data-go="calendar">VIEW CALENDAR ↗</button></div><div class="panel-body">${imminent.length?imminent.map(a=>{const p=findP(a.programId);return `<div class="upcoming">${deadlineSquare(displayDeadline(a))}<div style="flex:1;min-width:0"><div class="row space-between"><strong>${esc(appName(a))}</strong>${tag(daysLabel(displayDeadline(a)),daysUntil(displayDeadline(a))<=10?'warn':'')}</div><div class="medium text-muted">${esc(p?.institution||a.institution||'')} · ${esc(displayCountry(a))}</div></div><button class="btn btn-small" data-action="edit-application" data-id="${esc(a.id)}">Open</button></div>`;}).join(''):`<div class="empty">No upcoming deadlines. Browse the opportunity directory.</div>`}</div></section>
      <section class="panel"><div class="panel-head"><h2>Next actions</h2><button class="text-button" data-go="tasks">ALL TASKS ↗</button></div><div class="panel-body">${todo.length?todo.slice(0,5).map(t=>`<label class="list-task"><input type="checkbox" data-task-check="${esc(t.id)}"><span style="flex:1"><span>${esc(t.title)}</span><small class="td-sub" style="display:block">${esc(findP(t.programId)?.name||'General')} · ${t.due?shortDate(t.due):'No due date'}</small></span></label>`).join(''):`<div class="empty">All caught up. Nice work.</div>`}</div></section></div>`
      +`<section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Application pipeline</h2><button class="text-button" data-go="applications">MANAGE APPLICATIONS ↗</button></div><div class="panel-body"><div class="row wrap" style="gap:11px">${['Wishlist','Researching','Preparing','Applied','Interview','Offer','Accepted'].map(s=>{const n=state.applications.filter(a=>a.status===s).length;return `<span class="tag ${statusTag(s)}">${esc(s)} <b>${n}</b></span>`;}).join('')}</div>${recent.length?`<div class="divider"></div><p class="tiny text-muted">Most recent milestones</p>${recent.map(a=>`<div class="row space-between" style="padding:8px 0"><strong class="medium">${esc(appName(a))}</strong>${tag(a.status,statusTag(a.status))}</div>`).join('')}`:''}</div></section>`;
  }
  function renderOpportunities(){
    const catalog=allOpportunities();
    const q=query.toLowerCase();let ps=catalog.filter(p=>[p.name,p.institution,p.country,p.city,p.type,...(p.researchAreas||[])].join(' ').toLowerCase().includes(q));
    if(filter!=='all')ps=ps.filter(p=>p.deadlineStatus===filter);
    if(country!=='all')ps=ps.filter(p=>p.country===country);
    if(discipline!=='all')ps=ps.filter(p=>(p.researchAreas||[]).includes(discipline));
    if(programType!=='all')ps=ps.filter(p=>p.type===programType);
    ps.sort((a,b)=>prioritySort(a.priority)-prioritySort(b.priority)||((a.deadline||'9999').localeCompare(b.deadline||'9999')));
    const disciplines=[...new Set(catalog.flatMap(p=>p.researchAreas||[]))].sort();
    const types=[...new Set(catalog.map(p=>p.type).filter(Boolean))].sort();
    const countries=[...new Set(catalog.map(p=>p.country).filter(Boolean))].sort();
    return pageHead('CURATED OPPORTUNITY DIRECTORY','Discover opportunities',`${feed.programs.length} source-linked public programs, plus your private links — not a complete web search.`,`<button class="btn btn-quiet" data-action="refresh-feed">↻ Refresh sources</button><button class="btn btn-accent" data-action="new-opportunity">+ Add a link</button>`)
      +`<div class="info-banner"><span style="font-size:17px">ℹ</span><span>ResearchTrack searches this curated list, not the whole internet. Add a program you found yourself and it stays only in this browser; it is never added to the public catalog.</span></div>`
      +`<div class="filters"><input class="input search" id="search" placeholder="Search programs, research areas, institutions…" value="${esc(query)}" aria-label="Search opportunities"/><select class="select" id="discipline-filter"><option value="all">All disciplines</option>${disciplines.map(s=>`<option value="${esc(s)}" ${discipline===s?'selected':''}>${esc(s)}</option>`).join('')}</select><select class="select" id="type-filter"><option value="all">All program types</option>${types.map(s=>`<option value="${esc(s)}" ${programType===s?'selected':''}>${esc(s)}</option>`).join('')}</select><select class="select" id="country-filter"><option value="all">All countries</option>${countries.map(c=>`<option value="${esc(c)}" ${country===c?'selected':''}>${esc(c)}</option>`).join('')}</select><select class="select" id="feed-filter"><option value="all">All deadlines</option>${['verified','unannounced','rolling','closed','paused'].map(s=>`<option value="${s}" ${filter===s?'selected':''}>${s}</option>`).join('')}</select></div>`
      +`<div class="op-grid">${ps.map(p=>{const a=appFor(p.id);const apply=validUrl(p.applicationUrl)?`<a class="medium" href="${esc(safeUrl(p.applicationUrl))}" target="_blank" rel="noopener noreferrer">Apply ↗</a>`:'';const official=validUrl(p.sourceUrl)?`<a class="medium" href="${esc(safeUrl(p.sourceUrl))}" target="_blank" rel="noopener noreferrer">Official website ↗</a>`:'';const labs=validUrl(p.labsUrl)?`<a class="medium" href="${esc(safeUrl(p.labsUrl))}" target="_blank" rel="noopener noreferrer">Explore labs ↗</a>`:'';const deadline=p.deadlineStatus==='closed'?'Call closed':niceDate(p.deadline);return `<article class="op-card ${p.personal?'personal':''}"><div class="card-top"><div><div class="tiny text-muted" style="margin-bottom:8px">${esc(EMOJI[p.country]||'◉')} ${esc(p.country||'Country not set')} · ${esc(p.city||'Location not set')}</div><h3>${esc(p.name)}</h3><span class="medium text-muted">${esc(p.institution||'Independent')} · ${esc(p.type||'Other')}</span></div><div class="row wrap">${p.personal?tag('Personal','purple'):''}${tag(p.deadlineStatus==='verified'?'Verified deadline':p.deadlineStatus||'unannounced',deadlineTag(p.deadlineStatus))}</div></div><div class="areas">${esc((p.researchAreas||[]).join(' · ')||'Research areas not set')}</div><div class="divider" style="margin:0"></div><div class="details"><div><b>Application deadline</b><span>${deadline}</span>${p.deadlineTime?`<small class="text-muted tiny">${esc(p.deadlineTime)} · ${esc(p.deadlineTimezone)}</small>`:''}</div><div><b>Priority</b><span>${esc(p.priority||'Medium')}</span></div><div><b>Funding</b><span>${esc(p.funding||'See official source')}</span></div><div><b>Source status</b><span>${p.personal?'Private entry':p.verifiedAt?'Official page checked':'Manual verification needed'}</span></div></div><div class="eligibility-box"><b>Eligibility</b><span>${esc(p.eligibility||'Not recorded — check the official programme requirements before applying.')}</span></div>${p.notes?`<p class="op-notes">${esc(p.notes)}</p>`:''}<div class="card-foot"><div class="card-links">${official}${apply}${labs}</div><div class="row wrap">${p.personal?`<button class="btn btn-small" data-action="edit-opportunity" data-id="${esc(p.id)}">Edit link</button>`:''}${a?`<button class="btn btn-small" data-action="edit-application" data-id="${esc(a.id)}">${esc(a.status)} →</button>`:`<button class="btn btn-small btn-accent" data-action="track" data-id="${esc(p.id)}">+ Track program</button>`}</div></div></article>`;}).join('')||'<div class="empty">No matching programs.</div>'}</div>`;
  }
  function renderApplications(){
    let as=state.applications.filter(a=>[appName(a),displayCountry(a),a.researchAreas,a.lab,a.supervisor,a.email,findP(a.programId)?.researchAreas.join(' ')].join(' ').toLowerCase().includes(query.toLowerCase()));
    if(filter!=='all')as=as.filter(a=>a.status===filter);
    if(country!=='all')as=as.filter(a=>displayCountry(a)===country);
    as.sort((a,b)=>(displayDeadline(a)||'9999').localeCompare(displayDeadline(b)||'9999'));
    return pageHead('PRIVATE APPLICATION TRACKER','My applications','Edit each program, manage research contacts and update your application status.',`<button class="btn btn-accent" data-action="new-application">+ Add application</button>`)
      +`<div class="filters"><input class="input search" id="search" placeholder="Search programs, labs or supervisors…" value="${esc(query)}" aria-label="Search applications"/><select class="select" id="app-filter"><option value="all">All statuses</option>${STATUS.map(s=>`<option ${filter===s?'selected':''}>${esc(s)}</option>`).join('')}</select><select class="select" id="country-filter"><option value="all">All countries</option>${[...new Set(as.concat(state.applications).map(displayCountry))].filter(Boolean).sort().map(c=>`<option ${country===c?'selected':''}>${esc(c)}</option>`).join('')}</select></div>`
      +`<div class="panel"><div class="table-wrap"><table><thead><tr><th>Program</th><th>Country</th><th>Deadline</th><th>Lab / supervisor</th><th>Status</th><th>Progress</th><th></th></tr></thead><tbody>${as.length?as.map(a=>{const p=findP(a.programId);const url=a.applicationUrl||p?.applicationUrl||a.sourceUrl||p?.sourceUrl;return `<tr><td><div class="td-name">${esc(appName(a))}</div><div class="td-sub">${esc(p?.institution||a.institution||'Independent application')} · ${esc(a.type||p?.type||'Research internship')}${url?` · <a href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">Open link ↗</a>`:''}</div></td><td>${esc(EMOJI[displayCountry(a)]||'')} ${esc(displayCountry(a)||'—')}</td><td>${esc(shortDate(displayDeadline(a)))}<div class="td-sub">${displayDeadline(a)?daysLabel(displayDeadline(a)):'Unannounced'}</div></td><td>${esc(a.lab||a.supervisor||'Not selected')}</td><td>${tag(a.status,statusTag(a.status))}</td><td><span class="tiny">${taskProgress(a).n}/${CHECKLIST.length}</span><div class="progress" style="width:72px"><div style="width:${taskProgress(a).pct}%"></div></div></td><td><button class="btn btn-small" data-action="edit-application" data-id="${esc(a.id)}">Edit →</button></td></tr>`;}).join(''):`<tr><td colspan="7" class="empty">No applications match your filters.</td></tr>`}</tbody></table></div></div>`;
  }
  function renderContacts(){
    const cs=state.contacts.filter(c=>[c.name,c.email,c.lab,c.institution,c.notes,findP(c.programId)?.name].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(a.rank||999)-Number(b.rank||999)||(a.nextFollowUp||'9999').localeCompare(b.nextFollowUp||'9999'));
    return pageHead('RESEARCH NETWORK','Contacts & supervisors','Keep the labs, PIs, postdocs, email threads, and follow-ups connected to your applications.',`<button class="btn btn-accent" data-action="new-contact">+ Add contact</button>`)
      +`<div class="filters"><input class="input search" id="search" placeholder="Search supervisors, labs, emails…" value="${esc(query)}" aria-label="Search contacts" /></div>`
      +`<div class="contact-list">${cs.length?cs.map(c=>`<div class="panel contact-card"><div class="row" style="align-items:flex-start;min-width:0"><div class="avatar">${esc((c.name||'?').trim()[0].toUpperCase())}</div><div style="min-width:0"><strong>${esc(c.name)}</strong><div class="medium text-muted">${esc(c.role||'Research contact')} · ${esc(c.institution||c.lab||'')} ${c.rank?'· preference #'+esc(c.rank):''}</div><div class="tiny text-muted" style="margin-top:8px">${esc(findP(c.programId)?.name||'Independent contact')}</div>${c.email?`<a href="mailto:${esc(c.email)}" class="tiny">${esc(c.email)}</a>`:''}<div class="tiny text-muted">${c.outreachStatus?esc(c.outreachStatus)+' · ':''}${c.nextFollowUp?'Follow up: '+niceDate(c.nextFollowUp):'No follow-up scheduled'}</div></div></div><button class="btn btn-small" data-action="edit-contact" data-id="${esc(c.id)}">Edit</button></div>`).join(''):`<div class="panel empty">No contacts yet. Add professors or lab members to track outreach.</div>`}</div>`;
  }
  function renderTasks(){
    const ts=state.tasks.filter(t=>(filter==='all'||(filter==='open'&&!t.done)||(filter==='done'&&t.done))&&[t.title,findP(t.programId)?.name].join(' ').toLowerCase().includes(query.toLowerCase())).sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999'));
    return pageHead('PERSONAL ACTION PLAN','Tasks & follow-ups','Turn an application into small, actionable steps with due dates.',`<button class="btn btn-accent" data-action="new-task">+ New task</button>`)
      +`<div class="filters"><input class="input search" id="search" placeholder="Search tasks…" value="${esc(query)}" aria-label="Search tasks"/><select class="select" id="task-filter"><option value="all">All tasks</option><option ${filter==='open'?'selected':''} value="open">Open</option><option ${filter==='done'?'selected':''} value="done">Completed</option></select></div>`
      +`<section class="panel"><div class="panel-body">${ts.length?ts.map(t=>`<div class="list-task" style="align-items:center"><input type="checkbox" aria-label="Mark task complete" data-task-check="${esc(t.id)}" ${t.done?'checked':''}/><div style="flex:1;min-width:0"><div class="${t.done?'done-text':''}">${esc(t.title)}</div><div class="tiny text-muted">${esc(findP(t.programId)?.name||state.applications.find(a=>a.id===t.applicationId)?.name||'General')} · ${t.due?niceDate(t.due):'No due date'}</div></div>${t.due?tag(daysLabel(t.due),daysUntil(t.due)<0&&!t.done?'red':daysUntil(t.due)<=7&&!t.done?'warn':''):''}<button class="btn btn-small" data-action="edit-task" data-id="${esc(t.id)}">Edit</button></div>`).join(''):`<div class="empty">Nothing here yet. Add your first task.</div>`}</div></section>`;
  }
  function renderCalendar(){
    const y=selectedMonth.getFullYear(),m=selectedMonth.getMonth(),first=new Date(y,m,1).getDay(),offset=(first+6)%7,dayCount=new Date(y,m+1,0).getDate(),cells=Math.ceil((offset+dayCount)/7)*7;
    const map={};const add=(d,entry)=>{if(!d)return;(map[d]??=[]).push(entry);};
    state.applications.forEach(a=>add(displayDeadline(a),{name:appName(a),type:'deadline',appId:a.id}));
    state.tasks.filter(t=>!t.done).forEach(t=>add(t.due,{name:t.title,type:'task',taskId:t.id}));
    const pad=n=>String(n).padStart(2,'0');
    let cellsHtml='';for(let i=0;i<cells;i++){
      const dt=new Date(y,m,1-offset+i),day=`${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`,events=map[day]||[],today=day===TODAY();
      cellsHtml+=`<div class="cal-day ${dt.getMonth()!==m?'out':''}"><div class="cal-number ${today?'today':''}">${dt.getDate()}</div>${events.slice(0,3).map(e=>`<button type="button" class="cal-event ${e.type==='task'?'task-event':''}" title="${esc(e.name)}" data-action="${e.type==='task'?'edit-task':'edit-application'}" data-id="${esc(e.taskId||e.appId)}">${esc(e.name)}</button>`).join('')}${events.length>3?`<small class="tiny text-muted">+${events.length-3} more</small>`:''}</div>`;
    }
    return pageHead('YOUR TIMELINE','Calendar','Your application deadlines and open tasks, together in one view.',`<button class="btn btn-quiet" data-action="download-ics">↓ Export .ics</button>`)
      +`<section class="panel"><div class="panel-body"><div class="calendar-head"><div class="row"><button class="btn btn-small" data-action="month-prev" aria-label="Previous month">‹</button><button class="btn btn-small" data-action="month-next" aria-label="Next month">›</button><button class="btn btn-small" data-action="month-today">Today</button></div><h2>${selectedMonth.toLocaleString('en-US',{month:'long',year:'numeric'})}</h2></div><div class="calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="cal-label">${d}</div>`).join('')}${cellsHtml}</div><div class="row" style="padding-top:15px">${tag('● Application deadline')} ${tag('● Open task','good')}</div></div></section>`;
  }
  function renderUpdates(){
    const alerts=(state.notifications||[]).slice().sort((a,b)=>(b.at||'').localeCompare(a.at||''));
    const history=publicChanges.slice().sort((a,b)=>(b.at||'').localeCompare(a.at||''));
    const monitored=feed.programs.filter(p=>p.verifiedAt);
    const fresh=feed.feedUpdatedAt && feed.feedStatus!=='seed' && !Number.isNaN(Date.parse(feed.feedUpdatedAt))
      ? `Latest successful source processing: ${new Date(feed.feedUpdatedAt).toLocaleString()}`
      : 'Bundled starter catalog · automatic checking begins after workflow deployment';
    const alertCard=n=>{const p=findP(n.programId);return `<div class="update-item"><div class="update-symbol alert-symbol">!</div><div class="update-copy"><div class="row wrap space-between"><strong>${esc(n.name||p?.name||'Tracked program')}</strong>${tag(n.seen?'Read':'New',n.seen?'':'warn')}</div><div class="medium text-muted">${esc(n.field==='deadline'?'Deadline changed':'Program availability changed')}: <b>${esc(n.old||'Unannounced')}</b> → <b>${esc(n.new||'Unannounced')}</b></div><div class="tiny text-muted">Detected ${esc(n.at?.slice(0,10)||'recently')} · Review official website before acting.</div>${p?.sourceUrl?`<a href="${esc(safeUrl(p.sourceUrl))}" target="_blank" rel="noopener noreferrer" class="tiny">Official source ↗</a>`:''}</div>${n.seen?'':`<button class="btn btn-small" data-action="mark-update" data-id="${esc(n.id)}">Mark read</button>`}</div>`;};
    const changeCard=c=>{const p=findP(c.id);return `<div class="update-item"><div class="update-symbol">↻</div><div class="update-copy"><strong>${esc(p?.name||c.id)}</strong><div class="medium text-muted">${esc(c.field)} · ${esc(c.old||'Unannounced')} → ${esc(c.new||'Unannounced')}</div><div class="tiny text-muted">${esc(c.at?.slice(0,16).replace('T',' ')||'Unknown date')} UTC · Source monitor</div></div>${p?.sourceUrl?`<a class="tiny" href="${esc(safeUrl(p.sourceUrl))}" target="_blank" rel="noopener noreferrer">Official page ↗</a>`:''}</div>`;};
    return pageHead('TRANSPARENT AUTOMATED MONITORING','Source updates','See what changed, when it was verified, and how it affects your tracked applications.',`<button class="btn btn-quiet" data-action="refresh-feed">↻ Check public feed</button>`)
      +`<div class="info-banner"><span style="font-size:19px">◉</span><span>${esc(fresh)}. Checks are scheduled twice daily, not instant. Only three deadlines and the ISTA pause currently have automated monitors; other entries require manual review.</span></div>`
      +`<div class="two-col"><section class="panel"><div class="panel-head"><h2>My deadline alerts</h2>${alerts.some(n=>!n.seen)?`<button class="text-button" data-action="read-all">MARK ALL READ</button>`:''}</div><div class="panel-body">${alerts.length?alerts.slice(0,30).map(alertCard).join(''):`<div class="empty">No changes detected for your applications yet. New verified deadline changes will appear here after a public-feed refresh.</div>`}</div></section><section class="panel"><div class="panel-head"><h2>Public change history</h2></div><div class="panel-body">${history.length?history.slice(0,35).map(changeCard).join(''):`<div class="empty">No verified changes recorded yet. The source monitor logs changes, not every routine check.</div>`}</div></section></div>`
      +`<section class="panel" style="margin-top:18px"><div class="panel-head"><h2>Source verification coverage</h2>${tag(`${monitored.length}/${feed.programs.length} with source records`)}</div><div class="panel-body"><div class="source-grid">${feed.programs.map(p=>`<div class="source-tile"><strong>${esc(p.name)}</strong>${tag(p.deadlineStatus||'unknown',deadlineTag(p.deadlineStatus))}<div class="tiny text-muted">${p.verifiedAt?'Last verified: '+esc(p.verifiedAt.slice(0,10)):'No automatic verification record'}</div><a class="tiny" target="_blank" rel="noopener noreferrer" href="${esc(safeUrl(p.sourceUrl))}">Check official source ↗</a></div>`).join('')}</div></div></section>`;
  }
  function renderSettings(){
    return pageHead('PRIVACY & OWNERSHIP','Settings & data','Your research plans belong to you. Export, restore or reset your workspace.')
    +`<div class="two-col"><section class="panel"><div class="panel-head"><h2>Workspace data</h2></div><div class="panel-body"><p class="medium text-muted">Personal opportunities, applications, contacts, and tasks are stored locally in this browser. They never leave the device unless you export them yourself.</p><div class="row wrap" style="margin-top:19px"><button class="btn btn-accent" data-action="export">↓ Download JSON backup</button><button class="btn" data-action="import">↑ Restore backup</button><button class="btn" data-action="csv">↓ Export CSV</button></div><div class="divider"></div><p class="medium text-muted">Importing a backup replaces your current workspace. Export before importing.</p><button class="btn btn-danger" data-action="reset">Reset workspace</button></div></section><section class="panel"><div class="panel-head"><h2>Public opportunity feed</h2></div><div class="panel-body"><div class="stack"><div class="row space-between"><span class="medium text-muted">Public programs</span><b>${feed.programs.length}</b></div><div class="row space-between"><span class="medium text-muted">Personal links</span><b>${state.customOpportunities.length}</b></div><div class="row space-between"><span class="medium text-muted">Source checked</span><b>${feed.feedUpdatedAt?new Date(feed.feedUpdatedAt).toLocaleDateString():'Unknown'}</b></div><div class="row space-between"><span class="medium text-muted">Feed type</span>${tag(feed.feedStatus||'unknown',feed.feedStatus==='seed'?'warn':'good')}</div><div class="row space-between"><span class="medium text-muted">Privacy</span>${tag('Local-only personal data','good')}</div></div><div class="divider"></div><p class="medium text-muted">Hosted on GitHub Pages, this site can fetch refreshed public program details. Source monitors run on GitHub Actions. Opening a local HTML file uses the bundled snapshot.</p><button class="btn" data-action="refresh-feed">↻ Check for updates</button></div></section></div><div class="note" style="margin-top:18px">No accounts or cloud sync yet. Real-time collaboration, email delivery and Google Calendar write-back are planned but are not part of this MVP.</div>`;
  }
  const opportunityOptions = () => [{value:'',label:'Not linked'},...allOpportunities().map(p=>({value:p.id,label:p.personal?`${p.name} (personal)`:p.name}))];
  const input = (field,label,value='',type='text',opts=null,wide=false,placeholder='')=>`<div class="form-field ${wide?'wide':''}"><label for="field-${esc(field)}">${esc(label)}</label>${opts?`<select class="select" id="field-${esc(field)}" name="${esc(field)}">${opts.map(o=>{const v=typeof o==='string'?o:o.value;const label=typeof o==='string'?o:o.label;return `<option value="${esc(v)}" ${v===value?'selected':''}>${esc(label)}</option>`;}).join('')}</select>`:type==='textarea'?`<textarea class="textarea" id="field-${esc(field)}" name="${esc(field)}" placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input class="input" type="${esc(type)}" id="field-${esc(field)}" name="${esc(field)}" value="${esc(value)}" placeholder="${esc(placeholder)}" ${field==='name'?'required':''} />`}</div>`;
  function openDrawer(type,id){drawerType=type;drawerId=id||null;const d=$('#drawer');d.classList.remove('hidden');$('#drawer-backdrop').classList.remove('hidden');document.body.style.overflow='hidden';const item=type==='opportunity'?state.customOpportunities.find(p=>p.id===id):type==='application'?state.applications.find(a=>a.id===id):type==='contact'?state.contacts.find(c=>c.id===id):state.tasks.find(t=>t.id===id);const obj=item||{};const formFields={
    opportunity:()=>`<div class="form-section">Opportunity</div><div class="form-grid">${input('name','Program name',obj.name||'','text',null,true)}${input('type','Program type',obj.type||'Research internship','select',APPLICATION_TYPES)}${input('institution','University / institute',obj.institution||'')}${input('country','Country',obj.country||'')}${input('city','City / location',obj.city||'')}${input('priority','Priority',obj.priority||'Medium','select',PRIORITIES)}${input('researchAreas','Research areas',(obj.researchAreas||[]).join(', '),'text',null,true,'Physics, chemistry, mathematics…')}${input('deadline','Application deadline',obj.deadline||'','date')}${input('deadlineStatus','Deadline status',obj.deadlineStatus||'unannounced','select',['unannounced','rolling','verified','closed'])}${input('sourceUrl','Official website',obj.sourceUrl||'','url',null,true,'https://…')}${input('applicationUrl','Apply link',obj.applicationUrl||'','url',null,true,'https://…')}${input('labsUrl','Labs / research groups link',obj.labsUrl||'','url',null,true,'https://…')}${input('funding','Funding',obj.funding||'','textarea',null,true)}${input('eligibility','Eligibility restrictions',obj.eligibility||'','textarea',null,true,'Degree, nationality, institution or visa limits…')}${input('notes','Notes',obj.notes||'','textarea',null,true)}</div><div class="note" style="margin-top:18px">This opportunity stays in your browser and is never added to the public ResearchTrack feed.</div>`,
    application:()=>{const p=findP(obj.programId);return `<div class="form-section">Program details</div><div class="form-grid">${input('name','Application name',obj.name||p?.name||'', 'text',null,true)}${input('type','Application type',obj.type||p?.type||'Research internship','select',APPLICATION_TYPES)}${input('programId','Link to catalog entry',obj.programId||'','select',opportunityOptions(),true)}${input('institution','University / institute',obj.institution||p?.institution||'')}${input('country','Country',obj.country||p?.country||'')}${input('researchAreas','Research areas',obj.researchAreas||(p?.researchAreas||[]).join(', '),'text',null,true,'Chemistry, neuroscience, materials science…')}${input('sourceUrl','Official program page',obj.sourceUrl||p?.sourceUrl||'','url',null,true,'https://…')}${input('applicationUrl','Application link / instructions',obj.applicationUrl||p?.applicationUrl||'','url',null,true,'https://…')}${input('labsUrl','Labs / research groups link',obj.labsUrl||p?.labsUrl||'','url',null,true,'https://…')}${input('status','Application status',obj.status||'Wishlist','select',STATUS)}${input('priority','Priority',obj.priority||'Medium','select',PRIORITIES)}${input('deadlineOverride','Personal deadline override',obj.deadlineOverride||'','date')}${input('submittedAt','Submitted on',obj.submittedAt||'','date')}</div><div class="form-section">Lab and supervisor</div><div class="form-grid">${input('lab','Lab / research group',obj.lab||'')}${input('supervisor','Supervisor / PI',obj.supervisor||'')}${input('email','Contact email',obj.email||'','email',null,true)}</div><div class="form-section">Other details</div><div class="form-grid">${input('fundingNotes','Funding / stipend',obj.fundingNotes||'','textarea',null,true)}${input('visaNotes','Eligibility / visa',obj.visaNotes||'','textarea',null,true)}${input('confirmation','Confirmation / application ID',obj.confirmation||'', 'text',null,true)}${input('notes','Notes',obj.notes||'','textarea',null,true)}</div><div class="form-section">Document checklist · ${taskProgress(obj).pct}% complete</div>${CHECKLIST.map((s,i)=>`<label class="checkline"><input type="checkbox" name="check-${i}" ${obj.checklist?.[i]?'checked':''}/>${esc(s)}</label>`).join('')}`;},
    contact:()=>`<div class="form-section">Contact profile</div><div class="form-grid">${input('name','Name',obj.name||'','text',null,true)}${input('role','Role',obj.role||'Professor')}${input('rank','Preference rank',obj.rank||'','number')}${input('outreachStatus','Outreach stage',obj.outreachStatus||'Not contacted','select',['Not contacted','Email drafted','Contacted','Follow-up due','Replied','Meeting scheduled','Declined'])}${input('email','Email',obj.email||'','email')}${input('institution','University / institution',obj.institution||'')}${input('lab','Lab / group',obj.lab||'')}${input('website','Lab / professor website',obj.website||'','url',null,true)}${input('programId','Linked opportunity',obj.programId||'','select',opportunityOptions())}${input('lastContact','Last contacted',obj.lastContact||'','date')}${input('nextFollowUp','Next follow-up',obj.nextFollowUp||'','date')}${input('notes','Outreach notes',obj.notes||'','textarea',null,true)}</div>`,
    task:()=>`<div class="form-section">Task details</div><div class="form-grid">${input('title','Task',obj.title||'','text',null,true)}${input('programId','Linked opportunity',obj.programId||'','select',opportunityOptions())}${input('due','Due date',obj.due||'','date')}${input('state','Progress',obj.done?'Completed':'Open','select',['Open','Completed'])}${input('notes','Notes',obj.notes||'','textarea',null,true)}</div>`
  };
  const heading={opportunity:'Personal opportunity',application:'Application',contact:'Research contact',task:'Task'}[type];
  d.innerHTML=`<div class="drawer-head"><div><div class="kicker">${id?'EDIT':'CREATE'} / ${heading.toUpperCase()}</div><h2>${esc(id?(obj.name||obj.title||heading):`New ${heading.toLowerCase()}`)}</h2><span class="tiny text-muted">Changes are saved to your private workspace.</span></div><button class="btn btn-small" data-action="close-drawer" aria-label="Close dialog">✕</button></div><form id="drawer-form"><div class="drawer-body">${formFields[type]()}</div><div class="drawer-footer"><div>${id?`<button class="btn btn-danger" type="button" data-action="delete-${type}" data-id="${esc(id)}">Delete</button>`:''}</div><div class="row"><button class="btn" type="button" data-action="close-drawer">Cancel</button><button class="btn btn-accent" type="submit">Save ${esc(heading)}</button></div></div></form>`;
  d.querySelector('#drawer-form').addEventListener('submit',saveDrawer);d.focus();
  }
  function closeDrawer(){drawerType=null;drawerId=null;$('#drawer').classList.add('hidden');$('#drawer-backdrop').classList.add('hidden');document.body.style.overflow='';}
  function saveDrawer(e){e.preventDefault();const f=new FormData(e.currentTarget),obj=Object.fromEntries(f.entries());if(drawerType==='opportunity'){
      const existing=state.customOpportunities.find(p=>p.id===drawerId);const name=String(obj.name||'').trim();if(!name){notify('Program name is required');return;}
      const updated={...existing,...obj,name,id:existing?.id||`personal-${uid()}`,researchAreas:String(obj.researchAreas||'').split(',').map(x=>x.trim()).filter(Boolean),year:Number(obj.deadline?.slice(0,4))||new Date().getFullYear(),personal:true,updatedAt:TODAY(),createdAt:existing?.createdAt||TODAY(),verifiedAt:'',lastChecked:''};
      if(existing)Object.assign(existing,updated);else state.customOpportunities.unshift(updated);
    }else if(drawerType==='application'){
      const existing=state.applications.find(a=>a.id===drawerId);const name=(obj.name||'').trim();if(!name){notify('Program name is required');return;}
      const updated={...existing,...obj,name,id:existing?.id||uid(),checklist:{...(existing?.checklist||{})},createdAt:existing?.createdAt||TODAY(),updatedAt:TODAY()};
      CHECKLIST.forEach((_,i)=>updated.checklist[i]=!!f.get(`check-${i}`));CHECKLIST.forEach((_,i)=>delete updated[`check-${i}`]);
      if(existing)Object.assign(existing,updated);else state.applications.unshift(updated);
    }else if(drawerType==='contact'){
      if(!String(obj.name||'').trim()){notify('Contact name is required');return;}
      const existing=state.contacts.find(c=>c.id===drawerId),updated={...existing,...obj,id:existing?.id||uid()};if(existing)Object.assign(existing,updated);else state.contacts.unshift(updated);
    }else if(drawerType==='task'){
      if(!String(obj.title||'').trim()){notify('Task title is required');return;}
      const existing=state.tasks.find(t=>t.id===drawerId),updated={...existing,...obj,done:obj.state==='Completed',id:existing?.id||uid()};delete updated.state;if(existing)Object.assign(existing,updated);else state.tasks.unshift(updated);
    }
    save();closeDrawer();render();notify('Saved successfully');
  }
  function track(id){if(appFor(id)){openDrawer('application',appFor(id).id);return;}const p=findP(id);if(!p)return;const a={id:uid(),programId:p.id,name:p.name,status:'Wishlist',priority:p.priority||'Medium',researchAreas:(p.researchAreas||[]).join(', '),sourceUrl:p.sourceUrl||'',applicationUrl:p.applicationUrl||'',labsUrl:p.labsUrl||'',lab:'',supervisor:'',email:'',deadlineOverride:'',fundingNotes:'',visaNotes:p.eligibility||'',notes:'',submittedAt:'',confirmation:'',checklist:{},createdAt:TODAY(),updatedAt:TODAY()};state.applications.unshift(a);save();render();notify('Added to your applications');}
  function download(filename,text,mime){const blob=new Blob([text],{type:mime}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  function exportJSON(){download('researchtrack-workspace.json',JSON.stringify({app:'ResearchTrack',exportedAt:new Date().toISOString(),workspace:state},null,2),'application/json');}
  function exportCSV(){const fields=['name','status','priority','institution','country','deadline','researchAreas','sourceUrl','applicationUrl','labsUrl','lab','supervisor','email','submittedAt','confirmation','notes'];const rows=[fields,...state.applications.map(a=>fields.map(f=>f==='deadline'?displayDeadline(a):f==='country'?displayCountry(a):f==='institution'?(findP(a.programId)?.institution||a.institution||''):a[f]||''))];download('researchtrack-applications.csv',rows.map(r=>r.map(x=>'"'+String(x).replace(/"/g,'""')+'"').join(',')).join('\r\n'),'text/csv');}
  function exportICS(){const escICS=s=>String(s).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const events=[];const add=(name,date,description)=>{if(!/^\d{4}-\d\d-\d\d$/.test(date||''))return;const d=date.replace(/-/g,''),end=new Date(`${date}T12:00:00Z`);end.setUTCDate(end.getUTCDate()+1);const next=end.toISOString().slice(0,10).replace(/-/g,'');events.push(`BEGIN:VEVENT\r\nUID:${uid()}@researchtrack.local\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}\r\nDTSTART;VALUE=DATE:${d}\r\nDTEND;VALUE=DATE:${next}\r\nSUMMARY:${escICS(name)}\r\nDESCRIPTION:${escICS(description)}\r\nEND:VEVENT`);};state.applications.forEach(a=>add('Deadline: '+appName(a),displayDeadline(a),'ResearchTrack application deadline. Verify official time zone.'));state.tasks.filter(t=>!t.done).forEach(t=>add('Task: '+t.title,t.due,'ResearchTrack action item.'));download('researchtrack-calendar.ics','BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//ResearchTrack//EN\r\nCALSCALE:GREGORIAN\r\n'+events.join('\r\n')+'\r\nEND:VCALENDAR\r\n','text/calendar');notify(`Exported ${events.length} calendar events`);}
  async function importJSON(file){try{const x=JSON.parse(await file.text()),w=x.workspace||x;if(w?.version!==2||!Array.isArray(w.applications)||!Array.isArray(w.contacts)||!Array.isArray(w.tasks))throw Error('Unsupported format');if(!confirm('Replace your private workspace with the imported backup?'))return;w.notifications=Array.isArray(w.notifications)?w.notifications:[];w.customOpportunities=Array.isArray(w.customOpportunities)?w.customOpportunities:[];state=w;save();render();notify('Backup imported');}catch(e){notify('Import failed: invalid ResearchTrack backup');}}
  function recordUpdates(newer){
    const notices=state.notifications||(state.notifications=[]),changed=[];
    for(const p of newer.programs){
      const old=findP(p.id);
      if(!old||!appFor(p.id))continue;
      const fields=['deadline','deadlineStatus'];
      for(const field of fields){
        if((old[field]||'')===(p[field]||''))continue;
        const id=`${p.id}:${field}:${old[field]||''}:${p[field]||''}`;
        if(notices.some(n=>n.id===id))continue;
        notices.unshift({id,programId:p.id,name:p.name,field,old:old[field]||'',new:p[field]||'',at:new Date().toISOString(),seen:false});
        changed.push(p.name);
      }
    }
    if(changed.length){state.notifications=notices.slice(0,100);save();}
    return [...new Set(changed)];
  }
  async function refreshFeed(silent=false){if(location.protocol==='file:'){if(!silent)notify('Offline preview: publish to GitHub Pages to enable source polling.');return;}
    try{
      const r=await fetch(`data/opportunities.json?cache=${Date.now()}`,{cache:'no-store'});
      if(!r.ok)throw Error(`HTTP ${r.status}`);
      const newer=await r.json();
      if(!Array.isArray(newer.programs)||!newer.feedUpdatedAt||newer.programs.some(p=>!p.id||!p.name))throw Error('Invalid feed');
      const changed=recordUpdates(newer);
      feed=newer;
      try{
        const h=await fetch(`data/changes.json?cache=${Date.now()}`,{cache:'no-store'});
        if(h.ok){const cs=await h.json();if(Array.isArray(cs))publicChanges=cs.filter(c=>c&&c.id&&c.field&&c.at).slice(-100);}
      }catch(e){console.warn('Change history unavailable',e);}
      $('#sync-state').textContent='Feed loaded';
      $('#sync-time').textContent=`Last processed ${new Date(feed.feedUpdatedAt).toLocaleDateString()}`;
      $('#feed-pill').innerHTML='<span class="live-dot"></span> Public feed';
      render();
      if(changed.length)notify(`${changed.length} tracked programs changed — see Source updates`);
      else if(!silent)notify('Public feed is current');
    }catch(e){$('#sync-state').textContent='Bundled feed';if(!silent)notify('Feed unavailable; previously saved public data retained.');}
  }
  function action(btn){const a=btn.dataset.action,id=btn.dataset.id;
    switch(a){case'new-opportunity':openDrawer('opportunity');break;case'edit-opportunity':openDrawer('opportunity',id);break;case'new-application':openDrawer('application');break;case'edit-application':openDrawer('application',id);break;case'track':track(id);break;case'new-contact':openDrawer('contact');break;case'edit-contact':openDrawer('contact',id);break;case'new-task':openDrawer('task');break;case'edit-task':openDrawer('task',id);break;case'close-drawer':closeDrawer();break;
      case'delete-opportunity':case'delete-application':case'delete-contact':case'delete-task':{const type=a.split('-')[1],key={opportunity:'customOpportunities',application:'applications',contact:'contacts',task:'tasks'}[type];if(confirm(`Delete this ${type}? Linked applications will be kept.`)){state[key]=state[key].filter(x=>x.id!==id);save();closeDrawer();render();notify('Deleted');}break;}
      case'export':exportJSON();break;case'csv':exportCSV();break;case'import':$('#import-file').click();break;case'reset':if(confirm('Reset to the initial sample applications? This will delete all local changes.')){state=localSeed();save();render();notify('Workspace reset');}break;
      case'advisor-analyze':analyzeAdvisor();break;
      case'advisor-track':track(id);break;
      case'advisor-email':advisorEmail(id);break;
      case'advisor-add-plan':addAdvisorPlan();break;
      case'advisor-clear':if(confirm('Clear CV text and analysis from this tab?')){advisorCV='';advisorInterests='';advisorCountries='';advisorProfile=null;advisorMatches=[];advisorDraft='';render();notify('CV session cleared');}break;
      case'advisor-download-report':if(advisorProfile)download('researchtrack-fit-report.md',Advisor.report(advisorProfile,advisorMatches,{countries:advisorCountries}),'text/markdown');break;
      case'advisor-download-email':if(advisorDraft)download('professor-outreach-draft.txt',$('#advisor-draft-text')?.value||advisorDraft,'text/plain');break;
      case'advisor-copy-draft':{const current=$('#advisor-draft-text')?.value||advisorDraft;if(navigator.clipboard?.writeText){navigator.clipboard.writeText(current).then(()=>notify('Draft copied')).catch(()=>notify('Copy failed; select the text instead'));}else notify('Clipboard API unavailable. Select the draft and copy manually.');break;}
      case'advisor-refresh-draft':{advisorDraftProfessor=$('#advisor-professor')?.value||'';advisorDraftLab=$('#advisor-lab')?.value||'';advisorDraftDegree=$('#advisor-degree')?.value||'';const m=advisorMatches.find(x=>x.name===advisorDraftProgram);if(m)advisorEmail(m.id,true);break;}
      case'refresh-feed':refreshFeed();break;case'mark-update':{const n=(state.notifications||[]).find(n=>n.id===id);if(n){n.seen=true;save();render();}break;}case'read-all':(state.notifications||[]).forEach(n=>n.seen=true);save();render();break;case'download-ics':exportICS();break;case'month-prev':selectedMonth.setMonth(selectedMonth.getMonth()-1);render();break;case'month-next':selectedMonth.setMonth(selectedMonth.getMonth()+1);render();break;case'month-today':selectedMonth=new Date();selectedMonth.setDate(1);render();break;
    }
  }
  document.addEventListener('click',e=>{const nav=e.target.closest('[data-view]');if(nav){view=nav.dataset.view;query='';filter='all';country='all';discipline='all';programType='all';render();return;}
    const go=e.target.closest('[data-go]');if(go){view=go.dataset.go;query='';filter='all';country='all';discipline='all';programType='all';render();return;}
    const act=e.target.closest('[data-action]');if(act){action(act);return;}
  });
  document.addEventListener('change',async e=>{
    if(e.target.id==='advisor-cv-file'){
      const file=e.target.files?.[0];if(!file)return;
      if(!/\.(txt|md)$/i.test(file.name)){notify('Only .txt and .md are currently supported');return;}
      if(file.size>350000){notify('Text CV exceeds 350 KB limit');return;}
      advisorCV=await file.text(); const ta=$('#advisor-cv-text');if(ta)ta.value=advisorCV;
      notify('CV text loaded locally. Click Analyze to continue.');return;
    }
    if(e.target.matches('[data-task-check]')){const t=state.tasks.find(t=>t.id===e.target.dataset.taskCheck);if(t){t.done=e.target.checked;save();render();}}else if(e.target.id==='app-filter'||e.target.id==='feed-filter'||e.target.id==='task-filter'){filter=e.target.value;render();}else if(e.target.id==='country-filter'){country=e.target.value;render();}else if(e.target.id==='discipline-filter'){discipline=e.target.value;render();}else if(e.target.id==='type-filter'){programType=e.target.value;render();}});
  document.addEventListener('input',e=>{
    if(e.target.id==='advisor-cv-text')advisorCV=e.target.value;
    if(e.target.id==='advisor-interests')advisorInterests=e.target.value;
    if(e.target.id==='advisor-countries')advisorCountries=e.target.value;
    if(e.target.id==='advisor-draft-text')advisorDraft=e.target.value;
    if(e.target.id==='search'){query=e.target.value;const start=e.target.selectionStart;render();const input=$('#search');if(input){input.focus();input.setSelectionRange(start,start);}}});
  $('#quick-add').addEventListener('click',()=>openDrawer('application'));
  $('#drawer-backdrop').addEventListener('click',closeDrawer);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drawerType)closeDrawer();});
  $('#import-file').addEventListener('change',async e=>{if(e.target.files?.[0])await importJSON(e.target.files[0]);e.target.value='';});
  render();
  refreshFeed(true);
  if(location.protocol!=='file:')setInterval(()=>refreshFeed(true),15*60*1000);
})();
