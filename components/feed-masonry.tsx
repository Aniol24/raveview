"use client"

import { useRef } from "react"
import type { DjSet } from "@/lib/types"
import { MasonryItemWrapper } from "./feed-masonry-item"

export function FeedMasonry({ sets }: { sets: DjSet[] }) {
  const gridRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={gridRef}
      className="
        grid items-start content-start  
        gap-4
        grid-cols-1 sm:grid-cols-2 md:grid-cols-3
        lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-4
        auto-rows-[6px]
      "
    >
      {sets.map((s, i) => (
        <MasonryItemWrapper
          key={`${s.id ?? s.url ?? "item"}::${i}`}
          set={s}
          gridRef={gridRef}
        />
      ))}
    </div>
  )
}
