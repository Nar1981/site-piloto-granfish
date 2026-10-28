(function () {
  'use strict';

  var app = document.getElementById('app');
  var q = document.getElementById('q');
  var res = document.getElementById('res');
  var DATA = null, PAGES = [], BY_SLUG = {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
  function cmyk(c) { return 'C' + c[0] + ' M' + c[1] + ' Y' + c[2] + ' K' + c[3]; }
  function groupOf(it) { return it.type === 'sem' ? 'Linha Sem' : it.line; }
  function img(dir, slug, cls, alt, lazy) {
    return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'src="img/' + dir + '/' + esc(slug) + '.webp" alt="' + esc(alt || '') + '"' +
      (lazy === false ? '' : ' loading="lazy" decoding="async"') + '>';
  }

  /* ---------- dados e páginas ---------- */
  function load() {
    var src = window.CATALOGO_DATA ? Promise.resolve(window.CATALOGO_DATA)
      : fetch('data.json').then(function (r) { return r.json(); });
    return src.then(function (d) {
      DATA = d;
      d.items.forEach(function (it) {
        if (it.type === 'sem') {
          PAGES.push({ item: it, vi: 0, hash: '#/sem/' + it.key });
        } else {
          it.variants.forEach(function (v, i) {
            var p = { item: it, vi: i, hash: '#/ref/' + v.slug };
            PAGES.push(p);
            BY_SLUG[v.slug] = p;
          });
        }
      });
    });
  }

  /* ---------- páginas ---------- */
  function renderHome() {
    var items = DATA.items;
    var hero = BY_SLUG['0008'] || PAGES[0];
    var groups = [];
    items.forEach(function (it) { var g = groupOf(it); if (groups.indexOf(g) < 0) groups.push(g); });

    app.innerHTML =
      '<section class="capa"><div class="wrap capa__inner"><div>' +
      '<div class="marca">GRAN FISH</div><h1>Catálogo de <b>Cores</b></h1>' +
      '<p>Linhas de barcos · Referências · Paletas de cores</p></div>' +
      '<button type="button" class="capa__nav capa__nav--prev" aria-label="Linha anterior">‹</button>' +
      img('b', hero.item.variants[hero.vi].slug, '', 'Barco Gran Fish', false) +
      '<button type="button" class="capa__nav capa__nav--next" aria-label="Próxima linha">›</button>' +
      '<a class="capa__cap" id="capaCap" href="#/" hidden></a>' +
      '</div></section>' +
      '<div class="wrap"><div class="sec-tit"><h2>Linhas do catálogo</h2></div>' +
      '<div class="filtros" role="group" aria-label="Filtrar por linha">' +
      '<button type="button" aria-pressed="true" data-g="">Todas</button>' +
      groups.map(function (g) { return '<button type="button" aria-pressed="false" data-g="' + esc(g) + '">' + esc(g) + '</button>'; }).join('') +
      '</div><div class="indice" id="indice">' +
      items.map(function (it) {
        var first = it.variants[0];
        var href = it.type === 'sem' ? '#/sem/' + it.key : '#/ref/' + first.slug;
        return '<a class="idx" href="' + href + '" data-slug="' + esc(first.slug) + '" data-g="' + esc(groupOf(it)) + '">' +
          img('s', first.slug, '', '') +
          '<span><b>' + esc(it.label) + '</b><small>' + esc(it.line) + '</small></span></a>';
      }).join('') + '</div></div>';

    /* ao passar o mouse (ou focar) numa linha, mostra o barco no destaque principal */
    var capaImg = app.querySelector('.capa img'), indice = app.querySelector('#indice');
    var capaOrig = capaImg.getAttribute('src');
    function preview(e) {
      var a = e.target.closest('.idx'); if (!a) return;
      var s = 'img/b/' + a.getAttribute('data-slug') + '.webp';
      if (capaImg.getAttribute('src') !== s) capaImg.setAttribute('src', s);
    }
    function restore() { capaImg.setAttribute('src', capaOrig); }
    indice.addEventListener('mouseover', preview);
    indice.addEventListener('focusin', preview);
    indice.addEventListener('mouseleave', restore);
    indice.addEventListener('focusout', restore);

    /* botões ‹ › ao lado do principal: navegam pelas linhas visíveis e mostram o modelo */
    var cap = app.querySelector('#capaCap'), cur = -1;
    function visiveis() { return Array.prototype.filter.call(app.querySelectorAll('.idx'), function (a) { return !a.hidden; }); }
    function go(step) {
      var v = visiveis(); if (!v.length) return;
      cur = cur < 0 ? (step > 0 ? 0 : v.length - 1) : (cur + step + v.length) % v.length;
      var a = v[cur];
      app.querySelectorAll('.idx[aria-current]').forEach(function (x) { x.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'true');
      capaOrig = 'img/b/' + a.getAttribute('data-slug') + '.webp';
      capaImg.setAttribute('src', capaOrig);
      cap.hidden = false; cap.href = a.getAttribute('href');
      cap.textContent = a.querySelector('b').textContent + ' · ' + a.querySelector('small').textContent + ' — ver referência';
      a.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    app.querySelector('.capa__nav--prev').addEventListener('click', function () { go(-1); });
    app.querySelector('.capa__nav--next').addEventListener('click', function () { go(1); });

    var box = app.querySelector('.filtros');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var g = b.getAttribute('data-g');
      app.querySelectorAll('.idx').forEach(function (a) { a.hidden = !!g && a.getAttribute('data-g') !== g; });
            cur = -1; cap.hidden = true;
          });
    document.title = 'Catálogo de Cores · Gran Fish';
  }

  function head(it, title, sub, selo) {
    return '<div class="wrap"><div class="pg-cab"><div>' +
      '<div class="linha">Linha ' + esc(it.label) + '</div>' + title +
      '<div class="modelo">' + esc(sub) + '</div></div>' +
      (selo ? '<div class="selo"><small>REFERÊNCIA</small><b>' + esc(selo) + '</b></div>' : '') + '</div>';
  }

  function cor(c, i) {
    return '<div class="cor" data-hex="' + esc(c.hex) + '" title="Clique para copiar o HEX">' +
      '<div class="am" style="background:' + esc(c.hex) + '"></div>' +
      '<b>' + ('0' + (i + 1)).slice(-2) + '&nbsp; ' + esc(c.hex) + '</b><span>' + esc(cmyk(c.cmyk)) + '</span></div>';
  }

  function pager(idx) {
    var p = PAGES[idx - 1], n = PAGES[idx + 1];
    return '<nav class="nav-pg" aria-label="Páginas">' +
      (p ? '<a rel="prev" href="' + p.hash + '">← Anterior</a>' : '<span></span>') +
      (n ? '<a rel="next" href="' + n.hash + '">Próxima →</a>' : '<span></span>') + '</nav></div>';
  }

  function renderRef(page) {
    var it = page.item, v = it.variants[page.vi], idx = PAGES.indexOf(page);
    app.innerHTML = head(it, '<h1>Ref. ' + esc(v.ref) + '<span>' + esc(v.name) + '</span></h1>', it.line, v.ref) +
      '<div class="ref-grid"><div>' +
      '<div class="foto zw" title="Clique para ampliar">' + img('b', v.slug, '', 'Ref. ' + v.ref + ' ' + v.name, false) + '</div>' +
      '<div class="card faixa"><small>GRAFISMO APLICADO</small><div class="zw" title="Clique para ampliar">' + img('g', v.slug, '', 'Grafismo aplicado') + '</div></div>' +
      '<div class="minis">' +
      it.variants.map(function (m, i) {
        return '<a class="mini' + (i === page.vi ? ' sel' : '') + '" href="#/ref/' + m.slug + '"' + (i === page.vi ? ' aria-current="page"' : '') + '>' +
          img('t', m.slug, '', '') + '<h3>Ref. ' + esc(m.ref) + '</h3><p>' + esc(m.name) + '</p>' +
          '<div class="pontos">' + m.pal.map(function (c) { return '<i style="background:' + esc(c.hex) + '"></i>'; }).join('') + '</div></a>';
      }).join('') + '</div></div>' +
      '<aside class="card paleta"><h2>PALETA<small>de cores da referência</small></h2>' + v.pal.map(cor).join('') + '</aside></div>' +
      pager(idx);
    document.title = 'Ref. ' + v.ref + ' ' + v.name + ' · Catálogo de Cores Gran Fish';
  }

  function renderSem(page) {
    var it = page.item, idx = PAGES.indexOf(page), nm = it.variants[0].name;
    app.innerHTML = head(it, '<h1>' + esc(it.label) + '<span>' + esc(nm) + '</span></h1>',
      it.variants[0].ref + ' a ' + it.variants[it.variants.length - 1].ref + ' · ' + it.variants.length + ' versões de cor', '') +
      '<div class="sem-grid">' + it.variants.map(function (v) {
        return '<article class="card sem-card"><div class="zw" title="Clique para ampliar">' + img('b', v.slug, 'b', v.ref) + '</div><h3>Ref. ' + esc(v.ref) + '</h3>' + v.pal.map(cor).join('') + '</article>';
      }).join('') + '</div>' + pager(idx);
    document.title = it.label + ' ' + nm + ' · Catálogo de Cores Gran Fish';
  }

  var barra = document.querySelector('.barra');
  function setBarraH() { if (barra) document.documentElement.style.setProperty('--barra-h', barra.offsetHeight + 'px'); }
  setBarraH(); window.addEventListener('resize', setBarraH); window.addEventListener('load', setBarraH);

  /* ---------- roteador ---------- */
  function route() {
    var h = location.hash || '#/', m;
    if ((m = h.match(/^#\/ref\/([\w-]+)$/)) && BY_SLUG[m[1]]) renderRef(BY_SLUG[m[1]]);
    else if ((m = h.match(/^#\/sem\/(\w+)$/)) && PAGES.some(function (p) { return p.item.key === m[1]; })) {
      renderSem(PAGES.filter(function (p) { return p.item.key === m[1]; })[0]);
    } else renderHome();
    app.querySelectorAll('img').forEach(function (i) { if (i.complete) i.classList.add('ok'); });
    window.scrollTo(0, 0);
    hideRes();
  }

  document.addEventListener('load', function (e) { if (e.target.tagName === 'IMG') e.target.classList.add('ok'); }, true);

  /* zoom: ao passar o mouse amplia no ponto do cursor; ao clicar abre a imagem grande */
  app.addEventListener('mousemove', function (e) {
    var z = e.target.closest('.zw'); if (!z) return;
    var r = z.getBoundingClientRect(), im = z.querySelector('img'); if (!im) return;
    im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
  });
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', 'Imagem ampliada');
  lb.innerHTML = '<button type="button" class="lb__x" aria-label="Fechar">×</button><div class="lb__box"><img alt=""></div>';
  document.body.appendChild(lb);
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  lb.addEventListener('click', function (e) { if (e.target.tagName !== 'IMG') closeLb(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) closeLb(); });
  app.addEventListener('click', function (e) {
    var z = e.target.closest('.zw'); if (!z) return;
    var im = z.querySelector('img'); if (!im) return;
    var big = lb.querySelector('img'); big.src = im.currentSrc || im.src; big.alt = im.alt;
    lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('.lb__x').focus();
  });

  app.addEventListener('click', function (e) {
    var c = e.target.closest('.cor'); if (!c || !navigator.clipboard) return;
    navigator.clipboard.writeText(c.getAttribute('data-hex')).then(function () {
      c.classList.add('copiado'); setTimeout(function () { c.classList.remove('copiado'); }, 1400);
    });
  });

  document.addEventListener('keydown', function (e) {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName) || e.altKey || e.ctrlKey || e.metaKey) return;
    var m = (location.hash || '').match(/^#\/(ref|sem)\//); if (!m) return;
    var cur = PAGES.filter(function (p) { return p.hash === location.hash; })[0]; if (!cur) return;
    var t = PAGES[PAGES.indexOf(cur) + (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0)];
    if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && t) location.hash = t.hash;
  });

  /* ---------- busca ---------- */
  var sel = -1;
  function hideRes() { res.hidden = true; res.innerHTML = ''; sel = -1; }
  function search() {
    var t = norm(q.value.trim());
    if (!t) return hideRes();
    var out = [];
    PAGES.forEach(function (p) {
      if (out.length >= 12) return;
      var vs = p.item.type === 'sem' ? [p.item.variants[0]] : [p.item.variants[p.vi]];
      var v = vs[0];
      var hay = norm(v.ref + ' ' + v.name + ' ' + p.item.label + ' ' + p.item.line);
      if (hay.indexOf(t) >= 0) out.push({ p: p, v: v });
    });
    res.innerHTML = out.length ? out.map(function (o) {
      return '<li><a href="' + o.p.hash + '">' + img('s', o.v.slug, '', '', false) +
        '<span>Ref. ' + esc(o.v.ref) + ' ' + esc(o.v.name) + '<br><small>' + esc(o.p.item.line) + '</small></span></a></li>';
    }).join('') : '<li><a href="#/" tabindex="-1"><span>Nada encontrado</span></a></li>';
    res.hidden = false; sel = -1;
  }
  q.addEventListener('input', search);
  q.addEventListener('keydown', function (e) {
    var links = res.querySelectorAll('a');
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!links.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach(function (a, i) { a.classList.toggle('on', i === sel); });
    } else if (e.key === 'Enter') {
      e.preventDefault(); var a = links[sel < 0 ? 0 : sel]; if (a && a.getAttribute('href') !== '#/') { location.hash = a.getAttribute('href'); q.blur(); }
    } else if (e.key === 'Escape') { hideRes(); q.value = ''; }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.busca')) hideRes(); });
  document.getElementById('busca').addEventListener('submit', function (e) { e.preventDefault(); });

  window.addEventListener('hashchange', route);
  load().then(route).catch(function () {
    app.innerHTML = '<p class="wrap" style="padding:2rem">Não foi possível carregar os dados do catálogo.</p>';
  });
})();
