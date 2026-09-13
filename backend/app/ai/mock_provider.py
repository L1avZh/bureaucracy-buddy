"""Deterministic, offline mock AI provider. No network calls. Always labeled provider="mock".

Produces a reasonable, generic checklist based on category (and simple keyword matching on the
goal when no category is given). This is intentionally NOT a real AI call — it exists so the
app is fully usable, testable, and demoable offline, and it never claims to be verified/official
guidance (see DISCLAIMER).
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.ai.provider import DISCLAIMER, AIProvider
from app.schemas.ai import (
    ChatMessage,
    ChecklistResponse,
    SuggestedDocument,
    SuggestedProcess,
    SuggestedTask,
)
from app.schemas.common import ProcessCategory, ProcessPriority

_CATEGORY_TEMPLATES: dict[str, list[tuple[str, str, int]]] = {
    "immigration": [
        ("Confirm eligibility and required visa/permit category", "Check the official government site for the exact category that matches your situation before applying.", 20),
        ("Gather identity documents", "Passport, national ID, birth certificate, and any prior visas or permits.", 15),
        ("Complete the application form", "Fill out the official application form completely and accurately.", 30),
        ("Take/prepare required photos", "Many applications require recent passport-style photos meeting specific size and background rules.", 10),
        ("Pay the application fee", "Fees vary by category and processing speed; keep the payment receipt.", 10),
        ("Book/attend biometrics or an in-person appointment", "Some processes require fingerprints or an in-person interview.", 30),
        ("Submit the application and keep a copy", "Submit through the official channel (portal, mail, or in person) and retain confirmation.", 15),
        ("Track application status and respond to requests", "Check status periodically and respond quickly to any request for more documents.", 10),
    ],
    "government": [
        ("Identify the correct government office/department", "Confirm which office handles this specific request.", 15),
        ("Gather required identity and supporting documents", "Typical requirements: ID, proof of address, and any prior reference numbers.", 15),
        ("Fill out the required form(s)", "Use the official form; keep a copy of everything submitted.", 20),
        ("Submit the request (online, by mail, or in person)", "Note the submission date and any confirmation/reference number.", 15),
        ("Pay any applicable fee", "Keep the receipt for your records.", 10),
        ("Follow up if you don't hear back within the stated timeframe", "Bureaucratic timelines slip — a polite follow-up often helps.", 10),
    ],
    "tax": [
        ("Gather income and expense records", "Pay slips, invoices, receipts, prior year filings.", 30),
        ("Confirm filing deadline and method", "Check whether online filing is available and the exact due date.", 10),
        ("Fill out the relevant tax form(s)", "Double-check calculations or use tax software.", 45),
        ("Submit the filing", "Submit online or by mail before the deadline.", 15),
        ("Pay any balance due or confirm refund status", "Keep proof of payment.", 15),
        ("Store copies of everything filed", "Keep records for the legally required retention period.", 5),
    ],
    "healthcare": [
        ("Confirm coverage/eligibility", "Check insurance or public health coverage details.", 15),
        ("Gather medical records and referrals", "Prior diagnoses, referral letters, insurance card.", 15),
        ("Schedule the appointment or submit the request", "Book with the provider or submit the required form.", 15),
        ("Prepare questions and documents for the visit", "Bring ID, insurance card, and a list of current medications.", 10),
        ("Follow up on results or next steps", "Confirm results, prescriptions, or referrals after the visit.", 10),
    ],
    "employment": [
        ("Review the requirement or benefit details", "Understand exactly what is required (e.g., work permit, unemployment claim).", 15),
        ("Gather employment documents", "Contract, pay slips, termination letter, ID.", 15),
        ("Complete and submit the relevant form", "Submit to the employer, agency, or government portal.", 20),
        ("Track the claim/request status", "Follow up periodically until resolved.", 10),
    ],
    "education": [
        ("Confirm admission/registration requirements", "Check deadlines and required documents on the institution's site.", 15),
        ("Gather academic records", "Transcripts, diplomas, test scores, ID.", 15),
        ("Submit the application/registration", "Submit online or in person before the deadline.", 20),
        ("Pay any required fees", "Tuition deposit, application fee, etc.", 10),
        ("Confirm enrollment/acceptance", "Check your status through the official portal.", 10),
    ],
    "housing": [
        ("Gather proof of identity and income", "ID, pay slips, bank statements.", 15),
        ("Review lease/application requirements", "Check what the landlord, agency, or housing authority requires.", 10),
        ("Submit the application", "Submit with all required documents attached.", 15),
        ("Arrange deposit/first payment", "Keep proof of payment and any signed agreement.", 10),
        ("Schedule move-in/inspection", "Document the property condition on move-in.", 15),
    ],
    "vehicles": [
        ("Confirm the exact requirement", "Registration, license renewal, inspection, etc.", 10),
        ("Gather vehicle and identity documents", "Registration, insurance, ID, prior certificates.", 15),
        ("Schedule an inspection/appointment if required", "Some processes need an in-person inspection.", 20),
        ("Submit the application/payment", "Complete the form and pay the applicable fee.", 15),
        ("Update/print the new document", "Keep the updated registration/license accessible.", 10),
    ],
    "banking": [
        ("Confirm required documents", "ID, proof of address, proof of income if applicable.", 10),
        ("Complete the bank's application form", "In branch or via the bank's online portal.", 20),
        ("Submit and verify identity", "May require in-person or video verification.", 15),
        ("Confirm account/service activation", "Check that everything is active and working as expected.", 10),
    ],
    "other": [
        ("Clarify exactly what is required", "Write down the specific outcome you need.", 10),
        ("Gather likely-needed documents", "Identity documents and any prior reference numbers.", 15),
        ("Identify the right office, form, or website", "Search official sources first.", 15),
        ("Submit the request", "Submit through the official channel and keep confirmation.", 15),
        ("Follow up until resolved", "Bureaucratic processes often need a follow-up nudge.", 10),
    ],
}

_KEYWORD_CATEGORY_HINTS: list[tuple[str, str]] = [
    ("passport", "immigration"),
    ("visa", "immigration"),
    ("citizenship", "immigration"),
    ("tax", "tax"),
    ("irs", "tax"),
    ("doctor", "healthcare"),
    ("insurance", "healthcare"),
    ("health", "healthcare"),
    ("job", "employment"),
    ("unemployment", "employment"),
    ("employer", "employment"),
    ("school", "education"),
    ("university", "education"),
    ("college", "education"),
    ("apartment", "housing"),
    ("lease", "housing"),
    ("rent", "housing"),
    ("car", "vehicles"),
    ("license", "vehicles"),
    ("vehicle", "vehicles"),
    ("bank", "banking"),
    ("account", "banking"),
]


def _infer_category(goal: str, category: str | None) -> str:
    if category:
        return category
    lowered = goal.lower()
    for keyword, cat in _KEYWORD_CATEGORY_HINTS:
        if keyword in lowered:
            return cat
    return "other"


class MockAIProvider(AIProvider):
    name = "mock"

    async def generate_checklist(self, goal: str, category: str | None) -> ChecklistResponse:
        resolved_category = _infer_category(goal, category)
        template = _CATEGORY_TEMPLATES.get(resolved_category, _CATEGORY_TEMPLATES["other"])

        process = SuggestedProcess(
            title=goal.strip()[:255] or "New bureaucratic process",
            category=ProcessCategory(resolved_category),
            description=(
                f"Suggested plan to help with: {goal.strip()}. This is a generic, AI-generated "
                "starting point — steps and requirements vary by jurisdiction and office."
            ),
            priority=ProcessPriority.medium,
        )
        tasks = [
            SuggestedTask(title=title, explanation=explanation, estimated_minutes=minutes)
            for title, explanation, minutes in template
        ]
        documents = [
            SuggestedDocument(title="Government-issued photo ID", category="identity"),
            SuggestedDocument(title="Proof of address", category="identity"),
            SuggestedDocument(title="Any prior reference numbers or confirmations", category="reference"),
        ]
        questions = [
            "Which specific office or agency handles this in your location?",
            "Is there an official deadline you need to meet?",
            "Have you started this process before (do you have an existing case/reference number)?",
        ]
        return ChecklistResponse(
            process=process,
            tasks=tasks,
            documents=documents,
            questions=questions,
            disclaimer=DISCLAIMER,
            provider="mock",
        )

    async def chat(self, messages: list[ChatMessage]) -> str:
        last_user = next((m for m in reversed(messages) if m.role == "user"), None)
        prompt = last_user.content if last_user else ""
        return (
            "This is a mock AI response (no live model was called). "
            f"You said: \"{prompt.strip()[:300]}\". "
            "For a real, specific answer, confirm details with the official agency handling "
            "this process. " + DISCLAIMER
        )


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
