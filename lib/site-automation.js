import 'server-only';

import { randomUUID } from 'node:crypto';
import { readAdminRuntimeSetting, upsertAdminRuntimeSetting } from '@/lib/admin/runtime-settings-store';

const SITE_AUTOMATION_KEY = 'site_automation';
const SITE_PATCH_PREVIEWS_KEY = 'site_patch_previews';
const SITE_PATCH_PREVIEW_PARAM = 'site_patch_preview';

const defaultState = {
  floatingWhatsappCta: {
    enabled: false,
    label: 'Falar no WhatsApp',
    message: 'Olá, vim pelo site da H Soares Seguros e quero falar com um especialista.',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  stickyMobileBar: {
    enabled: false,
    label: 'Atendimento no WhatsApp',
    message: 'Olá, vim pelo site da H Soares Seguros e quero falar com um especialista.',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  heroCtaBoost: {
    enabled: false,
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  headlineVariant: {
    enabled: false,
    headline: '',
    subheadline: '',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  socialProofRibbon: {
    enabled: false,
    eyebrow: 'Por que agir agora',
    title: 'Atendimento humano com leitura clara e apoio rápido no WhatsApp.',
    items: ['30 anos de mercado', 'Atendimento consultivo', 'Resposta rápida'],
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  seoMetaOverride: {
    enabled: false,
    title: '',
    description: '',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  headerWhatsappBoost: {
    enabled: false,
    label: 'WhatsApp',
    message: 'Olá, vim pelo site da H Soares Seguros e quero falar com um especialista.',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  },
  footerWhatsappBoost: {
    enabled: false,
    label: 'Falar no WhatsApp',
    targetPaths: ['*'],
    note: '',
    updatedAt: null,
    updatedBy: null
  }
};

const defaultPatchPreviewStore = {
  items: []
};

function normalizeTargetPaths(paths = ['*']) {
  const normalized = (Array.isArray(paths) ? paths : [paths])
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  return normalized.length ? normalized : ['*'];
}

function normalizeStringList(items = []) {
  const normalized = (Array.isArray(items) ? items : [items])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
  return normalized.length ? normalized : [];
}

function normalizeTextLayer(layer = {}, defaults = {}) {
  return {
    ...defaults,
    ...layer,
    enabled: Boolean(layer?.enabled),
    targetPaths: normalizeTargetPaths(layer?.targetPaths || defaults.targetPaths || ['*']),
    note: String(layer?.note || '').trim(),
    updatedAt: layer?.updatedAt || null,
    updatedBy: layer?.updatedBy || null
  };
}

function normalizeCtaLayer(layer = {}, defaults = {}) {
  return {
    ...normalizeTextLayer(layer, defaults),
    label: String(layer?.label || defaults.label || '').trim() || defaults.label,
    message: String(layer?.message || defaults.message || '').trim() || defaults.message
  };
}

export function normalizeSiteAutomationState(value = {}) {
  return {
    floatingWhatsappCta: normalizeCtaLayer(value?.floatingWhatsappCta, defaultState.floatingWhatsappCta),
    stickyMobileBar: normalizeCtaLayer(value?.stickyMobileBar, defaultState.stickyMobileBar),
    heroCtaBoost: normalizeTextLayer(value?.heroCtaBoost, defaultState.heroCtaBoost),
    headlineVariant: {
      ...normalizeTextLayer(value?.headlineVariant, defaultState.headlineVariant),
      headline: String(value?.headlineVariant?.headline || defaultState.headlineVariant.headline || '').trim(),
      subheadline: String(value?.headlineVariant?.subheadline || defaultState.headlineVariant.subheadline || '').trim()
    },
    socialProofRibbon: {
      ...normalizeTextLayer(value?.socialProofRibbon, defaultState.socialProofRibbon),
      eyebrow: String(value?.socialProofRibbon?.eyebrow || defaultState.socialProofRibbon.eyebrow || '').trim() || defaultState.socialProofRibbon.eyebrow,
      title: String(value?.socialProofRibbon?.title || defaultState.socialProofRibbon.title || '').trim() || defaultState.socialProofRibbon.title,
      items: normalizeStringList(value?.socialProofRibbon?.items || defaultState.socialProofRibbon.items)
    },
    seoMetaOverride: {
      ...normalizeTextLayer(value?.seoMetaOverride, defaultState.seoMetaOverride),
      title: String(value?.seoMetaOverride?.title || defaultState.seoMetaOverride.title || '').trim(),
      description: String(value?.seoMetaOverride?.description || defaultState.seoMetaOverride.description || '').trim()
    },
    headerWhatsappBoost: normalizeCtaLayer(value?.headerWhatsappBoost, defaultState.headerWhatsappBoost),
    footerWhatsappBoost: normalizeCtaLayer(value?.footerWhatsappBoost, defaultState.footerWhatsappBoost)
  };
}

function deriveTargetPaths({ mutation, rationale = '' }) {
  const note = String(rationale || '').toLowerCase();

  if (
    note.includes('site inteiro') ||
    note.includes('todo o site') ||
    note.includes('todo site') ||
    note.includes('todas as paginas') ||
    note.includes('todas as páginas')
  ) {
    return ['*'];
  }

  return normalizeTargetPaths(mutation?.targetPaths || ['*']);
}

function buildPreviewUrl(targetPaths = ['*'], token = '') {
  const firstTarget = Array.isArray(targetPaths) && targetPaths.length ? targetPaths[0] : '/';
  const pathname = firstTarget === '*' ? '/' : firstTarget || '/';
  const separator = pathname.includes('?') ? '&' : '?';
  return `${pathname}${separator}${SITE_PATCH_PREVIEW_PARAM}=${encodeURIComponent(token)}`;
}

function createRuntimePatchState(current, mutation, rationale, actor) {
  const updatedAt = new Date().toISOString();
  const targetPaths = deriveTargetPaths({ mutation, rationale });
  const patchTemplate = String(mutation?.patchTemplate || 'hero_conversion_stack').trim();
  const targetLabel = targetPaths.includes('*') ? 'site inteiro' : targetPaths.join(', ');
  const note = String(rationale || mutation?.note || '').trim();

  if (patchTemplate === 'hero_conversion_stack') {
    const headline = String(
      mutation?.headline ||
        `Atendimento consultivo e resposta rápida para quem chegou em ${targetPaths[0] || 'sua página'}.`
    ).trim();
    const subheadline = String(
      mutation?.subheadline ||
        'Mais clareza de cobertura, CTA mais visível e caminho rápido para seguir no WhatsApp.'
    ).trim();

    return {
      detail: targetPaths.includes('*')
        ? 'O patch superficial ficou pronto em preview para o site inteiro.'
        : `O patch superficial ficou pronto em preview para ${targetLabel}.`,
      targetPaths,
      previewState: normalizeSiteAutomationState({
        ...current,
        heroCtaBoost: {
          ...current.heroCtaBoost,
          enabled: true,
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        headlineVariant: {
          ...current.headlineVariant,
          enabled: true,
          headline,
          subheadline,
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        socialProofRibbon: {
          ...current.socialProofRibbon,
          enabled: true,
          eyebrow: String(mutation?.eyebrow || current.socialProofRibbon.eyebrow || 'Por que agir agora').trim(),
          title: String(
            mutation?.contentTitle ||
              mutation?.title ||
              current.socialProofRibbon.title ||
              'Atendimento humano, leitura clara e apoio rápido para decidir melhor.'
          ).trim(),
          items: normalizeStringList(
            mutation?.items || current.socialProofRibbon.items || ['30 anos de mercado', 'Atendimento humano', 'Resposta rápida']
          ),
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        floatingWhatsappCta: {
          ...current.floatingWhatsappCta,
          enabled: true,
          label: String(mutation?.floatingLabel || current.floatingWhatsappCta.label || 'Falar no WhatsApp').trim(),
          message:
            String(mutation?.floatingMessage || '').trim() ||
            String(mutation?.message || '').trim() ||
            current.floatingWhatsappCta.message,
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        stickyMobileBar: {
          ...current.stickyMobileBar,
          enabled: true,
          label: String(mutation?.stickyLabel || 'Quero falar no WhatsApp').trim(),
          message:
            String(mutation?.stickyMessage || '').trim() ||
            String(mutation?.message || '').trim() ||
            current.stickyMobileBar.message,
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        headerWhatsappBoost: {
          ...current.headerWhatsappBoost,
          enabled: true,
          label: String(mutation?.headerLabel || 'WhatsApp agora').trim(),
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        },
        footerWhatsappBoost: {
          ...current.footerWhatsappBoost,
          enabled: true,
          label: String(mutation?.footerLabel || 'Falar com especialista').trim(),
          targetPaths,
          note,
          updatedAt,
          updatedBy: actor
        }
      })
    };
  }

  return {
    detail: targetPaths.includes('*')
      ? 'O patch superficial ficou pronto em preview para o site inteiro.'
      : `O patch superficial ficou pronto em preview para ${targetLabel}.`,
    targetPaths,
    previewState: normalizeSiteAutomationState(current)
  };
}

function normalizePatchPreviewItem(item = {}) {
  const token = String(item?.token || '').trim();
  const targetPaths = normalizeTargetPaths(item?.targetPaths || ['*']);
  return {
    token,
    title: String(item?.title || '').trim() || 'Preview de patch superficial',
    targetPaths,
    previewUrl: item?.previewUrl || buildPreviewUrl(targetPaths, token),
    previewState: normalizeSiteAutomationState(item?.previewState || {}),
    previousState: normalizeSiteAutomationState(item?.previousState || {}),
    patchTemplate: String(item?.patchTemplate || 'hero_conversion_stack').trim(),
    note: String(item?.note || '').trim(),
    createdAt: item?.createdAt || new Date().toISOString(),
    createdBy: item?.createdBy || 'sistema'
  };
}

function normalizePatchPreviewStore(value = {}) {
  return {
    items: (Array.isArray(value?.items) ? value.items : []).map(normalizePatchPreviewItem).filter((item) => item.token)
  };
}

async function readPatchPreviewStore() {
  const setting = await readAdminRuntimeSetting(SITE_PATCH_PREVIEWS_KEY);
  return normalizePatchPreviewStore(setting?.value || defaultPatchPreviewStore);
}

async function writePatchPreviewStore(store, actor = 'sistema') {
  const normalized = normalizePatchPreviewStore(store || defaultPatchPreviewStore);
  const saved = await upsertAdminRuntimeSetting({
    settingKey: SITE_PATCH_PREVIEWS_KEY,
    value: normalized,
    actor
  });

  return normalizePatchPreviewStore(saved?.value || normalized);
}

export async function readSiteAutomationState({ previewToken = '' } = {}) {
  const setting = await readAdminRuntimeSetting(SITE_AUTOMATION_KEY);
  const published = normalizeSiteAutomationState(setting?.value || {});
  const normalizedToken = String(previewToken || '').trim();

  if (!normalizedToken) {
    return published;
  }

  const previewStore = await readPatchPreviewStore();
  const preview = previewStore.items.find((item) => item.token === normalizedToken);
  return preview?.previewState || published;
}

export async function overwriteSiteAutomationState({ state, actor = 'sistema' }) {
  const normalized = normalizeSiteAutomationState(state || {});
  const saved = await upsertAdminRuntimeSetting({
    settingKey: SITE_AUTOMATION_KEY,
    value: normalized,
    actor
  });

  return normalizeSiteAutomationState(saved.value || normalized);
}

export async function prepareSitePatchPreview({ mutation, actor = 'sistema', rationale = '' }) {
  const current = await readSiteAutomationState();
  const token = randomUUID();
  const patch = createRuntimePatchState(current, mutation, rationale, actor);
  const previewUrl = buildPreviewUrl(patch.targetPaths, token);
  const previewStore = await readPatchPreviewStore();

  const nextStore = await writePatchPreviewStore(
    {
      items: [
        {
          token,
          title: String(mutation?.title || 'Preview de patch superficial').trim(),
          targetPaths: patch.targetPaths,
          previewUrl,
          previewState: patch.previewState,
          previousState: current,
          patchTemplate: String(mutation?.patchTemplate || 'hero_conversion_stack').trim(),
          note: String(rationale || mutation?.note || '').trim(),
          createdAt: new Date().toISOString(),
          createdBy: actor
        },
        ...previewStore.items.filter((item) => item.token !== token)
      ].slice(0, 20)
    },
    actor
  );

  const preview = nextStore.items.find((item) => item.token === token) || null;

  return {
    token,
    detail: patch.detail,
    targetPaths: patch.targetPaths,
    previewUrl,
    previewState: preview?.previewState || patch.previewState,
    previousState: current
  };
}

export async function publishSitePatchPreview({ token, actor = 'sistema' }) {
  const previewStore = await readPatchPreviewStore();
  const preview = previewStore.items.find((item) => item.token === String(token || '').trim());

  if (!preview) {
    throw new Error('Preview do patch não encontrado.');
  }

  const publishedState = await overwriteSiteAutomationState({
    state: preview.previewState,
    actor
  });

  await writePatchPreviewStore(
    {
      items: previewStore.items.filter((item) => item.token !== preview.token)
    },
    actor
  );

  return {
    detail: preview.targetPaths.includes('*')
      ? 'O patch superficial foi publicado no site inteiro.'
      : `O patch superficial foi publicado para ${preview.targetPaths.join(', ')}.`,
    previewUrl: preview.previewUrl,
    targetPaths: preview.targetPaths,
    previousState: preview.previousState,
    state: publishedState
  };
}

export async function applySiteMutation({ mutation, actor = 'sistema', rationale = '' }) {
  const current = await readSiteAutomationState();
  const updatedAt = new Date().toISOString();
  const targetPaths = deriveTargetPaths({ mutation, rationale });
  const targetLabel = targetPaths.includes('*') ? 'site inteiro' : targetPaths.join(', ');

  let nextState = current;
  let detail = 'A mutação segura do site foi aplicada.';
  let mutationKey = String(mutation?.key || '').trim();

  if (mutationKey === 'floating_whatsapp_cta') {
    nextState = {
      ...current,
      floatingWhatsappCta: {
        ...current.floatingWhatsappCta,
        enabled: true,
        label: String(mutation?.label || current.floatingWhatsappCta.label || 'Falar no WhatsApp').trim(),
        message: String(mutation?.message || current.floatingWhatsappCta.message || '').trim() || current.floatingWhatsappCta.message,
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'O CTA flutuante de WhatsApp foi ativado no site e já pode aparecer no canto inferior direito.'
        : `O CTA flutuante de WhatsApp foi ativado para ${targetLabel} e já pode aparecer no canto inferior direito.`;
  } else if (mutationKey === 'sticky_mobile_whatsapp_bar') {
    nextState = {
      ...current,
      stickyMobileBar: {
        ...current.stickyMobileBar,
        enabled: true,
        label: String(mutation?.label || current.stickyMobileBar.label || 'Atendimento no WhatsApp').trim(),
        message: String(mutation?.message || current.stickyMobileBar.message || '').trim() || current.stickyMobileBar.message,
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'A barra fixa mobile de WhatsApp foi ativada no site.'
        : `A barra fixa mobile de WhatsApp foi ativada para ${targetLabel}.`;
  } else if (mutationKey === 'hero_cta_boost') {
    nextState = {
      ...current,
      heroCtaBoost: {
        ...current.heroCtaBoost,
        enabled: true,
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'O reforço visual do CTA principal foi ativado no site.'
        : `O reforço visual do CTA principal foi ativado para ${targetLabel}.`;
  } else if (mutationKey === 'hero_headline_variant') {
    nextState = {
      ...current,
      headlineVariant: {
        ...current.headlineVariant,
        enabled: true,
        headline: String(mutation?.headline || '').trim(),
        subheadline: String(mutation?.subheadline || '').trim(),
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'A variante segura de headline foi aplicada no site.'
        : `A variante segura de headline foi aplicada para ${targetLabel}.`;
  } else if (mutationKey === 'social_proof_ribbon') {
    nextState = {
      ...current,
      socialProofRibbon: {
        ...current.socialProofRibbon,
        enabled: true,
        eyebrow: String(mutation?.eyebrow || current.socialProofRibbon.eyebrow || '').trim() || current.socialProofRibbon.eyebrow,
        title: String(mutation?.contentTitle || mutation?.title || current.socialProofRibbon.title || '').trim() || current.socialProofRibbon.title,
        items: normalizeStringList(mutation?.items || current.socialProofRibbon.items),
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'O bloco seguro de prova social foi ativado no site.'
        : `O bloco seguro de prova social foi ativado para ${targetLabel}.`;
  } else if (mutationKey === 'seo_meta_override') {
    nextState = {
      ...current,
      seoMetaOverride: {
        ...current.seoMetaOverride,
        enabled: true,
        title: String(mutation?.title || '').trim(),
        description: String(mutation?.description || '').trim(),
        targetPaths,
        note: String(rationale || mutation?.note || '').trim(),
        updatedAt,
        updatedBy: actor
      }
    };
    detail =
      targetPaths.includes('*')
        ? 'A variação segura de title e meta description foi publicada no site.'
        : `A variação segura de title e meta description foi aplicada para ${targetLabel}.`;
  } else {
    mutationKey = mutationKey || 'unknown';
  }

  const saved = await upsertAdminRuntimeSetting({
    settingKey: SITE_AUTOMATION_KEY,
    value: nextState,
    actor
  });

  return {
    mutationKey,
    detail,
    previousState: current,
    state: normalizeSiteAutomationState(saved.value || nextState),
    targetPaths
  };
}
