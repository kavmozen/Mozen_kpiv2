import { useMemo, useState } from 'react'
import { AlertTriangle, Download, Lock, ShieldCheck, Unlock } from 'lucide-react'
import { calcOverallDashboard, exportAllTeamsCsv } from '../utils/data'
import { Card, Label, SectionTitle, StatCard } from './Shared'

const ADMIN_MENU = [
  { id: 'common', label: 'Общие настройки' },
  { id: 'overall', label: 'Общий план' },
]

export default function AdminPanel({ params, setParams, teams, setTeams, adminUnlocked, setAdminUnlocked }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [menu, setMenu] = useState('common')
  const overall = useMemo(() => calcOverallDashboard(teams, params), [teams, params])

  const teamMenu = teams.map((team) => ({ id: team.id, label: team.name }))

  const handleLogin = () => {
    if (password === params.adminPassword) {
      setAdminUnlocked(true)
      setError('')
    } else {
      setError('Неверный пароль')
    }
  }

  const updateWeight = (index, value) => {
    const next = [...params.kpiWeights]
    next[index] = parseFloat(value) || 0
    setParams({ ...params, kpiWeights: next })
  }

  const updateLabel = (index, value) => {
    const next = [...params.kpiLabels]
    next[index] = value
    setParams({ ...params, kpiLabels: next })
  }

  const updateTeam = (teamId, patch) => {
    setTeams((prev) => prev.map((team) => (team.id === teamId ? { ...team, ...patch } : team)))
  }

  const updateTeamTargets = (teamId, patch) => {
    setTeams((prev) => prev.map((team) => {
      if (team.id !== teamId) return team
      return {
        ...team,
        targets: {
          ...team.targets,
          ...patch,
        },
      }
    }))
  }

  const weightSum = params.kpiWeights.reduce((sum, value) => sum + value, 0)
  const weightsValid = Math.abs(weightSum - 1) < 0.001

  if (!adminUnlocked) {
    return (
      <div className="animate-in" style={{ paddingTop: '3rem', display: 'flex', justifyContent: 'center' }}>
        <Card style={{ maxWidth: 420, width: '100%' }} accent>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="lock-circle"><Lock size={22} /></div>
            <div style={{ fontWeight: 900, fontSize: '1.3rem', marginBottom: '0.35rem' }}>Вход в админку</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>Для доступа к настройкам и рейтингу команд введи пароль</div>
          </div>

          <div>
            <Label>Пароль администратора</Label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="mozen2025"
              style={{ textAlign: 'left' }}
            />
            {error ? <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: '0.45rem' }}>{error}</div> : null}
          </div>

          <button className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleLogin}>
            <Unlock size={14} />
            Войти
          </button>

          <div style={{ marginTop: '0.85rem', color: 'var(--text3)', fontSize: '0.78rem', textAlign: 'center' }}>
            Пароль по ТЗ: <strong>mozen2025</strong>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="animate-in" style={{ paddingTop: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1rem' }} className="admin-layout">
        <Card style={{ alignSelf: 'start', position: 'sticky', top: 110 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <ShieldCheck size={18} color="var(--accent)" />
            <div style={{ fontWeight: 900 }}>Админка</div>
          </div>

          <div className="admin-menu-list">
            {ADMIN_MENU.map((item) => (
              <button key={item.id} className={menu === item.id ? 'admin-menu-btn active' : 'admin-menu-btn'} onClick={() => setMenu(item.id)}>
                {item.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '1rem 0' }} />

          <Label style={{ marginBottom: '0.5rem' }}>Команды</Label>
          <div className="admin-menu-list">
            {teamMenu.map((item) => (
              <button key={item.id} className={menu === item.id ? 'admin-menu-btn active' : 'admin-menu-btn'} onClick={() => setMenu(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </Card>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {menu === 'common' && (
            <>
              <Card>
                <SectionTitle>Общие настройки мотивации</SectionTitle>
                <div className="form-grid-2">
                  <div>
                    <Label>Порог 25% с новых денег</Label>
                    <input type="number" value={params.threshold25} onChange={(e) => setParams({ ...params, threshold25: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Порог 3% с удержанной базы</Label>
                    <input type="number" value={params.threshold3} onChange={(e) => setParams({ ...params, threshold3: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Ставка с новых денег</Label>
                    <input type="number" value={params.rate25} onChange={(e) => setParams({ ...params, rate25: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Ставка с удержанной базы</Label>
                    <input type="number" value={params.rate3} onChange={(e) => setParams({ ...params, rate3: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
              </Card>

              <Card>
                <SectionTitle>KPI-показатели и веса</SectionTitle>
                {!weightsValid ? (
                  <div className="warning-box">
                    <AlertTriangle size={14} />
                    Сумма весов должна быть ровно 100%. Сейчас: {(weightSum * 100).toFixed(0)}%
                  </div>
                ) : null}
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  {params.kpiLabels.map((label, index) => (
                    <div key={index} className="kpi-admin-row">
                      <div>
                        <Label>Название показателя</Label>
                        <input type="text" value={label} onChange={(e) => updateLabel(index, e.target.value)} style={{ textAlign: 'left' }} />
                      </div>
                      <div>
                        <Label>Вес</Label>
                        <input type="number" value={params.kpiWeights[index]} onChange={(e) => updateWeight(index, e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {menu === 'overall' && (
            <>
              <Card accent>
                <SectionTitle>
                  Общий план по всем командам
                  <button className="btn-primary" onClick={() => exportAllTeamsCsv(teams, params)}>
                    <Download size={14} />
                    Выгрузить все
                  </button>
                </SectionTitle>
                <div className="stats-grid-4">
                  <StatCard label="Сумма планов" value={overall.totals.planGrowth.toLocaleString('ru-RU') + ' ₽'} />
                  <StatCard label="Факт прироста" value={overall.totals.factGrowth.toLocaleString('ru-RU') + ' ₽'} accent />
                  <StatCard label="Новые деньги" value={overall.totals.newMoney.toLocaleString('ru-RU') + ' ₽'} />
                  <StatCard label="Общая премия" value={overall.totals.totalBonus.toLocaleString('ru-RU') + ' ₽'} />
                </div>
              </Card>

              <Card>
                <SectionTitle>Планы по командам</SectionTitle>
                <div className="summary-table">
                  <div className="summary-row summary-head summary-4">
                    <span>Команда</span>
                    <span>План прироста</span>
                    <span>Значения KPI</span>
                    <span>КМ</span>
                  </div>
                  {teams.map((team) => (
                    <div key={team.id} className="summary-row summary-4">
                      <span>{team.name}</span>
                      <strong>{team.targets.planGrowth.toLocaleString('ru-RU')} ₽</strong>
                      <span>{team.targets.kpis.map((value) => value.toLocaleString('ru-RU')).join(' / ')}</span>
                      <span>{team.members.length}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {teams.some((team) => team.id === menu) && (() => {
            const team = teams.find((item) => item.id === menu)
            if (!team) return null
            return (
              <>
                <Card accent>
                  <SectionTitle>{team.name} · настройки команды</SectionTitle>
                  <div className="form-grid-2">
                    <div>
                      <Label>Название команды</Label>
                      <input type="text" value={team.name} onChange={(e) => updateTeam(team.id, { name: e.target.value })} style={{ textAlign: 'left' }} />
                    </div>
                    <div>
                      <Label>План прироста команды, ₽</Label>
                      <input type="number" value={team.targets.planGrowth} onChange={(e) => updateTeamTargets(team.id, { planGrowth: parseFloat(e.target.value) || 0 })} />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Плановые показатели команды</SectionTitle>
                  <div className="form-grid-3">
                    {params.kpiLabels.map((label, index) => (
                      <div key={index}>
                        <Label>{label}</Label>
                        <input
                          type="number"
                          value={team.targets.kpis[index] || 0}
                          onChange={(e) => {
                            const next = [...team.targets.kpis]
                            next[index] = parseFloat(e.target.value) || 0
                            updateTeamTargets(team.id, { kpis: next })
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                <Card>
                  <SectionTitle>Краткая справка</SectionTitle>
                  <div className="stats-grid-3">
                    <StatCard label="КМ в команде" value={String(team.members.length)} />
                    <StatCard label="Текущий план" value={team.targets.planGrowth.toLocaleString('ru-RU') + ' ₽'} />
                    <StatCard label="KPI-цели" value={team.targets.kpis.map((value) => value.toLocaleString('ru-RU')).join(' / ')} />
                  </div>
                </Card>
              </>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
