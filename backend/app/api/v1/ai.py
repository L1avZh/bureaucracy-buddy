from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai import get_ai_provider
from app.ai.provider import AIProvider
from app.config import Settings, get_settings
from app.database import get_db
from app.errors import NotFoundError
from app.models.ai_conversation import AIConversation
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.ai import ChatMessage, ChatRequest, ChatResponse, ChecklistRequest, ChecklistResponse
from app.security import get_current_user
from app.services import process_service

router = APIRouter(prefix="/ai", tags=["ai"])


def _get_provider(settings: Settings = Depends(get_settings)) -> AIProvider:
    return get_ai_provider(settings)


@router.post("/checklist", response_model=ChecklistResponse)
@limiter.limit("20/minute")
async def ai_checklist(
    request: Request,
    payload: ChecklistRequest,
    current_user: User = Depends(get_current_user),
    provider: AIProvider = Depends(_get_provider),
) -> ChecklistResponse:
    return await provider.generate_checklist(payload.goal, payload.category)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def ai_chat(
    request: Request,
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    provider: AIProvider = Depends(_get_provider),
) -> ChatResponse:
    if payload.process_id:
        await process_service.get_process_or_404(db, current_user.id, payload.process_id)

    conversation: AIConversation | None = None
    if payload.conversation_id:
        result = await db.execute(
            select(AIConversation).where(
                AIConversation.id == payload.conversation_id,
                AIConversation.user_id == current_user.id,
            )
        )
        conversation = result.scalar_one_or_none()
        if conversation is None:
            raise NotFoundError("Conversation not found")

    if conversation is None:
        conversation = AIConversation(
            user_id=current_user.id,
            process_id=payload.process_id,
            title=payload.message.strip()[:80] or "New conversation",
            messages=[],
            provider=provider.name,
        )
        db.add(conversation)

    now = datetime.now(timezone.utc)
    history = [ChatMessage(**m) for m in conversation.messages]
    history.append(ChatMessage(role="user", content=payload.message, created_at=now))

    reply_text = await provider.chat(history)
    reply_message = ChatMessage(role="assistant", content=reply_text, created_at=datetime.now(timezone.utc))
    history.append(reply_message)

    conversation.messages = [m.model_dump(mode="json") for m in history]
    conversation.provider = provider.name
    await db.commit()
    await db.refresh(conversation)

    from app.ai.provider import DISCLAIMER

    return ChatResponse(
        conversation_id=conversation.id,
        reply=reply_text,
        messages=history,
        disclaimer=DISCLAIMER,
        provider=provider.name,
    )
