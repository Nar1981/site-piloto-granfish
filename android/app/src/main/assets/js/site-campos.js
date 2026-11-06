// Campos personalizáveis do site. tipo: texto | longo | linhas | whatsapp | cor | mostrar
window.GF_CAMPOS = [
  { g: 'Cores (site e área interna)', k: 'cor_teal', t: 'cor', r: 'Cor principal', v: '#0d7774', css: '--teal' },
  { g: 'Cores (site e área interna)', k: 'cor_teal_escura', t: 'cor', r: 'Cor principal (escura)', v: '#07504f', css: '--teal-deep' },
  { g: 'Cores (site e área interna)', k: 'cor_destaque', t: 'cor', r: 'Cor de destaque (botões)', v: '#d7794c', css: '--copper' },
  { g: 'Cores (site e área interna)', k: 'cor_fundo_escuro', t: 'cor', r: 'Cor de fundo escuro', v: '#0b1b23', css: '--ink' },
  { g: 'Cores (site e área interna)', k: 'cor_fundo_claro', t: 'cor', r: 'Cor de fundo claro', v: '#f5f2ea', css: '--paper' },

  { g: 'Topo da página inicial', k: 'hero_titulo', t: 'texto', r: 'Título principal', v: 'O seu horizonte começa aqui.', sel: '.hero h1' },
  { g: 'Topo da página inicial', k: 'hero_texto', t: 'longo', r: 'Texto de apoio', v: 'Embarcações com engenharia própria, acabamento preciso e liberdade para configurar cada detalhe da sua próxima história na água.', sel: '.hero-copy' },
  { g: 'Topo da página inicial', k: 'nota_titulo', t: 'texto', r: 'Destaque lateral: título', v: 'Projetada para o seu jeito de navegar.', sel: '.hero-note strong' },
  { g: 'Topo da página inicial', k: 'nota_texto', t: 'longo', r: 'Destaque lateral: texto', v: 'Da estrutura ao último detalhe, cada Gran Fish nasce para combinar desempenho, presença e conforto.', sel: '.hero-note p' },

  { g: 'Seção Modelos', k: 'modelos_titulo', t: 'texto', r: 'Título', v: 'Escolha a embarcação. Depois, faça dela sua.', sel: '#modelos .section-heading h2' },
  { g: 'Seção Modelos', k: 'modelos_texto', t: 'longo', r: 'Texto', v: 'Conheça nossos configuradores interativos e visualize combinações antes de tomar a decisão.', sel: '#modelos .section-heading p' },

  { g: 'Seção Estaleiro', k: 'mostrar_estaleiro', t: 'mostrar', r: 'Exibir seção Estaleiro', v: '1', sel: '#estaleiro', nav: '#estaleiro' },
  { g: 'Seção Estaleiro', k: 'estaleiro_titulo', t: 'texto', r: 'Título', v: 'Detalhe não é detalhe. É projeto.', sel: '#estaleiro .manifesto h2' },
  { g: 'Seção Estaleiro', k: 'estaleiro_texto', t: 'longo', r: 'Texto', v: 'Unimos técnica, escuta e cuidado artesanal para entregar embarcações que fazem sentido na água e continuam fazendo sentido por muitos anos.', sel: '.manifesto-copy p' },

  { g: 'Seção Instagram', k: 'mostrar_instagram', t: 'mostrar', r: 'Exibir seção Instagram', v: '1', sel: '#instagram', nav: '#instagram' },
  { g: 'Seção Instagram', k: 'instagram_titulo', t: 'texto', r: 'Título', v: 'O estaleiro em movimento.', sel: '#instagram .section-heading h2' },
  { g: 'Seção Instagram', k: 'instagram_texto', t: 'longo', r: 'Texto', v: 'Acompanhe lançamentos, bastidores e embarcações que já ganharam o mundo.', sel: '#instagram .section-heading p' },

  { g: 'Contato e rodapé', k: 'whatsapp', t: 'whatsapp', r: 'WhatsApp (com DDI e DDD, só números)', v: '5535999999999' },
  { g: 'Contato e rodapé', k: 'contato_titulo', t: 'texto', r: 'Chamada de contato: título', v: 'Vamos desenhar seu próximo destino?', sel: '.contact-band h2' },
  { g: 'Contato e rodapé', k: 'contato_texto', t: 'longo', r: 'Chamada de contato: texto', v: 'Fale diretamente com a Gran Fish e conte o que você imagina.', sel: '.contact-band p' },
  { g: 'Contato e rodapé', k: 'rodape', t: 'linhas', r: 'Rodapé (uma linha por linha)', v: 'Gran Fish Indústria e Comércio de Embarcações LTDA\nRua das Primaveras, 50, Pratápolis - MG, CEP 37.970-000\nCNPJ 59.593.605/0001-86', sel: 'footer p:first-child' }
];
