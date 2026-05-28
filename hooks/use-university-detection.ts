"use client";

import { useEffect, useMemo, useState } from "react";

import {
  extractEmailDomain,
  formatUniversityName,
  isEduDomain,
  isTestEmail,
  normalizeUniversityEmail
} from "@/lib/university";

type UniversityDetectionResult =
  | {
      visible: false;
      loading: false;
    }
  | {
      visible: true;
      loading: boolean;
      found: boolean;
      name: string;
    };

const hiddenResult: UniversityDetectionResult = {
  visible: false,
  loading: false
};

export function useUniversityDetection(email: string): UniversityDetectionResult {
  const [result, setResult] = useState<UniversityDetectionResult>(hiddenResult);
  const normalizedEmail = useMemo(() => normalizeUniversityEmail(email), [email]);
  const domain = useMemo(() => extractEmailDomain(normalizedEmail), [normalizedEmail]);
  const hasLocalPart = normalizedEmail.includes("@") && normalizedEmail.split("@")[0].length > 0;

  useEffect(() => {
    if (!normalizedEmail || !hasLocalPart) {
      setResult(hiddenResult);
      return undefined;
    }

    if (isTestEmail(normalizedEmail)) {
      setResult({
        visible: true,
        loading: false,
        found: true,
        name: "Clark University"
      });
      return undefined;
    }

    if (!domain || !isEduDomain(domain)) {
      setResult(hiddenResult);
      return undefined;
    }

    const abortController = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({
        visible: true,
        loading: true,
        found: false,
        name: formatUniversityName(domain)
      });

      try {
        const response = await fetch(`/api/universities/detect?domain=${encodeURIComponent(domain)}`, {
          method: "GET",
          cache: "no-store",
          signal: abortController.signal
        });
        const payload = (await response.json()) as {
          success?: boolean;
          data?: {
            found: boolean;
            name: string;
          };
        };

        if (!response.ok || !payload.success || !payload.data) {
          setResult(hiddenResult);
          return;
        }

        setResult({
          visible: true,
          loading: false,
          found: payload.data.found,
          name: payload.data.name
        });
      } catch (error) {
        if (abortController.signal.aborted) {
          return;
        }

        setResult(hiddenResult);
      }
    }, 500);

    return () => {
      abortController.abort();
      window.clearTimeout(timer);
    };
  }, [domain, hasLocalPart, normalizedEmail]);

  return result;
}
