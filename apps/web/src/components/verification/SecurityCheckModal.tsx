"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(onLoad: () => void) {
  if (window.turnstile) {
    onLoad();
    return;
  }
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
  if (existing) {
    existing.addEventListener("load", onLoad, { once: true });
    return;
  }
  const script = document.createElement("script");
  script.src = TURNSTILE_SRC;
  script.async = true;
  script.addEventListener("load", onLoad, { once: true });
  document.head.appendChild(script);
}

/**
 * The "quick security check" popup shown when the investor clicks
 * Submit Verification: renders a Cloudflare Turnstile widget (managed
 * mode — most humans pass automatically in ~1s with nothing to click)
 * and hands the resulting token up so the submission can proceed. The
 * widget retries on its own after failures/expiry, so nobody is
 * dead-ended; Cancel backs out without submitting.
 */
export function SecurityCheckModal({
  siteKey,
  submitting,
  onToken,
  onCancel,
}: {
  siteKey: string;
  submitting: boolean;
  onToken: (token: string) => void;
  onCancel: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Latest-callback refs so the render effect runs exactly once per open.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadTurnstileScript(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => onTokenRef.current(token),
        // Turnstile shows its own retry UI inside the widget; this only
        // fires for unrecoverable errors (bad site key, blocked network).
        "error-callback": () => setLoadFailed(true),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
  }, [siteKey]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [submitting, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/55 p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-check-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="w-full max-w-md border border-hairline bg-card p-8 shadow-2xl">
        <h3 id="security-check-title" className="font-serif text-xl font-bold text-ink">
          Quick security check
        </h3>
        <p className="mt-2 text-sm text-ink-secondary">
          Confirming you&rsquo;re human before we submit your verification. This usually takes a
          second and needs nothing from you.
        </p>
        <div ref={containerRef} className="mt-5 min-h-[65px]" />
        {loadFailed && (
          <p className="mt-2 text-sm text-brand-red">
            The security check couldn&rsquo;t load. Please refresh the page and try again.
          </p>
        )}
        <div className="mt-5 flex items-center justify-between">
          <span className="min-h-[1em] text-xs text-ink-secondary" role="status">
            {submitting ? "Submitting your verification…" : ""}
          </span>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-xs font-semibold uppercase tracking-wide text-navy-950 hover:underline disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
