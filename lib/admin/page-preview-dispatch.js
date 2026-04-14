import 'server-only';

function describeFocus(page) {
  if (!page) return 'ajuste visual';
  if (page.leadRate >= 12) return 'CTA e proof';
  if (page.views >= 80) return 'headline e trecho social';
  return 'mensagem de entrada e CTA inicial';
}

function buildConfidence(page) {
  const leadRate = Number(page?.leadRate || 0);
  const views = Number(page?.views || 0);
  const leads = Number(page?.leads || 0);
  const base = Math.min(85, Math.round(leadRate * 3 + Math.min(views, 50) / 2 + leads * 4));
  return `${Math.max(40, base)}%`;
}

export function buildPagePreviewPayload(page) {
  const focus = describeFocus(page);
  const confidence = buildConfidence(page);
  const summary = `Patch seguro com foco em ${focus}`;
  const detail = `Ajuste aprovado para ${page.pagePath}: ${focus} acompanhado de CTA claro e prova social reforcada.`;
  const patchActions = [
    {
      target: 'CTA',
      description: 'Destacar o botao principal no canto inferior direito com contraste e texto imperativo.'
    },
    {
      target: 'Hero',
      description: 'Reforcar a promessa principal com um comparativo ou deadline e adicionar prova social ao lado.'
    }
  ];

  return {
    summary,
    detail,
    confidence,
    patchActions,
    previewId: `preview:${page.pagePath}:${Date.now()}`
  };
}
