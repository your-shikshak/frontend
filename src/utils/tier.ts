export const resolveTierLabel = (tierValue?: string) => {
  if (!tierValue) return 'Bronze';
  const normalized = String(tierValue).toUpperCase();
  if (normalized.includes('PLATINUM')) return 'Platinum';
  if (normalized.includes('GOLD')) return 'Gold';
  if (normalized.includes('SILVER')) return 'Silver';
  if (normalized.includes('BRONZE')) return 'Bronze';
  // fallback: strip 'Tier X (' patterns and parentheses
  const cleaned = String(tierValue).replace(/tier\s*\d+\s*\(|\)/gi, '').trim();
  return cleaned || 'Bronze';
};

export const tierToHex = (tierValue?: string, defaultHex = '#6366f1') => {
  const t = resolveTierLabel(tierValue).toUpperCase();
  if (t.includes('GOLD')) return '#f59e0b';
  if (t.includes('SILVER')) return '#94a3b8';
  if (t.includes('BRONZE')) return '#b45309';
  if (t.includes('PLATINUM')) return '#7c3aed';
  return defaultHex;
};

export const tierToMuiColor = (tierValue?: string) => {
  const t = resolveTierLabel(tierValue).toUpperCase();
  if (t.includes('GOLD')) return 'success';
  if (t.includes('SILVER')) return 'default';
  if (t.includes('BRONZE')) return 'warning';
  if (t.includes('PLATINUM')) return 'info';
  return 'default';
};

export const computeTierFromHours = (hours?: number) => {
  const h = Number(hours || 0);
  if (h >= 1000) return 'Gold';
  if (h >= 300) return 'Silver';
  return 'Bronze';
};

export const tierRank = (tier?: string) => {
  const t = resolveTierLabel(tier).toUpperCase();
  if (t.includes('PLATINUM')) return 3;
  if (t.includes('GOLD')) return 2;
  if (t.includes('SILVER')) return 1;
  if (t.includes('BRONZE')) return 0;
  return 0;
};

export const preferTier = (tierValue?: string, hours?: number) => {
  const computed = computeTierFromHours(hours);
  const storedRank = tierRank(tierValue);
  const computedRank = tierRank(computed);
  return computedRank > storedRank ? computed : resolveTierLabel(tierValue);
};
