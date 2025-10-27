from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.enums import CardStatus
from app.crud.card import create_card, delete_card, get_card, list_cards, update_card
from app.schemas.card import CardCreate, CardRead, CardUpdate, PaginatedCards

router = APIRouter(prefix="/cards")


@router.post("", response_model=CardRead, status_code=201)
def create_card_endpoint(payload: CardCreate, db: Session = Depends(get_db)) -> CardRead:
    card = create_card(db, payload)
    return CardRead.model_validate(card)


@router.get("", response_model=PaginatedCards)
def list_cards_endpoint(
    status: CardStatus | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
) -> PaginatedCards:
    items, total = list_cards(db, status, page, size)
    return PaginatedCards(items=[CardRead.model_validate(item) for item in items], total=total, page=page, size=size)


@router.get("/{card_id}", response_model=CardRead)
def read_card(card_id: str, db: Session = Depends(get_db)) -> CardRead:
    card = get_card(db, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    return CardRead.model_validate(card)


@router.put("/{card_id}", response_model=CardRead)
def update_card_endpoint(card_id: str, payload: CardUpdate, db: Session = Depends(get_db)) -> CardRead:
    card = get_card(db, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    if not payload.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = update_card(db, card, payload)
    return CardRead.model_validate(updated)


@router.delete("/{card_id}", status_code=204)
def delete_card_endpoint(card_id: str, db: Session = Depends(get_db)) -> Response:
    card = get_card(db, card_id)
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")
    delete_card(db, card)
    return Response(status_code=204)
