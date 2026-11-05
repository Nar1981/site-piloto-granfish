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

  const sug = el('div', 'gfc-sug');
  ['Conhecer os modelos', 'Como configurar minha embarcação?', 'Preciso de suporte'].forEach((s) => {
    const b = el('button', '', s);
    b.type = 'button';
    b.addEventListener('click', () => enviar(s));
    sug.appendChild(b);
  });

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

  function oferecer(chave) {
    pendente = chave;
    const linha = el('div', 'gfc-go');
    const sim = el('button', 'gfc-yes', 'Sim, me leve');
    const nao = el('button', 'gfc-no', 'Agora não');
    sim.type = nao.type = 'button';
    sim.addEventListener('click', () => { linha.remove(); levar(chave); });
    nao.addEventListener('click', () => { linha.remove(); pendente = null; bolha('bot', 'Tudo bem! Se precisar de algo é só chamar.'); });
    linha.append(sim, nao);
    msgs.appendChild(linha);
  }

  function levar(chave) {
    pendente = null;
    const [url, nome, externo] = DESTINOS[chave];
    bolha('bot', 'Pronto, te levando para ' + nome + '! 🚤');
    hist.push({ role: 'bot', text: 'Levei a pessoa para ' + nome + '.' });
    setTimeout(() => {
      if (externo) { window.open(url, '_blank', 'noopener'); return; }
      const [pag, hash] = url.split('#');
      const aqui = (location.pathname.split('/').pop() || 'index.html') === pag;
      if (aqui && hash) {
        const alvo = document.getElementById(hash);
        alternar(false);
        if (alvo) alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          body: JSON.stringify({ messages: hist.slice(-12) })
        });
        clearTimeout(to);
        if (r.ok) texto = ((await r.json()).reply || '').trim();
      } catch (e) { /* usa resposta de reserva */ }
    }
    if (!texto) texto = reserva(hist[hist.length - 1].text);
    const m = /\[\[IR:([a-z_]+)\]\]/i.exec(texto);
    const chave = m && DESTINOS[m[1].toLowerCase()] ? m[1].toLowerCase() : null;
    texto = texto.replace(/\[\[IR:[^\]]*\]\]/gi, '').trim();
    digitando.textContent = texto;
    hist.push({ role: 'bot', text: texto });
    if (chave) oferecer(chave);
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function enviar(t) {
    t = (t || '').trim();
    if (!t || ocupado) return;
    ocupado = true; env.disabled = true; sug.hidden = true;
    bolha('user', t);
    hist.push({ role: 'user', text: t });
    campo.value = '';
    if (pendente && SIM.test(t)) { msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove()); levar(pendente); ocupado = false; env.disabled = false; return; }
    if (pendente && NAO.test(t)) { msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove()); pendente = null; bolha('bot', 'Tudo bem! Se precisar de algo é só chamar.'); ocupado = false; env.disabled = false; return; }
    msgs.querySelectorAll('.gfc-go').forEach((x) => x.remove());
    pendente = null;
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
      if (!msgs.children.length) bolha('bot', 'Oi! Eu sou a ' + NOME + ', da Gran Fish. Posso ajudar com modelos, cores, configuração da sua embarcação, cadastro ou suporte. Como posso ajudar?');
      campo.focus();
    }
  }
  botao.addEventListener('click', () => alternar(painel.hidden));
  fechar.addEventListener('click', () => { alternar(false); botao.focus(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !painel.hidden) alternar(false); });
})();
