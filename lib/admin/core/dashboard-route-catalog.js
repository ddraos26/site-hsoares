const dashboardLegacyRouteMap = {
  '/admin': '/dashboard',
  '/admin/checklist': '/dashboard/checklist',
  '/admin/continuar': '/dashboard/continuar',
  '/admin/missao-hoje': '/dashboard/today',
  '/admin/copiloto': '/dashboard/decision-center',
  '/admin/produtos': '/dashboard/products',
  '/admin/paginas': '/dashboard/pages',
  '/admin/campanhas': '/dashboard/campaigns',
  '/admin/seo': '/dashboard/seo',
  '/admin/analytics': '/dashboard/analytics',
  '/admin/insights': '/dashboard/ai',
  '/admin/automacoes': '/dashboard/automations',
  '/admin/aprovacoes': '/dashboard/approvals',
  '/admin/tasks': '/dashboard/queue',
  '/admin/historico': '/dashboard/completed',
  '/admin/configuracoes': '/dashboard/settings',
  '/admin/custo-ia': '/dashboard/settings/ai-budget',
  '/admin/regras': '/dashboard/settings/rules'
};

export function resolveDashboardHref(href, basePath = '/admin') {
  if (basePath !== '/dashboard' || !href) {
    return href;
  }

  const value = String(href);
  const match = value.match(/^([^?#]+)(.*)$/);
  const path = match?.[1] || value;
  const suffix = match?.[2] || '';

  return (dashboardLegacyRouteMap[path] || path) + suffix;
}

export function getCanonicalDashboardRoutes() {
  return {
    home: '/dashboard',
    today: '/dashboard/today',
    queue: '/dashboard/queue',
    inProgress: '/dashboard/in-progress',
    completed: '/dashboard/completed',
    radar: '/dashboard/radar',
    results: '/dashboard/results',
    checklist: '/dashboard/checklist',
    continue: '/dashboard/continuar',
    decisionCenter: '/dashboard/decision-center',
    products: '/dashboard/products',
    pages: '/dashboard/pages',
    campaigns: '/dashboard/campaigns',
    seo: '/dashboard/seo',
    analytics: '/dashboard/analytics',
    ai: '/dashboard/ai',
    automations: '/dashboard/automations',
    approvals: '/dashboard/approvals',
    history: '/dashboard/history',
    settings: '/dashboard/settings',
    integrations: '/dashboard/settings/integrations',
    aiBudget: '/dashboard/settings/ai-budget',
    rules: '/dashboard/settings/rules',
    tasks: '/dashboard/tasks',
    logs: '/dashboard/logs'
  };
}
