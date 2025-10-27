from alembic import op
import sqlalchemy as sa

revision = "2024042901_create_cards_table"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cards",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("status", sa.Enum("todo", "doing", "done", name="card_status", native_enum=False), nullable=False, server_default="todo"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_cards_status", "cards", ["status"])
    op.create_index("ix_cards_created_at", "cards", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_cards_created_at", table_name="cards")
    op.drop_index("ix_cards_status", table_name="cards")
    op.drop_table("cards")
