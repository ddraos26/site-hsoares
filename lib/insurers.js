export const insurers = [
  {
    slug: 'porto',
    name: 'Porto',
    logo: '/assets/PORTO.png',
    summary:
      'Marca forte em auto, residencial, aluguel, vida e serviços 24h, com presença direta nas jornadas mais estratégicas da H Soares.',
    tags: ['Auto', 'Residencial', 'Seguro Fiança', 'Vida'],
    sourceUrl: 'https://www.portoseguro.com.br/sites/institucional/atendimento/fale-conosco/grupo-fale-conosco/telefones-e-SAC',
    channels: [
      {
        title: 'Assistência 24h e serviços',
        items: [
          { label: 'Grande SP e Grande Rio', value: '333 76786', href: 'tel:1133376786' },
          { label: 'Capitais e regiões metropolitanas', value: '4004 76786', href: 'tel:400476786' },
          { label: 'Demais localidades', value: '0800 727 0800', href: 'tel:08007270800' },
          { label: 'WhatsApp Porto', value: '(11) 3003-9303', href: 'https://wa.me/551130039303' }
        ]
      },
      {
        title: 'Sinistro e atendimento especializado',
        items: [
          { label: 'Veículos e serviços emergenciais', value: 'Mesmas centrais acima, com aviso de sinistro 24h.' },
          { label: 'Seguro imobiliário / aluguel', value: '0800 727 2722', href: 'tel:08007272722' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC 24h', value: '0800 727 2766', href: 'tel:08007272766' },
          { label: 'Ouvidoria', value: '0800 727 1184', href: 'tel:08007271184' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.portoseguro.com.br/' },
      { label: 'Telefones e SAC', href: 'https://www.portoseguro.com.br/sites/institucional/atendimento/fale-conosco/grupo-fale-conosco/telefones-e-SAC' },
      { label: 'Sinistro de veículos', href: 'https://www.portoseguro.com.br/sites/institucional/sinistros/veiculos' }
    ],
    products: [
      { label: 'Seguro Fiança', href: '/produtos/seguro-fianca' },
      { label: 'Seguro Imobiliário', href: '/produtos/seguro-imobiliario' },
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Plano de Saúde', href: '/produtos/plano-saude' }
    ]
  },
  {
    slug: 'tokio-marine',
    name: 'Tokio Marine',
    logo: '/assets/insurers/tokio-marine.svg',
    summary:
      'Seguradora relevante na operação de locação, patrimonial e auto, com canais claros para assistência, sinistro e relacionamento.',
    tags: ['Auto', 'Patrimonial', 'Locação'],
    sourceUrl: 'https://www.tokiomarine.com.br/atendimento',
    channels: [
      {
        title: 'Assistência 24h e sinistro',
        items: [
          { label: 'Assistência 24h', value: '0800 31 86546', href: 'tel:08003186546' },
          { label: 'WhatsApp', value: '(11) 99578-6546', href: 'https://wa.me/5511995786546' }
        ]
      },
      {
        title: 'Relacionamento e SAC',
        items: [
          { label: 'SAC', value: '0800 703 9000', href: 'tel:08007039000' },
          { label: 'Deficiência auditiva', value: '0800 770 1066', href: 'tel:08007701066' }
        ]
      },
      {
        title: 'Ouvidoria',
        items: [{ label: 'Ouvidoria Tokio Marine', value: '0800 449 0000', href: 'tel:08004490000' }]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.tokiomarine.com.br/' },
      { label: 'Atendimento', href: 'https://www.tokiomarine.com.br/atendimento' }
    ],
    products: [
      { label: 'Seguro Fiança', href: '/produtos/seguro-fianca' },
      { label: 'Seguro Imobiliário', href: '/produtos/seguro-imobiliario' }
    ]
  },
  {
    slug: 'too-seguros',
    name: 'Too Seguros',
    logo: '/assets/insurers/too-seguros.png',
    summary:
      'Operação digital com presença importante na análise de Seguro Fiança, com atendimento centralizado e canais oficiais objetivos.',
    tags: ['Seguro Fiança', 'Locação', 'Digital'],
    sourceUrl: 'https://www.tooseguros.com.br/fale-conosco/',
    channels: [
      {
        title: 'Atendimento e relacionamento',
        items: [
          { label: 'Central', value: '0800 775 9191', href: 'tel:08007759191' },
          { label: 'WhatsApp', value: '(11) 99400-3326', href: 'https://wa.me/5511994003326' }
        ]
      },
      {
        title: 'SAC 24h',
        items: [
          { label: 'SAC', value: '0800 776 2252', href: 'tel:08007762252' },
          { label: 'Deficiência auditiva', value: '0800 776 2253', href: 'tel:08007762253' }
        ]
      },
      {
        title: 'Ouvidoria',
        items: [{ label: 'Ouvidoria Too', value: '0800 776 2254', href: 'tel:08007762254' }]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.tooseguros.com.br/' },
      { label: 'Fale conosco', href: 'https://www.tooseguros.com.br/fale-conosco/' }
    ],
    products: [{ label: 'Seguro Fiança', href: '/produtos/seguro-fianca' }]
  },
  {
    slug: 'sulamerica',
    name: 'SulAmérica',
    logo: '/assets/insurers/sulamerica.svg',
    summary:
      'Marca estratégica para saúde e benefícios, com canais fortes para rede referenciada, relacionamento e atendimento institucional.',
    tags: ['Saúde', 'Odonto', 'Vida'],
    sourceUrl: 'https://portal.sulamericaseguros.com.br/canaisdeatendimento.htm',
    channels: [
      {
        title: 'Saúde, odonto e WhatsApp',
        items: [
          { label: 'Saúde e odonto - capitais', value: '4004-5900', href: 'tel:40045900' },
          { label: 'Saúde e odonto - demais regiões', value: '0800-970-0500', href: 'tel:08009700500' },
          { label: 'WhatsApp SulAmérica', value: '(11) 3004-9723', href: 'https://wa.me/551130049723' }
        ]
      },
      {
        title: 'Auto, residencial e sinistro',
        items: [
          { label: 'Auto / residencial / empresarial - capitais', value: '4090-1012', href: 'tel:40901012' },
          { label: 'Auto / residencial / empresarial - demais regiões', value: '0800-777-1012', href: 'tel:08007771012' },
          { label: 'Assistência 24h', value: '0800-702-5447', href: 'tel:08007025447' },
          { label: 'Sinistro / riscos patrimoniais', value: '4004-4100 / 0800-727-4100', href: 'tel:40044100' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC', value: '0800-722-0504', href: 'tel:08007220504' },
          { label: 'Ouvidoria', value: '0800-725-3374', href: 'tel:08007253374' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Portal institucional', href: 'https://portal.sulamericaseguros.com.br/' },
      { label: 'Canais de atendimento', href: 'https://portal.sulamericaseguros.com.br/canaisdeatendimento.htm' },
      { label: 'Ouvidoria', href: 'https://portal.sulamericaseguros.com.br/apoio/fale-com-a-gente/ouvidoria/' }
    ],
    products: [
      { label: 'Plano de Saúde', href: '/produtos/plano-saude' },
      { label: 'Plano por Hospital e Rede', href: '/plano-de-saude-por-hospital-e-rede' }
    ]
  },
  {
    slug: 'azul',
    name: 'Azul Seguros',
    logo: '/assets/AZUL.png',
    summary:
      'Seguradora muito associada ao seguro auto, com canais claros de assistência, sinistro e atendimento digital.',
    tags: ['Auto', 'Renovação', 'Assistência 24h'],
    sourceUrl: 'https://www.azulseguros.com.br/resolva-aqui/',
    channels: [
      {
        title: 'WhatsApp e assistência 24h',
        items: [
          { label: 'WhatsApp', value: '(21) 3906-2985', href: 'https://wa.me/552139062985' },
          { label: 'Capitais e grandes centros', value: '4004 3700', href: 'tel:40043700' },
          { label: 'Outras regiões', value: '0300 123 2985 / 0800 703 0203', href: 'tel:03001232985' },
          { label: 'Mercosul', value: '+55 11 3366 2986', href: 'tel:+551133662986' }
        ]
      },
      {
        title: 'Sinistro',
        items: [{ label: 'Abertura de aviso e andamento', value: 'Mesmas centrais de assistência 24h.' }]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC', value: '0800 703 1280', href: 'tel:08007031280' },
          { label: 'Ouvidoria', value: '0800 727 1184', href: 'tel:08007271184' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.azulseguros.com.br/' },
      { label: 'Resolva Aqui', href: 'https://www.azulseguros.com.br/resolva-aqui/' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Cotação de Seguro Auto', href: '/cotacao-seguro-auto' },
      { label: 'Renovação de Seguro Auto', href: '/renovacao-seguro-auto' }
    ]
  },
  {
    slug: 'allianz',
    name: 'Allianz',
    logo: '/assets/insurers/allianz.png',
    summary:
      'Seguradora global com atuação forte em auto, residência e patrimônio, com linha direta e portal do cliente bem definidos.',
    tags: ['Auto', 'Residencial', 'Patrimonial'],
    sourceUrl: 'https://www.allianz.com.br/seguros/grandes-riscos.html',
    channels: [
      {
        title: 'Linha direta e sinistro',
        items: [
          { label: 'Capitais e regiões metropolitanas', value: '4090 1110', href: 'tel:40901110' },
          { label: 'Demais regiões', value: '0800 777 7243', href: 'tel:08007777243' }
        ]
      },
      {
        title: 'SAC 24h',
        items: [
          { label: 'SAC', value: '08000 115 215', href: 'tel:08000115215' },
          { label: 'Deficiência auditiva', value: '08000 121 239', href: 'tel:08000121239' }
        ]
      },
      {
        title: 'Ouvidoria',
        items: [{ label: 'Ouvidoria Allianz', value: '0800 771 3313', href: 'tel:08007713313' }]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.allianz.com.br/' },
      { label: 'Atendimento Allianz', href: 'https://www.allianz.com.br/atendimento.html' },
      { label: 'Portal Allianz Cliente', href: 'https://www.allianz.com.br/seguros/grandes-riscos.html' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Residencial Essencial', href: '/produtos/residencial-essencial' }
    ]
  },
  {
    slug: 'bradesco',
    name: 'Bradesco Seguros',
    logo: '/assets/insurers/bradesco.png',
    summary:
      'Grupo tradicional com canais fortes para auto, saúde, vida e residencial, incluindo WhatsApp e telefone por ramo.',
    tags: ['Auto', 'Saúde', 'Residencial', 'Vida'],
    sourceUrl: 'https://www.bradescoseguros.com.br/clientes/atendimento/telefones-bradesco-seguros',
    channels: [
      {
        title: 'Relacionamento e WhatsApp',
        items: [
          { label: 'Central geral - capitais', value: '4004 0237', href: 'tel:40040237' },
          { label: 'Central geral - demais regiões', value: '0800 237 0237', href: 'tel:08002370237' },
          { label: 'WhatsApp clientes', value: '(21) 4004-2702', href: 'https://wa.me/552140042702' }
        ]
      },
      {
        title: 'Assistência e sinistro',
        items: [
          { label: 'Auto / residencial - capitais', value: '4004 2757', href: 'tel:40042757' },
          { label: 'Auto / residencial - demais regiões', value: '0800 701 2757', href: 'tel:08007012757' },
          { label: 'Saúde - capitais', value: '4004 2700', href: 'tel:40042700' },
          { label: 'Saúde - demais regiões', value: '0800 701 2700', href: 'tel:08007012700' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC 24h', value: '0800 727 9966', href: 'tel:08007279966' },
          { label: 'Ouvidoria', value: '0800 701 7000', href: 'tel:08007017000' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Atendimento', href: 'https://www.bradescoseguros.com.br/clientes/atendimento' },
      { label: 'Telefones por produto', href: 'https://www.bradescoseguros.com.br/clientes/atendimento/telefones-bradesco-seguros' },
      { label: 'WhatsApp Bradesco Seguros', href: 'https://www.bradescoseguros.com.br/clientes/atendimento/whatsapp-bradesco-seguros' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Plano de Saúde', href: '/produtos/plano-saude' }
    ]
  },
  {
    slug: 'hdi',
    name: 'HDI',
    logo: '/assets/insurers/hdi.svg',
    summary:
      'Seguradora com operação forte em auto e patrimonial, com centrais dedicadas para sinistro, assistência e SAC.',
    tags: ['Auto', 'Patrimonial', 'Sinistro'],
    sourceUrl: 'https://www.hdi.com.br/web/corretores.htm?m_language=P',
    channels: [
      {
        title: 'Assistência 24h',
        items: [
          { label: 'HDI Auto', value: '0800 707 7724', href: 'tel:08007077724' },
          { label: 'Patrimonial / empresariais', value: '0800 770 0809', href: 'tel:08007700809' }
        ]
      },
      {
        title: 'Sinistro',
        items: [{ label: 'Central de Sinistros', value: '0800 701 5430', href: 'tel:08007015430' }]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC', value: '0800 722 7149', href: 'tel:08007227149' },
          { label: 'Deficiência auditiva', value: '0800 772 1825', href: 'tel:08007721825' },
          { label: 'Ouvidoria', value: '0800 775 4035', href: 'tel:08007754035' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.hdi.com.br/' },
      { label: 'Sinistro HDI', href: 'https://net.hdi.com.br/sinistro.htm' },
      { label: 'Canais e telefones úteis', href: 'https://www.hdi.com.br/web/corretores.htm?m_language=P' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Cotação de Seguro Auto', href: '/cotacao-seguro-auto' }
    ]
  },
  {
    slug: 'yelum',
    name: 'Yelum Seguros',
    logo: '/assets/insurers/yelum.svg',
    summary:
      'Marca com foco forte em auto, vida e residência, concentrando assistência, sinistro e serviços digitais em canais unificados.',
    tags: ['Auto', 'Residencial', 'Vida'],
    sourceUrl: 'https://www.yelumseguros.com.br/Pages/atendimento/nossos-telefones.aspx',
    channels: [
      {
        title: 'Assistência 24h e sinistro',
        items: [
          { label: 'WhatsApp Yelum', value: '(11) 3206-1414', href: 'https://wa.me/551132061414' },
          { label: 'Ações disponíveis', value: 'Assistência 24h, abertura de sinistro, cobrança e serviços digitais.' }
        ]
      },
      {
        title: 'Canais digitais',
        items: [
          { label: 'Espaço Cliente', value: 'Portal oficial para apólice, pagamentos e serviços.' },
          { label: 'Chat online', value: 'Canal oficial para sinistro auto, cobrança e oficinas.' }
        ]
      },
      {
        title: 'Ouvidoria',
        items: [
          { label: 'Ouvidoria', value: '0800-740-3994', href: 'tel:08007403994' },
          { label: 'Deficiência auditiva', value: '0800-721-9104', href: 'tel:08007219104' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.yelumseguros.com.br/' },
      { label: 'Nossos telefones', href: 'https://www.yelumseguros.com.br/Pages/atendimento/nossos-telefones.aspx' },
      { label: 'Ouvidoria', href: 'https://www.yelumseguros.com.br/Pages/atendimento/regulamento-ouvidoria.aspx' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Residencial Essencial', href: '/produtos/residencial-essencial' }
    ]
  },
  {
    slug: 'mapfre',
    name: 'MAPFRE',
    logo: '/assets/insurers/mapfre.png',
    summary:
      'Seguradora multirramos com canais bem organizados para auto, imóveis, patrimonial, vida e atendimento por WhatsApp.',
    tags: ['Auto', 'Imóveis', 'Empresarial', 'Vida'],
    sourceUrl: 'https://www.mapfre.com.br/atendimento/',
    channels: [
      {
        title: 'Assistência 24h e WhatsApp',
        items: [
          { label: 'Central geral / assistência', value: '0800 775 4545', href: 'tel:08007754545' },
          { label: 'WhatsApp clientes', value: '(11) 4004-0101', href: 'https://wa.me/551140040101' },
          { label: 'Produtos vida - assistência 24h', value: '0800 775 7196', href: 'tel:08007757196' }
        ]
      },
      {
        title: 'Sinistro',
        items: [
          { label: 'Auto, imóveis, patrimonial e empresarial', value: '0800 775 4545', href: 'tel:08007754545' },
          { label: 'Vida', value: '0800 709 8432', href: 'tel:08007098432' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'Ouvidoria - demais produtos', value: '0800 775 1079', href: 'tel:08007751079' },
          { label: 'Deficiência auditiva', value: '0800 775 5045', href: 'tel:08007755045' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://www.mapfre.com.br/' },
      { label: 'Atendimento MAPFRE', href: 'https://www.mapfre.com.br/atendimento/' },
      { label: 'Ouvidoria MAPFRE', href: 'https://www.mapfre.com.br/atendimento/ouvidoria/' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Residencial Essencial', href: '/produtos/residencial-essencial' }
    ]
  },
  {
    slug: 'akad',
    name: 'Akad Seguradora',
    logo: '/assets/insurers/akad.png',
    summary:
      'Seguradora com posicionamento forte em riscos corporativos, RC, equipamentos e linhas patrimoniais, com central 24/7.',
    tags: ['Empresarial', 'RC', 'Equipamentos', 'Patrimonial'],
    sourceUrl: 'https://akadseguros.com.br/central-de-atendimento/',
    channels: [
      {
        title: 'Central de atendimento',
        items: [
          { label: 'Capitais e regiões metropolitanas', value: '4000 1246', href: 'tel:40001246' },
          { label: 'Demais localidades', value: '0800 942 2746', href: 'tel:08009422746' },
          { label: 'WhatsApp / Filial digital', value: '(11) 5196-2523', href: 'https://wa.me/551151962523' }
        ]
      },
      {
        title: 'Sinistro',
        items: [
          { label: 'Central de Sinistros 24/7', value: '0800 777 2746', href: 'tel:08007772746' },
          { label: 'E-mail de sinistro', value: 'aviso.sinistro@akadseguros.com.br', href: 'mailto:aviso.sinistro@akadseguros.com.br' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC 24/7', value: '0800 942 2746', href: 'tel:08009422746' },
          { label: 'Deficiência auditiva', value: '0800 778 2800', href: 'tel:08007782800' },
          { label: 'Ouvidoria', value: '0800 940 0312', href: 'tel:08009400312' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://akadseguros.com.br/' },
      { label: 'Central de atendimento', href: 'https://akadseguros.com.br/central-de-atendimento/' },
      { label: 'Aviso de sinistro', href: 'https://akadseguros.com.br/aviso-de-sinistro/' }
    ],
    products: [
      { label: 'Seguro para Empresas', href: '/#produtos' },
      { label: 'Responsabilidade Civil', href: '/#produtos' },
      { label: 'Equipamentos Portáteis', href: '/produtos/equipamentos-portateis' }
    ]
  },
  {
    slug: 'suhai',
    name: 'Suhai',
    logo: '/assets/insurers/suhai.png',
    summary:
      'Seguradora especializada em proteção veicular, com canais separados para roubo, PT, assistência mecânica e atendimento administrativo.',
    tags: ['Auto', 'Roubo e furto', 'Assistência 24h'],
    sourceUrl: 'https://suhaiseguradora.com/contato/',
    channels: [
      {
        title: 'Roubo, furto e PT',
        items: [
          { label: 'SP e RJ', value: '3003-0335', href: 'tel:30030335' },
          { label: 'Demais regiões', value: '0800-784-2410', href: 'tel:08007842410' },
          { label: 'Cobertura', value: 'Atendimento 24h para aviso de roubo, furto e PT por colisão.' }
        ]
      },
      {
        title: 'Guincho e auxílio mecânico',
        items: [
          { label: 'Telefone / WhatsApp', value: '0800-327-8424', href: 'tel:08003278424' },
          { label: 'Cobertura', value: 'Troca de pneu, guincho e auxílio mecânico 24h.' }
        ]
      },
      {
        title: 'Ouvidoria e assuntos administrativos',
        items: [
          { label: 'Apólice, boleto e danos', value: '3003-0335 / 0800-784-2410' },
          { label: 'Ouvidoria', value: '0800-772-1214', href: 'tel:08007721214' },
          { label: 'E-mail da ouvidoria', value: 'ouvidoria@suhaiseguradora.com', href: 'mailto:ouvidoria@suhaiseguradora.com' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Site oficial', href: 'https://suhaiseguradora.com/' },
      { label: 'Contato e canais', href: 'https://suhaiseguradora.com/contato/' },
      { label: 'Aviso de sinistro', href: 'https://suhaiseguradora.com/aviso-de-sinistro/' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Renovação de Seguro Auto', href: '/renovacao-seguro-auto' }
    ]
  },
  {
    slug: 'alfa',
    name: 'Alfa Seguros',
    logo: '/assets/insurers/alfa.png',
    summary:
      'Seguradora tradicional com canais claros para assistência 24h, sinistro e operação patrimonial, imobiliária e automóvel.',
    tags: ['Auto', 'Residencial', 'Imobiliário', 'Empresa'],
    sourceUrl: 'https://wwws.alfaseguradora.com.br/Portal/Auto/Assistencia',
    channels: [
      {
        title: 'Assistência 24h e sinistro',
        items: [
          { label: 'Capitais e regiões metropolitanas', value: '4003-2532', href: 'tel:40032532' },
          { label: 'Demais regiões', value: '0800-888-2532', href: 'tel:08008882532' },
          { label: 'Exterior', value: '+55 11 4133-9056', href: 'tel:+551141339056' }
        ]
      },
      {
        title: 'Vida e funeral',
        items: [
          { label: 'Assistência funeral 24h', value: '0800-728-8432', href: 'tel:08007288432' },
          { label: 'Aviso de sinistro vida', value: '0800-888-2532', href: 'tel:08008882532' }
        ]
      },
      {
        title: 'SAC e ouvidoria',
        items: [
          { label: 'SAC', value: '0800-774-2532', href: 'tel:08007742532' },
          { label: 'Ouvidoria', value: '0800-774-2352', href: 'tel:08007742352' }
        ]
      }
    ],
    officialLinks: [
      { label: 'Assistência 24h', href: 'https://wwws.alfaseguradora.com.br/Portal/Auto/Assistencia' },
      { label: 'Comunicação de sinistro', href: 'https://hom.alfaseguradora.com.br/Portal/Sinistro/ComunicacaoSinistro' },
      { label: 'Site Alfa Seguros', href: 'https://wwws.alfaseguradora.com.br/' }
    ],
    products: [
      { label: 'Seguro Auto', href: '/produtos/seguro-auto' },
      { label: 'Residencial Essencial', href: '/produtos/residencial-essencial' },
      { label: 'Seguro Imobiliário', href: '/produtos/seguro-imobiliario' }
    ]
  }
];
