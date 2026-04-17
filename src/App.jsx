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

const BASE_TABS = [
  { id: 'calc', label: 'Калькулятор', icon: CalcIcon },
  { id: 'overall', label: 'Общий дашборд', icon: BarChart3 },
  { id: 'rules', label: 'Регламент', icon: BookOpen },
  { id: 'admin', label: 'Админка', icon: Settings },
]

function hashToTab(hash) {
  const value = String(hash || '').replace(/^#/, '')
  if (value.startsWith('/team/')) return `team:${value.replace('/team/', '')}`
  if (value === '/overall') return 'overall'
  if (value === '/rules') return 'rules'
  if (value === '/admin') return 'admin'
  if (value === '/rating') return 'rating'
  return 'calc'
}

function tabToHash(tab) {
  if (tab.startsWith('team:')) return `#/team/${tab.slice(5)}`
  if (tab === 'overall') return '#/overall'
  if (tab === 'rules') return '#/rules'
  if (tab === 'admin') return '#/admin'
  if (tab === 'rating') return '#/rating'
  return '#/calc'
}

export default function App() {
  const [tab, setTab] = useState(() => hashToTab(window.location.hash))
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
    const onHashChange = () => setTab(hashToTab(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const nextHash = tabToHash(tab)
    if (window.location.hash !== nextHash) window.history.replaceState(null, '', nextHash)
  }, [tab])

  useEffect(() => {
    if (tab.startsWith('team:')) {
      const teamId = tab.slice(5)
      if (teams.some((team) => team.id === teamId)) {
        setActiveTeamId(teamId)
      } else {
        setTab('calc')
      }
    }
  }, [tab, teams])

  const activeTeam = useMemo(() => {
    return teams.find((team) => team.id === activeTeamId) || teams[0]
  }, [teams, activeTeamId])

  const tabs = useMemo(() => {
    const currentTeamTab = activeTeam
      ? [{ id: `team:${activeTeam.id}`, label: activeTeam.name, icon: Users }]
      : []

    const primary = [BASE_TABS[0], ...currentTeamTab, BASE_TABS[1], BASE_TABS[2]]
    if (adminUnlocked) primary.push({ id: 'rating', label: 'Рейтинг', icon: Trophy })
    primary.push(BASE_TABS[3])
    return primary
  }, [activeTeam, adminUnlocked])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        tabs={tabs}
        tab={tab}
        setTab={setTab}
        month={month}
        setMonth={setMonth}
        adminUnlocked={adminUnlocked}
      />

      <main style={{ flex: 1, maxWidth: 1440, margin: '0 auto', width: '100%', padding: '0 1.25rem 3rem' }}>
        {tab === 'calc' && activeTeam && (
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
          />
        )}

        {tab === 'overall' && (
          <OverallDashboard
            teams={teams}
            params={params}
            openTeamPage={(teamId) => {
              setActiveTeamId(teamId)
              setTab(`team:${teamId}`)
            }}
          />
        )}

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
                white / red · 7 команд · отдельные страницы команд
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
      title: '1. Отдельные страницы команд',
      text: 'У каждой команды теперь своя отдельная страница. На общих экранах больше не показываются премии других команд, а рейтинг оставлен только в админской зоне.',
    },
    {
      title: '2. Логика премии приведена к Excel-калькулятору',
      text: 'Премия КМ и команды считается по логике из калькулятора Mozen: 25% с новых денег, 3% с удержанной базы, пороги открытия по команде и KPI-фактор КМ по взвешенному выполнению трех показателей.',
    },
    {
      title: '3. Порог 3% с базы',
      text: 'Базовый порог открытия 3% с удержанной базы выставлен на 85%, как в Excel-файле. Если нужно, это можно поменять в админке.',
    },
    {
      title: '4. Стартовая структура команд',
      text: 'В системе зафиксированы 7 команд. По умолчанию в каждой команде стартует 1 КМ, а не несколько. Это также сброшено новой версией локального хранилища.',
    },
    {
      title: '5. Импорт и экспорт конфигурации',
      text: 'В админке теперь можно выгрузить все настройки и данные команд в JSON, а затем загрузить их на другом устройстве или после повторного деплоя.',
    },
    {
      title: '6. Управленческие экраны',
      text: 'Общий дашборд и рейтинг выделены отдельно. Общий дашборд — публичный управленческий экран без премий по другим командам. Рейтинг — только для админа.',
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
