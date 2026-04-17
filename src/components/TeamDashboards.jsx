import { ArrowRight, Download } from 'lucide-react'
import { calcTeamDashboard, exportAllTeamsCsv, exportTeamCsv, fmtPct, fmtRub, pctColor } from '../utils/data'
import { Card, KPIGrid, Label, ProgressBar, SectionTitle, StatusBadge, StatCard } from './Shared'

export default function TeamDashboards({ teams, params, setActiveTeamId, openCalculator }) {
  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem' }}>
      <Card style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <SectionTitle style={{ marginBottom: '0.3rem' }}>Дашборды по каждой команде</SectionTitle>
            <div style={{ color: 'var(--text2)', fontSize: '0.86rem' }}>
              Здесь собраны все 7 команд с основными показателями, выполнением плана и KPI-контролем
            </div>
          </div>
          <button className="btn-primary" onClick={() => exportAllTeamsCsv(teams, params)}>
            <Download size={14} />
            Выгрузить все команды
          </button>
        </div>
      </Card>

      <div className="dashboards-grid">
        {teams.map((team) => {
          const metrics = calcTeamDashboard(team, params)
          return (
            <Card key={team.id} accent={metrics.pct >= params.threshold25}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>{team.name}</div>
                  <div style={{ color: 'var(--text2)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                    Выполнение плана: <strong style={{ color: pctColor(metrics.pct) }}>{fmtPct(metrics.pct)}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button className="btn-ghost" onClick={() => exportTeamCsv(team, params)}>
                    <Download size={14} />
                    CSV
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setActiveTeamId(team.id)
                      openCalculator()
                    }}
                  >
                    Открыть
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              <div className="stats-grid-4">
                <StatCard label="План" value={fmtRub(metrics.activePlanGrowth)} />
                <StatCard label="Факт прироста" value={fmtRub(metrics.factGrowth)} />
                <StatCard label="Новые деньги" value={fmtRub(metrics.newMoney)} />
                <StatCard label="Премия" value={fmtRub(metrics.totalBonus)} accent />
              </div>

              <div style={{ marginTop: '0.9rem' }}>
                <Label style={{ marginBottom: '0.4rem' }}>Прогресс по плану</Label>
                <ProgressBar value={metrics.pct} />
              </div>

              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', marginTop: '0.85rem' }}>
                <StatusBadge open={metrics.open25} label="25% открыт" />
                <StatusBadge open={metrics.open3} label="3% открыт" />
                <span className="tag">КМ: {team.members.length}</span>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <SectionTitle>Показатели команды</SectionTitle>
                <KPIGrid rows={metrics.kpiRows} />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
