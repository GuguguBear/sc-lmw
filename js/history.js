/* Personal timeline from Starfix on this computer. The page does not read the game folder. */
(function(){
  var DICT = {
    'zh-Hans': {
      title:'我的记录', lead:'这些记录留在这台电脑上，不会发到房间。网页不读游戏目录。',
      open:'记录', close:'关闭', empty:'还没有能串起来的记录。',
      off:'本机 Starfix 没开。先打开它，记录才会出现。',
      old:'这台 Starfix 还没有记录。用当前源码重新打开一次。',
      online:'上线', place:'进入 {code}',
      done:'合约完成', abandon:'合约放弃',
      buy:'购买 {item} × {qty}，标价 {price}',
      sell:'出售 {item} × {qty}，标价 {price}',
      shop:'商店 {shop}', ship:'驾驶 {ship}',
      aim:'选定 {where}', aimShip:'选定 {where}，驾驶 {ship}',
      jump:'从 {from} 前往 {where}', jumpShip:'从 {from} 前往 {where}，驾驶 {ship}',
      arrive:'到达 {where}', arriveShip:'到达 {where}，驾驶 {ship}',
      beacon:'任务信标', somewhere:'某处', fly:'在星图上查看'
    },
    'zh-Hant': {
      title:'我的記錄', lead:'這些記錄留在這台電腦上，不會發到房間。網頁不讀遊戲資料夾。',
      open:'記錄', close:'關閉', empty:'還沒有能串起來的記錄。',
      off:'本機 Starfix 沒開。先打開它，記錄才會出現。',
      old:'這台 Starfix 還沒有記錄。用目前源碼重新打開一次。',
      online:'上線', place:'進入 {code}',
      done:'合約完成', abandon:'合約放棄',
      buy:'購買 {item} × {qty}，標價 {price}',
      sell:'出售 {item} × {qty}，標價 {price}',
      shop:'商店 {shop}', ship:'駕駛 {ship}',
      aim:'選定 {where}', aimShip:'選定 {where}，駕駛 {ship}',
      jump:'從 {from} 前往 {where}', jumpShip:'從 {from} 前往 {where}，駕駛 {ship}',
      arrive:'到達 {where}', arriveShip:'到達 {where}，駕駛 {ship}',
      beacon:'任務信標', somewhere:'某處', fly:'在星圖上查看'
    },
    en: {
      title:'My log', lead:'This log stays on this computer. It is not sent to the room. This page does not read the game folder.',
      open:'Log', close:'Close', empty:'Nothing has been recorded yet.',
      off:'Starfix is not open on this computer.',
      old:'This Starfix has no log yet. Open it again from the current source.',
      online:'Signed in', place:'Entered {code}',
      done:'Contract complete', abandon:'Contract abandoned',
      buy:'Bought {item} × {qty}, listed {price}',
      sell:'Sold {item} × {qty}, listed {price}',
      shop:'Shop {shop}', ship:'Flew {ship}',
      aim:'Selected {where}', aimShip:'Selected {where}, flew {ship}',
      jump:'From {from} to {where}', jumpShip:'From {from} to {where}, flew {ship}',
      arrive:'Arrived {where}', arriveShip:'Arrived {where}, flew {ship}',
      beacon:'mission beacon', somewhere:'somewhere', fly:'Show on the map'
    },
    de: {
      title:'Mein Verlauf', lead:'Dieser Verlauf bleibt auf diesem Computer. Er geht nicht in den Raum. Diese Seite liest keinen Spielordner.',
      open:'Verlauf', close:'Schließen', empty:'Noch nichts aufgezeichnet.',
      off:'Starfix ist auf diesem Computer nicht geöffnet.',
      old:'Dieses Starfix hat noch keinen Verlauf. Öffne es erneut aus dem aktuellen Quelltext.',
      online:'Angemeldet', place:'Zone {code}',
      done:'Auftrag abgeschlossen', abandon:'Auftrag abgebrochen',
      buy:'Gekauft {item} × {qty}, Preis {price}',
      sell:'Verkauft {item} × {qty}, Preis {price}',
      shop:'Laden {shop}', ship:'Geflogen {ship}',
      aim:'Ziel {where}', aimShip:'Ziel {where}, geflogen {ship}',
      jump:'Von {from} nach {where}', jumpShip:'Von {from} nach {where}, geflogen {ship}',
      arrive:'Ankunft {where}', arriveShip:'Ankunft {where}, geflogen {ship}',
      beacon:'Auftragsbake', somewhere:'irgendwo', fly:'Auf der Karte zeigen'
    }
  };

  function lang(){
    var code = window.SCLMW && SCLMW.i18n && SCLMW.i18n.lang;
    return DICT[code] ? code : 'en';
  }
  function t(key){
    var pack = DICT[lang()] || DICT.en;
    return pack[key] || DICT.en[key] || key;
  }
  function fill(key, map){
    return t(key).replace(/\{(\w+)\}/g, function(_m, name){ return map[name] == null ? '' : String(map[name]); });
  }
  function esc(s){
    return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function root(){ return document.querySelector('.sc-lmw') || document.body; }
  function where(ev){
    if(ev.destKind === 'beacon') return t('beacon');
    if(ev.dest) return ev.dest;
    return t('somewhere');
  }
  function sentence(ev){
    var ship = ev.ship || '';
    if(ev.kind === 'online') return t('online');
    if(ev.kind === 'place') return fill('place', {code: ev.code || ''});
    if(ev.kind === 'contract') return ev.result === 'abandon' ? t('abandon') : t('done');
    if(ev.kind === 'mission') return ev.say || '';
    if(ev.kind === 'buy' || ev.kind === 'sell') return fill(ev.kind, {item: ev.item || '', qty: ev.qty || 0, price: ev.price || 0});
    if(ev.kind === 'ship') return fill('ship', {ship: ship});
    if(ev.kind === 'aim') return fill(ship ? 'aimShip' : 'aim', {where: where(ev), ship: ship});
    if(ev.kind === 'jump') return fill(ship ? 'jumpShip' : 'jump', {from: ev.start || t('somewhere'), where: where(ev), ship: ship});
    if(ev.kind === 'arrive') return fill(ship ? 'arriveShip' : 'arrive', {where: where(ev), ship: ship});
    return '';
  }
  function when(ev){
    if(!ev.t) return '';
    var date = new Date(ev.t);
    if(isNaN(date.getTime())) return ev.t;
    try{ return date.toLocaleString(); }catch(e){ return ev.t; }
  }
  function fly(ev){
    var SC = window.SCLMW;
    if(!ev.code || !SC || !SC.playerLoc || !SC.flyTo) return false;
    var loc = SC.playerLoc({code: ev.code, location: ev.dest || ev.code, system: ''});
    if(!loc) return false;
    SC.flyTo(loc);
    return true;
  }

  var box = null, open = false, timer = 0, rows = [];

  function ensure(){
    var host = root();
    if(!box){
      box = document.createElement('section');
      box.id = 'stHist';
      box.className = 'st-hist';
      box.hidden = true;
      host.appendChild(box);
    }
    var tabs = document.querySelector('.sc-lmw .st-tabs');
    if(tabs && !document.getElementById('stHistBtn')){
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'stHistBtn';
      btn.addEventListener('click', function(){ toggle(!open); });
      tabs.appendChild(btn);
    }
    var btnNow = document.getElementById('stHistBtn');
    if(btnNow){
      btnNow.textContent = t('open');
      btnNow.classList.toggle('on', open);
      btnNow.setAttribute('aria-pressed', open ? 'true' : 'false');
    }
  }

  function paint(message){
    ensure();
    if(!box) return;
    box.hidden = !open;
    if(!open) return;
    var list = rows.map(function(ev){
      var text = sentence(ev);
      if(!text) return '';
      var shop = (ev.kind === 'buy' || ev.kind === 'sell') && ev.shop ? '<small>'+esc(fill('shop', {shop: ev.shop}))+'</small>' : '';
      var clock = when(ev);
      return '<button type="button" class="st-hist-row" data-i="'+rows.indexOf(ev)+'">'+
        '<time>'+esc(clock)+'</time><b>'+esc(text)+'</b>'+shop+'</button>';
    }).join('');
    var body = list || '<p class="st-hist-empty">'+esc(message || t('empty'))+'</p>';
    box.innerHTML = '<header><b>'+esc(t('title'))+'</b><button type="button" id="stHistClose">'+esc(t('close'))+'</button></header>'+
      '<p class="st-hist-lead">'+esc(t('lead'))+'</p><div class="st-hist-list">'+body+'</div>';
    var close = document.getElementById('stHistClose');
    if(close) close.onclick = function(){ toggle(false); };
    box.querySelectorAll('.st-hist-row').forEach(function(el){
      el.onclick = function(){
        var ev = rows[+el.getAttribute('data-i')];
        if(ev) fly(ev);
      };
    });
  }

  function pull(){
    fetch('http://127.0.0.1:8780/api/history', {cache:'no-store'})
      .then(function(r){
        if(r.status === 404){ rows = []; paint(t('old')); return null; }
        if(!r.ok) throw new Error('history');
        return r.json();
      })
      .then(function(data){
        if(!data) return;
        rows = (data.events || []).filter(function(ev){ return ev && sentence(ev); });
        paint(rows.length ? '' : t('empty'));
      })
      .catch(function(){
        rows = [];
        paint(t('off'));
      });
  }

  function toggle(next){
    open = next;
    ensure();
    if(timer){ clearInterval(timer); timer = 0; }
    if(open){
      paint(t('empty'));
      pull();
      timer = setInterval(pull, 8000);
    }else if(box){
      box.hidden = true;
    }
    var btn = document.getElementById('stHistBtn');
    if(btn) btn.classList.toggle('on', open);
  }

  function boot(){
    ensure();
    document.addEventListener('sclmw-lang', function(){ ensure(); if(open) paint(); });
    setInterval(ensure, 1000);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
