import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {fileURLToPath} from 'node:url';

const port=await new Promise((resolve,reject)=>{
  const srv=createServer();
  srv.once('error',reject);
  srv.listen(0,'127.0.0.1',()=>{const n=srv.address().port;srv.close(()=>resolve(n));});
});
const root=new URL('../',import.meta.url);
const pass='LocalIntegrationTestPassword-42-NotForProduction';
const proc=spawn(process.execPath,['server.mjs'],{
  cwd:fileURLToPath(root),
  env:{
    ...process.env,
    PORT:String(port),
    FEQH_HOST:'127.0.0.1',
    FEQH_AUTH_USERNAME:'researcher',
    FEQH_AUTH_PASSWORD:pass,
    FEQH_ALLOW_HTTP_DEV:'1',
    FEQH_TRUST_PROXY:'0'
  },stdio:['ignore','pipe','pipe']
});
let stderr='';
proc.stderr.on('data',part=>{stderr+=part.toString();});
const origin='http://127.0.0.1:'+port;
async function http(path,init={}){
  return fetch(origin+path,{redirect:'manual',...init});
}
async function waitForServer(){
  for(let i=0;i<100;i++){
    if(proc.exitCode!==null)throw new Error('Server failed: '+stderr);
    try{const r=await http('/healthz');if(r.ok)return;}catch(_){}
    await new Promise(resolve=>setTimeout(resolve,60));
  }
  throw new Error('Server did not start: '+stderr);
}
const names=[];
async function check(name,fn){await fn();names.push(name);console.log('PASS',name);}
try{
  await waitForServer();
  await check('unauthenticated index redirects to login',async()=>{
    const r=await http('/');
    assert.equal(r.status,303);
    assert.equal(r.headers.get('location'),'/login');
  });
  await check('login form is available and password field is secret',async()=>{
    const r=await http('/login');
    assert.equal(r.status,200);
    const body=await r.text();
    assert.ok(body.includes('type="password"'));
    assert.ok(!body.includes(pass));
  });
  await check('confidential JSON cannot be downloaded before login',async()=>{
    const r=await http('/data/review-data.json');
    assert.equal(r.status,401);
    assert.ok(!(await r.text()).includes('CANONICAL'));
  });
  await check('all app assets require session',async()=>{
    for(const asset of ['/app.js','/styles.css','/index.html']){
      const r=await http(asset);
      assert.ok([401,303].includes(r.status),asset+' was unprotected');
    }
  });
  await check('invalid login is rejected',async()=>{
    const r=await http('/login',{method:'POST',body:new URLSearchParams({username:'researcher',password:'wrong'}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    assert.equal(r.status,401);
    assert.ok(!(await r.text()).includes(pass));
  });
  await check('cross-site login request is rejected',async()=>{
    const r=await http('/login',{method:'POST',body:new URLSearchParams({username:'researcher',password:pass}),headers:{Origin:'https://evil.example','Content-Type':'application/x-www-form-urlencoded'}});
    assert.equal(r.status,403);
  });
  let cookie;
  await check('valid credentials set HttpOnly SameSite session',async()=>{
    const r=await http('/login',{method:'POST',body:new URLSearchParams({username:'researcher',password:pass}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    assert.equal(r.status,303);
    assert.equal(r.headers.get('location'),'/');
    const set=r.headers.get('set-cookie');
    assert.ok(set?.includes('HttpOnly'));
    assert.ok(set?.includes('SameSite=Strict'));
    cookie=set.split(';',1)[0];
  });
  await check('authenticated session may view original C4 research',async()=>{
    const r=await http('/data/review-data.json',{headers:{Cookie:cookie}});
    assert.equal(r.status,200);
    assert.equal(r.headers.get('cache-control'),'no-store, private, max-age=0');
    const d=await r.json();
    assert.equal(d.rules.length,10);
    assert.equal(d.sources.length,34);
  });
  await check('invalid session and directory traversal requests are denied',async()=>{
    const forged='feqh_session_dev='+'x'.repeat(43);
    const r=await http('/data/review-data.json',{headers:{Cookie:forged}});
    assert.equal(r.status,401);
    const notFound=await http('/.env.example',{headers:{Cookie:cookie}});
    assert.equal(notFound.status,404);
    const noServer=await http('/server.mjs',{headers:{Cookie:cookie}});
    assert.equal(noServer.status,404);
  });
  await check('logout invalidates server-side session',async()=>{
    const r=await http('/logout',{method:'POST',headers:{Cookie:cookie}});
    assert.equal(r.status,303);
    assert.ok(r.headers.get('set-cookie').includes('Max-Age=0'));
    const denied=await http('/data/review-data.json',{headers:{Cookie:cookie}});
    assert.equal(denied.status,401);
  });
  await check('login brute-force limiter blocks repeat guesses',async()=>{
    let r;
    for(let i=0;i<8;i++){
      r=await http('/login',{method:'POST',body:new URLSearchParams({username:'researcher',password:'wrong-'+i}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    }
    assert.equal(r.status,401);
    const denied=await http('/login',{method:'POST',body:new URLSearchParams({username:'researcher',password:pass}),headers:{'Content-Type':'application/x-www-form-urlencoded'}});
    assert.equal(denied.status,429);
  });
  console.log('AUTH SECURITY TESTS: '+names.length+'/'+names.length+' PASS');
} finally {
  proc.kill('SIGTERM');
}
