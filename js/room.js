/* Rooms: a team shares one code. The site does not read the game folder.
   "I am here" is a click on a place. Routes are Shift+click, then publish. */
(function(){
  var SC = window.SCLMW = window.SCLMW || {};
  var TOKEN = 'sclmw_room_token';
  var CODE = 'sclmw_room_code';
  var NICK = 'sclmw_room_nick';
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
      members:'房间成员', you:'你', errNick:'请填写 1 到 32 个字的昵称。', errRoom:'没有这个房间。',
      errNet:'房间服务没连上。请在项目目录运行 python server/room_server.py，然后打开 http://127.0.0.1:8770/ 。', published:'已发布的路线', by:'来自',
      yours:'你的房间', switchRoom:'建立或加入别的房间'
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
      members:'房間成員', you:'你', errNick:'請填寫 1 到 32 個字的暱稱。', errRoom:'沒有這個房間。',
      errNet:'房間服務沒連上。請在專案目錄執行 python server/room_server.py，然後打開 http://127.0.0.1:8770/ 。', published:'已發布的路線', by:'來自',
      yours:'你的房間', switchRoom:'建立或加入別的房間'
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
      members:'Room members', you:'you', errNick:'Use a nickname of 1 to 32 characters.', errRoom:'No room with that code.',
      errNet:'Room service is not reachable. Run python server/room_server.py and open http://127.0.0.1:8770/ .', published:'Published routes', by:'by',
      yours:'Your room', switchRoom:'Create or join a different room'
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
      members:'Im Raum', you:'du', errNick:'Nickname mit 1 bis 32 Zeichen.', errRoom:'Diesen Raum gibt es nicht.',
      errNet:'Der Raumdienst ist nicht erreichbar. python server/room_server.py starten und http://127.0.0.1:8770/ öffnen.', published:'Veröffentlichte Routen', by:'von',
      yours:'Dein Raum', switchRoom:'Anderen Raum anlegen oder beitreten'
    }
  };
  function lang(){ return (SC.i18n && SC.i18n.lang) || 'en'; }
  function t(k){ var d = DICT[lang()] || DICT.en; return d[k] || DICT.en[k] || k; }
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function token(){ try{ return localStorage.getItem(TOKEN)||''; }catch(e){ return ''; } }
  function savedCode(){ try{ return localStorage.getItem(CODE)||''; }catch(e){ return ''; } }
  var state = null, draft = [], marking = false, note = '', statusMsg = '', selected = '', API = '', entered = false;

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
    }
    return {gate:g, dock:dock};
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
    if(!onMap) paintGate(ui.gate);
    if(onMap) paintDock(ui.dock);
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
    var nick = '';
    try{ nick = localStorage.getItem(NICK)||''; }catch(e){}
    var pre = '';
    try{ pre = new URLSearchParams(location.search).get('room')||''; }catch(e){}
    if(state && state.code) pre = state.code;
    var wait = state && state.status==='pending';
    var member = state && state.status==='member';
    el.innerHTML =
      '<div class="st-gate-card">'+
        '<h1>'+esc(t('title'))+'</h1>'+
        '<p>'+esc(t('lead'))+'</p>'+
        '<ol><li>'+esc(t('s1'))+'</li><li>'+esc(t('s2'))+'</li><li>'+esc(t('s3'))+'</li></ol>'+
        (member ? (
          '<p class="st-room-dim">'+esc(t('yours'))+'</p>'+
          '<p class="st-room-code">'+esc(state.code)+'</p>'+
          '<div class="row"><button type="button" class="act" id="stEnter">'+esc(t('enter'))+'</button>'+
          '<button type="button" id="stGateCopy">'+esc(t('copy'))+'</button></div>'+
          '<button type="button" id="stSwitch" class="st-room-link">'+esc(t('switchRoom'))+'</button>'
        ) : wait ? '<p class="st-room-wait">'+esc(t('wait'))+' · '+esc(state.code)+'</p>' : (
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
    if(sw) sw.onclick = leave;
  }

  function paintDock(el){
    var pending = (state.members||[]).filter(function(m){ return m.status==='pending'; });
    var live = (state.members||[]).filter(function(m){ return m.status==='member'; });
    var mine = canDraw();
    el.innerHTML =
      '<div class="st-room-h"><b>'+esc(state.code)+'</b>'+
        '<button type="button" id="stRoomCopy">'+esc(t('copy'))+'</button>'+
        '<button type="button" id="stRoomLeave">'+esc(t('leave'))+'</button></div>'+
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
          '</div></div></div>'
      ) : '')+
      '<div class="st-room-sec"><span>'+esc(t('members'))+'</span>'+
        live.map(function(m){
          return '<div class="st-room-row"><span>'+esc(m.nickname)+(m.id===state.me.id?' · '+esc(t('you')):'')+'</span>'+
            '<em>'+esc(m.location||'')+'</em></div>';
        }).join('')+
      '</div>'+
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
      (statusMsg ? '<p class="st-room-err">'+esc(statusMsg)+'</p>' : '');
    el.querySelector('#stRoomCopy').onclick = function(){
      var text = state.code;
      if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text);
      statusMsg = t('copied'); paint();
      setTimeout(function(){ if(statusMsg===t('copied')){ statusMsg=''; paint(); } }, 1200);
    };
    el.querySelector('#stRoomLeave').onclick = leave;
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
      selected = b.getAttribute('data-rt'); marking=false;
      var rt = (state.routes||[]).filter(function(r){ return r.id===selected; })[0];
      var ctl = window.__stCtl;
      if(rt && rt.points[0] && rt.points[0].sy && ctl && ctl.goSystem) ctl.goSystem(rt.points[0].sy);
      paint();
    }; });
    el.querySelectorAll('[data-send]').forEach(function(b){ b.onclick=function(){ sendComment(b.getAttribute('data-send')); }; });
    el.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=function(){ delRoute(b.getAttribute('data-del')); }; });
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
  function leave(){
    state = null; draft = []; marking = false; note = ''; selected = ''; statusMsg = ''; entered = false;
    try{ localStorage.removeItem(CODE); }catch(e){}
    window.__stRouteOn = false;
    var cfg = window.LIVEMAP_CONFIG || {};
    cfg.PLAYERS_URL = './players.example.json';
    cfg.PLAYERS_HEADERS = {};
    if(window.__stCtl && window.__stCtl.showRoute) window.__stCtl.showRoute([]);
    if(typeof window.__stReloadPlayers==='function') window.__stReloadPlayers();
    paint();
  }
  function refresh(){
    if(!state || !token()) return Promise.resolve();
    return api('/api/rooms/'+encodeURIComponent(state.code)).then(function(st){
      var keep = statusMsg;
      take(st);
      statusMsg = keep;
      if(keep) paint();
    }).catch(function(e){
      if(e && e.status===403) leave();
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
      if(token() && code) api('/api/rooms/'+encodeURIComponent(code)).then(take).catch(function(){ paint(); });
      if(!window.__stRoomPoll) window.__stRoomPoll=setInterval(function(){ if(state) refresh(); }, 8000);
    if(!window.__stDdClose){
      window.__stDdClose=function(e){ if(e.target.closest&&e.target.closest('.st-dd')) return; document.querySelectorAll('.st-dd-list').forEach(function(n){ n.hidden=true; }); };
      document.addEventListener('click', window.__stDdClose);
    }
    });
  }

  SC.room = {start:start};
})();
