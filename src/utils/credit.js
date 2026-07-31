export function classifyScore(score) {
  if (score >= 750) return 'Excelente';
  if (score >= 650) return 'Bueno';
  if (score >= 550) return 'Regular';
  return 'Riesgoso';
}

export function classifyDebt(percentage) {
  if (percentage < 35) return 'Bajo';
  if (percentage <= 60) return 'Medio';
  return 'Alto';
}
