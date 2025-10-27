from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.enums import CardStatus
from app.models.card import Card
from app.schemas.card import CardCreate, CardUpdate


def create_card(db: Session, data: CardCreate) -> Card:
    payload = data.model_dump()
    card = Card(**payload)
    db.add(card)
    db.commit()
    db.refresh(card)
    return card


def get_card(db: Session, card_id: str) -> Card | None:
    statement = select(Card).where(Card.id == card_id)
    result = db.execute(statement).scalar_one_or_none()
    return result


def list_cards(db: Session, status: CardStatus | None, page: int, size: int) -> tuple[Sequence[Card], int]:
    filters = []
    if status is not None:
        filters.append(Card.status == status)
    base_query = select(Card).where(*filters).order_by(Card.created_at.desc(), Card.id.desc())
    total_statement = select(func.count()).select_from(select(Card.id).where(*filters).subquery())
    total = db.execute(total_statement).scalar_one()
    items = db.execute(base_query.offset((page - 1) * size).limit(size)).scalars().all()
    return items, total


def update_card(db: Session, card: Card, data: CardUpdate) -> Card:
    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(card, field, value)
    db.commit()
    db.refresh(card)
    return card


def delete_card(db: Session, card: Card) -> None:
    db.delete(card)
    db.commit()
