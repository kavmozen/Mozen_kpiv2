// ─── Core KPI calculations ────────────────────────────────────────────────────

export function calcTeam(kms) {
  return {
    startPortfolio: kms.reduce((s, k) => s + (k.startPortfolio || 0), 0),
    planGrowth: kms.reduce((s, k) => s + (k.planGrowth || 0), 0),
    losses: kms.reduce((s, k) => s + (k.losses || 0), 0),
    newMoney: kms.reduce((s, k) => s + (k.newMoney || 0), 0),
  }
}

export function calcTeamMetrics(team) {
  const targetPortfolio = team.startPortfolio + team.planGrowth
  const factPortfolio = team.startPortfolio - team.losses + team.newMoney
  const factGrowth = team.newMoney - team.losses
  const pct = team.planGrowth > 0 ? factGrowth / team.planGrowth : 0
  return { targetPortfolio, factPortfolio, factGrowth, pct }
}

export function calcKM(km, teamPct, params) {
  const factPortfolio = km.startPortfolio - km.losses + km.newMoney
  const factGrowth = km.newMoney - km.losses
  const retainedBase = factPortfolio - km.newMoney  // = startPortfolio - losses
  const pct = km.planGrowth > 0 ? factGrowth / km.planGrowth : 0

  const bonus25Open = teamPct >= params.threshold25
  const bonus3Open = teamPct >= params.threshold3

  const bonus25 = bonus25Open ? km.newMoney * params.rate25 : 0
  const bonus3 = bonus3Open ? retainedBase * params.rate3 : 0
  const availableBonus = bonus25 + bonus3

  // KPI factor = weighted sum, capped at 1.0
  const kpiPlanArr = km.kpiPlan || [0, 0, 0]
  const kpiFactArr = km.kpiFact || [0, 0, 0]
  const weights = params.kpiWeights
  let kpiFactor = 0
  for (let i = 0; i < 3; i++) {
    const p = kpiPlanArr[i] || 0
    const f = kpiFactArr[i] || 0
    kpiFactor += p > 0 ? Math.min(f / p, 1) * weights[i] : weights[i]
  }
  kpiFactor = Math.min(kpiFactor, 1)

  const finalBonus = availableBonus * kpiFactor

  return {
    factPortfolio, factGrowth, retainedBase, pct,
    bonus25Open, bonus3Open,
    bonus25, bonus3, availableBonus,
    kpiFactor, finalBonus,
  }
}

export function calcTeamKPI(kms, params) {
  const weights = params.kpiWeights
  const labels = ['Звонки / касания', 'Прирост портфеля, шт', 'Оборот по выводам']
  const rows = labels.map((label, i) => {
    const planSum = kms.reduce((s, k) => s + ((k.kpiPlan || [0,0,0])[i] || 0), 0)
    const factSum = kms.reduce((s, k) => s + ((k.kpiFact || [0,0,0])[i] || 0), 0)
    const pct = planSum > 0 ? Math.min(factSum / planSum, 1) : 1
    return { label, weight: weights[i], plan: planSum, fact: factSum, pct, contribution: pct * weights[i] }
  })
  const total = rows.reduce((s, r) => s + r.contribution, 0)
  return { rows, total }
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export const fmt = (n) =>
  Number.isFinite(n) ? n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'

export const fmtRub = (n) =>
  Number.isFinite(n) ? `${fmt(n)} ₽` : '—'

export const fmtPct = (n) =>
  Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—'
