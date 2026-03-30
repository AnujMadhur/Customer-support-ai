from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db, Ticket
from ai_pipeline import analyze_ticket
import pandas as pd
import io
import uuid
import time
from datetime import datetime

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload a CSV of tickets — AI processes each one automatically."""

    content = await file.read()
    # Try multiple encodings to handle any CSV format
    for encoding in ['utf-8', 'latin-1', 'cp1252', 'iso-8859-1']:
        try:
            df = pd.read_csv(io.BytesIO(content), encoding=encoding)
            break
        except (UnicodeDecodeError, Exception):
            continue

    # Normalize column names
    df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]

    processed = 0
    skipped   = 0
    errors    = 0

    for i, row in df.iterrows():
        try:
            message = str(row.get("message", "")).strip()
            if not message or message == "nan":
                skipped += 1
                continue

            # Skip if already in database
            tid = str(row.get("ticket_id", "")).strip()
            if tid and db.query(Ticket).filter(Ticket.ticket_id == tid).first():
                skipped += 1
                continue

            # Call AI
            ai_result = analyze_ticket(
                message=message,
                product=str(row.get("product", "")),
                channel=str(row.get("channel", ""))
            )
            time.sleep(0.1)

            ticket = Ticket(
                ticket_id         = tid or str(uuid.uuid4()),
                timestamp         = datetime.utcnow(),
                customer_id       = str(row.get("customer_id", "")),
                channel           = str(row.get("channel", "unknown")),
                message           = message,
                agent_reply       = str(row.get("agent_reply", "")),
                product           = str(row.get("product", "")),
                order_value       = float(row.get("order_value", 0) or 0),
                customer_country  = str(row.get("customer_country", "")),
                resolution_status = str(row.get("resolution_status", "open")),
                category          = ai_result.get("category", "General Inquiry"),
                sentiment         = ai_result.get("sentiment", "neutral"),
                frustration_score = int(ai_result.get("frustration_score", 5)),
                suggested_response= ai_result.get("suggested_response", ""),
                key_issue         = ai_result.get("key_issue", "")
            )
            db.add(ticket)
            processed += 1

            # Commit every 50 rows so you don't lose progress
            if processed % 50 == 0:
                db.commit()
                print(f"✅ {processed} tickets processed so far...")
                time.sleep(1)  # Respect free tier rate limits

        except Exception as e:
            errors += 1
            print(f"Row {i} failed: {e}")
            time.sleep(2)

    db.commit()
    return {
        "processed": processed,
        "skipped": skipped,
        "errors": errors,
        "message": f"Done! {processed} tickets analyzed ✅"
    }


@router.post("/single")
async def add_single_ticket(data: dict, db: Session = Depends(get_db)):
    """Analyze and save a single new ticket in real-time."""

    ai_result = analyze_ticket(
        message=data.get("message", ""),
        product=data.get("product", ""),
        channel=data.get("channel", "")
    )

    ticket = Ticket(
        ticket_id          = str(uuid.uuid4()),
        message            = data.get("message", ""),
        channel            = data.get("channel", "unknown"),
        product            = data.get("product", ""),
        category           = ai_result.get("category"),
        sentiment          = ai_result.get("sentiment"),
        frustration_score  = ai_result.get("frustration_score"),
        suggested_response = ai_result.get("suggested_response"),
        key_issue          = ai_result.get("key_issue")
    )
    db.add(ticket)
    db.commit()

    return {"ticket_id": ticket.ticket_id, "analysis": ai_result}


@router.get("/list")
def list_tickets(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Get list of tickets with their AI analysis."""
    tickets = db.query(Ticket).order_by(Ticket.id.desc()).offset(skip).limit(limit).all()
    return [
        {
            "ticket_id": t.ticket_id,
            "message": t.message,
            "product": t.product,
            "channel": t.channel,
            "category": t.category,
            "sentiment": t.sentiment,
            "frustration_score": t.frustration_score,
            "key_issue": t.key_issue,
            "suggested_response": t.suggested_response,
            "resolution_status": t.resolution_status,
            "customer_country": t.customer_country,
            "order_value": t.order_value
        }
        for t in tickets
    ]