from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.core.enums import CardStatus


class CardBase(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    description: str = Field(min_length=1)
    status: CardStatus = CardStatus.todo


class CardCreate(CardBase):
    pass


class CardUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=120)
    description: Optional[str] = Field(default=None, min_length=1)
    status: Optional[CardStatus] = None


class CardRead(CardBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedCards(BaseModel):
    items: list[CardRead]
    total: int
    page: int
    size: int
