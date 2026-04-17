import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Calculator as CalcIcon,
  BookOpen,
  Settings,
  Trophy,
  Users,
} from 'lucide-react'
import Calculator from './components/Calculator'
import AdminPanel from './components/AdminPanel'
import OverallDashboard from './components/OverallDashboard'
import RatingPage from './components/RatingPage'
import TeamPage from './components/TeamPage'
import {
  DEFAULT_PARAMS,
  STORAGE_KEYS,
  createDefaultTeams,
  normalizeParams,
  normalizeTeams,
} from './utils/data'

function hashToTab(hash, fallbackTeamId = 'team-1') {
  const value = String(hash || '').replace(/^#/, '')
  if (value.startsWith('/team/')) return `team:${value.replace('/team/', '')}`
  if (value === '/calc') return 'calc'
  if (value === '/overall') return 'overall'
  if (value === '/rules') return 'rules'
  if (value === '/admin') return 'admin'
  if (value === '/rating') return 'rating'
  return `team:${fallbackTeamId}`
}

function tabToHash(tab, fallbackTeamId = 'team-1') {
  if (tab.startsWith('team:')) return `#/team/${tab.slice(5)}`
  if (tab === 'calc') return '#/calc'
  if (tab === 'overall') return '#/overall'
  if (tab === 'rules') return '#/rules'
  if (tab === 'admin') return '#/admin'
  if (tab === 'rating') return '#/rating'
  return `#/team/${fallbackTeamId}`
}

export default function App() {
  const initialTeamId = localStorage.getItem(STORAGE_KEYS.activeTeamId) || 'team-1'

  const [tab, setTab] = useState(() => hashToTab(window.location.hash, initialTeamId))
  const [params, setParams] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.params)
      return saved ? normalizeParams(JSON.parse(saved)) : DEFAULT_PARAMS
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

  useEffect(() => {
    const onHashChange = () => setTab(hashToTab(window.location.hash, activeTeamId))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [activeTeamId])

  useEffect(() => {
    if (!teams.some((team) => team.id === activeTeamId)) {
      setActiveTeamId(teams[0]?.id || 'team-1')
    }
  }, [teams, activeTeamId])

  useEffect(() => {
    if (tab.startsWith('team:')) {
      const teamId = tab.slice(5)
      if (teams.some((team) => team.id === teamId)) {
        if (teamId !== activeTeamId) setActiveTeamId(teamId)
      } else if (teams[0]) {
        setTab(`team:${teams[0].id}`)
      }
    }
  }, [tab, teams, activeTeamId])

  useEffect(() => {
    if (!adminUnlocked && ['calc', 'overall', 'rating'].includes(tab)) {
      setTab(`team:${activeTeamId}`)
    }
  }, [adminUnlocked, tab, activeTeamId])

  useEffect(() => {
    const nextHash = tabToHash(tab, activeTeamId)
    if (window.location.hash !== nextHash) window.history.replaceState(null, '', nextHash)
  }, [tab, activeTeamId])

  const activeTeam = useMemo(() => {
    return teams.find((team) => team.id === activeTeamId) || teams[0]
  }, [teams, activeTeamId])

  const tabs = useMemo(() => {
    const teamTab = activeTeam
      ? [{ id: `team:${activeTeam.id}`, label: 'Страница команды', icon: Users }]
      : []

    if (!adminUnlocked) {
      return [
        ...teamTab,
        { id: 'rules', label: 'Регламент', icon: BookOpen },
        { id: 'admin', label: 'Админка', icon: Settings },
      ]
    }

    return [
      ...teamTab,
      { id: 'calc', label: 'Калькулятор', icon: CalcIcon },
      { id: 'overall', label: 'Общий дашборд', icon: BarChart3 },
      { id: 'rules', label: 'Регламент', icon: BookOpen },
      { id: 'rating', label: 'Рейтинг', icon: Trophy },
      { id: 'admin', label: 'Админка', icon: Settings },
    ]
  }, [activeTeam, adminUnlocked])

  const handleSelectTeam = (teamId) => {
    setActiveTeamId(teamId)
    setTab(`team:${teamId}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        tabs={tabs}
        tab={tab}
        setTab={setTab}
        month={month}
        setMonth={setMonth}
        adminUnlocked={adminUnlocked}
        teams={teams}
        activeTeamId={activeTeamId}
        onSelectTeam={handleSelectTeam}
      />

      <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', padding: '0 1.25rem 3rem' }}>
        {tab === 'calc' && adminUnlocked && activeTeam && (
          <Calculator
            team={activeTeam}
            setTeam={(nextTeam) => setTeams((prev) => prev.map((item) => (item.id === nextTeam.id ? nextTeam : item)))}
            params={params}
            openTeamPage={() => setTab(`team:${activeTeam.id}`)}
          />
        )}

        {tab.startsWith('team:') && activeTeam && (
          <TeamPage
            team={activeTeam}
            params={params}
            openCalculator={() => setTab('calc')}
            canOpenCalculator={adminUnlocked}
          />
        )}

        {tab === 'overall' && adminUnlocked && (
          <OverallDashboard
            teams={teams}
            params={params}
            openTeamPage={(teamId) => {
              setActiveTeamId(teamId)
              setTab(`team:${teamId}`)
            }}
          />
        )}

        {tab === 'rules' && <RulesTab adminUnlocked={adminUnlocked} />}
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

function Header({ tabs, tab, setTab, month, setMonth, adminUnlocked, teams, activeTeamId, onSelectTeam }) {
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
                white / red · 7 команд · публично только своя страница
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <span className="tag">Админ: {adminUnlocked ? 'доступ открыт' : 'по паролю'}</span>
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

        <div className="team-switcher-row">
          <div className="switcher-label">Выбор команды</div>
          <div className="team-switcher-scroll">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => onSelectTeam(team.id)}
                className={activeTeamId === team.id ? 'team-chip active' : 'team-chip'}
              >
                {team.name}
              </button>
            ))}
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

function RulesTab({ adminUnlocked }) {
  const sections = [
    {
      title: '1. Выбор команды вынесен в шапку',
      text: 'Теперь в верхней части сайта есть отдельный переключатель на все 7 команд. По клику пользователь сразу попадает на страницу нужной команды.',
    },
    {
      title: '2. Публичная часть показывает только выбранную команду',
      text: 'Без входа в админку на сайте доступна только страница выбранной команды, регламент и экран входа в админку. Общий дашборд, калькулятор и рейтинг скрыты.',
    },
    {
      title: '3. Общий дашборд остается управленческим',
      text: 'Общий дашборд отдела перенесен в управленческую зону. Он доступен только после входа администратора и не показывается обычным пользователям.',
    },
    {
      title: '4. Рейтинг также доступен только администратору',
      text: 'Рейтинг команд сохранен, но по-прежнему открывается только после ввода пароля администратора.',
    },
    {
      title: '5. Логика премии приведена к Excel-калькулятору',
      text: 'Премия КМ и команды считается по логике из калькулятора Mozen: 25% с новых денег, 3% с удержанной базы, пороги открытия по команде и KPI-фактор КМ по взвешенному выполнению трех показателей.',
    },
    {
      title: '6. Стартовая структура команд',
      text: 'В системе зафиксированы 7 команд. По умолчанию в каждой команде стартует 1 КМ. Названия команд и плановые показатели можно менять в админке.',
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

      <div style={{ marginTop: '1rem' }} className="paper-card">
        <div style={{ fontWeight: 800, marginBottom: '0.45rem' }}>Текущий режим доступа</div>
        <div style={{ color: 'var(--text2)', lineHeight: 1.7 }}>
          {adminUnlocked
            ? 'Сейчас открыт админский режим: доступны калькулятор, общий дашборд, рейтинг и настройки.'
            : 'Сейчас открыт публичный режим: доступна только страница выбранной команды, регламент и вход в админку.'}
        </div>
      </div>
    </div>
  )
}
