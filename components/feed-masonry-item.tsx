"use client"

import { useRef, useLayoutEffect, useEffect, useState, useCallback } from "react"
import { SetMasonryItem } from "@/components/set-masonry-item"
import { cn } from "@/lib/utils"
import type { DjSet } from "@/lib/types"

function useGridSpan(
  itemRef: React.RefObject<HTMLDivElement | null>,
  gridRef: React.RefObject<HTMLDivElement | null>
) {
  const [span, setSpan] = useState(1)

  const recalc = useCallback(() => {
    const item = itemRef.current
    const grid = gridRef.current
    if (!item || !grid) return

    const styles = window.getComputedStyle(grid)
    const rowGap = parseFloat(styles.getPropertyValue("row-gap")) || 0
    const autoRows = parseFloat(styles.getPropertyValue("grid-auto-rows")) || 1

    const height = item.getBoundingClientRect().height
    const computed = Math.ceil((height + rowGap) / (autoRows + rowGap))
    setSpan(computed > 0 ? computed : 1)
  }, [itemRef, gridRef])

  useLayoutEffect(() => {
    recalc()

    const ro = new ResizeObserver(() => recalc())
    const node = itemRef.current
    if (node) ro.observe(node)

    return () => ro.disconnect()
  }, [recalc, itemRef])

  // Esperar a que carguen las imágenes
  useEffect(() => {
    const imgs = itemRef.current?.querySelectorAll("img") ?? []
    imgs.forEach(img => {
      if (!img.complete) {
        img.onload = () => recalc()
      }
    })
  }, [recalc])

  // Recalcular tras el render
  useEffect(() => {
    const id = requestAnimationFrame(recalc)
    return () => cancelAnimationFrame(id)
  }, [recalc])

  return span
}

export function MasonryItemWrapper({
  set,
  gridRef,
}: {
  set: DjSet
  gridRef: React.RefObject<HTMLDivElement | null>
}) {
  const itemRef = useRef<HTMLDivElement | null>(null)
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
