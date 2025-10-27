import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { Card } from "../../lib/api";
import { STATUS_LABELS, Status, cn } from "../../lib/utils";
import { CardItem } from "./CardItem";

interface Props {
  status: Status;
  cards: Card[];
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
  isDimmed?: boolean;
}

export function BoardColumn({ status, cards, onEdit, onDelete, isDimmed }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: `column-${status}`, data: { status } });

  return (
    <div
      data-testid={`column-${status}`}
      ref={setNodeRef}
      className={cn(
        "flex min-w-[280px] flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4",
        isOver && "border-brand-500 bg-brand-500/5",
        isDimmed && "opacity-60"
      )}
    >
      <header className="flex items-center justify-between text-sm font-semibold text-slate-200">
        <span>{STATUS_LABELS[status]}</span>
        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-400">{cards.length}</span>
      </header>
      <SortableContext items={cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isDimmed={isDimmed}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
          {cards.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
              Drop cards here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
