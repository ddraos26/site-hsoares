import 'server-only';

export function buildPromptBundle({ summary, mode, insights, rules }) {
  const compactInsights = insights.slice(0, mode === 'economic' ? 3 : 6).map((item) => ({
    title: item.title,
    diagnosis: item.diagnosis,
    reason: item.reason,
    recommendation: item.recommendation,
    priority: item.priority
  }));

  const activeRules = rules.filter((rule) => rule.isActive).slice(0, mode === 'premium' ? 8 : 5).map((rule) => ({
    name: rule.name,
    type: rule.type,
    conditionJson: rule.conditionJson
  }));

  return {
    mode,
    dailySummaryPrompt: {
      role: 'diretor_comercial',
      maxItems: mode === 'economic' ? 3 : 5,
      summary,
      insights: compactInsights,
      rules: activeRules
    },
    weeklySummaryPrompt: {
      role: 'assistente_estrategico',
      maxItems: mode === 'premium' ? 8 : 5,
      summary,
      insights: compactInsights,
      rules: activeRules
    }
  };
}
