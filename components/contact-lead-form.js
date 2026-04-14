'use client';

import { useMemo, useState } from 'react';
import { getBrowserAttribution, getOrCreateBrowserSessionId } from '@/lib/tracking-attribution';

const PRODUCT_OPTIONS = [
  { value: '', label: 'Quero orientação geral' },
  { value: 'seguro-fianca', label: 'Seguro Fiança' },
  { value: 'seguro-imobiliario', label: 'Seguro Imobiliário' },
  { value: 'seguro-auto', label: 'Seguro Auto' },
  { value: 'plano-saude', label: 'Plano de Saúde' },
  { value: 'seguro-celular', label: 'Seguro Celular' },
  { value: 'residencial-essencial', label: 'Residencial Essencial' },
  { value: 'outros-servicos', label: 'Outro serviço' }
];

const PREFERRED_CONTACT_OPTIONS = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'ligacao', label: 'Ligação' }
];

function initialFormState() {
  return {
    nome: '',
    whatsapp: '',
    email: '',
    productSlug: '',
    preferredContact: 'whatsapp',
    message: '',
    empresa_site: ''
  };
}

export function ContactLeadForm() {
  const [form, setForm] = useState(initialFormState);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedProductLabel = useMemo(
    () => PRODUCT_OPTIONS.find((option) => option.value === form.productSlug)?.label || PRODUCT_OPTIONS[0].label,
    [form.productSlug]
  );

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    if (!form.nome.trim()) {
      setFeedback('Informe seu nome para continuarmos.');
      return;
    }

    if (!form.whatsapp.trim() && !form.email.trim()) {
      setFeedback('Informe WhatsApp ou e-mail para receber o retorno.');
      return;
    }

    setBusy(true);
    setFeedback('Enviando sua mensagem...');

    try {
      const sessionId = getOrCreateBrowserSessionId();
      const attr = getBrowserAttribution();
      const details = [
        { label: 'Interesse principal', value: selectedProductLabel },
        {
          label: 'Canal preferido',
          value: PREFERRED_CONTACT_OPTIONS.find((option) => option.value === form.preferredContact)?.label || 'WhatsApp'
        }
      ];

      if (form.message.trim()) {
        details.push({ label: 'Mensagem', value: form.message.trim() });
      }

      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          whatsapp: form.whatsapp,
          email: form.email,
          productSlug: form.productSlug || 'contato-geral',
          pagePath: window.location.pathname,
          sessionId,
          ...attr,
          referrer: document.referrer || '',
          leadType: 'contact_page',
          empresa_site: form.empresa_site,
          details
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setFeedback(payload.error || 'Não foi possível enviar sua mensagem agora.');
        setBusy(false);
        return;
      }

      setSubmitted(true);
      setFeedback('Recebemos sua mensagem. A H Soares vai retornar pelo canal informado.');
      setForm(initialFormState());
      setBusy(false);
    } catch {
      setFeedback('Não foi possível enviar sua mensagem agora.');
      setBusy(false);
    }
  }

  return (
    <section className="contact-lead-shell">
      <p className="eyebrow">Captação orientada</p>
      <h2>Deixe seus dados e o cenário principal para receber um retorno mais objetivo</h2>
      <p>
        Esse formulário ajuda a H Soares a entender o produto, o contexto e o melhor canal para continuar a conversa
        sem ida e volta desnecessária.
      </p>

      {submitted ? (
        <div className="contact-lead-success">
          <h3>Mensagem recebida</h3>
          <p>{feedback}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="contact-form-grid">
            <label className="intake-field">
              <span>Nome completo</span>
              <input value={form.nome} onChange={(event) => updateField('nome', event.target.value)} maxLength={120} />
            </label>

            <label className="intake-field">
              <span>WhatsApp</span>
              <input
                value={form.whatsapp}
                onChange={(event) => updateField('whatsapp', event.target.value)}
                maxLength={20}
                placeholder="Com DDD"
              />
            </label>

            <label className="intake-field">
              <span>E-mail</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                maxLength={160}
              />
            </label>

            <label className="intake-field">
              <span>Interesse principal</span>
              <select value={form.productSlug} onChange={(event) => updateField('productSlug', event.target.value)}>
                {PRODUCT_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="intake-field">
              <span>Canal preferido para retorno</span>
              <select
                value={form.preferredContact}
                onChange={(event) => updateField('preferredContact', event.target.value)}
              >
                {PREFERRED_CONTACT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="intake-field intake-field--full">
              <span>Mensagem inicial</span>
              <textarea
                rows="5"
                value={form.message}
                onChange={(event) => updateField('message', event.target.value)}
                maxLength={1200}
                placeholder="Conte rapidamente o produto, o momento da contratação ou a dúvida principal."
              />
            </label>

            <label className="contact-honeypot" aria-hidden="true">
              <span>Empresa</span>
              <input
                tabIndex="-1"
                autoComplete="off"
                value={form.empresa_site}
                onChange={(event) => updateField('empresa_site', event.target.value)}
              />
            </label>
          </div>

          <div className="premium-intake-actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              {busy ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </div>

          {feedback ? <p className="feedback">{feedback}</p> : null}
        </form>
      )}
    </section>
  );
}
