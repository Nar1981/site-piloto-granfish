(function () {
  const cfg = window.GF_CADASTRO || {};
  const live = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const IDLE_MS = 15 * 60 * 1000;
  const MAX_TRIES = 5;
  const LOCK_MS = 5 * 60 * 1000;
  let idleTimer;
  const LOCAL_KEY = 'gf_cadastros_demo';
  const TOKEN_KEY = 'gf_admin_token';
  const STATUS = ['Pendente', 'Aprovado', 'Atualização necessária'];
  const $ = (id) => document.getElementById(id);
  let rows = [];
  let statusFiltro = '';

  // ── Sessão ──
  const token = () => {
    const s = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    if (!s || s.exp < Date.now()) { sessionStorage.removeItem(TOKEN_KEY); return null; }
    return s.t;
  };

  function resetIdle() {
    clearTimeout(idleTimer);
    if (!live || $('painel').hidden) return;
    idleTimer = setTimeout(() => logout('Sessão encerrada por inatividade.'), IDLE_MS);
  }

  async function logout(msg) {
    const t = token();
    sessionStorage.removeItem(TOKEN_KEY);
    rows = [];
    $('linhas').replaceChildren();
    if (t) fetch(cfg.supabaseUrl + '/auth/v1/logout', { method: 'POST', headers: headers(t) }).catch(() => {});
    showLogin();
    $('login-erro').textContent = msg || '';
  }

  const lockLeft = () => Math.max(0, Number(localStorage.getItem('gf_admin_lock') || 0) - Date.now());

  // ── Dados ──
  const headers = (token) => ({
    apikey: cfg.supabaseAnonKey,
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json'
  });

  async function load() {
    if (!live) return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    if (!token()) throw new Error('auth');
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/cadastros?select=*&order=created_at.desc', { headers: headers(token()) });
    if (r.status === 401 || r.status === 403) throw new Error('auth');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }

  async function setStatus(id, status) {
    if (!live) {
      const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      const it = all.find((x) => x.id === id);
      if (it) it.status = status;
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      return;
    }
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/cadastros?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      headers: { ...headers(token()), Prefer: 'return=minimal' },
      body: JSON.stringify({ status })
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  // ── Interface ──
  function cell(tr, text) {
    const td = document.createElement('td');
    td.textContent = text || '';
    tr.appendChild(td);
    return td;
  }

  function render() {
    const q = $('filtro').value.trim().toLowerCase();
    const body = $('linhas');
    body.replaceChildren();
    $('n-total').textContent = rows.length;
    $('n-pend').textContent = rows.filter((r) => r.status === 'Pendente').length;
    $('n-apr').textContent = rows.filter((r) => r.status === 'Aprovado').length;
    $('n-atu').textContent = rows.filter((r) => r.status === 'Atualização necessária').length;
    document.querySelectorAll('#stats .stat').forEach((b) => b.classList.toggle('on', b.dataset.f === statusFiltro));
    const list = rows.filter((r) => (!statusFiltro || r.status === statusFiltro) && (!q || [r.nome, r.documento, r.email].join(' ').toLowerCase().includes(q)));
    $('vazio').hidden = list.length > 0;
    for (const r of list) {
      const tr = document.createElement('tr');
      cell(tr, new Date(r.created_at).toLocaleString('pt-BR'));
      cell(tr, r.tipo);
      cell(tr, r.nome);
      cell(tr, r.documento);
      cell(tr, [r.email, r.telefone].filter(Boolean).join(' · '));
      cell(tr, (r.finalidades || []).join(', ') + (r.finalidade_outro ? ' (' + r.finalidade_outro + ')' : ''));
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Status');
      for (const s of STATUS) {
        const o = document.createElement('option');
        o.textContent = s;
        o.selected = s === r.status;
        sel.appendChild(o);
      }
      sel.addEventListener('change', async () => {
        sel.disabled = true;
        try {
          await setStatus(r.id, sel.value);
          r.status = sel.value;
          if (window.GFToast) GFToast('Status salvo: ' + sel.value);
          render();
        } catch (e) {
          sel.value = r.status;
          sel.disabled = false;
          if (window.GFToast) GFToast('Não foi possível salvar.', true);
        }
      });
      const tdS = document.createElement('td');
      tdS.appendChild(sel);
      tr.appendChild(tdS);
      const tdA = document.createElement('td');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ver';
      b.textContent = 'Detalhes';
      let det = null;
      b.addEventListener('click', () => {
        if (det) { det.remove(); det = null; b.textContent = 'Detalhes'; return; }
        det = document.createElement('tr');
        det.className = 'det';
        const td = document.createElement('td');
        td.colSpan = 8;
        const dl = document.createElement('dl');
        const itens = Object.entries(r.dados || {}).filter(([, v]) => v !== '' && v != null);
        if (!itens.length) itens.push(['Detalhes', 'Sem dados adicionais.']);
        for (const [k, v] of itens) {
          const box = document.createElement('div');
          const dt = document.createElement('dt');
          dt.textContent = k.replace(/_/g, ' ');
          const dd = document.createElement('dd');
          dd.textContent = Array.isArray(v) ? v.join(', ') : String(v);
          box.append(dt, dd);
          dl.appendChild(box);
        }
        td.appendChild(dl);
        det.appendChild(td);
        tr.after(det);
        b.textContent = 'Ocultar';
      });
      tdA.appendChild(b);
      tr.appendChild(tdA);
      body.appendChild(tr);
    }
  }

  function csv() {
    const keys = new Set();
    rows.forEach((r) => Object.keys(r.dados || {}).forEach((k) => keys.add(k)));
    const cols = ['created_at', 'status', 'tipo', 'finalidades', 'finalidade_outro', 'nome', 'documento', 'email', 'telefone', ...keys];
    const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    const lines = [cols.map(esc).join(';')];
    for (const r of rows) {
      lines.push(cols.map((c) => esc(c === 'finalidades' ? (r.finalidades || []).join(', ') : r[c] !== undefined ? r[c] : (r.dados || {})[c])).join(';'));
    }
    const blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cadastros-granfish.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function showPanel() {
    try {
      rows = await load();
    } catch (e) {
      if (e.message === 'auth') return logout('Sessão expirada. Entre novamente.');
      $('modo').textContent = 'Não foi possível carregar os cadastros.';
      return;
    }
    $('login').hidden = true;
    $('painel').hidden = false;
    if (live) $('modo').textContent = 'Acompanhe e organize os cadastros recebidos pelo site.';
    render();
    resetIdle();
  }

  function showLogin() {
    $('painel').hidden = true;
    $('login').hidden = false;
  }

  $('filtro').addEventListener('input', render);
  $('csv').addEventListener('click', csv);
  document.querySelectorAll('#stats .stat').forEach((b) => b.addEventListener('click', () => { statusFiltro = b.dataset.f; render(); }));
  ['click', 'keydown', 'mousemove'].forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }));

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('login-erro').textContent = '';
    const f = e.target.elements;
    if (lockLeft()) { $('login-erro').textContent = 'Muitas tentativas. Aguarde ' + Math.ceil(lockLeft() / 60000) + ' min.'; return; }
    const r = await fetch(cfg.supabaseUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.email.value, password: f.senha.value })
    }).catch(() => ({ ok: false }));
    if (!r.ok) {
      const n = Number(sessionStorage.getItem('gf_admin_fail') || 0) + 1;
      sessionStorage.setItem('gf_admin_fail', n);
      if (n >= MAX_TRIES) { localStorage.setItem('gf_admin_lock', Date.now() + LOCK_MS); sessionStorage.removeItem('gf_admin_fail'); }
      $('login-erro').textContent = 'E-mail ou senha inválidos.';
      return;
    }
    sessionStorage.removeItem('gf_admin_fail');
    const j = await r.json();
    sessionStorage.setItem(TOKEN_KEY, JSON.stringify({ t: j.access_token, exp: Date.now() + Math.min(j.expires_in || 3600, 3600) * 1000 }));
    f.senha.value = '';
    const next = new URLSearchParams(location.search).get('next');
    const destino = next && /^[a-z0-9-]+\.html$/.test(next) && next !== 'cadastros-admin.html' ? next : 'painel-interno.html';
    location.href = destino;
  });

  if (live) {
    $('modo').textContent = 'Banco de dados conectado. Entre com a conta da equipe para ver os cadastros.';
    token() ? showPanel() : showLogin();
  } else if (!local) {
    $('modo').textContent = 'Acesso indisponível: o banco de dados ainda não foi conectado. Veja supabase/README.md.';
  } else {
    $('modo').textContent = 'Modo demonstração: mostrando apenas cadastros salvos neste navegador. Conecte o banco de dados (veja supabase/README.md) para receber cadastros de todos os visitantes.';
    showPanel();
  }
})();
