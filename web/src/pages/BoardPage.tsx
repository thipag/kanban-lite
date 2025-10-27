import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Filter, Loader2, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Card, CardInput } from "../lib/api";
import { STATUS_LABELS, STATUSES, Status, cn } from "../lib/utils";
import { useCards } from "../hooks/useCards";
import { useViewportMode } from "../hooks/useViewportMode";
import { BoardColumn } from "../components/board/BoardColumn";
import { CardForm } from "../components/board/CardForm";
import { CardItem } from "../components/board/CardItem";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

type FilterValue = "all" | Status;

type ColumnData = {
  status: Status;
  label: string;
  cards: Card[];
};

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All statuses" },
  ...STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status] }))
];

export default function BoardPage() {
  const { query, create, update, remove } = useCards();
  const mode = useViewportMode();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterValue>("all");
  const [mobileTab, setMobileTab] = useState<Status>("todo");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  useEffect(() => {
    if (statusFilter !== "all") {
      setMobileTab(statusFilter);
    }
  }, [statusFilter]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 12 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const cards = query.data?.items ?? [];

  const columns = useMemo<ColumnData[]>(
    () =>
      STATUSES.map((status) => ({
        status,
        label: STATUS_LABELS[status],
        cards: cards.filter((card) => card.status === status)
      })),
    [cards]
  );

  const dimmedStatus = statusFilter === "all" ? null : statusFilter;
  const totalCards = query.data?.total ?? cards.length;
  const activeCard = activeCardId ? cards.find((card) => card.id === activeCardId) ?? null : null;

  const handleCreateSubmit = (values: CardInput) => {
    create.mutate(values, {
      onSuccess: () => setIsCreateOpen(false)
    });
  };

  const handleEditSubmit = (values: CardInput) => {
    if (!editingCard) {
      return;
    }
    update.mutate(
      { id: editingCard.id, input: values },
      {
        onSuccess: () => setEditingCard(null)
      }
    );
  };

  const handleDelete = () => {
    if (!editingCard) {
      return;
    }
    remove.mutate(editingCard.id, {
      onSuccess: () => setEditingCard(null)
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = event;
    const card = cards.find((item) => item.id === active.id);
    if (!card) {
      return;
    }
    let nextStatus =
      (over?.data.current?.status as Status | undefined) ??
      (over?.data.current?.card?.status as Status | undefined) ??
      null;
    if (!nextStatus) {
      nextStatus = deriveStatusFromDelta(event, card.status);
    }
    if (!nextStatus || nextStatus === card.status) {
      return;
    }
    updateStatus(card.id, nextStatus);
    if (mode === "mobile") {
      setMobileTab(nextStatus);
    }
  };

  const handleDragCancel = () => {
    setActiveCardId(null);
  };

  const updateStatus = (id: string, status: Status) => {
    update.mutate({ id, input: { status } });
  };

  const deriveStatusFromDelta = (event: DragEndEvent, currentStatus: Status): Status | null => {
    const delta = event.delta ?? { x: 0, y: 0 };
    const currentIndex = STATUSES.indexOf(currentStatus);
    if (currentIndex === -1) {
      return null;
    }
    const primaryAxis = Math.abs(delta.x) >= Math.abs(delta.y) ? "horizontal" : "vertical";
    const direction = primaryAxis === "horizontal" ? (delta.x >= 0 ? 1 : -1) : delta.y >= 0 ? 1 : -1;
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= STATUSES.length) {
      return null;
    }
    return STATUSES[targetIndex];
  };

  if (query.isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-center text-sm text-rose-200">
        Unable to load cards. Try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <DialogTrigger asChild>
              <Button size="sm" className="h-11 px-5">
                <Plus size={16} /> New card
              </Button>
            </DialogTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-11 gap-2 px-4">
                  <Filter size={16} />
                  {filterOptions.find((option) => option.value === statusFilter)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {filterOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={(event) => {
                      event.preventDefault();
                      setStatusFilter(option.value);
                    }}
                    className={cn(
                      "justify-between",
                      statusFilter === option.value && "text-brand-400"
                    )}
                  >
                    {option.label}
                    {statusFilter === option.value && <span>●</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <span className="text-sm text-slate-400">{totalCards} cards</span>
        </div>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New card</DialogTitle>
            <DialogDescription>Create a task and choose where it starts.</DialogDescription>
          </DialogHeader>
          <CardForm submitLabel="Create" onSubmit={handleCreateSubmit} isSubmitting={create.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCard)} onOpenChange={(open) => (!open ? setEditingCard(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit card</DialogTitle>
            <DialogDescription>Update details or move the card to another column.</DialogDescription>
          </DialogHeader>
          {editingCard && (
            <CardForm
              submitLabel="Save"
              onSubmit={handleEditSubmit}
              onDelete={handleDelete}
              isSubmitting={update.isPending}
              isDeleting={remove.isPending}
              defaultValues={{
                title: editingCard.title,
                description: editingCard.description,
                status: editingCard.status
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {mode === "mobile" && (
          <MobileBoard
            columns={columns}
            activeTab={mobileTab}
            onTabChange={(value) => setMobileTab(value)}
            onEdit={setEditingCard}
            onDelete={(card) => remove.mutate(card.id)}
            dimmedStatus={dimmedStatus}
          />
        )}
        {mode === "tablet" && (
          <TabletBoard
            columns={columns}
            onEdit={setEditingCard}
            onDelete={(card) => remove.mutate(card.id)}
            dimmedStatus={dimmedStatus}
          />
        )}
        {mode === "desktop" && (
          <DesktopBoard
            columns={columns}
            onEdit={setEditingCard}
            onDelete={(card) => remove.mutate(card.id)}
            dimmedStatus={dimmedStatus}
          />
        )}
        <DragOverlay>{activeCard ? <CardGhost card={activeCard} /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

interface BoardProps {
  columns: ColumnData[];
  onEdit: (card: Card | null) => void;
  onDelete: (card: Card) => void;
  dimmedStatus: Status | null;
}

interface MobileBoardProps extends BoardProps {
  activeTab: Status;
  onTabChange: (status: Status) => void;
}

function MobileBoard({ columns, activeTab, onTabChange, onEdit, onDelete, dimmedStatus }: MobileBoardProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as Status)}>
      <TabsList>
        {columns.map((column) => (
          <DroppableTabsTrigger
            key={column.status}
            status={column.status}
            isDimmed={dimmedStatus !== null && dimmedStatus !== column.status}
          >
            {column.label}
          </DroppableTabsTrigger>
        ))}
      </TabsList>
      {columns.map((column) => (
        <TabsContent key={column.status} value={column.status}>
          <BoardColumn
            status={column.status}
            cards={column.cards}
            onEdit={(card) => onEdit(card)}
            onDelete={onDelete}
            isDimmed={dimmedStatus !== null && dimmedStatus !== column.status}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function TabletBoard({ columns, onEdit, onDelete, dimmedStatus }: BoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {columns.map((column) => (
        <BoardColumn
          key={column.status}
          status={column.status}
          cards={column.cards}
          onEdit={(card) => onEdit(card)}
          onDelete={onDelete}
          isDimmed={dimmedStatus !== null && dimmedStatus !== column.status}
        />
      ))}
    </div>
  );
}

function DesktopBoard({ columns, onEdit, onDelete, dimmedStatus }: BoardProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {columns.map((column) => (
        <BoardColumn
          key={column.status}
          status={column.status}
          cards={column.cards}
          onEdit={(card) => onEdit(card)}
          onDelete={onDelete}
          isDimmed={dimmedStatus !== null && dimmedStatus !== column.status}
        />
      ))}
    </div>
  );
}

function CardGhost({ card }: { card: Card }) {
  return (
    <div className="w-[260px] rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-white shadow-card">
      {card.title && <h3 className="text-base font-semibold text-white">{card.title}</h3>}
      <p className="mt-2 text-slate-200">{card.description}</p>
      <span className="mt-3 inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
        {STATUS_LABELS[card.status]}
      </span>
    </div>
  );
}

function DroppableTabsTrigger({
  status,
  children,
  isDimmed
}: {
  status: Status;
  children: React.ReactNode;
  isDimmed: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `tab-${status}`, data: { status } });
  return (
    <TabsTrigger
      ref={setNodeRef}
      value={status}
      className={cn(isOver && "ring-2 ring-brand-400", isDimmed && "opacity-60")}
    >
      {children}
    </TabsTrigger>
  );
}
