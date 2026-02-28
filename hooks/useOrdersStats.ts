"use client";

import { useEffect, useState } from "react";

type OrderStats = {
  total: number | null;
  completed: number | null;
  inDispatch: number | null;
  pendingApprovals: number | null;
};

export function useOrdersStats(): OrderStats {
  const [total, setTotal] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number | null>(null);
  const [inDispatch, setInDispatch] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/uniform/requests");
        const data = await res.json();
        setTotal(data.length);
        setCompleted(data.filter((o: { status: string }) => o.status === "COLLECTED").length);
        setInDispatch(data.filter((o: { status: string }) => o.status === "DISPATCHED").length);
        setPendingApprovals(data.filter((o: { status: string }) => o.status === "REQUEST").length);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
  }, []);

  return { total, completed, inDispatch, pendingApprovals };
}
