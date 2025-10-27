import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Ellipsis, GripVertical, Pencil, Trash } from "lucide-react";

import { Card } from "../../lib/api";
import { STATUS_LABELS, cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../ui/dropdown-menu";

interface Props {
  card: Card;
  isDimmed?: boolean;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

export function CardItem({ card, isDimmed, onEdit, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { status: card.status, card }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  } as React.CSSProperties;

  return (
    <div
      data-testid={`card-${card.id}`}
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-100 shadow-card transition-all",
        isDragging && "ring-2 ring-brand-400",
        isDimmed && "opacity-60"
      )}
      {...attributes}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          {card.title && <h3 className="text-base font-semibold text-white">{card.title}</h3>}
          <p className="leading-relaxed text-slate-200">{card.description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
            aria-label="Drag card"
            {...listeners}
          >
            <GripVertical size={18} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
                aria-label="Card actions"
              >
                <Ellipsis size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  onEdit(card);
                }}
              >
                <Pencil size={16} /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-400 hover:text-rose-300"
                onSelect={(event) => {
                  event.preventDefault();
                  onDelete(card);
                }}
              >
                <Trash size={16} /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <span className="inline-flex w-fit rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {STATUS_LABELS[card.status]}
      </span>
    </div>
  );
}
