(function () {
  const cfg = window.GF_CADASTRO || {};
  const wa = document.querySelector('a[href*="wa.me/"]');
  const WA = wa ? wa.href.split('?')[0] : 'https://wa.me/5535999999999';
  const URL_CHAT = cfg.supabaseUrl ? cfg.supabaseUrl + '/functions/v1/chat' : '';
  const NOME = 'Marina';
  const mapa = document.querySelector('a.floating-map');
  const DESTINOS = {
    modelos: ['index.html#modelos', 'a seção de modelos'],
    hurricane: ['h60sltest4.html', 'o configurador 3D da Hurricane 60 SL'],
    pontoon: ['poontoontest4.html', 'o configurador 3D da Linha Pontoon'],
    catalogo: ['catalogo.html', 'o catálogo de cores'],
    catalogo_pdf: ['catalogo.pdf', 'o catálogo em PDF'],
    cadastro: ['cadastro.html', 'a página de cadastro'],
    estaleiro: ['index.html#estaleiro', 'a seção do estaleiro'],
    instagram: ['index.html#instagram', 'a seção do Instagram'],
    contato: ['index.html#contato', 'a seção de contato'],
    inicio: ['index.html#inicio', 'o início do site'],
    whatsapp: [WA, 'o WhatsApp da equipe', true],
    mapa: [mapa ? mapa.href : 'https://www.google.com/maps/search/?api=1&query=Rua+das+Primaveras%2C+50%2C+Pratapolis+-+MG', 'o mapa do estaleiro', true]
  };
  // Nomes de cores em português (fallback quando a IA não está disponível)
  const CORES = {
    'azul marinho': '#0d1b2a', 'azul royal': '#002366', 'azul celeste': '#48cae4', 'azul claro': '#48cae4', 'azul escuro': '#0d1b2a', 'azul petroleo': '#16252d', 'azul bebe': '#89cff0', 'azul turquesa': '#00a896', 'azul': '#0070ff',
    'verde agua': '#0a9396', 'verde militar': '#4b5320', 'verde oliva': '#1e261d', 'verde escuro': '#0e291e', 'verde claro': '#52b788', 'verde limao': '#b5e61d', 'verde': '#27ae60',
    'vermelho escuro': '#9b111e', 'vinho': '#401018', 'bordo': '#401018', 'vermelho': '#e74c3c',
    'laranja': '#e67e22', 'amarelo': '#f1c40f', 'dourado': '#d4af37', 'prata': '#c0c0c0', 'bronze': '#cd7f32', 'cobre': '#b87333',
    'rosa': '#f7cac9', 'magenta': '#d81b60', 'roxo': '#8e44ad', 'lilas': '#b39ddb', 'turquesa': '#00a896', 'ciano': '#00d2ff',
    'cinza escuro': '#25282a', 'cinza claro': '#c0c0c0', 'grafite': '#25282a', 'chumbo': '#212529', 'cinza': '#686b73',
    'branco perola': '#fdfcf7', 'off white': '#f4f4f0', 'branco': '#ffffff', 'preto': '#111111',
    'marrom': '#2b1d16', 'bege': '#d8cbb5', 'areia': '#c2b280', 'creme': '#fffdd0', 'caramelo': '#b3541e'
  };
  const semAcento = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  function extrairCores(texto) {
    let t = ' ' + semAcento(texto) + ' ';
    const achadas = [];
    Object.keys(CORES).sort((a, b) => b.length - a.length).forEach((nome) => {
      const base = /o$/.test(nome) ? nome.slice(0, -1) + '[oa]s?' : nome + 's?';
      const re = new RegExp('(^|[^a-z])' + base + '(?![a-z])');
      const m = re.exec(t);
      if (m) {
        achadas.push([m.index, CORES[nome]]);
        t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length);
      }
    });
    const hexes = [];
    achadas.sort((a, b) => a[0] - b[0]).forEach(([, h]) => { if (!hexes.includes(h)) hexes.push(h); });
    return hexes.slice(0, 3);
  }
  const hexValido = (h) => /^#?[0-9a-f]{6}$/i.test(h);
  const normHex = (h) => '#' + h.replace('#', '').toLowerCase();

  // Catálogo: acha a referência com a paleta mais parecida com as cores pedidas
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const dist = (a, b) => {
    const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b), rm = (r1 + r2) / 2;
    return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
  };
  let catalogo = null;
  async function melhorDoCatalogo(cores) {
    if (!catalogo) catalogo = (await (await fetch('data.json')).json()).items;
    let melhor = null;
    catalogo.forEach((it) => (it.variants || []).forEach((v) => {
      if (!v.pal || !v.pal.length) return;
      const nota = cores.reduce((soma, c) => soma + Math.min(...v.pal.map((p) => dist(c, p.hex))), 0) / cores.length;
      if (!melhor || nota < melhor.nota) melhor = { nota, v };
    }));
    return melhor && melhor.v;
  }

  let pendente = null;
  const SIM = /^\s*(sim|s|pode|quero|claro|bora|vamos|ok|certo|isso|por favor|pode levar|me leve|leve)\b/i;
  const NAO = /^\s*(n[aã]o|agora n[aã]o|depois|deixa|n[aã]o precisa)\b/i;
  const hist = [];
  let ocupado = false;

  // Respostas de reserva (quando a IA estiver indisponível)
  const REGRAS = [
    [/pre[çc]o|valor|or[çc]amento|quanto custa|comprar|negoci/i, 'Para valores e orçamento, o melhor é falar direto com a nossa equipe pelo WhatsApp, que monta uma proposta para o seu projeto. Quer que eu te leve até lá?[[IR:whatsapp]]'],
    [/hurricane|60 ?sl|lancha/i, 'A Hurricane 60 SL tem 60 pés, casco laminado e foco em presença, estabilidade e acabamento. Quer que eu te leve ao configurador 3D dela?[[IR:hurricane]]'],
    [/pontoon|pesca|lazer|alum[ií]nio/i, 'A Linha Pontoon é em alumínio naval, pensada para lazer e pesca. Quer que eu te leve ao configurador 3D dela?[[IR:pontoon]]'],
    [/cor|cores|cat[aá]logo|acabamento/i, 'Temos um catálogo de cores com PDF. Quer que eu te leve até ele?[[IR:catalogo]]'],
    [/cadastr|ficha/i, 'Para se cadastrar, use a página de cadastro; nossa equipe recebe e entra em contato. Quer que eu te leve até lá?[[IR:cadastro]]'],
    [/endere[çc]o|onde fica|visita|localiza|chegar/i, 'Estamos na Rua das Primaveras, 50, Pratápolis - MG, CEP 37.970-000. Quer que eu abra o mapa para você?[[IR:mapa]]'],
    [/suporte|problema|defeito|p[óo]s.?venda|garantia|ajuda/i, 'Sinto muito pelo transtorno! Para suporte e pós-venda, fale direto com a equipe pelo WhatsApp. Quer que eu te leve até lá?[[IR:whatsapp]]'],
    [/configur/i, 'Dá para montar a sua no configurador 3D e depois falar com a equipe para fechar os detalhes. Quer que eu te leve aos modelos?[[IR:modelos]]'],
    [/oi|ol[aá]|bom dia|boa tarde|boa noite/i, 'Olá! Que bom ter você aqui. Posso ajudar com modelos, cores, configuração, cadastro ou suporte.']
  ];
  const reserva = (t) => {
    const cores = extrairCores(t);
    if (cores.length && /barco|lancha|pontoon|hurricane|catalogo|cat\u00e1logo|cor|pint|deix|quer|parecid|semelhant/i.test(t)) {
      const lista = cores.join(',');
      if (/cat[aá]logo|parecid|semelhant|similar/i.test(t)) return 'Posso procurar no catálogo a cor mais parecida com a que você descreveu. Quer que eu faça isso?[[IR:catalogo:' + lista + ']]';
      if (/pontoon/i.test(t)) return 'Que combinação linda! Quer que eu monte a sua Pontoon com essas cores no configurador 3D?[[IR:pontoon:' + lista + ']]';
      if (/hurricane|lancha|60/i.test(t)) return 'Que combinação linda! Quer que eu monte a sua Hurricane 60 SL com essas cores no configurador 3D?[[IR:hurricane:' + lista + ']]';
      return 'Anotei as cores! Para qual modelo você quer ver: Hurricane 60 SL ou Linha Pontoon? Se preferir, posso procurar algo parecido no catálogo.';
    }
    for (const [re, r] of REGRAS) if (re.test(t)) return r;
    return 'Não tenho certeza dessa resposta, mas nossa equipe pode ajudar direto pelo WhatsApp.';
  };

  const el = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt) e.textContent = txt;
    return e;
  };

  const caixa = el('section', 'gfc');
  caixa.setAttribute('aria-label', 'Chat Gran Fish');
  const botao = el('button', 'gfc-fab');
  botao.type = 'button';
  botao.setAttribute('aria-label', 'Abrir chat com a Marina');
  botao.setAttribute('aria-expanded', 'false');
  const foto = el('img');
  foto.src = 'img/marina.svg'; foto.alt = ''; foto.width = 64; foto.height = 64;
  botao.appendChild(foto);
  const chamada = el('span', 'gfc-hint', 'Oi, eu sou a Marina! Posso ajudar?');
  chamada.setAttribute('aria-hidden', 'true');

  const painel = el('div', 'gfc-box');
  painel.hidden = true;
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-label', 'Conversa com a Marina, assistente Gran Fish');
  const topo = el('div', 'gfc-top');
  const av = el('img', 'gfc-av');
  av.src = 'img/marina.svg'; av.alt = ''; av.width = 40; av.height = 40;
  const tit = el('div', 'gfc-tit');
  tit.append(el('strong', '', NOME + ' · Gran Fish'), el('small', '', 'Assistente virtual'));
  const fechar = el('button', 'gfc-x', '×');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar chat');
  topo.append(av, tit, fechar);

  const msgs = el('div', 'gfc-msgs');
  msgs.setAttribute('role', 'log');
  msgs.setAttribute('aria-live', 'polite');

  const pag = (location.pathname.split('/').pop() || 'index.html');
  const ctx = /^h60sl/.test(pag) ? 'hurricane' : /^poontoon/.test(pag) ? 'pontoon' : /^catalogo/.test(pag) ? 'catalogo' : 'home';
  const PALETAS = [
    ['⚓ Azul marinho e branco', ['#0d1b2a', '#ffffff', '#c0c0c0']],
    ['🖤 Preto e grafite', ['#111111', '#25282a', '#c0c0c0']],
    ['🔥 Vermelho esportivo', ['#e74c3c', '#ffffff', '#111111']],
    ['🌿 Verde militar (pesca)', ['#4b5320', '#d8cbb5', '#111111']],
    ['🌊 Azul turquesa e areia', ['#00a896', '#fffdd0', '#ffffff']],
    ['🤍 Branco total', ['#ffffff', '#f4f4f0', '#c0c0c0']]
  ];
  const BUSCAS = [
    ['🎨 Parecido com azul', ['#0070ff']], ['🎨 Parecido com vermelho', ['#e74c3c']],
    ['🎨 Parecido com verde', ['#27ae60']], ['🎨 Preto e branco', ['#111111', '#ffffff']],
    ['🎨 Dourado', ['#d4af37']]
  ];
  const sug = el('div', 'gfc-sug');
  const chip = (txt, fn) => {
    const b = el('button', '', txt);
    b.type = 'button';
    b.addEventListener('click', fn);
    sug.appendChild(b);
  };
  function montarChips() {
    sug.textContent = '';
    if (ctx === 'hurricane' || ctx === 'pontoon') {
      PALETAS.forEach(([n, c]) => chip(n, () => aplicarAqui(n, c)));
      chip('📖 Ver catálogo de cores', () => enviar('Quero ver o catálogo de cores'));
    } else if (ctx === 'catalogo') {
      BUSCAS.forEach(([n, c]) => chip(n, () => { bolha('user', n); levar({ chave: 'catalogo', cores: c }); }));
      chip('🚤 Montar meu barco', () => enviar('Quero montar meu barco no estaleiro'));
    } else {
      ['Conhecer os modelos', 'Montar meu barco com cores', 'Ver catálogo de cores', 'Preciso de suporte'].forEach((s) => chip(s, () => enviar(s)));
    }
  }
  function aplicarAqui(nome, cores) {
    const cfgPg = window.marinaConfig;
    if (!cfgPg) return false;
    const n = cfgPg.aplicar(cores);
    if (!n) return false;
    const rot = cfgPg.campos.slice(0, n).map((c, i) => c + ': ' + cores[i]).join(' · ');
    if (nome) bolha('user', nome);
    bolha('bot', 'Pronto, apliquei no seu barco! ✨ (' + rot + ') Quer testar outra combinação ou procurar algo parecido no catálogo?');
    hist.push({ role: 'bot', text: 'Apliquei as cores no configurador: ' + rot });
    return true;
  }
  montarChips();

  const form = el('form', 'gfc-form');
  const campo = el('input');
  campo.type = 'text'; campo.maxLength = 500; campo.placeholder = 'Digite sua mensagem…';
  campo.setAttribute('aria-label', 'Mensagem'); campo.autocomplete = 'off';
  const env = el('button', '', 'Enviar');
  env.type = 'submit';
  form.append(campo, env);

  const zap = el('a', 'gfc-wa', 'Falar com a equipe no WhatsApp ↗');
  zap.href = WA; zap.target = '_blank'; zap.rel = 'noopener noreferrer';

  painel.append(topo, msgs, sug, form, zap);
  caixa.append(painel, chamada, botao);
  setTimeout(() => { if (painel.hidden) chamada.classList.add('on'); }, 3000);
  setTimeout(() => chamada.classList.remove('on'), 15000);
  document.body.appendChild(caixa);

  function bolha(quem, texto) {
    const b = el('div', 'gfc-m gfc-' + quem, texto);
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
  }

  function oferecer(chave, cores) {
    const alvo = pendente = { chave, cores: cores || [] };
    const linha = el('div', 'gfc-go');
    const sim = el('button', 'gfc-yes', 'Sim, me leve');
    const nao = el('button', 'gfc-no', 'Agora não');
    sim.type = nao.type = 'button';
    sim.addEventListener('click', () => { linha.remove(); levar(alvo); });
    nao.addEventListener('click', () => { linha.remove(); pendente = null; bolha('bot', 'Tudo bem! Se precisar de algo é só chamar.'); });
    linha.append(sim, nao);
    msgs.appendChild(linha);
  }

  async function levar(p) {
    pendente = null;
    const { chave, cores } = p;
    if (cores.length && chave === ctx && aplicarAqui('', cores)) return;
    let [url, nome, externo] = DESTINOS[chave];
    const temCores = cores.length && (chave === 'hurricane' || chave === 'pontoon');
    let aviso = 'Pronto, te levando para ' + nome + (temCores ? ' já com as cores pedidas' : '') + '! 🚤';
    if (temCores) url += '?cores=' + cores.map((c) => c.slice(1)).join(',');
    if (chave === 'catalogo' && cores.length) {
      try {
        const v = await melhorDoCatalogo(cores);
        if (v) {
          url = 'catalogo.html#/ref/' + v.slug;
          aviso = 'Achei a mais parecida: ' + v.name + ' (ref. ' + v.ref + ')! Te levando até ela 🎨';
        }
      } catch (e) { /* segue para o catálogo geral */ }
    }
    bolha('bot', aviso);
    hist.push({ role: 'bot', text: 'Levei a pessoa para ' + nome + '.' });
    setTimeout(() => {
      if (externo) { window.open(url, '_blank', 'noopener'); return; }
      const [pag, hash] = url.split('#');
      const aqui = (location.pathname.split('/').pop() || 'index.html') === pag;
      const alvo = hash && document.getElementById(hash);
      if (aqui && alvo) {
        alternar(false);
        alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        location.href = url;
      }
    }, 900);
  }

  async function responder() {
    const digitando = bolha('bot', 'Digitando…');
    let texto = '';
    if (URL_CHAT) {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 20000);
        const r = await fetch(URL_CHAT, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', apikey: cfg.supabaseAnonKey || '' },
          body: JSON.stringify({ messages: hist.slice(-12), pagina: ctx })
        });
        clearTimeout(to);
        if (r.ok) texto = ((await r.json()).reply || '').trim();
      } catch (e) { /* usa resposta de reserva */ }
    }
    if (!texto) texto = reserva(hist[hist.length - 1].text);
    const m = /\[\[IR:([a-z_]+)(?::([^\]]*))?\]\]/i.exec(texto);
    const chave = m && DESTINOS[m[1].toLowerCase()] ? m[1].toLowerCase() : null;
    const coresTag = m && m[2] ? m[2].split(',').map((x) => x.trim()).filter(hexValido).map(normHex).slice(0, 3) : [];
    texto = texto.replace(/\[\[IR:[^\]]*\]\]/gi, '').trim();
    digitando.textContent = texto;
    hist.push({ role: 'bot', text: texto });
    if (chave) oferecer(chave, coresTag);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function enviar(t) {
    t = (t || '').trim();
    if (!t || ocupado) return;
    ocupado = true; env.disabled = true;
    bolha('user', t);
    hist.push({ role: 'user', text: t });
    campo.value = '';
    if (pendente && SIM.test(t)) { msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove()); levar(pendente); ocupado = false; env.disabled = false; return; }
    if (pendente && NAO.test(t)) { msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove()); pendente = null; bolha('bot', 'Tudo bem! Se precisar de algo é só chamar.'); ocupado = false; env.disabled = false; return; }
    msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove());
    pendente = null;
    const corPedida = extrairCores(t);
    if ((ctx === 'hurricane' || ctx === 'pontoon') && corPedida.length && !/catalog|parecid|semelhan/i.test(semAcento(t)) && aplicarAqui('', corPedida)) { ocupado = false; env.disabled = false; campo.focus(); return; }
    await responder();
    ocupado = false; env.disabled = false; campo.focus();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); enviar(campo.value); });

  function alternar(abrir) {
    painel.hidden = !abrir;
    chamada.classList.remove('on');
    botao.classList.toggle('gfc-open', abrir);
    botao.setAttribute('aria-expanded', String(abrir));
    if (abrir) {
      if (!msgs.children.length) {
        const BOAS = {
          hurricane: 'Oi! Sou a Marina. Vamos montar a sua Hurricane 60 SL? Toque numa combinação abaixo que eu aplico na hora, ou me diga as cores que você imagina (ex.: "casco azul marinho com detalhes brancos").',
          pontoon: 'Oi! Sou a Marina. Vamos montar a sua Pontoon? Toque numa combinação abaixo que eu aplico na hora, ou me diga as cores que você imagina (ex.: "faixas verde e branca").',
          catalogo: 'Oi! Sou a Marina. Procurando uma cor? Toque numa busca abaixo ou descreva o que imagina (ex.: "algo parecido com azul petróleo") que eu te levo até a referência mais próxima.'
        };
        bolha('bot', BOAS[ctx] || 'Oi! Eu sou a ' + NOME + ', da Gran Fish. Posso ajudar com modelos, cores, configuração da sua embarcação, cadastro ou suporte. Como posso ajudar?');
      }
      campo.focus();
    }
  }
  botao.addEventListener('click', () => alternar(painel.hidden));
  fechar.addEventListener('click', () => { alternar(false); botao.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) alternar(false); });
})();
