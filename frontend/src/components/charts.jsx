import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell, LabelList,
} from 'recharts'
import { CATEGORICAL, prefersDark } from '../lib/theme.js'

// 다크/라이트 전환에 반응하는 색 훅
export function useThemeColors() {
  const [dark, setDark] = useState(prefersDark())
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => setDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  const cat = dark ? CATEGORICAL.dark : CATEGORICAL.light
  return {
    cat,
    grid: dark ? '#2c2c2a' : '#e1e0d9',
    axis: dark ? '#383835' : '#c3c2b7',
    muted: '#898781',
    surface: dark ? '#1a1a19' : '#fcfcfb',
    ink: dark ? '#ffffff' : '#0b0b0b',
  }
}

function TooltipBox({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 12px', boxShadow: 'var(--shadow)', fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 7, color: 'var(--text-secondary)', padding: '2px 0' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color || p.fill }} />
          <span>{p.name}</span>
          <span style={{ marginLeft: 'auto', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
            {p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  )
}

// 메일 발신/수신 추이 — 2계열 그룹 막대 (범례 표시)
export function EmailVolumeChart({ data }) {
  const t = useThemeColors()
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }} barGap={4}>
        <CartesianGrid vertical={false} stroke={t.grid} />
        <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: t.axis }} />
        <YAxis tickLine={false} axisLine={false} width={38} />
        <Tooltip cursor={{ fill: 'rgba(137,135,129,0.08)' }} content={<TooltipBox unit="건" />} />
        <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12.5, paddingTop: 6 }} />
        <Bar dataKey="received" name="수신" fill={t.cat[0]} radius={[4, 4, 0, 0]} />
        <Bar dataKey="sent" name="발신" fill={t.cat[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// 카테고리별 분포 — 수평 막대, 단색(청색), 직접 레이블
export function CategoryChart({ data }) {
  const t = useThemeColors()
  const max = Math.max(...data.map((d) => d.value))
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 42)}>
      <BarChart layout="vertical" data={data} margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, max * 1.12]} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={92}
          tick={{ fontSize: 12.5, fill: t.ink }} />
        <Tooltip cursor={{ fill: 'rgba(137,135,129,0.08)' }} content={<TooltipBox unit="건" />} />
        <Bar dataKey="value" name="메일 수" fill={t.cat[0]} radius={[0, 4, 4, 0]} barSize={20}>
          <LabelList dataKey="value" position="right" style={{ fill: t.muted, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// 시간 배분 — 수평 막대, 카테고리 색, 시간 레이블
export function TimeAllocationChart({ data }) {
  const t = useThemeColors()
  const rows = [...data].sort((a, b) => b.hours - a.hours)
  const max = Math.max(...rows.map((d) => d.hours))
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, rows.length * 42)}>
      <BarChart layout="vertical" data={rows} margin={{ top: 4, right: 48, left: 8, bottom: 4 }}>
        <XAxis type="number" hide domain={[0, max * 1.14]} />
        <YAxis type="category" dataKey="category" tickLine={false} axisLine={false} width={104}
          tick={{ fontSize: 12.5, fill: t.ink }} />
        <Tooltip cursor={{ fill: 'rgba(137,135,129,0.08)' }} content={<TooltipBox unit="h" />} />
        <Bar dataKey="hours" name="시간" radius={[0, 4, 4, 0]} barSize={20}>
          {rows.map((_, i) => <Cell key={i} fill={t.cat[i % t.cat.length]} />)}
          <LabelList dataKey="hours" position="right"
            formatter={(v) => `${v}h`} style={{ fill: t.muted, fontSize: 12, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
