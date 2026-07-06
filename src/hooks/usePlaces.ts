import { useQuery } from "@tanstack/react-query";
import type { Place } from "@/types";

export function usePlaces() {
  const backendUrl = import.meta.env.VITE_API_URL;
  return useQuery<Place[]>({
    queryKey: ["places"],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/api/places`);
      if (!res.ok) {
        throw new Error("Failed to load live places data");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
}
