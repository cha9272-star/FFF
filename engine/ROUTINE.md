# ⏰ 자동 생성 루틴 (예약 작업 스펙)

주간 리포트를 자동 생성하는 예약 작업(Routine)의 정의다. Claude Code 세션에서
`create_trigger`(Claude Code Remote)로 등록하며, 매 실행 시 **새 세션**에서 아래
프롬프트를 독립 실행한다.

| 항목 | 값 |
|------|-----|
| 이름 | InsightMail 주간 리포트 자동 생성 |
| 주기(cron) | `0 0 * * 1` — 매주 월요일 09:00 KST (00:00 UTC) |
| 실행 모드 | `create_new_session_on_fire: true` (매번 새 세션) |
| 알림 | push on |
| 대상 | 저장소 `cha9272-star/fff`, 브랜치 `claude/email-analysis-reporting-app-k5xych` |

### 등록된 루틴

| 루틴 | 트리거 ID | cron | 발행처 |
|------|-----------|------|--------|
| 주간 | `trig_01An9LmBr7kBrZZrKp53tN9S` | `0 0 * * 1` (월 09:00 KST) | 대시보드 |
| 월간(+Notion) | `trig_01MUJaWYrd3NsBb3bcgheSgs` | `0 0 1 * *` (매월 1일 09:00 KST) | 대시보드 + Notion |

### Notion 발행 (월간)

월간 루틴은 대시보드 저장에 더해 Notion 허브 페이지 아래에 월 리포트 페이지를 발행한다.

- 허브 페이지: **📊 InsightMail 리포트** — `page_id: 394eb85f-f97a-81f8-b7d5-d46917cff2da`
  (https://app.notion.com/p/394eb85ff97a81f8b7d5d46917cff2da)
- 도구: `mcp__Notion__notion-create-pages` (parent = 위 page_id)
- 제목: `YYYY년 M월 리포트`, 본문에 요약·메일·업무·경쟁사/시장·목표 섹션 포함(집계·요약만, 원문 메일 제외).

## 실행 프롬프트 (standalone)

```
InsightMail 주간 리포트를 자동 생성하는 작업입니다. 저장소 cha9272-star/fff,
브랜치 claude/email-analysis-reporting-app-k5xych 에서 작업하세요. 반드시
engine/PLAYBOOK.md 절차를 따르십시오.

1) 기간 결정: 실행 시점 기준 가장 최근 완료된 주(지난주 월요일~일요일, KST).
   id는 weekly-YYYY-Www 형식.
2) 데이터 수집(MCP): Outlook 메일(outlook_email_search)과 캘린더
   (outlook_calendar_search)에서 해당 주 데이터를 수집. Gmail·Google 캘린더도
   인증돼 있으면 함께 수집하되, 불가하면 Outlook만으로 진행하고 리포트에 명시.
   수신/발신 총량은 폴더별 totalResultCount로 실측하고, 일자별 필터가 불안정하면
   일자별·카테고리는 표본 기반 추정임을 email.insights에 명시(숫자를 지어내지 말 것).
3) 통계 집계: 가능하면 engine/aggregate.py로 결정적 집계. 원문 메일/개인정보는
   커밋 금지(emails.json/events.json은 .gitignore 대상).
4) 서술·경쟁사·목표: engine/analysis_prompt.md 지침대로 작성. 경쟁사 신호는
   engine/config.json의 competitorCategories(VDI / Cloud PC·DaaS / RBI /
   Zero Trust / AI Workspace) 기준으로 소속 category와 함께 표기하고, 직접 신호가
   없는 대상은 "직접 신호 없음"으로. 각 competitor에 category 필드 포함.
5) 저장: report.schema.json 형식으로 frontend/public/data/weekly-YYYY-Www.json
   저장, index.json reports 배열 맨 앞에 항목 추가("· 실데이터" 표기).
6) 검증: cd frontend && npm ci --silent && npm run build 통과 확인.
7) 커밋·푸시: git push -u origin claude/email-analysis-reporting-app-k5xych
   (네트워크 실패 시 지수 백오프 최대 4회).

완료되면 리포트 id와 핵심 수치(수신/발신, 하이라이트, 경쟁사 신호, 상위 목표)를
한국어 3~5줄로 요약 보고.
```

## 등록 방법

Claude Code 세션에서 "이 루틴을 등록해줘"라고 하면 위 스펙대로 `create_trigger`가
호출된다. 수동 등록/변경은 `list_triggers` → `update_trigger` / `delete_trigger`로.
