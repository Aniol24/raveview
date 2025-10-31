export type Platform = "youtube" | "soundcloud"

export function getPlatformFromUrl(url: string): Platform {
  const u = url.toLowerCase()
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube"
  return "soundcloud"
}

export function formatDuration(sec?: number) {
  if (!sec && sec !== 0) return undefined
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`
}

export function niceMonth(iso?: string) {
  if (!iso) return undefined
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}

export function getYouTubeId(url: string): string | undefined {
  try {
    const u = new URL(url)
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || undefined
    if (u.searchParams.get("v")) return u.searchParams.get("v") || undefined
    const parts = u.pathname.split("/")
    const maybeId = parts.pop() || parts.pop()
    if (maybeId && maybeId.length >= 10) return maybeId
  } catch { /* ignore */ }
  return undefined
}

export function getThumbnailUrl(args: {
  platform: Platform
  url: string
  thumbnailUrl?: string
}): string | undefined {
  const { platform, url, thumbnailUrl } = args
  if (thumbnailUrl) return thumbnailUrl

  if (platform === "youtube") {
    const id = getYouTubeId(url)
    if (id) {
      return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    }
  }

  return undefined
}
