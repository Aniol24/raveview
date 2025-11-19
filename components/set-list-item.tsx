"use client"

import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import type { DjSet } from "@/lib/types"
import { PlatformBadge } from "@/components/platform-badge"
import { formatDuration, niceMonth, getThumbnailUrl } from "@/lib/platform"

export function SetListItem(props: DjSet) {
  const {
    id,
    title,
    artist,
    platform,
    url,
    durationSec,
    uploadedAt,
    rating,
    reviewCount,
    thumbnailUrl,
  } = props

  const thumb = getThumbnailUrl({ platform, url, thumbnailUrl })
  const aspect = platform === "youtube" ? "16 / 9" : "1 / 1"

  return (
    <article className="flex items-center gap-4 rounded-xl border p-4 hover:bg-muted/40 transition">
      {/* Thumbnail */}
      <div
        className="relative w-40 shrink-0 overflow-hidden rounded-lg border bg-muted"
        style={{ aspectRatio: aspect }}
      >
        {thumb ? (
          <Image
            src={thumb}
            alt={`${title} – ${artist}`}
            fill
            className="object-cover"
            sizes="160px"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {platform === "youtube" ? (
              <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M23.5 6.2a4 4 0 0 0-2.8-2.8C18.9 3 12 3 12 3s-6.9 0-8.7.4A4 4 0 0 0 .5 6.2 41 41 0 0 0 0 12a41 41 0 0 0 .5 5.8 4 4 0 0 0 2.8 2.8C5.1 21 12 21 12 21s6.9 0 8.7-.4a4 4 0 0 0 2.8-2.8A41 41 0 0 0 24 12a41 41 0 0 0-.5-5.8ZM9.75 15.5v-7l6 3.5Z"
                />
              </svg>
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M17.5 10a4.5 4.5 0 0 0-8.9-1.4V18H19a3 3 0 0 0 0-6h-1.5zM2 10.5H4V18H2zm2.5-1H6V18H4.5zm2-.7H8V18H6.5zm2-.6H10V18H8.5z"
                />
              </svg>
            )}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-semibold">
          <Link href={`/set/${id}`} className="hover:underline">
            {title}
          </Link>
        </h3>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{artist}</p>

        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {/* Badge + duración juntos */}
          <span className="inline-flex items-center gap-2">
            <PlatformBadge platform={platform} />
            {durationSec ? <span>{formatDuration(durationSec)}</span> : null}
          </span>

          {uploadedAt ? <span>· {niceMonth(uploadedAt)}</span> : null}

          {typeof rating === "number" ? (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3" /> {rating.toFixed(1)}
              {reviewCount ? ` (${reviewCount})` : ""}
            </span>
          ) : null}
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-lg border px-3 py-1 text-sm hover:bg-accent"
      >
        Reproducir
      </a>
    </article>
  )
}
