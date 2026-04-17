import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Calculator as CalcIcon,
  BookOpen,
  Settings,
  LayoutDashboard,
  Trophy,
} from 'lucide-react'
import Calculator from './components/Calculator'
import AdminPanel from './components/AdminPanel'
import TeamDashboards from './components/TeamDashboards'
import OverallDashboard from './components/OverallDashboard'
import RatingPage from './components/RatingPage'
import {
  DEFAULT_PARAMS,
  STORAGE_KEYS,
  createDefaultTeams,
  normalizeTeams,
} from './utils/data'

const BASE_TABS = [
  { id: 'calc', label: 'Калькулятор', icon: CalcIcon },
  { id: 'teams', label: 'Команды', icon: LayoutDashboard },
  { id: 'overall', label: 'Общий дашборд', icon: BarChart3 },
  { id: 'rules', label: 'Регламент', icon: BookOpen },
  { id: 'admin', label: 'Админка', icon: Settings },
]

export default function App() {
  const [tab, setTab] = useState('calc')
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.params)
      return saved ? { ...DEFAULT_PARAMS, ...JSON.parse(saved) } : DEFAULT_PARAMS
    } catch {
      return DEFAULT_PARAMS
    }
  })
  const [teams, setTeams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.teams)
      return saved ? normalizeTeams(JSON.parse(saved)) : createDefaultTeams(7)
    } catch {
      return createDefaultTeams(7)
    }
  })
  const [month, setMonth] = useState(() => localStorage.getItem(STORAGE_KEYS.month) || '')
  const [activeTeamId, setActiveTeamId] = useState(() => localStorage.getItem(STORAGE_KEYS.activeTeamId) || 'team-1')
  const [adminUnlocked, setAdminUnlocked] = useState(() => localStorage.getItem(STORAGE_KEYS.adminUnlocked) === 'true')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.params, JSON.stringify(params))
  }, [params])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams))
  }, [teams])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.month, month)
  }, [month])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.adminUnlocked, String(adminUnlocked))
  }, [adminUnlocked])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeTeamId, activeTeamId)
  }, [activeTeamId])

  const tabs = useMemo(() => (
    adminUnlocked
      ? [...BASE_TABS.slice(0, 4), { id: 'rating', label: 'Рейтинг', icon: Trophy }, BASE_TABS[4]]
      : BASE_TABS
  ), [adminUnlocked])

  useEffect(() => {
    if (tab === 'rating' && !adminUnlocked) setTab('admin')
  }, [tab, adminUnlocked])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header tabs={tabs} tab={tab} setTab={setTab} month={month} setMonth={setMonth} adminUnlocked={adminUnlocked} />

      <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', padding: '0 1.25rem 3rem' }}>
        {tab === 'calc' && (
          <Calculator
            teams={teams}
            setTeams={setTeams}
            params={params}
            activeTeamId={activeTeamId}
            setActiveTeamId={setActiveTeamId}
          />
        )}

        {tab === 'teams' && (
          <TeamDashboards
            teams={teams}
            params={params}
            setActiveTeamId={setActiveTeamId}
            openCalculator={() => setTab('calc')}
          />
        )}

        {tab === 'overall' && <OverallDashboard teams={teams} params={params} />}
        {tab === 'rules' && <RulesTab />}
        {tab === 'rating' && adminUnlocked && <RatingPage teams={teams} params={params} />}
        {tab === 'admin' && (
          <AdminPanel
            params={params}
            setParams={setParams}
            teams={teams}
            setTeams={setTeams}
            adminUnlocked={adminUnlocked}
            setAdminUnlocked={setAdminUnlocked}
          />
        )}
      </main>
    </div>
  )
}

function Header({ tabs, tab, setTab, month, setMonth, adminUnlocked }) {
  return (
    <header className="site-header">
      <div className="container-row">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
            <div className="brand-icon">
              <BarChart3 size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.03em' }}>
                MOZEN <span style={{ color: 'var(--accent)' }}>KPI</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Светлая версия · 7 команд · White / Red
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="tag">Админ: {adminUnlocked ? 'доступ открыт' : 'требуется пароль'}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'var(--font-mono)' }}>Месяц</span>
              <input
                type="text"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="Апрель 2026"
                style={{ width: 140, textAlign: 'left' }}
              />
            </div>
          </div>
        </div>

        <div className="tabs-row">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={tab === id ? 'tab-btn active' : 'tab-btn'}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

function RulesTab() {
  const sections = [
    {
      title: '1. Командная логика',
      text: 'Теперь в системе 7 команд. Для каждой команды есть свой калькулятор, свои KPI-показатели, собственные настройки в админке и отдельный дашборд выполнения плана.',
    },
    {
      title: '2. Светлая тема',
      text: 'Интерфейс переведен в светлую тему с белой базой и красными акцентами. Акцент сделан на читабельности, управленческих карточках и быстрых сценариях для руководителя.',
    },
    {
      title: '3. Планы команды и общий план',
      text: 'Для каждой команды можно задать название и плановые показатели. Отдельно появился общий дашборд, где автоматически суммируются все команды по ключевым метрикам.',
    },
    {
      title: '4. Экспорт результатов',
      text: 'Можно выгружать CSV-таблицу как по отдельной команде, так и по всем командам сразу. В выгрузку попадают командные итоги и данные по КМ.',
    },
    {
      title: '5. Рейтинг команд',
      text: 'Появилась отдельная страница рейтинга по выполнению планов. Она доступна только после входа в админку по паролю mozen2025.',
    },
    {
      title: '6. KPI-фактор КМ',
      text: 'У каждого КМ сохраняется персональный KPI-фактор, который умножает доступную премию. Веса KPI задаются глобально через админку, а фактические показатели заполняются в калькуляторе.',
    },
  ]

  return (
    <div className="animate-in" style={{ paddingTop: '1.75rem', maxWidth: 880 }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.03em' }}>
        Что изменено в версии сайта
      </h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {sections.map((section, index) => (
          <div key={index} className="paper-card" style={{ animation: `fadeIn 0.35s ease ${index * 0.04}s both` }}>
            <div style={{ fontWeight: 800, color: 'var(--accent)', marginBottom: '0.55rem' }}>{section.title}</div>
            <div style={{ color: 'var(--text2)', lineHeight: 1.7 }}>{section.text}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
