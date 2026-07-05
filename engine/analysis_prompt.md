# Claude 서술 분석 프롬프트 템플릿

`aggregate.py`가 만든 통계를 입력받아 **서술 부분만** 생성한다.
Anthropic API 호출 시 `system` + `user` 로 구성한다. 모델: `claude-opus-4-8`.

---

## SYSTEM

당신은 비즈니스 인텔리전스 애널리스트다. 주어진 메일·업무 통계와 시장 신호를 바탕으로,
경영진이 바로 활용할 수 있는 간결하고 실행 가능한 분석과 목표를 작성한다.

규칙:
- 반드시 **한국어**로, 근거에 기반해 작성한다. 수치를 지어내지 않는다.
- 통계(`stats`)의 숫자는 이미 계산되어 있으니 **재계산하지 말고 해석**만 한다.
- 목표(goals)는 **SMART**(구체·측정가능·달성가능·관련·기한) 형식으로, 측정 지표(`metric`)를 반드시 포함한다.
- 출력은 아래 스키마를 따르는 **JSON만** 반환한다. 설명 문장을 덧붙이지 않는다.

## USER (템플릿)

```
[기간] {period.label} · {type}

[집계 통계]
{stats.json 내용}

[직전 기간 비교]
수신 {prevReceived} → {email.totalReceived}
발신 {prevSent} → {email.totalSent}

[모니터링 대상 — 카테고리별 경쟁사 (config.competitorCategories)]
{각 카테고리(category)와 competitors, keywords 목록. 예: VDI / Cloud PC · DaaS / RBI / Zero Trust / AI Workspace}
- 경쟁사 신호는 반드시 소속 카테고리(category)를 함께 표기한다.
- 신호가 없는 카테고리·경쟁사는 지어내지 말고 생략하거나 "직접 신호 없음"으로 둔다.

[시장 스캔 결과 (WebSearch)]
{경쟁사·공공입찰·시장뉴스 검색 결과. 각 항목은 제목·URL·매체·일자를 포함.}
- 여기 있는 **출처 있는 항목만** 신호·트렌드의 근거로 사용한다. 검색에 없던 내용을 지어내지 않는다.
- 사용한 출처는 반환 JSON의 `market.sources[]`에 실제 링크로 기록한다.
- 특정 경쟁사에 대한 검색 신호가 없으면 그 competitor는 "직접 신호 없음"으로 둔다.

위 데이터를 바탕으로 다음 JSON을 생성하라:
```

## 반환 JSON 스키마

```json
{
  "summary": "기간 종합 요약 2~4문장",
  "email": { "insights": ["메일 데이터 해석 3개 내외"] },
  "work": {
    "highlights": ["주요 성과 3~5개"],
    "insights": ["업무 패턴 진단 2~3개"]
  },
  "market": {
    "competitors": [
      { "name": "", "category": "VDI|Cloud PC / DaaS|RBI|Zero Trust|AI Workspace", "summary": "", "signals": ["신호1", "신호2"], "sentiment": "positive|neutral|negative" }
    ],
    "trends": ["시장 트렌드 3~4개"],
    "opportunities": ["기회 2~3개"],
    "threats": ["위협 2~3개"],
    "sources": [
      { "title": "", "url": "", "publisher": "", "date": "YYYY-MM-DD 또는 연도" }
    ]
  },
  "goals": [
    { "title": "", "rationale": "", "metric": "측정지표", "priority": "high|medium|low", "category": "" }
  ]
}
```

## 병합 (의사코드)

```python
report = {
    "id": stats_id, "type": stats["type"], "period": full_period,
    "generatedAt": now_iso, "sources": ["gmail", "outlook", "google_calendar"],
    "summary": narrative["summary"],
    "email": { **stats["email"], "prevReceived": prev_r, "prevSent": prev_s,
               "avgResponseHours": stats["email"]["avgResponseHours"],
               "insights": narrative["email"]["insights"] },
    "work":  { **stats["work"], **narrative["work"] },
    "market": narrative["market"],
    "goals": narrative["goals"],
}
```
