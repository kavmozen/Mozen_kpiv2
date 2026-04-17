import { Download } from 'lucide-react'
import { calcOverallDashboard, exportAllTeamsCsv, fmtPct, fmtRub } from '../utils/data'
import { Card, KPIGrid, Label, ProgressBar, SectionTitle, StatCard, StatusBadge } from './Shared'

export default function OverallDashboard({ teams, params }) {
  const overall = calcOverallDashboard(teams, params)

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
      <Card accent>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <SectionTitle style={{ marginBottom: '0.3rem' }}>Общий дашборд отдела</SectionTitle>
            <div style={{ color: 'var(--text2)', fontSize: '0.86rem' }}>
              Сумма всех команд по плану, факту, KPI и общей премии
            </div>
          </div>
          <button className="btn-primary" onClick={() => exportAllTeamsCsv(teams, params)}>
            <Download size={14} />
            Выгрузить общий CSV
          </button>
        </div>

        <div className="stats-grid-6" style={{ marginTop: '1rem' }}>
          <StatCard label="Стартовый портфель" value={fmtRub(overall.totals.startPortfolio)} />
          <StatCard label="Общий план" value={fmtRub(overall.totals.planGrowth)} />
          <StatCard label="Факт прироста" value={fmtRub(overall.totals.factGrowth)} accent />
          <StatCard label="Новые деньги" value={fmtRub(overall.totals.newMoney)} />
          <StatCard label="Потери" value={fmtRub(overall.totals.losses)} />
          <StatCard label="Итоговая премия" value={fmtRub(overall.totals.totalBonus)} />
        </div>

        <div style={{ marginTop: '1rem' }}>
          <Label style={{ marginBottom: '0.4rem' }}>Выполнение общего плана</Label>
          <ProgressBar value={overall.totals.pct} />
          <div style={{ marginTop: '0.45rem', fontWeight: 800 }}>{fmtPct(overall.totals.pct)}</div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <StatusBadge open={overall.totals.open25} label={`25% с новых денег · ${fmtPct(params.threshold25)}`} />
          <StatusBadge open={overall.totals.open3} label={`3% с удержанной базы · ${fmtPct(params.threshold3)}`} />
        </div>
      </Card>

      <Card>
        <SectionTitle>KPI по всему отделу</SectionTitle>
        <KPIGrid rows={overall.totals.kpiRows} />
      </Card>

      <Card>
        <SectionTitle>Команды в разрезе общего плана</SectionTitle>
        <div className="summary-table">
          <div className="summary-row summary-head summary-5">
            <span>Команда</span>
            <span>План</span>
            <span>Факт</span>
            <span>Выполнение</span>
            <span>Премия</span>
          </div>
          {overall.rows.map(({ team, metrics }) => (
            <div key={team.id} className="summary-row summary-5">
              <span>{team.name}</span>
              <span>{fmtRub(metrics.activePlanGrowth)}</span>
              <span>{fmtRub(metrics.factGrowth)}</span>
              <strong>{fmtPct(metrics.pct)}</strong>
              <strong>{fmtRub(metrics.totalBonus)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
