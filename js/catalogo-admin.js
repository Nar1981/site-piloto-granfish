(function () {
  const dados = window.GF_CATALOGO || [];
  let s = null;
  try {
    s = JSON.parse(sessionStorage.getItem('gf_admin_token') || 'null');
    if (s && s.exp <= Date.now()) s = null;
  } catch (e) {}
  const mostrar = (ok) => { document.getElementById(ok ? 'painel' : 'negado').hidden = false; };
  if (document.body.hasAttribute('data-publico')) { mostrar(true); iniciar(); }
  else { mostrar(!!s); if (s) iniciar(); }

  function iniciar() {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  };
  const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const sp = (b, k) => b.spec[k] || '—';
  const motor = (b) => b.spec['MOTORIZAÇÃO MÁXIMA'] || b.spec['MOTORIZAÇÃO'] || '—';
  const pessoas = (b) => String(b.spec['LOTAÇÃO'] || '—').replace(/^0/, '').toLowerCase();

  const LINHAS = [...new Set(dados.map((b) => b.linha))];
  let linha = '';
  let vista = 'cards';

  const tiles = $('linhas');
  function tile(valor, rotulo, n) {
    const b = el('button', 'stat');
    b.type = 'button';
    b.dataset.l = valor;
    b.append(el('b', '', n), el('span', '', rotulo));
    b.setAttribute('aria-pressed', 'false');
    tiles.appendChild(b);
  }
  tile('', 'Todos', dados.length);
  LINHAS.forEach((l) => tile(l, l, dados.filter((b) => b.linha === l).length));
  tiles.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';

  function filtrados() {
    const q = norm($('busca').value.trim());
    return dados.filter((b) => {
      if (linha && b.linha !== linha) return false;
      if (!q) return true;
      return norm([b.nome, b.cod, b.linha, ...b.itens].join(' ')).includes(q);
    });
  }

  function card(b) {
    const c = el('button', 'cat-card');
    c.type = 'button';
    c.dataset.id = b.id;
    const f = el('div', 'foto');
    if (b.fotos[0]) {
      const i = el('img');
      i.src = 'img/catalogo/' + b.fotos[0];
      i.alt = b.nome;
      i.loading = 'lazy';
      f.appendChild(i);
    }
    const corpo = el('div', 'corpo');
    corpo.append(el('h3', '', b.nome), el('div', 'cod', b.cod));
    const chips = el('div', 'chips');
    [sp(b, 'COMPRIMENTO').replace(/\s*m$/i, ' m'), pessoas(b), motor(b)].forEach((t) => chips.appendChild(el('span', 'chip', t)));
    corpo.appendChild(chips);
    c.append(f, corpo);
    return c;
  }

  function render() {
    const lista = filtrados();
    $('contagem').textContent = lista.length + (lista.length === 1 ? ' modelo' : ' modelos') + (linha ? ' · linha ' + linha : '');
    $('vazio').hidden = lista.length > 0;
    $('cards').hidden = vista !== 'cards';
    $('comparativo').hidden = vista !== 'tab';
    tiles.querySelectorAll('.stat').forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.l === linha)));

    const cards = $('cards');
    cards.textContent = '';
    lista.forEach((b) => cards.appendChild(card(b)));

    const tb = $('tab-linhas');
    tb.textContent = '';
    lista.forEach((b) => {
      const tr = document.createElement('tr');
      const vals = [b.nome, sp(b, 'COMPRIMENTO'), sp(b, 'BOCA'), sp(b, 'PONTAL'), pessoas(b), motor(b), sp(b, 'PESO APROXIMADO'), sp(b, 'CAPACIDADE DE CARGA')];
      vals.forEach((v) => tr.appendChild(el('td', '', v)));
      const td = el('td');
      const bt = el('button', 'button ver', 'Ficha');
      bt.type = 'button';
      bt.dataset.id = b.id;
      td.appendChild(bt);
      tr.appendChild(td);
      tb.appendChild(tr);
    });
  }

  const modal = $('modal');
  function abrir(id) {
    const b = dados.find((x) => x.id === id);
    if (!b) return;
    const q = norm($('busca').value.trim());
    modal.textContent = '';

    const topo = el('div', 'topo');
    const tt = el('div');
    tt.append(el('small', '', 'LINHA ' + b.linha + ' · ' + b.cod), el('h2', '', b.nome));
    const ac = el('div', 'acoes');
    const bc = el('button', 'button', 'Copiar resumo');
    bc.type = 'button';
    const bp = el('button', 'button', 'Imprimir');
    bp.type = 'button';
    const bx = el('button', 'button button--copper', 'Fechar');
    bx.type = 'button';
    ac.append(bc, bp, bx);
    topo.append(tt, ac);

    const corpo = el('div', 'corpo');
    let highlightItem = () => {};
    let clearHighlight = () => {};
    const pinElements = {};

    if (b.fotos.length) {
      const fs = el('div', 'cat-fotos');
      b.fotos.forEach((f, fIdx) => {
        const fig = el('figure');
        const isInteractive = b.pins && b.pins.length && fIdx === 0;

        if (isInteractive) {
          const wrap = el('div', 'cat-interactive-wrap');
          const i = el('img', 'cat-blueprint-img');
          i.src = 'img/catalogo/' + f;
          i.alt = b.nome;
          wrap.appendChild(i);

          const tip = el('div', 'cat-pin-tip');
          tip.hidden = true;
          wrap.appendChild(tip);

          b.pins.forEach((p) => {
            const pin = el('button', 'cat-pin');
            pin.type = 'button';
            pin.dataset.num = p.num;
            pin.style.left = p.x + '%';
            pin.style.top = p.y + '%';
            pin.textContent = p.num;
            pin.setAttribute('aria-label', p.num + ' - ' + p.item);
            pinElements[p.num] = pin;

            const onEnter = () => {
              tip.textContent = p.num + ' · ' + p.item;
              tip.style.left = Math.min(Math.max(p.x, 15), 85) + '%';
              tip.style.top = Math.max(p.y - 8, 4) + '%';
              tip.hidden = false;
              pin.classList.add('ativo');
              highlightItem(p.num);
            };
            const onLeave = () => {
              tip.hidden = true;
              pin.classList.remove('ativo');
              clearHighlight();
            };

            pin.addEventListener('mouseenter', onEnter);
            pin.addEventListener('mouseleave', onLeave);
            pin.addEventListener('focus', onEnter);
            pin.addEventListener('blur', onLeave);
            pin.addEventListener('click', (ev) => {
              ev.preventDefault();
              onEnter();
              const targetLi = modal.querySelector(`.cat-itens li[data-num="${p.num}"]`);
              if (targetLi) targetLi.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            wrap.appendChild(pin);
          });

          const cap = el('figcaption', '', 'Vista superior interativa · Passe o mouse nos números para identificar os itens');
          fig.append(wrap, cap);
        } else {
          const i = el('img');
          i.src = 'img/catalogo/' + f;
          i.alt = b.nome;
          const cap = el('figcaption', '', 'Imagem');
          i.addEventListener('load', () => {
            cap.textContent = i.naturalWidth / i.naturalHeight > 2 ? 'Vista superior · itens numerados' : 'Foto da embarcação / Prancha técnica';
          });
          fig.append(i, cap);
        }
        fs.appendChild(fig);
      });
      corpo.appendChild(fs);
    }

    const dois = el('div', 'cat-dois');
    const c1 = el('div');
    c1.appendChild(el('h3', '', 'Ficha técnica'));
    const ul = el('ul', 'cat-spec');
    Object.entries(b.spec).forEach(([k, v]) => {
      const li = el('li');
      li.append(el('span', '', k.charAt(0) + k.slice(1).toLowerCase()), el('b', '', v));
      ul.appendChild(li);
    });
    c1.appendChild(ul);
    const c2 = el('div');
    c2.appendChild(el('h3', '', 'Itens de série (' + b.itens.length + ')'));
    const ol = el('ul', 'cat-itens');
    b.itens.forEach((t, iIdx) => {
      const num = iIdx + 1;
      const li = el('li', q && norm(t).includes(q) ? 'dest' : '', t);
      li.dataset.num = num;
      li.addEventListener('mouseenter', () => {
        li.classList.add('pin-ativo');
        if (pinElements[num]) pinElements[num].classList.add('ativo');
      });
      li.addEventListener('mouseleave', () => {
        li.classList.remove('pin-ativo');
        if (pinElements[num]) pinElements[num].classList.remove('ativo');
      });
      ol.appendChild(li);
    });

    highlightItem = (num) => {
      clearHighlight();
      const targetLi = modal.querySelector(`.cat-itens li[data-num="${num}"]`);
      if (targetLi) targetLi.classList.add('pin-ativo');
    };
    clearHighlight = () => {
      modal.querySelectorAll('.cat-itens li.pin-ativo').forEach((li) => li.classList.remove('pin-ativo'));
    };

    c2.appendChild(ol);
    dois.append(c1, c2);
    corpo.appendChild(dois);
    modal.append(topo, corpo);

    bx.addEventListener('click', () => modal.close());
    bp.addEventListener('click', () => imprimir([b], false));
    bc.addEventListener('click', () => {
      const txt = [b.nome + ' (' + b.cod + ') - Linha ' + b.linha, '']
        .concat(Object.entries(b.spec).map(([k, v]) => k + ': ' + v))
        .concat(['', 'Itens de série:'], b.itens.map((t, i) => (i + 1) + '. ' + t)).join('\n');
      const ok = () => window.GFToast && window.GFToast('Resumo copiado.');
      const fail = () => window.GFToast && window.GFToast('Não foi possível copiar.', true);
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(ok, fail); else fail();
    });
    if (!modal.open) modal.showModal();
    modal.scrollTop = 0;
    history.replaceState(null, '', '#' + id);
  }

  const pagina = (cls) => el('section', 'pg ' + cls);
  const barra = () => el('div', 'pg-barra');
  const rodape = (b, n) => {
    const r = el('div', 'pg-rod');
    r.append(el('span', '', 'GRAN FISH | Catálogo de Embarcações'), el('em', '', b ? 'LINHA ' + b.linha : ''), el('b', '', String(n).padStart(2, '0')));
    return r;
  };
  const cab = (t) => {
    const c = el('div', 'pg-cab');
    const lg = el('img');
    lg.src = 'img/catalogo/logo-impressao.png';
    lg.alt = 'Gran Fish';
    c.append(el('span', '', t), lg);
    return c;
  };

  function paginaModelo(b, cargas) {
    const p = pagina('pg-modelo');
    const esq = el('div', 'pg-esq');
    const dir = el('div', 'pg-dir');
    const imgs = b.fotos.map((f) => {
      const i = el('img');
      i.src = 'img/catalogo/' + f;
      i.alt = b.nome;
      cargas.push(new Promise((r) => { i.onload = i.onerror = r; }));
      return i;
    });
    const caixa = el('div', 'pg-foto');
    const vista = el('div', 'pg-vista');
    vista.appendChild(el('h4', '', 'VISTA SUPERIOR'));
    const mapa = el('div', 'pg-vimg');
    const ehTopo = (i) => i.naturalWidth / i.naturalHeight > 2;
    Promise.all(cargas).then(() => {
      const foto = imgs.find((i) => !ehTopo(i));
      const topo = imgs.find(ehTopo);
      if (foto) caixa.appendChild(foto); else caixa.appendChild(el('span', '', 'FOTO DA EMBARCAÇÃO'));
      if (topo) mapa.appendChild(topo);
    });
    vista.appendChild(mapa);
    esq.append(caixa, vista);

    dir.append(el('h2', '', b.nome), el('span', 'pg-cod', b.cod), el('h3', '', 'FICHA TÉCNICA'));
    const ul = el('ul', 'pg-spec');
    Object.entries(b.spec).forEach(([k, v]) => {
      const li = el('li');
      li.append(el('span', '', k.charAt(0) + k.slice(1).toLowerCase()), el('b', '', v));
      ul.appendChild(li);
    });
    dir.append(ul, el('h3', '', 'ITENS DE SÉRIE'));
    const it = el('div', 'pg-itens');
    const meio = Math.ceil(b.itens.length / 2);
    [b.itens.slice(0, meio), b.itens.slice(meio)].forEach((grupo, g) => {
      const col = el('ol');
      col.start = g ? meio + 1 : 1;
      grupo.forEach((t, k) => {
        const li = el('li');
        li.append(el('b', '', String((g ? meio : 0) + k + 1)), document.createTextNode(' - ' + t));
        col.appendChild(li);
      });
      it.appendChild(col);
    });
    dir.appendChild(it);
    p.append(barra(), cab('LINHA ' + b.linha), esq, dir, rodape(b, b.slide));
    return p;
  }

  function paginasGerais(lista) {
    const capa = pagina('pg-capa');
    const lg = el('img', 'pg-capalogo');
    lg.src = 'logo%20GF.png';
    lg.alt = 'Gran Fish';
    const chips = el('div', 'pg-chips');
    [...new Set(lista.map((b) => b.linha))].forEach((l) => chips.appendChild(el('span', '', l)));
    capa.append(lg, el('i', 'pg-traco'), el('p', 'pg-t1', 'CATÁLOGO DE'), el('p', 'pg-t2', 'EMBARCAÇÕES'),
      el('p', 'pg-t3', 'Fichas técnicas e itens de série'), chips, el('p', 'pg-t4', lista.length + ' modelos'));

    const ind = pagina('pg-indice');
    ind.append(barra(), el('h2', '', 'Índice'), el('i', 'pg-traco'));
    const cols = el('div', 'pg-cols');
    [...new Set(lista.map((b) => b.linha))].forEach((l) => {
      const g = el('div', 'pg-grupo');
      g.appendChild(el('h4', '', 'LINHA ' + l));
      lista.filter((b) => b.linha === l).forEach((b) => {
        const li = el('div', 'pg-ind');
        li.append(el('span', '', b.nome), el('b', '', String(b.slide).padStart(2, '0')));
        g.appendChild(li);
      });
      cols.appendChild(g);
    });
    ind.append(cols, rodape(null, 2));

    const cmp = pagina('pg-comp');
    cmp.append(barra(), el('h2', '', 'Quadro comparativo'), el('i', 'pg-traco'));
    const t = el('table');
    const th = el('tr');
    ['Modelo', 'Comprimento', 'Boca', 'Pontal', 'Lotação', 'Motor máx.', 'Peso', 'Carga'].forEach((x) => th.appendChild(el('th', '', x)));
    t.appendChild(th);
    lista.forEach((b) => {
      const tr = el('tr');
      [b.nome, sp(b, 'COMPRIMENTO'), sp(b, 'BOCA'), sp(b, 'PONTAL'), pessoas(b), motor(b), sp(b, 'PESO APROXIMADO'), sp(b, 'CAPACIDADE DE CARGA')]
        .forEach((x) => tr.appendChild(el('td', '', x)));
      t.appendChild(tr);
    });
    cmp.append(t, rodape(null, 3));
    return [capa, ind, cmp];
  }

  function imprimir(lista, completo) {
    const velho = $('impressao');
    if (velho) velho.remove();
    const raiz = el('div');
    raiz.id = 'impressao';
    const cargas = [];
    if (completo) paginasGerais(lista).forEach((p) => raiz.appendChild(p));
    lista.forEach((b) => raiz.appendChild(paginaModelo(b, cargas)));
    document.body.appendChild(raiz);
    document.body.classList.add('imprimindo');
    const fim = () => { document.body.classList.remove('imprimindo'); raiz.remove(); window.removeEventListener('afterprint', fim); };
    window.addEventListener('afterprint', fim);
    Promise.all(cargas).then(() => setTimeout(() => window.print(), 150));
  }
  window.GFImprimirCatalogo = imprimir;

  const bImp = el('button', 'button', 'Imprimir catálogo');
  bImp.type = 'button';
  $('v-tab').after(bImp);
  bImp.addEventListener('click', () => imprimir(filtrados(), true));

  modal.addEventListener('close', () => history.replaceState(null, '', location.pathname));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

  tiles.addEventListener('click', (e) => {
    const t = e.target.closest('.stat');
    if (!t) return;
    linha = t.dataset.l;
    render();
  });
  $('busca').addEventListener('input', render);
  const setVista = (v) => {
    vista = v;
    $('v-cards').setAttribute('aria-pressed', String(v === 'cards'));
    $('v-tab').setAttribute('aria-pressed', String(v === 'tab'));
    render();
  };
  $('v-cards').addEventListener('click', () => setVista('cards'));
  $('v-tab').addEventListener('click', () => setVista('tab'));
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.cat-card, .ver');
    if (t && t.dataset.id) abrir(t.dataset.id);
  });

  render();
  const h = decodeURIComponent(location.hash.slice(1));
  if (h) abrir(h);
  }
})();
