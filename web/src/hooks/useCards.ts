import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Card,
  CardInput,
  PaginatedCards,
  createCard,
  listCards,
  removeCard,
  updateCard
} from "../lib/api";

const QUERY_KEY = ["cards"] as const;

interface UpdatePayload {
  id: string;
  input: Partial<CardInput>;
}

export function useCards() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listCards({ page: 1, size: 100 })
  });

  const create = useMutation({
    mutationFn: (input: CardInput) => createCard(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedCards>(QUERY_KEY);
      const optimistic: Card = {
        id: `temp-${Date.now()}`,
        title: input.title ?? null,
        description: input.description,
        status: input.status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      queryClient.setQueryData<PaginatedCards>(QUERY_KEY, (current) => {
        const base = current ?? { items: [], total: 0, page: 1, size: 100 };
        return {
          ...base,
          items: [optimistic, ...base.items],
          total: base.total + 1
        };
      });
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data, _input, context) => {
      if (!context) {
        return;
      }
      queryClient.setQueryData<PaginatedCards>(QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          items: current.items.map((item) => (item.id === context.optimisticId ? data : item))
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const update = useMutation({
    mutationFn: ({ id, input }: UpdatePayload) => updateCard(id, input),
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedCards>(QUERY_KEY);
      queryClient.setQueryData<PaginatedCards>(QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          items: current.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  title: input.title ?? item.title,
                  updated_at: new Date().toISOString()
                }
              : item
          )
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<PaginatedCards>(QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          items: current.items.map((item) => (item.id === data.id ? data : item))
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeCard(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<PaginatedCards>(QUERY_KEY);
      queryClient.setQueryData<PaginatedCards>(QUERY_KEY, (current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          items: current.items.filter((item) => item.id !== id),
          total: current.total - 1
        };
      });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }
  });

  return {
    query,
    create,
    update,
    remove
  };
}
