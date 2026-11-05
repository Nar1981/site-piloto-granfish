(function () {
  const cfg = window.GF_CADASTRO || {};
  const TOKEN_KEY = 'gf_admin_token';
  const IDLE_MS = 15 * 60 * 1000;
  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  const ICONS = {
    painel: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
    cadastros: '<path d="M8 4h8l4 4v12H8z"/><path d="M5 8v12h11"/><path d="M12 12h5M12 16h5"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".6"/>',
    personalizar: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    site: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 2.6 15.2 0 18M12 3c-2.6 2.8-2.6 15.2 0 18"/>',
    equipe: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><path d="M16 5.2a3 3 0 010 5.6M18 14.4c1.8.8 3 2.6 3 5.6"/>'
  };
  const ITENS = [
    ['painel-interno.html', 'Painel', 'painel'],
    ['cadastros-admin.html', 'Cadastros', 'cadastros'],
    ['instagram-admin.html', 'Instagram', 'instagram'],
    ['personalizar-admin.html', 'Personalizar', 'personalizar'],
    ['usuarios-admin.html', 'Equipe', 'equipe']
  ];

  const session = () => {
    try {
      const s = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null');
      return s && s.exp > Date.now() ? s : null;
    } catch (e) { return null; }
  };

  const email = () => {
    try {
      const p = JSON.parse(atob(session().t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return p.email || '';
    } catch (e) { return ''; }
  };

  const icon = (n) => '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n] + '</svg>';

  function link(href, rotulo, ic) {
    const a = document.createElement('a');
    a.href = href;
    a.innerHTML = icon(ic);
    a.append(document.createElement('span'));
    a.lastChild.textContent = rotulo;
    if (href === page) a.setAttribute('aria-current', 'page');
    return a;
  }

  function sair() {
    const s = session();
    sessionStorage.removeItem(TOKEN_KEY);
    if (s && cfg.supabaseUrl) {
      fetch(cfg.supabaseUrl + '/auth/v1/logout', { method: 'POST', headers: { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + s.t } }).catch(() => {});
    }
    location.href = 'cadastros-admin.html';
  }

  function montar() {
    document.body.classList.add('adm');
    document.querySelectorAll('.topbar').forEach((e) => e.remove());

    const top = document.createElement('header');
    top.className = 'adm-top';
    const brand = document.createElement('a');
    brand.className = 'adm-brand';
    brand.href = 'painel-interno.html';
    brand.setAttribute('aria-label', 'Painel interno Gran Fish');
    brand.innerHTML = '<img src="logo GF.png" alt="Gran Fish" width="112" height="38"><span>Área interna</span>';

    const nav = document.createElement('nav');
    nav.className = 'adm-nav';
    nav.setAttribute('aria-label', 'Navegação interna');
    ITENS.forEach(([h, r, i]) => nav.appendChild(link(h, r, i)));

    const user = document.createElement('div');
    user.className = 'adm-user';
    const em = document.createElement('span');
    em.className = 'adm-email';
    em.textContent = email();
    const site = document.createElement('a');
    site.className = 'adm-site';
    site.href = 'index.html?pular';
    site.textContent = 'Ver site';
    const bt = document.createElement('button');
    bt.type = 'button';
    bt.textContent = 'Sair';
    bt.hidden = !session();
    bt.addEventListener('click', sair);
    user.append(em, site, bt);
    top.append(brand, nav, user);

    const tabs = document.createElement('nav');
    tabs.className = 'adm-tabs';
    tabs.setAttribute('aria-label', 'Menu inferior');
    ITENS.forEach(([h, r, i]) => tabs.appendChild(link(h, r, i)));
    tabs.appendChild(link('index.html?pular', 'Ver site', 'site'));

    const foot = document.createElement('footer');
    foot.className = 'adm-foot';
    const ver = document.createElement('a');
    ver.className = 'button button--copper';
    ver.href = 'index.html?pular';
    ver.textContent = 'Ver o site ↗';
    foot.appendChild(ver);

    const toast = document.createElement('div');
    toast.className = 'adm-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    document.body.prepend(top);
    document.body.append(foot, tabs, toast);

    let t;
    window.GFToast = (texto, erro) => {
      toast.textContent = texto;
      toast.classList.toggle('err', !!erro);
      toast.classList.add('on');
      clearTimeout(t);
      t = setTimeout(() => toast.classList.remove('on'), 2600);
    };
    window.GFShell = { atualizarSessao: () => { bt.hidden = !session(); em.textContent = email(); } };
  }

  // Caixa "Mostrar senha" abaixo de cada campo de senha
  function mostrarSenha() {
    document.querySelectorAll('input[type="password"]').forEach((inp) => {
      const lb = document.createElement('label');
      lb.className = 'ver-senha';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.addEventListener('change', () => { inp.type = cb.checked ? 'text' : 'password'; });
      lb.append(cb, ' Mostrar senha');
      (inp.closest('label') || inp).after(lb);
    });
  }

  // Após entrar, volta para a página que a pessoa tentava abrir
  function voltarAposLogin() {
    document.querySelectorAll('#negado a.button').forEach((a) => {
      if (page !== 'cadastros-admin.html') a.href = 'cadastros-admin.html?next=' + encodeURIComponent(page);
    });
  }

  // Rótulos para a tabela virar "cartões" no celular
  function rotular() {
    const aplicar = (tbl) => {
      const nomes = [...tbl.querySelectorAll('thead th')].map((th) => th.textContent.trim());
      tbl.querySelectorAll('tbody tr').forEach((tr) => {
        [...tr.children].forEach((td, i) => { if (td.colSpan === 1) td.setAttribute('data-label', nomes[i] || ''); });
      });
    };
    document.querySelectorAll('table.lista').forEach((tbl) => {
      aplicar(tbl);
      new MutationObserver(() => aplicar(tbl)).observe(tbl.tBodies[0], { childList: true });
    });
  }

  // Encerra a sessão após 15 min sem uso em qualquer página interna
  let idle;
  function vigiar() {
    const reset = () => {
      clearTimeout(idle);
      if (session()) idle = setTimeout(sair, IDLE_MS);
    };
    ['click', 'keydown', 'touchstart', 'scroll'].forEach((ev) => document.addEventListener(ev, reset, { passive: true }));
    reset();
  }

  montar();
  voltarAposLogin();
  rotular();
  mostrarSenha();
  vigiar();
})();
