const assert=require('node:assert/strict');
const A=require('../advisor.js');
const sample='Computer engineering student with Python, machine learning, statistics, probability, linear algebra, algorithms and research experience.';
const profile=A.extractProfile(sample,'machine learning, theory');
assert(profile.hasCV);
assert(profile.areas.includes('Machine Learning'));
assert(profile.areas.includes('Statistics'));
assert(profile.keywords.includes('python'));
const ps=[
{id:'a',name:'ML Lab',country:'Finland',researchAreas:['Machine Learning','Statistics'],deadline:'2027-01-31',deadlineStatus:'verified',funding:'Paid',sourceUrl:'https://example.edu/program',applicationUrl:'https://apply.example.edu'},
{id:'b',name:'Suspended',country:'Austria',researchAreas:['Machine Learning'],deadlineStatus:'paused'},
{id:'c',name:'Old',country:'Finland',researchAreas:['Machine Learning'],deadline:'2025-01-01',deadlineStatus:'verified'},
{id:'d',name:'Biology',country:'Japan',researchAreas:['Bioinformatics'],deadlineStatus:'unannounced'},
{id:'e',name:'Closed call',country:'Canada',researchAreas:['Machine Learning'],deadlineStatus:'closed',eligibility:'Only students at eligible partner institutions'}
];
const matches=A.rank(ps,profile,{},'2026-10-20');
assert.equal(matches[0].id,'a');
assert.equal(matches.find(x=>x.id==='b').canApply,false);
assert.equal(matches.find(x=>x.id==='b').score,0);
assert.equal(matches.find(x=>x.id==='c').canApply,false);
assert.equal(matches.find(x=>x.id==='e').canApply,false);
assert.equal(matches.find(x=>x.id==='e').label,'Closed');
assert(matches.find(x=>x.id==='a').score>matches.find(x=>x.id==='d').score);
assert(A.emailDraft(matches[0],profile).includes('[Professor / PI name]'));
assert(A.report(profile,matches).includes('not probabilities of admission'));
assert(A.report(profile,matches).includes('https://apply.example.edu'));
assert(A.report(profile,matches).includes('Eligibility (separate from fit)'));
const chemistry=A.extractProfile('Chemistry student with spectroscopy, catalysis and laboratory research experience.','materials science');
assert(chemistry.areas.includes('Chemistry'));
assert(chemistry.areas.includes('Materials Science'));
const tasks=A.plan(matches,3);
assert(tasks.length>0&&tasks.every(x=>x.programId==='a'||x.programId==='d'));
console.log('PASS: CV extraction, ranking, hard stop, deadlines, report, email and plan.');
