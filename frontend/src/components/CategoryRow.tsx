"use client";

import {
  Building2,
  Droplets,
  Eye,
  Flame,
  Gem,
  Mountain,
  Tent,
  TreePine,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { clsx } from "clsx";
import { useRef } from "react";
import type { Category } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  waves: Waves,
  mountain: Mountain,
  tent: Tent,
  droplets: Droplets,
  trees: Trees,
  eye: Eye,
  gem: Gem,
  building: Building2,
  "tree-pine": TreePine,
  flame: Flame,
};

export function CategoryRow({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string | undefined;
  onSelect: (key: string | undefined) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  return (
    <div ref={track} className="scrollbar-none flex min-w-0 flex-1 gap-8 overflow-x-auto md:gap-10" role="tablist" aria-label="Categories">
      {categories.map((c) => {
        const Icon = ICONS[c.icon_key] ?? Trees;
        const active = selected === c.key;
        return (
          <button
            key={c.key}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(active ? undefined : c.key)}
            className={clsx(
              "flex shrink-0 flex-col items-center gap-2 border-b-2 pb-3 pt-2 text-xs font-medium transition-colors duration-200 ease-airy",
              active ? "border-ink text-ink" : "border-transparent text-ink-secondary hover:border-line hover:text-ink",
            )}
          >
            <Icon size={24} strokeWidth={active ? 2 : 1.5} />
            <span className="whitespace-nowrap">{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
