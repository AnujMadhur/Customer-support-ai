from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, Ticket
from ai_pipeline import generate_insight_summary

router = APIRouter(prefix="/insights", tags=["Insights"])


@router.get("/top-issues")
def top_issues(db: Session = Depends(get_db)):
    results = (
        db.query(Ticket.category, func.count(Ticket.id).label("count"))
        .filter(Ticket.category.isnot(None))
        .group_by(Ticket.category)
        .order_by(func.count(Ticket.id).desc())
        .all()
    )
    return [{"category": r[0], "count": r[1]} for r in results]


@router.get("/sentiment-breakdown")
def sentiment_breakdown(db: Session = Depends(get_db)):
    results = (
        db.query(Ticket.sentiment, func.count(Ticket.id).label("count"))
        .filter(Ticket.sentiment.isnot(None))
        .group_by(Ticket.sentiment)
        .all()
    )
    return [{"sentiment": r[0], "count": r[1]} for r in results]


@router.get("/frustration-by-category")
def frustration_by_category(db: Session = Depends(get_db)):
    results = (
        db.query(
            Ticket.category,
            func.avg(Ticket.frustration_score).label("avg_frustration"),
            func.count(Ticket.id).label("count")
        )
        .filter(Ticket.category.isnot(None))
        .group_by(Ticket.category)
        .order_by(func.avg(Ticket.frustration_score).desc())
        .all()
    )
    return [
        {
            "category": r[0],
            "avg_frustration": round(float(r[1] or 0), 1),
            "count": r[2]
        }
        for r in results
    ]


@router.get("/by-country")
def by_country(db: Session = Depends(get_db)):
    results = (
        db.query(Ticket.customer_country, func.count(Ticket.id).label("count"))
        .filter(Ticket.customer_country.isnot(None))
        .group_by(Ticket.customer_country)
        .order_by(func.count(Ticket.id).desc())
        .limit(10)
        .all()
    )
    return [{"country": r[0], "count": r[1]} for r in results]


@router.get("/by-channel")
def by_channel(db: Session = Depends(get_db)):
    results = (
        db.query(Ticket.channel, func.count(Ticket.id).label("count"))
        .filter(Ticket.channel.isnot(None))
        .group_by(Ticket.channel)
        .all()
    )
    return [{"channel": r[0], "count": r[1]} for r in results]


@router.get("/summary")
def executive_summary(db: Session = Depends(get_db)):
    tickets = db.query(Ticket).filter(Ticket.category.isnot(None)).limit(100).all()
    data = [
        {
            "category": t.category,
            "key_issue": t.key_issue,
            "frustration_score": t.frustration_score
        }
        for t in tickets
    ]
    return {"summary": generate_insight_summary(data)}


@router.get("/stats")
def stats(db: Session = Depends(get_db)):
    total        = db.query(func.count(Ticket.id)).scalar() or 0
    avg_frust    = db.query(func.avg(Ticket.frustration_score)).scalar() or 0
    negative_ct  = db.query(func.count(Ticket.id)).filter(Ticket.sentiment == "negative").scalar() or 0
    positive_ct  = db.query(func.count(Ticket.id)).filter(Ticket.sentiment == "positive").scalar() or 0
    resolved_ct  = db.query(func.count(Ticket.id)).filter(Ticket.resolution_status == "resolved").scalar() or 0

    return {
        "total_tickets":    total,
        "avg_frustration":  round(float(avg_frust), 1),
        "negative_tickets": negative_ct,
        "positive_tickets": positive_ct,
        "resolved_tickets": resolved_ct,
        "negative_pct":     round((negative_ct / total * 100) if total else 0, 1),
        "resolution_rate":  round((resolved_ct / total * 100) if total else 0, 1)
    }