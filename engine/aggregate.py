#!/usr/bin/env python3
"""메일·일정 원시 데이터 → 결정적 통계 집계.

분석 엔진의 '숫자' 부분을 담당한다. LLM에 통계 계산을 맡기지 않고
여기서 정확히 계산한 뒤, 서술(요약·인사이트·시장·목표)만 Claude가 채운다.

입력(정규화된 JSON):
  emails: [{ "from", "to":[], "direction":"in"|"out", "date":ISO,
             "category"?, "thread_id"?, "responded_hours"? }]
  events: [{ "title", "start":ISO, "end":ISO, "category"?, "attendees"? }]

사용법:
  python aggregate.py --emails emails.json --events events.json \
      --type weekly --start 2026-06-29 --end 2026-07-05 --out stats.json
"""
from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import datetime

WEEKDAY_KO = ["월", "화", "수", "목", "금", "토", "일"]

# 카테고리 자동 분류를 위한 키워드(도메인/제목 기반) — 필요시 config로 확장
DEFAULT_CATEGORY_RULES = [
    ("고객/영업", ["customer", "sales", "quote", "견적", "계약", "구매", "proposal"]),
    ("내부 협업", ["team", "internal", "회의", "meeting", "sync", "standup"]),
    ("파트너/협력사", ["partner", "vendor", "협력", "제휴"]),
    ("뉴스레터/구독", ["newsletter", "noreply", "no-reply", "digest", "구독"]),
]


def _parse(dt: str) -> datetime:
    return datetime.fromisoformat(dt.replace("Z", "+00:00"))


def _categorize(email: dict) -> str:
    if email.get("category"):
        return email["category"]
    hay = f"{email.get('from','')} {' '.join(email.get('to',[]))} {email.get('subject','')}".lower()
    for name, kws in DEFAULT_CATEGORY_RULES:
        if any(k in hay for k in kws):
            return name
    return "기타"


def _bucket_label(dt: datetime, report_type: str, start: datetime) -> str:
    if report_type == "weekly":
        return WEEKDAY_KO[dt.weekday()]
    # monthly → 몇 주차
    week = ((dt - start).days // 7) + 1
    return f"{week}주"


def aggregate_email(emails: list[dict], report_type: str, start: datetime, end: datetime) -> dict:
    received = [e for e in emails if e.get("direction") == "in"]
    sent = [e for e in emails if e.get("direction") == "out"]

    # 일/주 단위 버킷
    buckets: dict[str, dict] = defaultdict(lambda: {"received": 0, "sent": 0})
    if report_type == "weekly":
        order = WEEKDAY_KO[:]
    else:
        weeks = max(1, ((end - start).days // 7) + 1)
        order = [f"{i+1}주" for i in range(weeks)]
    for e in emails:
        label = _bucket_label(_parse(e["date"]), report_type, start)
        key = "received" if e.get("direction") == "in" else "sent"
        buckets[label][key] += 1
    by_day = [{"day": lbl, **buckets[lbl]} for lbl in order]

    # 카테고리
    cat = Counter(_categorize(e) for e in emails)
    by_category = [{"name": k, "value": v} for k, v in cat.most_common()]

    # 주요 상대 (수신 기준 상위)
    contacts: dict[str, dict] = defaultdict(lambda: {"received": 0, "sent": 0, "name": "", "email": ""})
    for e in received:
        addr = e.get("from", "")
        contacts[addr]["received"] += 1
        contacts[addr]["email"] = addr
        contacts[addr]["name"] = e.get("from_name") or addr
    for e in sent:
        for addr in e.get("to", []):
            contacts[addr]["sent"] += 1
            contacts[addr]["email"] = addr
            if not contacts[addr]["name"]:
                contacts[addr]["name"] = addr
    top = sorted(contacts.values(), key=lambda c: c["received"] + c["sent"], reverse=True)[:5]

    # 응답 시간 / 미응답
    resp = [e["responded_hours"] for e in received if e.get("responded_hours") is not None]
    avg_resp = round(sum(resp) / len(resp), 1) if resp else None
    unreplied = sum(1 for e in received if e.get("responded_hours") is None and e.get("needs_reply"))

    return {
        "totalReceived": len(received),
        "totalSent": len(sent),
        "unreplied": unreplied,
        "avgResponseHours": avg_resp,
        "byDay": by_day,
        "byCategory": by_category,
        "topContacts": top,
    }


def aggregate_work(events: list[dict]) -> dict:
    total_by_cat: Counter = Counter()
    meeting_hours = 0.0
    meeting_count = 0
    for ev in events:
        dur = (_parse(ev["end"]) - _parse(ev["start"])).total_seconds() / 3600
        cat = ev.get("category") or ("회의" if ev.get("attendees", 0) > 1 else "집중 업무")
        total_by_cat[cat] += dur
        if cat == "회의":
            meeting_hours += dur
            meeting_count += 1
    time_alloc = [{"category": k, "hours": round(v, 1)} for k, v in total_by_cat.most_common()]
    return {
        "meetingHours": round(meeting_hours, 1),
        "focusHours": round(total_by_cat.get("집중 업무", 0.0), 1),
        "meetingCount": meeting_count,
        "timeAllocation": time_alloc,
    }


def build_stats(emails, events, report_type, start, end) -> dict:
    s, e = _parse(start), _parse(end)
    return {
        "type": report_type,
        "period": {"start": start, "end": end},
        "email": aggregate_email(emails, report_type, s, e),
        "work": aggregate_work(events),
    }


def main() -> None:
    ap = argparse.ArgumentParser(description="메일·일정 통계 집계")
    ap.add_argument("--emails", required=True)
    ap.add_argument("--events", required=True)
    ap.add_argument("--type", choices=["weekly", "monthly"], default="weekly")
    ap.add_argument("--start", required=True)
    ap.add_argument("--end", required=True)
    ap.add_argument("--out", default="-")
    args = ap.parse_args()

    with open(args.emails, encoding="utf-8") as f:
        emails = json.load(f)
    with open(args.events, encoding="utf-8") as f:
        events = json.load(f)

    stats = build_stats(emails, events, args.type, args.start, args.end)
    out = json.dumps(stats, ensure_ascii=False, indent=2)
    if args.out == "-":
        print(out)
    else:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(out)
        print(f"✓ 통계 저장: {args.out}")


if __name__ == "__main__":
    main()
