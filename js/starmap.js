/* Live Map: an interactive 3D star map for the Star Citizen "Stanton" universe
 * (Stanton, Pyro, Nyx: systems, planets, moons, stations, jump points, search
 * across locations/ores/items/ships/commodities/blueprints/missions, live UEX
 * prices, live FleetYards 3D ship models, and player positions from a URL you
 * configure yourself, see config.js and docs/PLAYERS_API.md).
 *
 * Unofficial fan project. Not affiliated with or endorsed by Cloud Imperium
 * Games or Roberts Space Industries. Star Citizen(R) is a trademark of Cloud
 * Imperium Rights LLC. See CREDITS.md for all data/asset sources and licenses.
 *
 * Diese Datei ist ein inoffizielles Fan-Projekt und steht in keiner Verbindung
 * zu Cloud Imperium Games oder Roberts Space Industries.
 *
 * Call initLiveMap() once the DOM is ready (see index.html). It creates its
 * own fullscreen <canvas>, loads three.js via holo.js's loader, and mounts
 * the map UI. No login, no backend of ours required.
 */
(function(){
'use strict';
function esc(s){ return (s||'').replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
// ROOT ist der Mount-Container (siehe SCLMW.mount() unten): alle DOM-Ids sind mit einem Praefix
// eindeutig, koennen also weiter per document.getElementById gefunden werden, egal wo im Baum
// ROOT haengt. Neue Panels/Ueberlagerungen haengen sich an ROOT an, NIE an document.body --
// das waere die Gastseite. BASE ist der Basispfad fuer data/, vendor/three/, ... (SCLMW.mount()
// bzw. das eigene <script data-base> setzen ihn), damit die Karte unter jedem URL-Pfad laeuft.
// ROOT is the mount container (see SCLMW.mount() below): all DOM ids are unique via a prefix, so
// they can still be found with plain document.getElementById no matter where in the tree ROOT
// lives. New panels/overlays attach to ROOT, NEVER to document.body -- that would be the host
// page. BASE is the base path for data/, vendor/three/, ... (set by SCLMW.mount() or the script
// tag's data-base), so the map works under any URL path.
let ROOT=null, BASE='./';
function ID(name){ return 'sclmw-'+name; }
function $(id){ return document.getElementById(id.indexOf('sclmw-')===0?id:ID(id)); }
function pathOf(rel){ return BASE+rel; }
function rootW(){ return (ROOT&&ROOT.clientWidth)||window.innerWidth||999; }
// SC ist holo.js' Namensraum (siehe js/holo.js): fleetShip/holoMount/loadThree/... haengen dort,
// nicht als eigene window.xyz-Namen -- "ein globaler Name" gilt fuer beide Dateien zusammen.
// SC is holo.js' namespace (see js/holo.js): fleetShip/holoMount/loadThree/... live there, not
// as separate window.xyz names -- "one global name" covers both files together.
const SC=window.SCLMW=window.SCLMW||{};
// Fuer js/guides.js: Kartendaten, Basispfad, Kameraflug / for js/guides.js: map data, base path, camera flight
SC.data=()=>ST_DATA; SC.basePath=()=>BASE; SC.flyTo=o=>{ if(window.__stCtl) window.__stCtl.flyTo(o); };
// Oberflaechen-Sprache (js/i18n.js, EIGENSTAENDIG von ST_LANG unten -- das bleibt die alte
// Spieltexte-Umschaltung). t()/tn() sind kurze Aufrufe fuer den ganzen Rest dieser Datei.
// UI language (js/i18n.js, SEPARATE from ST_LANG below -- that stays the old game-text toggle).
// t()/tn() are short calls used throughout the rest of this file.
// _t/tn statt "t": "t" ist in dieser Datei ueberall als lokaler Variablenname belegt
// (Kurven-Parameter, Zeit, Tests...) -- ein globales "t" wuerde davon ueberdeckt.
// _t/tn instead of "t": "t" is used everywhere in this file as a local variable name
// (curve parameter, time, tests...) -- a global "t" would get shadowed by those.
const _t=(k,v)=>(SC.i18n?SC.i18n.t(k,v):k), tn=(n,o)=>(SC.i18n?SC.i18n.num(n,o):String(n));

// Galaxie: alle drei Systeme in einem Raum, Lage aus der RSI-Sternenkarte (1 Lichtjahr = ST_K Einheiten).
// Ebene "sys": 1 Einheit = 1 Mio km, Planeten und alles am Stern an der echten Position.
// Ebene "body": 1 Einheit = Radius des Planeten/Monds, Oberflaeche und Stationen echt, Mondabstaende gestaucht.
const ST_KIND={
  star:{c:'#fff2c0',l:'Stern'}, planet:{c:'#cfe0ee',l:'Planet'}, moon:{c:'#a9b4c4',l:'Mond'},
  city:{c:'#ffd76a',l:'Stadt'}, station:{c:'#37e1ff',l:'Station'}, reststop:{c:'#5ab8ff',l:'Raststation (Lagrange)'},
  gateway:{c:'#b072ff',l:'Gateway'}, jump:{c:'#ff7a3d',l:'Sprungpunkt'}, wikelo:{c:'#ff62ab',l:'Wikelo'},
  outpost:{c:'#38d39f',l:'Außenposten'}, miningbase:{c:'#e0a458',l:'Mining-Basis'}, lagrange:{c:'#c8b08a',l:'Asteroidenfeld (Lagrange)'},
  halo:{c:'#9c8b76',l:'Asteroidengürtel'}, comm:{c:'#8a9ab8',l:'Comm-Array'}, poi:{c:'#f0f0f0',l:'Ort von Interesse'},
  asteroid:{c:'#8a8070',l:'Einzel-Asteroid'}, belt:{c:'#b8ad9c',l:'Asteroidengürtel (Ort)'}, player:{c:'#4dff9a',l:'Spieler'}
};
// ST_KIND.l ist der interne (deutsche) Schluessel, NIE direkt anzeigen -- kindLabel() uebersetzt
// ihn live in die aktuelle Oberflaechensprache (siehe kind.* in js/i18n.js).
// ST_KIND.l is the internal (German) key, NEVER shown directly -- kindLabel() translates it live
// into the current UI language (see kind.* in js/i18n.js).
function kindLabel(k){ return ST_KIND[k]?_t('kind.'+k):k; }
const ST_K=8, ST_PULL=0.35;
const ST_IRREG={Delamar:2.7};   // Koerper, die als Asteroid statt Kugel gezeichnet werden (Wert = Form-Saat)
let ST_SYS='stanton';
const ST_THEME_SYS={amber:'stanton',red:'pyro',cyan:'nyx'};
const ST_SYSLOOK={
  stanton:{star:0xfff2c0,glow:0xffffff,light:0xfff2d0,belt:0x9c8b76,nebOp:.10,neb:[0x8a5aff,0x2ec6ff,0xff5aa0,0x5affc0,0x9a7aff,0x4ac6ff],sky:[0x8a5aff,0x2ec6ff,0xff5aa0,0x5affc0,0x9a7aff,0x6a7aff,0xff7ac0,0x4ac6ff,0xb06aff,0x7affd0],dot:'#ffb347'},
  pyro:{star:0xffb070,glow:0xff8a40,light:0xffb080,belt:0xa0705a,nebOp:.5,skyOp:.62,neb:[0xff4a2a,0xff8a3d,0xff2a3a,0xffa040,0xc4162a,0xff6a2a,0xe03a1a,0xffc060],sky:[0xff4a2a,0xff8a3d,0xff2a3a,0xffa040,0xc4162a,0xff6a2a,0xe03a1a,0xffc060,0xa02a1a,0xff7a4a],dot:'#ff5a4d'},
  nyx:{star:0xd8e8ff,glow:0x9ccaff,light:0xd0e4ff,belt:0x9ab0c0,nebOp:.3,skyOp:.5,neb:[0x2ec6ff,0x2affd0,0x4a7aff,0x6affea,0x1a9aff,0x3ad8ff,0x2a8aff,0x5affc8],sky:[0x2ec6ff,0x2affd0,0x4a7aff,0x6affea,0x1a9aff,0x3ad8ff,0x2a8aff,0x5affc8,0x1a6aff,0x7affe0],dot:'#37e1ff'}};
const ST_PSIZE={Hurston:.42,Crusader:.78,ArcCorp:.48,microTech:.54};
const ST_LOOK={Hurston:['#8a6146',0],Crusader:['#d9c088',1],ArcCorp:['#b8483a',0],microTech:['#cfe0ee',0],
  Arial:['#b0603a',0],Aberdeen:['#b9a24a',0],Magda:['#8a8a92',0],Ita:['#9c8c7a',0],Cellin:['#8f8f86',0],Daymar:['#c7a878',0],
  Yela:['#dfe8f2',0],Lyria:['#c9d8e8',0],Wala:['#a89c8c',0],Calliope:['#d8e4ef',0],Clio:['#c4d6e6',0],Euterpe:['#e6eef5',0],
  'Pyro I':['#8a4a32',0],Monox:['#c9a45a',0],Bloom:['#6f8a52',0],'Pyro IV':['#b07050',0],'Pyro V':['#e0a060',1],Terminus:['#8a8f9a',0],
  Ignis:['#b86a3a',0],Vatra:['#9a8a7a',0],Adir:['#a09080',0],Fairo:['#c8b8a0',0],Fuego:['#c0603a',0],Vuur:['#a07058',0],
  Delamar:['#5a544c',0],'Nyx I':['#6a7a8a',0],'Nyx II':['#8aa0b0',0],'Nyx III':['#b0c8d8',0]};
const ST_PRIO={player:2,belt:2,star:3,planet:3,gateway:2,moon:2,city:2,station:2,reststop:2,jump:2,wikelo:2,lagrange:1,poi:1,outpost:1,miningbase:0,comm:0,asteroid:0};
let ST_DATA=null, ST_HID=false, ST_PAUSE=false; const ST_VIS={};
let ST_LANG=(window.LIVEMAP_CONFIG&&window.LIVEMAP_CONFIG.DEFAULT_LANG)||'de'; try{ ST_LANG=localStorage.getItem('livemap_lang')||ST_LANG; }catch(e){}
const ST_AM_DE={'Buy Armor':'Rüstung kaufen','Buy Clothing':'Kleidung kaufen','Buy Ship Items and Weapons':'Schiffsteile & -waffen','Buy Weapons':'Waffen kaufen',
  'Buy and Rent Vehicles':'Fahrzeuge kaufen & mieten','Rent Vehicles':'Fahrzeuge mieten','Clinic':'Klinik','Hospital':'Krankenhaus','Docking':'Andocken',
  'Commodity Trading - Freight Elevator':'Warenhandel (Frachtaufzug)','Commodity Trading - Loading Dock':'Warenhandel (Ladedock)','Food Court':'Essen & Trinken',
  'Garage':'Garage','Hangar L':'Hangar L','Hangar XL':'Hangar XL','Landing Pad L':'Landeplatz L','Landing Pad M':'Landeplatz M','Refinery':'Raffinerie','Vehicle Services':'Fahrzeugservice'};
Object.keys(ST_KIND).forEach(k=>ST_VIS[k]=k!=='asteroid');
async function stLoad(){ if(ST_DATA) return ST_DATA;
  const js=u=>fetch(u,{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(u+' '+r.status); return r.json(); });
  const gal=await js(pathOf('data/galaxy.json')); const parts=await Promise.all(gal.systems.map(s=>js(pathOf('data/sys-'+s.k+'.json'))));
  const objects=[], mining={}, nofix={}, by={}, kids={}, sys={}; const base=gal.systems.find(s=>s.k==='stanton')||gal.systems[0];
  parts.forEach((d,i)=>{ const s=gal.systems[i]; d.objects.forEach(o=>{ o.sy=s.k; objects.push(o); }); Object.assign(mining,d.mining); Object.assign(nofix,d.nofix||{});
    sys[s.k]={k:s.k,n:s.n,img:s.img,d:s.d,dde:s.dde,star:d.objects.find(o=>o.k==='star'),
      off:[(s.ly[0]-base.ly[0])*ST_K,(s.ly[2]-base.ly[2])*ST_K,-(s.ly[1]-base.ly[1])*ST_K]}; });
  // Darstellung: Stanton um ST_PULL naeher an Pyro/Nyx geschoben (Nicos Wunsch), innerhalb der Systeme bleibt alles echt
  const oth=Object.values(sys).filter(s=>s.k!=='stanton'); if(sys.stanton&&oth.length){ const m=[0,1,2].map(i=>oth.reduce((a,s)=>a+s.off[i],0)/oth.length); sys.stanton.off=sys.stanton.off.map((v,i)=>v+(m[i]-v)*ST_PULL); }
  objects.forEach(o=>{ by[o.id]=o; }); objects.forEach(o=>{ if(o.p&&by[o.p]) (kids[o.p]=kids[o.p]||[]).push(o); });
  ST_DATA={d:{objects,mining,nofix,version:parts[0].version},by,kids,sys,gal,get star(){ return (sys[ST_SYS]||sys.stanton).star; }}; return ST_DATA; }
const stSysName=o=>(ST_DATA&&o&&ST_DATA.sys[o.sy]||{}).n||'';
function stMineLabel(k){ if(k==='HPP_AaronHalo') return 'Aaron Halo'; if(k==='AsteroidCluster_Medium_Yield') return _t('mine.asteroid_cluster_medium'); if(k==='AsteroidCluster_Low_Yield') return _t('mine.asteroid_cluster_low'); if(k==='HPP_Lagrange_Occupied') return _t('mine.lagrange_occupied'); if(k==='HPP_Stanton2c_Belt') return _t('mine.yela_belt');
  let m=k.match(/^HPP_Lagrange_(\w+)$/); if(m) return _t('mine.lagrange_type',{type:m[1]}); if(/^HPP_(Stanton|Pyro)\d/.test(k)) return _t('mine.surface'); if(k==='HPP_Pyro_DeepSpaceAsteroids') return _t('mine.deep_space_asteroids'); if(k==='HPP_Pyro_AkiroCluster') return 'Akiro Cluster';
  if(k==='HPP_Nyx_KeegerBelt') return 'Keeger Belt'; if(k==='HPP_Nyx_GlaciemRing') return 'Glaciem Ring'; m=k.match(/^HPP_Pyro_(Cool|Warm)0?(\d+)$/); if(m) return _t('mine.lagrange_temp',{temp:_t(m[1]==='Cool'?'mine.cold':'mine.warm'),n:m[2]});
  m=k.match(/^Loot_Caves_(Occupied|Unoccupied)_(Rock|Sand|Acidic)/); if(m) return _t('mine.cave',{material:_t({Rock:'mine.rock',Sand:'mine.sand',Acidic:'mine.acidic'}[m[2]]),occ:m[1]==='Occupied'?_t('mine.occupied_suffix'):''});
  return k.replace(/_/g,' '); }
const ST_TY_DE={'Mercenary':'Söldner','Hauling - Planetary':'Fracht (Planet)','Delivery':'Lieferung','Hauling':'Fracht','Bounty Hunter':'Kopfgeldjagd',
  'Priority':'Priorität','Investigation':'Ermittlung','Ship Mining':'Schiffs-Mining','Salvage':'Bergung','Refueling':'Betankung','Courier':'Kurier',
  'Hauling - Interstellar':'Fracht (interstellar)','Hauling - Stellar':'Fracht (System)','Hauling - Local':'Fracht (lokal)','Maintenance':'Wartung',
  'Hand Mining':'Hand-Mining','Ground Vehicle Mining':'ROC-Mining','Search':'Suche','Racing':'Rennen','Research':'Forschung','ECN Alert':'ECN-Alarm',
  'Appointment':'Termin','Job':'Job','Collection':'Sammeln'};
const stTy=t=>ST_LANG==='de'?(ST_TY_DE[t]||t):t;
let ST_MIS=null;
// Alle Blueprints mit Rezept (blueprints-build.py aus den Spieldaten). Laedt erst, wenn jemand Blueprints ansieht.
let ST_BPS=null;
async function stBps(){ if(ST_BPS) return ST_BPS; try{ ST_BPS=await fetch(pathOf('data/blueprints.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }); }catch(e){ return {bps:{}}; } return ST_BPS; }
async function stMis(){ if(ST_MIS) return ST_MIS; try{ const d=await fetch(pathOf('data/missions.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); }); const byLoc={};
  d.groups.forEach((g,i)=>g.locs.forEach(id=>(byLoc[id]=byLoc[id]||[]).push(i))); ST_MIS={d,byLoc}; return ST_MIS; }catch(e){ return {d:{groups:[],bps:{},lsets:[]},byLoc:{},failed:1}; } }
function stMisRow(g,i){ return '<details class="st-dep"><summary><b>'+esc(stTy(g.ty))+'</b>'+(g.il?'<em class="t-ill">illegal</em>':'')+'<span title="'+esc(_t('tooltip.mission_variants'))+'">'+g.n+'×</span></summary><div class="st-mis-b"><div class="sc-lmw-muted">'+esc(g.g)+(g.bp?' · 🧩 '+g.bp.length+' Blueprints':'')+'</div>'+(g.t.length?g.t.map(t=>'<div>· '+esc(t)+'</div>').join(''):'')+'</div></details>'; }
// ---- SPIELER: Position/Status kommen aus einer externen, konfigurierbaren Quelle (window.LIVEMAP_CONFIG.PLAYERS_URL). Siehe docs/PLAYERS_API.md. ----
let ST_PL=null, ST_PL_ERR='', ST_PL_ON=true, ST_PL_OFF=true, ST_PL_SIG='';
async function stLoadPlayers(){ try{ const cfg=window.LIVEMAP_CONFIG||{};
    const r=await fetch(cfg.PLAYERS_URL||pathOf('players.example.json'),{headers:cfg.PLAYERS_HEADERS||{},cache:'no-store'});
    if(!r.ok) throw new Error(r.status);
    const d=await r.json(); ST_PL=d.players||[]; ST_PL_ERR=''; }catch(e){ ST_PL_ERR='Spielerdaten gerade nicht erreichbar.'; if(!ST_PL) ST_PL=[]; }
  const sig=JSON.stringify(ST_PL.map(p=>[p.id,p.online,p.code,p.ship])); const ch=sig!==ST_PL_SIG; ST_PL_SIG=sig; return ch; }
const ST_ABBR={HUR:'Stanton1',CRU:'Stanton2',ARC:'Stanton3',MIC:'Stanton4'};
function stPlayerLoc(p){ const D=ST_DATA; if(!D||!p) return null; const code=String(p.code||'').replace(/^RR_S([1-4])_/i,(m,n)=>'RR_'+['HUR','CRU','ARC','MIC'][n-1]+'_'), low=code.toLowerCase(), nm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!D.tagIdx){ D.tagIdx={}; D.nameIdx={}; D.d.objects.forEach(o=>{ if(o.tag&&!D.tagIdx[o.tag.toLowerCase()]) D.tagIdx[o.tag.toLowerCase()]=o; const k=nm(o.n); if(k&&!D.nameIdx[k]&&!o.h) D.nameIdx[k]=o; }); }
  // System ZUERST aus dem Ortscode: das vom Tool gemeldete 'system' ist unzuverlaessig (RR_P6_LEO kam als 'Stanton' -> Spieler in der Sonne von Stanton)
  const sysOf=()=>{ const c=low.startsWith('pyro')||/^rr_p\d/.test(low)?'pyro':(low.startsWith('nyx')?'nyx':(low.startsWith('stanton')||/^rr_(hur|cru|arc|mic)/.test(low)?'stanton':'')); if(c) return c; const s=nm(p.system); return D.sys[s]?s:''; };
  const sy=sysOf();
  // 1) Klartext-Name des Servers (New Babbage, Levski, Orison ...)
  const byName=D.nameIdx[nm(p.location)]; if(byName&&(!sy||byName.sy===sy)) return byName;
  // 2) Ort hinter dem Unterstrich (Stanton4_NewBabbage, Nyx_Levski)
  const m1=code.match(/^[A-Za-z]+\d*[a-z]?_(.+)$/); if(m1){ const o=D.tagIdx[m1[1].toLowerCase()]||D.nameIdx[nm(m1[1].replace(/([a-z])([A-Z])/g,'$1 $2'))]; if(o) return o; }
  // 3) Raststationen und Orbit-Stationen: RR_CRU_L5, RR_CRU_LEO, RR_P2_L4, RR_JP_PyroStanton
  let m2=code.match(/^RR_(HUR|CRU|ARC|MIC)_L(\d)$/i); if(m2){ const o=D.d.objects.find(x=>x.k==='reststop'&&x.n.toUpperCase().startsWith(m2[1].toUpperCase()+'-L'+m2[2])); if(o) return o; }
  m2=code.match(/^RR_(HUR|CRU|ARC|MIC)_LEO$/i); if(m2){ const pl=D.tagIdx[ST_ABBR[m2[1].toUpperCase()].toLowerCase()]; const o=pl&&(D.kids[pl.id]||[]).find(x=>x.k==='station'); if(o) return o; }
  // Kennung 'pyroN' tragen auch alle Aussenposten des Planeten: gezielt den PLANETEN nehmen, nicht den ersten Treffer
  const pyPl=n=>D.d.objects.find(x=>x.k==='planet'&&String(x.tag||'').toLowerCase()==='pyro'+n);
  m2=code.match(/^RR_P(\d)_L(\d)$/i); if(m2){ const o=D.d.objects.find(x=>x.sy==='pyro'&&x.n.toUpperCase()==='PYR'+m2[1]+' L'+m2[2]); if(o) return o; const pl=pyPl(m2[1]); if(pl) return pl; }
  m2=code.match(/^RR_P(\d)_LEO$/i); if(m2){ const pl=pyPl(m2[1]); const o=pl&&D.d.objects.find(x=>x.p===pl.id&&x.k==='station'); if(o) return o; if(pl) return pl; }
  m2=code.match(/^RR_JP_([A-Z][a-z]+)([A-Z][a-z]+)$/); if(m2){ const here=(sy||m2[1].toLowerCase()), other=[m2[1],m2[2]].find(s=>s.toLowerCase()!==here)||m2[2]; const o=D.d.objects.find(x=>x.sy===here&&x.k==='gateway'&&x.n===other+' Gateway'); if(o) return o; }
  // 3b) GrimHEX & Co.: der ganze Code ist der Name
  { const o=D.nameIdx[nm(code)]; if(o&&(!sy||o.sy===sy)) return o; }
  // 3c) Sprungpunkt ohne Gateway (Stanton-Magnus, Nyx-Castra): der Sprungpunkt selbst
  { const mj=code.match(/^RR_JP_([A-Z][a-z]+)([A-Z][a-z]+)$/); if(mj){ const here=mj[1].toLowerCase(), to=mj[2].toLowerCase(); const o=D.d.objects.find(x=>x.sy===here&&/jump|poi|gateway/.test(x.k)&&x.n.toLowerCase().includes(to)); if(o) return o; } }
  // 4) Name aus den Teilen der Kennung (Stanton4a_RayariHydro_Kaltag -> Rayari Kaltag Research Outpost, Outpost_PAF_Stanton2b_Attritus_2 -> Attritus PAF-II)
  const body=stBodyFromCode(D,low), fz=stFuzzyLoc(D,code,sy||(body&&body.sy)||'',body); if(fz) return fz;
  // 5) sonst der Planet/Mond aus der Kennung (nie ein Aussenposten, der zufaellig dieselbe Kennung traegt)
  if(body) return body;
  // 6) nur das System ist bekannt: KEIN Punkt auf der Karte (frueher der Stern, dort sassen dann Spieler "in der Sonne"); die Liste zeigt den Ort als Text
  return null; }
// Monde eines Planeten, die in derselben Richtung stehen (Clio und Euterpe bei microTech), um mindestens minDeg auseinanderziehen.
// Nur die Richtung in der Bahnebene aendert sich, Hoehe und Abstand bleiben. Rueckgabe: id -> Richtung (Vector3, Laenge wie vorher)
function stSpread(list,minDeg){ const out={}, n=list.length, min=minDeg*Math.PI/180; if(!n) return out;
  const a=list.map(e=>({e,ang:Math.atan2(e.v.z,e.v.x)})).sort((p,q)=>p.ang-q.ang);
  if(n>1&&n*min<Math.PI*2) for(let it=0;it<40;it++){ let moved=false;
    for(let i=0;i<n;i++){ const j=(i+1)%n; let d=a[j].ang-a[i].ang; if(j===0) d+=Math.PI*2; if(d<min){ const k=(min-d)/2; a[i].ang-=k; a[j].ang+=k; moved=true; } }
    if(!moved) break; }
  a.forEach(x=>{ const v=x.e.v.clone(), h=Math.hypot(v.x,v.z); v.x=h*Math.cos(x.ang); v.z=h*Math.sin(x.ang); out[x.e.id]=v; });
  return out; }
function stBodyFromCode(D,low){ const m3=low.match(/(?:^|_)((?:stanton|pyro|nyx|terra)\d+[a-z]?)(?=_|$)/); if(!m3) return null; let t=m3[1];
  while(t.length>2){ const o=D.d.objects.find(x=>(x.k==='planet'||x.k==='moon')&&String(x.tag||'').toLowerCase()===t); if(o) return o; t=t.slice(0,-1); } return null; }
const ST_STOP=new Set(['rr','asd','outpost','col','m','indy','hmstd','trdp','mng','social','asteroidclusterbase','cluster','base','tsg','monorail','hydro','facility','research','station','the','of','and','mining','distributioncentre']);
function stFuzzyLoc(D,code,sy,body){ const rom={1:'i',2:'ii',3:'iii',4:'iv',5:'v',6:'vi',7:'vii',8:'viii'};
  const toks=code.replace(/([a-z])([A-Z])/g,'$1_$2').toLowerCase().split(/[_\-\s]+/).filter(t=>t&&!ST_STOP.has(t)&&!/^(stanton|pyro|nyx|terra)\d*[a-z]?$/.test(t));
  const words=toks.filter(t=>/[a-z]/.test(t)&&t.length>=3), nums=toks.filter(t=>/^\d+$/.test(t));
  if(!words.length) return null;
  let best=null, bs=0;
  for(const o of D.d.objects){ if(sy&&o.sy!==sy) continue; if(o.k==='star'||o.k==='planet'&&!words.length) continue;
    const nt=String(o.n||'').toLowerCase().split(/[\s\-_.·]+/).filter(Boolean), flat=nt.join('');
    let sc=0, w=0; words.forEach(t=>{ if(nt.includes(t)||flat.includes(t)&&t.length>=5){ sc+=3; w++; } });
    if(!w) continue;
    nums.forEach(n=>{ const k=String(+n); if(nt.some(x=>x===n||x===k||x.endsWith(n)||x===rom[+n])) sc+=1; });
    if(body&&(o.p===body.id||o.id===body.id)) sc+=1; if(!o.h) sc+=0.5;
    if(sc>bs){ bs=sc; best=o; } }
  return best; }
// Ort gilt als frisch, wenn die letzte Ortsmeldung juenger als 15 Minuten ist (online heisst nur: das Tool laeuft)
function stLocFresh(p){ const t=Date.parse(String(p.when||p.last_seen||'').replace(' ','T')); return !!t&&Date.now()-t<15*60000; }   // 'when' optional (Zeit der letzten Ortsmeldung), sonst last_seen
function stAgo(ts){ const d=Date.parse(String(ts||'').replace(' ','T')); if(!d) return _t('location.unknown'); const m=Math.max(0,Math.round((Date.now()-d)/60000));
  return m<2?_t('time.just_now'):m<60?_t('time.ago_min',{n:m}):m<1440?_t('time.ago_hour',{n:Math.round(m/60)}):_t('time.ago_day',{n:Math.round(m/1440)}); }
function stPlayerObj(p){ const o=stPlayerLoc(p); if(!o) return null; return {id:'pl-'+p.id,n:p.name||p.player||_t('entity.player'),k:'player',sy:o.sy,p:o.id,x:o.x,y:o.y,z:o.z,pl:p,loc:o,on:!!p.online}; }
function stOpenGroup(g){ const L=g.grp, nOn=L.filter(x=>x.on).length;
  const body=stCard(nOn?'#4dff9a':'#8a93a6',(g.loc&&g.loc.n)||_t('player.multiple'),nOn?_t('player.here_count_online',{n:L.length,on:nOn}):_t('player.here_count',{n:L.length}));
  body.innerHTML=L.map((x,i)=>{ const p=x.pl; return '<div class="st-pr" data-gi="'+i+'" style="cursor:pointer"><div><b>'+(x.on?'<span style="color:#4dff9a">●</span> ':'<span class="sc-lmw-muted">○</span> ')+esc(x.n)+'</b><span>'+esc([p.location||(x.loc&&x.loc.n)||'',x.on?_t('status.online'):_t('status.offline_last',{time:stAgo(p.last_seen||p.when)}),p.ship||''].filter(Boolean).join(' · '))+'</span></div><em>'+_t('action.profile')+'</em></div>'; }).join('');
  body.querySelectorAll('[data-gi]').forEach(r=>r.onclick=()=>stOpenPlayer(L[+r.getAttribute('data-gi')].pl)); }
async function stOpenPlayer(p){ const o=stPlayerLoc(p), sysn=o?stSysName(o):(p.system||'');
  const body=stCard(p.online?'#4dff9a':'#8a93a6',p.name||_t('entity.player'),(p.online?_t('status.online'):_t('status.offline_last',{time:stAgo(p.last_seen||p.when)}))+(sysn?' · '+sysn:''));
  const C=await uexCatalog(), sh=p.ship?C.ships.find(s=>s.n===p.ship):null, b=o?stBodyOf(o):null;
  let h='<div class="st-pl-top"><div class="st-pl-st'+(p.online?' on':'')+'">'+(p.online?_t('status.online_dot'):_t('status.offline_dot',{time:esc(stAgo(p.last_seen||p.when))}))+'</div></div>';
  if(p.travel){ const dl=stDestLoc(p.travel); h+='<div class="st-jump">'+(p.travel.from?_t('travel.jump_from_to',{from:'<b>'+esc(p.travel.from)+'</b>',to:'<b>'+esc(p.travel.to)+'</b>'}):_t('travel.jump_to',{to:'<b>'+esc(p.travel.to)+'</b>'}))+' '+(p.travel.at?'<em>'+esc(stAgo(p.travel.at))+'</em>':'')+(dl?'<button class="sc-lmw-btn sm primary" id="'+ID('stPlDest')+'" data-to="'+dl.id+'">'+_t('action.show_destination')+'</button>':'')+'</div>'; }
  h+='<div class="st-slbl">📍 '+(p.online&&stLocFresh(p)?_t('location.here_now'):p.online?_t('location.last_report',{time:esc(stAgo(p.when))}):_t('location.last_seen'))+'</div><div class="st-pr"'+(o?' data-oid="'+o.id+'"':'')+'><div><b>'+esc(p.location||(o&&o.n)||_t('location.unknown'))+'</b><span>'+esc([b&&b!==o&&b.k!=='star'?b.n:'',sysn].filter(Boolean).join(' · '))+'</span></div>'+(o?'<em>'+_t('action.fly_to')+'</em>':'')+'</div>';
  if(p.ship) h+='<div class="st-slbl">🚀 '+_t('label.ship')+'</div><div id="'+ID('stPlShipV')+'">'+(sh&&stShipImg(sh)?'<img class="st-shipimg" src="'+esc(stShipImg(sh))+'" alt="" onerror="this.remove()">':'')+'</div>'+'<div style="font-size:.88rem">'+esc(p.ship)+'</div>';
  body.innerHTML=h; stWirePrices(body);
  // 3D-Holo des Schiffs, wenn FleetYards eins liefert (Groessen-Check in modelUrl), sonst bleibt das Bild
  if(p.ship&&SC.fleetShip) SC.fleetShip(sh?sh.n:p.ship).then(fy=>{ const v=$('stPlShipV'); if(!fy||!v) return null; return SC.modelUrl(fy,true).then(url=>{ if(!url) return; const im=v.querySelector('img'); v.innerHTML='<div class="holo-box sm" data-holo="'+esc(url)+'" data-fallback="'+esc(im?im.getAttribute('src'):'')+'"></div>'; SC.holoMount(v); }); });
  const pd=$('stPlDest'); if(pd) pd.onclick=()=>{ const t=ST_DATA.by[pd.getAttribute('data-to')]; if(t){ window.__stCtl.flyTo(t); } };
}
const ST_WK_TABS=[['ship','wikelo.tab.ship'],['Armor','wikelo.tab.armor'],['Personal Weapons','wikelo.tab.weapons'],['other','wikelo.tab.other'],['favor','wikelo.tab.favor']];
function stWkCat(w){ if(w.rw.some(r=>r[0]==='Wikelo Favor')) return 'favor'; if(w.k==='ship') return 'ship'; return (w.cat==='Armor'||w.cat==='Personal Weapons')?w.cat:'other'; }
async function stWikeloHTML(box){ const M=await stMis(), W=(M.d.wikelo||[]), C=await uexCatalog(); if(!box||!ROOT.contains(box)) return;
  if(!W.length){ box.innerHTML=''; return; }
  const shipOf=n=>C.ships.filter(s=>n.indexOf(s.n)===0).sort((a,b)=>b.n.length-a.n.length)[0];
  const row=w=>{ const sh=w.k==='ship'?shipOf(w.t):null, im=sh&&stShipImg(sh), fav=stWkCat(w)==='favor';
    const ttl=fav?w.cost.map(c=>c[0]).join(' + ')+' → '+(w.rw.find(r=>r[0]==='Wikelo Favor')||[,1])[1]+'× Wikelo Favor':w.t;
    return '<details class="st-dep st-wk"><summary>'+(im?'<img src="'+esc(im)+'" alt="" onerror="this.remove()">':'')+'<b>'+esc(ttl)+'</b><span title="Wikelo-Ruf">+'+w.rep+'</span></summary><div class="st-mis-b">'+
      '<div class="st-wk-h">'+_t('wikelo.you_get')+'</div>'+w.rw.map(r=>'<div>· '+esc(r[0])+(r[1]>1?' ×'+r[1]:'')+'</div>').join('')+
      '<div class="st-wk-h">'+_t('wikelo.you_give')+'</div>'+(w.cost.length?w.cost.map(c=>'<div>· '+esc(c[0])+(c[1]?(c[2]==='scu'?' · '+c[1]+' SCU':' ×'+c[1]):'')+'</div>').join(''):'<div class="sc-lmw-muted">'+_t('wikelo.nothing_specified')+'</div>')+
      (w.pre.length?'<div class="st-wk-h">'+_t('label.requirement')+'</div>'+w.pre.map(p=>'<div>· '+esc(p)+'</div>').join(''):'')+'</div></details>'; };
  const draw=tab=>{ const L=W.filter(w=>stWkCat(w)===tab); box.querySelector('.st-wk-list').innerHTML=(tab==='favor'?'<p class="st-mnote" style="margin:0 0 8px">'+_t('wikelo.favor_note')+'</p>':'')+(L.map(row).join('')||'<p class="sc-lmw-muted" style="font-size:.8rem">'+_t('common.nothing_in_category')+'</p>');
    box.querySelectorAll('[data-wkt]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-wkt')===tab)); };
  box.innerHTML='<div class="st-slbl">'+_t('wikelo.title')+' <span class="st-cnt">'+_t('wikelo.offers',{n:W.length})+'</span></div><div class="st-wk-tabs">'+ST_WK_TABS.map(tb=>'<button data-wkt="'+tb[0]+'">'+_t(tb[1])+' <span>'+W.filter(w=>stWkCat(w)===tb[0]).length+'</span></button>').join('')+'</div><div class="st-wk-list"></div>';
  box.querySelectorAll('[data-wkt]').forEach(b=>b.onclick=()=>draw(b.getAttribute('data-wkt'))); draw('ship'); }
// Was es an einem Ort zu kaufen gibt (alle Nicht-Waren-Terminals, live von UEX)
async function stShopHTML(o,box){ const C=await uexCatalog(); const byI={}; C.items.forEach(x=>{ if(x.k!=='c') byI[x.i]=x; }); const shipI={}; C.ships.forEach(s=>{ shipI[s.i]=s; });
  const T=(o.terms||[]).filter(t=>!/^(commodity|refinery|fuel)/.test(t.t||'')).slice(0,10);
  const lists=await Promise.all(T.map(t=>/vehicle/.test(t.t||'')?stGet(UEX_BASE+'/vehicles_purchases_prices?id_terminal='+t.id).then(r=>r.map(x=>({ship:shipI[x.id_vehicle],price:x.price_buy,term:t.n}))):stGet(UEX_BASE+'/items_prices?id_terminal='+t.id).then(r=>r.map(x=>({item:byI[x.id_item]||{n:x.item_name,i:x.id_item,s:''},price:x.price_buy,term:t.n})))));
  if(!box||!ROOT.contains(box)) return;
  // gleiche Items/Schiffe an mehreren Terminals: einmal, guenstigster Preis, Terminals zusammen
  const mm={}; [].concat(...lists).filter(x=>x.price>0&&(x.item||x.ship)).forEach(x=>{ const k=(x.ship?'s':'i')+((x.ship||x.item).i||(x.ship||x.item).n); const y=mm[k];
    if(!y) mm[k]=Object.assign({},x,{terms:[x.term]}); else { if(x.price<y.price) y.price=x.price; if(y.terms.indexOf(x.term)<0) y.terms.push(x.term); y.term=y.terms.length>1?_t('count.terminals',{n:y.terms.length}):y.terms[0]; } });
  const all=Object.values(mm); if(!all.length){ box.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('shop.none')+'</p>'; return; }
  const rk=x=>x.ship?0:(x.item.s?1:2); all.sort((a,b)=>rk(a)-rk(b)||String(a.ship?'':a.item.s).localeCompare(String(b.ship?'':b.item.s))||(a.ship||a.item).n.localeCompare((b.ship||b.item).n));
  const draw=q=>{ const L=all.filter(x=>!q||(x.ship||x.item).n.toLowerCase().indexOf(q)>=0||((x.item||{}).s||'').toLowerCase().indexOf(q)>=0); let last='';
    box.querySelector('.st-shop-l').innerHTML=L.slice(0,200).map((x,i)=>{ const sec=x.ship?_t('cat.ship'):(x.item.s||_t('common.misc2')), hd=sec!==last?'<div class="st-rh">'+esc(sec)+'</div>':''; last=sec;
      return hd+'<div class="st-pr" data-si="'+all.indexOf(x)+'"><div><b>'+esc((x.ship||x.item).n)+'</b><span>'+esc(x.term)+'</span></div><em>'+uexMoney(x.price)+'</em></div>'; }).join('')+(L.length>200?'<p class="sc-lmw-muted" style="font-size:.78rem">'+_t('shop.more_filter',{n:L.length-200})+'</p>':'');
    box.querySelectorAll('[data-si]').forEach(el=>el.onclick=()=>{ const x=all[+el.getAttribute('data-si')]; if(x.ship) stOpenBuy('ship',x.ship); else if(x.item.i) stOpenBuy('item',x.item); }); };
  box.innerHTML='<input class="st-shop-f" placeholder="'+esc(_t('shop.filter_placeholder',{n:all.length}))+'"><div class="st-shop-l"></div>'; box.querySelector('.st-shop-f').oninput=e=>draw(e.target.value.trim().toLowerCase()); draw(''); }
function stDestLoc(tr){ if(!tr) return null; return stPlayerLoc({code:tr.to_raw||'',location:tr.to||'',system:''}); }
function stBodyOf(o){ const D=ST_DATA; let x=o; while(x&&x.k!=='planet'&&x.k!=='moon'&&x.k!=='star') x=D.by[x.p]; return x||D.star; }

function stantonScene(canvas,sysKey){
  if(!canvas || !window.THREE) return null;
  if(window.__stCtl&&window.__stCtl._cleanup){ try{ window.__stCtl._cleanup(); }catch(e){} }   // nie zwei Karten gleichzeitig (doppelte Listener, Zombie-Schleife)
  if(sysKey) ST_SYS=sysKey;
  const T=THREE;
  const renderer=new T.WebGLRenderer({canvas:canvas,antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(42,1,0.004,4000);
  const lblLayer=document.createElement('div'); lblLayer.className='st-lbls'; (canvas.parentNode||ROOT).appendChild(lblLayer);
  // Groesse/Koordinaten IMMER relativ zum Mount-Container (ROOT), nie zum Browser-Fenster: sonst
  // liesse sich die Karte nur als Vollbild-Seite einbetten, nicht in einer kleinen Box irgendwo
  // auf einer fremden Seite. Size/coordinates ALWAYS relative to the mount container (ROOT), never
  // the browser window: otherwise the map could only be embedded as a fullscreen page, never in a
  // small box somewhere on a host page.
  function boxWH(){ return {w:ROOT.clientWidth||1,h:ROOT.clientHeight||1}; }
  function relXY(cx,cy){ const r=ROOT.getBoundingClientRect(); return {x:cx-r.left,y:cy-r.top}; }
  function size(){ const b=boxWH(); renderer.setSize(b.w,b.h,false); camera.aspect=b.w/b.h; camera.updateProjectionMatrix(); isMobile=b.w<700; }
  const explore=()=>ROOT.classList.contains('st-explore');
  let isMobile=boxWH().w<700;
  // Himmel (folgt der Kamera, damit er auf jeder Ebene gleich aussieht)
  const sky=new T.Group(); scene.add(sky); const skyNeb=[];
  { const N=1900, pos=new Float32Array(N*3); for(let i=0;i<N;i++){ const r=380+Math.random()*900, th=Math.random()*6.283, ph=Math.acos(2*Math.random()-1); pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph); pos[i*3+2]=r*Math.sin(ph)*Math.sin(th); }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(pos,3)); sky.add(new T.Points(g,new T.PointsMaterial({color:0xffffff,size:1.2,sizeAttenuation:false}))); }
  function glowTex(cols){ const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,0,64,64,64);cols.forEach(s=>g.addColorStop(s[0],s[1]));x.fillStyle=g;x.fillRect(0,0,128,128);return new T.CanvasTexture(c); }
  const neb=glowTex([[0,'rgba(140,100,255,.5)'],[0.5,'rgba(60,120,255,.16)'],[1,'rgba(0,0,0,0)']]);
  [[-220,80,-320,0x8a5aff,300],[300,-60,-380,0x2ec6ff,340],[100,150,-500,0xff5aa0,280],[-320,-120,-240,0x5affc0,240],[260,210,-600,0x9a7aff,360],[-120,-160,-180,0x6a7aff,160],[160,-30,-200,0xff7ac0,140],[40,180,-260,0x4ac6ff,150],[-260,120,-420,0xb06aff,200],[210,90,-300,0x7affd0,150]].forEach(n=>{ const s=new T.Sprite(new T.SpriteMaterial({map:neb,color:n[3],transparent:true,opacity:.38,blending:T.AdditiveBlending,depthWrite:false})); s.position.set(n[0],n[1],n[2]); s.scale.set(n[4],n[4],1); sky.add(s); skyNeb.push(s); });
  function tintSky(k){ const L=ST_SYSLOOK[k]||ST_SYSLOOK.stanton, pal=L.sky; skyNeb.forEach((s,i)=>{ s.material.color.setHex(pal[i%pal.length]); s.material.opacity=L.skyOp||.38; }); }
  const sunGlowTex=glowTex([[0,'rgba(255,240,180,.95)'],[0.4,'rgba(255,190,90,.4)'],[1,'rgba(255,150,50,0)']]);
  const dotTex=(function(){ const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');x.beginPath();x.arc(16,16,11,0,7);x.fillStyle='#fff';x.fill();x.lineWidth=4;x.strokeStyle='rgba(0,0,0,.75)';x.stroke();return new T.CanvasTexture(c); })();
  function iconTex(draw){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); x.lineJoin='round'; x.lineCap='round';
    const pass=(col,w)=>{ x.strokeStyle=col; x.fillStyle=col; x.lineWidth=w; draw(x,w); }; pass('rgba(0,0,0,.85)',9); pass('#fff',4.5); return new T.CanvasTexture(c); }
  const ICON={
    station:iconTex((x,w)=>{ x.beginPath(); x.arc(32,32,13,0,7); x.stroke(); x.beginPath(); x.arc(32,32,4+w/4,0,7); x.fill();
      x.beginPath(); x.moveTo(6,32); x.lineTo(19,32); x.moveTo(45,32); x.lineTo(58,32); x.stroke(); x.strokeRect(4,24,6,16); x.strokeRect(54,24,6,16); }),
    gateway:iconTex((x,w)=>{ x.beginPath(); x.arc(32,32,22,0,7); x.stroke(); x.beginPath(); x.arc(32,32,13,0,7); x.stroke(); x.beginPath(); x.moveTo(32,4); x.lineTo(32,12); x.moveTo(32,52); x.lineTo(32,60); x.stroke(); }),
    city:iconTex((x,w)=>{ x.strokeRect(10,30,12,26); x.strokeRect(26,14,12,42); x.strokeRect(42,24,12,32); x.beginPath(); x.moveTo(6,57); x.lineTo(58,57); x.stroke(); })};
  ICON.player=iconTex((x,w)=>{ x.beginPath(); x.arc(32,19,9,0,7); x.fill(); x.beginPath(); x.moveTo(14,56); x.quadraticCurveTo(14,33,32,33); x.quadraticCurveTo(50,33,50,56); x.closePath(); x.fill(); });
  const ICONOF={player:ICON.player,station:ICON.station,reststop:ICON.station,wikelo:ICON.station,gateway:ICON.gateway,city:ICON.city};
  const sunLight=new T.PointLight(0xfff2d0,2.6,0); scene.add(sunLight); scene.add(new T.AmbientLight(0x24304a,0.6));
  function surf(base,bands){ const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle=base;x.fillRect(0,0,256,128);
    if(bands){ for(let i=0;i<14;i++){ x.fillStyle='rgba('+(60+Math.random()*40|0)+','+(40+Math.random()*30|0)+',10,'+(0.06+Math.random()*0.12)+')'; x.fillRect(0,Math.random()*128,256,3+Math.random()*9); } }
    else { for(let i=0;i<150;i++){ const rr=2+Math.random()*7,px=Math.random()*256,py=Math.random()*128; x.fillStyle='rgba(0,0,0,'+(0.05+Math.random()*0.12)+')'; x.beginPath();x.arc(px,py,rr,0,7);x.fill(); x.fillStyle='rgba(255,255,255,'+(0.03+Math.random()*0.06)+')'; x.beginPath();x.arc(px-1,py-1,rr*0.6,0,7);x.fill(); } }
    return new T.CanvasTexture(c); }
  // Unregelmaessige Koerper (Asteroiden wie Delamar): Ikosaeder mit fester Knubbel-Verformung, laenglich gestreckt
  function rockGeo(rad,seed){ const g=new T.SphereGeometry(rad,128,80), P=g.attributes.position, v=new T.Vector3();
    // feste Zufallszahlen aus der Saat, damit der Stein immer gleich aussieht
    let sd=Math.floor(seed*1000)||1; const rnd=()=>{ sd=(sd*16807)%2147483647; return (sd-1)/2147483646; };
    const dirs=[]; for(let i=0;i<9;i++){ const u=rnd()*2-1, t=rnd()*6.283, q=Math.sqrt(1-u*u); dirs.push({d:new T.Vector3(q*Math.cos(t),u,q*Math.sin(t)), a:(rnd()<0.4?-1:1)*(0.18+rnd()*0.36), k:2+rnd()*4}); }
    const pits=[]; for(let i=0;i<14;i++){ const u=rnd()*2-1, t=rnd()*6.283, q=Math.sqrt(1-u*u); pits.push({d:new T.Vector3(q*Math.cos(t),u,q*Math.sin(t)), r:0.05+rnd()*0.14, dep:0.04+rnd()*0.08}); }
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).normalize(); let n=0;
      dirs.forEach(L=>{ n+=L.a*Math.exp(-(1-v.dot(L.d))*L.k); });                       // grosse Buckel und Einbuchtungen
      n+=Math.sin(v.x*7.1+seed)*0.035+Math.sin(v.y*9.7+seed*1.3)*0.03+Math.sin(v.z*13.3+seed*2.1)*0.02;   // Unebenheiten
      n+=Math.abs(Math.sin((v.x*5.3+v.y*3.1+v.z*4.7)*2.2+seed))*-0.05;                   // scharfe Grate
      pits.forEach(C=>{ const x=(1-v.dot(C.d))/C.r; if(x<1) n-=C.dep*(1-x*x); });         // Krater
      v.multiplyScalar(rad*Math.max(0.45,1+n)); v.x*=1.55; v.y*=0.78; v.z*=1.1; P.setXYZ(i,v.x,v.y,v.z); }
    g.computeVertexNormals(); return g; }
  function bodyMesh(o,rad){ const lk=ST_LOOK[o.n]||['#9a9a9a',0], irr=ST_IRREG[o.n];
    const m=new T.Mesh(irr?rockGeo(rad,irr):new T.SphereGeometry(rad,48,48),new T.MeshStandardMaterial({map:surf(lk[0],lk[1]),roughness:.97,metalness:.02}));
    if(irr) m.material.color.setScalar(0.72); spin.push(m); return m; }
  function ringPoints(G,rin,rout,thick,n,color){ const a=new Float32Array(n*3); for(let i=0;i<n;i++){ const rr=rin+Math.random()*(rout-rin), th=Math.random()*6.283; a[i*3]=rr*Math.cos(th); a[i*3+1]=(Math.random()-0.5)*thick; a[i*3+2]=rr*Math.sin(th); }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3)); const p=new T.Points(g,new T.PointsMaterial({color:color,size:1.5,sizeAttenuation:false})); G.add(p); return p; }
  function stripeTex(){ const c=document.createElement('canvas'); c.width=256; c.height=16; const x=c.getContext('2d'); const g=x.createLinearGradient(0,0,256,0); g.addColorStop(0,'rgba(255,255,255,.12)'); g.addColorStop(.45,'rgba(255,255,255,1)'); g.addColorStop(.55,'rgba(255,255,255,1)'); g.addColorStop(1,'rgba(255,255,255,.12)'); x.fillStyle=g; x.fillRect(0,0,256,16); const t=new T.CanvasTexture(c); t.wrapS=t.wrapT=T.RepeatWrapping; return t; }

  let level={t:'sys',o:null}, grp=null, entries=[], spin=[], animNodes=[], lastEx=null, wormTex=[], sysTick=0, sysGroups=[];
  const LV={sys:{min:0.8,max:1000,def:isMobile?64:52,bgMin:isMobile?52:46,bgMax:isMobile?82:58}, body:{min:1.35,max:36,def:isMobile?7.5:4.4}};
  let az=0.6, el=isMobile?0.75:0.5, azT=az, elT=el, R=LV.sys.def, RT=R;
  const OFF={}, ZERO=new T.Vector3(); const offOf=k=>OFF[k]||((ST_DATA&&ST_DATA.sys[k])?(OFF[k]=new T.Vector3().fromArray(ST_DATA.sys[k].off)):ZERO);
  const Vs=(o)=>new T.Vector3(o.x*1e-6, o.z*1e-6, -o.y*1e-6).add(offOf(o.sy));
  let BGK=1; function bgScale(){ const S=ST_DATA&&ST_DATA.sys[ST_SYS]; if(!S) return; const pl=(ST_DATA.kids[S.star.id]||[]).filter(o=>o.k==='planet'); const m=Math.max(1,...pl.map(o=>Math.hypot(o.x,o.y,o.z)/1e6)); BGK=Math.max(0.7,m/43.4); }
  const pSize=pl=>ST_PSIZE[pl.n]||Math.min(0.85,Math.max(0.3,0.3+0.2*Math.log10(Math.max(pl.r||300,100)/300)));
  function descendants(id,skip){ const D=ST_DATA, out=[]; (function walk(pid){ (D.kids[pid]||[]).forEach(c=>{ if(skip(c)) return; out.push(c); walk(c.id); }); })(id); return out; }
  function addMarkers(list,posFn){ const byK={};
    list.forEach(o=>{ if(!ST_VIS[o.k]) return; if(o.h&&!ST_HID) return; const p=posFn(o); if(!p) return; entries.push({o,p,prio:ST_PRIO[o.k]||0}); (byK[o.k]=byK[o.k]||[]).push(p); });
    Object.keys(byK).forEach(k=>{ const ps=byK[k], a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
      const ic=ICONOF[k]; grp.add(new T.Points(g,new T.PointsMaterial({color:(ST_KIND[k]||{}).c||'#fff',size:ic?(isMobile?22:20):(k==='asteroid'?4:(isMobile?9:8)),sizeAttenuation:false,map:ic||dotTex,transparent:true,alphaTest:0.3}))); }); }
  // Dashboard: nur das gewaehlte System, Planeten kreisen. Karte: alle drei Systeme, echte Positionen, Wurmloecher.
  function buildSys(){ const D=ST_DATA, anim=!explore(); sunLight.intensity=0;
    (anim?[D.sys[ST_SYS]||D.sys.stanton]:Object.values(D.sys)).forEach(S=>buildOneSys(S,anim));
    if(!anim) buildLinks(); }
  function buildOneSys(S,anim){ const G0=grp, sg=new T.Group(); sg.userData.sys=S.k; G0.add(sg); sysGroups.push(sg); grp=sg; const e0=entries.length;
    try{ buildOneSysInner(S,anim); } finally { grp=G0; for(let i=e0;i<entries.length;i++) entries[i].sys=S.k; } }
  function buildOneSysInner(S,anim){ const D=ST_DATA, star=S.star, c0=offOf(S.k), look=ST_SYSLOOK[S.k]||ST_SYSLOOK.stanton, sr=S.k==='stanton'?1.9:1.3;
    const sun=new T.Mesh(new T.SphereGeometry(sr,48,48),new T.MeshBasicMaterial({color:look.star})); sun.position.copy(c0); grp.add(sun); spin.push(sun);
    const gl=new T.Sprite(new T.SpriteMaterial({map:sunGlowTex,color:look.glow,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); gl.scale.set(sr*7,sr*7,1); gl.position.copy(c0); grp.add(gl);
    const L=new T.PointLight(look.light,2.6,260,1); L.position.copy(c0); grp.add(L);
    entries.push({o:star,p:c0.clone(),body:true,r:sr,prio:3});
    // Gasnebel des Systems (Pyro rot-orange, Nyx blau-tuerkis)
    look.neb.forEach((col,i)=>{ const a=i*2.399+S.k.length, rr=45+(i*37%70), s=new T.Sprite(new T.SpriteMaterial({map:neb,color:col,transparent:true,opacity:look.nebOp,blending:T.AdditiveBlending,depthWrite:false}));
      s.position.set(c0.x+Math.cos(a)*rr,c0.y+((i%3)-1)*14,c0.z+Math.sin(a)*rr); const sc=110+(i*53%120); s.scale.set(sc,sc,1); grp.add(s); });
    if(star.ring&&ST_VIS.halo){ const p=ringPoints(grp,star.ring.in*1e-6,star.ring.out*1e-6,0.12,4200,look.belt); p.position.copy(c0); }
    (D.kids[star.id]||[]).filter(o=>o.k==='belt'&&o.belt).forEach(b=>{ if(!ST_VIS.halo) return; const pc=Vs(D.by[b.p]||star), w=Math.max(0.9,(b.belt.out-b.belt.in)*1e-6);
      const p=ringPoints(grp,b.belt.in*1e-6-w/2,b.belt.out*1e-6+w/2,Math.max(0.2,b.belt.depth*1e-6),S.k==='nyx'?7000:3000,look.belt); p.position.copy(pc); });
    (D.kids[star.id]||[]).filter(o=>o.k==='planet').forEach(pl=>{
      const pp=Vs(pl), d=pp.distanceTo(c0), rad=pSize(pl);
      { const n=360, a=new Float32Array(n*3); for(let i=0;i<n;i++){ const t=i/n*Math.PI*2; a[i*3]=d*Math.cos(t); a[i*3+2]=d*Math.sin(t); } const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3)); const ol=new T.LineLoop(g,new T.LineBasicMaterial({color:0x5a78a8,transparent:true,opacity:.35})); ol.position.copy(c0); grp.add(ol); }
      const pivot=new T.Object3D(); pivot.position.copy(c0); grp.add(pivot); const holder=new T.Object3D(); holder.position.copy(pp).sub(c0); pivot.add(holder);
      const m=bodyMesh(pl,rad); holder.add(m); entries.push({o:pl,p:pp.clone(),body:true,r:rad,prio:3,node:holder});
      if(anim) animNodes.push({o:pivot,s:0.0012*Math.pow(12.85/d,1.5)});
      const mDir=stSpread((D.kids[pl.id]||[]).filter(o=>o.k==='moon').map(mo=>({id:mo.id,v:Vs(mo).sub(pp).normalize()})),28);
      (D.kids[pl.id]||[]).filter(o=>o.k==='moon').forEach((mo,i)=>{ if(!ST_VIS.moon) return;
        const dir=mDir[mo.id].clone(), dist=Math.hypot(mo.x-pl.x,mo.y-pl.y,mo.z-pl.z);
        const off=dir.multiplyScalar(rad+0.28*Math.log10(dist/pl.r));
        const mp=new T.Object3D(); holder.add(mp); const mm=bodyMesh(mo,0.09); mm.position.copy(off); mp.add(mm);
        entries.push({o:mo,p:pp.clone().add(off),body:true,r:0.09,prio:2,node:mm});
        if(anim) animNodes.push({o:mp,s:0.004}); });   // alle Monde eines Planeten gleich schnell: sonst holen sie sich ein und kleben wieder aneinander
    });
    (D.kids[star.id]||[]).filter(o=>o.k==='moon'&&ST_VIS.moon).forEach(mo=>{ const mp=Vs(mo), mm=bodyMesh(mo,0.16); mm.position.copy(mp); grp.add(mm); entries.push({o:mo,p:mp,body:true,r:0.16,prio:2}); });
    addMarkers(descendants(star.id,c=>c.k==='planet'||c.k==='moon').filter(o=>!anim||o.k==='gateway'),Vs);
  }
  // Spieler: an ihrem Ort; liegt der Ort auf einem Planeten/Mond, sitzt die Figur ueber dessen Kugel
  let plPts=[];
  function buildPlayers(){ plPts=[]; if(!explore()||!ST_PL||!ST_PL.length||!ST_VIS.player) return; const D=ST_DATA, byAnchor={}, on=[], off=[];
    // Mehrere Spieler am selben Ort (Nico, 28.09.2026): EIN Schild "Levski · 4 Spieler", Tippen klappt die Liste auf
    const seen=[];
    ST_PL.forEach(p=>{ if(p.online?!ST_PL_ON:!ST_PL_OFF) return; const po=stPlayerObj(p); if(!po) return; let pos=null, key, anc=po.loc;
      if(level.t==='sys'){ const b=stBodyOf(po.loc), eb=b&&b.k!=='star'?entries.find(e=>e.o.id===b.id):null;
        if(eb){ pos=eb.p.clone().add(new T.Vector3(0,eb.r+0.14,0)); key=b.id; anc=b; } else { pos=Vs(po.loc); key=po.loc.id; } }
      else { let x=po.loc; while(x&&x.id!==level.o.id) x=D.by[x.p]; if(!x) return; const F=level.o, s=1/F.r;
        if(po.loc.id===F.id){ pos=new T.Vector3(0,ST_IRREG[F.n]?1.5:1.18,0); } else { pos=new T.Vector3((po.loc.x-F.x)*s,(po.loc.z-F.z)*s,-(po.loc.y-F.y)*s); pos.setLength(Math.max(pos.length(),ST_IRREG[F.n]?1.32:1.07)); } key=po.loc.id; }
      if(!byAnchor[key]){ byAnchor[key]={pos,anc,sy:po.sy,list:[]}; seen.push(key); } byAnchor[key].list.push(po); });
    seen.forEach(key=>{ const g=byAnchor[key], L=g.list, sys=level.t==='sys'?g.sy:null;
      if(L.length===1){ entries.push({o:L[0],p:g.pos,prio:2,sys}); (L[0].on?on:off).push(g.pos); return; }
      L.sort((a,b)=>(b.on-a.on)||String(a.n).localeCompare(String(b.n)));
      const same=L.every(x=>x.loc&&x.loc.id===L[0].loc.id), place=same?L[0].loc:g.anc;   // alle am selben Ort -> Ortsname (Levski), sonst der Planet
      const nOn=L.filter(x=>x.on).length, go={id:'grp-'+key,n:(place&&place.n?place.n+' · ':'')+(nOn?_t('player.here_group_online',{n:L.length,on:nOn}):_t('player.here_group',{n:L.length})),k:'player',grp:L,sy:g.sy,loc:place,on:nOn>0,pl:{}};
      entries.push({o:go,p:g.pos,prio:2,sys}); (nOn?on:off).push(g.pos); });
    if(level.t==='sys') entries.filter(e=>e.o.k==='player'&&e.o.pl.travel).forEach(e=>{ const dl=stDestLoc(e.o.pl.travel); if(!dl) return; const b=stBodyOf(dl), eb=b&&b.k!=='star'?entries.find(x=>x.o.id===b.id):null, to=eb?eb.p.clone().add(new T.Vector3(0,eb.r+0.1,0)):Vs(dl);
      const g=new T.BufferGeometry().setFromPoints([e.p,to]); const ln=new T.Line(g,new T.LineDashedMaterial({color:0x4dff9a,dashSize:0.6,gapSize:0.4,transparent:true,opacity:.85,depthTest:false})); ln.computeLineDistances(); ln.renderOrder=5; ln.userData.sys=e.sys; plPts.push(ln); grp.add(ln); });
    const bySys={}; entries.filter(e=>e.o.k==='player').forEach(e=>{ const k=(e.sys||'-')+'|'+(e.o.on?1:0); (bySys[k]=bySys[k]||[]).push(e.p); });
    Object.keys(bySys).forEach(k=>{ const [sy,onl]=k.split('|'), ps=bySys[k], a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
      const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
      const pt=new T.Points(g,new T.PointsMaterial({color:onl==='1'?0x4dff9a:0x8a93a6,size:isMobile?24:22,sizeAttenuation:false,map:ICON.player,transparent:true,alphaTest:0.3,depthTest:false})); pt.renderOrder=6; pt.userData.sys=sy==='-'?null:sy; if(sy==='-') pt.userData.sys=ST_SYS; plPts.push(pt); grp.add(pt); }); }
  // Wurmloecher zwischen den Toren: Schlangen-Roehre mit fliessenden Lichtstreifen, Farbe von System A nach B
  function buildLinks(){ const D=ST_DATA; wormTex=[];
    (D.gal.links||[]).forEach(l=>{ const A=D.by[l.a], B=D.by[l.b]; if(!A||!B) return; const pa=Vs(A), pb=Vs(B);
      if(!l.live){ const g=new T.BufferGeometry().setFromPoints([pa,pb]); const ln=new T.Line(g,new T.LineDashedMaterial({color:0x8aa0c8,dashSize:6,gapSize:5,transparent:true,opacity:.35})); ln.computeLineDistances(); grp.add(ln); return; }
      const dir=pb.clone().sub(pa), len=dir.length(); dir.normalize();
      const up=Math.abs(dir.y)<0.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0), n1=new T.Vector3().crossVectors(dir,up).normalize(), n2=new T.Vector3().crossVectors(dir,n1).normalize();
      const pts=[], amp=len*0.05; for(let i=0;i<=28;i++){ const t=i/28, env=Math.sin(Math.PI*t); pts.push(pa.clone().lerp(pb,t).addScaledVector(n1,Math.sin(t*Math.PI*4)*amp*env).addScaledVector(n2,Math.cos(t*Math.PI*3)*amp*0.6*env)); }
      const curve=new T.CatmullRomCurve3(pts), ca=new T.Color((ST_SYSLOOK[l.sa]||ST_SYSLOOK.stanton).dot), cb=new T.Color((ST_SYSLOOK[l.sb]||ST_SYSLOOK.stanton).dot);
      const cen=Object.keys(D.sys).map(k=>offOf(k)), vp=new T.Vector3();
      [[0.2,1],[0.7,0.28]].forEach(([rad,op])=>{ const geo=new T.TubeGeometry(curve,320,rad,8,false), uv=geo.attributes.uv, P=geo.attributes.position, cols=new Float32Array(uv.count*3);
        for(let i=0;i<uv.count;i++){ vp.fromBufferAttribute(P,i); const dmin=Math.min(...cen.map(c=>c.distanceTo(vp))), s=Math.min(1,Math.max(0,(dmin-30)/30)), f=0.4+0.6*s*s*(3-2*s);
          const c=ca.clone().lerp(cb,uv.getX(i)).multiplyScalar(f); cols[i*3]=c.r; cols[i*3+1]=c.g; cols[i*3+2]=c.b; } geo.setAttribute('color',new T.BufferAttribute(cols,3));
        const tex=stripeTex(); tex.repeat.set(12,1); wormTex.push(tex);
        grp.add(new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,vertexColors:true,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}))); }); }); }
  function buildBody(F){ const D=ST_DATA, s=1/F.r;
    const rel=o=>new T.Vector3((o.x-F.x)*s,(o.z-F.z)*s,-(o.y-F.y)*s);
    const m=bodyMesh(F,1); grp.add(m); entries.push({o:F,p:new T.Vector3(),body:true,r:1,prio:3});
    const toStar=new T.Vector3(-F.x,-F.z,F.y).normalize();
    sunLight.intensity=2.6; sunLight.color.setHex((ST_SYSLOOK[F.sy]||ST_SYSLOOK.stanton).light); sunLight.position.copy(toStar).multiplyScalar(900);
    const sg=new T.Sprite(new T.SpriteMaterial({map:sunGlowTex,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); sg.position.copy(toStar).multiplyScalar(900); sg.scale.set(60,60,1); grp.add(sg);
    if(F.ring&&ST_VIS.halo) ringPoints(grp,F.ring.in*s,F.ring.out*s,0.01,2600,0xb8ad9c);
    const bDir=stSpread((D.kids[F.id]||[]).filter(o=>o.k==='moon').map(mo=>({id:mo.id,v:rel(mo)})),14);
    (D.kids[F.id]||[]).filter(o=>o.k==='moon').forEach(mo=>{ if(!ST_VIS.moon) return;
      const v0=rel(mo), q=v0.length(), d=q>3?3+4*Math.log10(q/3):q, v=bDir[mo.id].clone().setLength(d);
      const rad=Math.max(mo.r*s,0.14); const mm=bodyMesh(mo,rad); mm.position.copy(v); grp.add(mm); entries.push({o:mo,p:v,body:true,r:rad,prio:2}); });
    const lift=ST_IRREG[F.n]?1.22:1.012;
    addMarkers(descendants(F.id,c=>c.k==='moon'),o=>{ const v=rel(o); if(v.length()<lift) v.setLength(lift); return v; });
  }
  function dispose(g){ g.traverse(x=>{ if(x.geometry) x.geometry.dispose(); if(x.material){ if(x.material.map&&x.material.map!==dotTex&&x.material.map!==sunGlowTex&&x.material.map!==neb&&!Object.values(ICON).includes(x.material.map)) x.material.map.dispose(); x.material.dispose(); } }); }
  function rebuild(){ if(!ST_DATA) return;
    if(grp){ scene.remove(grp); dispose(grp); } grp=new T.Group(); scene.add(grp); entries=[]; spin=[]; animNodes=[]; sysGroups=[]; lblLayer.innerHTML='';
    camera.near=level.t==='sys'?0.05:0.004; camera.updateProjectionMatrix();
    if(level.t==='sys') buildSys(); else buildBody(level.o);
    buildPlayers();
    entries.sort((a,b)=>b.prio-a.prio);
    entries.forEach(e=>{ const d=document.createElement('div'); d.className='st-lbl p'+e.prio; d.textContent=e.o.n; lblLayer.appendChild(d); e.el=d; });
    if(typeof drawHl==='function') drawHl();
    if(window.__stCtl&&window.__stCtl.onLevel) window.__stCtl.onLevel(level); }
  // Blickziel: ausserhalb des Easter-Eggs immer die Sonne, im Erkunden-Modus frei verschiebbar (nur Systemebene)
  const tgt=new T.Vector3(), tgtT=new T.Vector3();
  function focus(o){
    if(!o||o.k==='star'){ let b=level.o; while(b&&b.k!=='planet') b=ST_DATA.by[b.p]; level={t:'sys',o:null};
      if(b&&explore()){ tgtT.copy(Vs(b)); tgt.copy(tgtT); R=2.5; RT=7; } else { tgtT.copy(offOf(ST_SYS)); tgt.copy(tgtT); R=Math.min(R*3,120); RT=explore()?30:LV.sys.def; } }
    else { level={t:'body',o}; setSys(o.sy); tgtT.set(0,0,0); tgt.set(0,0,0); R=LV.body.max; RT=LV.body.def; }
    rebuild();
    // Beim Anflug zum wichtigsten Ort des Koerpers drehen (Stadt/Station, z. B. Levski auf Delamar, Lorville auf Hurston)
    if(level.t==='body'){ const top=entries.find(e=>!e.body&&e.prio>=2&&e.p.length()<1.6); if(top){ const v=top.p; azT=Math.atan2(v.x,v.z); elT=Math.max(-1.1,Math.min(1.1,Math.asin(v.y/(v.length()||1)))); } } }
  function setSys(k){ if(!k||k===ST_SYS) return; ST_SYS=k; tintSky(k); if(window.__stCtl&&window.__stCtl.onSys) window.__stCtl.onSys(k); }
  function home(){ hl=null; if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } tgtT.copy(offOf(ST_SYS)); RT=explore()?(isMobile?84:44):LV.sys.def; }
  function goSystem(k){ hl=null; setSys(k); if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } tgtT.copy(offOf(k)); RT=isMobile?84:48; }
  function galaxy(){ hl=null; if(level.t!=='sys'){ level={t:'sys',o:null}; rebuild(); } const c=new T.Vector3(); Object.keys(ST_DATA.sys).forEach(k=>c.add(offOf(k))); tgtT.copy(c.divideScalar(Object.keys(ST_DATA.sys).length)); RT=isMobile?900:620; }
  let hl=null;
  function lookAtMarker(e){ if(level.t==='sys'){ tgtT.copy(e.p); clampT(); RT=Math.min(RT,5); }
    else { const v=e.p.clone(); azT=Math.atan2(v.x,v.z); elT=Math.max(-1.2,Math.min(1.3,Math.asin(v.y/(v.length()||1)))); RT=Math.max(1.6,Math.min(RT,3)); } }
  function flyTo(o){ if(!ST_DATA||!o) return; const b=stBodyOf(o); setSys(o.sy);
    if(b.k==='star'){ if(level.t!=='sys') focus(null); } else if(!(level.o&&level.o.id===b.id)) focus(b);
    hl=o.id; const e=entries.find(x=>x.o.id===o.id);
    if(e&&!e.body) lookAtMarker(e); else if(o.k==='star'){ tgtT.copy(offOf(o.sy)); RT=Math.min(RT,60); } }
  // Verdeckt? Nur auf Koerper-Ebene: Strahl Kamera->Punkt schneidet die Kugel r=1 im Ursprung
  const tmp=new T.Vector3(), tmp2=new T.Vector3();
  function behind(p){ if(level.t==='sys') return false; const c=camera.position; tmp2.copy(p).sub(c); const L=tmp2.length(); tmp2.divideScalar(L); const b=c.dot(tmp2), disc=b*b-(c.lengthSq()-1); if(disc<0) return false; const t=-b-Math.sqrt(disc); return t>0&&t<L-1e-4; }
  function scr(p){ tmp.copy(p).project(camera); const b=boxWH(); return tmp.z>1?null:{x:(tmp.x+1)/2*b.w,y:(1-tmp.y)/2*b.h}; }
  function scrRadius(e){ const a=scr(e.p); if(!a) return 0; tmp2.copy(camera.up).multiplyScalar(e.r).add(e.p); const b=scr(tmp2); return b?Math.hypot(a.x-b.x,a.y-b.y):0; }
  const eVis=e=>true;   // Nico 23.09.2026: andere Systeme werden beim Zoomen nie ausgeblendet
  function nearest(cx,cy,maxPx){ let best=null,bs=1e9;
    for(const e of entries){ if(!eVis(e)) continue; const s=scr(e.p); if(!s) continue; const dd=Math.hypot(s.x-cx,s.y-cy);
      if(e.body){ const rr=Math.max(14,scrRadius(e)); if(dd<rr){ const sc=12+dd*0.2; if(sc<bs){bs=sc;best=e;} } }
      else if(dd<maxPx && !behind(e.p)){ const sc=dd-e.prio*0.5; if(sc<bs){bs=sc;best=e;} } }
    return best; }
  function pickAt(cx,cy){ if(!explore()||!ST_DATA) return; const e=nearest(cx,cy,isMobile?18:12); if(!e) return; const o=e.o;
    if((o.k==='planet'||o.k==='moon')&&!(level.o&&level.o.id===o.id)) focus(o);
    else if(o.k==='star'){ setSys(o.sy); if(level.t!=='sys') focus(null); tgtT.copy(offOf(o.sy)); }
    else if(!e.body) lookAtMarker(e);
    hl=o.id; if(typeof window.openStPanel==='function') window.openStPanel(o); }
  let hover=null, hoverReq=false, hx=0, hy=0, hlSet=null;
  // Namen erst in der Naehe: Kameraabstand je Rang (System: Mio km, Koerper: Radien). Rang 3 steht immer.
  const LBL={sys:[3,7,18],body:[1.6,2.3,6]};
  function labels(){ const ex=explore(), _b=boxWH(), W=_b.w, H=_b.h, placed=[], cp=camera.position;
    const isHl=e=>hlVis&&hlVis.has(e.o.id), isF=e=>e.o.id===hl||e===hover||(e.o.k==='player'&&(e.o.on||e.o.grp)&&(!e.sys||e.sys===ST_SYS));   // Online-Spieler anderer Systeme nicht erzwingen: deren Namen standen sonst perspektivisch vor der Sonne
    const order=hlVis||hl||hover?entries.filter(isF).concat(entries.filter(e=>!isF(e)&&isHl(e)),entries.filter(e=>!isF(e)&&!isHl(e))):entries;
    for(const e of order){ const d=e.el; if(!d) continue; if(!eVis(e)){ d.style.transform='translate(-9999px,0)'; continue; } const o=e.o, force=isF(e), mark=isHl(e);
      const dc=cp.distanceTo(e.p); let show=force||mark||o.k==='star'||(e.prio>=3&&(!ex||level.t!=='sys'||dc<260))||(ex&&e.prio<3&&dc<LBL[level.t][e.prio]);
      let s=null; if(show){ s=scr(e.p); if(!s||s.x<-50||s.x>W+50||s.y<-20||s.y>H+20) show=false; else if(!e.body&&behind(e.p)) show=false; }
      if(show){ const w=o.n.length*(e.prio>=3?9:6.4)+8, h=16, x=s.x-w/2, y=s.y-(e.body?Math.max(10,scrRadius(e))+14:18);
        if(!force&&placed.some(r=>x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y)) show=false; else { placed.push({x,y,w,h}); d.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)'; } }
      if(!show) d.style.transform='translate(-9999px,0)'; d.classList.toggle('hl',force||mark); } }
  size();
  let raf=0, dragging=false, panning=false, lastX=0, lastY=0, downX=0, downY=0, uiDown=false;
  const onUI=(e)=> !!(e&&e.target&&e.target.closest&&e.target.closest('.st-loc-card,.st-zoom,.stx,.st-side,.st-crumb'));
  const clampR=v=>explore()?Math.max(LV[level.t].min,Math.min(LV[level.t].max,v)):Math.max(LV.sys.bgMin*BGK,Math.min(LV.sys.bgMax*BGK,v));
  const canNav=()=>explore()&&level.t==='sys';
  const ray=new T.Raycaster(), ndc=new T.Vector2(), plane=new T.Plane(new T.Vector3(0,1,0),0);
  function clampT(){ if(tgtT.length()>800) tgtT.setLength(800); }
  function groundAt(cx,cy){ const b=boxWH(); ndc.set(cx/(b.w||1)*2-1,-(cy/(b.h||1))*2+1); ray.setFromCamera(ndc,camera); plane.constant=-tgt.y;
    const p=new T.Vector3(); if(!ray.ray.intersectPlane(plane,p)) return null; return p.distanceTo(tgt)>R*4?null:p; }
  // Zoomen zum Mauszeiger: der Punkt unter dem Zeiger bleibt stehen
  function zoomBy(f,cx,cy){ const nr=clampR(RT*f); if(canNav()&&cx!=null){ const p=groundAt(cx,cy); if(p){ tgtT.add(p.sub(tgtT).multiplyScalar(1-nr/RT)); clampT(); } } RT=nr; }
  function pan(dx,dy){ if(!canNav()) return; const s=R*0.9/(boxWH().h||1), sy=s/Math.max(0.35,Math.sin(Math.abs(el)));
    tgtT.x+=-dx*Math.cos(az)*s-dy*Math.sin(az)*sy; tgtT.z+=dx*Math.sin(az)*s-dy*Math.cos(az)*sy; clampT(); }
  // Alle Zeiger-/Rad-/Tastatur-Listener haengen am CANVAS bzw. an ROOT, NIE an window: eine Karte
  // in einer kleinen Box auf einer fremden Seite darf nicht deren Mausrad, Rechtsklick oder
  // Pfeiltasten global abfangen. ROOT bekommt dafuer tabindex, sonst kann ein <div> nie Tastatur-
  // Fokus haben. All pointer/wheel/keyboard listeners attach to the CANVAS or ROOT, never window:
  // a map in a small box on someone else's page must not globally hijack their wheel, right-click
  // or arrow keys. ROOT gets a tabindex for that, or a <div> could never receive keyboard focus.
  if(ROOT.tabIndex<0||ROOT.tabIndex==null) ROOT.tabIndex=0;
  const down=(e)=>{ ROOT.focus&&ROOT.focus({preventScroll:true}); uiDown=onUI(e); if(uiDown) return; const pb=e.button===2||(e.button===0&&(e.shiftKey||e.ctrlKey));
    if(e.button!==undefined&&e.button!==0&&!pb) return; if(pb&&canNav()) panning=true; else if(e.button===0||e.button===undefined) dragging=true;
    lastX=e.clientX; lastY=e.clientY; downX=e.clientX; downY=e.clientY; };
  const up=(e)=>{ const wasUI=uiDown, wasPan=panning; uiDown=false; dragging=false; panning=false; if(!wasUI&&!wasPan&&e&&e.button===0&&(Math.abs(e.clientX-downX)+Math.abs(e.clientY-downY))<6){ const p=relXY(e.clientX,e.clientY); pickAt(p.x,p.y); } };
  const dragK=()=>level.t==='body'?Math.min(1,Math.max(0.12,(R-1)/3)):1;
  const rot=(dx,dy)=>{ const b=boxWH(); azT+=dx/(b.w||1)*3.2*dragK(); elT=Math.max(-1.25,Math.min(1.35,elT+dy/(b.h||1)*2.4*dragK())); };
  const move=(e)=>{ if(panning){ pan(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; }
    else if(dragging){ rot(e.clientX-lastX,e.clientY-lastY); lastX=e.clientX; lastY=e.clientY; }
    else if(explore()&&!onUI(e)){ const p=relXY(e.clientX,e.clientY); hx=p.x; hy=p.y; hoverReq=true; } };
  const ctxm=(e)=>{ if(explore()&&!onUI(e)) e.preventDefault(); };
  let ro=null;
  const wheel=(e)=>{ if(onUI(e)) return; e.preventDefault(); const p=relXY(e.clientX,e.clientY); if(explore()) zoomBy(Math.pow(1.0016,e.deltaY),p.x,p.y); else RT=clampR(RT+(e.deltaY>0?1.1:-1.1)); };
  const key=(e)=>{ if(!explore()||(e.target&&/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) return; const k=e.key.toLowerCase(), st=40;
    if(k==='arrowleft'||k==='a') pan(st,0); else if(k==='arrowright'||k==='d') pan(-st,0); else if(k==='arrowup'||k==='w') pan(0,st); else if(k==='arrowdown'||k==='s') pan(0,-st);
    else if(k==='q') azT-=0.12; else if(k==='e') azT+=0.12; else if(k==='+'||k==='=') zoomBy(0.8); else if(k==='-') zoomBy(1.25); else return; e.preventDefault(); };
  canvas.addEventListener('mousedown',down); window.addEventListener('mouseup',up); window.addEventListener('mousemove',move);
  canvas.addEventListener('wheel',wheel,{passive:false}); canvas.addEventListener('contextmenu',ctxm); ROOT.addEventListener('keydown',key);
  if(window.ResizeObserver){ ro=new ResizeObserver(()=>size()); ro.observe(ROOT); } else { window.addEventListener('resize',size); }
  let pinchD=0, lastTX=null, lastTY=null, midX=null, midY=null, tsx=0, tsy=0, tMoved=false, tUI=false;
  const tStart=(e)=>{ ROOT.focus&&ROOT.focus({preventScroll:true}); tUI=onUI(e); if(e.touches&&e.touches.length===1){ tsx=e.touches[0].clientX; tsy=e.touches[0].clientY; tMoved=false; } };
  const touch=(e)=>{ if(tUI) return; if(e.touches&&e.touches.length===1){ const t=e.touches[0]; if(lastTX!=null) rot(t.clientX-lastTX,t.clientY-lastTY); if(Math.abs(t.clientX-tsx)+Math.abs(t.clientY-tsy)>8) tMoved=true; lastTX=t.clientX; lastTY=t.clientY; if(e.cancelable) e.preventDefault(); }
    else if(e.touches&&e.touches.length===2){ const a=e.touches[0], b=e.touches[1], d=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY), mx=(a.clientX+b.clientX)/2, my=(a.clientY+b.clientY)/2;
      if(pinchD){ if(explore()){ const p=relXY(mx,my); zoomBy(pinchD/d,p.x,p.y); if(midX!=null) pan(mx-midX,my-midY); } else RT=clampR(RT+(pinchD-d)*0.05); }
      pinchD=d; midX=mx; midY=my; lastTX=null; tMoved=true; if(e.cancelable) e.preventDefault(); } };
  const touchEnd=(e)=>{ if(!tUI&&e&&e.changedTouches&&e.changedTouches.length&&!tMoved&&(Math.abs(e.changedTouches[0].clientX-tsx)+Math.abs(e.changedTouches[0].clientY-tsy))<10){ const p=relXY(e.changedTouches[0].clientX,e.changedTouches[0].clientY); pickAt(p.x,p.y); } if(!e.touches||e.touches.length<2){ pinchD=0; midX=null; midY=null; } lastTX=null; lastTY=null; };
  canvas.addEventListener('touchstart',tStart,{passive:true}); canvas.addEventListener('touchmove',touch,{passive:false}); canvas.addEventListener('touchend',touchEnd);
  function cleanup(){ cancelAnimationFrame(raf); window.__stCtl=null; canvas.removeEventListener('mousedown',down); window.removeEventListener('mouseup',up); window.removeEventListener('mousemove',move); if(ro) ro.disconnect(); else window.removeEventListener('resize',size); canvas.removeEventListener('wheel',wheel); canvas.removeEventListener('contextmenu',ctxm); ROOT.removeEventListener('keydown',key); canvas.removeEventListener('touchstart',tStart); canvas.removeEventListener('touchmove',touch); canvas.removeEventListener('touchend',touchEnd); if(grp) dispose(grp); lblLayer.remove(); try{ renderer.dispose(); }catch(e){} }
  let loopErr=false;
  function loop(){ if(!canvas.isConnected){ cleanup(); return; } raf=requestAnimationFrame(loop); try{
    if(!ST_PAUSE&&!dragging&&!panning) azT+=explore()?0.0003:0.00045;
    if(!ST_PAUSE) spin.forEach(m=>{ m.rotation.y+=0.0012; });
    const ex=explore(); if(ex!==lastEx){ lastEx=ex; if(ST_DATA&&level.t==='sys') rebuild(); }
    if(!ex){ if(level.t!=='sys') focus(null); tgtT.copy(offOf(ST_SYS)); }
    else if(level.t==='sys'&&ST_DATA&&++sysTick%30===0){ let bk=null,bd=1e9; Object.keys(ST_DATA.sys).forEach(k=>{ const dd=offOf(k).distanceTo(tgtT); if(dd<bd){ bd=dd; bk=k; } }); if(bd<180) setSys(bk); }
    wormTex.forEach(t=>{ t.offset.x-=0.006; });
    sysGroups.forEach(g=>{ g.visible=true; }); if(plPts) plPts.forEach(p=>{ p.visible=true; });
    if(animNodes.length){ animNodes.forEach(a=>{ a.o.rotation.y+=a.s; }); entries.forEach(e=>{ if(e.node) e.node.getWorldPosition(e.p); }); }
    az+=(azT-az)*0.08; el+=(elT-el)*0.08; R+=(RT-R)*0.07; tgt.lerp(tgtT,0.1);
    camera.position.set(tgt.x+R*Math.cos(el)*Math.sin(az),tgt.y+R*Math.sin(el),tgt.z+R*Math.cos(el)*Math.cos(az)); camera.lookAt(tgt); sky.position.copy(camera.position);
    renderer.render(scene,camera);
    if(hoverReq){ hoverReq=false; const e=nearest(hx,hy,10); hover=(e&&!e.body)?e:null; }
    labels(); }catch(err){ if(!loopErr){ loopErr=true; console.error('Live Map, Fehler im Bildaufbau:',err); } } }
  const ringTex=(function(){ const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.beginPath();x.arc(32,32,24,0,7);x.lineWidth=6;x.strokeStyle='#fff';x.stroke();return new T.CanvasTexture(c); })();
  let hlPts=null;
  let hlVis=null;
  function drawHl(){ if(hlPts){ scene.remove(hlPts); hlPts.geometry.dispose(); hlPts.material.dispose(); hlPts=null; } hlVis=null; if(!hlSet) return;
    const on=new Set(entries.map(e=>e.o.id)); hlVis=new Set(); hlSet.forEach(id=>{ let x=ST_DATA.by[id]; while(x&&!on.has(x.id)) x=ST_DATA.by[x.p]; if(x&&x.k!=='star') hlVis.add(x.id); });
    const ps=entries.filter(e=>hlVis.has(e.o.id)).map(e=>e.p); if(!ps.length) return; const a=new Float32Array(ps.length*3); ps.forEach((p,i)=>{a[i*3]=p.x;a[i*3+1]=p.y;a[i*3+2]=p.z;});
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(a,3));
    hlPts=new T.Points(g,new T.PointsMaterial({color:0xffd76a,size:isMobile?26:24,sizeAttenuation:false,map:ringTex,transparent:true,depthTest:false,alphaTest:0.2})); hlPts.renderOrder=5; scene.add(hlPts); }
  function highlight(ids){ hlSet=ids&&ids.length?new Set(ids):null; if(hlSet){ hl=null; home(); } drawHl(); }
  window.__stCtl={ _cleanup:cleanup, getAz:()=>az, level:()=>level, focus, flyTo, rebuild, home, zoomBy, pan, highlight, goSystem, galaxy, onSys:null,
    setSystem:k=>{ if(!k) return; ST_SYS=k; tintSky(k); if(!explore()&&ST_DATA){ bgScale(); rebuild(); tgtT.copy(offOf(k)); tgt.copy(tgtT); RT=LV.sys.def*BGK; } },
    zoom01:()=>{ const L=LV[level.t]; return (Math.log(RT)-Math.log(L.min))/(Math.log(L.max)-Math.log(L.min)); },
    setZoom01:t=>{ const L=LV[level.t]; RT=Math.exp(Math.log(L.min)+t*(Math.log(L.max)-Math.log(L.min))); },
    debug:()=>({R,RT,tgt:tgt.toArray(),tgtT:tgtT.toArray(),level:level.t}), pos:n=>{ const e=entries.find(x=>x.o.n===n); return e?e.p.toArray():null; }, links:()=>(ST_DATA.gal.links||[]).map(l=>({l:l.sa+'-'+l.sb,live:l.live,a:ST_DATA.by[l.a]&&ST_DATA.by[l.a].n,b:ST_DATA.by[l.b]&&ST_DATA.by[l.b].n,pa:ST_DATA.by[l.a]&&Vs(ST_DATA.by[l.a]).toArray().map(v=>+v.toFixed(1)),pb:ST_DATA.by[l.b]&&Vs(ST_DATA.by[l.b]).toArray().map(v=>+v.toFixed(1))})), tubes:()=>wormTex.length,
    reset:()=>{ hl=null; hover=null; hlSet=null; drawHl(); if(level.t!=='sys') focus(null);
      const th=document.querySelector('.cmd'), tk=th&&ST_THEME_SYS[th.getAttribute('data-dtheme')]; if(tk){ ST_SYS=tk; tintSky(tk); } bgScale(); tgtT.copy(offOf(ST_SYS)); RT=LV.sys.def*BGK; }, onLevel:null };
  tintSky(ST_SYS);
  stLoad().then(()=>{ bgScale(); tgtT.copy(offOf(ST_SYS)); tgt.copy(tgtT); RT=R=LV.sys.def*BGK; rebuild(); }).catch(()=>{});
  loop();
  return cleanup;
}
// Zwei GETRENNTE Sprach-Knoepfe, klar unterscheidbar am Tooltip (Nico's Vorgabe, die alte
// Funktion bleibt erhalten): "stLang" ist der ALTE Knopf (Spieltexte: Missionstypen,
// Ausstattungsnamen, INI-Beschreibung, steuert ST_LANG). "stUiLang" ist NEU und steuert nur die
// Oberflaeche selbst (SC.i18n.lang) -- Knoepfe, Panels, Suche, Legende, Fehlermeldungen, Zeit.
// Beide zusammen aendern nie dasselbe Feld, koennen also unabhaengig auf DE/EN stehen.
// Two SEPARATE language buttons, told apart by their tooltip (Nico's requirement, the old
// feature stays intact): "stLang" is the OLD button (game text: mission types, amenity names,
// INI description, drives ST_LANG). "stUiLang" is NEW and only drives the interface itself
// (SC.i18n.lang) -- buttons, panels, search, legend, error messages, time. The two never touch
// the same field, so they can independently sit on DE/EN.
function stApplyLang(){
  const ui=$('stExUI');
  if(ui){
    const sysSel=$('stSysSel'), allBtn=sysSel&&sysSel.querySelector('[data-sys="all"]'); if(allBtn) allBtn.title=_t('system.all_title');
    const exx=$('stExX'); if(exx) exx.title=_t('ui.leave_map');
    const q=$('stQ'); if(q) q.placeholder=_t('search.placeholder');
    const qx=$('stQx'); if(qx) qx.title=_t('ui.clear');
    const cats=$('stCats'); if(cats) cats.querySelectorAll('[data-cat]').forEach(b=>{ b.textContent=_t('cat.'+b.getAttribute('data-cat')); });
    const legLbl=$('stSideMin'); if(legLbl) legLbl.textContent=_t('tabs.legend')+' ▸';
    const plLbl=$('stSidePlLbl'); if(plLbl) plLbl.textContent=_t('tabs.players');
    const gl=$('stLang'); if(gl){ gl.title=_t('gamelang.title'); gl.textContent=ST_LANG==='de'?'DE':'EN'; }
    const ul=$('stUiLang'); if(ul){ ul.title=_t('uilang.title'); ul.textContent='🌐'+(SC.i18n.lang==='de'?'DE':'EN'); }
    const plq=$('stPlQ'); if(plq) plq.placeholder=_t('player.search_placeholder');
    const hint=$('stHint'); if(hint) hint.textContent=_t('hint.controls');
    const pause=$('stPause'); if(pause){ pause.textContent=ST_PAUSE?'▶':'⏸'; pause.title=ST_PAUSE?_t('action.resume_rotation'):_t('action.pause_rotation'); }
    const hb=$('stHome'); if(hb) hb.title=_t('action.home_title');
    const comE=$('stComE'); if(comE) comE.textContent=_t('compass.east');
  }
  if(ST_DATA){ stLegend(); stPlList(); }
  const res=$('stRes'); if(res&&!res.hidden) stSearch();
  const lp=$('stLoc'); if(lp&&lp.__re) lp.__re();
}
function enterStExplore(){
  if(ROOT.classList.contains('st-explore')) return;
  const ctl=window.__stCtl; if(!ctl) return;
  ROOT.classList.add('st-explore');
  const ui=document.createElement('div'); ui.className='st-exui'; ui.id=ID('stExUI');
  ui.innerHTML=
    '<button class="stx" id="'+ID('stExX')+'" title="'+esc(_t('ui.leave_map'))+'">✕</button>'+
    '<div class="st-top" id="'+ID('stTop')+'"><div class="st-top-row"><div class="st-sys" id="'+ID('stSysSel')+'">'+[['stanton','Stanton'],['pyro','Pyro'],['nyx','Nyx']].map(s=>'<button data-sys="'+s[0]+'"><i style="background:'+ST_SYSLOOK[s[0]].dot+'"></i>'+s[1]+'</button>').join('')+'<button data-sys="all" title="'+esc(_t('system.all_title'))+'">✦</button></div><div class="st-crumb" id="'+ID('stCrumb')+'"></div>'+
      '<div class="st-sbox"><input id="'+ID('stQ')+'" placeholder="'+esc(_t('search.placeholder'))+'" autocomplete="off" enterkeyhint="search"><button id="'+ID('stQx')+'" title="'+esc(_t('ui.clear'))+'">✕</button></div></div>'+
      '<div class="st-cats" id="'+ID('stCats')+'">'+ST_CATS.map(c=>'<button data-cat="'+c[0]+'"'+(ST_CAT===c[0]?' class="on"':'')+'>'+esc(_t(c[1]))+'</button>').join('')+'</div>'+
      '<div class="st-res" id="'+ID('stRes')+'" hidden></div></div>'+
    '<div class="st-side min" id="'+ID('stSide')+'"><div class="st-tabs"><button id="'+ID('stSideMin')+'" class="on">'+esc(_t('tabs.legend'))+' ▸</button><button id="'+ID('stSidePl')+'"><span id="'+ID('stSidePlLbl')+'">'+esc(_t('tabs.players'))+'</span> <span id="'+ID('stPlCnt')+'"></span></button><button class="st-lang" id="'+ID('stLang')+'" title="'+esc(_t('gamelang.title'))+'">'+(ST_LANG==='de'?'DE':'EN')+'</button><button class="st-lang st-lang-ui" id="'+ID('stUiLang')+'" title="'+esc(_t('uilang.title'))+'">🌐'+(SC.i18n.lang==='de'?'DE':'EN')+'</button></div>'+
      '<div class="st-tab" id="'+ID('stTabLeg')+'"><div id="'+ID('stLegend')+'"></div></div><div class="st-tab" id="'+ID('stTabPl')+'" hidden><input id="'+ID('stPlQ')+'" placeholder="'+esc(_t('player.search_placeholder'))+'"><div id="'+ID('stPlList')+'"></div></div></div>'+
    '<div class="st-compass"><svg viewBox="0 0 100 100" width="86" height="86">'+
      '<circle cx="50" cy="50" r="46" fill="rgba(8,12,20,.82)" stroke="rgba(120,165,230,.35)" stroke-width="1.5"/>'+
      '<g id="'+ID('stComDial')+'">'+
        '<line x1="50" y1="50" x2="50" y2="15" stroke="#37e1ff" stroke-width="2.5"/>'+
        '<line x1="50" y1="50" x2="50" y2="85" stroke="#ff62ab" stroke-width="2"/>'+
        '<line x1="15" y1="50" x2="85" y2="50" stroke="rgba(200,215,240,.45)" stroke-width="1"/>'+
        '<text x="50" y="13" text-anchor="middle" font-size="11" font-weight="700" fill="#37e1ff" font-family="Chakra Petch,sans-serif">N</text>'+
        '<text x="50" y="95" text-anchor="middle" font-size="9" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">S</text>'+
        '<text x="7" y="54" text-anchor="middle" font-size="9" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">W</text>'+
        '<text id="'+ID('stComE')+'" x="93" y="54" text-anchor="middle" font-size="9" fill="#cfe0ee" font-family="Chakra Petch,sans-serif">'+_t('compass.east')+'</text>'+
      '</g>'+
      '<polygon points="50,1 45,10 55,10" fill="#ffd76a"/>'+
    '</svg></div>'+
    '<div class="st-hint" id="'+ID('stHint')+'">'+esc(_t('hint.controls'))+'</div>'+
    '<div class="st-zoom"><button class="st-pause" id="'+ID('stPause')+'" title="'+esc(_t('action.pause_rotation'))+'">⏸</button><button class="st-pause" id="'+ID('stHome')+'" title="'+esc(_t('action.home_title'))+'"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg></button><span>🛰️</span><input type="range" id="'+ID('stZoom')+'" min="0" max="1" step="0.001"><span>🔭</span></div>';
  ROOT.appendChild(ui);
  const zoom=$('stZoom'), dial=$('stComDial'), pause=$('stPause');
  if(zoom){ zoom.value=ctl.zoom01(); zoom.oninput=()=>ctl.setZoom01(parseFloat(zoom.value)); }
  if(pause){ const upd=()=>{ pause.textContent=ST_PAUSE?'▶':'⏸'; pause.title=ST_PAUSE?_t('action.resume_rotation'):_t('action.pause_rotation'); }; upd(); pause.onclick=()=>{ ST_PAUSE=!ST_PAUSE; upd(); }; }
  $('stExX').onclick=exitStExplore;
  $('stLang').onclick=()=>{ ST_LANG=ST_LANG==='de'?'en':'de'; try{ localStorage.setItem('livemap_lang',ST_LANG); }catch(e){} $('stLang').textContent=ST_LANG==='de'?'DE':'EN'; const LP=$('stLoc'); if(LP&&LP.__re) LP.__re(); if(!$('stRes').hidden) stSearch(); };
  $('stUiLang').onclick=()=>{ SC.i18n.setLang(SC.i18n.lang==='de'?'en':'de'); $('stUiLang').textContent='🌐'+(SC.i18n.lang==='de'?'DE':'EN'); stApplyLang(); };
  const hb=$('stHome'); if(hb) hb.onclick=()=>{ ctl.highlight(null); ctl.home(); };
  const side=$('stSide');
  const sideTab=t=>{ const open=!side.classList.contains('min'), cur=$('stTabPl').hidden?'leg':'pl';
    if(open&&cur===t){ side.classList.add('min'); } else { side.classList.remove('min'); $('stTabLeg').hidden=t!=='leg'; $('stTabPl').hidden=t!=='pl'; }
    $('stSideMin').classList.toggle('on',!side.classList.contains('min')&&t==='leg'); $('stSidePl').classList.toggle('on',!side.classList.contains('min')&&t==='pl'); if(t==='pl') stPlList(); };
  $('stSideMin').onclick=()=>sideTab('leg'); $('stSidePl').onclick=()=>sideTab('pl'); $('stPlQ').oninput=()=>stPlList();
  function crumb(lv){ const c=$('stCrumb'); if(!c||!ST_DATA) return; const path=[]; let x=lv&&lv.o; while(x){ path.unshift(x); x=ST_DATA.by[x.p]; }
    if(!path.length) path.push(ST_DATA.star);
    c.innerHTML=path.map((o,i)=>i===path.length-1?'<b>'+esc(o.n)+'</b>':'<a data-cid="'+o.id+'">'+esc(o.n)+'</a>').join('<span class="sc-lmw-muted">›</span>');
    c.querySelectorAll('[data-cid]').forEach(a=>a.onclick=()=>{ const o=ST_DATA.by[a.getAttribute('data-cid')]; ctl.focus(o.k==='star'?null:o); }); }
  ctl.onLevel=crumb;
  const sysMark=k=>{ $('stSysSel').querySelectorAll('[data-sys]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-sys')===k)); crumb(ctl.level()); };
  ctl.onSys=sysMark; sysMark(ST_SYS);
  $('stSysSel').querySelectorAll('[data-sys]').forEach(b=>b.onclick=()=>{ const k=b.getAttribute('data-sys'); stCloseCard(); if(k==='all'){ ctl.galaxy(); return; } ctl.goSystem(k); sysMark(k); });
  const plTick=()=>stLoadPlayers().then(ch=>{ if(ch&&window.__stCtl) window.__stCtl.rebuild(); stLegend(); stPlList(); });
  clearInterval(window.__stPlT); { const C=window.LIVEMAP_CONFIG||{}, ms=C.PLAYERS_POLL_MS==null?30000:+C.PLAYERS_POLL_MS; if(ms>0) window.__stPlT=setInterval(plTick,Math.max(5000,ms)); }   // 0 = kein erneutes Laden
  stLoad().then(()=>{ crumb(ctl.level()); stLegend(); plTick(); }).catch(()=>{ $('stLegend').innerHTML='<p class="sc-lmw-muted">'+_t('error.data_load_failed')+'</p>'; });
  // Obere Leiste: Reiter + Suche
  const q=$('stQ'); let tmr=null;
  q.oninput=()=>{ clearTimeout(tmr); tmr=setTimeout(stSearch,120); };
  q.onfocus=()=>{ if(q.value.trim()||ST_CAT!=='all') stSearch(); };
  q.onkeydown=(e)=>{ const box=$('stRes');
    if(e.key==='Escape'){ box.hidden=true; q.blur(); }
    else if(e.key==='ArrowDown'||e.key==='ArrowUp'){ const rs=[...box.querySelectorAll('.st-r')]; if(!rs.length) return; let i=rs.findIndex(r=>r.classList.contains('sel')); rs.forEach(r=>r.classList.remove('sel')); i=Math.max(0,Math.min(rs.length-1,i+(e.key==='ArrowDown'?1:-1))); rs[i].classList.add('sel'); rs[i].scrollIntoView({block:'nearest'}); e.preventDefault(); }
    else if(e.key==='Enter'){ const r=box.hidden?null:(box.querySelector('.st-r.sel')||box.querySelector('.st-r')); if(r) r.click(); } };
  $('stQx').onclick=()=>{ q.value=''; ST_SEC=null; ST_CAT='all'; stCatsMark(); $('stRes').hidden=true; ctl.highlight(null); };
  $('stCats').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{ const c=b.getAttribute('data-cat'); ST_SEC=null;
    if(ST_CAT===c&&!$('stRes').hidden){ $('stRes').hidden=true; return; } ST_CAT=c; stCatsMark(); stCloseCard(); stSearch(); });
  function spinUI(){ window.__stExRaf=requestAnimationFrame(spinUI); const c=window.__stCtl; if(!c) return; if(dial) dial.setAttribute('transform','rotate('+(-c.getAz()*180/Math.PI)+' 50 50)'); if(zoom&&document.activeElement!==zoom) zoom.value=c.zoom01(); }
  spinUI();
  window.__stExStop=function(){ cancelAnimationFrame(window.__stExRaf); };
}
// ---- Obere Suchleiste: Orte, Erze, Items, Schiffe, Waren, Blueprints, Missionen ----
const ST_CATS=[['all','cat.all'],['pl','cat.pl'],['loc','cat.loc'],['ore','cat.ore'],['item','cat.item'],['ship','cat.ship'],['ware','cat.ware'],['bp','cat.bp'],['mis','cat.mis']];
const ST_SEC_IC={'Armor':'🛡️','Clothing':'👕','Undersuits':'🧥','Liveries':'🎨','Personal Weapons':'🔫','Vehicle Weapons':'💥','Systems':'⚙️','Avionics':'📡','Utility':'🔧','Miscellaneous':'📦','Decorations':'🪴','Commodities':'🪙'};
let ST_CAT='all', ST_SEC=null, ST_TERM=null, ST_ORES=null, ST_ORES_TRIED=false;
const stCache=new Map();
async function stGet(url){ const c=stCache.get(url); if(c&&Date.now()-c.t<300000) return c.d;
  const d=await fetch(url).then(r=>r.json()).then(j=>(j&&j.data)||[]).catch(()=>null); if(d) stCache.set(url,{t:Date.now(),d}); return d||[]; }
function stCloseCard(){ const p=$('stLoc'); if(p) p.remove(); window.__stCtl&&window.__stCtl.highlight(null); }
function stCatsMark(){ const c=$('stCats'); if(c) c.querySelectorAll('[data-cat]').forEach(b=>b.classList.toggle('on',b.getAttribute('data-cat')===ST_CAT)); }
function stTermIdx(){ if(ST_TERM) return ST_TERM; ST_TERM={}; ST_DATA.d.objects.forEach(o=>(o.terms||[]).forEach(t=>{ ST_TERM[t.id]=o; })); return ST_TERM; }
const stBase=n=>n.toLowerCase().replace(/\s*\((raw|ore)\)\s*$/,'').replace(/^raw\s*/,'').trim();
async function stOres(){ if(ST_ORES) return ST_ORES; let list=[];
  // data/ores.json ist optional (kein Bau-Skript dieses Projekts erzeugt es, siehe scripts/README_DE_INI.md-
  // Nachbarn/scripts/build-all.py): ohne die Datei bleibt code/ido/idr leer, die Erz-Namen selbst kommen
  // trotzdem aus den Mining-Daten der Systeme (I.ores unten). Nur EIN Versuch pro Sitzung, sonst haemmert
  // jede Suchanfrage 404 gegen den Server.
  // data/ores.json is optional (no build script in this project produces it): without it, code/ido/idr
  // stay empty, but the ore names themselves still come from each system's mining data (I.ores below).
  // Only ONE attempt per session, or every search keystroke would hammer the server with 404s.
  if(!ST_ORES_TRIED){ ST_ORES_TRIED=true; try{ list=(await fetch(pathOf('data/ores.json'),{cache:'no-cache'}).then(r=>{ if(!r.ok) throw new Error(r.status); return r.json(); })).ores||[]; }catch(e){} }
  const I=stOreIndex(), map={};
  list.forEach(o=>{ map[stBase(o.n)]={n:o.n,code:o.code,ido:o.ido,idr:o.idr,mine:[]}; });
  Object.keys(I.ores).filter(n=>!/^Inert/i.test(n)).forEach(n=>{ const b=stBase(n); const x=map[b]||(map[b]={n:n.replace(/\s*\((Raw|Ore)\)$/,''),mine:[]}); x.mine.push(n); });
  const res=Object.values(map).sort((a,b)=>a.n.localeCompare(b.n)); ST_ORES=res; return res; }
function stShipImg(x){ return x&&x.i&&x.ph?pathOf('data/img/ships/'+x.i+'.jpg'):''; }
function stCut(n,l){ return !ST_CAT||ST_CAT==='all'||n<=l?'':'<!--CUT:'+(n-l)+'-->'; }
function stThumb(ic,img){ return img?'<img loading="lazy" src="'+esc(img)+'" alt="" onerror="this.replaceWith(Object.assign(document.createElement(\'i\'),{className:\'ic\',textContent:\'🚀\'}))">':'<i class="ic">'+ic+'</i>'; }
function stRow(kind,key,ic,title,sub,img){ return '<div class="st-r" data-kind="'+kind+'" data-key="'+esc(String(key))+'">'+stThumb(ic,img)+'<div><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></div></div>'; }
// Welche Systeme ein Erz wirklich hat (die Mining-Daten sind ueber alle Systeme zusammengefuehrt)
function stOreWhere(x){ if(!x.mine.length) return 'kein Abbauort in den Spieldaten'; const I=stOreIndex(), S=new Set(); x.mine.forEach(n=>(I.ores[n]||[]).forEach(r=>(I.locs[r.k]||[]).forEach(o=>{ const s=stSysName(o); if(s) S.add(s); }))); return S.size?'abbaubar in '+[...S].join(', '):'abbaubar, ohne festen Ort'; }
let ST_SGEN=0;
async function stSearch(){ const box=$('stRes'), qi=$('stQ'); if(!box||!ST_DATA) return; const gen=++ST_SGEN;
  const q=(qi.value||'').trim().toLowerCase(), cat=ST_CAT, all=cat==='all';
  if(!q&&all){ box.hidden=true; return; } box.hidden=false;
  if(rootW()<700){ const lp=$('stLoc'); if(lp) lp.remove(); }
  const has=s=>!q||String(s||'').toLowerCase().indexOf(q)>=0, lim=n=>all?5:n;
  const C=await uexCatalog(), M=await stMis(), ORES=await stOres(), BPD=(all||cat==='bp')?await stBps():{bps:{}};
  if(!C._ix){ C.items.forEach((x,i)=>{ x._i=i; }); C.ships.forEach((x,i)=>{ x._i=i; }); C._ix=1; }
  let h='';
  const head=(tt,n,c)=>all?'<div class="st-rh">'+tt+(n>5?' <a data-more="'+c+'">'+esc(_t('action.show_all',{n}))+'</a>':'')+'</div>':'';
  if((all||cat==='pl')&&ST_PL){ const L=ST_PL.filter(p=>has(p.name)||has(p.player)||has(p.location)||has(p.ship)||has(p.system));
    if(ST_PL_ERR&&cat==='pl') h+='<p class="st-warn">'+esc(ST_PL_ERR)+'</p>';
    if(L.length) h+=head(_t('cat.pl'),L.length,'pl')+L.slice(0,lim(300)).map(p=>stRow('pl',p.id,p.online?'🟢':'⚪',p.name||p.player,[p.online?_t('status.online'):_t('status.offline_last',{time:stAgo(p.last_seen||p.when)}),p.location&&p.location+(p.online&&p.when&&!stLocFresh(p)?' ('+stAgo(p.when)+')':''),p.ship].filter(v=>v&&v!=='—').join(' · '))).join('')+stCut(L.length,lim(300)); else if(cat==='pl'&&!ST_PL_ERR) h+='<p class="sc-lmw-muted" style="padding:10px;font-size:.84rem">'+_t('search.none_players')+'</p>'; }
  if(all||cat==='loc'){ const L=ST_DATA.d.objects.filter(o=>o.k!=='asteroid'&&(!o.h||ST_HID)&&(q?has(o.n):(ST_PRIO[o.k]||0)>=2)).sort((a,b)=>(ST_PRIO[b.k]||0)-(ST_PRIO[a.k]||0)||a.n.localeCompare(b.n));
    if(L.length) h+=head(_t('cat.loc'),L.length,'loc')+L.slice(0,lim(600)).map(o=>stRow('loc',o.id,'<span class="st-dot" style="background:'+(ST_KIND[o.k]||{}).c+'"></span>',o.n,kindLabel(o.k)+(stBodyOf(o)!==o&&stBodyOf(o).k!=='star'?' · '+stBodyOf(o).n:'')+' · '+stSysName(o))).join('')+stCut(L.length,lim(600)); }
  if(all||cat==='ore'){ const L=ORES.filter(o=>has(o.n)||o.mine.some(has)||has(o.code));
    if(L.length) h+=head(_t('cat.ore'),L.length,'ore')+L.slice(0,lim(200)).map(o=>stRow('ore',o.n,'⛏️',o.n,stOreWhere(o)+(o.code?' · '+o.code:''))).join('')+stCut(L.length,lim(200)); }
  if(all||cat==='item'){
    if(!q&&!ST_SEC&&cat==='item'){ const S={}; C.items.forEach(x=>{ if(x.k!=='c') S[x.s||_t('common.misc')]=(S[x.s||_t('common.misc')]||0)+1; });
      h+=Object.keys(S).sort((a,b)=>S[b]-S[a]).map(s=>stRow('sec',s,ST_SEC_IC[s]||'📦',s,_t('count.items',{n:S[s]}))).join(''); }
    else { const L=C.items.filter(x=>x.k!=='c'&&(!ST_SEC||x.s===ST_SEC)&&(has(x.n)||has(x.co)||has(x.s)));
      if(L.length) h+=(ST_SEC&&!all?'<div class="st-rh"><a data-back="1">'+esc(_t('action.back_categories'))+'</a> · '+esc(ST_SEC)+'</div>':head(_t('cat.item'),L.length,'item'))+L.slice(0,lim(150)).map((x,i)=>stRow('item',x._i,ST_SEC_IC[x.s]||'📦',x.n,[x.s,x.co,x.sz?_t('label.size_abbr',{sz:x.sz}):''].filter(Boolean).join(' · '))).join('')+stCut(L.length,lim(150)); } }
  if(all||cat==='ship'){ const L=C.ships.filter(x=>has(x.n)||has(x.co));
    if(L.length) h+=head(_t('cat.ship'),L.length,'ship')+L.slice(0,lim(300)).map(x=>stRow('ship',x._i,'🚀',x.n,[x.co,x.crew?_t('label.crew',{n:x.crew}):''].filter(Boolean).join(' · '),stShipImg(x))).join('')+stCut(L.length,lim(300)); }
  if(all||cat==='ware'){ const L=C.items.filter(x=>x.k==='c'&&has(x.n));
    if(L.length) h+=head(_t('cat.ware'),L.length,'ware')+L.slice(0,lim(250)).map(x=>stRow('ware',x._i,'🪙',x.n,(x.pb?_t('price.buy_from',{price:uexMoney(x.pb)}):'')+(x.pb&&x.ps?' · ':'')+(x.ps?_t('price.sell_up_to',{price:uexMoney(x.ps)}):''))).join('')+stCut(L.length,lim(250)); }
  if(all||cat==='bp'){ const B=M.d.bps||{}, R=BPD.bps||{}; const L=[...new Set(Object.keys(R).concat(Object.keys(B)))].filter(n=>has(n)||has((B[n]||{}).cat)||has((R[n]||{}).t)).sort((a,b)=>a.localeCompare(b));
    const src=n=>B[n]?(B[n].m.length===1?_t('count.mission_one'):_t('count.mission_many',{n:B[n].m.length})):(R[n]&&R[n].src==='default'?_t('bp.from_start'):_t('bp.no_known_mission'));
    if(L.length) h+=head(_t('cat.bp'),L.length,'bp')+L.slice(0,lim(1800)).map(n=>stRow('bp',n,'🧩',n,[(R[n]||{}).t||(B[n]||{}).cat,src(n)].filter(Boolean).join(' · '))).join('')+stCut(L.length,lim(1800)); }
  if(all||cat==='mis'){ const L=M.d.groups.map((g,i)=>[g,i]).filter(([g])=>has(stTy(g.ty))||has(g.g)||g.t.some(has)).sort((a,b)=>stTy(a[0].ty).localeCompare(stTy(b[0].ty))||b[0].n-a[0].n);
    if(L.length) h+=head(_t('cat.mis'),L.length,'mis')+L.slice(0,lim(200)).map(([g,i])=>stRow('mis',i,'🎯',stTy(g.ty)+' · '+g.g,_t('count.orders',{n:g.n})+(g.il?' · illegal':'')+(g.bp?' · 🧩 '+g.bp.length:''))).join('')+stCut(L.length,lim(200)); }
  const miss=(M.failed?[_t('cat.mis')+'/'+_t('cat.bp')]:[]).concat(!C.items.length?[_t('cat.item')+'/'+_t('cat.ware')]:[],!C.ships.length?[_t('cat.ship')]:[]);
  if(miss.length) h='<p class="st-warn">'+esc(_t('search.load_failed',{list:miss.join(', ')}))+'</p>'+h;
  // Sichtbar machen, wenn eine Liste gekuerzt wurde (nie still abschneiden)
  h=h.replace(/<!--CUT:(\d+)-->/g,(m,n)=>'<p class="sc-lmw-muted" style="padding:6px 10px;font-size:.78rem">'+esc(_t('search.more_specific',{n}))+'</p>');
  if(gen!==ST_SGEN) return;   // eine neuere Suche laeuft schon, dieses Ergebnis ist veraltet
  box.innerHTML=h||'<p class="sc-lmw-muted" style="padding:10px;font-size:.84rem">'+_t('search.nothing_found')+'</p>';
  const f1=box.querySelector('.st-r'); if(f1) f1.classList.add('sel');
  box.querySelectorAll('[data-more]').forEach(a=>a.onclick=(e)=>{ e.stopPropagation(); ST_CAT=a.getAttribute('data-more'); stCatsMark(); stSearch(); });
  box.querySelectorAll('[data-back]').forEach(a=>a.onclick=()=>{ ST_SEC=null; stSearch(); });
  box.querySelectorAll('.st-r').forEach(r=>r.onclick=()=>stPick(r.getAttribute('data-kind'),r.getAttribute('data-key'))); }
async function stPick(kind,key){ const ctl=window.__stCtl, C=await uexCatalog(), mob=rootW()<700;
  if(kind==='sec'){ ST_SEC=key; stSearch(); return; }
  if(kind==='pl'){ const p=(ST_PL||[]).find(x=>String(x.id)===key); if(!p) return; const po=stPlayerObj(p); if(po&&po.loc) ctl.flyTo(po.loc); if(mob) $('stRes').hidden=true; stOpenPlayer(p); return; }
  if(mob) $('stRes').hidden=true;
  if(kind==='loc'){ const o=ST_DATA.by[key]; ctl.highlight(null); ctl.flyTo(o); openStPanel(o); $('stRes').hidden=true; }
  else if(kind==='ore'){ const x=(await stOres()).find(o=>o.n===key); if(x) stOpenOre(x); }
  else if(kind==='item') stOpenBuy('item',C.items[+key]);
  else if(kind==='ship') stOpenBuy('ship',C.ships[+key]);
  else if(kind==='ware') stOpenBuy('ware',C.items[+key]);
  else if(kind==='bp') stOpenBp(key);
  else if(kind==='mis'){ const g=(await stMis()).d.groups[+key]; ctl.highlight(g.locs); stOpenMisGroup(g); } }
function stCard(dot,title,sub){ let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:'+dot+'"></span><h3>'+esc(title)+'<small>'+esc(sub)+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body" id="'+ID('stCardBody')+'"><p class="sc-lmw-muted">'+_t('common.loading')+'</p></div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>{ p.remove(); window.__stCtl&&window.__stCtl.highlight(null); }; return $('stCardBody'); }
function stPriceRows(rows,field,label,asc){ const T=stTermIdx();
  const L=rows.filter(r=>r[field]>0).sort((a,b)=>asc?a[field]-b[field]:b[field]-a[field]);
  if(!L.length) return {html:'',ids:[]}; const ids=[];
  const html='<div class="st-slbl">'+label+' <span class="st-cnt">'+_t('count.terminals',{n:L.length})+'</span></div>'+L.map(r=>{ const o=T[r.id_terminal]; if(o) ids.push(o.id);
    const sys=r.star_system_name&&r.star_system_name!=='Stanton'?r.star_system_name:''; const where=o?stBodyOf(o).n:(r.planet_name||r.moon_name||sys||'');
    return '<div class="st-pr'+(o?'':' nomap')+'"'+(o?' data-oid="'+o.id+'"':'')+' title="'+esc(o?_t('tooltip.show_on_map'):_t('tooltip.not_on_map'))+'"><div><b>'+esc(o?o.n:(r.terminal_name||'?'))+'</b><span>'+esc([r.terminal_name,where,sys].filter((v,i,a)=>v&&a.indexOf(v)===i).join(' · '))+'</span></div><em>'+uexMoney(r[field])+'</em></div>'; }).join('');
  return {html,ids}; }
function stWirePrices(body){ body.querySelectorAll('[data-oid]').forEach(el=>el.onclick=()=>{ const o=ST_DATA.by[el.getAttribute('data-oid')]; window.__stCtl.flyTo(o); openStPanel(o); }); }
async function stOpenBuy(kind,rec){ if(!rec) return;
  const sub=kind==='ship'?[rec.co,rec.crew?_t('label.crew',{n:rec.crew}):''].filter(Boolean).join(' · '):kind==='ware'?_t('cat.ware'):[rec.s,rec.co,rec.sz?_t('label.size_abbr',{sz:rec.sz}):''].filter(Boolean).join(' · ');
  const body=stCard(kind==='ship'?'#37e1ff':kind==='ware'?'#ffd76a':'#38d39f',rec.n,sub,[kind,kind+':'+rec.i,rec.n]);
  let rows=[];
  if(kind==='ship'&&rec.i) rows=await stGet(UEX_BASE+'/vehicles_purchases_prices?id_vehicle='+rec.i);
  else if(kind==='item'&&rec.i) rows=await stGet(UEX_BASE+'/items_prices?id_item='+rec.i);
  else if(kind==='ware'&&rec.i) rows=await stGet(UEX_BASE+'/commodities_prices?id_commodity='+rec.i);
  if(!ROOT.contains(body)) return;
  const buy=stPriceRows(rows,'price_buy',kind==='ware'?_t('price.buy_wholesale_label'):_t('price.buy_label'),true), sell=kind==='ware'?stPriceRows(rows,'price_sell',_t('price.sell_label'),false):{html:'',ids:[]};
  let h=kind==='ship'&&stShipImg(rec)?'<img class="st-shipimg" src="'+esc(stShipImg(rec))+'" alt="" onerror="this.remove()">':'';
  if(kind==='ship') h+='<div class="st-chips">'+(rec.msrp?'<span>'+esc(_t('label.pledge',{n:rec.msrp}))+'</span>':'')+(rec.st?'<a href="'+esc(rec.st)+'" target="_blank" rel="noopener" class="st-lnk">RSI ↗</a>':'')+'</div>';
  h+=buy.html+sell.html;
  if(kind==='item') h+='<div id="'+ID('stLoot')+'"></div>';   // Beute-Fundorte / loot (js/guides.js, data/loot.json)
  if(kind==='item'&&rec.i) h+='<div id="'+ID('stAttr')+'"></div>';
  if(!buy.html&&!sell.html) h+='<p class="sc-lmw-muted" style="font-size:.84rem">'+(kind==='ship'?_t('notice.ship_not_buyable'):kind==='item'?_t('notice.item_not_buyable'):_t('notice.ware_no_price'))+'</p>';
  h+='<div class="st-coord">'+_t('price.coord_note')+'</div>';
  body.innerHTML=h; stWirePrices(body); if(kind==='item'&&SC.guides) SC.guides.loot($('stLoot'),rec.n);
  if(kind==='item'&&rec.i) stGet(UEX_BASE+'/items_attributes?id_item='+rec.i).then(A=>{ const bx=$('stAttr'); if(!bx) return; const L=A.filter(a=>a.attribute_name&&a.value!==''&&a.value!=null); if(L.length) bx.innerHTML='<div class="st-slbl">'+_t('label.stats')+'</div><table class="st-attr">'+L.map(a=>'<tr><td>'+esc(a.attribute_name)+'</td><td>'+esc(a.value)+(a.unit?' '+esc(a.unit):'')+'</td></tr>').join('')+'</table>'; });
  const ids=[...new Set(buy.ids.concat(sell.ids))]; if(ids.length) window.__stCtl.highlight(ids); }
async function stOpenOre(x){ const I=stOreIndex();
  const body=stCard('#e0a458',x.n,(x.code?x.code+' · ':'')+stOreWhere(x),['erz',x.n,x.n]);
  const rows=[]; x.mine.forEach(n=>(I.ores[n]||[]).forEach(r=>rows.push(Object.assign({ore:n},r)))); rows.sort((a,b)=>(b.q-a.q)||(b.ch-a.ch));
  const ids=new Set();
  let h=rows.length?'<div class="st-slbl">'+_t('label.mining')+' <span class="st-cnt">'+_t('hint.best_quality_first')+'</span></div>'+rows.map((r,i)=>{ const L=I.locs[r.k]||[]; L.forEach(o=>ids.add(o.id));
    const where=!L.length?stMineLabel(r.k)+_t('nofix.mineable_no_place'):r.k==='HPP_AaronHalo'?'Aaron Halo ('+L.length+' Mining-Basen)':(/^HPP_(Stanton|Pyro)\d/.test(r.k)?L.map(o=>o.n).join(', '):stMineLabel(r.k)+' · '+L.slice(0,4).map(o=>o.n).join(', ')+(L.length>4?' …':''))+(L.length?' · '+stSysName(L[0]):'');
    return '<div class="st-orow'+(L.length?'':' st-nofix')+'" data-ri="'+i+'"><b>'+esc(where)+'</b><div class="om"><span>'+esc(mineGroupLabel(r.g))+'</span><span title="'+esc(_t('tooltip.ore_chance'))+'">'+esc(_t('ore.percent_chance',{n:(r.ch>=1?Math.round(r.ch):r.ch.toFixed(1))}))+'</span><span title="'+esc(_t('tooltip.ore_max_share'))+'">'+esc(_t('ore.up_to_percent',{n:Math.round(r.max)}))+'</span><span title="'+esc(_t('tooltip.best_quality'))+'">'+esc(_t('ore.quality',{n:r.q}))+'</span></div></div>'; }).join(''):'';
  body.innerHTML=h+'<div id="'+ID('stOreSell')+'"><p class="sc-lmw-muted" style="font-size:.82rem">'+_t('status.loading_sell_prices')+'</p></div>';
  body.querySelectorAll('[data-ri]').forEach(el=>el.onclick=()=>{ const r=rows[+el.getAttribute('data-ri')]; const o=(I.locs[r.k]||[])[0]; if(!o){ stOpenNofix(r.k); return; } window.__stCtl.flyTo(o); openStPanel(o); });
  if(ids.size) window.__stCtl.highlight([...ids]);
  const [raw,ref]=await Promise.all([x.ido?stGet(UEX_BASE+'/commodities_prices?id_commodity='+x.ido):[],x.idr?stGet(UEX_BASE+'/commodities_prices?id_commodity='+x.idr):[]]);
  if(!ROOT.contains(body)) return; const box=body.querySelector('#stOreSell'); if(!box) return;
  const a=stPriceRows(raw,'price_sell',_t('label.sell_raw'),false), b=stPriceRows(ref,'price_sell',_t('label.sell_refined'),false);
  box.innerHTML=(a.html+b.html)||'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('price.none_sell_uex')+'</p>'; stWirePrices(box); }
// Rezept: was man zum Craften braucht (Baugruppen, Ressourcen in SCU, Items mit Stueckzahl, Mindestqualitaet)
function stBpRecipe(R){ if(!R||!R.req||!R.req.length) return '';
  const tm=R.tm?(R.tm>=3600?_t('time.hours_short',{n:Math.round(R.tm/360)/10}):R.tm>=60?_t('time.min_short',{n:Math.round(R.tm/60)}):_t('time.sec_short',{n:R.tm})):'';
  return '<div class="st-slbl">'+_t('label.crafting')+(tm?' <span class="st-cnt">'+tm+'</span>':'')+'</div>'+R.req.map(g=>'<div class="st-orow st-bpg"><b>'+esc(g.n||_t('common.material'))+(g.c>1?' ×'+g.c:'')+'</b>'+
    g.it.map(i=>'<div class="om"><span>'+esc(i.n)+'</span><span>'+(i.scu!=null?String(i.scu).replace('.',',')+' SCU':'×'+(i.q||1))+(i.mq>1?' · '+esc(_t('label.min_quality',{n:i.mq})):'')+'</span></div>').join('')+
    (g.mod&&g.mod.length?'<div class="om"><span class="sc-lmw-muted">'+esc(_t('label.quality_affects',{list:g.mod.join(', ')}))+'</span></div>':'')+'</div>').join(''); }
// ORTS-WISSEN der Community: Temperatur/Strahlung von-bis, Schwerkraft, Wetter, Geschichte; jeder ergaenzt, alle Namen unten.
async function stOpenBp(name){ const M=await stMis(), BP=await stBps(), B=(M.d.bps||{})[name], R=(BP.bps||{})[name]; if(!B&&!R) return; const LS=M.d.lsets||[];
  const body=stCard('#37e1ff',name,[R?R.t+(R.g?' · '+_t('label.grade',{n:R.g}):''):(B&&B.cat),'Blueprint'].filter(Boolean).join(' · '),['blueprint',name,name]);
  const ids=new Set();
  if(!B){ // nicht in unseren Missionsdaten: Quelle aus den Spieldaten + Rezept
    body.innerHTML=(R.src==='default'?'<div class="st-slbl">'+_t('bp.unlocked_from_start')+'</div>':
      R.src==='reward'?'<div class="st-slbl">'+_t('bp.comes_as_reward')+'</div><div class="st-orow"><div class="om"><span>'+R.pools.map(k=>esc(k.replace(/^BP_(MISSIONREWARD|REWARDS)_/,'').replace(/_/g,' '))).join(', ')+'</span></div><div class="om"><span class="sc-lmw-muted">'+_t('bp.reward_no_mission')+'</span></div></div>':
      '<div class="st-slbl">'+_t('bp.no_known_source')+'</div><div class="st-orow"><div class="om"><span class="sc-lmw-muted">'+_t('bp.no_source_note')+'</span></div></div>')+
      stBpRecipe(R)+'<div class="st-coord">'+esc(_t('data.version_prefix',{version:(BP.version||'').replace(/-LIVE.*/,'')}))+'</div>'; return; }
  const bpCount='<span class="st-cnt">'+(B.m.length===1?_t('count.mission_one'):_t('count.mission_many',{n:B.m.length}))+'</span>';
  body.innerHTML='<div class="st-slbl">'+_t('bp.found_in',{count:bpCount})+'</div>'+B.m.map((m,i)=>{ (LS[m.l]||[]).forEach(id=>ids.add(id));
    const areas=(LS[m.l]||[]).map(id=>ST_DATA.by[id]).filter(Boolean); const planets=[...new Set(areas.map(o=>stBodyOf(o)).map(b=>{ let x=b; while(x&&x.k==='moon') x=ST_DATA.by[x.p]; return x&&x.k!=='star'?x.n+' ('+stSysName(x)+')':stSysName(b); }))];
    const one=m.ps>1?Math.round(m.ch/m.ps*10)/10:m.ch;
    return '<div class="st-orow" data-bi="'+i+'"><b>'+esc(m.t||stTy(m.ty))+'</b>'+(m.il?' <em class="t-ill">illegal</em>':'')+'<div class="om"><span>'+esc(stTy(m.ty))+'</span><span>'+esc(m.g)+'</span></div>'+
      '<div class="om"><span title="'+esc(_t('tooltip.bp_chance'))+'">🎲 '+m.ch+' %'+(m.ps>1?esc(_t('bp.pool_odds',{ps:m.ps,one})):'')+'</span></div>'+
      '<div class="om"><span>📍 '+esc(planets.join(', '))+'</span></div></div>'; }).join('')+
    stBpRecipe(R)+'<div class="st-coord">'+esc(_t('data.version_prefix',{version:(M.d.version||'').replace(/-LIVE.*/,'')}))+' · '+esc(_t('bp.approx_note'))+'</div>';
  body.querySelectorAll('[data-bi]').forEach(el=>el.onclick=()=>{ const m=B.m[+el.getAttribute('data-bi')]; window.__stCtl.highlight(LS[m.l]||[]); });
  if(ids.size) window.__stCtl.highlight([...ids]); }
function stPlList(){ const box=$('stPlList'), cnt=$('stPlCnt'); const P=ST_PL||[]; if(cnt){ const on=P.filter(p=>p.online).length; cnt.innerHTML=P.length?(on?' <b class="st-plon">'+on+' online</b>':' (0/'+P.length+')'):''; } if(!box) return;
  const q=(($('stPlQ')||{}).value||'').trim().toLowerCase(); const L=P.filter(p=>!q||[p.name,p.player,p.location,p.ship].some(v=>String(v||'').toLowerCase().indexOf(q)>=0));
  box.innerHTML=(ST_PL_ERR?'<p class="st-warn">'+esc(ST_PL_ERR)+'</p>':'')+(L.map(p=>{ const o=stPlayerLoc(p);
    return '<div class="st-orow st-plrow" data-pid="'+esc(p.id)+'"><b><i class="st-pl-dot'+(p.online?' on':'')+'"></i>'+esc(p.name||p.player||_t('entity.player'))+'</b><div class="om"><span>'+esc(p.online?(p.travel?_t('travel.to',{to:p.travel.to}):(p.location||(o&&o.n)||_t('location.unknown'))+(p.when&&!stLocFresh(p)?' ('+stAgo(p.when)+')':'')):_t('status.offline_comma',{time:stAgo(p.last_seen||p.when)}))+'</span>'+(o?'<span>'+esc(stSysName(o))+'</span>':'')+(p.ship&&p.ship!=='—'?'<span>🚀 '+esc(p.ship)+'</span>':'')+'</div></div>'; }).join('')||'<p class="sc-lmw-muted" style="font-size:.8rem">'+(ST_PL?_t('search.none_players'):_t('common.loading'))+'</p>');
  box.querySelectorAll('[data-pid]').forEach(el=>el.onclick=()=>{ const p=P.find(x=>String(x.id)===el.getAttribute('data-pid')); if(!p) return; const o=stPlayerLoc(p); if(o) window.__stCtl.flyTo(o); stOpenPlayer(p); }); }
function stLegend(){ const box=$('stLegend'); if(!box||!ST_DATA) return; const cnt={}, hid={};
  ST_DATA.d.objects.forEach(o=>{ if(o.h) hid[o.k]=(hid[o.k]||0)+1; else cnt[o.k]=(cnt[o.k]||0)+1; });
  cnt.halo=ST_DATA.d.objects.filter(o=>o.ring).length;
  const rows=Object.keys(ST_KIND).filter(k=>k!=='star'&&(cnt[k]||hid[k])).map(k=>'<label class="st-lg"><input type="checkbox" data-k="'+k+'"'+(ST_VIS[k]?' checked':'')+'><i style="background:'+ST_KIND[k].c+'"></i>'+esc(kindLabel(k))+'<span>'+(cnt[k]||0)+(hid[k]?' +'+hid[k]:'')+'</span></label>').join('');
  const pOn=(ST_PL||[]).filter(p=>p.online).length, pOff=(ST_PL||[]).length-pOn;
  box.innerHTML='<div class="st-slbl">'+_t('legend.players_heading')+'</div>'+'<label class="st-lg"><input type="checkbox" id="'+ID('stPlOn')+'"'+(ST_PL_ON?' checked':'')+'><i style="background:#4dff9a"></i>'+esc(_t('status.online'))+'<span>'+pOn+'</span></label><label class="st-lg"><input type="checkbox" id="'+ID('stPlOff')+'"'+(ST_PL_OFF?' checked':'')+'><i style="background:#8a93a6"></i>'+esc(_t('status.offline_last_location'))+'<span>'+pOff+'</span></label>'+(ST_PL_ERR?'<p class="st-warn">'+esc(ST_PL_ERR)+'</p>':'')+'<div class="st-slbl">'+_t('legend.show_heading')+'</div>'+rows+
    '<label class="st-lg st-lg-h"><input type="checkbox" id="'+ID('stHid')+'"'+(ST_HID?' checked':'')+'>'+esc(_t('legend.hidden_places'))+'<span>'+Object.values(hid).reduce((a,b)=>a+b,0)+'</span></label>'+
    '<p class="st-mnote">'+esc(_t('legend.note',{version:(ST_DATA.d.version||'').replace(/-LIVE.*/,'')}))+'</p>';
  box.querySelectorAll('[data-k]').forEach(c=>c.onchange=()=>{ ST_VIS[c.getAttribute('data-k')]=c.checked; window.__stCtl&&window.__stCtl.rebuild(); });
  const h=$('stHid'); if(h) h.onchange=()=>{ ST_HID=h.checked; window.__stCtl&&window.__stCtl.rebuild(); };
  const a1=$('stPlOn'), a2=$('stPlOff'); if(a1) a1.onchange=()=>{ ST_PL_ON=a1.checked; window.__stCtl&&window.__stCtl.rebuild(); }; if(a2) a2.onchange=()=>{ ST_PL_OFF=a2.checked; window.__stCtl&&window.__stCtl.rebuild(); };
}
function stOreMerge(parts){ const m={}; (parts||[]).forEach(pt=>{ const x=m[pt.ore]||(m[pt.ore]={ore:pt.ore,p:0,b:[]}); x.p=Math.max(x.p,pt.p||0); x.b.push(pt); }); return Object.values(m); }
function stOreIndex(){ const D=ST_DATA; if(D.oreIdx) return D.oreIdx; const ores={}, locs={};
  Object.entries(D.d.mining).forEach(([k,gs])=>gs.forEach(g=>{ const acc={};
    g.deps.forEach(d=>stOreMerge(d.parts).forEach(x=>{ const a=acc[x.ore]||(acc[x.ore]={ch:0,max:0,q:0}); a.ch+=d.rel*x.p; x.b.forEach(b=>{ a.max=Math.max(a.max,b.max||0); a.q=Math.max(a.q,(b.q&&b.q[1])||0); }); }));
    Object.entries(acc).forEach(([ore,a])=>(ores[ore]=ores[ore]||[]).push({k,g:g.g,ch:a.ch,max:a.max,q:a.q})); }));
  D.d.objects.forEach(o=>(o.mine||[]).forEach(k=>(locs[k]=locs[k]||[]).push(o)));
  D.oreIdx={ores,locs}; return D.oreIdx; }
function stOpenMisGroup(g){ let p=$('stLoc'); if(p) p.remove(); p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc'; p.__re=()=>stOpenMisGroup(g);
  const locs=g.locs.map(id=>ST_DATA.by[id]).filter(Boolean);
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:#ffd76a"></span><h3>'+esc(stTy(g.ty))+'<small>'+esc(g.g)+(g.il?' · illegal':'')+' · '+esc(_t('count.orders',{n:g.n}))+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body">'+
    (g.t.length?'<div class="st-slbl">'+_t('label.examples')+'</div>'+g.t.map(t=>'<div class="st-mis-t">'+esc(t)+'</div>').join(''):'')+
    (g.bp?'<div class="st-slbl">🧩 Blueprints <span class="st-cnt">'+esc(_t('bp.in_x_of_y_orders',{nbp:g.nbp,n:g.n}))+'</span></div>'+(g.tb?'<div class="st-mis-sub">'+g.tb.map(esc).join(' · ')+'</div>':'')+
      '<div class="st-bp">'+g.bp.map(b=>'<span'+(b[2]?' title="'+esc(b[2])+'"':'')+'>'+esc(b[0])+(b[1]<100?' <em>'+b[1]+' %</em>':'')+'</span>').join('')+'</div>':'')+
    (g.rw?'<div class="st-slbl">'+_t('label.reward')+'</div><div class="st-bp">'+g.rw.map(r=>'<span>'+esc(r[0])+' ×'+r[1]+'</span>').join('')+'</div>':'')+
    '<div class="st-slbl">'+_t('label.offered_in')+'</div>'+locs.map(o=>'<div class="st-orow" data-gid="'+o.id+'"><b>'+esc(o.n)+'</b><div class="om"><span>'+esc(kindLabel(o.k))+'</span></div></div>').join('')+'</div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove();
  p.querySelectorAll('[data-gid]').forEach(el=>el.onclick=()=>{ const o=ST_DATA.by[el.getAttribute('data-gid')]; window.__stCtl.flyTo(o); openStPanel(o); }); }
// (stOpenMap(), das frueher aus einem Dashboard heraus in einen separaten Taktik-Tisch-Canvas
// wechselte, ist in diesem eigenstaendigen Projekt tot: initLiveMap()/SCLMW.mount() rufen
// enterStExplore() direkt auf. Entfernt, statt als nie erreichbarer Code stehen zu bleiben.)
function exitStExplore(){
  clearInterval(window.__stPlT);
  if(ROOT) ROOT.classList.remove('st-explore');
  if(window.__stExStop){ try{ window.__stExStop(); }catch(e){} window.__stExStop=null; }
  if(window.__stCtl){ window.__stCtl.onLevel=null; window.__stCtl.reset(); }
  const ui=$('stExUI'); if(ui) ui.remove();
  const lp=$('stLoc'); if(lp) lp.remove();
}
// g.g kommt bereits deutsch aus den gebauten Spieldaten (siehe GROUPS in scripts/*-build.py,
// nur 4 feste Werte) -- hier ueber die neuen mine.group.*-Schluessel durchgereicht/uebersetzt.
// g.g already arrives in German from the built game data (see GROUPS in scripts/*-build.py,
// only 4 fixed values) -- passed through/translated here via the new mine.group.* keys.
function mineGroupLabel(g){ const k='mine.group.'+g; return SC.i18n&&SC.i18n.dict.en[k]?_t(k):g; }
function stMiningHTML(keys){ const D=ST_DATA; let h='<div class="st-slbl">'+_t('label.mining_resources')+'</div>';
  keys.forEach(k=>{ const gs=D.d.mining[k]; if(!gs) return; h+='<div class="st-mprov">'+esc(stMineLabel(k))+'</div>';
    gs.forEach(g=>{ h+='<div class="st-mgrp">'+esc(mineGroupLabel(g.g))+'</div>';
      g.deps.forEach(d=>{ const ores=stOreMerge(d.parts).filter(x=>!/^Inert/i.test(x.ore));
        h+='<details class="st-dep"><summary><b>'+esc(d.rock)+'</b>'+(d.tier?'<em class="t-'+esc(d.tier)+'">'+esc(d.tier)+'</em>':'')+'<span title="'+esc(_t('tooltip.rock_frequency'))+'">'+d.rel+' %</span></summary>'+
          (ores.length?'<table><tr><th>'+esc(_t('table.ore'))+'</th><th title="'+esc(_t('tooltip.ore_in_rock'))+'">'+esc(_t('table.chance'))+'</th><th title="'+esc(_t('tooltip.ore_share_quality'))+'">'+esc(_t('table.share_quality'))+'</th></tr>'+ores.map(x=>'<tr><td>'+esc(x.ore)+'</td><td>'+Math.round(x.p*100)+' %</td><td>'+x.b.map(b=>b.min+'–'+b.max+' %<small>Q '+b.q[0]+'–'+b.q[1]+'</small>').join('<br>')+'</td></tr>').join('')+'</table>':'<p class="sc-lmw-muted" style="font-size:.78rem;margin:0 10px 8px">'+_t('common.no_ore_data')+'</p>')+'</details>'; }); }); });
  return h; }
function stNofixNote(k){ return /^AsteroidCluster_/.test(k)?_t('nofix.note_random'):_t('nofix.note_no_coords'); }
function stOpenNofix(k){ const D=ST_DATA; let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:#9c8b76"></span><h3>'+esc(stMineLabel(k))+'<small>'+esc(_t('nofix.title'))+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body"><div class="st-nofix-note">'+stNofixNote(k)+'</div>'+stMiningHTML([k])+'</div></div>';
  p.__re=()=>stOpenNofix(k); ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove(); }
function stDist(km){ return km>=1e6?_t('unit.mio_km',{n:tn(km/1e6,{maximumFractionDigits:2})}):_t('unit.km',{n:tn(Math.round(km))}); }
async function openStPanel(o){
  const D=ST_DATA; if(!D||!o) return;
  if(o.grp){ stOpenGroup(o); return; }
  if(o.k==='player'){ stOpenPlayer(o.pl); return; }
  let p=$('stLoc'); if(p) p.remove();
  p=document.createElement('div'); p.id=ID('stLoc'); p.className='st-loc';
  const K=ST_KIND[o.k]||{c:'#ccc'}, kl=kindLabel(o.k), par=o.p&&D.by[o.p], b=stBodyOf(o);
  const sub=[kl, b&&b!==o&&b.k!=='star'?b.n:(par&&par!==o&&par.k!=='star'?par.n:null), stSysName(o), o.ju].filter(Boolean).join(' · ');
  p.innerHTML='<div class="st-loc-card"><div class="st-loc-h"><span class="st-dot" style="background:'+K.c+'"></span><h3>'+esc(o.n)+'<small>'+esc(sub)+'</small></h3>'+'<button class="st-loc-x" id="'+ID('stLocX')+'">✕</button></div><div class="st-loc-body" id="'+ID('stLocBody')+'"></div></div>';
  ROOT.appendChild(p); $('stLocX').onclick=()=>p.remove();
  const body=$('stLocBody'); let h='';
  p.__re=()=>openStPanel(o); const isDe=ST_LANG==='de', SY=D.sys[o.sy]||{};
  let desc=isDe&&o.dde?o.dde:o.d;
  if(o.k==='star'){ if(SY.img) h+='<img class="st-shipimg" src="'+esc(SY.img)+'" alt="" onerror="this.remove()">'; desc=isDe?(o.dde||SY.dde||SY.d||o.d):(SY.d||o.d); }
  if(o.k==='gateway'){ const L=(D.gal.links||[]).find(l=>l.a===o.id||l.b===o.id);
    if(L){ const other=D.by[L.a===o.id?L.b:L.a]; if(other) h+='<div class="st-jump">'+_t('jump.gateway_to',{sys:'<b>'+esc(stSysName(other))+'</b>'})+(L.live?'':' <em>'+esc(_t('jump.rsi_only_note'))+'</em>')+'<button class="sc-lmw-btn sm primary" id="'+ID('stJumpGo')+'" data-to="'+other.id+'">'+_t('action.fly_through')+'</button></div>'; } }
  if(desc) h+='<div class="st-desc" id="'+ID('stDesc')+'" title="'+esc(_t('hint.tap_to_expand'))+'">'+esc(desc)+'</div>';
  if(o.am&&o.am.length) h+='<div class="st-slbl">'+_t('label.amenities')+'</div><div class="st-chips">'+o.am.map(a=>'<span>'+esc(isDe?(ST_AM_DE[a]||a):a)+'</span>').join('')+'</div>';
  if(SC.guides) h+=SC.guides.html(o);   // Ablauf, Timer, Karten der grossen Loops / guides for the big loops (js/guides.js)
  if(o.mine&&o.mine.length) h+=stMiningHTML(o.mine);
  if(o.k==='wikelo') h+='<div id="'+ID('stWkBox')+'"></div>';
  if((o.terms||[]).some(t=>!/^(commodity|refinery|fuel)/.test(t.t||''))) h+='<div class="st-slbl">'+_t('label.available_here')+'</div><div id="'+ID('stShopBox')+'"><button class="sc-lmw-btn sm" id="'+ID('stShopGo')+'">'+_t('action.load_items_ships')+'</button></div>';
  h+='<div id="'+ID('stMisBox')+'"></div>';
  const comm=(o.terms||[]).filter(t=>t.t==='commodity').slice(0,6);
  if(comm.length) h+='<div class="st-slbl">'+_t('label.commodity_market')+'</div><div id="'+ID('stGoodsBox')+'"><p class="sc-lmw-muted" style="font-size:.85rem">'+_t('status.loading_prices')+'</p></div>';
  if(o.terms&&o.terms.length) h+='<div class="st-slbl">'+esc(_t('label.terminals',{n:o.terms.length}))+'</div><div class="st-chips">'+o.terms.map(t=>'<span>'+esc(t.n)+'</span>').join('')+'</div>';
  h+='<div class="st-slbl">'+_t('label.search_items_ships')+'</div><input id="'+ID('stCat')+'" placeholder="'+esc(_t('search.item_ship_placeholder'))+'"><div id="'+ID('stCatRes')+'"><p class="sc-lmw-muted" style="font-size:.82rem"></p></div>';
  h+='<div class="st-coord">'+esc(_t('coord.from_star',{dist:stDist(Math.hypot(o.x,o.y,o.z)),x:tn(Math.round(o.x)),y:tn(Math.round(o.y)),z:tn(Math.round(o.z))}))+'<br>'+esc(_t('data.version_prefix',{version:(D.d.version||'').replace(/-LIVE.*/,'')}))+(o.h?esc(_t('note.not_on_starmap')):'')+(o.approx?esc(_t('note.approx_position')):'')+(isDe&&o.dde?esc(_t('note.de_ini_source')):'')+'</div>';
  body.innerHTML=h; if(SC.guides) SC.guides.wire(body,o);
  const de=$('stDesc'); if(de) de.onclick=()=>de.classList.toggle('open');
  const wk=$('stWkBox'); if(wk) stWikeloHTML(wk);
  const sg=$('stShopGo'); if(sg) sg.onclick=()=>{ const bx=$('stShopBox'); bx.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('status.loading_uex')+'</p>'; stShopHTML(o,bx); };
  const jg=$('stJumpGo'); if(jg) jg.onclick=()=>{ const t=D.by[jg.getAttribute('data-to')]; if(!t) return; window.__stCtl.flyTo(t); openStPanel(t); };
  const misBox=$('stMisBox'), goodsBox=$('stGoodsBox');
  stMis().then(M=>{ const box=misBox; if(!box||!ROOT.contains(box)) return; const ids=[]; let x=o; while(x){ ids.push(x.id); if(x.k==='planet'||(D.by[x.p]||{}).k==='star') break; x=D.by[x.p]; }
    const seen=new Set(), rows=[]; ids.forEach(id=>(M.byLoc[id]||[]).forEach(i=>{ if(!seen.has(i)){ seen.add(i); rows.push(i); } }));
    if(!rows.length) return; rows.sort((a,b)=>M.d.groups[b].n-M.d.groups[a].n);
    const area=ids.length>1?D.by[ids[ids.length-1]].n:o.n;
    box.innerHTML='<div class="st-slbl">'+esc(_t('mission.area_heading',{area}))+'</div>'+rows.slice(0,12).map(i=>stMisRow(M.d.groups[i],i)).join('')+(rows.length>12?'<p class="sc-lmw-muted" style="font-size:.76rem">'+esc(_t('mission.more_groups',{n:rows.length-12}))+'</p>':''); });
  const cf=$('stCat'), cr=$('stCatRes');
  if(cf) cf.oninput=async()=>{ const cat=await uexCatalog(); const q=cf.value.toLowerCase().trim(); if(q.length<2){ cr.innerHTML='<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('search.min_2_chars')+'</p>'; return; }
    const its=cat.items.filter(x=>x.n.toLowerCase().indexOf(q)>=0).slice(0,8).map(x=>({t:'item',o:x}));
    const shs=cat.ships.filter(x=>x.n.toLowerCase().indexOf(q)>=0).slice(0,8).map(x=>({t:'ship',o:x}));
    const all=shs.concat(its);
    cr.innerHTML=all.length?all.map((r,i)=>'<div class="st-res" data-ci="'+i+'"><b>'+(r.t==='ship'?'🚀 ':'📦 ')+esc(r.o.n)+'</b><div class="rp" id="'+ID('stRp'+i)+'">'+(r.t==='ship'?_t('label.ship'):esc(r.o.s||_t('label.item')))+esc(_t('hint.tap_for_price'))+'</div></div>').join(''):'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('common.nothing_in_catalog')+'</p>';
    cr.querySelectorAll('.st-res').forEach(el=>el.onclick=()=>uexPriceInto(all[+el.getAttribute('data-ci')],$('stRp'+el.getAttribute('data-ci')),o.n)); };
  if(comm.length){ let goods=[];
    try{ const lists=await Promise.all(comm.map(t=>fetch(UEX_BASE+'/commodities_prices?id_terminal='+t.id).then(r=>r.json()).then(d=>(d&&d.data)||[]).catch(()=>[])));
      const merged={}; lists.forEach(list=>list.forEach(r=>{ const nm=r.commodity_name; if(!nm) return; const g=merged[nm]||(merged[nm]={n:nm,buy:0,sell:0}); if(r.price_buy>g.buy) g.buy=r.price_buy; if(r.price_sell>g.sell) g.sell=r.price_sell; }));
      goods=Object.values(merged).sort((a,b)=>a.n.localeCompare(b.n)); }catch(e){}
    const box=goodsBox; if(!box||!ROOT.contains(box)) return;
    const grow=g=>'<div class="st-grow"><span>'+esc(g.n)+'</span><span class="gp">'+'<b class="st-buy" title="'+esc(_t('label.buy_here'))+'">'+(g.buy?uexMoney(g.buy):'–')+'</b><b class="st-sell" title="'+esc(_t('label.sell_here'))+'">'+(g.sell?uexMoney(g.sell):'–')+'</b>'+'</span></div>';
    box.innerHTML=goods.length?'<input id="'+ID('stGoodF')+'" placeholder="'+esc(_t('ware.filter_placeholder'))+'"><div class="st-grow st-gh"><span>'+esc(_t('table.commodity'))+'</span><span class="gp"><span>'+esc(_t('table.buy'))+'</span><span>'+esc(_t('table.sell'))+'</span></span></div><div id="'+ID('stGoods')+'">'+goods.map(grow).join('')+'</div>':'<p class="sc-lmw-muted" style="font-size:.85rem">'+_t('price.none_uex')+'</p>';
    const gf=$('stGoodF'); if(gf) gf.oninput=()=>{ const q=gf.value.toLowerCase().trim(); $('stGoods').innerHTML=goods.filter(g=>!q||g.n.toLowerCase().indexOf(q)>=0).map(grow).join('')||'<p class="sc-lmw-muted" style="font-size:.82rem">'+_t('ware.none_found')+'</p>'; }; }
}
window.openStPanel=openStPanel;
// ---- UEX-Marktdaten fuer Orte im Erkunden-Modus ----
const UEX_BASE='https://api.uexcorp.space/2.0';
const uexMoney=n=>(n&&n>0)?tn(Math.round(n))+' aUEC':'—';
async function uexTerminals(){ if(window.__uexTerm) return window.__uexTerm; try{ const r=await fetch(UEX_BASE+'/terminals?id_star_system=68'); const d=await r.json(); window.__uexTerm=(d&&d.data)||[]; }catch(e){ window.__uexTerm=[]; } return window.__uexTerm; }
async function uexCatalog(){ if(window.__uexCat) return window.__uexCat; const cat={items:[],ships:[]};
  try{ const r=await fetch(pathOf('data/items.json'),{cache:'no-store'}); const d=await r.json(); cat.items=(d.items||[]).filter(x=>x&&x.n); }catch(e){}
  try{ const r=await fetch(pathOf('data/vehicles.json'),{cache:'no-store'}); const d=await r.json(); cat.ships=(d.ships||[]).filter(x=>x&&x.n); }catch(e){}
  if(cat.items.length&&cat.ships.length) window.__uexCat=cat; return cat; }
async function uexPriceInto(rec,el,loc){
  if(!el||el.getAttribute('data-done')) return; el.setAttribute('data-done','1'); el.textContent=_t('status.loading_price');
  try{
    if(rec.t==='ship'){ if(!rec.o.i){ el.textContent=_t('notice.pledge_only'); return; }
      const d=await fetch(UEX_BASE+'/vehicles_purchases_prices?id_vehicle='+rec.o.i).then(r=>r.json()); const rows=((d&&d.data)||[]).filter(x=>x.price_buy>0);
      if(!rows.length){ el.textContent=_t('notice.not_buyable_ingame',{pledge:rec.o.msrp?_t('label.also_pledge',{n:rec.o.msrp}):''}); return; }
      const avg=Math.round(rows.reduce((a,b)=>a+b.price_buy,0)/rows.length); const where=rows.map(x=>x.terminal_name).filter(Boolean);
      el.innerHTML='Ø '+uexMoney(avg)+' '+esc(_t('label.buyable_at',{where:where.slice(0,3).join(', ')||'—'}))+(hereMark(where,loc));
    } else { if(!rec.o.i){ el.textContent=_t('notice.no_uex_data'); return; }
      const d=await fetch(UEX_BASE+'/items_prices?id_item='+rec.o.i).then(r=>r.json()); const rows=((d&&d.data)||[]).filter(x=>x.price_buy>0).sort((a,b)=>a.price_buy-b.price_buy);
      if(!rows.length){ el.textContent=_t('notice.not_buyable_anywhere'); return; }
      const where=rows.map(x=>x.terminal_name).filter(Boolean);
      el.innerHTML=esc(_t('label.from_price',{price:uexMoney(rows[0].price_buy)}))+' · '+esc(where.slice(0,3).join(', '))+(hereMark(where,loc));
    }
  }catch(e){ el.textContent=_t('error.price_load_failed'); }
}
function hereMark(where,loc){ return where.some(w=>w&&loc&&(w.indexOf(loc)>=0||loc.indexOf(w)>=0))?' <span style="color:#37e1ff">'+esc(_t('label.also_here'))+'</span>':''; }

// ---- SCLMW.mount(el, opts): der EINE Einstiegspunkt fuer jede Einbettung (eigene Seite, iframe,
//      <div id="sc-lmw"> in einer fremden Seite). Haengt Canvas + UI in el ein, laedt three.js
//      ueber holo.js nach und startet die Karte direkt im "Erkunden"-Modus. Nur EINE Karte
//      gleichzeitig (siehe stantonScene(): eine neue mount() raeumt die alte selbst auf). ----
function mount(el, opts){
  opts=opts||{};
  // Oberflaechen-Sprache ZUERST ermitteln, bevor irgendein UI-Text gebaut wird (enterStExplore()
  // unten ruft schon _t() auf). Reihenfolge siehe js/i18n.js: eigene Wahl (localStorage) >
  // opts.lang/data-lang/config.js LANG > Browsersprache.
  // Resolve the UI language FIRST, before any UI text is built (enterStExplore() below already
  // calls _t()). Order: see js/i18n.js -- the user's own choice (localStorage) > opts.lang/
  // data-lang/config.js LANG > browser language.
  if(SC.i18n) SC.i18n.init({lang:opts.lang});
  if(typeof el==='string') el=document.querySelector(el);
  if(!el) throw new Error('SCLMW.mount: Container-Element nicht gefunden / container element not found: '+el);
  if(ROOT&&ROOT!==el) unmount();
  ROOT=el; ROOT.classList.add('sc-lmw');
  BASE=String(opts.base||BASE||'./'); if(BASE.slice(-1)!=='/') BASE+='/';
  if(SC.setHoloBase) SC.setHoloBase(BASE);
  window.LIVEMAP_CONFIG=window.LIVEMAP_CONFIG||{};
  if(opts.playersUrl) window.LIVEMAP_CONFIG.PLAYERS_URL=opts.playersUrl;
  else if(!window.LIVEMAP_CONFIG.PLAYERS_URL) window.LIVEMAP_CONFIG.PLAYERS_URL=pathOf('players.example.json');
  if(opts.playersHeaders) window.LIVEMAP_CONFIG.PLAYERS_HEADERS=opts.playersHeaders;
  if(opts.pollMs!=null) window.LIVEMAP_CONFIG.PLAYERS_POLL_MS=opts.pollMs;
  var canvas=$('stCanvas');
  if(!canvas){ canvas=document.createElement('canvas'); canvas.id=ID('stCanvas'); canvas.className='st-canvas'; ROOT.appendChild(canvas); }
  function boot(){
    // stantonScene() setzt window.__stCtl SELBST (Seiteneffekt) und gibt nur die
    // cleanup()-Funktion zurueck -- die duerfen wir window.__stCtl nicht ueberschreiben lassen,
    // sonst verliert enterStExplore() den echten Kontroll-Objekt (Bug: "ctl.zoom01 is not a
    // function", gefunden beim Playwright-Test).
    // stantonScene() sets window.__stCtl ITSELF (side effect) and only returns the cleanup()
    // function -- must not let that overwrite window.__stCtl, or enterStExplore() loses the
    // real control object (bug: "ctl.zoom01 is not a function", found via the Playwright test).
    window.__stClean=stantonScene(canvas,'stanton');
    if(!window.__stCtl){ setTimeout(boot,50); return; }
    if(opts.standalone) ROOT.classList.add('st-standalone');
    enterStExplore();
  }
  if(SC.loadThree) SC.loadThree().then(boot).catch(boot); else boot();
  return {unmount:unmount};
}
function unmount(){
  if(!ROOT) return;
  try{ exitStExplore(); }catch(e){}
  if(window.__stClean){ try{ window.__stClean(); }catch(e){} window.__stClean=null; }
  ROOT.classList.remove('sc-lmw','st-standalone','st-explore');
  ROOT.innerHTML='';
  ROOT=null;
}
SC.mount=mount; SC.unmount=unmount;
// Rueckwaertskompatibel: index.html rief bisher initLiveMap()/exitLiveMap() direkt (kein
// SCLMW.mount() noetig fuer die eigenstaendige Seite, Container ist dort einfach <body>).
// Backward compatible: index.html used to call initLiveMap()/exitLiveMap() directly (no
// SCLMW.mount() needed for the standalone page, its container is simply <body>).
window.initLiveMap=function(opts){ opts=opts||{}; mount(opts.container||document.body, Object.assign({standalone:true,base:opts.base||'./'},opts)); };
window.exitLiveMap=exitStExplore;
})();
