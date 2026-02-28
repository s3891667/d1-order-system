"use client";

import { useRouter } from "next/navigation";
import type { UniformRequestFormValues } from "@/components/UniformRequest/types";

const REORDER_STORAGE_KEY = "uniformReorderValues";

export function useReorderNavigation() {
  const router = useRouter();

  const navigateToReorder = (values: Partial<UniformRequestFormValues>) => {
    try {
      sessionStorage.setItem(REORDER_STORAGE_KEY, JSON.stringify(values));
    } finally {
      router.push("/dashboard/create-request");
    }
  };

  return { navigateToReorder };
}
