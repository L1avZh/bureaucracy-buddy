from fastapi import FastAPI
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import uuid, os
from apscheduler.schedulers.asyncio import AsyncIOScheduler

app = FastAPI(title="מזכיר ביורוקרטיה 🇮🇱")

class Document(BaseModel):
    id: uuid.UUID | None = None
    kind: str                # passport / license / id / car_insurance
    expires_at: datetime
    email: EmailStr

sched = AsyncIOScheduler(); sched.start()

def queue_reminder(doc: Document) -> None:
    run_at = doc.expires_at - timedelta(days=30)
    sched.add_job(
        send_email,
        trigger="date",
        run_date=run_at,
        args=[doc],
        id=str(doc.id)
    )

def send_email(doc: Document) -> None:
    # TODO: hook SendGrid / Mailgun; Hebrew subject & body:
    print(f"📧 30 יום נותרו! חידוש {doc.kind} עד {doc.expires_at.date()}")

@app.post("/docs")
async def add_document(doc: Document):
    doc.id = uuid.uuid4()
    queue_reminder(doc)
    return {"status": "scheduled", "id": doc.id}

