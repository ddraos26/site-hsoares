export const adminOperatingMode = {
  key: 'advisory_only',
  label: 'Modo consultivo',
  shortLabel: 'Somente sugestoes',
  summary: 'A IA le os dados, organiza prioridades e sugere proximos passos. O sistema nao publica, nao executa rollback e nao altera campanhas ou paginas sozinho.'
};

export function isAdminAdvisoryOnlyMode() {
  return adminOperatingMode.key === 'advisory_only';
}
