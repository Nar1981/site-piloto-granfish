(function () {
  const dados = window.GF_CATALOGO || [];
  let s = null;
  try {
    s = JSON.parse(sessionStorage.getItem('gf_admin_token') || 'null');
    if (s && s.exp <= Date.now()) s = null;
  } catch (e) {}
  document.getElementById(s ? 'painel' : 'negado').hidden = false;
  if (!s) return;

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
    if (b.fotos.length) {
      const fs = el('div', 'cat-fotos');
      b.fotos.forEach((f) => {
        const fig = el('figure');
        const i = el('img');
        i.src = 'img/catalogo/' + f;
        i.alt = b.nome;
        const cap = el('figcaption', '', 'Imagem');
        i.addEventListener('load', () => {
          cap.textContent = i.naturalWidth / i.naturalHeight > 2 ? 'Vista superior · itens numerados' : 'Foto da embarcação';
        });
        fig.append(i, cap);
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
    b.itens.forEach((t) => {
      const li = el('li', q && norm(t).includes(q) ? 'dest' : '', t);
      ol.appendChild(li);
    });
    c2.appendChild(ol);
    dois.append(c1, c2);
    corpo.appendChild(dois);
    modal.append(topo, corpo);

    bx.addEventListener('click', () => modal.close());
    bp.addEventListener('click', () => window.print());
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
})();
