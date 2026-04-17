import { CheckCircle2, XCircle } from 'lucide-react'
import { fmtPct, pctColor } from '../utils/data'

export function Card({ children, style, accent = false }) {
  return (
    <div
      style={{
        background: 'var(--card)',
        border: `1px solid ${accent ? 'var(--border-accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        boxShadow: accent ? 'var(--shadow-accent)' : 'var(--shadow-soft)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Label({ children, style }) {
  return (
    <div
      style={{
        fontSize: '0.72rem',
        color: 'var(--text3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 700,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children, style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: '1rem',
        ...style,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{children}</div>
    </div>
  )
}

export function StatCard({ label, value, subvalue, accent = false, style }) {
  return (
    <div
      style={{
        background: accent ? 'var(--accent-soft)' : 'var(--bg2)',
        border: `1px solid ${accent ? 'var(--border-accent)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '0.95rem',
        ...style,
      }}
    >
      <Label>{label}</Label>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, marginTop: '0.35rem' }}>{value}</div>
      {subvalue ? <div style={{ marginTop: '0.35rem', color: 'var(--text2)', fontSize: '0.78rem' }}>{subvalue}</div> : null}
    </div>
  )
}

export function ProgressBar({ value }) {
  const width = Math.min(Math.max(value, 0) * 100, 100)
  const color = pctColor(value)
  return (
    <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 999, overflow: 'hidden' }}>
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: 999,
          transition: 'width 0.25s ease',
        }}
      />
    </div>
  )
}

export function StatusBadge({ open, label }) {
  const Icon = open ? CheckCircle2 : XCircle
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.35rem 0.7rem',
        borderRadius: 999,
        fontSize: '0.74rem',
        fontWeight: 700,
        background: open ? 'var(--accent-soft)' : 'var(--bg3)',
        color: open ? 'var(--accent)' : 'var(--text3)',
        border: `1px solid ${open ? 'var(--border-accent)' : 'var(--border)'}`,
      }}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}

export function KPIGrid({ rows }) {
  return (
    <div className="kpi-grid">
      {rows.map((row, index) => (
        <div key={index} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.85rem' }}>
          <Label style={{ marginBottom: '0.45rem' }}>{row.label}</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text2)' }}>
            <span>{row.plan.toLocaleString('ru-RU')} → {row.fact.toLocaleString('ru-RU')}</span>
            <strong style={{ color: pctColor(row.pct) }}>{fmtPct(row.pct)}</strong>
          </div>
          <div style={{ marginTop: '0.45rem' }}>
            <ProgressBar value={row.pct} />
          </div>
        </div>
      ))}
    </div>
  )
}
