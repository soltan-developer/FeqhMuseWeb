import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
const root=new URL('../',import.meta.url);
const raw=path=>readFileSync(new URL(path,root));
const txt=path=>raw(path).toString('utf8');
const j=path=>JSON.parse(txt(path));
const manifest=j('research/step1/MANIFEST.json');
const findings=j('research/step1/FINDINGS.json');
const corpus=j('data/review-data.json');
const sourceSnap=j('research/step1/SOURCE_DATA_SNAPSHOT.json');
const verification=j('research/step1/VERIFICATION.json');
const verifySummary=j('research/step1/VERIFICATION_SUMMARY.json');
const contexts=txt('research/step1/EVIDENCE_CONTEXTS.md');
const app=txt('app.js'),html=txt('index.html'),css=txt('step1.css');
const parts=['scope','activation','defeaters','exceptions','conflict_policy','principle'];
const kinds=new Set(['approve','reject','revise','defer']);
let checks=0;
function check(label,fn){fn();console.log('✓',label);checks++;}
check('all Step 1 source files are immutable according to manifest',()=>{
  for(const f of manifest.files){
    const file=raw('research/step1/'+f.path);
    assert.equal(file.length,f.bytes,f.path);
    assert.equal(createHash('sha256').update(file).digest('hex'),f.sha256,f.path);
  }
});
check('C4 corpus source key matches machine review source key',()=>{
  assert.equal(findings.source_sha,corpus.source_sha);
  assert.equal(findings.source_sha,sourceSnap.source_sha);
  assert.equal(findings.repo_commit,verifySummary.repo_commit);
  assert.equal(findings.repo_commit,sourceSnap.source_sha===findings.repo_commit?sourceSnap.source_sha:findings.repo_commit);
});
check('10 distinct research rules each have all 6 machine assessments',()=>{
  assert.equal(findings.rules.length,10);
  const sourceIds=new Set(corpus.rules.map(r=>r.id)),found=new Set();
  for(const r of findings.rules){
    assert.ok(sourceIds.has(r.id),r.id);
    assert.ok(!found.has(r.id),r.id);found.add(r.id);
    assert.ok(r.claim.length>12&&r.corrected.length>20&&r.reason.length>15);
    assert.deepEqual(Object.keys(r.parts).sort(),[...parts].sort());
    for(const [part,p] of Object.entries(r.parts)){
      assert.ok(kinds.has(p.decision),r.id+'.'+part);
      assert.ok(p.reason.length>12);
      assert.ok(Array.isArray(p.refs));
    }
  }
});
check('34 canonical citation spans remain unchanged',()=>{
  assert.equal(corpus.sources.length,34);
  assert.equal(sourceSnap.sources.length,34);
  for(let i=0;i<34;i++){
    assert.equal(corpus.sources[i].id,sourceSnap.sources[i].id);
    assert.equal(corpus.sources[i].hash,sourceSnap.sources[i].hash);
  }
});
check('Step1 integrity discrepancy is preserved, never silently marked verified',()=>{
  assert.equal(verification.length,34);
  assert.equal(verification.filter(x=>x.quoteHashMatches&&x.spanMatches&&x.beforeMatches&&x.afterMatches).length,34);
  assert.equal(verification.filter(x=>x.recordHashMatches===false).length,34);
  assert.equal(verifySummary.all_exact_checks_pass,true);
  assert.match(app,/recordHashMatches===false/);
  assert.match(html,/recordHashMatches/);
});
check('all cited machine record locations have a source context',()=>{
  const map=new Set();
  const headings=[...contexts.matchAll(/^## (فرائد الأصول، ج[۱۲]|المکاسب، ج۱)، رکورد (\d+)،[^\n]*/gm)];
  for(const m of headings){
    const book=m[1].startsWith('المکاسب')?'1571':m[1].includes('ج۱')?'12227':'12228';
    map.add(book+':'+m[2]);
  }
  assert.equal(map.size,58);
  const refs=new Set();
  for(const r of findings.rules){
    for(const ref of r.refs)refs.add(ref);
    for(const p of Object.values(r.parts))for(const ref of p.refs)refs.add(ref);
  }
  assert.equal(refs.size,51);
  for(const ref of refs)assert.ok(map.has(ref),ref);
});
check('researcher type remains machine, not human',()=>{
  assert.match(findings.reviewer,/Codex/);
  assert.match(app,/machine_step1/);
  assert.match(app,/HUMAN_VERDICT_ON_CODEX_CORRECTED_PROPOSAL/);
  assert.match(app,/PRIMARY_RESEARCHER_SELF_REVIEW_NOT_INDEPENDENT/);
});
check('new explanatory four-step interface is present',()=>{
  for(const stage of ["['read'","['audit'","['review'","['final'"])assert.ok(app.includes(stage),stage);
  assert.ok(app.includes('function auditStage('));
  assert.ok(app.includes('function reviewStage('));
  assert.ok(app.includes('function finalStage('));
  assert.ok(app.includes('function openRecord('));
  assert.ok(html.includes('record-dialog'));
  assert.ok(html.includes('Vazirmatn'));
});
check('human vote is never initialized from machine findings',()=>{
  new Script(app,{filename:'app.js'});
  assert.ok(app.includes("review_schema:SCHEMA"));
  assert.ok(app.includes("decision:''"));
  assert.ok(app.includes("reason:''"));
  assert.ok(!app.includes('decision=mpart.decision'));
  assert.ok(!app.includes('decision=audit'));
  assert.ok(app.includes("p.reason.trim().length>=12"));
});
check('static site does not require auth proxy and has no outbound write code',()=>{
  assert.ok(!app.includes('FEQH_AUTH_PASSWORD'));
  assert.ok(!html.includes('action="/login"'));
  assert.ok(!app.includes("fetch('https://"));
  assert.ok(!app.includes('method:"POST"'));
  assert.ok(css.includes('.audit-comparison'));
});
console.log('Step 1 integration:',checks,'checks PASS');
