/* SC LMW Guides: Ablauf und Timer an den Orten der grossen Loops / gameplay guides at the locations of the big loops.
 *
 * DE: Contested Zones (Checkmate, Orbituary, Ruin Station), Supervisor-Stationen und Executive Hangar mit Live-Timer,
 *     dazu die dauerhaften Loops Align & Mine, Storm Breaker (Apex Valakkar), Siege of Orison und Jumptown.
 *     Alle Orte untereinander verlinkt. Ausserdem "Als Beute zu finden" in der Item-Ansicht, wenn data/loot.json
 *     gebaut wurde (scripts/loot-build.py). Quellen und Lizenzen: CREDITS.md.
 * EN: Contested Zones (Checkmate, Orbituary, Ruin Station), supervisor stations and the Executive Hangar with a live
 *     timer, plus the permanent loops Align & Mine, Storm Breaker (Apex Valakkar), Siege of Orison and Jumptown.
 *     All locations link to each other. Also "Found as loot" in the item view when data/loot.json has been built
 *     (scripts/loot-build.py). Sources and licenses: CREDITS.md.
 *
 * Wird von js/starmap.js aufgerufen / called by js/starmap.js:
 *   SCLMW.guides.html(o)            -> HTML-Block fuer das Stationsfenster (leer, wenn der Ort keinen hat)
 *   SCLMW.guides.wire(panel, o)     -> Timer, Knoepfe, Links verdrahten
 *   SCLMW.guides.loot(el, itemName) -> Beute-Block in der Item-Ansicht fuellen
 */
(function(){
  'use strict';
  var SC=window.SCLMW=window.SCLMW||{};
  function L(){ return (SC.i18n&&SC.i18n.lang)||'en'; }
  function T(o){ return o[L()]||o.en; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function loc(){ return L()==='de'?'de-DE':'en-US'; }
  function ls(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,String(v)); }catch(e){ return null; } }
  function SCB(){ return SC.basePath?SC.basePath():'./'; }
  function link(n,label){ return '<a class="lmw-go" data-go="'+esc(n)+'">'+esc(label||n)+'</a>'; }

  // ---------- Executive Hangar (PYAM-EXHANG-0-1): Zyklus nach exec.xyxyll.com (MIT), optional data/exec.json ----------
  var EX={anchor:Date.parse('2026-09-16T15:05:05.639-04:00'),on:65,off:120,drift:350,src:'exec.xyxyll.com v2.2.29'}, EXL=null;
  function exLoad(){ return EXL||(EXL=fetch(SCB()+'data/exec.json',{cache:'no-store'}).then(function(r){ return r.ok?r.json():null; }).then(function(d){
    if(d&&d.anchor_ms>0&&d.online_min>0&&d.offline_min>0){ EX.anchor=d.anchor_ms; EX.on=d.online_min; EX.off=d.offline_min; EX.drift=d.drift_ms||0; EX.src=(d.source||'?')+' v'+(d.version||'?'); } }).catch(function(){})); }
  function exState(t){ var cyc=(EX.on+EX.off)*60000+EX.drift, open=Math.round(cyc*EX.on/(EX.on+EX.off)), close=cyc-open, e=(t-EX.anchor)%cyc; if(e<0) e+=cyc;
    var on=e<open, start=t-e, Lt=[], i, g;
    if(on){ g=Math.max(0,5-Math.floor(e/open*EX.on/12)); for(i=0;i<5;i++) Lt.push(i<g?'g':'o'); }
    else { g=Math.min(4,Math.floor((e-open)/close*5)); for(i=0;i<5;i++) Lt.push(i<g?'g':'r'); }
    return {on:on,left:on?open-e:cyc-e,opens:[1,2,3].map(function(k){ return start+k*cyc; }),lights:Lt,openMin:Math.round(open/60000)}; }
  SC.guides_exState=exState;   // fuer Tests / for tests
  function clock(ms){ return new Date(ms).toLocaleTimeString(loc(),{hour:'2-digit',minute:'2-digit'}); }
  function dur(ms){ var s=Math.max(0,Math.ceil(ms/1000)), h=Math.floor(s/3600), m=Math.floor(s%3600/60), x=s%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); }
  var RUIN_CYC=21*60000, RUIN_OPEN=60000;

  // ---------- Texte / texts ----------
  var W={
    exhang:{de:'Executive Hangar',en:'Executive Hangar'}, open:{de:'OFFEN',en:'OPEN'}, closed:{de:'ZU',en:'CLOSED'}, soon:{de:'GLEICH',en:'SOON'},
    closesIn:{de:'schließt in ',en:'closes in '}, opensIn:{de:'öffnet in ',en:'opens in '}, oclock:{de:' Uhr',en:''},
    next:{de:'Nächste Öffnungen: ',en:'Next openings: '}, each:{de:', je {m} Min offen',en:', {m} min open each'},
    ruinDoor:{de:'⏱ Tresortür Ruin',en:'⏱ Ruin vault door'}, here:{de:'📍 So läuft es hier',en:'📍 How it works here'},
    keys:{de:'🔑 Keys und Boards hier',en:'🔑 Keys and boards here'}, route:{de:'🗺 Weg durch die Station',en:'🗺 Route through the station'}, tapBig:{de:'antippen = groß',en:'tap = full size'},
    respawn:{de:'🔁 Respawn-Timer',en:'🔁 Respawn timers'}, tapStart:{de:'antippen = starten',en:'tap = start'}, back:{de:'wieder da',en:'ready'}, min:{de:' Min',en:' min'},
    loop:{de:'🗺 Die ganze Runde',en:'🗺 The full run'},
    ruinAsk:{de:'Die Tür läuft auf jedem Server eigen. Steh in der Ghost Arena und tipp, sobald sie aufgeht (weißes Licht):',en:'The door runs on its own per server. Stand in the Ghost Arena and tap as soon as it opens (white light):'},
    ruinNow:{de:'Tür geht JETZT auf',en:'Door opens NOW'}, resync:{de:'Neu abgleichen',en:'Re-sync'}, forget:{de:'Vergessen',en:'Forget'},
    legend:{de:'Grün frei · Blau braucht blaue Karte · Rot braucht rote Karte · ⚡ Sicherungstür · Rosa = Board. Karte: ',en:'Green free · blue needs blue keycard · red needs red keycard · ⚡ fuse door · pink = board. Map: '},
    fuse:{de:'Sicherungstüren bleiben 30 bis 60 s offen, von innen am linken Panel schließen. Hangar-Zyklus: ',en:'Fuse doors stay open 30 to 60 s, close them from inside at the left panel. Hangar cycle: '},
    srcs:{de:'. Ablauf: starcitizen.tools, Respawn: exectimer.com.',en:'. Procedure: starcitizen.tools, respawn: exectimer.com.'},
    lootH:{de:'🎒 Als Beute zu finden',en:'🎒 Found as loot'}, best:{de:'beste Chance',en:'best chance'}, good:{de:'gut',en:'good'}, rare:{de:'seltener',en:'rarer'},
    lootMore:{de:'+{n} weitere, dort aber deutlich seltener.',en:'+{n} more, but much rarer there.'},
    lootNote:{de:'Grobe Einschätzung aus den Spieldaten (Friendly Fire Department, Build {b}). Es sind Kisten- und Ortsarten, keine festen Orte. Die Chance je Kiste ist überall klein, der Balken zeigt nur, wo sie für dieses Item am besten ist.',
              en:'Rough estimate from the game data (Friendly Fire Department, build {b}). These are container and location types, not fixed places. The chance per container is small everywhere; the bar only shows where it is best for this item.'}};
  function w(k,v){ var s=T(W[k]); if(v) for(var x in v) s=s.split('{'+x+'}').join(v[x]); return s; }

  var LOOP={de:function(){ return '<ol class="lmw-ol"><li><b>Rote Keycard</b> drucken: '+link('PYAM-SUPVISR-3-4','SUPVISR-3-4')+' oder '+link('PYAM-SUPVISR-3-5','SUPVISR-3-5')+'</li><li>'+link('Checkmate')+': Board 1, 2, 3 und blaue Keycards</li><li>'+link('Orbituary')+': Board 4 und 7 (braucht Rot und Blau)</li><li>'+link('Ruin Station')+': Board 5 und 6 im Tresor hinter der Zeittür</li><li>Alle 7 Boards zum '+link('PYAM-EXHANG-0-1','Executive Hangar')+', solange die Lichter grün sind</li></ol>'; },
            en:function(){ return '<ol class="lmw-ol"><li>Print a <b>red keycard</b>: '+link('PYAM-SUPVISR-3-4','SUPVISR-3-4')+' or '+link('PYAM-SUPVISR-3-5','SUPVISR-3-5')+'</li><li>'+link('Checkmate')+': boards 1, 2, 3 and blue keycards</li><li>'+link('Orbituary')+': boards 4 and 7 (needs red and blue)</li><li>'+link('Ruin Station')+': boards 5 and 6 in the vault behind the timer door</li><li>Bring all 7 boards to the '+link('PYAM-EXHANG-0-1','Executive Hangar')+' while the lights are green</li></ol>'; }};
  var IMG='img/guides/', CCBY=' (CC BY-SA 4.0, starcitizen.tools)';
  var CZ={
    'PYAM-EXHANG-0-1':{t:'ex',img:'cz-exhang.webp',by:'Kerast'+CCBY,
      de:'<div class="lmw-warn">⚠ Boards beim Reinstecken <b>nicht in die Hand nehmen</b>, sie können wegbuggen. Einfach am Modul einstecken, das Spiel zieht die richtigen Boards automatisch aus dem Inventar.</div><div class="lmw-warn">⚠ Seit 4.9 spawnt der Loot im Hangar oft gar nicht oder nur selten.</div>'+
        '<p>Drei Asteroiden-Basen nahe der Sonne, <b>nur eine ist aktiv</b>, alle gleich gebaut. Das Hangartor liegt tief auf der Gegenseite des Asteroiden.</p><ol class="lmw-ol"><li><b>Lichter prüfen</b> im Schwerelos-Raum: mindestens eins grün, <b>keins rot</b>. Alle 5 grün = gerade aufgegangen, volle 65 Min.</li><li><b>Boards einstecken</b> in die 3 Module an den Rohren: Modul 1 Board 1 bis 3, Modul 2 Board 4 bis 6, Modul 3 Board 7. Dann öffnet die Haupttür (30 Min, Alarm vor dem Schließen, wer drin ist, stirbt).</li><li>Durch die Tür in den <b>Fahrstuhl</b> zum Hangar.</li><li><b>Hangar checken:</b> campt da jemand?</li><li>An der <b>Hangar-Konsole (ASOP) das Schiff rufen</b> (nur ein Spieler). Gleichzeitig geht das Hangartor auf und schließt nach 10 Min für immer.</li><li><b>Schnell Loot greifen</b>, dann ins Schiff und raus: durchs offene Tor kommt jeder rein.</li></ol>'+
        '<p><b>Ziehbare Schiffe</b> (Military- oder Stealth-Variante): F7A Hornet Mk II, F8C Lightning, Corsair, Cutlass Black, Syulen, Meteor (je Executive), Guardian MX und Scorpius (Wikelo War Special).</p>',
      en:'<div class="lmw-warn">⚠ Do <b>not take the boards in hand</b> when inserting, they can bug out. Just use the module, the game takes the right boards from your inventory.</div><div class="lmw-warn">⚠ Since 4.9 the hangar loot often spawns rarely or not at all.</div>'+
        '<p>Three asteroid bases near the sun, <b>only one is active</b>, all built the same. The hangar door is deep on the far side of the asteroid.</p><ol class="lmw-ol"><li><b>Check the lights</b> in the zero-g room: at least one green, <b>none red</b>. All 5 green = just opened, full 65 min.</li><li><b>Insert the boards</b> into the 3 modules on the pipes: module 1 boards 1 to 3, module 2 boards 4 to 6, module 3 board 7. The main door opens (30 min, alarm before it closes, anyone inside dies).</li><li>Through the door into the <b>elevator</b> to the hangar.</li><li><b>Check the hangar:</b> anyone camping?</li><li><b>Call the ship at the hangar console (ASOP)</b> (one player only). The hangar door opens at the same time and closes for good after 10 min.</li><li><b>Grab loot fast</b>, then into the ship and out: anyone can come in through the open door now.</li></ol>'+
        '<p><b>Claimable ships</b> (military or stealth variant): F7A Hornet Mk II, F8C Lightning, Corsair, Cutlass Black, Syulen, Meteor (Executive each), Guardian MX and Scorpius (Wikelo War Special).</p>',
      keys:{de:'<li><b>Brauchst:</b> alle 7 Boards.</li><li><b>Bekommst:</b> ein Executive-Schiff.</li>',en:'<li><b>Need:</b> all 7 boards.</li><li><b>Get:</b> an Executive ship.</li>'}},
    'Checkmate':{t:'cm',link:'https://starcitizen.tools/File:Contested_Zones_Checkmate_Map_v2.jpg',
      de:'<ul class="lmw-ul"><li><b>Board 1:</b> hinter Sicherungstür und roter Tür.</li><li><b>Board 2 und 3:</b> im Hangar der Zone. Weg A: Sicherung, Rot, Blau. Weg B: zwei Sicherungen, zwei Blau.</li><li><b>Blaue Keycards:</b> einfachste Quelle im System, nur zwei Sicherungstüren davor.</li></ul>',
      en:'<ul class="lmw-ul"><li><b>Board 1:</b> behind a fuse door and the red door.</li><li><b>Boards 2 and 3:</b> in the zone hangar. Route A: fuse, red, blue. Route B: two fuses, two blue.</li><li><b>Blue keycards:</b> easiest source in the system, only two fuse doors in front.</li></ul>',
      keys:{de:'<li><b>Bekommst:</b> blaue Keycards.</li><li><b>Brauchst:</b> rote Karte für Board 1, blaue für Board 2 und 3.</li>',en:'<li><b>Get:</b> blue keycards.</li><li><b>Need:</b> red card for board 1, blue for boards 2 and 3.</li>'}},
    'Orbituary':{t:'ob',img:'cz-orbituary.webp',by:'Terada'+CCBY,
      de:'<ul class="lmw-ul"><li><b>Board 4:</b> Sicherung, rote Tür, zweite Sicherung.</li><li><b>Board 7:</b> im Hangar: Sicherung, Rot, Sicherung, dann zwei blaue Türen.</li><li><b>Blaue Keycards:</b> 2 Drucker, beide hinter einer roten Tür.</li></ul>',
      en:'<ul class="lmw-ul"><li><b>Board 4:</b> fuse, red door, second fuse.</li><li><b>Board 7:</b> in the hangar: fuse, red, fuse, then two blue doors.</li><li><b>Blue keycards:</b> 2 printers, both behind a red door.</li></ul>',
      keys:{de:'<li><b>Bekommst:</b> blaue Keycards (hinter der roten Tür).</li><li><b>Brauchst:</b> rote Karte, dazu blaue für Board 7.</li>',en:'<li><b>Get:</b> blue keycards (behind the red door).</li><li><b>Need:</b> red card, plus blue for board 7.</li>'}},
    'Ruin Station':{t:'ru',img:'cz-ruin.webp',by:'Terada'+CCBY,
      de:'<ul class="lmw-ul"><li><b>Ghost Arena</b> ist der Knoten: von dort zu Crypt, Wasteland, Last Resort und Tresor.</li><li>Crypt-, Wasteland- und Last-Resort-Karte liegen je hinter einer Sicherungstür.</li><li><b>Tresor (Zeittür):</b> 1 Min offen, 20 Min zu, nicht von Hand zu öffnen. 30 s vorher geht in der Ghost Arena <b>blaues Licht</b> an, solange offen <b>weißes</b>.</li><li><b>Board 6:</b> im Tresor. <b>Board 5:</b> im selben Raum hinter der Crypt-Tür.</li></ul>',
      en:'<ul class="lmw-ul"><li>The <b>Ghost Arena</b> is the hub: from there to Crypt, Wasteland, Last Resort and the vault.</li><li>Crypt, Wasteland and Last Resort keycards are each behind a fuse door.</li><li><b>Vault (timer door):</b> 1 min open, 20 min closed, cannot be opened by hand. 30 s before, <b>blue light</b> turns on in the Ghost Arena, <b>white</b> while open.</li><li><b>Board 6:</b> in the vault. <b>Board 5:</b> in the same room behind the Crypt door.</li></ul>',
      keys:{de:'<li><b>Bekommst:</b> Crypt-, Wasteland-, Last-Resort-Key.</li><li><b>Brauchst:</b> nur Sicherungen. In den Tresor nur durch die Zeittür.</li>',en:'<li><b>Get:</b> Crypt, Wasteland, Last Resort keys.</li><li><b>Need:</b> fuses only. Into the vault only through the timer door.</li>'}},
    'PYAM-SUPVISR-3-4':{t:'sv',img:'cz-supvisr.webp',by:'Kerast'+CCBY,
      de:'<ul class="lmw-ul"><li><b>Rote Supervisor-Keycard</b> für die roten Türen in '+'{CM} und {OB}.</li><li>Nicht über die Suche der Sternenkarte zu finden. Zwilling: {TWIN}.</li><li>Drucker im geschlossenen Raum: über Kisten in einen Gang in der Decke.</li></ul>',
      en:'<ul class="lmw-ul"><li><b>Red supervisor keycard</b> for the red doors in {CM} and {OB}.</li><li>Not findable via starmap search. Twin: {TWIN}.</li><li>Printer in a closed room: climb boxes into a passage in the ceiling.</li></ul>',
      twin:'PYAM-SUPVISR-3-5',keys:{de:'<li><b>Bekommst:</b> rote Keycard, Drucker 30 Min Abklingzeit.</li>',en:'<li><b>Get:</b> red keycard, printer 30 min cooldown.</li>'}}};
  CZ['PYAM-SUPVISR-3-5']=Object.assign({},CZ['PYAM-SUPVISR-3-4'],{twin:'PYAM-SUPVISR-3-4'});
  var TIMERS={cm:[['cm-b1',{de:'Blaue Karte 1',en:'Blue card 1'},15],['cm-b2',{de:'Blaue Karte 2',en:'Blue card 2'},15],['cm-b3',{de:'Blaue Karte 3',en:'Blue card 3'},15],['cm-t1','Board 1',30],['cm-t2','Board 2',30],['cm-t3','Board 3',30]],
    ob:[['ob-b1',{de:'Blaue Karte 1',en:'Blue card 1'},15],['ob-b2',{de:'Blaue Karte 2',en:'Blue card 2'},15],['ob-t4','Board 4',30],['ob-t7','Board 7',30]],
    ru:[['ru-cr',{de:'Crypt-Karte',en:'Crypt card'},15],['ru-lr',{de:'Last-Resort-Karte',en:'Last Resort card'},15],['ru-wl',{de:'Wasteland-Karte',en:'Wasteland card'},15],['ru-t5','Board 5',30],['ru-t6','Board 6',30]],
    sv:[['sv-34',{de:'Rote Karte 3-4',en:'Red card 3-4'},30],['sv-35',{de:'Rote Karte 3-5',en:'Red card 3-5'},30]]};

  // ---------- grosse Loops / big loops ----------
  var AM={t:'⛏ Align & Mine (Hathor)',
    de:function(){ return '<p>Alte Hathor-Laserplattformen (OLP) wieder anwerfen, der Laser sprengt eine Höhle voller seltener Erze frei.</p><ol class="lmw-ol"><li><b>An allen 3 PAF-Anlagen</b>: rote PAF-Keycard drucken, 3 <b>Alignment Blades</b> holen, nacheinander in die Konsole (die Schüssel muss sich erst fertig drehen). Jede Drehung lockt junge Valakkar an.</li><li>Nach der 3. Blade öffnet die Garage: eine <b>GP-XP Industrial Battery</b> mitnehmen, je PAF eine.</li><li><b>An der OLP:</b> 3 Batterien einsetzen, Priming-Knopf, <b>Laser Activation Keycard</b> drucken.</li><li>Zum <b>Aktivierungsbunker</b>: Karte rein, Knopf, der Laser feuert.</li><li>Danach in die Höhle: Carinite, Saldynium, Jaclium, Aphorite, Dolivine, Hadanite, Janalite.</li></ol><div class="lmw-warn">⚠ Die Höhle bleibt <b>2 Stunden</b> offen, dann stürzt sie ein. Wer drin ist, stirbt.</div><p>Plattformen: '+['Attritus OLP','Lamina OLP'].map(function(n){ return link(n); }).join(', ')+' (Daymar), '+['Ruptura OLP','Vivere OLP'].map(function(n){ return link(n); }).join(', ')+' (Aberdeen).</p>'; },
    en:function(){ return '<p>Restart the old Hathor orbital laser platforms (OLP); the laser blasts open a cave full of rare ores.</p><ol class="lmw-ol"><li><b>At all 3 PAF sites</b>: print a red PAF keycard, get 3 <b>alignment blades</b>, insert them one by one (wait until the dish has finished moving). Each move lures juvenile Valakkar.</li><li>After the 3rd blade the garage opens: take a <b>GP-XP Industrial Battery</b>, one per PAF.</li><li><b>At the OLP:</b> insert the 3 batteries, press priming, print the <b>Laser Activation Keycard</b>.</li><li>Go to the <b>activation bunker</b>: card in, button, the laser fires.</li><li>Then into the cave: Carinite, Saldynium, Jaclium, Aphorite, Dolivine, Hadanite, Janalite.</li></ol><div class="lmw-warn">⚠ The cave stays open for <b>2 hours</b>, then it collapses. Anyone inside dies.</div><p>Platforms: '+['Attritus OLP','Lamina OLP'].map(function(n){ return link(n); }).join(', ')+' (Daymar), '+['Ruptura OLP','Vivere OLP'].map(function(n){ return link(n); }).join(', ')+' (Aberdeen).</p>'; }};
  var SB={t:'🐛 Storm Breaker (Apex Valakkar)',
    de:function(){ return '<p>ASD-Forschung in Pyro: Karte im Data Center kopieren, im Lazarus-Labor das Ei öffnen, das den <b>Apex-Valakkar</b> ruft (bis 300 m lang).</p><ol class="lmw-ol"><li>Zu einem <b>Farro Data Center</b> auf Pyro IV, z. B. '+link('Farro Data Center I')+'.</li><li>Im <b>Auxiliary Airlocked Office</b> die Karte „Data Processing Access“ holen.</li><li>Damit in <b>Data Processing</b> und die <b>Specimen Cache Access: Lazarus Complex</b> drucken.</li><li>Nach Pyro I über einen <b>Lazarus Transport Hub</b>, z. B. '+link('Lazarus Transport Hub Phoenix-I')+'. Fahrzeuge fallen im Störfeld aus, außer dem ATLS IKTI RAD.</li><li>Im Labor: Med Bay (sicher, <b>kein Respawn</b>). Der Code fürs Medical Lab sind die Ordnungszahlen der markierten Elemente im Periodensystem.</li><li>Mit der Karte das <b>Valakkar-Ei</b> öffnen: der Apex kommt. Beute: Irradiated Valakkar Fang und Pearl.</li></ol>'; },
    en:function(){ return '<p>ASD research in Pyro: copy a card at the data center, open the egg in the Lazarus lab, which summons the <b>Apex Valakkar</b> (up to 300 m long).</p><ol class="lmw-ol"><li>Go to a <b>Farro Data Center</b> on Pyro IV, e.g. '+link('Farro Data Center I')+'.</li><li>Get the "Data Processing Access" card in the <b>Auxiliary Airlocked Office</b>.</li><li>Use it to enter <b>Data Processing</b> and print the <b>Specimen Cache Access: Lazarus Complex</b>.</li><li>To Pyro I via a <b>Lazarus Transport Hub</b>, e.g. '+link('Lazarus Transport Hub Phoenix-I')+'. Vehicles fail in the storm field, except the ATLS IKTI RAD.</li><li>In the lab: med bay (safe, <b>no respawn</b>). The medical lab code is the atomic numbers of the highlighted elements in the periodic table.</li><li>Open the <b>Valakkar egg</b> with the card: the Apex arrives. Loot: Irradiated Valakkar Fang and Pearl.</li></ol>'; }};
  var SO={t:'⚔ Siege of Orison',img:'lp-orison.webp',by:'T00dled00'+CCBY,
    de:function(){ return '<p>Nine Tails haben die Plattformen im Inspiration Park besetzt. Eigene Instanz, <b>bis 4 Spieler</b>, reiner FPS-Einsatz.</p><ol class="lmw-ol"><li>Aufs <b>Dach des Crusader Industries Showroom</b> (Cloudview Center) zur Inspiration Station.</li><li>Durch das Instanz-Tor: Auftrag „Retake Platforms From Nine Tails“, Shuttle nach Solanki Platform.</li><li>Auf <b>3 Plattformen</b> je einen <b>IFF-Inverter</b> ausschalten.</li><li>Unbegrenzte Medbett-Checkpoints, kein MedGel.</li><li>Belohnung: aUEC, Blueprints, Waffen-Skin, BUL-H4 Super Heavy Armor, Vendetta HMG.</li></ol>'; },
    en:function(){ return '<p>The Nine Tails occupy the Inspiration Park platforms. Own instance, <b>up to 4 players</b>, pure FPS.</p><ol class="lmw-ol"><li>Go to the <b>roof of the Crusader Industries Showroom</b> (Cloudview Center), Inspiration Station.</li><li>Through the instance gate: contract "Retake Platforms From Nine Tails", shuttle to Solanki Platform.</li><li>Disable one <b>IFF inverter</b> on each of the <b>3 platforms</b>.</li><li>Unlimited med bed checkpoints, no MedGel used.</li><li>Rewards: aUEC, blueprints, weapon skin, BUL-H4 super heavy armor, Vendetta HMG.</li></ol>'; }};
  var JT={t:'💊 Jumptown',
    de:function(){ return '<p>Drogenlabor auf Daymar, nur Oberflächenlandung. Kaufen: SLAM, WiDoW, Altruciatoxin.</p><div class="lmw-warn">⚠ Hier campen gern Spieler.</div>'; },
    en:function(){ return '<p>Drug lab on Daymar, surface landing only. Buy: SLAM, WiDoW, Altruciatoxin.</p><div class="lmw-warn">⚠ Players like to camp here.</div>'; }};
  var LP={'Daymar':[AM],'Aberdeen':[AM],'Pyro I':[SB],'Pyro IV':[SB],'Orison':[SO],'Jumptown':[JT]};
  ['Attritus','Lamina','Ruptura','Vivere'].forEach(function(a){ LP[a+' OLP']=[AM,'lp-'+a.toLowerCase()+'.webp']; ['I','II','III'].forEach(function(r){ LP[a+' PAF-'+r]=[AM]; }); });
  ['I','II','III','IV','V','VI','VII','VIII','IX','X'].forEach(function(r){ LP['Farro Data Center '+r]=[SB]; });
  ['Phoenix','Tithonus'].forEach(function(a){ ['I','II','III'].forEach(function(r){ LP['Lazarus Transport Hub '+a+'-'+r]=[SB,'lp-lazarus.webp']; LP['Lazarus Complex '+a+'-'+r]=[SB,'lp-ei.webp']; }); });
  var IMG_BY={'lp-lazarus.webp':'Banon'+CCBY};

  function imgBlock(f,by){ var u=SCB()+IMG+f; return '<a href="'+esc(u)+'" target="_blank" rel="noopener"><img class="lmw-map" src="'+esc(u)+'" alt="" loading="lazy"></a><p class="lmw-src">'+esc(by)+'</p>'; }

  function html(o){
    var c=CZ[o.n], e=LP[o.n], h='';
    if(c){
      var tm=TIMERS[c.t]||[], txt=T(c).replace('{CM}',link('Checkmate')).replace('{OB}',link('Orbituary')).replace('{TWIN}',c.twin?link(c.twin,c.twin.replace('PYAM-','')):'');
      h+='<div class="lmw-g"><div class="lmw-h">🔓 '+w('exhang')+'</div><div class="lmw-ex"></div>'+(c.t==='ru'?'<div class="lmw-h">'+w('ruinDoor')+'</div><div class="lmw-ru"></div>':'')+
        (c.keys?'<div class="lmw-h">'+w('keys')+'</div><ul class="lmw-ul">'+T(c.keys)+'</ul>':'')+
        (c.img?'<div class="lmw-h">'+w('route')+' <small>'+w('tapBig')+'</small></div>'+imgBlock(c.img,w('legend')+c.by):c.link?'<p><a href="'+esc(c.link)+'" target="_blank" rel="noopener">'+w('route')+' ↗</a></p>':'')+
        '<div class="lmw-h">'+w('here')+'</div>'+txt+
        (tm.length?'<div class="lmw-h">'+w('respawn')+' <small>'+w('tapStart')+'</small></div><div class="lmw-tm">'+tm.map(function(x){ return '<button class="lmw-t" data-t="'+x[0]+'" data-m="'+x[2]+'"><b>'+esc(typeof x[1]==='string'?x[1]:T(x[1]))+'</b><span></span></button>'; }).join('')+'</div>':'')+
        '<div class="lmw-h">'+w('loop')+'</div>'+T(LOOP)()+'<p class="lmw-src">'+w('fuse')+'<span class="lmw-exsrc"></span>'+w('srcs')+'</p></div>';
    }
    if(e){ var G=e[0], img=e[1]||G.img;
      h+='<div class="lmw-g"><div class="lmw-h">'+esc(G.t)+'</div>'+(img?imgBlock(img,IMG_BY[img]||G.by||('T00dled00'+CCBY)):'')+T(G)()+'<p class="lmw-src">Quelle / source: starcitizen.tools</p></div>'; }
    return h;
  }

  function wire(panel,o){
    var box=panel.querySelector('.lmw-g'); if(!box) return;
    panel.querySelectorAll('.lmw-go').forEach(function(a){ a.onclick=function(){ var n=a.getAttribute('data-go'), D=window.SCLMW&&SCLMW.data&&SCLMW.data(); if(!D) return;
      var t=null; for(var k in D.by){ if(D.by[k].n===n){ t=D.by[k]; break; } } if(t&&window.openStPanel){ window.openStPanel(t); if(SCLMW.flyTo) SCLMW.flyTo(t); } }; });
    var ex=panel.querySelector('.lmw-ex'); if(!ex) return;
    var big=o.n==='PYAM-EXHANG-0-1', ru=panel.querySelector('.lmw-ru'), iv=null;
    panel.querySelectorAll('.lmw-t').forEach(function(b){ b.onclick=function(){ var k='lmw_t_'+b.getAttribute('data-t'), end=+ls(k)||0; ls(k,end>Date.now()?null:Date.now()+(+b.getAttribute('data-m'))*60000); tick(); }; });
    if(ru) ru.addEventListener('click',function(e){ var b=e.target.closest('[data-rs]'); if(!b) return; ls('lmw_ruin',b.getAttribute('data-rs')==='x'?null:Date.now()); tick(); });
    function tick(){ if(!document.body.contains(ex)){ clearInterval(iv); return; } var t=Date.now(), X=exState(t);
      ex.innerHTML='<div class="lmw-st '+(X.on?'on':'off')+'"><b>'+w(X.on?'open':'closed')+'</b> '+w(X.on?'closesIn':'opensIn')+dur(X.left)+' <span>('+clock(t+X.left)+w('oclock')+')</span></div><div class="lmw-li">'+X.lights.map(function(l){ return '<i class="'+l+'"></i>'; }).join('')+'</div>'+
        (big?'<div class="lmw-src">'+w('next')+X.opens.map(clock).join(', ')+w('oclock')+w('each',{m:X.openMin})+'</div>':'');
      var s=panel.querySelector('.lmw-exsrc'); if(s) s.textContent=EX.src;
      if(ru){ var sy=+ls('lmw_ruin')||0;
        if(!sy) ru.innerHTML='<p>'+w('ruinAsk')+'</p><button class="lmw-btn" data-rs="1">'+w('ruinNow')+'</button>';
        else { var e=(t-sy)%RUIN_CYC, op=e<RUIN_OPEN, nx=op?sy+Math.floor((t-sy)/RUIN_CYC)*RUIN_CYC+RUIN_OPEN:t+RUIN_CYC-e, blue=!op&&RUIN_CYC-e<=30000;
          ru.innerHTML='<div class="lmw-st '+(op?'on':'off')+'"><b>'+w(op?'open':blue?'soon':'closed')+'</b> '+w(op?'closesIn':'opensIn')+dur(nx-t)+' <span>('+clock(nx)+w('oclock')+')</span></div><button class="lmw-btn" data-rs="1">'+w('resync')+'</button> <button class="lmw-btn" data-rs="x">'+w('forget')+'</button>'; } }
      panel.querySelectorAll('.lmw-t').forEach(function(b){ var end=+ls('lmw_t_'+b.getAttribute('data-t'))||0, r=end-t; b.classList.toggle('run',r>0); b.classList.toggle('done',end>0&&r<=0);
        b.querySelector('span').textContent=r>0?dur(r):end?w('back'):b.getAttribute('data-m')+w('min'); }); }
    iv=setInterval(tick,1000); tick(); exLoad().then(tick);
  }

  // ---------- Beute / loot (data/loot.json aus scripts/loot-build.py, optional) ----------
  var LOOT=null;
  function loot(el,name){ if(!el) return; (LOOT?Promise.resolve(LOOT):fetch(SCB()+'data/loot.json').then(function(r){ return r.ok?r.json():{items:{}}; }).catch(function(){ return {items:{}}; })).then(function(D){ LOOT=D;
      if(!document.body.contains(el)) return; var Lr=(D.items||{})[String(name||'').toLowerCase().replace(/[^a-z0-9]/g,'')]; if(!Lr||!Lr.length) return;
      var cats=L()==='de'&&D.cats_de?D.cats_de:D.cats, word=function(r){ return w(r>=0.75?'best':r>=0.35?'good':'rare'); };
      el.innerHTML='<div class="lmw-h">'+w('lootH')+'</div>'+Lr.slice(0,8).map(function(x){ return '<div class="lmw-loot"><span>'+esc(cats[x[0]]||'?')+'</span><b><i style="width:'+Math.max(6,Math.round(x[1]*100))+'%"></i></b><em>'+word(x[1])+'</em></div>'; }).join('')+
        (Lr.length>8?'<p class="lmw-src">'+w('lootMore',{n:Lr.length-8})+'</p>':'')+'<p class="lmw-src">'+w('lootNote',{b:esc(D.build||'?')})+'</p>'; }); }

  SC.guides={html:html,wire:wire,loot:loot};
})();
