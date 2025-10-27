import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

from sqlalchemy import select

from app.core.migrate import run_migrations
from app.crud.card import create_card
from app.db.session import SessionLocal, runtime_database_url
from app.models.card import Card
from app.schemas.card import CardCreate

SAMPLE_CARDS = [
    CardCreate(title="Sprint planning", description="Prepare the next sprint backlog", status="todo"),
    CardCreate(title="API integration", description="Connect frontend board to backend", status="doing"),
    CardCreate(title="Design review", description="Review responsive layout", status="done"),
]


def main() -> None:
    print(f"Using database {runtime_database_url()}")
    run_migrations()
    with SessionLocal() as session:
        existing = session.execute(select(Card.id).limit(1)).scalar_one_or_none()
        if existing is not None:
            print("Seed skipped, cards already exist")
            return
        for card in SAMPLE_CARDS:
            create_card(session, card)
    print("Seed completed")


if __name__ == "__main__":
    main()
