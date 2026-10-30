const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const HOJE=iso(new Date());
const fmt=(s,o)=>new Date(s+'T12:00').toLocaleDateString('pt-BR',o||{weekday:'short',day:'numeric',month:'short'});
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
let S={ev:[],notes:[],diary:{},shop:[],prods:{},hist:[],market:'',user:{name:''},theme:'auto'};
try{const r=localStorage.getItem('minha-agenda');if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
S.shop.forEach(x=>{x.price=x.price||0;x.qty=x.qty||1});
const save=()=>{try{localStorage.setItem('minha-agenda',JSON.stringify(S))}catch(e){}};
let tab='agenda',sel=HOJE,mes=new Date(),mood='',dsel=HOJE;
const TABS=[['agenda','📋','Agenda'],['cal','📅','Calendário'],['notas','📝','Notas'],['diario','📖','Diário'],['compras','🛒','Compras']];


function nav(){$('#nav').innerHTML=TABS.map(t=>`<button class="${tab===t[0]?'on':''}" onclick="go('${t[0]}')"><b>${t[1]}</b>${t[2]}</button>`).join('')}
function go(t){tab=t;nav();render();window.scrollTo(0,0)}

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
 const cur=S.diary[dsel]||{title:'',text:'',mood:''};mood=cur.mood;
 const ks=Object.keys(S.diary).sort().reverse();
 return `<h2>Diário</h2><div class="card"><input type="date" value="${dsel}" onchange="dsel=this.value||HOJE;render()"><div class="humor" id="hm">${MOODS.map(m=>`<button class="${mood===m?'on':''}" onclick="mood=mood==='${m}'?'':'${m}';document.querySelectorAll('#hm button').forEach(b=>b.classList.toggle('on',b.textContent===mood))" aria-label="Humor ${m}">${m}</button>`).join('')}</div>
 <input id="dti" value="${esc(cur.title||'')}" placeholder="Título do dia" maxlength="80" aria-label="Título" style="font-weight:600;margin-bottom:8px"><textarea id="dt" style="min-height:160px" placeholder="Como foi o seu dia?">${esc(cur.text)}</textarea>
 <div class="row" style="margin-top:8px"><button onclick="saveDi()">Salvar</button>${S.diary[dsel]?`<button class="ghost" onclick="ask('Excluir esta entrada?',()=>{delete S.diary['${dsel}'];save();render()})">Excluir</button>`:''}</div></div>`
 +(ks.length?'<h3>Entradas</h3>'+ks.map(k=>`<div class="card ent" onclick="dsel='${k}';render();window.scrollTo(0,0)"><strong>${S.diary[k].mood||'📖'} ${esc(S.diary[k].title||'')||fmt(k,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</strong>${S.diary[k].title?`<div style="color:var(--mute);font-size:13px">${fmt(k,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>`:''}<p>${esc(S.diary[k].text)}</p><div class="row" style="margin-top:6px"><button class="sec" onclick="event.stopPropagation();dsel='${k}';render();window.scrollTo(0,0)">Editar</button><button class="ghost" onclick="event.stopPropagation();ask('Excluir esta entrada?',()=>{delete S.diary['${k}'];save();render()})">Excluir</button></div></div>`).join(''):'')}
function saveDi(){const t=$('#dt').value.trim(),ti=$('#dti').value.trim();if(!t&&!ti&&!mood)return;S.diary[dsel]={title:ti,text:t,mood};save();render()}

/* ---------- Compras ---------- */
let sub='atual',aberto=null;
const brl=n=>(+n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const num=v=>parseFloat(String(v).replace(',','.'))||0;
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
function finish(){const m=($('#mk').value||'').trim();if(!m){$('#mk').focus();$('#mk').placeholder='Informe o nome do mercado';return}
 S.hist.unshift({id:uid(),market:m,date:HOJE,items:S.shop.map(x=>({title:x.title,price:x.price,qty:x.qty,unit:x.unit||'un'})),total:tot(S.shop)});
 S.shop=[];S.market='';save();sub='hist';aberto=S.hist[0].id;render()}
function reuse(id){const h=S.hist.find(x=>x.id===id);h.items.forEach(x=>S.shop.push({id:uid(),title:x.title,price:x.price,qty:x.qty,unit:x.unit||'un',done:false}));save();sub='atual';render();window.scrollTo(0,0)}
function addProd(){const n=$('#pn').value.trim();if(!n){$('#pn').focus();return}S.prods[n.toLowerCase()]={name:n,price:num($('#pp').value),unit:$('#pu').value};save();render();$('#pn').focus()}
function upProd(k,v){k=decodeURIComponent(k);S.prods[k].price=num(v);save()}
function prodToList(k){k=decodeURIComponent(k);const p=S.prods[k];S.shop.push({id:uid(),title:p.name,price:p.price,unit:p.unit==='kg'?'kg':'un',qty:1,done:false});save();sub='atual';render()}
function vLista(){
 const d=S.shop.filter(x=>x.done),pend=S.shop.filter(x=>!x.done),t=tot(S.shop),c=tot(d);
 const it=x=>`<div class="item ${x.done?'done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="togShop('${x.id}')" aria-label="Marcar"><div class="t"><div>${esc(x.title)}</div><div class="pq"><input inputmode="decimal" value="${x.qty}" oninput="upShop('${x.id}','qty',this.value)" aria-label="Quantidade">${unitSel(x.unit,`upUnit('${x.id}',this.value)`)}<span>×</span><input class="pr" inputmode="decimal" value="${x.price||''}" placeholder="${wt(x.unit)?'R$/kg':'0,00'}" oninput="upShop('${x.id}','price',this.value)" aria-label="Preço"><b id="sub${x.id}">${brl(lineTotal(x))}</b></div></div><button class="ghost" onclick="S.shop=S.shop.filter(y=>y.id!=='${x.id}');save();render()" aria-label="Excluir">✕</button></div>`;
 const mk=[...new Set(S.hist.map(h=>h.market))];
 return `<datalist id="pl">${Object.values(S.prods).map(p=>`<option value="${esc(p.name)}">`).join('')}</datalist><datalist id="mks">${mk.map(m=>`<option value="${esc(m)}">`).join('')}</datalist>
 <div class="card tot"><div class="r"><span>Total da lista</span><strong id="tt">${brl(t)}</strong></div><div class="r"><span>No carrinho</span><b id="tc">${brl(c)}</b></div><div class="r"><span>Falta pegar</span><b id="tf">${brl(t-c)}</b></div></div>
 <div class="card"><input id="st" list="pl" placeholder="Produto" oninput="fillPrice()" onkeydown="if(event.key==='Enter')addShop()"><div class="row" style="margin-top:8px"><input id="sp" inputmode="decimal" placeholder="Preço (R$)" onkeydown="if(event.key==='Enter')addShop()"><input id="sq" inputmode="decimal" value="1" style="width:70px" aria-label="Quantidade"><select id="su" onchange="unitHint()" aria-label="Unidade"><option value="un">un</option><option value="kg">kg</option><option value="g">g</option></select><button onclick="addShop()">Adicionar</button></div><p class="hint">Produto por peso: escolha kg ou g e informe o preço do quilo.</p></div>`
 +(S.shop.length?(pend.length?`<div class="card">${pend.map(it).join('')}</div>`:'')+(d.length?`<h3>No carrinho (${d.length})</h3><div class="card">${d.map(it).join('')}</div>`:'')
 +`<div class="card"><input id="mk" list="mks" placeholder="Nome do mercado" value="${esc(S.market)}" oninput="S.market=this.value;save()"><div class="row" style="margin-top:8px"><button onclick="finish()">Finalizar e salvar no histórico</button><button class="ghost" onclick="ask('Limpar toda a lista?',()=>{S.shop=[];save();render()},'Limpar')">Limpar</button></div></div>`
 :'<div class="vazio">Lista vazia. Cadastre o produto e o preço acima, o total aparece sozinho.</div>')}
function vProdutos(){
 const l=Object.entries(S.prods).sort((a,b)=>a[1].name.localeCompare(b[1].name));
 return `<div class="card"><input id="pn" placeholder="Nome do produto"><div class="row" style="margin-top:8px"><input id="pp" inputmode="decimal" placeholder="Preço (R$)" onkeydown="if(event.key==='Enter')addProd()"><select id="pu" aria-label="Tipo de preço"><option value="un">Por unidade</option><option value="kg">Por kg</option></select><button onclick="addProd()">Cadastrar</button></div></div>`
 +(l.length?`<div class="card">${l.map(([k,p])=>`<div class="item"><span class="t">${esc(p.name)}${p.unit==='kg'?' <small style="color:var(--mute)">por kg</small>':''}</span><input class="pin" inputmode="decimal" value="${p.price||''}" placeholder="0,00" onchange="upProd('${ek(k)}',this.value)" aria-label="Preço"><button class="sec" onclick="prodToList('${ek(k)}')" aria-label="Adicionar à lista">＋</button><button class="ghost" onclick="delete S.prods[decodeURIComponent('${ek(k)}')];save();render()" aria-label="Excluir">✕</button></div>`).join('')}</div>`:'<div class="vazio">Nenhum produto cadastrado. Produtos adicionados à lista também ficam salvos aqui, com o último preço.</div>')}
function vHist(){
 if(!S.hist.length)return '<div class="vazio">Nenhuma compra finalizada. Ao finalizar uma lista, ela aparece aqui com o nome do mercado.</div>';
 return S.hist.map(h=>h.id===edH?histEdit():`<div class="card"><div class="row ent" onclick="aberto=aberto==='${h.id}'?null:'${h.id}';render()"><div style="flex:1"><strong>${esc(h.market)}</strong><div style="color:var(--mute);font-size:14px">${fmt(h.date,{day:'numeric',month:'short',year:'numeric'})}, ${h.items.length} itens</div></div><strong>${brl(h.total)}</strong></div>`
 +(aberto===h.id?`<div style="margin-top:8px">${h.items.map(x=>`<div class="item"><span class="t">${esc(x.title)} <small style="color:var(--mute)">${qtyTxt(x)} × ${brl(x.price)}${wt(x.unit)?'/kg':''}</small></span><b>${brl(lineTotal(x))}</b></div>`).join('')}<div class="row" style="margin-top:10px"><button class="sec" onclick="reuse('${h.id}')">Usar de novo</button><button class="sec" onclick="startH('${h.id}')">Editar</button><button class="ghost" onclick="ask('Excluir do histórico?',()=>{S.hist=S.hist.filter(x=>x.id!=='${h.id}');save();render()})">Excluir</button></div></div>`:'')+'</div>').join('')}
function vCompras(){
 const seg=`<div class="seg">${[['atual','Lista'],['prod','Produtos'],['hist','Histórico ('+S.hist.length+')']].map(a=>`<button class="${sub===a[0]?'on':''}" onclick="sub='${a[0]}';render()">${a[1]}</button>`).join('')}</div>`;
 return `<h2>Lista de compras</h2>`+seg+(sub==='atual'?vLista():sub==='prod'?vProdutos():vHist())}

function render(){head();if(!S.user.name){welcomeView();return}
 const f={agenda:vAgenda,cal:vCal,notas:vNotas,diario:vDiario,compras:vCompras}[tab];
 const a=document.activeElement,keep=a&&a.id&&a.tagName!=='BUTTON'?{id:a.id,v:a.value}:null;
 $('#v').innerHTML=f();
 if(keep&&$('#'+keep.id)&&tab!=='diario'){const e=$('#'+keep.id);if(e.type!=='date'){e.value=keep.v;}}
}
let edEv=null,edH=null,edD=null,edName=false;
function applyTheme(){const t=S.theme||'auto',r=document.documentElement;if(t==='auto')r.removeAttribute('data-theme');else r.dataset.theme=t;const b=$('#tb');if(b)b.textContent=t==='dark'?'🌙 Escuro':t==='light'?'☀️ Claro':'🌓 Auto'}
function cycleTheme(){S.theme={auto:'dark',dark:'light',light:'auto'}[S.theme||'auto'];save();applyTheme()}
function head(){applyTheme();const ok=!!S.user.name;$('nav').style.display=ok?'':'none';$('#so').style.display=ok?'':'none';
 const h=new Date().getHours(),s=h<12?'Bom dia':h<18?'Boa tarde':'Boa noite',dt=new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});
 $('#greet').innerHTML=!ok?'':edName?`<div class="card row"><input id="gn" value="${esc(S.user.name)}" maxlength="30" aria-label="Seu nome" onkeydown="if(event.key==='Enter')saveName()"><button onclick="saveName()">Salvar</button><button class="ghost" onclick="edName=false;head()">Cancelar</button></div>`:`<div class="row greet"><div style="flex:1"><div class="gt">${s}, ${esc(S.user.name)}!</div><div class="gd">${dt}</div></div><button class="sec" onclick="edName=true;head();$('#gn').focus()">✎ Nome</button></div>`}
function saveName(){const n=$('#gn').value.trim();if(!n){$('#gn').focus();return}S.user.name=n;edName=false;save();head()}
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
