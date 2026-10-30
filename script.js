const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const HOJE=iso(new Date());
const fmt=(s,o)=>new Date(s+'T12:00').toLocaleDateString('pt-BR',o||{weekday:'short',day:'numeric',month:'short'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let S={ev:[],notes:[],diary:{},shop:[],prods:{},hist:[],market:'',user:{name:''},theme:'auto'};
try{const r=localStorage.getItem('minha-agenda');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
S.shop.forEach(x=>{x.price=x.price||0;x.qty=x.qty||1});
let LOGOS={};try{const r=localStorage.getItem('minha-agenda-logos');if(r)LOGOS=JSON.parse(r)||{}}catch(e){}
let FOTOS={},dimgs=[],dimgsFor=null;try{const r=localStorage.getItem('minha-agenda-fotos');if(r)FOTOS=JSON.parse(r)||{}}catch(e){}
const saveFotos=()=>{try{localStorage.setItem('minha-agenda-fotos',JSON.stringify(FOTOS));return true}catch(e){return false}};
function gcFotos(){const used=new Set();Object.values(S.diary).forEach(d=>(d.imgs||[]).forEach(i=>used.add(i)));let ch=false;Object.keys(FOTOS).forEach(k=>{if(!used.has(k)){delete FOTOS[k];ch=true}});if(ch)saveFotos()}
const save=()=>{let ok=true;try{localStorage.setItem('minha-agenda',JSON.stringify(S))}catch(e){ok=false}gcFotos();return ok};
let tab='inicio',sel=HOJE,mes=new Date(),mood='',dsel=HOJE;
const TABS=[['inicio','🏠','Início'],['agenda','📋','Agenda'],['cal','📅','Calendário'],['notas','📝','Notas'],['diario','📖','Diário'],['compras','🛒','Compras']];


function nav(){$('#nav').innerHTML=TABS.map(t=>`<button class="${tab===t[0]?'on':''}" onclick="go('${t[0]}')"><b>${t[1]}</b>${t[2]}</button>`).join('')}
function go(t){tab=t;dimgsFor=null;edName=false;nav();render();window.scrollTo(0,0)}

/* ---------- Agenda ---------- */
function evItem(e){if(e.id===edEv)return evEdit(e);return `<div class="item ${e.done?'done':''}"><input type="checkbox" ${e.done?'checked':''} onchange="togEv('${e.id}')" aria-label="Concluir"><span class="hora">${e.time||'—'}</span><span class="t">${esc(e.title)}</span><button class="ghost" onclick="edEv='${e.id}';render()" aria-label="Editar">✎</button><button class="ghost" onclick="delEv('${e.id}')" aria-label="Excluir">✕</button></div>`}
function addEv(dateId,titleId,timeId){const t=$('#'+titleId).value.trim();if(!t){$('#'+titleId).focus();return}
 S.ev.push({id:uid(),title:t,date:dateId?$('#'+dateId).value:sel,time:$('#'+timeId).value,done:false});save();render()}
function togEv(id){const e=S.ev.find(x=>x.id===id);e.done=!e.done;save();render()}
function delEv(id){S.ev=S.ev.filter(x=>x.id!==id);save();render()}
const sortEv=a=>a.sort((x,y)=>(x.date+(x.time||'99')).localeCompare(y.date+(y.time||'99')));
function vAgenda(){
 const fut=sortEv(S.ev.filter(e=>e.date>=HOJE)),pas=sortEv(S.ev.filter(e=>e.date<HOJE)).reverse().slice(0,5);
 const grp=l=>{const g={};l.forEach(e=>(g[e.date]=g[e.date]||[]).push(e));return Object.keys(g).map(d=>`<h3>${d===HOJE?'Hoje':fmt(d)}</h3><div class="card">${g[d].map(evItem).join('')}</div>`).join('')};
 return `<h2>Agenda</h2><div class="card"><input id="at" placeholder="Novo compromisso" onkeydown="if(event.key==='Enter')addEv('ad','at','ah')"><div class="row" style="margin-top:8px"><input type="date" id="ad" value="${HOJE}"><input type="time" id="ah"><button onclick="addEv('ad','at','ah')">Adicionar</button></div></div>`
 +(fut.length?grp(fut):'<div class="vazio">Nenhum compromisso à frente. Adicione o primeiro acima.</div>')
 +(pas.length?'<h3>Anteriores</h3>'+`<div class="card">${pas.map(evItem).join('')}</div>`:'')}

/* ---------- Calendário ---------- */
function vCal(){
 const y=mes.getFullYear(),m=mes.getMonth(),ini=new Date(y,m,1),off=ini.getDay(),n=new Date(y,m+1,0).getDate();
 let h=['D','S','T','Q','Q','S','S'].map(d=>`<div class="dw">${d}</div>`).join('');
 for(let i=0;i<off+n;i++){
  if(i<off){h+='<div></div>';continue}
  const d=i-off+1,k=iso(new Date(y,m,d)),ev=S.ev.some(e=>e.date===k),di=!!S.diary[k];
  h+=`<button class="d ${k===HOJE?'hj':''} ${k===sel?'sel':''}" onclick="sel='${k}';render()">${d}<span class="dots">${ev?'<i></i>':''}${di?'<i></i>':''}</span></button>`}
 const evs=sortEv(S.ev.filter(e=>e.date===sel));
 return `<h2>Calendário</h2><div class="card"><div class="cal-h"><button class="sec" onclick="mes=new Date(${y},${m-1},1);render()" aria-label="Mês anterior">‹</button><strong>${mes.toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}</strong><button class="sec" onclick="mes=new Date(${y},${m+1},1);render()" aria-label="Próximo mês">›</button></div><div class="grid">${h}</div><p style="font-size:12px;color:var(--mute);margin:10px 0 0">Ponto azul: compromisso. Ponto vermelho: diário.</p></div>
 <h3 style="text-transform:capitalize">${fmt(sel,{weekday:'long',day:'numeric',month:'long'})}</h3>
 <div class="card">${evs.length?evs.map(evItem).join(''):'<div class="vazio" style="padding:10px">Nada marcado neste dia.</div>'}
 <div class="row" style="margin-top:10px"><input id="ct" placeholder="Novo compromisso" onkeydown="if(event.key==='Enter')addEv('','ct','ch')"><input type="time" id="ch" style="width:120px"><button onclick="addEv('','ct','ch')">＋</button></div>
 ${S.diary[sel]?`<button class="sec" style="margin-top:10px" onclick="dsel=sel;go('diario')">Ver diário deste dia ${S.diary[sel].mood||''}</button>`:''}</div>`}

/* ---------- Notas ---------- */
function vNotas(){
 const l=[...S.notes].sort((a,b)=>b.at-a.at);
 return `<h2>Notas</h2><button onclick="S.notes.push({id:uid(),title:'',text:'',at:Date.now()});save();render();setTimeout(()=>{const i=document.querySelector('.nota input');i&&i.focus()},0)" style="margin-bottom:12px">Nova nota</button>`
 +(l.length?l.map(n=>`<div class="card nota"><input value="${esc(n.title)}" placeholder="Título" oninput="upNote('${n.id}','title',this.value)"><textarea placeholder="Escreva aqui…" oninput="upNote('${n.id}','text',this.value)">${esc(n.text)}</textarea><div class="row" style="justify-content:space-between"><small>${new Date(n.at).toLocaleDateString('pt-BR')}</small><button class="ghost" onclick="ask('Excluir esta nota?',()=>{S.notes=S.notes.filter(x=>x.id!=='${n.id}');save();render()})">Excluir</button></div></div>`).join(''):'<div class="vazio">Nenhuma nota ainda.</div>')}
function upNote(id,k,v){const n=S.notes.find(x=>x.id===id);n[k]=v;n.at=Date.now();save()}

/* ---------- Diário ---------- */
const MOODS=['😄','🙂','😐','😔','😡'];
function vDiario(){
 const cur=S.diary[dsel]||{title:'',text:'',mood:''};mood=cur.mood;if(dimgsFor!==dsel){dimgs=(cur.imgs||[]).filter(id=>FOTOS[id]).map(id=>({id,url:FOTOS[id]}));dimgsFor=dsel}
 const ks=Object.keys(S.diary).sort().reverse();
 return `<h2>Diário</h2><div class="card"><input type="date" value="${dsel}" onchange="dsel=this.value||HOJE;render()"><div class="humor" id="hm">${MOODS.map(m=>`<button class="${mood===m?'on':''}" onclick="mood=mood==='${m}'?'':'${m}';document.querySelectorAll('#hm button').forEach(b=>b.classList.toggle('on',b.textContent===mood))" aria-label="Humor ${m}">${m}</button>`).join('')}</div>
 <input id="dti" value="${esc(cur.title||'')}" placeholder="Título do dia" maxlength="80" aria-label="Título" style="font-weight:600;margin-bottom:8px"><textarea id="dt" style="min-height:160px" placeholder="Como foi o seu dia?">${esc(cur.text)}</textarea><div id="dimgs">${imgsHtml()}</div><div class="row" style="margin-top:8px"><button class="sec" onclick="$('#dfile').click()">📷 Adicionar foto</button><input type="file" id="dfile" accept="image/*" multiple hidden onchange="addFotos(this)"></div><p class="hint">Até 8 fotos por dia. Toque em Salvar para guardá-las junto com a entrada.</p>
 <div class="row" style="margin-top:8px"><button onclick="saveDi()">Salvar</button>${S.diary[dsel]?`<button class="ghost" onclick="ask('Excluir esta entrada?',()=>{delete S.diary['${dsel}'];dimgsFor=null;save();render()})">Excluir</button>`:''}</div></div>`
 +(ks.length?'<h3>Entradas</h3>'+ks.map(k=>`<div class="card ent" onclick="dsel='${k}';dimgsFor=null;render();window.scrollTo(0,0)"><strong>${S.diary[k].mood||'📖'} ${esc(S.diary[k].title||'')||fmt(k,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</strong>${S.diary[k].title?`<div style="color:var(--mute);font-size:13px">${fmt(k,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`:''}<p>${esc(S.diary[k].text)}</p>${thumbs(S.diary[k])}<div class="row" style="margin-top:6px"><button class="sec" onclick="event.stopPropagation();dsel='${k}';dimgsFor=null;render();window.scrollTo(0,0)">Editar</button><button class="ghost" onclick="event.stopPropagation();ask('Excluir esta entrada?',()=>{delete S.diary['${k}'];dimgsFor=null;save();render()})">Excluir</button></div></div>`).join(''):'')}
function imgsHtml(){return dimgs.length?`<div class="fotos">${dimgs.map((x,i)=>`<div class="foto"><img src="${x.url}" alt="Foto ${i+1}" onclick="verFoto(${i})"><button onclick="rmFoto(${i})" aria-label="Remover foto ${i+1}">✕</button></div>`).join('')}</div>`:''}
const drawImgs=()=>{const e=$('#dimgs');if(e)e.innerHTML=imgsHtml()};
const rmFoto=i=>{dimgs.splice(i,1);drawImgs()};
function verFoto(i){const o=document.createElement('div');o.className='ov';o.setAttribute('role','dialog');o.setAttribute('aria-label','Foto ampliada');o.innerHTML=`<img class="big" src="${dimgs[i].url}" alt="Foto ampliada">`;o.onclick=()=>o.remove();document.body.appendChild(o)}
function info(msg){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="dlg" role="alertdialog"><p>${esc(msg)}</p><div class="row"><button id="oki">OK</button></div></div>`;document.body.appendChild(o);o.querySelector('#oki').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};o.querySelector('#oki').focus()}
const thumbs=d=>{const a=(d.imgs||[]).filter(id=>FOTOS[id]);return a.length?`<div class="th">${a.slice(0,4).map(id=>`<img src="${FOTOS[id]}" alt="">`).join('')}${a.length>4?`<span>+${a.length-4}</span>`:''}</div>`:''};
function addFotos(inp){const fs=[...inp.files],d=dsel,room=8-dimgs.length;inp.value='';
 if(!fs.length)return;if(room<=0){info('Limite de 8 fotos por dia.');return}
 if(fs.length>room)info('Limite de 8 fotos por dia: só as '+room+' primeiras foram adicionadas.');
 fs.slice(0,room).forEach(f=>{const r=new FileReader();
  r.onerror=()=>info('Não foi possível ler essa imagem.');
  r.onload=()=>{const im=new Image();
   im.onerror=()=>info('Não foi possível abrir essa imagem. Tente uma foto em JPG ou PNG.');
   im.onload=()=>{if(dsel!==d||dimgs.length>=8)return;const k=Math.min(1,1280/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);dimgs.push({id:uid(),url:c.toDataURL('image/jpeg',.72)});drawImgs()};
   im.src=r.result};
  r.readAsDataURL(f)})}
function saveDi(){const t=$('#dt').value.trim(),ti=$('#dti').value.trim();if(!t&&!ti&&!mood&&!dimgs.length)return;
 const pf=Object.assign({},FOTOS);dimgs.forEach(x=>{FOTOS[x.id]=x.url});
 if(!saveFotos()){FOTOS=pf;info('Sem espaço para guardar essas fotos: o armazenamento do navegador está cheio. Remova fotos de outros dias ou adicione menos fotos.');return}
 S.diary[dsel]={title:ti,text:t,mood,imgs:dimgs.map(x=>x.id)};save();dimgsFor=null;render()}

/* ---------- Compras ---------- */
let sub='atual',aberto=null,cmp={a:{p:'',s:'',u:'g',q:'1'},b:{p:'',s:'',u:'g',q:'1'}};
const FAM={g:['w',1],kg:['w',1000],ml:['v',1],L:['v',1000],un:['u',1]};
const pct=n=>n.toFixed(1).replace('.',',')+'%';
function side(o){const p=num(o.p),s=num(o.s),q=num(o.q)||1,f=FAM[o.u];if(!(p>0&&s>0))return null;const div=f[0]==='u'?1:1000,amt=s*f[1]*q/div,pay=p*q;return{fam:f[0],pay,amt,per:pay/amt}}
function cm(k,f,v){cmp[k][f]=v;calcCmp()}
function calcCmp(){const el=$('#cres');if(!el)return;const A=side(cmp.a),B=side(cmp.b),msg=t=>{el.innerHTML='<p style="margin:0">'+t+'</p>'};
 if(!A||!B)return msg('Preencha o preço e o tamanho das duas opções para comparar.');
 if(A.fam!==B.fam)return msg('Essas unidades não podem ser comparadas. Use peso (g, kg), volume (ml, L) ou unidades nas duas opções.');
 const lb={w:'kg',v:'L',u:'un'}[A.fam];
 if(Math.abs(A.per-B.per)<1e-9)return msg('As duas opções custam o mesmo por '+lb+' ('+brl(A.per)+'). Não há vantagem em nenhuma delas.');
 const aw=A.per<B.per,w=aw?'A':'B',l=aw?'B':'A',W=aw?A:B,L=aw?B:A,econ=(L.per-W.per)/L.per*100,mais=(L.per-W.per)/W.per*100,sv=(L.per-W.per)*L.amt;
 el.innerHTML=`<div class="r"><span>Opção A</span><b>${brl(A.per)}/${lb}</b></div><div class="r"><span>Opção B</span><b>${brl(B.per)}/${lb}</b></div><div style="border-top:1px solid var(--ac);margin:10px 0"></div><div class="r"><span>Compensa mais</span><strong>Opção ${w}</strong></div><p style="margin:8px 0 0"><b>Vantagem de ${pct(econ)}:</b> a opção ${w} custa ${pct(econ)} menos por ${lb}.</p><p style="margin:6px 0 0"><b>Desvantagem de ${pct(mais)}:</b> a opção ${l} custa ${pct(mais)} mais que a ${w}.</p><p style="margin:6px 0 0;font-size:14px">Para levar o mesmo conteúdo da opção ${l} (${(+L.amt.toFixed(3)).toLocaleString('pt-BR')} ${lb}) pela opção ${w}, você economiza ${brl(sv)}.</p>`}
/* ---------- Mercados ---------- */
const MERC=[{id:'atacadao',nome:'Atacadão',sig:'AT',h:4},{id:'assai',nome:'Assaí',sig:'AS',h:28},{id:'novo',nome:'Novo Atacarejo',sig:'NA',h:210},{id:'mix',nome:'Mix Mateus',sig:'MM',h:265},{id:'pao',nome:'Pão de Açúcar',sig:'PA',h:150}];
const nrm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ');
function mkId(n){const s=nrm(n).replace(/[^a-z]/g,'');if(!s)return'';if(s.includes('atacadao'))return'atacadao';if(s.includes('assai'))return'assai';if(s.includes('novoatacarejo')||s==='novo')return'novo';if(s.includes('mixmat'))return'mix';if(s.includes('paodeacucar'))return'pao';return''}
const saveLogos=()=>{try{localStorage.setItem('minha-agenda-logos',JSON.stringify(LOGOS));return true}catch(e){return false}};
const logo=(m,s)=>LOGOS[m.id]?`<img class="mlogo" style="width:${s}px;height:${s}px" src="${LOGOS[m.id]}" alt="${m.nome}">`:`<span class="mlogo mb" style="width:${s}px;height:${s}px;font-size:${Math.round(s*.4)}px;background:hsl(${m.h},55%,38%)" role="img" aria-label="${m.nome}">${m.sig}</span>`;
const logoNome=n=>{const m=MERC.find(x=>x.id===mkId(n));return m?logo(m,34):''};
function setLogo(id,inp){const f=inp.files[0];inp.value='';if(!f)return;const r=new FileReader();
 r.onerror=()=>info('Não foi possível ler essa imagem.');
 r.onload=()=>{const im=new Image();im.onerror=()=>info('Não foi possível abrir essa imagem. Tente um arquivo PNG ou JPG.');
  im.onload=()=>{const w=im.width||200,hh=im.height||200,k=Math.min(1,200/Math.max(w,hh)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(hh*k));c.getContext('2d').drawImage(im,0,0,c.width,c.height);const prev=LOGOS[id];LOGOS[id]=c.toDataURL('image/png');if(!saveLogos()){if(prev)LOGOS[id]=prev;else delete LOGOS[id];info('Sem espaço para guardar esse logo.');return}render()};
  im.src=r.result};r.readAsDataURL(f)}
function rmLogo(id){delete LOGOS[id];saveLogos();render()}
let escMk=false;
function vEscolheMercado(){const cur=mkId(S.market),vol=S.market||S.shop.length,mk=[...new Set(S.hist.map(h=>h.market))];
 return `<datalist id="mks">${mk.map(m=>`<option value="${esc(m)}">`).join('')}</datalist><div class="card"><h2 style="margin-bottom:4px">Em qual mercado você está?</h2><p class="hint" style="margin:0 0 12px">Escolha antes de começar a lista. Os preços que você registrar ficam guardados nesse mercado para comparar depois.</p><div class="mks">${MERC.map(m=>`<button class="mk ${cur===m.id?'on':''}" onclick="pickMk('${m.id}')" aria-pressed="${cur===m.id}">${logo(m,40)}<span>${m.nome}</span></button>`).join('')}</div><div class="row" style="margin-top:8px"><input id="mk" list="mks" placeholder="Outro mercado (digite o nome)" value="${cur?'':esc(S.market)}" onkeydown="if(event.key==='Enter')startMk()"><button onclick="startMk()">Começar</button></div></div><div class="row" style="justify-content:center">${vol?`<button class="ghost" onclick="escMk=false;render()">Cancelar</button>`:''}<button class="ghost" onclick="skipMk()">Montar a lista antes e escolher depois</button></div>`}
function mkBar(){const k=mkId(S.market),m=MERC.find(x=>x.id===k);
 return `<div class="card mkbar">${m?logo(m,40):`<span class="mlogo mb" style="width:40px;height:40px;font-size:20px;background:var(--mute)">🏪</span>`}<div class="t"><small>${S.market?'Você está em':'Mercado'}</small><b>${S.market?esc(S.market):'Não escolhido'}</b></div><button class="sec" onclick="escMk=true;render()">${S.market?'Trocar':'Escolher'}</button></div>`}
function pickMk(id){S.market=MERC.find(x=>x.id===id).nome;S.mkSkip=false;escMk=false;save();render();window.scrollTo(0,0)}
function startMk(){const v=($('#mk').value||'').trim();if(!v){$('#mk').focus();return}const k=mkId(v);S.market=k?MERC.find(x=>x.id===k).nome:v;S.mkSkip=false;escMk=false;save();render();window.scrollTo(0,0)}
function skipMk(){S.mkSkip=true;escMk=false;save();render()}
function precos(){const P={};[...S.hist].sort((a,b)=>String(a.date).localeCompare(String(b.date))).forEach(h=>{const id=mkId(h.market);if(!id)return;(h.items||[]).forEach(x=>{if(!(x.price>0)||!String(x.title||'').trim())return;const kg=wt(x.unit),k=nrm(x.title)+'|'+(kg?'kg':'un'),p=P[k]=P[k]||{t:x.title,kg,m:{}};p.t=x.title;p.m[id]={price:x.price,date:h.date}})});return P}
const chaveP=x=>nrm(x.title)+'|'+(wt(x.unit)?'kg':'un');
function vMercados(){
 const P=precos(),keys=Object.keys(P).sort((a,b)=>P[a].t.localeCompare(P[b].t)),L=S.shop;
 const cards=MERC.map(m=>{const l=S.hist.filter(h=>mkId(h.market)===m.id).sort((a,b)=>b.date.localeCompare(a.date)),u=l[0];
  return `<div class="mc">${logo(m,44)}<div class="t"><b>${m.nome}</b><small>${u?l.length+(l.length===1?' compra':' compras')+' · última em '+fmt(u.date,{day:'numeric',month:'short'})+' · '+brl(u.total):'Nenhuma compra registrada'}</small></div><button class="ghost" onclick="$('#lg-${m.id}').click()" aria-label="Trocar logo de ${m.nome}">🖼️</button>${LOGOS[m.id]?`<button class="ghost" onclick="rmLogo('${m.id}')" aria-label="Remover logo de ${m.nome}">✕</button>`:''}<input type="file" id="lg-${m.id}" accept="image/*" hidden onchange="setLogo('${m.id}',this)"></div>`}).join('');
 let lista;
 if(!L.length)lista='<div class="vazio" style="padding:10px">Sua lista está vazia. Monte a lista na aba Lista para ver quanto ela custaria em cada mercado.</div>';
 else{const rows=MERC.map(m=>{let t=0,c=0;L.forEach(x=>{const p=(P[chaveP(x)]||{m:{}}).m[m.id];if(p){c++;t+=lineTotal({price:p.price,qty:x.qty,unit:x.unit})}});return{m,t,c}}),max=Math.max(...rows.map(r=>r.c)),best=max>0?rows.filter(r=>r.c===max).sort((a,b)=>a.t-b.t)[0]:null;
  lista=rows.map(r=>`<div class="item">${logo(r.m,34)}<span class="t"><b>${r.m.nome}</b><br><small style="color:var(--mute)">${r.c} de ${L.length} ${L.length===1?'item':'itens'} com preço</small></span>${best===r?'<span class="melhor">Mais barato</span>':''}<b>${r.c?brl(r.t):'—'}</b></div>`).join('')+'<p class="hint">O total soma só os itens que têm preço registrado naquele mercado. O selo vai para o mais barato entre os mercados com mais itens cobertos.</p>'}
 const tab=keys.length?`<div class="tw"><table class="mt"><thead><tr><th>Produto</th>${MERC.map(m=>`<th>${logo(m,26)}</th>`).join('')}</tr></thead><tbody>${keys.map(k=>{const p=P[k],vals=MERC.map(m=>p.m[m.id]||null),ps=vals.filter(Boolean).map(v=>v.price),min=ps.length>1?Math.min(...ps):null;return `<tr><td>${esc(p.t)}${p.kg?' <small>/kg</small>':''}</td>${vals.map(v=>v?`<td class="${v.price===min?'low':''}">${brl(v.price)}<small>${fmt(v.date,{day:'numeric',month:'short'})}</small></td>`:'<td class="nd">—</td>').join('')}</tr>`}).join('')}</tbody></table></div><p class="hint">Preço mais recente de cada mercado, com a data da compra. Em verde, o mais barato entre os mercados que têm o produto.</p>`:'<div class="vazio" style="padding:10px">Ainda não há preços registrados. Escolha o mercado na aba Lista e finalize a compra: os preços daquele dia ficam guardados aqui.</div>';
 return `<h3 style="margin-top:0">Sua lista em cada mercado</h3><div class="card">${lista}</div><h3>Preço por produto</h3><div class="card">${tab}</div><h3>Mercados e logos</h3><div class="card">${cards}</div><p class="hint">Toque em 🖼️ para colocar o logo original de cada mercado.</p>`}
function vComparar(){
 const box=(k,t)=>`<div class="card"><h3 style="margin:0 0 8px">${t}</h3><input inputmode="decimal" placeholder="Preço da embalagem (R$)" value="${esc(cmp[k].p)}" oninput="cm('${k}','p',this.value)" aria-label="Preço da embalagem"><div class="row" style="margin-top:8px"><input inputmode="decimal" placeholder="Tamanho" value="${esc(cmp[k].s)}" oninput="cm('${k}','s',this.value)" aria-label="Tamanho da embalagem"><select aria-label="Unidade do tamanho" onchange="cm('${k}','u',this.value)">${['g','kg','ml','L','un'].map(u=>`<option ${cmp[k].u===u?'selected':''}>${u}</option>`).join('')}</select><input inputmode="decimal" placeholder="Qtd" value="${esc(cmp[k].q)}" style="width:70px" oninput="cm('${k}','q',this.value)" aria-label="Quantidade de embalagens"></div></div>`;
 return `<p class="hint" style="margin:0 0 10px">Compare dois produtos, ou levar uma ou duas embalagens. Informe o preço de cada embalagem, o tamanho dela e quantas você levaria.</p>`+box('a','Opção A')+box('b','Opção B')+`<div class="card tot" id="cres"></div>`}
const brl=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>{let s=String(v).replace(/[^\d.,-]/g,'');if(s.includes(','))s=s.replace(/\./g,'').replace(',','.');else if(/^[1-9]\d{0,2}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');return parseFloat(s)||0};
const lineTotal=x=>(x.price||0)*(x.qty==null?1:x.qty)/(x.unit==='g'?1000:1);
const tot=l=>l.reduce((s,x)=>s+lineTotal(x),0);
const wt=u=>u==='kg'||u==='g';
const qtyOf=(u,v)=>{const n=num(v);return wt(u)?Math.max(0,n):Math.max(1,n||1)};
const unitSel=(u,cb)=>`<select class="un" onchange="${cb}" aria-label="Unidade">${['un','kg','g'].map(a=>`<option value="${a}" ${(u||'un')===a?'selected':''}>${a}</option>`).join('')}</select>`;
const qtyTxt=x=>wt(x.unit)?String(x.qty).replace('.',',')+' '+x.unit:x.qty;
const ek=k=>encodeURIComponent(k).replace(/'/g,'%27');
function addShop(){
 const t=$('#st').value.trim();if(!t){$('#st').focus();return}
 const k=t.toLowerCase(),u=$('#su').value,pr=$('#sp').value.trim()===''?(S.prods[k]||{price:0}).price:num($('#sp').value);
 S.shop.push({id:uid(),title:t,price:pr,unit:u,qty:qtyOf(u,$('#sq').value),done:false});
 S.prods[k]={name:t,price:pr,unit:wt(u)?'kg':'un'};save();render();$('#st').focus()}
function fillPrice(){const p=S.prods[$('#st').value.trim().toLowerCase()];if(p){$('#sp').value=p.price||'';const c=$('#su').value;if((p.unit||'un')==='un')$('#su').value='un';else if(c==='un')$('#su').value='kg';unitHint()}}
function unitHint(){$('#sp').placeholder=wt($('#su').value)?'Preço do kg (R$)':'Preço (R$)'}
function upUnit(id,v){const x=S.shop.find(y=>y.id===id);x.unit=v;if(wt(v)&&x.qty<=0)x.qty=1;save();render()}
function upShop(id,k,v){const x=S.shop.find(y=>y.id===id);x[k]=k==='qty'?qtyOf(x.unit,v):num(v);
 if(k==='price')S.prods[x.title.toLowerCase()]={name:x.title,price:x.price,unit:wt(x.unit)?'kg':'un'};save();
 $('#sub'+id).textContent=brl(lineTotal(x));const t=tot(S.shop),c=tot(S.shop.filter(y=>y.done));
 $('#tt').textContent=brl(t);$('#tc').textContent=brl(c);$('#tf').textContent=brl(t-c)}
function togShop(id){const x=S.shop.find(y=>y.id===id);x.done=!x.done;save();render()}
function finish(){const m0=(S.market||'').trim();if(!m0){escMk=true;render();window.scrollTo(0,0);return}const k0=mkId(m0),m=k0?MERC.find(x=>x.id===k0).nome:m0;
 S.hist.unshift({id:uid(),market:m,date:HOJE,items:S.shop.map(x=>({title:x.title,price:x.price,qty:x.qty,unit:x.unit||'un'})),total:tot(S.shop)});
 S.shop=[];S.market='';S.mkSkip=false;save();sub='hist';aberto=S.hist[0].id;render()}
function reuse(id){const h=S.hist.find(x=>x.id===id);h.items.forEach(x=>S.shop.push({id:uid(),title:x.title,price:x.price,qty:x.qty,unit:x.unit||'un',done:false}));save();sub='atual';if(!S.market)escMk=true;render();window.scrollTo(0,0)}
function addProd(){const n=$('#pn').value.trim();if(!n){$('#pn').focus();return}S.prods[n.toLowerCase()]={name:n,price:num($('#pp').value),unit:$('#pu').value};save();render();$('#pn').focus()}
function upProd(k,v){k=decodeURIComponent(k);S.prods[k].price=num(v);save()}
function prodToList(k){k=decodeURIComponent(k);const p=S.prods[k];S.shop.push({id:uid(),title:p.name,price:p.price,unit:p.unit==='kg'?'kg':'un',qty:1,done:false});save();sub='atual';render()}
function vLista(){
 if(escMk||(!S.market&&!S.mkSkip&&!S.shop.length))return vEscolheMercado();
 const d=S.shop.filter(x=>x.done),pend=S.shop.filter(x=>!x.done),t=tot(S.shop),c=tot(d);
 const it=x=>`<div class="item ${x.done?'done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="togShop('${x.id}')" aria-label="Marcar"><div class="t"><div>${esc(x.title)}</div><div class="pq"><input inputmode="decimal" value="${x.qty}" oninput="upShop('${x.id}','qty',this.value)" aria-label="Quantidade">${unitSel(x.unit,`upUnit('${x.id}',this.value)`)}<span>×</span><input class="pr" inputmode="decimal" value="${x.price||''}" placeholder="${wt(x.unit)?'R$/kg':'0,00'}" oninput="upShop('${x.id}','price',this.value)" aria-label="Preço"><b id="sub${x.id}">${brl(lineTotal(x))}</b></div></div><button class="ghost" onclick="S.shop=S.shop.filter(y=>y.id!=='${x.id}');save();render()" aria-label="Excluir">✕</button></div>`;
 const mk=[...new Set(S.hist.map(h=>h.market))];
 return `<datalist id="pl">${Object.values(S.prods).map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist><datalist id="mks">${mk.map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
 ${mkBar()}<div class="card tot"><div class="r"><span>Total da lista</span><strong id="tt">${brl(t)}</strong></div><div class="r"><span>No carrinho</span><b id="tc">${brl(c)}</b></div><div class="r"><span>Falta pegar</span><b id="tf">${brl(t-c)}</b></div></div>
 <div class="card"><input id="st" list="pl" placeholder="Produto" oninput="fillPrice()" onkeydown="if(event.key==='Enter')addShop()"><div class="row" style="margin-top:8px"><input id="sp" inputmode="decimal" placeholder="Preço (R$)" onkeydown="if(event.key==='Enter')addShop()"><input id="sq" inputmode="decimal" value="1" style="width:70px" aria-label="Quantidade"><select id="su" onchange="unitHint()" aria-label="Unidade"><option value="un">un</option><option value="kg">kg</option><option value="g">g</option></select><button onclick="addShop()">Adicionar</button></div><p class="hint">Produto por peso: escolha kg ou g e informe o preço do quilo.</p></div>`
 +(S.shop.length?(pend.length?`<div class="card">${pend.map(it).join('')}</div>`:'')+(d.length?`<h3>No carrinho (${d.length})</h3><div class="card">${d.map(it).join('')}</div>`:'')
 +`<div class="card"><div class="row" style="margin-top:8px"><button onclick="finish()">Finalizar e salvar no histórico</button><button class="ghost" onclick="ask('Limpar toda a lista?',()=>{S.shop=[];save();render()},'Limpar')">Limpar</button></div></div>`
 :'<div class="vazio">Lista vazia. Cadastre o produto e o preço acima, o total aparece sozinho.</div>')}
function vProdutos(){
 const l=Object.entries(S.prods).sort((a,b)=>a[1].name.localeCompare(b[1].name));
 return `<div class="card"><input id="pn" placeholder="Nome do produto"><div class="row" style="margin-top:8px"><input id="pp" inputmode="decimal" placeholder="Preço (R$)" onkeydown="if(event.key==='Enter')addProd()"><select id="pu" aria-label="Tipo de preço"><option value="un">Por unidade</option><option value="kg">Por kg</option></select><button onclick="addProd()">Cadastrar</button></div></div>`
 +(l.length?`<div class="card">${l.map(([k,p])=>`<div class="item"><span class="t">${esc(p.name)}${p.unit==='kg'?' <small style="color:var(--mute)">por kg</small>':''}</span><input class="pin" inputmode="decimal" value="${p.price||''}" placeholder="0,00" onchange="upProd('${ek(k)}',this.value)" aria-label="Preço"><button class="sec" onclick="prodToList('${ek(k)}')" aria-label="Adicionar à lista">＋</button><button class="ghost" onclick="delete S.prods[decodeURIComponent('${ek(k)}')];save();render()" aria-label="Excluir">✕</button></div>`).join('')}</div>`:'<div class="vazio">Nenhum produto cadastrado. Produtos adicionados à lista também ficam salvos aqui, com o último preço.</div>')}
function vHist(){
 if(!S.hist.length)return '<div class="vazio">Nenhuma compra finalizada. Ao finalizar uma lista, ela aparece aqui com o nome do mercado.</div>';
 return S.hist.map(h=>h.id===edH?histEdit():`<div class="card"><div class="row ent" onclick="aberto=aberto==='${h.id}'?null:'${h.id}';render()">${logoNome(h.market)}<div style="flex:1"><strong>${esc(h.market)}</strong><div style="color:var(--mute);font-size:14px">${fmt(h.date,{day:'numeric',month:'short',year:'numeric'})}, ${h.items.length} itens</div></div><strong>${brl(h.total)}</strong></div>`
 +(aberto===h.id?`<div style="margin-top:8px">${h.items.map(x=>`<div class="item"><span class="t">${esc(x.title)} <small style="color:var(--mute)">${qtyTxt(x)} × ${brl(x.price)}${wt(x.unit)?'/kg':''}</small></span><b>${brl(lineTotal(x))}</b></div>`).join('')}<div class="row" style="margin-top:10px"><button class="sec" onclick="reuse('${h.id}')">Usar de novo</button><button class="sec" onclick="startH('${h.id}')">Editar</button><button class="ghost" onclick="ask('Excluir do histórico?',()=>{S.hist=S.hist.filter(x=>x.id!=='${h.id}');save();render()})">Excluir</button></div></div>`:'')+'</div>').join('')}
function vCompras(){
 const seg=`<div class="seg">${[['atual','Lista'],['prod','Produtos'],['comp','Comparar'],['mkt','Mercados'],['hist','Histórico ('+S.hist.length+')']].map(a=>`<button class="${sub===a[0]?'on':''}" onclick="sub='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`;
 return `<h2>Lista de compras</h2>`+seg+(sub==='atual'?vLista():sub==='prod'?vProdutos():sub==='comp'?vComparar():sub==='mkt'?vMercados():vHist())}

function vTotais(){
 const fotos=Object.values(S.diary).reduce((n,d)=>n+(d.imgs||[]).filter(id=>FOTOS[id]).length,0),ev=S.ev.length,ok=S.ev.filter(e=>e.done).length,di=Object.keys(S.diary).length,sh=S.shop.length,hi=S.hist.length,pr=Object.keys(S.prods).length,nt=S.notes.length,total=ev+di+sh+hi+pr+nt;
 const r=(ic,t,n,sub)=>`<div class="item"><span class="si2">${ic}</span><span class="t">${t}${sub?`<br><small style="color:var(--mute)">${sub}</small>`:''}</span><b class="cn">${n}</b></div>`;
 return `<h3>Total registrado</h3><div class="card"><div class="cn-tot"><strong>${total}</strong><span>${total===1?'registro no total':'registros no total'}</span></div>`
 +r('📋','Compromissos na agenda',ev,ev?ok+(ok===1?' concluído':' concluídos')+' · '+(ev-ok)+(ev-ok===1?' pendente':' pendentes'):'')
 +r('📖','Entradas no diário',di,fotos?fotos+(fotos===1?' foto':' fotos'):'')
 +r('🛒','Itens na lista de compras',sh,'')
 +r('🧾','Compras finalizadas (histórico)',hi,'')
 +r('🏷️','Produtos cadastrados',pr,'')
 +r('📝','Notas',nt,'')+`</div>`}
/* ---------- Início ---------- */
function vInicio(){
 const hoje=sortEv(S.ev.filter(e=>e.date===HOJE)),pend=hoje.filter(e=>!e.done).length,faltam=S.shop.filter(x=>!x.done).length,nn=S.notes.length,tema=S.theme||'auto';
 const nome=edName?`<div class="row"><input id="gn" value="${esc(S.user.name)}" maxlength="30" aria-label="Seu nome" onkeydown="if(event.key==='Enter')saveName()"><button onclick="saveName()">Salvar</button><button class="ghost" onclick="edName=false;render()">Cancelar</button></div>`:`<div class="row"><div style="flex:1"><div class="gt">${saud()}, ${esc(S.user.name)}!</div><div class="gd">${dataLonga()}</div></div><button class="sec" onclick="edName=true;render();$('#gn').focus()">✎ Nome</button></div>`;
 const st=(ic,t,s,fn)=>`<button class="stat" onclick="${fn}"><span class="si">${ic}</span><b>${t}</b><small>${s}</small></button>`;
 const tm=[['auto','🌓 Auto'],['light','☀️ Claro'],['dark','🌙 Escuro']];
 return `<div class="card">${nome}</div>`
 +`<h3>Hoje</h3><div class="card">${hoje.length?hoje.map(evItem).join(''):'<div class="vazio" style="padding:10px">Nada marcado para hoje.</div>'}</div>`
 +`<div class="stats">`
 +st('📋','Agenda',hoje.length?pend+' de '+hoje.length+' pendentes hoje':'Nada hoje',`go('agenda')`)
 +st('📖','Diário',S.diary[HOJE]?'Escrito hoje ✓':'Ainda não escreveu',`dsel=HOJE;go('diario')`)
 +st('🛒','Compras',faltam+(faltam===1?' item a pegar':' itens a pegar')+' · '+brl(tot(S.shop)),`go('compras')`)
 +st('📝','Notas',nn+(nn===1?' nota':' notas'),`go('notas')`)
 +`</div>`
 +vTotais()
 +`<h3>Aparência</h3><div class="card"><div class="seg" style="margin-bottom:0">${tm.map(a=>`<button class="${tema===a[0]?'on':''}" onclick="setTheme('${a[0]}')">${a[1]}</button>`).join('')}</div><p class="hint">Automático acompanha o tema do aparelho.</p></div>`
 +`<div style="text-align:center;margin-top:4px"><button class="ghost" onclick="ask('Sair? Seus dados continuam salvos neste aparelho.',()=>{S.user.name='';edName=false;save();render()},'Sair')">Sair</button></div>`}
function render(){head();if(!S.user.name){welcomeView();return}
 const f={inicio:vInicio,agenda:vAgenda,cal:vCal,notas:vNotas,diario:vDiario,compras:vCompras}[tab];
 const a=document.activeElement,keep=a&&a.id&&a.tagName!=='BUTTON'?{id:a.id,v:a.value}:null;
 $('#v').innerHTML=f();if(tab==='compras'&&sub==='comp')calcCmp();
 if(keep&&$('#'+keep.id)&&tab!=='diario'){const e=$('#'+keep.id);if(e.type!=='date'){e.value=keep.v;}}
}
let edEv=null,edH=null,edD=null,edName=false;
function applyTheme(){const t=S.theme||'auto',r=document.documentElement;if(t==='auto')r.removeAttribute('data-theme');else r.dataset.theme=t;}
function setTheme(t){S.theme=t;save();applyTheme();render()}
const saud=()=>{const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'};
const dataLonga=()=>new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
function head(){applyTheme();const ok=!!S.user.name;$('nav').style.display=ok?'':'none';
 $('#greet').innerHTML=!ok||tab==='inicio'?'':`<div class="greet"><div class="gt">${saud()}, ${esc(S.user.name)}!</div><div class="gd">${dataLonga()}</div></div>`}
function saveName(){const n=$('#gn').value.trim();if(!n){$('#gn').focus();return}S.user.name=n;edName=false;save();render()}
function welcomeView(){$('#v').innerHTML=`<div class="card" style="margin-top:20px"><div style="margin-bottom:10px">${$('.logo').outerHTML.replace('class="logo"','class="logo big"')}</div><h2>Bem-vindo(a)</h2><p style="margin:0 0 12px">Como você quer ser chamado(a)?</p><input id="wn" placeholder="Seu nome" maxlength="30" onkeydown="if(event.key==='Enter')enter()"><button style="margin-top:10px;width:100%" onclick="enter()">Entrar</button><p style="color:var(--mute);font-size:13px;margin:12px 0 0">Seus dados ficam salvos neste aparelho.</p></div>`}
function enter(){const n=$('#wn').value.trim();if(!n){$('#wn').focus();return}S.user.name=n;save();render()}
function evEdit(e){return `<div class="item" style="flex-wrap:wrap"><input id="ee-t" value="${esc(e.title)}" placeholder="Título" aria-label="Título"><div class="row" style="width:100%"><input type="date" id="ee-d" value="${e.date}"><input type="time" id="ee-h" value="${e.time||''}"><button onclick="saveEv('${e.id}')">Salvar</button><button class="ghost" onclick="edEv=null;render()">Cancelar</button></div></div>`}
function saveEv(id){const e=S.ev.find(x=>x.id===id),t=$('#ee-t').value.trim();if(!t){$('#ee-t').focus();return}e.title=t;e.date=$('#ee-d').value||e.date;e.time=$('#ee-h').value;edEv=null;save();render()}
function startH(id){edH=id;edD=JSON.parse(JSON.stringify(S.hist.find(x=>x.id===id)));render()}
function upHI(i,k,v){const x=edD.items[i];if(k==='unit'){x.unit=v;if(wt(v)&&x.qty<=0)x.qty=1}else x[k]=k==='title'?v:k==='qty'?qtyOf(x.unit,v):num(v);$('#hs'+i).textContent=brl(lineTotal(x));$('#ht').textContent=brl(tot(edD.items))}
function saveH(){const m=edD.market.trim();if(!m){$('#hm2').focus();return}edD.market=m;edD.items=edD.items.filter(x=>x.title.trim());edD.total=tot(edD.items);const i=S.hist.findIndex(x=>x.id===edD.id);S.hist[i]=edD;edH=null;edD=null;save();render()}
function histEdit(){const d=edD;return `<div class="card"><input id="hm2" value="${esc(d.market)}" placeholder="Nome do mercado" aria-label="Mercado" oninput="edD.market=this.value"><input type="date" value="${d.date}" style="margin-top:8px" oninput="edD.date=this.value||edD.date">${d.items.map((x,i)=>`<div class="item"><div class="t"><input value="${esc(x.title)}" placeholder="Produto" oninput="upHI(${i},'title',this.value)"><div class="pq"><input inputmode="decimal" value="${x.qty}" oninput="upHI(${i},'qty',this.value)" aria-label="Quantidade">${unitSel(x.unit,`upHI(${i},'unit',this.value)`)}<span>×</span><input class="pr" inputmode="decimal" value="${x.price||''}" placeholder="${wt(x.unit)?'R$/kg':'0,00'}" oninput="upHI(${i},'price',this.value)" aria-label="Preço"><b id="hs${i}">${brl(lineTotal(x))}</b></div></div><button class="ghost" onclick="edD.items.splice(${i},1);render()" aria-label="Excluir item">✕</button></div>`).join('')}<div class="row" style="margin-top:8px"><button class="sec" onclick="edD.items.push({title:'',price:0,qty:1});render()">Adicionar item</button><b style="margin-left:auto" id="ht">${brl(tot(d.items))}</b></div><div class="row" style="margin-top:10px"><button onclick="saveH()">Salvar</button><button class="ghost" onclick="edH=null;edD=null;render()">Cancelar</button></div></div>`}
function ask(msg,fn,label){const o=document.createElement('div');o.className='ov';o.innerHTML=`<div class="dlg" role="alertdialog"><p>${esc(msg)}</p><div class="row"><button id="ok">${label||'Excluir'}</button><button class="sec" id="no">Cancelar</button></div></div>`;document.body.appendChild(o);o.querySelector('#ok').onclick=()=>{o.remove();fn()};o.querySelector('#no').onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove()};o.querySelector('#no').focus()}
applyTheme();nav();render();
