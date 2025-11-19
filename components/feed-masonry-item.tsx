"use client"

import { useRef, useLayoutEffect, useEffect, useState } from "react"
import { SetMasonryItem } from "@/components/set-masonry-item"
import { cn } from "@/lib/utils"
import type { DjSet } from "@/lib/types"

function useGridSpan(
  itemRef: React.RefObject<HTMLDivElement | null>,
  gridRef: React.RefObject<HTMLDivElement | null>
) {
  const [span, setSpan] = useState(1)

  const recalc = () => {
    const item = itemRef.current
    const grid = gridRef.current
    if (!item || !grid) return

    const styles = window.getComputedStyle(grid)
    const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0
    const autoRows = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 1

    const height = item.getBoundingClientRect().height
    const computed = Math.ceil((height + rowGap) / (autoRows + rowGap))

    setSpan(computed > 0 ? computed : 1)
  }

  useLayoutEffect(() => {
    recalc()
    const ro = new ResizeObserver(recalc)
    if (itemRef.current) ro.observe(itemRef.current)

    return () => ro.disconnect()
  }, [])

  // recalc after images inside finish loading
  useEffect(() => {
    const imgs = itemRef.current?.querySelectorAll("img") ?? []
    imgs.forEach(img => {
      if (!img.complete) {
        img.onload = () => recalc()
      }
    })
  }, [])

  // recalc again after render stabilizes
  useEffect(() => {
    setTimeout(recalc, 0)
  })

  return span
}

export function MasonryItemWrapper({ set, gridRef }: { set: DjSet, gridRef: React.RefObject<HTMLDivElement> }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const span = useGridSpan(itemRef, gridRef)

  return (
    <div
      ref={itemRef}
      style={{ gridRowEnd: `span ${span}` }}
      className={cn(
        "transition-all",
        set.platform === "youtube" ? "xl:col-span-1" : "col-span-1"
      )}
    >
      <SetMasonryItem {...set} />
    </div>
  )
}
