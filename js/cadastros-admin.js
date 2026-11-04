(function () {
  const cfg = window.GF_CADASTRO || {};
  const live = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const LOCAL_KEY = 'gf_cadastros_demo';
  const TOKEN_KEY = 'gf_admin_token';
  const STATUS = ['Pendente', 'Aprovado', 'Atualização necessária'];
  const $ = (id) => document.getElementById(id);
  let rows = [];

  // ── Dados ──
  const headers = (token) => ({
    apikey: cfg.supabaseAnonKey,
    Authorization: 'Bearer ' + token,
    'Content-Type': 'application/json'
  });

  async function load() {
    if (!live) return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/cadastros?select=*&order=created_at.desc', { headers: headers(sessionStorage.getItem(TOKEN_KEY)) });
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
      headers: { ...headers(sessionStorage.getItem(TOKEN_KEY)), Prefer: 'return=minimal' },
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
    const list = rows.filter((r) => !q || [r.nome, r.documento, r.email].join(' ').toLowerCase().includes(q));
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
      const tdS = document.createElement('td');
      tdS.appendChild(sel);
      tr.appendChild(tdS);
      const tdA = document.createElement('td');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'acao';
      b.textContent = 'Salvar';
      b.addEventListener('click', async () => {
        b.disabled = true;
        try { await setStatus(r.id, sel.value); r.status = sel.value; b.textContent = 'Salvo ✓'; }
        catch (e) { b.textContent = 'Erro'; }
        setTimeout(() => { b.textContent = 'Salvar'; b.disabled = false; }, 1400);
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
      if (e.message === 'auth') { sessionStorage.removeItem(TOKEN_KEY); return showLogin(); }
      $('modo').textContent = 'Não foi possível carregar os cadastros.';
      return;
    }
    $('login').hidden = true;
    $('painel').hidden = false;
    render();
  }

  function showLogin() {
    $('painel').hidden = true;
    $('login').hidden = false;
  }

  $('filtro').addEventListener('input', render);
  $('csv').addEventListener('click', csv);
  $('sair').addEventListener('click', () => { sessionStorage.removeItem(TOKEN_KEY); live ? showLogin() : (window.location.href = 'cadastro.html'); });

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('login-erro').textContent = '';
    const f = e.target.elements;
    const r = await fetch(cfg.supabaseUrl + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { apikey: cfg.supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: f.email.value, password: f.senha.value })
    });
    if (!r.ok) { $('login-erro').textContent = 'E-mail ou senha inválidos.'; return; }
    sessionStorage.setItem(TOKEN_KEY, (await r.json()).access_token);
    f.senha.value = '';
    showPanel();
  });

  if (live) {
    $('modo').textContent = 'Banco de dados conectado. Entre com a conta da equipe para ver os cadastros.';
    sessionStorage.getItem(TOKEN_KEY) ? showPanel() : showLogin();
  } else {
    $('modo').textContent = 'Modo demonstração: mostrando apenas cadastros salvos neste navegador. Conecte o banco de dados (veja supabase/README.md) para receber cadastros de todos os visitantes.';
    showPanel();
  }
})();
