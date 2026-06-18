import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiDelete, apiGet, apiPost } from "./api-client";
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
    queryFn: () => apiGet<FavoritesResponse>("/api/favorites/my"),
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
      return isFavorite
        ? apiDelete<FavoritesResponse>(`/api/favorites/${templateId}`)
        : apiPost<FavoritesResponse>(`/api/favorites/${templateId}`);
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
