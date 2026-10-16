import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
const root=new URL('../',import.meta.url);
const read=name=>readFileSync(new URL(name,root),'utf8');
const html=read('index.html'), css=read('styles.css'), code=read('app.js');
const source=JSON.parse(read('data/review-data.json'));
const PARTS=['scope','activation','defeaters','exceptions','conflict_policy','principle'];
let checked=0;
function test(title,fn){fn();console.log('PASS',title);checked++;}
test('HTML/CSS/JS assets exist and scripts parse',()=>{
  new Script(code,{filename:'app.js'});
  assert.ok(css.length>5000&&html.length>2500);
  assert.match(html,/<html lang="fa" dir="rtl">/);
  assert.match(html,/href="styles.css"/);
  assert.match(html,/src="app.js"/);
});
test('Vazirmatn is explicitly used by CSS and loaded in page',()=>{
  assert.match(css,/--font:'Vazirmatn'/);
  assert.match(html,/fonts.googleapis.com\/css2\?family=Vazirmatn/);
});
test('academic data preserve their version, history and non-admission',()=>{
  assert.equal(source.schema_version,'feqh-scholar-review-portal-v1');
  assert.equal(source.rules.length,10);
  assert.equal(source.sources.length,34);
  assert.equal(source.status,'RESEARCH_ONLY_NOT_INDEPENDENTLY_SCHOLARLY_APPROVED');
  assert.ok(source.openNodes.some(x=>x.includes('CE-01')));
});
test('each source has sound stable ID, raw hash and edition uncertainty',()=>{
  const ids=new Set();
  for(const passage of source.sources){
    assert.match(passage.id,/^ANS-\d+-R\d+-S\d+$/);
    assert.ok(!ids.has(passage.id));ids.add(passage.id);
    assert.equal(passage.book,passage.id.match(/^ANS-(\d+)/)[1]);
    assert.equal(passage.record,+passage.id.match(/-R(\d+)-/)[1]);
    assert.equal(passage.hash,createHash('sha256').update(passage.quote).digest('hex'));
    assert.equal(passage.printEdition,'PRINT_EDITION_UNKNOWN');
  }
});
test('all six components have valid evidence and opposing references',()=>{
  const ids=new Set(source.sources.map(x=>x.id)),rules=new Set();
  for(const rule of source.rules){
    assert.ok(!rules.has(rule.id));rules.add(rule.id);
    assert.deepEqual(Object.keys(rule.components).sort(),[...PARTS].sort());
    for(const cell of Object.values(rule.components)){
      assert.ok(cell.status);
      for(const id of cell.canonicalBackings)assert.ok(ids.has(id),rule.id+': '+id);
      for(const id of cell.adverseRefs)assert.match(id,/^(CE-|OPP-)/);
    }
  }
  assert.ok(rules.has('MR-ANS-AFTER-TASAQUT-A'));
  assert.ok(rules.has('MR-ANS-AFTER-TASAQUT-B'));
  assert.ok(!rules.has('MR-ANS-AFTER-TASAQUT'));
});
test('page starts with a practical walkthrough',()=>{
  assert.ok(html.includes('آیا این قاعده'));
  for(const t of ['ادعای میوز','متن شیخ','شش پرسش','رأی نهایی'])assert.ok(html.includes(t),t);
  for(const id of ['rule-list','rule-view','search-rule','reviewer-name','edition-note',
     'export-header','download-json','download-md','copy-json','share-review','import-input','theme-toggle']){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
});
test('ten distinct research rule explanations and three questions each',()=>{
  const found=[...code.matchAll(/'MR-ANS-[A-Z-]+(?:-A|-B)?':\s*\{/g)].map(x=>x[0]);
  assert.equal(found.length,10,'one explicit research focus for every rule');
  assert.ok(code.includes('صورت‌بندی پژوهشی برای داوری — نقل‌قول لفظی شیخ نیست'));
  assert.ok(code.includes('سه پرسش راهنما برای این قاعده'));
});
test('guided six-question wizard, four choices, reason and final submission',()=>{
  for(const t of ['تأیید می‌کنم','رد می‌کنم','نیازمند اصلاح','فعلاً معلق',
    'data-action="next-part"','data-action="submit"','partProblem','finalProblem',
    "review(selected).submitted_at=now()",'قاعده بعدی']){
    assert.ok(code.includes(t),t);
  }
});
test('original export format and local draft remain backwards compatible',()=>{
  assert.ok(code.includes("const STORAGE='feqh-muse-review-draft-v1'"));
  assert.ok(code.includes("SCHEMA='feqh-muse-self-review-v1'"));
  assert.ok(code.includes("localStorage.setItem(STORAGE"));
  assert.ok(code.includes('!!item.submitted_at'));
  assert.ok(code.includes('reviewer_role:'));
  assert.ok(code.includes("research_qualification_effect:'NONE'"));
  assert.ok(code.includes('historical_admissions:0'));
  assert.ok(code.includes('JSON.stringify(exportPayload()'));
  assert.ok(code.includes('importReview'));
  assert.ok(code.includes('navigator.share'));
});
test('static GitHub Pages design has no authentication server',()=>{
  assert.ok(!html.includes('action="/login"'));
  assert.ok(!code.includes('FEQH_AUTH_PASSWORD'));
  assert.ok(!html.includes('server.mjs'));
  assert.equal((code.match(/\bfetch\(/g)||[]).length,1);
  assert.ok(code.includes("fetch('./data/review-data.json'"));
});
console.log('\nFeqhMuseWeb static guided workflow:',checked,'checks passed.');
