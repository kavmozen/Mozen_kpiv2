import { Download, Plus, Trash2 } from 'lucide-react'
import {
  calcTeamDashboard,
  createDefaultKM,
  exportTeamCsv,
  fmtPct,
  fmtRub,
  pctColor,
} from '../utils/data'
import { Card, KPIGrid, Label, ProgressBar, SectionTitle, StatCard, StatusBadge } from './Shared'

function NumInput({ value, onChange, placeholder = '0' }) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
    />
  )
}

function KMCard({ km, index, onChange, onRemove, result, params }) {
  const updateField = (field, value) => onChange({ ...km, [field]: value })

  const updateKpiPlan = (i, value) => {
    const next = [...(km.kpiPlan || [0, 0, 0])]
    next[i] = value
    updateField('kpiPlan', next)
  }

  const updateKpiFact = (i, value) => {
    const next = [...(km.kpiFact || [0, 0, 0])]
    next[i] = value
    updateField('kpiFact', next)
  }

  return (
    <Card style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="member-badge">{index + 1}</div>
        <input
          type="text"
          value={km.name}
          onChange={(e) => updateField('name', e.target.value)}
          style={{ fontWeight: 800, fontSize: '1rem', textAlign: 'left' }}
        />
        <button className="icon-btn danger" onClick={onRemove} title="Удалить КМ">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="form-grid-2">
        <div>
          <Label>Стартовый портфель, ₽</Label>
          <NumInput value={km.startPortfolio} onChange={(value) => updateField('startPortfolio', value)} />
        </div>
        <div>
          <Label>План прироста, ₽</Label>
          <NumInput value={km.planGrowth} onChange={(value) => updateField('planGrowth', value)} />
        </div>
        <div>
          <Label>Потери базы, ₽</Label>
          <NumInput value={km.losses} onChange={(value) => updateField('losses', value)} />
        </div>
        <div>
          <Label>Новые деньги, ₽</Label>
          <NumInput value={km.newMoney} onChange={(value) => updateField('newMoney', value)} />
        </div>
      </div>

      <div style={{ marginTop: '1rem' }} className="stats-grid-4 compact-grid">
        <StatCard label="Факт прироста" value={fmtRub(result.factGrowth)} />
        <StatCard label="Доступная премия" value={fmtRub(result.availableBonus)} />
        <StatCard label="KPI-фактор" value={fmtPct(result.kpiFactor)} />
        <StatCard label="Итоговая премия" value={fmtRub(result.finalBonus)} accent />
      </div>

      <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginTop: '0.9rem' }}>
        <StatusBadge open={result.bonus25Open} label="25% с новых" />
        <StatusBadge open={result.bonus3Open} label="3% с базы" />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <SectionTitle>
          KPI-фактор КМ <span style={{ color: pctColor(result.kpiFactor), fontSize: '0.95rem' }}>{fmtPct(result.kpiFactor)}</span>
        </SectionTitle>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {params.kpiLabels.map((label, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.45rem' }}>
                <Label style={{ flex: 1 }}>{label}</Label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>
                  вес {(params.kpiWeights[i] * 100).toFixed(0)}%
                </span>
              </div>
              <div className="form-grid-2">
                <div>
                  <Label style={{ marginBottom: '0.3rem' }}>План</Label>
                  <NumInput value={(km.kpiPlan || [0, 0, 0])[i]} onChange={(value) => updateKpiPlan(i, value)} />
                </div>
                <div>
                  <Label style={{ marginBottom: '0.3rem' }}>Факт</Label>
                  <NumInput value={(km.kpiFact || [0, 0, 0])[i]} onChange={(value) => updateKpiFact(i, value)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

export default function Calculator({ team, setTeam, params, openTeamPage }) {
  const metrics = calcTeamDashboard(team, params)

  const updateMember = (memberIndex, nextMember) => {
    setTeam({
      ...team,
      members: team.members.map((member, index) => (index === memberIndex ? nextMember : member)),
    })
  }

  const addMember = () => {
    setTeam({
      ...team,
      members: [...team.members, createDefaultKM(team.members.length + 1)],
    })
  }

  const removeMember = (memberIndex) => {
    if (team.members.length <= 1) return
    setTeam({
      ...team,
      members: team.members.filter((_, index) => index !== memberIndex),
    })
  }

  const resetTeamData = () => {
    setTeam({
      ...team,
      members: team.members.map((member, index) => ({
        ...createDefaultKM(index + 1),
        id: member.id,
        name: member.name,
      })),
    })
  }

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
      <Card accent>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div>
            <Label>Калькулятор активной команды</Label>
            <div style={{ fontSize: '1.55rem', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '0.25rem' }}>{team.name}</div>
            <div style={{ marginTop: '0.35rem', color: 'var(--text2)', fontSize: '0.85rem' }}>
              Расчет премии приведен к Excel-калькулятору. Страница команды открывается отдельно, без показа чужих премий.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={openTeamPage}>Открыть страницу команды</button>
            <button className="btn-ghost" onClick={resetTeamData}>Сбросить данные</button>
            <button className="btn-primary" onClick={() => exportTeamCsv(team, params)}>
              <Download size={14} />
              Выгрузить CSV
            </button>
          </div>
        </div>

        <div className="stats-grid-6">
          <StatCard label="План команды" value={fmtRub(metrics.activePlanGrowth)} subvalue={team.targets.planGrowth > 0 ? 'из админки' : 'по сумме КМ'} />
          <StatCard label="Факт прироста" value={fmtRub(metrics.factGrowth)} accent />
          <StatCard label="Выполнение" value={fmtPct(metrics.pct)} />
          <StatCard label="Новые деньги" value={fmtRub(metrics.newMoney)} />
          <StatCard label="Доступная премия" value={fmtRub(metrics.totalAvailableBonus)} />
          <StatCard label="Итоговая премия" value={fmtRub(metrics.totalBonus)} />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Label style={{ marginBottom: '0.4rem' }}>% выполнения плана команды</Label>
          <ProgressBar value={metrics.pct} />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <StatusBadge open={metrics.open25} label={`25% с новых денег · порог ${fmtPct(params.threshold25)}`} />
          <StatusBadge open={metrics.open3} label={`3% с удержанной базы · порог ${fmtPct(params.threshold3)}`} />
          <span className="tag">КМ: {team.members.length}</span>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <SectionTitle>Показатели команды</SectionTitle>
          <KPIGrid rows={metrics.kpiRows} />
        </div>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Клиентские менеджеры</div>
          <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Итоговая премия КМ = доступная премия × KPI-фактор КМ</div>
        </div>
        <button className="btn-primary" onClick={addMember}>
          <Plus size={14} />
          Добавить КМ
        </button>
      </div>

      <div className="members-grid">
        {team.members.map((member, index) => (
          <KMCard
            key={member.id}
            km={member}
            index={index}
            onChange={(nextMember) => updateMember(index, nextMember)}
            onRemove={() => removeMember(index)}
            result={metrics.memberResults[index]}
            params={params}
          />
        ))}
      </div>

      <Card>
        <SectionTitle>Итог по команде {team.name}</SectionTitle>
        <div className="summary-table">
          <div className="summary-row summary-head summary-5">
            <span>КМ</span>
            <span>Факт прироста</span>
            <span>Доступная премия</span>
            <span>KPI-фактор</span>
            <span>Итоговая премия</span>
          </div>
          {team.members.map((member, index) => {
            const result = metrics.memberResults[index]
            return (
              <div className="summary-row summary-5" key={member.id}>
                <span>{member.name}</span>
                <span>{fmtRub(result.factGrowth)}</span>
                <span>{fmtRub(result.availableBonus)}</span>
                <strong>{fmtPct(result.kpiFactor)}</strong>
                <strong>{fmtRub(result.finalBonus)}</strong>
              </div>
            )
          })}
          <div className="summary-row summary-5 total">
            <strong>Итого команда</strong>
            <strong>{fmtRub(metrics.factGrowth)}</strong>
            <strong>{fmtRub(metrics.totalAvailableBonus)}</strong>
            <strong>{fmtPct(metrics.kpiTotal)}</strong>
            <strong>{fmtRub(metrics.totalBonus)}</strong>
          </div>
        </div>
      </Card>
    </div>
  )
}
