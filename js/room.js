/* Rooms: a team shares one code. The site does not read the game folder.
   "I am here" is a click on a place. Routes are Shift+click, then publish. */
(function(){
  var SC = window.SCLMW = window.SCLMW || {};
  var TOKEN = 'sclmw_room_token';
  var CODE = 'sclmw_room_code';
  var NICK = 'sclmw_room_nick';
  var FRAME = 'sclmw_room_frame';
  var CREW = 'sclmw_crew_frame';
  var DICT = {
    'zh-Hans': {
      title:'团队房间', lead:'这个网页不读取游戏目录。你在星图上点开地点，再点「我在这里」，队友就能看到。',
      s1:'填写昵称。建议用游戏里的名字，方便队长认出你。',
      s2:'队长建立房间，把房间码发给队员。',
      s3:'队员申请加入，队长确认后，大家只看得到这个房间。',
      nick:'昵称', create:'建立房间', join:'加入房间', code:'房间码',
      wait:'已提交申请，等待队长确认。', copy:'复制房间码', copied:'已复制',
      enter:'进入星图', leave:'离开房间', pending:'待确认', approve:'通过', reject:'拒绝',
      here:'我在这里', hereNeed:'先在星图上点开一个地点。',
      route:'标记路线', routeOn:'结束标记', routeHint:'按住 Shift，依次点地点。',
      note:'路线备注', publish:'发布给房间', clear:'清空', comment:'评论', send:'发送', del:'删除',
      mode:'谁可以画路线', modeCaptain:'仅队长', modeMembers:'队员也可以',
      members:'房间成员', fold:'收起', you:'你', captainTag:'队长',
      give:'设为队长', giveLeave:'交给他并离开', dissolve:'解散房间', dissolveLeave:'解散并离开', cancel:'取消',
      handTitle:'离开前先交接', handLead:'把队长交给一位队员，或解散房间。', handSolo:'房间里只有你。离开会解散这个房间。',
      errNick:'请填写 1 到 32 个字的昵称。', errRoom:'没有这个房间。',
      agoNow:'刚刚', agoSec:'{n} 秒前', agoMin:'{n} 分钟前', agoHour:'{n} 小时前', agoDay:'{n} 天前',
      noPlace:'星图上对不上这个地点。',
      errNet:'房间服务没连上。请在项目目录运行 python server/room_server.py，然后打开 http://127.0.0.1:8770/ 。', published:'已发布的路线', by:'来自',
      yours:'你的房间', switchRoom:'建立或加入别的房间',
      resumed:'上次留下的房间', resumedLead:'刷新后仍是这个房间。房间码没有变，可以直接进入星图。',
      freshCreate:'刚建立的房间', freshCreateLead:'把房间码发给队员。他们申请加入后，由你确认。',
      freshJoin:'刚加入的房间', freshJoinLead:'可以直接进入星图。',
      resumedWait:'上次提交的申请还在等队长确认。',
      link:'连到这台电脑', linkSent:'已经发给本机的 Starfix。回到那个窗口，点确认。',
      linkWait:'请在 Starfix 窗口点确认。',
      linkOn:'已连上房间',
      linkOff:'本机的 Starfix 没开。先双击 Starfix，等窗口出现后再点一次。',
      locGuide:'你可以手动标位置，也可以用附带程序试着自动读日志。手动：在星图上点开地点，再点「我在这里」。自动：项目自带 Starfix，源码都在 companion/，可以先读完再运行。它只读本机 Game.log，不进游戏、不读内存、不改游戏文件。打开后点「连到这台电脑」，回窗口确认。网页本身不读游戏目录。RSI 条款没有书面允许读日志，开不开由你决定。'
    },
    'zh-Hant': {
      title:'團隊房間', lead:'這個網頁不讀取遊戲資料夾。你在星圖上點開地點，再點「我在這裡」，隊友就能看到。',
      s1:'填寫暱稱。建議用遊戲裡的名字，方便隊長認出你。',
      s2:'隊長建立房間，把房間碼發給隊員。',
      s3:'隊員申請加入，隊長確認後，大家只看得到這個房間。',
      nick:'暱稱', create:'建立房間', join:'加入房間', code:'房間碼',
      wait:'已送出申請，等待隊長確認。', copy:'複製房間碼', copied:'已複製',
      enter:'進入星圖', leave:'離開房間', pending:'待確認', approve:'通過', reject:'拒絕',
      here:'我在這裡', hereNeed:'先在星圖上點開一個地點。',
      route:'標記路線', routeOn:'結束標記', routeHint:'按住 Shift，依序點地點。',
      note:'路線備註', publish:'發布給房間', clear:'清空', comment:'評論', send:'送出', del:'刪除',
      mode:'誰可以畫路線', modeCaptain:'僅隊長', modeMembers:'隊員也可以',
      members:'房間成員', fold:'收起', you:'你', captainTag:'隊長',
      give:'設為隊長', giveLeave:'交給他並離開', dissolve:'解散房間', dissolveLeave:'解散並離開', cancel:'取消',
      handTitle:'離開前先交接', handLead:'把隊長交給一位隊員，或解散房間。', handSolo:'房間裡只有你。離開會解散這個房間。',
      errNick:'請填寫 1 到 32 個字的暱稱。', errRoom:'沒有這個房間。',
      agoNow:'剛剛', agoSec:'{n} 秒前', agoMin:'{n} 分鐘前', agoHour:'{n} 小時前', agoDay:'{n} 天前',
      noPlace:'星圖上對不上這個地點。',
      errNet:'房間服務沒連上。請在專案目錄執行 python server/room_server.py，然後打開 http://127.0.0.1:8770/ 。', published:'已發布的路線', by:'來自',
      yours:'你的房間', switchRoom:'建立或加入別的房間',
      resumed:'上次留下的房間', resumedLead:'重新整理後仍是這個房間。房間碼沒有變，可以直接進入星圖。',
      freshCreate:'剛建立的房間', freshCreateLead:'把房間碼發給隊員。他們申請加入後，由你確認。',
      freshJoin:'剛加入的房間', freshJoinLead:'可以直接進入星圖。',
      resumedWait:'上次送出的申請還在等隊長確認。',
      link:'連到這台電腦', linkSent:'已經發給本機的 Starfix。回到那個視窗，點確認。',
      linkWait:'請在 Starfix 視窗點確認。',
      linkOn:'已連上房間',
      linkOff:'本機的 Starfix 沒開。先雙擊 Starfix，等視窗出現後再點一次。',
      locGuide:'你可以手動標位置，也可以用附帶程式試著自動讀日誌。手動：在星圖上點開地點，再點「我在這裡」。自動：專案自帶 Starfix，源碼都在 companion/，可以先讀完再執行。它只讀本機 Game.log，不進遊戲、不讀記憶體、不改遊戲檔案。打開後點「連到這台電腦」，回視窗確認。網頁本身不讀遊戲資料夾。RSI 條款沒有書面允許讀日誌，開不開由你決定。'
    },
    en: {
      title:'Team room', lead:'This page does not read the game folder. Open a place on the map, then choose “I am here”.',
      s1:'Pick a nickname. Your in-game name makes you easy to recognize.',
      s2:'The captain creates a room and shares the code.',
      s3:'Members apply. After the captain accepts, only this room can see each other.',
      nick:'Nickname', create:'Create room', join:'Join room', code:'Room code',
      wait:'Request sent. Waiting for the captain.', copy:'Copy code', copied:'Copied',
      enter:'Enter map', leave:'Leave room', pending:'Waiting', approve:'Accept', reject:'Decline',
      here:'I am here', hereNeed:'Open a place on the map first.',
      route:'Mark route', routeOn:'Stop marking', routeHint:'Hold Shift and click places in order.',
      note:'Route note', publish:'Publish to room', clear:'Clear', comment:'Comment', send:'Send', del:'Delete',
      mode:'Who can draw routes', modeCaptain:'Captain only', modeMembers:'Members too',
      members:'Room members', fold:'Minimize', you:'you', captainTag:'Captain',
      give:'Make captain', giveLeave:'Give and leave', dissolve:'Close room', dissolveLeave:'Close and leave', cancel:'Cancel',
      handTitle:'Hand off before leaving', handLead:'Give the captain role to a member, or close the room.', handSolo:'You are the only person here. Leaving closes the room.',
      errNick:'Use a nickname of 1 to 32 characters.', errRoom:'No room with that code.',
      agoNow:'Just now', agoSec:'{n}s ago', agoMin:'{n} min ago', agoHour:'{n} h ago', agoDay:'{n} d ago',
      noPlace:'This place is not on the map.',
      errNet:'Room service is not reachable. Run python server/room_server.py and open http://127.0.0.1:8770/ .', published:'Published routes', by:'by',
      yours:'Your room', switchRoom:'Create or join a different room',
      resumed:'Room from last time', resumedLead:'Refreshing kept this room. The code is unchanged. You can enter the map.',
      freshCreate:'Room just created', freshCreateLead:'Send the code to your team. You confirm them after they apply.',
      freshJoin:'Room just joined', freshJoinLead:'You can enter the map.',
      resumedWait:'Your earlier request is still waiting for the captain.',
      link:'Connect this computer', linkSent:'Sent to Starfix on this computer. Go back to that window and confirm.',
      linkWait:'Confirm in the Starfix window.',
      linkOn:'Connected to',
      linkOff:'Starfix is not running. Double-click Starfix, wait for its window, then click again.',
      locGuide:'You can mark your place by hand, or try the bundled program to read the game log. By hand: open a place on the map, then choose “I am here.” Automatic: this project includes Starfix. All of its source is in companion/. Read it before you run it. It only reads Game.log on this computer. It does not enter the game, read memory, or change game files. Open it, choose “Connect this computer,” then confirm in its window. This page does not read the game folder. The RSI terms do not permit reading the log in writing. You decide.'
    },
    de: {
      title:'Teamraum', lead:'Diese Seite liest keinen Spielordner. Öffne einen Ort auf der Karte und wähle „Ich bin hier“.',
      s1:'Nickname eintragen. Der Name aus dem Spiel hilft dem Captain.',
      s2:'Der Captain legt einen Raum an und gibt den Code weiter.',
      s3:'Mitglieder fragen an. Nach dem Ja sieht nur dieser Raum einander.',
      nick:'Nickname', create:'Raum anlegen', join:'Raum beitreten', code:'Raumcode',
      wait:'Anfrage ist raus. Der Captain muss zustimmen.', copy:'Code kopieren', copied:'Kopiert',
      enter:'Zur Karte', leave:'Raum verlassen', pending:'Offen', approve:'Annehmen', reject:'Ablehnen',
      here:'Ich bin hier', hereNeed:'Öffne zuerst einen Ort auf der Karte.',
      route:'Route markieren', routeOn:'Markieren beenden', routeHint:'Shift halten und Orte der Reihe nach anklicken.',
      note:'Notiz zur Route', publish:'Für den Raum veröffentlichen', clear:'Leeren', comment:'Kommentar', send:'Senden', del:'Löschen',
      mode:'Wer Routen zeichnen darf', modeCaptain:'Nur der Captain', modeMembers:'Auch Mitglieder',
      members:'Im Raum', fold:'Einklappen', you:'du', captainTag:'Captain',
      give:'Zum Captain machen', giveLeave:'Geben und gehen', dissolve:'Raum schließen', dissolveLeave:'Schließen und gehen', cancel:'Abbrechen',
      handTitle:'Vor dem Gehen übergeben', handLead:'Captain an ein Mitglied geben, oder den Raum schließen.', handSolo:'Du bist allein. Gehen schließt den Raum.',
      errNick:'Nickname mit 1 bis 32 Zeichen.', errRoom:'Diesen Raum gibt es nicht.',
      agoNow:'Gerade', agoSec:'vor {n} s', agoMin:'vor {n} min', agoHour:'vor {n} h', agoDay:'vor {n} d',
      noPlace:'Dieser Ort ist nicht auf der Karte.',
      errNet:'Der Raumdienst ist nicht erreichbar. python server/room_server.py starten und http://127.0.0.1:8770/ öffnen.', published:'Veröffentlichte Routen', by:'von',
      yours:'Dein Raum', switchRoom:'Anderen Raum anlegen oder beitreten',
      resumed:'Raum von zuletzt', resumedLead:'Nach dem Neuladen ist es derselbe Raum. Der Code ist unverändert. Du kannst die Karte öffnen.',
      freshCreate:'Gerade angelegt', freshCreateLead:'Gib den Code an das Team. Du bestätigst die Anfragen.',
      freshJoin:'Gerade beigetreten', freshJoinLead:'Du kannst die Karte öffnen.',
      resumedWait:'Deine frühere Anfrage wartet noch auf den Captain.',
      link:'Diesen Computer verbinden', linkSent:'An Starfix auf diesem Computer gesendet. Dort bestätigen.',
      linkWait:'Im Starfix-Fenster bestätigen.',
      linkOn:'Verbunden mit',
      linkOff:'Starfix läuft nicht. Starfix doppelklicken, auf das Fenster warten und erneut klicken.',
      locGuide:'Du kannst den Ort von Hand setzen oder das mitgelieferte Programm das Spiellog lesen lassen. Von Hand: Ort auf der Karte öffnen, dann „Ich bin hier“. Automatisch: das Projekt enthält Starfix. Der ganze Quelltext liegt in companion/. Lies ihn, bevor du ihn startest. Es liest nur die Game.log auf diesem Computer. Es betritt das Spiel nicht, liest keinen Speicher und ändert keine Spieldateien. Öffne es, wähle „Diesen Computer verbinden“ und bestätige im Fenster. Diese Seite liest keinen Spielordner. Die RSI-Bedingungen erlauben das Lesen des Logs nicht schriftlich. Du entscheidest.'
    }
  };
  function lang(){ return (SC.i18n && SC.i18n.lang) || 'en'; }
  function t(k){ var d = DICT[lang()] || DICT.en; return d[k] || DICT.en[k] || k; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function token(){ try{ return localStorage.getItem(TOKEN)||''; }catch(e){ return ''; } }
  function savedCode(){ try{ return localStorage.getItem(CODE)||''; }catch(e){ return ''; } }
  var state = null, draft = [], marking = false, note = '', statusMsg = '', selected = '', API = '', entered = false, roomKind = '', linkState = '', linkMiss = 0, leaving = false;

  function api(path, opt){
    opt = opt || {};
    var headers = {'Content-Type':'application/json'};
    if(token()) headers.Authorization = 'Bearer '+token();
    return fetch(API+path, {
      method: opt.method || 'GET',
      headers: headers,
      body: opt.body ? JSON.stringify(opt.body) : undefined,
      cache: 'no-store'
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(j){
        if(!r.ok){ var err = new Error((j&&j.error)||('http '+r.status)); err.status=r.status; err.body=j; throw err; }
        return j;
      });
    });
  }

  function root(){ return document.querySelector('.sc-lmw') || document.body; }

  function ensure(){
    var g = document.getElementById('stGate');
    if(!g){
      g = document.createElement('div');
      g.id = 'stGate';
      g.className = 'st-gate';
      g.hidden = true;
      root().appendChild(g);
    }
    var dock = document.getElementById('stRoom');
    if(!dock){
      dock = document.createElement('div');
      dock.id = 'stRoom';
      dock.className = 'st-room';
      dock.hidden = true;
      root().appendChild(dock);
      bindFrame(dock, {key:FRAME, minW:280, minH:220});
    }
    var crew = document.getElementById('stCrew');
    var crewIco = document.getElementById('stCrewIco');
    if(!crew){
      crew = document.createElement('div');
      crew.id = 'stCrew';
      crew.className = 'st-room st-crew';
      crew.hidden = true;
      root().appendChild(crew);
      crewIco = document.createElement('button');
      crewIco.type = 'button';
      crewIco.id = 'stCrewIco';
      crewIco.className = 'st-float-ico';
      crewIco.hidden = true;
      root().appendChild(crewIco);
      bindFrame(crew, {key:CREW, minW:220, minH:160});
      bindIcon(crewIco, CREW, function(){ patchFrame(CREW, {mini:0}); paint(); });
    }
    return {gate:g, dock:dock, crew:crew, crewIco:crewIco};
  }

  function readRaw(key){
    try{ var s = JSON.parse(localStorage.getItem(key)||'null'); if(s && typeof s==='object') return s; }catch(e){}
    return null;
  }
  function patchFrame(key, part){
    var s = readRaw(key) || {};
    Object.keys(part).forEach(function(k){ s[k] = part[k]; });
    try{ localStorage.setItem(key, JSON.stringify(s)); }catch(e){}
    return s;
  }
  function applyFrame(dock, key, minW, minH){
    var s = readRaw(key || FRAME);
    if(!s || !dock || typeof s.l!=='number' || !(s.w>0) || !(s.h>0)) return;
    minW = minW || 280; minH = minH || 220;
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = Math.max(minW, Math.min(s.w, W));
    var h = Math.max(minH, Math.min(s.h, H));
    var l = Math.max(0, Math.min(s.l, Math.max(0, W-w)));
    var t = Math.max(0, Math.min(s.t, Math.max(0, H-h)));
    dock.style.left = l+'px';
    dock.style.top = t+'px';
    dock.style.right = 'auto';
    dock.style.bottom = 'auto';
    dock.style.width = w+'px';
    dock.style.height = h+'px';
  }
  function saveFrame(dock, key){
    if(!dock || dock.hidden || dock.offsetWidth<40) return;
    var host = root().getBoundingClientRect();
    var box = dock.getBoundingClientRect();
    patchFrame(key || FRAME, {
      l: Math.round(box.left-host.left),
      t: Math.round(box.top-host.top),
      w: Math.round(box.width),
      h: Math.round(box.height)
    });
  }
  function placeIcon(ico, l, t){
    var host = root();
    var W = host.clientWidth||1, H = host.clientHeight||1;
    var w = ico.offsetWidth||48, h = ico.offsetHeight||48;
    l = Math.max(8, Math.min(l, W-w-8));
    t = Math.max(8, Math.min(t, H-h-8));
    ico.style.left = l+'px';
    ico.style.top = t+'px';
  }
  function bindFrame(dock, opt){
    opt = opt || {};
    var key = opt.key || FRAME, minW = opt.minW || 280, minH = opt.minH || 220, drag = null;
    function place(l, t, w, h){
      var host = root();
      var W = host.clientWidth||1, H = host.clientHeight||1;
      w = Math.max(minW, Math.min(w, W));
      h = Math.max(minH, Math.min(h, H));
      l = Math.max(0, Math.min(l, Math.max(0, W-w)));
      t = Math.max(0, Math.min(t, Math.max(0, H-h)));
      dock.style.left = l+'px';
      dock.style.top = t+'px';
      dock.style.right = 'auto';
      dock.style.bottom = 'auto';
      dock.style.width = w+'px';
      dock.style.height = h+'px';
    }
    dock.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      var edge = e.target.closest && e.target.closest('[data-resize]');
      var bar = e.target.closest && e.target.closest('.st-room-h');
      if(!edge && !(bar && !(e.target.closest && e.target.closest('button')))) return;
      var host = root().getBoundingClientRect();
      var box = dock.getBoundingClientRect();
      drag = {
        mode: edge ? edge.getAttribute('data-resize') : 'move',
        x: e.clientX, y: e.clientY,
        l: box.left-host.left, t: box.top-host.top,
        w: box.width, h: box.height
      };
      dock.__frameDrag = true;
      dock.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    dock.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      var l = drag.l, t = drag.t, w = drag.w, h = drag.h, m = drag.mode;
      if(m==='move'){ l += dx; t += dy; }
      else {
        var east = m==='e'||m==='ne'||m==='se';
        var west = m==='w'||m==='nw'||m==='sw';
        var south = m==='s'||m==='se'||m==='sw';
        var north = m==='n'||m==='ne'||m==='nw';
        if(east) w = drag.w+dx;
        if(south) h = drag.h+dy;
        if(west){ w = drag.w-dx; l = drag.l+dx; }
        if(north){ h = drag.h-dy; t = drag.t+dy; }
        if(w<minW){ if(west) l -= minW-w; w = minW; }
        if(h<minH){ if(north) t -= minH-h; h = minH; }
      }
      place(l, t, w, h);
    });
    function end(e){
      if(!drag) return;
      drag = null;
      dock.__frameDrag = false;
      saveFrame(dock, key);
      try{ dock.releasePointerCapture(e.pointerId); }catch(err){}
    }
    dock.addEventListener('pointerup', end);
    dock.addEventListener('pointercancel', end);
    if(window.ResizeObserver){
      new ResizeObserver(function(){ if(!drag) applyFrame(dock, key, minW, minH); }).observe(root());
    } else {
      window.addEventListener('resize', function(){ if(!drag) applyFrame(dock, key, minW, minH); });
    }
  }
  function bindIcon(ico, key, onOpen){
    var drag = null, moved = false;
    ico.addEventListener('pointerdown', function(e){
      if(e.button!==0) return;
      var host = root().getBoundingClientRect();
      var box = ico.getBoundingClientRect();
      drag = {x:e.clientX, y:e.clientY, l:box.left-host.left, t:box.top-host.top};
      moved = false;
      ico.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    ico.addEventListener('pointermove', function(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      if(Math.abs(dx)>4 || Math.abs(dy)>4) moved = true;
      placeIcon(ico, drag.l+dx, drag.t+dy);
    });
    function end(e){
      if(!drag) return;
      var dx = e.clientX-drag.x, dy = e.clientY-drag.y;
      placeIcon(ico, drag.l+dx, drag.t+dy);
      patchFrame(key, {ix:parseFloat(ico.style.left), iy:parseFloat(ico.style.top)});
      drag = null;
      try{ ico.releasePointerCapture(e.pointerId); }catch(err){}
      if(!moved) onOpen();
    }
    ico.addEventListener('pointerup', end);
    ico.addEventListener('pointercancel', end);
  }
  function edgeHtml(){
    return '<i class="st-room-edge n" data-resize="n"></i><i class="st-room-edge s" data-resize="s"></i>'+
      '<i class="st-room-edge e" data-resize="e"></i><i class="st-room-edge w" data-resize="w"></i>'+
      '<i class="st-room-edge nw" data-resize="nw"></i><i class="st-room-edge ne" data-resize="ne"></i>'+
      '<i class="st-room-edge sw" data-resize="sw"></i><i class="st-room-edge se" data-resize="se"></i>';
  }

  function bindPlayers(){
    if(!state || state.status!=='member') return;
    var cfg = window.LIVEMAP_CONFIG = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = API+'/api/rooms/'+encodeURIComponent(state.code)+'/players';
    cfg.PLAYERS_HEADERS = {Authorization:'Bearer '+token()};
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
  }

  function drawSelected(){
    var ctl = window.__stCtl;
    if(!ctl || !ctl.showRoute) return;
    var rt = (state&&state.routes||[]).filter(function(r){ return r.id===selected; })[0];
    var ids = rt ? rt.points.map(function(p){ return p.id; }) : (marking ? draft.map(function(p){ return p.id; }) : []);
    ctl.showRoute(ids);
  }

  function canDraw(){
    if(!state || state.status!=='member') return false;
    return state.routeMode==='members' || state.role==='captain';
  }

  function paint(){
    var ui = ensure();
    var onMap = !!(entered && state && state.status==='member');
    ui.gate.hidden = onMap;
    ui.dock.hidden = !onMap;
    var crewMini = !!(readRaw(CREW) && readRaw(CREW).mini);
    ui.crew.hidden = !onMap || crewMini;
    ui.crewIco.hidden = !onMap || !crewMini;
    if(!onMap) paintGate(ui.gate);
    if(onMap){
      paintDock(ui.dock);
      paintCrew(ui.crew, ui.crewIco);
      if(!ui.dock.__frameDrag) applyFrame(ui.dock, FRAME, 280, 220);
      if(!ui.crew.__frameDrag) applyFrame(ui.crew, CREW, 220, 160);
      var saved = readRaw(CREW);
      if(saved && typeof saved.ix==='number') placeIcon(ui.crewIco, saved.ix, saved.iy);
    }
    window.__stRouteOn = !!(state && state.status==='member' && marking && canDraw());
    window.__stRouteAdd = function(o){
      if(!window.__stRouteOn || !o) return;
      if(draft.length && draft[draft.length-1].id===o.id) return;
      draft.push({id:o.id, n:o.n, sy:o.sy||''});
      if(draft.length>40) draft.shift();
      paint();
    };
    drawSelected();
  }

  function paintGate(el){
    if(leaving && state && state.role==='captain' && state.status==='member'){
      el.innerHTML = '<div class="st-gate-card"><h1>'+esc(t('title'))+'</h1>'+handoffHtml()+'</div>';
      bindHandoff(el);
      return;
    }
    var nick = '';
    try{ nick = localStorage.getItem(NICK)||''; }catch(e){}
    var pre = '';
    try{ pre = new URLSearchParams(location.search).get('room')||''; }catch(e){}
    if(state && state.code) pre = state.code;
    var wait = state && state.status==='pending';
    var member = state && state.status==='member';
    var kind = roomKind==='create' ? 'create' : roomKind==='join' ? 'join' : 'saved';
    var kindLabel = kind==='create' ? t('freshCreate') : kind==='join' ? t('freshJoin') : t('resumed');
    var kindLead = kind==='create' ? t('freshCreateLead') : kind==='join' ? t('freshJoinLead') : t('resumedLead');
    el.innerHTML =
      '<div class="st-gate-card">'+
        '<h1>'+esc(t('title'))+'</h1>'+
        (member || wait ? '' : (
          '<p>'+esc(t('lead'))+'</p>'+
          '<ol><li>'+esc(t('s1'))+'</li><li>'+esc(t('s2'))+'</li><li>'+esc(t('s3'))+'</li></ol>'
        ))+
        (member ? (
          '<p class="st-room-kind">'+esc(kindLabel)+'</p>'+
          '<p>'+esc(kindLead)+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          '<div class="row"><button type="button" class="act" id="stEnter">'+esc(t('enter'))+'</button>'+
          '<button type="button" id="stGateCopy">'+esc(t('copy'))+'</button></div>'+
          '<button type="button" id="stSwitch" class="st-room-link">'+esc(t('switchRoom'))+'</button>'
        ) : wait ? (
          '<p class="st-room-kind">'+esc(kind==='join' ? t('wait') : t('resumedWait'))+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'
        ) : (
          '<label>'+esc(t('nick'))+'<input id="stRoomNick" maxlength="32" value="'+esc(nick)+'"></label>'+
          '<label>'+esc(t('code'))+'<input id="stRoomCode" maxlength="9" value="'+esc(pre)+'" placeholder="K7MQ-4R2P"></label>'+
          '<div class="row"><button type="button" class="act" id="stRoomCreate">'+esc(t('create'))+'</button>'+
          '<button type="button" class="act" id="stRoomJoin">'+esc(t('join'))+'</button></div>'
        ))+
        (statusMsg ? '<p class="st-room-err">'+esc(statusMsg)+'</p>' : '')+
      '</div>';
    var c = el.querySelector('#stRoomCreate'), j = el.querySelector('#stRoomJoin');
    if(c) c.onclick = function(){ act('create'); };
    if(j) j.onclick = function(){ act('join'); };
    var enter = el.querySelector('#stEnter');
    if(enter) enter.onclick = enterMap;
    var copy = el.querySelector('#stGateCopy');
    if(copy) copy.onclick = function(){
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(state.code);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    var sw = el.querySelector('#stSwitch');
    if(sw) sw.onclick = askLeave;
  }

  function paintDock(el){
    var pending = (state.members||[]).filter(function(m){ return m.status==='pending'; });
    var mine = canDraw();
    el.innerHTML =
      '<div class="st-room-h" id="stRoomBar" role="group" aria-label="'+esc(state.code)+'"><b>'+esc(state.code)+'</b>'+
        '<button type="button" id="stRoomCopy">'+esc(t('copy'))+'</button>'+
        '<button type="button" id="stRoomLeave">'+esc(t('leave'))+'</button></div>'+
      '<div class="st-room-body">'+
      (leaving && state.role==='captain' ? handoffHtml() : '')+
      '<p class="st-room-dim">'+esc(t('locGuide'))+'</p>'+
      '<div class="row"><button type="button" id="stLinkPc">'+esc(t('link'))+'</button></div>'+
      linkNote()+
      (state.role==='captain' ? (
        '<div class="st-room-sec"><span>'+esc(t('pending'))+'</span>'+
          (pending.length? pending.map(function(m){
            return '<div class="st-room-row"><span>'+esc(m.nickname)+'</span>'+
              '<button type="button" data-ok="'+esc(m.id)+'">'+esc(t('approve'))+'</button>'+
              '<button type="button" data-no="'+esc(m.id)+'">'+esc(t('reject'))+'</button></div>';
          }).join('') : '<div class="st-room-dim">—</div>')+
        '</div>'+
        '<div class="st-room-sec"><span>'+esc(t('mode'))+'</span>'+
          '<div class="st-dd" id="stRouteMode"><button type="button" class="st-dd-btn" id="stRouteModeBtn">'+esc(state.routeMode==='members'?t('modeMembers'):t('modeCaptain'))+'</button>'+
          '<div class="st-dd-list" hidden>'+
            '<button type="button" data-mode="captain"'+(state.routeMode==='captain'?' class="on"':'')+'>'+esc(t('modeCaptain'))+'</button>'+
            '<button type="button" data-mode="members"'+(state.routeMode==='members'?' class="on"':'')+'>'+esc(t('modeMembers'))+'</button>'+
          '</div></div></div>'+
        '<div class="row"><button type="button" id="stDissolve">'+esc(t('dissolve'))+'</button></div>'
      ) : '')+
      '<div class="row"><button type="button" id="stHere">'+esc(t('here'))+'</button>'+
        (mine ? '<button type="button" id="stMark"'+(marking?' class="on"':'')+'>'+esc(marking?t('routeOn'):t('route'))+'</button>' : '')+
      '</div>'+
      (marking && mine ? (
        '<p class="st-room-dim">'+esc(t('routeHint'))+'</p>'+
        '<ol class="st-room-pts">'+draft.map(function(p,i){
          return '<li><span>'+esc(p.n)+'</span><button type="button" data-rm="'+i+'">'+esc(t('del'))+'</button></li>';
        }).join('')+'</ol>'+
        '<textarea id="stRouteNote" maxlength="500" placeholder="'+esc(t('note'))+'">'+esc(note)+'</textarea>'+
        '<div class="row"><button type="button" id="stPublish">'+esc(t('publish'))+'</button>'+
          '<button type="button" id="stDraftClear">'+esc(t('clear'))+'</button></div>'
      ) : '')+
      '<div class="st-room-sec"><span>'+esc(t('published'))+'</span>'+
        ((state.routes||[]).map(function(r){
          return '<div class="st-room-route'+(r.id===selected?' on':'')+'" data-rt="'+esc(r.id)+'">'+
            '<b>'+esc(r.title||r.points.map(function(p){return p.n;}).join(' → '))+'</b>'+
            '<small>'+esc(t('by'))+' '+esc(r.authorName)+'</small>'+
            (r.note?'<p>'+esc(r.note)+'</p>':'')+
            (r.comments||[]).map(function(c){ return '<div class="st-room-c"><b>'+esc(c.authorName)+'</b> '+esc(c.body)+'</div>'; }).join('')+
            '<div class="row"><input data-cmt="'+esc(r.id)+'" maxlength="300" placeholder="'+esc(t('comment'))+'">'+
              '<button type="button" data-send="'+esc(r.id)+'">'+esc(t('send'))+'</button>'+
              (r.author===state.me.id || state.role==='captain' ? '<button type="button" data-del="'+esc(r.id)+'">'+esc(t('del'))+'</button>' : '')+
            '</div></div>';
        }).join('') || '<div class="st-room-dim">—</div>')+
      '</div>'+
      (statusMsg ? '<p class="st-room-err">'+esc(statusMsg)+'</p>' : '')+
      '</div>'+
      edgeHtml();
    el.querySelector('#stRoomCopy').onclick = function(){
      var text = state.code;
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    el.querySelector('#stRoomLeave').onclick = askLeave;
    bindHandoff(el);
    var dissolve = el.querySelector('#stDissolve');
    if(dissolve) dissolve.onclick = function(){ exitRoom({dissolve:true}); };
    var link = el.querySelector('#stLinkPc');
    if(link) link.onclick = linkPc;
    el.querySelectorAll('[data-ok]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-ok'),'approve'); }; });
    el.querySelectorAll('[data-no]').forEach(function(b){ b.onclick=function(){ decide(b.getAttribute('data-no'),'reject'); }; });
    var modeBtn = el.querySelector('#stRouteModeBtn');
    if(modeBtn) modeBtn.onclick = function(e){
      e.stopPropagation();
      var list = el.querySelector('.st-dd-list');
      if(list) list.hidden = !list.hidden;
    };
    el.querySelectorAll('[data-mode]').forEach(function(b){ b.onclick=function(e){
      e.stopPropagation();
      api('/api/rooms/'+encodeURIComponent(state.code)+'/settings', {method:'POST', body:{routeMode:b.getAttribute('data-mode')}}).then(take).catch(fail);
    }; });
    el.querySelector('#stHere').onclick = here;
    var mark = el.querySelector('#stMark');
    if(mark) mark.onclick = function(){ marking=!marking; if(!marking) window.__stRouteOn=false; selected=''; paint(); };
    el.querySelectorAll('[data-rm]').forEach(function(b){ b.onclick=function(){ draft.splice(+b.getAttribute('data-rm'),1); paint(); }; });
    var box = el.querySelector('#stRouteNote');
    if(box) box.oninput = function(){ note = box.value; };
    var pub = el.querySelector('#stPublish');
    if(pub) pub.onclick = publish;
    var clr = el.querySelector('#stDraftClear');
    if(clr) clr.onclick = function(){ draft=[]; note=''; paint(); };
    el.querySelectorAll('[data-rt]').forEach(function(b){ b.onclick=function(ev){
      if(ev.target.closest('input,button')) return;
      var id = b.getAttribute('data-rt');
      if(selected===id){ selected=''; paint(); return; }
      selected = id; marking=false;
      var rt = (state.routes||[]).filter(function(r){ return r.id===selected; })[0];
      var ctl = window.__stCtl;
      if(rt && rt.points[0] && rt.points[0].sy && ctl && ctl.goSystem) ctl.goSystem(rt.points[0].sy);
      paint();
    }; });
    el.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){ sendComment(b.getAttribute('data-send')); }; });
    el.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=function(){ delRoute(b.getAttribute('data-del')); }; });
  }

  function paintCrew(el, ico){
    var live = (state.members||[]).filter(function(m){ return m.status==='member'; });
    el.innerHTML =
      '<div class="st-room-h"><b>'+esc(t('members'))+'</b>'+
        '<button type="button" id="stCrewMin">'+esc(t('fold'))+'</button></div>'+
      '<div class="st-room-body">'+
        (live.map(memberRow).join('') || '<div class="st-room-dim">—</div>')+
      '</div>'+edgeHtml();
    el.querySelector('#stCrewMin').onclick = function(ev){
      ev.stopPropagation();
      var box = el.getBoundingClientRect();
      var host = root().getBoundingClientRect();
      var prev = readRaw(CREW) || {};
      var ix = typeof prev.ix==='number' ? prev.ix : Math.round(box.left-host.left);
      var iy = typeof prev.iy==='number' ? prev.iy : Math.round(box.top-host.top);
      patchFrame(CREW, {mini:1, ix:ix, iy:iy});
      paint();
    };
    el.querySelectorAll('[data-mate]').forEach(function(b){ b.onclick=function(){ jumpMember(b.getAttribute('data-mate')); }; });
    el.querySelectorAll('[data-cap]').forEach(function(b){ b.onclick=function(){
      api('/api/rooms/'+encodeURIComponent(state.code)+'/captain', {method:'POST', body:{member:b.getAttribute('data-cap')}}).then(take).catch(fail);
    }; });
    ico.textContent = String(live.length);
    ico.title = t('members');
    ico.setAttribute('aria-label', t('members'));
  }

  function ageText(seen){
    if(typeof seen!=='number' || !isFinite(seen)) return '';
    var s = Math.max(0, Math.round(Date.now()/1000 - seen));
    if(s<5) return t('agoNow');
    if(s<60) return t('agoSec').replace('{n}', String(s));
    var m = Math.floor(s/60);
    if(m<60) return t('agoMin').replace('{n}', String(m));
    var h = Math.floor(m/60);
    if(h<48) return t('agoHour').replace('{n}', String(h));
    return t('agoDay').replace('{n}', String(Math.floor(h/24)));
  }
  function tickAges(){
    document.querySelectorAll('.st-mate time[data-seen]').forEach(function(n){
      var next = ageText(+n.getAttribute('data-seen'));
      if(n.textContent!==next) n.textContent = next;
    });
  }
  function placeLabel(m){
    var raw = m.location || '';
    if(SC.loc && SC.loc.text) return SC.loc.text(raw) || raw;
    return raw;
  }
  function memberRow(m){
    var you = m.id===state.me.id ? ' · '+esc(t('you')) : '';
    var cap = (state.captain ? m.id===state.captain : state.role==='captain' && m.id===state.me.id) ? ' · '+esc(t('captainTag')) : '';
    var name = '<b>'+esc(m.nickname)+you+cap+'</b>';
    var give = state.role==='captain' && m.id!==state.me.id ? '<button type="button" data-cap="'+esc(m.id)+'">'+esc(t('give'))+'</button>' : '';
    var body;
    if(!m.location) body = '<div class="st-mate">'+name+'</div>';
    else {
      var when = typeof m.seen==='number' ? '<time data-seen="'+m.seen+'">'+esc(ageText(m.seen))+'</time>' : '';
      body = '<button type="button" class="st-mate" data-mate="'+esc(m.id)+'">'+name+'<span>'+esc(placeLabel(m))+'</span>'+when+'</button>';
    }
    return '<div class="st-mate-row">'+body+give+'</div>';
  }
  function handoffHtml(){
    var rest = (state.members||[]).filter(function(m){ return m.status==='member' && state.me && m.id!==state.me.id; });
    if(!rest.length){
      return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handSolo'))+'</p>'+
        '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolveLeave'))+'</button>'+
        '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
    }
    return '<div class="st-room-sec st-hand"><span>'+esc(t('handTitle'))+'</span><p class="st-room-dim">'+esc(t('handLead'))+'</p>'+
      rest.map(function(m){
        return '<div class="st-room-row"><span>'+esc(m.nickname)+'</span><button type="button" data-hand="'+esc(m.id)+'">'+esc(t('giveLeave'))+'</button></div>';
      }).join('')+
      '<div class="row"><button type="button" id="stDissolveLeave">'+esc(t('dissolve'))+'</button>'+
      '<button type="button" id="stHandCancel">'+esc(t('cancel'))+'</button></div></div>';
  }
  function bindHandoff(el){
    var go = el.querySelector('#stDissolveLeave');
    if(go) go.onclick = function(){ exitRoom({dissolve:true}); };
    var cancel = el.querySelector('#stHandCancel');
    if(cancel) cancel.onclick = function(){ leaving = false; paint(); };
    el.querySelectorAll('[data-hand]').forEach(function(b){
      b.onclick = function(){ exitRoom({transfer:b.getAttribute('data-hand')}); };
    });
  }
  function jumpMember(id){
    var m = (state.members||[]).filter(function(x){ return x.id===id; })[0];
    var o = m && SC.playerLoc ? SC.playerLoc({code:m.code||'', location:m.location||'', system:m.system||''}) : null;
    var ctl = window.__stCtl;
    if(!o || !ctl || !ctl.flyTo){
      statusMsg = t('noPlace');
      paint();
      setTimeout(function(){ if(statusMsg===t('noPlace')){ statusMsg=''; paint(); } }, 1600);
      return;
    }
    ctl.flyTo(o);
    if(typeof window.openStPanel==='function') window.openStPanel(o);
  }
  function nickValue(){
    var el = document.getElementById('stRoomNick');
    return el ? el.value.trim() : '';
  }
  function codeValue(){
    var el = document.getElementById('stRoomCode');
    return (el ? el.value : '').toUpperCase().replace(/[^A-Z0-9-]/g,'');
  }
  function rememberNick(n){ try{ localStorage.setItem(NICK, n); }catch(e){} }

  function act(kind){
    var nick = nickValue();
    if(!nick || nick.length>32){ statusMsg=t('errNick'); paint(); return; }
    statusMsg = '';
    roomKind = kind==='create' ? 'create' : 'join';
    rememberNick(nick);
    api('/api/session', {method:'POST', body:{nickname:nick}}).then(function(s){
      try{ localStorage.setItem(TOKEN, s.token); }catch(e){}
      if(kind==='create') return api('/api/rooms', {method:'POST', body:{}});
      var code = codeValue();
      if(!code){ statusMsg=t('errRoom'); paint(); return null; }
      return api('/api/rooms/'+encodeURIComponent(code)+'/join', {method:'POST', body:{}});
    }).then(function(st){ if(st) take(st); }).catch(fail);
  }

  function enterMap(){
    if(!state || state.status!=='member') return;
    entered = true;
    bindPlayers();
    paint();
    pullLink();
  }
  function take(st){
    state = st;
    statusMsg = '';
    try{ localStorage.setItem(CODE, st.code); }catch(e){}
    if(st.status!=='member') entered = false;
    if(st.status==='member' && entered) bindPlayers();
    paint();
  }
  function fail(e){
    if(e && e.body && e.body.error==='room') statusMsg = t('errRoom');
    else if(e && e.status===0) statusMsg = t('errNet');
    else statusMsg = t('errNet');
    paint();
  }
  function decide(id, action){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/members/'+encodeURIComponent(id)+'/'+action, {method:'POST', body:{}}).then(take).catch(fail);
  }
  function linkNote(){
    if(!state) return '';
    if(linkState==='on') return '<p class="st-link on">'+esc(t('linkOn'))+' '+esc(state.code)+'</p>';
    if(linkState==='wait') return '<p class="st-link wait">'+esc(t('linkWait'))+'</p>';
    if(linkState==='off') return '<p class="st-link off">'+esc(t('linkOff'))+'</p>';
    return '';
  }
  function setLink(next){
    if(next===linkState) return;
    linkState = next;
    if(entered) paint();
  }
  function pullLink(){
    if(!entered || !state || state.status!=='member') return;
    fetch('http://127.0.0.1:8780/api/status', {cache:'no-store'})
      .then(function(r){ if(!r.ok) throw new Error('status'); return r.json(); })
      .then(function(d){
        var room = String(d && d.room || '').toUpperCase();
        var pending = String(d && d.pendingRoom || '').toUpperCase();
        linkMiss = 0;
        if(d && d.tokenSet && room===state.code) setLink('on');
        else if(pending===state.code) setLink('wait');
        else if(linkState==='on') setLink('');
      })
      .catch(function(){
        linkMiss += 1;
        if(linkMiss>=3 && linkState==='on') setLink('');
      });
  }
  function linkPc(){
    var tok = token();
    if(!tok || !state || !state.code){ setLink('off'); return; }
    var payload = JSON.stringify({apiBase: API || location.origin, room: state.code, token: tok});
    fetch('http://127.0.0.1:8780/api/pair', {method:'POST', headers:{'Content-Type':'application/json'}, body: payload})
      .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(d){ if(d && d.error) throw new Error(d.error); setLink('wait'); pullLink(); })
      .catch(function(){ setLink('off'); });
  }
  function here(){
    var ctl = window.__stCtl;
    var o = window.__stPlace;
    var lv = ctl && ctl.level && ctl.level();
    if(!o && lv) o = lv.o;
    if(!o || !o.n){ statusMsg = t('hereNeed'); paint(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/presence', {
      method:'POST', body:{location:o.n, system:o.sy||'', code:o.tag||''}
    }).then(function(){ statusMsg=''; return refresh(); }).catch(fail);
  }
  function publish(){
    if(draft.length<2) return;
    var title = draft.map(function(p){ return p.n; }).join(' → ').slice(0,40);
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes', {
      method:'POST', body:{title:title, note:note, points:draft}
    }).then(function(st){ draft=[]; note=''; marking=false; take(st); }).catch(fail);
  }
  function sendComment(id){
    var input = document.querySelector('[data-cmt="'+id+'"]');
    var body = input ? input.value.trim() : '';
    if(!body) return;
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id)+'/comments', {method:'POST', body:{body:body}}).then(take).catch(fail);
  }
  function delRoute(id){
    api('/api/rooms/'+encodeURIComponent(state.code)+'/routes/'+encodeURIComponent(id), {method:'DELETE'}).then(function(st){ if(selected===id) selected=''; take(st); }).catch(fail);
  }
  function localLeave(){
    leaving = false;
    state = null; draft = []; marking = false; note = ''; selected = ''; statusMsg = ''; entered = false; roomKind = ''; linkState = ''; linkMiss = 0;
    try{ localStorage.removeItem(CODE); }catch(e){}
    window.__stRouteOn = false;
    var cfg = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = './players.example.json';
    cfg.PLAYERS_HEADERS = {};
    if(window.__stCtl && window.__stCtl.showRoute) window.__stCtl.showRoute([]);
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
    paint();
  }
  function askLeave(){
    if(state && state.role==='captain' && state.status==='member'){ leaving = true; paint(); return; }
    exitRoom({});
  }
  function exitRoom(body){
    if(!state || !state.code){ localLeave(); return; }
    api('/api/rooms/'+encodeURIComponent(state.code)+'/leave', {method:'POST', body:body||{}}).then(function(){
      localLeave();
    }).catch(function(e){
      if(e && e.body && (e.body.error==='handoff' || e.body.error==='solo')){ leaving = true; paint(); return; }
      fail(e);
    });
  }
  function refresh(){
    if(!state || !token()) return Promise.resolve();
    return api('/api/rooms/'+encodeURIComponent(state.code)).then(function(st){
      var keep = statusMsg;
      take(st);
      statusMsg = keep;
      if(keep) paint();
    }).catch(function(e){
      if(e && (e.status===403 || e.status===404)) localLeave();
    });
  }

  function probe(base){
    return fetch(base+'/api/health', {cache:'no-store'}).then(function(r){ return r.ok ? r.json() : null; }).then(function(h){ return !!(h&&h.ok); }).catch(function(){ return false; });
  }
  function detect(){
    return probe('').then(function(ok){
      if(ok){ API=''; return true; }
      if(location.hostname==='127.0.0.1' && location.port==='8770') return false;
      return probe('http://127.0.0.1:8770').then(function(ok2){ if(ok2){ API='http://127.0.0.1:8770'; return true; } return false; });
    });
  }
  function start(){
    ensure();
    paint();
    if(!window.__stRoomLang){
      window.__stRoomLang=function(){ if(document.getElementById('stGate')) paint(); };
      document.addEventListener('sclmw-lang', window.__stRoomLang);
    }
    detect().then(function(ok){
      if(!ok){ statusMsg=t('errNet'); paint(); return; }
      var code = savedCode();
      if(token() && code) api('/api/rooms/'+encodeURIComponent(code)).then(function(st){ if(!roomKind) roomKind='saved'; take(st); }).catch(function(){ paint(); });
      if(!window.__stRoomPoll) window.__stRoomPoll=setInterval(function(){ if(state) refresh(); }, 8000);
      if(!window.__stAgeTick) window.__stAgeTick=setInterval(tickAges, 1000);
      if(!window.__stLinkWatch) window.__stLinkWatch=setInterval(pullLink, 2000);
    if(!window.__stDdClose){
      window.__stDdClose=function(e){ if(e.target.closest&&e.target.closest('.st-dd')) return; document.querySelectorAll('.st-dd-list').forEach(function(n){ n.hidden=true; }); };
      document.addEventListener('click', window.__stDdClose);
    }
    });
  }

  SC.room = {start:start};
})();
