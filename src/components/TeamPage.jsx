import { Copy, Download, ExternalLink } from 'lucide-react'
import { calcTeamDashboard, exportTeamCsv, fmtPct, fmtRub, pctColor } from '../utils/data'
import { Card, KPIGrid, Label, ProgressBar, SectionTitle, StatCard, StatusBadge } from './Shared'

export default function TeamPage({ team, params, openCalculator, canOpenCalculator = false }) {
  const metrics = calcTeamDashboard(team, params)

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#/team/${team.id}`
      await navigator.clipboard.writeText(url)
      window.alert('Ссылка на страницу команды скопирована')
    } catch {
      window.alert('Не удалось скопировать ссылку')
    }
  }

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem', display: 'grid', gap: '1rem' }}>
      <Card accent className="hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <Label>Отдельная страница команды</Label>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', marginTop: '0.3rem' }}>{team.name}</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.9rem', marginTop: '0.45rem', maxWidth: 720 }}>
              Эта страница сделана под отдельную команду. На общих экранах премии других команд не показываются.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
            <button className="btn-ghost" onClick={handleCopyLink}>
              <Copy size={14} />
              Скопировать ссылку
            </button>
            <button className="btn-ghost" onClick={() => exportTeamCsv(team, params)}>
              <Download size={14} />
              CSV команды
            </button>
            {canOpenCalculator ? (
              <button className="btn-primary" onClick={openCalculator}>
                <ExternalLink size={14} />
                Открыть калькулятор
              </button>
            ) : null}
          </div>
        </div>
      </Card>

      <div className="stats-grid-6">
        <StatCard label="Стартовый портфель" value={fmtRub(metrics.startPortfolio)} />
        <StatCard label="План команды" value={fmtRub(metrics.activePlanGrowth)} />
        <StatCard label="Факт прироста" value={fmtRub(metrics.factGrowth)} accent />
        <StatCard label="Новые деньги" value={fmtRub(metrics.newMoney)} />
        <StatCard label="Доступная премия" value={fmtRub(metrics.totalAvailableBonus)} />
        <StatCard label="Итоговая премия" value={fmtRub(metrics.totalBonus)} />
      </div>

      <Card>
        <SectionTitle>Статус выполнения плана</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }} className="hero-split">
          <div>
            <Label style={{ marginBottom: '0.4rem' }}>Выполнение плана команды</Label>
            <ProgressBar value={metrics.pct} />
            <div style={{ marginTop: '0.55rem', fontWeight: 900, fontSize: '1.15rem', color: pctColor(metrics.pct) }}>{fmtPct(metrics.pct)}</div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignContent: 'flex-start' }}>
            <StatusBadge open={metrics.open25} label={`25% с новых · ${fmtPct(params.threshold25)}`} />
            <StatusBadge open={metrics.open3} label={`3% с базы · ${fmtPct(params.threshold3)}`} />
            <span className="tag">КМ: {team.members.length}</span>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Дашборд показателей команды</SectionTitle>
        <KPIGrid rows={metrics.kpiRows} />
      </Card>

      <Card>
        <SectionTitle>Премия по КМ внутри команды</SectionTitle>
        <div className="summary-table">
          <div className="summary-row summary-head summary-6">
            <span>КМ</span>
            <span>Факт прироста</span>
            <span>Доступная премия</span>
            <span>KPI-фактор</span>
            <span>Итоговая премия</span>
            <span>Статус</span>
          </div>
          {team.members.map((member, index) => {
            const result = metrics.memberResults[index]
            return (
              <div key={member.id} className="summary-row summary-6">
                <span>{member.name}</span>
                <span>{fmtRub(result.factGrowth)}</span>
                <span>{fmtRub(result.availableBonus)}</span>
                <strong>{fmtPct(result.kpiFactor)}</strong>
                <strong>{fmtRub(result.finalBonus)}</strong>
                <span>{result.bonus25Open ? '25% открыт' : '25% закрыт'} / {result.bonus3Open ? '3% открыт' : '3% закрыт'}</span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
