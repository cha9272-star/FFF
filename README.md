# 📊 InsightMail — 메일·업무·시장 분석 & 목표 제시 대시보드

Gmail과 Outlook(Office365)의 **메일·일정**을 분석해
**주간/월간 리포트**, **경쟁사·시장 동향 분석**, **AI 목표 제시**를 제공하는 앱입니다.

> **하이브리드 구조** — 데이터 수집은 이미 연결된 MCP 커넥터(Gmail·Outlook·캘린더)로,
> 숫자 집계는 Python으로 정확하게, 서술·목표는 Claude로, 시각화는 React 대시보드로.
> 별도 OAuth 서버 구축 없이 **오늘 바로** 동작합니다.

## ✨ 주요 기능

| 기능 | 설명 |
|------|------|
| 📧 메일 분석 | 주간/월간 발신·수신량, 카테고리 분포, 주요 correspondents, 응답 시간·미응답 |
| 📋 업무 분석 | 일정 기반 시간 배분, 회의 부하, 회의:집중 비율, 주요 업무 하이라이트 |
| 🔍 시장 동향 | 등록한 경쟁사·키워드 기반 경쟁사 신호·트렌드·기회·위협 분석 |
| 🎯 목표 제시 | 분석을 종합해 다음 주/달 SMART 목표를 AI가 제안 |

## 🏗️ 아키텍처

```
engine/                     분석 엔진 (Claude 예약 작업이 실행)
  ├─ PLAYBOOK.md            루틴 실행 절차 (MCP 수집 → 집계 → 서술 → 저장)
  ├─ aggregate.py          결정적 통계 집계 (숫자는 LLM이 아닌 코드가 계산)
  ├─ analysis_prompt.md    Claude 서술·목표 생성 프롬프트
  ├─ report.schema.json    표준 리포트 JSON 스키마
  └─ config.json           내 주소·경쟁사·카테고리 규칙

frontend/                   React (Vite) 정적 대시보드
  ├─ src/                   리포트 JSON을 읽어 차트·리포트로 렌더링
  └─ public/data/          생성된 리포트(+ 데모 샘플)
```

**데이터 흐름:** MCP로 메일·일정 수집 → `aggregate.py`로 통계 산출 →
Claude가 요약·인사이트·시장·목표 작성 → 표준 리포트 JSON → 대시보드가 시각화.

## 🚀 빠른 시작

### 대시보드 실행 (샘플 데이터로 즉시 확인)

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

`public/data/`의 샘플 주간(2026-W27)·월간(2026-06) 리포트가 바로 표시됩니다.

### 리포트 자동 생성 (실제 계정)

이 저장소를 연 Claude Code 세션에서 요청하세요:

> "매주 월요일 아침 9시에 지난주 InsightMail 리포트를 생성해줘"

`engine/PLAYBOOK.md` 절차에 따라 연결된 Gmail·Outlook·캘린더에서 데이터를 수집하고,
`frontend/public/data/`에 새 리포트를 써넣습니다. 자세한 절차는 플레이북 참고.

### 통계 집계기 단독 실행

```bash
python engine/aggregate.py \
  --emails engine/sample_input/emails.json \
  --events engine/sample_input/events.json \
  --type weekly --start 2026-06-29 --end 2026-07-05 --out -
```

## 🎨 시각화

차트 색상은 색각 이상(CVD) 검증을 통과한 팔레트를 사용하며, 라이트/다크 모드를 모두 지원합니다.

## 🔒 개인정보

리포트에는 **집계 수치와 익명 인사이트**만 담깁니다. 원문 메일(`emails.json`/`events.json`)은
저장소에 커밋하지 않습니다(`.gitignore` 처리).

## 📜 라이선스

MIT
