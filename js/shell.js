/* Touch shell for phones and tablets. A mouse or trackpad stays on the desktop layout.
   Phones and tablets share one bottom sheet. New floating panels join it by carrying st-dock.
   Handy und Tablet teilen ein unteres Blatt. Maus oder Trackpad bleibt beim Desktop-Layout.
   Neue schwebende Fenster nehmen teil, sobald sie die Klasse st-dock tragen. */
(function(){
  var front = null;
  var wanted = null;
  var seen = [];
  var liftToken = 0;

  function nameFor(){
    var w = window.innerWidth || 0;
    var h = window.innerHeight || 0;
    var mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var anyFine = window.matchMedia('(any-pointer: fine)').matches;
    var anyHover = window.matchMedia('(any-hover: hover)').matches;
    if(mouse || (anyFine && anyHover)) return 'desk';
    return Math.min(w, h) >= 700 ? 'slab' : 'hand';
  }

  function apply(){
    var next = nameFor();
    var root = document.documentElement;
    if(root.getAttribute('data-sclmw-shell') === next) return next;
    root.setAttribute('data-sclmw-shell', next);
    try{ document.dispatchEvent(new CustomEvent('sclmw-shell')); }catch(e){}
    return next;
  }

  function touch(){
    var s = document.documentElement.getAttribute('data-sclmw-shell');
    return s === 'hand' || s === 'slab';
  }

  function shown(root, el){
    if(!el || el.classList.contains('min') || el.closest('[hidden]')) return false;
    if(el.classList.contains('st-plaza') && root.classList.contains('is-plaza-page')) return false;
    return true;
  }

  function docks(root){
    var all = root.querySelectorAll('.st-dock');
    var out = [];
    for(var i = 0; i < all.length; i++) if(shown(root, all[i])) out.push(all[i]);
    return out;
  }

  function clearGeom(el){
    var keys = ['left', 'top', 'right', 'bottom', 'width', 'height', 'maxHeight'];
    for(var i = 0; i < keys.length; i++) if(el.style[keys[i]]) el.style[keys[i]] = '';
    el.classList.remove('st-anchored');
  }

  function placeLift(root, nodes, chosen){
    var token = ++liftToken;
    requestAnimationFrame(function(){
      if(token !== liftToken || !touch() || !root.isConnected) return;
      var y = 0;
      for(var i = 0; i < nodes.length; i++){
        if(nodes[i] === chosen) continue;
        nodes[i].style.setProperty('--dock-lift', y + 'px');
        y += nodes[i].offsetHeight + 6;
      }
      if(chosen) chosen.style.setProperty('--dock-lift', y + 'px');
    });
  }

  function layout(root){
    if(!root) return;
    var nodes = docks(root);
    var all = root.querySelectorAll('.st-dock');
    var born = [];
    var i;
    for(i = 0; i < nodes.length; i++) if(seen.indexOf(nodes[i]) < 0) born.push(nodes[i]);
    seen = nodes.slice();
    if(!touch()){
      front = null;
      wanted = null;
      for(i = 0; i < all.length; i++){
        all[i].classList.remove('st-front', 'st-hold');
        all[i].style.removeProperty('--dock-lift');
      }
      return;
    }
    var chosen = null;
    if(born.length) chosen = born[born.length - 1];
    else if(wanted && nodes.indexOf(wanted) >= 0) chosen = wanted;
    else if(front && nodes.indexOf(front) >= 0) chosen = front;
    else if(nodes.length) chosen = nodes[nodes.length - 1];
    front = chosen;
    wanted = chosen;
    for(i = 0; i < all.length; i++){
      if(nodes.indexOf(all[i]) < 0){
        all[i].classList.remove('st-front', 'st-hold');
        all[i].style.removeProperty('--dock-lift');
      }
    }
    for(i = 0; i < nodes.length; i++){
      clearGeom(nodes[i]);
      nodes[i].classList.toggle('st-front', nodes[i] === chosen);
      nodes[i].classList.toggle('st-hold', nodes[i] !== chosen);
    }
    var icons = root.querySelectorAll('.st-float-ico');
    for(i = 0; i < icons.length; i++){
      if(icons[i].style.left) icons[i].style.left = '';
      if(icons[i].style.top) icons[i].style.top = '';
      if(icons[i].style.right) icons[i].style.right = '';
      if(icons[i].style.bottom) icons[i].style.bottom = '';
    }
    placeLift(root, nodes, chosen);
  }

  window.sclmwShell = function(){ return document.documentElement.getAttribute('data-sclmw-shell') || apply(); };
  window.sclmwFocusDock = function(el){
    wanted = el || null;
    var root = el && el.closest ? el.closest('.sc-lmw') : document.querySelector('.sc-lmw');
    if(root) layout(root);
  };

  function watch(root){
    if(!root || root.__sclmwDock) return;
    root.__sclmwDock = true;
    var queued = false;
    function kick(){
      if(queued) return;
      queued = true;
      requestAnimationFrame(function(){ queued = false; layout(root); });
    }
    if(window.MutationObserver){
      new MutationObserver(kick).observe(root, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden', 'class']});
    }
    kick();
  }

  function scan(){
    var roots = document.querySelectorAll('.sc-lmw');
    for(var i = 0; i < roots.length; i++) watch(roots[i]);
  }

  apply();
  scan();
  window.addEventListener('resize', function(){ apply(); scan(); });
  window.addEventListener('orientationchange', function(){ apply(); scan(); });
  ['(hover: hover) and (pointer: fine)', '(any-hover: hover)', '(any-pointer: fine)'].forEach(function(q){
    try{ window.matchMedia(q).addEventListener('change', apply); }catch(e){}
  });
  if(window.MutationObserver){
    new MutationObserver(scan).observe(document.documentElement, {childList:true, subtree:true});
  }
  document.addEventListener('sclmw-shell', scan);
})();
