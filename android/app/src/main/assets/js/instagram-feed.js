(function () {
  const cfg = window.GF_CADASTRO || {};
  const grid = document.querySelector('#instagram .instagram-grid');
  if (!grid || !cfg.supabaseUrl) return;

  const get = async (path) => {
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/' + path, { headers: { apikey: cfg.supabaseAnonKey } });
    if (!r.ok) throw new Error(r.status);
    return r.json();
  };

  const card = (src, href, label, altura) => {
    const art = document.createElement('article');
    art.className = 'insta-card';
    const f = document.createElement('iframe');
    f.title = label;
    f.loading = 'lazy';
    f.src = src;
    if (altura) f.style.height = altura;
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.textContent = 'Abrir no Instagram ↗';
    art.append(f, a);
    return art;
  };

  (async () => {
    try {
      const [[c], posts] = await Promise.all([
        get('instagram_config?select=modo,perfil&id=eq.1'),
        get('instagram_posts?select=url&ativo=eq.true&order=ordem.asc,id.asc')
      ]);
      const nodes = [];
      if (c && c.modo === 'automatico' && /^[A-Za-z0-9_.]{1,30}$/.test(c.perfil || '')) {
        const perfil = 'https://www.instagram.com/' + c.perfil + '/';
        nodes.push(card(perfil + 'embed/', perfil, 'Perfil Gran Fish no Instagram'));
      } else {
        posts.forEach((p, i) => {
          if (/^https:\/\/www\.instagram\.com\/(p|reel|tv)\/[A-Za-z0-9_-]+\/$/.test(p.url)) {
            nodes.push(card(p.url + 'embed/', p.url, 'Publicação Gran Fish ' + (i + 1)));
          }
        });
      }
      if (nodes.length) grid.replaceChildren(...nodes);
    } catch (e) { /* mantém as publicações padrão do HTML */ }
  })();
})();
