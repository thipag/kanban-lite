import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { vi, type Mock } from "vitest";

import BoardPage from "../BoardPage";
import { useViewportMode } from "../../hooks/useViewportMode";
import type { Card } from "../../lib/api";

const storeRef: { cards: Card[] } = { cards: [] };

vi.mock("../../hooks/useViewportMode", () => ({
  useViewportMode: vi.fn()
}));

vi.mock("../../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../../lib/api")>("../../lib/api");
  return {
    ...actual,
    listCards: vi.fn(async () => ({
      items: storeRef.cards,
      total: storeRef.cards.length,
      page: 1,
      size: 100
    })),
    createCard: vi.fn(async (payload: actual.CardInput) => {
      const card: actual.Card = {
        id: `c${Math.random().toString(36).slice(2, 8)}`,
        title: payload.title ?? null,
        description: payload.description,
        status: payload.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      storeRef.cards = [card, ...storeRef.cards];
      return card;
    }),
    updateCard: vi.fn(async (id: string, payload: Partial<actual.CardInput>) => {
      storeRef.cards = storeRef.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              ...payload,
              title: payload.title ?? card.title,
              description: payload.description ?? card.description,
              status: payload.status ?? card.status,
              updated_at: new Date().toISOString()
            }
          : card
      );
      const updated = storeRef.cards.find((card) => card.id === id);
      if (!updated) {
        throw new Error("Card not found");
      }
      return updated;
    }),
    removeCard: vi.fn(async (id: string) => {
      storeRef.cards = storeRef.cards.filter((card) => card.id !== id);
    })
  };
});

const mockViewportMode = useViewportMode as unknown as Mock<[], "mobile" | "tablet" | "desktop">;

function setViewport(mode: "mobile" | "tablet" | "desktop") {
  mockViewportMode.mockReturnValue(mode);
}

function renderBoard() {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BoardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  storeRef.cards = [
    {
      id: "card-1",
      title: "Sprint kickoff",
      description: "Plan sprint goals",
      status: "todo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "card-2",
      title: "Connect API",
      description: "Wire up HTTP client",
      status: "doing",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
});

it("renders mobile tabs for the board", async () => {
  setViewport("mobile");
  renderBoard();
  await screen.findByText("Sprint kickoff");
  expect(screen.getByRole("tab", { name: "Todo" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Doing" })).toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Done" })).toBeInTheDocument();
});

it("creates a new card from the form", async () => {
  setViewport("desktop");
  const user = userEvent.setup();
  renderBoard();
  await screen.findByText("Sprint kickoff");
  await user.click(screen.getByRole("button", { name: "New card" }));
  await user.type(screen.getByLabelText("Title"), "QA checklist");
  await user.type(screen.getByLabelText("Description"), "Add regression cases");
  await user.click(screen.getByRole("button", { name: "Create" }));
  await waitFor(() => expect(screen.getByText("QA checklist")).toBeInTheDocument());
  expect(screen.getByText("Add regression cases")).toBeInTheDocument();
});

it("edits and deletes a card", async () => {
  setViewport("desktop");
  const user = userEvent.setup();
  renderBoard();
  await screen.findByText("Sprint kickoff");
  await user.click(screen.getAllByLabelText("Card actions")[0]);
  await user.click(screen.getByText("Edit"));
  await user.clear(screen.getByLabelText("Description"));
  await user.type(screen.getByLabelText("Description"), "Plan sprint backlog");
  await user.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(screen.getByText("Plan sprint backlog")).toBeInTheDocument());
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  const actionButtons = await screen.findAllByLabelText("Card actions");
  fireEvent.click(actionButtons[0]);
  await user.click(screen.getByText("Delete"));
  await waitFor(() => expect(screen.queryByText("Plan sprint backlog")).not.toBeInTheDocument());
});

it("moves a card between columns with keyboard drag and drop", async () => {
  setViewport("desktop");
  storeRef.cards = [
    {
      id: "card-1",
      title: "Write docs",
      description: "Draft API guide",
      status: "todo",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const user = userEvent.setup();
  renderBoard();
  await screen.findByText("Write docs");
  const handle = screen.getByLabelText("Drag card");
  handle.focus();
  await user.keyboard(" ");
  await user.keyboard("{ArrowRight}");
  await user.keyboard(" ");
  await waitFor(() => {
    const doingColumn = screen.getByTestId("column-doing");
    expect(within(doingColumn).getByText("Write docs")).toBeInTheDocument();
  });
});
