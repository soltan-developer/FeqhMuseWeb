#!/usr/bin/env node
/**
 * FeqhMuseWeb authenticated origin.
 *
 * IMPORTANT: this is NOT a GitHub Pages feature. Deploy behind HTTPS using
 * Coolify/another reverse proxy, after making repository and history private.
 * It never serves the research corpus or app assets without a valid session.
 *
 * No external dependencies; password exists only in server environment.
 */
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = process.env.FEQH_HOST || '127.0.0.1';
const port = Number(process.env.PORT || 3000);
const username = process.env.FEQH_AUTH_USERNAME || 'scholar';
const password = process.env.FEQH_AUTH_PASSWORD || '';
const trustProxy = process.env.FEQH_TRUST_PROXY === '1';
const allowHttpDev = process.env.FEQH_ALLOW_HTTP_DEV === '1';
const sessionDurationMs = 8 * 60 * 60 * 1000;
const blockDurationMs = 15 * 60 * 1000;
const maxFailed = 8;
const sessions = new Map();
const failures = new Map();
const assets = new Map([
  ['/', {file:'index.html', type:'text/html; charset=utf-8'}],
  ['/index.html', {file:'index.html', type:'text/html; charset=utf-8'}],
  ['/app.js', {file:'app.js', type:'text/javascript; charset=utf-8'}],
  ['/styles.css', {file:'styles.css', type:'text/css; charset=utf-8'}],
  ['/data/review-data.json', {file:'data/review-data.json', type:'application/json; charset=utf-8'}],
]);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw Error('PORT must be 1..65535');
if (password.length < 16 || Buffer.byteLength(password,'utf8') > 1024)
  throw Error('FEQH_AUTH_PASSWORD is required and must contain 16..1024 UTF-8 bytes');
if (!username || username.length > 96) throw Error('Invalid FEQH_AUTH_USERNAME');
if (allowHttpDev && !['127.0.0.1','::1','localhost'].includes(host))
  throw Error('FEQH_ALLOW_HTTP_DEV=1 is only permitted on loopback. Disable it in production.');

const pwdSalt = crypto.randomBytes(32);
const pwdHash = crypto.scryptSync(password,pwdSalt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
function safeEqual(a,b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left,right);
}
function validCredentials(user, pass) {
  if (typeof user !== 'string' || typeof pass !== 'string' || pass.length > 1024) return false;
  const candidate = crypto.scryptSync(pass,pwdSalt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});
  return safeEqual(user,username) && crypto.timingSafeEqual(candidate,pwdHash);
}
function secureRequest(req) {
  return !!req.socket.encrypted ||
    (trustProxy && req.headers['x-forwarded-proto'] === 'https') ||
    allowHttpDev;
}
function cookieName() {
  return allowHttpDev ? 'feqh_session_dev' : '__Host-feqh_session';
}
function send(req,res,status,body,contentType='text/html; charset=utf-8',headers={}) {
  const csp="default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'";
  const secure = !allowHttpDev;
  const all={
    'Content-Type':contentType,
    'Content-Security-Policy':csp,
    'X-Content-Type-Options':'nosniff',
    'Referrer-Policy':'no-referrer',
    'X-Frame-Options':'DENY',
    'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
    'Cache-Control':'no-store, private, max-age=0',
    'Pragma':'no-cache',
    ...(secure?{'Strict-Transport-Security':'max-age=31536000; includeSubDomains'}:{}),
    ...headers
  };
  res.writeHead(status,all);
  if (req.method !== 'HEAD') res.end(body);
  else res.end();
}
function redirect(req,res,to,headers={}) { send(req,res,303,'', 'text/plain; charset=utf-8',{'Location':to,...headers}); }
function cookies(req) {
  const raw = req.headers.cookie || '';
  const all={};
  for (const fragment of raw.split(';')) {
    const i=fragment.indexOf('=');
    if (i<0) continue;
    all[fragment.slice(0,i).trim()] = fragment.slice(i+1).trim();
  }
  return all;
}
function digestToken(token) {return crypto.createHash('sha256').update(token).digest('hex');}
function sessionFor(req) {
  const token=cookies(req)[cookieName()];
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))return null;
  const digest=digestToken(token);
  const exp=sessions.get(digest);
  if (!exp)return null;
  if(exp < Date.now()){sessions.delete(digest);return null;}
  return {digest,exp};
}
function loginPage(error=false) {
  const note=error?'<p role="alert" class="error">نام کاربری یا گذرواژه درست نیست.</p>':'';
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ورود امن | میز داوری اجتهاد</title>'
    +'<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0a1524;color:#e9f4ef;font:15px/2 Tahoma,sans-serif;padding:18px;box-sizing:border-box}'
    +'.box{width:min(430px,100%);border:1px solid #304559;background:#122439;border-radius:22px;padding:30px;box-sizing:border-box;box-shadow:0 25px 90px #0005}'
    +'.label{color:#98b4aa;font-size:12px}h1{font-size:25px;margin:5px 0 3px}p{color:#b9c9ca;font-size:13px}'
    +'label{display:block;margin:14px 0 5px}input{background:#0b1928;color:#fff;border:1px solid #40586b;border-radius:10px;padding:13px 12px;box-sizing:border-box;width:100%;font-size:15px}'
    +'button{border:0;background:#b3e8bd;color:#112031;padding:13px;border-radius:11px;width:100%;font-weight:bold;font-size:15px;cursor:pointer;margin-top:21px}'
    +'.hint{font-size:11px;color:#91aba7;margin-bottom:0}.error{color:#ffb4ac}</style></head><body><main class="box"><div class="label">Feqh Muse · Private Workspace</div>'
    +'<h1>ورود به میز داوری اجتهاد</h1><p>دسترسی به پرونده‌های پژوهشی فقط پس از احراز هویت امکان‌پذیر است.</p>'+note
    +'<form method="post" action="/login" autocomplete="off"><label for="username">نام کاربری</label><input required id="username" name="username" autocomplete="username" maxlength="96">'
    +'<label for="password">گذرواژه</label><input required id="password" name="password" type="password" autocomplete="current-password" maxlength="1024">'
    +'<button type="submit">ورود به محیط داوری</button></form><p class="hint">برای امنیت، ورود باید از نشانی HTTPS انجام شود.</p></main></body></html>';
}
function requestOriginMatches(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients can still attempt login; password is the authenticator
  try {
    const expectedHost = req.headers['x-forwarded-host'] && trustProxy
      ? req.headers['x-forwarded-host'].split(',')[0].trim()
      : req.headers.host;
    return new URL(origin).host.toLowerCase() === String(expectedHost).toLowerCase();
  } catch (_) {return false;}
}
function readForm(req) {
  return new Promise((resolve,reject)=>{
    let size=0, pieces=[];
    req.on('data',part=>{
      size+=part.length;
      if(size>8192){reject(new Error('TOO_LARGE'));req.destroy();return;}
      pieces.push(part);
    });
    req.on('end',()=>{
      try{resolve(new URLSearchParams(Buffer.concat(pieces).toString('utf8')));}
      catch(error){reject(error);}
    });
    req.on('error',reject);
  });
}
function limited(ip) {
  const old=failures.get(ip);
  if (!old || Date.now()>old.until){failures.delete(ip);return false;}
  return old.count>=maxFailed;
}
function noteFailure(ip) {
  const old=failures.get(ip);
  if (!old || Date.now()>old.until)failures.set(ip,{count:1,until:Date.now()+blockDurationMs});
  else old.count++;
}
function createSession() {
  const token=crypto.randomBytes(32).toString('base64url');
  const exp=Date.now()+sessionDurationMs;
  for(const [k,v] of sessions) if(v<Date.now())sessions.delete(k);
  sessions.set(digestToken(token),exp);
  return token;
}
function authCookie(token) {
  return cookieName()+'='+token+'; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800'+(allowHttpDev?'':'; Secure');
}
function clearCookie() {return cookieName()+'=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'+(allowHttpDev?'':'; Secure');}
const server=http.createServer(async(req,res)=>{
  const pathname=(()=>{try{return new URL(req.url,'http://localhost').pathname;}catch(_){return null;}})();
  if(!pathname || !['GET','HEAD','POST'].includes(req.method)){
    return send(req,res,400,'Bad request','text/plain; charset=utf-8');
  }
  if(pathname==='/healthz' && req.method==='GET')
    return send(req,res,200,'ok','text/plain; charset=utf-8');
  if(!secureRequest(req))return send(req,res,403,'HTTPS required','text/plain; charset=utf-8');
  if(pathname==='/login' && req.method==='GET') {
    if(sessionFor(req))return redirect(req,res,'/');
    return send(req,res,200,loginPage(false));
  }
  if(pathname==='/login' && req.method==='POST') {
    if(!requestOriginMatches(req))return send(req,res,403,'Forbidden','text/plain; charset=utf-8');
    const ip=req.socket.remoteAddress||'unknown';
    if(limited(ip))return send(req,res,429,'Too many failed attempts. Try later.','text/plain; charset=utf-8',{'Retry-After':'900'});
    let form;
    try{form=await readForm(req);}catch(_){if(!res.headersSent)send(req,res,413,'Invalid form','text/plain; charset=utf-8');return;}
    if (!validCredentials(form.get('username'),form.get('password'))) {
      noteFailure(ip);
      return send(req,res,401,loginPage(true));
    }
    failures.delete(ip);
    return redirect(req,res,'/',{'Set-Cookie':authCookie(createSession())});
  }
  if(pathname==='/logout' && req.method==='POST') {
    if(!requestOriginMatches(req))return send(req,res,403,'Forbidden','text/plain; charset=utf-8');
    const session=sessionFor(req);
    if(session)sessions.delete(session.digest);
    return redirect(req,res,'/login',{'Set-Cookie':clearCookie()});
  }
  if (req.method!=='GET' && req.method!=='HEAD')
    return send(req,res,405,'Method not allowed','text/plain; charset=utf-8');
  const asset=assets.get(pathname);
  if(!asset)return send(req,res,404,'Not found','text/plain; charset=utf-8');
  if(!sessionFor(req)){
    if(pathname==='/'||pathname==='/index.html')return redirect(req,res,'/login');
    return send(req,res,401,'Authentication required','text/plain; charset=utf-8');
  }
  try {
    const data=await fs.readFile(path.join(root,asset.file));
    return send(req,res,200,data,asset.type);
  }catch(error){
    return send(req,res,error?.code==='ENOENT'?503:500,
      'Protected resource unavailable','text/plain; charset=utf-8');
  }
});
server.listen(port,host,()=>console.log('FeqhMuseWeb private origin listening on '+host+':'+port));
