import { EmailVolumeChart, CategoryChart, TimeAllocationChart } from './charts.jsx'
import { SENTIMENT, PRIORITY, STATUS } from '../lib/theme.js'

function pct(cur, prev) {
  if (prev == null || prev === 0) return null
  return Math.round(((cur - prev) / prev) * 100)
}

export function StatTile({ label, value, unit = '', prev, invertGood = false }) {
  const p = prev != null ? pct(value, prev) : null
  let cls = 'flat', arrow = '→'
  if (p != null && p !== 0) {
    const positive = p > 0
    const good = invertGood ? !positive : positive
    cls = good ? 'up' : 'down'
    arrow = positive ? '▲' : '▼'
  }
  return (
    <div className="card stat">
      <div className="label">{label}</div>
      <div className="value">{value.toLocaleString()}{unit}</div>
      {p != null && (
        <div className={`delta ${cls}`}>{arrow} {Math.abs(p)}% <span style={{ color: 'var(--muted)', fontWeight: 500 }}>전기간 대비</span></div>
      )}
    </div>
  )
}

function Insights({ items }) {
  if (!items?.length) return null
  return <ul className="insights">{items.map((t, i) => <li key={i}>{t}</li>)}</ul>
}

export function EmailSection({ email }) {
  return (
    <>
      <div className="grid kpi">
        <StatTile label="수신 메일" value={email.totalReceived} unit="건" prev={email.prevReceived} />
        <StatTile label="발신 메일" value={email.totalSent} unit="건" prev={email.prevSent} />
        <StatTile label="미응답" value={email.unreplied} unit="건" invertGood />
        <StatTile label="평균 응답" value={email.avgResponseHours} unit="h" invertGood />
      </div>
      <div className="grid two">
        <div className="card">
          <h3>메일 추이</h3>
          <div className="sub">기간 내 수신·발신 흐름</div>
          <EmailVolumeChart data={email.byDay} />
        </div>
        <div className="card">
          <h3>카테고리 분포</h3>
          <div className="sub">메일 성격별 비중</div>
          <CategoryChart data={email.byCategory} />
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>주요 correspondents</h3>
          <div className="sub">가장 많이 주고받은 상대</div>
          <table className="contacts">
            <thead><tr><th>이름</th><th className="num">수신</th><th className="num">발신</th></tr></thead>
            <tbody>
              {email.topContacts?.map((c, i) => (
                <tr key={i}>
                  <td className="name">{c.name}<div className="email">{c.email}</div></td>
                  <td className="num">{c.received}</td>
                  <td className="num">{c.sent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>핵심 인사이트</h3>
          <div className="sub">메일 데이터에서 발견한 패턴</div>
          <Insights items={email.insights} />
        </div>
      </div>
    </>
  )
}

export function WorkSection({ work }) {
  return (
    <>
      <div className="grid kpi">
        <StatTile label="회의 시간" value={work.meetingHours} unit="h" />
        <StatTile label="집중 업무" value={work.focusHours} unit="h" />
        <StatTile label="회의 건수" value={work.meetingCount} unit="건" />
        <StatTile label="회의:집중 비율" value={Number((work.meetingHours / (work.focusHours || 1)).toFixed(2))} />
      </div>
      <div className="grid two">
        <div className="card">
          <h3>시간 배분</h3>
          <div className="sub">일정 기준 업무 카테고리별 투입 시간</div>
          <TimeAllocationChart data={work.timeAllocation} />
        </div>
        <div className="card">
          <h3>주요 업무 하이라이트</h3>
          <div className="sub">기간 내 핵심 성과</div>
          <Insights items={work.highlights} />
          {work.insights?.length > 0 && (
            <>
              <div className="section-title" style={{ margin: '18px 0 4px' }}>진단</div>
              <Insights items={work.insights} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

export function MarketSection({ market }) {
  return (
    <>
      <div className="grid two">
        <div className="card">
          <h3>경쟁사 동향</h3>
          <div className="sub">모니터링 대상 경쟁사 신호</div>
          {market.competitors?.map((c, i) => {
            const s = SENTIMENT[c.sentiment] || SENTIMENT.neutral
            return (
              <div className="comp" key={i}>
                <div className="comp-head">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <strong>{c.name}</strong>
                    {c.category && <span className="chip" style={{ padding: '2px 8px', fontWeight: 600 }}>{c.category}</span>}
                  </span>
                  <span className="badge" style={{ background: `${s.color}1f`, color: s.color }}>{s.icon} {s.label}</span>
                </div>
                <p>{c.summary}</p>
                <div className="chips">{c.signals?.map((sig, j) => <span className="chip" key={j}>{sig}</span>)}</div>
              </div>
            )
          })}
        </div>
        <div className="card">
          <h3>시장 트렌드</h3>
          <div className="sub">업계 전반의 흐름</div>
          <Insights items={market.trends} />
        </div>
      </div>
      <div className="grid two" style={{ marginTop: 16 }}>
        <div className="card ot-col">
          <h4 style={{ color: STATUS.good }}>◆ 기회 (Opportunities)</h4>
          <ul className="ot-list">{market.opportunities?.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
        <div className="card ot-col">
          <h4 style={{ color: STATUS.critical }}>◆ 위협 (Threats)</h4>
          <ul className="ot-list">{market.threats?.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      </div>
      {market.sources?.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>출처</h3>
          <div className="sub">시장 스캔(WebSearch)으로 수집한 근거</div>
          <ol className="sources">
            {market.sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                {(s.publisher || s.date) && (
                  <span className="src-meta"> — {[s.publisher, s.date].filter(Boolean).join(', ')}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

export function GoalsSection({ goals }) {
  return (
    <div className="card">
      <h3>🎯 다음 기간 목표 제안</h3>
      <div className="sub">분석 결과를 종합해 AI가 제안한 SMART 목표</div>
      <div style={{ marginTop: 14 }}>
        {goals?.map((g, i) => {
          const p = PRIORITY[g.priority] || PRIORITY.medium
          return (
            <div className="goal" key={i} style={{ borderLeftColor: p.color }}>
              <div className="goal-head">
                <strong>{g.title}</strong>
                <span className="badge" style={{ background: `${p.color}1f`, color: p.color, whiteSpace: 'nowrap' }}>{p.label}</span>
              </div>
              {g.rationale && <div className="rationale">{g.rationale}</div>}
              {g.metric && <span className="metric">📏 {g.metric}</span>}
              {g.category && <span className="cat">{g.category}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
