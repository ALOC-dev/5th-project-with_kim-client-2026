export function normalizeSafetyScore(value) {
  if (value === null || value === undefined || value === '') return null;
  const score = Number(value);
  if (!Number.isFinite(score)) return null;
  return score > 10 ? score / 10 : score;
}

export function getSafetySummaryLabel(value) {
  const score = normalizeSafetyScore(value);
  if (score === null) return '준비 중';
  if (score >= 7) return '안심';
  if (score >= 5) return '참고';
  return '주의';
}
