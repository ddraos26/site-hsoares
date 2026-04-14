export const dashboardReadModelCatalog = [
  {
    key: 'executive-dashboard',
    title: 'Executive Dashboard Read Model',
    route: '/api/dashboard/executive-dashboard',
    scope: 'global'
  },
  {
    key: 'decision-center',
    title: 'Decision Center Read Model',
    route: '/api/dashboard/executive-cockpit',
    scope: 'global'
  },
  {
    key: 'products',
    title: 'Products Read Model',
    route: '/api/dashboard/products',
    scope: 'product'
  },
  {
    key: 'pages',
    title: 'Pages Read Model',
    route: '/api/dashboard/pages',
    scope: 'page'
  },
  {
    key: 'campaigns',
    title: 'Campaigns Read Model',
    route: '/api/dashboard/campaigns',
    scope: 'campaign'
  },
  {
    key: 'seo',
    title: 'SEO Read Model',
    route: '/api/dashboard/search-console-intelligence',
    scope: 'seo'
  },
  {
    key: 'analytics',
    title: 'Analytics Read Model',
    route: '/api/dashboard/analytics',
    scope: 'analytics'
  },
  {
    key: 'ai-insights',
    title: 'AI Insights Read Model',
    route: '/api/dashboard/insights',
    scope: 'ai'
  }
];

export function getDashboardReadModelByKey(key) {
  return dashboardReadModelCatalog.find((item) => item.key === key) || null;
}
