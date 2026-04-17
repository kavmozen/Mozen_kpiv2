import { Medal, ShieldCheck } from 'lucide-react'
import { calcTeamDashboard, fmtPct, fmtRub } from '../utils/data'
import { Card, Label, ProgressBar } from './Shared'

export default function RatingPage({ teams, params }) {
  const ranking = teams
    .map((team) => ({ team, metrics: calcTeamDashboard(team, params) }))
    .sort((a, b) => b.metrics.pct - a.metrics.pct)

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
      <Card accent>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <ShieldCheck size={18} color="var(--accent)" />
          <div style={{ fontWeight: 900, fontSize: '1.2rem' }}>Рейтинг команд</div>
        </div>
        <div style={{ color: 'var(--text2)', fontSize: '0.86rem' }}>
          Страница доступна только после входа в админку. Премии в рейтинге специально не показываются — только выполнение плана и управленческие показатели.
        </div>
      </Card>

      <div className="dashboards-grid">
        {ranking.map(({ team, metrics }, index) => (
          <Card key={team.id} accent={index === 0}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="rank-badge">#{index + 1}</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.12rem' }}>{team.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.82rem' }}>Факт прироста: {fmtRub(metrics.factGrowth)}</div>
                </div>
              </div>
              {index < 3 ? <Medal size={18} color="var(--accent)" /> : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="mini-box">
                <Label>План</Label>
                <strong>{fmtRub(metrics.activePlanGrowth)}</strong>
              </div>
              <div className="mini-box">
                <Label>Выполнение</Label>
                <strong>{fmtPct(metrics.pct)}</strong>
              </div>
              <div className="mini-box">
                <Label>KPI команды</Label>
                <strong>{fmtPct(metrics.kpiTotal)}</strong>
              </div>
            </div>

            <ProgressBar value={metrics.pct} />
          </Card>
        ))}
      </div>
    </div>
  )
}
