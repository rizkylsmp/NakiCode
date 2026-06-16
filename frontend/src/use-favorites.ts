import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "./auth-context";

type FavoritesResponse = {
  templateIds: number[];
};

export function useFavoriteTemplates() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["favorites", token],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch("/api/favorites/my", {
        headers: createAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error("Gagal mengambil wishlist");
      }

      return (await response.json()) as FavoritesResponse;
    },
  });
  const favoriteIds = useMemo(
    () => new Set(query.data?.templateIds ?? []),
    [query.data?.templateIds],
  );
  const mutation = useMutation({
    mutationFn: async ({
      templateId,
      isFavorite,
    }: {
      templateId: number;
      isFavorite: boolean;
    }) => {
      const response = await fetch(`/api/favorites/${templateId}`, {
        method: isFavorite ? "DELETE" : "POST",
        headers: createAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error("Gagal mengubah wishlist");
      }

      return (await response.json()) as FavoritesResponse;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["favorites", token], data);
    },
  });

  return {
    favoriteIds,
    isFavoriteLoading: query.isFetching || mutation.isPending,
    toggleFavorite: (templateId: number) =>
      mutation.mutate({
        templateId,
        isFavorite: favoriteIds.has(templateId),
      }),
  };
}

function createAuthHeaders(token: string | null) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}
