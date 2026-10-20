const assert=require('node:assert/strict');
const A=require('../advisor.js');
const sample='Computer engineering student with Python, machine learning, statistics, probability, linear algebra, algorithms and research experience.';
const profile=A.extractProfile(sample,'machine learning, theory');
assert(profile.hasCV);
assert(profile.areas.includes('Machine Learning'));
assert(profile.areas.includes('Statistics'));
assert(profile.keywords.includes('python'));
const ps=[
{id:'a',name:'ML Lab',country:'Finland',researchAreas:['Machine Learning','Statistics'],deadline:'2027-01-31',deadlineStatus:'verified',funding:'Paid'},
{id:'b',name:'Suspended',country:'Austria',researchAreas:['Machine Learning'],deadlineStatus:'paused'},
{id:'c',name:'Old',country:'Finland',researchAreas:['Machine Learning'],deadline:'2025-01-01',deadlineStatus:'verified'},
{id:'d',name:'Biology',country:'Japan',researchAreas:['Bioinformatics'],deadlineStatus:'unannounced'}
];
const matches=A.rank(ps,profile,{},'2026-10-20');
assert.equal(matches[0].id,'a');
assert.equal(matches.find(x=>x.id==='b').canApply,false);
assert.equal(matches.find(x=>x.id==='b').score,0);
assert.equal(matches.find(x=>x.id==='c').canApply,false);
assert(matches.find(x=>x.id==='a').score>matches.find(x=>x.id==='d').score);
assert(A.emailDraft(matches[0],profile).includes('[Professor / PI name]'));
assert(A.report(profile,matches).includes('not probabilities of admission'));
const tasks=A.plan(matches,3);
assert(tasks.length>0&&tasks.every(x=>x.programId==='a'||x.programId==='d'));
console.log('PASS: CV extraction, ranking, hard stop, deadlines, report, email and plan.');
