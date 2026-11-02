/* JC ORGANIZA - service worker
   Para lançar uma atualização: altere VERSION abaixo (ex.: 1.0.1) e publique os arquivos de novo. */
const VERSION='2.1.0';
const CACHE='jc-organiza-'+VERSION;
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('meu-plano-')||k.startsWith('jc-organiza-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{
 if(e.data==='SKIP_WAITING')self.skipWaiting();
 if(e.data==='VERSION'&&e.ports&&e.ports[0])e.ports[0].postMessage(VERSION)});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url),mine=u.origin===location.origin;
 if(!mine&&u.hostname!=='fonts.googleapis.com'&&u.hostname!=='fonts.gstatic.com')return;
 e.respondWith(fetch(r,mine?{cache:'no-cache'}:undefined).then(res=>{
  if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
  return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
