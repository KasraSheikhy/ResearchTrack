/* ResearchTrack Advisor Engine v0.4
 * Deterministic, local-only analysis — this is NOT an LLM or an estimate of admission chances.
 * No CV data is transferred to a server. Designed for progressive enhancement to an opt-in AI provider.
 */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  if(root)root.ResearchTrackAdvisor=api;
})(typeof window !== 'undefined'?window:null,function(){
  'use strict';
  const SKILLS={
    'Machine Learning':['machine learning','\\bml\\b','statistical learning','deep learning','neural networks','pytorch','tensorflow','transformers','large language model','\\bllm\\b','computer vision'],
    'Computer Science':['computer science','computer engineering','software engineering','algorithms','data structures','programming','distributed systems','operating systems'],
    'Artificial Intelligence':['artificial intelligence','\\bai\\b','reinforcement learning','natural language processing','\\bnlp\\b','deep learning','large language models'],
    'Algorithms':['algorithms','algorithmic','complexity theory','graph algorithms','optimization','competitive programming','data structures'],
    'Mathematics':['mathematics','mathematical','linear algebra','calculus','algebra','analysis','proof','theorem','optimization'],
    'Statistics':['statistics','statistical','bayesian','inference','hypothesis testing','estimation','probability','regression'],
    'Probability':['probability','stochastic','markov','random variables','statistical inference'],
    'Computational Biology':['computational biology','bioinformatics','genomics','proteomics','biological data','systems biology'],
    'Bioinformatics':['bioinformatics','genomics','sequencing','computational biology','biological sequence'],
    'Physics':['physics','quantum','mechanics','optics','electromagnetism','thermodynamics','physical'],
    'Complexity Science':['complexity science','complex systems','complex networks','nonlinear dynamics','computational complexity'],
    'Data Science':['data science','data analysis','data analytics','statistics','pandas','numpy','data visualization'],
    'Software Engineering':['software engineering','software development','\\bpython\\b','\\brust\\b','\\bjava\\b','\\bc\+\+\\b','\\bgit\\b','testing','backend'],
    'Engineering':['engineering','computer engineering','electrical engineering','systems design'],
    'Quantitative Biology':['quantitative biology','computational biology','bioinformatics','biostatistics','mathematical biology'],
    'Computing':['computing','computer science','software engineering','high performance computing','\\bhpc\\b','programming']
  };
  const COMMON=['python','pytorch','tensorflow','numpy','pandas','rust','c++','java','statistics','probability','linear algebra','optimization','algorithms','machine learning','deep learning','transformers','computer vision','bioinformatics','genomics','physics','research','publication','github','docker'];
  function clean(s){return String(s||'').trim().slice(0,120000)}
  function hit(text,pattern){try{return new RegExp(pattern,'i').test(text)}catch{return text.toLowerCase().includes(pattern.toLowerCase())}}
  function extractProfile(text, interests=''){
    const cv=clean(text), goals=clean(interests); const combined=[cv,goals].join('\n');
    const fields=Object.keys(SKILLS).filter(k=>SKILLS[k].some(term=>hit(combined,term)));
    const explicitInterests=Object.keys(SKILLS).filter(k=>SKILLS[k].some(term=>hit(goals,term)));
    const keywords=COMMON.filter(k=>hit(cv,k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
    return {areas:fields,interests:explicitInterests,keywords,characters:cv.length,
      hasCV:cv.length>=60,source:cv?'User-provided CV text':'Interests only',
      evidence:fields.map(area=>({area,hits:SKILLS[area].filter(term=>hit(combined,term)).slice(0,4)}))};
  }
  function overlapAreas(area, profile){
    if(!profile?.areas?.length)return false;
    const ar=area.toLowerCase();
    if(profile.areas.some(k=>k.toLowerCase()===ar))return true;
    const groups=[
      ['Machine Learning','Artificial Intelligence','Data Science'],
      ['Statistics','Probability','Mathematics'],
      ['Bioinformatics','Computational Biology','Quantitative Biology'],
      ['Computer Science','Computing','Algorithms','Software Engineering','Engineering']
    ];
    return groups.some(g=>g.some(k=>k.toLowerCase()===ar)&&g.some(k=>profile.areas.includes(k)));
  }
  function rankOne(p,profile,preferences={},today='2026-10-20'){
    const areas=Array.isArray(p.researchAreas)?p.researchAreas:[];
    const exact=areas.filter(a=>profile.areas?.some(k=>k.toLowerCase()===a.toLowerCase()));
    const related=areas.filter(a=>!exact.includes(a)&&overlapAreas(a,profile));
    const matchCount=exact.length+0.6*related.length;
    const hasProfile=(profile.hasCV || profile.areas?.length>0);
    let score=hasProfile?Math.round(Math.min(72,matchCount/Math.max(1,areas.length)*72)):null;
    const deadlinePassed=Boolean(p.deadline && p.deadline<today);
    const paused=p.deadlineStatus==='paused';
    const preferenceCountries=(preferences.countries||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
    const countryMatched=!preferenceCountries.length||preferenceCountries.includes((p.country||'').toLowerCase());
    if(score!==null){
      score+=countryMatched?12:0;
      score+=p.funding&&!/consult|check|see program|not applicable/i.test(p.funding)?8:0;
      score+=p.deadlineStatus==='verified'?8:p.deadlineStatus==='rolling'?5:0;
      // Status is a planning signal, not a predictor of acceptance.
      if(deadlinePassed) score=Math.max(0,score-35);
      if(paused)score=0;
      score=Math.min(100,score);
    }
    const blockers=[];
    if(paused) blockers.push('This application cycle is paused.');
    if(deadlinePassed)blockers.push('The listed deadline has passed.');
    if(p.deadlineStatus!=='verified'&&p.deadlineStatus!=='rolling'&&!paused)blockers.push('The deadline for this cycle is not verified.');
    if(p.country==='United States' && /work authorization/i.test(p.eligibility||''))blockers.push('US work authorization must be checked independently.');
    if(!countryMatched)blockers.push('Outside preferred countries.');
    const reasons=[];
    if(exact.length)reasons.push('Direct overlap: '+exact.join(', '));
    if(related.length)reasons.push('Related background: '+related.join(', '));
    if(p.funding&&!/consult|check|see program|not applicable/i.test(p.funding))reasons.push('Funding information is listed.');
    if(!exact.length&&!related.length)reasons.push('No research-area overlap was detected from the supplied profile.');
    return {...p,score,exact,related,reasons,blockers,canApply:!paused&&!deadlinePassed,label:score===null?'Add profile':paused?'Paused':deadlinePassed?'Past deadline':score>=65?'Strong alignment':score>=40?'Potential alignment':'Explore with caution'};
  }
  function rank(programs,profile,preferences={},today){return programs.map(p=>rankOne(p,profile,preferences,today)).sort((a,b)=>(Number(b.canApply)-Number(a.canApply))||((b.score??-1)-(a.score??-1))||((a.deadline||'9999').localeCompare(b.deadline||'9999')))}
  function reviewCV(text,profile){
    const cv=clean(text).toLowerCase(), strengths=[], suggestions=[];
    if(!cv.trim())return {strengths:[],suggestions:['Paste a CV to get structure-specific feedback.']};
    if(profile.keywords.length>=4)strengths.push(`Detected ${profile.keywords.length} recognizable technical or research terms.`);
    if(/(?:research|publication|paper|preprint)/.test(cv))strengths.push('Research-related content appears in the CV.');
    if(/(?:github\.com|linkedin\.com|orcid\.org|https?:\/\/)/.test(cv))strengths.push('An online portfolio or profile link may be available.');
    if(!/(?:project|projects)/.test(cv))suggestions.push('Consider a clearly labeled Projects section with what you built and the outcome.');
    if(!/(?:research experience|research assistant|research project|research interests)/.test(cv))suggestions.push('Make research experience or interests easy for a lab supervisor to locate.');
    if(!/(?:education|bachelor|b\.sc|undergraduate|master|university)/.test(cv))suggestions.push('Make your degree, university and current academic stage easy to identify.');
    if(!/(?:github\.com|linkedin\.com|orcid\.org|https?:\/\/)/.test(cv))suggestions.push('Add links to relevant code, portfolio or research profiles if you have them.');
    if(!/\b(?:developed|implemented|evaluated|designed|published|built|measured|analyzed)\b/.test(cv))suggestions.push('Use action verbs and measurable outcomes for projects and research contributions.');
    suggestions.push('Tailor your CV to each lab’s methods; keep all claims accurate and verifiable.');
    return {strengths,suggestions};
  }
  function plan(matches, limit=3, today=new Date().toISOString().slice(0,10)){
    const out=[];
    for(const m of matches.filter(x=>x.canApply).slice(0,limit)){
      const common=[['Verify eligibility and official deadline','Check program page, nationality / visa rules and degree requirements'],['Identify matching labs and supervisors','Read recent work and choose a specific research fit'],['Tailor CV and motivation letter','Use only verified experience; cite relevant courses or projects'],['Arrange references and submit','Confirm document requirements and save the submission receipt']];
      const daysBefore=[21,14,7,2];
      common.forEach(([action,detail],index)=>{
        let due='';
        if(m.deadline){const d=new Date(`${m.deadline}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-daysBefore[index]);due=d.toISOString().slice(0,10);if(due<today)due=today;}
        out.push({id:m.id+'-'+index,programId:m.id,program:m.name,title:`${m.name}: ${action}`,detail,due,deadline:m.deadline||''});
      });
    }
    return out;
  }
  function emailDraft(match,profile,contact={}){
    const prof=contact.name?.trim()||'[Professor / PI name]';
    const lab=contact.lab?.trim()||'[lab name]';
    const degree=contact.degree?.trim()||'[your degree and institution]';
    const area=match.exact?.[0]||match.related?.[0]||match.researchAreas?.[0]||'[research area]';
    const skills=profile.keywords.slice(0,4).join(', ');
    return `Subject: Research internship inquiry — ${match.name} / ${lab}\n\nDear ${prof},\n\nI am ${degree}, and I am interested in the possibility of joining ${lab} through ${match.name}. I am particularly interested in ${area.toLowerCase()}.\n\n${skills?`My background includes ${skills}. `:''}I would be glad to share my CV and discuss whether my experience aligns with your group's current research.\n\nThank you for your time and consideration.\n\nBest regards,\n[Your full name]\n[LinkedIn / personal website]`;
  }
  function report(profile,matches,preferences={}){
    const lines=['# ResearchTrack — Research Opportunity Fit Report','',`Generated: ${new Date().toISOString().slice(0,10)}`,'','This report uses local, rule-based research-area matching. **Scores are not probabilities of admission.** Always confirm eligibility and deadlines on official pages.','','## Profile signals',`- Areas: ${profile.areas.join(', ')||'Not detected'}`,`- Skills: ${profile.keywords.join(', ')||'Not detected'}`,`- Preferred countries: ${preferences.countries||'Any'}`,'','## Ranked opportunities'];
    matches.forEach((m,i)=>{lines.push('',`### ${i+1}. ${m.name} — ${m.score===null?'Unscored':m.score+'/100'} (${m.label})`,`- Country: ${m.country}`,`- Deadline: ${m.deadline||'Not announced'} (${m.deadlineStatus})`,`- Alignment: ${m.reasons.join('; ')||'Review manually'}`,`- Checks: ${m.blockers.join('; ')||'Confirm eligibility and lab fit'}`,`- Source: ${m.sourceUrl}`)});
    lines.push('','## Suggested next actions');plan(matches,3).forEach(t=>lines.push(`- [ ] ${t.title}${t.due?' (suggested by: '+t.due+')':''}`));
    return lines.join('\n');
  }
  return {extractProfile,rank,rankOne,reviewCV,plan,emailDraft,report,SKILLS};
});
