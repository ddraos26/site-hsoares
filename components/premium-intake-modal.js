'use client';

import { useEffect, useMemo, useState } from 'react';
import { VEHICLE_OPTIONS } from '@/lib/vehicle-catalog';

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const AUTO_USAGE_OPTIONS = [
  { label: 'Particular (padrão)', value: 'particular' },
  { label: 'Frete', value: 'frete' },
  { label: 'Táxi', value: 'taxi' },
  { label: 'Locadoras', value: 'locadoras' },
  { label: 'Ambulância', value: 'ambulancia' },
  { label: 'Auto escola', value: 'auto-escola' },
  { label: 'Bombeiro', value: 'bombeiro' },
  { label: 'Policiamento', value: 'policiamento' },
  { label: 'Transporte funcionários/clientes', value: 'transporte-funcionarios-clientes' },
  { label: 'Misto', value: 'misto' },
  { label: 'Escolar', value: 'escolar' },
  { label: 'Teste drive', value: 'teste-drive' },
  { label: 'Diferenciados', value: 'diferenciados' },
  { label: 'Transporte de Passageiros por Aplicativos', value: 'aplicativos' }
];

const AUTO_GEAR_OPTIONS = [
  { label: 'Automático', value: 'automatico' },
  { label: 'Manual', value: 'manual' }
];

const AUTO_SEX_OPTIONS = [
  { label: 'Selecione', value: '' },
  { label: 'Feminino', value: 'feminino' },
  { label: 'Masculino', value: 'masculino' },
  { label: 'Outro', value: 'outro' },
  { label: 'Prefere não informar', value: 'nao-informado' }
];

const AUTO_DEVICE_OPTIONS = [
  { label: 'Outros dispositivos', value: 'outros-dispositivos' },
  { label: 'Não informado', value: 'nao-informado' },
  { label: 'Não', value: 'nao' },
  { label: 'Rastreador da Porto Seguro - DAF V', value: 'rastreador-porto-daf-v' },
  { label: 'Rastreador Tracker', value: 'rastreador-tracker' },
  { label: 'Rastreador original de fábrica', value: 'rastreador-original-fabrica' }
];

const CONFIGS = {
  'seguro-fianca': {
    leadType: 'fianca_analysis_modal',
    inlineLabel: 'Enviar ficha para análise',
    sectionEyebrow: 'Ficha de análise',
    sectionTitle: 'Preencha a ficha de análise do Seguro Fiança',
    sectionText:
      'Escolha o tipo de análise, preencha os dados e anexe os documentos necessários para a H Soares estruturar a avaliação com mais contexto.',
    sectionSecondaryLabel: 'Área da imobiliária',
    modalEyebrow: 'Seguro Fiança',
    modalTitle: 'Ficha de análise',
    modalText:
      'Selecione o tipo de análise, preencha a ficha correspondente e envie quantos documentos forem necessários.',
    successMessage:
      'Recebemos a ficha de análise do Seguro Fiança. A H Soares vai usar essas informações para avançar com a avaliação.'
  },
  'plano-saude': {
    leadType: 'health_detailed_modal',
    inlineLabel: 'Receber proposta personalizada',
    sectionEyebrow: 'Captação qualificada',
    sectionTitle: 'Envie as informações certas para montarmos uma proposta mais assertiva',
    sectionText:
      'A H Soares usa essas respostas para comparar operadoras, rede médica, acomodação e custo total com muito mais precisão.',
    sectionSecondaryLabel: 'Falar no WhatsApp',
    modalEyebrow: 'Plano de Saúde',
    modalTitle: 'Conte o cenário e a rede que você deseja',
    modalText:
      'Esse formulário foi pensado para capturar exatamente as informações que mais ajudam na montagem da proposta de saúde.',
    successMessage:
      'Recebemos suas informações. A H Soares vai usar esses dados para montar uma proposta de Plano de Saúde mais aderente ao seu cenário.'
  },
  'seguro-auto': {
    leadType: 'auto_detailed_modal',
    inlineLabel: 'Enviar dados para cotação',
    sectionEyebrow: 'Cotação orientada',
    sectionTitle: 'Mande os dados principais do veículo para agilizar a cotação',
    sectionText:
      'Com as informações mais importantes do carro e do condutor, a H Soares consegue estruturar uma cotação de Seguro Auto com mais velocidade e aderência.',
    sectionSecondaryLabel: 'Ir para contratação direta',
    modalEyebrow: 'Seguro Auto',
    modalTitle: 'Preencha os dados principais para cotação',
    modalText:
      'Esse formulário reduz ida e volta comercial e ajuda a H Soares a estruturar a cotação com mais assertividade.',
    successMessage:
      'Recebemos os dados do veículo. A H Soares vai usar essas informações para avançar com sua cotação de Seguro Auto.'
  }
};

function getOrCreateSessionId() {
  const key = 'hs_session_id';
  const current = window.localStorage.getItem(key);
  if (current) return current;

  const next = `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function getAttribution() {
  const url = new URL(window.location.href);
  return {
    utm_source: url.searchParams.get('utm_source') || '',
    utm_medium: url.searchParams.get('utm_medium') || '',
    utm_campaign: url.searchParams.get('utm_campaign') || ''
  };
}

function newClickId(slug) {
  return `${slug}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function initialForm(productSlug) {
  if (productSlug === 'seguro-fianca') {
    return {
      fiancaType: 'residencial',
      imobiliaria: '',
      cepImovel: '',
      enderecoImovel: '',
      valorAluguel: '',
      condominio: '',
      iptu: '',
      agua: '',
      luz: '',
      multaRescisao: '',
      danosImovel: '',
      pinturaInterna: '',
      pinturaExterna: '',
      observacoes: '',
      pretendentes: [createFiancaPretendente()],
      pfComercial: createFiancaPfComercialApplicant(),
      pjMaisDoisAnos: createFiancaPjApplicant()
    };
  }

  if (productSlug === 'plano-saude') {
    return {
      nome: '',
      whatsapp: '',
      email: '',
      possuiPlanoAtivo: '',
      operadoraAtual: '',
      valorMensal: '',
      motivoTroca: '',
      quantidadeVidas: '',
      idadesCompletas: '',
      cep: '',
      redeDesejada: '',
      observacoes: ''
    };
  }

  return {
    nome: '',
    whatsapp: '',
    email: '',
    renovacao: 'nao',
    seguradoCpf: '',
    seguradoNome: '',
    seguradoDataNascimento: '',
    seguradoSexo: '',
    seguradoPossuiNomeSocial: 'nao',
    seguradoNomeSocial: '',
    seguradoECondutor: 'sim',
    condutorCpf: '',
    condutorNome: '',
    condutorDataNascimento: '',
    condutorSexo: '',
    condutorPossuiNomeSocial: 'nao',
    condutorNomeSocial: '',
    possuiSeguroAtivo: '',
    seguradoraAtual: '',
    classeBonus: '',
    valorAtual: '',
    veiculoModelo: '',
    anoModelo: '',
    placa: '',
    cepPernoite: '',
    idadeCondutor: '',
    usoVeiculo: 'particular',
    tipoCambio: 'automatico',
    possuiBlindagem: 'nao',
    possuiKitGas: 'nao',
    pessoaComDeficiencia: 'nao',
    dispositivosAntifurto: [],
    houveSinistro: '',
    observacoes: ''
  };
}

function createFiancaPretendente() {
  return {
    nome: '',
    cpf: '',
    cepAtual: '',
    dataNascimento: '',
    whatsapp: '',
    telefoneAdicional: '',
    estadoCivil: '',
    cpfConjuge: '',
    email: '',
    enderecoAtual: '',
    nomeEmpresa: '',
    desdeEmpresa: '',
    rendaBruta: '',
    profissao: ''
  };
}

function createFiancaPfComercialApplicant() {
  return {
    nome: '',
    cpf: '',
    rg: '',
    dataExpedicao: '',
    estadoCivil: '',
    cpfConjuge: '',
    email: '',
    telefone: '',
    cepEnderecoAtualEmpresa: '',
    nomeEmpresa: '',
    rendaBruta: '',
    profissao: '',
    possuiCnpjAberto: '',
    cnpj: '',
    motivoLocacao: '',
    enderecoAtualEmpresa: '',
    ramoAtividade: '',
    trataSeFranquia: '',
    principaisProdutosServicos: '',
    experienciaRamo: '',
    haveraSocios: '',
    cpfSocios: '',
    onusFinanceiros: ''
  };
}

function createFiancaPjApplicant() {
  return {
    motivoLocacao: '',
    cnpj: '',
    dataAberturaCnpj: '',
    capitalSocial: '',
    movimentacaoMensal: '',
    telefone: '',
    email: '',
    cepSedeSocial: '',
    enderecoSedeSocial: ''
  };
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function formatCpfInput(value) {
  const digits = onlyDigits(value).slice(0, 11);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatCepInput(value) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCnpjInput(value) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function formatPlateInput(value) {
  const raw = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);

  if (raw.length <= 3) return raw;
  if (raw.length === 4) return raw;

  const fifthChar = raw[4];
  if (/\d/.test(fifthChar || '')) {
    return `${raw.slice(0, 3)}-${raw.slice(3)}`;
  }

  return raw;
}

function isValidPlate(value) {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  return /^[A-Z]{3}\d{4}$/.test(normalized) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(normalized);
}

function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(cpf[10]);
}

function isValidCnpj(value) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcDigit = (base, factors) => {
    const sum = base.split('').reduce((acc, digit, index) => acc + Number(digit) * factors[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const base = cnpj.slice(0, 12);
  const firstDigit = calcDigit(base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(`${base}${firstDigit}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return `${firstDigit}${secondDigit}` === cnpj.slice(12);
}

function isPdfOrImageAttachment(file) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || '').toLowerCase();

  return type === 'application/pdf' || type.startsWith('image/') || /\.(pdf|png|jpg|jpeg|webp|gif)$/i.test(name);
}

function humanizeBoolean(value) {
  if (value === 'sim') return 'Sim';
  if (value === 'nao') return 'Não';
  return String(value || '').trim();
}

function getUsageLabel(value) {
  return AUTO_USAGE_OPTIONS.find((option) => option.value === value)?.label || value;
}

function getDeviceLabels(values) {
  return (values || [])
    .map((value) => AUTO_DEVICE_OPTIONS.find((option) => option.value === value)?.label || value)
    .join(', ');
}

function parseCurrencyValue(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex >= 0) {
    const integerPart = cleaned.slice(0, decimalIndex).replace(/[^\d-]/g, '');
    const decimalPart = cleaned.slice(decimalIndex + 1).replace(/\D/g, '').slice(0, 2);
    const normalized = `${integerPart || '0'}.${decimalPart.padEnd(decimalPart ? 2 : 0, '0')}`;
    const numeric = Number(normalized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  const integerOnly = cleaned.replace(/[^\d-]/g, '');
  const numeric = Number(integerOnly);
  return Number.isFinite(numeric) ? numeric : null;
}

function formatCurrencyInput(value) {
  const numeric = parseCurrencyValue(value);
  if (numeric === null) return '';
  return BRL_FORMATTER.format(numeric);
}

function isCompleteCep(value) {
  return onlyDigits(value).length === 8;
}

function isDateAtLeastTwoYearsAgo(value) {
  if (!value) return false;

  const openedAt = new Date(`${value}T00:00:00`);
  if (Number.isNaN(openedAt.getTime())) {
    return false;
  }

  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setFullYear(threshold.getFullYear() - 2);

  return openedAt <= threshold;
}

function composeAddressFromCep(data) {
  return [data.logradouro, data.bairro, `${data.localidade} - ${data.uf}`]
    .map((item) => String(item || '').trim())
    .filter(Boolean)
    .join(', ');
}

async function lookupAddressByCep(value) {
  const cep = onlyDigits(value);
  if (cep.length !== 8) {
    return null;
  }

  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) {
    throw new Error('Falha ao consultar CEP.');
  }

  const payload = await response.json();
  if (payload?.erro) {
    return null;
  }

  return {
    cep: formatCepInput(payload.cep || cep),
    address: composeAddressFromCep(payload)
  };
}

const TOP_LEVEL_CURRENCY_FIELDS = new Set(['valorMensal', 'valorAtual', 'valorAluguel', 'condominio', 'iptu', 'agua', 'luz']);
const TOP_LEVEL_CEP_FIELDS = new Set(['cep', 'cepPernoite', 'cepImovel']);

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || '');
      const contentBase64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(contentBase64);
    };

    reader.onerror = () => reject(new Error('Falha ao ler arquivo.'));
    reader.readAsDataURL(file);
  });
}

function DetailField({ label, children, fullWidth = false }) {
  return (
    <label className={`intake-field ${fullWidth ? 'intake-field--full' : ''}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function ToggleGroup({ label, value, onChange, options }) {
  return (
    <div className="intake-field intake-field--full">
      <span>{label}</span>
      <div className="intake-toggle-row">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`intake-toggle ${value === option.value ? 'is-active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function FormSection({ title, tone = 'default', description, children }) {
  return (
    <section className={`intake-section intake-field--full intake-section--${tone}`}>
      <div className="intake-section-head">
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="premium-intake-grid premium-intake-grid--nested">{children}</div>
    </section>
  );
}

function buildDetailEntries(productSlug, form, attachments) {
  if (productSlug === 'seguro-fianca') {
    const fiancaTypeLabel =
      form.fiancaType === 'pf-comercial'
        ? 'Pessoa Física Comercial'
        : form.fiancaType === 'pj-mais-2-anos'
          ? 'Empresa com CNPJ acima de 2 anos'
          : 'Residencial';

    const baseEntries = [
      ['Tipo de análise', fiancaTypeLabel],
      ['Imobiliária', form.imobiliaria],
      ['CEP do imóvel a ser locado', form.cepImovel],
      ['Endereço do imóvel a ser locado', form.enderecoImovel],
      ['Valor do aluguel', form.valorAluguel],
      ['Condomínio', form.condominio],
      ['IPTU', form.iptu],
      ['Água (média)', form.agua],
      ['Luz (média)', form.luz],
      ['Multa por rescisão', form.multaRescisao],
      ['Danos ao imóvel', form.danosImovel],
      ['Pintura interna', form.pinturaInterna],
      ['Pintura externa', form.pinturaExterna],
      ['Observações', form.observacoes]
    ];

    const entries = [...baseEntries];

    if (form.fiancaType === 'pj-mais-2-anos') {
      const company = form.pjMaisDoisAnos;

      entries.push(['Motivo da locação', company.motivoLocacao]);
      entries.push(['CNPJ', company.cnpj]);
      entries.push(['Data de abertura do CNPJ', company.dataAberturaCnpj]);
      entries.push(['Capital social', company.capitalSocial]);
      entries.push(['Movimentação mensal', company.movimentacaoMensal]);
      entries.push(['Telefone', company.telefone]);
      entries.push(['E-mail', company.email]);
      entries.push(['CEP da sede social', company.cepSedeSocial]);
      entries.push(['Endereço da sede social', company.enderecoSedeSocial]);
    } else if (form.fiancaType === 'pf-comercial') {
      const applicant = form.pfComercial;

      entries.push(['Nome', applicant.nome]);
      entries.push(['CPF', applicant.cpf]);
      entries.push(['RG', applicant.rg]);
      entries.push(['Data de expedição', applicant.dataExpedicao]);
      entries.push(['Estado civil', applicant.estadoCivil]);
      entries.push(['CPF do cônjuge', applicant.cpfConjuge]);
      entries.push(['E-mail', applicant.email]);
      entries.push(['Telefone', applicant.telefone]);
      entries.push(['CEP do endereço atual da empresa', applicant.cepEnderecoAtualEmpresa]);
      entries.push(['Nome da empresa', applicant.nomeEmpresa]);
      entries.push(['Renda bruta', applicant.rendaBruta]);
      entries.push(['Profissão', applicant.profissao]);
      entries.push(['Há CNPJ aberto?', applicant.possuiCnpjAberto]);
      entries.push(['CNPJ', applicant.cnpj]);
      entries.push(['Motivo da locação', applicant.motivoLocacao]);
      entries.push(['Endereço atual da empresa', applicant.enderecoAtualEmpresa]);
      entries.push(['Ramo da atividade', applicant.ramoAtividade]);
      entries.push(['Trata-se de franquia?', applicant.trataSeFranquia]);
      entries.push(['Principais produtos ou serviços', applicant.principaisProdutosServicos]);
      entries.push(['Experiência no ramo', applicant.experienciaRamo]);
      entries.push(['Haverá sócios?', applicant.haveraSocios]);
      entries.push(['CPF dos sócios', applicant.cpfSocios]);
      entries.push(['Existem ônus em nome do proponente?', applicant.onusFinanceiros]);
    } else {
      form.pretendentes.forEach((pretendente, index) => {
        const prefix = `Pretendente ${index + 1}`;
        entries.push([`${prefix} - Nome`, pretendente.nome]);
        entries.push([`${prefix} - CPF`, pretendente.cpf]);
        entries.push([`${prefix} - CEP do endereço atual`, pretendente.cepAtual]);
        entries.push([`${prefix} - Data de nascimento`, pretendente.dataNascimento]);
        entries.push([`${prefix} - WhatsApp`, pretendente.whatsapp]);
        entries.push([`${prefix} - Telefone adicional`, pretendente.telefoneAdicional]);
        entries.push([`${prefix} - Estado civil`, pretendente.estadoCivil]);
        entries.push([`${prefix} - CPF do cônjuge`, pretendente.cpfConjuge]);
        entries.push([`${prefix} - E-mail`, pretendente.email]);
        entries.push([`${prefix} - Endereço atual`, pretendente.enderecoAtual]);
        entries.push([`${prefix} - Nome da empresa`, pretendente.nomeEmpresa]);
        entries.push([`${prefix} - Desde quando trabalha`, pretendente.desdeEmpresa]);
        entries.push([`${prefix} - Renda bruta mensal`, pretendente.rendaBruta]);
        entries.push([`${prefix} - Profissão`, pretendente.profissao]);
      });
    }

    attachments.forEach((file, index) => {
      entries.push([`Documento ${index + 1}`, file.name]);
    });

    return entries
      .filter(([, value]) => String(value || '').trim())
      .map(([label, value]) => ({ label, value: String(value).trim() }));
  }

  if (productSlug === 'plano-saude') {
    const entries = [
      ['Já tem plano ativo?', form.possuiPlanoAtivo || 'Não informado'],
      ['Quantidade de vidas', form.quantidadeVidas],
      ['Idades completas', form.idadesCompletas],
      ['CEP', form.cep],
      ['Hospital ou rede desejada', form.redeDesejada],
      ['Observações', form.observacoes]
    ];

    if (form.possuiPlanoAtivo === 'sim') {
      entries.push(['Operadora atual', form.operadoraAtual]);
      entries.push(['Valor mensal', form.valorMensal]);
      entries.push(['Motivo da troca', form.motivoTroca]);
    }

    attachments.forEach((file, index) => {
      entries.push([`Arquivo ${index + 1}`, file.name]);
    });

    return entries
      .filter(([, value]) => String(value || '').trim())
      .map(([label, value]) => ({ label, value: String(value).trim() }));
  }

  const entries = [
    ['É renovação?', form.renovacao === 'sim' ? 'Sim' : 'Não'],
    ['CPF do segurado', form.seguradoCpf],
    ['Nome do segurado', form.seguradoNome],
    ['Data de nascimento do segurado', form.seguradoDataNascimento],
    ['Sexo do segurado', form.seguradoSexo],
    ['Segurado possui nome social?', humanizeBoolean(form.seguradoPossuiNomeSocial)],
    ['Nome social do segurado', form.seguradoNomeSocial],
    ['Segurado é o condutor?', humanizeBoolean(form.seguradoECondutor)],
    ['CPF do condutor', form.seguradoECondutor === 'sim' ? form.seguradoCpf : form.condutorCpf],
    ['Nome do condutor', form.seguradoECondutor === 'sim' ? form.seguradoNome : form.condutorNome],
    ['Data de nascimento do condutor', form.seguradoECondutor === 'sim' ? form.seguradoDataNascimento : form.condutorDataNascimento],
    ['Sexo do condutor', form.seguradoECondutor === 'sim' ? form.seguradoSexo : form.condutorSexo],
    ['Condutor possui nome social?', form.seguradoECondutor === 'sim' ? humanizeBoolean(form.seguradoPossuiNomeSocial) : humanizeBoolean(form.condutorPossuiNomeSocial)],
    ['Nome social do condutor', form.seguradoECondutor === 'sim' ? form.seguradoNomeSocial : form.condutorNomeSocial],
    ['Já tem seguro ativo?', form.possuiSeguroAtivo || 'Não informado'],
    ['Veículo / modelo', form.veiculoModelo],
    ['Ano / modelo', form.anoModelo],
    ['Placa', form.placa],
    ['CEP de pernoite', form.cepPernoite],
    ['Idade do condutor principal', form.idadeCondutor],
    ['Uso do veículo', getUsageLabel(form.usoVeiculo)],
    ['Tipo de câmbio', AUTO_GEAR_OPTIONS.find((option) => option.value === form.tipoCambio)?.label || form.tipoCambio],
    ['Possui blindagem?', humanizeBoolean(form.possuiBlindagem)],
    ['Possui kit gás?', humanizeBoolean(form.possuiKitGas)],
    ['Pessoa com deficiência?', humanizeBoolean(form.pessoaComDeficiencia)],
    ['Dispositivos antifurto/anti-roubo', getDeviceLabels(form.dispositivosAntifurto)],
    ['Teve sinistro nos últimos 5 anos?', form.houveSinistro || 'Não informado'],
    ['Observações', form.observacoes]
  ];

  if (form.possuiSeguroAtivo === 'sim') {
    entries.push(['Seguradora atual', form.seguradoraAtual]);
    entries.push(['Classe de bônus', form.classeBonus]);
    entries.push(['Valor atual', form.valorAtual]);
  }

  attachments.forEach((file, index) => {
    entries.push([`Arquivo ${index + 1}`, file.name]);
  });

  return entries
    .filter(([, value]) => String(value || '').trim())
    .map(([label, value]) => ({ label, value: String(value).trim() }));
}

function getFiancaPrimaryContact(form) {
  if (form.fiancaType === 'pj-mais-2-anos') {
    return {
      nome: form.pjMaisDoisAnos.cnpj,
      whatsapp: form.pjMaisDoisAnos.telefone,
      email: form.pjMaisDoisAnos.email
    };
  }

  if (form.fiancaType === 'pf-comercial') {
    return {
      nome: form.pfComercial.nome,
      whatsapp: form.pfComercial.telefone,
      email: form.pfComercial.email
    };
  }

  const primaryPretendente = form.pretendentes[0] || {};
  return {
    nome: primaryPretendente.nome,
    whatsapp: primaryPretendente.whatsapp,
    email: primaryPretendente.email
  };
}

function getFiancaLeadType(form) {
  if (form.fiancaType === 'pj-mais-2-anos') {
    return 'fianca_pj_mais_2_anos_modal';
  }

  return form.fiancaType === 'pf-comercial' ? 'fianca_pf_comercial_modal' : 'fianca_residencial_modal';
}

function validateForm(productSlug, form, attachments = []) {
  if (productSlug === 'seguro-fianca') {
    if (!form.imobiliaria.trim()) return 'Informe a imobiliária.';
    if (form.cepImovel && !isCompleteCep(form.cepImovel)) return 'Informe um CEP válido para o imóvel.';
    if (!form.enderecoImovel.trim()) return 'Informe o endereço do imóvel a ser locado.';
    if (!form.valorAluguel.trim()) return 'Informe o valor do aluguel.';

    if (form.fiancaType === 'pj-mais-2-anos') {
      const company = form.pjMaisDoisAnos;
      if (!company.motivoLocacao.trim()) return 'Informe o motivo da locação.';
      if (!company.cnpj.trim()) return 'Informe o CNPJ.';
      if (!isValidCnpj(company.cnpj)) return 'Informe um CNPJ válido.';
      if (!company.dataAberturaCnpj) return 'Informe a data de abertura do CNPJ.';
      if (!isDateAtLeastTwoYearsAgo(company.dataAberturaCnpj)) {
        return 'O CNPJ precisa ter pelo menos 2 anos para essa análise.';
      }
      if (!company.capitalSocial.trim()) return 'Informe o capital social.';
      if (!company.movimentacaoMensal.trim()) return 'Informe a movimentação mensal.';

      const phone = normalizePhone(company.telefone);
      if (phone.length < 10 || phone.length > 13) return 'Informe um telefone válido.';

      if (!company.email.trim()) return 'Informe o e-mail.';
      if (company.cepSedeSocial && !isCompleteCep(company.cepSedeSocial)) {
        return 'Informe um CEP válido para a sede social.';
      }
      if (!company.enderecoSedeSocial.trim()) return 'Informe o endereço da sede social.';
      if (!form.pinturaExterna) return 'Informe se deseja pintura externa.';

      return '';
    }

    if (form.fiancaType === 'pf-comercial') {
      const applicant = form.pfComercial;
      if (!applicant.nome.trim()) return 'Informe o nome.';
      if (!applicant.cpf.trim()) return 'Informe o CPF.';
      if (!isValidCpf(applicant.cpf)) return 'Informe um CPF válido.';

      const phone = normalizePhone(applicant.telefone);
      if (phone.length < 10 || phone.length > 13) return 'Informe um telefone válido.';

      if (!applicant.email.trim()) return 'Informe o e-mail.';
      if (applicant.cepEnderecoAtualEmpresa && !isCompleteCep(applicant.cepEnderecoAtualEmpresa)) {
        return 'Informe um CEP válido para o endereço atual da empresa.';
      }
      if (!applicant.enderecoAtualEmpresa.trim()) return 'Informe o endereço atual da empresa.';
      if (!applicant.nomeEmpresa.trim()) return 'Informe o nome da empresa.';
      if (!applicant.rendaBruta.trim()) return 'Informe a renda bruta.';
      if (!applicant.profissao.trim()) return 'Informe a profissão.';
      if (!applicant.motivoLocacao.trim()) return 'Informe o motivo da locação.';
      if (!applicant.ramoAtividade.trim()) return 'Informe o ramo da atividade.';
      if (!applicant.principaisProdutosServicos.trim()) return 'Informe os principais produtos ou serviços.';
      if (!applicant.experienciaRamo.trim()) return 'Informe a experiência no ramo.';
      if (!applicant.possuiCnpjAberto) return 'Informe se há CNPJ aberto.';
      if (applicant.possuiCnpjAberto === 'sim' && !applicant.cnpj.trim()) return 'Informe o CNPJ.';
      if (!applicant.trataSeFranquia) return 'Informe se se trata de franquia.';
      if (!applicant.haveraSocios) return 'Informe se haverá sócios.';
      if (applicant.haveraSocios === 'sim' && !applicant.cpfSocios.trim()) return 'Informe o CPF dos sócios.';
      if (!applicant.onusFinanceiros) return 'Informe se existem ônus em nome do proponente.';
      if (applicant.estadoCivil === 'casado' && !applicant.cpfConjuge.trim()) {
        return 'Informe o CPF do cônjuge.';
      }
      if (applicant.estadoCivil === 'casado' && !isValidCpf(applicant.cpfConjuge)) {
        return 'Informe um CPF válido para o cônjuge.';
      }
      if (!form.pinturaExterna) return 'Informe se deseja pintura externa.';

      return '';
    }

    for (let index = 0; index < form.pretendentes.length; index += 1) {
      const pretendente = form.pretendentes[index];
      if (!pretendente.nome.trim()) return `Informe o nome do pretendente ${index + 1}.`;
      if (!pretendente.cpf.trim()) return `Informe o CPF do pretendente ${index + 1}.`;
      if (!isValidCpf(pretendente.cpf)) return `Informe um CPF válido para o pretendente ${index + 1}.`;
      if (pretendente.cepAtual && !isCompleteCep(pretendente.cepAtual)) {
        return `Informe um CEP válido para o endereço atual do pretendente ${index + 1}.`;
      }
      if (!pretendente.dataNascimento.trim()) return `Informe a data de nascimento do pretendente ${index + 1}.`;

      const phone = normalizePhone(pretendente.whatsapp);
      if (phone.length < 10 || phone.length > 13) return `Informe um WhatsApp válido para o pretendente ${index + 1}.`;

      if (!pretendente.email.trim()) return `Informe o e-mail do pretendente ${index + 1}.`;
      if (!pretendente.enderecoAtual.trim()) return `Informe o endereço atual do pretendente ${index + 1}.`;
      if (!pretendente.nomeEmpresa.trim()) return `Informe a empresa do pretendente ${index + 1}.`;
      if (!pretendente.desdeEmpresa.trim()) return `Informe desde quando o pretendente ${index + 1} trabalha na empresa.`;
      if (!pretendente.rendaBruta.trim()) return `Informe a renda bruta do pretendente ${index + 1}.`;
      if (!pretendente.profissao.trim()) return `Informe a profissão do pretendente ${index + 1}.`;

      if (pretendente.estadoCivil === 'casado' && !pretendente.cpfConjuge.trim()) {
        return `Informe o CPF do cônjuge do pretendente ${index + 1}.`;
      }
      if (pretendente.estadoCivil === 'casado' && !isValidCpf(pretendente.cpfConjuge)) {
        return `Informe um CPF válido para o cônjuge do pretendente ${index + 1}.`;
      }
    }

    if (!form.pinturaExterna) return 'Informe se deseja pintura externa.';
    return '';
  }

  if (!form.nome.trim()) return 'Informe seu nome.';

  const phone = normalizePhone(form.whatsapp);
  if (phone.length < 10 || phone.length > 13) return 'Informe um WhatsApp válido.';

  if (productSlug === 'plano-saude') {
    if (!form.possuiPlanoAtivo) return 'Informe se você já possui plano ativo.';
    if (!form.quantidadeVidas.trim()) return 'Informe quantas vidas serão incluídas.';
    if (!form.idadesCompletas.trim()) return 'Informe as idades completas.';
    if (!form.redeDesejada.trim()) return 'Informe o hospital ou rede desejada.';
    if (form.cep && !isCompleteCep(form.cep)) return 'Informe um CEP válido.';

    if (form.possuiPlanoAtivo === 'sim') {
      if (!form.operadoraAtual.trim()) return 'Informe a operadora atual.';
      if (!form.valorMensal.trim()) return 'Informe o valor mensal atual.';
      if (!form.motivoTroca.trim()) return 'Informe o motivo da troca.';
    }

    return '';
  }

  if (!form.veiculoModelo.trim()) return 'Informe o veículo ou modelo.';
  if (!form.seguradoCpf.trim()) return 'Informe o CPF do segurado.';
  if (!isValidCpf(form.seguradoCpf)) return 'Informe um CPF válido para o segurado.';
  if (!form.seguradoNome.trim()) return 'Informe o nome do segurado.';
  if (!form.seguradoDataNascimento) return 'Informe a data de nascimento do segurado.';
  if (!form.seguradoSexo) return 'Informe o sexo do segurado.';
  if (form.seguradoPossuiNomeSocial === 'sim' && !form.seguradoNomeSocial.trim()) {
    return 'Informe o nome social do segurado.';
  }
  if (!form.seguradoECondutor) return 'Informe se o segurado é o condutor.';
  if (form.seguradoECondutor === 'nao') {
    if (!form.condutorCpf.trim()) return 'Informe o CPF do condutor.';
    if (!isValidCpf(form.condutorCpf)) return 'Informe um CPF válido para o condutor.';
    if (!form.condutorNome.trim()) return 'Informe o nome do condutor.';
    if (!form.condutorDataNascimento) return 'Informe a data de nascimento do condutor.';
    if (!form.condutorSexo) return 'Informe o sexo do condutor.';
    if (form.condutorPossuiNomeSocial === 'sim' && !form.condutorNomeSocial.trim()) {
      return 'Informe o nome social do condutor.';
    }
  }
  if (!form.anoModelo.trim()) return 'Informe o ano/modelo.';
  if (!form.placa.trim()) return 'Informe a placa.';
  if (!isValidPlate(form.placa)) return 'Informe uma placa válida no padrão antigo ou Mercosul.';
  if (!form.cepPernoite.trim()) return 'Informe o CEP de pernoite.';
  if (!isCompleteCep(form.cepPernoite)) return 'Informe um CEP de pernoite válido.';
  if (!form.idadeCondutor.trim()) return 'Informe a idade do condutor principal.';
  if (!form.possuiSeguroAtivo) return 'Informe se você já possui seguro ativo.';
  if (form.renovacao === 'sim' && form.possuiSeguroAtivo !== 'sim') {
    return 'Na renovação, marque que já existe seguro ativo.';
  }
  if (!form.usoVeiculo) return 'Informe o tipo de uso do veículo.';
  if (!form.tipoCambio) return 'Informe o tipo de câmbio.';
  if (!form.possuiBlindagem) return 'Informe se o veículo possui blindagem.';
  if (!form.possuiKitGas) return 'Informe se o veículo possui kit gás.';
  if (!form.pessoaComDeficiencia) return 'Informe se existe pessoa com deficiência.';
  if (!form.dispositivosAntifurto.length) return 'Informe os dispositivos antifurto/anti-roubo do veículo.';
  if (form.renovacao === 'sim' && !attachments.length) return 'Na renovação, anexe a apólice em PDF ou imagem.';
  if (form.renovacao === 'sim' && !attachments.some(isPdfOrImageAttachment)) {
    return 'Na renovação, anexe pelo menos uma apólice em PDF ou imagem.';
  }

  return '';
}

function renderDynamicFields(productSlug, form, updateField, helpers = {}) {
  const { handleFiancaCepLookup, addressLookup = {} } = helpers;

  if (productSlug === 'seguro-fianca') {
    const updateFiancaPretendente = (index, field, value) => {
      const next = [...form.pretendentes];
      const formattedValue =
        field === 'cpf' || field === 'cpfConjuge'
          ? formatCpfInput(value)
          : field === 'cepAtual'
            ? formatCepInput(value)
            : field === 'rendaBruta'
              ? formatCurrencyInput(value)
              : value;
      next[index] = { ...next[index], [field]: formattedValue };
      updateField('pretendentes', next);
    };

    const updateFiancaPfField = (field, value) => {
      const formattedValue =
        field === 'cpf' || field === 'cpfConjuge'
          ? formatCpfInput(value)
          : field === 'cepEnderecoAtualEmpresa'
            ? formatCepInput(value)
            : field === 'rendaBruta'
              ? formatCurrencyInput(value)
              : value;

      updateField('pfComercial', { ...form.pfComercial, [field]: formattedValue });
    };

    const updateFiancaPjField = (field, value) => {
      const formattedValue =
        field === 'cnpj'
          ? formatCnpjInput(value)
          : field === 'cepSedeSocial'
            ? formatCepInput(value)
            : field === 'capitalSocial' || field === 'movimentacaoMensal'
              ? formatCurrencyInput(value)
              : value;

      updateField('pjMaisDoisAnos', { ...form.pjMaisDoisAnos, [field]: formattedValue });
    };

    return (
      <>
        <ToggleGroup
          label="Tipo de análise"
          value={form.fiancaType}
          onChange={(value) => updateField('fiancaType', value)}
          options={[
            { label: 'Residencial', value: 'residencial' },
            { label: 'PF Comercial', value: 'pf-comercial' },
            { label: 'PJ +2 anos', value: 'pj-mais-2-anos' }
          ]}
        />

        <DetailField label="Imobiliária" fullWidth>
          <input value={form.imobiliaria} onChange={(event) => updateField('imobiliaria', event.target.value)} />
        </DetailField>

        {form.fiancaType === 'residencial' ? (
          <div className="intake-field intake-field--full">
            <div className="premium-intake-repeater-head">
              <span>Pretendentes</span>
              <button
                type="button"
                className="btn btn-ghost premium-intake-mini-btn"
                onClick={() => {
                  if (form.pretendentes.length >= 4) return;
                  updateField('pretendentes', [...form.pretendentes, createFiancaPretendente()]);
                }}
              >
                + Adicionar pretendente
              </button>
            </div>

            <div className="premium-intake-applicants">
              {form.pretendentes.map((pretendente, index) => (
                <div
                  key={`pretendente-${index + 1}`}
                  className={`premium-intake-applicant-card premium-intake-applicant-card--tone-${(index % 4) + 1}`}
                >
                  <div className="premium-intake-applicant-head">
                    <strong>Pretendente {index + 1}</strong>
                    {index > 0 ? (
                      <button
                        type="button"
                        className="premium-intake-remove-btn"
                        onClick={() =>
                          updateField(
                            'pretendentes',
                            form.pretendentes.filter((_, currentIndex) => currentIndex !== index)
                          )
                        }
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>

                  <FormSection title="Dados pessoais" tone="personal" description="Informações de identificação e contato.">
                    <DetailField label="Nome">
                      <input value={pretendente.nome} onChange={(event) => updateFiancaPretendente(index, 'nome', event.target.value)} />
                    </DetailField>
                    <DetailField label="CPF">
                      <input value={pretendente.cpf} onChange={(event) => updateFiancaPretendente(index, 'cpf', event.target.value)} />
                    </DetailField>
                    <DetailField label="Data de nascimento">
                      <input
                        type="date"
                        value={pretendente.dataNascimento}
                        onChange={(event) => updateFiancaPretendente(index, 'dataNascimento', event.target.value)}
                      />
                    </DetailField>
                    <DetailField label="WhatsApp">
                      <input value={pretendente.whatsapp} onChange={(event) => updateFiancaPretendente(index, 'whatsapp', event.target.value)} />
                    </DetailField>
                    <DetailField label="Telefone adicional">
                      <input
                        value={pretendente.telefoneAdicional}
                        onChange={(event) => updateFiancaPretendente(index, 'telefoneAdicional', event.target.value)}
                      />
                    </DetailField>
                    <DetailField label="Estado civil">
                      <select
                        value={pretendente.estadoCivil}
                        onChange={(event) => updateFiancaPretendente(index, 'estadoCivil', event.target.value)}
                      >
                        <option value="">Selecione</option>
                        <option value="solteiro">Solteiro</option>
                        <option value="casado">Casado</option>
                        <option value="divorciado">Divorciado</option>
                        <option value="viuvo">Viúvo</option>
                      </select>
                    </DetailField>
                    {pretendente.estadoCivil === 'casado' ? (
                      <DetailField label="CPF do cônjuge">
                        <input
                          value={pretendente.cpfConjuge}
                          onChange={(event) => updateFiancaPretendente(index, 'cpfConjuge', event.target.value)}
                        />
                      </DetailField>
                    ) : null}
                    <DetailField label="E-mail">
                      <input value={pretendente.email} onChange={(event) => updateFiancaPretendente(index, 'email', event.target.value)} />
                    </DetailField>
                    <DetailField label="CEP do endereço atual">
                      <>
                        <input
                          value={pretendente.cepAtual}
                          onChange={(event) => handleFiancaCepLookup?.('applicant', event.target.value, index)}
                        />
                        {addressLookup[`fianca-applicant-${index}`] ? (
                          <small className="intake-helper">{addressLookup[`fianca-applicant-${index}`]}</small>
                        ) : null}
                      </>
                    </DetailField>
                    <DetailField label="Endereço atual" fullWidth>
                      <textarea
                        className="intake-address"
                        rows="2"
                        value={pretendente.enderecoAtual}
                        onChange={(event) => updateFiancaPretendente(index, 'enderecoAtual', event.target.value)}
                      />
                    </DetailField>
                  </FormSection>

                  <FormSection title="Dados profissionais" tone="professional" description="Base de renda e vínculo profissional do pretendente.">
                    <DetailField label="Nome da empresa">
                      <input
                        value={pretendente.nomeEmpresa}
                        onChange={(event) => updateFiancaPretendente(index, 'nomeEmpresa', event.target.value)}
                      />
                    </DetailField>
                    <DetailField label="Desde quando trabalha na empresa">
                      <input
                        value={pretendente.desdeEmpresa}
                        onChange={(event) => updateFiancaPretendente(index, 'desdeEmpresa', event.target.value)}
                      />
                    </DetailField>
                    <DetailField label="Renda bruta mensal">
                      <input
                        value={pretendente.rendaBruta}
                        onChange={(event) => updateFiancaPretendente(index, 'rendaBruta', event.target.value)}
                      />
                    </DetailField>
                    <DetailField label="Profissão">
                      <input value={pretendente.profissao} onChange={(event) => updateFiancaPretendente(index, 'profissao', event.target.value)} />
                    </DetailField>
                  </FormSection>
                </div>
              ))}
            </div>
          </div>
        ) : form.fiancaType === 'pf-comercial' ? (
          <div className="premium-intake-applicant-card intake-field--full">
            <div className="premium-intake-applicant-head">
              <strong>Proponente da análise PF Comercial</strong>
            </div>

            <div className="premium-intake-grid premium-intake-grid--nested">
              <FormSection title="Dados pessoais" tone="personal" description="Identificação do proponente e contato principal.">
                <DetailField label="Nome">
                  <input value={form.pfComercial.nome} onChange={(event) => updateFiancaPfField('nome', event.target.value)} />
                </DetailField>
                <DetailField label="CPF">
                  <input value={form.pfComercial.cpf} onChange={(event) => updateFiancaPfField('cpf', event.target.value)} />
                </DetailField>
                <DetailField label="RG">
                  <input value={form.pfComercial.rg} onChange={(event) => updateFiancaPfField('rg', event.target.value)} />
                </DetailField>
                <DetailField label="Data de expedição">
                  <input
                    value={form.pfComercial.dataExpedicao}
                    onChange={(event) => updateFiancaPfField('dataExpedicao', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Estado civil">
                  <select
                    value={form.pfComercial.estadoCivil}
                    onChange={(event) => updateFiancaPfField('estadoCivil', event.target.value)}
                  >
                    <option value="">Selecione</option>
                    <option value="solteiro">Solteiro</option>
                    <option value="casado">Casado</option>
                    <option value="divorciado">Divorciado</option>
                    <option value="viuvo">Viúvo</option>
                  </select>
                </DetailField>
                {form.pfComercial.estadoCivil === 'casado' ? (
                  <DetailField label="CPF do cônjuge">
                    <input
                      value={form.pfComercial.cpfConjuge}
                      onChange={(event) => updateFiancaPfField('cpfConjuge', event.target.value)}
                    />
                  </DetailField>
                ) : null}
                <DetailField label="E-mail">
                  <input value={form.pfComercial.email} onChange={(event) => updateFiancaPfField('email', event.target.value)} />
                </DetailField>
                <DetailField label="Telefone">
                  <input value={form.pfComercial.telefone} onChange={(event) => updateFiancaPfField('telefone', event.target.value)} />
                </DetailField>
              </FormSection>

              <FormSection title="Dados profissionais" tone="professional" description="Informações de empresa, renda e ocupação.">
                <DetailField label="CEP do endereço atual da empresa">
                  <>
                    <input
                      value={form.pfComercial.cepEnderecoAtualEmpresa}
                      onChange={(event) => handleFiancaCepLookup?.('company', event.target.value)}
                    />
                    {addressLookup['fianca-company'] ? <small className="intake-helper">{addressLookup['fianca-company']}</small> : null}
                  </>
                </DetailField>
                <DetailField label="Nome da empresa">
                  <input
                    value={form.pfComercial.nomeEmpresa}
                    onChange={(event) => updateFiancaPfField('nomeEmpresa', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Renda bruta">
                  <input
                    value={form.pfComercial.rendaBruta}
                    onChange={(event) => updateFiancaPfField('rendaBruta', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Profissão">
                  <input value={form.pfComercial.profissao} onChange={(event) => updateFiancaPfField('profissao', event.target.value)} />
                </DetailField>
                <DetailField label="Endereço atual da empresa" fullWidth>
                  <textarea
                    className="intake-address"
                    rows="2"
                    value={form.pfComercial.enderecoAtualEmpresa}
                    onChange={(event) => updateFiancaPfField('enderecoAtualEmpresa', event.target.value)}
                  />
                </DetailField>
              </FormSection>

              <FormSection title="Informações sobre o negócio" tone="property" description="Contexto da locação comercial e enquadramento da operação.">
                <ToggleGroup
                  label="Há CNPJ aberto?"
                  value={form.pfComercial.possuiCnpjAberto}
                  onChange={(value) => updateFiancaPfField('possuiCnpjAberto', value)}
                  options={[
                    { label: 'Sim', value: 'sim' },
                    { label: 'Não', value: 'nao' }
                  ]}
                />
                {form.pfComercial.possuiCnpjAberto === 'sim' ? (
                  <DetailField label="CNPJ">
                    <input value={form.pfComercial.cnpj} onChange={(event) => updateFiancaPfField('cnpj', event.target.value)} />
                  </DetailField>
                ) : null}
                <DetailField label="Motivo da locação" fullWidth>
                  <textarea
                    rows="3"
                    value={form.pfComercial.motivoLocacao}
                    onChange={(event) => updateFiancaPfField('motivoLocacao', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Ramo da atividade" fullWidth>
                  <textarea
                    rows="3"
                    value={form.pfComercial.ramoAtividade}
                    onChange={(event) => updateFiancaPfField('ramoAtividade', event.target.value)}
                  />
                </DetailField>
                <ToggleGroup
                  label="Trata-se de franquia?"
                  value={form.pfComercial.trataSeFranquia}
                  onChange={(value) => updateFiancaPfField('trataSeFranquia', value)}
                  options={[
                    { label: 'Não', value: 'nao' },
                    { label: 'Sim', value: 'sim' }
                  ]}
                />
                <DetailField label="Principais produtos ou serviços" fullWidth>
                  <textarea
                    rows="3"
                    value={form.pfComercial.principaisProdutosServicos}
                    onChange={(event) => updateFiancaPfField('principaisProdutosServicos', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Experiência no ramo" fullWidth>
                  <textarea
                    rows="3"
                    value={form.pfComercial.experienciaRamo}
                    onChange={(event) => updateFiancaPfField('experienciaRamo', event.target.value)}
                  />
                </DetailField>
                <ToggleGroup
                  label="Haverá sócios?"
                  value={form.pfComercial.haveraSocios}
                  onChange={(value) => updateFiancaPfField('haveraSocios', value)}
                  options={[
                    { label: 'Não', value: 'nao' },
                    { label: 'Sim', value: 'sim' }
                  ]}
                />
                {form.pfComercial.haveraSocios === 'sim' ? (
                  <DetailField label="CPF dos sócios" fullWidth>
                    <textarea
                      rows="3"
                      value={form.pfComercial.cpfSocios}
                      onChange={(event) => updateFiancaPfField('cpfSocios', event.target.value)}
                    />
                  </DetailField>
                ) : null}
                <ToggleGroup
                  label="Existem ônus em seu nome?"
                  value={form.pfComercial.onusFinanceiros}
                  onChange={(value) => updateFiancaPfField('onusFinanceiros', value)}
                  options={[
                    { label: 'Não', value: 'nao' },
                    { label: 'Sim', value: 'sim' }
                  ]}
                />
              </FormSection>
            </div>
          </div>
        ) : (
          <div className="premium-intake-applicant-card intake-field--full">
            <div className="premium-intake-applicant-head">
              <strong>Empresa com CNPJ acima de 2 anos</strong>
            </div>

            <div className="premium-intake-grid premium-intake-grid--nested">
              <FormSection title="Dados da empresa" tone="professional" description="Requisitos para empresas com CNPJ ativo há mais de 2 anos.">
                <DetailField label="Motivo da locação" fullWidth>
                  <textarea
                    rows="3"
                    value={form.pjMaisDoisAnos.motivoLocacao}
                    onChange={(event) => updateFiancaPjField('motivoLocacao', event.target.value)}
                  />
                </DetailField>
                <DetailField label="CNPJ">
                  <input value={form.pjMaisDoisAnos.cnpj} onChange={(event) => updateFiancaPjField('cnpj', event.target.value)} />
                </DetailField>
                <DetailField label="Data de abertura do CNPJ">
                  <input
                    type="date"
                    value={form.pjMaisDoisAnos.dataAberturaCnpj}
                    onChange={(event) => updateFiancaPjField('dataAberturaCnpj', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Capital social">
                  <input
                    value={form.pjMaisDoisAnos.capitalSocial}
                    onChange={(event) => updateFiancaPjField('capitalSocial', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Movimentação mensal">
                  <input
                    value={form.pjMaisDoisAnos.movimentacaoMensal}
                    onChange={(event) => updateFiancaPjField('movimentacaoMensal', event.target.value)}
                  />
                </DetailField>
                <DetailField label="Fone (DDD)">
                  <input
                    value={form.pjMaisDoisAnos.telefone}
                    onChange={(event) => updateFiancaPjField('telefone', event.target.value)}
                  />
                </DetailField>
                <DetailField label="E-mail">
                  <input value={form.pjMaisDoisAnos.email} onChange={(event) => updateFiancaPjField('email', event.target.value)} />
                </DetailField>
                <DetailField label="CEP da sede social">
                  <>
                    <input
                      value={form.pjMaisDoisAnos.cepSedeSocial}
                      onChange={(event) => handleFiancaCepLookup?.('pj-headquarters', event.target.value)}
                    />
                    {addressLookup['fianca-pj-headquarters'] ? (
                      <small className="intake-helper">{addressLookup['fianca-pj-headquarters']}</small>
                    ) : null}
                  </>
                </DetailField>
                <DetailField label="Endereço da sede social" fullWidth>
                  <textarea
                    className="intake-address"
                    rows="2"
                    value={form.pjMaisDoisAnos.enderecoSedeSocial}
                    onChange={(event) => updateFiancaPjField('enderecoSedeSocial', event.target.value)}
                  />
                </DetailField>
              </FormSection>
            </div>
          </div>
        )}

        <FormSection title="Dados do imóvel" tone="property" description="Informações da locação e endereço do imóvel.">
          <DetailField label="CEP do imóvel a ser locado">
            <>
              <input value={form.cepImovel} onChange={(event) => handleFiancaCepLookup?.('property', event.target.value)} />
              {addressLookup['fianca-property'] ? <small className="intake-helper">{addressLookup['fianca-property']}</small> : null}
            </>
          </DetailField>
          <DetailField label="Endereço do imóvel a ser locado" fullWidth>
            <textarea
              className="intake-address"
              rows="2"
              value={form.enderecoImovel}
              onChange={(event) => updateField('enderecoImovel', event.target.value)}
            />
          </DetailField>
          <DetailField label="Valor do aluguel">
            <input value={form.valorAluguel} onChange={(event) => updateField('valorAluguel', event.target.value)} />
          </DetailField>
          <DetailField label="Condomínio">
            <input value={form.condominio} onChange={(event) => updateField('condominio', event.target.value)} />
          </DetailField>
          <DetailField label="IPTU">
            <input value={form.iptu} onChange={(event) => updateField('iptu', event.target.value)} />
          </DetailField>
          <DetailField label="Água (média)">
            <input value={form.agua} onChange={(event) => updateField('agua', event.target.value)} />
          </DetailField>
          <DetailField label="Luz (média)">
            <input value={form.luz} onChange={(event) => updateField('luz', event.target.value)} />
          </DetailField>
        </FormSection>

        <FormSection title="Coberturas locatícias" tone="coverage" description="Defina o pacote de encargos e proteções desejadas.">
          <DetailField label="Multa por rescisão">
            <select value={form.multaRescisao} onChange={(event) => updateField('multaRescisao', event.target.value)}>
              <option value="">Selecione</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </DetailField>
          <DetailField label="Danos ao imóvel">
            <select value={form.danosImovel} onChange={(event) => updateField('danosImovel', event.target.value)}>
              <option value="">Selecione</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </DetailField>
          <DetailField label="Pintura interna">
            <select value={form.pinturaInterna} onChange={(event) => updateField('pinturaInterna', event.target.value)}>
              <option value="">Selecione</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </DetailField>
          <DetailField label="Pintura externa">
            <select value={form.pinturaExterna} onChange={(event) => updateField('pinturaExterna', event.target.value)}>
              <option value="">Selecione</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
          </DetailField>
        </FormSection>
      </>
    );
  }

  if (productSlug === 'plano-saude') {
    return (
      <>
        <FormSection title="Cenário atual" tone="personal" description="Entenda se já existe plano ativo e como está a situação atual.">
          <ToggleGroup
            label="Já tem plano ativo?"
            value={form.possuiPlanoAtivo}
            onChange={(value) => updateField('possuiPlanoAtivo', value)}
            options={[
              { label: 'Sim', value: 'sim' },
              { label: 'Não', value: 'nao' }
            ]}
          />

          {form.possuiPlanoAtivo === 'sim' ? (
            <>
              <DetailField label="Qual operadora atual?">
                <input value={form.operadoraAtual} onChange={(event) => updateField('operadoraAtual', event.target.value)} />
              </DetailField>
              <DetailField label="Qual valor paga mensalmente?">
                <input value={form.valorMensal} onChange={(event) => updateField('valorMensal', formatCurrencyInput(event.target.value))} />
              </DetailField>
              <DetailField label="Qual o motivo da troca?" fullWidth>
                <textarea rows="4" value={form.motivoTroca} onChange={(event) => updateField('motivoTroca', event.target.value)} />
              </DetailField>
            </>
          ) : null}
        </FormSection>

        <FormSection title="Dados do grupo" tone="professional" description="Esses dados são obrigatórios para montar a proposta certa.">
          <DetailField label="Quantas vidas?">
            <input value={form.quantidadeVidas} onChange={(event) => updateField('quantidadeVidas', event.target.value)} />
          </DetailField>
          <DetailField label="CEP">
            <input value={form.cep} onChange={(event) => updateField('cep', formatCepInput(event.target.value))} />
          </DetailField>
          <DetailField label="Idades completas de todos" fullWidth>
            <textarea
              rows="4"
              value={form.idadesCompletas}
              onChange={(event) => updateField('idadesCompletas', event.target.value)}
              placeholder="Ex.: Titular 38, cônjuge 36, filho 8"
            />
          </DetailField>
        </FormSection>

        <FormSection title="Rede desejada" tone="professional" description="Essa é a informação mais estratégica para montar a proposta.">
          <DetailField label="Qual hospital ou rede gostaria de atendimento?" fullWidth>
            <textarea rows="4" value={form.redeDesejada} onChange={(event) => updateField('redeDesejada', event.target.value)} />
          </DetailField>
        </FormSection>
      </>
    );
  }

  return (
    <>
      <FormSection title="Dados do segurado" tone="personal" description="Informações cadastrais da pessoa segurada.">
        <DetailField label="CPF do segurado">
          <input value={form.seguradoCpf} onChange={(event) => updateField('seguradoCpf', formatCpfInput(event.target.value))} />
        </DetailField>
        <DetailField label="Nome do segurado">
          <input value={form.seguradoNome} onChange={(event) => updateField('seguradoNome', event.target.value)} />
        </DetailField>
        <DetailField label="Data de nascimento">
          <input
            type="date"
            value={form.seguradoDataNascimento}
            onChange={(event) => updateField('seguradoDataNascimento', event.target.value)}
          />
        </DetailField>
        <DetailField label="Sexo">
          <select value={form.seguradoSexo} onChange={(event) => updateField('seguradoSexo', event.target.value)}>
            {AUTO_SEX_OPTIONS.map((option) => (
              <option key={option.value || 'empty'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DetailField>
        <ToggleGroup
          label="Cliente possui nome social?"
          value={form.seguradoPossuiNomeSocial}
          onChange={(value) => updateField('seguradoPossuiNomeSocial', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />
        {form.seguradoPossuiNomeSocial === 'sim' ? (
          <DetailField label="Nome social do segurado" fullWidth>
            <input value={form.seguradoNomeSocial} onChange={(event) => updateField('seguradoNomeSocial', event.target.value)} />
          </DetailField>
        ) : null}
      </FormSection>

      <FormSection title="Dados do condutor" tone="personal" description="Defina se o segurado também é o principal condutor.">
        <ToggleGroup
          label="Segurado é o condutor?"
          value={form.seguradoECondutor}
          onChange={(value) => updateField('seguradoECondutor', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />

        {form.seguradoECondutor === 'nao' ? (
          <>
            <DetailField label="CPF do condutor">
              <input value={form.condutorCpf} onChange={(event) => updateField('condutorCpf', formatCpfInput(event.target.value))} />
            </DetailField>
            <DetailField label="Nome do condutor">
              <input value={form.condutorNome} onChange={(event) => updateField('condutorNome', event.target.value)} />
            </DetailField>
            <DetailField label="Data de nascimento">
              <input
                type="date"
                value={form.condutorDataNascimento}
                onChange={(event) => updateField('condutorDataNascimento', event.target.value)}
              />
            </DetailField>
            <DetailField label="Sexo">
              <select value={form.condutorSexo} onChange={(event) => updateField('condutorSexo', event.target.value)}>
                {AUTO_SEX_OPTIONS.map((option) => (
                  <option key={`condutor-${option.value || 'empty'}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </DetailField>
            <ToggleGroup
              label="Condutor possui nome social?"
              value={form.condutorPossuiNomeSocial}
              onChange={(value) => updateField('condutorPossuiNomeSocial', value)}
              options={[
                { label: 'Sim', value: 'sim' },
                { label: 'Não', value: 'nao' }
              ]}
            />
            {form.condutorPossuiNomeSocial === 'sim' ? (
              <DetailField label="Nome social do condutor" fullWidth>
                <input value={form.condutorNomeSocial} onChange={(event) => updateField('condutorNomeSocial', event.target.value)} />
              </DetailField>
            ) : null}
          </>
        ) : (
          <div className="intake-field intake-field--full">
            <small className="intake-helper">
              Como o segurado é o condutor, usaremos os mesmos dados informados acima para a análise.
            </small>
          </div>
        )}
      </FormSection>

      <FormSection title="Seguro atual" tone="personal" description="Dados da apólice atual para posicionar melhor a nova cotação.">
        <ToggleGroup
          label="É renovação?"
          value={form.renovacao}
          onChange={(value) => {
            updateField('renovacao', value);
            if (value === 'sim') {
              updateField('possuiSeguroAtivo', 'sim');
            }
          }}
          options={[
            { label: 'Não', value: 'nao' },
            { label: 'Sim', value: 'sim' }
          ]}
        />
        <ToggleGroup
          label="Já tem seguro ativo?"
          value={form.possuiSeguroAtivo}
          onChange={(value) => updateField('possuiSeguroAtivo', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />

        {form.possuiSeguroAtivo === 'sim' ? (
          <>
            <DetailField label="Seguradora atual">
              <input value={form.seguradoraAtual} onChange={(event) => updateField('seguradoraAtual', event.target.value)} />
            </DetailField>
            <DetailField label="Classe de bônus">
              <input value={form.classeBonus} onChange={(event) => updateField('classeBonus', event.target.value)} />
            </DetailField>
            <DetailField label="Valor atual">
              <input value={form.valorAtual} onChange={(event) => updateField('valorAtual', formatCurrencyInput(event.target.value))} />
            </DetailField>
            {form.renovacao === 'sim' ? (
              <div className="intake-field intake-field--full">
                <small className="intake-helper">
                  Para renovação, a apólice atual em PDF ou imagem é obrigatória.
                </small>
              </div>
            ) : null}
          </>
        ) : null}
      </FormSection>

      <FormSection title="Veículo e uso" tone="professional" description="Informações principais do carro e do perfil de utilização.">
        <DetailField label="Veículo / modelo">
          <>
            <input
              list="hs-vehicle-options"
              value={form.veiculoModelo}
              onChange={(event) => updateField('veiculoModelo', event.target.value)}
              placeholder="Digite marca ou modelo"
            />
            <small className="intake-helper">Comece digitando que o sistema sugere veículos da base interna.</small>
            <datalist id="hs-vehicle-options">
              {VEHICLE_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </>
        </DetailField>
        <DetailField label="Ano / modelo">
          <input value={form.anoModelo} onChange={(event) => updateField('anoModelo', event.target.value)} />
        </DetailField>
        <DetailField label="Placa">
          <>
            <input
              value={form.placa}
              onChange={(event) => updateField('placa', formatPlateInput(event.target.value))}
              placeholder="ABC-1234 ou ABC1D23"
            />
            <small className="intake-helper">
              A placa é validada nos padrões antigo e Mercosul. Busca automática do modelo por placa fica pronta para integração externa.
            </small>
          </>
        </DetailField>
        <DetailField label="CEP de pernoite">
          <input value={form.cepPernoite} onChange={(event) => updateField('cepPernoite', formatCepInput(event.target.value))} />
        </DetailField>
        <DetailField label="Idade do condutor principal">
          <input value={form.idadeCondutor} onChange={(event) => updateField('idadeCondutor', event.target.value)} />
        </DetailField>
        <DetailField label="Uso principal do veículo">
          <select value={form.usoVeiculo} onChange={(event) => updateField('usoVeiculo', event.target.value)}>
            {AUTO_USAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </DetailField>
      </FormSection>

      <FormSection title="Características do veículo" tone="property" description="Campos adicionais do veículo que impactam a cotação.">
        <ToggleGroup
          label="Tipo de câmbio"
          value={form.tipoCambio}
          onChange={(value) => updateField('tipoCambio', value)}
          options={AUTO_GEAR_OPTIONS}
        />
        <ToggleGroup
          label="Possui blindagem"
          value={form.possuiBlindagem}
          onChange={(value) => updateField('possuiBlindagem', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />
        <ToggleGroup
          label="Possui kit gás"
          value={form.possuiKitGas}
          onChange={(value) => updateField('possuiKitGas', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />
        <ToggleGroup
          label="Pessoa com deficiência"
          value={form.pessoaComDeficiencia}
          onChange={(value) => updateField('pessoaComDeficiencia', value)}
          options={[
            { label: 'Sim', value: 'sim' },
            { label: 'Não', value: 'nao' }
          ]}
        />
      </FormSection>

      <FormSection title="Dispositivos antifurto/anti-roubo" tone="coverage" description="Selecione um ou mais dispositivos instalados no veículo.">
        <div className="intake-field intake-field--full">
          <span>Possui um ou mais dispositivos abaixo?</span>
          <div className="intake-toggle-row">
            {AUTO_DEVICE_OPTIONS.map((option) => {
              const isActive = form.dispositivosAntifurto.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`intake-toggle ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    const exclusiveValues = ['nao', 'nao-informado'];
                    const currentlySelected = form.dispositivosAntifurto;

                    if (exclusiveValues.includes(option.value)) {
                      updateField('dispositivosAntifurto', isActive ? [] : [option.value]);
                      return;
                    }

                    const sanitized = currentlySelected.filter((value) => !exclusiveValues.includes(value));
                    const nextValues = isActive
                      ? sanitized.filter((value) => value !== option.value)
                      : [...sanitized, option.value];

                    updateField('dispositivosAntifurto', nextValues);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </FormSection>

      <FormSection title="Histórico de risco" tone="coverage" description="Último ponto para leitura comercial da cotação.">
        <ToggleGroup
          label="Teve sinistro nos últimos 5 anos?"
          value={form.houveSinistro}
          onChange={(value) => updateField('houveSinistro', value)}
          options={[
            { label: 'Não', value: 'nao' },
            { label: 'Sim', value: 'sim' }
          ]}
        />
      </FormSection>
    </>
  );
}

export function PremiumLeadCapture({ product, mode = 'inline' }) {
  const config = useMemo(() => CONFIGS[product.slug], [product.slug]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [addressLookup, setAddressLookup] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [form, setForm] = useState(() => initialForm(product.slug));

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!config) {
    return null;
  }

  function updateField(field, value) {
    const nextValue = TOP_LEVEL_CURRENCY_FIELDS.has(field)
      ? formatCurrencyInput(value)
      : TOP_LEVEL_CEP_FIELDS.has(field)
        ? formatCepInput(value)
        : value;

    setForm((current) => ({ ...current, [field]: nextValue }));
  }

  function setAddressLookupMessage(key, message) {
    setAddressLookup((current) => ({
      ...current,
      [key]: message
    }));
  }

  async function handleFiancaCepLookup(target, rawValue, index = null) {
    const formattedCep = formatCepInput(rawValue);

    if (target === 'property') {
      setForm((current) => ({ ...current, cepImovel: formattedCep }));
    }

    if (target === 'company') {
      setForm((current) => ({
        ...current,
        pfComercial: {
          ...current.pfComercial,
          cepEnderecoAtualEmpresa: formattedCep
        }
      }));
    }

    if (target === 'pj-headquarters') {
      setForm((current) => ({
        ...current,
        pjMaisDoisAnos: {
          ...current.pjMaisDoisAnos,
          cepSedeSocial: formattedCep
        }
      }));
    }

    if (target === 'applicant' && index !== null) {
      setForm((current) => {
        const nextApplicants = [...current.pretendentes];
        nextApplicants[index] = {
          ...nextApplicants[index],
          cepAtual: formattedCep
        };

        return {
          ...current,
          pretendentes: nextApplicants
        };
      });
    }

    const lookupKey =
      target === 'property'
        ? 'fianca-property'
        : target === 'company'
          ? 'fianca-company'
          : target === 'pj-headquarters'
            ? 'fianca-pj-headquarters'
          : `fianca-applicant-${index}`;

    if (!isCompleteCep(formattedCep)) {
      setAddressLookupMessage(lookupKey, '');
      return;
    }

    setAddressLookupMessage(lookupKey, 'Buscando endereço pelo CEP...');

    try {
      const result = await lookupAddressByCep(formattedCep);

      if (!result?.address) {
        setAddressLookupMessage(lookupKey, 'CEP não encontrado. Preencha o endereço manualmente.');
        return;
      }

      setForm((current) => {
        if (target === 'property') {
          return {
            ...current,
            cepImovel: result.cep,
            enderecoImovel: result.address
          };
        }

        if (target === 'company') {
          return {
            ...current,
            pfComercial: {
              ...current.pfComercial,
              cepEnderecoAtualEmpresa: result.cep,
              enderecoAtualEmpresa: result.address
            }
          };
        }

        if (target === 'pj-headquarters') {
          return {
            ...current,
            pjMaisDoisAnos: {
              ...current.pjMaisDoisAnos,
              cepSedeSocial: result.cep,
              enderecoSedeSocial: result.address
            }
          };
        }

        if (target === 'applicant' && index !== null) {
          const nextApplicants = [...current.pretendentes];
          nextApplicants[index] = {
            ...nextApplicants[index],
            cepAtual: result.cep,
            enderecoAtual: result.address
          };

          return {
            ...current,
            pretendentes: nextApplicants
          };
        }

        return current;
      });

      setAddressLookupMessage(lookupKey, 'Endereço base preenchido automaticamente. Complete número e complemento se necessário.');
    } catch {
      setAddressLookupMessage(lookupKey, 'Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
    }
  }

  async function handleAttachmentChange(event) {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) {
      return;
    }

    try {
      const nextFiles = [];

      for (const file of selectedFiles) {
        if (file.size > MAX_ATTACHMENT_BYTES) {
          setFeedback(`O arquivo ${file.name} deve ter no máximo 5 MB.`);
          event.target.value = '';
          return;
        }

        if (product.slug === 'seguro-auto' && !isPdfOrImageAttachment(file)) {
          setFeedback(`No Seguro Auto, envie apenas PDF ou imagem. O arquivo ${file.name} não é válido.`);
          event.target.value = '';
          return;
        }

        const contentBase64 = await readFileAsBase64(file);
        nextFiles.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          contentBase64
        });
      }

      setAttachments((current) => [...current, ...nextFiles]);
      setFeedback('');
    } catch {
      setFeedback('Não foi possível ler o arquivo selecionado.');
    }

    event.target.value = '';
  }

  function removeAttachment(index) {
    setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateForm(product.slug, form, attachments);
    if (validationError) {
      setFeedback(validationError);
      return;
    }

    setBusy(true);
    setFeedback('Enviando suas informações...');

    const detailEntries = buildDetailEntries(product.slug, form, attachments);
    const clickId = newClickId(product.slug);
    const sessionId = getOrCreateSessionId();
    const attr = getAttribution();
    const fiancaPrimaryContact = product.slug === 'seguro-fianca' ? getFiancaPrimaryContact(form) : null;

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: product.slug === 'seguro-fianca' ? fiancaPrimaryContact?.nome : form.nome,
          whatsapp: product.slug === 'seguro-fianca' ? fiancaPrimaryContact?.whatsapp : form.whatsapp,
          email: product.slug === 'seguro-fianca' ? fiancaPrimaryContact?.email : form.email,
          productSlug: product.slug,
          pagePath: window.location.pathname,
          clickId,
          sessionId,
          ...attr,
          referrer: document.referrer || '',
          leadType: product.slug === 'seguro-fianca' ? getFiancaLeadType(form) : config.leadType,
          details: detailEntries,
          attachments: attachments.map((file) => ({
            name: file.name,
            type: file.type,
            contentBase64: file.contentBase64
          }))
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'Não foi possível enviar as informações agora.');
        setBusy(false);
        return;
      }

      setSubmitted(true);
      setFeedback(config.successMessage);
      setBusy(false);
    } catch {
      setFeedback('Não foi possível enviar as informações agora.');
      setBusy(false);
    }
  }

  function closeModal() {
    setOpen(false);
  }

  function resetModal() {
    setSubmitted(false);
    setFeedback('');
    setAddressLookup({});
    setAttachments([]);
    setForm(initialForm(product.slug));
    setOpen(true);
  }

  return (
    <>
      {mode === 'inline' ? (
        <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
          {config.inlineLabel}
        </button>
      ) : (
        <section className="premium-intake-box" id={`captacao-${product.slug}`}>
          <p className="eyebrow">{config.sectionEyebrow}</p>
          <h2>{config.sectionTitle}</h2>
          <p>{config.sectionText}</p>
          <div className="cta-row premium-intake-box-actions">
            <button type="button" className="btn btn-primary" onClick={() => setOpen(true)}>
              {config.inlineLabel}
            </button>
            <a
              className="btn btn-ghost"
              href={product.slug === 'seguro-fianca' ? product.fiancaPlatform?.url : product.portoUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {config.sectionSecondaryLabel}
            </a>
          </div>
        </section>
      )}

      {open ? (
        <div className="premium-intake-backdrop" onClick={closeModal}>
          <div className="premium-intake-modal" onClick={(event) => event.stopPropagation()}>
            <div className="premium-intake-modal-head">
              <div>
                <p className="eyebrow">{config.modalEyebrow}</p>
                <h2>{config.modalTitle}</h2>
                <p>{config.modalText}</p>
              </div>
              <button type="button" className="premium-intake-close" onClick={closeModal} aria-label="Fechar modal">
                ×
              </button>
            </div>

            {submitted ? (
              <div className="premium-intake-success">
                <h3>Informações enviadas</h3>
                <p>{feedback}</p>
                <div className="cta-row">
                  <button type="button" className="btn btn-primary" onClick={closeModal}>
                    Fechar
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={resetModal}>
                    Enviar outro formulário
                  </button>
                </div>
              </div>
            ) : (
              <form className="premium-intake-form" onSubmit={handleSubmit}>
                <div className="premium-intake-grid">
                  {product.slug !== 'seguro-fianca' ? (
                    <FormSection title="Contato principal" tone="personal" description="Dados iniciais para retorno da H Soares.">
                      <DetailField label="Nome completo">
                        <input value={form.nome} onChange={(event) => updateField('nome', event.target.value)} />
                      </DetailField>
                      <DetailField label="WhatsApp">
                        <input value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} />
                      </DetailField>
                      <DetailField label="E-mail">
                        <input value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                      </DetailField>
                    </FormSection>
                  ) : null}

                  {renderDynamicFields(product.slug, form, updateField, {
                    handleFiancaCepLookup,
                    addressLookup
                  })}

                  <FormSection title="Observações e arquivos" tone="coverage" description="Adicione contexto extra e envie documentos de apoio, se necessário.">
                    <DetailField label="Observações adicionais" fullWidth>
                      <textarea rows="4" value={form.observacoes} onChange={(event) => updateField('observacoes', event.target.value)} />
                    </DetailField>

                    <div className="intake-field intake-field--full">
                      <span>Anexar arquivo (opcional)</span>
                      <label className="premium-intake-file">
                        <input
                          type="file"
                          multiple
                          accept={product.slug === 'seguro-auto' ? 'application/pdf,image/*' : undefined}
                          onChange={handleAttachmentChange}
                        />
                        <strong>Selecionar arquivo</strong>
                        <small>
                          {product.slug === 'seguro-auto'
                            ? 'PDF ou imagem. Na renovação, a apólice atual é obrigatória. Você pode adicionar quantos quiser, com até 5 MB por arquivo.'
                            : 'PDF, imagem ou documento. Você pode adicionar quantos quiser, com até 5 MB por arquivo.'}
                        </small>
                      </label>
                      {attachments.length ? (
                        <div className="premium-intake-file-list">
                          {attachments.map((file, index) => (
                            <div key={`${file.name}-${index}`} className="premium-intake-file-pill">
                              <span>{file.name}</span>
                              <button type="button" onClick={() => removeAttachment(index)}>
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </FormSection>
                </div>

                <div className="premium-intake-actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? 'Enviando...' : 'Enviar informações'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={busy}>
                    Cancelar
                  </button>
                </div>

                {feedback ? <p className="premium-intake-feedback">{feedback}</p> : null}
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
