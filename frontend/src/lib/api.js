// 리포트 데이터 로딩 — 정적 JSON(public/data)에서 읽는다.
// 실제 연동 시에도 분석 엔진이 같은 위치에 리포트를 써넣으므로 인터페이스는 동일.
const BASE = import.meta.env.BASE_URL || '/'

export async function fetchIndex() {
  const res = await fetch(`${BASE}data/index.json`)
  if (!res.ok) throw new Error('리포트 목록을 불러오지 못했습니다.')
  return res.json()
}

export async function fetchReport(id) {
  const res = await fetch(`${BASE}data/${id}.json`)
  if (!res.ok) throw new Error(`리포트(${id})를 불러오지 못했습니다.`)
  return res.json()
}
