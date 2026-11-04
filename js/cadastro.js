(function () {
  const cfg = window.GF_CADASTRO || {};
  const live = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const form = document.getElementById('form');
  const aviso = document.getElementById('aviso');
  const btn = document.getElementById('enviar');
  const LOCAL_KEY = 'gf_cadastros_demo';

  // ── Helpers ──
  const digits = (v) => v.replace(/\D/g, '');
  const masks = {
    cpf: (v) => digits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    cnpj: (v) => digits(v).slice(0, 14).replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2'),
    cep: (v) => digits(v).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2'),
    tel: (v) => { const d = digits(v).slice(0, 11); return d.length > 10 ? d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3') : d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, ''); }
  };

  function validCPF(v) {
    const d = digits(v);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (const n of [9, 10]) {
      let s = 0;
      for (let i = 0; i < n; i++) s += +d[i] * (n + 1 - i);
      if (((s * 10) % 11) % 10 !== +d[n]) return false;
    }
    return true;
  }

  function validCNPJ(v) {
    const d = digits(v);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    for (const n of [12, 13]) {
      let s = 0, p = n - 7;
      for (let i = 0; i < n; i++) { s += +d[i] * p--; if (p < 2) p = 9; }
      if (((s * 10) % 11) % 10 !== +d[n]) return false;
    }
    return true;
  }

  function show(msg, kind) {
    aviso.textContent = msg;
    aviso.className = 'aviso ' + kind;
    aviso.hidden = false;
    aviso.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function setErro(name, msg) {
    const p = document.querySelector('[data-erro="' + name + '"]');
    if (p) p.textContent = msg || '';
    const el = form.elements[name];
    const holder = el && el.closest ? el.closest('.f') : null;
    if (holder) holder.classList.toggle('invalid', Boolean(msg));
  }

  // ── Interação ──
  form.addEventListener('input', (e) => {
    const m = e.target.dataset && e.target.dataset.mask;
    if (m) e.target.value = masks[m](e.target.value);
  });

  const tipoVal = () => (form.elements.tipo.value || '');
  function syncTipo() {
    const t = tipoVal();
    document.getElementById('sec-pf').hidden = t !== 'Pessoa Física';
    document.getElementById('sec-pj').hidden = t !== 'Pessoa Jurídica';
  }
  form.addEventListener('change', (e) => {
    if (e.target.name === 'tipo') syncTipo();
    if (e.target.name === 'finalidades') {
      document.getElementById('outro-wrap').hidden = !form.querySelector('input[name="finalidades"][value="Outro"]').checked;
    }
  });

  document.getElementById('imprimir').addEventListener('click', () => {
    document.getElementById('sec-pf').hidden = false;
    document.getElementById('sec-pj').hidden = false;
    document.getElementById('outro-wrap').hidden = false;
    window.print();
    syncTipo();
    document.getElementById('outro-wrap').hidden = !form.querySelector('input[name="finalidades"][value="Outro"]').checked;
  });

  document.getElementById('modo-nota').textContent = live
    ? 'Seus dados são enviados com segurança e tratados conforme a declaração acima.'
    : 'Modo demonstração: o banco de dados ainda não foi conectado, então o cadastro fica salvo apenas neste navegador.';

  // ── Coleta e validação ──
  function collect() {
    const fd = new FormData(form);
    const dados = {};
    for (const [k, v] of fd.entries()) {
      if (['finalidades', 'tipo', 'aceite_lgpd', 'finalidade_outro'].includes(k)) continue;
      const val = String(v).trim();
      if (val) dados[k] = val;
    }
    const pf = tipoVal() === 'Pessoa Física';
    return {
      tipo: tipoVal(),
      finalidades: fd.getAll('finalidades'),
      finalidade_outro: (fd.get('finalidade_outro') || '').trim() || null,
      nome: ((pf ? dados.pf_nome : dados.pj_razao) || '').trim(),
      documento: (pf ? dados.pf_cpf : dados.pj_cnpj) || '',
      email: dados.email || '',
      telefone: dados.telefone || '',
      dados,
      aceite_lgpd: form.elements.aceite_lgpd.checked
    };
  }

  function validate(c) {
    const errs = {};
    const pf = c.tipo === 'Pessoa Física';
    if (!c.finalidades.length) errs.finalidades = 'Selecione ao menos uma finalidade.';
    if (!c.tipo) errs.tipo = 'Selecione o tipo de cadastro.';
    if (c.tipo) {
      if (!c.nome) errs[pf ? 'pf_nome' : 'pj_razao'] = 'Campo obrigatório.';
      const docName = pf ? 'pf_cpf' : 'pj_cnpj';
      if (!(pf ? validCPF(c.documento) : validCNPJ(c.documento))) errs[docName] = pf ? 'CPF inválido.' : 'CNPJ inválido.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) errs.email = 'E-mail inválido.';
    if (digits(c.telefone).length < 10) errs.telefone = 'Informe telefone com DDD.';
    if (!c.aceite_lgpd) errs.aceite_lgpd = 'É necessário aceitar a declaração.';
    return errs;
  }

  // ── Envio ──
  async function save(c) {
    if (!live) {
      const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
      all.unshift({ ...c, id: crypto.randomUUID(), created_at: new Date().toISOString(), status: 'Pendente' });
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      return;
    }
    const r = await fetch(cfg.supabaseUrl + '/rest/v1/cadastros', {
      method: 'POST',
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: 'Bearer ' + cfg.supabaseAnonKey,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(c)
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    aviso.hidden = true;
    form.querySelectorAll('.erro').forEach((p) => (p.textContent = ''));
    form.querySelectorAll('.invalid').forEach((p) => p.classList.remove('invalid'));
    const c = collect();
    const errs = validate(c);
    const keys = Object.keys(errs);
    if (keys.length) {
      keys.forEach((k) => setErro(k, errs[k]));
      show('Revise os campos destacados antes de enviar.', 'err');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Enviando…';
    try {
      await save(c);
      form.reset();
      syncTipo();
      document.getElementById('outro-wrap').hidden = true;
      show('Cadastro enviado com sucesso! Entraremos em contato em breve.', 'ok');
    } catch (err) {
      show('Não foi possível enviar agora. Tente novamente ou fale conosco pelo e-mail contato@granfish.com.br.', 'err');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar cadastro';
    }
  });
})();
