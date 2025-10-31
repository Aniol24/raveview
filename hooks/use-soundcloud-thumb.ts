"use client"

import { useEffect, useState } from "react"

export function useSoundCloudThumb(soundcloudUrl?: string) {
  const [thumb, setThumb] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!soundcloudUrl) {
        setThumb(undefined)
        return
      }
      setLoading(true)
      try {
        const res = await fetch(`/api/soundcloud/thumbnail?url=${encodeURIComponent(soundcloudUrl)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) setThumb(json?.thumbnail_url ?? undefined)
      } catch {
        if (!cancelled) setThumb(undefined)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [soundcloudUrl])

  return { thumb, loading }
}
