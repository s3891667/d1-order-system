"use client";

import { useEffect, useState } from "react";
import type { UniformRequestRecord } from "@/components/UniformRequest/types";

export function useUniformRequests() {
  const [requests, setRequests] = useState<UniformRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch("/api/uniform/requests");
        if (!res.ok) throw new Error("Failed to fetch request list.");
        const data = (await res.json()) as UniformRequestRecord[];
        if (isMounted) setRequests(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Unable to load requests.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadRequests();
    return () => { isMounted = false; };
  }, []);

  const handleStatusChanged = (id: number, newStatus: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
  };

  return { requests, setRequests, isLoading, error, handleStatusChanged };
}
