export const STORAGE_KEYS = {
  params: 'mozen-params-v4',
  teams: 'mozen-teams-v4',
  month: 'mozen-month-v4',
  adminUnlocked: 'mozen-admin-unlocked-v4',
  activeTeamId: 'mozen-active-team-v4',
}

export const DEFAULT_PARAMS = {
  threshold25: 0.8,
  threshold3: 0.85,
  rate25: 0.25,
  rate3: 0.03,
  kpiWeights: [0.2, 0.3, 0.5],
  kpiLabels: ['Звонки / результативные касания', 'Прирост клиентского портфеля, шт', 'Оборот по выводам, ₽'],
  adminPassword: 'mozen2025',
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function safeArray(value, fallback) {
  return Array.isArray(value) ? value : fallback
}

export function normalizeParams(raw) {
  const params = { ...DEFAULT_PARAMS, ...(raw || {}) }
  params.threshold25 = safeNumber(params.threshold25, DEFAULT_PARAMS.threshold25)
  params.threshold3 = safeNumber(params.threshold3, DEFAULT_PARAMS.threshold3)
  params.rate25 = safeNumber(params.rate25, DEFAULT_PARAMS.rate25)
  params.rate3 = safeNumber(params.rate3, DEFAULT_PARAMS.rate3)
  params.kpiWeights = safeArray(params.kpiWeights, DEFAULT_PARAMS.kpiWeights).slice(0, 3).map((value, index) => safeNumber(value, DEFAULT_PARAMS.kpiWeights[index]))
  while (params.kpiWeights.length < 3) params.kpiWeights.push(DEFAULT_PARAMS.kpiWeights[params.kpiWeights.length])
  params.kpiLabels = safeArray(params.kpiLabels, DEFAULT_PARAMS.kpiLabels).slice(0, 3).map((value, index) => String(value || DEFAULT_PARAMS.kpiLabels[index]))
  while (params.kpiLabels.length < 3) params.kpiLabels.push(DEFAULT_PARAMS.kpiLabels[params.kpiLabels.length])
  params.adminPassword = String(params.adminPassword || DEFAULT_PARAMS.adminPassword)
  return params
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
    members: [createDefaultKM(1)],
  }
}

export function createDefaultTeams(count = 7) {
  return Array.from({ length: count }, (_, i) => createDefaultTeam(i + 1))
}

export function normalizeTeam(raw, index = 1) {
  const fallback = createDefaultTeam(index)
  const rawMembers = safeArray(raw?.members, fallback.members)
  const members = (rawMembers.length ? rawMembers : fallback.members).map((member, idx) => ({
    ...createDefaultKM(idx + 1),
    ...member,
    id: String(member?.id || createDefaultKM(idx + 1).id),
    name: String(member?.name || `КМ ${idx + 1}`),
    startPortfolio: safeNumber(member?.startPortfolio),
    planGrowth: safeNumber(member?.planGrowth),
    losses: safeNumber(member?.losses),
    newMoney: safeNumber(member?.newMoney),
    kpiPlan: safeArray(member?.kpiPlan, [0, 0, 0]).slice(0, 3).map((value) => safeNumber(value)),
    kpiFact: safeArray(member?.kpiFact, [0, 0, 0]).slice(0, 3).map((value) => safeNumber(value)),
  }))

  while (members.length < 1) members.push(createDefaultKM(members.length + 1))

  const targetKpis = safeArray(raw?.targets?.kpis, fallback.targets.kpis).slice(0, 3).map((value) => safeNumber(value))
  while (targetKpis.length < 3) targetKpis.push(0)

  return {
    ...fallback,
    ...raw,
    id: String(raw?.id || fallback.id),
    name: String(raw?.name || fallback.name),
    targets: {
      planGrowth: safeNumber(raw?.targets?.planGrowth),
      kpis: targetKpis,
    },
    members,
  }
}

export function normalizeTeams(rawTeams) {
  const fallback = createDefaultTeams(7)
  const teams = safeArray(rawTeams, fallback).slice(0, 7)
  while (teams.length < 7) teams.push(createDefaultTeam(teams.length + 1))
  return teams.map((team, index) => normalizeTeam(team, index + 1))
}

export function calcMemberResult(km, teamPct, params) {
  const factPortfolio = safeNumber(km.startPortfolio) - safeNumber(km.losses) + safeNumber(km.newMoney)
  const factGrowth = safeNumber(km.newMoney) - safeNumber(km.losses)
  const retainedBase = Math.max(factPortfolio - safeNumber(km.newMoney), 0)
  const pct = safeNumber(km.planGrowth) > 0 ? factGrowth / safeNumber(km.planGrowth) : 0

  const bonus25Open = teamPct >= safeNumber(params.threshold25)
  const bonus3Open = teamPct >= safeNumber(params.threshold3)
  const bonus25 = bonus25Open ? safeNumber(km.newMoney) * safeNumber(params.rate25) : 0
  const bonus3 = bonus3Open ? retainedBase * safeNumber(params.rate3) : 0
  const availableBonus = bonus25 + bonus3

  const kpiPlanArr = safeArray(km.kpiPlan, [0, 0, 0])
  const kpiFactArr = safeArray(km.kpiFact, [0, 0, 0])
  const weights = safeArray(params.kpiWeights, DEFAULT_PARAMS.kpiWeights)

  let kpiFactor = 0
  for (let i = 0; i < 3; i++) {
    const p = safeNumber(kpiPlanArr[i])
    const f = safeNumber(kpiFactArr[i])
    const w = safeNumber(weights[i])
    const contribution = p > 0 ? Math.min(f / p, 1) * w : 0
    kpiFactor += contribution
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
  const startPortfolio = members.reduce((sum, km) => sum + safeNumber(km.startPortfolio), 0)
  const planGrowthMembers = members.reduce((sum, km) => sum + safeNumber(km.planGrowth), 0)
  const losses = members.reduce((sum, km) => sum + safeNumber(km.losses), 0)
  const newMoney = members.reduce((sum, km) => sum + safeNumber(km.newMoney), 0)

  const activePlanGrowth = safeNumber(team?.targets?.planGrowth) > 0 ? safeNumber(team?.targets?.planGrowth) : planGrowthMembers
  const targetPortfolio = startPortfolio + activePlanGrowth
  const factPortfolio = startPortfolio - losses + newMoney
  const factGrowth = factPortfolio - startPortfolio
  const pct = activePlanGrowth > 0 ? factGrowth / activePlanGrowth : 0

  const memberKpiPlan = [0, 1, 2].map((i) => members.reduce((sum, km) => sum + safeNumber(safeArray(km.kpiPlan, [0, 0, 0])[i]), 0))
  const memberKpiFact = [0, 1, 2].map((i) => members.reduce((sum, km) => sum + safeNumber(safeArray(km.kpiFact, [0, 0, 0])[i]), 0))
  const teamTargetKpis = safeArray(team?.targets?.kpis, [0, 0, 0])

  const kpiRows = [0, 1, 2].map((i) => {
    const plan = safeNumber(teamTargetKpis[i]) > 0 ? safeNumber(teamTargetKpis[i]) : memberKpiPlan[i]
    const fact = memberKpiFact[i]
    const weight = safeNumber(params.kpiWeights[i])
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

  const kpiTotal = Math.min(kpiRows.reduce((sum, row) => sum + row.contribution, 0), 1)
  const memberResults = members.map((km) => calcMemberResult(km, pct, params))
  const totalBonus = memberResults.reduce((sum, row) => sum + row.finalBonus, 0)
  const totalAvailableBonus = memberResults.reduce((sum, row) => sum + row.availableBonus, 0)

  return {
    startPortfolio,
    planGrowthMembers,
    planGrowth: safeNumber(team?.targets?.planGrowth),
    activePlanGrowth,
    losses,
    newMoney,
    targetPortfolio,
    factPortfolio,
    factGrowth,
    pct,
    memberResults,
    totalBonus,
    totalAvailableBonus,
    kpiRows,
    kpiTotal,
    open25: pct >= safeNumber(params.threshold25),
    open3: pct >= safeNumber(params.threshold3),
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
    acc.totalAvailableBonus += row.metrics.totalAvailableBonus
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
    totalAvailableBonus: 0,
  })

  totals.pct = totals.planGrowth > 0 ? totals.factGrowth / totals.planGrowth : 0
  totals.open25 = totals.pct >= safeNumber(params.threshold25)
  totals.open3 = totals.pct >= safeNumber(params.threshold3)

  totals.kpiRows = [0, 1, 2].map((i) => {
    const plan = rows.reduce((sum, row) => sum + safeNumber(row.metrics.kpiRows[i]?.plan), 0)
    const fact = rows.reduce((sum, row) => sum + safeNumber(row.metrics.kpiRows[i]?.fact), 0)
    const weight = safeNumber(params.kpiWeights[i])
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
  totals.kpiTotal = Math.min(totals.kpiRows.reduce((sum, row) => sum + row.contribution, 0), 1)

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
    ['Доступная премия команды', metrics.totalAvailableBonus],
    ['Итоговая премия команды', metrics.totalBonus],
    [],
    ['КМ', 'Стартовый портфель', 'План прироста', 'Потери базы', 'Новые деньги', 'Факт портфеля', 'Факт прироста', '% выполнения', 'Удержанная база', '25% с новых', '3% с базы', 'Доступная премия', 'KPI-фактор', 'Итоговая премия'],
  ]

  team.members.forEach((member, index) => {
    const result = metrics.memberResults[index]
    rows.push([
      member.name,
      safeNumber(member.startPortfolio),
      safeNumber(member.planGrowth),
      safeNumber(member.losses),
      safeNumber(member.newMoney),
      result.factPortfolio,
      result.factGrowth,
      (result.pct * 100).toFixed(1) + '%',
      result.retainedBase,
      result.bonus25,
      result.bonus3,
      result.availableBonus,
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
    ['Команда', 'План прироста', 'Факт прироста', '% выполнения', 'Новые деньги', 'Потери', 'Доступная премия', 'Итоговая премия'],
  ]

  overall.rows.forEach(({ team, metrics }) => {
    rows.push([
      team.name,
      metrics.activePlanGrowth,
      metrics.factGrowth,
      (metrics.pct * 100).toFixed(1) + '%',
      metrics.newMoney,
      metrics.losses,
      metrics.totalAvailableBonus,
      metrics.totalBonus,
    ])
  })

  rows.push([])
  rows.push(['Итого', overall.totals.planGrowth, overall.totals.factGrowth, (overall.totals.pct * 100).toFixed(1) + '%', overall.totals.newMoney, overall.totals.losses, overall.totals.totalAvailableBonus, overall.totals.totalBonus])
  rows.push([])

  teams.forEach((team) => {
    const metrics = calcTeamDashboard(team, params)
    rows.push([team.name])
    rows.push(['КМ', 'Стартовый портфель', 'План прироста', 'Потери базы', 'Новые деньги', 'Факт портфеля', 'Факт прироста', '% выполнения', 'Удержанная база', '25% с новых', '3% с базы', 'Доступная премия', 'KPI-фактор', 'Итоговая премия'])
    team.members.forEach((member, index) => {
      const result = metrics.memberResults[index]
      rows.push([
        member.name,
        safeNumber(member.startPortfolio),
        safeNumber(member.planGrowth),
        safeNumber(member.losses),
        safeNumber(member.newMoney),
        result.factPortfolio,
        result.factGrowth,
        (result.pct * 100).toFixed(1) + '%',
        result.retainedBase,
        result.bonus25,
        result.bonus3,
        result.availableBonus,
        (result.kpiFactor * 100).toFixed(1) + '%',
        result.finalBonus,
      ])
    })
    rows.push([])
  })

  downloadCsv(rows, 'all-teams-results.csv')
}

export function exportJsonConfig(params, teams) {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    params: normalizeParams(params),
    teams: normalizeTeams(teams),
  }
  const json = JSON.stringify(payload, null, 2)
  downloadFile(json, 'mozen-kpi-config.json', 'application/json;charset=utf-8;')
}

export async function importJsonConfig(file) {
  const text = await file.text()
  const payload = JSON.parse(text)
  return {
    params: normalizeParams(payload?.params),
    teams: normalizeTeams(payload?.teams),
  }
}

function downloadCsv(rows, filename) {
  const csv = rows
    .map((row) => row.map(escapeCsvCell).join(';'))
    .join('\n')
  downloadFile('\uFEFF' + csv, filename, 'text/csv;charset=utf-8;')
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
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
