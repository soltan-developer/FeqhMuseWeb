/* Feqh Muse | Guided scientific self-review. Local-only, non-executable. */
(function () {
  'use strict';
  const STORAGE='feqh-muse-review-draft-v1', SCHEMA='feqh-muse-self-review-v1';
  const PARTS=[
    {key:'scope',name:'قلمرو قاعده',question:'آیا این قاعده فقط در موارد درستی تعمیم داده شده است؟',help:'روشن کنید شیخ در چه موضوع یا باب فقهی/اصولی این روش را به کار برده است. آیا می‌توان آن را به باب دیگر تعمیم داد یا ناظر به مورد خاص است؟'},
    {key:'activation',name:'شرایط اجرای قاعده',question:'پیش از اعمال این روش، چه شرایطی باید احراز شده باشد؟',help:'تأمل کنید آیا فرض‌های قبلی، مثل حجیت دلیل، اتحاد موضوع، وجود قرینه، یا فحص از مرجح، در بازسازی لحاظ شده‌اند؟'},
    {key:'defeaters',name:'موانع و موارد نقض',question:'چه چیزی مانع اجرای این قاعده می‌شود؟',help:'شواهد ناسازگار، تغییر موضوع، قرینه برخلاف، اختلاف مبنا یا نقد خود شیخ را بررسی کنید. آیا این موانع در پژوهش درست فهمیده شده‌اند؟'},
    {key:'exceptions',name:'استثناها و حدود',question:'آیا استثناهای قاعده درست شناسایی شده‌اند؟',help:'ببینید مواردی وجود دارند که ظاهر قاعده شاملشان می‌شود اما شیخ رفتار متفاوتی دارد. مجهول‌بودن استثنا را به معنای نبود استثنا تلقی نکنید.'},
    {key:'conflict_policy',name:'نسبت با قواعد دیگر',question:'اگر این قاعده با روش دیگری روبه‌رو شود، کدام مقدم است و چرا؟',help:'مثلاً نسبت حکومت و ورود با تعارض، یا تقدم جمع عرفی بر ترجیح و نسبت تساقط با اصول عملیه را تنها تا جایی که متن اجازه می‌دهد احراز کنید.'},
    {key:'principle',name:'انتساب اصل قاعده',question:'آیا اصل این ادعا واقعاً رأی مختار شیخ انصاری است؟',help:'آیا جمله از خود شیخ است یا نقل نظر دیگران؟ آیا از متن تنها یک مثال به دست می‌آید یا یک ضابطه عام؟ تردید خود مؤلف را به حکم قطعی تبدیل نکنید.'}
  ];
  const VOTES=[
    {id:'approve',name:'تأیید می‌کنم',sub:'پس از بررسی متن و نقد Codex، این جزء را می‌پذیرم.'},
    {id:'reject',name:'رد می‌کنم',sub:'این برداشت از شواهد به دست نمی‌آید.'},
    {id:'revise',name:'نیازمند اصلاح',sub:'اصل قابل قبول است؛ اما تعبیر یا قیود غلط است.'},
    {id:'defer',name:'فعلاً معلق',sub:'برای تصمیم، شاهد یا تحقیق بیشتری لازم است.'}
  ];
  const LABELS={DIRECTLY_SUPPORTED:'شاهد متنی مستقیم (ادعای میوز)',INFERENTIALLY_SUPPORTED:'استظهار پژوهشی',PARTIAL:'پشتوانه جزئی',UNKNOWN:'هنوز نامعلوم',UNSUPPORTED:'بدون شاهد کافی',CONTRADICTED:'شاهد مخالف',NOT_VERIFIED:'تطبیق‌نشده'};
  const FOCUS={
    'MR-ANS-TAARUD-UNITY':{
      claim:'در بازسازی روش شیخ، تحقق تعارض نیازمند وحدت موضوع و جهت تنافی است؛ اختلافی که با اختلاف موضوع یا نسبت ادله برطرف می‌شود، نباید تعارض مستقر محسوب شود.',
      questions:['آیا تعریف تعارض در عبارت شیخ همین قیود را دارد؟','آیا حکومت و ورود را باید پیش از سنجش تعارض بررسی کرد؟','آیا تعمیم ضابطه از بحث اخبار به همه ادله مجاز است؟']
    },
    'MR-ANS-DALALA-FIRST':{
      claim:'در ارزیابی ادله، قوت دلالت و جمع عرفی در مواضع مشخصی پیش از سنجش بعضی مرجحات سندی قرار می‌گیرند؛ اما دامنه این تقدم نیازمند بررسی است.',
      questions:['در کدام مقام، شیخ نص یا اظهر را بر ظاهر مقدم می‌داند؟','تقدم دلالت در برابر سند مطلق است یا مقید؟','تأثیر شهرت یا قرائن مقامی در این تقدم چیست؟']
    },
    'MR-ANS-JAM-NO-UNIVERSAL':{
      claim:'شیخ قاعده «الجمع بین الدلیلین مهما أمکن» را به صورت یک اولویت بی‌قید نمی‌پذیرد و برخی جمع‌ها را فاقد مجوز عرفی می‌داند.',
      questions:['آیا موضوع نقد شیخ اصل جمع است یا کلیت قاعده مشهور؟','کدام جمع، تأویلِ بدون قرینه شمرده می‌شود؟','مورد عذره در مکاسب چه محدودیتی برای تعمیم ایجاد می‌کند؟']
    },
    'MR-ANS-JAM-QARINA':{
      claim:'جمع بین ادله وقتی مجاز است که قرینه و فهم عرفی آن را پشتیبانی کند؛ جمع تبرعی را نمی‌توان صرف امکان عقلیِ تأویل معتبر دانست.',
      questions:['مرز جمع عرفی و تبرعی نزد خود شیخ چگونه تعیین شده است؟','آیا شواهد فرائد با رویه او در بیع عذره مکاسب سازگار است؟','CE-01 چه قید یا استثنایی بر این نامزد تحمیل می‌کند؟']
    },
    'MR-ANS-TARJIH-OPEN':{
      claim:'برخی بحث‌های شیخ امکان تعدی از مرجحات منصوص را مطرح می‌کنند، اما شرایط و معیار آن را نمی‌توان به فرمول امتیازدهی عمومی تبدیل کرد.',
      questions:['چه ملاکی برای تعدی از مرجحات منصوص در متن قابل احراز است؟','آیا «اقربیت به واقع» کافی است یا شرایط حجیت و جهت دخیل‌اند؟','شواهد مخالف، قلمرو تعدی را چگونه محدود می‌کنند؟']
    },
    'MR-ANS-TAKHYIR-LAST':{
      claim:'در بعضی موارد تعارض اخبار متکافئ، تخییر تنها پس از فحص لازم از مرجحات و نبود راه حل مقدم مطرح می‌شود؛ این حکم به همه تعارض اصول سرایت نمی‌کند.',
      questions:['آیا فحص از مرجحات شرط تخییر است؟','تخییر اخبار و تخییر اصول عملیه چه تفاوتی دارند؟','اخبار توقف و امکان دسترسی به امام چه اثری دارند؟']
    },
    'MR-ANS-STOP-BOUND':{
      claim:'توقف، ارجاء و احتیاط نزد شیخ یک عملگر یکسان و جهان‌شمول نیستند؛ کاربرد آنها به مقام، امکان مراجعه، حجیت و وضعیت دلیل وابسته است.',
      questions:['توقف نظری شیخ در چه موضعی به توقف عملی منتهی می‌شود؟','آیا «والمسألة محل الإشكال» الزاماً به توقف در عمل می‌انجامد؟','نسبت اخبار ارجاء با تخییر در مقام عمل چیست؟']
    },
    'MR-ANS-AFTER-TASAQUT-A':{
      claim:'پس از سقوط راه‌های حجت در یک تعارض خاص، نوبت به تشخیص اصل یا قاعده عملی مناسبِ همان مسئله می‌رسد؛ نه یک ترتیب ثابت و جهانی.',
      questions:['موضوع این قاعده سقوط طرق است یا سقوط اصول؟','آیا مرجع بعد از سقوط از موضوع مسئله تعیین می‌شود؟','چه شاهد مستقلی بر این مرحله در متن وجود دارد؟']
    },
    'MR-ANS-AFTER-TASAQUT-B':{
      claim:'در تعارض استصحابین، ابتدا باید نسبت سببی/مسببی و آثار علم اجمالی بررسی شود؛ در برخی صورت‌ها تساقط و رجوع به قواعد دیگر رخ می‌دهد.',
      questions:['چرا شک سببی بر مسببی مقدم می‌شود؟','چه زمانی استصحابین واقعاً تساقط می‌کنند؟','در صورت سوم و چهارم، چرا هر دو یا فقط یک اصل قابل جریان است؟']
    },
    'MR-ANS-JIHA-BOUND':{
      claim:'مرجحات جهتی و احتمال تقیه در یک قلمرو محدود و با مقدمات خاص مطرح می‌شوند؛ حمل بر تقیه جانشین خودکار بررسی دلالت و صدور نیست.',
      questions:['شیخ این بحث را در چه مرحله‌ای از ترجیح مطرح می‌کند؟','آیا استناد به «أبعد عن الباطل» مطلق و بی‌شرط است؟','چگونه نقل قول شیخ طوسی از رأی خود انصاری جدا می‌شود؟']
    }
  };
  const REVIEW_ORDER=[
    'MR-ANS-TAARUD-UNITY','MR-ANS-DALALA-FIRST','MR-ANS-JAM-NO-UNIVERSAL',
    'MR-ANS-JAM-QARINA','MR-ANS-TARJIH-OPEN','MR-ANS-TAKHYIR-LAST',
    'MR-ANS-STOP-BOUND','MR-ANS-AFTER-TASAQUT-B','MR-ANS-AFTER-TASAQUT-A','MR-ANS-JIHA-BOUND'
  ];
  let data,draft,selected,stage='read',partIndex=0,filter='all',search='',showAll=false,toastTimer;
  let audit=null,verificationSummary=null,verificationRows=[],contextMap=null;
  const $=id=>document.getElementById(id);
  const safe=value=>String(value==null?'':value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const now=()=>new Date().toISOString();
  const validVote=v=>VOTES.some(x=>x.id===v)?v:'';
  const voteName=v=>VOTES.find(x=>x.id===v)?.name||'بی‌نظر';
  const ruleById=id=>data.rules.find(r=>r.id===id);
  const sourceById=id=>data.sources.find(s=>s.id===id);
  const bookName=id=>data.books.find(x=>x.id===id)?.title||'کتاب '+id;
  const showToast=msg=>{const t=$('toast');t.textContent=msg;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3300);};
  function fresh(){return {review_schema:SCHEMA,source_sha:data.source_sha,review_target:'STEP1_CORRECTED_CANDIDATE',
      reviewer:'',edition_note:'',created_at:now(),updated_at:now(),reviews:{},legacy_reviews:{},migrated_from_c4:false};}
  function review(id){
    if(!draft.reviews[id])draft.reviews[id]={parts:{},decision:'',reason:'',updated_at:null,submitted_at:null};
    const entry=draft.reviews[id];
    for(const part of PARTS)if(!entry.parts[part.key])entry.parts[part.key]={decision:'',reason:''};
    return entry;
  }
  function loadDraft(){
    let raw=null;
    try{raw=JSON.parse(localStorage.getItem(STORAGE)||'null');}catch(_){}
    draft=fresh();
    if(!raw||raw.review_schema!==SCHEMA||raw.source_sha!==data.source_sha||!raw.reviews)return;
    draft.reviewer=String(raw.reviewer||'').slice(0,160);
    draft.edition_note=String(raw.edition_note||'').slice(0,350);
    draft.created_at=raw.created_at||now();
    const legacyScope=raw.review_target!=='STEP1_CORRECTED_CANDIDATE';
    draft.legacy_reviews=legacyScope?JSON.parse(JSON.stringify(raw.reviews)):(raw.legacy_reviews||{});
    draft.migrated_from_c4=legacyScope||!!raw.migrated_from_c4;
    for(const rule of data.rules){
      const source=raw.reviews[rule.id];
      if(!source||typeof source!=='object'||legacyScope)continue;
      const dest=review(rule.id);
      dest.decision=validVote(source.decision);
      dest.reason=String(source.reason||'').slice(0,20000);
      dest.updated_at=source.updated_at||null;
      dest.submitted_at=source.submitted_at||null;
      for(const p of PARTS){
        const s=source.parts?.[p.key]||{};
        dest.parts[p.key]={decision:validVote(s.decision),reason:String(s.reason||'').slice(0,20000)};
      }
    }
  }
  function save(){
    draft.updated_at=now();
    try{localStorage.setItem(STORAGE,JSON.stringify(draft));$('save-indicator').innerHTML='<span class="online-dot"></span> ذخیره شد';}
    catch(_){showToast('ذخیره ممکن نیست؛ فایل JSON پشتیبان بگیرید.');}
  }
  function partValid(p){
    return !!p&&!!validVote(p.decision)&&p.reason.trim().length>=12;
  }
  function completion(id){
    const item=review(id);
    const partsDone=PARTS.filter(p=>partValid(item.parts[p.key])).length;
    const overall=!!validVote(item.decision)&&item.reason.trim().length>=12&&draft.reviewer.trim().length>=2;
    return {partsDone,complete:partsDone===6&&overall&&!!item.submitted_at,overall};
  }
  function list(){
    const done=data.rules.filter(r=>completion(r.id).complete).length;
    $('side-progress-value').textContent=done+' از ۱۰';
    $('side-progress-bar').style.width=(10*done)+'%';
    $('side-progress-hint').textContent=done===10?'تمام پرونده‌ها تکمیل شده‌اند؛ گزارش را دریافت کنید.':'پاسخ هر پرونده تا زمان دریافت گزارش نزد مرورگر شما باقی می‌ماند.';
    const visible=data.rules.filter(r=>(filter==='all'||(filter==='completed')===completion(r.id).complete)
      &&(r.title.includes(search)||r.id.toLowerCase().includes(search.toLowerCase())));
    $('rule-list').innerHTML=visible.map((r,i)=>{
      const state=completion(r.id),number=REVIEW_ORDER.indexOf(r.id)+1,active=selected===r.id;
      const symbol=state.complete?'✓':state.partsDone?String(state.partsDone):'';
      return '<button type="button" class="rule-entry'+(active?' active':'')+'" data-action="rule" data-id="'+safe(r.id)+'" aria-current="'+(active?'page':'false')+'">'+
        '<span class="number">'+String(number).padStart(2,'0')+'</span><span class="entry-body"><span class="entry-name">'+safe(r.title)+'</span><span class="entry-sub">'+(state.complete?'داوری ثبت شد':state.partsDone?'بررسی '+state.partsDone+' از ۶ سؤال':'هنوز شروع نشده')+'</span></span>'+
        '<span class="entry-status'+(state.complete?' done':'')+'">'+safe(symbol)+'</span></button>';
    }).join('')||'<p class="muted">پرونده‌ای با این مشخصات یافت نشد.</p>';
  }
  function tag(label,variant=''){return '<span class="pill '+variant+'">'+safe(label)+'</span>';}
  function statusTag(status){return tag(LABELS[status]||status,status==='UNKNOWN'||status==='PARTIAL'?'amber':status==='DIRECTLY_SUPPORTED'?'green':'');}
  function sourceCard(id,showDetails=false){
    const s=sourceById(id);
    if(!s)return '<div class="warning">شاهد '+safe(id)+' در بسته پژوهشی فعلی پیدا نشد.</div>';
    return '<article class="evidence-card"><div class="evidence-head"><span class="evidence-id">'+safe(id)+'</span>'+tag('شناسه قدیم: '+s.aliases.join('، '))+'</div>'+
      '<div class="evidence-meta">'+safe(bookName(s.book))+' · صفحه دیتابیس '+safe(s.page)+' · رکورد '+safe(s.record)+' · چاپ تأیید نشده</div>'+
      '<blockquote class="quote" lang="ar">'+safe(s.quote)+'</blockquote>'+
      '<details class="quote-context"'+(showDetails?' open':'')+'><summary>نمایش سیاق کوتاه قبل و بعد</summary><p>'+safe(s.before)+' <mark class="context-current">'+safe(s.quote)+'</mark> '+safe(s.after)+'</p></details>'+
      '<div class="outline-actions"><button type="button" class="jump-button" data-action="copy-source" data-source="'+safe(id)+'">کپی نقل و ارجاع</button></div></article>';
  }
  function allSources(rule){
    const seen=new Set();
    for(const item of Object.values(rule.components))for(const ref of item.canonicalBackings)seen.add(ref);
    for(const ref of rule.additionalBackings||[])seen.add(ref);
    return [...seen];
  }

  // Research Step 1 is a MACHINE audit and is never silently copied into human votes.
  function audited(ruleId){return audit?.rules?.find(x=>x.id===ruleId)||null;}
  function auditedPart(ruleId,key){return audited(ruleId)?.parts?.[key]||null;}
  function machineState(v){
    return ({approve:'تأیید مقیدِ Codex',revise:'اصلاح پیشنهادی Codex',reject:'رد پیوند شاهد توسط Codex',defer:'تعلیق پیشنهادشده Codex'})[v]||'نظر ماشینی نامشخص';
  }
  function recordButtons(refs){
    if(!refs?.length)return '<span class="tiny-note">شاهد افزوده ثبت نشده است.</span>';
    return '<div class="audit-ref-row">'+[...new Set(refs)].map(ref=>{
      if(!/^\d+:\d+$/.test(ref))return '<span class="pill amber">'+safe(ref)+'</span>';
      return '<button type="button" class="record-chip" data-action="open-record" data-ref="'+safe(ref)+'" title="خواندن متن گسترده این رکورد">'+safe(ref)+' ↗</button>';
    }).join('')+'</div>';
  }
  async function openRecord(ref){
    if(!/^\d+:\d+$/.test(ref))return;
    $('record-dialog-title').textContent='در حال دریافت متن '+ref+'…';
    $('record-dialog-meta').textContent='منبع: research/step1/EVIDENCE_CONTEXTS.md';
    $('record-dialog-body').textContent='در حال بارگذاری متن گسترده رکورد…';
    $('record-dialog').showModal();
    try{
      if(!contextMap){
        const response=await fetch('./research/step1/EVIDENCE_CONTEXTS.md',{cache:'no-store'});
        if(!response.ok)throw Error('دریافت متن رکوردها ناموفق بود: '+response.status);
        const full=await response.text();
        const matches=[...full.matchAll(/^## (فرائد الأصول، ج[۱۲]|المکاسب، ج۱)، رکورد (\d+)،[^\n]*/gm)];
        const map=new Map();
        matches.forEach((m,i)=>{
          const book=m[1].startsWith('المکاسب')?'1571':m[1].includes('ج۱')?'12227':'12228';
          const start=m.index+m[0].length;
          const stop=i+1<matches.length?matches[i+1].index:full.length;
          map.set(book+':'+m[2],{heading:m[0].replace(/^## /,''),body:full.slice(start,stop).trim()});
        });
        contextMap=map;
      }
      const passage=contextMap.get(ref);
      if(!passage)throw Error('این رکورد در ۵۸ متن منتشرشده Step 1 یافت نشد.');
      $('record-dialog-title').textContent='رکورد '+ref;
      $('record-dialog-meta').textContent=passage.heading;
      $('record-dialog-body').textContent=passage.body;
    }catch(error){
      $('record-dialog-title').textContent='امکان نمایش رکورد نیست';
      $('record-dialog-body').textContent=String(error.message);
    }
  }
  function machineSnippet(rule){
    const x=audited(rule.id);
    if(!x)return '<div class="warning">گزارش Step 1 برای این قاعده بارگذاری نشده است؛ رأی انسانی را بدون نسبت‌دادن نتیجه به Codex ثبت کنید.</div>';
    return '<div class="audit-brief"><span class="kicker">جمع‌بندی ماشین · Step 1 · هنوز رأی شما نیست</span>'+
      '<span class="decision-marker">'+safe(x.verdict)+'</span><strong>چکیده نقد</strong><p>'+safe(x.claim)+'</p>'+
      '<button type="button" class="button button-outline button-small" data-action="stage" data-stage="audit">مشاهده تحلیل و اسناد Codex ←</button>'+
      '<small class="audit-source">مبنای گزارش: research/step1/FINDINGS.json · '+safe(audit.reviewer)+'</small></div>';
  }
  function technicalLimitations(){
    const hashFalse=verificationRows.filter(x=>x.recordHashMatches===false).length;
    return '<div class="warning"><strong>وضعیت اعتبار منابع:</strong> گزارش Step 1 موفقیت تطبیق ۳۴ نقل کوتاه با داده دیجیتال را ادعا می‌کند، ولی '+hashFalse+
      ' مقدار <code>recordHashMatches=false</code> در فایل جزئی دارد. این ناسازگاری فنی حل نشده است. تصویر چاپ مقابله نشده و مدارک کامل CE-01 / CE-05 / CE-06 نیز در این بسته موجود نیستند.</div>';
  }

  function steps(){
    const options=[['read','۱','ادعای اولیه'],['audit','۲','نقد Codex'],['review','۳','داوری شش محور'],['final','۴','رأی انسانی']];
    return '<div class="stepper" aria-label="مراحل پژوهش و داوری">'+options.map(x=>
      '<button type="button" data-action="stage" data-stage="'+x[0]+'" class="'+(stage===x[0]?'active':'')+'" aria-current="'+(stage===x[0]?'step':'false')+'"><span>'+x[1]+'</span> '+x[2]+'</button>'
    ).join('')+'</div>';
  }
  function render(){
    const rule=ruleById(selected),comp=completion(selected),number=REVIEW_ORDER.indexOf(selected)+1;
    if(!rule)return;
    const top='<div class="rule-header"><div><div class="rule-label">پرونده '+number+' از ۱۰ '+(number===1?'· پیشنهاد شروع از این پرونده':'')+'</div>'+
      '<h2>'+safe(rule.title)+'</h2><div class="rule-id">'+safe(rule.id)+'</div>'+
      '<div class="rule-badges">'+tag('نامزد پژوهشی '+rule.grade,'amber')+tag('۶ محور ارزیابی')+
      (comp.complete?tag('نظر شما ثبت شده','green'):comp.partsDone?tag(comp.partsDone+' از ۶ جزء دارای نظر','blue'):tag('در انتظار داوری'))+'</div></div>'+
      '<div class="rule-action"><button type="button" class="button button-outline button-small" data-action="next-rule">قاعده بعدی ←</button></div></div>';
    let inside='';
    if(stage==='read')inside=readStage(rule);
    if(stage==='audit')inside=auditStage(rule);
    if(stage==='review')inside=reviewStage(rule);
    if(stage==='final')inside=finalStage(rule);
    $('rule-view').innerHTML=top+steps()+inside;
  }
  function readStage(rule){
    const f=FOCUS[rule.id];
    const ids=allSources(rule);
    const primary=[...new Set([...(rule.components.principle.canonicalBackings||[]),...(rule.components.scope.canonicalBackings||[])])];
    const featured=(showAll?ids:primary.slice(0,2));
    const issueList=f.questions.map(q=>'<li>'+safe(q)+'</li>').join('');
    const risks=Object.entries(rule.components).filter(([key,cell])=>cell.status==='UNKNOWN'||cell.status==='PARTIAL'||cell.adverseRefs.length).map(([key,cell])=>
      '<li><strong>'+safe(PARTS.find(p=>p.key===key).name)+':</strong> '+(cell.status==='UNKNOWN'?'هنوز مستند کافی گزارش نشده است.':cell.status==='PARTIAL'?'پشتوانه پژوهشی جزئی است.':'')+
      (cell.adverseRefs.length?' شاهد مخالف: '+safe(cell.adverseRefs.join('، '))+' (متن کامل آن در رجیستر حاضر نیست).':'')+'</li>').join('');
    return '<div class="card"><div class="section-eyebrow">گام اول · اول بدانیم چه چیزی قرار است بررسی شود</div><h3>خلاصه صورت‌بندی C4 برای بررسی</h3>'+
      '<div class="claim-box"><div class="label">صورت‌بندی پژوهشی برای داوری — نقل‌قول لفظی شیخ نیست</div><p>'+safe(f.claim)+'</p></div>'+
      '<p class="muted">در این پرونده قرار نیست درباره درستی خود فقه یا حکم شرعی نظر بدهید؛ باید بسنجید که <b>آیا این صورت‌بندی با تقریر و عمل روشی شیخ انصاری مطابق است؟</b></p>'+
      '<div class="two-cols"><div class="info-item"><h4>سه پرسش راهنما برای این قاعده</h4><ol class="question-list">'+issueList+'</ol></div>'+
      '<div class="info-item"><h4>چه چیزی از شما می‌خواهیم؟</h4><p>عبارت شیخ را بررسی کنید، بین رأی او و نقل دیگران فرق بگذارید، حدود قاعده را مشخص کنید و اگر برداشت میوز ناقص یا نادرست است، دلیل و تعبیر درست را ثبت کنید.</p></div></div></div>'+
      '<div class="card"><div class="section-eyebrow">متن پایه پژوهش</div><h3>برای این ادعا به کدام عبارت استناد شده است؟</h3>'+
      '<p class="muted">این‌ها <strong>قطعه‌های کوتاه از ثبت C4</strong> هستند، نه متن کامل صفحه. حتماً در موارد محل نزاع سیاق گسترده و چاپ معتبر را نیز ببینید.</p>'+
      featured.map(x=>sourceCard(x,true)).join('')+
      (ids.length>featured.length?'<button type="button" class="button button-outline" data-action="all-sources">نمایش همه '+ids.length+' شاهد پرونده</button>':'')+
      (showAll&&ids.length>2?'<button type="button" class="button button-plain" data-action="less-sources">نمایش کوتاه‌تر</button>':'')+'</div>'+
      (risks?'<div class="card"><h3>ابهام‌هایی که نباید نادیده بگیرید</h3><ul class="question-list">'+risks+'</ul></div>':'')+
      '<div class="card"><div class="section-eyebrow">قدم بعد</div><h3>اکنون شش سؤال روشن را پاسخ دهید</h3>'+
      '<p class="muted">در هر سؤال، عبارت مرتبط کنار پرسش نمایش داده می‌شود. اگر مدرک کافی ندارید «فعلاً معلق» را بزنید و بگویید چه تحقیقی لازم است.</p>'+
      '<button type="button" class="button button-primary" data-action="stage" data-stage="audit">ابتدا نتیجه ممیزی Codex را ببینید ←</button></div>';
  }

  function auditStage(rule){
    const x=audited(rule.id);
    if(!x)return '<section class="card">'+technicalLimitations()+'<p>گزارش ممیزی برای این قاعده هنوز در دسترس نیست.</p></section>';
    const f=FOCUS[rule.id],mainRefs=recordButtons(x.refs||[]);
    const matrix=PARTS.map(part=>{
      const p=x.parts?.[part.key];
      if(!p)return '<div class="audit-matrix-item"><b>'+safe(part.name)+'</b><p>این محور در گزارش فاقد داده است.</p></div>';
      return '<article class="audit-matrix-item"><b>'+safe(part.name)+'</b>'+
        '<span class="pill '+(p.decision==='reject'?'red':p.decision==='defer'?'amber':p.decision==='approve'?'green':'blue')+'">'+safe(machineState(p.decision))+'</span>'+
        '<p>'+safe(p.reason)+'</p>'+recordButtons(p.refs)+
        '<button type="button" class="button button-outline button-small" data-action="part" data-index="'+PARTS.indexOf(part)+'">بررسی انسانی این محور ←</button></article>';
    }).join('');
    return '<section class="card"><div class="section-eyebrow">گام دوم · گزارش Codex را نقد کنید، نه اینکه بی‌درنگ بپذیرید</div>'+
      '<h3>Codex کدام بخشِ برداشت میوز را پذیرفته یا اصلاح کرده است؟</h3>'+
      '<p class="audit-intro">این ارزیابی را مدل Codex انجام داده است. هر ۶ نتیجه آن «نظر پژوهشی ماشینی» است و هیچ‌کدام خودکار به‌عنوان رأی شما ثبت نمی‌شود.</p>'+
      '<div class="audit-comparison"><article class="audit-panel muse"><h4>۱. بیان وب‌سایت از نامزد C4 (بازنویسی راهنما)</h4><p>'+safe(f.claim)+'</p></article>'+
      '<article class="audit-panel codex"><h4>۲. نتیجه بررسی Codex</h4>'+tag(x.verdict,'blue')+'<p>'+safe(x.claim)+'</p></article></div>'+
      '<div class="audit-revised"><h4>۳. صورت اصلاح‌شده پیشنهادی Codex — این متن، ادعای جدید برای داوری شماست</h4><p>'+safe(x.corrected)+'</p></div>'+
      '<div class="audit-panel codex"><h4>استدلال کلی Codex</h4><p>'+safe(x.reason)+'</p>'+
      '<h4>ارجاع به رکوردهای متنی</h4>'+mainRefs+'</div></section>'+
      '<section class="card"><div class="section-eyebrow">برای هر جزء چه استدلالی ارائه شده؟</div><h3>جدول شش‌گانه گزارش Step 1</h3>'+
      '<p class="muted">می‌توانید همین‌جا شواهد هر محور را باز کنید و سپس نظر خودتان را در مرحله سوم ثبت کنید. اختلاف شما با Codex، خطا محسوب نمی‌شود؛ با استدلال ثبتش کنید.</p>'+
      '<div class="audit-matrix">'+matrix+'</div></section>'+
      '<section class="card"><h3>محدودیت‌های گزارش که باید پیش چشم باشند</h3>'+
      technicalLimitations()+
      '<div class="summary-box"><h4>منشأ داده</h4><p>پرونده: '+safe(x.id)+' · ممیزی ماشین در '+safe(audit.date)+
      ' · فایل <code>research/step1/FINDINGS.json</code> بر مبنای Commit '+safe(audit.repo_commit)+
      '. فقط پس از بررسی خودتان، رأی انسانی جداگانه ثبت می‌شود.</p></div>'+
      '<button type="button" class="button button-primary" data-action="start-review">من اسناد را خوانده‌ام؛ شروع داوری انسانی ←</button></section>';
  }

  function reviewStage(rule){
    const part=PARTS[partIndex],cell=rule.components[part.key],rec=review(selected).parts[part.key],done=completion(selected).partsDone;
    const mpart=auditedPart(rule.id,part.key),legacy=draft.legacy_reviews?.[selected]?.parts?.[part.key];
    const pager=PARTS.map((p,i)=>{
      const recorded=partValid(review(selected).parts[p.key]);
      return '<button type="button" class="'+(i===partIndex?'active':recorded?'done':'')+'" data-action="part" data-index="'+i+'" aria-label="'+safe(p.name)+'">'+
        '<span class="nav-count">'+(recorded?'✓':i+1)+'</span>'+safe(p.name)+'</button>';
    }).join('');
    const choices=VOTES.map(v=>{
      const selectedVote=rec.decision===v.id;
      return '<button type="button" class="decision-option'+(selectedVote?' selected '+v.id:'')+'" data-action="part-vote" data-vote="'+v.id+'" aria-pressed="'+selectedVote+'">'+
        '<strong>'+safe(v.name)+'</strong><small>'+safe(v.sub)+'</small></button>';
    }).join('');
    const risks=cell.adverseRefs.length?'<div class="danger"><strong>شاهد مخالف مرتبط: '+safe(cell.adverseRefs.join('، '))+'</strong><br>این کد به مدرک نقض یا محدودکننده اشاره دارد. متن کامل آن در این بسته ارائه نشده است؛ تا پیش از بررسی در منابع پژوهشی، از ادعای رفع تعارض خودداری کنید.</div>':'';
    const machineAnalysis=mpart?'<div class="machine-note"><h4>گزارش Codex درباره همین محور · رأی انسانی نیست</h4>'+
      '<span class="pill blue">'+safe(machineState(mpart.decision))+'</span>'+
      '<p>'+safe(mpart.reason)+'</p>'+
      '<strong class="muted-small">ارجاعات و سیاق‌های افزوده گزارش:</strong>'+recordButtons(mpart.refs)+
      '</div>':'<div class="warning">Codex برای این محور گزارش معتبری ثبت نکرده است.</div>';
    return '<section class="card"><div class="section-eyebrow">گام دوم · ارزیابی علمی جزءبه‌جزء</div><h3>پرسش '+(partIndex+1)+' از ۶</h3>'+
      '<p class="muted">برای جابه‌جایی میان پرسش‌ها روی شماره‌ها بزنید. '+done+' پرسش دارای پاسخ کافی است.</p><div class="part-navigation">'+pager+'</div>'+
      '<div class="review-layout"><div class="question-panel"><div class="section-eyebrow">'+safe(part.name)+'</div>'+
      '<h3>'+safe(part.question)+'</h3><p class="explain">'+safe(part.help)+'</p>'+
      '<p class="muted">این سؤال را درباره قاعده «<strong>'+safe(rule.title)+'</strong>» پاسخ می‌دهید؛ عنوان جزء، خودِ نقل از شیخ نیست.</p>'+
      '<div class="research-status">'+statusTag(cell.status)+'</div>'+machineAnalysis+
      (cell.note?'<div class="warning">یادداشت پژوهش: '+safe(cell.note)+'</div>':'')+risks+
      (legacy?'<div class="warning"><strong>سابقه محفوظ از وب‌اپ C4 (نه رأی این نسخه):</strong> '+safe(voteName(legacy.decision))+' · '+safe(legacy.reason||'بدون استدلال')+'</div>':'')+
      '<div class="human-check"><strong>داوری انسانی شما، جدا از نظر Codex</strong><p>رأی‌تان را درباره صورت‌بندی این محور در پرتو شواهد و اصلاح پیشنهادی انتخاب کنید. حتی برای تأیید، استدلال بنویسید.</p></div>'+'<div class="decision-hint">اکنون نظر علمی خودتان چیست؟</div><div class="decision-options" role="group" aria-label="رأی برای '+safe(part.name)+'">'+choices+'</div>'+
      '<label class="note-label" for="part-reason">استدلال مستقل شما <span>(برای همه انتخاب‌ها الزامی؛ حداقل ۱۲ نویسه)</span></label>'+
      '<textarea id="part-reason" class="note" data-input="part-reason" placeholder="مثلاً: این عبارت ناظر به خصوص تعارض خبرین است و نباید به اصول عملیه تعمیم داده شود…">'+safe(rec.reason)+'</textarea>'+
      '<p id="part-validation" class="validation" role="alert"></p>'+
      '<div class="step-foot"><button type="button" class="button button-outline" data-action="previous-part" '+(partIndex===0?'disabled':'')+'>→ پرسش قبل</button>'+
      '<button type="button" class="button button-primary" data-action="next-part">'+(partIndex===5?'رفتن به جمع‌بندی ←':'ثبت پاسخ و پرسش بعد ←')+'</button></div></div>'+
      '<aside class="source-panel"><h4>شواهدی که باید همین حالا ببینید</h4><p class="tiny-note">قطعه‌های کانونی مرتبط با همین سؤال</p>'+
      (cell.canonicalBackings.length?cell.canonicalBackings.map(id=>sourceCard(id)).join(''):'<div class="warning">برای این جزء، در بسته فعلی شاهد مثبت کانونی ثبت نشده است؛ فقدان شاهد را در نتیجه لحاظ کنید.</div>')+
      '<div class="warning">نکته نسخه‌شناختی: شماره صفحه مربوط به دیتابیس است، نه چاپ تصحیح‌شده.</div></aside></div></section>';
  }
  function finalStage(rule){
    const rec=review(selected),done=completion(selected),machine=audited(rule.id),legacy=draft.legacy_reviews?.[selected];
    const cards=PARTS.map(part=>{
      const p=rec.parts[part.key],okay=partValid(p);
      return '<button type="button" class="answer-summary" data-action="part" data-index="'+PARTS.indexOf(part)+'"><strong>'+safe(part.name)+'</strong><span>'+safe(okay?voteName(p.decision):'هنوز کامل نشده')+' ←</span></button>';
    }).join('');
    const votes=VOTES.map(v=>'<button type="button" class="decision-option'+(rec.decision===v.id?' selected '+v.id:'')+'" data-action="final-vote" data-vote="'+v.id+'" aria-pressed="'+(rec.decision===v.id)+'">'+
      '<strong>'+safe(v.name)+'</strong><small>'+safe(v.sub)+'</small></button>').join('');
    let complete=done.complete?'<div class="complete-message"><strong>✓ داوری این پرونده ثبت شده است.</strong> رأی شما در همین مرورگر ذخیره شده و با دریافت JSON قابل تحویل است. این ثبت به معنی اجرای تاریخی قاعده نیست.</div>':'';
    return '<section class="card"><div class="section-eyebrow">گام سوم · تصمیم علمی خودتان</div><h3>جمع‌بندی قاعده: '+safe(rule.title)+'</h3>'+
      '<p class="muted">میزان آمادگی: '+done.partsDone+' از ۶ محور پاسخ مستدل دارند. درباره کل قاعده نظر دهید؛ لزوماً رأی همه اجزا یکسان نیست.</p>'+
      '<div class="final-grid">'+cards+'</div></section>'+
      '<section class="card"><div class="section-eyebrow">اکنون جمع‌بندی مستقل شما</div><h3 class="final-human-title">رأی نهایی انسانی درباره این قاعده</h3>'+(legacy?'<div class="warning"><strong>رأی سابق شما درباره C4 (صرفاً برای مراجعه، نه تصویب این پیشنهاد):</strong> '+safe(voteName(legacy.decision))+' · '+safe(legacy.reason||'بدون استدلال')+'</div>':'')+
      '<div class="final-compare"><strong>پیشنهاد Codex (صرفاً نظر ماشین):</strong><p>'+(machine?safe(machine.verdict)+' · '+safe(machine.corrected):'گزارش در دسترس نیست')+'</p></div>'+
      '<p class="muted">تصمیم شما درباره <strong>صورت اصلاح‌شده پیشنهادی در گزارش Codex</strong> است. «تأیید» یعنی این تقریر را پس از مقابله با متون می‌پذیرید؛ «رد» یعنی قابل انتساب نیست؛ «اصلاح» یعنی متن دقیق‌تری پیشنهاد می‌کنید؛ «تعلیق» یعنی سند کافی ندارید. از رأی ماشین تقلید نکنید.</p>'+
      '<div class="decision-options">'+votes+'</div>'+
      '<label for="final-reason" class="note-label">استدلال شما و در صورت اختلاف، توضیح درباره نقد Codex <span>(الزامی؛ دست‌کم ۱۲ نویسه)</span></label>'+
      '<textarea id="final-reason" class="note" data-input="final-reason" placeholder="به‌طور دقیق توضیح دهید کدام عبارت شیخ و کدام قید یا استثنا در نتیجه اثر داشته است. اگر اصلاح می‌کنید صورت صحیح قاعده را پیشنهاد دهید.">'+safe(rec.reason)+'</textarea>'+
      '<div class="step-foot"><button type="button" class="button button-outline" data-action="stage" data-stage="review">→ بازگشت به پرسش‌ها</button>'+
      '<button type="button" class="button button-primary" data-action="submit">ثبت نهایی داوری این قاعده</button></div>'+
      '<p class="validation" id="final-validation" role="alert"></p>'+
      complete+'</section>'+
      '<section class="card"><h3>پس از این پرونده چه می‌شود؟</h3><p class="muted">با ثبت رأی، سراغ قاعده بعدی بروید. پس از بررسی پرونده‌ها، روی «دریافت نتیجه‌ها» بزنید و فایل JSON را برای ادامه پژوهش تحویل دهید. موافقت شما در این مرحله جای داوری مستقل و مقابله چاپ را نمی‌گیرد.</p>'+
      '<div class="outline-actions"><button class="button button-outline" data-action="next-rule">رفتن به قاعده بعدی ←</button>'+
      '<button class="button button-plain" data-action="import">ورود فایل پشتیبان JSON</button>'+
      '<button class="button button-plain" data-action="reset">پاک‌کردن یادداشت‌های محلی</button></div></section>';
  }
  function moveTo(id,phase='read'){
    if(!ruleById(id))return;
    selected=id;stage=phase;partIndex=0;showAll=false;
    list();render();$('sidebar').classList.remove('open');
    $('rule-view').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function setVote(target,vote){
    const item=review(selected);
    if(target==='final')item.decision=vote;
    else item.parts[PARTS[partIndex].key].decision=vote;
    item.submitted_at=null;item.updated_at=now();save();list();render();
  }
  function partProblem(){
    const part=PARTS[partIndex],p=review(selected).parts[part.key];
    if(!p.decision)return 'لطفاً یکی از چهار رأی را انتخاب کنید؛ اگر هنوز نمی‌دانید، «فعلاً معلق» را بزنید.';
    if(!partValid(p))return 'برای هر تصمیم علمی، حتی تأیید، حداقل ۱۲ نویسه استدلال خودتان را بنویسید.';
    return '';
  }
  function finalProblem(){
    if(draft.reviewer.trim().length<2)return 'ابتدا نام خود را در بخش مشخصات پژوهشگر وارد کنید.';
    for(const p of PARTS){
      const row=review(selected).parts[p.key];
      if(!row.decision)return 'پرسش «'+p.name+'» هنوز رأی ندارد.';
      if(!partValid(row))return 'استدلال پرسش «'+p.name+'» ناقص است (حداقل ۱۲ نویسه).';
    }
    const item=review(selected);
    if(!item.decision)return 'یک رأی نهایی انتخاب کنید.';
    if(item.reason.trim().length<12)return 'استدلال نهایی را با حداقل ۱۲ نویسه تکمیل کنید.';
    return '';
  }
  function exportPayload(){
    return {review_schema:SCHEMA,source_sha:data.source_sha,book_commit:data.book_commit,
      review_target:'STEP1_CORRECTED_CANDIDATE',previous_c4_reviews_migrated:!!draft.migrated_from_c4,
      audit_stage:'step1',audit_file:'research/step1/FINDINGS.json',audit_reviewer:audit.reviewer,
      audit_date:audit.date,audit_base_commit:audit.repo_commit,
      verification_discrepancy:{record_hash_false_count:verificationRows.filter(x=>x.recordHashMatches===false).length,print_witness_checked:false},
      exported_at:now(),created_at:draft.created_at,reviewer:draft.reviewer,edition_note:draft.edition_note,
      reviewer_role:'PRIMARY_RESEARCHER_SELF_REVIEW_NOT_INDEPENDENT',
      research_qualification_effect:'NONE',historical_admissions:0,
      source_dataset_status:data.status,
      cases:data.rules.map(rule=>{
        const r=review(rule.id);
        return {rule_key:rule.id,title:rule.title,grade_proposal:rule.grade,
          outcome:r.decision,reason:r.reason,complete:completion(rule.id).complete,
          verdict_target:'HUMAN_VERDICT_ON_CODEX_CORRECTED_PROPOSAL',
          previous_c4_draft:draft.legacy_reviews?.[rule.id]||null,
          machine_step1:(()=>{const a=audited(rule.id);return a?{reviewer:audit.reviewer,verdict:a.verdict,
            claim:a.claim,corrected:a.corrected,reason:a.reason,
            parts:Object.fromEntries(PARTS.map(p=>[p.key,{decision:a.parts[p.key].decision,
              reason:a.parts[p.key].reason,refs:a.parts[p.key].refs}]))}:null;})(),
          parts:Object.fromEntries(PARTS.map(part=>[part.key,{
            outcome:r.parts[part.key].decision,reason:r.parts[part.key].reason,
            research_status:rule.components[part.key].status,
            canonical_source_refs:rule.components[part.key].canonicalBackings,
            adverse_refs:rule.components[part.key].adverseRefs
          }])),updated_at:r.updated_at,submitted_at:r.submitted_at};
      })
    };
  }
  function reportMarkdown(payload){
    let lines=['# صورت‌جلسه داوری پژوهشگر اصلی — فقه میوز','',
      '**داور:** '+(payload.reviewer||'هنوز درج نشده'), '**چاپ بررسی‌شده:** '+(payload.edition_note||'نامشخص'),
      '**تاریخ:** '+payload.exported_at,'**مبنای داده:** '+payload.source_sha,
      '**وضعیت:** خودداوری علمی؛ بدون مجوز خودکار برای موتور تاریخی',
      '**مبنای ممیزی:** '+(payload.audit_file||'نامشخص')+' (Codex، نه داور انسانی)',
      '**موضوع رأی انسان:** صورت‌بندی اصلاحیِ پیشنهادی Codex',
      '**اختلاف هش رکورد:** '+(payload.verification_discrepancy?.record_hash_false_count||0)+' مقدار false (حل‌نشده)', ''];
    for(const item of payload.cases){
      lines.push('## '+item.title,'','شناسه: '+item.rule_key,'',
        '**پیشنهاد Codex:** '+(item.machine_step1?.verdict||'فاقد گزارش'),'','**صورت اصلاح‌شده Codex:** '+(item.machine_step1?.corrected||'فاقد گزارش'),'',
        '**رأی کلی:** '+voteName(item.outcome),'','**دلیل:** '+(item.reason||'درج نشده'),'');
      for(const p of PARTS){
        const row=item.parts[p.key];
        lines.push('### '+p.name,'','- ارزیابی Codex: '+(item.machine_step1?.parts?.[p.key]?machineState(item.machine_step1.parts[p.key].decision):'نامشخص'),
          '- رأی انسانی: '+voteName(row.outcome),
          '- دلیل: '+(row.reason||'درج نشده'),'- شاهد: '+(row.canonical_source_refs.join('، ')||'ثبت نشده'),
          '- مخالف: '+(row.adverse_refs.join('، ')||'ثبت نشده'),'');
      }
    }
    return lines.join('\n');
  }
  function download(name,body,type){
    const blob=new Blob([body],{type});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function downloadJson(){
    download('FeqhMuse-Review-'+now().slice(0,10)+'.json',JSON.stringify(exportPayload(),null,2),'application/json;charset=utf-8');
    showToast('فایل JSON دریافت شد؛ آن را در گفت‌وگو پیوست کنید.');
  }
  function downloadMd(){
    download('FeqhMuse-Review-'+now().slice(0,10)+'.md',reportMarkdown(exportPayload()),'text/markdown;charset=utf-8');
    showToast('گزارش خوانای Markdown دریافت شد.');
  }
  function importReview(input){
    if(!input||input.review_schema!==SCHEMA||input.source_sha!==data.source_sha||!Array.isArray(input.cases)||input.cases.length!==10)
      throw Error('این فایل با نسخه پژوهشی فعلی سازگار نیست.');
    const set=new Set(input.cases.map(x=>x.rule_key));
    if(set.size!==10||data.rules.some(r=>!set.has(r.id)))throw Error('فهرست شناسه‌های قواعد با نسخه سایت تفاوت دارد.');
    draft=fresh();
    draft.reviewer=String(input.reviewer||'').slice(0,160);
    draft.edition_note=String(input.edition_note||'').slice(0,350);
    const legacyInput=input.review_target!=='STEP1_CORRECTED_CANDIDATE'||
      input.cases.some(row=>row.verdict_target!=='HUMAN_VERDICT_ON_CODEX_CORRECTED_PROPOSAL');
    draft.migrated_from_c4=legacyInput||!!input.previous_c4_reviews_migrated;
    for(const row of input.cases){
      const previous={decision:validVote(row.outcome),reason:String(row.reason||'').slice(0,20000),parts:{},
        updated_at:row.updated_at||null,submitted_at:row.submitted_at||null};
      for(const p of PARTS){
        const x=row.parts?.[p.key]||{};
        previous.parts[p.key]={decision:validVote(x.outcome),reason:String(x.reason||'').slice(0,20000)};
      }
      if(legacyInput){
        draft.legacy_reviews[row.rule_key]=previous;
        continue;
      }
      if(row.previous_c4_draft)draft.legacy_reviews[row.rule_key]=row.previous_c4_draft;
      const r=review(row.rule_key);
      r.decision=previous.decision;r.reason=previous.reason;
      r.parts=previous.parts;r.updated_at=previous.updated_at;r.submitted_at=previous.submitted_at;
    }
    save();$('reviewer-name').value=draft.reviewer;$('edition-note').value=draft.edition_note;list();render();
  }
  function bind(){
    document.addEventListener('click',async ev=>{
      const act=ev.target.closest('[data-action]');
      if(act){
        const a=act.dataset.action;
        if(a==='rule'){moveTo(act.dataset.id);return;}
        if(a==='next-rule'){const index=REVIEW_ORDER.indexOf(selected);moveTo(REVIEW_ORDER[(index+1)%REVIEW_ORDER.length]);return;}
        if(a==='stage'){stage=act.dataset.stage;render();$('rule-view').scrollIntoView({behavior:'smooth',block:'start'});return;}
        if(a==='start-review'){stage='review';partIndex=0;render();$('rule-view').scrollIntoView({behavior:'smooth'});return;}
        if(a==='open-record'){await openRecord(act.dataset.ref);return;}
        if(a==='all-sources'){showAll=true;render();return;}
        if(a==='less-sources'){showAll=false;render();return;}
        if(a==='part'){stage='review';partIndex=Number(act.dataset.index);render();$('rule-view').scrollIntoView({behavior:'smooth'});return;}
        if(a==='part-vote'){setVote('part',act.dataset.vote);return;}
        if(a==='final-vote'){setVote('final',act.dataset.vote);return;}
        if(a==='previous-part'){if(partIndex>0){partIndex--;render();$('rule-view').scrollIntoView({behavior:'smooth'});}return;}
        if(a==='next-part'){
          const msg=partProblem();
          if(msg){$('part-validation').textContent=msg;showToast(msg);return;}
          if(partIndex<5){partIndex++;render();$('rule-view').scrollIntoView({behavior:'smooth'});}
          else{stage='final';render();$('rule-view').scrollIntoView({behavior:'smooth'});}
          return;
        }
        if(a==='submit'){
          const msg=finalProblem();
          if(msg){$('final-validation').textContent=msg;showToast(msg);return;}
          review(selected).submitted_at=now();review(selected).updated_at=now();save();list();render();showToast('رأی شما با دلیل ثبت شد. اکنون می‌توانید سراغ قاعده بعدی بروید.');return;
        }
        if(a==='copy-source'){
          const s=sourceById(act.dataset.source);
          if(s)try{await navigator.clipboard.writeText(s.id+'\n'+s.quote+'\nکتاب: '+bookName(s.book)+' | رکورد: '+s.record+' | صفحه دیتابیس: '+s.page);showToast('نقل و ارجاع کپی شد.');}
          catch(_){showToast('کپی خودکار ممکن نشد؛ متن را انتخاب و کپی کنید.');}
          return;
        }
        if(a==='import'){$('import-input').click();return;}
        if(a==='reset'){
          if(window.confirm('تمام یادداشت‌های داوری در این مرورگر پاک شوند؟ پیش از آن از فایل JSON پشتیبان بگیرید.')){
            localStorage.removeItem(STORAGE);draft=fresh();$('reviewer-name').value='';$('edition-note').value='';list();render();showToast('یادداشت‌های محلی پاک شدند.');
          }return;
        }
      }
      if(ev.target.closest('#mobile-menu')){$('sidebar').classList.add('open');return;}
      if(ev.target.closest('#close-sidebar')){$('sidebar').classList.remove('open');return;}
      if(ev.target.closest('#theme-toggle')){
        const dark=document.documentElement.classList.toggle('dark');localStorage.setItem('feqh-review-theme',dark?'dark':'light');return;
      }
      if(ev.target.closest('#export-header')){
        $('export-summary').textContent='تعداد پرونده‌های تکمیل‌شده: '+data.rules.filter(r=>completion(r.id).complete).length+' از ۱۰. خروجی شامل ناتمام‌ها نیز هست.';
        $('export-dialog').showModal();return;
      }
      if(ev.target.closest('#close-dialog')){$('export-dialog').close();return;}
      if(ev.target.closest('#close-record-dialog')){$('record-dialog').close();return;}
      if(ev.target.closest('#download-json')){downloadJson();return;}
      if(ev.target.closest('#download-md')){downloadMd();return;}
      if(ev.target.closest('#copy-json')){
        try{await navigator.clipboard.writeText(JSON.stringify(exportPayload(),null,2));showToast('گزارش در حافظه موقت کپی شد.');}
        catch(_){showToast('کپی خودکار ممکن نیست؛ فایل JSON را دریافت کنید.');}return;
      }
      if(ev.target.closest('#share-review')){
        const file=new File([JSON.stringify(exportPayload(),null,2)],'FeqhMuse-Review.json',{type:'application/json'});
        if(navigator.share&&navigator.canShare?.({files:[file]}))try{await navigator.share({files:[file],title:'نظر داور فقه میوز'});return;}catch(e){if(e.name==='AbortError')return;}
        downloadJson();return;
      }
      if(ev.target.classList.contains('filter')){
        filter=ev.target.dataset.filter;
        document.querySelectorAll('.filter').forEach(el=>el.classList.toggle('active',el===ev.target));
        list();return;
      }
      if(ev.target===$('export-dialog'))$('export-dialog').close();
      if(ev.target===$('record-dialog'))$('record-dialog').close();
    });
    document.addEventListener('input',ev=>{
      const el=ev.target;
      if(el.id==='search-rule'){search=el.value.trim();list();return;}
      if(el.id==='reviewer-name'){draft.reviewer=el.value;save();list();return;}
      if(el.id==='edition-note'){draft.edition_note=el.value;save();return;}
      if(el.dataset.input==='part-reason'){const r=review(selected);r.parts[PARTS[partIndex].key].reason=el.value;r.submitted_at=null;r.updated_at=now();save();list();return;}
      if(el.dataset.input==='final-reason'){const r=review(selected);r.reason=el.value;r.submitted_at=null;r.updated_at=now();save();list();return;}
    });
    $('import-input').addEventListener('change',async ev=>{
      const file=ev.target.files?.[0];ev.target.value='';if(!file)return;
      if(file.size>2_000_000){showToast('فایل JSON بیش از حد مجاز بزرگ است.');return;}
      try{importReview(JSON.parse(await file.text()));showToast('پرونده‌های شما از فایل پشتیبان بازیابی شدند.');}
      catch(e){showToast('بازیابی ناموفق: '+e.message);}
    });
  }
  async function init(){
    bind();
    if(localStorage.getItem('feqh-review-theme')==='dark')document.documentElement.classList.add('dark');
    try{
      const paths=['./data/review-data.json','./research/step1/FINDINGS.json',
        './research/step1/VERIFICATION.json','./research/step1/VERIFICATION_SUMMARY.json'];
      const responses=await Promise.all(paths.map(path=>fetch(path,{cache:'no-store'})));
      for(let i=0;i<responses.length;i++)if(!responses[i].ok)
        throw Error('فایل پژوهشی بارگذاری نشد: '+paths[i]+' (HTTP '+responses[i].status+')');
      const loaded=await Promise.all(responses.map(response=>response.json()));
      [data,audit,verificationRows,verificationSummary]=loaded;
      if(data.schema_version!=='feqh-scholar-review-portal-v1'||data.rules.length!==10||
        data.sources.length!==34||REVIEW_ORDER.some(id=>!ruleById(id)))
        throw Error('ساختار بسته پژوهشی C4 معتبر نیست.');
      if(audit.source_sha!==data.source_sha||!Array.isArray(audit.rules)||audit.rules.length!==10||
        verificationRows.length!==34||verificationSummary.source_span_count!==34||
        verificationSummary.repo_commit!==audit.repo_commit)
        throw Error('مبنای C4 با گزارش Step 1 یکسان نیست؛ بارگذاری این ترکیب متوقف شد.');
      for(const id of REVIEW_ORDER){
        const rule=audited(id);
        if(!rule||!rule.corrected||PARTS.some(p=>!rule.parts?.[p.key]||
          !validVote(rule.parts[p.key].decision)||!Array.isArray(rule.parts[p.key].refs)))
          throw Error('ممیزی شش‌گانه Step 1 برای '+id+' ناقص است.');
      }
      data.rules.sort((a,b)=>REVIEW_ORDER.indexOf(a.id)-REVIEW_ORDER.indexOf(b.id));
      loadDraft();selected=REVIEW_ORDER.find(id=>!completion(id).complete)||REVIEW_ORDER[0];
      $('reviewer-name').value=draft.reviewer;$('edition-note').value=draft.edition_note;
      list();render();
    }catch(e){$('rule-view').innerHTML='<div class="card"><h3>بارگذاری بسته پژوهشی ناموفق بود</h3><p class="muted">'+safe(e.message)+'</p><p>سایت باید از طریق HTTPS / GitHub Pages یا یک سرور HTTP اجرا شود، نه از مسیر file://.</p></div>';}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
