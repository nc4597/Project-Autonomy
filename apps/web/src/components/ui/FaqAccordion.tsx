"use client";

import { useState } from "react";
import type { FaqItem } from "@/lib/marketplace/types";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-hairline border-t border-b border-hairline">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-serif text-lg text-ink">
                {item.question}
              </span>
              <span
                className={`shrink-0 text-xl text-brand-red transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {isOpen && (
              <p className="max-w-3xl pb-6 text-sm leading-relaxed text-ink-secondary">
                {item.answer}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
