(function () {
  const cfg = window.GF_CADASTRO || {};
  const campos = window.GF_CAMPOS || [];
  const TOKEN_KEY = 'gf_admin_token';
  const $ = (id) => document.getElementById(id);
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const TEL = /^\d{10,15}$/;

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
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/' + path, { method: method || 'GET', headers, body: body ? JSON.stringify(body) : undefined });
    if (r.status === 401) throw new Error('auth');
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && j.message) || 'Erro ' + r.status);
    return j;
  };

  const inputs = {};

  function montar(salvo) {
    const form = $('form');
    form.replaceChildren();
    let grupo = null, card = null;
    for (const c of campos) {
      if (c.g !== grupo) {
        grupo = c.g;
        card = document.createElement('div');
        card.className = 'card';
        card.style.marginBottom = '22px';
        const h = document.createElement('h2');
        h.className = 'card-title';
        h.textContent = grupo;
        card.appendChild(h);
        form.appendChild(card);
      }
      const label = document.createElement('label');
      label.className = 'f';
      label.append(c.r);
      let el;
      const atual = salvo[c.k];
      if (c.t === 'longo' || c.t === 'linhas') {
        el = document.createElement('textarea');
        el.rows = c.t === 'linhas' ? 4 : 3;
        el.maxLength = 2000;
        el.value = atual !== undefined ? atual : '';
        el.placeholder = c.v;
      } else if (c.t === 'cor') {
        el = document.createElement('input');
        el.type = 'color';
        el.value = HEX.test(atual || '') ? atual : c.v;
        el.dataset.padrao = c.v;
      } else if (c.t === 'mostrar') {
        el = document.createElement('input');
        el.type = 'checkbox';
        el.checked = atual !== '0';
        label.style.display = 'flex';
        label.style.gap = '10px';
        label.style.alignItems = 'center';
      } else {
        el = document.createElement('input');
        el.type = 'text';
        el.maxLength = c.t === 'whatsapp' ? 15 : 300;
        el.value = atual !== undefined ? atual : '';
        el.placeholder = c.v;
      }
      inputs[c.k] = el;
      label.appendChild(el);
      card.appendChild(label);
    }
    const erro = document.createElement('p'); erro.className = 'erro'; erro.id = 'erro';
    const ok = document.createElement('p'); ok.className = 'nota'; ok.id = 'ok'; ok.style.color = 'var(--teal)';
    const salvar = document.createElement('button');
    salvar.type = 'submit'; salvar.className = 'button button--copper'; salvar.textContent = 'Salvar alterações';
    const ver = document.createElement('a');
    ver.className = 'button'; ver.href = 'index.html?pular'; ver.target = '_blank'; ver.rel = 'noopener'; ver.textContent = 'Ver o site ↗';
    ver.style.marginLeft = '10px';
    form.append(erro, ok, salvar, ver);
  }

  $('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('erro').textContent = ''; $('ok').textContent = '';
    const upserts = [], remover = [];
    for (const c of campos) {
      const el = inputs[c.k];
      let v;
      if (c.t === 'mostrar') v = el.checked ? '' : '0';
      else if (c.t === 'cor') v = el.value.toLowerCase() === c.v.toLowerCase() ? '' : el.value;
      else v = el.value.trim();
      if (c.t === 'whatsapp' && v && !TEL.test(v)) { $('erro').textContent = 'WhatsApp: use só números, com DDI e DDD (10 a 15 dígitos).'; return; }
      if (v) upserts.push({ chave: c.k, valor: v, atualizado_em: new Date().toISOString() });
      else remover.push(c.k);
    }
    try {
      if (upserts.length) await api('site_conteudo?on_conflict=chave', 'POST', upserts, 'resolution=merge-duplicates,return=minimal');
      if (remover.length) await api('site_conteudo?chave=in.(' + remover.join(',') + ')', 'DELETE', null, 'return=minimal');
      $('ok').textContent = 'Salvo. O site já mostra as alterações.';
    } catch (err) {
      $('erro').textContent = err.message === 'auth' ? 'Sessão expirada. Entre novamente.' : err.message;
    }
  });

  (async function init() {
    if (!cfg.supabaseUrl || !session()) { $('negado').hidden = false; return; }
    try {
      const rows = await api('site_conteudo?select=chave,valor');
      const d = {};
      rows.forEach((x) => { d[x.chave] = x.valor; });
      montar(d);
      $('painel').hidden = false;
    } catch (e) { $('negado').hidden = false; }
  })();
})();
