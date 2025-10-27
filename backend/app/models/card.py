import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, String, Text

from app.core.enums import CardStatus
from app.db.base import Base


class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(120), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(Enum(CardStatus, name="card_status", native_enum=False), nullable=False, default=CardStatus.todo)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
