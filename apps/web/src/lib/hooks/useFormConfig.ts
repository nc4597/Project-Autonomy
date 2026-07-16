"use client";

import { useEffect, useState } from "react";
import { getFormConfig } from "../api/verificationClient";
import {
  buildFallbackFormConfig,
  type VerificationFormConfig,
} from "../verification/formConfig";

let cachedConfig: VerificationFormConfig | null = null;

/**
 * The admin-published form configuration. Renders the built-in fallback
 * (identical to the seeded default) immediately, then swaps in the
 * published config once fetched — a failed fetch must never block the
 * verification wizard.
 */
export function useFormConfig(): VerificationFormConfig {
  const [config, setConfig] = useState<VerificationFormConfig>(
    () => cachedConfig ?? buildFallbackFormConfig()
  );

  useEffect(() => {
    if (cachedConfig) return;
    let cancelled = false;
    getFormConfig()
      .then((fetched) => {
        cachedConfig = fetched;
        if (!cancelled) setConfig(fetched);
      })
      .catch(() => {
        // Keep the fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
