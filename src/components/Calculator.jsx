import { useMemo } from 'react'
import { Download, Plus, Trash2, Users } from 'lucide-react'
import {
  calcTeamDashboard,
  createDefaultKM,
  exportTeamCsv,
  fmt,
  fmtPct,
  fmtRub,
  pctColor,
} from '../utils/data'
import { Card, KPIGrid, Label, ProgressBar, SectionTitle, StatCard, StatusBadge } from './Shared'

function TeamPicker({ teams, activeTeamId, setActiveTeamId }) {
  return (
    <div className="team-picker-grid">
      {teams.map((team, index) => (
        <button
          key={team.id}
          onClick={() => setActiveTeamId(team.id)}
          className={activeTeamId === team.id ? 'team-chip active' : 'team-chip'}
        >
          <span>{index + 1}. {team.name}</span>
        </button>
      ))}
    </div>
  )
}

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

      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
        <StatCard label="Факт прироста" value={fmtRub(result.factGrowth)} />
        <StatCard label="Выполнение" value={fmtPct(result.pct)} />
        <StatCard label="Премия" value={fmtRub(result.finalBonus)} accent />
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

export default function Calculator({ teams, setTeams, params, activeTeamId, setActiveTeamId }) {
  const activeIndex = Math.max(teams.findIndex((team) => team.id === activeTeamId), 0)
  const team = teams[activeIndex]
  const metrics = useMemo(() => calcTeamDashboard(team, params), [team, params])

  const updateTeam = (nextTeam) => {
    setTeams((prev) => prev.map((item, index) => (index === activeIndex ? nextTeam : item)))
  }

  const updateMember = (memberIndex, nextMember) => {
    updateTeam({
      ...team,
      members: team.members.map((member, index) => (index === memberIndex ? nextMember : member)),
    })
  }

  const addMember = () => {
    updateTeam({
      ...team,
      members: [...team.members, createDefaultKM(team.members.length + 1)],
    })
  }

  const removeMember = (memberIndex) => {
    if (team.members.length <= 1) return
    updateTeam({
      ...team,
      members: team.members.filter((_, index) => index !== memberIndex),
    })
  }

  const resetTeamData = () => {
    updateTeam({
      ...team,
      members: team.members.map((member, index) => ({
        ...createDefaultKM(index + 1),
        id: member.id,
        name: member.name,
      })),
    })
  }

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem' }}>
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Card>
          <SectionTitle>Калькулятор по командам</SectionTitle>
          <TeamPicker teams={teams} activeTeamId={activeTeamId} setActiveTeamId={setActiveTeamId} />
        </Card>

        <Card accent>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <div>
              <Label>Активная команда</Label>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '0.25rem' }}>{team.name}</div>
              <div style={{ marginTop: '0.35rem', color: 'var(--text2)', fontSize: '0.85rem' }}>
                В калькуляторе редактируются КМ и фактические показатели. План команды настраивается в админке.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button className="btn-ghost" onClick={resetTeamData}>Сбросить данные команды</button>
              <button className="btn-primary" onClick={() => exportTeamCsv(team, params)}>
                <Download size={14} />
                Выгрузить команду
              </button>
            </div>
          </div>

          <div className="stats-grid-6">
            <StatCard label="План команды" value={fmtRub(metrics.activePlanGrowth)} subvalue={team.targets.planGrowth > 0 ? 'из админки' : 'по сумме КМ'} />
            <StatCard label="Факт прироста" value={fmtRub(metrics.factGrowth)} />
            <StatCard label="Выполнение" value={fmtPct(metrics.pct)} accent />
            <StatCard label="Новые деньги" value={fmtRub(metrics.newMoney)} />
            <StatCard label="Потери" value={fmtRub(metrics.losses)} />
            <StatCard label="Итоговая премия" value={fmtRub(metrics.totalBonus)} />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <Label style={{ marginBottom: '0.4rem' }}>% выполнения плана команды</Label>
            <ProgressBar value={metrics.pct} />
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <StatusBadge open={metrics.open25} label={`25% с новых денег · порог ${fmtPct(params.threshold25)}`} />
            <StatusBadge open={metrics.open3} label={`3% с удержанной базы · порог ${fmtPct(params.threshold3)}`} />
            <span className="tag"><Users size={12} /> КМ: {team.members.length}</span>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <SectionTitle>Дашборд показателей команды</SectionTitle>
            <KPIGrid rows={metrics.kpiRows} />
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Клиентские менеджеры</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Премия рассчитывается с учетом командного выполнения и личного KPI-фактора</div>
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
            <div className="summary-row summary-head">
              <span>КМ</span>
              <span>Факт прироста</span>
              <span>KPI-фактор</span>
              <span>Итоговая премия</span>
            </div>
            {team.members.map((member, index) => (
              <div className="summary-row" key={member.id}>
                <span>{member.name}</span>
                <span>{fmtRub(metrics.memberResults[index].factGrowth)}</span>
                <span>{fmtPct(metrics.memberResults[index].kpiFactor)}</span>
                <strong>{fmtRub(metrics.memberResults[index].finalBonus)}</strong>
              </div>
            ))}
            <div className="summary-row total">
              <strong>Итого команда</strong>
              <strong>{fmtRub(metrics.factGrowth)}</strong>
              <strong>{fmtPct(metrics.kpiTotal)}</strong>
              <strong>{fmtRub(metrics.totalBonus)}</strong>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
