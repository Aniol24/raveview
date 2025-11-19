"use client"

import { useRef, useLayoutEffect, useState } from "react"
import type { DjSet } from "@/lib/types"
import { SetMasonryItem } from "@/components/set-masonry-item"
import { cn } from "@/lib/utils"

function useGridSpan(itemRef: React.RefObject<HTMLDivElement | null>, gridRef: React.RefObject<HTMLDivElement | null>) {
  const [span, setSpan] = useState(1)

  useLayoutEffect(() => {
    const itemEl = itemRef.current
    const gridEl = gridRef.current
    if (!itemEl || !gridEl || typeof window === "undefined") return

    const calc = () => {
      const styles = window.getComputedStyle(gridEl)
      const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0
      const autoRows = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 1

      const height = itemEl.getBoundingClientRect().height
      const computed = Math.ceil((height + rowGap) / (autoRows + rowGap))
      setSpan(computed > 0 ? computed : 1)
    }

    const ro = new ResizeObserver(() => calc())
    ro.observe(itemEl)

    requestAnimationFrame(calc)

    return () => ro.disconnect()
  }, [itemRef, gridRef])

  return span
}

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
      {sets.map((s, i) => {
        const itemRef = useRef<HTMLDivElement>(null)
        const span = useGridSpan(itemRef, gridRef)

        const key = `${s.id ?? s.url ?? "item"}::${i}`

        return (
          <div
            key={key}
            ref={itemRef}
            style={{ gridRowEnd: `span ${span}` }}
            className={cn(
              s.platform === "youtube" ? "xl:col-span-1" : "col-span-1"
            )}
          >
            <SetMasonryItem {...s} />
          </div>
        )
      })}
    </div>
  )
}
