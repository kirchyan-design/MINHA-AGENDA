/* JC ORGANIZA - service worker
   Para lançar uma atualização: altere VERSION abaixo (ex.: 1.0.1) e publique os arquivos de novo. */
const VERSION='2.8.7';
const CACHE='jc-organiza-'+VERSION;
const OCR_CACHE='jc-ocr-1'; /* leitor de texto offline (pasta ocr/): cache próprio, não é apagado a cada versão */
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE.map(u=>new Request(u,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('meu-plano-')||k.startsWith('jc-organiza-'))&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{
 if(e.data==='SKIP_WAITING')self.skipWaiting();
 if(e.data==='VERSION'&&e.ports&&e.ports[0])e.ports[0].postMessage(VERSION)});
self.addEventListener('fetch',e=>{
 const r=e.request;if(r.method!=='GET')return;
 const u=new URL(r.url),mine=u.origin===location.origin;
 /* leitor de texto baixado do CDN (quando a pasta ocr/ não existe): serve do cache guardado no aparelho; sem cache, segue pela rede */
 const ocrCdn=!mine&&u.hostname==='cdn.jsdelivr.net'&&/\/npm\/(tesseract\.js(-core)?@|@tesseract\.js-data\/)/.test(u.pathname);
 if(ocrCdn){e.respondWith(caches.open(OCR_CACHE).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||fetch(r))));return}
 if(!mine&&u.hostname!=='fonts.googleapis.com'&&u.hostname!=='fonts.gstatic.com')return;
 if(mine&&/\/ocr\//.test(u.pathname)){
  e.respondWith(caches.open(OCR_CACHE).then(c=>c.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res}))));return}
 e.respondWith(fetch(r,mine?{cache:'no-cache'}:undefined).then(res=>{
  if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}
  return res}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||(r.mode==='navigate'?caches.match('index.html'):Response.error()))))});
