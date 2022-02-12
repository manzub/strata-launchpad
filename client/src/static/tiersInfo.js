export const tiers = {
  elementary: { name: 'Elementary Tier', required: 1000, min: 300, rate: 0.03 },
  basic: { name: 'Basic Tier', required: 3000, min: 1001, rate: 0.10 },
  pro: { name: 'Pro Tier', required: 7000, min: 3001, rate: 0.50 },
  elite: { name: 'Elite Tier', min: 7001, rate: 1 },
}

export function getTierInfo(currentBalance) {
  let entries = Object.values(tiers)
  let item = entries.find(x => currentBalance >= x.min && currentBalance <= x.required)
  return currentBalance > 0 ? item : tiers.elementary;
};