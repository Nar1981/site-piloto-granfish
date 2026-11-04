(function () {
  const cfg = window.GF_CADASTRO || {};
  const TOKEN_KEY = 'gf_admin_token';
  const $ = (id) => document.getElementById(id);

  const session = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
      return s && s.exp > Date.now() ? s : null;
    } catch (e) { return null; }
  };

  const api = async (path, method, body, prefer) => {
    const s = session();
    if (!s) throw new Error('auth');
    const headers = { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + s.t, 'Content-Type': 'application/json' };
    if (prefer) headers.Prefer = prefer;
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/' + path, {
      method: method || 'GET', headers, body: body ? JSON.stringify(body) : undefined
    });
    if (r.status === 401) throw new Error('auth');
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.message) || 'Erro ' + r.status);
    return j;
  };

  const msg = (e) => (e.message === 'auth' ? 'Sessão expirada. Entre novamente.' : e.message);

  const normaliza = (txt) => {
    const out = new Set();
    for (const linha of txt.split(/\s+/)) {
      const m = /^https:\/\/(?:www\.)?instagram\.com\/(?:[A-Za-z0-9_.]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/.exec(linha.trim());
      if (m) out.add('https://www.instagram.com/' + m[1] + '/' + m[2] + '/');
    }
    return [...out];
  };

  async function carregarConfig() {
    const [c] = await api('instagram_config?select=modo,perfil&id=eq.1');
    const f = $('modo-form').elements;
    for (const r of f.modo) r.checked = r.value === c.modo;
    f.perfil.value = c.perfil || '';
  }

  async function carregarPosts() {
    const lista = await api('instagram_posts?select=id,url,ativo,ordem&order=ordem.asc,id.asc');
    $('linhas').replaceChildren();
    lista.forEach((p, idx) => {
      const tr = document.createElement('tr');
      const td1 = document.createElement('td');
      const a = document.createElement('a');
      a.href = p.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.textContent = p.url.replace('https://www.instagram.com/', '');
      td1.appendChild(a);

      const td2 = document.createElement('td');
      const ordem = document.createElement('input');
      ordem.type = 'number'; ordem.value = p.ordem; ordem.style.width = '70px';
      ordem.setAttribute('aria-label', 'Ordem');
      ordem.addEventListener('change', async () => {
        try { await api('instagram_posts?id=eq.' + p.id, 'PATCH', { ordem: parseInt(ordem.value, 10) || 0 }, 'return=minimal'); }
        catch (e) { alert(msg(e)); }
      });
      const mover = async (dir) => {
        const j = idx + dir;
        if (j < 0 || j >= lista.length) return;
        const novo = lista.slice();
        [novo[idx], novo[j]] = [novo[j], novo[idx]];
        try {
          // renumera em sequência para evitar ordens repetidas
          await Promise.all(novo.map((x, k) => (x.ordem === k + 1 ? null :
            api('instagram_posts?id=eq.' + x.id, 'PATCH', { ordem: k + 1 }, 'return=minimal'))));
          await carregarPosts();
        } catch (e) { alert(msg(e)); }
      };
      const setaBtn = (txt, rotulo, dir, off) => {
        const bt = document.createElement('button');
        bt.type = 'button'; bt.className = 'acao'; bt.textContent = txt;
        bt.setAttribute('aria-label', rotulo); bt.title = rotulo; bt.disabled = off;
        bt.addEventListener('click', () => mover(dir));
        return bt;
      };
      td2.append(ordem, ' ', setaBtn('↑', 'Subir', -1, idx === 0), ' ', setaBtn('↓', 'Descer', 1, idx === lista.length - 1));

      const td3 = document.createElement('td');
      const chk = document.createElement('input');
      chk.type = 'checkbox'; chk.checked = p.ativo;
      chk.setAttribute('aria-label', 'Visível no site');
      chk.addEventListener('change', async () => {
        try { await api('instagram_posts?id=eq.' + p.id, 'PATCH', { ativo: chk.checked }, 'return=minimal'); }
        catch (e) { alert(msg(e)); chk.checked = !chk.checked; }
      });
      td3.appendChild(chk);

      const td4 = document.createElement('td');
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'acao'; b.textContent = 'Remover';
      b.addEventListener('click', async () => {
        if (!confirm('Remover esta publicação do site?')) return;
        try { await api('instagram_posts?id=eq.' + p.id, 'DELETE', null, 'return=minimal'); await carregarPosts(); }
        catch (e) { alert(msg(e)); }
      });
      td4.appendChild(b);

      tr.append(td1, td2, td3, td4);
      $('linhas').appendChild(tr);
    });
  }

  $('modo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('modo-erro').textContent = ''; $('modo-ok').textContent = '';
    const f = e.target.elements;
    const modo = f.modo.value || 'manual';
    const perfil = f.perfil.value.trim().replace(/^@/, '');
    if (modo === 'automatico' && !perfil) { $('modo-erro').textContent = 'Informe o perfil para usar o modo automático.'; return; }
    try {
      await api('instagram_config?id=eq.1', 'PATCH', { modo, perfil: perfil || null }, 'return=minimal');
      $('modo-ok').textContent = 'Salvo. O site já usa o novo modo.';
    } catch (err) { $('modo-erro').textContent = msg(err); }
  });

  $('novo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('novo-erro').textContent = ''; $('novo-ok').textContent = '';
    const urls = normaliza(e.target.elements.links.value);
    if (!urls.length) { $('novo-erro').textContent = 'Nenhum link válido do Instagram encontrado.'; return; }
    try {
      const atual = await api('instagram_posts?select=ordem&order=ordem.desc&limit=1');
      let ordem = atual.length ? atual[0].ordem : 0;
      await api('instagram_posts?on_conflict=url', 'POST',
        urls.map((url) => ({ url, ordem: ++ordem })), 'resolution=ignore-duplicates,return=minimal');
      $('novo-ok').textContent = urls.length + ' link(s) processado(s).';
      e.target.reset();
      await carregarPosts();
    } catch (err) { $('novo-erro').textContent = msg(err); }
  });

  (async function init() {
    if (!cfg.supabaseUrl || !session()) { $('negado').hidden = false; return; }
    try {
      await carregarConfig();
      await carregarPosts();
      $('painel').hidden = false;
    } catch (e) { $('negado').hidden = false; }
  })();
})();
