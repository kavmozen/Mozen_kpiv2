export const STORAGE_KEYS = {
  params: 'mozen-params-v2',
  teams: 'mozen-teams-v2',
  month: 'mozen-month-v2',
  adminUnlocked: 'mozen-admin-unlocked-v2',
  activeTeamId: 'mozen-active-team-v2',
}

export const DEFAULT_PARAMS = {
  threshold25: 0.8,
  threshold3: 1.0,
  rate25: 0.25,
  rate3: 0.03,
  kpiWeights: [0.2, 0.3, 0.5],
  kpiLabels: ['Звонки / результативные касания', 'Прирост клиентского портфеля, шт', 'Оборот по выводам, ₽'],
  adminPassword: 'mozen2025',
}

export function createDefaultKM(index = 1) {
  return {
    id: `km-${index}-${Math.random().toString(36).slice(2, 8)}`,
    name: `КМ ${index}`,
    startPortfolio: 0,
    planGrowth: 0,
    losses: 0,
    newMoney: 0,
    kpiPlan: [0, 0, 0],
    kpiFact: [0, 0, 0],
  }
}

export function createDefaultTeam(index = 1) {
  return {
    id: `team-${index}`,
    name: `Команда ${index}`,
    targets: {
      planGrowth: 0,
      kpis: [0, 0, 0],
    },
    members: [createDefaultKM(1), createDefaultKM(2), createDefaultKM(3)],
  }
}

export function createDefaultTeams(count = 7) {
  return Array.from({ length: count }, (_, i) => createDefaultTeam(i + 1))
}

export function safeArray(value, fallback) {
  return Array.isArray(value) ? value : fallback
}

export function normalizeTeam(raw, index = 1) {
  const fallback = createDefaultTeam(index)
  const members = safeArray(raw?.members, fallback.members).map((member, idx) => ({
    ...createDefaultKM(idx + 1),
    ...member,
    kpiPlan: safeArray(member?.kpiPlan, [0, 0, 0]).slice(0, 3),
    kpiFact: safeArray(member?.kpiFact, [0, 0, 0]).slice(0, 3),
  }))

  return {
    ...fallback,
    ...raw,
    targets: {
      ...fallback.targets,
      ...(raw?.targets || {}),
      kpis: safeArray(raw?.targets?.kpis, fallback.targets.kpis).slice(0, 3),
    },
    members,
  }
}

export function normalizeTeams(rawTeams) {
  const fallback = createDefaultTeams(7)
  const teams = safeArray(rawTeams, fallback).slice(0, 7)
  while (teams.length < 7) teams.push(createDefaultTeam(teams.length + 1))
  return teams.map((team, i) => normalizeTeam(team, i + 1))
}

export function calcMemberResult(km, teamPct, params) {
  const factPortfolio = (km.startPortfolio || 0) - (km.losses || 0) + (km.newMoney || 0)
  const factGrowth = (km.newMoney || 0) - (km.losses || 0)
  const retainedBase = factPortfolio - (km.newMoney || 0)
  const pct = (km.planGrowth || 0) > 0 ? factGrowth / km.planGrowth : 0

  const bonus25Open = teamPct >= params.threshold25
  const bonus3Open = teamPct >= params.threshold3
  const bonus25 = bonus25Open ? (km.newMoney || 0) * params.rate25 : 0
  const bonus3 = bonus3Open ? retainedBase * params.rate3 : 0
  const availableBonus = bonus25 + bonus3

  const kpiPlanArr = safeArray(km.kpiPlan, [0, 0, 0])
  const kpiFactArr = safeArray(km.kpiFact, [0, 0, 0])
  let kpiFactor = 0
  for (let i = 0; i < 3; i++) {
    const p = Number(kpiPlanArr[i] || 0)
    const f = Number(kpiFactArr[i] || 0)
    const w = Number(params.kpiWeights[i] || 0)
    kpiFactor += p > 0 ? Math.min(f / p, 1) * w : w
  }
  kpiFactor = Math.min(kpiFactor, 1)

  return {
    factPortfolio,
    factGrowth,
    retainedBase,
    pct,
    bonus25Open,
    bonus3Open,
    bonus25,
    bonus3,
    availableBonus,
    kpiFactor,
    finalBonus: availableBonus * kpiFactor,
  }
}

export function calcTeamDashboard(team, params) {
  const members = safeArray(team?.members, [])
  const startPortfolio = members.reduce((sum, km) => sum + Number(km.startPortfolio || 0), 0)
  const planGrowthMembers = members.reduce((sum, km) => sum + Number(km.planGrowth || 0), 0)
  const losses = members.reduce((sum, km) => sum + Number(km.losses || 0), 0)
  const newMoney = members.reduce((sum, km) => sum + Number(km.newMoney || 0), 0)

  const planGrowth = Number(team?.targets?.planGrowth || 0)
  const activePlanGrowth = planGrowth > 0 ? planGrowth : planGrowthMembers
  const targetPortfolio = startPortfolio + activePlanGrowth
  const factPortfolio = startPortfolio - losses + newMoney
  const factGrowth = newMoney - losses
  const pct = activePlanGrowth > 0 ? factGrowth / activePlanGrowth : 0

  const kpiPlan = safeArray(team?.targets?.kpis, [0, 0, 0])
  const kpiFact = [0, 1, 2].map((i) => members.reduce((sum, km) => sum + Number((safeArray(km.kpiFact, [0, 0, 0])[i]) || 0), 0))
  const kpiRows = [0, 1, 2].map((i) => {
    const plan = Number(kpiPlan[i] || 0)
    const fact = Number(kpiFact[i] || 0)
    const weight = Number(params.kpiWeights[i] || 0)
    const pct = plan > 0 ? Math.min(fact / plan, 1) : 0
    return {
      label: params.kpiLabels[i] || `Показатель ${i + 1}`,
      plan,
      fact,
      weight,
      pct,
      contribution: pct * weight,
    }
  })
  const kpiTotal = kpiRows.reduce((sum, row) => sum + row.contribution, 0)

  const memberResults = members.map((km) => calcMemberResult(km, pct, params))
  const totalBonus = memberResults.reduce((sum, row) => sum + row.finalBonus, 0)

  return {
    startPortfolio,
    planGrowthMembers,
    planGrowth,
    activePlanGrowth,
    losses,
    newMoney,
    targetPortfolio,
    factPortfolio,
    factGrowth,
    pct,
    memberResults,
    totalBonus,
    kpiRows,
    kpiTotal,
    open25: pct >= params.threshold25,
    open3: pct >= params.threshold3,
  }
}

export function calcOverallDashboard(teams, params) {
  const rows = teams.map((team) => ({
    team,
    metrics: calcTeamDashboard(team, params),
  }))

  const totals = rows.reduce((acc, row) => {
    acc.startPortfolio += row.metrics.startPortfolio
    acc.planGrowth += row.metrics.activePlanGrowth
    acc.losses += row.metrics.losses
    acc.newMoney += row.metrics.newMoney
    acc.targetPortfolio += row.metrics.targetPortfolio
    acc.factPortfolio += row.metrics.factPortfolio
    acc.factGrowth += row.metrics.factGrowth
    acc.totalBonus += row.metrics.totalBonus
    return acc
  }, {
    startPortfolio: 0,
    planGrowth: 0,
    losses: 0,
    newMoney: 0,
    targetPortfolio: 0,
    factPortfolio: 0,
    factGrowth: 0,
    totalBonus: 0,
  })

  totals.pct = totals.planGrowth > 0 ? totals.factGrowth / totals.planGrowth : 0
  totals.open25 = totals.pct >= params.threshold25
  totals.open3 = totals.pct >= params.threshold3

  totals.kpiRows = [0, 1, 2].map((i) => {
    const plan = rows.reduce((sum, row) => sum + Number(row.team.targets?.kpis?.[i] || 0), 0)
    const fact = rows.reduce((sum, row) => sum + Number(row.metrics.kpiRows[i]?.fact || 0), 0)
    const weight = Number(params.kpiWeights[i] || 0)
    const pct = plan > 0 ? Math.min(fact / plan, 1) : 0
    return {
      label: params.kpiLabels[i] || `Показатель ${i + 1}`,
      plan,
      fact,
      weight,
      pct,
      contribution: pct * weight,
    }
  })
  totals.kpiTotal = totals.kpiRows.reduce((sum, row) => sum + row.contribution, 0)

  return { rows, totals }
}

export const fmt = (n) => (
  Number.isFinite(n) ? n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) : '—'
)

export const fmtRub = (n) => (
  Number.isFinite(n) ? `${fmt(n)} ₽` : '—'
)

export const fmtPct = (n) => (
  Number.isFinite(n) ? `${(n * 100).toFixed(1)}%` : '—'
)

export function pctColor(value) {
  if (value >= 1) return 'var(--accent)'
  if (value >= 0.8) return 'var(--yellow)'
  return 'var(--red)'
}

export function exportTeamCsv(team, params) {
  const metrics = calcTeamDashboard(team, params)
  const rows = [
    ['Команда', team.name],
    ['План прироста команды', metrics.activePlanGrowth],
    ['Факт прироста команды', metrics.factGrowth],
    ['% выполнения плана', (metrics.pct * 100).toFixed(1) + '%'],
    ['Итоговая премия команды', metrics.totalBonus],
    [],
    ['КМ', 'Стартовый портфель', 'План прироста', 'Потери базы', 'Новые деньги', 'Факт прироста', 'KPI-фактор', 'Итоговая премия'],
  ]

  team.members.forEach((member, index) => {
    const result = metrics.memberResults[index]
    rows.push([
      member.name,
      member.startPortfolio,
      member.planGrowth,
      member.losses,
      member.newMoney,
      result.factGrowth,
      (result.kpiFactor * 100).toFixed(1) + '%',
      result.finalBonus,
    ])
  })

  downloadCsv(rows, `${slugify(team.name)}-results.csv`)
}

export function exportAllTeamsCsv(teams, params) {
  const overall = calcOverallDashboard(teams, params)
  const rows = [
    ['Свод по всем командам'],
    [],
    ['Команда', 'План прироста', 'Факт прироста', '% выполнения', 'Новые деньги', 'Потери', 'Итоговая премия'],
  ]

  overall.rows.forEach(({ team, metrics }) => {
    rows.push([
      team.name,
      metrics.activePlanGrowth,
      metrics.factGrowth,
      (metrics.pct * 100).toFixed(1) + '%',
      metrics.newMoney,
      metrics.losses,
      metrics.totalBonus,
    ])
  })

  rows.push([])
  rows.push(['Итого', overall.totals.planGrowth, overall.totals.factGrowth, (overall.totals.pct * 100).toFixed(1) + '%', overall.totals.newMoney, overall.totals.losses, overall.totals.totalBonus])
  rows.push([])

  teams.forEach((team) => {
    const metrics = calcTeamDashboard(team, params)
    rows.push([team.name])
    rows.push(['КМ', 'Стартовый портфель', 'План прироста', 'Потери базы', 'Новые деньги', 'Факт прироста', 'KPI-фактор', 'Итоговая премия'])
    team.members.forEach((member, index) => {
      const result = metrics.memberResults[index]
      rows.push([
        member.name,
        member.startPortfolio,
        member.planGrowth,
        member.losses,
        member.newMoney,
        result.factGrowth,
        (result.kpiFactor * 100).toFixed(1) + '%',
        result.finalBonus,
      ])
    })
    rows.push([])
  })

  downloadCsv(rows, 'all-teams-results.csv')
}

function downloadCsv(rows, filename) {
  const csv = rows
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function escapeCsvCell(value = '') {
  const str = String(value ?? '')
  if (/[";\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'team'
}
