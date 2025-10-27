import { Status } from "./utils";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Card {
  id: string;
  title: string | null;
  description: string;
  status: Status;
  created_at: string;
  updated_at: string;
}

export interface PaginatedCards {
  items: Card[];
  total: number;
  page: number;
  size: number;
}

export interface CardInput {
  title?: string | null;
  description: string;
  status: Status;
}

function toJson(response: Response) {
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function listCards(params: { status?: Status; page?: number; size?: number } = {}) {
  const search = new URLSearchParams();
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.page) {
    search.set("page", String(params.page));
  }
  if (params.size) {
    search.set("size", String(params.size));
  }
  const url = `${API_URL}/cards${search.toString() ? `?${search}` : ""}`;
  const response = await fetch(url);
  return (await toJson(response)) as PaginatedCards;
}

export async function createCard(payload: CardInput) {
  const response = await fetch(`${API_URL}/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return (await toJson(response)) as Card;
}

export async function updateCard(id: string, payload: Partial<CardInput>) {
  const response = await fetch(`${API_URL}/cards/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return (await toJson(response)) as Card;
}

export async function removeCard(id: string) {
  const response = await fetch(`${API_URL}/cards/${id}`, {
    method: "DELETE"
  });
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
}
