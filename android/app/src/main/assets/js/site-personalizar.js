(function () {
  const cfg = window.GF_CADASTRO || {};
  const campos = window.GF_CAMPOS || [];
  if (!cfg.supabaseUrl) return;

  const HEX = /^#[0-9a-fA-F]{6}$/;
  const TEL = /^\d{10,15}$/;

  function aplicar(dados) {
    for (const c of campos) {
      const val = dados[c.k];
      if (val === undefined) continue;
      if (c.t === 'cor') {
        if (HEX.test(val)) document.documentElement.style.setProperty(c.css, val);
      } else if (c.t === 'whatsapp') {
        if (TEL.test(val)) document.querySelectorAll('a[href^="https://wa.me/"]').forEach((a) => { a.href = 'https://wa.me/' + val; });
      } else if (c.t === 'mostrar') {
        if (val === '0') {
          document.querySelectorAll(c.sel).forEach((el) => { el.hidden = true; });
          document.querySelectorAll('a[href="' + c.nav + '"]').forEach((a) => { a.hidden = true; });
        }
      } else if (c.t === 'linhas') {
        const el = document.querySelector(c.sel);
        if (el) {
          const nodes = [];
          val.split('\n').forEach((l, i) => { if (i) nodes.push(document.createElement('br')); nodes.push(document.createTextNode(l)); });
          el.replaceChildren(...nodes);
        }
      } else {
        const el = document.querySelector(c.sel);
        if (el) el.textContent = val;
      }
    }
  }

  fetch(cfg.supabaseUrl + '/rest/v1/site_conteudo?select=chave,valor', { headers: { apikey: cfg.supabaseAnonKey } })
    .then((r) => (r.ok ? r.json() : []))
    .then((rows) => {
      const d = {};
      rows.forEach((x) => { d[x.chave] = x.valor; });
      aplicar(d);
    })
    .catch(() => {});
})();
