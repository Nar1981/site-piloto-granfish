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

  const WAOP = ['💬 Falar no WhatsApp', { ir: 'whatsapp' }];
  const MAPAOP = ['📍 Como chegar', { ir: 'mapa' }];
  const MENU = [
    ['🚤 Conhecer os modelos', { say: 'modelos' }], ['🎨 Cores e catálogo', { say: 'cores' }],
    ['🛠️ Montar meu barco', { say: 'configurar' }], ['📞 Contato', { say: 'contato' }], ['🆘 Suporte', { say: 'suporte' }]
  ];
  // Intenções: palavras curtas já mostram a resposta com opções clicáveis
  const INTENCOES = [
    { re: /\b(menu|opcoes|opcao|o que (voce )?(faz|sabe)|me ajuda|ajuda|oi|ola|bom dia|boa tarde|boa noite|e ai|hey|hello)\b/, txt: 'Oi! Eu conheço tudo sobre a Gran Fish: modelos, cores, catálogo, cadastro, contato e suporte. O que você quer ver?', ops: MENU },
    { re: /\b(contato|contatos|telefone|fone|zap|whats|whatsapp|email|e-mail|falar com|atendente|atendimento|humano|vendedor|equipe)\b/, txt: 'Você pode falar com a equipe da Gran Fish por aqui:\n📍 Rua das Primaveras, 50, Pratápolis - MG, CEP 37.970-000\nO jeito mais rápido é o WhatsApp.', ops: [WAOP, MAPAOP, ['📇 Seção de contato', { ir: 'contato' }], ['📝 Fazer cadastro', { ir: 'cadastro' }]] },
    { re: /\b(preco|precos|valor|valores|orcamento|quanto|custa|custo|comprar|compra|negociar|financiamento|pagamento|prazo|entrega)\b/, txt: 'Valores, prazos e condições dependem do seu projeto, então a equipe monta uma proposta sob medida. Você pode já configurar o barco para mostrar o que imagina.', ops: [WAOP, ['🛠️ Montar meu barco', { say: 'configurar' }], ['📝 Fazer cadastro', { ir: 'cadastro' }]] },
    { re: /\b(endereco|onde fica|onde vcs|localizacao|local|mapa|chegar|visita|visitar|rota|cidade|pratapolis)\b/, txt: 'O estaleiro fica na Rua das Primaveras, 50, Pratápolis - MG, CEP 37.970-000. Visitas combinam melhor com um aviso prévio pelo WhatsApp.', ops: [MAPAOP, WAOP] },
    { re: /\b(suporte|problema|defeito|pos.?venda|garantia|conserto|reparo|manutencao|assistencia|reclamacao|quebrou|nao funciona)\b/, txt: 'Sinto muito pelo transtorno! O pós-venda é direto com quem entende da sua embarcação. Conte o que aconteceu pelo WhatsApp, de preferência com fotos.', ops: [WAOP, ['📇 Seção de contato', { ir: 'contato' }]] },
    { re: /\b(cadastro|cadastrar|cadastre|ficha|registrar|registro|interesse)\b/, txt: 'No cadastro você informa seus dados e o que procura; a equipe recebe e entra em contato.', ops: [['📝 Abrir o cadastro', { ir: 'cadastro' }], WAOP] },
    { re: /\b(pdf|baixar catalogo|catalogo em pdf)\b/, txt: 'O catálogo de cores também está disponível em PDF, para baixar ou compartilhar.', ops: [['📄 Abrir o PDF', { ir: 'catalogo_pdf' }], ['🎨 Ver catálogo no site', { ir: 'catalogo' }]] },
    { re: /\b(catalogo|referencia|referencias|ref|paleta|paletas|grafismo|grafismos|estampa|adesivo|gran bass|linha sem|sem raio)\b/, txt: 'O catálogo tem mais de 100 referências de pintura e grafismo (Gran Bass, Hurricane 6.0 e a Linha Sem), cada uma com a paleta e o código de cor. Dá para buscar por cor ou por número da referência.', ops: [['🎨 Abrir o catálogo', { ir: 'catalogo' }], ['📄 Catálogo em PDF', { ir: 'catalogo_pdf' }], ['🔎 Achar uma cor parecida', { say: 'cores' }]] },
    { re: /\b(cor|cores|pintura|pintar|tinta|colorido|combinacao|combinacoes|paleta de cores|cor do barco)\b/, txt: 'Quer escolher as cores? Posso te mostrar o catálogo, deixar você montar ao vivo no 3D, ou sugerir combinações. Dica: me diga as cores que imagina, como "azul marinho e branco", e eu monto para você.', ops: [['🎨 Catálogo de cores', { ir: 'catalogo' }], ['🚤 Pintar a Hurricane 60 SL', { ir: 'hurricane' }], ['🛥️ Pintar a Pontoon', { ir: 'pontoon' }], ['💡 Ideias de combinação', { ideias: true }]] },
    { re: /\b(hurricane|60 ?sl|lancha|lanchas|60 pes)\b/, txt: 'A Hurricane 60 SL tem 60 pés e casco laminado, feita para quem busca presença, estabilidade e acabamento. No configurador 3D você escolhe a cor base e o grafismo.', ops: [['🚤 Configurar a Hurricane 60 SL', { ir: 'hurricane' }], ['🎨 Ver cores no catálogo', { ir: 'catalogo' }], WAOP] },
    { re: /\b(pontoon|pontom|pesca|pescar|pescaria|lazer|aluminio|plataforma|catamara)\b/, txt: 'A Linha Pontoon é em alumínio naval, com espaço para lazer, pesca e bons encontros. No configurador 3D você pinta as três faixas.', ops: [['🛥️ Configurar a Pontoon', { ir: 'pontoon' }], ['🎨 Ver cores no catálogo', { ir: 'catalogo' }], WAOP] },
    { re: /\b(modelo|modelos|barco|barcos|embarcacao|embarcacoes|lancha|linha|linhas|produtos|produto|frota|nautica)\b/, txt: 'Temos 36 modelos de embarcações em 5 linhas (Colorado, Fish, Gran Bass, Hurricane e Veloster), com ficha técnica e itens de série, e dois modelos com configurador 3D: a Hurricane 60 SL e a Linha Pontoon. O que você quer ver?', ops: [['📋 Ver as linhas e fichas', { barcos: true }], ['🚤 Hurricane 60 SL', { ir: 'hurricane' }], ['🛥️ Linha Pontoon', { ir: 'pontoon' }], ['🔎 Ver a seção de modelos', { ir: 'modelos' }]] },
    { re: /\b(configur\w*|personaliz\w*|montar|monte|customiz\w*|3d|simulador|editar|edicao|projetar|desenhar|criar meu barco)\b/, txt: 'Dá para montar o seu barco ao vivo no configurador 3D: você troca cores e grafismos, desfaz, e salva uma imagem para mostrar à equipe. Qual modelo?', ops: [['🚤 Hurricane 60 SL', { ir: 'hurricane' }], ['🛥️ Linha Pontoon', { ir: 'pontoon' }], ['💡 Ideias de combinação', { ideias: true }]] },
    { re: /\b(estaleiro|empresa|sobre|quem (e|sao)|historia|engenharia|fabrica|fabricacao|gran fish|granfish|diferencial)\b/, txt: 'A Gran Fish é um estaleiro de Pratápolis - MG com engenharia própria, acabamento sob medida (materiais, cores e layout escolhidos por você) e pós-venda direto com quem entende da embarcação.', ops: [['⚓ Conhecer o estaleiro', { ir: 'estaleiro' }], ['📸 Ver no Instagram', { ir: 'instagram' }], ['🚤 Ver os modelos', { ir: 'modelos' }]] },
    { re: /\b(instagram|insta|redes|rede social|novidades|lancamentos|fotos|videos|reels|bastidores)\b/, txt: 'No Instagram do estaleiro você acompanha lançamentos, bastidores e embarcações entregues.', ops: [['📸 Ver o Instagram', { ir: 'instagram' }], ['🚤 Ver os modelos', { ir: 'modelos' }]] },
    { re: /\b(site|pagina|inicio|home|topo|voltar)\b/, txt: 'Quer voltar ao começo do site?', ops: [['🏠 Ir ao início', { ir: 'inicio' }], ...MENU.slice(0, 3)] },
    { re: /\b(obrigad\w*|valeu|brigad\w*|show|top|legal)\b/, txt: 'Por nada! Estou por aqui se precisar de mais alguma coisa. 😊', ops: [] }
  ];
  const norm = (t) => semAcento(t).replace(/[^a-z0-9 .\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const intencao = (t) => {
    const n = norm(t);
    return INTENCOES.find((x) => x.re.test(n)) || null;
  };
  const opcoesCores = (cores) => [
    ['🚤 Na Hurricane 60 SL', { ir: 'hurricane', cores }], ['🛥️ Na Pontoon', { ir: 'pontoon', cores }],
    ['🔎 Parecida no catálogo', { ir: 'catalogo', cores }]
  ];
  // Respostas de reserva (quando a IA estiver indisponível): devolve {txt, ops} ou texto
  const reserva = (t) => {
    const cores = extrairCores(t);
    if (cores.length && (/barco|lancha|pontoon|hurricane|catalogo|cat\u00e1logo|cor|pint|deix|quer|parecid|semelhant/i.test(t) || norm(t).split(' ').length <= 4)) {
      const lista = cores.join(',');
      if (/cat[aá]logo|parecid|semelhant|similar/i.test(t)) return { txt: 'Posso procurar no catálogo a cor mais parecida com a que você descreveu.', ops: [['🔎 Procurar no catálogo', { ir: 'catalogo', cores }]] };
      if (/pontoon/i.test(t)) return { txt: 'Que combinação linda! Vou montar a sua Pontoon com essas cores no configurador 3D.', ops: [['🛥️ Montar a Pontoon', { ir: 'pontoon', cores }]].concat(opcoesCores(cores).slice(2)) };
      if (/hurricane|lancha|60/i.test(t)) return { txt: 'Que combinação linda! Vou montar a sua Hurricane 60 SL com essas cores no configurador 3D.', ops: [['🚤 Montar a Hurricane', { ir: 'hurricane', cores }]].concat(opcoesCores(cores).slice(2)) };
      return { txt: 'Anotei as cores! Onde você quer ver essa combinação?', ops: opcoesCores(cores) };
    }
    const it = intencao(t);
    if (it) return it;
    return { generico: true, txt: 'Não tenho certeza dessa resposta, mas posso te levar por aqui ou chamar a nossa equipe.', ops: MENU.concat([WAOP]) };
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
      chip('💡 Sugestões', sugerir);
      PALETAS.forEach(([n, c]) => chip(n, () => aplicarAqui(n, c)));
      chip('📖 Catálogo', () => enviar('catálogo'));
    } else if (ctx === 'catalogo') {
      BUSCAS.forEach(([n, c]) => chip(n, () => { bolha('user', n); levar({ chave: 'catalogo', cores: c }); }));
      chip('🚤 Montar meu barco', () => enviar('configurar'));
    } else {
      ['Modelos', 'Cores', 'Contato', 'Suporte'].forEach((s) => chip(s, () => enviar(s)));
    }
  }
  let propria = false;
  let reTimer = null;
  let reBolha = null;
  let ultimaMudanca = null;
  const t0 = Date.now();
  const hsl = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
    let h = 0;
    if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, d ? d / (1 - Math.abs(2 * l - 1)) : 0, l];
  };
  const deHsl = (h, s, l) => {
    const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))).toString(16).padStart(2, '0');
    return '#' + f(0) + f(8) + f(4);
  };
  const nomeDaCor = (hex) => {
    let melhor = hex, d0 = 1e9;
    Object.keys(CORES).forEach((n) => { const d = dist(hex, CORES[n]); if (d < d0) { d0 = d; melhor = n; } });
    return melhor;
  };
  function harmonias(hex) {
    const [h, s, l] = hsl(hex);
    return [
      [l > 0.5 ? 'Preto' : 'Branco', l > 0.5 ? '#111111' : '#ffffff'],
      ['Complementar', deHsl((h + 180) % 360, Math.max(s, 0.45), 0.5)],
      ['Análoga', deHsl((h + 30) % 360, Math.max(s, 0.4), Math.min(Math.max(l, 0.3), 0.65))]
    ];
  }
  function boasVindas() {
    if (msgs.children.length) return;
    const BOAS = {
      hurricane: 'Oi! Sou a Marina. Vamos montar a sua Hurricane 60 SL? Toque numa combinação abaixo que eu aplico na hora, ou me diga as cores que você imagina (ex.: "casco azul marinho com detalhes brancos"). Se você mexer nas cores, eu sugiro combinações!',
      pontoon: 'Oi! Sou a Marina. Vamos montar a sua Pontoon? Toque numa combinação abaixo que eu aplico na hora, ou me diga as cores que você imagina (ex.: "faixas verde e branca"). Se você mexer nas cores, eu sugiro combinações!',
      catalogo: 'Oi! Sou a Marina. Procurando uma cor? Toque numa busca abaixo ou descreva o que imagina (ex.: "algo parecido com azul petróleo") que eu te levo até a referência mais próxima.'
    };
    bolha('bot', BOAS[ctx] || 'Oi! Eu sou a ' + NOME + ', da Gran Fish. Posso ajudar com modelos, cores, configuração da sua embarcação, cadastro ou suporte. Como posso ajudar?');
  }
  function reagir(i, hex, avisar) {
    const c = window.marinaConfig;
    if (!c) return;
    boasVindas();
    if (reBolha) { reBolha.texto.remove(); reBolha.linha.remove(); }
    const campo = c.campos[i];
    const proximo = (i + 1) % c.campos.length;
    const frases = ['Gostei! ', 'Boa escolha! ', 'Ficou bonito! '];
    const texto = bolha('bot', frases[Math.floor(Math.random() * frases.length)] + nomeDaCor(hex) + ' em ' + campo + '. Para combinar com ' + c.campos[proximo] + ', que tal:');
    const linha = el('div', 'gfc-go gfc-ideias');
    harmonias(hex).forEach(([n, h]) => {
      const b = el('button', 'gfc-yes', n);
      b.type = 'button';
      b.style.borderLeft = '14px solid ' + h;
      b.addEventListener('click', () => {
        propria = true; c.aplicarUm(proximo, h); propria = false;
        bolha('user', n + ' em ' + c.campos[proximo]);
        bolha('bot', 'Feito! Se quiser, mexa em outra cor que eu sugiro mais combinações.');
      });
      linha.appendChild(b);
    });
    const cat = el('button', 'gfc-no', '🔎 Parecida no catálogo');
    cat.type = 'button';
    cat.addEventListener('click', () => { bolha('user', 'Parecida no catálogo'); levar({ chave: 'catalogo', cores: [hex] }); });
    linha.appendChild(cat);
    msgs.appendChild(linha);
    msgs.scrollTop = msgs.scrollHeight;
    reBolha = { texto, linha };
    if (avisar && painel.hidden) {
      chamada.textContent = 'Gostei dessa cor! 💡 Toque aqui para ver sugestões.';
      chamada.classList.add('on');
      setTimeout(() => chamada.classList.remove('on'), 9000);
    }
  }
  window.addEventListener('marina:cor', (e) => {
    if (propria || Date.now() - t0 < 4000 || !window.marinaConfig) return;
    const i = window.marinaConfig.ids.indexOf(e.detail.id);
    if (i < 0) return;
    ultimaMudanca = [i, e.detail.hex];
    clearTimeout(reTimer);
    reTimer = setTimeout(() => reagir(i, e.detail.hex, true), 1200);
  });
  function sugerir() {
    if (ultimaMudanca) { alternar(true); reagir(ultimaMudanca[0], ultimaMudanca[1]); return; }
    bolha('user', 'Sugestões');
    bolha('bot', 'Mexa em qualquer cor do barco e eu sugiro combinações para as outras. Ou toque numa combinação pronta acima.');
  }
  function aplicarAqui(nome, cores) {
    const cfgPg = window.marinaConfig;
    if (!cfgPg) return false;
    propria = true;
    const n = cfgPg.aplicar(cores);
    propria = false;
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

  function opcoes(lista) {
    if (!lista || !lista.length) return;
    const linha = el('div', 'gfc-go gfc-ideias');
    lista.forEach(([rot, a]) => {
      const b = el('button', 'gfc-yes', rot);
      b.type = 'button';
      b.addEventListener('click', () => executar(rot, a));
      linha.appendChild(b);
    });
    msgs.appendChild(linha);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function mostrar(r) {
    msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove());
    bolha('bot', r.txt);
    hist.push({ role: 'bot', text: r.txt });
    opcoes(r.ops);
  }

  function executar(rot, a) {
    msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove());
    bolha('user', rot.replace(/^\S+\s/, ''));
    if (a.ir) levar({ chave: a.ir, cores: a.cores || [] });
    else if (a.say) { const r = intencao(a.say); if (r) mostrar(r); }
    else if (a.ideias) ideias();
    else if (a.barco || a.linha || a.barcos) {
      carregarBarcos().then((d) => {
        const r = a.barco ? porId(d, a.barco) : a.linha ? resumoLinha(d, a.linha) : visaoGeral(d);
        if (r) mostrar(r);
      });
    }
  }

  function ideias() {
    bolha('bot', 'Aqui vão algumas combinações que ficam lindas. Toque em uma e escolha o modelo:');
    const linha = el('div', 'gfc-go gfc-ideias');
    PALETAS.forEach(([n, c]) => {
      const b = el('button', 'gfc-yes', n);
      b.type = 'button';
      b.addEventListener('click', () => {
        linha.remove();
        bolha('user', n.replace(/^\S+\s/, ''));
        if (window.marinaConfig && aplicarAqui('', c)) return;
        bolha('bot', 'Ótima escolha! Onde você quer ver essa combinação?');
        opcoes(opcoesCores(c));
      });
      linha.appendChild(b);
    });
    msgs.appendChild(linha);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function buscarNoCatalogo(t) {
    const n = norm(t);
    if (n.length < 3) return null;
    try { if (!catalogo) catalogo = (await (await fetch('data.json')).json()).items; } catch (e) { return null; }
    const palavras = n.split(' ').length;
    const achados = [];
    catalogo.forEach((it) => (it.variants || []).forEach((v) => {
      const nome = norm(v.name || '');
      const porRef = /\b\d{3,4}\b/.test(n) && norm(v.ref) === (n.match(/\b\d{3,4}\b/)[0].padStart(4, '0'));
      const porNome = nome.length >= 4 && (n.includes(nome) || (palavras <= 3 && n.length >= 5 && nome.includes(n)));
      if ((porRef || porNome) && !achados.some((a) => a.name === v.name && !porRef)) achados.push(v);
    }));
    if (!achados.length) return null;
    const lista = achados.slice(0, 4);
    return {
      txt: lista.length === 1 ? 'Achei no catálogo: ' + lista[0].name + ' (ref. ' + lista[0].ref + ').' : 'Achei estas referências no catálogo:',
      ops: lista.map((v) => ['🎨 ' + v.name + ' · ref. ' + v.ref, { ir: 'ref:' + v.slug }])
    };
  }

  // Catálogo de embarcações (fichas técnicas e itens de série)
  let barcos = null;
  function carregarBarcos() {
    if (barcos) return Promise.resolve(barcos);
    return new Promise((ok) => {
      if (window.GF_CATALOGO) return ok((barcos = window.GF_CATALOGO));
      const s = document.createElement('script');
      s.src = 'js/catalogo-dados.js';
      s.onload = () => ok((barcos = window.GF_CATALOGO || []));
      s.onerror = () => ok([]);
      document.head.appendChild(s);
    });
  }
  const LINHAS_B = [['colorado', 'COLORADO'], ['gran ?bass', 'GRAN BASS'], ['bass', 'GRAN BASS'], ['hurricane', 'HURRICANE'], ['veloster', 'VELOSTER'], ['fish', 'FISH']];
  const ITENS_B = ['giropesca', 'viveiro', 'flap', 'escada', 'pedestal', 'guarda sol', 'ancora', 'caixa seca', 'bateria', 'porta vara', 'eva', 'xadrez', 'tanque', 'cockpit', 'estofado', 'refluxo', 'motor eletrico', 'remo', 'cunho', 'castelo', 'porta objetos', 'porta documentos'];
  const PARADAS_B = new Set('o a os as de da do das dos e um uma com modelo modelos barco barcos embarcacao embarcacoes ficha tecnica itens item serie quais qual que me fale sobre informacoes info detalhes tem mostra mostrar quero saber ver como para medidas caracteristicas especificacoes tamanho peso motor motorizacao lotacao da no na em'.split(' '));
  const gB = (b, k) => b.spec[k] || '';
  const motorB = (b) => gB(b, 'MOTORIZAÇÃO MÁXIMA') || gB(b, 'MOTORIZAÇÃO');
  const lotB = (b) => parseInt(gB(b, 'LOTAÇÃO'), 10) || 0;
  const hpsB = (b) => (motorB(b).match(/\d+/g) || ['0']).map(Number);
  const tamB = (b) => (b.nome.match(/\d\.\d/) || [''])[0];
  const varianteB = (b) => norm(b.nome.replace(/^[A-Za-zÀ-ú ]+?(?=\s\d\.\d)/, '').replace(/\d\.\d/, '')).replace(/-/g, ' ').split(' ').filter(Boolean);
  const souEquipe = () => {
    try { const s = JSON.parse(sessionStorage.getItem('gf_admin_token') || 'null'); return !!(s && s.exp > Date.now()); } catch (e) { return false; }
  };
  const bonito = (s) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  const unicos = (l) => l.filter((b, i) => l.findIndex((x) => x.nome === b.nome) === i);
  const lista = (l) => l.map((b) => b.nome).join(', ');
  const opsBarcos = (l) => unicos(l).slice(0, 12).map((b) => ['🚤 ' + b.nome, { barco: b.id }]);

  function fichaBarco(b) {
    const v = (rot, k) => (gB(b, k) ? rot + ' ' + gB(b, k) : '');
    const junta = (a) => a.filter(Boolean).join(' · ');
    const L = [b.nome + ' (código ' + b.cod + ') · linha ' + bonito(b.linha)];
    L.push(junta([v('Comprimento', 'COMPRIMENTO'), v('Boca', 'BOCA'), v('Pontal', 'PONTAL'), v('Calado', 'CALADO'), v('Contorno', 'CONTORNO')]));
    L.push(junta(['Lotação ' + lotB(b) + ' pessoas', 'Motorização ' + motorB(b), v('Peso', 'PESO APROXIMADO'), v('Carga', 'CAPACIDADE DE CARGA')]));
    L.push(junta(Object.keys(b.spec).filter((k) => /^(CHAPA|LARGURA|FUNDO|BORDA)/.test(k)).map((k) => k.charAt(0) + k.slice(1).toLowerCase() + ' ' + b.spec[k])));
    L.push('Itens de série (' + b.itens.length + '): ' + b.itens.join(', ') + '.');
    return L.filter(Boolean).join('\n');
  }
  function opsFicha(b, todos) {
    const ops = [['📋 Outros da linha ' + bonito(b.linha), { linha: b.linha }], ['🎨 Cores e pinturas', { ir: 'catalogo' }], WAOP];
    if (souEquipe()) ops.unshift(['🗂️ Ficha completa (equipe)', { ir: 'barco:' + b.id }]);
    return ops;
  }
  function resumoLinha(dados, linha) {
    const l = unicos(dados.filter((b) => b.linha === linha));
    const tam = [...new Set(l.map(tamB))].sort();
    const hp = l.flatMap(hpsB).filter(Boolean);
    return { txt: 'Linha ' + bonito(linha) + ': ' + l.length + (l.length === 1 ? ' modelo' : ' modelos') + ' (' + tam.join(' e ') + ' m), motores de ' + Math.min(...hp) + ' a ' + Math.max(...hp) + ' HP.\n' + lista(l) + '\nToque num modelo para ver a ficha técnica e os itens de série.', ops: opsBarcos(l) };
  }
  function visaoGeral(dados) {
    const nomes = [...new Set(dados.map((b) => b.linha))];
    const txt = 'Temos ' + unicos(dados).length + ' modelos em ' + nomes.length + ' linhas: ' + nomes.map((n) => bonito(n) + ' (' + unicos(dados.filter((b) => b.linha === n)).length + ')').join(', ') + '. Todos em alumínio, de 5,5 e 6 m. Escolha uma linha para ver os modelos, fichas técnicas e itens de série.';
    return { txt, ops: nomes.map((n) => ['🚤 Linha ' + bonito(n), { linha: n }]).concat([WAOP]) };
  }
  function porId(dados, id) {
    const b = dados.find((x) => x.id === id);
    return b ? { txt: fichaBarco(b), ops: opsFicha(b) } : null;
  }

  function buscarBarco(t, dados) {
    if (!dados.length) return null;
    let n = ' ' + norm(t).replace(/gran ?fish/g, ' ') + ' ';
    n = n.replace(/(\d)[,](\d)/g, '$1.$2');
    if (/\b(60 ?sl|60 pes|lancha|pontoon|pontom)\b/.test(n)) return null;
    if (/\b(cor|cores|pintura|pintar|grafismo|referencia|paleta)\b/.test(n)) return null;
    const lin = (LINHAS_B.find(([k]) => new RegExp('\\b' + k + '\\b').test(n)) || [])[1];
    const sem = n.replace(/\d+ ?(pessoas?|lugares|hp|cavalos|kg)\b/g, ' ');
    let tam = (sem.match(/\b([56])\.([05])\b/) || [])[0];
    if (!tam && lin) { const m = sem.match(/\b([56])\b/); if (m) tam = m[1] === '5' ? '5.5' : '6.0'; }
    if (lin) {
      const vocab = new Set(dados.flatMap(varianteB));
      const vt = sem.replace(/\b[56]\.[05]\b|\b[56]\b/g, ' ').split(' ').filter((w) => w && vocab.has(w) && !PARADAS_B.has(w) && !new RegExp('^(' + LINHAS_B.map((x) => x[0]).join('|') + ')$').test(w) && w !== 'bass' && w !== 'fish' && w !== 'gran');
      let c = dados.filter((b) => b.linha === lin && (!tam || tamB(b) === tam));
      if (vt.length) {
        const exato = c.filter((b) => { const x = varianteB(b); return x.length === vt.length && vt.every((w) => x.includes(w)); });
        c = exato.length ? exato : c.filter((b) => vt.every((w) => varianteB(b).includes(w)));
      }
      c = unicos(c);
      if (!c.length) return null;
      if (c.length === 1) return { txt: fichaBarco(c[0]), ops: opsFicha(c[0]) };
      if (!vt.length && !tam) return resumoLinha(dados, lin);
      return { txt: 'Achei ' + c.length + ' modelos: ' + lista(c) + '. Toque em um para ver a ficha completa.', ops: opsBarcos(c) };
    }
    const pessoas = (sem.match(/\b(\d+) ?(pessoas?|lugares)\b/) || n.match(/\b(\d+) ?(pessoas?|lugares)\b/) || [])[1];
    if (pessoas && /\b(barco|barcos|modelo|modelos|cabe|cabem|leva|levam|lotacao|aguenta|comporta|qual|quais|tem)\b/.test(n)) {
      const c = unicos(dados.filter((b) => lotB(b) >= Number(pessoas)));
      if (!c.length) return { txt: 'Nenhum modelo do catálogo leva ' + pessoas + ' pessoas. A maior lotação é ' + Math.max(...dados.map(lotB)) + ' pessoas.', ops: [WAOP] };
      return { txt: 'Modelos com lotação para ' + pessoas + ' pessoas ou mais (' + c.length + '): ' + lista(c) + '.', ops: opsBarcos(c) };
    }
    const hp = (n.match(/\b(\d+) ?(hp|cavalos)\b/) || [])[1];
    if (hp) {
      const x = Number(hp);
      const c = unicos(dados.filter((b) => { const h = hpsB(b); return x <= Math.max(...h) && (h.length < 2 || x >= Math.min(...h)); }));
      if (!c.length) return { txt: 'Nenhum modelo recebe motor de ' + hp + ' HP. O maior é de ' + Math.max(...dados.flatMap(hpsB)) + ' HP.', ops: [WAOP] };
      return { txt: 'Modelos que aceitam motor de ' + hp + ' HP (' + c.length + '): ' + lista(c) + '.', ops: opsBarcos(c) };
    }
    const item = ITENS_B.find((k) => n.includes(' ' + k));
    if (item && /\b(tem|com|vem|possui|inclui|incluso|item|itens|equipado|equipada)\b/.test(n)) {
      const c = unicos(dados.filter((b) => b.itens.some((i) => norm(i).includes(item))));
      if (!c.length) return { txt: 'Não encontrei "' + item + '" nos itens de série dos modelos.', ops: [WAOP] };
      return { txt: 'Têm ' + item + ' de série (' + c.length + ' modelos): ' + lista(c) + '.', ops: opsBarcos(c) };
    }
    if (/\b(fichas?|ficha tecnica|fichas tecnicas|itens de serie|quadro comparativo|comparativo|catalogo de (barcos|embarcacoes)|catalogo das embarcacoes|quais (sao )?(os )?(modelos|barcos|embarcacoes|linhas)|que (modelos|barcos|linhas)|todos os (modelos|barcos)|lista de (modelos|barcos))\b/.test(n)) return visaoGeral(dados);
    return null;
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
    let [url, nome, externo] = chave.startsWith('ref:') ? ['catalogo.html#/ref/' + chave.slice(4), 'a referência do catálogo'] : chave.startsWith('barco:') ? ['catalogo-admin.html#' + chave.slice(6), 'a ficha completa do modelo'] : DESTINOS[chave];
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
      } else if (aqui && !hash) {
        alternar(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
    if (!texto) {
      digitando.remove();
      mostrar(reserva(hist[hist.length - 1].text));
      return;
    }
    const m = /\[\[IR:([a-z_]+)(?::([^\]]*))?\]\]/i.exec(texto);
    const chave = m && DESTINOS[m[1].toLowerCase()] ? m[1].toLowerCase() : null;
    const coresTag = m && m[2] ? m[2].split(',').map((x) => x.trim()).filter(hexValido).map(normHex).slice(0, 3) : [];
    texto = texto.replace(/\[\[IR:[^\]]*\]\]/gi, '').trim();
    digitando.textContent = texto;
    hist.push({ role: 'bot', text: texto });
    if (chave) oferecer(chave, coresTag);
    else if (intencao(hist[hist.length - 2] ? hist[hist.length - 2].text : '')) opcoes(intencao(hist[hist.length - 2].text).ops);
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
    const curto = norm(t).split(' ').length <= 4;
    const barco = buscarBarco(t, await carregarBarcos());
    if (barco) { mostrar(barco); ocupado = false; env.disabled = false; campo.focus(); return; }
    const achado = await buscarNoCatalogo(t);
    if (achado && (curto || /\bref/.test(norm(t)))) { mostrar(achado); ocupado = false; env.disabled = false; campo.focus(); return; }
    if (curto) {
      const r = reserva(t);
      if (!r.generico) { mostrar(r); ocupado = false; env.disabled = false; campo.focus(); return; }
    }
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
      boasVindas();
      campo.focus();
    }
  }
  botao.addEventListener('click', () => alternar(painel.hidden));
  fechar.addEventListener('click', () => { alternar(false); botao.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) alternar(false); });
})();
