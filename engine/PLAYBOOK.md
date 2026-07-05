# 🤖 분석 엔진 플레이북 (Routine 실행 지시서)

이 문서는 **주간/월간 리포트를 자동 생성하는 Claude 예약 작업(Routine)** 이 따라야 할 절차다.
예약 작업이 실행되면 아래 순서대로 수행해 `frontend/public/data/`에 표준 리포트 JSON을 써넣는다.

> 하이브리드 구조: **데이터 수집은 MCP 커넥터**, **숫자 집계는 `aggregate.py`**,
> **서술(요약·인사이트·시장·목표)은 Claude**, **시각화는 React 대시보드**가 담당한다.

---

## 0. 기간 결정
- 주간: 지난주 월요일~일요일
- 월간: 지난달 1일~말일
- `id` = `weekly-YYYY-Www` 또는 `monthly-YYYY-MM`

## 1. 데이터 수집 (MCP)

| 소스 | MCP 도구 | 수집 항목 |
|------|----------|-----------|
| Gmail | `Gmail.search_threads`, `Gmail.get_thread` | `after:/before:` 로 기간 필터, 발신/수신·상대·시각 |
| Outlook | `Microsoft_365.outlook_email_search` | 같은 기간 메일 |
| Google Calendar | `Google_Calendar.list_events` | 기간 내 일정(제목·시작·종료·참석자 수) |
| Outlook Calendar | `Microsoft_365.outlook_calendar_search` | 기간 내 일정 |

수집 결과를 **정규화 형식**(아래)으로 변환한다.

```jsonc
// emails.json
[{ "from", "from_name", "to": [], "direction": "in"|"out",
   "date": "ISO8601", "subject", "category"?, "responded_hours"?, "needs_reply"? }]
// events.json
[{ "title", "start": "ISO8601", "end": "ISO8601", "category"?, "attendees"? }]
```

- `direction`: 내 주소가 `from`이면 `out`, 아니면 `in`
- `responded_hours`: 수신 메일에 내가 답장한 경우 소요 시간(시간). 미답장이고 답장 필요면 `needs_reply:true`
- `category`: 비우면 `aggregate.py`가 도메인/제목 키워드로 자동 분류

## 2. 통계 집계 (결정적)

```bash
python engine/aggregate.py \
  --emails emails.json --events events.json \
  --type weekly --start 2026-06-29 --end 2026-07-05 \
  --out stats.json
```

→ `stats.json`에 `email`, `work` 통계 블록이 생성된다. **이 숫자는 그대로 사용**하고 LLM이 다시 계산하지 않는다.

## 2.5 시장 스캔 (WebSearch)

`config.json`의 `competitorCategories`·`generalKeywords`를 기준으로 **WebSearch**를 돌려 시장·경쟁사 근거를 수집한다.

- 범위: **경쟁사 동향 + 공공입찰(나라장터·공공 VDI) + 시장 뉴스**. 한국어+영어로 검색하고 기간(해당 주/월)에 맞춰 최신 위주로.
- 카테고리별로 대표 쿼리 구성(예: `VMware Horizon Omnissa 가격`, `Citrix DaaS alternative`, `Remote Browser Isolation 시장`, `제로트러스트 N2SF 공공`, `AI Workspace Copilot`).
- 결과를 dedupe해 `market.sources[] = {title, url, publisher, date}`로 정리한다.
- **출처 있는 항목만** 신호/트렌드의 근거로 쓰고, 검색에 없던 내용은 지어내지 않는다. 신호 없는 경쟁사는 "직접 신호 없음".

## 3. 서술 생성 (Claude)

`engine/analysis_prompt.md`의 프롬프트에 다음을 넣어 Claude를 호출한다.
- `stats.json` (집계 결과)
- 직전 기간 통계 (증감 비교용 → `prevReceived`, `prevSent`)
- 경쟁사 목록 / 모니터링 키워드 (`engine/config.json`)
- **2.5의 시장 스캔 결과 (출처 포함)**

Claude는 다음 필드를 **JSON으로만** 반환한다:
`summary`, `email.insights`, `work.highlights`, `work.insights`,
`market.{competitors,trends,opportunities,threats,sources}`, `goals[]`.
경쟁사는 소속 `category`를 함께 표기한다.

## 4. 병합 & 저장
- `stats.json`(숫자) + Claude 서술 → `report.schema.json` 형식으로 병합
- `frontend/public/data/<id>.json` 저장
- `frontend/public/data/index.json`의 `reports` 배열에 항목 추가(최신이 위로)

## 5. Notion 발행 (월간 루틴) · 배포
- 대시보드가 정적이므로 `frontend`를 빌드해 배포하거나 로컬에서 확인
- **월간 리포트는 Notion에도 발행**한다: `mcp__Notion__notion-create-pages`
  - parent `page_id: 394eb85f-f97a-81f8-b7d5-d46917cff2da` (허브 "📊 InsightMail 리포트")
  - 제목 `YYYY년 M월 리포트`, 본문에 요약·메일·업무·경쟁사/시장·목표 섹션(집계·요약만)
- 이메일 요약 발송을 원하면 Gmail 초안 생성으로 확장 가능

---

## 예약 등록 방법

이 저장소를 연 Claude Code 세션에서 아래처럼 요청하면 Routine이 등록된다.

- "매주 월요일 아침 9시에 지난주 리포트를 생성해줘"
- "매월 1일에 지난달 리포트를 생성해줘"

내부적으로 `create_trigger`(cron)로 등록되며, 실행 시 이 플레이북을 따른다.

## 개인정보 주의
- 실제 메일 본문/주소는 민감정보다. 리포트에는 **집계 수치와 익명화된 인사이트**만 담고,
  원문 메일을 저장소에 커밋하지 않는다. (`emails.json`/`events.json`은 `.gitignore` 대상)
