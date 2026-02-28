"use client";

import { useEffect, useState } from "react";
import UniformRequestForm from "@/components/UniformRequest/UniformRequestForm";
import type { UniformRequestFormValues } from "@/components/UniformRequest/types";

const REORDER_STORAGE_KEY = "uniformReorderValues";

function getStoredReorderValues(): Partial<UniformRequestFormValues> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem(REORDER_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<UniformRequestFormValues>;
    sessionStorage.removeItem(REORDER_STORAGE_KEY);
    return parsed;
  } catch {
    return undefined;
  }
}

export default function CreateRequestPage() {
  const [initialValues, setInitialValues] = useState<Partial<UniformRequestFormValues> | undefined>(undefined);

  useEffect(() => {
    const stored = getStoredReorderValues();
    if (Object.keys(stored ?? {}).length > 0) {
      setInitialValues(stored);
    }
  }, []);

  return <UniformRequestForm initialValues={initialValues} />;
}
