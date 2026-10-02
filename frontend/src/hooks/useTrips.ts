"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tripsService, TripsQuery } from "@/services/trips.service";
import { Trip } from "@/types/models";
import { useToast } from "@/store/uiStore";

const tripKeys = {
  all: ["trips"] as const,
  list: (query: TripsQuery) => [...tripKeys.all, "list", query] as const,
  detail: (tripId: string) => [...tripKeys.all, "detail", tripId] as const,
  stats: () => [...tripKeys.all, "stats"] as const,
};

export function useTrips(query: TripsQuery = {}) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const tripsQuery = useQuery({
    queryKey: tripKeys.list(query),
    queryFn: () => tripsService.getAll(query),
  });
  const statsQuery = useQuery({
    queryKey: tripKeys.stats(),
    queryFn: tripsService.getStats,
  });
  const deleteMutation = useMutation({
    mutationFn: tripsService.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
      toast.success("Trip deleted");
    },
    onError: () => toast.error("Failed to delete trip"),
  });

  const refetch = async () => {
    await Promise.all([tripsQuery.refetch(), statsQuery.refetch()]);
  };

  return {
    trips: tripsQuery.data?.trips ?? [],
    stats: statsQuery.data ?? null,
    isLoading: tripsQuery.isLoading || statsQuery.isLoading,
    // Network failures must never masquerade as an empty trip library.
    isError: tripsQuery.isError || statsQuery.isError,
    isDeleting: deleteMutation.isPending
      ? (deleteMutation.variables ?? null)
      : null,
    total: tripsQuery.data?.total ?? 0,
    pages: tripsQuery.data?.pages ?? 1,
    refetch,
    deleteTrip: deleteMutation.mutateAsync,
  };
}

export function useTrip(tripId: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const tripQuery = useQuery({
    queryKey: tripKeys.detail(tripId),
    queryFn: () => tripsService.getById(tripId),
    enabled: Boolean(tripId),
    // Back off for long jobs, and stop polling when settled or when the tab is hidden.
    refetchInterval: (query) => {
      const status = query.state.data?.generationStatus;
      if (status === "queued") return 8000;
      if (status === "generating")
        return query.state.dataUpdateCount < 10 ? 3000 : 8000;
      return false;
    },
  });
  const generateMutation = useMutation({
    mutationFn: () => tripsService.generateItinerary(tripId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: tripKeys.detail(tripId),
      });
      await queryClient.invalidateQueries({ queryKey: tripKeys.all });
      toast.success("Generation queued", "Your trip plan is being created");
    },
    onError: () => toast.error("Generation failed", "Please try again"),
  });

  const updateTrip = (updated: Trip) => {
    queryClient.setQueryData(tripKeys.detail(tripId), updated);
    void queryClient.invalidateQueries({ queryKey: tripKeys.all });
  };

  // The mutation only wraps the enqueue call itself (near-instant); the real "is AI
  // still working" signal is the trip's own generationStatus, which the poll above
  // keeps fresh.
  const isGenerating =
    generateMutation.isPending ||
    tripQuery.data?.generationStatus === "queued" ||
    tripQuery.data?.generationStatus === "generating";

  return {
    trip: tripQuery.data ?? null,
    isLoading: tripQuery.isLoading,
    isError: tripQuery.isError,
    isGenerating,
    refetch: tripQuery.refetch,
    generateItinerary: generateMutation.mutateAsync,
    updateTrip,
  };
}
