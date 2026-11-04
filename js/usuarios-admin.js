(function () {
  const cfg = window.GF_CADASTRO || {};
  const TOKEN_KEY = 'gf_admin_token';
  const $ = (id) => document.getElementById(id);

  // ── Sessão ──
  const session = () => {
    const s = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
    return s && s.exp > Date.now() ? s : null;
  };

  const rpc = async (fn, args) => {
    const s = session();
    if (!s) throw new Error('auth');
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/rpc/' + fn, {
      method: 'POST',
      headers: { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + s.t, 'Content-Type': 'application/json' },
      body: JSON.stringify(args || {})
    });
    if (r.status === 401) throw new Error('auth');
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.message) || 'Erro ' + r.status);
    return j;
  };

  const userId = () => {
    try { return JSON.parse(atob(session().t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub; } catch (e) { return null; }
  };

  // ── Interface ──
  const fmt = (d) => (d ? new Date(d).toLocaleString('pt-BR') : '—');

  function cell(tr, text) {
    const td = document.createElement('td');
    td.textContent = text;
    tr.appendChild(td);
    return td;
  }

  async function carregar() {
    const lista = await rpc('listar_admins');
    const me = userId();
    $('linhas').replaceChildren();
    for (const u of lista) {
      const tr = document.createElement('tr');
      cell(tr, u.email + (u.id === me ? ' (você)' : ''));
      cell(tr, fmt(u.created_at));
      cell(tr, fmt(u.last_sign_in_at));
      const td = document.createElement('td');
      if (u.id !== me) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'acao';
        b.textContent = 'Remover';
        b.addEventListener('click', async () => {
          if (!confirm('Remover o acesso de ' + u.email + '?')) return;
          b.disabled = true;
          try { await rpc('remover_admin', { p_id: u.id }); await carregar(); }
          catch (e) { alert(e.message); b.disabled = false; }
        });
        td.appendChild(b);
      }
      tr.appendChild(td);
      $('linhas').appendChild(tr);
    }
  }

  $('novo-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('novo-erro').textContent = '';
    $('novo-ok').textContent = '';
    const f = e.target.elements;
    try {
      await rpc('criar_admin', { p_email: f.email.value, p_senha: f.senha.value });
      $('novo-ok').textContent = 'Administrador criado: ' + f.email.value;
      e.target.reset();
      await carregar();
    } catch (err) {
      $('novo-erro').textContent = err.message === 'auth' ? 'Sessão expirada. Entre novamente.' : err.message;
    }
  });

  async function init() {
    if (!cfg.supabaseUrl || !session()) { $('negado').hidden = false; return; }
    try {
      await carregar();
      $('painel').hidden = false;
    } catch (e) {
      $('negado').hidden = false;
    }
  }

  init();
})();
