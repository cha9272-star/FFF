// dataviz 검증 팔레트 (light / dark) — 카테고리 슬롯은 고정 순서로만 사용
export const CATEGORICAL = {
  light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
  dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
}

export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
}

export function prefersDark() {
  return typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
}

// 감정(sentiment) → 상태 색 매핑
export const SENTIMENT = {
  positive: { color: STATUS.good, label: '긍정', icon: '▲' },
  neutral: { color: '#898781', label: '중립', icon: '■' },
  negative: { color: STATUS.critical, label: '주의', icon: '▼' },
}

export const PRIORITY = {
  high: { color: STATUS.critical, label: '높음' },
  medium: { color: STATUS.warning, label: '중간' },
  low: { color: '#898781', label: '낮음' },
}
