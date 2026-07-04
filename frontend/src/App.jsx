import { useEffect, useState } from 'react'
import { fetchIndex, fetchReport } from './lib/api.js'
import { EmailSection, WorkSection, MarketSection, GoalsSection } from './components/sections.jsx'

export default function App() {
  const [index, setIndex] = useState(null)
  const [type, setType] = useState('weekly')
  const [current, setCurrent] = useState(null)
  const [report, setReport] = useState(null)
  const [error, setError] = useState(null)

  // 리포트 목록 로드
  useEffect(() => {
    fetchIndex()
      .then((idx) => {
        setIndex(idx)
        const first = idx.reports.find((r) => r.type === 'weekly') || idx.reports[0]
        if (first) { setType(first.type); setCurrent(first.id) }
      })
      .catch((e) => setError(e.message))
  }, [])

  // 선택 리포트 로드
  useEffect(() => {
    if (!current) return
    setReport(null)
    fetchReport(current).then(setReport).catch((e) => setError(e.message))
  }, [current])

  if (error) return <div className="app"><div className="center-msg">⚠️ {error}</div></div>
  if (!index) return <div className="app"><div className="center-msg">불러오는 중…</div></div>

  const ofType = index.reports.filter((r) => r.type === type)
  const switchType = (t) => {
    setType(t)
    const first = index.reports.find((r) => r.type === t)
    if (first) setCurrent(first.id)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">📊</div>
          <div>
            <h1>InsightMail</h1>
            <p>메일 · 업무 · 시장 분석과 목표 제시</p>
          </div>
        </div>
        <div className="controls">
          <div className="seg">
            <button className={type === 'weekly' ? 'active' : ''} onClick={() => switchType('weekly')}>주간</button>
            <button className={type === 'monthly' ? 'active' : ''} onClick={() => switchType('monthly')}>월간</button>
          </div>
          <select className="select" value={current || ''} onChange={(e) => setCurrent(e.target.value)}>
            {ofType.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>
      </header>

      {!report ? (
        <div className="center-msg">리포트를 불러오는 중…</div>
      ) : (
        <>
          <div className="summary">
            <div className="eyebrow">{report.period.label} · {report.type === 'weekly' ? '주간' : '월간'} 종합</div>
            <p>{report.summary}</p>
          </div>

          <div className="section-title">📧 메일 분석</div>
          <EmailSection email={report.email} />

          <div className="section-title">📋 업무 분석</div>
          <WorkSection work={report.work} />

          <div className="section-title">🔍 경쟁사 · 시장 동향</div>
          <MarketSection market={report.market} />

          <div className="section-title">🎯 목표 제시</div>
          <GoalsSection goals={report.goals} />

          <div className="footnote">
            생성 시각 {new Date(report.generatedAt).toLocaleString('ko-KR')} · 데이터 소스: {report.sources?.join(', ') || '샘플'}<br />
            분석 엔진이 Gmail · Outlook · 캘린더에서 수집한 데이터를 Claude가 분석해 생성합니다.
          </div>
        </>
      )}
    </div>
  )
}
