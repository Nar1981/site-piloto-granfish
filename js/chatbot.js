(function () {
  const cfg = window.GF_CADASTRO || {};
  const wa = document.querySelector('a[href*="wa.me/"]');
  const WA = wa ? wa.href.split('?')[0] : 'https://wa.me/5535999999999';
  const URL_CHAT = cfg.supabaseUrl ? cfg.supabaseUrl + '/functions/v1/chat' : '';
  const NOME = 'Marina';
  const hist = [];
  let ocupado = false;

  // Respostas de reserva (quando a IA estiver indisponível)
  const REGRAS = [
    [/pre[çc]o|valor|or[çc]amento|quanto custa|comprar|negoci/i, 'Para valores e orçamento, o melhor é falar direto com a nossa equipe pelo WhatsApp, que monta uma proposta para o seu projeto.'],
    [/hurricane|60 ?sl|lancha/i, 'A Hurricane 60 SL tem 60 pés, casco laminado e foco em presença, estabilidade e acabamento. Na página inicial, em "Modelos", você abre o configurador 3D dela.'],
    [/pontoon|pesca|lazer|alum[ií]nio/i, 'A Linha Pontoon é em alumínio naval, pensada para lazer e pesca. Dá para montar a sua no configurador 3D, em "Modelos" na página inicial.'],
    [/cor|cores|cat[aá]logo|acabamento/i, 'Temos um catálogo de cores com PDF. Veja em catalogo.html e depois me conte o que mais gostou!'],
    [/cadastr|ficha/i, 'Para se cadastrar, use a página cadastro.html. Nossa equipe recebe e entra em contato.'],
    [/endere[çc]o|onde fica|visita|localiza/i, 'Estamos na Rua das Primaveras, 50, Pratápolis - MG, CEP 37.970-000. Para agendar visita, chame no WhatsApp.'],
    [/suporte|problema|defeito|p[óo]s.?venda|garantia|ajuda/i, 'Sinto muito pelo transtorno! Para suporte e pós-venda, fale direto com a equipe pelo WhatsApp que a gente resolve com você.'],
    [/configur/i, 'Abra o configurador 3D do modelo em "Modelos" na página inicial, monte as combinações e, depois, fale com a equipe para fechar os detalhes.'],
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
  botao.textContent = '💬';

  const painel = el('div', 'gfc-box');
  painel.hidden = true;
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-label', 'Conversa com a Marina, assistente Gran Fish');
  const topo = el('div', 'gfc-top');
  const tit = el('div');
  tit.append(el('strong', '', NOME + ' · Gran Fish'), el('small', '', 'Assistente virtual'));
  const fechar = el('button', 'gfc-x', '×');
  fechar.type = 'button';
  fechar.setAttribute('aria-label', 'Fechar chat');
  topo.append(tit, fechar);

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
  caixa.append(painel, botao);
  document.body.appendChild(caixa);

  function bolha(quem, texto) {
    const b = el('div', 'gfc-m gfc-' + quem, texto);
    msgs.appendChild(b);
    msgs.scrollTop = msgs.scrollHeight;
    return b;
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
    digitando.textContent = texto;
    hist.push({ role: 'bot', text: texto });
    msgs.scrollTop = msgs.scrollHeight;
  }

  async function enviar(t) {
    t = (t || '').trim();
    if (!t || ocupado) return;
    ocupado = true; env.disabled = true; sug.hidden = true;
    bolha('user', t);
    hist.push({ role: 'user', text: t });
    campo.value = '';
    await responder();
    ocupado = false; env.disabled = false; campo.focus();
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); enviar(campo.value); });

  function alternar(abrir) {
    painel.hidden = !abrir;
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
